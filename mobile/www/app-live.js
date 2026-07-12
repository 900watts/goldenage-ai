// =====================================================================
// GoldenAge AI — Live Data Services
// =====================================================================
// All real-time data feeds (finance, news, weather, POI). Every service
// has a proper fallback to "—" so the UI never shows stale mock numbers.
// =====================================================================

const _UA = 'Mozilla/5.0 (GoldenAge/1.0)';

// ---------- FINANCE ----------
// Multi-source fetcher that works inside and outside China.
//   Primary:  Tencent qt.gtimg.cn (no CORS preflight — works in a browser)
//   Fallback: Sina hq.sinajs.cn (requires Referer header, unreachable from browsers)
//   Last:     Yahoo Finance (works outside China)
// Tencent's response format is consistent: [status, name, code, price, prev_close, open, ...]
//   For futures (hf_GC, hf_SI): [name, current, prev, open, high, low, time, ...]
//   So the current/prev indices differ by symbol type.
const FINANCE_SYMBOLS = [
  // --- Commodities (the old stock app's hero) ---
  { sina: 'hf_GC',     tencent: 'hf_GC',     id: 'GC=F',     name: { zh: '黄金 (USD/oz)',  en: 'Gold (USD/oz)' },       unit: 'USD/oz',  kind: 'futures',  hero: true,
    aliases: { zh: ['黄金','金价','gold','xau','国际金价'], en: ['gold','xau'] } },
  { sina: 'hf_SI',     tencent: 'hf_SI',     id: 'SI=F',     name: { zh: '白银 (USD/oz)',  en: 'Silver (USD/oz)' },     unit: 'USD/oz',  kind: 'futures',
    aliases: { zh: ['白银','银价','silver','xag'], en: ['silver','xag'] } },
  { sina: 'hf_PL',     tencent: 'hf_PL',     id: 'PL=F',     name: { zh: '铂金 (USD/oz)',  en: 'Platinum (USD/oz)' },   unit: 'USD/oz',  kind: 'futures',
    aliases: { zh: ['铂金','platinum','xpt'], en: ['platinum','xpt'] } },
  { sina: 'hf_PD',     tencent: 'hf_PD',     id: 'PD=F',     name: { zh: '钯金 (USD/oz)',  en: 'Palladium (USD/oz)' },  unit: 'USD/oz',  kind: 'futures',
    aliases: { zh: ['钯金','palladium','xpd'], en: ['palladium','xpd'] } },
  { sina: 'hf_CU',     tencent: 'hf_CU',     id: 'HG=F',     name: { zh: '铜 (USD/lb)',    en: 'Copper (USD/lb)' },     unit: 'USD/lb',  kind: 'futures',
    aliases: { zh: ['铜','copper','hg'], en: ['copper','hg'] } },
  { sina: 'hf_OIL',    tencent: 'hf_OIL',    id: 'CL=F',     name: { zh: '原油 (USD/bbl)',  en: 'Crude oil (USD/bbl)' },  unit: 'USD/bbl', kind: 'futures',
    aliases: { zh: ['原油','石油','oil','wti','crude'], en: ['crude','wti','oil'] } },

  // --- China A-share indices ---
  { sina: 'sh000001',  tencent: 'sh000001',  id: '000001.SS',name: { zh: '上证指数',         en: 'Shanghai Composite' },   unit: 'CNY',     kind: 'cn_index', hero: true,
    aliases: { zh: ['上证','沪指','shanghai composite','000001'], en: ['shanghai composite','sse'] } },
  { sina: 'sz399001',  tencent: 'sz399001',  id: '399001.SZ',name: { zh: '深证成指',         en: 'Shenzhen Component' },  unit: 'CNY',     kind: 'cn_index', hero: true,
    aliases: { zh: ['深证','深成指','szse component','399001'], en: ['shenzhen component','szse'] } },
  { sina: 'sz399006',  tencent: 'sz399006',  id: '399006.SZ',name: { zh: '创业板指',         en: 'ChiNext' },             unit: 'CNY',     kind: 'cn_index',
    aliases: { zh: ['创业板','chinext','399006'], en: ['chinext'] } },
  { sina: 'sh000300',  tencent: 'sh000300',  id: '000300.SS',name: { zh: '沪深300',          en: 'CSI 300' },              unit: 'CNY',     kind: 'cn_index',
    aliases: { zh: ['沪深300','csi300','000300'], en: ['csi 300','csi300'] } },
  { sina: 'sh000016',  tencent: 'sh000016',  id: '000016.SS',name: { zh: '上证50',            en: 'SSE 50' },               unit: 'CNY',     kind: 'cn_index',
    aliases: { zh: ['上证50','sse50','000016'], en: ['sse 50','sse50'] } },

  // --- HK indices ---
  { sina: 'hkHSI',     tencent: 'hkHSI',     id: '^HSI',     name: { zh: '恒生指数',         en: 'Hang Seng' },           unit: 'HKD',     kind: 'hk_index', hero: true,
    aliases: { zh: ['恒指','恒生','hang seng','hsi'], en: ['hang seng','hsi'] } },
  { sina: 'hkHSCEI',   tencent: 'hkHSCEI',   id: '^HSCE',    name: { zh: '恒生中国企业指数', 'en': 'Hang Seng China Enterprises' }, unit: 'HKD', kind: 'hk_index',
    aliases: { zh: ['国企指数','hsce','h-share'], en: ['hsce','h-share'] } },

  // --- US indices ---
  { sina: 'int_nasdaq',tencent: 'usIXIC',    id: '^IXIC',    name: { zh: '纳斯达克',         en: 'NASDAQ' },              unit: 'USD',     kind: 'tencent_index', hero: true,
    aliases: { zh: ['纳斯达克','nasdaq','ixic'], en: ['nasdaq','ixic'] } },
  { sina: 'int_dji',   tencent: 'usDJI',     id: '^DJI',     name: { zh: '道琼斯',           en: 'Dow Jones' },           unit: 'USD',     kind: 'tencent_index', hero: true,
    aliases: { zh: ['道琼斯','道指','dow','dji'], en: ['dow jones','dow','dji'] } },
  { sina: 'int_sp500', tencent: 'usINX',     id: '^GSPC',    name: { zh: '标普500',         en: 'S&P 500' },             unit: 'USD',     kind: 'tencent_index', hero: true,
    aliases: { zh: ['标普500','标普','s&p 500','s&p','gspc'], en: ['s&p 500','s&p','gspc'] } },

  // --- Crypto ---
  { sina: '',         tencent: '',           id: 'BTC-USD',  name: { zh: '比特币 (USD)',     en: 'Bitcoin (USD)' },       unit: 'USD',     kind: 'crypto',
    aliases: { zh: ['比特币','btc','bitcoin'], en: ['bitcoin','btc'] } },
];

