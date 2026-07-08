// =====================================================================
// GoldenAge AI — Voice-to-Text Service
// =====================================================================
// Senior-friendly speech-to-text wrapper. Uses `speech_to_text` on
// Android/iOS and `dart:html` Web Speech API on Windows. Tapping the
// bubble's mic button toggles listening; partial results stream into
// the input field so the user can see what was heard before sending.
// =====================================================================

import 'dart:async';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class VoiceService {
  VoiceService._();
  static final stt.SpeechToText _speech = stt.SpeechToText();
  static bool _initialized = false;
  static bool _listening = false;

  /// Whether the underlying speech engine is currently listening.
  static bool get listening => _listening;

  /// One-time init. Safe to call repeatedly.
  static Future<bool> init() async {
    if (_initialized) return true;
    _initialized = await _speech.initialize(
      onError: (e) => _listening = false,
      onStatus: (s) {
        if (s == stt.SpeechToText.doneStatus ||
            s == stt.SpeechToText.notListeningStatus) {
          _listening = false;
        }
      },
    );
    return _initialized;
  }

  /// Start listening. Streams partial and final results via [onResult].
  /// Pass [localeId] like 'zh_CN' or 'en_US' (defaults to system).
  static Future<void> start({
    required void Function(String text, {required bool finalResult}) onResult,
    String localeId = 'zh_CN',
  }) async {
    if (!_initialized) await init();
    if (!_initialized) {
      onResult('语音识别不可用，请检查麦克风权限。', finalResult: true);
      return;
    }
    _listening = true;
    await _speech.listen(
      onResult: (r) => onResult(r.recognizedWords, finalResult: r.finalResult),
      localeId: localeId,
      listenOptions: stt.SpeechListenOptions(
        partialResults: true,
        cancelOnError: true,
      ),
    );
  }

  /// Stop listening and finalize the current utterance.
  static Future<void> stop() async {
    if (_listening) {
      await _speech.stop();
      _listening = false;
    }
  }

  /// Cancel without emitting a final result.
  static Future<void> cancel() async {
    if (_listening) {
      await _speech.cancel();
      _listening = false;
    }
  }
}
