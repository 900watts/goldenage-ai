import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants.dart';

/// Controls the global text scale factor — the backbone of
/// **Big Text Mode**.
///
/// Big Text Mode is ACTIVE BY DEFAULT per the project spec.
/// When enabled, body text scales to 18–24pt minimum and all
/// UI text grows proportionally via [MediaQuery.textScaleFactor].
class TextScaleProvider extends ChangeNotifier {
  TextScaleProvider._(this._bigTextMode, this._isDark);
  static TextScaleProvider? _instance;

  bool _bigTextMode;
  bool _isDark;

  /// Whether Big Text Mode is currently active.
  bool get bigTextMode => _bigTextMode;

  /// Whether dark mode is currently active.
  bool get isDark => _isDark;

  /// The MediaQuery text scale factor derived from [bigTextMode].
  ///
  /// Big Text ON  → 1.5× (turns 16pt body into ~24pt)
  /// Big Text OFF → 1.0× (default)
  double get textScaleFactor => _bigTextMode ? 1.5 : 1.0;

  /// Brightness derived from [isDark].
  Brightness get brightness =>
      _isDark ? Brightness.dark : Brightness.light;

  /// Initialize from persisted prefs.
  static Future<TextScaleProvider> create() async {
    if (_instance != null) return _instance!;
    final prefs = await SharedPreferences.getInstance();
    final bigText =
        prefs.getBool(_bigTextKey) ?? AppConstants.bigTextModeDefault;
    final dark = prefs.getBool(_darkKey) ?? false;
    _instance = TextScaleProvider._(bigText, dark);
    return _instance!;
  }

  /// Toggle Big Text Mode on/off. Persists and notifies.
  Future<void> toggleBigText() async {
    _bigTextMode = !_bigTextMode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_bigTextKey, _bigTextMode);
    notifyListeners();
  }

  /// Toggle dark mode. Persists and notifies.
  Future<void> toggleDark() async {
    _isDark = !_isDark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_darkKey, _isDark);
    notifyListeners();
  }

  static const String _bigTextKey = 'big_text_mode';
  static const String _darkKey = 'dark_mode';
}