// ---------------------------------------------------------------------
// Ticker search — match by code, company name, or alias. Returns the
// best-matching symbol in the FINANCE_SYMBOLS universe, or null.
// ---------------------------------------------------------------------
function findSymbol(query) {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  if (!q) return null;
  // 1) exact id match (AAPL, 000001.SS, ^GSPC, BTC-USD, etc.)
  let m = FINANCE_SYMBOLS.find(s => (s.id || '').toLowerCase() === q);
  if (m) return m;
  // 2) exact sina / tencent code match
  m = FINANCE_SYMBOLS.find(s => (s.sina || '').toLowerCase() === q || (s.tencent || '').toLowerCase() === q);
  if (m) return m;
  // 3) alias match in current language
  m = FINANCE_SYMBOLS.find(s => {
    const lang = state && state.lang === 'zh' ? 'zh' : 'en';
    const arr = (s.aliases && s.aliases[lang]) || [];
    return arr.some(a => a.toLowerCase() === q);
  });
  if (m) return m;
  // 4) substring match
  m = FINANCE_SYMBOLS.find(s => {
    const lang = state && state.lang === 'zh' ? 'zh' : 'en';
    const arr = (s.aliases && s.aliases[lang]) || [];
    return arr.some(a => a.toLowerCase().includes(q))
        || (s.name && s.name.zh && s.name.zh.includes(q))
        || (s.name && s.name.en && s.name.en.toLowerCase().includes(q))
        || (s.id && s.id.toLowerCase().includes(q));
  });
  return m || null;
}

