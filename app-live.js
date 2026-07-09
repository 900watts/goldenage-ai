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

async function fetchDailyDigest() {
  // Fetch all sources in parallel, then merge and sort by date
  const lists = await Promise.all(NEWS_SOURCES.map(s => fetchRss(s.url)));
  const merged = [];
  lists.forEach((items, idx) => {
    items.forEach(it => merged.push({ ...it, source: NEWS_SOURCES[idx].source }));
  });
  // Sort newest first
  merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  // Return top 10
  return merged.slice(0, 10).map((it, i) => ({
    id: i,
    title: it.title,
    summary: it.desc,
    src: it.source[state.lang] || it.source.zh,
    url: it.link,
    pubDate: it.pubDate,
  }));
}

// ---------- POI: OpenStreetMap Nominatim (no API key) ----------
// https://operations.osmfoundation.org/policies/nominatim/
async function fetchPOIs(kind, lat = 39.9085, lng = 116.3975) {
  // Beijing center as default
  const queries = {
    hospital:    `[amenity=hospital]`,
    pharmacy:    `[amenity=pharmacy]`,
    park:        `[leisure=park]`,
    supermarket: `[shop=supermarket]`,
  };
  const q = `${queries[kind] || queries.hospital}(around:3000,${lat},${lng})`;
  try {
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=[out:json][timeout:10];${q};out 20;`,
      { headers: { 'User-Agent': _UA } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return (d.elements || []).slice(0, 10).map((el, i) => {
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'] || tags['name:zh'] || 'Unknown';
      const street = (tags['addr:street'] || '') + ' ' + (tags['addr:housenumber'] || '');
      const city = tags['addr:city'] || '';
      const elat = el.lat;
      const elng = el.lon;
      const dist = elat && elng ? Math.round(haversine(lat, lng, elat, elng)) : null;
      return {
        id: el.id?.toString() || (kind + i),
        name: { zh: tags['name:zh'] || name, en: tags['name:en'] || name },
        addr: { zh: (street + ' ' + city).trim() || '附近', en: (street + ' ' + city).trim() || 'Nearby' },
        dist: dist || 999,
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

// ---------- EXPORT ----------
window.LiveData = {
  fetchQuotes,
  fetchDailyDigest,
  fetchPOIs,
  fetchWeather,
  FINANCE_SYMBOLS,
};
