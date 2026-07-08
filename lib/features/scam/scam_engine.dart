// =====================================================================
// GoldenAge AI — Anti-Scam Engine
// =====================================================================
// Pure-Dart heuristics + LLM-judge. Phase 5 ships the local rule
// engine (regex matchers for known scam patterns). Phase 4 layers
// the LLM judge on top to deliver nuanced reasoning.
// =====================================================================

enum ScamVerdict { safe, caution, danger }

class ScamAnalysis {
  const ScamAnalysis({
    required this.verdict,
    required this.confidence,
    required this.reasons,
    required this.advice,
  });
  final ScamVerdict verdict;
  final double confidence; // 0..1
  final List<String> reasons;
  final String advice;
}

class ScamEngine {
  ScamEngine._();

  static const _dangerPatterns = [
    '中奖', '中大奖', '恭喜您', '领奖', '领取奖品',
    '免费送', '零元购', '点击链接领取', '立即领取',
    '银行卡号', '验证码', '密码', '转账', '汇款',
    '安全账户', '资金清查', '涉嫌洗钱', '通缉',
    '高额回报', '稳赚不赔', '内幕消息', '一夜暴富',
  ];

  static const _cautionPatterns = [
    '客服', '退款', '退货', '订单异常', '账户异常',
    '升级', '激活', '认证', '积分兑换',
    'http://', 'bit.ly', 'tinyurl',
  ];

  static ScamAnalysis analyze(String input) {
    final lower = input.toLowerCase();
    final reasons = <String>[];
    var dangerScore = 0;
    var cautionScore = 0;

    for (final p in _dangerPatterns) {
      if (lower.contains(p.toLowerCase())) {
        dangerScore += 2;
        reasons.add('命中高危关键词「$p」');
      }
    }
    for (final p in _cautionPatterns) {
      if (lower.contains(p.toLowerCase())) {
        cautionScore += 1;
        reasons.add('命中可疑关键词「$p」');
      }
    }

    // Phone number: 11-digit run, repeated or premium prefixes.
    final phoneMatches = RegExp(r'1[3-9]\d{9}').allMatches(input);
    if (phoneMatches.isNotEmpty) {
      cautionScore += phoneMatches.length;
      reasons.add('包含中国大陆手机号');
    }

    // URL detection
    final urlMatches = RegExp(r'https?://[^\s]+').allMatches(input);
    if (urlMatches.isNotEmpty) {
      cautionScore += urlMatches.length;
      reasons.add('包含链接');
    }

    ScamVerdict v;
    double conf;
    String advice;
    if (dangerScore >= 2) {
      v = ScamVerdict.danger;
      conf = 0.85 + (dangerScore * 0.02).clamp(0, 0.1);
      advice = '极可能是诈骗。请立即删除此信息，不要点击任何链接，不要转账或告知验证码。';
    } else if (cautionScore >= 2 || dangerScore == 1) {
      v = ScamVerdict.caution;
      conf = 0.6 + (cautionScore * 0.05).clamp(0, 0.3);
      advice = '信息中存在可疑内容，请先核实。切勿透露个人信息或转账。';
    } else {
      v = ScamVerdict.safe;
      conf = 0.7;
      advice = '未发现明显风险。但仍请保持警惕，陌生信息不要轻信。';
    }

    return ScamAnalysis(
      verdict: v,
      confidence: conf.clamp(0, 0.99),
      reasons: reasons.isEmpty ? const ['无命中规则'] : reasons,
      advice: advice,
    );
  }
}
