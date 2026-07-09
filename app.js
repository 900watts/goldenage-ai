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
    appTitle: '智享银龄',
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
    scamTitle: '防诈骗检测', scamSub: '粘贴可疑短信、链接或电话号码，AI帮您判断',
    scamInput: '在此粘贴可疑内容…', scamCheck: '立即检测', scamClear: '清空',
    scamSafe: '安全', scamCaution: '谨慎', scamDanger: '危险 — 极可能是诈骗',
    scamAdvice: 'AI建议', scamReason: '原因',
    guardTitle: '守护者', guardSub: '配对家人，守护您的安全',
    guardPaired: '已配对', guardNot: '未配对', guardShowQr: '显示配对二维码', guardPairedGuardian: '王小明 · 儿子',
    medTitle: '用药管理', medTaken: '已服药', medSkip: '跳过', medAdd: '添加提醒',
    medTake1: '降压药', medTake1Sub: '08:00 · 20:00 · 饭后服用',
    medTake2: '钙片', medTake2Sub: '12:00 · 随午餐',
    meTitle: '我的', meName: '王爷爷', meEmergency: '紧急联系人 · 王小明',
    meLang: '语言', meAccess: '无障碍设置', meBigText: '大字模式', meDark: '深色模式',
    meLogout: '退出登录',
    authTitle: '欢迎使用智享银龄', authSubtitle: '请输入您的手机号以继续',
    authPhoneLabel: '手机号',
    authPlaceholder: '+86 138 0000 0000', authSend: '发送验证码',
    authOtpTitle: '请输入验证码', authOtpSub: '验证码已发送至 ', authVerify: '验证', authResend: '重新发送',
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
    navFeatures: '功能', featuresTitle: '全部功能', featuresSub: '选择您需要的功能',
    todaySummary: '今日概览', nextMed: '下次用药', newsCount: '今日新闻', goldSnapshot: '金价快览',
  },
  en: {
    appTitle: 'GoldenAge AI',
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
    scamTitle: 'Anti-Scam Shield', scamSub: 'Paste a suspicious message, link, or phone number',
    scamInput: 'Paste suspicious content here…', scamCheck: 'Check Now', scamClear: 'Clear',
    scamSafe: 'Safe', scamCaution: 'Caution', scamDanger: 'DANGER — Highly Likely a Scam',
    scamAdvice: 'AI Advice', scamReason: 'Why',
    guardTitle: 'Guardian', guardSub: 'Pair a family member to keep you safe',
    guardPaired: 'Paired', guardNot: 'Not paired', guardShowQr: 'Show Pairing QR', guardPairedGuardian: 'Xiao Ming · Son',
    medTitle: 'Medication', medTaken: 'Taken', medSkip: 'Skip', medAdd: 'Add Reminder',
    medTake1: 'Blood Pressure Meds', medTake1Sub: '08:00 · 20:00 · with food',
    medTake2: 'Calcium', medTake2Sub: '12:00 · with lunch',
    meTitle: 'Profile', meName: 'Grandpa Wang', meEmergency: 'Emergency · Xiao Ming',
    meLang: 'Language', meAccess: 'Accessibility', meBigText: 'Big Text Mode', meDark: 'Dark Mode',
    meLogout: 'Log Out',
    authTitle: 'Welcome to GoldenAge', authSubtitle: 'Enter your phone to continue',
    authPhoneLabel: 'Phone number',
    authPlaceholder: '+1 555 000 0000', authSend: 'Send Code',
    authOtpTitle: 'Enter the code', authOtpSub: 'Code sent to ', authVerify: 'Verify', authResend: 'Resend',
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
    navFeatures: 'Features', featuresTitle: 'All Features', featuresSub: 'Choose what you need',
    todaySummary: 'Today', nextMed: 'Next medication', newsCount: 'News today', goldSnapshot: 'Gold snapshot',
  },
};

