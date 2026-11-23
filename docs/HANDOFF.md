# Handoff Board

The change log for the Claude Code clones working on this repo (see "Who Works Where" in [AGENTS.md](../AGENTS.md)). Test reports from Antigravity go in [TEST_REPORTS.md](TEST_REPORTS.md).

- **Read this file at the start of every session.**
- **Add an item** when you changed something another session must know: behaviour, a rule, a migration, a shared utility.
- **Keep it short.** What is left to do goes in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md), API shapes in [API.md](API.md), not here.
- **IDs:** `BE-###`, increasing. Check the highest number on `origin/claude` first, so the clones do not reuse one.
- **When this file passes about 300 lines,** move the older items to `docs/archive/`.

Older items are archived: BE-235 to BE-419 in [archive/handoff-2026-11-03-to-2026-11-18.md](archive/handoff-2026-11-03-to-2026-11-18.md); up to BE-234, including every `FE-###`, in [archive/handoff-until-2026-11-03.md](archive/handoff-until-2026-11-03.md). Code comments that cite `docs/HANDOFF.md BE-###` with a lower number mean those files.

Item template:

```md
### BE-000 · Short title (owner 2026-10-03)
- **What changed:** ...
- **What to do about it:** ... (leave out if nothing)
```

---

### BE-455 · อีเวนต์ sources are scraped every week (owner 2026-11-23)
- **What changed:** new `GET /api/cron/weekly` (`maxDuration` 300) runs `lib/weeklyEventScrape.ts`: every active อีเวนต์ source once, the same as the admin button, so new items wait in the review queue. `.github/workflows/weekly-jobs.yml` calls it Monday 03:17 Bangkok; a second call within `WEEKLY_SCRAPE_GAP_DAYS` (6, `lib/eventImportRules.ts`) does nothing, kept in `app.app_settings` key `weekly_event_scrape`. Each run writes a `scrape.events` line to the admin audit log. The cron secret check moved to `lib/cronAuth.ts` (hourly uses it too). Admin "วิธีคิดของระบบ" has a new topic, `event-imports`. Tried on dev: 13.5 s, 0 new / 140 duplicates, second call skipped.
- **What to do about it:** nothing; it uses the existing `CRON_SECRET` GitHub secret. Run it now from GitHub > Actions > Weekly jobs > Run workflow after the merge if you do not want to wait for Monday.

### BE-454 · Event import no longer dies on one item without a province (2026-11-23)
- **What changed:** no event source had run since 2026-10-04, so live had 5 อีเวนต์ in the next 7 days. Running the scraper failed on `events_province_or_online`: 3 ThaiTicketMajor items had no province, and the single save took the other 119 down with them. `runScraperAndAIEngine` now leaves out items with no known province (`MASTER_77_PROVINCES` or `PROVINCE_ALIASES`) or no `location`, and reports `skipped` per source (docs/API.md; admin shows "ข้าม N"). Ran on dev 2026-11-23: 119 new, pending, 94 starting within 45 days, all with a picture.
- **What to do about it:** after this reaches `main`, run อีเวนต์ sources once in admin on live (or wait for the weekly run, BE-455) and approve in the review queue. Sources are read from the JSON store (`data/chill_database.json`, committed), not `app.sources`, which is a stale import copy. The scraper writes each source's last run to `data/chill_database.json` locally; do not commit that file.

### BE-453 · Past ตี้ and อีเวนต์ get status ended every night; audit's live command fixed (owner 2026-11-23)
- **What changed:** the 2026-11-23 audit found 87 past items on live still not `ended` (AGENTS.md section 2): nothing wrote the status, pages only hid them by date. New `lib/db/endPastEvents.ts` runs in `/api/cron/hourly` after `shortTrips`: one `update app.events` sets `details.status = 'ended'` and `registration_open = false` where `ends_at < now()`, skipping recurring, already ended/cancelled, and the seed ตี้ whose dates roll (`ROLLING_SAMPLE_IDS`, new export of `lib/sampleEventDates.ts`; not `is_sample`, which also marks staff-made ตี้ without a host). Safe to run twice; the write moves `table_versions`, so caches refresh. Ran on dev: 157 rows, audit now 0. `db/audit-content.ts` now stops with an error when a database URL is set without `DATA_STORE=postgres`, and the live command in its header and in BE-451 is fixed.
- **What to do about it:** live is fixed by the first cron run after this reaches `main` (GitHub Actions hourly, Vercel daily). No migration.

### BE-452 · Docs tidied before the data week (owner 2026-11-23)
- **What changed:** this board kept BE-420 onward; BE-235..BE-419 moved to [archive/handoff-2026-11-03-to-2026-11-18.md](archive/handoff-2026-11-03-to-2026-11-18.md) (1,045 → about 280 lines). `TEST_REPORTS.md`: the 22 `Confirmed fixed` reports moved to [archive/test-reports-fixed.md](archive/test-reports-fixed.md), and "Fixed" now links there. `LAUNCH_CHECKLIST.md`: the 45 done `[x]` items and the 0061/0062 reminders (both on live) were removed, as its own rule says; the 0067 item now covers 0066 too. Migrations 0066 and 0067 ran on dev on 2026-11-23; live still needs both.
- **What to do about it:** on `office-notebook` and `tester`, an edit to an old item in these files will conflict at the next merge. Keep the new files and put the edit in the archive or in a new item.

