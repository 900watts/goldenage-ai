/// Application-wide constants for GoldenAge AI.
class AppConstants {
  AppConstants._();

  /// App name shown in the UI.
  static const String appName = '银龄智伴（GoldenAge AI）';

  /// Minimum touch target size in logical pixels (spec: ≥64×64).
  static const double minTouchTarget = 64.0;

  /// Minimum body text size when Big Text Mode is active (spec: 18–24pt).
  static const double bigTextBodyMin = 18.0;
  static const double bigTextBodyMax = 24.0;

  /// Default body text size when Big Text Mode is off.
  static const double normalBody = 16.0;

  /// Big Text Mode is ACTIVE BY DEFAULT per spec.
  static const bool bigTextModeDefault = true;

  /// Supported locale codes.
  static const String defaultLocale = 'zh';
  static const List<String> supportedLocales = ['zh', 'en'];

  /// Supabase project URL (configure in Phase 2).
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  /// Supabase anon key (configure in Phase 2).
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  /// AMap API key (configure in Phase 4).
  static const String amapApiKey = String.fromEnvironment(
    'AMAP_API_KEY',
    defaultValue: '',
  );

  /// Persistent Supabase session flag (Keep Me Logged In by default).
  static const String kSupabasePersistSession = 'true';

  /// OpenAI API key (configure in Phase 3 for the AI bubble).
  static const String openaiApiKey = String.fromEnvironment(
    'OPENAI_API_KEY',
    defaultValue: '',
  );

  /// Optional Anthropic key (set OPENAI_PROVIDER=anthropic to swap).
  static const String anthropicApiKey = String.fromEnvironment(
    'ANTHROPIC_API_KEY',
    defaultValue: '',
  );

  /// 'openai' (default) or 'anthropic'.
  static const String openaiProvider = String.fromEnvironment(
    'OPENAI_PROVIDER',
    defaultValue: 'openai',
  );
}
