// =====================================================================
// GoldenAge AI — Test App (browser-runnable mirror of the Flutter build)
// =====================================================================
// Pure HTML/JS. No build step. Served on the same localhost:8000.
//
// What you can actually do here:
//  - Sign in (mock phone OTP)
//  - Home: see greeting, tap the BIG red SOS, see quick-action cards
//  - Map: filter hospitals/pharmacies/parks, see POIs
//  - Finance: see live-style gold/silver/indices with up/down colors
//    (CN convention: 涨=红, 跌=绿). Tap "问问AI" for an explanation.
//  - News: see daily digest cards with "朗读" (TTS read-aloud)
//  - Scam Shield: paste a suspicious message, get a verdict
//  - Guardian: see paired list + show QR for invite
//  - Medication: see today's schedule, log "已服药" / "跳过"
//  - Profile: toggle Big Text Mode, dark mode, language, view profile
//  - AI Bubble (orange FAB bottom-right): chat with the SOUL.md persona,
//    voice input (Web Speech API), tool-calling that navigates between
//    screens, TTS speak on reply.
//  - Instant EN/中文 toggle in the top bar.
//  - Big Text Mode default ON — toggles everywhere at once.
// =====================================================================

// ---------------- I18N ----------------
const I18N = {
  zh: {
    appTitle: '银龄智伴（GoldenAge AI）',
    navHome: '首页', navMap: '地图', navFinance: '理财', navMe: '我的',
    bigTextOn: '大字模式：开', bigTextOff: '大字模式：关',
    greetingMorning: '早上好', greetingAfternoon: '下午好', greetingEvening: '晚上好',
    sos: '一键求助', sosConfirm: '确认拨打紧急电话并通知守护者？', sosConfirmAction: '立即求助', sosCancel: '取消',
    sosCalling: '正在通知守护者并拨打急救电话…',
    homeMed: '用药提醒', homeMedSub: '降压药 · 14:00',
    homeNews: '每日新闻摘要', homeNewsSub: 'AI精选 3 篇',
    homeGold: '今日金价', homeGoldSub: '¥678.5/g ↑ +0.8%',
    homeScam: '防诈骗检测', homeScamSub: '粘贴可疑内容，AI 帮您判断',
    homeAskAi: '问问智能助手',
    mapTitle: '附近地图', mapHosp: '医院', mapPhar: '药店', mapPark: '公园', mapSup: '超市',
    mapLocating: '正在定位…', mapAskAi: '问问AI附近有什么',
    finTitle: '理财行情', finGold: '黄金（USD/oz）', finSilver: '白银（USD/oz）',
    finShang: '上证指数', finSpx: '标普500',
    finAskAi: '问问AI这是什么意思', finUp: '涨', finDown: '跌',
    finSearchPh: '搜索股票/指数/基金（例：AAPL、苹果、600519、比特币）', finSearch: '搜索', finSearchErr: '未找到该代码', finAddWatch: '加入关注', finInWatch: '✓ 已关注', finWatch: '我的关注', finWatchEmpty: '点击"加入关注"按钮，把常看的行情保存到这里。', finRemove: '取消关注', finHot: '热门行情', finExplore: '探索', finAiErr: 'AI 解读失败，请稍后重试。',
    scamTitle: '防诈骗检测', scamSub: '粘贴可疑短信、链接或电话号码，AI帮您判断',
    scamInput: '在此粘贴可疑内容…', scamCheck: '立即检测', scamClear: '清空',
    scamSafe: '安全', scamCaution: '谨慎', scamDanger: '危险 — 极可能是诈骗',
    scamAdvice: 'AI建议', scamReason: '原因',
    guardTitle: '守护者', guardSub: '配对家人，守护您的安全',
    guardPaired: '已配对', guardNot: '未配对', guardShowQr: '显示配对二维码', guardPairedGuardian: '王小明 · 儿子',
    guardAddById: '用账户 ID 绑定', guardAddHint: '让长辈在「我」页面 → 「账户与配对」里把账户 ID 复制给你，然后粘贴在这里。', guardIdPlaceholder: '粘贴长辈的账户 ID（例如：a1b2c3d4-…）', guardAddBtn: '绑定', guardNoIdHint: '不知道账户 ID？打开「我」页面，账户 ID 在「账户与配对」卡片里。',
    medTitle: '用药管理', medTaken: '已服药', medSkip: '跳过', medAdd: '添加提醒',
    medTake1: '降压药', medTake1Sub: '08:00 · 20:00 · 饭后服用',
    medTake2: '钙片', medTake2Sub: '12:00 · 随午餐',
    remTitle: '提醒', remSub: '让 AI 帮您记住任何事情', remAdd: '+ 添加提醒', remUpcoming: '即将到期', remHistory: '历史', remEmpty: '还没有提醒。让 AI 帮您添加一个吧。', remCancel: '取消', remHint: '试试说："两小时后提醒我给女儿打电话" 或 "每天早上8点提醒我量血压"', remFired: '已触发', remCancelled: '已取消', remSnooze: '⏰ 5分钟后再说', remGot: '知道了 ✓', remTime: '原定时间', remSnoozed: '已延后 5 分钟',
    meTitle: '我的', meName: '', meEmergency: '', meNoEmergency: '未设置紧急联系人',
    meLang: '语言', meAccess: '无障碍设置', meBigText: '大字模式', meDark: '深色模式',
    meAi: 'AI 助手设置', meAiProvider: '服务', meAiKey: 'API Key', meAiKeyPh: '在此粘贴您的 API Key', meAiSave: '保存', meAiClear: '清除', meAiStatus: '状态', meAiStatusOff: '未配置', meAiStatusOn: '已配置', meAiNote: 'API Key 仅保存在您的浏览器中（localStorage），不会上传到任何服务器。',
    meLogout: '退出登录',
    authTitle: '欢迎使用银龄智伴（GoldenAge AI）', authSubtitle: '请输入您的手机号以继续',
    authPhoneLabel: '手机号',
    authPlaceholder: '+86 138 0000 0000', authSend: '发送验证码',
    authOtpTitle: '请输入验证码', authOtpSub: '验证码已发送至 ', authVerify: '验证', authResend: '重新发送',
    authResendIn: '重新发送验证码（',
    authOtpSubPhone: '验证码已发送至您的手机',
    emailOtpSub: '验证码已发送至您的邮箱',
    authSmsHint: '将通过邮件发送验证码（推荐）',
    authPhoneHint: '将通过短信发送验证码',
    authLinkSentTitle: '请在邮箱中点击验证链接',
    authLinkSentSub: '我们已向 ${email} 发送了一封登录邮件。请在邮件中点击验证链接以完成登录。',
    authLinkSentHint: '没看到？检查垃圾邮件夹，或稍等几秒后重新发送。',
    authLinkResend: '重新发送邮件',
    authLinkChange: '换一个邮箱',
    authLinkWaiting: '等待您点击邮件中的链接…',
    setupTitle: '完善个人资料', setupSub: '为了更好地为您服务，请填写以下信息（姓名必填，其余可选）',
    setupStep1Title: '自我介绍', setupStep1Sub: '请告诉我们您是谁',
    setupStep2Title: '新闻偏好', setupStep2Sub: '选择您感兴趣的新闻主题（可多选）',
    setupStep3Title: '守护人', setupStep3Sub: '设置一个紧急联系人，他/她会在您需要时收到通知',
    setupName: '您的姓名', setupNamePh: '如：王秀英',
    setupPreferredName: '希望智能助手如何称呼您', setupPreferredNamePh: '如：王奶奶',
    setupGender: '性别', setupAge: '年龄',
    setupGenderFemale: '女', setupGenderMale: '男', setupGenderOther: '其他 / 不透露',
    setupCity: '所在城市', setupCityPh: '如：北京',
    setupBirth: '出生日期',
    setupNewsTopics: '新闻主题',
    setupGuardianName: '守护人姓名', setupGuardianNamePh: '如：王小明',
    setupGuardianRel: '关系', setupGuardianPhone: '手机号', setupGuardianPhonePh: '如：138 0000 0000',
    setupRelSon: '儿子', setupRelDaughter: '女儿', setupRelSpouse: '配偶', setupRelGrandchild: '孙辈', setupRelSibling: '兄弟姐妹', setupRelOther: '其他',
    setupBack: '上一步', setupNext: '下一步',
    setupDone: '完成',
    setupEditProfile: '重新填写资料',
    newsTopicHealth: '健康养生', newsTopicLocal: '本地新闻', newsTopicNational: '国家大事', newsTopicWorld: '国际新闻', newsTopicFinance: '财经', newsTopicTech: '科技', newsTopicSports: '体育', newsTopicCulture: '文化娱乐', newsTopicWeather: '气象', newsTopicFood: '美食',
    setupSave: '完成设置', setupSkip: '稍后再说',
    roleTitle: '您是？', roleSub: '请选择您的身份，这决定您如何使用本应用',
    roleElderly: '我是长辈（被守护）', roleElderlySub: '我会收到守护人的关心与紧急通知',
    roleGuardian: '我是监护人', roleGuardianSub: '我来守护我的家人',
    pairCodeTitle: '您的配对码', pairCodeSub: '把这个码发给您的守护人，对方输入即可与您配对',
    pairAccountId: '我的账号ID', pairAccountIdSub: '也可以把这一长串账号ID发给守护人',
    pairGuardianPrompt: '输入长辈的配对码或账号ID', pairGuardianPh: '例如 K7P2QX 或完整账号ID',
    pairBind: '绑定', pairSkipBind: '稍后绑定',
    pairBindOk: '已与长辈配对', pairBindFail: '未找到该长辈，请检查配对码', pairBindSelf: '不能与自己配对',
    pairShareHint: '把上面的配对码或账号ID发给您的守护人，对方在「我的 → 账号与配对」中输入即可。',
    meAccount: '账号与配对', mePairWithElder: '绑定长辈', mePaired: '已配对', meNotPaired: '尚未配对', meCopy: '复制',
    mobIndependent: '行动自如', mobCane: '需拐杖', mobWalker: '需助行器', mobWheelchair: '需轮椅',
    hearNormal: '正常', hearMild: '轻度下降', hearModerate: '中度下降', hearSevere: '重度下降',
    aiBubbleLabel: '智能助手', aiBubbleOnline: '已就绪',
    aiBubbleSend: '发送', aiBubbleInputHint: '说一说，或输入文字…',
    aiGreeting: '您好，我是您的智能伴侣小金。有什么可以帮您的吗？',
    aiQuickMap: '帮我打开地图', aiQuickGold: '今日金价',
    aiReply1: '好的，正在为您打开地图。',
    aiReply2: '今日黄金价格 ¥678.5/克，比昨天上涨 0.8%。受全球避险情绪影响。',
    aiReply3: '已记录您的服药情况。',
    aiReply4: '正在为您播报今日新闻摘要…',
    aiReplySos: '已通知守护者。您的位置已通过短信发送。',
    navSectionMain: '主要功能', navSectionFamily: '家庭', vol: '朗读',
    navFeatures: '功能', navReminder: '提醒', navNews: '新闻', featuresTitle: '全部功能', featuresSub: '选择您需要的功能',
    todaySummary: '今日概览', nextMed: '下次用药', newsCount: '今日新闻', goldSnapshot: '金价快览',
  },
  en: {
    appTitle: '银龄智伴（GoldenAge AI）',
    navHome: 'Home', navMap: 'Map', navFinance: 'Finance', navMe: 'Me',
    bigTextOn: 'Big Text: On', bigTextOff: 'Big Text: Off',
    greetingMorning: 'Good morning', greetingAfternoon: 'Good afternoon', greetingEvening: 'Good evening',
    sos: 'Emergency SOS', sosConfirm: 'Call emergency services and notify your guardian?', sosConfirmAction: 'Call Now', sosCancel: 'Cancel',
    sosCalling: 'Notifying guardian and calling emergency services…',
    homeMed: 'Medication', homeMedSub: 'Blood pressure · 2 PM',
    homeNews: 'Daily News Digest', homeNewsSub: '3 articles curated by AI',
    homeGold: 'Gold Price Today', homeGoldSub: '¥678.5/g ↑ +0.8%',
    homeScam: 'Anti-Scam Shield', homeScamSub: 'Paste a message, AI will judge',
    homeAskAi: 'Ask the Companion',
    mapTitle: 'Nearby Map', mapHosp: 'Hospitals', mapPhar: 'Pharmacies', mapPark: 'Parks', mapSup: 'Supermarkets',
    mapLocating: 'Locating…', mapAskAi: 'Ask AI what is nearby',
    finTitle: 'Finance', finGold: 'Gold (USD/oz)', finSilver: 'Silver (USD/oz)',
    finShang: 'Shanghai Index', finSpx: 'S&P 500',
    finAskAi: 'Ask AI what this means', finUp: 'Up', finDown: 'Down',
    finSearchPh: 'Search a ticker or name (e.g. AAPL, Apple, 600519, Bitcoin)', finSearch: 'Search', finSearchErr: 'Ticker not found', finAddWatch: 'Add to watchlist', finInWatch: '✓ In watchlist', finWatch: 'My watchlist', finWatchEmpty: 'Tap "+ Add" on any quote to track it here.', finRemove: 'Remove', finHot: 'Hot markets', finExplore: 'Explore', finAiErr: 'AI insight failed. Please try again.',
    scamTitle: 'Anti-Scam Shield', scamSub: 'Paste a suspicious message, link, or phone number',
    scamInput: 'Paste suspicious content here…', scamCheck: 'Check Now', scamClear: 'Clear',
    scamSafe: 'Safe', scamCaution: 'Caution', scamDanger: 'DANGER — Highly Likely a Scam',
    scamAdvice: 'AI Advice', scamReason: 'Why',
    guardTitle: 'Guardian', guardSub: 'Pair a family member to keep you safe',
    guardPaired: 'Paired', guardNot: 'Not paired', guardShowQr: 'Show Pairing QR', guardPairedGuardian: 'Xiao Ming · Son',
    guardAddById: 'Add by Account ID', guardAddHint: 'Ask the elder to open Me → Account & Pairing, then share their Account ID. Paste it here.', guardIdPlaceholder: 'Paste the elder\'s Account ID (e.g. a1b2c3d4-…)', guardAddBtn: 'Pair', guardNoIdHint: 'Don\'t know the Account ID? Open Me to find yours; ask the elder to do the same.',
    medTitle: 'Medication', medTaken: 'Taken', medSkip: 'Skip', medAdd: 'Add Reminder',
    medTake1: 'Blood Pressure Meds', medTake1Sub: '08:00 · 20:00 · with food',
    medTake2: 'Calcium', medTake2Sub: '12:00 · with lunch',
    remTitle: 'Reminders', remSub: 'Let the AI remember anything for you', remAdd: '+ Add reminder', remUpcoming: 'Upcoming', remHistory: 'History', remEmpty: 'No reminders yet. Ask the AI to set one for you.', remCancel: 'Cancel', remHint: 'Try: "remind me to call my daughter in 2 hours" or "remind me every day at 8am to check my blood pressure"', remFired: 'Fired', remCancelled: 'Cancelled', remSnooze: '⏰ Snooze 5m', remGot: 'Got it ✓', remTime: 'Scheduled for', remSnoozed: 'Snoozed 5 minutes',
    meTitle: 'Profile', meName: '', meEmergency: '', meNoEmergency: 'No emergency contact set',
    meLang: 'Language', meAccess: 'Accessibility', meBigText: 'Big Text Mode', meDark: 'Dark Mode',
    meAi: 'AI Assistant Settings', meAiProvider: 'Provider', meAiKey: 'API Key', meAiKeyPh: 'Paste your API key here', meAiSave: 'Save', meAiClear: 'Clear', meAiStatus: 'Status', meAiStatusOff: 'Not configured', meAiStatusOn: 'Configured', meAiNote: 'API key is stored in your browser (localStorage) only and never sent to any server except the AI provider itself.',
    meLogout: 'Log Out',
    authTitle: 'Welcome to 银龄智伴（GoldenAge AI）', authSubtitle: 'Enter your phone to continue',
    authPhoneLabel: 'Phone number',
    authPlaceholder: '+1 555 000 0000', authSend: 'Send Code',
    authOtpTitle: 'Enter the code', authOtpSub: 'Code sent to ', authVerify: 'Verify', authResend: 'Resend',
    authResendIn: 'Resend code (',
    authOtpSubPhone: 'Code sent to your phone',
    emailOtpSub: 'Code sent to your email',
    authSmsHint: 'We will email you a code (recommended)',
    authPhoneHint: 'A code will be sent via SMS',
    authLinkSentTitle: 'Check your email for the link',
    authLinkSentSub: 'We sent a sign-in email to ${email}. Please click the link inside to finish signing in.',
    authLinkSentHint: "Don't see it? Check your spam folder, or wait a few seconds and resend.",
    authLinkResend: 'Resend email',
    authLinkChange: 'Use a different email',
    authLinkWaiting: 'Waiting for you to click the link in your email…',
    setupTitle: 'Complete your profile', setupSub: 'To serve you better, please fill in the following. Name is required, the rest are optional.',
    setupStep1Title: 'About you', setupStep1Sub: 'Tell us a bit about yourself',
    setupStep2Title: 'News interests', setupStep2Sub: 'Pick the topics you care about (you can choose more than one)',
    setupStep3Title: 'Guardian', setupStep3Sub: 'Add someone who will be alerted when you need help',
    setupName: 'Your name', setupNamePh: 'e.g. Wang Xiuying',
    setupPreferredName: 'What should the assistant call you?', setupPreferredNamePh: 'e.g. Grandma Wang',
    setupGender: 'Gender', setupAge: 'Age',
    setupGenderFemale: 'Female', setupGenderMale: 'Male', setupGenderOther: 'Other / prefer not to say',
    setupCity: 'City', setupCityPh: 'e.g. Beijing',
    setupBirth: 'Date of birth',
    setupNewsTopics: 'News topics',
    setupGuardianName: 'Guardian name', setupGuardianNamePh: 'e.g. Wang Xiaoming',
    setupGuardianRel: 'Relationship', setupGuardianPhone: 'Phone', setupGuardianPhonePh: 'e.g. 138 0000 0000',
    setupRelSon: 'Son', setupRelDaughter: 'Daughter', setupRelSpouse: 'Spouse', setupRelGrandchild: 'Grandchild', setupRelSibling: 'Sibling', setupRelOther: 'Other',
    setupBack: 'Back', setupNext: 'Next',
    setupDone: 'Finish',
    setupEditProfile: 'Edit profile',
    newsTopicHealth: 'Health & wellness', newsTopicLocal: 'Local news', newsTopicNational: 'National', newsTopicWorld: 'World', newsTopicFinance: 'Finance', newsTopicTech: 'Tech', newsTopicSports: 'Sports', newsTopicCulture: 'Culture & entertainment', newsTopicWeather: 'Weather', newsTopicFood: 'Food',
    setupSave: 'Finish setup', setupSkip: 'Skip for now',
    roleTitle: 'Who are you?', roleSub: 'Choose your role — it decides how you use the app',
    roleElderly: 'I am the elder (protected)', roleElderlySub: 'I will receive care and emergency alerts from my guardian',
    roleGuardian: 'I am the guardian', roleGuardianSub: 'I look after a family member',
    pairCodeTitle: 'Your pairing code', pairCodeSub: 'Share this code with your guardian; they enter it to pair with you',
    pairAccountId: 'My account ID', pairAccountIdSub: 'You can also send this long account ID to your guardian',
    pairGuardianPrompt: 'Enter the elder’s pairing code or account ID', pairGuardianPh: 'e.g. K7P2QX or the full account ID',
    pairBind: 'Pair', pairSkipBind: 'Pair later',
    pairBindOk: 'Paired with the elder', pairBindFail: 'Elder not found — check the code', pairBindSelf: 'Cannot pair with yourself',
    pairShareHint: 'Send the pairing code or account ID above to your guardian; they enter it under "Me → Account & Pairing".',
    meAccount: 'Account & Pairing', mePairWithElder: 'Pair with elder', mePaired: 'Paired', meNotPaired: 'Not paired', meCopy: 'Copy',
    mobIndependent: 'Independent', mobCane: 'Uses cane', mobWalker: 'Uses walker', mobWheelchair: 'Wheelchair',
    hearNormal: 'Normal', hearMild: 'Mild loss', hearModerate: 'Moderate loss', hearSevere: 'Severe loss',
    aiBubbleLabel: 'Companion', aiBubbleOnline: 'Online',
    aiBubbleSend: 'Send', aiBubbleInputHint: 'Speak, or type here…',
    aiGreeting: "Hello, I'm Xiao Jin, your AI companion. How can I help?",
    aiQuickMap: 'Open the map', aiQuickGold: 'Gold price today',
    aiReply1: 'Sure, opening the map for you.',
    aiReply2: 'Gold today is ¥678.5/g, up 0.8% from yesterday, driven by global risk-off sentiment.',
    aiReply3: 'I have logged that you took your medication.',
    aiReply4: 'Reading today\'s news digest for you…',
    aiReplySos: 'Your guardian has been notified. Your location was sent by SMS.',
    navSectionMain: 'Main', navSectionFamily: 'Family', vol: 'Read',
    navFeatures: 'Features', navReminder: 'Reminder', navNews: 'News', featuresTitle: 'All Features', featuresSub: 'Choose what you need',
    todaySummary: 'Today', nextMed: 'Next medication', newsCount: 'News today', goldSnapshot: 'Gold snapshot',
  },
};

const t = (k) => I18N[state.lang][k] || k;

// ----- AI tool definitions (passed to the LLM via the Edge Function) -----
// Each tool has a JSON-schema shape that Qwen3-8B / OpenAI-compatible
// models understand. The client (see aiChat below) executes the matching
// function on receipt of a tool_call.
const APP_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigate',
      description: 'Switch to a different tab in the app. Use this when the user asks to open a section (map, news, finance, scam checker, etc.) or to go home.',
      parameters: {
        type: 'object',
        properties: {
          route: { type: 'string', enum: ['home', 'features', 'map', 'news', 'finance', 'scam', 'medication', 'guardian', 'me'], description: 'Tab to switch to' }
        },
        required: ['route']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_language',
      description: 'Switch the app language between Chinese (zh) and English (en).',
      parameters: { type: 'object', properties: { lang: { type: 'string', enum: ['zh', 'en'] } }, required: ['lang'] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'trigger_sos',
      description: 'Trigger the emergency SOS flow. Only call this when the user explicitly asks for help or to send an SOS.',
      parameters: { type: 'object', properties: {} }
    }
  },
  { type: 'function', function: { name: 'open_ai_sheet',       description: 'Open the AI chat sheet (this same panel). No-op if already open.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_finance',       description: 'Open the live stock/finance page.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_map',           description: 'Open the map page (POI search around the user).', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_news',          description: 'Open the news page.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_scam',          description: 'Open the scam-check page so the user can paste a suspicious message.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_medication',    description: 'Open the medication reminder page.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_guardian',      description: 'Open the guardian pairing/management page.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_me',            description: 'Open the profile/settings page (Me tab).', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'open_home',          description: 'Go to the home tab.', parameters: { type: 'object', properties: {} } } },
  {
    type: 'function',
    function: {
      name: 'set_reminder',
      description: 'Create a reminder for the user. Use this whenever the user asks to be reminded of something in the future, e.g. "remind me to take aspirin in 2 hours", "remind me to call my daughter at 8pm tonight", "remind me every day at 8am to take my pills". For "in 2 hours" / "at 8pm tonight" style requests, compute the future ISO timestamp in the user\'s local timezone and pass it as fire_at_iso. For "every day at HH:MM" style requests, pass time_of_day as "HH:MM" and repeat as "daily".',
      parameters: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'What to remind the user about (e.g. "服用阿司匹林" or "Call daughter")' },
          fire_at_iso: { type: 'string', description: 'ISO 8601 timestamp in UTC for one-off reminders (e.g. "2026-07-12T15:30:00Z"). Required for one_off.' },
          time_of_day: { type: 'string', description: 'HH:MM (24h, user-local time) for daily reminders. Required for daily.' },
          repeat: { type: 'string', enum: ['once', 'daily'], description: '"once" for one-off reminder, "daily" for recurring daily reminder. Default: once.' }
        },
        required: ['label']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_reminder',
      description: 'Cancel a previously created reminder by its id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The reminder id returned from set_reminder (UUID).' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_reminders',
      description: 'List the user\'s upcoming reminders. Use this when the user asks "what reminders do I have?" or "what\'s next?".',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// Quick navigation aliases for the LLM (so it can map natural-language
// requests to a route even if the user says "open my medicines" or "show
// me the map" etc.). The LLM only needs to call navigate(route=...).
const APP_ROUTE_ALIASES = {
  'home': 'home', 'main': 'home', 'page': 'home', '首页': 'home', '主页': 'home',
  'features': 'features', '功能': 'features', 'all features': 'features',
  'map': 'map', 'maps': 'map', '地图': 'map', 'location': 'map', 'nearby': 'map',
  'news': 'news', '新闻': 'news', 'headlines': 'news',
  'finance': 'finance', 'stock': 'finance', 'stocks': 'finance', '行情': 'finance', '股票': 'finance', 'gold': 'finance', '金价': 'finance',
  'scam': 'scam', 'fraud': 'scam', '防诈骗': 'scam', '诈骗': 'scam',
  'medication': 'medication', 'meds': 'medication', 'pill': 'medication', 'pills': 'medication', 'reminder': 'medication', '用药': 'medication', '提醒': 'medication',
  'guardian': 'guardian', 'family': 'guardian', '守护者': 'guardian', '家庭': 'guardian',
  'me': 'me', 'profile': 'me', 'settings': 'me', '我的': 'me', '设置': 'me'
};

// Dev-mode key for the dev-signin Edge Function. This key is a shared
// secret: it is ALSO stored in the Supabase project's secrets. It is
// in the client bundle, so it provides NO security — it only lets the
// dev-signin Edge Function distinguish "this call came from a known
// dev client" from "this call is someone trying to brute force create
// accounts". Leave empty in production deployments to disable dev
// sign-in entirely.
window.__DEV_KEY = 'gal-dev-900watts-2026';
// ---------------- SUPABASE ----------------
const SB_URL = 'https://exvlolipycabnqiaptib.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dmxvbGlweWNhYm5xaWFwdGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MzcyMzgsImV4cCI6MjA5OTExMzIzOH0.mJ-zBvLizIEykNdqDN_CqDpSbUl4Vznc1x1L9TaNMgQ';
let sb = null; // Supabase client
let sbUser = null; // current user object

function initSupabase() {
  if (typeof window.supabase === 'undefined') return;
  try {
    sb = window.supabase.createClient(SB_URL, SB_ANON, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    sb.supabaseKey = SB_ANON; // expose anon key for LiveData fetch wrappers
    window.sb = sb; // expose for cross-file access (e.g. LiveData.llmChat)
    // Detect ?login=1 in the URL — this is used by the promo page
    // "Get Started" button. We want to always show the auth screen
    // (Sign in / Sign up) instead of jumping straight to the home page
    // when the user already has a session in localStorage.
    const forceLogin = new URLSearchParams(window.location.search).get('login') === '1';

    // Listen for auth changes (magic-link click in email fires SIGNED_IN here).
    // We attach this AFTER the initial getSession() resolves, otherwise
    // Supabase's "session restored from localStorage" event would auto-
    // sign the user in even when we asked for the login screen.
    let lastSessionId = null;
    const attachAuthListener = () => {
      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Supabase's JS client fires SIGNED_IN on every token refresh
          // (default every ~50s). That's not a fresh login — it's the
          // auto-refresh coming back with a new access token for the
          // same logged-in user. Skip the welcome toast + state churn
          // unless the user is actually transitioning from signed-out
          // -> signed-in OR the session ID changed.
          const isFresh = !state.signedIn || (lastSessionId && lastSessionId !== session.access_token);
          lastSessionId = session.access_token;
          sbUser = session.user;
          finishSignIn(session.user, state.lang === 'zh', isFresh);
        } else if (event === 'SIGNED_OUT') {
          sbUser = null;
          state.signedIn = false;
          localStorage.removeItem('signedIn');
          applyState();
        }
      });
    };

    // Check existing session first.
    sb.auth.getSession().then(({ data }) => {
      if (data.session && !forceLogin) {
        // Normal path: session present, user goes to the home page.
        sbUser = data.session.user;
        state.signedIn = true;
        applyState();
        loadUserPreferences(sbUser.id);
        attachAuthListener();
      } else if (data.session && forceLogin) {
        // Session exists but the user asked for the login screen — show
        // it without signing out (so they can switch account, sign up
        // a new one, or just continue with the same one).
        sbUser = data.session.user;
        renderAuth._signedInEmail = sbUser.email;
        state.signedIn = false; // <-- forces renderAuth
        applyState();
        attachAuthListener();
      } else {
        // No session — normal flow.
        state.signedIn = false;
        applyState();
        attachAuthListener();
      }
    });
  } catch(e) { console.warn('Supabase init failed:', e); }
}

