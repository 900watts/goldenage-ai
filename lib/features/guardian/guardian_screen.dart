// =====================================================================
// GoldenAge AI — Guardian Screen
// =====================================================================
// Senior-friendly family pairing. The elder sees their list of linked
// guardians; a new invite generates a personalized pairing ID that the
// family member types into the same app to pair.
// =====================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
import '../../services/crisis_service.dart';
import '../../services/guardian_service.dart';
import '../../services/supabase_service.dart';
import '../../widgets/big_button.dart';
import '../../widgets/labeled_icon_card.dart';

class GuardianScreen extends StatefulWidget {
  const GuardianScreen({super.key});
  @override
  State<GuardianScreen> createState() => _GuardianScreenState();
}

class _GuardianScreenState extends State<GuardianScreen> {
  List<GuardianLink> _guardians = [];
  List<CrisisEvent> _crises = [];
  final Map<String, String> _elderNames = {};
  final List<RealtimeChannel> _crisisChannels = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in _crisisChannels) c.unsubscribe();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    // Tear down any previous crisis channels before re-subscribing.
    for (final c in _crisisChannels) c.unsubscribe();
    _crisisChannels.clear();
    _crises.clear();
    _elderNames.clear();
    try {
      if (SupabaseService.isConfigured) {
        _guardians = await GuardianService.myGuardians();
        // Guardian side: watch every elder this user guards for live SOS.
        final elders = await GuardianService.myElders();
        for (final e in elders) {
          _elderNames[e.elderId] = e.elderName;
          _crises.addAll(await GuardianService.unresolvedCrises(e.elderId));
          _crisisChannels.add(
            GuardianService.watchCrises(e.elderId, (_) => _reloadCrises()),
          );
        }
        _crises.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      } else {
        _guardians = _devFixture();
      }
    } catch (e) {
      _error = '$e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Re-pull unresolved crises across all watched elders (called on every
  /// realtime change so the banner stays live without a manual refresh).
  Future<void> _reloadCrises() async {
    if (!SupabaseService.isConfigured) return;
    try {
      final elders = await GuardianService.myElders();
      final all = <CrisisEvent>[];
      for (final e in elders) {
        _elderNames[e.elderId] = e.elderName;
        all.addAll(await GuardianService.unresolvedCrises(e.elderId));
      }
      all.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      if (mounted) setState(() => _crises = all);
    } catch (_) {
      // non-fatal
    }
  }

  Future<void> _resolveCrisis(String id) async {
    try {
      await CrisisService.resolve(id);
      await _reloadCrises();
    } catch (_) {}
  }

  Future<void> _createInvite() async {
    if (!SupabaseService.isConfigured) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('预览模式：未连接 Supabase。配对功能在配置后启用。'),
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    final phone = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final ctrl = TextEditingController();
        return AlertDialog(
          title: const Text('输入守护者手机号'),
          content: TextField(
            controller: ctrl,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(hintText: '+8613900000000'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消')),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: const Text('生成'),
            ),
          ],
        );
      },
    );
    if (phone == null || phone.isEmpty) return;
    try {
      final link = await GuardianService.createPairInvite(
        guardianUserId: phone, // simplified — real flow needs a user lookup
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('配对邀请已创建'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('把这个专属配对 ID 发给您的家人，让对方在同一个应用里输入即可与您配对。'),
              const SizedBox(height: 16),
              SelectableText(
                link.pairToken,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                icon: const Icon(Icons.copy),
                label: const Text('复制 ID'),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: link.pairToken));
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
                    content: Text('专属配对 ID 已复制'),
                    behavior: SnackBarBehavior.floating,
                  ));
                },
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx), child: const Text('完成')),
          ],
        ),
      );
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('创建失败：$e'),
          backgroundColor: AppColors.danger,
        ));
      }
    }
  }

  List<GuardianLink> _devFixture() => const [
        GuardianLink(
          id: 'demo1',
          elderId: 'elder-1',
          elderName: '王爷爷',
          pairToken: 'demo-token',
          pairAccepted: true,
        ),
      ];

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.guardianTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 28),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
          if (_crises.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.danger,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('🚨 紧急求助！',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ..._crises.map(
                    (c) => Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _elderNames[c.elderId]?.isNotEmpty == true
                                      ? _elderNames[c.elderId]!
                                      : '您的长辈',
                                  style: const TextStyle(color: Colors.white),
                                ),
                                if (c.aiReason != null && c.aiReason!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      c.aiReason!,
                                      style: const TextStyle(
                                          color: Colors.white70, fontSize: 13),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () => _resolveCrisis(c.id),
                            child: const Text('✓ 已响应',
                                style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Text(l.guardianTitle, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(l.guardianAskHowIsMom, style: theme.textTheme.bodyLarge),
          const SizedBox(height: 20),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            Text(_error!, style: const TextStyle(color: AppColors.danger))
          else if (_guardians.isEmpty)
            Column(
              children: [
                const SizedBox(height: 60),
                const Icon(Icons.family_restroom, size: 80, color: AppColors.muted),
                const SizedBox(height: 12),
                Text(l.guardianNotPaired, style: theme.textTheme.bodyLarge),
                const SizedBox(height: 20),
                BigButton(
                  label: l.guardianShowQr,
                  icon: Icons.badge,
                  onPressed: _createInvite,
                ),
              ],
            )
          else
            ..._guardians.map(
              (g) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: LabeledIconCard(
                  icon: Icons.person,
                  title: g.elderName.isEmpty ? l.guardianPaired : g.elderName,
                  subtitle: g.pairAccepted ? l.guardianPaired : l.guardianNotPaired,
                  gradient: g.pairAccepted ? AppGradients.primary : AppGradients.gold,
                  onTap: () {},
                ),
              ),
            ),
          const SizedBox(height: 20),
          BigButton(
            label: l.guardianShowQr,
            icon: Icons.badge,
            style: BigButtonStyle.ghost,
            onPressed: _createInvite,
          ),
        ],
        ),
      ),
    );
  }
}
