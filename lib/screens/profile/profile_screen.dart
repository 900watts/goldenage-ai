import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../providers/auth_state_provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/text_scale_provider.dart';
import '../../widgets/big_button.dart';
import '../../widgets/language_toggle_button.dart';

/// The "Me" / profile screen — also home to accessibility settings.
///
/// Exposes:
/// - Language toggle (CN/EN).
/// - Big Text Mode toggle (default ON).
/// - Dark mode toggle.
/// - Profile fields (wired to Supabase user data).
/// - Logout (wired to AuthService.signOut()).
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    final locale = context.watch<LocaleProvider>();
    final textScale = context.watch<TextScaleProvider>();

    return Scaffold(
      appBar: AppBar(title: Text(l.profileTitle)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Avatar + name
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppColors.primary,
                    child: const Icon(Icons.person,
                        size: 48, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  Text('王爷爷', style: theme.textTheme.headlineSmall),
                  Text('138****8888', style: theme.textTheme.bodyMedium),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Accessibility section
            Text(l.profileAccessibility, style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            Card(
              child: Column(
                children: [
                  SwitchListTile(
                    title: Text(locale.isZh
                        ? l.themeBigTextOn
                        : l.themeBigTextOff),
                    value: textScale.bigTextMode,
                    onChanged: (_) => textScale.toggleBigText(),
                    secondary: const Icon(Icons.text_increase,
                        color: AppColors.primary),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: Text(l.themeDarkMode),
                    value: textScale.isDark,
                    onChanged: (_) => textScale.toggleDark(),
                    secondary: const Icon(Icons.dark_mode_outlined,
                        color: AppColors.primary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Language section
            Text(l.profileLanguage, style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.language, color: AppColors.primary),
                title: Text(locale.isZh ? '简体中文' : 'English'),
                trailing: LanguageToggleButton(
                  isZh: locale.isZh,
                  onToggle: () => locale.toggle(),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Profile fields
            Text(l.profileName, style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.person_outline,
                        color: AppColors.primary),
                    title: Text(l.profileName),
                    subtitle: const Text('王爷爷'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.phone_outlined,
                        color: AppColors.primary),
                    title: Text(l.profilePhone),
                    subtitle: const Text('138****8888'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.contact_emergency,
                        color: AppColors.cta),
                    title: Text(l.profileEmergencyContact),
                    subtitle: const Text('王小明 · 139****1234'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            BigButton(
              label: l.profileLogout,
              icon: Icons.logout,
              style: BigButtonStyle.ghost,
              onPressed: () => _signOut(context),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _signOut(BuildContext context) async {
    final l = context.l10n;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.profileLogout),
        content: Text('${l.profileLogout}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l.commonCancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: Text(l.commonConfirm),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final auth = context.read<AuthStateProvider>();
    await auth.signOut();

    if (context.mounted) {
      context.go('/auth');
    }
  }
}