const t = (k) => I18N[state.lang][k] || k;

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
    // Check existing session
    sb.auth.getSession().then(({ data }) => {
      if (data.session) {
        sbUser = data.session.user;
        state.signedIn = true;
        applyState();
      }
    });
    // Listen for auth changes
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        sbUser = session.user;
        state.signedIn = true;
        localStorage.setItem('signedIn', 'true');
        applyState();
      } else if (event === 'SIGNED_OUT') {
        sbUser = null;
        state.signedIn = false;
        localStorage.removeItem('signedIn');
        applyState();
      }
    });
  } catch(e) { console.warn('Supabase init failed:', e); }
}

// Check if Supabase is connected
function sbReady() { return sb !== null && sbUser !== null; }

// ---------------- STATE ----------------
const state = {
  lang: localStorage.getItem('lang') || 'zh',
  bigText: localStorage.getItem('bigText') !== 'false', // default ON
  dark: localStorage.getItem('dark') === 'true',
  route: 'home',
  signedIn: localStorage.getItem('signedIn') === 'true',
  aiOpen: false,
  chat: [],
  recording: false,
  listening: false,
};

function applyState() {
  document.body.dataset.lang = state.lang;
  document.body.dataset.theme = state.dark ? 'dark' : 'light';
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.documentElement.style.setProperty('--t-scale', state.bigText ? '1.5' : '1.0');
  document.getElementById('langLabel').textContent = state.lang === 'zh' ? 'EN' : '中文';
  const pill = state.bigText
    ? (state.lang === 'zh' ? '大字' : 'Big')
    : (state.lang === 'zh' ? '标准' : 'Std');
  const tpt = document.getElementById('themePillText');
  if (tpt) tpt.textContent = pill;
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
  document.title = state.lang === 'zh' ? '智享银龄 · GoldenAge AI' : 'GoldenAge AI · 智享银龄';
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
const POI = {
  hospital: [
    { id: 'h1', name: { zh: '协和医院', en: 'Union Hospital' }, addr: { zh: '东单北大街9号', en: '9 Dongdan N St' }, dist: 800 },
    { id: 'h2', name: { zh: '同仁医院', en: 'Tongren Hospital' }, addr: { zh: '崇文门内大街8号', en: '8 Chongwenmen Inner St' }, dist: 1500 },
  ],
  pharmacy: [
    { id: 'p1', name: { zh: '老百姓大药房', en: 'LBX Pharmacy' }, addr: { zh: '前门西大街12号', en: '12 Qianmen W St' }, dist: 300 },
    { id: 'p2', name: { zh: '同仁堂药店', en: 'Tongrentang Pharmacy' }, addr: { zh: '大栅栏街24号', en: '24 Dashilan St' }, dist: 650 },
  ],
  park: [
    { id: 'k1', name: { zh: '中山公园', en: 'Zhongshan Park' }, addr: { zh: '中华路4号', en: '4 Zhonghua Rd' }, dist: 1200 },
  ],
  supermarket: [
    { id: 's1', name: { zh: '物美超市', en: 'Wumart' }, addr: { zh: '前门大街18号', en: '18 Qianmen St' }, dist: 400 },
  ],
};

const QUOTES = [
  { id: 'GC=F', name: { zh: '黄金（USD/oz）', en: 'Gold (USD/oz)' }, price: 2345.6, change: 18.4, pct: 0.79 },
  { id: 'SI=F', name: { zh: '白银（USD/oz）', en: 'Silver (USD/oz)' }, price: 30.8, change: -0.22, pct: -0.71 },
  { id: '000001.SS', name: { zh: '上证指数', en: 'Shanghai' }, price: 3245.7, change: 12.3, pct: 0.38 },
  { id: '^GSPC', name: { zh: '标普500', en: 'S&P 500' }, price: 5460.1, change: -8.4, pct: -0.15 },
];

const NEWS = [
  { title: { zh: '社区启动免费健康检查项目', en: 'Community launches free health checks' },
    sum: { zh: '本周末开始，全市 12 个社区中心提供免费血压、血糖、心电图检查，60 岁以上长者优先。',
            en: 'Starting this weekend, 12 community centers offer free BP, glucose, ECG checks. Seniors 60+ prioritized.' },
    src: 'City Health' },
  { title: { zh: '今明两天有雨，气温下降 6 度', en: 'Rain expected, temps drop 6°' },
    sum: { zh: '气象局提醒长者注意保暖，外出携带雨具。周末天气转晴。',
            en: 'Meteorologists advise seniors to dress warmly and carry umbrellas. Sunny weekend ahead.' },
    src: 'Weather' },
  { title: { zh: '子女陪父母就医可享 5 天带薪假', en: '5-day paid leave to accompany parents' },
    sum: { zh: '新法规鼓励家庭陪护，企业反响积极。',
            en: 'New policy encourages family care. Enterprises respond positively.' },
    src: 'Gov Daily' },
];

// Medication state: track which meds have been taken/skipped today
const MEDS = [
  { id: 'm1', name: () => t('medTake1'), sub: () => t('medTake1Sub') },
  { id: 'm2', name: () => t('medTake2'), sub: () => t('medTake2Sub') },
];
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

// ---------------- SCAM ENGINE (rule-based) ----------------
const DANGER_PATTERNS = ['中奖','中大奖','恭喜您','领奖','领取奖品','免费送','零元购','点击链接领取','立即领取','银行卡号','验证码','密码','转账','汇款','安全账户','资金清查','涉嫌洗钱','通缉','高额回报','稳赚不赔','内幕消息','一夜暴富'];
const CAUTION_PATTERNS = ['客服','退款','退货','订单异常','账户异常','升级','激活','认证','积分兑换','http://','bit.ly','tinyurl'];

function analyzeScam(input) {
  const lower = input.toLowerCase();
  const reasons = [];
  let d = 0, c = 0;
  for (const p of DANGER_PATTERNS) if (lower.includes(p.toLowerCase())) { d += 2; reasons.push({ zh: `命中高危关键词「${p}」`, en: `High-risk keyword "${p}"` }); }
  for (const p of CAUTION_PATTERNS) if (lower.includes(p.toLowerCase())) { c += 1; reasons.push({ zh: `命中可疑关键词「${p}」`, en: `Suspicious keyword "${p}"` }); }
  const phoneMatches = input.match(/1[3-9]\d{9}/g);
  if (phoneMatches) { c += phoneMatches.length; reasons.push({ zh: '包含中国大陆手机号', en: 'Contains CN phone number' }); }
  const urlMatches = input.match(/https?:\/\/[^\s]+/g);
  if (urlMatches) { c += urlMatches.length; reasons.push({ zh: '包含链接', en: 'Contains URL' }); }
  if (d >= 2) return { verdict: 'danger', reasons, advice: { zh: '极可能是诈骗。请立即删除此信息，不要点击任何链接，不要转账或告知验证码。', en: 'Highly likely a scam. Delete immediately, do not click links, do not transfer money or share codes.' } };
  if (c >= 2 || d === 1) return { verdict: 'caution', reasons, advice: { zh: '信息中存在可疑内容，请先核实。切勿透露个人信息或转账。', en: 'Suspicious content detected. Verify first. Never share personal info or transfer money.' } };
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

function aiMatchTool(text) {
  const lower = text.toLowerCase();
  if (/sos|求助|救命|紧急|fall|chest|emergency|help/i.test(text)) return 'call_sos';
  if (/(打开|open).*(地图|map)|附近|nearby|药房|医院|pharmacy|hospital/i.test(text)) return 'open_map';
  if (/(金价|gold|价格|price|行情|finance|股票|stock|指数|index)/i.test(text)) return 'open_finance';
  if (/(新闻|news|今天.*新闻|今天.*发生|今天的|今日)/i.test(text)) return 'open_news';
  if (/(药|medication|pill|med)/i.test(text)) return 'open_med';
  if (/(诈骗|scam|可疑|suspicious|骗子|骗)/i.test(text)) return 'open_scam';
  return null;
}

function aiChat(userText) {
  const tool = aiMatchTool(userText);
  if (tool) {
    const def = TOOLS[tool];
    def.action();
    return { reply: def.reply(), tool: '🔧 ' + tool };
  }
  // SOUL.md persona — kind, simple, short, no jargon
  if (/thank|谢谢|感谢/i.test(userText)) {
    return { reply: state.lang==='zh' ? '不客气。能帮到您我也很高兴。' : "You're very welcome. I'm glad I could help." };
  }
  if (/hello|hi|你好|您好/.test(userText)) {
    return { reply: state.lang==='zh' ? '您好。今天感觉怎么样？' : "Hello. How are you feeling today?" };
  }
  if (/weather|天气/.test(userText)) {
    return { reply: state.lang==='zh' ? '今明两天有雨，记得带伞。周末会转晴。' : 'Rain expected today and tomorrow. Bring an umbrella. Sunny this weekend.' };
  }
  if (/time|几点|时间/.test(userText)) {
    const now = new Date().toLocaleTimeString(state.lang==='zh'?'zh-CN':'en-US',{hour:'2-digit',minute:'2-digit'});
    return { reply: state.lang==='zh' ? `现在大约是 ${now}。` : `It's about ${now} now.` };
  }
  if (/药.*吃了|took.*medication|吃了药/.test(userText)) {
    return { reply: t('aiReply3') };
  }
  if (/新闻|news/.test(userText)) {
    TOOLS.open_news.action();
    return { reply: t('aiReply4') };
  }
  return { reply: state.lang==='zh'
    ? '我还在学习当中。试试问我"打开地图"、"今日金价"或"今天有什么新闻"吧。'
    : "I'm still learning. Try asking me to 'open the map', 'gold price today', or 'what's in the news'." };
}

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
  setTimeout(() => {
    const r = aiChat(text);
    pushChat('ai', r.reply, r.tool);
    speak(r.reply);
  }, 350);
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
  }
}