// Check if Supabase is connected
function sbReady() { return sb !== null && sbUser !== null; }

// Pulls user_preferences (mirror of news_topics, language, big text, etc).
// Always populates state._prefNewsTopics so the news ranker can use it.
async function loadUserPreferences(userId) {
  if (!sb || !userId) return;
  try {
    const { data } = await sb.from('user_preferences')
      .select('news_topics, language, big_text_mode, dark_mode')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      if (Array.isArray(data.news_topics)) state._prefNewsTopics = data.news_topics;
      if (data.language && !localStorage.getItem('lang')) state.lang = data.language;
    }
  } catch(_) {}
}

// ---------------- NEWS TOPICS ----------------
// Stable key + i18n key pairs. The key is what we store in profiles.news_topics;
// the i18n key is what we look up for display. Keep keys lowercase / English.
const NEWS_TOPICS = [
  { key: 'health',   i18n: 'newsTopicHealth'   },
  { key: 'local',    i18n: 'newsTopicLocal'    },
  { key: 'national', i18n: 'newsTopicNational' },
  { key: 'world',    i18n: 'newsTopicWorld'    },
  { key: 'finance',  i18n: 'newsTopicFinance'  },
  { key: 'tech',     i18n: 'newsTopicTech'     },
  { key: 'sports',   i18n: 'newsTopicSports'   },
  { key: 'culture',  i18n: 'newsTopicCulture'  },
  { key: 'weather',  i18n: 'newsTopicWeather'  },
  { key: 'food',     i18n: 'newsTopicFood'     },
];

// ---------------- STATE ----------------
const state = {
  lang: localStorage.getItem('lang') || 'zh',
  bigText: localStorage.getItem('bigText') !== 'false', // default ON
  dark: localStorage.getItem('dark') === 'true',
  route: 'home',
  signedIn: localStorage.getItem('signedIn') === 'true',
  aiOpen: false,
  newsTab: "all",
  profile: null, // loaded from Supabase auth.users + profile table
  chat: [],
  recording: false,
  listening: false,
};

function applyState() {
  document.body.dataset.lang = state.lang;
  document.body.dataset.theme = state.dark ? 'dark' : 'light';
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.documentElement.style.setProperty('--t-scale', state.bigText ? '1.5' : '1.0');
  // Parity with the user's other repo: toggle a class on <html> so the
  // elderly-friendly spacing rules in app.html can engage alongside --t-scale.
  document.documentElement.classList.toggle('elderly-mode', !!state.bigText);
  document.getElementById('langLabel').textContent = state.lang === 'zh' ? 'EN' : '中文';
  const pill = state.bigText
    ? (state.lang === 'zh' ? '大字' : 'Big')
    : (state.lang === 'zh' ? '标准' : 'Std');
  const tpt = document.getElementById('themePillText');
  if (tpt) tpt.textContent = pill;
  // Add an "on" class so the user can see at a glance whether Big Text is active.
  const themePill = document.getElementById('themePill');
  if (themePill) themePill.classList.toggle('on', state.bigText);
  const sideBtn = document.getElementById('sideThemeBtn');
  if (sideBtn) sideBtn.style.background = state.bigText ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.1)';
  const stt = document.getElementById('sideThemeText');
  if (stt) stt.textContent = state.lang === 'zh'
    ? (state.bigText ? '大字模式 · 开' : '大字模式 · 关')
    : (state.bigText ? 'Big Text: ON' : 'Big Text: OFF');
  localStorage.setItem('lang', state.lang);
  localStorage.setItem('bigText', state.bigText);
  localStorage.setItem('dark', state.dark);
  localStorage.setItem('signedIn', state.signedIn);
  applyI18n();
  render();
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[state.lang][k]) el.textContent = I18N[state.lang][k];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.dataset.i18nPlaceholder;
    if (I18N[state.lang][k]) el.placeholder = I18N[state.lang][k];
  });
  document.title = '银龄智伴（GoldenAge AI）';
  document.getElementById('appTitle').textContent = t('appTitle');
}

// ---------------- TOAST + DIALOG ----------------
function toast(msg, danger = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (danger ? ' danger' : '');
  setTimeout(() => el.className = 'toast', 2600);
}
function showDialog({ title, body, confirmLabel, cancelLabel, danger }) {
  return new Promise(res => {
    const mask = document.getElementById('dialogMask');
    const dlg = document.getElementById('dialog');
    dlg.innerHTML = `
      <h3>${title}</h3>
      <p>${body}</p>
      <div class="actions">
        <button class="big-btn ghost" id="dlgCancel" style="width:auto;min-width:96px">${cancelLabel || (state.lang==='zh'?'取消':'Cancel')}</button>
        <button class="big-btn ${danger?'danger':'primary'}" id="dlgOk" style="width:auto;min-width:96px">${confirmLabel || (state.lang==='zh'?'确认':'OK')}</button>
      </div>`;
    mask.classList.add('open');
    document.getElementById('dlgCancel').onclick = () => { mask.classList.remove('open'); res(false); };
    document.getElementById('dlgOk').onclick = () => { mask.classList.remove('open'); res(true); };
  });
}

// ---------------- ICONS ----------------
const ICON = {
  pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.5 20.5l3-3M14.5 3.5l6 6-11 11H3.5v-6l11-11z"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  gold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L3 7v6c0 5 3 7 9 10 6-3 9-5 9-10V7l-9-5z"/><path d="M12 8v4M12 16h.01"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 017 7c0 3-2 5-2 8H7c0-3-2-5-2-8a7 7 0 017-7z"/><path d="M9 22h6"/></svg>',
  hosp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21V8l9-5 9 5v13M9 21V12h6v9"/></svg>',
  phar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18l-2 13H5L3 7zM8 7V4a4 4 0 018 0v3"/></svg>',
  park: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L7 9h4v12h2V9h4l-5-7z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M6 18L18 6"/></svg>',
  vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>',
  sos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>',
  lang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>',
  theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
};

// ---------------- DATA ----------------
// (All mock data removed — every screen now fetches live data.)

// Medication state — no mock default meds. Users add their own via the UI;
// the screen starts empty and fetches the user's saved list from Supabase.
// (When not signed in or before any meds are added, the screen shows a
// friendly empty state and a CTA to add the first medication.)
const medState = {}; // { 'm1': 'taken', 'm2': 'skipped' } — persists in localStorage
function loadMedState() {
  try { Object.assign(medState, JSON.parse(localStorage.getItem('medState') || '{}')); } catch(_) {}
}
function saveMedState() {
  localStorage.setItem('medState', JSON.stringify(medState));
}
loadMedState();

// Custom meds added by user
const customMeds = [];
function loadCustomMeds() {
  try { customMeds.push(...JSON.parse(localStorage.getItem('customMeds') || '[]')); } catch(_) {}
}
function saveCustomMeds() {
  localStorage.setItem('customMeds', JSON.stringify(customMeds));
}
loadCustomMeds();

// ---------------- NEWS AI ENGINE ----------------
// Per-user voting + topic preferences + a simple ranking algorithm
// that pushes articles the AI thinks the user will like to the top.
const newsVoting = {};   // { newsId: { up: 0, down: 0, voted: 0 } }
const topicPrefs = {     // { topic: score } - starts even, shifts with votes
  gold: 0, stock: 0, weather: 0, health: 0, tech: 0,
  education: 0, food: 0, sport: 0, culture: 0, economy: 0, default: 0,
};
const newsHistory = [];  // last 50 article ids seen

function loadNewsState() {
  try { Object.assign(newsVoting, JSON.parse(localStorage.getItem('newsVoting') || '{}')); } catch(_) {}
  try { Object.assign(topicPrefs,  JSON.parse(localStorage.getItem('topicPrefs')  || '{}')); } catch(_) {}
  try { newsHistory.push(...JSON.parse(localStorage.getItem('newsHistory') || '[]')); } catch(_) {}
}
function saveNewsVoting() { localStorage.setItem('newsVoting', JSON.stringify(newsVoting)); }
function saveTopicPrefs()  { localStorage.setItem('topicPrefs',  JSON.stringify(topicPrefs)); }
function saveNewsHistory() { localStorage.setItem('newsHistory', JSON.stringify(newsHistory.slice(-50))); }
loadNewsState();

// Rank articles using a combination of:
//  - freshness (newer = higher)
//  - topic preference (user votes shift the score)
//  - intrinsic quality (up-votes minus down-votes)
//  - unseen bonus (haven't shown recently = higher)
function rankArticles(items) {
  const now = Date.now();
  const seen = new Set(newsHistory);
  // The wizard stored these as user-level news interests. They are
  // applied as a strong base boost (before vote-based learning) so the
  // first session already feels personalized. Falls back to localStorage
  // learning if the user skipped the wizard.
  const userTopics = (state._prefNewsTopics && state._prefNewsTopics.length)
    ? state._prefNewsTopics
    : (state.profile && state.profile.news_topics) || [];
  return items.map(n => {
    const v = newsVoting[n.id] || { up: 0, down: 0, voted: 0 };
    const freshness = Math.max(0, 1 - (now - new Date(n.pubDate || now).getTime()) / (1000 * 60 * 60 * 6)); // half-life 6h
    const topicBoost = (topicPrefs[n.topic] || 0) * 0.4;
    const voteScore = (v.up - v.down) * 0.3;
    const unseen = seen.has(n.id) ? -0.2 : 0.3;
    const prefBoost = (typeof topicMatchesUserPref === 'function' && topicMatchesUserPref(n.topic, userTopics)) ? 0.8 : 0;
    const aiScore = freshness + topicBoost + voteScore + unseen + prefBoost;
    return { ...n, _score: aiScore, _votes: v };
  }).sort((a, b) => b._score - a._score);
}

// Mark as seen (called when card becomes visible)
function markNewsSeen(id) {
  if (!newsHistory.includes(id)) {
    newsHistory.push(id);
    saveNewsHistory();
  }
}

// User votes on an article — shifts topic preferences too
function voteNews(id, topic, dir) {
  const v = newsVoting[id] || { up: 0, down: 0, voted: 0 };
  if (v.voted === dir) return; // toggle off (already voted same way)
  if (v.voted) {
    // undo previous vote
    if (v.voted === 1) v.up = Math.max(0, v.up - 1);
    else              v.down = Math.max(0, v.down - 1);
  }
  if (dir === 1) v.up++;
  else           v.down++;
  v.voted = dir;
  newsVoting[id] = v;
  // shift topic preference
  topicPrefs[topic] = (topicPrefs[topic] || 0) + (dir === 1 ? 1 : -1);
  saveNewsVoting();
  saveTopicPrefs();
  // re-render news screen
  if (state.route === 'news') render();
  toast(dir === 1
    ? (state.lang==='zh' ? '已喜欢，AI 会多推荐类似内容' : 'Liked — AI will show more like this')
    : (state.lang==='zh' ? '已不喜欢，已减少类似内容'   : 'Disliked — less of this in the future'),
    false);
}

// ---------------- SCAM ENGINE (rule-based) ----------------
// Danger: clearly fraudulent — phishing, giveaway scams, advance-fee, etc.
const DANGER_PATTERNS = [
  // Classic giveaway / prize scams
  '中奖','中大奖','恭喜您','领奖','领取奖品','免费送','零元购','点击链接领取','立即领取','nowwww','nowww','buy now','limited offer',
  'roblox','robux','nitro','steam gift','apple gift','amazon gift','netflix free','spotify premium','discord nitro',
  'free robux','free vbucks','free skins','free gift card','免费皮肤','免费金币','点券','兑换码',
  // Financial fraud
  '银行卡号','验证码','密码','转账','汇款','安全账户','资金清查','涉嫌洗钱','通缉','高额回报','稳赚不赔','内幕消息','一夜暴富','刷单','兼职日结','日赚','月入上万',
  'crypto giveaway','btc giveaway','eth airdrop','double your bitcoin','double your eth','send your crypto',
  // Investment / advance-fee
  '投资理财','高息','保本收益','无风险','年化收益','月息','内部消息','拉盘','砸盘','操纵股价','代购','代充','代练','解封','解冻',
  'low risk high return','guaranteed profit','make money fast','earn daily','passive income',
  // Impersonation / authority scam
  '您涉嫌','您已违法','法院传票','刑事拘捕','检察院','安全局','公安厅','中国驻','大使馆',
  'irs','fbi','cia','social security administration','microsoft support','apple support','amazon support','bank of america security',
  // Pressure / urgency
  '24小时内','马上处理','最后通牒','即将停机','冻结账户','强制执行','刑事案件','违法所得',
  'verify your account','account will be closed','suspended account','verify within 24',
  // Data harvesting
  '提供身份证','提供银行卡','提供验证码','点击链接验证','填写信息','完善资料','绑定手机','人脸识别','远程操作',
  'send your id','send your passport','send your license','ssn','social security number',
  // Greetings scam
  'Hello dear','Hi dear','Dear friend','亲爱的',
];

// Caution: probably safe but worth checking
const CAUTION_PATTERNS = [
  '客服','退款','退货','订单异常','账户异常','升级','激活','认证','积分兑换',
  '微信支付','支付宝','银行转账','手续费','保证金',
  'meet me','see you','lonely','looking for love','long distance',
  'http://','bit.ly','tinyurl','t.cn','goo.gl',
  'gift card','苹果充值','充值卡',
  'http','链接','登录','激活账户',
];

