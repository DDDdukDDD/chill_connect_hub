# Android app (Trusted Web Activity)

The Android app is a thin shell that opens **www.chillwaa.com** full screen in Chrome (a Trusted Web Activity, TWA). The pages inside are the website, so every deploy reaches the app at once. A new store version is needed only when the shell changes: icon, name, colours, a new device permission, or the version number Play asks for.

Owner decision 2026-11-16: wrap the website, do not write a separate app. iPhone will follow with Capacitor (docs/LAUNCH_CHECKLIST.md "แอปในสโตร์").

## What is in the repo

| File | What it does |
| :--- | :--- |
| `android/twa-manifest.json` | The shell's settings for [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap): package id, host, name, colours, icons (read from the live site), notifications on |
| `android/.gitignore` | Keeps the signing key and build output out of git |
| `app/.well-known/assetlinks.json/route.ts` | Digital Asset Links: proves the app belongs to the site. Reads `ANDROID_CERT_SHA256` and `ANDROID_PACKAGE_ID` from the environment. Empty list until they are set |
| `app/manifest.ts` | The web manifest the shell's icons and colours come from |

**The package id `com.chillwaa.app` can never change once the app is on Google Play.**

## Build (one time setup, then per release)

Needs Node, plus JDK 17 and the Android SDK. Bubblewrap offers to download both the first time (about 1 GB, kept in `~/.bubblewrap`).

```sh
npm i -g @bubblewrap/cli
cd android
bubblewrap init --manifest https://www.chillwaa.com/manifest.webmanifest   # first time only: answer from twa-manifest.json, creates the Gradle project and the upload key
bubblewrap build                                                           # makes app-release-signed.apk (to try on a phone) and app-release-bundle.aab (for Play)
```

Later releases: raise `appVersionCode` (and `appVersionName`) in `twa-manifest.json`, then `bubblewrap update` and `bubblewrap build`.

### The signing key

`bubblewrap init` creates `android/chillwaa-upload.keystore` with two passwords. **The owner keeps the file and both passwords** in a password manager, never in git or chat. Google Play keeps the real app signing key (Play App Signing), so a lost upload key can be replaced through Play support, but it takes days.

## Connect the app to the site

1. Get the fingerprints:
   - the upload key: `keytool -list -v -keystore android/chillwaa-upload.keystore -alias chillwaa` → the `SHA256:` line
   - after the first upload to Play: Play Console → the app → Test and release → App integrity → App signing key certificate → SHA-256
2. On Vercel (Production): `ANDROID_CERT_SHA256` = both fingerprints, comma separated. Redeploy.
3. Check: `https://www.chillwaa.com/.well-known/assetlinks.json` lists them. Then open the app: no URL bar at the top means the link works.

## Google Play

- Developer account: $25 once. **A new personal account must run a closed test with at least 12 testers for 14 days in a row before it can publish to everyone.** An organisation account (needs a D-U-N-S number) skips this. To be live on 1 January 2027, the closed test should start by mid December.
- Store listing needs: the 512 px icon, a 1024×500 feature graphic, at least 2 phone screenshots, a short and a full description (Thai), the privacy policy URL (`/privacy`), the content rating form, and the data safety form (account, photos, location for challenge evidence, messages).

## Try on a real phone

- [ ] Install `app-release-signed.apk`; the first screen opens with no URL bar
- [ ] Sign in with email, Google, Facebook and LINE: each must come back into the app, not stay in Chrome
- [ ] Turn on notifications; a friend follows you; the notice shows under the app's name and opens the right page
- [ ] Post a moment with a photo and a clip from the gallery and from the camera
- [ ] A link to www.chillwaa.com sent in LINE opens in the app
