import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:provider/provider.dart';

import 'ai/llm_service.dart';
import 'ai/soul_persona.dart';
import 'ai/tools/ai_tools.dart';
import 'core/constants.dart';
import 'core/services/router_service.dart';
import 'providers/auth_state_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/text_scale_provider.dart';
import 'theme/app_theme.dart';

/// Root widget for GoldenAge AI.
///
/// Wires together:
/// - [AuthStateProvider]   → gates the app behind Supabase Auth.
/// - [LocaleProvider]      → drives CN/EN switching across the whole tree.
/// - [TextScaleProvider]   → drives Big Text Mode + dark mode.
/// - Generated [AppLocalizations] for all UI strings.
/// - [AppTheme] (light/dark, high-contrast, cream backgrounds).
/// - go_router for in-app navigation.
/// - AI bubble overlay (Phase 3) wraps every screen.
class GoldenAgeApp extends StatefulWidget {
  const GoldenAgeApp({super.key});

  @override
  State<GoldenAgeApp> createState() => _GoldenAgeAppState();
}

class _GoldenAgeAppState extends State<GoldenAgeApp> {
  @override
  void initState() {
    super.initState();
    // Register AI tool-calling handlers (idempotent).
    ensureAiToolsRegistered();
    // Warm up the SOUL.md persona + LLM service.
    LlmService.initialize();
  }

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final textScaleProvider = context.watch<TextScaleProvider>();
    final auth = context.watch<AuthStateProvider>();

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: AppConstants.appName,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: textScaleProvider.isDark ? ThemeMode.dark : ThemeMode.light,
      routerConfig: RouterService.router,

      // Localization
      locale: localeProvider.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,

      // Big Text Mode: scale all text globally.
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(textScaleProvider.textScaleFactor),
          ),
          child: child!,
        );
      },
    );
  }
}