### BE-451 · Content audit script, read only, dev against live (owner 2026-11-21: the week of 23 Nov is 80% data)
- **What changed:** `db/audit-content.ts` reads through the app's own `db` (never writes) and prints a Thai report: totals by origin (member, source, sample, `lib/contentOrigin.ts`); per province the open ตี้ and อีเวนต์ starting in 7 and 30 days, real ones apart from samples, with "บาง" where the 7 days have fewer than 6 (สัปดาห์นี้'s thin mode); places published, with a photo and a description, drafts by source; open challenges; problems to fix (missing province, place, time, organizer or source link; under the form's minimums; past but not marked ended; likely duplicates; published places without photo, hours or coordinates; pictures pointing at files missing from public/). `--json=` keeps a snapshot, and `--diff=a.json,b.json` lists what the first database has that the second lacks, matched by source link or name and province (for the TAT places still only on dev).
- **How to run** (on the main computer; the office notebook has no database env files):
  - `npx tsx --env-file=.env.development.local db/audit-content.ts --out=audit-dev.md --json=audit-dev.json`
  - live, read only (fixed in BE-453; `.env.local` alone has no `DATA_STORE`, so the old command read the JSON files): `DATA_STORE=postgres DATABASE_URL="$(grep ^POSTGRES_URL_NON_POOLING= .env.local | cut -d= -f2- | tr -d '"\r')" npx tsx db/audit-content.ts --out=audit-live.md --json=audit-live.json`
  - `npx tsx db/audit-content.ts --diff=audit-dev.json,audit-live.json --out=audit-dev-not-live.md`
  - Report files are git-ignored (`/audit-*`). Tried on the no-database JSON files only: 69 ตี้ (57 sample), 295 อีเวนต์, 2,217 places, 8 provinces with anything in 30 days.

### BE-450 · สัปดาห์นี้ on a thin week: one row, เร็วๆ นี้, places first, nearby; "ตั้งตี้วันนั้น" (owner 2026-11-21)
- **Why:** in a province with little, or early on, a schedule of mostly empty days told visitors the app is empty.
- **What changed:**
  - **Thin week** (`ThisWeekView.tsx`, `THIN_WEEK_ITEMS` 6 / `THIN_WEEK_EMPTY_DAYS` 4 in `lib/thisWeekRules.ts`): fewer than 6 things in the 7 days, or 4 empty days or more. The day strip is left out; the week is one row ("7 วันนี้มี 2 อย่าง", each tile says its day); then กำลังจัดอยู่, **เร็วๆ นี้** (ตี้ and อีเวนต์ 8–30 days ahead, `weekContent().later`), ที่น่าไปวันว่าง, ชาเลนจ์, and for a picked province **ใกล้ๆ ใน<region>** (other provinces of its region, else "ที่อื่นทั่วประเทศ"), with a plain line that the province has little so far. A full week keeps the day-by-day schedule.
  - **ตั้งตี้วันนั้น:** an empty day (or folded run of days) links to `/community?create=1&date=YYYY-MM-DD[&province=]`; the create form starts on that day and province (`CreateEventModal` `initialDate`, `initialProvince`). This revisits the 2026-11-19 choice to offer making a ตี้ only once at the end.
  - The page gets a province → region map from the server (`provinceRegion()` in `lib/masterData.ts`), so the region lists stay out of the page's code.
- Checked on dev at 390 px: all provinces stays a schedule with "ตั้งตี้วันนั้น" on the two empty days; เชียงใหม่ switches to the thin layout (1 in the week, เร็วๆ นี้, places, challenges, ทั่วประเทศ as no other northern province has anything). Not tried: the form opening on the day (needs a signed-in member).

### BE-449 · สัปดาห์นี้ is what is on, My Hub is what I am doing; empty days fold (owner 2026-11-21)
- **What changed:**
  - **Empty days** (`app/this-week/ThisWeekView.tsx`): the day strip says "ยังไม่มี" (was "ว่าง", read as "you are free") and an empty day is no longer a link. In the schedule, days in a row with nothing fold into one line, "อังคาร 24 – พฤหัสฯ 26 ยังไม่มีกิจกรรม" (was "ยังไม่มีตี้…", wrong when a day had no อีเวนต์ either).
  - **Moved out of สัปดาห์นี้:** the member's challenges row became one line linking to My Hub (`/myhub?tab=quests`); "เพื่อนๆ จะไปกัน" lists only ตี้ friends go to, the member's own "ไปกัน" plans are on My Hub only (`lib/thisWeekFriends.ts`, `kind: "plan"` gone, docs/API.md).
  - **Marked on สัปดาห์นี้:** a ตี้ the member joined shows "ร่วมแล้ว" (the word every ตี้ list uses), their own shows "คุณจัด", saved ตี้ and อีเวนต์ a filled heart that can be toggled here; a day they go to something has an orange dot in the strip.
  - **My Hub** (`app/myhub/page.tsx`): with nothing coming up it no longer lists four open ตี้ of its own (the same ones สัปดาห์นี้ shows); one card "สัปดาห์นี้มีอะไรบ้าง" links there instead.
- Checked on dev at 390 px signed out: 5 of 7 days linked, two empty days with their line. Signed-in marks not seen on screen (no test account here).

### BE-448 · Choosing a song: hear it with the clip from its best part, a waveform that is easy to move (owner 2026-11-21)
- **What changed:**
  - **iPhone on silent** (`lib/media/songPlayer.ts`): Web Audio follows the ring switch while the clip's own sound does not, so the song could be silent. `unlock()` now sets `navigator.audioSession.type = 'playback'` (Safari 17+). Not yet tried on a real iPhone.
  - **Best part** (`songHook`): the stretch of the song with the most sound for the clip's length, in 0.5 s steps (the 2 s end fade left out). A tried or chosen song starts there; the song's sheet on a post plays from there too.
  - **Hear it with the clip:** a tap in the song sheet plays the song in step with the clip above (the editor's own player, `tryInPicker`), not on its own from 0. "ใช้เพลงนี้" keeps the part it was heard at.
  - **Loading:** the song's square shows a spinner until it sounds (in the sheet and on a post's song sheet); the first 4 songs load as the sheet opens.
  - **Waveform** (`SongRange`): a fixed window in the middle (42% of the strip) with the waveform enlarged under it and slid by finger, mouse drag or arrow keys (1 s). A 5 s clip on a 60 s song was a 25 px window before.
- Checked in Edge: different start points per song, spinner during a slowed 1.5 s download, the song started at the hook with the clip at 0, chosen start kept, a 120 px slide moved it 10 → 14 s.

### BE-447 · 29 more songs, 7 feels, mood chips in the picker (owner 2026-11-21)
- **What changed:** `MUSIC_TRACKS` has 37 songs (was 8): 29 CC0 songs by Loyalty Freak Music, Komiku and HoliznaCC0 from Free Music Archive, in `public/music/<id>.m4a`. Each track page's own licence link (`rel="license"`) was checked to be CC0 1.0 on 2026-11-21; the page is in each song's `license`. Each is its first 60 s (Skate 48 s), equally loud (-16 LUFS), with a 2 s fade at the end, 128 kbps AAC (about 1 MB). Feels: ฟีลกู๊ด, แดนซ์, ชิล, โลไฟ, ผจญภัย, อบอุ่น, สนุก, each with its own colour (`MOODS` in `SongBadge.tsx`). The three code-made samples moved to the end. The picker has a row of feel chips under the tabs. All 37 decode in Edge with the right lengths.
- **What to do about it:** `public/music` is now about 35 MB in git. Listen through the new songs once; pull any you do not like from `CC0_SONGS` (the file can stay or go).

### BE-446 · Songs on clips: no more stutter, a Reels-style picker, the song on the post (owner 2026-11-21)
- **Why:** the song preview in the clip editor stuttered on phones; the owner asked for picking and showing songs at IG/TikTok level.
- **Stutter fixed** (`lib/media/songPlayer.ts`): the preview was an `<audio>` element moved whenever it drifted from the clip, and each move fetched the file again. Now the song is decoded once into memory and played through Web Audio; it is started again only when the clip starts, loops, stalls or seeks (a loop's own `waiting` is ignored), small drift is moved back at once, and the volume works on iPhone. Checked in Edge with a test clip: one song start per loop.
- **Picking** (`components/moments/MusicPicker.tsx`): the เพลง tab opens a sheet with search, แนะนำ, มาแรง (shown once a clip uses a song) and บันทึกไว้; a tap plays the song, "ใช้เพลงนี้" puts it under the clip. The part of the song is chosen by dragging a window over its waveform (`SongRange`, replaces the "เริ่มที่" slider). Saved songs are on the device only (`lib/media/savedSongs.ts`).
- **On the post** (`components/moments/SongBadge.tsx`): one small white line, a note and "song · artist" with a soft shadow, as Reels shows it (owner 2026-11-21: no spinning record, no sliding name). Bottom left on feed clips (`ClipPlayer` `musicId`), under the author's name on the full-screen clip, and in the editor where it will sit. A tap opens the song's sheet: ฟังเพลง, บันทึกเพลง, and the clips that use it.
- **Sheet height** (owner 2026-11-21): the song sheet takes about half the editor with a light veil, and the clip moves to the top while it is open, so it stays in view.
- **Data:** `video.musicId` on posts, `?music=` on `GET /api/moments`, new `GET /api/moments/music` (docs/API.md). **Migration 0067** adds `moments.video_music_id`; code reads it only when present and writes it only for a clip with a song. Before 0067 a clip with a song still posts (the song is in the sound), but the post does not name it, so it shows no song pill (`pgMomentRepository.create` retries without the column).
- **What to do about it:** run 0067 on dev and live before merging this to `main`. Try on a real iPhone and Android: the preview with the clip's sound on, and the song's sheet over a playing clip.

### BE-445 · Google Play listing draft, feature graphic, deletion without signing in (2026-11-21)
- **What changed:** `docs/PLAY_STORE_LISTING.md` has every answer Play Console asks before the first release (listing text, content rating, target audience 18+, data safety table, app access, closed test steps). `android/store/feature-graphic.png` (1024×500) is made from `android/store/feature-graphic.html`. On `/legal?tab=privacy#my-data` a signed-out visitor now also sees how to ask for deletion by e-mail to privacy@chillwaa.com, because Play asks for a delete-account URL that works without the app. `docs/ANDROID_APP.md` named a `/privacy` page that does not exist; it now gives the `/legal` URLs.
- **What to do about it:** the signed `.aab` with the new icon still has to be built on the main computer (the upload key is there). privacy@ must receive mail before the store listing goes live.

### BE-444 · Music on clips: a เพลง tab in the clip editor, mixed on the phone (owner 2026-11-21)
- **What changed:**
  - **Clip editor** (`ClipEditor.tsx`): a new tab, เพลง, between สติกเกอร์ and เสียง, on devices that can shrink clips. You pick a song from `MUSIC_TRACKS` (`lib/media/musicLibrary.ts`) or ไม่ใส่เพลง, then set where the song starts and how loud it is. The preview plays the song next to the clip and keeps it in step. With เสียง → ปิดเสียง, the post has only the song.
  - **Posting** (`lib/media/clipCompress.ts`): the picture is made as before without sound. `OfflineAudioContext` mixes the song (looped, 0.2 s fade in, 1 s fade out) with the clip's own sound and passes it through a limiter, then the picture is copied as it is into a new MP4 with that mix as the AAC track. The post is still one plain MP4, so playing it needs nothing new. Where it fails, posting stops with "ลองเอาเพลงออก" and the original file is not uploaded.
  - **Songs (8):** 3 samples that `scripts/make-sample-music.mjs` makes from code (ours, WAV), and 5 CC0 songs by HoliznaCC0 from Free Music Archive (albums "Spring at last (LOFI TAPE)" and "Winter Lofi", both marked CC0 1.0). Each CC0 song is cut to its first 60 s as 128 kbps AAC `.m4a` (about 1 MB). The source link for each is in its `license` field.
  - **Not stored:** which song a post uses. The server, API and database are unchanged. There is no admin page for songs yet; adding one is on the LAUNCH_CHECKLIST.
- **What to do about it:**
  - `compressClip` was tested in headless Chrome with 6 cases, using both a WAV and an m4a song: song plus own sound, song only, song on a silent clip, song with filter and text. All gave AVC + stereo AAC of the right length, and the paths without a song behave as before.
  - The editor was walked on the dev server in no-database mode at 390 and 1280: sign up, pick a clip, เพลง tab, pick a song, move start and volume, mute the clip's own sound, speaker off, post. The song stays within 0.2 s of the clip; the six tool labels fit at 390; there is no sideways scroll and no page errors. The posted clip is 8 s with a stereo AAC track that carries the song.
  - **Not tested:** iPhone. Safari ignores `audio.volume`, so the preview plays at full volume, but the volume in the posted mix is right. Please try it on a real phone.

---

### BE-443 · Profile picture: placed in the circle at onboarding, shown large on a tap (owner 2026-11-20)
- **What changed:**
  - **Onboarding:** a picked photo opens `AvatarCropDialog` (drag, pinch, zoom), as the profile editor does; "ปรับตำแหน่ง" opens it again. It saves the same 640 px square (was an 800 px photo as picked).
  - **Profile:** tapping the picture shows it large (`components/members/AvatarViewer.tsx`, dark screen, X / tap outside / Escape). On my own profile the tap offers "ดูรูปโปรไฟล์" or "เปลี่ยนรูป"; with no picture it opens the editor. Uploads are shown as stored (640–800 px); sample accounts' Unsplash pictures are asked for at 640.
  - The viewer's dark backdrop is an inline style: the dev server did not build `bg-black/90` for the new file.
- **What to do about it:** checked in headless Edge at 390: another member's picture opens large and Escape closes it; my profile without a picture opens the editor. **Not seen in a browser:** the onboarding crop (the test could not get past the สาย cards in preview mode); please try a sign-up with a photo on dev.

---

### BE-442 · Feed ⋯ menu: "เอาแท็กฉันออก" and "เลิกติดตาม" (TR-013, owner 2026-11-20)
- **What changed:** the menu on someone else's post in the feed (`HomeMomentFeed.tsx`) adds "เอาแท็กฉันออก" when `isTaggedMe` (the existing `untag` action, as the moment page has) and "เลิกติดตาม" when `isFollowingAuthor` and the post is not a sample (`POST /api/members/{id}/actions` `unfollow`); every post by that author changes at once and goes back with a message if the server refuses. The "กำลังติดตาม" note by the name now gives way to the ติดตาม button after an unfollow. "ไม่สนใจโพสต์นี้" is still open (needs a table).
- **What to do about it:** checked in headless Edge at 390 with the feed answer altered in the test browser (local data has only sample posts): the menu shows both, unfollow flips the button and the toast. "เอาแท็กฉันออก" was not pressed (no tagged post locally); it reuses the moment page's call.

---

### BE-441 · Search at IG/TikTok level: every kind at once, recent searches, things to tap, arrow keys, /search with tabs (owner 2026-11-20)
- **What changed** (owner picked items 1–7 of the search plan):
  1. **Every kind while typing:** the dropdown (computer) and the phone search screen show people, ที่เที่ยว, ตี้, อีเวนต์, ชาเลนจ์ and tags, three each, with picture and one line ("คาเฟ่ & ร้านกาแฟ · อารีย์", "22 พ.ย. 2569 · สวนเบญจกิติ", "430 คนกำลังทำ"). The kinds are ordered by their best match (`order` from the server): "วิ่ง" shows ตี้ named "วิ่ง…" before places that only mention running. Matching is ค้นพบ's own (`matchesQuery` with synonyms); ranking is new (`lib/search/siteSearch.ts`).
  2. **Recent searches:** up to 8 on this device, each removable, "ล้างทั้งหมด"; a word is kept when Enter is pressed or a result opened from it.
  3. **Before typing:** recent searches, people worth following (members), this weekend (province first), the busiest challenges, popular tags. The dropdown now opens on focus.
  4. **Arrow keys:** down from the box into the results, up back to the box, Escape closes and returns focus.
  5. **Fresh tags:** the hashtag counts are kept 30 minutes (was 6 hours) and cleared when a post, edit or delete has a `#` (`forgetTagsOf` in `lib/moments/service.ts`; other servers catch up within the half hour).
  6. **`/search?q=&tab=`:** all results with a tab per kind and counts; "ทั้งหมด" six of each with "ดูทั้งหมด"; a tab up to 30, with a link to the ค้นพบ page and its filters for places, ตี้ and อีเวนต์. Server-rendered and `noindex`. Enter in every box comes here (`#tag` still opens the tag page); typing a new word on the page shows live results until Enter.
  7. **Moments by words:** `listMoments`' `q` also matches the title of the place, ตี้ or อีเวนต์ a post is tied to (both repositories); moments show as a photo grid on `/search`.
  - The dropdown's old first row "ค้นหา … ในตี้ อีเวนต์ ที่เที่ยว" became "ดูผลทั้งหมดของ …" (→ `/search`). `GET /api/search` grew `type`, `limit`, `province`, `moments`, the empty-word `start`, and `counts` / `order` (`docs/API.md`).
- **What to do about it:** checked in headless Edge at 1280 and 390 with the local sample data: the empty dropdown and phone screen, "วิ่ง" ordering, arrow keys, Enter to `/search`, the ที่เที่ยว tab, moments for "กาแฟ", a guest's results, recent searches; no page errors; `/search` sends `noindex, nofollow` with the results in the server HTML. Not tried: the tag cache clearing after a real post (needs a post on dev). Tester: TR-012 re-test now covers this.

---

### BE-440 · Search finds people and #hashtags (TR-012, owner 2026-11-20)
- **What changed:**
  - **API:** `GET /api/search?q=` (`app/api/search/route.ts`, contract in `docs/API.md`): people by name for signed-in members (`searchMembers` in `lib/members/safety.ts`, on a new name-only `memberRepository.searchByName`: the staff `query` also matches emails, which a public search must not) and tags (`searchHashtags` in `lib/moments/service.ts`, on the cached hashtag counts).
  - **Top bar (md and up):** typing in `SiteSearch` opens a dropdown (`components/discover/SearchResults.tsx`): first a row "ค้นหา “…” ในตี้ อีเวนต์ ที่เที่ยว" (what Enter always did), then people with ติดตาม buttons (`PeopleList`), then tags. "#tag" + Enter opens the tag page. Placeholder "ค้นหากิจกรรม คน #แท็ก" (`DiscoverSearch` takes `placeholder`).
  - **Phones:** the top bar's search icon opened `/community`; it now opens a full-screen search (`components/discover/SearchSheet.tsx`, loaded on first tap) with ตี้ / อีเวนต์ / ที่เที่ยว tiles and popular tags before typing, the same results while typing.
  - Guests get tags and "เข้าสู่ระบบเพื่อค้นหาเพื่อน" instead of people.
- **What to do about it:** tested against the API and the local member file (no database on the office notebook), and in headless Edge at 1280 and 390: the dropdown for a member and a guest, tags for "#", Escape closes it, the phone screen before and while typing, and ติดตาม → กำลังติดตาม from the list. Tester: please re-test TR-012 at 390 and 1280 wide. A tag first used in the last few hours is not listed until the hashtag cache refreshes (up to 6 hours), but "#tag" + Enter reaches it. Name search scans `display_name` with `ilike`; add a trigram index when members reach the tens of thousands.

---

### BE-439 · Small photo copies made on the phone; Circles: gold for finished, one "ทำอยู่" Circle; moment tabs hidden (owner 2026-11-20)
- **What changed:**
  - **Small copies (shared utility change):** every photo upload (moments and their edits, clip covers, profile pictures in onboarding and the profile editor, ตี้/อีเวนต์ images, Spot Buddy, admin image fields) builds its form with `photoUploadForm` (`lib/media/uploadPhoto.ts`), which adds an 800 px copy (384 px for `avatars`) when the photo is bigger than that. `/api/upload` takes it as `small`; the R2 adapter stores `name.s.webp` first, then the photo as `name.o.webp`. `optimizedImage` returns the copy for widths up to 640 (grid cards, tiles, avatars), the original above that. Only `.o.` names have a copy, so older photos are untouched. Deleting a photo through the adapter deletes its copy; the daily moment orphan cleanup keeps a copy while its original is used. `docs/API.md` has the `/api/upload` contract.
  - **Circles:** a friends Circle's corner faces were clipped by the scrolling row (the row now has 4 px above). My finished challenges are gold (`RING_DONE` / `BADGE_DONE` / `NAME_DONE` in `circleLook.ts`) instead of the same orange as ongoing ones. Two or more of my challenges still going ("ทำอยู่" or "2/3") share one Circle "ทำอยู่ N" with their pictures split inside it; a tap lists them (`AllCirclesSheet` takes a `title`) and each opens in the viewer, which still swipes through all Circles.
  - **/moments:** the type tabs (สถานที่, ตี้, อีเวนต์, ชาเลนจ์) are hidden while there are few posts (`SHOW_TYPE_TABS` in `MomentShowcase.tsx`). Posts keep their type and `?type=` links still filter; such a link shows the tabs so the reader can get back.
- **What to do about it:** the Circles row (gold finish, "ทำอยู่ 3" with three pictures, corner faces no longer clipped, the list it opens) and /moments without tabs were checked in headless Edge with sample Circles. The office notebook has no R2 settings, so the copy upload was not tried against a bucket. On the main computer, post a photo on dev and check that `media-dev` holds both `.o.` and `.s.` files and the /moments grid loads the `.s.` file. Turn the tabs back on when each type has enough posts to fill a page.

---

### BE-438 · Photos without Vercel resizes, running challenges count only their own posts, Circles show new friends, moment page tidy (owner 2026-11-20)
- **What changed:**
  - **Broken photos on /moments:** Vercel's 5,000 monthly image resizes ran out; every new resize answers **402**, so posts from the night before showed broken in the grid (the feed and the post page fell back to the original). Uploads on R2 (`media.chillwaa.com`, `media-dev.`) are no longer resized (`OPTIMIZED_REMOTE_IMAGES` in `lib/optimizedImage.ts`, so also not in `images.remotePatterns`): they are already at most 1600 px / 1 MB from the phone and R2 has no egress charge. `/icons/` is not resized either. The grid card (`CardPhoto` in `MomentShowcase.tsx`) now tries the original once when a resize fails, as `FramePhoto` does. **Shared utility change:** `optimizedImage` / `avatarImage` return R2 links as they are.
  - **Bell:** the Chillwaa notice icon (BE-435) went through the resizer too; avatars there are `ImgOr` with the initial as fallback.
  - **Running challenges (`posts.tagged`):** the ATMBKK "ซ้อม 3 ครั้ง" challenge counted any post with a place, so a food post finished it. New rule option `posts.tagged`: only posts made from the challenge count (its "โพสต์โมเมนต์" or Circle; the post keeps `achievement.questId`). `db/seed-atmbkk-2026.mjs` sets it on both ATMBKK challenges and now updates the rule of a challenge that already exists. The owner's wrong finish on live is left as it is (owner's choice).
  - **Circles:** a friends-on-one-challenge Circle (`c:<questId>`) kept its "opened" grey after someone new joined it, and its corner faces were the closest friends, so a friend just followed who finished a starter challenge never showed. The opened mark now includes the newest person's time (`seenKey`), and the newest face comes first.
  - **Moment page (own photo post):** the trash icon is now an eye with the view count (only the author sees it); delete moved into a "…" menu. The amber box keeps only "โพสต์นี้พาเพื่อนๆ ออกไปแล้ว" (a clip keeps the views line there, having no author row).
  - **Reel:** the sound button sits below the iPhone status bar in full screen (`fullScreen` on `ClipPlayer`).
- **What to do about it:** after merge, run `db/seed-atmbkk-2026.mjs` against live so the two ATMBKK challenges get `tagged`. Decide later whether to turn on Cloudflare image resizing for `media.chillwaa.com` (to add to LAUNCH_CHECKLIST). The video picker's "คลังรูปภาพ" is iOS's own menu and cannot be renamed from the page.

---
### BE-437 · Friend plans carry a meeting time; the invite sheet picks any day (owner 2026-11-18)
- **What changed:** the ชวนไป sheet offers "วันอื่น" (a calendar) beside เสาร์นี้ / อาทิตย์นี้, and once a day is picked an optional "กี่โมง". The plan chat's day picker (My Hub) sets or clears the time too. `POST /api/invites` takes `time` with `day`; `PATCH /api/plans/{id}` takes `time` (left out keeps it, `''`/`null` clears it); `PlanView.time`; every `dateLabel` reads "ส. 22 พ.ย. 18:30 น." (`planDayLabel` in `lib/social/friendPlans.ts`).
- **What to do about it:** run **migration 0066** (`app.friend_plans.plan_time`) on dev and live. Until then plans work as before, but saving a time fails. Written on the office notebook, not run anywhere yet.

---

### BE-436 · Staff-made ตี้ get a host account (owner 2026-11-18)
- **What changed:** the ATM 5K run (seeded with only `hostName: 'ทีม Chillwaa'`) had no `createdByMemberId`, so nobody could scan tickets. The admin ตี้ editor has "บัญชีโฮสต์ (สแกนเช็กอิน)": search a member and pick them; `/api/admin/events` `create` / `update_fields` accept `createdByMemberId` (active member, ตี้ only, set or changed, never cleared). That account checks people in, sees the list and leads the chat; `hostName` stays the shown name. The moderation list marks ตี้ with no host account in red. `db/seed-atmbkk-2026.mjs` takes `HOST_MEMBER_ID`.
- **What to do about it:** set a host account on every staff-made ตี้ still ahead (the remaining ATM runs first). Searching needs `members.manage`.

---

### BE-435 · Circles: no strangers' faces, hot challenges and "หาเพื่อน" instead; pictures mend; Chillwaa notices show the app icon (owner 2026-11-18)
- **What changed:**
  - The fill of the site's newest Circles for readers with few friend Circles is gone (`CIRCLES_FILL_BELOW` removed): a new member saw strangers as if followed.
  - A reader following fewer than `CIRCLES_SUGGEST_BELOW` (5) people gets up to `CIRCLES_HOT_MAX` (2) hot challenges at the end of the row (`h:<questId>`, `ChallengeCircle.suggested.total`, violet ring (orange means mine since BE-421), challenge picture only; opened: recent people on it, each with ติดตาม) and a "หาเพื่อน" Circle (`findPeople` on `GET /api/circles` and `HomeFeedStart`) that opens `FollowRow`.
  - A circle picture that fails to load tries the original file once, then the fallback icon (a second `ImgOr` in `AchievementRowCircle`, `components/home/Circles.tsx`): own challenge pictures showed a broken "?" on the first home after an Apple sign-up on iPad. Root cause not found; the links load fine.
  - Notifications from Chillwaa itself carry `actorAvatar: '/icons/icon-192.png'` (was `''`).
- **What to do about it:** check on a fresh iPad sign-up that the "?" no longer shows.

---

### BE-434 · สัปดาห์นี้: the first view of กิจกรรม, the next 7 days by day (owner 2026-11-19)
- **What changed:** new page `/this-week`. The job: "I have a free day: what is on, and who is going", answered at a glance. It began as a weekend-only page from the canvas draft; the owner then chose the next 7 days laid out as a schedule, which also tells it apart from the landing (rows by category). Top to bottom: tabs "สัปดาห์นี้ · ตี้ · อีเวนต์ · ที่เที่ยว", "สัปดาห์นี้ไปไหนดี" with the dates; the province is the search box's (top bar, or above the tabs on phones, as on the other กิจกรรม pages; a member starts in their own when it has something this week, remembered on the device; a search word opens the ตี้ list), a sticky day strip (วันนี้, พรุ่งนี้, ส. 21 … with how many, "ว่าง" when none; tap jumps to the day), "เพื่อนๆ จะไปกัน" (signed in only), "ชาเลนจ์ที่คุณทำอยู่" (the member's joined, unfinished challenges with progress, from `/api/rewards`), then one row per day mixing ตี้ and อีเวนต์ in start-time order, each tile labelled "ตี้" or "อีเวนต์" in its pillar color (same tile size as the 2/3/4/6 grids, sliding like the landing rows; weekend days in orange), empty days folded to one line ("ยังไม่มีตี้วันนี้", no button: making a ตี้ is offered once at the end), อีเวนต์ already running listed once as "อีเวนต์ที่กำลังจัดอยู่" (ending soonest first) instead of on every day, "ที่น่าไปวันว่าง" (6 places with a photo, no chain branches, for the province; each with "ชวนไป", which opens the "ไปกัน" invite sheet, or sign-in for a visitor), "ชาเลนจ์ยอดนิยม" (the 6 open challenges most people are doing, leaving out the member's own), and "ยังไม่เจอที่ชอบ?". Server HTML with its own metadata and the ตี้ as JSON-LD; in the sitemap. `lib/thisWeek.ts` (days in Bangkok, lists), `lib/thisWeekFriends.ts` + `GET /api/this-week/friends`. Shared `components/discover/PillarTabs.tsx` puts the new tab first on `/community`, `/events`, `/spots`. "กิจกรรม" in the top bar and the phone bar opens `/this-week`.
- **What to do about it:** nothing to run (no migration). Checked on dev at 390 px and 1440 px, signed out and in, tile width equal to /community (183 px at 1440); the friends row with two real attendees followed for the check (unfollowed after) and with one blocked; no console errors (a hydration mismatch from the province default was found and fixed). Not built: "ใกล้ฉัน" (needs location); save hearts are off on this page.

---

### BE-433 · /about says how to reach us; App Store listing draft (2026-11-19)
- **What changed:** `/about` gains a "ติดต่อเรา" part after "ดูแลกันแบบเพื่อน": hello@chillwaa.com (questions, ideas, working with us) and privacy@chillwaa.com (personal data, reporting content), as `mailto:` links. It is the App Store Support URL. New `docs/APP_STORE_LISTING.md`: name, subtitle, promotional text, Thai description, keywords (lengths checked), URLs, category, age-rating answers, the App Privacy table from what the code keeps, reviewer notes with the real delete-account steps, and the screenshot plan (iPhone 6.9" and iPad 13", since the app runs on iPad).
- **What to do about it:** both addresses reach no one until Cloudflare Email Routing is on (`docs/EMAIL.md` step 1). Checked the new part at 390 px and 1440 px.

---

### BE-432 · Store app push: listeners before register, the failing step on screen, signed-app entitlement check (owner 2026-11-19)
- **What changed:** after BE-429 the switch still showed "ตั้งค่าการแจ้งเตือนไม่สำเร็จ". `nativeToken` (`lib/appClient.ts`) now waits for both listeners to be added before `register()` (adding one is async in Capacitor, so a token iOS sent back quickly was lost and the call timed out), and reads Capacitor's `{ error }` objects. Every native step throws with its name (`permission:`, `ios:`, `timeout:`, `register:`, `save: HTTP n`), and `AppSettingsCard` shows it in small print under the message as "รหัสปัญหา: …". `ios-build.yml` gains "Check the signed app keeps push": the archive is exported once to a local .ipa with Apple's signing and the signed app's entitlements are read; the run fails if `aps-environment` is missing, and notes its value if kept.
- **What to do about it:** merge to `main` (web fix goes live; the iOS workflow uploads a build and runs the new check: see the run page notice). Then in the app try the switch again; if it still fails, the "รหัสปัญหา" line says which step.

---

### BE-431 · Places paging, admin places payload, RLS on two tables (tester TR-030..034, 2026-11-19)
- **What changed:**
  - **TR-032** `GET /api/spots`: chain branches were filtered out after paging, so on dev page 1 (20 chains) came back empty and `totalCount` counted them. New `excludeChains` in `SpotQueryParams`, applied in `filterSpots` (`lib/db/queryEngine.ts`) before paging; the route sets it when there is no `q`. Dev: page 1 now 20 places, 0 chains, total 2,695 → 2,179; a `q=Starbucks` search still finds branches.
  - **TR-033** `/api/admin/spots`: `GET` is always one page (no `page` = page 1, `limit` default 20, at most 200); the unpaged mode sent the whole list, 14 MB on dev (6,535 places), over Vercel's 4.5 MB response cap. A page of 20 is 27.5 KB. `POST` actions return only the changed `spot`, no longer `spots: getAllSpots()` (no screen read it). Every admin screen already asked with `page`; the map reads `/api/admin/coverage`.
  - **TR-030** `set_publication` scopes: `osm` covers `osm-` and `osmb-`, new `tat` (`tat-`), `imported` covers `ttd-`/`tat-`/`osm-`/`osmb-`, `curated` is everything else.
  - **TR-031 / TR-034**: migration **0065** turns on and forces RLS with the `runtime_all` policy on `app.circle_events` and `app.apple_tokens`. Dev: `db/verify-security.mjs` passes "RLS on and forced on all 78 tables".
- **What to do about it:** run **0065 on live** with 0064 (`! npm run db:migrate`). `docs/API.md` updated for both places endpoints.

---

### BE-430 · Emails ready for real members; owner steps for Resend and @chillwaa.com mail (2026-11-19)
- **What changed:** `lib/members/mailer.ts`: one email layout for all three messages (logo and name on top, title, one blue button, the link written out for when the button does not work, a footer saying where it came from and that the team never asks for passwords, OTP or money); a viewport tag so phones do not shrink it; the greeting never doubles "คุณ", adds a space before a Latin name and drops the bracket part; the plain-text copies carry the same footer. `sendMail` has an 8 s timeout, sends `reply_to` from the new optional `MAIL_REPLY_TO`, and logs what Resend answered when it refuses. New `docs/EMAIL.md`: Cloudflare Email Routing for privacy@/hello@ (the domain has no MX today, so mail to @chillwaa.com reaches no one), Resend domain on Cloudflare DNS (records on `send.` and `resend._domainkey`, DMARC), the three Vercel values, and the check before removing `SKIP_EMAIL_VERIFICATION`.
- **What to do about it:** owner steps in `docs/EMAIL.md`. Checked: tsc + lint; the verify and reset emails rendered and looked at 390 px (phone) and 1000 px. Not seen in a real mail app yet (Gmail, Outlook, Apple Mail), which comes with the first real send.

---

### BE-429 · Store app: push and share found no plugin (owner, TestFlight build 16, 2026-11-19)
- **What changed:** turning on notifications in the app showed "ตั้งค่าการแจ้งเตือนไม่สำเร็จ" without iOS ever asking. `lib/appClient.ts` read the plugins from `Capacitor.Plugins` only, which is empty in our pages (the site does not bundle `@capacitor/core`), so push fell back to web push, which the app's web view lacks. `capPlugin()` now falls back to `Capacitor.registerPlugin`, as `lib/nativeAuth.ts` does for WebAuth; the share sheet uses it too. The web branch of `turnPushOn` returns `unsupported` / `needs-install` instead of throwing where there is no web push.
- **What to do about it:** web only, no new app build: merge to `main`, wait for the Vercel deploy, then in the app turn on แจ้งเตือนบนเครื่องนี้ again; iOS should now ask.

---

### BE-428 · iPhone app: native push (APNs), native share sheet, "ลบบัญชี" easy to find (2026-11-19)
- **What changed:**
  - **Push:** inside the store app the settings switch "แจ้งเตือนบนเครื่องนี้" asks iOS through Capacitor PushNotifications (`lib/appClient.ts`: `readPushStatus` / `turnPushOn` / `turnPushOff` / `syncPushDevice` have a native branch; the token is remembered in localStorage). `POST /api/push { apns }` saves it in `app.push_subscriptions` as endpoint `apns:<token>` (p256dh/auth `-`, no migration; the 10-devices cap, delete with the account and the admin count all apply). `sendPush` sends `apns:` devices through `lib/social/apns.ts` (HTTP/2, ES256 provider token cached 40 min, collapse id = tag, 24 h expiry; 410/BadDeviceToken/Unregistered forget the device) and the rest through web push. `pushConfigured` is true with either key set. `listenForNativePushTaps` (in `AppSetup`) opens a tapped notice's `url` (site paths only).
  - **iOS shell:** `App.entitlements` (aps-environment production) on the App target; `AppDelegate.swift` forwards the device token to Capacitor; `ios-build.yml` signs the unsigned archive ad hoc with the entitlements before Apple re-signs it (an unsigned archive has none, which would drop push) and fails the run if `aps-environment` is missing.
  - **Share:** `installNativeShareSheet` points `navigator.share` at Capacitor Share inside the app, so the nine share buttons open the iOS sheet with no change to them.
  - Inside the app the install sheet and "ติดตั้งแอป" are hidden (`installWay()` returns null via `isStoreApp()`).
  - Account settings show "ดาวน์โหลดข้อมูลของฉัน" and "ลบบัญชี" as two links (was one "ดาวน์โหลดข้อมูลหรือลบบัญชี"), App Review 5.1.1(v).
- **What to do about it:** owner step 7 in `docs/IOS_APP.md`: an APNs key, `APNS_KEY_ID` + `APNS_PRIVATE_KEY` on Vercel Production, then merge to `main` (ios-app changed, so a new TestFlight build). Checked: tsc + lint; `/api/push` on dev (save, same token again = one row, bad token 400, signed out 401, delete); a request to Apple's real APNs with a made-up key answered `403 InvalidProviderToken` (request shape accepted). Not seen yet: a real notice on a phone, the native share sheet, and whether the TestFlight build keeps the push entitlement (the workflow checks the archive; Apple mails "Missing Push Notification Entitlement" if not).

---

### BE-427 · Deleting an account revokes its Sign in with Apple token (App Review 5.1.1(v), 2026-11-19)
- **What changed:** the Apple code exchange (`lib/members/oauth.ts`) now keeps the `refresh_token`; the OAuth callback stores it via `saveAppleToken` in the new table `app.apple_tokens` (migration **0064**, one row per member, replaced at each Apple sign-in, cascades with the member), encrypted with AES-256-GCM under a key derived from `AUTH_SECRET` (`lib/members/appleTokens.ts`). `deleteMemberAccount` calls `revokeAppleToken` for members linked to Apple, just before removing the member; it posts to `https://appleid.apple.com/auth/revoke` and never blocks the deletion. The self-delete audit line says whether the request went out. `OAuthProfile.refreshToken` is Apple-only and never stored on the member.
- **What to do about it:** run **0064 on live** (`! npm run db:migrate`); until then, saving fails quietly with a log line and sign-in works as before. Apple answers 200 to any revoke (checked: even a made-up client), so the server cannot confirm: after 0064, sign up a test account with Apple in the app, delete it, and check the iPhone's Settings › Apple ID › Sign in with Apple no longer lists Chillwaa. Apple members who signed in before this deploy have no token kept until their next Apple sign-in. On dev, `schema_migrations` had an old checksum for `0063_circle_events.sql` (applied as a draft before BE-420 was committed; the table matched the file), so it was updated there before 0064 applied. Live was not touched.

---

### BE-426 · Circles fixes from the tester (TR-021..029, 2026-11-19)
- **What changed:** `GroupCircleBody` gets `key={item.id}`, so a picked photo no longer carries over to the next group (TR-021). `CircleViewer` now loads a friends-on-one-challenge Circle's detail ahead of a swipe like the others; `ChallengeCircleBody` takes `detail` / `onDetail` / `onRetry` instead of fetching itself (TR-026). Friends' faces and names in an opened Circle link to `/profile?id=` (TR-025). The row puts a divider after the lead Circles (next plan, campaigns) when friends follow; it hides when the lead draws nothing (`first:hidden`) and on `lg`, where the lead moves to the left column (TR-023). Group Circles: safe-area bottom padding, a grey name once seen (TR-024). Initials 11px (TR-027). New `components/ImgOr.tsx` (an image that becomes an element, initials or an icon, when its link is bad) on every Circles image (TR-028). `scripts/smoke.mjs` calls `/api/circles` (TR-029).
- **What to do about it:** TR-022 is not a bug (Esc closes only the top dialog; checked in a browser) and is marked Needs owner with the reason. Friends-on-one-challenge and group Circles were not seen in a browser: the dev member with the most follows has none.

---

### BE-425 · Feed basics: names open profiles, time opens the post, หน้าหลัก again refreshes (tester TR-010..020, 2026-11-19)
- **What changed:** in the feed, the author's name (header and before the caption) links to `/profile?id=` like the avatar, and the post time links to `/moments/[id]`. `CommentThread` links the commenter's avatar and name when the comment has an `authorId`. Tapping หน้าหลัก while on `/` (phone bar and desktop nav) scrolls to the top and refreshes the view being read: `lib/homeAgain.ts` fires `chillwaa:home-again`, `HomeMomentFeed` listens. The new-posts banner also runs on ติดตาม (สำหรับคุณ stays without it, it is ranked). `MomentPhotos` tries the original once when the resized photo fails, then shows "โหลดรูปไม่ได้" on a tint. The composer's X asks before throwing a draft away, like Esc (TR-011).
- **What to do about it:** TR-010/011/014/015/018 are Ready to re-test. TR-012/013/016/017/019/020 are Needs owner, each listed in LAUNCH_CHECKLIST (feed comments stay as they are: owner 2026-11-19). Comment profile links were not seen in a browser: the dev database has no member comments.

---

### BE-424 · Bangkok cafés, bars and galleries from OpenStreetMap in the dev database (owner 2026-11-19)
- **Why:** our places were mostly temples (live: temples 26%, temples + old town + museums ~45%, no nightlife). TAT is no help for cafés: about 77 in Bangkok by name, and a sample of 20 had 2 with pictures.
- **What changed:**
  - `db/import-osm-venues.ts` + `lib/scrapers/osmVenues.ts`: OSM cafés, bakeries, ice cream, tea, bars, pubs, nightclubs, galleries and arts centres for one province (default Bangkok), dev only. On dev: 2,030 new drafts (cafe 1,404, bar 582, art 44), id `osmb-<n|w|r><osm id>`, credited "OpenStreetMap" with the OSM link. 456 have hours, 413 a phone or link, all have a district (from OSM district outlines when the tags do not say). Left out: names under 5 characters and 47 we already had.
  - **Chain branches** (owner 2026-11-19: "คนไปเยอะ" but they would bury the independents): 516 on dev, `chainBrand` set, **published without a photo**, curation override `hidden`. They are meeting points and moment tags only: found by `GET /api/spots?q=` (moment place picker, ตี้ form), left out of `/api/spots` without `q`, `/spots` browsing and search (`lib/spotBrowse.ts` catalog), home picks, nearby dining and the sitemap; their page is `noindex`. Named by the nearest mall within 200 m, else the road, else the district ("Starbucks สาขาสยามพารากอน"); 81 names still repeat within a district.
  - **Shared utility:** `resolveSpotImage` / `resolveSpotGallery` (`lib/spotImageResolver.ts`) now return no stock photo for `osmb-` places, and `DetailHero` shows "ยังไม่มีรูปของที่นี่" on a tint when the image is empty.
  - The description says only what the tags say ("คาเฟ่ในย่านบางรัก มี Wi-Fi และที่นั่งด้านนอก"); no vibe text yet, it is written when a place gets its photo.
  - **No photo, no publish** (owner option 1, `lib/spotPhotoRule.ts`): an `osmb-` place cannot be published while it has no real photo of its own (stock photos do not count). Review-queue approve refuses it, bulk publish skips it and says how many, editing it to published returns an error, "เติมรูปอัตโนมัติ" leaves it alone. Topic "ที่เที่ยวที่นำเข้า" added to the admin logic page.
  - Place matching moved from the TAT importer into `lib/scrapers/placeMatch.ts` (same behaviour for TAT); venues match only on a close place with an overlapping name, as cafés sit side by side and share names across branches.
- **What to do about it:** nothing reaches live. The 2,030 drafts sit in the review queue with TAT's 1,642. A running `next dev` keeps its old place list until restarted. Next: a way to add photos (staff upload, or a member moment at the place, which needs the terms and an opt-in first: see LAUNCH_CHECKLIST), then the promote step to live. Checked on dev: `?q=Starbucks` finds branches (tier hidden), a branch page has `noindex` and the no-photo header, no stock photo.

---

### BE-423 · TAT attractions in the dev database (owner 2026-11-18)
- **What changed:** `db/import-tat-attractions.ts` + `lib/scrapers/tatDataApi.ts` (and `categorize` exported from `tourismDirectory.ts`). On dev: 1,642 new attractions from TAT as drafts with credit, 346 existing places filled in where TAT knows more, nothing removed. Details, numbers and rules in [TAT_IMPORT.md](TAT_IMPORT.md) "Import run".
- **What to do about it:** staff approve on dev; nothing reaches live until a promote step copies pictures to R2 (not built yet). The importer and the earlier Gemini script (`db/import-tat.mjs`, never committed) do the same job; keep this one.

---

### BE-422 · Next.js 16.4.6 (2026-11-19)
- **What changed:** Next.js and eslint-config-next 16.4.3 → 16.4.6 for the moderate advisory on `'use cache'` root params; `npm audit` now 0. Production build passed against the dev database.
- **What to do about it:** nothing; reinstall packages after pulling.

---

### BE-421 · Circles row: orange for mine, blue for friends, a line between (owner 2026-11-18, option A)
- **What changed:** the row had seven ring colours (pink share, orange next plan, yellow campaign, blue doing, violet step, gold finish, green group, violet-gold friends on one challenge). Now two (`components/home/circleLook.ts`): orange `RING_MINE` for the reader's own Circles (share, next plan, campaigns, own challenges; badges `BADGE_MINE`, names in dark orange) and blue `RING_FRIENDS` for friends (finish keeps the gold trophy badge, steps, groups and friends-on-one-challenge badges are dark blue). A thin line sits between the reader's own challenge Circles and the first friend. The reader's own challenge names wrap to two lines instead of "ป้ายยาที่โปรด…"; one joined campaign is named "แคมเปญ" (two keep their prize words). Opened friend Circles still go grey. Admin topic Circles updated.
- **What to do about it:** nothing. Checked signed in on dev at 393 px and 1440 px.

---

### BE-420 · Circles: no cover flash, cheer moves on, numbers in admin (owner 2026-11-18)
- **What changed:**
  - A finish Circle no longer shows the challenge cover for a moment before its real moment (BE-419) loads: a plain grey box waits instead (`CircleViewer`).
  - After "ชื่นชม" the viewer moves to the next Circle after 0.9 s, unless the reader moved already or it was the last one.
  - Numbers: new `app.circle_events` (migration 0063, granted to `app_runtime`), one row per Bangkok day, member, Circle kind and event, so people not taps. Opens and "ดูโพสต์" come from `POST /api/circles/events` (always 204); the buttons are counted in `POST /api/circles/:id`. `/admin` shows them in "Circles ได้ผลไหม" (`CirclesStatsPanel`, `GET /api/admin/circles`, 7/14/30 days, each action as a share of opens). Rows older than 180 days (`CIRCLE_EVENTS_KEEP_DAYS` in `socialRules.ts`) are dropped now and then. Not counted yet: taps on the reader's own share, next-plan and campaign Circles, which open other pages. API.md and the admin topic Circles updated.
  - Drafts for one ring colour per group and short labels under the reader's own Circles wait for the owner's pick (not built).
- **What to do about it:** live needs migration 0063 before the numbers fill (`! npm run db:migrate`); without it nothing breaks, events are just not kept. Checked on dev: three opens in a day count once, bad input is dropped, a cheer is counted; test rows and the test cheer were removed. The admin panel was not opened signed in.

