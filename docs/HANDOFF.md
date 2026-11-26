# Handoff Board

The change log for the Claude Code clones working on this repo (see "Who Works Where" in [AGENTS.md](../AGENTS.md)). Test reports from Antigravity go in [TEST_REPORTS.md](TEST_REPORTS.md).

- **Read this file at the start of every session.**
- **Add an item** when you changed something another session must know: behaviour, a rule, a migration, a shared utility.
- **Keep it short.** What is left to do goes in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md), API shapes in [API.md](API.md), not here.
- **IDs:** `BE-###`, increasing. Check the highest number on `origin/claude` first, so the clones do not reuse one.
- **When this file passes about 300 lines,** move the older items to `docs/archive/`.

Older items are archived: BE-420 to BE-459 in [archive/handoff-2026-11-18-to-2026-11-23.md](archive/handoff-2026-11-18-to-2026-11-23.md); BE-235 to BE-419 in [archive/handoff-2026-11-03-to-2026-11-18.md](archive/handoff-2026-11-03-to-2026-11-18.md); up to BE-234, including every `FE-###`, in [archive/handoff-until-2026-11-03.md](archive/handoff-until-2026-11-03.md). Code comments that cite `docs/HANDOFF.md BE-###` with a lower number mean those files.

Item template:

```md
### BE-000 · Short title (owner 2026-10-03)
- **What changed:** ...
- **What to do about it:** ... (leave out if nothing)
```

---

### BE-484 · Trip stories: trips told as full-screen chapters, during the trip and after (owner 2026-11-26)
- **What changed:** New feature, plan in [TRIPS_PLAN.md](TRIPS_PLAN.md), API in [API.md](API.md) "Trips". Migration `0069_trips.sql` (`app.trips`, `app.trip_items`, `app.geo_places`).
  - Pages: `/trips/new`, `/trips/[id]/edit`, `/trips/[id]` (server HTML + `TouristTrip` JSON-LD, noindex unless published and public). Player `components/trips/TripPlayer.tsx`: cover, route, day chapters, photos and clips, and an end screen of every moment as small pictures (owner).
  - Photos picked in the editor: time and GPS read from EXIF in the browser (`lib/media/exif.ts`) before the photo is made small. City names come from Nominatim, rounded to about 1 km (`lib/trips/geo.ts`).
  - During a trip the moment composer shows "เพิ่มเข้าทริป" (on by default). The post sends `trip: { id, takenLocal, lat?, lng? }`.
  - Sub-trips by city (owner 2026-11-26): `legs` on the trip (city, from, to). Photos join a sub-trip by the day they were taken, with or without GPS. Each sub-trip opens with its own frame in the player and has its own link, `?leg=`.
  - Entry points: My Hub "ทริปของฉัน" starts trips and lists the one going on, the next one and drafts (owner). The profile tab "ทริป" shows told trips only, and the feed row "เรื่องเล่าทริปจากเพื่อนๆ" comes after the sixth post (`TRIPS_SLOT`). The ＋ menu is unchanged.
  - Shared files: `/api/upload` folder `trips` gets 320 an hour per member, and `lib/media/cleanup.ts` counts `trips` as a member folder.
- **Checked:** On dev with a sample member: create, upload 6 EXIF photos, Guangzhou → Shenzhen → Hong Kong named in Thai, three sub-trips set (overlap refused), cover, publish, read signed out, a moment posted into the trip. Screenshots taken at 390 px of the page, the player (route, sub-trip and day frames), the editor and My Hub. Test trip and moment deleted afterwards.
- **What to do about it:** Owner travels 4–13 Dec, so merge and run 0069 on live before then (see LAUNCH_CHECKLIST). Do not change the trip day logic without reading `lib/trips/story.ts`.

### BE-483 · Home modes keep their place, ＋ creates what the page lists, มายฮับ in the top bar (owner 2026-11-26)
- **What changed:**
  - Home's modes are สำหรับคุณ · โมเมนต์ · ติดตาม (ค้นพบ renamed; the view id stays `discover`). Each mode keeps its list and its place while switching: back on a mode, the post that was at the top of the screen is there again at the same height, with no new fetch (`pickMode` in `HomeMomentFeed`; หน้าหลัก tapped again still refreshes). The โมเมนต์ grid stays mounted, hidden, once opened.
  - The phone bar's ＋ creates what the list page shows (`CREATE_ON` in `components/MobileNav.tsx`): `/this-week` the chooser, `/community` ตี้, `/events` อีเวนต์ (the chooser for members who may not add one), `/spots` แนะนำสถานที่, `/challenges` ชาเลนจ์. On `/myhub` it lists the activities that ended (gone to or run, newest first, 8) to post a moment from, or another moment (`compose` prop, `MomentFromEndedDialog`). Detail pages and the rest still post a moment.
  - The computer top bar has มายฮับ for members, in โมเมนต์'s place (it stays in the profile menu too).
