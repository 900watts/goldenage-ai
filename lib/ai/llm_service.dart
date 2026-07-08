// =====================================================================
// GoldenAge AI — LLM Service
// =====================================================================
// Wraps OpenAI (gpt-4o-mini) and Anthropic (claude-3-5-sonnet) behind a
// unified interface. The LLM is given a system prompt built from
// SOUL.md, plus the user's recent long-term memory retrieved via
// pgvector, plus a set of tool-calling definitions.
//
// Per spec, the AI has tool-calling access to:
//   - open_map / open_finance / open_news / open_medication / open_scam
//   - take_screenshot + read_text
//   - call_emergency_sos
//
// Phase 3 ships the LLM service, the SOUL.md reader, the tool
// definitions, and the bubble UI. Phase 4 wires it to real APIs.
// =====================================================================

import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

import '../core/constants.dart';
import 'soul_persona.dart';
import 'tools/ai_tools.dart';

class ChatMessage {
  const ChatMessage({
    required this.role,
    required this.content,
    this.toolCallId,
    this.toolName,
  });
  final String role; // 'system' | 'user' | 'assistant' | 'tool'
  final String content;
  final String? toolCallId;
  final String? toolName;

  Map<String, dynamic> toJson() => {
        'role': role,
        'content': content,
        if (toolCallId != null) 'tool_call_id': toolCallId,
        if (toolName != null) 'name': toolName,
      };
}

class ChatTurnResult {
  const ChatTurnResult({required this.reply, this.toolInvocations = const []});
  final String reply;
  final List<ToolInvocation> toolInvocations;
}

class LlmService {
  LlmService._();

  static const _openAiUrl = 'https://api.openai.com/v1/chat/completions';
  static const _anthropicUrl = 'https://api.anthropic.com/v1/messages';
  static const _embedUrl = 'https://api.openai.com/v1/embeddings';
  static const _embeddingModel = 'text-embedding-3-small';

  // In-memory conversation history (per session). The long-term
  // context is fetched from VectorMemoryService at the start of each
  // session and prepended to the system prompt.
  static final List<ChatMessage> _history = [];
  static const int _maxHistoryMessages = 20;

  static SoulPersona? _persona;
  static List<MemoryHit> _longTermMemory = const [];

  /// Bootstraps the persona + long-term memory. Call once after sign-in.
  static Future<void> initialize({
    String? preferredName,
    String? locale,
  }) async {
    _persona ??= await SoulPersona.load();
    // Long-term memory recall happens in the first turn (lazy) because
    // we need a query embedding, which we don't have yet at boot.
  }

  /// Inject a memory hit (from pgvector recall) into the system context.
  static void primeMemory(List<MemoryHit> hits) {
    _longTermMemory = hits;
  }

  /// Reset conversation history. Call when the user starts a new topic.
  static void reset() => _history.clear();

  /// Send a single turn of conversation. Returns the assistant's reply
  /// and any tool invocations the LLM requested.
  static Future<ChatTurnResult> sendUserTurn(String userText) async {
    if (_persona == null) {
      _persona = await SoulPersona.load();
    }
    _history.add(ChatMessage(role: 'user', content: userText));
    if (_history.length > _maxHistoryMessages) {
      _history.removeRange(0, _history.length - _maxHistoryMessages);
    }

    final provider = AppConstants.openaiProvider;
    if (provider == 'anthropic' &&
        AppConstants.anthropicApiKey.isNotEmpty) {
      return _sendAnthropicTurn();
    }
    return _sendOpenAiTurn();
  }

  // ------------------------------------------------------------------
  // OpenAI
  // ------------------------------------------------------------------
  static Future<ChatTurnResult> _sendOpenAiTurn() async {
    if (AppConstants.openaiApiKey.isEmpty) {
      return _offlineReply();
    }

    final messages = [
      ChatMessage(role: 'system', content: _systemPromptWithMemory()).toJson(),
      ..._history.map((m) => m.toJson()),
    ];

    final body = jsonEncode({
      'model': 'gpt-4o-mini',
      'messages': messages,
      'tools': AiToolSchemas.openAi,
      'tool_choice': 'auto',
      'temperature': 0.4,
    });

    final res = await http.post(
      Uri.parse(_openAiUrl),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ${AppConstants.openaiApiKey}',
      },
      body: body,
    );

