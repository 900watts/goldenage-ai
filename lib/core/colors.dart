import 'package:flutter/material.dart';

/// Centralized color palette for GoldenAge AI.
///
/// Designed for high contrast and accessibility:
/// - Primary teal (#0D9488) — calming, trustworthy, healthcare-friendly.
/// - CTA orange (#F97316) — warm, draws attention to primary actions.
/// - Cream background (#FFFBF5) — reduces eye strain vs pure white.
/// - Red = up/danger, Green = down/safe (Chinese market convention).
class AppColors {
  AppColors._();

  // Brand
  static const Color primary = Color(0xFF0D9488);
  static const Color primaryDark = Color(0xFF0F766E);
  static const Color secondary = Color(0xFF14B8A6);
  static const Color cta = Color(0xFFF97316);
  static const Color ctaDark = Color(0xFFEA580C);

  // Surfaces
  static const Color bg = Color(0xFFF0FDFA);
  static const Color bgCream = Color(0xFFFFFBF5);
  static const Color card = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFCBE7E2);

  // Text
  static const Color text = Color(0xFF134E4A);
  static const Color textSoft = Color(0xFF3F5C5A);
  static const Color muted = Color(0xFF6B8785);

  // Semantic — Chinese market convention: red = up, green = down
  static const Color up = Color(0xFFDC2626); // 涨 = red
  static const Color down = Color(0xFF16A34A); // 跌 = green
  static const Color danger = Color(0xFFDC2626);
  static const Color safe = Color(0xFF16A34A);
  static const Color warn = Color(0xFFF59E0B);
  static const Color gold = Color(0xFFE0A82E);

  // Accent gradients
  static const Color purple = Color(0xFF8B5CF6);
  static const Color blue = Color(0xFF3B82F6);
  static const Color indigo = Color(0xFF6366F1);
  static const Color rose = Color(0xFFFB7185);
}
