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

## Build

Tools: JDK 17 and the Android SDK, in `~/.bubblewrap` (`config.json` points Bubblewrap at them). Installed on the main computer 2026-11-16; Bubblewrap 1.24.1 needs `build-tools;36.1.0` and `platforms;android-36`, and the SDK root must hold `bin/` (a copy of `cmdline-tools/latest/bin` and `lib`). The Gradle project in `android/` is generated from `twa-manifest.json` and committed; `minSdkVersion` is 24 (Android 7), the least the browser helper library allows.

### First release: the signing key (owner, in your own terminal)

The key is made once, with passwords only the owner knows (PowerShell: the `&` runs a quoted path):

```sh
cd android
& "C:/Users/Asus/.bubblewrap/jdk/jdk-17.0.21+9/bin/keytool.exe" -genkeypair -v -keystore chillwaa-upload.keystore -alias chillwaa -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Chillwaa, O=Chillwaa, C=TH"
```

**Keep `android/chillwaa-upload.keystore` and its password** in a password manager and a backup, never in git or chat (`android/.gitignore` keeps it out). Google Play keeps the real app signing key (Play App Signing), so a lost upload key can be replaced through Play support, but it takes days.

### Every release

```sh
cd android
npx @bubblewrap/cli@1.24.1 build     # asks for the key password; makes app-release-signed.apk (phones) and app-release-bundle.aab (Play)
```

For a new store version: raise `appVersionCode` and `appVersionName` in `twa-manifest.json`, run `npx @bubblewrap/cli@1.24.1 update --skipVersionUpgrade --manifest=./twa-manifest.json`, then build. A test build without the key: `gradlew.bat assembleDebug` (with `JAVA_HOME` and `ANDROID_HOME` set to the folders above) makes `app/build/outputs/apk/debug/app-debug.apk`, signed with the computer's debug key, so it shows a URL bar.

## Connect the app to the site

1. Get the fingerprints:
   - the upload key: `keytool -list -v -keystore android/chillwaa-upload.keystore -alias chillwaa` → the `SHA256:` line. Made 2026-11-16: `30:9F:01:EA:70:E3:B4:2D:5C:8F:E0:55:C7:FF:CF:CF:CA:D2:43:31:FD:B7:67:B3:E5:18:D2:56:8B:49:3B:CA` (a fingerprint is public, not a secret)
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
