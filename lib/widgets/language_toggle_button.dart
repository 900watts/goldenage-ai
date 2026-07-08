import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/colors.dart';
import '../core/constants.dart';

/// The always-visible language toggle button shown in the top app bar.
///
/// Per spec: "Implement an instantaneous Language Toggle button
/// prominent on the top navigation bar at all times."
class LanguageToggleButton extends StatelessWidget {
  const LanguageToggleButton({
    super.key,
    required this.isZh,
    required this.onToggle,
  });

  /// Whether the current locale is Chinese.
  final bool isZh;

  /// Callback when the user taps the toggle.
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: isZh ? 'Switch to English' : '切换到中文',
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: AppConstants.minTouchTarget * 0.6,
          minWidth: AppConstants.minTouchTarget * 0.6,
        ),
        child: Material(
          color: Colors.white.withValues(alpha: 0.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          child: InkWell(
            onTap: onToggle,
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.language, size: 18, color: Colors.white),
                  const SizedBox(width: 6),
                  Text(
                    isZh ? 'EN' : '中文',
                    style: GoogleFonts.lexend(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
