import 'package:flutter/material.dart';

import '../../core/l10n_ext.dart';
import '../coming_soon_screen.dart';

/// Guardian ecosystem screen (Phase 5).
///
/// Secure family pairing via encrypted QR/token. The Guardian can ask
/// "How is Mom doing?" and the AI aggregates mood/activity without
/// revealing private content. Emergency bypass gate for crises.
class GuardianScreen extends StatelessWidget {
  const GuardianScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return ComingSoonScreen(
      title: l.guardianTitle,
      phase: l.guardianPair,
      icon: Icons.family_restroom,
    );
  }
}
