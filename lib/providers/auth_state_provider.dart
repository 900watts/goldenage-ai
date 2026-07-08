// =====================================================================
// GoldenAge AI — Auth State Provider
// =====================================================================
// Bridges the Supabase Auth session to the widget tree via Provider.
// On boot it listens to `auth.onAuthStateChange` so a signed-in user
// skips the auth screen entirely (per the "Keep Me Logged In" spec).
// =====================================================================

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../services/auth_service.dart';
import '../services/supabase_service.dart';

enum AuthGate { unknown, signedOut, signedIn }

class AuthStateProvider extends ChangeNotifier {
  AuthStateProvider() {
    _bootstrap();
  }

  AuthGate _gate = AuthGate.unknown;
  AuthGate get gate => _gate;

  sb.User? get user => AuthService.currentUser;

  StreamSubscription<sb.AuthState>? _sub;

  Future<void> _bootstrap() async {
    // 1. If the Supabase client was initialised, use its current state.
    if (SupabaseService.isConfigured) {
      _gate = AuthService.currentStatus == AuthStatus.signedIn
          ? AuthGate.signedIn
          : AuthGate.signedOut;
      notifyListeners();

      // 2. Listen for sign-in / sign-out events from the SDK.
      _sub = AuthService.statusStream.listen((status) {
        _gate = status == AuthStatus.signedIn
            ? AuthGate.signedIn
            : AuthGate.signedOut;
        notifyListeners();
      });
    } else {
      // No Supabase configured → skip the auth screen (dev / preview).
      _gate = AuthGate.signedIn;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    if (SupabaseService.isConfigured) {
      await AuthService.signOut();
    }
    _gate = AuthGate.signedOut;
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
