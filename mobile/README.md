# GoldenAge — Android APK (Capacitor wrapper)

Wraps the existing **vanilla-JS web app** (`app.html` / `app.js` / `app-live.js`) in a
Capacitor Android shell so it runs as a **sideloadable debug APK** — no app-store
developer license required.

The web code is reused as-is. In Android it runs inside a WebView, so it talks to the
**same China-friendly providers** the web app already uses:

- **Amap Web服务 key** (`Web服务`, not the JS-API key) → POI list, 逆地理编码, 路径规划/directions, 天气, 静态地图图片. No Amap *Android* key and no SHA1/package binding needed.
- **腾讯财经 `qt.gtimg.cn`** → market quotes.
- **DeepSeek / 智谱 / 通义千问** → LLM chat (key entered in Settings).
- **Supabase** → auth/profile. Vendored locally (`www/vendor/supabase.js`) so the APK does **not** depend on a CDN that may be blocked in China.

> You do **not** need to create an Amap **Android平台** key or a **HarmonyOS NEXT** key for this APK.

## Prerequisites (on the machine that builds the APK)
- Node.js 18+ (already present in this workspace toolchain)
- **JDK 17** (Capacitor 6 / Android Gradle plugin requirement)
- **Android SDK** with:
  - Android Platform 34 (or 35)
  - Build-Tools 34+
  - Set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) to the SDK path
- (Optional) Android Studio — easiest way to satisfy the above and to `Build → Build Bundle(s) / APK → Build APK`.

## Build the debug APK
From this `mobile/` folder:

```bash
npm install                 # install capacitor (already done once)
npm run sync                # copy latest web app -> native assets
cd android
./gradlew assembleDebug     # or: gradlew.bat assembleDebug on Windows
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Or just use Android Studio
1. `npm run sync` (keeps native assets current).
2. Open the `mobile/android` folder in Android Studio.
3. `Build → Build Bundle(s) / APK → Build APK`.

## Install / sideload
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```
Or copy `app-debug.apk` to the phone and tap it (enable "Install unknown apps").

## First run
1. Open **Settings** in the app and paste your **Amap Web服务 key**
   (`2f211c5272eb83e26039981f4d966e05`).
2. (Optional) paste a DeepSeek / 智谱 / 通义 key for AI chat.
3. Grant **Location** when prompted — falls back to default coordinates if denied.

## Updating the app
Edit the web sources at the **workspace root** (`app.html`, `app.js`, `app-live.js`),
then re-run `npm run sync` (it re-copies them into `www/` and the APK assets).
`prep-web.cjs` automatically swaps the Supabase CDN tag for the local vendored copy.

## Notes / known caveats
- **Magic-link login in WebView**: the Supabase magic-link redirect opens an external
  browser and will not auto-return to the app. For the APK, either complete profile
  setup in a desktop browser first, or ask for an OTP-code login path / Capacitor
  deep-link handler to be added. Most features (map, finance, news, AI) work without
  login because they read keys from `localStorage`.
- **Geolocation**: declared `ACCESS_FINE/COARSE_LOCATION`; the app falls back to default
  coords if permission is denied.
- **HarmonyOS**: the same web build can later be dropped into an ArkUI `<Web>` component;
  no separate native work needed for the page itself.

## Regenerating from scratch (if needed)
```bash
npm install
npx cap init "GoldenAge" "com.goldenage.app" --web-dir www
npx cap add android
npm run sync
```
