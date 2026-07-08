// =====================================================================
// GoldenAge AI — Supabase Client
// =====================================================================
// Single shared entry-point. Initialized once in `main.dart` via
// `SupabaseService.initialize()` before runApp().
//
// Reads URL + anon key from compile-time --dart-define (so secrets
// never sit in the repo). Falls back to placeholder values for local
// dev so the app still boots without a real project.
// =====================================================================

import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/constants.dart';

class SupabaseService {
  SupabaseService._();

  /// Lazily-initialized Supabase singleton.
  static SupabaseClient get instance => Supabase.instance.client;

  /// Whether the client has been fully initialized with a real URL.
  static bool get isConfigured =>
      _supabaseUrl.isNotEmpty && !_supabaseUrl.startsWith('YOUR_');

  static const String _supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'YOUR_SUPABASE_URL',
  );
  static const String _supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'YOUR_SUPABASE_ANON_KEY',
  );

  /// Call once in main.dart before runApp().
  static Future<void> initialize() async {
    if (!isConfigured) {
      // No-op — the app still runs against local mock data, but any
      // call that hits Supabase will throw a clear "not configured"
      // exception that the UI can surface.
      return;
    }
    await Supabase.initialize(
      url: _supabaseUrl,
      anonKey: _supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        // Persistent session — per spec, users must never get locked out.
      ),
      realtimeClientOptions: const RealtimeClientOptions(
        eventsPerSecond: 5, // low-frequency broadcast, elder-friendly
      ),
    );

    // Keep the user signed in across app restarts.
    await Supabase.instance.client.auth
        .persistSessionString(kSupabasePersistSession);
  }
}
