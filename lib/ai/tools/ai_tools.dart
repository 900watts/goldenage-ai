// =====================================================================
// GoldenAge AI — Tool Registry
// =====================================================================
// The AI bubble can invoke app-level actions via tool-calling. Each
// tool is a function-call definition the LLM can emit; the registry
// invokes a Dart handler and returns a human-readable result message.
// =====================================================================

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/router_service.dart';
import '../../services/crisis_service.dart';
import '../../services/supabase_service.dart';

class ToolInvocation {
  const ToolInvocation({
    required this.name,
    required this.args,
    required this.resultMessage,
  });
  final String name;
  final Map<String, dynamic> args;
  final String resultMessage;
}

typedef ToolHandler = Future<String> Function(
    BuildContext context, Map<String, dynamic> args);

class _RegisteredTool {
  const _RegisteredTool(this.name, this.description, this.handler);
  final String name;
  final String description;
  final ToolHandler handler;
}

class AiToolRegistry {
  AiToolRegistry._();
  static final Map<String, _RegisteredTool> _tools = {};

  static void register(_RegisteredTool tool) {
    _tools[tool.name] = tool;
  }

  static Future<ToolInvocation> invoke(
      String name, Map<String, dynamic> args) async {
    final tool = _tools[name];
    if (tool == null) {
      return ToolInvocation(
        name: name,
        args: args,
        resultMessage: 'Unknown tool "$name".',
      );
    }
    final ctx = RouterService.navigatorKey.currentContext;
    String result;
    try {
      result = await tool.handler(ctx ?? _dummyContext, args);
    } catch (e) {
      result = 'Error: $e';
    }
    return ToolInvocation(name: name, args: args, resultMessage: result);
  }

  static final BuildContext _dummyContext = _DummyContext();
}

class _DummyContext implements BuildContext {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

// =====================================================================
// Tool definitions
// =====================================================================
class AiToolSchemas {
  AiToolSchemas._();

  /// OpenAI / OpenAI-compatible function-call schema.
  static List<Map<String, dynamic>> get openAi => _tools
      .map((t) => {
            'type': 'function',
            'function': {
              'name': t.name,
              'description': t.description,
              'parameters': {
                'type': 'object',
                'properties': const {},
                'required': <String>[],
              },
            },
          })
      .toList();

  /// Anthropic tool-use schema.
  static List<Map<String, dynamic>> get anthropic => _tools
      .map((t) => {
            'name': t.name,
            'description': t.description,
            'input_schema': {
              'type': 'object',
              'properties': const {},
              'required': <String>[],
            },
          })
      .toList();

  static List<_RegisteredTool> get _tools => _registry;
}

// The actual tool registry is initialized in ai_tools_bootstrap.dart
// to keep the dependency surface narrow.
final List<_RegisteredTool> _registry = [];

void _register(_RegisteredTool tool) {
  _registry.add(tool);
  AiToolRegistry.register(tool);
}

void _registerAll() {
  _register(_RegisteredTool(
    'open_map',
    'Navigate to the map screen. Use when the user asks about nearby places or directions.',
    (ctx, args) async {
      ctx.go('/map');
      return 'Map opened.';
    },
  ));
  _register(_RegisteredTool(
    'open_finance',
    'Navigate to the finance screen showing gold, silver, and indices.',
    (ctx, args) async {
      ctx.go('/finance');
      return 'Finance screen opened.';
    },
  ));
  _register(_RegisteredTool(
    'open_news',
    'Navigate to the daily news digest.',
    (ctx, args) async {
      ctx.push('/news');
      return 'News opened.';
    },
  ));
  _register(_RegisteredTool(
    'open_medication',
    'Navigate to the medication reminder screen.',
    (ctx, args) async {
      ctx.push('/medication');
      return 'Medication opened.';
    },
  ));
  _register(_RegisteredTool(
    'open_scam_shield',
    'Navigate to the anti-scam shield screen.',
    (ctx, args) async {
      ctx.push('/scam');
      return 'Anti-scam shield opened.';
    },
  ));
  _register(_RegisteredTool(
    'open_guardian',
    'Navigate to the guardian management screen.',
    (ctx, args) async {
      ctx.push('/guardian');
      return 'Guardian screen opened.';
    },
  ));
  _register(_RegisteredTool(
    'call_emergency_sos',
    'Raise an emergency SOS. Use ONLY when the user is in clear danger (mentioned fall, chest pain, being alone and afraid).',
    (ctx, args) async {
      if (!SupabaseService.isConfigured) {
        return 'SOS raised (preview mode). Connect Supabase to enable guardian notifications.';
      }
      try {
        Position? pos;
        try {
          final enabled = await Geolocator.isLocationServiceEnabled();
          if (enabled) {
            var perm = await Geolocator.checkPermission();
            if (perm == LocationPermission.denied) {
              perm = await Geolocator.requestPermission();
            }
            if (perm != LocationPermission.denied &&
                perm != LocationPermission.deniedForever) {
              pos = await Geolocator.getCurrentPosition(
                locationSettings: const LocationSettings(
                  accuracy: LocationAccuracy.high,
                  timeLimit: Duration(seconds: 8),
                ),
              );
            }
          }
        } catch (_) {/* geolocation optional */}

        await CrisisService.raise(
          kind: CrisisKind.manualAlert,
          latitude: pos?.latitude,
          longitude: pos?.longitude,
          payload: {'source': 'ai_tool', 'args': args},
        );
        return 'SOS raised. Your guardian has been notified with your location. Emergency services are being called.';
      } catch (e) {
        return 'SOS could not be raised: $e. Please use the red SOS button on the home screen.';
      }
    },
  ));
}

void ensureAiToolsRegistered() {
  if (_registry.isEmpty) _registerAll();
}