- **Checked in a browser** (headless Edge, phone and 1440 px, no-database mode, a new test member): back on สำหรับคุณ the same post sat at the same height, the grid at the same scroll; ＋ opened the right form on each list page, the picker on My Hub, the moment form on a place page; the top bar shows มายฮับ. Not tried: the picker with real ended activities, and posting itself (the test member had no confirmed email).

### BE-482 · Challenge ideas, and challenges for me, a friend group or everyone (owner 2026-11-26)
- **What changed:** the challenge form opens with a row of ideas (`data/challengeIdeas.ts`, 8 ideas, like the ตี้ ideas) that fill title, category, goal, steps, count, badge and dates. Step 3 asks who sees it: ส่วนตัว (only me), กลุ่มเพื่อน (anyone with the link), สาธารณะ (everyone, staff review as before). Only me and a friend group start at once: `visibility: 'private'` + `audience` in `details` (no migration), random id `my-…`, no XP, counted by posts made from the challenge page, maker joined, out of lists, search, sitemap and others' Circles, page `noindex`. Only the maker may join a `me` one. Ten private ones at a time. Details in `docs/API.md` (`POST /api/quests`).
- **Not walked in a browser yet** (the form needs a signed-in member); the server path was tested on dev for all three choices.

### BE-481 · Big lists shared through R2 instead of the database (owner 2026-11-26, egress)
- **What changed:** the full place list (`select * from app.places`, the biggest egress), the public place list, events and challenges are read from the database once per change and kept as one gzip file per list on R2 (`lib/db/postgres/sharedSnapshot.ts`). Other servers read that file (R2 downloads are free). The file name is a keyed hash of `AUTH_SECRET`, as the bucket is public and the full list holds drafts. Measured on dev: place list 3.1 MB JSON → 0.71 MB gzip; a fresh server read it in 1.3 s instead of 3.5 s. Without R2 the old Next data cache is used. `r2Fetch` now passes the timeout signal on.
- **What to do about it:** after deploy, compare Supabase > Usage > Egress over a few days. A local `npm run dev` keeps its database adapter across reloads (`globalThis`), so restart it to use this.

### BE-480 · Prize draws removed, launch campaign rewritten, 35 challenge covers (owner 2026-11-26)
- **What changed:** owner chose to remove every "ลุ้น" text (guaranteed rewards only since 2026-11-23). Gone: the staff draw page and API, `/campaigns/results`, claim, draw rewards (`drawEntry`, multi-entry), the iPhone and flight samples and their pictures, the winner email and notices (old notices read "ข่าวจากแคมเปญ"). Campaign and reward saves refuse ลุ้น, จับรางวัล, ชิงรางวัล, ผู้โชคดี. Campaign screens say แลกรางวัล. A campaign reward now always needs a confirmed identity and finished steps. On Postgres an empty campaign table no longer shows the seed.
- **Launch campaign:** `launch-2569` no longer points at ended challenges: steps ลงชื่อเข้าร่วมตี้แรก, แชร์โมเมนต์ 3 ที่เที่ยว, ไปงานอีเวนต์ 2 งานในเดือนธันวาคม (found by `coverSlug`), no reward linked, ends 2026-12-31. Its published switch is kept (off on live).
- **Covers:** Gemini's 35 WebP covers (`public/images/challenges/`, merged from `origin/tester`, reviewed) are set by `db/apply-challenge-covers.mjs`.
- **Done on dev.** **Live (owner, in this order):** `node db/apply-challenge-covers.mjs --apply`, `node db/apply-launch-campaign.mjs --apply`, `node db/remove-prize-draws.mjs --apply` (each lists first without `--apply`; the last writes a backup to `data/.backups/`).

---

