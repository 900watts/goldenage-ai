import 'package:flutter/material.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';

/// Placeholder for the AMap-powered location screen (Phase 4).
///
/// Phase 4 will integrate the AMap/高德 SDK to display nearby
/// hospitals, pharmacies, parks, and supermarkets, and expose
/// coordinate + POI data to the AI agent's context toolset.
class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.map_outlined,
                size: 80, color: AppColors.primary.withValues(alpha: 0.4)),
            const SizedBox(height: 20),
            Text(l.mapTitle, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              '高德地图 SDK · Phase 4',
              style: theme.textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              alignment: WrapAlignment.center,
              children: [
                _PoiChip(icon: Icons.local_hospital, label: l.mapHospitals),
                _PoiChip(icon: Icons.local_pharmacy, label: l.mapPharmacies),
                _PoiChip(icon: Icons.park, label: l.mapParks),
                _PoiChip(icon: Icons.store, label: l.mapSupermarkets),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PoiChip extends StatelessWidget {
  const _PoiChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 20, color: AppColors.primary),
      label: Text(label),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
    );
  }
}
