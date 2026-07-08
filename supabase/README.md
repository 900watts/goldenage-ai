# GoldenAge AI — Supabase Backend

This folder contains the full Phase 2 backend.

```
supabase/
├── migrations/
│   └── 20260708000000_init.sql   # 11 tables + pgvector + RLS + triggers
├── functions/
│   └── notify-guardian/
│       └── index.ts              # Edge Function: SMS + push to guardians
└── seed/
    └── dev_seed.sql              # Local dev fixtures
```

## 1. Apply the migration

**Option A — Supabase Dashboard**
1. Create a project at <https://supabase.com/dashboard>
2. Project → SQL Editor → New query
3. Paste the contents of `migrations/20260708000000_init.sql` → Run

**Option B — Supabase CLI (recommended)**
```bash
supabase login
supabase link --project-ref <your-ref>
supabase db push
```

The migration is **idempotent** (`create … if not exists`) and sets up:

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` with elder-specific fields (city, mobility, hearing…) |
| `user_preferences` | Big Text Mode, dark mode, language, TTS speed, haptics |
| `memory_embeddings` | pgvector long-term AI memory (1536-dim) |
| `session_logs` | Per-day mood + activity summary (privacy-safe for guardians) |
| `medication_schedules` | Reminder schedules |
| `medication_logs` | Compliance log |
| `guardians` | Family pairing via encrypted token + QR |
| `crisis_events` | SOS / fall / chest-pain → guardian bypass |
| `news_bookmarks` | Saved Daily Digest items |
| `scam_reports` | Anti-Scam evaluation history |
| `finance_watchlist` | Tracked gold / silver / indices |

**Row Level Security** is enabled on every table. A user can only ever read
or mutate their own data — except guardians, who get **read-only** access
to the privacy-safe `guardian_elder_summary` view and to `crisis_events`
for their elder.

## 2. Deploy the Edge Function

```bash
supabase functions deploy notify-guardian

# Configure secrets (Twilio for SMS, FCM for push)
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxxxxx
supabase secrets set TWILIO_FROM_NUMBER=+15555550100
supabase secrets set FCM_SERVER_KEY=xxxxxxxx
```

The Flutter `CrisisService.raise()` will invoke this function automatically
in Phase 4 (after location capture is wired).

## 3. Wire the Flutter app

Compile-time secrets are read from `--dart-define`:

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGciOi...
```

`lib/services/supabase_service.dart` initialises the client once in
`main.dart` before `runApp()`. With a placeholder URL the app still boots
into local-mock mode (useful for UI work); with real values it talks to
your project.

## 4. Verify

After applying the migration, you should see:

- 11 tables under Database → Tables
- `public` schema with `extensions.vector`
- Realtime publication includes `session_logs`, `crisis_events`, `medication_logs`
- The `handle_new_user` trigger creates a `profiles` + `user_preferences`
  row automatically whenever someone signs up

## 5. Optional: pgvector index maintenance

The IVFFlat index is built with `lists = 100`. After ~50k memory rows
you may want to rebuild it:

```sql
reindex index memory_embedding_ivf;
```

For very large memory stores, consider HNSW (faster builds, slower
index size) — see the pgvector docs.
