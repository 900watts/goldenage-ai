// =====================================================================
// GoldenAge AI — Finance Screen
// =====================================================================
// Per spec: "Avoid complex charts (candlesticks should be toggleable
// but hidden by default). Instead, show simple green/red trends and
// provide a 'Ask AI what this means' button."
// =====================================================================

import 'package:flutter/material.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../widgets/big_button.dart';
import 'finance_service.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});
  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  late Future<List<FinanceQuote>> _future;
  bool _showCandles = false;
  String? _explaining;

  @override
  void initState() {
    super.initState();
    _future = FinanceService.watchlist();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.financeTitle),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(l.financeTitle, style: theme.textTheme.titleLarge),
                  ),
                  Switch(
                    value: _showCandles,
                    onChanged: (v) => setState(() => _showCandles = v),
                  ),
                  Text(_showCandles ? l.financeHideCandlestick : l.financeShowCandlestick,
                      style: const TextStyle(fontSize: 14)),
                ],
              ),
            ),
          Expanded(
            child: FutureBuilder<List<FinanceQuote>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final items = snap.data ?? const [];
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) {
                    final q = items[i];
                    return _QuoteCard(
                      q: q,
                      showCandles: _showCandles,
                      explaining: _explaining == q.symbol,
                      onAsk: () async {
                        setState(() => _explaining = q.symbol);
                        await Future.delayed(const Duration(seconds: 2));
                        if (!mounted) return;
                        setState(() => _explaining = null);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              q.up
                                  ? '${q.name}今天涨了${q.changePct.toStringAsFixed(2)}%，受全球避险情绪影响。'
                                  : '${q.name}今天跌了${q.changePct.abs().toStringAsFixed(2)}%，市场情绪偏谨慎。',
                            ),
                            behavior: SnackBarBehavior.floating,
                            duration: const Duration(seconds: 5),
                          ),
                        );
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
        ),
      ),
    );
  }
}

class _QuoteCard extends StatelessWidget {
  const _QuoteCard({
    required this.q,
    required this.showCandles,
    required this.explaining,
    required this.onAsk,
  });
  final FinanceQuote q;
  final bool showCandles;
  final bool explaining;
  final VoidCallback onAsk;

  Color get _upDown => q.up ? AppColors.danger : AppColors.safe; // CN convention

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _upDown,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(q.name,
                      style: theme.textTheme.titleMedium),
                ),
                Text(
                  q.price.toStringAsFixed(2),
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: _upDown,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  '${q.up ? '+' : ''}${q.change.toStringAsFixed(2)}'
                  '  (${q.up ? '+' : ''}${q.changePct.toStringAsFixed(2)}%)',
                  style: TextStyle(
                    color: _upDown,
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                if (showCandles)
                  Container(
                    width: 80,
                    height: 28,
                    decoration: BoxDecoration(
                      color: _upDown.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: Text('K线',
                        style: TextStyle(color: _upDown, fontSize: 13)),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            BigButton(
              label: explaining ? 'AI 解读中…' : '问问AI这是什么意思',
              icon: Icons.psychology_outlined,
              style: BigButtonStyle.ghost,
              expanded: false,
              busy: explaining,
              onPressed: explaining ? () {} : onAsk,
            ),
          ],
        ),
      ),
    );
  }
}
