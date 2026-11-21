# Google Play listing (Android)

Draft for Play Console → Chillwaa, 2026-11-21. Everything Play asks before the first release, in the order the
Console's "Set up your app" list shows it. Text is shared with [APP_STORE_LISTING.md](APP_STORE_LISTING.md) where the
stores ask the same thing; keep the two in step. Character counts were checked with a script (Thai vowel and tone
marks count as characters). Building and signing the app is in [ANDROID_APP.md](ANDROID_APP.md).

## Create the app

- App name: `Chillwaa` · Default language: **Thai – th-TH** · App or game: **App** · Free or paid: **Free** (cannot
  change to paid later).
- Developer name on the store (from the account): the owner's name or company, the same as the App Store copyright.

## Store listing (Grow users → Store presence → Main store listing)

**App name** (30): `Chillwaa`

**Short description** (80; 73 used; owner 2026-11-21):
```
โซเชียลแพลตฟอร์มสำหรับคนชอบออกไปใช้ชีวิต ที่ทำให้ทุกการใช้ชีวิตมีความหมาย
```

**Full description** (4,000): the App Store description in [APP_STORE_LISTING.md](APP_STORE_LISTING.md), as it is.
Play does not allow emoji runs, "อันดับ 1"/"ดีที่สุด" claims, or other apps' names in the text; the draft has none.

**Graphics**

| Asset | Size | File |
| :--- | :--- | :--- |
| App icon | 512 × 512 PNG, square (Play rounds the corners) | `android/store_icon.png` |
| Feature graphic | 1024 × 500 PNG | `android/store/feature-graphic.png` |
| Phone screenshots | 2 to 8, 9:16, e.g. 1080 × 1920 | not made yet, see below |

The feature graphic is made from `android/store/feature-graphic.html`: the brand on the left over a soft peach background (owner 2026-11-21: softer than full orange), and on the right
the three scenes of `public/hero-bg-lifestyle.jpg` (AI-generated for Chillwaa, owner 2026-11-21: cafe, run, board game night) as fanned moment cards with bits of the
app's own UI (+50 XP, likes, "เข้าร่วมตี้แล้ว 6/8"). The cafe card starts below the shop sign because the sign shows a
real brand. The name is the site's wordmark ("Chill···Waa", `components/BrandWordmark.tsx`) in Plus Jakarta Sans,
loaded from Google Fonts, so making the PNG needs internet (check the name is not drawn in a wider fallback font);
the icon sits centred in a soft white halo above the name (owner 2026-11-21); the Thai text is IBM Plex Sans Thai from `assets/fonts`. After
changing it, from the repo root in PowerShell:

```sh
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --force-device-scale-factor=1 --virtual-time-budget=10000 --window-size=1024,500 "--screenshot=$PWD\android\store\feature-graphic.png" "$PWD\android\store\feature-graphic.html"
```

**Screenshots:** the same six scenes and captions as the App Store list, at 1080 × 1920, from live once its content
is real (no "[ตัวอย่าง]" data) and with a member that has a full profile. Tablet screenshots are optional; without
them the app still installs on tablets, Play just does not feature it there.

**Category and contact** (Store settings): category **Social**, tags up to 5 from Play's list (e.g. Social
networking, Events, Travel & local). Email: `hello@chillwaa.com` (shown publicly; needs the @chillwaa.com mail
working first, docs/EMAIL.md step 1). Website: `https://www.chillwaa.com`.

## App content (Policy and programs → App content)

**Privacy policy:** `https://www.chillwaa.com/legal?tab=privacy`

**App access:** "All or some functionality is restricted". Give the same demo account as for App Review (email
account on live, finished onboarding, in a ตี้ and a challenge, kept out of campaigns) with the instruction:
`Open the app > เข้าสู่ระบบ > อีเมล > enter the email and password.`

**Ads:** No. There is no ad SDK and the site shows no ads.

**Content rating** (IARC questionnaire): category **Social Networking, Forums, Blogs and User-Generated Content**.
- Users can interact or exchange content: **Yes** (posts, comments, group chat). Moderation: report and block on every
  post, comment, profile and chat message; staff review queue.
- Shares the user's current location with other users: **No** (ตี้ meet at public places; a member's own position is
  never shown).