    if (res.statusCode != 200) {
      return ChatTurnResult(reply: '抱歉，网络有点问题，请再说一次。(${res.statusCode})');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final choice = (data['choices'] as List).first as Map<String, dynamic>;
    final msg = choice['message'] as Map<String, dynamic>;
    final toolCalls = (msg['tool_calls'] as List?) ?? const [];

    final invocations = <ToolInvocation>[];
    for (final tc in toolCalls) {
      final fn = (tc as Map<String, dynamic>)['function'] as Map<String, dynamic>;
      final name = fn['name'] as String;
      Map<String, dynamic> args = const {};
      try {
        args = jsonDecode(fn['arguments'] as String) as Map<String, dynamic>;
      } catch (_) {/* ignore parse errors */}
      final inv = await AiToolRegistry.invoke(name, args);
      invocations.add(inv);
      // Feed tool result back so the LLM can finalize the reply.
      _history.add(ChatMessage(
        role: 'assistant',
        content: msg['content'] as String? ?? '',
      ));
      _history.add(ChatMessage(
        role: 'tool',
        content: inv.resultMessage,
        toolCallId: tc['id'] as String,
        toolName: name,
      ));
    }

    if (toolCalls.isNotEmpty) {
      // Re-call the LLM so it can speak after seeing tool results.
      return _sendOpenAiTurn();
    }

    final reply = (msg['content'] as String?)?.trim() ?? '';
    _history.add(ChatMessage(role: 'assistant', content: reply));
    return ChatTurnResult(reply: reply, toolInvocations: invocations);
  }

  // ------------------------------------------------------------------
  // Anthropic
  // ------------------------------------------------------------------
  static Future<ChatTurnResult> _sendAnthropicTurn() async {
    if (AppConstants.anthropicApiKey.isEmpty) {
      return _offlineReply();
    }
    final body = jsonEncode({
      'model': 'claude-3-5-sonnet-20241022',
      'max_tokens': 1024,
      'system': _systemPromptWithMemory(),
      'messages': _history.map((m) => m.toJson()).toList(),
      'tools': AiToolSchemas.anthropic,
    });
    final res = await http.post(
      Uri.parse(_anthropicUrl),
      headers: {
        'content-type': 'application/json',
        'x-api-key': AppConstants.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: body,
    );
    if (res.statusCode != 200) {
      return ChatTurnResult(reply: '抱歉，我这边有点问题，请再试一次。');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final blocks = data['content'] as List;
    final text = blocks
        .where((b) => b['type'] == 'text')
        .map((b) => b['text'] as String)
        .join('\n')
        .trim();
    _history.add(ChatMessage(role: 'assistant', content: text));
    return ChatTurnResult(reply: text);
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  static String _systemPromptWithMemory() {
    final buf = StringBuffer(_persona!.toSystemPrompt());
    if (_longTermMemory.isNotEmpty) {
      buf.writeln('\n## What I know about this user (from long-term memory)');
      for (final m in _longTermMemory) {
        buf.writeln('- [${m.category}] ${m.content}');
      }
    }
    return buf.toString();
  }

  static ChatTurnResult _offlineReply() {
    final reply = '我还在学习当中，请配置 OPENAI_API_KEY 让智能助手上线。';
    _history.add(ChatMessage(role: 'assistant', content: reply));
    return ChatTurnResult(reply: reply);
  }

  /// Generate a 1536-dim embedding for [text] using OpenAI's
  /// text-embedding-3-small. Returns `null` if no key is configured.
  static Future<List<double>?> embed(String text) async {
    if (AppConstants.openaiApiKey.isEmpty) return null;
    final res = await http.post(
      Uri.parse(_embedUrl),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ${AppConstants.openaiApiKey}',
      },
      body: jsonEncode({'input': text, 'model': _embeddingModel}),
    );
    if (res.statusCode != 200) return null;
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final emb = (data['data'] as List).first['embedding'] as List;
    return emb.map((e) => (e as num).toDouble()).toList();
  }
}
