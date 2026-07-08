import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import '../core/colors.dart';
import '../core/constants.dart';

/// A large, accessible button that ALWAYS meets the 64×64px minimum
/// touch target and is NEVER shown without a text label.
///
/// Per spec:
/// - Minimum touch target ≥64×64px (spec requirement).
/// - Every button has a visible text label (never icons alone).
/// - Haptic feedback on tap (Android) for tactile confirmation.
class BigButton extends StatelessWidget {
  const BigButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.style = BigButtonStyle.primary,
    this.expanded = true,
    this.busy = false,
  });

  /// Visible text label — required, never null.
  final String label;

  /// Optional leading icon. If provided, the button shows [icon] +
  /// [label] (never icon alone).
  final IconData? icon;

  /// Tap callback.
  final VoidCallback onPressed;

  /// Visual style of the button.
  final BigButtonStyle style;

  /// Whether the button should expand to fill available width.
  final bool expanded;

  /// When true, shows a spinner and disables the button.
  final bool busy;

  Future<void> _handleTap() async {
    try {
      await HapticFeedback.lightImpact();
    } catch (_) {
      // Haptics not available (e.g. desktop) — silently ignore.
    }
    onPressed();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPrimary = style == BigButtonStyle.primary;
    final isDanger = style == BigButtonStyle.danger;
    final isGhost = style == BigButtonStyle.ghost;

    Color bg;
    Color fg;
    Border? border;
    if (isDanger) {
      bg = AppColors.danger;
      fg = Colors.white;
    } else if (isGhost) {
      bg = Colors.transparent;
      fg = AppColors.primary;
      border = Border.all(color: AppColors.primary, width: 1.5);
    } else {
      bg = isPrimary ? AppColors.cta : AppColors.primary;
      fg = Colors.white;
    }

    final child = Row(
      mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (busy) ...[
          SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              valueColor: AlwaysStoppedAnimation<Color>(fg),
            ),
          ),
          const SizedBox(width: 12),
        ] else if (icon != null) ...[
          Icon(icon, size: 24, color: fg),
          const SizedBox(width: 12),
        ],
        Flexible(
          child: Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(color: fg),
            overflow: TextOverflow.ellipsis,
            maxLines: 2,
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );

    final constraints = const BoxConstraints(
      minHeight: AppConstants.minTouchTarget,
      minWidth: AppConstants.minTouchTarget,
    );

    if (isGhost) {
      return ConstrainedBox(
        constraints: constraints,
        child: InkWell(
          onTap: busy ? null : _handleTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            decoration: BoxDecoration(
              border: border,
              borderRadius: BorderRadius.circular(14),
            ),
            child: child,
          ),
        ),
      );
    }

    return ConstrainedBox(
      constraints: constraints,
      child: ElevatedButton(
        onPressed: busy ? null : _handleTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: bg.withValues(alpha: 0.6),
          minimumSize: Size(
            AppConstants.minTouchTarget,
            AppConstants.minTouchTarget,
          ),
          padding:
              const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: isPrimary ? 2 : 0,
        ),
        child: child,
      ),
    );
  }
}

enum BigButtonStyle { primary, secondary, danger, ghost }
