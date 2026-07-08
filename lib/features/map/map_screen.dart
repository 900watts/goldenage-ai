// =====================================================================
// GoldenAge AI — Map Screen (AMap integration)
// =====================================================================
// Senior-friendly map showing nearby Hospitals, Pharmacies, Parks,
// Supermarkets. The AI can query POIs via "What pharmacies are open
// near me?" by reading the [AmapService] cache.
//
// Phase 4 wiring:
//   - amap_flutter_map for the map widget (or a webview fallback).
//   - AMap Web REST API for "around search" POI queries.
//   - geolocator for the current location.
// =====================================================================

import 'package:flutter/material.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../widgets/labeled_icon_card.dart';
import 'amap_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});
  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late Future<List<AmapPoi>> _future;
  String _filter = 'hospital';

  @override
  void initState() {
    super.initState();
    _future = AmapService.nearby(_filter);
  }

  void _reload(String kind) {
    setState(() {
      _filter = kind;
      _future = AmapService.nearby(kind);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.mapTitle),
      ),
      body: SafeArea(
        child: Column(
          children: [
          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                _chip(l.mapHospitals, 'hospital', Icons.local_hospital),
                const SizedBox(width: 8),
                _chip(l.mapPharmacies, 'pharmacy', Icons.local_pharmacy),
                const SizedBox(width: 8),
                _chip(l.mapParks, 'park', Icons.park),
                const SizedBox(width: 8),
                _chip(l.mapSupermarkets, 'supermarket', Icons.shopping_cart),
              ],
            ),
          ),
          // Map placeholder (real widget lands in Phase 4)
          Expanded(
            flex: 3,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
              ),
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.map, size: 64, color: AppColors.primary),
                  const SizedBox(height: 12),
                  Text(l.mapLocating, style: theme.textTheme.bodyLarge),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // POI list
          Expanded(
            flex: 4,
            child: FutureBuilder<List<AmapPoi>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final items = snap.data ?? const [];
                if (items.isEmpty) {
                  return Center(
                    child: Text(l.mapAskAiNearby,
                        style: theme.textTheme.bodyLarge),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final p = items[i];
                    return LabeledIconCard(
                      icon: Icons.place,
                      title: p.name,
                      subtitle: '${p.address}  ·  ${(p.distance / 1000).toStringAsFixed(1)} km',
                      gradient: AppGradients.teal,
                      onTap: () {},
                    );
                  },
                );
              },
            ),
          ),
        ],
        ),
      ),
    );
  }

  Widget _chip(String label, String kind, IconData icon) {
    final active = _filter == kind;
    return ChoiceChip(
      avatar: Icon(icon, size: 18, color: active ? Colors.white : AppColors.primary),
      label: Text(label, style: TextStyle(color: active ? Colors.white : AppColors.text, fontSize: 16, fontWeight: FontWeight.w600)),
      selected: active,
      selectedColor: AppColors.primary,
      backgroundColor: Colors.white,
      side: const BorderSide(color: AppColors.border),
      onSelected: (_) => _reload(kind),
    );
  }
}
