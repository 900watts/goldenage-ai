// =====================================================================
// GoldenAge AI — Live Data Services
// =====================================================================
// All real-time data feeds (finance, news, weather, POI). Every service
// has a proper fallback to "—" so the UI never shows stale mock numbers.
// =====================================================================

const _UA = 'Mozilla/5.0 (GoldenAge/1.0)';

// ---------- FINANCE: Yahoo Finance v8 chart (no API key) ----------
const FINANCE_SYMBOLS = [
  { id: 'GC=F',        name: { zh: '黄金 (USD/oz)',  en: 'Gold (USD/oz)' },         unit: 'USD/oz' },
  { id: 'SI=F',        name: { zh: '白银 (USD/oz)',  en: 'Silver (USD/oz)' },       unit: 'USD/oz' },
  { id: '000001.SS',   name: { zh: '上证指数',         en: 'Shanghai Composite' },   unit: 'CNY' },
  { id: '^GSPC',       name: { zh: '标普500',         en: 'S&P 500' },              unit: 'USD' },
  { id: '^IXIC',       name: { zh: '纳斯达克',         en: 'NASDAQ' },               unit: 'USD' },
  { id: '^DJI',        name: { zh: '道琼斯',           en: 'Dow Jones' },            unit: 'USD' },
  { id: '^HSI',        name: { zh: '恒生指数',         en: 'Hang Seng' },            unit: 'HKD' },
];

async function fetchQuote(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`, { headers: { 'User-Agent': _UA } });
    if (!res.ok) return null;
    const d = await res.json();
    const r = d.chart && d.chart.result;
    if (!r || !r[0]) return null;
    const m = r[0].meta || {};
    const p = m.regularMarketPrice;
    const prev = m.chartPreviousClose;
    if (!p) return null;
    const chg = p - prev;
    const pct = prev ? (chg / prev * 100) : 0;
    return { price: p, change: chg, pct, currency: m.currency || 'USD', time: m.regularMarketTime };
  } catch (_) {
    return null;
  }
}

async function fetchQuotes(symbols) {
  // Yahoo rejects multi-symbol chart requests, so call in parallel
  return Promise.all(symbols.map(async (s) => {
    const q = await fetchQuote(s.id);
    return q ? { ...s, ...q } : { ...s, price: null, change: null, pct: null };
  }));
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
const NEWS_KEYWORDS = [
  { keys: ['gold','silver','precious','metal','goldapi','期货','黄金','白银'], topic: 'gold',     label: { zh: '金价',         en: 'Gold' } },
  { keys: ['stock','share','market','index','shanghai','hang seng','nasdaq','s&p','dow','equity','股票','股市','指数','上证','恒生','纳斯达克','标普','道琼'], topic: 'stock',    label: { zh: '股市行情',         en: 'Markets' } },
  { keys: ['weather','rain','snow','temperature','forecast','storm','climate','天气','雨','雪','气温','台风','风暴'], topic: 'weather',  label: { zh: '天气',         en: 'Weather' } },
  { keys: ['health','hospital','medicine','medical','covid','flu','disease','doctor','健康','医院','医疗','疾病'], topic: 'health',   label: { zh: '健康',         en: 'Health' } },
  { keys: ['tech','ai','5g','semiconductor','chip','quantum','互联网','半导体','芯片','量子','人工智能'], topic: 'tech',     label: { zh: '科技',         en: 'Tech' } },
  { keys: ['education','school','university','student','教育','学校','大学','学生'], topic: 'education', label: { zh: '教育',         en: 'Education' } },
  { keys: ['food','cuisine','restaurant','美食','饮食','餐厅'], topic: 'food',     label: { zh: '美食',         en: 'Food' } },
  { keys: ['sport','olympic','football','basketball','体育','奥运','足球','篮球'], topic: 'sport',    label: { zh: '体育',         en: 'Sports' } },
  { keys: ['culture','festival','art','museum','文学','艺术','文化','节日','博物馆'], topic: 'culture', label: { zh: '文化',         en: 'Culture' } },
  { keys: ['economy','gdp','trade','export','import','经济','贸易','出口','进口'], topic: 'economy', label: { zh: '财经',         en: 'Economy' } },
];

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

// ---------- POI: OpenStreetMap Nominatim (no API key) ----------
// https://operations.osmfoundation.org/policies/nominatim/
// Uses keyword search + reverse geocoding (no Overpass dependency)
const POI_QUERIES = {
  hospital:    { query: '医院',          en: 'hospital' },
  pharmacy:    { query: '药店 药房',     en: 'pharmacy' },
  park:        { query: '公园',          en: 'park' },
  supermarket: { query: '超市 便利店',  en: 'supermarket' },
};

async function fetchPOIs(kind, lat = 39.9085, lng = 116.3975) {
  // Use browser geolocation when available
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(p => resolve(p), () => reject(), { timeout: 4000, maximumAge: 60000 });
      });
      if (pos && pos.coords) { lat = pos.coords.latitude; lng = pos.coords.longitude; }
    } catch (_) { /* fall through to default */ }
  }
  // Reverse geocode to get human-readable address
  let district = 'Beijing';
  try {
    const rev = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${state.lang === 'zh' ? 'zh' : 'en'}`,
      { headers: { 'User-Agent': _UA } }
    );
    if (rev.ok) {
      const d = await rev.json();
      const a = d.address || {};
      district = a.suburb || a.city || a.town || a.village || a.state || district;
    }
  } catch (_) {}
  // Search for POI near this address
  const config = POI_QUERIES[kind] || POI_QUERIES.hospital;
  const searchTerm = state.lang === 'zh' ? `${config.query} ${district}` : `${config.en} near ${district}`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&addressdetails=1&limit=12&accept-language=${state.lang === 'zh' ? 'zh' : 'en'}`,
      { headers: { 'User-Agent': _UA } }
    );
    if (!res.ok) return null;
    const arr = await res.json();
    return arr.slice(0, 10).map((el, i) => {
      const a = el.address || {};
      const road = a.road || a.pedestrian || a.footway || '';
      const houseNum = a.house_number || '';
      const addrParts = [road, houseNum, a.suburb || a.city_district || a.city || a.town || a.village].filter(Boolean);
      const street = addrParts.slice(0, 3).join(' ');
      const elat = parseFloat(el.lat);
      const elng = parseFloat(el.lon);
      const dist = elat && elng ? Math.round(haversine(lat, lng, elat, elng)) : 999;
      const displayName = el.display_name || el.name || 'POI';
      return {
        id: (el.place_id || (kind + i)).toString(),
        name: { zh: displayName, en: displayName },
        addr: { zh: street || '附近', en: street || 'Nearby' },
        dist: dist,
        lat: elat, lng: elng,
      };
    });
  } catch (_) {
    return null;
  }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ---------- WEATHER: Open-Meteo (no API key) ----------
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

// ---------- EXPORT ----------
window.LiveData = {
  fetchQuotes,
  fetchDailyDigest,
  fetchPOIs,
  fetchWeather,
  imageFor,
  wikiImageFor,
  FINANCE_SYMBOLS,
};
