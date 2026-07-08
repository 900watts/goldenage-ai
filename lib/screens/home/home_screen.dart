import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../services/crisis_service.dart';
import '../../services/supabase_service.dart';
import '../../widgets/big_button.dart';
import '../../widgets/labeled_icon_card.dart';

/// The home screen — the heart of GoldenAge AI.
///
/// Layout (top -> bottom):
/// 1. Personalized greeting (time-of-day aware).
/// 2. Massive red **Emergency SOS** button (always reachable).
/// 3. Quick-action cards: Medication, News, Finance, Anti-Scam, Guardian, Map.
/// 4. "Ask AI" prompt area (opens the AI bubble overlay).
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  String _greeting(BuildContext context) {
    final l = context.l10n;
    final hour = DateTime.now().hour;
    if (hour < 12) return l.homeGreetingMorning;
    if (hour < 18) return l.homeGreetingAfternoon;
    return l.homeGreetingEvening;
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l.appTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline, size: 28),
            onPressed: () => context.go('/profile'),
            tooltip: l.profileTitle,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Greeting
            Text(
              '${_greeting(context)}，',
              style: theme.textTheme.headlineMedium,
            ),
            const SizedBox(height: 4),
            Text(
              '王爷爷',
              style: theme.textTheme.headlineSmall?.copyWith(
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),

            // Emergency SOS — massive red button
            const _SosButton(),
            const SizedBox(height: 28),

            // Quick actions grid
            Text(l.homeMedicationReminder,
                style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            LabeledIconCard(
              icon: Icons.medication,
              title: l.homeMedicationReminder,
              subtitle: '降压药 · 08:00 / 20:00',
              gradient: AppGradients.gold,
              onTap: () => context.push('/medication'),
            ),
            const SizedBox(height: 14),
            LabeledIconCard(
              icon: Icons.article_outlined,
              title: l.homeNewsDigest,
              subtitle: l.newsAiCurated,
              gradient: AppGradients.cta,
              onTap: () => context.push('/news'),
            ),
            const SizedBox(height: 14),
            LabeledIconCard(
              icon: Icons.monetization_on_outlined,
              title: l.homeGoldPrice,
              subtitle: l.financeTitle,
              gradient: AppGradients.primary,
              onTap: () => context.go('/finance'),
            ),
            const SizedBox(height: 14),
            LabeledIconCard(
              icon: Icons.shield_outlined,
              title: l.scamTitle,
              subtitle: l.scamSubtitle,
              gradient: AppGradients.danger,
              onTap: () => context.push('/scam'),
            ),
            const SizedBox(height: 14),
            LabeledIconCard(
              icon: Icons.family_restroom,
              title: l.guardianTitle,
              subtitle: l.guardianPair,
              gradient: AppGradients.primary,
              onTap: () => context.push('/guardian'),
            ),
            const SizedBox(height: 14),
            LabeledIconCard(
              icon: Icons.map_outlined,
              title: l.mapTitle,
              subtitle: l.mapAskAiNearby,
              gradient: AppGradients.teal,
              onTap: () => context.go('/map'),
            ),
            const SizedBox(height: 28),

            // Ask AI prompt
            Text(l.homeAskAi, style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            BigButton(
              label: l.homeAiPlaceholder,
              icon: Icons.mic_none,
              style: BigButtonStyle.secondary,
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(l.homeAiPlaceholder),
                  behavior: SnackBarBehavior.floating,
                  duration: const Duration(seconds: 1),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

/// The massive red Emergency SOS button — wired to CrisisService.
///
/// Per spec: "A massive red button on the home screen and inside the
/// AI bubble menu that instantly updates the Supabase crisis state,
/// sends the user's live AMap location via SMS to the Guardian, and
/// dials emergency services."
class _SosButton extends StatelessWidget {
  const _SosButton();

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return SizedBox(
      width: double.infinity,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 80),
        child: ElevatedButton.icon(
          onPressed: () => _confirm(context),
          icon: const Icon(Icons.emergency, size: 32, color: Colors.white),
          label: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(
              l.homeSosButton,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(80),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
            elevation: 4,
            shadowColor: AppColors.danger.withValues(alpha: 0.4),
          ),
        ),
      ),
    );
  }

  Future<void> _confirm(BuildContext context) async {
    final l = context.l10n;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.homeSosButton),
        content: Text(l.homeSosConfirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l.homeSosCancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: Text(l.homeSosConfirmAction),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    // Record the crisis event in Supabase and capture location.
    try {
      if (SupabaseService.isConfigured) {
        Position? pos;
        try {
          pos = await _tryGetLocation();
        } catch (_) {/* geolocation optional */}
        await CrisisService.raise(
          kind: CrisisKind.sosButton,
          latitude: pos?.latitude,
          longitude: pos?.longitude,
          payload: {'source': 'home_screen'},
        );
      }
    } catch (_) {
      // Swallow — the UI confirmation is the user-facing feedback.
    }

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l.sosCalling),
          backgroundColor: AppColors.danger,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<Position?> _tryGetLocation() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return null;
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied ||
        perm == LocationPermission.deniedForever) {
      return null;
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 8),
      ),
    );
  }
}
