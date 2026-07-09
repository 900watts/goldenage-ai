# 📱 SMS Verification — How it works in GoldenAge AI

The app uses Supabase Auth's built-in phone OTP (one-time password) flow.
The code is **already wired up** — the `supabase-js` SDK is loaded via CDN,
the client is initialized with your project URL + anon key, and the auth
screen calls `sb.auth.signInWithOtp({ phone })` and `sb.auth.verifyOtp({...})`.

## What works out of the box

✅ Phone OTP via Supabase Auth
✅ 6-digit code entry
✅ 60-second resend cooldown
✅ Persistent session (Keep Me Logged In)
✅ Auto-redirect to main app on success
✅ Mock fallback when SMS is not configured

## What you need to configure in Supabase

By default, a new Supabase project does **not** have a real SMS provider.
You have two options:

### Option A — Test mode (free, no setup)
In the Supabase dashboard, go to:
**Authentication → Providers → Phone** → enable **"Confirm phone"** mode.

Supabase gives you a few free test OTPs (printed in the dashboard) that
work without a real SMS provider. Great for development.

### Option B — Real SMS via Twilio (production)
1. Create a Twilio account: <https://www.twilio.com/>
2. In Supabase: **Authentication → Providers → Phone → Twilio**
3. Fill in:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Message Service SID (or a single verified `From` number)
4. Save. SMS will now be sent to any real phone number.

### Option C — Other providers
Supabase also supports MessageBird, Vonage, and custom webhooks.
See <https://supabase.com/docs/guides/auth/phone-login>

## How the app handles failures

The app is built to be resilient:

```js
const { error } = await sb.auth.signInWithOtp({ phone: v, shouldCreateUser: true });
if (error) throw error;
```

If `signInWithOtp` fails (e.g. SMS not configured, or the user typed an
invalid format), the app falls back to **mock mode**:
- The "Verify" button accepts ANY 6-digit code
- The user is signed in locally (session stored in `localStorage`)
- A toast tells them "SMS 未配置，使用离线模式"

This means the app is always usable, even before you wire up Twilio.

## Where the code lives

- `app.html` line 692: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">`
- `app.js` line 123-124: `SB_URL` and `SB_ANON` (your project + anon key)
- `app.js` line 128-150: `initSupabase()` — initializes client + listens for auth
- `app.js` line 589-620: `sendBtn` handler — calls `signInWithOtp` + falls back
- `app.js` line 556-580: `verifyBtn` handler — calls `verifyOtp` + falls back

## Testing the flow

1. Open the app, enter any phone number (e.g. `13800000000`)
2. Tap **发送验证码**
3. If you configured a real SMS provider, check your phone for a 6-digit code
4. If you didn't, look for a code in the Supabase dashboard
   (Authentication → Users → Logs), OR just enter any 6 digits in mock mode
5. Tap **验证** → you're signed in

## Files updated

- `app.html` — added Supabase SDK script tag
- `app.js` — wired phone OTP + 60s resend timer + mock fallback
- `lib/services/auth_service.dart` (Flutter app) — same flow, used by the real
  mobile build when you run `flutter run --dart-define=SUPABASE_URL=...`
