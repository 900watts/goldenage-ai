// =====================================================================
// GoldenAge AI — Finance Service
// =====================================================================
// Fetches gold, silver, and major index quotes. Uses the public Yahoo
// Finance unofficial endpoint as a free default; in production you
// can swap in any provider (Sina, Tencent, Alpha Vantage, etc.).
//
// Chinese market convention: 涨 → red, 跌 → green.
// =====================================================================

import 'dart:convert';
import 'package:http/http.dart' as http;

class FinanceQuote {
  const FinanceQuote({
    required this.symbol,
    required this.name,
    required this.price,
    required this.change,
    required this.changePct,
    required this.assetClass,
  });
  final String symbol;
  final String name;
  final double price;
  final double change;
  final double changePct;
  final String assetClass; // 'gold' | 'silver' | 'index' | 'stock'
  bool get up => change >= 0;
}

class FinanceService {
  FinanceService._();

  /// Default watchlist — the user's first-paint experience.
  static const _defaults = <String, ({String name, String asset})>{
    'GC=F': (name: '黄金 (USD/oz)', asset: 'gold'),
    'SI=F': (name: '白银 (USD/oz)', asset: 'silver'),
    '000001.SS': (name: '上证指数', asset: 'index'),
    '^GSPC': (name: '标普500', asset: 'index'),
  };

  static Future<List<FinanceQuote>> watchlist() async {
    try {
      final symbols = _defaults.keys.join(',');
      final uri = Uri.parse(
        'https://query1.finance.yahoo.com/v7/finance/quote'
        '?symbols=$symbols',
      );
      final res = await http.get(uri, headers: {
        'user-agent': 'Mozilla/5.0',
      }).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) return _offlineFixture();
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final results = (data['quoteResponse']?['result'] as List?) ?? const [];
      return results.map((q) {
        final sym = q['symbol'] as String;
        final meta = _defaults[sym]!;
        return FinanceQuote(
          symbol: sym,
          name: meta.name,
          price: (q['regularMarketPrice'] as num?)?.toDouble() ?? 0,
          change: (q['regularMarketChange'] as num?)?.toDouble() ?? 0,
          changePct: (q['regularMarketChangePercent'] as num?)?.toDouble() ?? 0,
          assetClass: meta.asset,
        );
      }).toList();
    } catch (_) {
      return _offlineFixture();
    }
  }

  static List<FinanceQuote> _offlineFixture() => const [
        FinanceQuote(
            symbol: 'GC=F',
            name: '黄金 (USD/oz)',
            price: 2345.6,
            change: 18.4,
            changePct: 0.79,
            assetClass: 'gold'),
        FinanceQuote(
            symbol: 'SI=F',
            name: '白银 (USD/oz)',
            price: 30.8,
            change: -0.22,
            changePct: -0.71,
            assetClass: 'silver'),
        FinanceQuote(
            symbol: '000001.SS',
            name: '上证指数',
            price: 3245.7,
            change: 12.3,
            changePct: 0.38,
            assetClass: 'index'),
        FinanceQuote(
            symbol: '^GSPC',
            name: '标普500',
            price: 5460.1,
            change: -8.4,
            changePct: -0.15,
            assetClass: 'index'),
      ];
}