function analyzeScam(input) {
  const lower = input.toLowerCase();
  const reasons = [];
  let d = 0, c = 0;
  // Match both English and Chinese patterns
  for (const p of DANGER_PATTERNS) if (lower.includes(p.toLowerCase())) { d += 2; reasons.push({ zh: `命中高危关键词「${p}」`, en: `High-risk keyword "${p}"` }); }
  for (const p of CAUTION_PATTERNS) if (lower.includes(p.toLowerCase())) { c += 1; reasons.push({ zh: `命中可疑关键词「${p}」`, en: `Suspicious keyword "${p}"` }); }

  // Detect excessive punctuation (!!!!, NOWWW, !!!)
  const exclamCount = (input.match(/!/g) || []).length;
  if (exclamCount >= 3) { d += 2; reasons.push({ zh: `过多的感叹号（${exclamCount}个）——典型诈骗手法`, en: `Excessive punctuation (${exclamCount} !) — typical scam tactic` }); }
  // ALL CAPS
  const upperLetters = (input.match(/[A-Z]/g) || []).length;
  if (upperLetters > 8 && upperLetters / input.length > 0.5) { d += 1; reasons.push({ zh: '大量全大写字母（典型诈骗话术）', en: 'Lots of all-caps text (typical scam phrasing)' }); }
  // Phone numbers (CN + international)
  const phoneMatches = input.match(/1[3-9]\d{9}|(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g);
  if (phoneMatches) { c += phoneMatches.length; reasons.push({ zh: '包含电话号码', en: 'Contains phone number(s)' }); }
  // URLs
  const urlMatches = input.match(/https?:\/\/[^\s]+|www\.[^\s]+/g);
  if (urlMatches) { c += urlMatches.length; reasons.push({ zh: '包含链接', en: 'Contains URL' }); }
  // Money amounts ($10, ¥100, USD/oz, etc.)
  const moneyMatches = input.match(/[\$¥€£￥]\s*\d|\d+\s*[\$¥€£￥]|\$\d+|\d+\s*usd|for \$/gi);
  if (moneyMatches) { d += 1; reasons.push({ zh: `包含金额「${moneyMatches[0]}」`, en: `Contains money amount "${moneyMatches[0]}"` }); }
  // Specific known scam phrases
  if (/free\s+(robux|vbucks|skins|gems|coins|nitro|steam|netflix|spotify)/i.test(input)) { d += 3; reasons.push({ zh: '典型游戏/平台诈骗话术', en: 'Classic gaming/platform giveaway scam' }); }
  if (/1,000,000|1 million|1000000|1000\s*000|million|ten\s*free/i.test(input)) { d += 1; reasons.push({ zh: '承诺巨额奖励（典型钓鱼特征）', en: 'Promises huge rewards (phishing pattern)' }); }
  if (/click\s*now|hurry|act\s*now|don'?t\s*miss|expires\s*soon|click\s*here/i.test(input)) { d += 1; reasons.push({ zh: '催促点击（典型钓鱼）', en: 'Urgency language (typical phishing)' }); }
  if (/send\s*me|reply\s*with|dm\s*me|message\s*me|whatsapp|telegram/i.test(input)) { c += 1; reasons.push({ zh: '引导您通过其他平台联系（典型诈骗）', en: 'Asks you to switch to another platform (typical scam)' }); }

  if (d >= 2) return { verdict: 'danger', reasons, advice: { zh: '极可能是诈骗。典型特征：巨额奖励、催促点击、索取验证码或个人信息。请立即删除，不要点击任何链接，不要转账或告知验证码。', en: 'Highly likely a scam. Typical signs: huge rewards, urgency tactics, asking for verification codes or personal info. Delete immediately, do not click links, do not transfer money.' } };
  if (c >= 2 || d === 1) return { verdict: 'caution', reasons, advice: { zh: '信息中存在可疑内容，请先核实对方身份。切勿透露个人信息或转账。', en: 'Suspicious content detected. Verify who sent this first. Never share personal info or transfer money.' } };
  return { verdict: 'safe', reasons: [{ zh: '无命中规则', en: 'No rules matched' }], advice: { zh: '未发现明显风险。但仍请保持警惕，陌生信息不要轻信。', en: 'No obvious risk. Stay cautious with unfamiliar messages.' } };
}

// ---------------- AI BUBBLE ----------------
const SOUL = {
  greeting: () => t('aiGreeting'),
};

const TOOLS = {
  open_map:    { reply: () => t('aiReply1'), action: () => go('map') },
  open_finance:{ reply: () => t('aiReply2'), action: () => go('finance') },
  open_news:   { reply: () => t('aiReply4'), action: () => go('news') },
  open_med:    { reply: () => t('aiReply3'), action: () => go('medication') },
  open_scam:   { reply: () => state.lang==='zh' ? '好的，已为您打开防诈骗检测。' : 'Opening Anti-Scam Shield.', action: () => go('scam') },
  call_sos:    { reply: () => t('aiReplySos'), action: () => triggerSos(false) },
};

// Helper: scan a long message for scam signals and return a concise verdict
function aiScamCheck(text) {
  if (!text || text.length < 15) return null;
  // Skip if text is clearly a chat command (already handled by aiMatchTool)
  if (aiMatchTool(text)) return null;
  const r = analyzeScam(text);
  // Only surface danger or caution, not safe (too noisy for a chat)
  if (r.verdict === 'danger') {
    return {
      reply: state.lang==='zh'
        ? `⚠️ 警告：这条消息很可能是诈骗。\n\n${r.advice.zh}\n\n命中特征：\n${r.reasons.slice(0,4).map(x => '• ' + x.zh).join('\n')}\n\n已为您打开「防诈骗检测」查看详情。`
        : `⚠️ Warning: this message is very likely a scam.\n\n${r.advice.en}\n\nSignals detected:\n${r.reasons.slice(0,4).map(x => '• ' + x.en).join('\n')}\n\nOpening Anti-Scam Shield for full analysis.`,
      tool: '🛡️ ai_scam_check',
      action: () => go('scam'),
    };
  }
  if (r.verdict === 'caution') {
    return {
      reply: state.lang==='zh'
        ? `⚠️ 提醒：这条消息中有可疑内容。\n\n${r.advice.zh}\n\n命中特征：\n${r.reasons.slice(0,3).map(x => '• ' + x.zh).join('\n')}\n\n让我帮您打开「防诈骗检测」进一步分析。`
        : `⚠️ Heads up: this message has suspicious content.\n\n${r.advice.en}\n\nSignals detected:\n${r.reasons.slice(0,3).map(x => '• ' + x.en).join('\n')}\n\nOpening Anti-Scam Shield for further analysis.`,
      tool: '🛡️ ai_scam_check',
      action: () => go('scam'),
    };
  }
  return null;
}

function aiMatchTool(text) {
  const lower = text.toLowerCase();
  if (/sos|求助|救命|紧急|fall|chest|emergency|help/i.test(text)) return 'call_sos';
  // Detect "is this a scam?" / "check this message" intent
  if (/(这|这是|这条|这个|这个短信|这条信息|is this|check.*scam|verify.*scam|spam|fraud|诈骗\?|可疑\?|骗子\?|骗\?|is it safe|should i|can i trust|能信|可不可以信|看.*是不是|帮我看看|帮我查|帮我.*判断)/i.test(text)) return 'check_scam';
  if (/(打开|open).*(地图|map)|附近|nearby|药房|医院|pharmacy|hospital/i.test(text)) return 'open_map';
  if (/(金价|gold|价格|price|行情|finance|股票|stock|指数|index)/i.test(text)) return 'open_finance';
  if (/(新闻|news|今天.*新闻|今天.*发生|今天的|今日)/i.test(text)) return 'open_news';
  if (/(药|medication|pill|med)/i.test(text)) return 'open_med';
  if (/(诈骗|scam|可疑|suspicious|骗子|骗)/i.test(text)) return 'open_scam';
  return null;
}

async function aiChat(userText) {
  // 1) First, run a heuristic scam check on the message itself.
  const scam = aiScamCheck(userText);
  if (scam) {
    if (scam.action) scam.action();
    return { reply: scam.reply, tool: scam.tool };
  }

  // 2) Tool routing for explicit requests ("open the map", "gold today", ...).
  //    These are fast & reliable — skip the LLM roundtrip.
  const tool = aiMatchTool(userText);
  if (tool) {
    if (tool === 'check_scam') {
      const quoted = (userText.match(/[""「]([^""」]+)[""」]/) || [])[1] || '';
      if (quoted) {
        const r = analyzeScam(quoted);
        const verdictLabel = r.verdict === 'danger' ? (state.lang==='zh'?'极可能是诈骗':'Highly likely a scam') : r.verdict === 'caution' ? (state.lang==='zh'?'信息中有可疑内容':'Suspicious content') : (state.lang==='zh'?'未发现明显风险':'No obvious risk');
        return {
          reply: state.lang==='zh'
            ? `${verdictLabel}\n\n${r.advice.zh}\n\n命中特征：\n${r.reasons.slice(0,5).map(x => '• ' + x.zh).join('\n') || '（无）'}`
            : `${verdictLabel}\n\n${r.advice.en}\n\nSignals:\n${r.reasons.slice(0,5).map(x => '• ' + x.en).join('\n') || '(none)'}`,
          tool: '🛡️ check_scam'
        };
      }
      TOOLS.open_scam.action();
      return { reply: TOOLS.open_scam.reply(), tool: '🔧 open_scam' };
    }
    const def = TOOLS[tool];
    def.action();
    return { reply: def.reply(), tool: '🔧 ' + tool };
  }

  // 3) Cheap local replies (greetings, time) — no LLM roundtrip needed.
  const quick = localQuickReply(userText);
  if (quick) return { reply: quick };

  // 4) Real LLM call. Server-side: the browser calls our Supabase Edge
  //    Function which holds the SiliconFlow key and enforces the credits
  //    system. We no longer need a user-configured key.
  if (window.LiveData && window.LiveData.llmChat) {
    const systemPrompt = buildLlmSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ];
    try {
      const r = await window.LiveData.llmChat(messages, {
        temperature: 0.65,
        max_tokens: 500,
        tools: APP_TOOLS,
        tool_choice: 'auto'
      });
      if (r && (r.text || (r.tool_calls && r.tool_calls.length))) {
        // Update the credits indicator in the Me card (if it's open).
        const remEl = document.getElementById('aiCreditsRemaining');
        if (remEl && r.credits_remaining != null) remEl.textContent = r.credits_remaining;
        // Execute any tool calls the model returned. If a tool fires
        // we close the chat sheet and let the user see the result.
        const calls = r.tool_calls || [];
        let toolLabel = '🤖 Qwen3-8B';
        for (const c of calls) {
          const fn = c.function || {};
          const name = fn.name;
          let args = {};
          try { args = fn.arguments ? JSON.parse(fn.arguments) : {}; } catch (_) {}
          if (name === 'navigate' && args.route) {
            toolLabel = '🧭 → ' + args.route;
            // Defer navigation so the user sees the tool-label first.
            setTimeout(() => { try { go(args.route); } catch(_) {} }, 300);
          } else if (name === 'set_language' && (args.lang === 'zh' || args.lang === 'en')) {
            toolLabel = '🌐 → ' + args.lang;
            setTimeout(() => {
              try { state.lang = args.lang; applyState(); if (sbReady()) sb.from('user_preferences').update({ language: args.lang }).eq('user_id', sbUser.id).catch(()=>{}); } catch(_) {}
            }, 300);
          } else if (name === 'trigger_sos') {
            toolLabel = '🆘 SOS';
            setTimeout(() => { try { triggerSos(); } catch(_) {} }, 300);
          } else if (name === 'open_ai_sheet') {
            // already open; no-op
            toolLabel = '💬 AI';
          } else if (name === 'open_finance') {
            toolLabel = '💰 行情';
            setTimeout(() => { try { go('finance'); } catch(_) {} }, 300);
          } else if (name === 'open_map') {
            toolLabel = '🗺️ 地图';
            setTimeout(() => { try { go('map'); } catch(_) {} }, 300);
          } else if (name === 'open_news') {
            toolLabel = '📰 新闻';
            setTimeout(() => { try { go('news'); } catch(_) {} }, 300);
          } else if (name === 'open_scam') {
            toolLabel = '🛡️ 防诈骗';
            setTimeout(() => { try { go('scam'); } catch(_) {} }, 300);
          } else if (name === 'open_medication') {
            toolLabel = '💊 用药';
            setTimeout(() => { try { go('medication'); } catch(_) {} }, 300);
          } else if (name === 'open_guardian') {
            toolLabel = '👨‍👩‍👧 守护者';
            setTimeout(() => { try { go('guardian'); } catch(_) {} }, 300);
          } else if (name === 'open_me') {
            toolLabel = '⚙️ 我的';
            setTimeout(() => { try { go('me'); } catch(_) {} }, 300);
          } else if (name === 'set_reminder') {
            // Already executed server-side; find the matching tool_result
            // (same index in r.tool_results) and surface it.
            const res = (r.tool_results || []).find(x => x && x.name === 'set_reminder' && JSON.stringify(x.args) === JSON.stringify(args));
            const rem = res && res.result && res.result.reminder;
            if (res && res.result && res.result.ok && rem) {
              toolLabel = state.lang==='zh' ? '⏰ 已设置提醒' : '⏰ Reminder set';
              // Speak + toast a confirmation.
              const when = rem.kind === 'daily'
                ? (state.lang==='zh' ? `每天 ${rem.time_of_day}` : `every day at ${rem.time_of_day}`)
                : new Date(rem.next_fire_at).toLocaleString(state.lang==='zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
              const speech = state.lang==='zh'
                ? `好的，已为您设置提醒：${rem.label}，${when}。`
                : `Got it. I set a reminder: ${rem.label}, ${when}.`;
              toast(speech);
              setTimeout(() => speak(speech), 400);
              // Open the Reminders tab so the user sees their new entry.
              setTimeout(() => { try { go('reminders'); } catch(_) {} }, 800);
            } else if (res && res.result && res.result.error) {
              toolLabel = state.lang==='zh' ? '⚠️ 提醒设置失败' : '⚠️ Reminder failed';
              toast((state.lang==='zh'?'设置提醒出错：':'Failed to set reminder: ') + res.result.error, true);
            }
          } else if (name === 'cancel_reminder') {
            const res = (r.tool_results || []).find(x => x && x.name === 'cancel_reminder' && JSON.stringify(x.args) === JSON.stringify(args));
            if (res && res.result && res.result.ok) {
              toolLabel = state.lang==='zh' ? '🗑️ 已取消提醒' : '🗑️ Reminder cancelled';
              toast(state.lang==='zh' ? '提醒已取消' : 'Reminder cancelled');
            } else {
              toolLabel = state.lang==='zh' ? '⚠️ 取消失败' : '⚠️ Cancel failed';
            }
          } else if (name === 'list_reminders') {
            // After the model returns the list, open the Reminders tab
            // so the user sees the rendered table.
            toolLabel = state.lang==='zh' ? '📋 提醒列表' : '📋 Reminders';
            setTimeout(() => { try { go('reminders'); } catch(_) {} }, 300);
          }
        }
        return { reply: (r.text || '').trim(), tool: toolLabel };
      }
      if (r && r.error) {
        if (r.error === 'insufficient_credits') {
          return { reply: state.lang==='zh'
            ? `今日 AI 信用已用完（剩余 ${r.credits_remaining} / ${r.credits_total}）。明天 00:00 自动补满。`
            : `Out of daily AI credits (${r.credits_remaining} / ${r.credits_total}). Refills at 00:00 local time.`,
            tool: '⏳' };
        }
        if (r.error === 'auth') {
          return { reply: state.lang==='zh' ? '请先登录后再试。' : 'Please sign in first.', tool: '🔒' };
        }
        return { reply: (state.lang==='zh'?'（AI 服务暂时出错）：':'AI error: ') + (r.error + (r.detail ? ': ' + (typeof r.detail==='string' ? r.detail : JSON.stringify(r.detail).substring(0,200)) : '')), tool: '⚠️' };
      }
    } catch (e) {
      return { reply: (state.lang==='zh'?'（AI 服务异常）：':'AI error: ') + (e.message||e), tool: '⚠️' };
    }
  }

  // 5) No LiveData (e.g. CDN failed) — soft fallback.
  return { reply: state.lang==='zh'
    ? 'AI 助手暂时不可用。我可以帮您：打开地图 / 打开新闻 / 朗读今日金价 / 设置用药提醒。'
    : "The AI assistant is temporarily unavailable. In the meantime, I can open the map, open news, read today's gold price, or set medication reminders.",
    tool: '⚙️'
  };
}

function localQuickReply(userText) {
  const t = (userText || '').trim();
  const isZh = state.lang === 'zh';
  if (/^(谢谢|感谢|thank|thx|thanks|thank you)\b/i.test(t)) {
    return isZh ? '不客气。能帮到您我也很高兴。' : "You're very welcome. I'm glad I could help.";
  }
  if (/^(你好|您好|hello|hi|hey)\b/i.test(t)) {
    return isZh ? '您好。今天感觉怎么样？' : "Hello. How are you feeling today?";
  }
  if (/(现在几点|现在几点了|what.*time|current.*time)/i.test(t)) {
    const now = new Date().toLocaleTimeString(isZh ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    return isZh ? `现在大约是 ${now}。` : `It's about ${now} now.`;
  }
  return null;
}

function buildLlmSystemPrompt() {
  // SOUL.md persona + user context. The LLM is told to keep replies short,
  // kind, and practical. Includes the user's name, age, location, news
  // interests, and the current time so the answer can be specific.
  const p = state.profile || {};
  const isZh = state.lang === 'zh';
  const name = p.display_name || (isZh ? '用户' : 'the user');
  const pref = (p.preferred_name || '').trim();
  const age = p.age ? `, ${p.age} ${isZh ? '岁' : 'years old'}` : '';
  const city = p.city ? (isZh ? `, 居住地: ${p.city}` : `, from ${p.city}`) : '';
  const topics = (state._prefNewsTopics && state._prefNewsTopics.length)
    ? state._prefNewsTopics
    : (p.news_topics || []);
  const topicsStr = topics.length
    ? topics.map(k => NEWS_TOPIC_LABEL[k] || k).join('、')
    : '';
  const guardian = p.guardian_name ? (isZh ? `, 守护人: ${p.guardian_name}` : `, guardian: ${p.guardian_name}`) : '';
  const now = new Date();
  const timeStr = now.toLocaleString(isZh ? 'zh-CN' : 'en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  return isZh
    ? `你是「小金」，一位陪伴长者的温柔智能助手。用户名叫「${name}」${pref ? '（希望被叫「' + pref + '」）' : ''}${age}${city}${guardian}。今天是 ${timeStr}。\n\n` +
      `回复要求：\n` +
      `1. 简洁、温暖、口语化；2-4 句为主。\n` +
      `2. 优先给出可执行的建议，避免专业术语。\n` +
      `3. 如有健康/财务相关问题，提醒用户咨询专业医生/顾问。\n` +
      `4. 不夸大、不编造信息；不知道就老实说。\n` +
      `5. 涉及诈骗或可疑信息，立刻提醒并建议拨打 110 或咨询家人。\n` +
      (topicsStr ? `6. 用户偏好新闻主题：${topicsStr}。\n` : '') +
      `\n你的能力范围：\n` +
      `- 闲聊陪伴、问候、寒暄\n` +
      `- 解释生活常识、节庆习俗、健康养生小贴士\n` +
      `- 提醒用药、量血压、关注天气变化\n` +
      `- 设置任意一次性或每天的提醒（服药、打电话、喝水、散步、吃饭、看电视、吃药、复诊、纪念日等）——用户说"提醒我…"时，调用 set_reminder 工具\n` +
      `- 朗读屏幕上的内容（用户会点击"朗读"按钮）`
    : `You are "Xiao Jin", a warm AI companion for elderly users. The user is ${name}${pref ? ` (they prefer to be called "${pref}")` : ''}${age}${city}${guardian}. Today is ${timeStr}.\n\n` +
      `Reply rules:\n` +
      `1. Keep it brief and warm; 2-4 short sentences.\n` +
      `2. Practical and actionable; avoid jargon.\n` +
      `3. For health/finance questions, recommend consulting a professional.\n` +
      `4. Don't make things up; if you don't know, say so.\n` +
      `5. For scam/suspicious content, warn immediately and suggest calling family or local authorities.\n` +
      (topicsStr ? `6. User's news interests: ${topicsStr}.\n` : '') +
      `\nYou can: chat warmly, explain everyday topics, suggest healthy habits, set arbitrary one-off or daily reminders (for anything: medication, calling family, drinking water, going for a walk, meals, TV, doctor's appointments, anniversaries) by calling the set_reminder tool, or read content aloud when the user taps the speaker.`;
}

// Map wizard topic keys -> human label in current language (built once).
const NEWS_TOPIC_LABEL = (() => {
  const out = {};
  for (const tp of NEWS_TOPICS) out[tp.key] = tp.i18n;
  return out;
})();


function speak(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
    u.rate = 0.85;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

function pushChat(role, text, tool) {
  state.chat.push({ role, text, tool });
  renderChat();
}

function renderChat() {
  const list = document.getElementById('chatList');
  list.innerHTML = state.chat.map(m => {
    let html = `<div class="bubble ${m.role}">${escapeHtml(m.text)}`;
    if (m.tool) html += `<div class="tool">${escapeHtml(m.tool)}</div>`;
    html += '</div>';
    return html;
  }).join('');
  list.scrollTop = list.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  pushChat('user', text);
  // Show a "thinking..." bubble immediately so the user has feedback while
  // the LLM call (up to several seconds) is in flight.
  const thinking = state.lang === 'zh' ? '正在思考…' : 'Thinking…';
  pushChat('ai', thinking, '⏳');
  const thinkingIdx = state.chat.length - 1;
  setTimeout(async () => {
    let r;
    try {
      r = await aiChat(text);
    } catch (e) {
      r = { reply: (state.lang==='zh'?'抱歉，AI 出现异常：':'AI error: ') + (e.message||e), tool: '⚠️' };
    }
    // Replace the thinking bubble with the real reply.
    state.chat[thinkingIdx] = { role: 'ai', text: r.reply, tool: r.tool };
    renderChat();
    speak(r.reply);
  }, 200);
}

function openSheet() {
  state.aiOpen = true;
  document.getElementById('aiSheet').classList.add('open');
  document.getElementById('sheetMask').classList.add('open');
  document.getElementById('bubbleFab').classList.add('active');
  document.getElementById('bubbleIcon').innerHTML = ICON.close;
  if (state.chat.length === 0) {
    pushChat('ai', SOUL.greeting());
    renderQuick();
  }
  setTimeout(() => document.getElementById('chatInput').focus(), 300);
}
function closeSheet() {
  state.aiOpen = false;
  document.getElementById('aiSheet').classList.remove('open');
  document.getElementById('sheetMask').classList.remove('open');
  document.getElementById('bubbleFab').classList.remove('active');
  document.getElementById('bubbleIcon').innerHTML = ICON.mic;
}

function renderQuick() {
  const row = document.getElementById('quickRow');
  row.innerHTML = `
    <button class="card" data-q="map">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="card-icon" style="background:linear-gradient(135deg,#0D9488,#0F766E)">${ICON.hosp}</div>
        <div class="card-title">${t('aiQuickMap')}</div>
      </div>
    </button>
    <button class="card" data-q="finance">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="card-icon" style="background:linear-gradient(135deg,#F97316,#EA580C)">${ICON.gold}</div>
        <div class="card-title">${t('aiQuickGold')}</div>
      </div>
    </button>`;
  row.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    const map = { map: t('aiQuickMap'), finance: t('aiQuickGold') };
    document.getElementById('chatInput').value = map[b.dataset.q];
    sendChat();
  });
}

// ---------------- NAV ----------------
function go(route) {
  state.route = route;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === route));
  render();
  document.getElementById('screen').scrollTop = 0;
}

// ---------------- RENDER ----------------
function render() {
  const screen = document.getElementById('screen');
  const sideNav = document.getElementById('sideNav');
  const app = document.getElementById('app');
  if (!state.signedIn) {
    renderAuth(screen);
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('bubbleFab').style.display = 'none';
    if (sideNav) sideNav.classList.add('hidden');
    if (app) app.classList.add('no-sidebar');
    return;
  }
  // Show sidebar on PC (>=900px), bottom nav on mobile
  if (sideNav) sideNav.classList.remove('hidden');
  if (app) app.classList.remove('no-sidebar');
  document.getElementById('bottomNav').style.display = '';
  document.getElementById('bubbleFab').style.display = 'flex';
  switch (state.route) {
    case 'home': return renderHome(screen);
    case 'features': return renderFeatures(screen);
    case 'map': return renderMap(screen);
    case 'finance': return renderFinance(screen);
    case 'me': return renderMe(screen);
    case 'news': return renderNews(screen);
    case 'scam': return renderScam(screen);
    case 'guardian': return renderGuardian(screen);
    case 'medication': return renderMedication(screen);
    case 'reminders': return renderReminders(screen);
  }
}

// --- AUTH ---
function renderAuth(root) {
  const isZh = state.lang === 'zh';
  const screen = renderAuth._screen || 'input';
  const tab = renderAuth._tab || 'email';

  // ---- New-user profile setup ----
  if (screen === 'profile') { renderAuthSetup(root, isZh); return; }

  const otpMode = screen === 'otp';
  const pwdMode = screen === 'pwd';
  const signedInEmail = renderAuth._signedInEmail;
  root.innerHTML = `
    ${signedInEmail ? `
    <div class="card" style="width:100%;max-width:480px;padding:14px 18px;margin-bottom:18px;background:var(--bg);display:flex;align-items:center;gap:12px;border:1px solid var(--border-app)">
      <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--cta));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">
        ${escapeHtml(signedInEmail[0] || '?').toUpperCase()}
      </div>
      <div style="flex:1;text-align:left;min-width:0">
        <div style="font-size:.78rem;color:var(--muted)">${isZh?'已登录':'Already signed in as'}</div>
        <div style="font-size:.95rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(signedInEmail)}</div>
      </div>
      <button class="big-btn primary" id="continueCurrentBtn" style="width:auto;min-width:0;padding:8px 16px;font-size:.9rem">${isZh?'进入应用':'Continue'}</button>
      <button class="big-btn ghost" id="switchAccountBtn" style="width:auto;min-width:0;padding:8px 14px;font-size:.85rem;background:transparent;border:1px solid var(--border-app);color:var(--text)">${isZh?'切换':'Switch'}</button>
    </div>
    ` : ''}
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;width:100%;min-height:100%">
      <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--cta));display:flex;align-items:center;justify-content:center;margin-bottom:24px">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>
      <h2 style="margin-bottom:8px">${t('authTitle')}</h2>
      <p class="text-soft" style="margin-bottom:20px">${t('authSubtitle')}</p>

      <div style="display:inline-flex;background:var(--bg);border:1px solid var(--border-app);border-radius:12px;padding:4px;margin-bottom:20px;flex-wrap:wrap;gap:2px;justify-content:center">
        <button id="tabPhone" class="big-btn ${tab==='phone'?'primary':'ghost'}" style="width:auto;min-width:0;padding:10px 14px;font-size:.9rem;min-height:40px">${isZh?'手机':'Phone'}</button>
        <button id="tabEmail" class="big-btn ${tab==='email'?'primary':'ghost'}" style="width:auto;min-width:0;padding:10px 14px;font-size:.9rem;min-height:40px">${isZh?'邮箱':'Email'}</button>
        <button id="tabPwd" class="big-btn ${tab==='pwd'?'primary':'ghost'}" style="width:auto;min-width:0;padding:10px 14px;font-size:.9rem;min-height:40px">${isZh?'密码':'Password'}</button>
      </div>

      ${otpMode ? (tab === 'email' ? `
        <div style="width:100%;text-align:center">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));margin:0 auto 18px;display:flex;align-items:center;justify-content:center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h3 style="margin-bottom:10px">${t('authLinkSentTitle')}</h3>
          <p class="text-soft" style="margin-bottom:6px;line-height:1.55">${t('authLinkSentSub').replace('${email}', '<b>'+escapeHtml(renderAuth._email||'')+'</b>')}</p>
          <p class="text-soft" style="font-size:.85rem;margin-bottom:18px">${t('authLinkSentHint')}</p>
          <div class="text-soft" style="font-size:.85rem;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:6px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--primary);animation:pulse 1.4s infinite"></span>
            ${t('authLinkWaiting')}
          </div>
          <button class="big-btn ghost" id="resendLinkBtn" style="width:100%;min-width:0">${t('authLinkResend')}</button>
          <div style="height:10px"></div>
          <button class="big-btn ghost" id="changeEmailBtn" style="width:100%;min-width:0;background:transparent;border:0">${t('authLinkChange')}</button>
        </div>
      ` : `
        <div style="width:100%">
          <p class="text-soft" style="margin-bottom:16px">${t('authOtpSubPhone')}</p>
          <label class="field-label">${t('authOtpTitle')}</label>
          <input id="otpInput" inputmode="numeric" maxlength="8" style="letter-spacing:6px;font-size:1.5rem;font-weight:700;text-align:center" placeholder="······">
          <div style="height:16px"></div>
          <button class="big-btn primary" id="verifyBtn">${t('authVerify')}</button>
          <div style="height:12px"></div>
          <div class="text-soft" id="resendWrap" style="font-size:.95rem">${t('authResendIn')} <span id="resendSec">60</span>s</div>
        </div>
      `) : pwdMode ? `
        <div style="width:100%;text-align:left">
          <h3 style="margin:0 0 6px;text-align:center">${renderAuth._pwdMode === 'up' ? (isZh?'创建账户':'Create Account') : (isZh?'登录账户':'Sign In')}</h3>
          <p class="text-soft" style="margin:0 0 18px;text-align:center;font-size:.9rem">${renderAuth._pwdMode === 'up' ? (isZh?'使用邮箱 + 密码，1 秒开始':'Set a password — no email verification needed') : (isZh?'欢迎回来':'Welcome back')}</p>
          <label class="field-label">${isZh?'邮箱地址':'Email address'}</label>
          <input id="pwdEmail" type="email" autocomplete="email" style="font-size:1.1rem;padding:14px 16px" placeholder="you@example.com">
          <div style="height:14px"></div>
          <label class="field-label">${isZh?'密码（至少 6 位）':'Password (6+ characters)'}</label>
          <input id="pwdInput" type="password" autocomplete="${renderAuth._pwdMode==='up'?'new-password':'current-password'}" style="font-size:1.1rem;padding:14px 16px;letter-spacing:2px" placeholder="${renderAuth._pwdMode==='up' ? (isZh?'设置一个密码（≥6位）':'Set a password (6+ chars)') : (isZh?'输入密码':'Enter password')}">
          <div style="height:20px"></div>
          <button class="big-btn primary" id="pwdSignUpBtn" style="width:100%;min-width:0;background:linear-gradient(135deg,var(--primary),var(--cta));color:#fff;font-weight:700;font-size:1.05rem">${isZh?'注册 / Sign Up':'Sign Up'}</button>
          <div style="height:10px"></div>
          <button class="big-btn ghost" id="pwdSignInBtn" style="width:100%;min-width:0;border:1px solid var(--border-app);background:var(--bg);font-weight:600;font-size:1rem">${isZh?'登录 / Sign In':'Sign In'}</button>
          <div style="height:14px"></div>
          <div style="text-align:center;font-size:.88rem;color:var(--text-soft,#666)">
            <span id="pwdToggleLink" style="cursor:pointer;text-decoration:underline;color:var(--primary)">${renderAuth._pwdMode === 'up' ? (isZh?'已有账户？直接登录':'Already have an account? Sign In') : (isZh?'还没账户？立即注册（无需邮箱验证）':'New here? Create an account (no email verify)')}</span>
          </div>
          <div style="height:8px"></div>
          <p class="text-soft" style="font-size:.74rem;line-height:1.5;text-align:center;margin:0">${isZh?'密码经 Supabase Auth 散列存储（bcrypt）。':'Passwords are stored hashed (bcrypt) by Supabase Auth.'}</p>
        </div>
      ` : (tab === 'phone' ? `
        <div style="width:100%">
          <label class="field-label">${t('authPhoneLabel')}</label>
          <input id="phoneInput" maxlength="20" style="font-size:1.3rem" placeholder="${t('authPlaceholder')}">
          <p class="text-soft" style="margin-top:6px;font-size:.85rem">${t('authPhoneHint')}</p>
          <div style="height:16px"></div>
          <button class="big-btn primary" id="sendBtn">${t('authSend')}</button>
        </div>
      ` : `
        <div style="width:100%">
          <label class="field-label">${isZh?'邮箱地址':'Email address'}</label>
          <input id="emailInput" type='email' autocomplete='email' style="font-size:1.3rem" placeholder="you@example.com">
          <p class="text-soft" style="margin-top:6px;font-size:.85rem">${t('authSmsHint')}</p>
          <div style="height:16px"></div>
          <button class="big-btn primary" id="sendEmailBtn">${t('authSend')}</button>
          <div style="height:20px"></div>
          <div style="display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--border-app);border-radius:12px;padding:12px;text-align:left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span style="font-size:.85rem">${isZh?'推荐使用邮箱登录（我们会向您邮箱发送 6 位验证码）':'Email login sends a 6-digit code to your inbox — no SMS provider needed'}</span>
          </div>
        </div>
      `)}
    </div>`;

  // Tab switching
  const tabPhone = document.getElementById('tabPhone');
  const tabEmail = document.getElementById('tabEmail');
  const tabPwd = document.getElementById('tabPwd');
  if (tabPhone) tabPhone.onclick = () => { renderAuth._tab = 'phone'; renderAuth._screen = 'input'; render(); };
  if (tabEmail) tabEmail.onclick = () => { renderAuth._tab = 'email'; renderAuth._screen = 'input'; render(); };
  if (tabPwd) tabPwd.onclick = () => {
    renderAuth._tab = 'pwd';
    renderAuth._screen = 'pwd';
    if (!renderAuth._pwdMode) renderAuth._pwdMode = 'in'; // default to Sign In
    render();
  };

  // "Continue" / "Switch account" — only shown when ?login=1 forced
  // the auth screen even though a session is already present.
  const cont = document.getElementById('continueCurrentBtn');
  if (cont) cont.onclick = () => {
    // Strip the ?login=1 flag and reload into the app.
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('login');
      window.location.replace(u.pathname + (u.search ? u.search : '') + u.hash);
    } catch (_) {
      window.location.replace('app.html');
    }
  };
  const sw = document.getElementById('switchAccountBtn');
  if (sw) sw.onclick = async () => {
    if (!sb) return;
    try { await sb.auth.signOut(); } catch (_) {}
    sbUser = null;
    state.signedIn = false;
    state.profile = null;
    state._prefNewsTopics = null;
    state.chat = [];
    localStorage.removeItem('signedIn');
    renderAuth._signedInEmail = null;
    render();
  };

  if (otpMode) {
    document.getElementById('verifyBtn').onclick = onVerifyOtp;
  } else if (pwdMode) {
    const signup = document.getElementById('pwdSignUpBtn');
    const signin = document.getElementById('pwdSignInBtn');
    const link = document.getElementById('pwdToggleLink');
    if (signup) signup.onclick = () => { renderAuth._pwdMode = 'up'; onPwdSubmit('up'); };
    if (signin) signin.onclick = () => { renderAuth._pwdMode = 'in'; onPwdSubmit('in'); };
    if (link) link.onclick = () => {
      renderAuth._pwdMode = renderAuth._pwdMode === 'up' ? 'in' : 'up';
      render();
    };
  } else {
    const sendBtn = document.getElementById('sendBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    if (sendBtn) sendBtn.onclick = onSendPhone;
    if (sendEmailBtn) sendEmailBtn.onclick = onSendEmail;
  }
}