// Fetch a single arbitrary ticker. If the ticker is in the hardcoded
// universe, we use the fast Sina/Tencent/Yahoo path. Otherwise we try
// Yahoo Finance's v8 chart API with the raw ticker (works for any stock
// listed on a Yahoo-supported exchange). Returns the same shape as
// fetchQuote, with an extra _universe='known'|'external' flag.
async function fetchStock(ticker) {
  if (!ticker) return null;
  const t = String(ticker).trim();
  if (!t) return null;
  const known = findSymbol(t);
  if (known) {
    const r = await fetchQuote(known);
    return { ...r, _universe: 'known' };
  }
  // External ticker — best-effort: try Yahoo v8 directly. Works for
  // AAPL, TSLA, 0700.HK, 600519.SS, 2330.TW, 7203.T, etc.
  const adhoc = { id: t, sina: '', tencent: '', kind: 'us_index' };
  try {
    const res = await fetchWithTimeout(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=5d`, { headers: { 'User-Agent': _UA } }, 7000);
    if (!res.ok) return { ...adhoc, price: null, change: null, pct: null, name: { zh: t, en: t } };
    const d = await res.json();
    const r = d.chart && d.chart.result;
    if (r && r[0]) {
      const m = r[0].meta || {};
      const p = m.regularMarketPrice;
      const prev = m.chartPreviousClose;
      if (p != null && prev != null) {
        return {
          id: t, name: { zh: t, en: t }, unit: m.currency || 'USD', kind: 'us_index',
          price: p, change: p - prev, pct: ((p - prev) / prev) * 100,
          time: m.regularMarketTime || Date.now(), currency: m.currency,
          _source: 'yahoo', _universe: 'external'
        };
      }
    }
    return { ...adhoc, price: null, change: null, pct: null, name: { zh: t, en: t } };
  } catch (_) {
    return { ...adhoc, price: null, change: null, pct: null, name: { zh: t, en: t } };
  }
}

// Simple sparkline drawing on a <canvas> from a numeric series. Inspired
// by the old stock app's drawSparkline, but uses the device pixel ratio
// for sharp lines on retina displays.
function drawSparkline(canvas, series, color, w, h, fill) {
  if (!canvas || !series || series.length < 2) return;
  if (!w) w = canvas.clientWidth || 120;
  if (!h) h = canvas.clientHeight || 36;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const min = Math.min.apply(null, series);
  const max = Math.max.apply(null, series);
  const range = max - min || 1;
  const stepX = w / (series.length - 1);
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color || '#0D9488';
  for (let i = 0; i < series.length; i++) {
    const x = i * stepX;
    const y = h - ((series[i] - min) / range) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (fill) {
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = (color || '#0D9488') + '22'; // ~13% alpha
    ctx.fill();
  }
  // Dot on the latest point
  const lastX = (series.length - 1) * stepX;
  const lastY = h - ((series[series.length-1] - min) / range) * (h - 4) - 2;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = color || '#0D9488';
  ctx.fill();
}

// Parse a Sina record (returns { price, change, pct } or null).
function parseSina(sym, raw) {
  if (!raw) return null;
  const m = raw.match(/="([^"]+)"/);
  if (!m) return null;
  const parts = m[1].split(',');
  if (parts.length < 3) return null;
  let price, change, pct;
  if (sym.kind === 'us_index') {
    price  = parseFloat(parts[1]);
    change = parseFloat(parts[2]);
    pct    = parseFloat(parts[3]);
  } else if (sym.kind === 'futures' || sym.kind === 'hk_index') {
    price  = parseFloat(parts[2]);
    const prev = parseFloat(parts[1]);
    change = isFinite(prev) ? price - prev : 0;
    pct    = isFinite(prev) && prev ? (change / prev) * 100 : 0;
  } else {
    price  = parseFloat(parts[3]);
    const prev = parseFloat(parts[2]);
    change = isFinite(prev) ? price - prev : 0;
    pct    = isFinite(prev) && prev ? (change / prev) * 100 : 0;
  }
  if (!isFinite(price) || price === 0) return null;
  return { price, change, pct };
}

// Parse a Tencent record. Supports both shapes:
//   - Index/stock: [status, name, code, price, prev, open, ...]  (separated by ~)
//   - Futures (hf_*): [current, change, prev, open, high, low, ...]  (separated by ,)
function parseTencent(sym, raw) {
  if (!raw) return null;
  const m = raw.match(/="([^"]+)"/);
  if (!m) return null;
  const sep = m[1].indexOf('~') >= 0 ? '~' : ',';
  const parts = m[1].split(sep);
  let price, prev;
  if (sep === '~') {
    // [status, name, code, current, prev_close, open, ...]
    if (parts.length < 5) return null;
    price = parseFloat(parts[3]);
    prev  = parseFloat(parts[4]);
  } else {
    // Futures comma format: [current, change, prev, open, high, low, ...]
    if (parts.length < 3) return null;
    price = parseFloat(parts[0]);
    prev  = parseFloat(parts[2]);
  }
  if (!isFinite(price) || !isFinite(prev) || prev === 0) return null;
  const chg = price - prev;
  return { price, change: chg, pct: (chg / prev) * 100 };
}

// Fetch with a hard timeout.
async function fetchWithTimeout(url, opts = {}, timeoutMs = 7000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchQuote(sym) {
  // Race three sources. Tencent is the only one that works from a browser
  // without a Referer header; Sina works in desktop/curl contexts; Yahoo
  // works outside China. We accept whichever returns first with a valid
  // result. Each has its own 7s hard cap.
  const tasks = [];

  // 1) Tencent (browser-friendly, no headers, no preflight)
  if (sym.tencent) {
    tasks.push((async () => {
      try {
        const res = await fetchWithTimeout(`https://qt.gtimg.cn/q=${encodeURIComponent(sym.tencent)}`, {}, 7000);
        if (res.ok) {
          const text = await res.text();
          const parsed = parseTencent(sym, text);
          if (parsed) return { source: 'tencent', ...parsed };
        }
      } catch (_) {}
      return null;
    })());
  }

  // 2) Sina (needs Referer; fails in browsers, but kept for completeness)
  if (sym.sina) {
    tasks.push((async () => {
      try {
        const res = await fetchWithTimeout(`https://hq.sinajs.cn/list=${encodeURIComponent(sym.sina)}`, {}, 7000);
        if (res.ok) {
          const text = await res.text();
          const parsed = parseSina(sym, text);
          if (parsed) return { source: 'sina', ...parsed };
        }
      } catch (_) {}
      return null;
    })());
  }

  // 3) Yahoo (works outside China; may need User-Agent)
  tasks.push((async () => {
    try {
      const res = await fetchWithTimeout(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym.id)}?interval=1d&range=5d`, { headers: { 'User-Agent': _UA } }, 7000);
      if (res.ok) {
        const d = await res.json();
        const r = d.chart && d.chart.result;
        if (r && r[0]) {
          const m = r[0].meta || {};
          const p = m.regularMarketPrice;
          const prev = m.chartPreviousClose;
          if (p && prev) {
            return { source: 'yahoo', price: p, change: p - prev, pct: (p - prev) / prev * 100, currency: m.currency || sym.unit, time: m.regularMarketTime || Date.now() };
          }
        }
      }
    } catch (_) {}
    return null;
  })());

  // Take the first one that succeeded.
  const results = await Promise.all(tasks);
  const winner = results.find(Boolean);
  if (winner) {
    const { source, ...rest } = winner;
    return { ...sym, ...rest, _source: source };
  }
  return { ...sym, price: null, change: null, pct: null };
}

async function fetchQuotes(symbols) {
  // All symbols in parallel; each has its own 3-source race with 7s cap.
  return Promise.all(symbols.map(s => fetchQuote(s)));
}

// ---------- NEWS: RSS aggregator with CORS-friendly sources ----------
// chinanews.com.cn returns XML (no CORS in some browsers but works on most)
const NEWS_SOURCES = [
  { url: 'https://www.chinanews.com/rss/society.xml',     source: { zh: '中新网', en: 'ChinaNews' } },
  { url: 'https://www.chinanews.com/rss/health.xml',      source: { zh: '中新网', en: 'ChinaNews' } },
  { url: 'https://www.chinanews.com/rss/finance.xml',     source: { zh: '中新网', en: 'ChinaNews' } },
  { url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml',source: { zh: 'BBC',     en: 'BBC' } },
];

async function fetchRss(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': _UA } });
    if (!res.ok) return [];
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    const items = xml.querySelectorAll('item');
    return Array.from(items).slice(0, 5).map(it => ({
      title: (it.querySelector('title')?.textContent || '').trim(),
      link:  (it.querySelector('link')?.textContent || '').trim(),
      desc:  (it.querySelector('description')?.textContent || '').replace(/<[^>]*>/g, '').trim(),
      pubDate: it.querySelector('pubDate')?.textContent || '',
    })).filter(i => i.title);
  } catch (_) {
    return [];
  }
}

// Keyword-based image + topic classification for news cards
// Map wizard topic keys (what the user picks) -> classifier topic IDs.
const TOPIC_ALIAS = {
  health:   ['health'],
  local:    ['local'],
  national: ['national'],
  world:    ['world'],
  finance:  ['economy', 'gold', 'stock'],
  tech:     ['tech'],
  sports:   ['sport'],
  culture:  ['culture'],
  weather:  ['weather'],
  food:     ['food'],
};

const NEWS_KEYWORDS = [
  { keys: ['gold','silver','precious','metal','goldapi','期货','黄金','白银'], topic: 'gold',     label: { zh: '金价',         en: 'Gold' } },
  { keys: ['stock','share','market','index','shanghai','hang seng','nasdaq','s&p','dow','equity','股票','股市','指数','上证','恒生','纳斯达克','标普','道琼'], topic: 'stock',    label: { zh: '股市行情',         en: 'Markets' } },
  { keys: ['weather','rain','snow','temperature','forecast','storm','climate','天气','雨','雪','气温','台风','风暴'], topic: 'weather',  label: { zh: '天气',         en: 'Weather' } },
  { keys: ['health','hospital','medicine','medical','covid','flu','disease','doctor','健康','医院','医疗','疾病','养生','保健'], topic: 'health',   label: { zh: '健康',         en: 'Health' } },
  { keys: ['tech','ai','5g','semiconductor','chip','quantum','互联网','半导体','芯片','量子','人工智能','数字','机器人'], topic: 'tech',     label: { zh: '科技',         en: 'Tech' } },
  { keys: ['education','school','university','student','教育','学校','大学','学生'], topic: 'education', label: { zh: '教育',         en: 'Education' } },
  { keys: ['food','cuisine','restaurant','美食','饮食','餐厅','烹饪'], topic: 'food',     label: { zh: '美食',         en: 'Food' } },
  { keys: ['sport','olympic','football','basketball','体育','奥运','足球','篮球'], topic: 'sport',    label: { zh: '体育',         en: 'Sports' } },
  { keys: ['culture','festival','art','museum','文学','艺术','文化','节日','博物馆','电影','音乐'], topic: 'culture', label: { zh: '文化',         en: 'Culture' } },
  { keys: ['economy','gdp','trade','export','import','经济','贸易','出口','进口','财经','金融','银行'], topic: 'economy', label: { zh: '财经',         en: 'Economy' } },
  { keys: ['local','city','community','neighborhood','district','beijing','shanghai','guangzhou','本地','社区','北京','上海','广州','深圳','杭州'], topic: 'local',   label: { zh: '本地',         en: 'Local' } },
  { keys: ['china','chinese','beijing','parliament','politburo','国内','中国','国务院','人大','政协','党'], topic: 'national', label: { zh: '国内',         en: 'National' } },
  { keys: ['world','global','international','united nations','eu','biden','putin','trump','国际','全球','联合国','欧盟','外交'], topic: 'world', label: { zh: '国际',         en: 'World' } },
];

function topicMatchesUserPref(classifierTopic, userTopics) {
  if (!userTopics || !userTopics.length) return false;
  for (const k of userTopics) {
    if (TOPIC_ALIAS[k] && TOPIC_ALIAS[k].includes(classifierTopic)) return true;
    if (k === classifierTopic) return true;
  }
  return false;
}

function classifyNews(title, desc) {
  const text = ((title || '') + ' ' + (desc || '')).toLowerCase();
  for (const k of NEWS_KEYWORDS) {
    if (k.keys.some(x => text.includes(x.toLowerCase()))) {
      return k;
    }
  }
  return null;
}

// AI-style one-line summary extraction. Since we don't have an LLM
// in the browser, we use a simple extractive method: take the first
// sentence (or up to 80 chars) of the description.
function aiSummary(text, lang) {
  if (!text) return lang === 'zh' ? '（暂无摘要）' : '(no summary)';
  // Strip HTML, normalize whitespace
  const t = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  // Pick the first sentence (split on . ! ? for EN; 。 for ZH)
  const re = lang === 'zh' ? /[^。]+。/ : /[^.!?]+[.!?]/;
  const m = t.match(re);
  if (m) return m[0].trim();
  // Fallback: first 90 chars
  return t.length > 90 ? t.slice(0, 90) + '…' : t;
}

async function fetchDailyDigest() {
  // Fetch all sources in parallel, then merge and sort by date
  const lists = await Promise.all(NEWS_SOURCES.map(s => fetchRss(s.url)));
  const merged = [];
  lists.forEach((items, idx) => {
    items.forEach(it => merged.push({ ...it, source: NEWS_SOURCES[idx].source }));
  });
  // Sort newest first
  merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  // Take top 20, then enrich with classification + AI summary + image
  const top = merged.slice(0, 20);
  const lang = state.lang || 'zh';
  return top.map((it, i) => {
    const topic = classifyNews(it.title, it.desc);
    // Seed image by title hash so it's stable across reloads
    const seed = (it.title || 'news' + i).slice(0, 30) + i;
    return {
      id: i,
      title: it.title,
      summary: it.desc,
      aiSummary: aiSummary(it.desc, lang),
      src: it.source[lang] || it.source.zh,
      url: it.link,
      pubDate: it.pubDate,
      image: imageFor(seed),
      wikiImage: null,  // lazy-loaded when card becomes visible
      topic: topic?.topic || 'default',
      topicLabel: (topic?.label || { zh: '综合', en: 'General' })[lang] || topic?.label?.zh || '综合',
    };
  });
}

// ---------- POI: Amap (高德地图) primary + Nominatim fallback ----------
// Amap is accessible in China; Nominatim works outside China. The user
// configures the Amap key via the Settings panel (localStorage).
// Amap free tier: 5000 calls/day per IP.

// Haversine distance in meters between two {lat, lng} pairs.
function haversine(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371000; // earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const POI_QUERIES = {
  hospital:    { amap: '医院',          osm: 'hospital' },
  pharmacy:    { amap: '药店',          osm: 'pharmacy' },
  park:        { amap: '公园',          osm: 'park' },
  supermarket: { amap: '超市',          osm: 'supermarket' },
};

// ----- AMap (高德地图) Web 服务 key (pre-set, no user config UI) -----
// These keys are bundled with the app so the user doesn't need to
// register their own. If they hit a rate limit, rotate from the Amap
// console and update here.
const AMAP_WEB_KEY = '2f211c5272eb83e26039981f4d966e05';

function getMapConfig() {
  return { provider: 'amap', key: AMAP_WEB_KEY };
}
// setMapConfig is kept as a no-op so existing call-sites don't break,
// but the user can no longer change the key from the UI.
function setMapConfig(_provider, _key) { /* no-op: key is pre-set */ }

async function fetchPOIsAmap(kind, lat, lng, key) {
  const cfg = POI_QUERIES[kind] || POI_QUERIES.hospital;
  const url = `https://restapi.amap.com/v3/place/around?key=${encodeURIComponent(key)}` +
              `&keywords=${encodeURIComponent(cfg.amap)}&location=${lng},${lat}` +
              `&radius=3000&offset=15&extensions=base&output=JSON`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const d = await res.json();
  if (d.status !== '1' || !d.pois) {
    // INVALID_USER_KEY (10001), quota exceeded (10009), ip not white-listed (10012), etc.
    return { __amapError: (d.info || 'Amap error') + ' (code ' + (d.infocode || '?') + ')' };
  }
  return d.pois.map((p, i) => {
    const loc = (p.location || '').split(',');
    const elat = parseFloat(loc[1]);
    const elng = parseFloat(loc[0]);
    const dist = (elat && elng) ? Math.round(haversine(lat, lng, elat, elng)) : 999;
    return {
      id: (p.id || (kind + i)).toString(),
      name: { zh: p.name || 'POI', en: p.name || 'POI' },
      addr: { zh: p.address || ((p.pname||'')+(p.cityname||'')+(p.adname||'')),
              en: p.address || ((p.pname||'')+(p.cityname||'')+(p.adname||'')) },
      dist: dist, lat: elat, lng: elng,
    };
  });
}

async function fetchPOIsNominatim(kind, lat, lng) {
  let district = '';
  try {
    const rev = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${state.lang === 'zh' ? 'zh' : 'en'}`,
      { headers: { 'User-Agent': _UA } }
    );
    if (rev.ok) {
      const d = await rev.json();
      const a = d.address || {};
      district = a.suburb || a.city || a.town || a.village || a.state || '';
    }
  } catch (_) {}
  const config = POI_QUERIES[kind] || POI_QUERIES.hospital;
  const term = state.lang === 'zh' ? `${config.osm} ${district}` : `${config.osm} near ${district}`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&addressdetails=1&limit=10&accept-language=${state.lang === 'zh' ? 'zh' : 'en'}`,
      { headers: { 'User-Agent': _UA } }
    );
    if (!res.ok) return null;
    const arr = await res.json();
    return arr.map((el, i) => {
      const a = el.address || {};
      const road = a.road || '';
      const addrParts = [road, a.suburb || a.city_district || a.city || a.town || a.village].filter(Boolean);
      const street = addrParts.slice(0, 3).join(' ');
      const elat = parseFloat(el.lat), elng = parseFloat(el.lon);
      const dist = (elat && elng) ? Math.round(haversine(lat, lng, elat, elng)) : 999;
      const dn = el.display_name || el.name || 'POI';
      return {
        id: (el.place_id || (kind + i)).toString(),
        name: { zh: dn, en: dn },
        addr: { zh: street || '附近', en: street || 'Nearby' },
        dist, lat: elat, lng: elng,
      };
    });
  } catch (_) { return null; }
}

// Returns the device's best-known location. Tries geolocation first; on
// failure or timeout, falls back to the last cached location in
// localStorage, then to Beijing (39.9085, 116.3975).
const DEFAULT_LOC = { lat: 39.9085, lng: 116.3975, label: '北京' };
function getLastLocation() {
  try {
    const s = localStorage.getItem('last_loc');
    if (s) return JSON.parse(s);
  } catch (_) {}
  return DEFAULT_LOC;
}
function setLastLocation(lat, lng) {
  try { localStorage.setItem('last_loc', JSON.stringify({ lat, lng, t: Date.now() })); } catch (_) {}
}

async function getCurrentLocation(timeoutMs = 5000) {
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(p => resolve(p), () => reject(),
          { timeout: timeoutMs, maximumAge: 60000, enableHighAccuracy: false });
      });
      if (pos && pos.coords && pos.coords.latitude) {
        setLastLocation(pos.coords.latitude, pos.coords.longitude);
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch (_) { /* fall through */ }
  }
  return getLastLocation();
}