// --- AUTH ---
function renderAuth(root) {
  const otpMode = renderAuth._otpMode || false;
  const phone = renderAuth._phone || '';
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;padding:40px 8px;text-align:center">
      <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--cta));display:flex;align-items:center;justify-content:center;margin-bottom:24px">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>
      <h2 style="margin-bottom:8px">${t('authTitle')}</h2>
      <p class="text-soft" style="margin-bottom:32px">${t('authSubtitle')}</p>
      ${otpMode ? `
        <div style="width:100%;max-width:360px">
          <p class="text-soft" style="margin-bottom:16px">${t('authOtpSub')}${escapeHtml(phone)}</p>
          <label class="field-label">${t('authOtpTitle')}</label>
          <input id="otpInput" inputmode="numeric" maxlength="6" style="letter-spacing:8px;font-size:1.5rem;font-weight:700;text-align:center" placeholder="······">
          <div style="height:16px"></div>
          <button class="big-btn primary" id="verifyBtn">${t('authVerify')}</button>
          <div style="height:12px"></div>
          <button class="big-btn ghost" id="resendBtn" style="width:auto;min-width:0">${t('authResend')}</button>
        </div>
      ` : `
        <div style="width:100%;max-width:360px">
          <label class="field-label">${t('authPhoneLabel')}</label>
          <input id="phoneInput" value="${escapeHtml(phone)}" placeholder="${t('authPlaceholder')}">
          <div style="height:16px"></div>
          <button class="big-btn primary" id="sendBtn">${t('authSend')}</button>
        </div>
      `}
    </div>`;
  if (otpMode) {
    document.getElementById('verifyBtn').onclick = async () => {
      const v = document.getElementById('otpInput').value.trim();
      if (v.length !== 6) return toast(state.lang==='zh'?'请输入 6 位验证码':'Enter the 6-digit code', true);
      // Try Supabase OTP verify
      if (sb) {
        try {
          const { data, error } = await sb.auth.verifyOtp({ phone: renderAuth._phone, token: v, type: 'sms' });
          if (error) throw error;
          sbUser = data.user;
          state.signedIn = true;
          renderAuth._otpMode = false;
          localStorage.setItem('signedIn', 'true');
          toast(state.lang==='zh' ? '登录成功，欢迎！' : 'Welcome!');
          applyState();
        } catch(e) {
          toast((state.lang==='zh'?'验证失败：':'Verify failed: ') + (e.message||e), true);
        }
      } else {
        // Mock fallback
        state.signedIn = true;
        renderAuth._otpMode = false;
        localStorage.setItem('signedIn', 'true');
        toast(state.lang==='zh' ? '登录成功（离线模式）' : 'Signed in (offline mode)');
        applyState();
      }
    };
    document.getElementById('resendBtn').onclick = async () => {
      if (sb) {
        try { await sb.auth.signInWithOtp({ phone: renderAuth._phone }); toast(state.lang==='zh'?'验证码已重新发送':'Code resent'); }
        catch(e) { toast(state.lang==='zh'?'发送失败':'Failed', true); }
      } else { toast(state.lang==='zh'?'验证码已重新发送':'Code resent'); }
    };
  } else {
    document.getElementById('sendBtn').onclick = async () => {
      const v = document.getElementById('phoneInput').value.trim();
      if (v.length < 6) return toast(state.lang==='zh'?'请输入手机号':'Enter your phone', true);
      renderAuth._phone = v;
      // Try Supabase OTP
      if (sb) {
        try {
          const { error } = await sb.auth.signInWithOtp({ phone: v, shouldCreateUser: true });
          if (error) throw error;
          renderAuth._otpMode = true;
          render();
        } catch(e) {
          // Supabase phone auth may not be configured — fall back to mock
          toast((state.lang==='zh'?'SMS未配置，使用离线模式':'SMS not configured, using offline mode'), false);
          renderAuth._otpMode = true;
          render();
        }
      } else {
        // No Supabase — mock mode
        renderAuth._otpMode = true;
        render();
      }
    };
  }
}

// --- HOME ---
function renderHome(root) {
  const h = new Date().getHours();
  const greet = h < 12 ? t('greetingMorning') : h < 18 ? t('greetingAfternoon') : t('greetingEvening');
  root.innerHTML = `
    <div class="dash">
      <!-- Left: greeting + SOS -->
      <div>
        <div class="greeting">${greet}，</div>
        <div class="name">${t('meName')}</div>
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
            <div class="summary-value">${medState['m1']==='taken'?(state.lang==='zh'?'今日已服药':'Already taken'):t('medTake1')+' · 14:00'}</div>
          </div>
        </div>
        <div class="summary-row" data-go="finance" style="cursor:pointer">
          <div class="summary-icon" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark))">${ICON.gold}</div>
          <div class="summary-text">
            <div class="summary-label">${t('goldSnapshot')}</div>
            <div class="summary-value">¥678.5/g <span class="up">↑ +0.8%</span></div>
          </div>
        </div>
        <div class="summary-row" data-go="news" style="cursor:pointer">
          <div class="summary-icon" style="background:linear-gradient(135deg,var(--cta),var(--cta-dark))">${ICON.news}</div>
          <div class="summary-text">
            <div class="summary-label">${t('newsCount')}</div>
            <div class="summary-value">${state.lang==='zh'?'3 篇 AI 精选':'3 AI-curated'}</div>
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
}