- Digital purchases: **No**. Unrestricted internet access: **No** (the app opens only www.chillwaa.com).
- Alcohol, tobacco or drugs: references only (the bar and nightlife category), no use shown or encouraged.
- Gambling: **No** (campaign prize draws are free to enter and pay out no money; revisit if that changes,
  docs/LEGAL_DRAFT.md ข้อ 7).
- Violence, sexual content, crude language, fear: **No**.

**Target audience:** **18 and over** only (the terms require 18+). The app is not designed for children, so the
Families policy does not apply. Answer "No" to "Could your store listing unintentionally appeal to children?".

**News app:** No · **Government app:** No · **Financial features:** none · **Health:** none.

**Advertising ID:** "No, my app does not use advertising ID". The TWA shell does not declare
`com.google.android.gms.permission.AD_ID`; if a library added later does, change this answer.

### Data safety

General answers:
- Does the app collect or share user data? **Yes, collects.** Shared with third parties: **No** (database, file
  storage, e-mail and push services work on our behalf, which Play counts as service providers, not sharing).
- Encrypted in transit: **Yes** (HTTPS only).
- Users can request deletion: **Yes**. Delete account URL:
  `https://www.chillwaa.com/legal?tab=privacy#my-data` (signed in: a button; signed out: the e-mail to privacy@,
  BE-445). In the app: profile menu › ตั้งค่าบัญชี › ลบบัญชี.

Data types (Google's names). "Required" means a member cannot use the app without it; "optional" means they choose.
Nothing is used for advertising or sold.

| Category → type | Collected | Required? | Purposes |
| :--- | :--- | :--- | :--- |
| Personal info → Name | Yes (display name) | Required | App functionality, Account management |
| Personal info → Email address | Yes | Required | Account management, App functionality |
| Personal info → User IDs | Yes (member id; LINE/Google/Apple/Facebook id when used) | Required | Account management |
| Personal info → Phone number | Yes, only when a host verifies a phone | Optional | Fraud prevention, security and compliance |
| Personal info → Other info | Yes (year of birth, gender, province, bio, job, area) | Optional | Personalization, App functionality |
| Location → Precise location | Yes, **processed ephemerally** (only the distance to the place is kept) | Optional | App functionality, Fraud prevention (proof of being at a place for a moment or challenge) |
| Messages → Other in-app messages | Yes (group chat, ตี้ questions) | Optional | App functionality |
| Photos and videos → Photos, Videos | Yes (moments, avatars, clips) | Optional | App functionality |
| App activity → App interactions | Yes (joins, saves, follows, Circle opens, where a join came from) | Required | App functionality, Analytics, Personalization |
| App activity → Other user-generated content | Yes (captions, comments, reviews, reports) | Optional | App functionality |
| Device or other IDs | Yes (the push notification address, when notifications are on) | Optional | App functionality |
| Financial info, Health and fitness, Contacts, Calendar, Web browsing, Files and docs, Audio (beyond a clip's own sound), App info and performance | No | – | – |

Check before submitting:
- If a crash, analytics or ad tool is added later, update this table and the App Store one.
- Database backups: the provider keeps point-in-time history for a short time after a deletion. Play does not ask
  for this, but the privacy policy should say how long once the owner knows the plan's retention.

## Testing before production

A new **personal** developer account must run a **closed test with at least 12 testers who stay opted in for 14 days
in a row** before Production unlocks; an organisation account (D-U-N-S) skips it. For a 1 January 2027 launch the
closed test must start by about 15 December (14 days, plus review time for the test and for production).

1. Internal testing first (up to 100 people, no review wait): upload the `.aab`, add the owner's own Gmail, install
   from the opt-in link, run the "Try on a real phone" list in ANDROID_APP.md.
2. Closed testing: make a Google Group (e.g. `chillwaa-testers@googlegroups.com`) and add the group as the tester
   list, so testers can join without a new upload. Aim for 15 or more people, since some forget to stay opted in.
   Testers must open the app now and then; Play looks at engagement when it decides on production access.
3. After 14 days: Dashboard → "Apply for production", answer the questions about the test, then send the production
   release for review.

## Still missing before the first upload

- [ ] Signed `.aab` with the new icon, built on the main computer (the upload key lives there): ANDROID_APP.md "Every release"
- [ ] Phone screenshots (Claude can capture them once live content is real)
- [ ] Demo account on live
- [ ] @chillwaa.com mail working (contact email, privacy@ for deletion requests)
- [ ] App signing key SHA-256 from Play added to `ANDROID_CERT_SHA256` after the first upload (ANDROID_APP.md)
