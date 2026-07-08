// =====================================================================
// GoldenAge AI — Router Service
// =====================================================================
// Singleton go_router instance with a StatefulShellRoute for the four
// primary tabs (Home, Map, Finance, Profile) and standalone routes for
// secondary screens (News, Scam, Guardian, Medication, Auth).
//
// The AI bubble overlay wraps the entire app via [AiBubbleOverlay].
// =====================================================================

import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../features/finance/finance_screen.dart';
import '../../features/guardian/guardian_screen.dart';
import '../../features/map/map_screen.dart';
import '../../features/medication/medication_screen.dart';
import '../../features/news/news_screen.dart';
import '../../features/scam/scam_screen.dart';
import '../../providers/auth_state_provider.dart';
import '../../screens/auth/auth_screen.dart';
import '../../screens/home/home_screen.dart';
import '../../screens/profile/profile_screen.dart';
import '../app_shell.dart';
import '../widgets/ai_bubble/ai_bubble.dart';

class RouterService {
  RouterService._();

  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static final GoRouter router = GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      // Auth gate: if Supabase is configured and user is signed out,
      // redirect to /auth (unless already there).
      final auth = Provider.of<AuthStateProvider>(context, listen: false);
      final isAuthRoute = state.matchedLocation == '/auth';
      if (auth.gate == AuthGate.signedOut && !isAuthRoute) {
        return '/auth';
      }
      if (auth.gate == AuthGate.signedIn && isAuthRoute) {
        return '/';
      }
      return null;
    },
    routes: [
      // ---- Primary tabs (bottom nav) ----
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AiBubbleOverlay(child: MainShell(navigationShell: navigationShell));
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (_, __) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/map',
                builder: (_, __) => const MapScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/finance',
                builder: (_, __) => const FinanceScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (_, __) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // ---- Secondary screens (pushed on top of the shell) ----
      GoRoute(
        path: '/news',
        builder: (_, __) => AiBubbleOverlay(child: const NewsScreen()),
      ),
      GoRoute(
        path: '/scam',
        builder: (_, __) => AiBubbleOverlay(child: const ScamScreen()),
      ),
      GoRoute(
        path: '/guardian',
        builder: (_, __) => AiBubbleOverlay(child: const GuardianScreen()),
      ),
      GoRoute(
        path: '/medication',
        builder: (_, __) => AiBubbleOverlay(child: const MedicationScreen()),
      ),

      // ---- Auth (no AI bubble, no bottom nav) ----
      GoRoute(
        path: '/auth',
        builder: (_, __) => const AuthScreen(),
      ),
    ],
  );
}
