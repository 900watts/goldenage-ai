// =====================================================================
// GoldenAge AI — AMap Service
// =====================================================================
// Wrapper around the AutoNavi (高德地图) REST API. Provides:
//   - Reverse geocoding of the device's current location.
//   - "Around search" POI lookup (hospitals, pharmacies, parks, etc).
//
// Falls back to a small static fixture set when AMAP_API_KEY is
// missing so the UI is still testable offline.
// =====================================================================

import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

import '../../core/constants.dart';

class AmapPoi {
  const AmapPoi({
    required this.id,
    required this.name,
    required this.address,
    required this.distance,
    required this.location,
  });
  final String id;
  final String name;
  final String address;
  final int distance; // metres
  final ({double lat, double lng}) location;
}

class AmapService {
  AmapService._();

  static const _base = 'https://restapi.amap.com/v3/place/around';

  /// Resolve the device's current location.
  static Future<Position> currentPosition() async {
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 10),
      ),
    );
  }

  /// Search for nearby POIs of a given kind.
  /// [kind] ∈ { 'hospital' | 'pharmacy' | 'park' | 'supermarket' }
  static Future<List<AmapPoi>> nearby(String kind) async {
    if (AppConstants.amapApiKey.isEmpty) return _offlineFixture(kind);
    try {
      final pos = await currentPosition();
      final type = _typeFor(kind);
      final uri = Uri.parse(
        '$_base?key=${AppConstants.amapApiKey}'
        '&location=${pos.longitude},${pos.latitude}'
        '&types=$type&radius=3000&offset=20&extensions=base',
      );
      final res = await http.get(uri).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) return _offlineFixture(kind);
      final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      final pois = (data['pois'] as List?) ?? const [];
      return pois.map((p) {
        final loc = (p['location'] as String? ?? '').split(',');
        return AmapPoi(
          id: p['id'] as String,
          name: p['name'] as String? ?? '',
          address: p['address'] as String? ?? '',
          distance: int.tryParse(p['distance'] as String? ?? '0') ?? 0,
          location: (
            lat: double.tryParse(loc.getOrNull(1) ?? '') ?? pos.latitude,
            lng: double.tryParse(loc.getOrNull(0) ?? '') ?? pos.longitude,
          ),
        );
      }).toList();
    } catch (_) {
      return _offlineFixture(kind);
    }
  }

  static String _typeFor(String kind) {
    switch (kind) {
      case 'hospital':
        return '090100';
      case 'pharmacy':
        return '090200';
      case 'park':
        return '110100';
      case 'supermarket':
        return '060100';
      default:
        return '090100';
    }
  }

  static List<AmapPoi> _offlineFixture(String kind) {
    const presets = {
      'hospital': [
        AmapPoi(id: 'h1', name: '协和医院', address: '东单北大街9号', distance: 800,
            location: (lat: 39.913, lng: 116.418)),
        AmapPoi(id: 'h2', name: '同仁医院', address: '崇文门内大街8号', distance: 1500,
            location: (lat: 39.918, lng: 116.412)),
      ],
      'pharmacy': [
        AmapPoi(id: 'p1', name: '老百姓大药房', address: '前门西大街12号', distance: 300,
            location: (lat: 39.901, lng: 116.395)),
        AmapPoi(id: 'p2', name: '同仁堂药店', address: '大栅栏街24号', distance: 650,
            location: (lat: 39.897, lng: 116.393)),
      ],
      'park': [
        AmapPoi(id: 'k1', name: '中山公园', address: '中华路4号', distance: 1200,
            location: (lat: 39.911, lng: 116.391)),
      ],
      'supermarket': [
        AmapPoi(id: 's1', name: '物美超市', address: '前门大街18号', distance: 400,
            location: (lat: 39.898, lng: 116.397)),
      ],
    };
    return presets[kind] ?? const [];
  }
}
