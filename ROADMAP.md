# GoldenAge AI — Roadmap (FABLE 5 blindspot scan)

> Living plan. Coordinated with **Trae Work** via the shared channel
> `900watts/goldenage-ai-collab` (`CHAT.txt` + `PROTOCOL.md`).
> This file is the canonical backlog; the chat log carries the running
> conversation + who-claimed-what.

## FABLE 5 input check
- Task complexity: **9/10** — multi-component (web + Flutter + Edge Fn + DB),
  high blast-radius (auth/RLS/credits), multi-agent coordination. Full process used.
- Known knowns: pairing fix, 10/day cap, admin badge, intent router, SOS→crisis_events.
- Known unknowns: real traffic volume, Twilio/FCM secrets availability.
- **Unknown unknowns (blindspots surfaced below) drove most of P0.**

## Blindspot scan (the "you don't know you don't know" list)
1. **Domain DNS is dead.** `goldenage.ai` serves a parking page; Vercel
   middleware (incl. the IP ban) never runs for real users. Highest-impact
   hidden blocker — everything else is moot until the domain points at Vercel.
2. **Leaked credential.** The GitHub PAT is embedded in the local git remote
   URL (visible in `.git/config`). Anyone with repo read access to this
   machine can push as you. Rotate + use a credential helper.
3. **Dead-code landmine.** Two `GuardianScreen` classes; a future import of
   both breaks the Flutter build. (Resolved 2026-07-17 — dead file removed,
   `aiReason` wired into the live banner.)
4. **Orphaned DB column.** `crisis_events.ai_reason` exists but nothing wrote
   it after Trae's commit was reverted. Now populated by `CrisisService.raise`.
5. **No safety net.** Zero automated checks; a bad push to `main` ships to
   prod via Vercel auto-deploy with no gate. A `node --check` + health-curl
   pre-push hook would have caught prior regressions.
6. **Anon cap may be too strict.** 1/day is anti-abuse but also kills the
   anonymous landing-page AI preview for legitimate curious visitors.

## Prioritized backlog

### P0 — user-blocked (flag, do not burn cycles)
- [ ] **Re-point `goldenage.ai` DNS to Vercel** (else middleware + domain dead). *USER*
- [ ] **Rotate the GitHub PAT** + switch remote to a credential helper. *USER*

### P1 — high value, safe
- [x] Flutter: delete dead `lib/screens/guardian/guardian_screen.dart`; merge `aiReason` into live banner. *(WorkBuddy, 2026-07-17)*
- [ ] Edge: `llm-chat` populate `crisis_events.ai_reason` server-side for web SOS (richer guardian context). Needs `app.js` + Edge Fn.
- [ ] Add minimal CI gate: `node --check` on client files + a `curl` health script for `llm-chat`; run before push.
- [ ] Web: show the elder's own SOS history (read `crisis_events` where `user_id = me`) in the Me/History screen.

### P2 — nice-to-have
- [ ] i18n parity pass (zh/en) across new strings.
- [ ] Landing page: live status badge + a real screenshot.
- [ ] `notify-guardian`: add FCM/Twilio secrets for real SMS push. *USER provides secrets*
- [ ] Flip `llm-chat` `verify_jwt=true` once the anonymous preview is no longer needed.
- [ ] Tune anon cap 1/day → a saner number (e.g. 5/day) after DNS is fixed and traffic is observable.

## Deviation log (FABLE 5 Phase 4)
- **D1**: Originally planned to also deploy an Edge Fn change this pass.
  Deferred — no Flutter SDK here to verify mobile, and unattended Edge deploys
  risk regressions. Web/Edge left stable; will resume next session. *Status: accepted.*
- **D2**: `aiReason` is derived locally from `CrisisKind` (not an LLM triage)
  because the web/app raise path has no AI step yet. Forward-compatible;
  the Edge Fn can overwrite `ai_reason` later. *Status: accepted.*