// --- FEATURES HUB ---
function renderFeatures(root) {
  const tiles = [
    { route: 'medication', icon: ICON.pill,   grad: 'linear-gradient(135deg,var(--gold),#D97706)',
      title: () => t('medTitle'), sub: () => t('medTake1Sub') },
    { route: 'news',       icon: ICON.news,   grad: 'linear-gradient(135deg,var(--cta),var(--cta-dark))',
      title: () => t('homeNews'), sub: () => t('homeNewsSub') },
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

// --- MAP ---
function renderMap(root) {
  const filter = renderMap._filter || 'hospital';
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
        <div class="map-box">
          <div class="label">${t('mapLocating')}</div>
          <div class="map-pin"></div>
        </div>
      </div>
      <div class="poi-list">
      ${POI[filter].map(p => `
        <div class="card-label card">
          <div class="card-icon" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark))">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="card-text">
            <div class="card-title">${p.name[state.lang]}</div>
            <div class="card-sub">${p.addr[state.lang]} · ${(p.dist/1000).toFixed(1)} km</div>
          </div>
        </div>
      `).join('')}
      </div>
    </div>`;
  root.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { renderMap._filter = b.dataset.f; render(); });
}

// --- FINANCE ---
function renderFinance(root) {
  root.innerHTML = `
    <h2 class="section-title">${t('finTitle')}</h2>
    <p class="text-soft" style="margin-bottom:16px">${state.lang==='zh'?'简单趋势 · 涨红跌绿（中国市场习惯）':'Simple trends · up red, down green (CN convention)'}</p>
    <div class="auto-grid">
    ${QUOTES.map(q => {
      const up = q.change >= 0;
      return `
        <div class="card">
          <div class="quote-row">
            <span class="dot" style="background:${up?'var(--danger)':'var(--safe)'}"></span>
            <span class="qname">${q.name[state.lang]}</span>
            <span class="qprice ${up?'up':'down'}">${q.price.toFixed(2)}</span>
          </div>
          <div class="quote-row" style="padding-top:0">
            <span></span>
            <span class="qname ${up?'up':'down'}" style="font-weight:600">${up?'+':''}${q.change.toFixed(2)} (${up?'+':''}${q.pct.toFixed(2)}%)</span>
            <button class="big-btn ghost" data-explain="${q.id}" style="width:auto;min-width:0;font-size:.95rem;padding:10px 16px">${t('finAskAi')}</button>
          </div>
        </div>`;
    }).join('')}
    </div>`;
  root.querySelectorAll('[data-explain]').forEach(b => b.onclick = () => {
    const id = b.dataset.explain;
    const q = QUOTES.find(x => x.id === id);
    const up = q.change >= 0;
    const text = up
      ? (state.lang==='zh' ? `${q.name.zh}今天涨了${q.pct.toFixed(2)}%，受全球避险情绪影响。` : `${q.name.en} is up ${q.pct.toFixed(2)}% today, driven by global risk-off sentiment.`)
      : (state.lang==='zh' ? `${q.name.zh}今天跌了${Math.abs(q.pct).toFixed(2)}%，市场情绪偏谨慎。` : `${q.name.en} is down ${Math.abs(q.pct).toFixed(2)}% today. Market sentiment is cautious.`);
    toast(text, false);
    speak(text);
  });
}

// --- NEWS ---
function renderNews(root) {
  root.innerHTML = `
    <h2 class="section-title">${t('homeNews')}</h2>
    <p class="text-soft" style="margin-bottom:16px">${state.lang==='zh'?'AI 过滤标题党，支持朗读':'AI-filtered, with read-aloud TTS'}</p>
    <div class="auto-grid">
    ${NEWS.map((n, i) => `
      <div class="card">
        <span class="news-tag">AI</span>
        <div class="news-title">${n.title[state.lang]}</div>
        <div class="news-sum">${n.sum[state.lang]}</div>
        <div class="news-meta">
          <span class="src">${n.src}</span>
          <button class="read-btn" data-read="${i}">${ICON.vol}<span>${t('vol').replace(' ','')}</span></button>
        </div>
      </div>
    `).join('')}
    </div>`;
  root.querySelectorAll('[data-read]').forEach(b => b.onclick = () => {
    const n = NEWS[+b.dataset.read];
    speak(`${n.title[state.lang]}. ${n.sum[state.lang]}`);
    b.innerHTML = `${ICON.stop}<span>${state.lang==='zh'?'停止':'Stop'}</span>`;
    setTimeout(() => { b.innerHTML = `${ICON.vol}<span>${t('vol').replace(' ','')}</span>`; }, 6000);
  });
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
    renderScam._result = analyzeScam(v);
    render();
    // Save to Supabase
    if (sbReady()) {
      try {
        await sb.from('scam_reports').insert({
          user_id: sbUser.id,
          input_text: v,
          verdict: renderScam._result.verdict,
          confidence: renderScam._result.confidence,
          advice: renderScam._result.advice[state.lang],
          reasoning: renderScam._result.reasons.map(r => r[state.lang]).join('; ')
        });
      } catch(e) { console.warn('Scam report save failed:', e); }
    }
  };
}

function renderVerdict(r) {
  const v = r.verdict;
  const vLabel = v === 'safe' ? t('scamSafe') : v === 'caution' ? t('scamCaution') : t('scamDanger');
  const icon = v === 'safe' ? ICON.check : ICON.warn;
  return `
    <div class="verdict-card ${v}">
      <div class="row">
        <div class="icon">${icon}</div>
        <div>
          <h3>${vLabel}</h3>
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
// Guardian state — persisted
const guardians = [];
function loadGuardians() {
  try { guardians.push(...JSON.parse(localStorage.getItem('guardians') || '[]')); } catch(_) {}
  if (guardians.length === 0) {
    guardians.push({ name: '王小明 · 儿子', nameEn: 'Xiao Ming · Son', paired: true, token: 'demo-abc123' });
    saveGuardians();
  }
}
function saveGuardians() { localStorage.setItem('guardians', JSON.stringify(guardians)); }
loadGuardians();

function renderGuardian(root) {
  const showQr = renderGuardian._qr;
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
        </div>
        <button class="big-btn ghost" data-remove="${i}" style="width:auto;min-width:0;font-size:.85rem;padding:8px 12px;color:var(--danger);border-color:var(--danger)">${ICON.close}</button>
      </div>
    `).join('')}
    </div>
    <div style="height:20px"></div>
    <button class="big-btn secondary" id="qrBtn">${ICON.shield}<span>${t('guardShowQr')}</span></button>
    ${showQr ? (() => {
      const token = Math.random().toString(36).slice(2, 18);
      renderGuardian._pendingToken = token;
      return `
      <div style="margin-top:24px;text-align:center">
        <div class="qr-frame">
          ${fakeQrSvg('goldenage://pair/' + token)}
        </div>
        <p class="text-soft" style="margin-top:8px">${state.lang==='zh'?'让家人用 GoldenAge 扫描':'Have family scan with GoldenAge'}</p>
        <p style="font-size:.8rem;color:var(--muted-app);margin-top:4px">Token: ${token}</p>
        <div style="height:16px"></div>
        <button class="big-btn primary" id="simulateScan" style="max-width:280px">${state.lang==='zh'?'模拟家人扫描配对':'Simulate family scan & pair'}</button>
      </div>`;
    })() : ''}`;
  document.getElementById('qrBtn').onclick = () => { renderGuardian._qr = true; render(); };
  root.querySelectorAll('[data-remove]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.remove;
    const ok = await showDialog({
      title: state.lang==='zh'?'移除守护者':'Remove Guardian',
      body: state.lang==='zh'?`确认移除 ${guardians[i].name}？`:`Remove ${guardians[i].nameEn||guardians[i].name}?`,
      confirmLabel: state.lang==='zh'?'移除':'Remove',
      danger: true,
    });
    if (ok) { guardians.splice(i, 1); saveGuardians(); render(); }
  });
  const simBtn = document.getElementById('simulateScan');
  if (simBtn) simBtn.onclick = async () => {
    const name = await promptDialog({
      title: state.lang==='zh'?'家人姓名':'Family member name',
      placeholder: state.lang==='zh'?'如：李小华':'e.g. Li Xiaohua',
    });
    if (!name) return;
    guardians.push({ name: name + ' · 家人', nameEn: name + ' · Family', paired: true, token: renderGuardian._pendingToken || 'new' });
    saveGuardians();
    renderGuardian._qr = false;
    toast(state.lang==='zh'?'配对成功！':'Paired!');
    render();
  };
}

function fakeQrSvg(text) {
  // Generate a deterministic-looking pattern for demo purposes.
  const cells = 21;
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  let bits = '';
  for (let i = 0; i < cells * cells; i++) {
    h = (h * 1103515245 + 12345) | 0;
    bits += (h >>> 0) % 2;
  }
  let rects = '';
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    if (bits[y*cells+x] === '1') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#134E4A"/>`;
  }
  // finder patterns
  const finder = (cx, cy) => `
    <rect x="${cx}" y="${cy}" width="7" height="7" fill="#134E4A"/>
    <rect x="${cx+1}" y="${cy+1}" width="5" height="5" fill="#fff"/>
    <rect x="${cx+2}" y="${cy+2}" width="3" height="3" fill="#134E4A"/>`;
  return `<svg viewBox="0 0 ${cells} ${cells}" xmlns="http://www.w3.org/2000/svg">${rects}${finder(0,0)}${finder(14,0)}${finder(0,14)}</svg>`;
}

// --- MEDICATION ---
function renderMedication(root) {
  const allMeds = [...MEDS, ...customMeds.map((m, i) => ({
    id: 'c' + i,
    name: () => m.name,
    sub: () => m.time + (m.notes ? ' · ' + m.notes : ''),
  }))];
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
  toast(state.lang==='zh' ? '已添加用药提醒' : 'Reminder added');
  render();
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
function renderMe(root) {
  root.innerHTML = `
    <h2 class="section-title">${t('meTitle')}</h2>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div style="width:72px;height:72px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div>
        <div style="font-size:1.4rem;font-weight:700">${t('meName')}</div>
        <div class="text-soft" style="font-size:.9rem">${t('meEmergency')}</div>
      </div>
    </div>

    <h3 style="font-size:1.1rem;margin-bottom:8px">${t('meAccess')}</h3>
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

    <h3 style="font-size:1.1rem;margin-bottom:8px">${t('meLang')}</h3>
    <div class="card" style="padding:18px;display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:42px;height:42px;border-radius:12px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center">${ICON.lang}</div>
      <div style="flex:1">
        <div style="font-weight:600">${state.lang==='zh'?'简体中文':'English'}</div>
        <div class="card-sub">${state.lang==='zh'?'当前语言':'Current language'}</div>
      </div>
      <button class="big-btn ghost" id="langToggle" style="width:auto;min-width:0;font-size:.95rem;padding:10px 18px">${state.lang==='zh'?'EN':'中文'}</button>
    </div>

    <button class="big-btn danger" id="logoutBtn">${ICON.close}<span>${t('meLogout')}</span></button>`;
  document.getElementById('bigToggle').onclick = () => { state.bigText = !state.bigText; applyState(); };
  document.getElementById('darkToggle').onclick = () => { state.dark = !state.dark; applyState(); };
  document.getElementById('langToggle').onclick = () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; applyState(); };
  document.getElementById('logoutBtn').onclick = async () => {
    if (sb) { try { await sb.auth.signOut(); } catch(_) {} }
    sbUser = null;
    state.signedIn = false;
    state.chat = [];
    localStorage.removeItem('signedIn');
    applyState();
    toast(state.lang==='zh'?'已退出登录':'Signed out');
  };
}

// ---------------- INIT ----------------
function bindGlobal() {
  document.getElementById('langBtn').onclick = () => { state.lang = state.lang === 'zh' ? 'en' : 'zh'; applyState(); };
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
