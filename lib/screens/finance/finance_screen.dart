import 'package:flutter/material.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../widgets/big_button.dart';

/// Placeholder for the financial markets screen (Phase 4).
///
/// Phase 4 will integrate real-time APIs for A-shares, global indices,
/// and precious metals (gold/silver per gram). Candlestick charts will
/// be toggleable but hidden by default — only simple red/green trends.
/// An "Ask AI what this means" button will explain moves in plain language.
class FinanceScreen extends StatelessWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);

    // Mock data — Phase 4 replaces with live API.
    final items = <_FinanceRow>[
      _FinanceRow(l.financeGoldPerGram, '¥678.5', '+0.8%', true,
          AppColors.gold),
      _FinanceRow(l.financeSilverPerGram, '¥8.21', '-0.3%', false,
          AppColors.muted),
      _FinanceRow(l.financeShanghaiIndex, '3,245.6', '+12.3', true,
          AppColors.danger),
    ];

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(l.financeTitle, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 20),
          ...items.map((row) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 10,
                          height: 40,
                          decoration: BoxDecoration(
                            color: row.color,
                            borderRadius: BorderRadius.circular(5),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(row.label,
                              style: theme.textTheme.titleMedium),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(row.value,
                                style: theme.textTheme.titleLarge),
                            Text(
                              '${row.isUp ? "↑" : "↓"} ${row.change}',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color:
                                    row.isUp ? AppColors.up : AppColors.down,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              )),
          const SizedBox(height: 16),
          BigButton(
            label: l.financeAskAi,
            icon: Icons.lightbulb_outline,
            style: BigButtonStyle.secondary,
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text(l.financeAiExplaining),
                  behavior: SnackBarBehavior.floating),
            ),
          ),
        ],
      ),
    );
  }
}

class _FinanceRow {
  const _FinanceRow(this.label, this.value, this.change, this.isUp,
      this.color);
  final String label;
  final String value;
  final String change;
  final bool isUp;
  final Color color;
}
