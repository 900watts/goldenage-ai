// =====================================================================
// GoldenAge AI — Crisis / SOS Service
// =====================================================================
// Handles the "Exception Gate" — when the AI detects a life-threatening
// situation, it inserts a row into `public.crisis_events` and
// (in Phase 4) fires an Edge Function that:
//
//   1. Updates the Supabase crisis state.
//   2. Sends the live AMap location via SMS to the elder's guardian.
//   3. Dials emergency services (per the user's locale).
//
// RLS ensures guardians can READ crisis events for their elder
// (privacy bypass) but never read normal session_logs / chats.
// =====================================================================

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_service.dart';

enum CrisisKind {
  sosButton('sos_button'),
  fallDetected('fall_detected'),
  chestPainSearch('chest_pain_search'),
  medMissedCritical('med_missed_critical'),
  noActivity24h('no_activity_24h'),
  manualAlert('manual_alert');

  const CrisisKind(this.value);
  final String value;
}

class CrisisEvent {
  const CrisisEvent({
    required this.id,
    required this.kind,
    this.latitude,
    this.longitude,
    required this.createdAt,
    required this.guardianNotified,
  });
  final String id;
  final CrisisKind kind;
  final double? latitude;
  final double? longitude;
  final DateTime createdAt;
  final bool guardianNotified;

  factory CrisisEvent.fromMap(Map<String, dynamic> m) => CrisisEvent(
        id: m['id'] as String,
        kind: CrisisKind.values.firstWhere(
          (e) => e.value == m['kind'],
          orElse: () => CrisisKind.manualAlert,
        ),
        latitude: (m['latitude'] as num?)?.toDouble(),
        longitude: (m['longitude'] as num?)?.toDouble(),
        createdAt: DateTime.parse(m['created_at'] as String),
        guardianNotified: m['guardian_notified'] as bool? ?? false,
      );
}

class CrisisService {
  CrisisService._();

  static SupabaseClient get _client => SupabaseService.instance;

  /// Fire-and-record a crisis event. In Phase 4 the Edge Function
  /// `notify-guardian` will be invoked to dispatch SMS + push.
  static Future<CrisisEvent> raise({
    required CrisisKind kind,
    double? latitude,
    double? longitude,
    Map<String, dynamic>? payload,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw StateError('Not signed in');
    final res = await _client
        .from('crisis_events')
        .insert({
          'user_id': userId,
          'kind': kind.value,
          'latitude': latitude,
          'longitude': longitude,
          'payload': payload ?? {},
        })
        .select()
        .single();
    return CrisisEvent.fromMap(res);
  }

  /// Recent crises (for the elder's own review).
  static Future<List<CrisisEvent>> recent({int limit = 20}) async {
    final res = await _client
        .from('crisis_events')
        .select()
        .order('created_at', ascending: false)
        .limit(limit);
    return (res as List).map((e) => CrisisEvent.fromMap(e)).toList();
  }

  /// Mark a crisis as resolved.
  static Future<void> resolve(String id) async {
    await _client
        .from('crisis_events')
        .update({'resolved_at': DateTime.now().toIso8601String()})
        .eq('id', id);
  }
}