### BE-479 · Source run history and auto-publish kept in the database (owner 2026-11-26)
- **What changed:** the admin source list (on/off, last run, run history) is stored in `app.app_settings` key `data_sources` instead of `chill_database.json` (`lib/sourcesStore.ts`). Writes use a locked transaction, so parallel scrape results never drop each other. The first read starts from the bundled JSON copy.
- **Why:** on Vercel the JSON store is per server, so after a scan on live every card still said "ยังไม่เคยสแกน" and ประวัติ was empty (owner pressed สแกน on BACC and River City). The imported events themselves already went to Postgres.
- **Auto-publish too:** the อีเวนต์ "เผยแพร่อัตโนมัติ" switch is stored in `app.app_settings` key `events_auto_publish` (`{enabled}`, `lib/eventsStore.ts`); until staff first set it, the bundled JSON value counts (`false`).

---

### BE-478 · Art events from BACC and River City; Gen Z/Y tags on places (owner 2026-11-26)
- **What changed:**
  - Two new event sources, built in (`DEFAULT_DATA_SOURCES`, active, so live picks them up on its own after deploy and the weekly cron reads them): `lib/scrapers/bacc.ts` (BACC: newest pages from `event-sitemap*.xml`, dates in the "เมื่อไร" box, kind such as "Main Exhibition" put first in the description for staff, 30 s wait as the site is slow) and `lib/scrapers/riverCity.ts` (River City Bangkok: "Current Listings" on `/category/exhibitions/`, English date lines). robots.txt of both allows these pages (checked 2026-11-26). New items wait in the review queue. On dev: BACC 17, River City 4 pending; some are not for visitors (an open call), reject them in the queue.
  - Eventpop stays off: its terms forbid copying or commercial use of the content without permission (2026-11-26), so it needs their OK first; the source text in admin says so.
  - `lib/spotAudienceTags.ts`: เที่ยวกลางคืน (bar, or open to 23:00 or later, or night-market words), ถ่ายรูปสวย, ไปกันเป็นแก๊ง, ไม่เสียค่าเข้า, worked out from category, hours, fee and text, not stored. A place card's `#tag` shows staff's tag, else the first of these (import markers such as "นำเข้าจากเว็บไซต์" no longer show); search (`spotSearchText`) reads them. On dev's 2,915 published places, 277 get none. Ranking was already tilted to young people's vibes (`spotCuration` VIBE_FIT), unchanged.
- **What to do about it:** after deploy, admin > การดึงข้อมูล shows the two sources; run them once or wait for Monday's cron, then review. Ask Eventpop for a feed if wanted.

---

### BE-477 · TAT restaurants open on dev, members hide closed places, "publish all filtered" in admin (owner 2026-11-26)
- **What changed:**
  - Owner: staff cannot check 452 TAT restaurants one by one; open the ones that look alive and let members report closures. On dev, 135 TAT restaurants/cafés/bars with real opening hours (not "ไม่ระบุ"), a picture and a description were published (backup `data/.tat-cache/food-publish-before-2026-11-26.json`), and `recomputeCuration` ran (33 of them came out `hidden` by score).
  - "ที่นี่ปิดแล้ว?" on a place page (contact box): two taps send `POST /api/reports` with reason `place_closed`. When `PLACE_CLOSED_HIDE_AT` (2) different members, each at least `NEW_ACCOUNT_DAYS` (7) old, have an open report, the place goes back to draft with `closedReportedAt` and the report tells staff (`lib/social/placeClosedReports.ts`). The answer carries `placeHidden`. CDN pages drop it within 10 minutes (revalidate).
  - Admin พิกัดเที่ยว: with the status filter on แบบร่าง, "เผยแพร่ทั้งหมดที่กรองไว้ (N แห่ง)" publishes every draft the filters match on every page (`set_publication` with `filters`; one `filterSpots` for the list and the bulk change).
  - The promote step to live already existed: `node db/copy-places-to-live.mjs` (dry run, then `--apply`), and the photo job (GitHub Actions, every 3 hours) copies `dmc.tatdataapi.io` pictures to R2.
  - HANDOFF BE-420..459 moved to `docs/archive/handoff-2026-11-18-to-2026-11-23.md`.
- **What to do about it:** owner looks at the 135 on dev, then runs the copy script (it reads ~8 MB of live egress). Not built: XP for a confirmed closure, a staff "still open" button in the report (staff publish the place again by hand).

---

