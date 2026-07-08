// =====================================================================
// GoldenAge AI — Guardian Screen
// =====================================================================
// Senior-friendly family pairing. The elder sees their list of linked
// guardians; a new invite generates a QR code (or short code) for the
// family member to scan with the same app.
// =====================================================================

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/colors.dart';
import '../../core/l10n_ext.dart';
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
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (SupabaseService.isConfigured) {
        _guardians = await GuardianService.myGuardians();
      } else {
        _guardians = _devFixture();
      }
    } catch (e) {
      _error = '$e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
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
          content: SizedBox(
            width: 220,
            child: QrImageView(
              data: 'goldenage://pair/${link.pairToken}',
              version: QrVersions.auto,
              size: 200,
            ),
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
                  icon: Icons.qr_code_2,
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
            icon: Icons.qr_code_2,
            style: BigButtonStyle.ghost,
            onPressed: _createInvite,
          ),
        ],
        ),
      ),
    );
  }
}
