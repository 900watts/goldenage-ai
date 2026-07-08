// =====================================================================
// GoldenAge AI — News Screen (Daily Digest)
// =====================================================================
// Per spec: "Integrate a real-time RSS or News API aggregator. The AI
// assistant acts as an editor behind the scenes: it parses new
// articles, compares them against the user's long-term memory profile
// stored in Supabase, filters out sensationalist clickbait, and
// delivers a clean, personalized 'Daily Digest.' Provide an 'AI
// Read Out Loud' button for every news piece."
// =====================================================================

import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import 'news_service.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});
  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  late Future<List<NewsArticle>> _future;
  final _tts = FlutterTts();
  String? _speakingUrl;

  @override
  void initState() {
    super.initState();
    _future = NewsService.dailyDigest();
    _tts.setLanguage('zh-CN');
    _tts.setSpeechRate(0.5);
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  Future<void> _toggleSpeak(NewsArticle a) async {
    if (_speakingUrl == a.url) {
      await _tts.stop();
      setState(() => _speakingUrl = null);
      return;
    }
    setState(() => _speakingUrl = a.url);
    await _tts.setCompletionHandler(() {
      if (mounted) setState(() => _speakingUrl = null);
    });
    await _tts.speak('${a.title}。 ${a.summary}');
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.newsTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 28),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: FutureBuilder<List<NewsArticle>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data ?? const [];
          if (items.isEmpty) {
            return Center(child: Text(l.newsNoArticles, style: theme.textTheme.bodyLarge));
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: AppColors.cta, size: 22),
                    const SizedBox(width: 8),
                    Text(l.newsAiCurated, style: theme.textTheme.titleLarge),
                  ],
                ),
              ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) {
                    final a = items[i];
                    final speaking = _speakingUrl == a.url;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(l.newsAiCurated,
                                      style: const TextStyle(color: Colors.white, fontSize: 12)),
                                ),
                                const Spacer(),
                                Text(a.source,
                                    style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(a.title, style: theme.textTheme.titleMedium),
                            const SizedBox(height: 6),
                            Text(a.summary, maxLines: 3, overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.bodyLarge),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.volume_up_outlined, size: 18, color: AppColors.cta),
                                const SizedBox(width: 6),
                                TextButton(
                                  onPressed: () => _toggleSpeak(a),
                                  child: Text(
                                    speaking ? l.newsStopReading : l.newsReadAloud,
                                    style: const TextStyle(
                                        color: AppColors.cta, fontWeight: FontWeight.w700),
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  _format(a.publishedAt),
                                  style: const TextStyle(fontSize: 12, color: AppColors.muted),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
        ),
      ),
    );
  }

  String _format(DateTime t) {
    final now = DateTime.now();
    final diff = now.difference(t);
    if (diff.inMinutes < 60) return '${diff.inMinutes} 分钟前';
    if (diff.inHours < 24) return '${diff.inHours} 小时前';
    return '${diff.inDays} 天前';
  }
}