async function fetchPOIs(kind) {
  const loc = await getCurrentLocation();
  const lat = loc.lat, lng = loc.lng;
  const cfg = getMapConfig();
  if (cfg.key) {
    const r = await fetchPOIsAmap(kind, lat, lng, cfg.key);
    if (r && !r.__amapError) return { items: r, lat, lng };
    if (r && r.__amapError) return { __error: r.__amapError };
  }
  const r2 = await fetchPOIsNominatim(kind, lat, lng);
  return { items: r2 || [], lat, lng };
}

// AMap static map URL. Generates a 2D map snapshot centered on (lat,lng)
// with markers for each POI. Returns null if the key isn't configured.
// Docs: https://lbs.amap.com/api/webservice/guide/tools/staticmaps
function fetchStaticMapUrl(lat, lng, pois, size = '600x400', zoom = 14) {
  const cfg = getMapConfig();
  if (!cfg.key) return null;
  // Build the markers list. AMap static maps uses:
  //   markers=-1,markername=A,location:lat,lng|...
  // We use a small fixed set of marker types. Cap at 10 to keep URL short.
  const parts = [];
  const cap = (pois || []).slice(0, 10);
  for (let i = 0; i < cap.length; i++) {
    const p = cap[i];
    if (p.lat == null || p.lng == null) continue;
    parts.push(`mid,0xFF6F61,A:${p.lng},${p.lat}`);
  }
  const markers = parts.length ? `&markers=${encodeURIComponent(parts.join('|'))}` : '';
  return `https://restapi.amap.com/v3/staticmap?location=${lng},${lat}&zoom=${zoom}&size=${size}&scale=2&key=${encodeURIComponent(cfg.key)}${markers}`;
}