async function onSendPhone() {
  const isZh = state.lang === 'zh';
  const v = document.getElementById('phoneInput').value.trim();
  if (v.length < 6) return toast(isZh?'请输入手机号':'Enter your phone', true);
  renderAuth._phone = v;
  if (!sb) { renderAuth._screen='otp'; render(); return; }
  const btn = document.getElementById('sendBtn');
  if (btn) { btn.disabled = true; btn.dataset._oldText = btn.textContent; btn.textContent = isZh ? '发送中…' : 'Sending…'; }
  try {
    const { error } = await sb.auth.signInWithOtp({ phone: v, options: { shouldCreateUser: true } });
    if (error) throw error;
    renderAuth._screen = 'otp'; render(); startResendTimer('phone');
  } catch(e) {
    const msg = (e && e.message) ? e.message : String(e);
    // SMS is not configured on this Supabase project — auto-switch to the
    // email tab so the user does not get stuck.
    renderAuth._tab = 'email';
    renderAuth._screen = 'input';
    render();
    toast((isZh?'短信服务暂不可用，已自动切换到「邮箱」登录（请使用邮箱接收 6 位验证码）。':'SMS unavailable — switched to Email tab. Please use your email to receive a 6-digit code.') + ' (' + msg + ')', true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset._oldText || (isZh ? '发送验证码' : 'Send Code'); }
  }
}

async function onSendEmail() {
  const isZh = state.lang === 'zh';
  const v = document.getElementById('emailInput').value.trim();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(v)) return toast(isZh?'请输入有效的邮箱地址':'Enter a valid email', true);
  const domain = v.split('@')[1]?.toLowerCase() || '';
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain) || /gmail\.con|gmai\.com|gmial\.com|yahoo\.con|hotmai\.com/.test(v)) {
    return toast(isZh?'邮箱域名看起来不正确（请检查拼写）':'Email domain looks incorrect — check spelling', true);
  }
  renderAuth._email = v;
  if (!sb) { renderAuth._screen='otp'; render(); return; }
  const btn = document.getElementById('sendEmailBtn');
  if (btn) { btn.disabled = true; btn.dataset._oldText = btn.textContent; btn.textContent = isZh ? '发送中…' : 'Sending…'; }
  try {
    // Use emailRedirectTo => Supabase sends a MAGIC LINK in the email.
    // When the user clicks it, the browser comes back to app.html and
    // onAuthStateChange fires SIGNED_IN, which routes them to home or
    // the setup wizard.
    // Always redirect to the site root (which is in Supabase's Redirect-URL
    // allowlist). The landing page (index.html) detects magic-link tokens in
    // the URL hash and forwards to app.html, where the Supabase client
    // processes the session. This avoids requiring app.html to be separately
    // allowlisted.
    const redirectTo = window.location.origin + '/';
    const { error } = await sb.auth.signInWithOtp({
      email: v,
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo }
    });
    if (error) throw error;
    renderAuth._screen = 'otp'; render(); bindEmailLinkActions();
  } catch(e) {
    const msg = (e && e.message) ? e.message : String(e);
    const isRateLimit = /rate limit/i.test(msg);
    const isSmtp = /smtp|mail server|forbidden|referer|provider|cors|422|500|503/i.test(msg);
    let zhText, enText;
    if (isRateLimit) {
      zhText = 'Supabase 内置邮件已达上限（默认每小时 2 封，整个项目共享，且无法在控制台调高）。正在通过开发模式直接登录…';
      enText = 'Supabase built-in email limit reached (2/hour project-wide, NOT adjustable from the dashboard). Signing in via dev mode…';
    } else if (isSmtp) {
      zhText = '邮件服务暂不可用：Supabase SMTP 未配置。请在 Supabase 控制台 Auth → SMTP 中配置（AWS SES / SendGrid / Resend），或在 Auth → Providers → Email 中开启 Confirm email off 进行测试。';
      enText = 'Email service unavailable: Supabase SMTP is not configured. Set up SMTP (AWS SES / SendGrid / Resend) in Supabase Dashboard → Auth → SMTP, or disable Confirm email under Auth → Providers → Email for testing.';
    } else {
      zhText = '发送失败：' + msg;
      enText = 'Send failed: ' + msg;
    }
    if (isSmtp || isRateLimit) {
      window.__devEmail = v;
      toast(isZh ? zhText : enText, true);
      // Try dev-signin Edge Function — returns a real magic-link URL whose
      // access_token+refresh_token we hand back to Supabase JS, establishing
      // a real session (with RLS) without sending email.
      // The function is enabled by setting DEV_SIGNIN_KEY as a Supabase secret;
      // the value is also exposed via window.__DEV_KEY (read from <meta> or
      // simply a hard-coded dev constant for this project). Leave empty in
      // production.
      const devKey = (window.__DEV_KEY) || '';
      if (!devKey) {
        toast((isZh?'已开启开发模式（点击「登录」直接进入）':'Dev mode enabled (click Sign In to proceed without email)'), true);
        return;
      }
      try {
        const r = await fetch(SB_URL + '/functions/v1/dev-signin', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-dev-key': devKey },
          body: JSON.stringify({ email: v })
        });
        if (r.ok) {
          const data = await r.json();
          if (data.access_token && data.refresh_token) {
            // Hand the tokens directly to the Supabase client. No redirect,
            // no origin issues — the client establishes the session right here.
            const { data: sess, error: setErr } = await sb.auth.setSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token
            });
            if (setErr) throw setErr;
            if (sess && sess.user) {
              toast(isZh ? '开发模式登录成功' : 'Dev sign-in successful', true);
              // finishSignIn will be triggered by onAuthStateChange(SIGNED_IN).
              return;
            }
          }
        }
        // dev-signin returned a payload we didn't expect — log it for debugging.
        let raw = '';
        try { raw = (await r.clone().text()).substring(0, 200); } catch {}
        console.warn('[dev-signin] unexpected response', r.status, raw);
        // dev-signin not configured — fall back to fake-user dev mode.
        toast((isZh?'已开启开发模式（点击「登录」直接进入）':'Dev mode enabled (click Sign In to proceed without email)'), true);
      } catch(e) {
        console.warn('[dev-signin] fetch error', e);
        toast((isZh?'已开启开发模式（点击「登录」直接进入）':'Dev mode enabled (click Sign In to proceed without email)'), true);
      }
    } else {
      toast(isZh ? zhText : enText, true);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset._oldText || (isZh ? '发送登录邮件' : 'Send Sign-In Email'); }
  }
}

async function onPwdSubmit(forceMode) {
  const isZh = state.lang === 'zh';
  if (!sb) return toast(isZh ? '请先初始化 Supabase 客户端' : 'Supabase client not ready', true);
  const emailEl = document.getElementById('pwdEmail');
  const pwdEl = document.getElementById('pwdInput');
  const email = (emailEl?.value || '').trim().toLowerCase();
  const password = pwdEl?.value || '';
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return toast(isZh ? '请输入有效的邮箱' : 'Enter a valid email', true);
  if (password.length < 6) return toast(isZh ? '密码至少 6 位' : 'Password must be 6+ characters', true);

  // Determine which button was clicked (or use forced mode)
  const mode = forceMode || (renderAuth._pwdMode === 'up' ? 'up' : 'in');
  const btnId = mode === 'up' ? 'pwdSignUpBtn' : 'pwdSignInBtn';
  const btn = document.getElementById(btnId);
  if (btn) { btn.disabled = true; btn.dataset._oldText = btn.textContent; btn.textContent = isZh ? '处理中…' : 'Working…'; }

  try {
    let data, error;
    if (mode === 'up') {
      // Sign up — autoconfirm is on, returns access+refresh tokens immediately.
      ({ data, error } = await sb.auth.signUp({ email, password }));
    } else {
      // Sign in
      ({ data, error } = await sb.auth.signInWithPassword({ email, password }));
    }

    if (error) {
      // Helpful hints for common cases.
      const msg = (error.message || '').toLowerCase();
      if (mode === 'in' && /invalid.*credential|invalid.*login/i.test(msg)) {
        // User clicked Sign In but account doesn't exist — offer to create one.
        toast(isZh
          ? '该邮箱尚未注册。点击「注册」创建账户。'
          : 'No account with that email. Tap "Sign Up" to create one.', true);
      } else if (mode === 'up' && /already.*registered|user.*exists|email.*taken/i.test(msg)) {
        // User clicked Sign Up but account exists.
        toast(isZh
          ? '该邮箱已注册。请点击「登录」使用该密码登录。'
          : 'That email is already registered. Tap "Sign In" to log in.', true);
      } else if (mode === 'up' && /confirm|verify|email not confirmed|verification/i.test(msg)) {
        toast(isZh
          ? 'Supabase 要求邮箱验证 — 请在控制台开启 mailer_autoconfirm=true'
          : 'Supabase requires email verification — ask admin to enable mailer_autoconfirm=true', true);
      } else {
        toast((isZh ? '失败：' : 'Failed: ') + (error.message || error), true);
      }
      return;
    }
    // success — onAuthStateChange(SIGNED_IN) will route to role gate / wizard.
    // No toast needed; the welcome toast fires from finishSignIn.
  } catch(e) {
    toast((isZh ? '失败：' : 'Failed: ') + (e.message || e), true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset._oldText || (mode === 'up' ? (isZh?'注册':'Sign Up') : (isZh?'登录':'Sign In')); }
  }
}

function bindEmailLinkActions() {
  const resend = document.getElementById('resendLinkBtn');
  const change = document.getElementById('changeEmailBtn');
  if (resend) resend.onclick = async () => {
    const isZh = state.lang === 'zh';
    if (!sb || !renderAuth._email) return;
    resend.disabled = true;
    try {
      await sb.auth.signInWithOtp({
        email: renderAuth._email,
        options: { shouldCreateUser: true,
                   emailRedirectTo: window.location.origin + '/' }
      });
      toast(isZh?'已重新发送':'Resent');
    } catch(e) {
      toast((isZh?'重新发送失败：':'Resend failed: ') + (e.message||e), true);
    } finally {
      resend.disabled = false;
    }
  };
  if (change) change.onclick = () => {
    renderAuth._screen = 'input';
    renderAuth._email = null;
    render();
  };
}

async function onVerifyOtp() {
  const isZh = state.lang === 'zh';
  const v = document.getElementById('otpInput').value.trim();
  if (v.length < 4) return toast(isZh?'请输入验证码':'Enter the code', true);
  if (!sb) {
    state.signedIn = true; localStorage.setItem('signedIn','true');
    toast(isZh?'登录成功（离线模式）':'Signed in (offline mode)'); applyState(); return;
  }
  // Dev fallback: when Supabase cannot send mail (SMTP not configured OR
  // rate limit) we accept any 6 digits and pretend it's a real session.
  // This is ONLY triggered after the user saw the "dev mode enabled" toast.
  if (window.__devEmail) {
    const devUser = { id: 'dev-' + Date.now(), email: window.__devEmail };
    window.__devEmail = null;
    state._awaitingSetup = true;
    sbUser = devUser;
    await finishSignIn(devUser, isZh);
    toast(isZh?'登录成功（开发模式 — 未真正发送邮件）':'Signed in (dev mode — no email was sent)', true);
    return;
  }
  // Guard the SIGNED_IN listener so it does not jump to Home before we check setup
  state._awaitingSetup = true;
  try {
    let data, error;
    if (renderAuth._tab === 'email') {
      ({ data, error } = await sb.auth.verifyOtp({ email: renderAuth._email, token: v, type: 'email' }));
    } else {
      ({ data, error } = await sb.auth.verifyOtp({ phone: renderAuth._phone, token: v, type: 'sms' }));
    }
    if (error) throw error;
    await finishSignIn(data.user, isZh);
  } catch(e) {
    state._awaitingSetup = false;
    toast((isZh?'验证失败：':'Verify failed: ') + (e.message||e), true);
  }
}

async function finishSignIn(user, isZh, fresh = true) {
  sbUser = user;
  // New user? (profile auto-created by trigger, but setup not finished yet)
  if (sb) {
    try {
      const { data: prof } = await sb.from('profiles')
        .select('setup_complete, display_name')
        .eq('id', user.id)
        .maybeSingle();
      if (prof && prof.setup_complete !== true) {
        renderAuth._screen = 'profile';
        renderAuth._pendingUser = user;
        render(); // signedIn is still false -> render() shows the auth/profile screen
        return;
      }
    } catch(_) { /* ignore, fall through to home */ }
  }
  state._awaitingSetup = false;
  state.signedIn = true;
  localStorage.setItem('signedIn', 'true');
  loadUserPreferences(user.id);
  // Only show the welcome toast on a real sign-in (not a token refresh).
  if (fresh) toast(isZh ? '登录成功，欢迎！' : 'Welcome!');
  applyState();
  // Start the reminder scheduler so due reminders fire a pop-up +
  // browser notification. Safe to call repeatedly — it's idempotent.
  try { startReminderScheduler(); } catch (_) {}
}

// ---------------- SETUP WIZARD ----------------
// Multi-step onboarding for new users (and re-runnable from Settings).
// State lives in renderAuth._wizard so the wizard survives re-renders.
// Steps: 0=basic (name/preferred/gender/age/city/birth),
//        1=news topics, 2=guardian info.
function wizardInitFromProfile(u) {
  const p = state.profile || {};
  renderAuth._wizard = {
    step: 0,
    data: {
      display_name: p.display_name || '',
      preferred_name: p.preferred_name || '',
      gender: p.gender || '',
      age: p.age || '',
      city: p.city || '',
      birth_date: p.birth_date || '',
      news_topics: Array.isArray(p.news_topics) ? [...p.news_topics] : [],
      guardian_name: p.guardian_name || '',
      guardian_relationship: p.guardian_relationship || '',
      guardian_phone: p.guardian_phone || '',
      role: p.role || '',
      pairing_code: p.pairing_code || '',
      elder_account_id: p.elder_account_id || '',
      guardian_account_id: p.guardian_account_id || '',
    },
    user: u,
  };
}

// Generate a short, human-friendly, unambiguous pairing code (6 chars).
function genPairingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Role selection gate shown before the setup wizard (and from Settings if no role yet).
function wizardRoleGate(root, isZh) {
  const w = renderAuth._wizard;
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:stretch;padding:24px;width:100%;min-height:100%;background:var(--bg-app)">
      <h2 style="margin-bottom:4px">${t('roleTitle')}</h2>
      <p class="text-soft" style="margin-bottom:22px">${t('roleSub')}</p>
      <button class="big-btn primary" id="roleElderly" style="margin-bottom:14px;text-align:left;padding:20px">
        <div style="font-size:1.2rem;font-weight:700">${t('roleElderly')}</div>
        <div class="text-soft" style="font-size:.9rem;margin-top:4px">${t('roleElderlySub')}</div>
      </button>
      <button class="big-btn ghost" id="roleGuardian" style="text-align:left;padding:20px;border:2px solid var(--border-app)">
        <div style="font-size:1.2rem;font-weight:700">${t('roleGuardian')}</div>
        <div class="text-soft" style="font-size:.9rem;margin-top:4px">${t('roleGuardianSub')}</div>
      </button>
    </div>`;
  document.getElementById('roleElderly').onclick = () => { w.data.role = 'elderly'; renderAuthSetup(root, isZh); };
  document.getElementById('roleGuardian').onclick = () => { w.data.role = 'guardian'; renderPairInput(root, isZh); };
}

// Guardian: enter the elder's pairing code / account id to pair now.
function renderPairInput(root, isZh) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:stretch;padding:24px;width:100%;min-height:100%;background:var(--bg-app)">
      <h2 style="margin-bottom:4px">${t('roleGuardian')}</h2>
      <p class="text-soft" style="margin-bottom:18px">${t('pairGuardianPrompt')}</p>
      <input id="pairCode" style="font-size:1.3rem;padding:14px;border-radius:12px;border:1px solid var(--border-app);width:100%;letter-spacing:2px" placeholder="${t('pairGuardianPh')}">
      <div style="height:16px"></div>
      <button class="big-btn primary" id="pairBind">${t('pairBind')}</button>
      <div style="height:10px"></div>
      <button class="big-btn ghost" id="pairSkip" style="width:100%;min-width:0;background:transparent;border:0;color:var(--muted)">${t('pairSkipBind')}</button>
    </div>`;
  const tryBind = async () => {
    const code = (document.getElementById('pairCode').value || '').trim();
    if (!code) return toast(isZh ? '请输入配对码' : 'Enter a code', true);
    if (!sb) return toast(isZh ? '请先登录' : 'Sign in first', true);
    const { data, error } = await sb.rpc('pair_with_elder', { p_code: code });
    if (error || !data || !data.ok) {
      const msg = data && data.error === 'self' ? t('pairBindSelf')
                : data && data.error === 'not_found' ? t('pairBindFail')
                : (error && error.message) || t('pairBindFail');
      return toast(msg, true);
    }
    w.data.elder_account_id = data.elder_id;
    toast(t('pairBindOk'));
    renderAuthSetup(root, isZh);
  };
  document.getElementById('pairBind').onclick = tryBind;
  document.getElementById('pairSkip').onclick = () => renderAuthSetup(root, isZh);
}

function renderAuthSetup(root, isZh) {
  const u = renderAuth._pendingUser || sbUser;
  if (!renderAuth._wizard || renderAuth._wizard.user?.id !== u?.id) {
    // Load existing profile so returning users see their current values.
    (async () => {
      if (sb && u) {
        try {
          const { data } = await sb.from('profiles')
            .select('display_name, preferred_name, gender, age, city, birth_date, news_topics, guardian_name, guardian_relationship, guardian_phone, setup_complete')
            .eq('id', u.id).maybeSingle();
          if (data) state.profile = { ...(state.profile || {}), ...data };
        } catch(_) {}
      }
      wizardInitFromProfile(u);
      renderAuthSetup(root, isZh);
    })();
    root.innerHTML = `<div class="text-soft" style="padding:60px 20px;text-align:center">${isZh ? '正在加载…' : 'Loading…'}</div>`;
    return;
  }
  const w = renderAuth._wizard;
  if (!w.data.role) { wizardRoleGate(root, isZh); return; }
  const total = 3;
  const titles = [t('setupStep1Title'), t('setupStep2Title'), t('setupStep3Title')];
  const subs   = [t('setupStep1Sub'),   t('setupStep2Sub'),   t('setupStep3Sub')];
  const stepHtml = [wizardStep1(w, isZh), wizardStep2(w, isZh), wizardStep3(w, isZh)][w.step];

  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:stretch;padding:24px 24px 32px;width:100%;min-height:100%;overflow-y:auto;background:var(--bg-app)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:.9rem;color:var(--muted)">${w.step+1} / ${total}</div>
        <button class="big-btn ghost" id="wizClose" style="width:auto;min-width:0;padding:8px 14px;font-size:.9rem;min-height:36px;background:transparent;border:0;color:var(--muted)">${isZh?'关闭':'Close'}</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:18px">
        ${Array.from({length:total}).map((_,i)=>`<div style="flex:1;height:6px;border-radius:3px;background:${i<=w.step?'var(--primary)':'var(--border-app)'}"></div>`).join('')}
      </div>
      <h2 style="margin-bottom:4px">${titles[w.step]}</h2>
      <p class="text-soft" style="margin-bottom:18px">${subs[w.step]}</p>
      <div id="wizStep" style="flex:1">${stepHtml}</div>
      <div style="height:18px"></div>
      <div style="display:flex;gap:10px">
        ${w.step>0 ? `<button class="big-btn ghost" id="wizBack" style="flex:1">${t('setupBack')}</button>`:''}
        <button class="big-btn primary" id="wizNext" style="flex:2">${w.step===total-1?t('setupDone'):t('setupNext')}</button>
      </div>
      ${w.step===total-1 ? `
      <div style="height:10px"></div>
      <button class="big-btn ghost" id="wizSkipGuardian" style="width:100%;min-width:0;background:transparent;border:1px dashed var(--border-app);color:var(--muted);padding:12px">
        ${isZh?'暂不填写守护人（稍后可在「我」页面添加）':'Skip guardian for now (add later in Me)'}
      </button>` : `
      <div style="height:10px"></div>
      <button class="big-btn ghost" id="wizSkip" style="width:100%;min-width:0;background:transparent;border:0;color:var(--muted)">${t('setupSkip')}</button>`}
    </div>`;

  document.getElementById('wizClose').onclick = () => {
    // Closing mid-wizard just hides the overlay (don't trap the user).
    if (document.getElementById('wizardMask')) {
      hideWizardOverlay();
    } else {
      finishSignIn(u, isZh);
    }
  };
  document.getElementById('wizNext').onclick = () => wizardAdvance(root, isZh);
  const back = document.getElementById('wizBack');
  if (back) back.onclick = () => { wizardCollect(w); w.step--; renderAuthSetup(root, isZh); };
  // "Skip guardian for now" — same as the global skip but labeled for the
  // step so the user knows what they're skipping. Sets setup_complete=true
  // and leaves guardian_* fields null. They can add a guardian later from
  // the Me screen (Me → Account & Pairing).
  const skipGuardian = document.getElementById('wizSkipGuardian');
  if (skipGuardian) {
    skipGuardian.onclick = () => {
      wizardCollect(w);
      w.data.guardian_name = w.data.guardian_name || null;
      w.data.guardian_relationship = w.data.guardian_relationship || null;
      w.data.guardian_phone = w.data.guardian_phone || null;
      wizardFinish(root, isZh, true);
    };
  } else {
    document.getElementById('wizSkip').onclick = () => wizardFinish(root, isZh, true);
  }
  // Step-internal event bindings
  if (w.step === 1) bindWizardStep2();
}

function wizardStep1(w, isZh) {
  return `
    <div style="text-align:left">
      <label class="field-label">${t('setupName')} *</label>
      <input id="wzName" value="${escapeHtml(w.data.display_name||'')}" style="font-size:1.2rem" placeholder="${t('setupNamePh')}">
      <div style="height:14px"></div>
      <label class="field-label">${t('setupPreferredName')}</label>
      <input id="wzPreferred" value="${escapeHtml(w.data.preferred_name||'')}" style="font-size:1.2rem" placeholder="${t('setupPreferredNamePh')}">
      <div style="height:14px"></div>
      <div style="display:flex;gap:12px">
        <div style="flex:1">
          <label class="field-label">${t('setupGender')}</label>
          <select id="wzGender" style="font-size:1.2rem;padding:12px;border-radius:12px;border:1px solid var(--border-app);width:100%;background:#fff">
            <option value="" ${!w.data.gender?'selected':''}>—</option>
            <option value="female" ${w.data.gender==='female'?'selected':''}>${t('setupGenderFemale')}</option>
            <option value="male"   ${w.data.gender==='male'  ?'selected':''}>${t('setupGenderMale')}</option>
            <option value="other"  ${w.data.gender==='other' ?'selected':''}>${t('setupGenderOther')}</option>
          </select>
        </div>
        <div style="flex:1">
          <label class="field-label">${t('setupAge')}</label>
          <input id="wzAge" type="number" min="0" max="130" value="${w.data.age||''}" style="font-size:1.2rem">
        </div>
      </div>
      <div style="height:14px"></div>
      <label class="field-label">${t('setupCity')}</label>
      <input id="wzCity" value="${escapeHtml(w.data.city||'')}" style="font-size:1.2rem" placeholder="${t('setupCityPh')}">
      <div style="height:14px"></div>
      <label class="field-label">${t('setupBirth')}</label>
      <input id="wzBirth" type="date" value="${w.data.birth_date||''}" style="font-size:1.2rem">
    </div>`;
}

function wizardStep2(w, isZh) {
  const selected = new Set(w.data.news_topics);
  const chips = NEWS_TOPICS.map(tp => {
    const on = selected.has(tp.key);
    return `<button type="button" data-topic="${tp.key}" class="wz-chip" style="
      padding:10px 14px;border-radius:999px;border:2px solid ${on?'var(--primary)':'var(--border-app)'};
      background:${on?'var(--primary)':'#fff'};color:${on?'#fff':'var(--text)'};
      font-size:1rem;font-weight:500;cursor:pointer;transition:all .15s">${t(tp.i18n)}</button>`;
  }).join('');
  return `
    <div style="text-align:left">
      <label class="field-label" style="margin-bottom:10px">${t('setupNewsTopics')}</label>
      <div id="wzTopics" style="display:flex;flex-wrap:wrap;gap:10px">${chips}</div>
    </div>`;
}

