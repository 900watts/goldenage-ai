// =====================================================================
// GoldenAge AI — Medication Screen
// =====================================================================
// Senior-friendly list of scheduled meds. Tapping the checkmark logs
// compliance. Tapping the bell schedules a local notification (Phase 4
// will use flutter_local_notifications).
// =====================================================================

import 'package:flutter/material.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../services/medication_service.dart';
import '../../services/supabase_service.dart';
import '../../widgets/big_button.dart';
import '../../widgets/labeled_icon_card.dart';

class MedicationScreen extends StatefulWidget {
  const MedicationScreen({super.key});
  @override
  State<MedicationScreen> createState() => _MedicationScreenState();
}

class _MedicationScreenState extends State<MedicationScreen> {
  List<Medication> _meds = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    if (SupabaseService.isConfigured) {
      _meds = await MedicationService.list();
    } else {
      _meds = _devFixture();
    }
    if (mounted) setState(() => _loading = false);
  }

  List<Medication> _devFixture() => const [
        Medication(
          id: 'm1',
          medName: '降压药',
          dosage: '1 片',
          scheduleTimes: ['08:00', '20:00'],
          notes: '饭后服用',
          active: true,
        ),
        Medication(
          id: 'm2',
          medName: '钙片',
          dosage: '2 片',
          scheduleTimes: ['12:00'],
          notes: '随午餐',
          active: true,
        ),
      ];

  Future<void> _log(Medication m, String status) async {
    if (SupabaseService.isConfigured) {
      await MedicationService.log(
        scheduleId: m.id,
        scheduledAt: DateTime.now(),
        status: status,
        takenAt: status == 'taken' ? DateTime.now() : null,
      );
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(status == 'taken' ? '已记录服用' : '已记录跳过'),
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.medicationTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 28),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
          Row(
            children: [
              Expanded(
                child: Text(l.medicationTitle, style: theme.textTheme.headlineSmall),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle, color: AppColors.primary, size: 36),
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text('${l.medicationAdd} · Phase 4'),
                  behavior: SnackBarBehavior.floating,
                )),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_meds.isEmpty)
            Column(
              children: [
                const SizedBox(height: 40),
                const Icon(Icons.medication_outlined, size: 80, color: AppColors.muted),
                const SizedBox(height: 12),
                Text(l.medicationReminderMsg,
                    textAlign: TextAlign.center, style: theme.textTheme.bodyLarge),
              ],
            )
          else
            ..._meds.map(
              (m) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                gradient: AppGradients.gold,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Icon(Icons.medication, color: Colors.white),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(m.medName, style: theme.textTheme.titleMedium),
                                  Text(
                                    '${m.scheduleTimes.join(" · ")}${m.dosage != null ? "  ·  ${m.dosage}" : ""}',
                                    style: theme.textTheme.bodyMedium,
                                  ),
                                  if (m.notes != null)
                                    Text(m.notes!,
                                        style: const TextStyle(
                                            color: AppColors.muted, fontSize: 14)),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.check_circle,
                                  color: AppColors.safe, size: 32),
                              onPressed: () => _log(m, 'taken'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: BigButton(
                                label: l.medicationTaken,
                                icon: Icons.check,
                                style: BigButtonStyle.primary,
                                expanded: false,
                                onPressed: () => _log(m, 'taken'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: BigButton(
                                label: l.commonSkip,
                                icon: Icons.close,
                                style: BigButtonStyle.ghost,
                                expanded: false,
                                onPressed: () => _log(m, 'skipped'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
        ),
      ),
    );
  }
}
