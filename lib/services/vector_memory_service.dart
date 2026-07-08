// =====================================================================
// GoldenAge AI — Vector Memory Service
// =====================================================================
// Persists long-term user preferences, frequent topics, and historical
// session insights as 1536-dim OpenAI embeddings, stored in
// `public.memory_embeddings` (pgvector).
//
// Retrieval uses the `match_user_memory` SQL function — cosine
// similarity ≥ 0.7 returns the top 8 most relevant memories.
// =====================================================================

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_service.dart';

class MemoryHit {
  const MemoryHit({
    required this.id,
    required this.content,
    required this.category,
    required this.importance,
    required this.similarity,
  });
  final String id;
  final String content;
  final String category;
  final int importance;
  final double similarity;
}

class VectorMemoryService {
  VectorMemoryService._();

  static SupabaseClient get _client => SupabaseService.instance;

  /// Upsert a single memory. [embedding] is the 1536-dim vector returned
  /// by OpenAI text-embedding-3-small (or any 1536-dim embedder).
  static Future<void> remember({
    required String content,
    required List<double> embedding,
    String category = 'general',
    int importance = 5,
    String? source,
    Map<String, dynamic>? metadata,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    await _client.from('memory_embeddings').insert({
      'user_id': userId,
      'content': content,
      'embedding': embedding,
      'category': category,
      'importance': importance,
      'source': source,
      'metadata': metadata ?? {},
    });
  }

  /// Semantic search across this user's memory.
  static Future<List<MemoryHit>> recall(
    List<double> queryEmbedding, {
    double threshold = 0.7,
    int count = 8,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return const [];
    final res = await _client.rpc('match_user_memory', params: {
      'p_user_id': userId,
      'p_embedding': queryEmbedding,
      'p_match_threshold': threshold,
      'p_match_count': count,
    });
    return (res as List)
        .map((e) => MemoryHit(
              id: e['id'] as String,
              content: e['content'] as String,
              category: e['category'] as String,
              importance: e['importance'] as int,
              similarity: (e['similarity'] as num).toDouble(),
            ))
        .toList();
  }

  /// Convenience: forget a memory by id (hard delete).
  static Future<void> forget(String id) async {
    await _client.from('memory_embeddings').delete().eq('id', id);
  }
}
