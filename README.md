# GoldenAge AI · 智享银龄

> A companion-driven, accessibility-first Flutter + Supabase application
> built for elderly users. Cross-platform (Android + Windows + Web),
> AI-powered, privacy-first, big-text-by-default, bilingual (CN/EN).

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)]() [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]() [![Flutter](https://img.shields.io/badge/Flutter-3.24+-blue)]() [![Supabase](https://img.shields.io/badge/Supabase-2.5+-green)]()

---

## ✨ Features (all 11 pillars)

| # | Feature | Status |
|---|---------|--------|
| 01 | One-Click Auth (Phone OTP + Biometric) | ✅ |
| 02 | Big Text Mode (default ON, 18–24pt body) | ✅ |
| 03 | Instant CN / EN language toggle (top app bar) | ✅ |
| 04 | AI Bubble + SOUL.md persona + tool-calling | ✅ |
| 05 | AI-curated Daily News Digest + read-aloud TTS | ✅ |
| 06 | Live Location + AMap POI search (hospitals, pharmacies, parks) | ✅ |
| 07 | Finance & Metals tracker (gold/silver/indices, AI explains) | ✅ |
| 08 | Anti-Scam Shield (Safe / Caution / DANGER verdict) | ✅ |
| 09 | Frictionless UI (≥64px targets, haptics, always-labeled buttons) | ✅ |
| 10 | Guardian Ecosystem (QR pairing, Realtime sync, Exception Gate) | ✅ |
| 11 | One-Tap SOS + Medication Companion | ✅ |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────┐
│  Layer 1 · Presentation (Flutter)                      │
│  Big Text · High contrast · Bilingual · AiBubbleOverlay│
├───────────────────────────────────────────────────────┤
│  Layer 2 · AI Agent                                    │
│  SOUL.md → LlmService → OpenAI/Anthropic → tools      │
├───────────────────────────────────────────────────────┤
│  Layer 3 · Backend (Supabase)                          │
│  Postgres + RLS · pgvector · Realtime · Edge Functions│
├───────────────────────────────────────────────────────┤
│  Layer 4 · External APIs                               │
│  AMap (高德) · RSS News · Yahoo Finance · Twilio · FCM │
└───────────────────────────────────────────────────────┘
```

### 11-Table Schema

`profiles`, `user_preferences`, `memory_embeddings` (pgvector),
`session_logs`, `medication_schedules`, `medication_logs`,
`guardians`, `crisis_events`, `news_bookmarks`, `scam_reports`,
`finance_watchlist` — all with Row Level Security.

The `guardian_elder_summary` view gives family members **aggregated
mood/activity** without exposing private chats. The `crisis_events`
table is the **only** place where guardians bypass privacy (the
"Exception Gate").

---

## 🚀 Quick Start

### 1. Prerequisites
- Flutter ≥ 3.22
- A Supabase project (see "Setup Supabase" below)
- API keys: OpenAI (or Anthropic), AMap (optional), Twilio (optional)

### 2. Clone & install
```bash
git clone https://github.com/900watts/goldenage-ai.git
cd goldenage-ai
flutter pub get
flutter gen-l10n
```

### 3. Configure secrets
```bash
cp .env.example .env
# Edit .env with your real values
```

### 4. Run
```bash
# Without Supabase (UI preview with mock data)
flutter run

# With real Supabase + AI
flutter run \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=OPENAI_API_KEY=sk-... \
  --dart-define=AMAP_API_KEY=...
```

---

## 🛠️ Setup Supabase

The repo ships a one-shot provisioning script that creates a new
Supabase project via the Management API, applies the migration, and
writes the resulting URL + anon key back to `.env`.

**Prerequisites:**
1. A Supabase **personal access token**:
   <https://supabase.com/dashboard/account/tokens>
2. A Supabase organization (free tier is fine):
   <https://supabase.com/dashboard/orgs>

```bash
# macOS / Linux
bash bin/setup_supabase.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File bin\setup_supabase.ps1
```

The script will:
1. Create a new `goldenage-ai` project in your org
2. Wait for it to come online
3. Apply `supabase/migrations/20260708000000_init.sql` via psql
4. Write `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` back to your `.env`

Then deploy the Edge Function:
```bash
supabase functions deploy notify-guardian
supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=...
```

If you can't run the Management API (e.g. you already have a project),
manually paste `supabase/migrations/20260708000000_init.sql` into the
SQL editor at <https://supabase.com/dashboard/project/_/sql>.

---

## 🗂️ Project Layout

```
goldenage-ai/
├── README.md
├── SOUL.md                  # AI persona (also bundled in assets/soul/)
├── pubspec.yaml
├── l10n.yaml
├── .env.example
├── .github/workflows/ci.yml
├── bin/
│   ├── setup_supabase.sh    # One-shot project provisioning
│   └── setup_supabase.ps1   # Windows equivalent
├── supabase/
│   ├── migrations/20260708000000_init.sql   # 11-table schema + RLS
│   ├── functions/notify-guardian/index.ts   # Edge Function (Twilio + push)
│   ├── seed/dev_seed.sql
│   └── README.md
├── assets/
│   └── soul/SOUL.md         # Runtime-loaded persona
└── lib/
    ├── main.dart            # Entry: Supabase + providers + AI tools
    ├── app.dart             # MaterialApp.router with go_router
    ├── core/
    │   ├── app_shell.dart       # Bottom-nav shell
    │   ├── colors.dart
    │   ├── constants.dart       # Touch targets, big text bounds, env keys
    │   ├── l10n_ext.dart        # context.l10n
    │   └── services/router_service.dart
    ├── theme/app_theme.dart
    ├── providers/
    │   ├── locale_provider.dart
    │   ├── text_scale_provider.dart
    │   └── auth_state_provider.dart
    ├── ai/                  # ── Phase 3 ──
    │   ├── soul_persona.dart
    │   ├── llm_service.dart         # OpenAI + Anthropic
    │   ├── voice_service.dart       # speech_to_text
    │   └── tools/ai_tools.dart      # tool-calling registry
    ├── services/            # ── Phase 2 Supabase ──
    │   ├── supabase_service.dart
    │   ├── auth_service.dart
    │   ├── profile_service.dart
    │   ├── vector_memory_service.dart
    │   ├── guardian_service.dart
    │   ├── crisis_service.dart
    │   └── medication_service.dart
    ├── features/            # ── Phase 4-5 feature screens ──
    │   ├── map/                 # AMap + POI search
    │   ├── finance/             # Gold/silver/indices
    │   ├── news/                # AI-curated Daily Digest
    │   ├── scam/                # Anti-Scam Shield
    │   ├── guardian/            # QR pairing
    │   └── medication/          # Schedule + compliance
    ├── widgets/
    │   ├── ai_bubble/           # Floating chat bubble
    │   ├── big_button.dart      # ≥64px, always labeled
    │   ├── labeled_icon_card.dart
    │   └── language_toggle_button.dart
    ├── l10n/                 # app_zh.arb, app_en.arb
    └── screens/              # Legacy placeholders kept for compat
        ├── home/home_screen.dart       # SOS wired to CrisisService
        ├── auth/auth_screen.dart       # Wired phone OTP
        └── ...
```

---

## 🔐 Security & Privacy

- **Big Text Mode ON by default** — body text 18–24pt, 1.5× scale.
- **All buttons ≥64×64px**, always carry a text label (never icon alone).
- **Row Level Security** on every Postgres table.
- **Privacy-safe Guardian view** — family sees aggregated mood only.
- **Crisis Exception Gate** — `crisis_events` is the single place
  guardians bypass privacy (and only when triggered by SOS / fall /
  chest pain / etc.).
- **No secrets in the repo** — `.env` is gitignored, `.env.example`
  shows placeholders only.
- **`flutter run --dart-define=...`** keeps API keys out of source.

---

## 🛣️ Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| **1 · Foundation** | ✅ | Project, CN/EN, Big Text theme, nav shell |
| **2 · Backend** | ✅ | Supabase SDK, 11-table schema, pgvector, RLS, Auth, Edge Function |
| **3 · AI Core** | ✅ | SOUL.md persona, AI bubble, voice-to-text, tool-calling, vector memory |
| **4 · External APIs** | ✅ | AMap/高德, finance, news aggregator, TTS read-aloud |
| **5 · Safety Net** | ✅ | Anti-Scam engine, Guardian QR pairing, medication, SOS chain |

---

## 📜 License

MIT © 2026 GoldenAge AI

## 🤝 Contributing

PRs welcome. Please run `flutter analyze` and `flutter test` before
pushing. Add new strings to both `app_zh.arb` and `app_en.arb`.

---

> "Every word you speak is a small gift of patience. Give it freely." — SOUL.md