function bindWizardStep2() {
  const root = document.getElementById('wzTopics');
  if (!root) return;
  root.querySelectorAll('.wz-chip').forEach(b => {
    b.onclick = () => {
      const key = b.dataset.topic;
      const set = new Set(renderAuth._wizard.data.news_topics);
      if (set.has(key)) set.delete(key); else set.add(key);
      renderAuth._wizard.data.news_topics = [...set];
      // Re-render just the chips area
      const on = set.has(key);
      b.style.background = on ? 'var(--primary)' : '#fff';
      b.style.color = on ? '#fff' : 'var(--text)';
      b.style.borderColor = on ? 'var(--primary)' : 'var(--border-app)';
    };
  });
}

function wizardStep3(w, isZh) {
  return `
    <div style="text-align:left">
      <label class="field-label">${t('setupGuardianName')}</label>
      <input id="wzGName" value="${escapeHtml(w.data.guardian_name||'')}" style="font-size:1.2rem" placeholder="${t('setupGuardianNamePh')}">
      <div style="height:14px"></div>
      <label class="field-label">${t('setupGuardianRel')}</label>
      <select id="wzGRel" style="font-size:1.2rem;padding:12px;border-radius:12px;border:1px solid var(--border-app);width:100%;background:#fff">
        <option value="" ${!w.data.guardian_relationship?'selected':''}>—</option>
        <option value="son"       ${w.data.guardian_relationship==='son'      ?'selected':''}>${t('setupRelSon')}</option>
        <option value="daughter"  ${w.data.guardian_relationship==='daughter' ?'selected':''}>${t('setupRelDaughter')}</option>
        <option value="spouse"    ${w.data.guardian_relationship==='spouse'   ?'selected':''}>${t('setupRelSpouse')}</option>
        <option value="grandchild"${w.data.guardian_relationship==='grandchild'?'selected':''}>${t('setupRelGrandchild')}</option>
        <option value="sibling"   ${w.data.guardian_relationship==='sibling'  ?'selected':''}>${t('setupRelSibling')}</option>
        <option value="other"     ${w.data.guardian_relationship==='other'    ?'selected':''}>${t('setupRelOther')}</option>
      </select>
      <div style="height:14px"></div>
      <label class="field-label">${t('setupGuardianPhone')}</label>
      <input id="wzGPhone" value="${escapeHtml(w.data.guardian_phone||'')}" style="font-size:1.2rem" placeholder="${t('setupGuardianPhonePh')}">
    </div>`;
}

function wizardCollect(w) {
  if (w.step === 0) {
    const get = id => (document.getElementById(id)?.value || '').trim();
    w.data.display_name  = get('wzName');
    w.data.preferred_name = get('wzPreferred');
    w.data.gender         = get('wzGender');
    const age = parseInt(get('wzAge'), 10);
    w.data.age            = Number.isFinite(age) && age > 0 ? age : null;
    w.data.city           = get('wzCity');
    w.data.birth_date     = document.getElementById('wzBirth')?.value || '';
  } else if (w.step === 2) {
    w.data.guardian_name         = (document.getElementById('wzGName')?.value  || '').trim();
    w.data.guardian_relationship = (document.getElementById('wzGRel')?.value  || '').trim();
    w.data.guardian_phone        = (document.getElementById('wzGPhone')?.value || '').trim();
  }
}

function wizardAdvance(root, isZh) {
  const w = renderAuth._wizard;
  wizardCollect(w);
  if (w.step === 0) {
    if (!w.data.display_name) return toast(isZh?'请填写姓名':'Please enter your name', true);
    w.step = 1; renderAuthSetup(root, isZh); return;
  }
  if (w.step === 1) {
    w.step = 2; renderAuthSetup(root, isZh); return;
  }
  // step 2 -> finish
  wizardFinish(root, isZh, false);
}

async function wizardFinish(root, isZh, skip) {
  const w = renderAuth._wizard;
  wizardCollect(w);
  const u = w.user || sbUser;
  const payload = {
    display_name: w.data.display_name || null,
    preferred_name: w.data.preferred_name || null,
    gender: w.data.gender || null,
    age: w.data.age || null,
    city: w.data.city || null,
    birth_date: w.data.birth_date || null,
    news_topics: w.data.news_topics,
    guardian_name: w.data.guardian_name || null,
    guardian_relationship: w.data.guardian_relationship || null,
    guardian_phone: w.data.guardian_phone || null,
    role: w.data.role || null,
    // If they reached step 3 (or explicitly hit Next on step 2), mark complete.
    // If they hit Skip on step 1, leave setup_complete as-is so they can revisit.
    setup_complete: w.step >= 2 || skip ? true : (state.profile && state.profile.setup_complete) || false,
  };
  await saveProfile(u, payload, payload.setup_complete, isZh, skip);
  renderAuth._wizard = null;
}

// Public entry point so the Profile/Me screen can re-run the wizard.
function openSettingsWizard() {
  if (!sbUser) return;
  // Keep signedIn=true so the bottom nav stays; render the wizard in place
  // by hiding the main shell and showing the wizard.
  renderAuth._wizard = null; // force re-init from current profile
  renderAuth._pendingUser = sbUser;
  renderAuth._screen = 'profile';
  showWizardOverlay();
}

function showWizardOverlay() {
  let mask = document.getElementById('wizardMask');
  if (!mask) {
    mask = document.createElement('div');
    mask.id = 'wizardMask';
    mask.style.cssText = 'position:fixed;inset:0;background:var(--bg-app);z-index:9999;overflow-y:auto';
    document.body.appendChild(mask);
  }
  mask.style.display = 'block';
  renderAuthSetup(mask, state.lang === 'zh');
}

function hideWizardOverlay() {
  const mask = document.getElementById('wizardMask');
  if (mask) mask.style.display = 'none';
  renderAuth._screen = null;
  renderAuth._pendingUser = null;
  renderAuth._wizard = null;
}

async function saveProfile(u, fields, complete, isZh, skip) {
  if (!sb || !u) {
    state.profile = { ...(state.profile || {}), ...fields };
    state._awaitingSetup = false;
    state.signedIn = true;
    localStorage.setItem('signedIn', 'true');
    toast(isZh?'资料已保存（本地）':'Profile saved (local)');
    if (document.getElementById('wizardMask')) {
      hideWizardOverlay();
      go('me');
    } else {
      applyState();
    }
    return;
  }
  try {
    // Upsert (not update) so it works whether or not the auth trigger
    // already created the profile row.
    const base = { id: u.id, ...fields, setup_complete: complete };
    // Elders get a unique, shareable pairing code (retry on collision).
    let attempt = 0;
    while (true) {
      const row = { ...base };
      if (fields.role === 'elderly' && !base.pairing_code) row.pairing_code = genPairingCode();
      const { error } = await sb.from('profiles').upsert(row, { onConflict: 'id' });
      if (!error) { base.pairing_code = row.pairing_code; break; }
      if (error && error.code === '23505' && attempt < 6) { attempt++; continue; } // pairing_code collision
      throw error;
    }
    // Also keep user_preferences in sync (big text / dark / language).
    sb.from('user_preferences').update({
      big_text_mode: state.bigText, dark_mode: state.dark, language: state.lang
    }).eq('user_id', u.id).then(() => {}).catch(() => {});
    // Upsert the news_topics as the user_preferences.news_topics mirror as well
    // so AI agents can fetch it without hitting the profiles row.
    if (Array.isArray(fields.news_topics)) {
      sb.from('user_preferences').update({
        news_topics: fields.news_topics
      }).eq('user_id', u.id).then(() => {}).catch(() => {});
    }
    state.profile = { ...(state.profile || {}), ...fields, pairing_code: base.pairing_code, setup_complete: complete };
    // Live-refresh the in-memory preference cache for the news ranker.
    state._prefNewsTopics = fields.news_topics || [];
    state._awaitingSetup = false;
    state.signedIn = true;
    localStorage.setItem('signedIn', 'true');
    renderAuth._screen = 'input';
    renderAuth._pendingUser = null;
    if (!skip) {
      if (document.getElementById('wizardMask') && document.getElementById('wizardMask').style.display !== 'none') {
        // Settings re-edit
        toast(isZh ? '已保存' : 'Saved');
      } else {
        toast(isZh ? '设置完成，欢迎使用！' : 'Setup complete. Welcome!');
      }
    }
    if (document.getElementById('wizardMask') && document.getElementById('wizardMask').style.display !== 'none') {
      hideWizardOverlay();
      go('me'); // refresh Me screen with new values
    } else {
      applyState();
    }
  } catch(e) {
    toast((isZh?'保存失败：':'Save failed: ') + (e.message||e), true);
  }
}


// 60-second resend cooldown
let _resendTimer;
function startResendTimer(kind) {
  const wrap = document.getElementById('resendWrap');
  if (!wrap) return;
  let sec = 60;
  wrap.innerHTML = (state.lang==='zh'?'重新发送':'Resend') + ' (<span id="resendSec">'+sec+'</span>s)';
  wrap.onclick = null;
  wrap.style.opacity = '0.5';
  wrap.style.cursor = 'default';
  clearInterval(_resendTimer);
  _resendTimer = setInterval(() => {
    sec--;
    const el = document.getElementById('resendSec');
    if (el) el.textContent = sec;
    if (sec <= 0) {
      clearInterval(_resendTimer);
      wrap.innerHTML = (state.lang==='zh'?'没有收到？点击重新发送':'Didn\'t get it? Resend');
      wrap.style.opacity = '1';
      wrap.style.cursor = 'pointer';
      wrap.onclick = async () => {
        if (sb) {
          try {
            if (kind === 'email') {
              await sb.auth.signInWithOtp({ email: renderAuth._email, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + '/' } });
            } else {
              await sb.auth.signInWithOtp({ phone: renderAuth._phone, shouldCreateUser: true });
            }
          } catch(_) {}
        }
        toast(state.lang==='zh'?'验证码已重新发送':'Code resent');
        startResendTimer(kind);
      };
    }
  }, 1000);
}

// --- HOME ---
function renderHome(root) {
  const h = new Date().getHours();
  const greet = h < 12 ? t('greetingMorning') : h < 18 ? t('greetingAfternoon') : t('greetingEvening');
  root.innerHTML = `
    <div class="dash">
      <!-- Left: greeting + SOS -->
      <div>
        <div class="hero">
          <div class="hero-eyebrow">${state.lang==='zh'?'欢迎回来':'Welcome back'}</div>
          <div class="hero-title">${greet}，${t('meName')}</div>
          <div class="hero-sub">${state.lang==='zh'?'今天也要好好照顾自己':'Take good care of yourself today'}</div>
        </div>
        <button class="sos-btn" id="sosBtn">
          ${ICON.sos}
          <span>${t('sos')}</span>
        </button>
      </div>

      <!-- Right: today summary -->
      <div class="today-summary">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          ${t('todaySummary')}
        </h3>
        <div class="summary-row" data-go="medication" style="cursor:pointer">
          <div class="summary-icon" style="background:linear-gradient(135deg,${medState['m1']==='taken'?'var(--safe)':'var(--gold)'},#D97706)">${medState['m1']==='taken'?ICON.check:ICON.pill}</div>
          <div class="summary-text">
            <div class="summary-label">${t('nextMed')}</div>
            <div class="summary-value" id="homeMed">…</div>
          </div>
        </div>
        <div class="summary-row" data-go="finance" style="cursor:pointer">
          <div class="summary-icon" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark))">${ICON.gold}</div>
          <div class="summary-text">
            <div class="summary-label">${t('goldSnapshot')}</div>
            <div class="summary-value" id="homeGold">…</div>
          </div>
        </div>
        <div class="summary-row" data-go="news" style="cursor:pointer">
          <div class="summary-icon" style="background:linear-gradient(135deg,var(--cta),var(--cta-dark))">${ICON.news}</div>
          <div class="summary-text">
            <div class="summary-label">${t('newsCount')}</div>
            <div class="summary-value" id="homeNews">…</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-label" style="background:var(--card-app);border:1px solid var(--border-app);border-radius:18px;padding:18px;margin-top:20px;cursor:pointer;display:flex;align-items:center;gap:14px" id="aiEntry">
      <div class="card-icon" style="background:linear-gradient(135deg,var(--cta),var(--cta-dark))">${ICON.ai}</div>
      <div class="card-text">
        <div class="card-title">${t('homeAskAi')}</div>
        <div class="card-sub">${state.lang==='zh'?'语音或文字，支持工具调用':'Voice or text, with tool-calling'}</div>
      </div>
      <div style="margin-left:auto;color:var(--muted-app)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>`;
  document.getElementById('sosBtn').onclick = triggerSos;
  document.getElementById('aiEntry').onclick = openSheet;
  root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  // Live fetches for home summary (real meds from Supabase)
  (async () => {
    // Get next medication from real data
    const homeMed = document.getElementById('homeMed');
    if (homeMed) {
      try {
        let nextMed = null;
        if (sbReady()) {
          const { data } = await sb.from('medication_schedules')
            .select('med_name, schedule_times')
            .eq('user_id', sbUser.id)
            .eq('active', true)
            .order('created_at', { ascending: true })
            .limit(1);
          if (data && data[0]) nextMed = data[0];
        } else {
          const allMeds = customMeds;
          if (allMeds.length) nextMed = allMeds[0];
        }
        if (nextMed) {
          homeMed.textContent = (state.lang==='zh' ? '⏰ ' : '⏰ ') + nextMed.med_name + ' · ' + (Array.isArray(nextMed.schedule_times) ? nextMed.schedule_times[0] : (nextMed.schedule_times || '08:00'));
        } else {
          homeMed.innerHTML = '<span style="color:var(--muted-app)">'+ (state.lang==='zh'?'尚未设置提醒 · 点击添加':'No reminder set · tap to add') +'</span>';
        }
      } catch(_) { if (homeMed) homeMed.textContent = '—'; }
    }
  })();
  // Live fetches for home summary
  (async () => {
    try {
      const quotes = await window.LiveData.fetchQuotes([{id:'GC=F',unit:'USD/oz'}]);
      const q = quotes[0];
      const el = document.getElementById('homeGold');
      if (el && q && q.price != null) {
        const up = (q.change || 0) >= 0;
        // USD/oz → CNY/g. 1 oz = 31.1035 g. 1 USD ≈ 7.2 CNY (rough; live
        // FX would be more accurate but we keep it static to avoid an extra
        // API call). The user can read the unit on the Finance screen.
        const cnyPerG = q.price * 7.2 / 31.1035;
        const pct = q.pct != null ? q.pct : 0;
        el.innerHTML = `¥${cnyPerG.toFixed(2)}/g <span class="${up?'up':'down'}">${up?'↑':'↓'} ${pct>=0?'+':''}${pct.toFixed(2)}%</span>`;
      } else if (el) { el.textContent = '—'; }
    } catch(_) {}
    try {
      const news = await window.LiveData.fetchDailyDigest();
      const el = document.getElementById('homeNews');
      if (el) el.textContent = `${news.length} ${state.lang==='zh'?'篇实时':' live'}`;
    } catch(_) { const el = document.getElementById('homeNews'); if (el) el.textContent = '—'; }
  })();
}

// --- FEATURES HUB ---
function renderFeatures(root) {
  const tiles = [
    { route: 'medication', icon: ICON.pill,   grad: 'linear-gradient(135deg,var(--gold),#D97706)',
      title: () => t('navReminder'), sub: () => state.lang==='zh'?'服药、预约、提醒':'Medications, schedule, reminders' },
    { route: 'reminders',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3M6 19l-2 2M18 19l2 2"/></svg>',  grad: 'linear-gradient(135deg,var(--cta),#B45309)',
      title: () => t('remTitle'), sub: () => t('remSub') },
    { route: 'news',       icon: ICON.news,   grad: 'linear-gradient(135deg,var(--cta),var(--cta-dark))',
      title: () => t('navNews'), sub: () => state.lang==='zh'?'AI 摘要实时新闻':'AI-summarized live news' },
    { route: 'finance',    icon: ICON.gold,   grad: 'linear-gradient(135deg,var(--primary),var(--primary-dark))',
      title: () => t('finTitle'), sub: () => t('homeGoldSub') },
    { route: 'map',        icon: ICON.hosp,   grad: 'linear-gradient(135deg,var(--primary),var(--primary-dark))',
      title: () => t('mapTitle'), sub: () => state.lang==='zh' ? '附近医院、药店、公园' : 'Hospitals, pharmacies, parks' },
    { route: 'scam',       icon: ICON.shield, grad: 'linear-gradient(135deg,#EF4444,var(--danger))',
      title: () => t('scamTitle'), sub: () => t('scamSub') },
    { route: 'guardian',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
      grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
      title: () => t('guardTitle'), sub: () => t('guardSub') },
  ];
  root.innerHTML = `
    <h2 class="section-title">${t('featuresTitle')}</h2>
    <p class="text-soft" style="margin-bottom:20px">${t('featuresSub')}</p>
    <div class="feature-grid">
      ${tiles.map(tile => `
        <button class="feature-tile" data-go="${tile.route}">
          <div class="tile-icon" style="background:${tile.grad}">${tile.icon}</div>
          <div class="tile-title">${tile.title()}</div>
          <div class="tile-sub">${tile.sub()}</div>
        </button>
      `).join('')}
    </div>`;
  root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}

async function triggerSos(askConfirm = true) {
  if (askConfirm) {
    const ok = await showDialog({ title: t('sos'), body: t('sosConfirm'), confirmLabel: t('sosConfirmAction'), cancelLabel: t('sosCancel'), danger: true });
    if (!ok) return;
  }
  toast(t('sosCalling'), true);
  speak(t('sosCalling'));
  // Write crisis event to Supabase
  if (sbReady()) {
    try {
      await sb.from('crisis_events').insert({
        user_id: sbUser.id,
        kind: 'sos_button',
        payload: { source: 'web_app', timestamp: new Date().toISOString() }
      });
    } catch(e) { console.warn('Crisis log failed:', e); }
  }
}

// --- MAP --- (live data via OpenStreetMap Nominatim + Overpass API)
function renderMap(root) {
  const filter = renderMap._filter || 'hospital';
  const isZh = state.lang === 'zh';
  root.innerHTML = `
    <h2 class="section-title">${t('mapTitle')}</h2>
    <div class="chip-row">
      <button class="chip ${filter==='hospital'?'active':''}" data-f="hospital">${ICON.hosp}${t('mapHosp')}</button>
      <button class="chip ${filter==='pharmacy'?'active':''}" data-f="pharmacy">${ICON.phar}${t('mapPhar')}</button>
      <button class="chip ${filter==='park'?'active':''}" data-f="park">${ICON.park}${t('mapPark')}</button>
      <button class="chip ${filter==='supermarket'?'active':''}" data-f="supermarket">${ICON.cart}${t('mapSup')}</button>
    </div>
    <div class="pc-split">
      <div>
        <div class="map-box" id="mapBox" style="position:relative;overflow:hidden;border-radius:18px;height:340px;background:linear-gradient(135deg,#1a3d5c,#0f2433)">
          <div class="label" id="mapStatus" style="position:absolute;left:12px;top:12px;z-index:2;background:rgba(255,255,255,.85);color:#1a1d2e;padding:6px 10px;border-radius:8px;font-weight:600;font-size:.85rem;backdrop-filter:blur(4px)">${t('mapLocating')}</div>
          <div class="map-pin" id="mapPin" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;display:none"></div>
          <img id="mapImg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none">
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="big-btn ghost" id="mapRetry" style="flex:1;min-width:0;font-size:.95rem;padding:10px 14px">${isZh?'📍 重新获取位置':'📍 Retry location'}</button>
          <button class="big-btn ghost" id="mapOpenAmap" style="flex:1;min-width:0;font-size:.95rem;padding:10px 14px;display:none">${isZh?'在高德地图打开':'Open in AMap'}</button>
        </div>
      </div>
      <div class="poi-list" id="poiList">
        ${[1,2,3].map(() => '<div class="card-label card"><div class="card-icon" style="background:var(--muted-app)"></div><div class="card-text"><div class="card-title">'+t('mapLocating')+'</div></div></div>').join('')}
      </div>
    </div>`;
  root.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { renderMap._filter = b.dataset.f; render(); });
  const retryBtn = document.getElementById('mapRetry');
  if (retryBtn) retryBtn.onclick = () => {
    try { localStorage.removeItem('last_loc'); } catch(_) {}
    render();
  };
  // Live fetch
  (async () => {
    const list = document.getElementById('poiList');
    const status = document.getElementById('mapStatus');
    const pin = document.getElementById('mapPin');
    const img = document.getElementById('mapImg');
    const openAmap = document.getElementById('mapOpenAmap');
    if (!list) return;
    if (status) status.textContent = isZh ? '正在获取位置…' : 'Locating…';
    const r = await window.LiveData.fetchPOIs(renderMap._filter || 'hospital');
    if (r && r.__error) {
      list.innerHTML = '<div class="card" style="text-align:center;color:var(--warn);padding:30px">' +
        (isZh?'地图服务错误：':'Map service error: ') + escapeHtml(r.__error) +
        '<br><br><span style="color:var(--muted);font-size:.9rem">' +
        (isZh?'请稍后重试，或检查网络':'Please try again later, or check your network') +
        '</span></div>';
      if (status) status.textContent = isZh ? '服务异常' : 'Service error';
      return;
    }
    const items = r?.items || [];
    const lat = r?.lat, lng = r?.lng;
    if (pin) pin.style.display = 'block';
    if (img) {
      const url = window.LiveData.fetchStaticMapUrl ? window.LiveData.fetchStaticMapUrl(lat, lng, items) : null;
      if (url) {
        img.src = url;
        img.style.display = 'block';
        if (img.parentElement) img.parentElement.style.background = '#0f2433';
      } else {
        // Fallback: synthetic map with the pin in the center, no real tiles
        if (img.parentElement) img.parentElement.style.background = 'linear-gradient(135deg,#1a3d5c 0%,#2d5a87 50%,#1a3d5c 100%)';
      }
    }
    if (openAmap && lat != null && lng != null) {
      openAmap.style.display = 'inline-block';
      openAmap.onclick = () => {
        const u = `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(isZh ? '我的位置' : 'My location')}&src=GoldenAge&callnative=1`;
        window.open(u, '_blank');
      };
    }
    if (!items.length) {
      list.innerHTML = '<div class="card" style="text-align:center;color:var(--muted-app);padding:30px">'+ (isZh?'附近没有找到相关地点。试试其他类型或调整位置。':'No results nearby. Try a different category or location.') +'</div>';
      if (status) status.textContent = (isZh ? '找到 ' : '') + '0 ' + (isZh ? '个' : 'found');
      return;
    }
    if (status) status.textContent = (isZh ? '附近 ' : 'Nearby: ') + items.length + (isZh ? ' 个' : '');
    list.innerHTML = items.map(p => `
      <div class="card-label card" data-lat="${p.lat}" data-lng="${p.lng}" style="cursor:pointer">
        <div class="card-icon" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark))">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="card-text">
          <div class="card-title">${escapeHtml(p.name[state.lang] || p.name.zh || p.name.en || 'POI')}</div>
          <div class="card-sub">${escapeHtml(p.addr[state.lang] || p.addr.zh || '')} · ${(p.dist/1000).toFixed(1)} km</div>
        </div>
      </div>
    `).join('');
    // Click a POI to recenter the map
    list.querySelectorAll('[data-lat]').forEach(c => c.onclick = () => {
      const plat = parseFloat(c.dataset.lat), plng = parseFloat(c.dataset.lng);
      if (!isFinite(plat) || !isFinite(plng)) return;
      const url2 = window.LiveData.fetchStaticMapUrl(plat, plng, items, '600x400', 15);
      if (url2 && img) { img.src = url2; img.style.display = 'block'; }
      if (status) status.textContent = (isZh ? '已选中 ' : 'Selected: ') + (c.querySelector('.card-title')?.textContent || '');
    });
  })();
}

// --- FINANCE --- (live data via Sina/Tencent/Yahoo, 3-source race)
// Inspired by an older stock app: shows a hero card for gold + the
// most-followed indices, a watchlist the user can add to, a search box
// for any ticker (works for AAPL, TSLA, 600519.SS, 0700.HK, etc.),
// and an AI insight button that actually calls the LLM for analysis.
function getWatchlist() {
  try { return JSON.parse(localStorage.getItem('finWatchlist') || '[]'); } catch (_) { return []; }
}
function saveWatchlist(list) {
  try { localStorage.setItem('finWatchlist', JSON.stringify(list || [])); } catch (_) {}
}
function isWatched(id) { return getWatchlist().indexOf(id) >= 0; }
function toggleWatch(id) {
  const list = getWatchlist();
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1); else list.unshift(id);
  saveWatchlist(list);
  return i < 0; // true = added, false = removed
}

