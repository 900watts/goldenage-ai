import 'package:flutter/material.dart';

import '../../core/l10n_ext.dart';
import '../coming_soon_screen.dart';

/// Medication & hydration companion screen (Phase 5).
///
/// Scheduling system synced with Supabase. The AI handles voice
/// reminders: "It's time for your blood pressure medication, let me
/// know when you've taken it," and logs compliance.
class MedicationScreen extends StatelessWidget {
  const MedicationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return ComingSoonScreen(
      title: l.medicationTitle,
      phase: l.medicationReminderMsg,
      icon: Icons.medication,
    );
  }
}
