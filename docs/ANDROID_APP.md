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

Tools: JDK 17 and the Android SDK, in `~/.bubblewrap` (`config.json` points Bubblewrap at them). Bubblewrap 1.24.1 needs `build-tools;36.1.0` and `platforms;android-36`, and the SDK root must hold `bin/` (a copy of `cmdline-tools/latest/bin` and `lib`). The Gradle project in `android/` is generated from `twa-manifest.json` and committed; `minSdkVersion` is 24 (Android 7), the least the browser helper library allows.

**Where releases are built (since 2026-11-27): the office notebook,** in `C:\dev\chillwaa-android`, a copy of `android/` outside OneDrive so the key is not synced to the company cloud. Copy changed files from `android/` there before a build and copy generated changes back. Setup notes from that machine:
- `config.json` `jdkPath` must have **no spaces**: Bubblewrap runs `apksigner` through `cmd` unquoted, so `C:\Program Files\...` fails. Use the 8.3 short path (`C:\PROGRA~1\MICROS~1\JDK-17~1.101`) and set `JAVA_HOME` to the same.
- The command-line tools 23+ replaced `sdkmanager` with `android sdk install build-tools/36.1.0 platforms/android-36`.
- In PowerShell with script signing enforced, run `npx.cmd`, not `npx`.
- `twa-manifest.json` must keep LF line endings (`.gitattributes`); with CRLF the checksum differs and Bubblewrap offers to regenerate the project. Answer **No** if it asks.

### The signing key (owner, in your own terminal)

The upload key was made 2026-11-27 on the office notebook, before the first Play upload, with a password only the owner knows. It replaced the 2026-11-16 key on the main computer, which was never uploaded and is no longer used:

```sh
cd C:\dev\chillwaa-android
& "C:\Program Files\Microsoft\jdk-17.0.4.101-hotspot\bin\keytool.exe" -genkeypair -v -keystore chillwaa-upload.keystore -alias chillwaa -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Chillwaa, O=Chillwaa, C=TH"
```

**Keep `chillwaa-upload.keystore` and its password** in a password manager and a personal backup, never in git, chat or a screenshot (a failed `apksigner` step prints the password in the error). Google Play keeps the real app signing key (Play App Signing), so a lost upload key can be replaced through Play support, but it takes days. To build on another computer, copy the keystore there as `android/chillwaa-upload.keystore`.

### Every release

```sh
cd C:\dev\chillwaa-android
$env:JAVA_HOME = 'C:\PROGRA~1\MICROS~1\JDK-17~1.101'
npx.cmd @bubblewrap/cli@1.24.1 build     # asks for the key password twice (same password); makes app-release-signed.apk (phones) and app-release-bundle.aab (Play)
```

For a new store version: raise `appVersionCode` and `appVersionName` in `twa-manifest.json`, run `npx @bubblewrap/cli@1.24.1 update --skipVersionUpgrade --manifest=./twa-manifest.json`, then build. A test build without the key: `gradlew.bat assembleDebug` (with `JAVA_HOME` and `ANDROID_HOME` set to the folders above) makes `app/build/outputs/apk/debug/app-debug.apk`, signed with the computer's debug key, so it shows a URL bar.

## Connect the app to the site

1. Get the fingerprints:
   - the upload key: `apksigner verify --print-certs app-release-signed.apk` (no password needed) → the SHA-256 line. Made 2026-11-27: `B7:66:27:B3:A2:78:77:D4:FB:D3:D6:89:65:E0:EA:8C:BC:20:27:D0:6A:28:DD:1A:39:CF:5A:0F:E4:81:E5:D4` (a fingerprint is public, not a secret; the 2026-11-16 key `30:9F:…:3B:CA` is retired)
   - after the first upload to Play: Play Console → the app → Test and release → App integrity → App signing key certificate → SHA-256
2. On Vercel (Production): `ANDROID_CERT_SHA256` = both fingerprints, comma separated. Redeploy.
3. Check: `https://www.chillwaa.com/.well-known/assetlinks.json` lists them. Then open the app: no URL bar at the top means the link works.

## Google Play

- Developer account: personal, identity verified 2026-11-27. **A new personal account must run a closed test with at least 12 testers for 14 days in a row before it can publish to everyone.** Target: closed test starts by 4 December, production request around 18 December. The steps in order are in docs/LAUNCH_CHECKLIST.md ("Android", A to G).
- Store listing, content rating, data safety, target audience and the closed test: answers and assets in [PLAY_STORE_LISTING.md](PLAY_STORE_LISTING.md). Privacy policy URL: `https://www.chillwaa.com/legal?tab=privacy`; delete account URL: `https://www.chillwaa.com/legal?tab=privacy#my-data`.

## Try on a real phone

- [ ] Install `app-release-signed.apk`; the first screen opens with no URL bar
- [ ] Sign in with email, Google, Facebook and LINE: each must come back into the app, not stay in Chrome
- [ ] Turn on notifications; a friend follows you; the notice shows under the app's name and opens the right page
- [ ] Post a moment with a photo and a clip from the gallery and from the camera
- [ ] A link to www.chillwaa.com sent in LINE opens in the app
