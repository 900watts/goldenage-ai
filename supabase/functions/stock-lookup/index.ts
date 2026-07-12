// Stock lookup edge function — runs server-side so CORS isn't an issue.
// Accepts: { ticker: "AAPL" } or { ticker: "苹果" } (Chinese name will be
// resolved client-side via findSymbol).
// Returns: { ok, ticker, name, price, change, pct, currency, time }
// or { ok: false, error }.
//
// Yahoo Finance v8 doesn't set CORS headers, so we fetch from the
// server. We also try a fallback to Stooq (which does support CORS
// but only for daily bars; the Edge Function always uses the server
// fetch path so that's fine).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROJECT_URL = Deno.env.get('SUPABASE_URL') || 'https://exvlolipycabnqiaptib.supabase.co';
const SR_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  // CORS preflight (browsers send OPTIONS first when the call isn't a
  // simple GET; we return the standard CORS headers so the browser
  // then sends the real POST).
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders()
    });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  const body = await req.json().catch(() => ({}));
  const ticker = String(body.ticker || '').trim();
  if (!ticker) return jsonResponse({ ok: false, error: 'Missing ticker' }, 400);

  // The ticker may be either an id (AAPL) or a Chinese name (苹果). The
  // client should have already resolved the name -> id mapping, but
  // for safety we also try the raw string against Yahoo.
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  try {
    const r = await fetch(yahooUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) {
      return jsonResponse({ ok: false, error: `Yahoo HTTP ${r.status}` });
    }
    const d = await r.json();
    const res = d?.chart?.result?.[0];
    if (!res) {
      return jsonResponse({ ok: false, error: 'No data from Yahoo' });
    }
    const m = res.meta || {};
    const p = m.regularMarketPrice;
    const prev = m.chartPreviousClose;
    if (p == null || prev == null) {
      return jsonResponse({ ok: false, error: 'No price in Yahoo response' });
    }
    return jsonResponse({
      ok: true,
      ticker,
      symbol: m.symbol || ticker,
      name: m.longName || m.shortName || ticker,
      currency: m.currency || 'USD',
      exchange: m.exchangeName || m.fullExchangeName || '',
      price: p,
      previousClose: prev,
      change: p - prev,
      pct: ((p - prev) / prev) * 100,
      time: m.regularMarketTime || Date.now(),
      source: 'yahoo'
    });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message || 'fetch failed' });
  }
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders()
  });
}