import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants.dart';

/// Manages the app locale with **instant** CN/EN switching.
///
/// Persists the user's choice to [SharedPreferences] so the language
/// survives app restarts. Default locale is Simplified Chinese (`zh`)
/// per the project spec.
class LocaleProvider extends ChangeNotifier {
  LocaleProvider._(this._locale);
  static LocaleProvider? _instance;

  Locale _locale;

  /// Current locale. Defaults to `zh` (Simplified Chinese).
  Locale get locale => _locale;

  /// Whether the current locale is Chinese.
  bool get isZh => _locale.languageCode == 'zh';

  /// Initialize from persisted prefs (or fall back to the default `zh`).
  static Future<LocaleProvider> create() async {
    if (_instance != null) return _instance!;
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_prefKey) ?? AppConstants.defaultLocale;
    _instance = LocaleProvider._(Locale(code));
    return _instance!;
  }

  /// Instantly switch between Chinese and English.
  /// Persists the choice and notifies all listeners.
  Future<void> toggle() async {
    final next = isZh ? 'en' : 'zh';
    await setLocale(next);
  }

  /// Set an explicit locale code (`zh` or `en`).
  Future<void> setLocale(String code) async {
    if (code != 'zh' && code != 'en') return;
    if (code == _locale.languageCode) return;
    _locale = Locale(code);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, code);
    notifyListeners();
  }

  static const String _prefKey = 'app_locale';
}
