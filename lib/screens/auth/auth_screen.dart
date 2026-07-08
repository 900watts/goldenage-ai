// =====================================================================
// GoldenAge AI — Auth Screen (Phase 2 — Supabase Auth wired)
// =====================================================================
// Senior-friendly phone OTP flow:
//   1. Enter phone number (international E.164, e.g. +8613800000000).
//   2. Tap "发送验证码" → AuthService.sendPhoneOtp() dispatches SMS.
//   3. Enter 6-digit code → AuthService.verifyPhoneOtp() completes sign-in.
//   4. On success, AuthStateProvider flips to signedIn → MainShell appears.
//
// "Keep Me Logged In" is the default behavior — Supabase persists the
// session token to local secure storage. Biometric (Face/Fingerprint /
// Windows Hello) is a future enhancement that can gate the *re-entry*
// of the persisted session.
// =====================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../services/auth_service.dart';
import '../../services/supabase_service.dart';
import '../../widgets/big_button.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _phoneCtrl = TextEditingController(text: '+86');
  final _otpCtrl = TextEditingController();
  bool _otpSent = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 8) {
      setState(() => _error = '请输入完整的手机号');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (SupabaseService.isConfigured) {
        await AuthService.sendPhoneOtp(phone);
      }
      setState(() => _otpSent = true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.authOtpSent),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      setState(() => _error = '发送失败：$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyOtp() async {
    final phone = _phoneCtrl.text.trim();
    final token = _otpCtrl.text.trim();
    if (token.length != 6) {
      setState(() => _error = '请输入 6 位验证码');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (SupabaseService.isConfigured) {
        await AuthService.verifyPhoneOtp(phone: phone, token: token);
        // AuthStateProvider listens to onAuthStateChange and rebuilds.
      } else {
        // Dev preview — just flip the gate manually via a no-op.
        await Future.delayed(const Duration(milliseconds: 300));
        if (mounted) {
          // ignore: use_build_context_synchronously
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('预览模式：未连接 Supabase。请配置 --dart-define=SUPABASE_URL'),
            behavior: SnackBarBehavior.floating,
          ));
        }
      }
    } catch (e) {
      setState(() => _error = '验证失败：$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.cta],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.favorite,
                      size: 48, color: Colors.white),
                ),
                const SizedBox(height: 28),
                Text(l.authTitle,
                    style: theme.textTheme.headlineMedium,
                    textAlign: TextAlign.center),
                const SizedBox(height: 10),
                Text(l.authSubtitle,
                    style: theme.textTheme.bodyLarge,
                    textAlign: TextAlign.center),
                const SizedBox(height: 36),
                TextField(
                  controller: _phoneCtrl,
                  enabled: !_otpSent && !_busy,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(fontSize: 20),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.phone_outlined, size: 26),
                    labelText: l.authPhonePlaceholder,
                  ),
                ),
                const SizedBox(height: 16),
                if (_otpSent) ...[
                  TextField(
                    controller: _otpCtrl,
                    enabled: !_busy,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      LengthLimitingTextInputFormatter(6),
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                    style: const TextStyle(
                      fontSize: 26,
                      letterSpacing: 8,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                    decoration: InputDecoration(
                      labelText: l.authOtpPlaceholder,
                    ),
                  ),
                  const SizedBox(height: 20),
                  BigButton(
                    label: l.authVerify,
                    icon: Icons.check_circle_outline,
                    busy: _busy,
                    onPressed: _verifyOtp,
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: _busy
                        ? null
                        : () => setState(() {
                              _otpSent = false;
                              _otpCtrl.clear();
                            }),
                    child: Text(l.authResend),
                  ),
                ] else
                  BigButton(
                    label: l.authSendOtp,
                    icon: Icons.send_outlined,
                    busy: _busy,
                    onPressed: _sendOtp,
                  ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline,
                            color: AppColors.danger),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _error!,
                            style: const TextStyle(
                                color: AppColors.danger, fontSize: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 12),
                BigButton(
                  label: l.authBiometric,
                  icon: Icons.fingerprint,
                  style: BigButtonStyle.ghost,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text('Phase 5 · Biometric (Face/Fingerprint / Windows Hello)'),
                      behavior: SnackBarBehavior.floating,
                    ));
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle,
                        size: 20, color: AppColors.safe),
                    const SizedBox(width: 8),
                    Text(l.authKeepLoggedIn,
                        style: theme.textTheme.bodyLarge),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