### BE-476 · Home feed redesign for phones: full-width photos, ＋ in the bottom bar, three modes (owner 2026-11-26)
- **What changed:** compared with Instagram on an iPhone, the owner asked for a cleaner feed.
  - Photos run the full screen width on phones (`MomentPhotos` `bleed`); the reaction icons are 28 px with a firmer line (`ActionIcons` stroke 3.5, also on `/moments/[id]`); post text is 15 px; "… ดูเพิ่มเติม" sits at the end of the second caption line.
  - Members' phone/iPad bar (below xl) is `หน้าหลัก | กิจกรรม | ＋ | ชาเลนจ์ | มายฮับ`. ＋ opens the posting form on Home (`COMPOSE_EVENT` in `lib/homeAgain.ts`) and opens the same form over any other page (`QuickCompose`, owner option C like IG): closing it stays on that page; "โพสต์" goes to Home in สำหรับคุณ, and the post joins the top of the feed when the upload is done (`announcePosted`/`takePosted` in `lib/homeAgain.ts`, `onSubmitted` on `MomentComposer`). Visitors keep `หน้าหลัก · กิจกรรม · โมเมนต์ · ชาเลนจ์` until the landing is decided (BE-475 left open by the owner).
  - The "วันนี้ไปไหนมา?" row shows only from xl (no bottom bar there). On a member's Home below xl the top bar slides up while scrolling down and comes back on the first move up (`Navbar`); a strip of its glass stays behind the phone status bar, and the mode tabs stick at the top (in the bar's place while it is away, `html[data-header-tucked]`). Picking a mode far down scrolls back to the tabs. The bottom bar is about 12% smaller (＋ 40 px).
  - Home has three modes: สำหรับคุณ · ค้นพบ · ติดตาม. ค้นพบ is the `/moments` grid (`HomeDiscoverGrid`, `GET /api/moments?tab=mix`); ล่าสุด is gone; ของฉัน is the profile's โมเมนต์ tab; saved posts are a new "บันทึกไว้" tab on one's own profile. The last mode is remembered on the device (`localStorage` `chillwaa:home-mode`).
  - The computer top bar has no โมเมนต์ for members. `/moments` stays public for visitors and search.
  - Fix: the empty band with two lines after the first post (the "ตี้แรกของคุณ" card with no open ตี้, seen live) no longer shows.
  - The Reel (a clip opened full screen) starts with the sound on; leaving it puts the sound back as it was, so feed clips stay silent (`enterReel`/`leaveReel` in `ClipPlayer`). If the browser refuses sound, the clip plays silent as before.
- **What to do about it:** no API or migration change. Check on a real iPhone: the top bar sliding under the status bar in the app, and whether Safari lets the Reel start with sound.

---

### BE-475 · Storytelling landing designed; Supabase was restricted on 25 Nov (owner 2026-11-25)
- **What changed:** the guest first-visit page is designed and agreed: mockup [mockups/story-landing.html](mockups/story-landing.html), decisions and copy rules at the top of [STORY_LANDING_PLAN.md](STORY_LANDING_PLAN.md). Owner wants it **before launch**, with the phone bottom bar hidden for every guest. Not built yet.
- **Supabase:** the grace period ended 22 Nov; on 25 Nov live was restricted (402) for a while, then lifted by the new billing cycle (egress back to ~0 of 5 GB). Owner chose to **stay on Free** and upgrade when egress passes 2.5 GB; [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) section 2 rewritten (the "3 Dec" date there was wrong).
- **What to do about it:** next session builds the page from the plan (answer the open points in the plan first). Owner checks Supabase > Usage daily after launch.

---

### BE-474 · Admin knowledge: services and settings (owner 2026-11-25)
- **What changed:** /admin "วิธีคิดของระบบ" has a new topic "บริการภายนอกและการตั้งค่า" (`services-config` in `components/admin/SystemLogicView.tsx`): Vercel Pro (budget $200 with pause, firewall rule order and log-only week, bot settings, cron times, analytics, CDN revalidate times, env var names), email (Cloudflare Email Routing, Resend, DNS names, `SKIP_EMAIL_VERIFICATION`), Supabase, R2 and GitHub secrets. Names only, never a secret value.
- **Rule from now on:** when a service setting changes (dashboard or code), update that topic in the same change.
- **Firewall 2026-11-25:** `Detail page guard` (detail pages, 120/min/IP, enforced) set by the owner, second in order after `Allow system paths`. `SKIP_EMAIL_VERIFICATION` was not found on Production (the code skips only when it equals `true`, `lib/members/safety.ts`), so email confirmation should already be on.
- **Open at end of 2026-11-25 (owner):** test sign-up on live with a mailbox you own (confirm email must arrive), then delete the test account; run 0068 on live, try the `claude` preview signed in, then merge (BE-466..474 not on main); Supabase Pro before 3 Dec; review firewall logs ~2 Dec. Note: the topic "สิทธิ์ลุ้นและการจับรางวัล" still describes prize draws, which the owner dropped on 2026-11-23; rewrite when the draw code is decided (checklist section 7).

