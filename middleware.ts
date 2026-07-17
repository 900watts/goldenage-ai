// =====================================================================
// GoldenAge AI — Vercel Edge Middleware: IP Ban Enforcement
// =====================================================================
// Runs at Vercel's CDN edge before any HTML/asset is served. Banned IPs
// get served the /banned page instead of the real app. Real client IP
// is read from x-forwarded-for (the first hop is the user's ISP, the
// rest is Vercel's internal chain) — so this is the right place to
// enforce IP bans, unlike the Supabase Edge Function which sits behind
// a separate gateway that rewrites the header.
//
// Available on ALL Vercel plans (Hobby included). No CLI or token
// needed to deploy — the GitHub-Vercel integration auto-picks up the
// new middleware.ts on the next push to main.
//
// To add a new ban: append the IP to BANNED_IPS, commit, push.
// =====================================================================

const BANNED_IPS: string[] = [
  '216.236.45.165', // 2026-07-12 — 18 anonymous AI calls, Hong Kong, Eons Data
  // '1.2.3.4',     // <-- example
];

// Vercel puts the real client IP first in x-forwarded-for, but it may
// also set x-real-ip or x-vercel-forwarded-for. We try them in order
// and fall back to 'unknown' so the comparison is safe.
function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('cf-connecting-ip') ||
    '';
  return real.trim() || 'unknown';
}

export const config = {
  // Run on every request except static assets and the banned page
  // itself (so the banned page always loads). Vercel supports the
  // `matcher` syntax for path filtering.
  matcher: [
    '/((?!_next/|favicon.ico|banned|banned\\.html|assets/|public/|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|js|css|woff2?|ttf|map)).*)',
  ],
};

export default function middleware(req: Request) {
  const ip = getClientIp(req);
  if (BANNED_IPS.includes(ip)) {
    // Use a rewrite so the visitor sees the banned page but the URL
    // stays clean. We pass the IP + reason in the query so the page
    // can confirm who's being served.
    const url = new URL('/banned', req.url);
    url.searchParams.set('ip', ip);
    url.searchParams.set(
      'reason',
      'Repeated abuse of the GoldenAge AI anonymous AI endpoint. ' +
        'This ban was issued by the site administrator.'
    );
    return Response.redirect(url, 302);
  }
  return new Response(null, { status: 200, headers: { 'x-ga-middleware': 'ok' } });
}
