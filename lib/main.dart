// =====================================================================
// GoldenAge AI — Entry Point
// =====================================================================
// Initialises (in order):
//   1. Supabase client  — reads URL + anon key from --dart-define.
//   2. LocaleProvider   — loads persisted CN/EN preference (zh default).
//   3. TextScaleProvider — loads Big Text / dark mode prefs (Big Text ON).
//   4. AuthStateProvider — listens to onAuthStateChange for the gate.
//   5. SOUL.md persona + LLM tools (handled inside GoldenAgeApp).
//
// Then runs the app, which uses these providers to render the right
// first screen (splash → auth → main shell with AI bubble).
// =====================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'providers/auth_state_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/text_scale_provider.dart';
import 'services/supabase_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  await SupabaseService.initialize();

  final localeProvider = await LocaleProvider.create();
  final textScaleProvider = await TextScaleProvider.create();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<LocaleProvider>.value(value: localeProvider),
        ChangeNotifierProvider<TextScaleProvider>.value(
          value: textScaleProvider,
        ),
        ChangeNotifierProvider<AuthStateProvider>(
          create: (_) => AuthStateProvider(),
        ),
      ],
      child: const GoldenAgeApp(),
    ),
  );
}