---

### BE-473 · Vercel Web Analytics + Speed Insights (owner 2026-11-25)
- **What changed:** `@vercel/analytics` 2.0.1 and `@vercel/speed-insights` 2.1.0; `components/SiteAnalytics.tsx` in the root layout. `beforeSend` drops the query and hash (reset/confirm tokens, `?s=` share and profile ids), turns `/i/<code>` into `/i/[code]` and skips `/admin`. Both are cookieless; scripts and beacons are same-origin (`/_vercel/...`), so the CSP needs no change. Privacy text: `TermsPrivacyModal` sections 2 and 4, `docs/LEGAL_DRAFT.md` section 6 (question for the lawyer added). The detail pages stay `●` (checked with `next build`).
- **What to do about it:** owner turns both on in Vercel (project → Analytics → Enable; Speed Insights → Enable); until then the scripts get 404 and nothing is counted, which is harmless. Data starts after the merge into `main`. Check the event quota on the Pro plan.

---

### BE-472 · Public detail pages served from the CDN (owner 2026-11-25)
- **What changed:** `/spots/[id]`, `/events/[id]`, `/community/[id]` and `/challenges/[id]` were rendered on every request (`Cache-Control: private, no-store` on live), so every guest or bot visit read the database. A dynamic route without `generateStaticParams` is always dynamic in Next 16 (previous caching model; `cacheComponents` is off). Each page now exports `generateStaticParams() { return [] }` and `revalidate` (places 600 s, อีเวนต์ and challenges 300 s, ตี้ 60 s): built on the first visit, then served from the CDN. `lib/pageCache.ts` `refreshEventPage(id)` calls `revalidatePath` for the ตี้/อีเวนต์ page after a join and a host edit (`app/api/events/route.ts`), so seats show at once. `/moments/[id]` is unchanged (a deleted or hidden post must vanish at once).
- **Rule from now on:** these server pages render public data only. Never read cookies or the session in them or in what they call; anything about the viewer (joined, saved, own progress) loads in the browser, as today. A cookie read would turn the page dynamic again (build shows `ƒ` instead of `●`) or, worse, cache one person's data for everyone.
- **Checked:** `next build` on the dev database shows the four routes as `●`; `next start`: first request `x-nextjs-cache: MISS`, second `HIT`, `Cache-Control: s-maxage=<revalidate>, stale-while-revalidate`; one h1; unknown id 404. Not walked signed in (page code passes no member data, unchanged views).
- **What to do about it:** after merge, check live with `curl -sI https://www.chillwaa.com/spots/<id>` twice: the second shows `X-Vercel-Cache: HIT`. Watch Supabase egress the following days. Edits by staff appear after the revalidate time, not at once.

---