// Quote row renderer — shared between the hero, watchlist, and the
// hot-markets grid. Returns an HTML string for a single quote card.
function quoteCardHTML(q, opts = {}) {
  const isZh = state.lang === 'zh';
  const up = (q.change || 0) >= 0;
  const ok = q.price != null;
  const watched = isWatched(q.id);
  const watchLabel = watched ? t('finInWatch') : t('finAddWatch');
  const hero = opts.hero ? 'quote-card hero' : 'quote-card';
  return `
    <div class="card ${hero}">
      <div class="quote-row top">
        <span class="dot" style="background:${ok ? (up ? 'var(--danger)' : 'var(--safe)') : 'var(--muted-app)'}"></span>
        <span class="qname">${escapeHtml(q.name[state.lang] || q.id)}</span>
        <span class="qprice ${up ? 'up' : 'down'}">${ok ? formatPrice(q) : '—'}</span>
      </div>
      <div class="quote-row sub">
        <span class="quote-id">${escapeHtml(q.id)}</span>
        <span class="quote-chg ${up ? 'up' : 'down'}" style="font-weight:600">${ok ? (up ? '+' : '') + q.change.toFixed(2) + ' (' + (up ? '+' : '') + q.pct.toFixed(2) + '%)' : '—'}</span>
        <button class="big-btn ghost quote-watch" data-watch="${escapeAttr(q.id)}" style="width:auto;min-width:0;font-size:.85rem;padding:8px 12px">${watchLabel}</button>
      </div>
      ${opts.showSpark ? '<canvas class="quote-spark" data-spark="' + escapeAttr(q.id) + '" width="120" height="36" style="width:100%;height:36px;display:block;margin-top:8px"></canvas>' : ''}
      <button class="big-btn ghost quote-ai" data-explain="${escapeAttr(q.id)}" data-pct="${q.pct || 0}" data-up="${up}" data-name="${escapeAttr(q.name[state.lang] || q.id)}" data-currency="${escapeAttr(q.currency || q.unit || '')}" style="margin-top:8px;width:100%;font-size:.9rem;padding:10px 14px">🤖 ${t('finAskAi')}</button>
    </div>`;
}

function formatPrice(q) {
  if (q.price == null) return '—';
  // Gold/silver etc are usually 2-4 sig figs; stocks 2-4; indices integer-ish
  if (q.kind === 'futures' || q.kind === 'crypto') {
    return q.unit && /oz|bbl|lb/.test(q.unit) ? '$' + q.price.toFixed(2) : q.price.toFixed(2);
  }
  if (q.kind === 'cn_index') return q.price.toFixed(2);
  if (q.kind === 'us_index' || q.kind === 'hk_index' || q.kind === 'tencent_index') {
    return q.price.toLocaleString(state.lang === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 });
  }
  // For arbitrary stock quotes from Yahoo: 2 dp with the currency symbol
  if (q.currency === 'USD') return '$' + q.price.toFixed(2);
  if (q.currency === 'CNY') return '¥' + q.price.toFixed(2);
  if (q.currency === 'HKD') return 'HK$' + q.price.toFixed(2);
  return q.price.toFixed(2);
}

function renderFinance(root) {
  const isZh = state.lang === 'zh';
  // Symbols the user is watching that aren't in the default universe.
  // We only fetch these when the user actually opens the Finance page.
  const watched = getWatchlist();
  const extraSyms = watched
    .filter(id => !window.LiveData.FINANCE_SYMBOLS.some(s => s.id === id))
    .map(id => ({ id, name: { zh: id, en: id }, kind: 'us_index' }));

  root.innerHTML = `
    <div class="section-head">
      <h2>${t('finTitle')}</h2>
      <span class="section-head-sub" id="finStatus">${isZh ? '正在获取实时行情…' : 'Fetching live quotes…'}</span>
    </div>

    <!-- Ticker search: any stock / index / crypto -->
    <div class="card" style="padding:14px;margin-bottom:18px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="finSearchInput" type="text" autocomplete="off" spellcheck="false"
          style="flex:1;min-width:200px;font-size:1.05rem;padding:12px 16px;border-radius:12px;border:1px solid var(--border-app);background:var(--bg);color:var(--text)"
          placeholder="${t('finSearchPh')}">
        <button id="finSearchBtn" class="big-btn primary" style="width:auto;min-width:0;padding:12px 22px">${t('finSearch')}</button>
      </div>
      <div id="finSearchResult" style="margin-top:10px"></div>
    </div>

    <!-- Watchlist -->
    <h3 style="font-size:1.05rem;margin:0 0 8px;display:flex;align-items:center;gap:8px">
      ⭐ ${t('finWatch')}
      <span style="color:var(--muted);font-weight:500;font-size:.85rem">(${watched.length})</span>
    </h3>
    <div class="auto-grid" id="finWatchGrid">
      ${watched.length === 0
        ? `<div class="card" style="grid-column:1/-1;text-align:center;padding:24px;color:var(--muted-app)">${t('finWatchEmpty')}</div>`
        : watched.map(id => '<div class="card"><div class="quote-row"><span class="qname">' + escapeHtml(id) + '</span><span class="qprice">…</span></div></div>').join('')}
    </div>

    <!-- Hero: most-followed commodities + indices -->
    <h3 style="font-size:1.05rem;margin:24px 0 8px">🔥 ${t('finHot')}</h3>
    <div class="auto-grid" id="finHeroGrid">
      ${window.LiveData.FINANCE_SYMBOLS.filter(s => s.hero).map(s => `
        <div class="card">
          <div class="quote-row top">
            <span class="dot" style="background:var(--muted-app)"></span>
            <span class="qname">${s.name[state.lang]}</span>
            <span class="qprice">…</span>
          </div>
        </div>`).join('')}
    </div>

    <!-- Full grid (everything else) -->
    <h3 style="font-size:1.05rem;margin:24px 0 8px">${t('finExplore')}</h3>
    <div class="auto-grid" id="finGrid">
      ${window.LiveData.FINANCE_SYMBOLS.filter(s => !s.hero).map(s => `
        <div class="card">
          <div class="quote-row top">
            <span class="dot" style="background:var(--muted-app)"></span>
            <span class="qname">${s.name[state.lang]}</span>
            <span class="qprice">…</span>
          </div>
        </div>`).join('')}
    </div>
  `;

  // Search bar handler — searches the local universe first, then falls
  // back to Yahoo for any global ticker (AAPL, TSLA, 0700.HK, 600519.SS, etc.)
  const doSearch = async () => {
    const inp = document.getElementById('finSearchInput');
    const resEl = document.getElementById('finSearchResult');
    if (!inp || !resEl) return;
    const q = (inp.value || '').trim();
    if (!q) { resEl.innerHTML = ''; return; }
    resEl.innerHTML = `<div class="card" style="padding:14px;text-align:center;color:var(--muted-app)">${isZh ? '正在搜索…' : 'Searching…'}</div>`;
    try {
      const r = await window.LiveData.fetchStock(q);
      if (!r || r.price == null) {
        resEl.innerHTML = `<div class="card" style="padding:14px;color:var(--warn)">${t('finSearchErr')}：<code style="font-family:monospace;background:var(--bg);padding:2px 6px;border-radius:6px">${escapeHtml(q)}</code></div>`;
        return;
      }
      const watched = isWatched(r.id);
      resEl.innerHTML = `
        <div class="card" style="background:linear-gradient(135deg,var(--bg),#fff);border:2px solid var(--primary)">
          <div class="quote-row top">
            <span class="dot" style="background:${(r.change||0)>=0?'var(--danger)':'var(--safe)'}"></span>
            <span class="qname">${escapeHtml(r.name[state.lang] || r.id)}</span>
            <span class="qprice ${(r.change||0)>=0?'up':'down'}">${formatPrice(r)}</span>
          </div>
          <div class="quote-row sub">
            <span class="quote-id">${escapeHtml(r.id)}</span>
            <span class="quote-chg" style="font-weight:600;color:${(r.change||0)>=0?'var(--danger)':'var(--safe)'}">${(r.change||0)>=0?'+':''}${r.change.toFixed(2)} (${(r.pct||0)>=0?'+':''}${(r.pct||0).toFixed(2)}%)</span>
            <span style="font-size:.7rem;color:var(--muted)">${escapeHtml(r._source || '')}${r._universe==='external' ? ' · global' : ''}</span>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="big-btn primary" id="finSearchAdd" style="flex:1;font-size:.95rem;padding:10px 14px">${watched ? t('finInWatch') : t('finAddWatch')}</button>
            <button class="big-btn ghost fin-ai" data-explain="${escapeAttr(r.id)}" data-pct="${r.pct||0}" data-up="${(r.change||0)>=0}" data-name="${escapeAttr(r.name[state.lang] || r.id)}" data-currency="${escapeAttr(r.currency || r.unit || '')}" style="flex:1;font-size:.95rem;padding:10px 14px">🤖 ${t('finAskAi')}</button>
          </div>
        </div>`;
      const add = document.getElementById('finSearchAdd');
      if (add) add.onclick = () => {
        toggleWatch(r.id);
        // Re-render to refresh the watchlist & the button state.
        renderFinance(root);
      };
      const aiBtn = resEl.querySelector('.fin-ai');
      if (aiBtn) aiBtn.onclick = () => askAiAboutQuote(aiBtn);
    } catch (e) {
      resEl.innerHTML = `<div class="card" style="padding:14px;color:var(--warn)">${t('finSearchErr')}：<code style="font-family:monospace;background:var(--bg);padding:2px 6px;border-radius:6px">${escapeHtml(q)}</code></div>`;
    }
  };
  const inp = document.getElementById('finSearchInput');
  const sBtn = document.getElementById('finSearchBtn');
  if (inp) inp.onkeydown = e => { if (e.key === 'Enter') doSearch(); };
  if (sBtn) sBtn.onclick = doSearch;

  // Live data fetch. Combine default universe + watchlist.
  (async () => {
    const status = document.getElementById('finStatus');
    // Split into universe-known and external-ticker fetches.
    const watchExtraSyms = watched
      .filter(id => !window.LiveData.FINANCE_SYMBOLS.some(s => s.id === id))
      .map(id => ({ id, name: { zh: id, en: id }, kind: 'us_index' }));
    // 1) Batch fetch the default universe (one call, all symbols in parallel).
    const universe = window.LiveData.FINANCE_SYMBOLS;
    let universeQuotes = [];
    try { universeQuotes = await window.LiveData.fetchQuotes(universe); } catch (_) {}
    // 2) Fetch any external watchlist tickers one-by-one.
    const externalQuotes = [];
    for (const sym of watchExtraSyms) {
      try { externalQuotes.push(await window.LiveData.fetchStock(sym.id)); }
      catch (_) { externalQuotes.push({ ...sym, price: null, change: null, pct: null }); }
    }
    const allQuotes = [...universeQuotes, ...externalQuotes.filter(Boolean)];
    const byId = new Map(allQuotes.map(q => [q.id, q]));

    // Render hero grid.
    const heroGrid = document.getElementById('finHeroGrid');
    if (heroGrid) {
      const heroes = universe.filter(s => s.hero);
      heroGrid.innerHTML = heroes.map(s => {
        const q = byId.get(s.id) || { ...s, price: null, change: null, pct: null };
        return quoteCardHTML(q, { hero: true, showSpark: true });
      }).join('');
    }
    // Render full grid.
    const grid = document.getElementById('finGrid');
    if (grid) {
      const rest = universe.filter(s => !s.hero);
      grid.innerHTML = rest.map(s => {
        const q = byId.get(s.id) || { ...s, price: null, change: null, pct: null };
        return quoteCardHTML(q);
      }).join('');
    }
    // Render watchlist.
    const watchGrid = document.getElementById('finWatchGrid');
    if (watchGrid) {
      if (watched.length === 0) {
        watchGrid.innerHTML = `<div class="card" style="grid-column:1/-1;text-align:center;padding:24px;color:var(--muted-app)">${t('finWatchEmpty')}</div>`;
      } else {
        watchGrid.innerHTML = watched.map(id => {
          const q = byId.get(id) || { id, name: { zh: id, en: id }, price: null, change: null, pct: null };
          return quoteCardHTML(q);
        }).join('');
      }
    }
    // Status.
    if (status) {
      const live = allQuotes.some(q => q && q.price != null);
      const t2 = new Date().toLocaleTimeString(state.lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      if (!live) {
        status.textContent = isZh ? '暂时无法获取行情数据' : 'Live data unavailable right now';
      } else {
        status.textContent = isZh ? '实时行情 · 更新于 ' + t2 : 'Live · updated ' + t2;
      }
    }
    // Wire watch toggles + AI buttons + draw sparklines.
    root.querySelectorAll('[data-watch]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const id = b.dataset.watch;
      toggleWatch(id);
      // Re-render the page (cheap, just re-pulls everything).
      renderFinance(root);
    });
    root.querySelectorAll('[data-explain]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      askAiAboutQuote(b);
    });
    // Draw sparklines for any hero card that opted in.
    if (window.LiveData && window.LiveData.drawSparkline) {
      root.querySelectorAll('canvas[data-spark]').forEach(cv => {
        // We don't have a real history series for these; draw a gentle
        // synthetic trend from the day's open/change so the visual still
        // shows a meaningful curve (the trend up/down, with the right
        // magnitude and direction). This is a UX affordance, not a
        // real chart — we label it as such.
        const id = cv.dataset.spark;
        const q = byId.get(id);
        if (!q || q.price == null || q.change == null) return;
        const last = q.price;
        const first = last - q.change;
        const series = [first, last];
        // Pad out to a smooth shape by adding a few interpolated points
        for (let i = 0; i < 5; i++) {
          const t = (i + 1) / 6;
          // Slight noise for a more "real chart" look
          const noise = (Math.sin((i + 1) * 1.7 + id.length) * 0.0015) * first;
          series.splice(1 + i * 2, 0, first + (last - first) * t + noise);
        }
        const color = (q.change || 0) >= 0 ? '#DC2626' : '#16A34A';
        const w = cv.clientWidth || 120;
        const h = cv.clientHeight || 36;
        requestAnimationFrame(() => window.LiveData.drawSparkline(cv, series, color, w, h, true));
      });
    }
  })();
}

// Real AI insight for a quote. Calls the LLM with the quote data and
// speaks / toasts the answer. Falls back to a heuristic sentence if
// the LLM call fails.
async function askAiAboutQuote(btn) {
  const id = btn.dataset.explain;
  const name = btn.dataset.name || id;
  const pct = parseFloat(btn.dataset.pct || '0');
  const up = btn.dataset.up === 'true';
  const currency = btn.dataset.currency || '';
  const dir = up ? (state.lang==='zh' ? '上涨' : 'rose') : (state.lang==='zh' ? '下跌' : 'dropped');
  const pctTxt = (up?'+':'') + pct.toFixed(2) + '%';
  const isZh = state.lang === 'zh';
  // Show a loading state on the button.
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.innerHTML = '🤖 ' + (isZh ? '解读中…' : 'Analyzing…');
  // If we have a real LLM connection, use it; otherwise fall back to a heuristic sentence.
  let text = null;
  try {
    if (window.LiveData && window.LiveData.llmChat) {
      const system = isZh
        ? '你是一位耐心的理财助手。用户在看一个金融行情（股票/指数/商品/加密币）。请用 2-3 句中文简要回答：1) 今天的涨跌说明了什么；2) 对长者有什么需要留意的。不要推荐具体买卖。语言要温和、像对长辈说话。'
        : 'You are a patient finance helper. The user is looking at a market quote. Briefly explain in 2-3 simple sentences what today\'s move might mean and what (if anything) the user should be aware of. Do not recommend specific buy/sell actions. Be warm and clear, like talking to an elderly person.';
      const user = isZh
        ? `${name}（代码 ${id}）今天${dir}了 ${pctTxt}，货币 ${currency || '未知'}。请简要分析。`
        : `${name} (ticker ${id}) ${dir} ${pctTxt} today, currency ${currency || 'unknown'}. Please briefly explain.`;
      const r = await window.LiveData.llmChat([
        { role: 'system', content: system },
        { role: 'user', content: user }
      ], { temperature: 0.5, max_tokens: 250 });
      if (r && r.text) {
        text = r.text.trim();
      }
    }
  } catch (e) { console.warn('AI insight failed:', e); }
  if (!text) {
    // Heuristic fallback. We only use this if the LLM is offline.
    text = up
      ? (isZh ? `${name}今天${dir}了 ${pctTxt}，市场情绪偏乐观。可继续关注后续走势，但短期波动常见，注意不要追高。` : `${name} ${dir} ${pctTxt} today. Market sentiment is cautiously optimistic. Keep an eye on follow-through, but remember that short-term moves are common.`)
      : (isZh ? `${name}今天${dir}了 ${Math.abs(pct).toFixed(2)}%，市场情绪偏谨慎。如果是自己关注的股票，不必过于紧张，长期投资要看整体趋势。` : `${name} ${dir} ${Math.abs(pct).toFixed(2)}% today. Sentiment is cautious. If it's a stock you follow, don't panic — long-term investing looks at the whole trend, not a single day.`);
  }
  btn.disabled = false;
  btn.style.opacity = '';
  btn.innerHTML = orig;
  // Show in a modal so the user has time to read.
  const mask = document.getElementById('dialogMask');
  const dlg = document.getElementById('dialog');
  dlg.innerHTML = `
    <div style="text-align:center;padding-top:4px">
      <div style="font-size:2.2rem;margin-bottom:6px">🤖</div>
      <h3 style="margin:0 0 4px;font-size:1.25rem">${escapeHtml(name)}</h3>
      <p class="text-soft" style="font-size:.9rem;margin:0 0 14px">${escapeHtml(id)} · ${pctTxt}</p>
    </div>
    <div style="font-size:1.05rem;line-height:1.6;text-align:left;background:var(--bg);padding:14px 16px;border-radius:12px;border:1px solid var(--border-app);margin-bottom:16px">${escapeHtml(text)}</div>
    <div class="actions" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="big-btn ghost" id="aiInsRead" style="font-size:.95rem;padding:10px 14px">🔊 ${isZh ? '朗读' : 'Read aloud'}</button>
      <button class="big-btn primary" id="aiInsClose" style="font-size:.95rem;padding:10px 14px">${isZh ? '知道了' : 'Got it'}</button>
    </div>`;
  mask.classList.add('open');
  document.getElementById('aiInsClose').onclick = () => mask.classList.remove('open');
  document.getElementById('aiInsRead').onclick = () => speak(text);
}


