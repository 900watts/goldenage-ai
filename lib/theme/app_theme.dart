import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/colors.dart';
import '../core/constants.dart';

/// Builds light and dark [ThemeData] for GoldenAge AI.
///
/// Key accessibility guarantees baked into every theme:
/// - Big Text Mode is ON by default (body 18–24pt) — see [TextScaleProvider].
/// - High contrast: text #134E4A on cream #FFFBF5 (ratio ≈ 9.5:1, AAA).
/// - All buttons enforce ≥64×64px touch targets via [BigButton].
/// - No icon-only buttons anywhere in the app.
class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);
    return _build(base, brightness: Brightness.light);
  }

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    return _build(base, brightness: Brightness.dark);
  }

  static ThemeData _build(ThemeData base, {required Brightness brightness}) {
    final isLight = brightness == Brightness.light;
    final scaffoldBg = isLight ? AppColors.bgCream : const Color(0xFF0F1A1A);
    final cardColor = isLight ? AppColors.card : const Color(0xFF1A2828);
    final textCol = isLight ? AppColors.text : const Color(0xFFE6F2F0);
    final textSoftCol =
        isLight ? AppColors.textSoft : const Color(0xFFA8C0BD);
    final borderCol = isLight ? AppColors.border : const Color(0xFF2A3D3D);

    final headlineColor = textCol;
    final bodyColor = textSoftCol;

    final textTheme = GoogleFonts.lexendTextTheme(
      GoogleFonts.sourceSans3TextTheme(
        base.textTheme,
      ),
    ).copyWith(
      displayLarge: base.textTheme.displayLarge?.copyWith(
        color: headlineColor,
        fontWeight: FontWeight.w800,
      ),
      displayMedium: base.textTheme.displayMedium?.copyWith(
        color: headlineColor,
        fontWeight: FontWeight.w800,
      ),
      headlineLarge: base.textTheme.headlineLarge?.copyWith(
        color: headlineColor,
        fontWeight: FontWeight.w700,
      ),
      headlineMedium: base.textTheme.headlineMedium?.copyWith(
        color: headlineColor,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: base.textTheme.titleLarge?.copyWith(
        color: headlineColor,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: base.textTheme.titleMedium?.copyWith(
        color: headlineColor,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: base.textTheme.bodyLarge?.copyWith(
        color: bodyColor,
        fontSize: AppConstants.bigTextBodyMin,
        height: 1.6,
      ),
      bodyMedium: base.textTheme.bodyMedium?.copyWith(
        color: bodyColor,
        fontSize: AppConstants.bigTextBodyMin,
        height: 1.6,
      ),
      labelLarge: base.textTheme.labelLarge?.copyWith(
        color: headlineColor,
        fontWeight: FontWeight.w700,
        fontSize: 18,
      ),
    );

    return base.copyWith(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: brightness,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: cardColor,
        error: AppColors.danger,
      ),
      scaffoldBackgroundColor: scaffoldBg,
      cardColor: cardColor,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor:
            isLight ? AppColors.primary : const Color(0xFF0D2A28),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.lexend(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: 22,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cardColor,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.muted,
        selectedLabelStyle: GoogleFonts.lexend(
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
        unselectedLabelStyle: GoogleFonts.lexend(
          fontWeight: FontWeight.w500,
          fontSize: 13,
        ),
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.cta,
          foregroundColor: Colors.white,
          minimumSize: const Size(
            AppConstants.minTouchTarget,
            AppConstants.minTouchTarget,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.lexend(
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          minimumSize: const Size(
            AppConstants.minTouchTarget,
            AppConstants.minTouchTarget,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          side: const BorderSide(color: AppColors.primary, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.lexend(
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      cardTheme: CardTheme(
        color: cardColor,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: borderCol, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isLight ? AppColors.bg : const Color(0xFF1A2828),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: borderCol),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        labelStyle: GoogleFonts.sourceSans3(
          color: textSoftCol,
          fontSize: 18,
        ),
        hintStyle: GoogleFonts.sourceSans3(
          color: AppColors.muted,
          fontSize: 18,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: borderCol,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