### BE-471 · Timed jobs on Vercel Cron, not GitHub Actions (owner 2026-11-25)
- **What changed:** the team is on Vercel Pro, which allows crons at any interval. `vercel.json` now calls `/api/cron/hourly` every hour at :07 and `/api/cron/weekly` Sunday 20:17 UTC (Monday 03:17 Bangkok), the same times as before. The schedules in `.github/workflows/hourly-jobs.yml` and `weekly-jobs.yml` are removed (GitHub ran them late or skipped them); both workflows stay for a run by hand. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` from the Production env, which the routes already check. The firewall rule "Allow system paths" (set 2026-11-25, log-only rate limits for week 1) bypasses `/api/cron` and `/.well-known/`.
- **What to do about it:** Vercel Cron runs only on the Production deployment, so it starts when `claude` is merged into `main` (the old schedules stop at the same merge). Afterwards check Vercel > Settings > Cron Jobs shows two jobs and Logs show `/api/cron/hourly` 200 each hour.

---

### BE-470 · Popular TAT restaurants and cafés in the dev database; storytelling first-visit plan (owner 2026-11-25)
- **What changed:**
  - `db/import-tat-attractions.ts --food [--top=N]` + `tatFoodCategory` in `lib/scrapers/tatDataApi.ts`: TAT category 8, the 800 most viewed plus those with text and a picture in the list. On dev: 453 new drafts (436 restaurants, 14 cafés, 2 bars, 1 market), 712 calls. Food matches are left alone (both fills in the first run were wrong and were put back from the backup). Details and numbers in [TAT_IMPORT.md](TAT_IMPORT.md) "Restaurants and cafés run".
  - [STORY_LANDING_PLAN.md](STORY_LANDING_PLAN.md): the owner's storytelling first-visit idea merged with Gemini's spec and Claude's notes; [PRODUCT_DIRECTION.md](PRODUCT_DIRECTION.md) "Our own core: going out for real".
- **What to do about it:** staff approve the food drafts on dev (check the place still runs); nothing reaches live. The landing plan waits for the owner's answers at the end of the file. `npm run smoke` on dev: 26 passed, 1 failed ("five starter challenges exist": 2 found). After BE-377 and the 2027 challenge set, the check no longer matches the data; decide whether starters should be re-seeded or the check changed.

---

### BE-469 · BE-468 walked end to end; the email link brings a ตี้ host back to the form (owner 2026-11-24)
- **What changed:** walked BE-468 on dev at 390 and 1440 px with a LINE account without an email: creation gate → add email → link → verified → ตี้ form opens. API answers checked (401, 400 bad/throwaway, 409 taken, 429 after 5 an hour), and an unproven email is released when its real owner signs up (the old link then fails). Two fixes: `OrganizerGateDialog` takes `returnTo`, and `CreateEventModal` passes `/community?create=1` for a ตี้, so the verified page's button "กลับไปตั้งตี้ต่อ" reopens the form; the verified page says "ตอนนี้คุณตั้งตี้ เข้าร่วมตี้ และโพสต์โมเมนต์ได้แล้ว" only when `organizerNeeds` is empty after confirming.
- **What to do about it:** nothing in code. The real email still needs Resend on live (EMAIL.md). Testing note: a local server asks for a phone, not an email (`phoneCheckIsOn` is on without `VERCEL`), and `VERCEL=1 next dev` reloads every page about every 2 s, so the walk used a temporary local edit of `phoneCheckIsOn` (not committed).

---

### BE-468 · LINE members add an email to open ตี้; no SMS for launch (owner 2026-11-24)
- **What changed:** the owner chose email instead of SMS for launch (SMS costs money; launch moved to Thu 26 Nov). The live site already asked for a confirmed email to open ตี้, challenges, trips and groups (`organizerNeeds`), but a LINE account has no email and had no way to add one. Now `POST /api/auth/member/email` (`addEmail` in `lib/members/accounts.ts`) puts an email on an account without a password and mails the link; `AddEmailForm` shows in the creation gate (`OrganizerGateDialog`), under "ชวนเพื่อนไปที่นี่" (`needsEmail` from `/api/spots/[id]/trips`) and on the settings trust card. Safety: an added, unconfirmed email is an "unproven claim". A Google/Apple sign-in or an email sign-up with that address takes it off the account (`releaseEmail`) instead of signing in to it, so nobody can catch someone else's login by typing their address. `SKIP_EMAIL_VERIFICATION` no longer confirms an added email, a first password needs a confirmed email, and a confirmation link on an account with no email left fails.
- **What to do about it:** this needs the mailer on live (Resend, `RESEND_API_KEY` + `MAIL_FROM`); without it the endpoint answers 503. Owner steps: [EMAIL.md](EMAIL.md) steps 1–4. Not yet tested end to end on dev.

---

### BE-467 · Place photo copying moved off Vercel to GitHub Actions (owner 2026-11-24)
- **What changed:** Vercel's free Fluid Active CPU (4 h a month) reached 75%; the owner upgraded to Pro. Turning place photos into webp is CPU work, so `placePhotos` left the hourly cron and runs as `.github/workflows/place-photos.yml` (every 3 hours + Run workflow): `scripts/place-photos.ts` calls `copyPlacePhotos({ places: 300, photos: 600, timeBudgetMs: 8 min })`, still one transaction a run. Tested on dev (3 places, 3 copied).
- **What to do about it:** owner adds repository secrets (GitHub > Settings > Secrets and variables > Actions): `PLACES_DATABASE_URL` (= Vercel Production `DATABASE_URL`), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` (= Vercel Production values). Without them the job skips. After merge to `main`, press Run workflow on "Place photos" once.

---

