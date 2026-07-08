// =====================================================================
// GoldenAge AI — Profile Service
// =====================================================================
// Reads / writes the `public.profiles` row that extends auth.users.
// All queries go through the Supabase client — RLS ensures the user
// can only ever see / mutate their own row.
// =====================================================================

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_service.dart';

class UserProfile {
  const UserProfile({
    required this.id,
    required this.displayName,
    this.preferredName,
    this.phoneE164,
    this.birthDate,
    this.city,
    this.mobility = 'independent',
    this.hearing = 'normal',
    this.emergencyContact,
  });

  final String id;
  final String displayName;
  final String? preferredName;
  final String? phoneE164;
  final DateTime? birthDate;
  final String? city;
  final String mobility;
  final String hearing;
  final String? emergencyContact;

  factory UserProfile.fromMap(Map<String, dynamic> m) => UserProfile(
        id: m['id'] as String,
        displayName: m['display_name'] as String? ?? '',
        preferredName: m['preferred_name'] as String?,
        phoneE164: m['phone_e164'] as String?,
        birthDate: m['birth_date'] != null
            ? DateTime.parse(m['birth_date'] as String)
            : null,
        city: m['city'] as String?,
        mobility: m['mobility'] as String? ?? 'independent',
        hearing: m['hearing'] as String? ?? 'normal',
        emergencyContact: m['emergency_contact'] as String?,
      );
}

class ProfileService {
  ProfileService._();

  static SupabaseClient get _client => SupabaseService.instance;

  /// Fetch the signed-in user's profile.
  static Future<UserProfile?> me() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;
    final res = await _client
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();
    if (res == null) return null;
    return UserProfile.fromMap(res);
  }

  /// Update editable fields on the signed-in user's profile.
  static Future<void> updateMe({
    String? displayName,
    String? preferredName,
    String? city,
    String? emergencyContact,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    final updates = <String, dynamic>{
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (displayName != null) updates['display_name'] = displayName;
    if (preferredName != null) updates['preferred_name'] = preferredName;
    if (city != null) updates['city'] = city;
    if (emergencyContact != null) updates['emergency_contact'] = emergencyContact;
    await _client.from('profiles').update(updates).eq('id', userId);
  }
}
