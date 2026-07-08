// =====================================================================
// GoldenAge AI — Anti-Scam Screen
// =====================================================================
// Per spec: "Create a dedicated screen where users can copy-paste
// suspicious text messages, paste links, or input phone numbers.
// Implement an AI evaluation tool that analyzes the input against
// common elder-fraud patterns and outputs a clear 'Safe', 'Caution',
// or 'DANGER - Highly Likely a Scam' rating with actionable advice."
// =====================================================================

import 'package:flutter/material.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../widgets/big_button.dart';
import 'scam_engine.dart';

class ScamScreen extends StatefulWidget {
  const ScamScreen({super.key});
  @override
  State<ScamScreen> createState() => _ScamScreenState();
}

class _ScamScreenState extends State<ScamScreen> {
  final _ctrl = TextEditingController();
  ScamAnalysis? _result;
  bool _busy = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _analyze() async {
    final input = _ctrl.text.trim();
    if (input.isEmpty) return;
    setState(() {
      _busy = true;
      _result = null;
    });
    // Simulate the LLM round-trip (real LLM judge lands in Phase 4).
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    setState(() {
      _result = ScamEngine.analyze(input);
      _busy = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.scamTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 28),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
          Text(l.scamSubtitle, style: theme.textTheme.bodyLarge),
          const SizedBox(height: 16),
          TextField(
            controller: _ctrl,
            minLines: 5,
            maxLines: 10,
            style: const TextStyle(fontSize: 19),
            decoration: InputDecoration(
              hintText: l.scamInputPlaceholder,
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: BigButton(
                  label: l.scamClear,
                  icon: Icons.refresh,
                  style: BigButtonStyle.ghost,
                  expanded: false,
                  onPressed: () {
                    setState(() {
                      _ctrl.clear();
                      _result = null;
                    });
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: BigButton(
                  label: l.scamCheck,
                  icon: Icons.security,
                  busy: _busy,
                  onPressed: _analyze,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (_result != null) _VerdictCard(result: _result!),
        ],
        ),
      ),
    );
  }
}

class _VerdictCard extends StatelessWidget {
  const _VerdictCard({required this.result});
  final ScamAnalysis result;

  Color get _color {
    switch (result.verdict) {
      case ScamVerdict.safe:
        return AppColors.safe;
      case ScamVerdict.caution:
        return AppColors.warn;
      case ScamVerdict.danger:
        return AppColors.danger;
    }
  }

  IconData get _icon {
    switch (result.verdict) {
      case ScamVerdict.safe:
        return Icons.check_circle;
      case ScamVerdict.caution:
        return Icons.warning_amber_rounded;
      case ScamVerdict.danger:
        return Icons.dangerous;
    }
  }

  String _verdictLabel(BuildContext context) {
    final l = context.l10n;
    switch (result.verdict) {
      case ScamVerdict.safe:
        return l.scamVerdictSafe;
      case ScamVerdict.caution:
        return l.scamVerdictCaution;
      case ScamVerdict.danger:
        return l.scamVerdictDanger;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l = context.l10n;
    return Card(
      shape: RoundedRectangleBorder(
        side: BorderSide(color: _color, width: 2),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_icon, color: _color, size: 36),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_verdictLabel(context),
                          style: theme.textTheme.headlineSmall
                              ?.copyWith(color: _color, fontWeight: FontWeight.w800)),
                      Text('置信度 ${(result.confidence * 100).toStringAsFixed(0)}%',
                          style: const TextStyle(color: AppColors.muted)),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 28),
            Text(l.scamAdvice, style: theme.textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(result.advice, style: theme.textTheme.bodyLarge),
            const SizedBox(height: 12),
            ...result.reasons.map((r) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.fiber_manual_record, size: 8, color: _color),
                      const SizedBox(width: 8),
                      Expanded(child: Text(r, style: theme.textTheme.bodyMedium)),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