async function fetchWeather(lat = 39.9085, lng = 116.3975) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`,
      { headers: { 'User-Agent': _UA } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (_) {
    return null;
  }
}

// ---------- IMAGE: per-article real photos ----------
// Picsum (random, no key) — perfect for news cards
// Each URL is unique and stable for the same seed
function imageFor(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/360`;
}

// Wikipedia summary API — gives a real photo for well-known topics
// Used to find images for news by matching key entities
const WIKI_KEYWORDS = {
  economy:    'Economy of China',
  stock:      'Hong Kong Stock Exchange',
  gold:       'Gold',
  silver:     'Silver',
  weather:    'Climate of China',
  health:     'Health in China',
  education:  'Education in China',
  tech:       'Science and technology in China',
  transport:  'Transport in China',
  food:       'Cuisine of China',
  sport:      'Sport in China',
  culture:    'Culture of China',
  default:    'News',
};

async function wikiImageFor(keyword) {
  const topic = WIKI_KEYWORDS[keyword] || WIKI_KEYWORDS.default;
  try {
    const lang = state.lang === 'zh' ? 'zh' : 'en';
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      { headers: { 'User-Agent': _UA } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return d.thumbnail?.source || null;
  } catch (_) {
    return null;
  }
}

// =====================================================================
// GoldenAge AI — LLM Service
// =====================================================================
// Server-side LLM proxy. The app no longer calls an LLM provider
// directly — it calls our Supabase Edge Function `llm-chat`, which
// holds the SiliconFlow API key, enforces a per-user daily credits
// system (ai_credits table), and forwards to the model. The user does
// not configure any key; the only knobs they see are credit
// balance + the model answer itself.
//
// SB_URL is provided as a global by app.js (loaded first).
// =====================================================================

// Returns the user's current timezone offset in minutes (e.g. +08:00 = 480).
function getTzOffsetMinutes() {
  try { return -new Date().getTimezoneOffset(); } catch { return 480; }
}

// Returns {ok, credits_remaining, credits_total, reset_at, new_account?}
// Calls the ai_credits_read RPC via Supabase REST.
async function llmReadCredits() {
  try {
    const sess = await window.sb?.auth?.getSession?.();
    if (!sess?.data?.session) return { ok: false, error: 'no_session' };
    const accessToken = sess.data.session.access_token;
    const r = await fetch(SB_URL + '/rest/v1/rpc/ai_credits_read', {
      method: 'POST',
      headers: { 'apikey': window.sb.supabaseKey || '', 'authorization': 'Bearer ' + accessToken, 'content-type': 'application/json' },
      body: JSON.stringify({ p_user_id: null })
    });
    return await r.json();
  } catch (e) {
    return { ok: false, error: (e.message || String(e)) };
  }
}

// OpenAI-compatible chat completion. Returns
// OpenAI-compatible chat completion with optional tool-calling.
//   { text, tool_calls, raw, usage, credits_remaining, ... } — success
//   { error, ... }                                            — failure
async function llmChat(messages, opts = {}) {
  try {
    const sess = await window.sb?.auth?.getSession?.();
    if (!sess?.data?.session) {
      return { error: 'auth' };
    }
    const accessToken = sess.data.session.access_token;
    const r = await fetch(SB_URL + '/functions/v1/llm-chat', {
      method: 'POST',
      headers: { 'apikey': window.sb.supabaseKey || '', 'authorization': 'Bearer ' + accessToken, 'content-type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature: opts.temperature || 0.6,
        max_tokens:   opts.max_tokens   || 600,
        tz_offset_minutes: getTzOffsetMinutes(),
        tools: opts.tools,
        tool_choice: opts.tool_choice
      })
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      return {
        error: body.error || `HTTP ${r.status}`,
        detail: body.detail,
        credits_remaining: body.credits_remaining,
        credits_total:     body.credits_total,
        reset_at:          body.reset_at
      };
    }
    return {
      text: body.reply || '',
      tool_calls: body.tool_calls || [],
      raw: body,
      usage: body.usage,
      credits_remaining: body.credits_remaining,
      credits_total:     body.credits_total,
      reset_at:          body.reset_at
    };
  } catch (e) {
    return { error: (e && e.message) || String(e) };
  }
}

// Backwards-compat shims (callers may still call these; they're harmless
// no-ops now since the server manages everything).
function llmGetConfig() { return { provider: 'server', key: '(server-managed)' }; }
function llmSetConfig(_p, _k) { /* no-op: server-side */ }
// Empty providers map kept for legacy callers that introspect it.
const LLM_PROVIDERS = { server: { name: 'Server (SiliconFlow Qwen3-8B)', keyHint: 'configured in Supabase secrets' } };

// =====================================================================
// Scam-check LLM analyzer
// =====================================================================
// Asks the server-side LLM to evaluate a piece of text as a fraud / scam
// detection analyst. The model returns a strict JSON object that we
// parse and shape into the same {verdict, reasons, advice, confidence}
// the legacy regex-based analyzeScam() returned, so renderVerdict()
// works without changes.
//
// Falls back to the regex analyzer if the LLM call fails (no credits,
// network error, model returned non-JSON).
const SCAM_SYSTEM_PROMPT = `You are a fraud and scam detection analyst who protects elderly Chinese users.
You will receive a piece of text (an SMS, message, ad, link preview, etc.) and must decide if it's safe, suspicious, or dangerous.

Consider phishing patterns common in China:
- "中奖 / 抽奖 / 客服 / 退款 / 验证码 / 刷单 / 兼职 / 高回报 / 投资 / 提现 / 解冻 / 涉嫌洗钱 / 安全账户"
- Urgency: "立即 / 现在马上 / 限时 / 即将到期 / 最后一次"
- Authority impersonation: "公检法 / 银行 / 快递 / 运营商 / 客服 / 110 / 10086 / 10000 / 95588"
- Reward bait: "免费送 / 红包 / 现金 / 0元 / 1元 / 折扣 / 仅限今日"
- Cross-platform steering: "加微信 / 加QQ / 复制链接打开 / 浏览器输入 / 下载APP"
- Information requests: "身份证 / 银行卡 / 密码 / 验证码 / CVV / 人脸"
- Threats: "起诉 / 逮捕 / 征信 / 列入黑名单 / 销户"
- Romance/investment: "带你赚钱 / 老师带单 / 内部消息 / 稳赚不赔"
- New variations of classic scams (parcel redelivery, "your package is held at customs", "your account will be closed", fake delivery notifications, fake hospital bills, fake traffic tickets, AI-voice phishing).

Also consider legitimate text (delivery notifications from known couriers, two-factor codes from your bank, family messages) and do NOT flag those.

Output STRICT JSON only — no prose, no markdown fences — matching this shape exactly:
{"verdict":"safe|caution|danger","confidence":0.0-1.0,"summary_zh":"<one short Chinese sentence, max 30 chars>","summary_en":"<one short English sentence, max 60 chars>","reasons_zh":["<short Chinese reason 1>","<short Chinese reason 2>"],"reasons_en":["<short English reason 1>","<short English reason 2>"],"advice_zh":"<what the user should do, in Chinese, max 100 chars>","advice_en":"<what the user should do, in English, max 200 chars>"}

Rules:
- "danger" if there is a clear phishing / scam indicator (asking for codes, money, urgency + authority, etc.).
- "caution" if there are suspicious elements but it's ambiguous (e.g. could be a real delivery or a fake).
- "safe" if the text appears benign (family message, legitimate notification from a known service, normal conversation).
- reasons_zh / reasons_en: 0 to 4 short bullets, each ≤ 20 chars Chinese / 60 chars English. If safe, can be empty.
- confidence: how sure you are (0.0 to 1.0). 0.9+ for clear danger / clear safe, 0.6-0.8 for caution.`;

async function analyzeScamLLM(input, lang = 'zh') {
  const r = await llmChat([
    { role: 'system', content: SCAM_SYSTEM_PROMPT },
    { role: 'user', content: input }
  ], { temperature: 0.2, max_tokens: 600 });
  if (r && r.text) {
    // Strip ```json fences and parse.
    const cleaned = r.text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    // Find the first {...} block in case the model added a leading note.
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const obj = JSON.parse(m[0]);
        if (obj && (obj.verdict === 'safe' || obj.verdict === 'caution' || obj.verdict === 'danger')) {
          return {
            verdict: obj.verdict,
            confidence: Number(obj.confidence) || 0.5,
            reasons: [
              ...((obj.reasons_zh || []).map((zh, i) => ({ zh, en: (obj.reasons_en || [])[i] || zh }))),
            ],
            advice: {
              zh: obj.advice_zh || (obj.advice_en || ''),
              en: obj.advice_en || (obj.advice_zh || ''),
            },
            _source: 'llm',
            _summary: { zh: obj.summary_zh || '', en: obj.summary_en || '' },
            _credits: r.credits_remaining,
            _usage: r.usage
          };
        }
      } catch (_) { /* fall through to regex */ }
    }
    // Model didn't return valid JSON — surface the text as a "caution" advisory
    // so the user still gets *something* useful, but mark the source.
    return {
      verdict: 'caution',
      confidence: 0.3,
      reasons: [{ zh: 'AI 反馈未能结构化，请人工判断', en: 'AI response was not structured; please judge manually' }],
      advice: {
        zh: 'AI 给出的判断不够清晰，建议联系家人或拨打 110 咨询。',
        en: 'The AI analysis was unclear; please check with family or call local authorities.'
      },
      _source: 'llm-raw',
      _raw: r.text
    };
  }
  // LLM call failed — return a clear error marker so the caller can fall back.
  return { error: r?.error || 'unknown', _fallbackEligible: true };
}

// ---------- EXPORT ----------
window.LiveData = {
  fetchQuotes,
  fetchStock,
  findSymbol,
  fetchDailyDigest,
  fetchPOIs,
  fetchStaticMapUrl,
  getCurrentLocation,
  fetchWeather,
  imageFor,
  wikiImageFor,
  drawSparkline,
  llmChat,
  analyzeScamLLM,
  llmGetConfig,
  llmSetConfig,
  LLM_PROVIDERS,
  llmReadCredits,
  getMapConfig,
  setMapConfig,
  FINANCE_SYMBOLS,
};
