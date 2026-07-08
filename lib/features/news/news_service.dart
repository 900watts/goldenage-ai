// =====================================================================
// GoldenAge AI — News Service
// =====================================================================
// Aggregates articles from a free RSS feed list, then (Phase 4) the
// AI will re-rank and filter them against the user's pgvector memory.
// For now, we just return the most recent 10 articles.
// =====================================================================

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:webfeed_plus/webfeed_plus.dart' as wf;

class NewsArticle {
  const NewsArticle({
    required this.title,
    required this.summary,
    required this.url,
    required this.source,
    required this.publishedAt,
  });
  final String title;
  final String summary;
  final String url;
  final String source;
  final DateTime publishedAt;
}

class NewsService {
  NewsService._();

  /// Free, well-formed Chinese news RSS feeds.
  static const _feeds = [
    'https://www.chinanews.com/rss/society.xml',
    'https://www.chinanews.com/rss/health.xml',
    'https://www.xinhuanet.com/politics/news_politics.xml',
  ];

  static Future<List<NewsArticle>> dailyDigest() async {
    final out = <NewsArticle>[];
    for (final url in _feeds) {
      try {
        final res = await http
            .get(Uri.parse(url))
            .timeout(const Duration(seconds: 6));
        if (res.statusCode != 200) continue;
        final body = utf8.decode(res.bodyBytes);
        final feed = wf.RssFeed.parse(body);
        for (final item in feed.items) {
          out.add(NewsArticle(
            title: item.title ?? '',
            summary: item.description ?? '',
            url: item.link ?? '',
            source: feed.title ?? url,
            publishedAt: item.pubDate ?? DateTime.now(),
          ));
        }
      } catch (_) {/* skip individual feed failures */}
    }
    out.sort((a, b) => b.publishedAt.compareTo(a.publishedAt));
    return out.take(10).toList();
  }
}
