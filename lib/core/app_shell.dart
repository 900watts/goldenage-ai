import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/locale_provider.dart';
import '../core/colors.dart';
import '../core/l10n_ext.dart';
import '../widgets/language_toggle_button.dart';

/// The main app shell with a bottom navigation bar.
///
/// Wraps the four primary destinations (Home, Map, Finance, Me) with
/// a [StatefulNavigationShell] so each branch keeps its own state.
/// Secondary screens (News, Scam, Guardian, Medication) are pushed
/// on top of this shell.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final localeProvider = context.watch<LocaleProvider>();

    final titles = [
      l.navHome,
      l.mapTitle,
      l.financeTitle,
      l.profileTitle,
    ];

    final items = [
      BottomNavigationBarItem(
        icon: const Icon(Icons.home_outlined),
        activeIcon: const Icon(Icons.home),
        label: l.navHome,
      ),
      BottomNavigationBarItem(
        icon: const Icon(Icons.map_outlined),
        activeIcon: const Icon(Icons.map),
        label: l.navMap,
      ),
      BottomNavigationBarItem(
        icon: const Icon(Icons.trending_up_outlined),
        activeIcon: const Icon(Icons.trending_up),
        label: l.navFinance,
      ),
      BottomNavigationBarItem(
        icon: const Icon(Icons.person_outline),
        activeIcon: const Icon(Icons.person),
        label: l.navMe,
      ),
    ];

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        items: items,
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemSize: 24,
        selectedFontSize: 14,
        unselectedFontSize: 14,
      ),
    );
  }
}