### BE-466 · อีเวนต์ sign-ups: open, closed or not known (owner 2026-11-24)
- **What changed:** a closed อีเวนต์ (`registrationOpen: false`) has no สมัครวิ่ง/ซื้อบัตร button in its header and says "ปิดรับสมัครแล้ว" under the title (the official site stays in the organiser box). The admin event editor has "การรับสมัคร / ขายบัตร" (ไม่ทราบ / เปิดรับอยู่ / ปิดรับแล้ว) for อีเวนต์. Migration 0068 lets `app.events.registration_open` be null (= not known) and clears the default `true` on อีเวนต์ not from ThaiRun: before, every อีเวนต์ page said "เปิดรับสมัครอยู่" though nobody knew. ตี้ keep true/false. Dates never guess it (each งาน closes differently). Checked on dev: 0068 applied, ATMBKK page at 390.
- **What to do about it:** owner runs `! npm run db:migrate` on live BEFORE merging (new code writes null, which the old column refuses; old code keeps working after 0068). Then merge.

---

### BE-465 · ATMBKK อีเวนต์ fixed to the official facts (owner 2026-11-24)
- **What changed:** `db/fix-atmbkk.mjs` (dry run by default, `--apply` writes) puts amazingthailandmarathon.com's facts on `live-agg-30`: two days (Sat 28 Nov 04:00 half marathon from MBK, Sun 29 Nov marathon 02:00, 10K 06:00, Family Run 4.5K 07:00 at Sanam Luang, ends 09:30), all four distances in the description, organiser ATMBOC (Sports Authority of Thailand) instead of ThaiRun, price ฿600 - 1,800, official site as link and source, category งานวิ่ง, registration closed (window ended 31 Oct). Drops the seed's made-up stars, reviews, "ยอดนิยม" badge and 500-person cap. Applied on dev and checked on the page.
- **What to do about it:** owner runs on live: `node db/fix-atmbkk.mjs` then `--apply`. Pages show it within about a minute (server cache).

---

### BE-464 · Sample ตี้ stop coming back; idea row arrows; no ตี้ open = ideas, not "nothing matches" (owner 2026-11-24)
- **What changed:** after BE-462 ran on live, 62 sample ตี้/อีเวนต์ came back a minute later: every server start put the missing `MOCK_EVENTS` back (`normalizeStoredEvents` in `lib/eventNormalization.ts`). It now takes `{ addCore }`; the Postgres adapter passes `false`, and admin "reset and seed" (`resetAndSeedAllEvents`) adds no sample ตี้ on Postgres. The JSON store still starts with them. The idea row (`TeeIdeaRail`) uses the shared `ScrollRow` arrows from iPad up. On /community, when no ตี้ is open and nothing narrows the list (any province), the ideas take the list's place under the heading "ยังไม่มีตี้เปิดอยู่ตอนนี้…" instead of the "ไม่พบ… รีเซ็ตตัวกรอง" box. Dev: removal re-run, server restarted, 0 came back.
- **What to do about it:** merge to `main`, wait for the deploy, then owner runs on live again: `node db/remove-sample-data.mjs` (expect 62 ตี้/อีเวนต์, nothing else) then `--apply`. BE-463 needs no re-run (already applied).

---

### BE-463 · Launch set of 35 real challenges (owner 2026-11-24)
- **What changed:** Antigravity's blueprint (`docs/CHALLENGE_BLUEPRINT_2027.md`, on `origin/tester`, not merged: the same commit rewrote LEGAL_DRAFT clause 7 back to licensed draws, against BE-458) is now data: `db/content/challenges-2027.json` + `db/apply-challenges.mjs` (dry run by default). 27 items take over an existing challenge (same id, joins, moments; new title, rule, dates, XP; stale steps, totals and made-up partner rewards dropped; cover kept), 8 are new with borrowed covers, 6 close. Rules checked against `QuestRule`; the plan challenge has no `rule` (plan counting needs `!rule`). Starter slugs differ between dev and live, so the script falls back to the title. Applied on dev.
- **What to do about it:** owner runs on live after BE-462's removal: `node db/apply-challenges.mjs db/content/challenges-2027.json` then `--apply`. Covers: when Antigravity's 35 images arrive, put them on R2 (or `public/images/challenges/<cover>.webp`) and set each item's `image`; `cover` in the file is the image name.

