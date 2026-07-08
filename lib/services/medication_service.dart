// =====================================================================
// GoldenAge AI — Medication Service
// =====================================================================
// CRUD for `medication_schedules` + `medication_logs`.
// Phase 5 hooks this up to local notifications + the AI voice
// reminder: "It's time for your blood pressure medication."
// =====================================================================

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_service.dart';

class Medication {
  const Medication({
    required this.id,
    required this.medName,
    this.dosage,
    required this.scheduleTimes,
    this.notes,
    required this.active,
  });
  final String id;
  final String medName;
  final String? dosage;
  final List<String> scheduleTimes; // ["08:00", "14:00", "20:00"]
  final String? notes;
  final bool active;

  factory Medication.fromMap(Map<String, dynamic> m) => Medication(
        id: m['id'] as String,
        medName: m['med_name'] as String,
        dosage: m['dosage'] as String?,
        scheduleTimes: List<String>.from(m['schedule_times'] as List),
        notes: m['notes'] as String?,
        active: m['active'] as bool? ?? true,
      );
}

class MedicationService {
  MedicationService._();

  static SupabaseClient get _client => SupabaseService.instance;

  static Future<List<Medication>> list() async {
    final res = await _client
        .from('medication_schedules')
        .select()
        .eq('active', true)
        .order('created_at');
    return (res as List).map((e) => Medication.fromMap(e)).toList();
  }

  static Future<Medication> create({
    required String medName,
    String? dosage,
    required List<String> scheduleTimes,
    String? notes,
  }) async {
    final res = await _client
        .from('medication_schedules')
        .insert({
          'med_name': medName,
          'dosage': dosage,
          'schedule_times': scheduleTimes,
          'notes': notes,
        })
        .select()
        .single();
    return Medication.fromMap(res);
  }

  /// Record a compliance event.
  static Future<void> log({
    required String scheduleId,
    required DateTime scheduledAt,
    required String status, // 'taken' | 'missed' | 'skipped' | 'late'
    DateTime? takenAt,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    await _client.from('medication_logs').insert({
      'schedule_id': scheduleId,
      'user_id': userId,
      'scheduled_at': scheduledAt.toIso8601String(),
      'status': status,
      'taken_at': takenAt?.toIso8601String(),
    });
  }
}
