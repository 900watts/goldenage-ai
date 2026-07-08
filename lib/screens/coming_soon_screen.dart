import 'package:flutter/material.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';

/// Shared "coming in Phase X" placeholder for feature screens that
/// aren't fully implemented yet.
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({
    super.key,
    required this.title,
    required this.phase,
    required this.icon,
  });

  final String title;
  final String phase;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 80,
                color: AppColors.primary.withValues(alpha: 0.4)),
            const SizedBox(height: 20),
            Text(title, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              phase,
              style: theme.textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(l.commonLoading,
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: AppColors.muted)),
          ],
        ),
      ),
    );
  }
}
