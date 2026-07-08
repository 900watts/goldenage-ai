import 'package:flutter/material.dart';

import '../../core/l10n_ext.dart';
import '../coming_soon_screen.dart';

/// Anti-Scam Shield screen (Phase 5).
///
/// Users paste suspicious text messages, links, or phone numbers.
/// The AI evaluates against common elder-fraud patterns and outputs
/// a Safe / Caution / DANGER rating with actionable advice.
class ScamScreen extends StatelessWidget {
  const ScamScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return ComingSoonScreen(
      title: l.scamTitle,
      phase: l.scamSubtitle,
      icon: Icons.shield,
    );
  }
}