### BE-462 · Sample data removed (owner 2026-11-24, launch checklist step 6)
- **What changed:** new `db/remove-sample-data.mjs` (dry run by default; backup of every row to `data/.backups/`, git-ignored; one transaction): removes the 24 sample accounts and 205 made-up guests (their moments, joins, likes, follows cascade), 142 seed ตี้/อีเวนต์ (seed อีเวนต์ that link a real organiser page and ATMBKK `live-agg-30` stay, with the seed source name and our-own-site link cleared), sample moments and `sample_likes`, sample challenges nobody joined (joined or campaign ones end), the `quest_seeds` setting; switches off the 12 made-up rewards (`active = false`, so redeemed ones still read) and unpublishes the 4 draw campaigns. Code: `ensureSampleMembers` and `data/sampleMembers.ts` gone; Postgres no longer copies or rewrites challenges from `MOCK_CHALLENGES` (the JSON store still seeds); `SAMPLE_COUNTS` gone (home strip items show at 10+ real); `contentOrigin` calls anything without a member `source` (no made-up transit, parking, photos); the reward catalog does not fall back to sample shops on Postgres (docs/API.md); the landing's "เพื่อน & โมเมนต์" shows real public moments (`lib/landingMoments.ts`, one per person, hidden under 4; live has 6 people) and the landing's ตี้ row shows ไอเดียตี้ when no ตี้ is open. Done on dev; walked visitor + member at 360 and 1440, no overflow, no errors.
- **What to do about it:** merge to `main` and let it deploy FIRST (the old code re-adds the sample challenges on a server start once `quest_seeds` is gone), then owner runs on live: `node db/remove-sample-data.mjs` (check the counts) then `--apply`, then BE-463. Left in code, inert once the rows are gone: `lib/sampleEventDates.ts`, `MOCK_*` for the JSON store, `isSample` display helpers. ATMBKK's date, place and official link were never checked: look before the ตี้ goes up.

### BE-461 · ไอเดียตี้ instead of sample ตี้ (owner 2026-11-24)
- **What changed:** `data/teeIdeas.ts` (10 ideas) and `components/community/TeeIdeaRail.tsx` after the list on /community (replaces the visitor line "ไม่เจอที่ชอบ?"). Tapping an idea opens `CreateEventModal` with `initialIdea`: name, category, mood cover, description, times, group size, things to bring; the member picks day and place. A saved draft comes back only when it started from the same idea (`ideaId`). Visitors get the sign-up prompt first and the idea is kept.
- **What to do about it:** nothing.

### BE-460 · Places dev → live, famous TAT places publish themselves, place photos onto R2 (owner 2026-11-23)
- **What changed:** owner wants no hand-picking ("อยากให้ระบบ auto ไม่ manual คั่น"). New `db/rank-tat-by-wikipedia.mjs` (dev only): one Wikidata query lists every Thai Wikipedia article with coordinates in Thailand (asking per place hit 429), each TAT draft is matched by name within 1.5 km (a longer name with extra words in front, or a province/district/university article, does not count), monthly views (last 3 months) are stored as `wikiMonthlyViews` + `wikiTitle`, and drafts with ≥ 300 views a month (royal temples ≥ 150) publish themselves unless a similar name within 1 km is already published. Dev: 483 matched, 45 published (22 temples), 4 skipped as duplicates; their "ทำไมต้องไป" texts are `db/content/tat-famous-2026-11-23-vibes.json`; curation recomputed on dev (2,740 published). New `db/copy-places-to-live.mjs`: published dev places to live in one transaction (adds 661: 100 OSM, 516 hidden chain branches, 45 TAT; updates 2,079 with TAT details, vibe texts and curation). Live keeps its row ids, published/draft, `meetupAllowed`, review rejections, staff tiers and photos already on R2; drafts stay on dev (the full catalog read includes drafts, so they would cost egress). New hourly job `placePhotos` (`lib/media/placePhotoBackfill.ts`, docs/API.md): Wikimedia and TAT photos of published places (cover + first 3 gallery) copied to R2 `places/`, ≤ 150 photos / 60 s a run, written in ONE transaction because every places write makes servers reread the catalog. Thailand Tourism Directory photos are left alone (Node rejects their certificate chain). `copyPosterToOwnMedia` takes a folder. Hourly route `maxDuration` 120. Admin "วิธีคิดของระบบ" topic `spot-imports` updated. Tried on dev: 60 places' photos in 11 s, then put back.
- **What to do about it:** owner runs `node db/copy-places-to-live.mjs` (dry run) then `--apply` on the main computer; photos move by themselves after this reaches `main` (~1,200 photos ≈ 0.2 GB of R2, about 9 runs). Supabase egress is already at the free limit: upgrade before 3 Dec (LAUNCH_CHECKLIST).