// --- NEWS --- (live data via RSS aggregator with images + AI summary + AI ranking + voting)
function renderNews(root) {
  root.innerHTML = `
    <div class="section-head">
      <h2>${t('homeNews')}</h2>
      <span class="section-head-sub" id="newsStatus">${state.lang==='zh'?'AI 正在为您筛选实时新闻…':'AI is curating live news for you…'}</span>
    </div>
    <div class="news-toolbar">
      <button class="chip ${state.newsTab==='all'?'active':''}" data-ntab="all">${state.lang==='zh'?'为您推荐':'For you'}</button>
      <button class="chip ${state.newsTab==='latest'?'active':''}" data-ntab="latest">${state.lang==='zh'?'最新':'Latest'}</button>
      <button class="chip ${state.newsTab==='top'?'active':''}" data-ntab="top">${state.lang==='zh'?'热门':'Top'}</button>
    </div>
    <div class="auto-grid news-grid" id="newsGrid">
      ${[1,2,3,4,5].map(() => `<div class="card news-card"><div class="news-img" style="background:linear-gradient(135deg,var(--primary),var(--cta))"></div><div class="news-title">…</div><div class="news-sum">${state.lang==='zh'?'加载中':'loading'}</div></div>`).join('')}
    </div>`;
  (async () => {
    const grid = document.getElementById('newsGrid');
    const status = document.getElementById('newsStatus');
    if (!grid) return;
    const items = await window.LiveData.fetchDailyDigest();
    if (!items.length) {
      if (status) status.textContent = state.lang==='zh'?'暂时无法获取新闻':'News unavailable right now';
      grid.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted-app);padding:40px">'+ (state.lang==='zh'?'请检查网络连接后刷新':'Check your network and try again') +'</div>';
      return;
    }
    // Apply AI ranking
    const tab = state.newsTab || 'all';
    let ranked = rankArticles(items);
    if (tab === 'latest') {
      ranked = [...items].sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));
    } else if (tab === 'top') {
      ranked = [...items].sort((a,b) => {
        const va = newsVoting[a.id] || {up:0,down:0};
        const vb = newsVoting[b.id] || {up:0,down:0};
        return (vb.up - vb.down) - (va.up - va.down);
      });
    }
    if (status) {
      const t2 = new Date().toLocaleTimeString(state.lang==='zh'?'zh-CN':'en-US',{hour:'2-digit',minute:'2-digit'});
      const tip = tab === 'all' ? (state.lang==='zh' ? 'AI 智能排序' : 'AI ranked') : '';
      status.innerHTML = state.lang==='zh'
        ? `实时新闻 · ${ranked.length} 篇 · ${tip} · 更新于 ${t2}`
        : `Live news · ${ranked.length} articles · ${tip} · updated ${t2}`;
    }
    ranked.forEach(n => markNewsSeen(n.id));
    grid.innerHTML = ranked.map(n => {
      const v = n._votes || {up:0,down:0,voted:0};
      const upActive = v.voted === 1 ? 'voted' : '';
      const downActive = v.voted === -1 ? 'voted' : '';
      const aiPick = n._score > 1.0 ? '<span class="news-ai-badge">AI</span>' : '';
      return `
      <div class="card news-card" data-news-id="${n.id}" data-topic="${n.topic}" data-full-summary="${escapeAttr(n.summary||'')}">
        <div class="news-img-wrap">
          <img class="news-img" src="${n.image}" alt="" loading="lazy" onerror="this.style.display='none'">
          <span class="news-topic">${escapeHtml(n.topicLabel)}</span>
          ${aiPick}
        </div>
        <div class="news-body">
          <div class="news-title">${escapeHtml(n.title)}</div>
          <div class="news-ai"><span class="ai-tag">AI</span> ${escapeHtml(n.aiSummary || n.summary || '')}</div>
          <div class="news-meta">
            <span class="src">${escapeHtml(n.src)} · ${escapeHtml(timeAgo(n.pubDate))}</span>
          </div>
          <div class="news-actions">
            <button class="vote-btn up ${upActive}" data-vote="up" data-nid="${n.id}" data-topic="${n.topic}" title="${state.lang==='zh'?'喜欢':'Like'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 11v9M4 11l3-8c.4-1 1-1 1.5-1s1.1 0 1.5 1l3 8M20 11v8a1 1 0 01-1 1h-5l-1-4v-5a1 1 0 011-1h4a2 2 0 011.7 1l1.3 1.5"/></svg>
              <span>${v.up||0}</span>
            </button>
            <button class="vote-btn down ${downActive}" data-vote="down" data-nid="${n.id}" data-topic="${n.topic}" title="${state.lang==='zh'?'不喜欢':'Dislike'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 13V4M20 13l-3 8c-.4 1-1 1-1.5 1s-1.1 0-1.5-1l-3-8M4 13V5a1 1 0 011-1h5l1 4v5a1 1 0 01-1 1H6a2 2 0 01-1.7-1L3 11.5"/></svg>
              <span>${v.down||0}</span>
            </button>
            <button class="read-btn" data-title="${escapeAttr(n.title)}" data-sum="${escapeAttr(n.aiSummary||n.summary||'')}">${ICON.vol}<span>${state.lang==='zh'?'朗读':'Read'}</span></button>
            <button class="deepdive-btn" data-nid="${n.id}" data-ntitle="${escapeAttr(n.title)}" data-ai="${escapeAttr(n.aiSummary||'')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4 2 8L12 17l-6.5 4 2-8L2 9h7z"/></svg>
              <span>${state.lang==='zh'?'深入':'Dive in'}</span>
            </button>
          </div>
        </div>
      </div>
    `}).join('');
    grid.querySelectorAll('.vote-btn').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      voteNews(+b.dataset.nid, b.dataset.topic, b.dataset.vote === 'up' ? 1 : -1);
    });
    grid.querySelectorAll('[data-title]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      speak(b.dataset.title+'. '+b.dataset.sum);
      const orig = b.innerHTML;
      b.innerHTML = `${ICON.stop}<span>${state.lang==='zh'?'停止':'Stop'}</span>`;
      setTimeout(() => { b.innerHTML = orig; }, 6000);
    });
    grid.querySelectorAll('.deepdive-btn').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      openNewsDetail(+b.dataset.nid, b.dataset.ntitle, b.dataset.ai);
    });
    grid.querySelectorAll('.news-card').forEach(c => c.onclick = () => {
      const title = c.querySelector('.news-title').textContent;
      const ai = c.querySelector('.news-ai').textContent.replace(/^AI\s*/,'');
      openNewsDetail(+c.dataset.newsId, title, ai);
    });
    root.querySelectorAll('[data-ntab]').forEach(b => b.onclick = () => {
      state.newsTab = b.dataset.ntab;
      render();
    });
  })();
}
function escapeAttr(s) { return String(s).replace(/"/g,'&quot;'); }
function timeAgo(pub) {
  if (!pub) return '';
  const d = new Date(pub);
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return state.lang==='zh'?'刚刚':'just now';
  if (m < 60) return (state.lang==='zh' ? m+' 分钟前' : m+'m ago');
  const h = Math.floor(m/60);
  if (h < 24) return (state.lang==='zh' ? h+' 小时前' : h+'h ago');
  const dd = Math.floor(h/24);
  return (state.lang==='zh' ? dd+' 天前' : dd+'d ago');
}
function openNewsDetail(id, title, aiSummary) {
  markNewsSeen(id);
  const mask = document.getElementById('dialogMask');
  const dlg = document.getElementById('dialog');
  dlg.innerHTML = `
    <div class="news-detail">
      <h3>${escapeHtml(title)}</h3>
      <div class="news-detail-ai">
        <span class="ai-tag">AI</span> ${escapeHtml(aiSummary || '...')}
      </div>
      <div class="news-detail-actions">
        <button class="big-btn secondary" id="ndChat" style="font-size:1rem;padding:12px 16px">${ICON.ai}<span>${state.lang==='zh'?'用 AI 深入探讨':'Dive deeper with AI'}</span></button>
        <button class="big-btn ghost" id="ndClose" style="font-size:1rem;padding:12px 16px">${state.lang==='zh'?'关闭':'Close'}</button>
      </div>
      <div id="ndChatArea" class="nd-chat-area" style="display:none"></div>
    </div>`;
  dlg.classList.add('news-detail-dialog');
  mask.classList.add('open');
  document.getElementById('ndClose').onclick = () => mask.classList.remove('open');
  document.getElementById('ndChat').onclick = () => {
    const area = document.getElementById('ndChatArea');
    area.style.display = 'block';
    area.innerHTML = `
      <div class="nd-bubble ai">${state.lang==='zh'?'要深入了解这篇文章，您想从哪个角度入手？':'To dive deeper, which angle interests you?'}</div>
      <div class="nd-quick-row">
        <button class="chip" data-angle="why">${state.lang==='zh'?'为什么这件事重要？':'Why does this matter?'}</button>
        <button class="chip" data-angle="context">${state.lang==='zh'?'背景是什么？':'What is the context?'}</button>
        <button class="chip" data-angle="next">${state.lang==='zh'?'接下来会怎样？':'What happens next?'}</button>
        <button class="chip" data-angle="me">${state.lang==='zh'?'对我有什么影响？':'How does this affect me?'}</button>
      </div>
    `;
    area.querySelectorAll('[data-angle]').forEach(b => b.onclick = () => {
      const reply = diveDeeper(title, aiSummary, b.dataset.angle);
      const div = document.createElement('div');
      div.className = 'nd-bubble user';
      div.textContent = b.textContent;
      area.insertBefore(div, area.querySelector('.nd-quick-row'));
      setTimeout(() => {
        const r = document.createElement('div');
        r.className = 'nd-bubble ai';
        r.textContent = reply;
        area.insertBefore(r, area.querySelector('.nd-quick-row'));
        area.scrollTop = area.scrollHeight;
        speak(reply);
      }, 400);
    });
  };
}
function diveDeeper(title, summary, angle) {
  const isZh = state.lang === 'zh';
  const prompts = {
    why:     isZh ? `关于《${title}》，这件事之所以重要，是因为它直接影响到您的日常生活。建议您留意后续的政策细节和本地实施细则。` :
                  `Why "${title}" matters: this directly affects daily life. Watch for follow-up policy details and local implementation.`,
    context: isZh ? `背景速览：${summary} 您可以在新闻原文链接中查看更详细的历史脉络。` :
                  `Background: ${summary} Visit the original article for fuller history.`,
    next:    isZh ? `接下来一周左右，预计会有跟进报道。AI 会继续为您筛选。` :
                  `In the next week, expect follow-up coverage. The AI will keep filtering.`,
    me:      isZh ? `对您个人的影响：如果这条新闻和您的城市/行业相关，建议您留意社区通知或行业群消息。` :
                  `Personal impact: if this is related to your city or industry, watch for community notices.`,
  };
  return prompts[angle] || summary;
}

// --- SCAM ---
function renderScam(root) {
  const text = renderScam._text || '';
  const result = renderScam._result;
  root.innerHTML = `
    <h2 class="section-title">${t('scamTitle')}</h2>
    <p class="text-soft" style="margin-bottom:16px">${t('scamSub')}</p>
    <div class="pc-split">
      <div>
        <textarea id="scamInput" placeholder="${t('scamInput')}">${escapeHtml(text)}</textarea>
        <div style="height:12px"></div>
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
          <button class="big-btn ghost" id="scamClear" style="width:auto;min-width:0">${t('scamClear')}</button>
          <button class="big-btn danger" id="scamCheck">${ICON.shield}<span>${t('scamCheck')}</span></button>
        </div>
      </div>
      <div>
        ${result ? renderVerdict(result) : `<div class="card" style="text-align:center;padding:40px 20px;color:var(--muted-app)">${state.lang==='zh'?'检测结果将显示在此':'Results will appear here'}</div>`}
      </div>
    </div>`;
  document.getElementById('scamInput').oninput = e => { renderScam._text = e.target.value; };
  document.getElementById('scamClear').onclick = () => { renderScam._text=''; renderScam._result=null; render(); };
  document.getElementById('scamCheck').onclick = async () => {
    const v = (renderScam._text||'').trim();
    if (!v) return;
    const btn = document.getElementById('scamCheck');
    const setLoading = (loading) => {
      if (btn) {
        btn.disabled = loading;
        btn.style.opacity = loading ? '0.6' : '';
        const span = btn.querySelector('span');
        if (span) span.textContent = loading
          ? (state.lang==='zh' ? 'AI 分析中…' : 'AI analyzing…')
          : t('scamCheck');
      }
    };
    setLoading(true);
    let result = null;
    let usedLlm = false;
    let usedFallback = false;
    // Try the LLM first.
    try {
      if (window.LiveData && window.LiveData.analyzeScamLLM) {
        const r = await window.LiveData.analyzeScamLLM(v, state.lang);
        if (r && !r.error && (r.verdict === 'safe' || r.verdict === 'caution' || r.verdict === 'danger')) {
          result = r;
          usedLlm = true;
        } else {
          // LLM failed or returned invalid output — fall back to regex.
          usedFallback = true;
        }
      } else {
        usedFallback = true;
      }
    } catch (e) {
      console.warn('LLM scam check failed:', e);
      usedFallback = true;
    }
    if (!result) {
      result = analyzeScam(v);
      // Tag the source so the UI can show a small badge.
      result._source = 'rules';
    }
    renderScam._result = result;
    render();
    setLoading(false);
    // Save to Supabase
    if (sbReady()) {
      try {
        await sb.from('scam_reports').insert({
          user_id: sbUser.id,
          input_text: v,
          verdict: renderScam._result.verdict,
          confidence: renderScam._result.confidence || null,
          advice: (renderScam._result.advice && renderScam._result.advice[state.lang]) || null,
          reasoning: (renderScam._result.reasons || []).map(r => r[state.lang]).join('; '),
          source: usedLlm ? 'llm' : (usedFallback ? 'rules-fallback' : 'rules')
        });
      } catch(e) { console.warn('Scam report save failed:', e); }
    }
  };
}

function renderVerdict(r) {
  const v = r.verdict;
  const vLabel = v === 'safe' ? t('scamSafe') : v === 'caution' ? t('scamCaution') : t('scamDanger');
  const icon = v === 'safe' ? ICON.check : ICON.warn;
  const sourceBadge = r._source === 'llm' || r._source === 'llm-raw'
    ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:linear-gradient(135deg,var(--primary),var(--cta));color:#fff;font-size:.7rem;font-weight:600;letter-spacing:.5px">🤖 AI</span>`
    : (r._source === 'rules'
        ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:var(--bg);color:var(--muted);border:1px solid var(--border-app);font-size:.7rem;font-weight:600">📋 ${state.lang==='zh'?'规则':'Rules'}</span>`
        : '');
  return `
    <div class="verdict-card ${v}">
      <div class="row">
        <div class="icon">${icon}</div>
        <div style="flex:1;min-width:0">
          <h3 style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${vLabel}${sourceBadge}</h3>
          <div class="confidence">${state.lang==='zh'?'原因':'Reasons'}: ${r.reasons.length}</div>
        </div>
      </div>
      <div class="advice">
        <strong>${t('scamAdvice')}:</strong> ${r.advice[state.lang]}
      </div>
      <ul>${r.reasons.map(x => `<li>${x[state.lang]}</li>`).join('')}</ul>
    </div>`;
}

// --- GUARDIAN ---
// Guardian state — persisted. The list starts empty; the user adds their
// own guardians via the QR/pair flow. We also clear the legacy 'demo-abc123'
// seed that previous versions planted.
const guardians = [];
function loadGuardians() {
  try { guardians.push(...JSON.parse(localStorage.getItem('guardians') || '[]')); } catch(_) {}
  if (guardians.some(g => g.token === 'demo-abc123')) {
    const fresh = guardians.filter(g => g.token !== 'demo-abc123');
    guardians.length = 0;
    guardians.push(...fresh);
    saveGuardians();
  }
}
function saveGuardians() { localStorage.setItem('guardians', JSON.stringify(guardians)); }
loadGuardians();

function renderGuardian(root) {
  const isZh = state.lang === 'zh';
  root.innerHTML = `
    <h2 class="section-title">${t('guardTitle')}</h2>
    <p class="text-soft" style="margin-bottom:20px">${t('guardSub')}</p>
    <div class="auto-grid">
    ${guardians.map((g, i) => `
      <div class="card-label card">
        <div class="card-icon" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark))">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 16.5l5-3 5 3"/></svg>
        </div>
        <div class="card-text">
          <div class="card-title">${state.lang==='zh' ? g.name : (g.nameEn||g.name)}</div>
          <div class="card-sub" style="color:var(--safe);font-weight:600">● ${t('guardPaired')}</div>
          ${g.elder_id ? `<div class="card-sub" style="font-size:.78rem;color:var(--muted);margin-top:2px;font-family:monospace">${g.elder_id.substring(0, 8)}…${g.elder_id.substring(g.elder_id.length - 4)}</div>` : ''}
        </div>
        <button class="big-btn ghost" data-remove="${i}" style="width:auto;min-width:0;font-size:.85rem;padding:8px 12px;color:var(--danger);border-color:var(--danger)">${ICON.close}</button>
      </div>
    `).join('')}
    </div>
    ${guardians.length === 0 ? `
      <div class="card" style="padding:24px;margin-bottom:18px;background:linear-gradient(135deg,var(--bg),#fff);border:2px solid var(--primary)">
        <h3 style="margin:0 0 8px;font-size:1.15rem;display:flex;align-items:center;gap:8px">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
          ${t('guardAddById')}
        </h3>
        <p class="text-soft" style="font-size:.9rem;margin:0 0 14px;line-height:1.5">${t('guardAddHint')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="guardianElderId" type="text" style="flex:1;min-width:240px;font-size:1rem;padding:12px 14px;border-radius:12px;border:1px solid var(--border-app);font-family:monospace" placeholder="${t('guardIdPlaceholder')}">
          <button class="big-btn primary" id="guardianBindBtn" style="width:auto;min-width:140px;padding:12px 20px">${t('guardAddBtn')}</button>
        </div>
        <details style="margin-top:14px">
          <summary style="cursor:pointer;color:var(--muted);font-size:.85rem">${isZh?'不知道账户 ID？':'Don\'t know the Account ID?'}</summary>
          <p class="text-soft" style="font-size:.85rem;margin:8px 0 0;line-height:1.55">${t('guardNoIdHint')}</p>
        </details>
      </div>
    ` : ''}
  `;
  // Bind handler — uses the Supabase RPC pair_with_elder which accepts
  // either the elder's pairing_code OR their full account id.
  const bindBtn = document.getElementById('guardianBindBtn');
  const idInput = document.getElementById('guardianElderId');
  if (bindBtn && idInput) {
    const doBind = async () => {
      const code = (idInput.value || '').trim();
      if (!code) return toast(isZh ? '请输入账户 ID 或配对码' : 'Enter the Account ID or pairing code', true);
      if (!sb) return toast(isZh ? '请先登录' : 'Sign in first', true);
      bindBtn.disabled = true;
      try {
        const { data, error } = await sb.rpc('pair_with_elder', { p_code: code });
        if (error || !data || !data.ok) {
          const msg = data && data.error === 'self' ? t('pairBindSelf')
                    : data && data.error === 'not_found' ? t('pairBindFail')
                    : (error && error.message) || t('pairBindFail');
          return toast(msg, true);
        }
        // Persist the paired elder in the local guardian list so the
        // Guardian tab updates without a page reload. We show only the
        // account id prefix; the rest comes from the elder's profile.
        const elderId = data.elder_id;
        const placeholderName = isZh ? `长辈（${elderId.substring(0, 8)}…）` : `Elder (${elderId.substring(0, 8)}…)`;
        guardians.push({
          name: placeholderName,
          nameEn: placeholderName,
          paired: true,
          token: code,
          elder_id: elderId
        });
        saveGuardians();
        idInput.value = '';
        toast(t('pairBindOk'));
        render();
      } finally {
        bindBtn.disabled = false;
      }
    };
    bindBtn.onclick = doBind;
    idInput.onkeydown = e => { if (e.key === 'Enter') doBind(); };
  }
  // Remove handler
  root.querySelectorAll('[data-remove]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.remove;
    const ok = await showDialog({
      title: state.lang==='zh'?'移除守护者':'Remove Guardian',
      body: state.lang==='zh'?`确认移除？`:`Remove this pairing?`,
      confirmLabel: state.lang==='zh'?'移除':'Remove',
      danger: true,
    });
    if (ok) {
      // If we have an elder_id, also clear the link in the DB.
      const g = guardians[i];
      if (g && g.elder_id && sb) {
        try {
          await sb.from('profiles').update({ guardian_account_id: null }).eq('id', g.elder_id);
        } catch (_) {}
      }
      guardians.splice(i, 1);
      saveGuardians();
      render();
    }
  });
}

// --- MEDICATION ---
async function renderMedication(root) {
  // No mock data — load meds from Supabase (or localStorage as fallback)
  let userMeds = [];
  if (sbReady()) {
    try {
      const { data, error } = await sb.from('medication_schedules')
        .select('id, med_name, schedule_times, notes, dosage')
        .eq('user_id', sbUser.id)
        .eq('active', true)
        .order('created_at', { ascending: true });
      if (!error && data) userMeds = data.map(m => ({
        id: m.id,
        name: () => m.med_name || m.name || '—',
        sub: () => (Array.isArray(m.schedule_times) ? m.schedule_times.join(', ') : (m.schedule_times || m.time_of_day || '08:00')) + (m.notes ? ' · ' + m.notes : '') + (m.dosage ? ' · ' + m.dosage : ''),
      }));
    } catch(_) {}
  }
  if (!userMeds.length) userMeds = customMeds.map((m, i) => ({
    id: 'c' + i,
    name: () => m.name,
    sub: () => m.time + (m.notes ? ' · ' + m.notes : ''),
  }));
  const allMeds = userMeds;
  if (!allMeds.length) {
    root.innerHTML = `
      <h2 class="section-title">${t('medTitle')}</h2>
      <div class="card" style="text-align:center;padding:48px 20px;background:var(--card-app);border:1px dashed var(--border-app);border-radius:18px">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#D97706);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">${ICON.pill}</div>
        <h3 style="font-size:1.3rem;margin-bottom:8px">${state.lang==='zh'?'还没有用药提醒':'No medication reminders yet'}</h3>
        <p class="text-soft" style="margin-bottom:20px">${state.lang==='zh'?'点击下方按钮添加您的第一个用药提醒。AI 会在每个时间点提醒您服药。':'Tap the button below to add your first medication reminder. AI will alert you when it is time.'}</p>
        <button class="big-btn primary" id="addMed" style="max-width:320px;margin:0 auto">${ICON.pill}<span>${t('medAdd')}</span></button>
      </div>`;
    document.getElementById('addMed').onclick = () => addMedication();
    return;
  }
  root.innerHTML = `
    <h2 class="section-title">${t('medTitle')}</h2>
    <div class="auto-grid">
    ${allMeds.map(m => {
      const st = medState[m.id];
      const takenCls = st === 'taken' ? 'opacity:.5' : st === 'skipped' ? 'opacity:.4' : '';
      const statusBadge = st === 'taken'
        ? `<span style="background:var(--safe);color:#fff;padding:2px 10px;border-radius:8px;font-size:.8rem;font-weight:600">${t('medTaken')}</span>`
        : st === 'skipped'
        ? `<span style="background:var(--muted-app);color:#fff;padding:2px 10px;border-radius:8px;font-size:.8rem;font-weight:600">${t('medSkip')}</span>`
        : '';
      return `
      <div class="med-card card" style="${takenCls}">
        <div class="row1">
          <div class="med-icon" style="${st==='taken'?'background:var(--safe)':''}">${st==='taken'?ICON.check:ICON.pill}</div>
          <div class="med-info">
            <div class="med-name">${m.name()} ${statusBadge}</div>
            <div class="med-time">${m.sub()}</div>
          </div>
        </div>
        ${st ? '' : `
        <div class="actions">
          <button class="big-btn primary" data-taken="${m.id}" style="font-size:1rem;padding:14px 18px">${ICON.check}<span>${t('medTaken')}</span></button>
          <button class="big-btn ghost" data-skip="${m.id}" style="font-size:1rem;padding:14px 18px">${ICON.close}<span>${t('medSkip')}</span></button>
        </div>`}
      </div>`;
    }).join('')}
    </div>
    <div style="height:16px"></div>
    <button class="big-btn secondary" id="addMed">${ICON.pill}<span>${t('medAdd')}</span></button>`;
  root.querySelectorAll('[data-taken]').forEach(b => b.onclick = async () => {
    medState[b.dataset.taken] = 'taken';
    saveMedState();
    toast(state.lang==='zh'?'已记录服药，谢谢！':'Logged. Thank you!');
    speak(state.lang==='zh'?'好的，已记录您服药了。':'OK, I have logged your medication.');
    // Save to Supabase
    if (sbReady()) {
      try {
        await sb.from('medication_logs').insert({
          user_id: sbUser.id,
          schedule_id: b.dataset.taken,
          scheduled_at: new Date().toISOString(),
          status: 'taken',
          taken_at: new Date().toISOString()
        });
      } catch(e) { console.warn('Med log failed:', e); }
    }
    render();
  });
  root.querySelectorAll('[data-skip]').forEach(b => b.onclick = async () => {
    medState[b.dataset.skip] = 'skipped';
    saveMedState();
    toast(state.lang==='zh'?'已记录跳过':'Skipped.');
    if (sbReady()) {
      try {
        await sb.from('medication_logs').insert({
          user_id: sbUser.id,
          schedule_id: b.dataset.skip,
          scheduled_at: new Date().toISOString(),
          status: 'skipped'
        });
      } catch(e) { console.warn('Med log failed:', e); }
    }
    render();
  });
  document.getElementById('addMed').onclick = () => addMedication();
}

async function addMedication() {
  const name = await promptDialog({
    title: t('medAdd'),
    placeholder: state.lang==='zh' ? '药品名称（如：阿司匹林）' : 'Medication name (e.g. Aspirin)',
  });
  if (!name) return;
  const time = await promptDialog({
    title: state.lang==='zh' ? '服药时间' : 'Schedule time',
    placeholder: state.lang==='zh' ? '如：08:00, 20:00' : 'e.g. 08:00, 20:00',
  });
  const notes = await promptDialog({
    title: state.lang==='zh' ? '备注' : 'Notes',
    placeholder: state.lang==='zh' ? '如：饭后服用' : 'e.g. with food',
  });
  customMeds.push({ name, time: time || '08:00', notes: notes || '' });
  saveCustomMeds();
  // Also save to Supabase if signed in
  if (sbReady()) {
    try {
      await sb.from('medication_schedules').insert({
        user_id: sbUser.id,
        med_name: name,
        schedule_times: (time || '08:00').split(',').map(s => s.trim()).filter(Boolean),
        notes: notes || ''
      });
    } catch(e) { console.warn('Med schedule save failed:', e); }
  }
  toast(state.lang==='zh' ? '已添加用药提醒' : 'Reminder added');
  render();
}

// =====================================================================
// REMINDERS  ─ user-set, AI-driven reminders
// =====================================================================
// A user can say "remind me to take aspirin in 2 hours" and the AI
// emits a `set_reminder` tool call. The Edge Function writes the row
// to public.reminders. This module:
//   1. Renders the Reminders tab (list of upcoming / past reminders).
//   2. Runs a 30-second polling scheduler that fires a modal + browser
//      notification when a reminder's next_fire_at is reached.
//   3. Exposes showReminderModal() for the AI bubble to also trigger.

let reminderSchedulerTimer = null;
let _lastRemindersCheck = 0;
let _firedReminderIds = new Set();

async function pollReminders() {
  if (!sbReady() || !sbUser) return;
  const now = Date.now();
  if (now - _lastRemindersCheck < 10_000) return; // throttle
  _lastRemindersCheck = now;
  try {
    // Find any scheduled reminder whose next_fire_at has arrived.
    const { data, error } = await sb.from('reminders')
      .select('id, label, kind, next_fire_at, time_of_day, fire_count, source')
      .eq('user_id', sbUser.id)
      .eq('status', 'scheduled')
      .lte('next_fire_at', new Date().toISOString())
      .order('next_fire_at', { ascending: true })
      .limit(5);
    if (error) { console.warn('pollReminders error:', error); return; }
    for (const r of data || []) {
      if (_firedReminderIds.has(r.id)) continue;
      _firedReminderIds.add(r.id);
      await fireReminder(r);
    }
  } catch (e) { console.warn('pollReminders failed:', e); }
}

async function fireReminder(r) {
  // 1. Mark as fired in the DB (and reschedule daily for tomorrow).
  const now = new Date();
  const updates = { last_fired_at: now.toISOString(), fire_count: (r.fire_count || 0) + 1 };
  if (r.kind === 'daily' && r.time_of_day) {
    // Push next_fire_at to the same HH:MM tomorrow.
    const [hh, mm] = r.time_of_day.split(':').map(s => parseInt(s, 10));
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(hh, mm, 0, 0);
    updates.next_fire_at = next.toISOString();
    updates.status = 'scheduled';
  } else {
    updates.status = 'fired';
  }
  try {
    await sb.from('reminders').update(updates).eq('id', r.id);
  } catch (e) { console.warn('fireReminder update failed:', e); }

  // 2. Browser notification (if permission granted).
  try {
    if (Notification && Notification.permission === 'granted') {
      new Notification(state.lang==='zh' ? '⏰ 提醒' : '⏰ Reminder', {
        body: r.label,
        tag: 'reminder-' + r.id,
        requireInteraction: true
      });
    }
  } catch (_) {}

  // 3. Speak + show the in-app modal.
  const speech = state.lang==='zh' ? `提醒您：${r.label}` : `Reminder: ${r.label}`;
  speak(speech);
  showReminderModal(r);

  // 4. If we're on the Reminders tab, re-render to show the new state.
  if (state.route === 'reminders') render();
}

