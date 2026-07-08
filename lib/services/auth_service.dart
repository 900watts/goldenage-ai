// =====================================================================
// GoldenAge AI — Auth Service
// =====================================================================
// Wraps Supabase Auth with a senior-friendly API.
//
// Backed by Supabase Auth features:
//   * Phone OTP (SMS one-time code)   ─ primary
//   * Biometric (Face/Fingerprint)    ─ uses local_auth, not Supabase
//   * Windows Hello on PC             ─ uses local_auth, not Supabase
//   * Persistent session              ─ "Keep Me Logged In" by default
// =====================================================================

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_service.dart';

enum AuthStatus { unknown, signedOut, signedIn, needsOtp, needsBiometric }

class AuthService {
  AuthService._();

  static SupabaseClient get _client => SupabaseService.instance;

  /// Broadcast stream of the current [AuthStatus].
  static Stream<AuthStatus> get statusStream =>
      _client.auth.onAuthStateChange.map(_mapEvent).distinct();

  static AuthStatus get currentStatus =>
      _client.auth.currentSession == null
          ? AuthStatus.signedOut
          : AuthStatus.signedIn;

  /// Send an SMS one-time code to [phoneE164] (e.g. +8613800000000).
  static Future<void> sendPhoneOtp(String phoneE164) async {
    await _client.auth.signInWithOtp(
      phone: phoneE164,
      shouldCreateUser: true, // seniors may not have an account yet
    );
  }

  /// Verify the 6-digit code the user received.
  static Future<AuthResponse> verifyPhoneOtp({
    required String phoneE164,
    required String token,
  }) async {
    return _client.auth.verifyOTP(
      phone: phoneE164,
      token: token,
      type: OtpType.sms,
    );
  }

  /// Sign out. Persistent session token is cleared on the device.
  static Future<void> signOut() => _client.auth.signOut();

  /// The currently signed-in user, or `null` if signed out.
  static User? get currentUser => _client.auth.currentUser;

  /// The user's stable UUID — used as a foreign key everywhere.
  static String? get userId => _client.auth.currentUser?.id;

  static AuthStatus _mapEvent(AuthState state) {
    final session = state.session;
    if (session == null) return AuthStatus.signedOut;
    return AuthStatus.signedIn;
  }
}
