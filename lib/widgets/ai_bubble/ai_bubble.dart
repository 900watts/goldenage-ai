// =====================================================================
// GoldenAge AI — AI Bubble (the persistent floating shortcut)
// =====================================================================
// Per spec: "Implement a persistent, floating shortcut bubble that
// sits on top of all application screens (similar to assistive touch).
// Tapping it activates immediate voice-to-text or text input."
//
// Implementation: a [Stack] overlay at the app root, with a
// draggable circular [AiBubbleButton] in the bottom-right. Tapping
// opens a senior-friendly chat sheet with a large text field, mic
// button, and clearly-labeled quick actions.
// =====================================================================

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import '../../ai/llm_service.dart';
import '../../ai/voice_service.dart';
import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../big_button.dart';
import '../labeled_icon_card.dart';

class AiBubbleOverlay extends StatefulWidget {
  const AiBubbleOverlay({super.key, required this.child});
  final Widget child;
  @override
  State<AiBubbleOverlay> createState() => _AiBubbleOverlayState();
}

class _AiBubbleOverlayState extends State<AiBubbleOverlay> {
  bool _open = false;

  void _toggle() {
    HapticFeedback.lightImpact();
    setState(() => _open = !_open);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        // Bottom-right floating bubble
        Positioned(
          right: 18,
          bottom: 18,
          child: SafeArea(
            child: _AiBubbleButton(onTap: _toggle, active: _open),
          ),
        ),
        if (_open)
          _AiBubbleSheet(
            onClose: () => setState(() => _open = false),
          ),
      ],
    );
  }
}

class _AiBubbleButton extends StatelessWidget {
  const _AiBubbleButton({required this.onTap, required this.active});
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '智能助手',
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: active
                  ? [AppColors.primary, AppColors.primaryDark]
                  : [AppColors.cta, AppColors.ctaDark],
            ),
            boxShadow: [
              BoxShadow(
                color: (active ? AppColors.primary : AppColors.cta)
                    .withValues(alpha: 0.4),
                blurRadius: 16,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Icon(
            active ? Icons.close : Icons.support_agent,
            color: Colors.white,
            size: 30,
          ),
        ),
      ),
    );
  }
}

// =====================================================================
// AI Chat sheet
// =====================================================================
class _AiBubbleSheet extends StatefulWidget {
  const _AiBubbleSheet({required this.onClose});
  final VoidCallback onClose;

  @override
  State<_AiBubbleSheet> createState() => _AiBubbleSheetState();
}

class _AiBubbleSheetState extends State<_AiBubbleSheet> {
  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _tts = FlutterTts();
  final List<_ChatLine> _lines = [];
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _lines.add(_ChatLine(
      role: _Role.assistant,
      text: '您好，我是您的智能伴侣小金。有什么可以帮您的吗？',
    ));
    // Initialise voice in the background.
    VoiceService.init();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    _tts.stop();
    super.dispose();
  }

  Future<void> _speak(String text) async {
    try {
      await _tts.setLanguage('zh-CN');
      await _tts.setSpeechRate(0.45);
      await _tts.speak(text);
    } catch (_) {/* TTS not available */}
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() {
      _lines.add(_ChatLine(role: _Role.user, text: text));
      _busy = true;
    });
    _ctrl.clear();
    _scrollToEnd();

    final result = await LlmService.sendUserTurn(text);
    if (!mounted) return;
    setState(() {
      _lines.add(_ChatLine(
        role: _Role.assistant,
        text: result.reply,
        toolsInvoked: result.toolInvocations
            .map((t) => '${t.name} → ${t.resultMessage}')
            .join('\n'),
      ));
      _busy = false;
    });
    _scrollToEnd();
    await _speak(result.reply);
  }

  Future<void> _toggleMic() async {
    if (VoiceService.listening) {
      await VoiceService.stop();
      // When mic stops, the partial text is already in the field.
      return;
    }
    await VoiceService.start(
      onResult: (text, {required finalResult}) {
        if (!mounted) return;
        setState(() {
          _ctrl.text = text;
          _ctrl.selection = TextSelection.collapsed(offset: text.length);
        });
        if (finalResult && text.trim().isNotEmpty) _send();
      },
      localeId: Localizations.localeOf(context).languageCode == 'zh'
          ? 'zh_CN'
          : 'en_US',
    );
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: SafeArea(
        child: Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: const BoxDecoration(
            color: AppColors.bgCream,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [
              BoxShadow(blurRadius: 20, color: Colors.black26),
            ],
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                  ),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: Colors.white24,
                      child: Icon(Icons.support_agent, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l.aiBubbleLabel,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700)),
                          Text('SOUL.md 启动中 · 已就绪',
                              style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.85),
                                  fontSize: 13)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      iconSize: 28,
                      onPressed: widget.onClose,
                    ),
                  ],
                ),
              ),
              // Chat list
              Expanded(
                child: ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.all(16),
                  itemCount: _lines.length,
                  itemBuilder: (_, i) => _ChatBubble(line: _lines[i]),
                ),
              ),
              // Quick actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    _quick('帮我打开地图', Icons.map_outlined),
                    const SizedBox(width: 8),
                    _quick('今日金价', Icons.monetization_on_outlined),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              // Input
              Container(
                color: Colors.white,
                padding: EdgeInsets.fromLTRB(
                    12, 10, 12, 10 + MediaQuery.of(context).padding.bottom),
                child: Row(
                  children: [
                    IconButton(
                      iconSize: 32,
                      icon: Icon(
                        VoiceService.listening
                            ? Icons.mic
                            : Icons.mic_none_outlined,
                        color: VoiceService.listening
                            ? AppColors.danger
                            : AppColors.primary,
                      ),
                      onPressed: _toggleMic,
                    ),
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        minLines: 1,
                        maxLines: 4,
                        style: const TextStyle(fontSize: 19),
                        decoration: const InputDecoration(
                          hintText: '说一说，或输入文字…',
                          isDense: true,
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 12, vertical: 12),
                        ),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    BigButton(
                      label: _busy ? '…' : '发送',
                      icon: Icons.send,
                      style: BigButtonStyle.primary,
                      expanded: false,
                      busy: _busy,
                      onPressed: _send,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _quick(String text, IconData icon) {
    return Expanded(
      child: LabeledIconCard(
        icon: icon,
        title: text,
        subtitle: '',
        gradient: AppGradients.teal,
        onTap: () {
          _ctrl.text = text;
          _send();
        },
      ),
    );
  }
}

enum _Role { user, assistant }

class _ChatLine {
  _ChatLine({
    required this.role,
    required this.text,
    this.toolsInvoked,
  });
  final _Role role;
  final String text;
  final String? toolsInvoked;
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.line});
  final _ChatLine line;

  @override
  Widget build(BuildContext context) {
    final isUser = line.role == _Role.user;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            const CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.primary,
              child: Icon(Icons.support_agent, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isUser ? AppColors.cta : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
                border: isUser ? null : Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    line.text,
                    style: TextStyle(
                      fontSize: 19,
                      height: 1.5,
                      color: isUser ? Colors.white : AppColors.text,
                    ),
                  ),
                  if (line.toolsInvoked != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      '🔧 ${line.toolsInvoked!}',
                      style: TextStyle(
                        fontSize: 13,
                        color: isUser
                            ? Colors.white70
                            : AppColors.muted,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 10),
            const CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.cta,
              child: Icon(Icons.person, color: Colors.white, size: 20),
            ),
          ],
        ],
      ),
    );
  }
}