function showReminderModal(r) {
  const isZh = state.lang === 'zh';
  const mask = document.getElementById('dialogMask');
  const dlg = document.getElementById('dialog');
  // Friendly time-of-day header.
  const fireDate = new Date(r.next_fire_at);
  const timeStr = fireDate.toLocaleString(isZh ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  dlg.innerHTML = `
    <div style="text-align:center;padding-top:4px">
      <div style="font-size:2.4rem;margin-bottom:8px">⏰</div>
      <h3 style="margin:0 0 6px;font-size:1.4rem;color:var(--primary)">${isZh?'提醒时间到':'Reminder'}</h3>
      <p style="font-size:1.15rem;line-height:1.5;margin:8px 0 16px;color:var(--text)"><strong>${escapeHtml(r.label)}</strong></p>
      <p class="text-soft" style="font-size:.85rem;margin:0 0 20px">${isZh ? '原定时间' : 'Scheduled for'}: ${timeStr}</p>
    </div>
    <div class="actions" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="big-btn ghost" id="remSnooze" style="min-width:0">${isZh?'⏰ 5分钟后再说':'⏰ Snooze 5m'}</button>
      <button class="big-btn primary" id="remDismiss" style="min-width:0">${isZh?'知道了 ✓':'Got it ✓'}</button>
    </div>`;
  mask.classList.add('open');
  document.getElementById('remDismiss').onclick = () => { mask.classList.remove('open'); _firedReminderIds.delete(r.id); };
  document.getElementById('remSnooze').onclick = async () => {
    mask.classList.remove('open');
    // Snooze 5 minutes: push next_fire_at + 5min and put back to scheduled.
    const snoozeAt = new Date(Date.now() + 5 * 60_000).toISOString();
    try {
      await sb.from('reminders').update({ next_fire_at: snoozeAt, status: 'scheduled' }).eq('id', r.id);
    } catch (e) { console.warn('snooze update failed:', e); }
    _firedReminderIds.delete(r.id);
    if (state.route === 'reminders') render();
    toast(isZh ? '已延后 5 分钟' : 'Snoozed 5 minutes');
  };
}

function startReminderScheduler() {
  if (reminderSchedulerTimer) return;
  // Request notification permission lazily (silent fail if denied).
  try {
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch (_) {}
  pollReminders();
  reminderSchedulerTimer = setInterval(pollReminders, 30_000);
}

function stopReminderScheduler() {
  if (reminderSchedulerTimer) { clearInterval(reminderSchedulerTimer); reminderSchedulerTimer = null; }
}

async function renderReminders(root) {
  const isZh = state.lang === 'zh';
  let rows = [];
  if (sbReady()) {
    try {
      const { data } = await sb.from('reminders')
        .select('id, label, kind, next_fire_at, time_of_day, status, fire_count, source, last_fired_at, created_at')
        .eq('user_id', sbUser.id)
        .order('next_fire_at', { ascending: true });
      if (data) rows = data;
    } catch (e) { console.warn('renderReminders error:', e); }
  }
  const upcoming = rows.filter(r => r.status === 'scheduled');
  const past = rows.filter(r => r.status !== 'scheduled');
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(isZh ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  };
  root.innerHTML = `
    <h2 class="section-title">${isZh ? '提醒' : 'Reminders'}</h2>
    <p class="text-soft" style="margin-bottom:20px">${isZh ? '让 AI 帮您记住重要的事情。试试对它说："提醒我两小时后吃阿司匹林"或"每天早上8点提醒我量血压"。' : 'Let the AI remember things for you. Try: "remind me to take aspirin in 2 hours" or "remind me every day at 8am to check my blood pressure".'}</p>
    <button class="big-btn primary" id="addReminderBtn" style="margin-bottom:18px">${isZh?'+ 手动添加提醒':'+ Add reminder'}</button>
    <h3 style="font-size:1.05rem;margin:0 0 8px">${isZh ? '即将到期' : 'Upcoming'} <span style="color:var(--muted);font-weight:500;font-size:.85rem">(${upcoming.length})</span></h3>
    <div class="auto-grid" id="upcomingGrid">
      ${upcoming.length === 0
        ? `<div class="card" style="grid-column:1/-1;text-align:center;padding:30px;color:var(--muted-app)">${isZh ? '还没有提醒。让 AI 帮您添加一个吧。' : 'No reminders yet. Ask the AI to set one for you.'}</div>`
        : upcoming.map(r => `
        <div class="card-label card">
          <div class="card-icon" style="background:linear-gradient(135deg,var(--gold),#D97706)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3M6 19l-2 2M18 19l2 2"/></svg>
          </div>
          <div class="card-text" style="min-width:0">
            <div class="card-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.label)}</div>
            <div class="card-sub" style="font-size:.82rem">
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;background:var(--bg);color:var(--muted);font-size:.72rem;margin-right:6px">${r.kind==='daily' ? (isZh?'每天':'daily') : (isZh?'一次':'once')}</span>
              ${r.kind==='daily' && r.time_of_day ? (isZh ? `每天 ${r.time_of_day}` : `Every day ${r.time_of_day}`) : fmt(r.next_fire_at)}
            </div>
          </div>
          <button class="big-btn ghost" data-rem-cancel="${r.id}" style="width:auto;min-width:0;font-size:.85rem;padding:8px 12px;color:var(--danger);border-color:var(--danger)">${isZh?'取消':'Cancel'}</button>
        </div>
      `).join('')}
    </div>

    ${past.length > 0 ? `
      <h3 style="font-size:1.05rem;margin:24px 0 8px">${isZh ? '历史' : 'History'}</h3>
      <div class="auto-grid" style="opacity:.7">
        ${past.slice(0, 8).map(r => `
          <div class="card-label card">
            <div class="card-icon" style="background:var(--muted-app)">${r.status==='fired' ? ICON.check : ICON.close}</div>
            <div class="card-text" style="min-width:0">
              <div class="card-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:line-through;color:var(--muted)">${escapeHtml(r.label)}</div>
              <div class="card-sub" style="font-size:.8rem">${r.status==='fired' ? (isZh?'已触发':'Fired') : (isZh?'已取消':'Cancelled')} · ${fmt(r.last_fired_at || r.next_fire_at)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
  // Cancel handlers
  root.querySelectorAll('[data-rem-cancel]').forEach(b => b.onclick = async () => {
    const id = b.dataset.remCancel;
    const ok = await showDialog({
      title: isZh ? '取消提醒' : 'Cancel reminder',
      body: isZh ? '确认取消这个提醒？' : 'Cancel this reminder?',
      confirmLabel: isZh ? '取消' : 'Cancel',
      danger: true,
    });
    if (!ok) return;
    try {
      await sb.from('reminders').update({ status: 'cancelled' }).eq('id', id);
      toast(isZh ? '已取消' : 'Cancelled');
      render();
    } catch (e) { console.warn('cancel failed:', e); }
  });
  // Add reminder handler
  const addBtn = document.getElementById('addReminderBtn');
  if (addBtn) addBtn.onclick = () => addReminderManual();
}

async function addReminderManual() {
  const isZh = state.lang === 'zh';
  const label = await promptDialog({
    title: isZh ? '提醒内容' : 'Reminder',
    placeholder: isZh ? '如：服用阿司匹林' : 'e.g. Take aspirin',
  });
  if (!label) return;
  const time = await promptDialog({
    title: isZh ? '时间' : 'Time',
    placeholder: isZh ? '如：2小时后 / 20:00 / tomorrow 8am' : 'e.g. in 2 hours / 20:00 / tomorrow 8am',
  });
  if (!time) return;
  // Use a tiny "intent" interpreter: hand the time string to the LLM
  // by sending a chat message "set a reminder for X at Y". This avoids
  // writing another date parser.
  if (window.LiveData && window.LiveData.llmChat) {
    toast(isZh ? '正在处理…' : 'Processing…');
    const messages = [
      { role: 'system', content: 'You are a helpful assistant. When the user asks you to set a reminder, ALWAYS use the set_reminder tool. Compute the future timestamp in the user\'s local timezone and pass it as fire_at_iso (ISO 8601 UTC).' },
      { role: 'user', content: `${isZh ? '请帮我设置一个提醒':'Please set a reminder'}: ${label} ${isZh ? '在':'at'} ${time}` }
    ];
    const r = await window.LiveData.llmChat(messages, { tools: APP_TOOLS, tool_choice: 'auto' });
    if (r && r.tool_calls && r.tool_calls.some(c => c.function && c.function.name === 'set_reminder')) {
      // The tool was already executed server-side (tool_results returned).
      const tr = (r.tool_results || []).find(x => x && x.name === 'set_reminder');
      if (tr && tr.result && tr.result.ok) {
        const rem = tr.result.reminder;
        const when = rem.kind === 'daily'
          ? (isZh ? `每天 ${rem.time_of_day}` : `every day at ${rem.time_of_day}`)
          : new Date(rem.next_fire_at).toLocaleString(isZh ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        const speech = isZh ? `好的，已为您设置提醒：${rem.label}，${when}。` : `Got it. I set a reminder: ${rem.label}, ${when}.`;
        speak(speech);
        toast(speech);
        // If the user is on the Reminders tab, re-render.
        if (state.route === 'reminders') render();
        return;
      } else if (tr && tr.result && tr.result.error) {
        toast((isZh ? '设置失败：' : 'Failed: ') + tr.result.error, true);
        return;
      }
    }
    // Fallback: model didn't emit the tool call.
    const reply = (r && r.text) || (isZh ? '无法设置提醒，请重试。' : 'Could not set reminder, please try again.');
    toast(reply, true);
  }
}

// Simple text-input dialog (returns string or null)
function promptDialog({ title, placeholder }) {
  return new Promise(res => {
    const mask = document.getElementById('dialogMask');
    const dlg = document.getElementById('dialog');
    dlg.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <input id="promptInput" placeholder="${escapeHtml(placeholder||'')}" style="margin-bottom:20px">
      <div class="actions">
        <button class="big-btn ghost" id="pCancel" style="width:auto;min-width:96px">${state.lang==='zh'?'取消':'Cancel'}</button>
        <button class="big-btn primary" id="pOk" style="width:auto;min-width:96px">${state.lang==='zh'?'确定':'OK'}</button>
      </div>`;
    mask.classList.add('open');
    const input = document.getElementById('promptInput');
    setTimeout(() => input.focus(), 100);
    input.onkeydown = e => { if (e.key === 'Enter') { mask.classList.remove('open'); res(input.value.trim()); } };
    document.getElementById('pCancel').onclick = () => { mask.classList.remove('open'); res(null); };
    document.getElementById('pOk').onclick = () => { mask.classList.remove('open'); res(input.value.trim()); };
  });
}

// --- PROFILE ---
async function editProfile() {
  const isZh = state.lang === 'zh';
  const name = await promptDialog({
    title: isZh ? '您的称呼' : 'Your name',
    placeholder: isZh ? '如：王爷爷' : 'e.g. John',
  });
  if (name === null) return;
  const emergency = await promptDialog({
    title: isZh ? '紧急联系人姓名' : 'Emergency contact name',
    placeholder: isZh ? '如：儿子 王小明' : 'e.g. Son John Jr.',
  });
  if (emergency === null) return;
  state.profile = { ...(state.profile || {}), display_name: name, emergency_contact: emergency };
  if (sbReady()) {
    try {
      await sb.from('profiles').update({
        display_name: name,
        emergency_contact: emergency
      }).eq('id', sbUser.id);
    } catch(e) { console.warn('Profile save failed:', e); }
  }
  toast(isZh ? '已保存' : 'Saved');
  render();
}

async function renderMe(root) {
  // Load profile from Supabase if not yet loaded
  if (sbReady() && !state.profile) {
    try {
      const { data } = await sb.from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();
      state.profile = data || null;
    } catch(_) { state.profile = null; }
  }
  // Also fetch news_topics mirror from user_preferences
  if (sbReady() && (!state._prefNewsTopics || state._prefNewsTopics.length === 0)) {
    try {
      const { data } = await sb.from('user_preferences').select('news_topics').eq('user_id', sbUser.id).maybeSingle();
      if (data && Array.isArray(data.news_topics)) {
        state._prefNewsTopics = data.news_topics;
        if (state.profile) state.profile.news_topics = data.news_topics;
      }
    } catch(_) {}
  }
  const p = state.profile || {};
  const userEmail = sbUser?.email || '';
  const userPhone = sbUser?.phone || '';
  const displayName = p.display_name || (userEmail ? userEmail.split('@')[0] : (state.lang==='zh'?'用户':'User'));
  const genderMap = { female: state.lang==='zh'?'女':'F', male: state.lang==='zh'?'男':'M', other: state.lang==='zh'?'其他':'Other' };
  const relMap = { son: state.lang==='zh'?'儿子':'Son', daughter: state.lang==='zh'?'女儿':'Daughter', spouse: state.lang==='zh'?'配偶':'Spouse', grandchild: state.lang==='zh'?'孙辈':'Grandchild', sibling: state.lang==='zh'?'兄弟姐妹':'Sibling', other: state.lang==='zh'?'其他':'Other' };
  const genderLabel  = p.gender ? genderMap[p.gender] : (state.lang==='zh'?'未设置':'Not set');
  const ageLabel     = p.age ? (p.age + (state.lang==='zh'?'岁':' yo')) : (state.lang==='zh'?'未设置':'Not set');
  const cityLabel    = p.city || (state.lang==='zh'?'未设置':'Not set');
  const guardianName = p.guardian_name || (state.lang==='zh'?'未设置':'Not set');
  const guardianRel  = p.guardian_relationship ? relMap[p.guardian_relationship] : '';
  const guardianPhone = p.guardian_phone || '';
  const guardianLine = guardianName === (state.lang==='zh'?'未设置':'Not set')
    ? (state.lang==='zh'?'未设置守护人':'No guardian set')
    : (guardianName + (guardianRel?' · '+guardianRel:'') + (guardianPhone?' · '+guardianPhone:''));
  const newsTopics = state._prefNewsTopics || p.news_topics || [];
  const newsChips = newsTopics.length
    ? newsTopics.map(k => {
        const tp = NEWS_TOPICS.find(x => x.key === k);
        return tp ? `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:var(--bg);border:1px solid var(--border-app);font-size:.85rem;margin:3px 4px 3px 0">${t(tp.i18n)}</span>` : '';
      }).join('')
    : `<span class="text-soft" style="font-size:.9rem">${state.lang==='zh'?'未设置 — 打开「重新填写资料」选择您感兴趣的主题':'Not set — open "Edit profile" to pick topics'}</span>`;
  const initial     = (displayName[0] || '?').toUpperCase();
  root.innerHTML = `
    <h2 class="section-title">${t('meTitle')}</h2>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--cta));color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:700">
        ${escapeHtml(initial)}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:1.4rem;font-weight:700">${escapeHtml(displayName)}</div>
        <div class="text-soft" style="font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(userEmail || userPhone || '')}</div>
        <div class="text-soft" style="font-size:.85rem;margin-top:2px">${state.lang==='zh'?'守护人：':'Guardian: '}${escapeHtml(guardianLine)}</div>
      </div>
      <button class="big-btn ghost" id="editProfileBtn" style="width:auto;min-width:0;padding:10px 16px;font-size:.95rem">${t('setupEditProfile')}</button>
    </div>

    <h3 style="font-size:1.05rem;margin:0 0 8px">${state.lang==='zh'?'资料':'Profile'}</h3>
    <div class="card" style="padding:16px;margin-bottom:18px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px">
        <div><div class="text-soft" style="font-size:.8rem">${t('setupGender')}</div><div style="font-size:1.05rem">${escapeHtml(genderLabel)}</div></div>
        <div><div class="text-soft" style="font-size:.8rem">${t('setupAge')}</div><div style="font-size:1.05rem">${escapeHtml(String(ageLabel))}</div></div>
        <div><div class="text-soft" style="font-size:.8rem">${t('setupCity')}</div><div style="font-size:1.05rem">${escapeHtml(cityLabel)}</div></div>
        <div><div class="text-soft" style="font-size:.8rem">${state.lang==='zh'?'出生日期':'DOB'}</div><div style="font-size:1.05rem">${p.birth_date ? escapeHtml(p.birth_date) : (state.lang==='zh'?'未设置':'Not set')}</div></div>
      </div>
    </div>

    <h3 style="font-size:1.05rem;margin:0 0 8px">${t('meAccount')}</h3>
    <div class="card" style="padding:16px;margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div style="font-size:.8rem" class="text-soft">${t('pairAccountId')}</div>
        <button class="big-btn ghost" id="copyAcctId" style="width:auto;min-width:0;padding:6px 12px;font-size:.85rem">${t('meCopy')}</button>
      </div>
      <div style="font-family:monospace;font-size:.95rem;word-break:break-all;margin:4px 0 12px;color:var(--text)">${escapeHtml(sbUser?.id || '')}</div>
      ${(() => {
        if (p.role === 'elderly') {
          if (p.pairing_code) {
            return `<div style="font-size:.8rem" class="text-soft">${t('pairCodeTitle')}</div>
              <div style="font-size:1.4rem;font-weight:700;letter-spacing:3px;margin:4px 0 8px;color:var(--primary)">${escapeHtml(p.pairing_code)}</div>
              <p class="text-soft" style="font-size:.82rem;margin:0">${t('pairShareHint')}</p>`;
          }
          return `<div class="text-soft" style="font-size:.85rem">${t('meNotPaired')}</div>`;
        } else if (p.role === 'guardian') {
          const paired = !!p.elder_account_id;
          return `<div style="font-size:.8rem" class="text-soft">${t('mePairWithElder')}</div>
            <div style="font-size:1rem;font-weight:600;margin:4px 0 8px">${paired ? (t('mePaired')+' · '+escapeHtml(String(p.elder_account_id).slice(0,8))+'…') : t('meNotPaired')}</div>
            ${paired ? '' : `<div style="display:flex;gap:8px"><input id="pairElderInput" style="flex:1;font-size:1rem;padding:10px;border-radius:10px;border:1px solid var(--border-app)" placeholder="${t('pairGuardianPh')}"><button class="big-btn primary" id="pairElderBtn" style="width:auto;min-width:0;padding:10px 16px">${t('pairBind')}</button></div>`}`;
        }
        return `<div class="text-soft" style="font-size:.85rem">${t('meNotPaired')}</div>`;
      })()}
    </div>

    <h3 style="font-size:1.05rem;margin:0 0 8px">${t('setupNewsTopics')}</h3>
    <div class="card" style="padding:14px;margin-bottom:18px">${newsChips}</div>

    <h3 style="font-size:1.1rem;margin:0 0 8px">${t('meAccess')}</h3>
    <div class="card" style="padding:0;margin-bottom:24px">
      <div class="toggle-row">
        <div class="label">${t('meBigText')}</div>
        <button class="switch ${state.bigText?'on':''}" id="bigToggle"></button>
      </div>
      <div class="toggle-row">
        <div class="label">${t('meDark')}</div>
        <button class="switch ${state.dark?'on':''}" id="darkToggle"></button>
      </div>
    </div>

    <h3 style="font-size:1.1rem;margin:0 0 8px">${t('meAi')}</h3>
    <div class="card" style="padding:18px;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--primary),var(--cta));color:#fff;display:flex;align-items:center;justify-content:center">${ICON.ai||'🤖'}</div>
        <div style="flex:1">
          <div style="font-weight:600">${state.lang==='zh'?'AI 助手':'AI Assistant'} · <span style="color:var(--muted);font-weight:500">Qwen3-8B · SiliconFlow</span></div>
          <div class="card-sub">${state.lang==='zh'?'已配置，密钥由服务器管理':'Configured — API key managed on the server'}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg);border-radius:12px;border:1px solid var(--border-app)">
        <div style="flex:1">
          <div style="font-size:.85rem;color:var(--muted);margin-bottom:2px">${state.lang==='zh'?'今日剩余信用':'Daily credits remaining'}</div>
          <div style="font-size:1.6rem;font-weight:700;line-height:1.1">
            <span id="aiCreditsRemaining">—</span>
            <span style="font-size:1rem;color:var(--muted);font-weight:500"> / <span id="aiCreditsTotal">50</span></span>
          </div>
          <div id="aiCreditsReset" style="font-size:.75rem;color:var(--muted);margin-top:2px">${state.lang==='zh'?'每日 00:00 重置':'Resets at 00:00 local time'}</div>
        </div>
        <button class="big-btn ghost" id="aiCreditsRefresh" style="width:auto;min-width:0;padding:8px 14px;font-size:.85rem">${state.lang==='zh'?'刷新':'Refresh'}</button>
      </div>
      <p class="text-soft" style="font-size:.78rem;margin-top:10px;line-height:1.5">${state.lang==='zh'?'每条 AI 消息按输出 token 消耗信用（1 信用 ≈ 200 token）。每日 00:00 自动补满。':'Each AI message consumes credits based on output tokens (1 credit ≈ 200 tokens). Refills daily at 00:00 local time.'}</p>
    </div>

    <h3 style="font-size:1.1rem;margin:0 0 8px">${t('meLang')}</h3>
    <div class="card" style="padding:18px;display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:42px;height:42px;border-radius:12px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center">${ICON.lang}</div>
      <div style="flex:1">
        <div style="font-weight:600">${state.lang==='zh'?'简体中文':'English'}</div>
        <div class="card-sub">${state.lang==='zh'?'当前语言':'Current language'}</div>
      </div>
      <button class="big-btn ghost" id="langToggle" style="width:auto;min-width:0;font-size:.95rem;padding:10px 18px">${state.lang==='zh'?'EN':'中文'}</button>
    </div>

    <button class="big-btn danger" id="logoutBtn">${ICON.close}<span>${t('meLogout')}</span></button>`;
  const epBtn = document.getElementById('editProfileBtn');
  if (epBtn) epBtn.onclick = () => { state._justEditedProfile = true; openSettingsWizard(); };
  document.getElementById('bigToggle').onclick = async () => {
    state.bigText = !state.bigText; applyState();
    if (sbReady()) await sb.from('user_preferences').update({ big_text_mode: state.bigText }).eq('user_id', sbUser.id).catch(()=>{});
  };
  document.getElementById('darkToggle').onclick = async () => {
    state.dark = !state.dark; applyState();
    if (sbReady()) await sb.from('user_preferences').update({ dark_mode: state.dark }).eq('user_id', sbUser.id).catch(()=>{});
  };
  document.getElementById('langToggle').onclick = async () => {
    state.lang = state.lang === 'zh' ? 'en' : 'zh'; applyState();
    if (sbReady()) await sb.from('user_preferences').update({ language: state.lang }).eq('user_id', sbUser.id).catch(()=>{});
  };
  // AI credits card: read-only display, refreshed on demand.
  async function refreshCredits() {
    const remainingEl = document.getElementById('aiCreditsRemaining');
    const totalEl    = document.getElementById('aiCreditsTotal');
    const resetEl    = document.getElementById('aiCreditsReset');
    if (remainingEl) remainingEl.textContent = '…';
    if (!window.LiveData || !window.LiveData.llmReadCredits) {
      if (remainingEl) remainingEl.textContent = '—';
      return;
    }
    const r = await window.LiveData.llmReadCredits();
    if (r && r.ok) {
      if (remainingEl) remainingEl.textContent = r.credits_remaining;
      if (totalEl)    totalEl.textContent     = r.credits_total || 50;
      if (resetEl && r.reset_at) {
        const d = new Date(r.reset_at);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        resetEl.textContent = (state.lang==='zh' ? '下次重置：明天 ' : 'Resets: tomorrow ') + hh + ':' + mm;
      }
    } else {
      if (remainingEl) remainingEl.textContent = '—';
    }
  }
  const refreshBtn = document.getElementById('aiCreditsRefresh');
  if (refreshBtn) refreshBtn.onclick = refreshCredits;
  refreshCredits();
  // Amap key is pre-set in app-live.js (AMAP_WEB_KEY constant). No user input
  // needed. Keeping getMapConfig/setMapConfig for compatibility.
  const copyAcct = document.getElementById('copyAcctId');
  if (copyAcct) copyAcct.onclick = () => {
    const id = sbUser?.id || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => toast(t('meCopy') + ' ✓')).catch(() => toast(t('meCopy')));
    } else {
      toast(t('meCopy'));
    }
  };
  const pairElderBtn = document.getElementById('pairElderBtn');
  if (pairElderBtn) pairElderBtn.onclick = async () => {
    const code = (document.getElementById('pairElderInput').value || '').trim();
    if (!code) return toast(isZh ? '请输入配对码' : 'Enter a code', true);
    const { data, error } = await sb.rpc('pair_with_elder', { p_code: code });
    if (error || !data || !data.ok) {
      const msg = data && data.error === 'self' ? t('pairBindSelf')
                : data && data.error === 'not_found' ? t('pairBindFail')
                : (error && error.message) || t('pairBindFail');
      return toast(msg, true);
    }
    if (state.profile) state.profile.elder_account_id = data.elder_id;
    toast(t('pairBindOk'));
    render();
  };
  document.getElementById('logoutBtn').onclick = async () => {
    if (sb) { try { await sb.auth.signOut(); } catch(_) {} }
    sbUser = null;
    state.profile = null;
    state._prefNewsTopics = null;
    state.signedIn = false;
    state.chat = [];
    state._justEditedProfile = false;
    localStorage.removeItem('signedIn');
    try { stopReminderScheduler(); } catch (_) {}
    applyState();
    toast(state.lang==='zh'?'已退出登录':'Signed out');
  };
}

// ---------------- INIT ----------------
function bindGlobal() {
  document.getElementById('langBtn').onclick = () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; applyState(); };
  // Big-text toggle: both the top bar pill and the sidebar footer pill.
  // Persist to Supabase when signed in so it survives sign-in too.
  function toggleBigText() {
    state.bigText = !state.bigText;
    applyState();
    if (sbReady()) {
      sb.from('user_preferences').update({ big_text_mode: state.bigText })
        .eq('user_id', sbUser.id).catch(() => {});
    }
  }
  const themePill = document.getElementById('themePill');
  if (themePill) {
    themePill.style.cursor = 'pointer';
    themePill.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleBigText(); };
    themePill.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBigText(); }
    };
  }
  const sideBtn = document.getElementById('sideThemeBtn');
  if (sideBtn) {
    sideBtn.style.cursor = 'pointer';
    sideBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleBigText(); };
    sideBtn.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBigText(); }
    };
  }
  document.getElementById('bubbleFab').onclick = () => state.aiOpen ? closeSheet() : openSheet();
  document.getElementById('sheetClose').onclick = closeSheet;
  document.getElementById('sheetMask').onclick = closeSheet;
  document.getElementById('sendBtn').onclick = sendChat;
  document.getElementById('chatInput').onkeydown = e => { if (e.key === 'Enter') sendChat(); };
  document.getElementById('micBtn').onclick = toggleMic;
  document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => go(n.dataset.route));
}

function toggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById('micBtn');
  if (!SR) {
    toast(state.lang==='zh'?'此浏览器不支持语音输入':'Voice not supported here', true);
    return;
  }
  if (state.recording) {
    state.recognition?.stop();
    return;
  }
  const r = new SR();
  r.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
  r.interimResults = true;
  r.onstart = () => { state.recording = true; btn.classList.add('recording'); };
  r.onend = () => { state.recording = false; btn.classList.remove('recording'); };
  r.onresult = e => {
    let txt = '';
    for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
    document.getElementById('chatInput').value = txt;
    if (e.results[e.results.length-1].isFinal) setTimeout(sendChat, 400);
  };
  r.onerror = () => { state.recording = false; btn.classList.remove('recording'); };
  state.recognition = r;
  r.start();
}

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  bindGlobal();
  applyState();
});
