// =====================================================================
// GoldenAge AI — SOUL.md Reader
// =====================================================================
// Loads the SOUL.md persona file at app startup (or when explicitly
// refreshed) and exposes it to the AI bubble as the system prompt.
//
// Per spec: "The AI must read this file to initialize its persona.
// Define the persona as: extremely patient, polite, warm/grounded
// language, gentle tone, never uses confusing technical jargon, and
// treats the user like a cherished old friend."
// =====================================================================

import 'package:flutter/services.dart' show rootBundle;

class SoulPersona {
  SoulPersona._(this.raw, this.principles, this.voice, this.taboos);

  /// Raw markdown of the SOUL.md file.
  final String raw;

  /// Bulleted principles extracted from the markdown (everything
  /// starting with `- ` or `* ` under the first heading).
  final List<String> principles;

  /// Voice-and-tone directives.
  final List<String> voice;

  /// Taboo phrases / behaviors the AI must avoid.
  final List<String> taboos;

  static SoulPersona? _instance;

  /// Load + cache. Safe to call multiple times.
  static Future<SoulPersona> load() async {
    if (_instance != null) return _instance!;
    final raw = await rootBundle.loadString('assets/soul/SOUL.md');
    _instance = _parse(raw);
    return _instance!;
  }

  /// Force-reload (e.g. after a hot-update pushes a new SOUL.md).
  static Future<SoulPersona> reload() async {
    _instance = null;
    return load();
  }

  /// Build the system prompt sent to the LLM on every turn.
  String toSystemPrompt({String? userPreferredName, String? userLocale}) {
    final buf = StringBuffer()
      ..writeln('You are the 银龄智伴（GoldenAge AI）companion for an elderly user.')
      ..writeln('')
      ..writeln('--- Persona (SOUL.md) ---')
      ..writeln(raw)
      ..writeln('--- End persona ---')
      ..writeln('');

    if (userPreferredName != null && userPreferredName.isNotEmpty) {
      buf.writeln('Address the user as: $userPreferredName');
    }
    if (userLocale != null) {
      buf.writeln('Respond in: ${userLocale == 'zh' ? 'Simplified Chinese (简体中文)' : 'English'}');
    }
    return buf.toString();
  }

  static SoulPersona _parse(String md) {
    final principles = <String>[];
    final voice = <String>[];
    final taboos = <String>[];

    String? current;
    for (final line in md.split('\n')) {
      final t = line.trim();
      if (t.startsWith('# ')) {
        current = t.toLowerCase();
        continue;
      }
      if (t.startsWith('## ')) {
        final h = t.toLowerCase();
        if (h.contains('voice') || h.contains('tone') || h.contains('language')) {
          current = 'voice';
        } else if (h.contains('avoid') || h.contains('taboo') || h.contains('never')) {
          current = 'taboo';
        } else if (h.contains('principle') || h.contains('core') || h.contains('truth')) {
          current = 'principles';
        } else {
          current = null;
        }
        continue;
      }
      final bullet = RegExp(r'^[-*]\s+(.*)').firstMatch(t);
      if (bullet != null) {
        final content = bullet.group(1)!.trim();
        switch (current) {
          case 'voice':
            voice.add(content);
            break;
          case 'taboo':
            taboos.add(content);
            break;
          case 'principles':
          case null:
            principles.add(content);
            break;
        }
      }
    }
    return SoulPersona._(md, principles, voice, taboos);
  }
}
