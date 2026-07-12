// =====================================================================
// GoldenAge AI — Guardian Service
// =====================================================================
// Implements the secure family-pairing flow:
//
// 1. Elder calls [createPairInvite] → server returns an encrypted
//    `pair_token` (32 hex chars). Shown as a personalized pairing ID
//    by the UI for the family member to type in.
//
// 2. Guardian (already authenticated) calls [acceptPairInvite] with
//    the token. Server flips `pair_accepted = true`.
//
// 3. Guardian calls [fetchElderSummary] to read the privacy-safe
//    `guardian_elder_summary` view (aggregated mood/activity, no
//    raw chat content).
//
// 4. Crisis events bypass privacy via RLS — see `crisis_events`
//    policies in the migration.
// =====================================================================

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_service.dart';

class GuardianLink {
  const GuardianLink({
    required this.id,
    required this.elderId,
    required this.elderName,
    required this.pairToken,
    required this.pairAccepted,
  });
  final String id;
  final String elderId;
  final String elderName;
  final String pairToken;
  final bool pairAccepted;

  factory GuardianLink.fromMap(Map<String, dynamic> m) => GuardianLink(
        id: m['id'] as String,
        elderId: m['elder_id'] as String,
        elderName: (m['profiles']?['display_name'] as String?) ?? '',
        pairToken: m['pair_token'] as String,
        pairAccepted: m['pair_accepted'] as bool? ?? false,
      );
}

class GuardianService {
  GuardianService._();

  static SupabaseClient get _client => SupabaseService.instance;

  /// Elder side: create an invite token (shown as a personalized pairing ID).
  static Future<GuardianLink> createPairInvite({
    required String guardianUserId,
    String role = 'secondary',
  }) async {
    final elderId = _client.auth.currentUser?.id;
    if (elderId == null) {
      throw StateError('Not signed in');
    }
    final res = await _client
        .from('guardians')
        .insert({
          'elder_id': elderId,
          'guardian_id': guardianUserId,
          'role': role,
          'pair_accepted': false,
        })
        .select('id, elder_id, pair_token, pair_accepted, profiles!guardians_elder_id_fkey(display_name)')
        .single();
    return GuardianLink.fromMap(res);
  }

  /// Guardian side: accept a token shared by the elder.
  static Future<void> acceptPairInvite(String token) async {
    await _client
        .from('guardians')
        .update({'pair_accepted': true, 'paired_at': DateTime.now().toIso8601String()})
        .eq('pair_token', token)
        .eq('pair_accepted', false);
  }

  /// Elder side: list all current guardians.
  static Future<List<GuardianLink>> myGuardians() async {
    final res = await _client
        .from('guardians')
        .select('id, elder_id, pair_token, pair_accepted, profiles!guardians_elder_id_fkey(display_name)')
        .eq('elder_id', _client.auth.currentUser!.id)
        .isFilter('revoked_at', null);
    return (res as List).map((e) => GuardianLink.fromMap(e)).toList();
  }

  /// Guardian side: read the privacy-safe summary view.
  static Future<List<Map<String, dynamic>>> fetchElderSummary(
      String elderId) async {
    final res = await _client
        .from('guardian_elder_summary')
        .select()
        .eq('user_id', elderId)
        .order('log_date', ascending: false)
        .limit(7);
    return List<Map<String, dynamic>>.from(res as List);
  }

  /// Realtime channel — fires when the elder's session_logs change.
  static RealtimeChannel watchElder(String elderId) {
    return _client
        .channel('elder:$elderId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'session_logs',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: elderId,
          ),
          callback: (payload) {
            // UI layer subscribes via Provider; this is the raw event.
            // ignore: avoid_print
            print('Guardian realtime: ${payload.eventType} ${payload.newRecord}');
          },
        )
        .subscribe();
  }

  /// Guardian side: list the elders this user is guarding (the inverse of
  /// [myGuardians], which lists the elders of the *current* user). This is
  /// what powers the management app's live emergency alerts.
  static Future<List<GuardianLink>> myElders() async {
    final me = _client.auth.currentUser?.id;
    if (me == null) return [];
    final res = await _client
        .from('guardians')
        .select(
            'id, elder_id, pair_token, pair_accepted, profiles!guardians_elder_id_fkey(display_name)')
        .eq('guardian_id', me)
        .isFilter('revoked_at', null);
    return (res as List).map((e) => GuardianLink.fromMap(e)).toList();
  }

  /// Guardian side: unresolved crises for a watched elder.
  static Future<List<CrisisEvent>> unresolvedCrises(String elderId) async {
    final res = await _client
        .from('crisis_events')
        .select()
        .eq('user_id', elderId)
        .isFilter('resolved_at', null)
        .order('created_at', ascending: false);
    return (res as List).map((e) => CrisisEvent.fromMap(e)).toList();
  }

  /// Guardian side: realtime subscription to a watched elder's `crisis_events`.
  /// [onCrisis] fires with the new [CrisisEvent] on insert/update, or `null`
  /// when an event is resolved/removed so the UI can clear it.
  static RealtimeChannel watchCrises(
    String elderId,
    void Function(CrisisEvent?) onCrisis,
  ) {
    return _client
        .channel('crisis:$elderId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'crisis_events',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: elderId,
          ),
          callback: (payload) {
            final m = payload.newRecord;
            if (m == null || m.isEmpty) {
              onCrisis(null);
              return;
            }
            if (m['resolved_at'] != null) {
              onCrisis(null);
            } else {
              try {
                onCrisis(CrisisEvent.fromMap(m));
              } catch (_) {
                onCrisis(null);
              }
            }
          },
        )
        .subscribe();
  }
}
