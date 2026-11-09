# Handoff Board

The change log for the Claude Code clones working on this repo (see "Who Works Where" in [AGENTS.md](../AGENTS.md)). Test reports from Antigravity go in [TEST_REPORTS.md](TEST_REPORTS.md).

- **Read this file at the start of every session.**
- **Add an item** when you changed something another session must know: behaviour, a rule, a migration, a shared utility.
- **Keep it short.** What is left to do goes in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md), API shapes in [API.md](API.md), not here.
- **IDs:** `BE-###`, increasing. Check the highest number on `origin/claude` first, so the clones do not reuse one.
- **When this file passes about 300 lines,** move the older items to `docs/archive/`.

Items up to BE-234, including every `FE-###`, are in [archive/handoff-until-2026-11-03.md](archive/handoff-until-2026-11-03.md). Code comments that cite `docs/HANDOFF.md BE-###` with a lower number mean that file.

Item template:

```md
### BE-000 · Short title (owner 2026-10-03)
- **What changed:** ...
- **What to do about it:** ... (leave out if nothing)
```

---

### BE-321 · Clips up to 30 s with a movable end (owner 2026-11-09)
- **What changed:** `MAX_VIDEO_SECONDS` 15 → 30 (`lib/moments/types.ts`, read by the composer and the server check). The clip editor has one track with two handles (start and end, 1–30 s; moving one pushes the other). A file within 30 s starts whole, a longer one with the first 15 s (`DEFAULT_CLIP_SECONDS`). `compressClip(file, startS, endS, …)`. `ClipPlayer` now holds the chosen end also for an original file that could not be shrunk. `docs/API.md` says 30.
- **What to do about it:** joining two separate parts is not built (LAUNCH_CHECKLIST stage 8). Not walked on a real phone yet.

### BE-320 · Follow button moved away from the name (owner 2026-11-09)
- **What changed:** on the home feed card it sits right before the ... menu; on the photo moment page it leads the actions on the right; on a clip it is an outlined pill at the end of the author row. Tapping the name or photo for the profile no longer risks a follow.

### BE-319 · Global groundwork: country on provinces, English place names, map point required (owner 2026-11-09)
- **What changed:** migration 0038 adds `app.provinces.country_code` (ISO alpha-2, default `TH`). `LifestyleSpotItem.titleEn` (stored in `details`, not shown yet) is filled by the OSM and tourism-directory importers; `runSpotScraper` drops places without coordinates. `db/backfill-place-title-en.mjs` filled 130 of 132 OSM places on dev.
- **What to do about it:** on live, the owner runs `! npm run db:migrate` (0038) and the backfill with `CONFIRM_LIVE`. New code: no new Thailand-only assumptions where avoidable (plan in LAUNCH_CHECKLIST "เตรียมพร้อม Global").

### BE-318 · Positioning on the landing hero and site descriptions (owner 2026-11-09)
- **What changed:** hero h1 "โซเชียลแพลตฟอร์ม / สำหรับคนชอบออกไปใช้ชีวิต" + line "ที่ทำให้ทุกการใช้ชีวิตมีความหมาย" (`app/HomeView.tsx`); wordmark subtitle "โซเชียลคนชอบออกไปใช้ชีวิต"; the same sentence in layout metadata, JSON-LD, manifest and llms.txt. Positioning and differentiator in `docs/PRODUCT_DIRECTION.md`. /about, onboarding and the sign-up popup still say คอมมูนิตี้.

### BE-317 · Top 15 of every destination has vibe text; follow on the post page (owner 2026-11-08)
- **What changed:** `db/content/featured-top15-vibes.json`: 194 vibe texts for the 15 best places (curation score) of each of the 13 destinations on /spots, and 3 places to draft (navy recruit centre, army camp, former Tiger Temple). Applied on dev only. The full-screen post page (`components/moments/MomentDetailView.tsx`) has the same "· ติดตาม" as the feed.
- **What to do about it:** on live, `node db/apply-spot-vibes.mjs db/content/featured-top15-vibes.json --apply` once the owner OKs it. OSM found almost nothing new for Chiang Mai, Phuket and Chonburi (all already imported).

### BE-312..316 · Database review items 1, 3, 5, 6, 7 (owner 2026-11-08)
- **What changed:** 0036 drops `place_images`, `rate_limit_hits`, `import_runs`, `api_usage`, the waitlist states and `offered_at` of `event_participants`, and adds a CHECK on `sponsored_slots.pillar` (BE-312). `participants_count` = joined members, never the host: the host keeps a joined row but takes no seat; 0037 recounts real ตี้ and อีเวนต์ (BE-313). Spot Buddy minimum is people at the meet, host included: use `tripPeopleMissing` / `isTripConfirmed` (BE-314; fixes host + 2 looking short). Redemptions check XP and insert under a per-member lock (BE-315). On read, the typed column wins over its details copy for places publicationStatus/meetupAllowed, events max/min/registrationOpen, challenges status/visibility/isOfficial/rewardPoints; the public places list filters on `publication_status` (BE-316).
- **What to do about it:** run 0036 and 0037 on live **after** this code is deployed (the old code still writes `place_images` and counts the host). Item 9 is postponed (LAUNCH_CHECKLIST stage 7).

### BE-311 · Follow from a post in the feed, OSM hours read right (owner 2026-11-08)
- **What changed:** a feed post from someone the viewer does not follow shows "· ติดตาม" after the name (`components/home/HomeMomentFeed.tsx`, handler `onFollow`, uses the existing member follow action and the feed field `isFollowingAuthor`); once tapped every post by that author drops the link, the tapped one shows "· กำลังติดตาม". Not on own posts or sample posts. The OSM importer (`lib/scrapers/osmWikidata.ts`) waits 120 s for Overpass, has a third mirror, puts "น." after each time range and writes a whole week as "ทุกวัน". 37 Bangkok landmarks imported on dev; owner OKed them 2026-11-08.
- **Spot page:** new optional field `vibeIntro` (in `details`, no migration): when set, "เกี่ยวกับที่นี่" shows it first and folds the description under "เรื่องเล่าของที่นี่"; meta and JSON-LD descriptions lead with it. Texts live in `db/content/*-vibes.json` and are written by `node db/apply-spot-vibes.mjs <file> [--apply]` (also sets listed places back to draft: a boarding school and an abandoned tower). "สิ่งที่ควรทราบ" has a new row รถไฟฟ้าใกล้สุด, worked out on the server from `lib/transit/railStations.json` (188 OSM stations: BTS, MRT lines, ARL, Red Line) by `lib/transit/nearestStations.ts`.
- **What to do about it:** on live, run the Bangkok import, then `node db/apply-spot-vibes.mjs db/content/bangkok-osm-vibes.json --apply` (both waiting for the owner 2026-11-08). Places outside these 35 still have no `vibeIntro`. **Rule (owner 2026-11-08):** every new place import ships with its vibes file in the same batch, so no backlog builds up; both clones follow it.

### BE-310 · "Did this table change?" reads one row (owner 2026-11-08)
- **What changed:** migration 0035 adds `app.table_versions`; a statement trigger on events, places, quests and the six master tables moves its number inside the writing transaction. `readIfChanged` (postgresAdapter) and `masterTablesVersion` use `tableVersions()` in `lib/db/postgres/tableVersions.ts` instead of counting and summing every row (places: 153 ms a check, 1,402 checks on live). Until 0035 runs on a database it falls back to the old scan, so deploying first is safe. Applied on dev and checked as `app_runtime` (a write moves the number, a rollback does not); `db:verify` passes.
- **What to do about it:** run 0035 on live at merge. A new cached table needs a `<table>_version` trigger and a row (see 0035).

### BE-309 · Member reads no longer carry the password hash (owner 2026-11-08)
- **What changed:** the member read (`hydrate` in `lib/members/pgMemberRepository.ts`) returns `hasPassword` instead of joining in `password_hash`; the JSON mode strips it too. `Member.passwordHash` is now write-only (create/update still set it). Sign-in and password change read the hash with the new `memberRepository.passwordHashOf(id)`. Responses are unchanged (they already sent only `hasPassword` / `loginMethods`). Checked on dev: sign-up, wrong and right password, password change, old password refused.
- **What to do about it:** use `member.hasPassword`, never `member.passwordHash`, to ask whether a member has a password.

### BE-308 · Load test on dev; signed-out moment feed kept 15 s (2026-11-08)
- **What changed:** `scripts/load-test.mjs` drives a local `next start` on the dev database (refuses anything but localhost). Before: 49 req/s, p95 1.7 s at 50 users, no errors, `/moments` and `/api/moments` slowest (every request read the database, ~200 ms). `listMoments` now keeps the signed-out page 15 s and `countMomentsByType` 30 s (`cacheManager`, tag `moments-guest`); members still read fresh. After: 56 req/s, p95 1.4 s, no errors; the limit is the laptop CPU. Places stay filtered in memory: browse 8 ms, Thai search 23 ms, so moving them to SQL waits (see LAUNCH_CHECKLIST).
- **What to do about it:** a post hidden by staff can stay in the guest feed up to 15 s on a server that already had it.

### BE-307 · Daily clean-up of moment files no post uses (2026-11-08)
- **What changed:** `GET /api/cron/hourly` runs `cleanMomentOrphans` (`lib/media/orphanCleanup.ts`), which works at most once in 20 hours (stamp `moment_orphans_cleaned_at` in `app_settings`). It deletes files in the `moments` folder older than 3 days that no moment (any status) points to as a photo, clip or clip preview, matched by path not host; at most 300 a run, and it deletes nothing if more than half the old files look unused. Avatars are left alone: their links are copied onto ตี้, comments and notifications. Dry run on dev found 7 of 9 old test files unused, checked by hand.

### BE-306 · Follower lists read only the people on them (2026-11-08)
- **What changed:** `GET /api/members/follows` built both lists by reading every member; it now reads the followed ids plus the follower ids from the follows index (`memberRepository.followerIds`, new on both repositories). Same response.

### BE-305 · Feed photo viewer and admin lists through the image optimizer (2026-11-08)
- **What changed:** the full-screen viewer in `HomeMomentFeed` asks for 1080 px; admin lists (ตี้/อีเวนต์, members, moments, places, provinces, venues, media) ask for 64–384 px through `optimizedImage` / `avatarImage`. Watch the Vercel image optimization quota.

### BE-304 · Signed-in walk of BE-297..303 on dev, short map link in trip share (2026-11-08)
- **What changed:** walked in headless Chrome with two throwaway members (all deleted after): photo edit after posting (add 2, move, remove, save; the removed file leaves storage), @mention in a comment links to the profile and the picker offers friends, "อ่านแล้ว" shows in a two-person ตี้ chat after the other side opens it, "ส่งให้คนใกล้ตัว" opens for a trip member, the photo editor fits iPad upright (tools under the photo) and sideways (beside it) and a phone, the challenge counted list starts folded and opens, /rewards has no sideways scroll. No script errors. The trip share message now links the map by coordinates (`?q=lat,lng`) instead of a long percent-encoded Thai name.
- **What to do about it:** still not tried on a real iPad or iPhone.

### BE-303 · Edit photos after posting (owner 2026-11-08)
- **What changed:** "แก้ไขโพสต์" on a photo moment shows the photos in a row: × takes one out (one must stay), ‹ moves one earlier, "เพิ่มรูป" adds more up to 10. New photos are cut to the post's shape (square or 4:5) on the phone and upload only on บันทึก, so a cancelled edit leaves nothing in storage. `PATCH /api/moments/[id]` takes `images`; photos taken out are deleted from storage unless another own post shows them. Clip posts edit text only. `uploadPicture` is exported from `components/moments/publishMoment.ts`.

### BE-302 · Master data in its own tables (owner 2026-11-08)
- **What changed:** categories, provinces, zones, venues and the two rail card lists are read from and written to `app.provinces`, `app.zones`, `app.categories`, `app.venues`, `app.venue_groups`, `app.community_clubs` (`lib/masterDataTables.ts`), no longer one `app_settings` document. Each admin action writes only the rows it changes, so two staff saving at once keep both edits. Pages still read a copy in memory, checked every 30 s against a count + `updated_at` fingerprint. A venue staff add is now a real `app.venues` row, so events can point to it at once (the adapter re-reads codes after a province or venue edit). `data/master_data.json` is only the no-database mode file now: editing it no longer changes the database.
- **What to do about it:** run migration **0034** on live when merging (`npm run db:migrate`). It adds the missing columns and copies what pages showed (the `master_data` document if staff saved one, else the bundled file as of today) into the tables; the document is kept as `master_data_before_0034`. Tested on dev, including the copy from a saved document.

### BE-301 · Tab counts follow the filters, calmer /rewards, place page order (owner 2026-11-08)
- **What changed:** /events and /community tab counts use the same filters as the cards (`matchingFairs` / `matchingTees`), so a tab never promises more than it shows. /rewards: wallet row and chips are neutral; only campaign cards and XP tickets stay yellow. Place page: "ไปต่อไหนดี" is back in the right column on desktop and sits after the cafés on phone and iPad (`max-lg:order-1` / `max-lg:order-2`).

### BE-300 · Tester round: posting on iPad, challenge folds, rewards strip (owner 2026-11-08)
- **What changed:** photo and clip editors put the picture first: tools under it on any upright screen (iPad held upright too), beside it on a wide one (`portrait:` / `landscape:`); the clip dialog is no longer 512 px wide. × removes even the only photo (back to choosing); the clip has "เลือกคลิปใหม่". Zoom goes below 1 to show the whole photo with white bars (`minZoom` in `lib/media/photoEdit.ts`). Sticker panel has no place section (the place is on the next step); icon stickers have no badge, the colour is the icon's; word pills measure wider for Thai. Challenge page: กติกาและเงื่อนไข open at first; the counted list folds to one line like นับในชาเลนจ์ on a ตี้ page, closed at first (opens from "ดูที่ที่นับ"). ตี้ page: empty "ถามคนจัด" is one line with a button; the host sees nothing until asked. Place page: "ไปต่อไหนดี" moved under ร้านกาแฟและร้านอร่อยใกล้ๆ. /rewards: one column, slim XP strip, "ได้ XP จาก" at the bottom.
- **What to do about it:** not walked on a real iPad yet.

### BE-299 · Chat read state (owner 2026-11-07)
- **What changed:** reading a chat marks it read in `chat_room_members.last_read_at` (table from 0008, first use; no migration). `GET /api/chat/{roomId}` adds `reads`; `GroupChatModal` shows "อ่านแล้ว" (two people) or "อ่านแล้ว N" (group) under one's own messages, like LINE. A poll with nothing new writes nothing. `chatStore` has `markRead` and `readTimes` (JSON mode: `chat_reads`). Details in docs/API.md.

### BE-298 · @mentions in captions and comments (owner 2026-11-07)
- **What changed:** "@" in the caption, the moment page comment box and the home feed comment box opens a list of people (`components/moments/MentionPicker.tsx`, rules in `lib/moments/mentions.ts`). Caption mentions become tags. Comment mentions are stored in `moment_comments.mentions` (migration **0033**) and send `tagged` with `commentId` ("พูดถึงคุณในความคิดเห็น"). `CaptionText` takes `mentions` and links `@name` to the profile. Confirmed names are taken out of the new-account contact check, which would otherwise block "@Duke" as a LINE id.
- **What to do about it:** run migration 0033 on live before merging (dev done).

### BE-297 · Trip: send the plan to someone close (owner 2026-11-07)
- **What changed:** on a Spot Buddy trip (`spotId`) the member or host has joined, the share buttons (hero and phone bar) open `components/detail/TripSafetyShare.tsx` instead of the plain share: a ready, editable text with where (place, address, map link), when, with whom (from the attendee list) and the trip link, sent through LINE, the phone's share sheet or a copy. Other ตี้ keep the plain share. Also TR-002 set to "Ready to re-test" (fixed in BE-289, the status was not updated).

### BE-296 · The hourly job moves every waiting list (2026-11-07)
- **What changed:** `GET /api/cron/hourly` now also runs `waitlists` (`moveAllQueues` in `lib/social/waitlist.ts`): lapsed 2-hour offers drop out and the next person is offered the seat and told, even when nobody opens the ตี้. Before, the line moved only when someone read or changed it.

### BE-295 · "ไม่ได้ไป" is kept on the account (2026-11-07)
- **What changed:** the My Hub mark "ไม่ได้ไป / ไปแล้ว" on an ended event without a member host was kept only in the browser. It is now `event_participants.missed_at` (migration **0032**), set with `POST /api/auth/member/activity { action: 'missed' }` and read as `joined[].missedAt`. Old browser marks are sent to the account once. Where a member host checks people in, the menu no longer offers the mark (their check-in decides).
- **What to do about it:** run migration 0032 on live before merging (dev done).

### BE-294 · No Vercel previews for `tester` and `office-notebook` (2026-11-07)
- **What changed:** `vercel.json` turns off Vercel builds for pushes to `tester` and `office-notebook` (`git.deploymentEnabled`). Old deployments filled the free Functions Storage (10 GB). The owner also set deployment retention: previews 1 day, production 1 week.
- **What to do about it:** office-notebook work gets a preview only once it reaches `claude`. Push in batches: one push is one build.

### BE-293 · See who liked your moment (owner 2026-11-07)
- **What changed:** on your own moment the heart count is a link that opens คนที่ส่งหัวใจให้, newest first, each with a follow button (`GET /api/moments/[id]/likes`, owner only; others still see just the number). The person row with photo, name and follow button is shared with the follower lists (`components/members/PeopleList.tsx`).

### BE-292 · Admin places: tick many, then tag นัดเจอได้ or publish (2026-11-07)
- **What changed:** the places list in admin has a tick box per row, เลือกทั้งหน้า, and a bar for ติดป้ายนัดเจอได้ / เอาป้ายออก / เผยแพร่ / ถอนเผยแพร่ on the ticked places (new action `set_meetup`; bars are skipped). A นัดเจอได้ filter, count and row label show which places can host trips. `bulkUpdateSpots` now also clears each changed place's own page cache.

### BE-291 · Report a question on a ตี้; host hides it from the page (2026-11-07)
- **What changed:** each question on a ตี้ page has รายงาน for signed-in members (target `question`, id `"{eventId}/{questionId}"`), and the host gets ซ่อนคำถามนี้ (the server already allowed it, the button was missing). Staff see question reports in รายงาน and "remove" hides the question. A report from a pair chat now reads "ข้อความในแชตคู่กับ …" for staff; pair chats already had รายงาน on each message.

### BE-290 · Trips: real attendance only, and short trips are called off (2026-11-07)
- **What changed:** to open a Spot Buddy trip a member must have been checked in by the host of someone else's ตี้, or had a photo moment at a ตี้ or อีเวนต์ passed by staff; an อีเวนต์ plan or meet-up group that is over no longer counts. A trip still short of 3 people 2 hours before the start becomes `status: 'cancelled'` and everyone in it is told (new notification `trip_cancelled`, migration 0031). `isEventEnded` treats `cancelled` as over; the ตี้ page says ทริปนี้ยกเลิกแล้ว and hides check-in and the after-ตี้ panel.
- **New:** `GET /api/cron/hourly` (needs `CRON_SECRET`), called hourly by GitHub Actions and daily by Vercel Cron. Put later timed jobs there.
- **What to do about it:** owner sets `CRON_SECRET` (a long random string) on Vercel Production and as a GitHub repository secret with the same value, and runs `npm run db:migrate` on live (0031) on merge.

### BE-289 · Rate limits shared by every server; TR-002 first cards (2026-11-07)
- **What changed:** `isRateLimited` in `lib/rateLimit.ts` is now async and counts in `app.rate_limits` (migration 0030), so every server shares one count; the 60 call sites `await` it. Admin login failures and the upload limit use it too (new `isOverRateLimit`, `clearRateLimit`). JSON mode still counts in memory; a database error lets the request through.
- **TR-002:** `PosterPhoto` also swaps in the stand-in when a server-rendered image failed before the page woke up.
- **What to do about it:** run `npm run db:migrate` on the live database (0030) when this reaches `main`. Until then every limited route logs an error and falls back to per-server counting.

### BE-288 · /spots: several districts, top 12 first, Bangkok แขวง counted under their เขต (owner 2026-11-07)
- **What changed:** `district` on `GET /api/spots/browse` takes a comma-separated list (`docs/API.md`); the sheet toggles districts, shows the 12 with most places then "ดูทั้งหมด", and puts one chip per district in the row. `data/bangkokDistricts.ts` maps about 150 Bangkok sub-districts to their district (dev data: 46 names became 24 districts); names starting with "จังหวัด" are dropped.
- **Known:** other provinces still have some ตำบล in the district field (e.g. ช่อแล, Chiang Mai); 18 Bangkok places have no district. Fix those in the place data.
- **Also:** reward cards in the promo row lay out from the top again (BE-286 made them buttons, which centred their content).

### BE-287 · /spots gets ตัวกรอง: district and "open now" (owner 2026-11-07)
- **What changed:** the /spots row is now ตัวกรอง · ใกล้ฉัน · เปิดอยู่ตอนนี้ · เข้าฟรี, like the other list pages. The sheet has all 77 provinces and the picked province's districts with counts. `GET /api/spots/browse` takes `district` and `open=now` and returns `districts` (`docs/API.md`); both filters also go in the page address.
- **Shared utility:** `parseSpotOpenStatus` moved from the place page to `lib/openHours.ts`, next to the new `isSpotOpenNow` (only a readable time or 24 hours counts as open). Districts are compared without "เขต" / "อำเภอ" / "อ." (`districtName` in `lib/spotBrowse.ts`).
- **Checked:** type check, and `isSpotOpenNow` against sample hours (incl. past midnight). Not walked in a browser.

### BE-286 · Promo row: lower, rewards on the landing too, reward popup on the same page (owner 2026-11-07)
- **What changed:** cards are 100 px (104 px on laptops; were 108 to 128). The landing shows rewards beside campaigns, like /challenges (reverses the 2026-11-04 "campaigns only" choice). A reward card and "แลกสิทธิ์ลุ้น" in a campaign open the reward popup on the page you are on instead of going to /rewards: `components/rewards/RewardDialog.tsx` (used by /rewards too), opened through `useCampaigns().openReward`. Campaign and reward popups are both 520 px wide.
- **Checked:** type check and lint only.

### BE-285 · No number on the phone menu's กิจกรรม tab (owner 2026-11-07)
- **What changed:** the orange count was the number of saved items, counted differently per page and read as "something new". `MobileNav` no longer takes `favoritesCount`.

### BE-284 · Moments: tall posts by default in plain words; cards stay still on hover (owner 2026-11-07)
- **What changed:** a new photo post starts 4:5; the buttons say แนวตั้ง / สี่เหลี่ยม (no ratios). Older posts stay square. On /moments a pointed-at photo only dims a little (no lift or tilt).

### BE-283 · Posters show whole on ตี้ and ชาเลนจ์ cards and the challenge page header (owner 2026-11-07)
- **What changed:** `MeetupTile`, `ChallengeTile` and the challenge page header use `PosterPhoto` like อีเวนต์ tiles: a tall poster shows whole over a blurred copy, a photo fills. A square poster in a 16:10 page header is still cropped.

### BE-282 · Create dialog: examples per step, card preview for the cover, icon tiles for categories (owner 2026-11-07)
- **What changed:** each step has a closed "ดูตัวอย่าง" panel (`components/CreateStepGuide.tsx`) with a filled example per field and where it shows. The cover comes right after the name, with upload first and a preview of the real card plus the best size (`components/CoverPreview.tsx`). Categories for ตี้, อีเวนต์, ชาเลนจ์ and สถานที่ are icon tiles; place types got icons (`placeTypeIcon`, ที่นั่งทำงาน and Co-working borrow the work icon).
- **Checked:** type check and lint; not seen in a browser (needs sign-in).


### BE-281 · Challenges done by plan: a calendar, daily stamps, sharing progress (owner 2026-11-07)
- **What changed:** a challenge can follow a plan instead of counting visits (`plan` on `ChallengeQuest`, stored in `details`; `docs/API.md`). Staff set it in the admin challenge form ("นับจากการไป" / "แผนรายวัน"): how many weeks (no 30-day limit, owner), then fixed weekdays with a task each, or "สัปดาห์ละ N ครั้ง" on any days, and how many misses are allowed (default one in seven). Each member's plan starts the day they join. `lib/social/questPlan.ts` holds the rules for both server and pages: stamp today or yesterday, once a day, only planned days (fixed) or up to N a week (flexible). Stamps live in `app.quest_stamps` (**migration 0029**, `lib/social/questStampStore.ts`); `progressOf` counts them, so finishing pays XP and badges like every challenge. Pages: the challenge page shows the plan, then once joined today's task with one stamp button, progress, the weeks as a calendar, "แชร์โมเมนต์วันนี้" (linked to the day's stamp) and "แชร์ความคืบหน้า" (a stamp-card picture opened in the post editor); My Hub's schedule starts with "วันนี้ตามแผน" (stamp in place); "กำลังทำอยู่" says "stamp แล้ว" for these.
- **What to do about it:** run `npm run db:migrate` on live when this reaches `main` (0029 already ran on the dev database). Stamps cannot be checked, so give plan challenges XP, not prizes that cost money. Checked on the dev database through the API and headless Chrome (fixed and flexible plans, duplicate and early stamps refused, a finish paid +40 XP, undo blocked after a finish); test challenges and member deleted.
- **Dev server note:** `stores.ts` changes were not picked up by the running `next dev` (an old module instance stayed in memory), so the stamp store lives in its own file.

### BE-280 · One simple filter row on the four list pages; campaigns and rewards swipe together on phones (owner 2026-11-07)
- **Filters:** /community, /events and /challenges share `components/discover/FilterControls.tsx`: "ตัวกรอง" (with how many are set) opens a sheet with every filter in groups and "ล้าง" / "ดู N …"; the one or two filters used most stay as quick chips (ตี้: สุดสัปดาห์นี้, ยังมีที่ว่าง · อีเวนต์: สุดสัปดาห์นี้, เข้าชมฟรี · ชาเลนจ์: ทำได้เลยตอนนี้, ของรางวัลแบรนด์, ที่ฉันทำอยู่); anything set in the sheet shows as a chip with ✕. Dates gained วันนี้ / พรุ่งนี้ / สุดสัปดาห์นี้ (same DD/MM/YYYY range as the date picker, which stays under "เลือกวันเอง") and read in words. /spots has only two filters, so it keeps them as chips without a sheet. On phones the row starts with the filters and ends with ♡ and the view switch. The challenge dropdowns (`ChallengeFilters.tsx`) and `FilterSelect` are gone; "ที่ฉันทำอยู่" moved from the phone header into the row, so the XP pill shows on phones again.
- **Campaigns and rewards:** on phones `PromoBoard` shows one row to swipe: campaigns, then rewards, then "ดูของรางวัลทั้งหมด" (rewards used to be hidden on phones). Tablets and computers unchanged.
- **Checked:** headless Chrome at 390 px and 1280 px, guest; sheet choices update the count live. Not yet walked signed in.

### BE-279 · Posting runs in the background with a progress card, like Instagram (owner 2026-11-07)
- **What changed:** tapping โพสต์ closes the form at once. `lib/moments/postingJobs.ts` (a small client store) runs `components/moments/publishMoment.ts` (the upload and post code moved out of `MomentComposer`) and `PostingProgress` (mounted in `app/layout.tsx`) shows a light card under the top bar: the post's picture, what is happening, one bar 0–100%, then "แชร์โมเมนต์แล้ว", or the reason and "ลองใหม่" / ✕. The card stays across pages; closing or reloading the page while a post uploads asks first (`beforeunload`), and a post that was not finished is lost, as on Instagram. `onPosted` still runs when the post is up, so the four hosts work as before; their own "แชร์โมเมนต์แล้ว" toasts went (the card says it) and the home feed no longer jumps to the top.
- **Known:** "ลองใหม่" starts again from the beginning, so files the failed try already uploaded stay in storage unused. Checked in headless Chrome on the dev database (progress 8 → 36 → 64 → 95% → done, a forced failure, then retry).

### BE-278 · Photo and clip posting closer to Instagram and TikTok (owner 2026-11-07)
- **Photos (`PhotoEditor`, `lib/media/photoEdit.ts`):** a post is square 1:1 or tall 4:5 (crop tool; every photo in the post shares it). Press and hold a thumbnail (or drag with a mouse) to reorder; the first photo is the cover. "ใช้กับทุกรูป" copies a filter or the light sliders to every photo. The place tool became **สติกเกอร์**: the place sticker plus line-icon stickers (lucide shapes drawn on the canvas, so no emoji per DESIGN_SYSTEM.md) and short word pills, with colour, size, drag and delete. `drawBase`/`drawOverlays`/`exportPhoto` now take width and height (or the ratio) instead of one size.
- **Clips (`ClipEditor`, replaces `ClipTrimmer`):** tools ช่วงคลิป / ปก (choose the cover frame) / ข้อความ / เสียง (post without sound). Text and "no sound" are baked in while the phone shrinks the clip (`compressClip(..., { texts, muted })`, Mediabunny `process` and `audio.discard`), so the post stays one plain MP4; those two tools show only where the device can shrink clips (`canShrinkClips`). The cover gets the same text drawn on it.
- **Clip size:** a clip of any size can be picked; only the chosen part uploads, shrunk to a few MB. The 50 MB limit now applies only when the device cannot shrink (the original then uploads) — before, a 60 MB phone clip was refused at once.
- **Display:** `MomentPhotos` uses `ratio` again, only to show 4:5 posts tall (`docs/API.md`). Older and sample posts stay square.
- **Checked:** headless Chrome at 390 px against the dev database: 4:5, reorder, apply-to-all, stickers, a posted 4:5 photo post (ratio 0.8 saved), a clip with cover at 4.5 s, baked text and no sound (uploaded MP4 has no sound track); test member and files deleted. Not yet on a real phone (long-press reorder, iPhone clip encoding). A browser recording with transparency (canvas WebM) cannot be shrunk; phone clips have none.

### BE-277 · Database egress: the full places read is shared across servers; member counts done in SQL (owner 2026-11-07)
- **Why:** Supabase egress 10.12 / 5 GB, about 250 MB a day since 3 Nov. `pg_stat_statements` on live (since 2026-10-25): the full `select * from app.places` (9.2 MB) ran 887 times, about 8 GB, most of the total. BE-230 put the public lists behind the shared cache (places list 16 loads, events 25 loads for 2,922 change checks since then), but the full read with drafts was still read whole by every new server. Whole-member reads (158 KB each) ran 1,587 times.
- **What changed:** the full places read (`includeDrafts`: admin screens, scrapers, a member's place suggestion) goes through the shared cache in parts of 250 rows (about 1.1 MB). My Hub "สิ่งที่ฉันส่ง" (`/api/spots?mine=1`) reads only that member's places (`SpotQueryParams.suggestedBy`). New member-repository methods `countFollowers`, `findByInviteCode`, `findInvitees`, `countCommunityInterest` replace reading every member for profile follower counts, invite links, friend rules and the onboarding counter. Same answers (checked against the old logic on the dev database), no API change.
- **What to do about it:** after the merge, watch Supabase Usage > Egress for a few days. Still whole-member reads, staff only: admin members/pulse/campaign stats, follower lists.

### BE-276 · Photos and clips move to Cloudflare R2; admin cleanup no longer deletes members' files (owner 2026-11-07)
- **Why:** Vercel Blob charges per GB downloaded and Hobby blocks Blob for 30 days past 10 GB (9.19 GB on 2026-11-07). R2 has no download charge.
- **What changed:** `lib/media/r2.ts` + `R2StorageAdapter`: storage is R2 when the `R2_*` settings exist, else Blob, else local disk. Clips go from the phone straight to R2 with a signed link that holds the size and type (`/api/upload/video` mode `r2`, `docs/API.md`). `lib/media/ownMedia.ts` is the one check for "our upload" (local, Blob, `media.chillwaa.com`, `media-dev.chillwaa.com`), used by moments, account cleanup and the image optimizer list. CSP allows `*.r2.cloudflarestorage.com`. New dependency `aws4fetch`. Separate bug fixed: the admin media page's "delete unused files" counted only event, place and challenge images, so it would have deleted every moment photo, clip and avatar; member folders are now never touched there.
- **What to do about it:** live switches to R2 on the deploy after merge (Vercel Production has the `R2_*` values). Then move old files: `npx vercel env pull .env.vercel --environment=production`, `node db/move-media-to-r2.mjs --switch`, delete `.env.vercel`; a week later `--delete-blob`. Each bucket's CORS must allow headers `content-type` and `cache-control`.

### BE-275 · Old clips shrunk; clip posts failed until 0028 ran (owner 2026-11-07)
- **Why:** after PR #72 reached `main`, every clip post failed with "โพสต์ไม่สำเร็จ" because live had no `video_preview_url` column yet; the owner ran `npm run db:migrate` on live. The 5 clips posted before BE-274 were still 9–29 MB, mostly `.mov`, with no preview.
- **What changed:** new `db/shrink-old-clips.mjs` (`npm run db:shrink-clips`, dev dependency `ffmpeg-static`) does what the phone does: cuts the chosen part, 720p H.264 MP4, plus the 3 s preview; it moves the post first and deletes the old file after. Run on live: 88 MB became 8.7 MB, all 5 have previews.
- **What to do about it:** Blob login for scripts: `npx vercel env pull .env.vercel --environment=production`, and the store's connection must allow Development for the OIDC token (turned off again afterwards). Never let `vercel link` or `env pull` write `VERCEL_OIDC_TOKEN` into `.env.local`: the local server would then use the live Blob store.

### BE-274 · Clips shrunk on the phone; feeds autoplay a small preview (owner 2026-11-07)
- **Why:** Vercel Blob Data Transfer reached 75% of the free 10 GB: every autoplay downloaded the whole original (20–40 MB `.mov`). Plan in stages: [VIDEO_PLAN.md](VIDEO_PLAN.md).
- **What changed:** `lib/media/clipCompress.ts` (Mediabunny 1.62.1, WebCodecs) cuts the chosen 15 s, makes it 720p H.264 MP4 and a 3 s 360p silent preview; a device that cannot falls back to the original. `video.previewUrl` is new (API.md). `ClipPlayer` takes `preview`: feeds and grids autoplay it and load the full file only on sound or opening; clips without one show their cover until tapped, and grid tiles show only the cover. Clip uploads per hour 10 → 20 (two files per clip).
- **What to do about it:** **run `npm run db:migrate` on live for `0028_moment_video_preview` before `main` gets this** (already run on dev). Until then clip posts with a preview fail on live; other posts keep saving. Not yet tried on a real phone.

### BE-273 · Admin: rewards page, community numbers, roles page, matches the site's design (owner 2026-11-06)
- **What changed:** new admin page "ของรางวัล & การแลก" (`RewardsView`, `GET /api/admin/rewards`, needs `members.manage`): redemptions per reward against its stock and the latest 100 with member names. The dashboard has a "ชุมชนวันนี้" section from `GET /api/admin/pulse` (`content.view`): new members, moments, running campaigns, and devices with notifications on (`pushStore.summary()` is new). "บทบาท & สิทธิ์" shows a per-page / per-permission table, how many staff hold each role, who created each account, and warns when someone has not logged in for 30 days. Resetting a staff password uses the new `askText` dialog in `components/admin/adminConfirm.tsx` instead of `window.prompt`. The sidebar shows `BrandLogo`, Moments has its pink (`#F43F5E`), admin buttons are `rounded-full` and inputs `rounded-2xl` like the site. Every admin page checked at 360 px.
- **What to do about it:** `stockCount` in `data/rewardsData.ts` is shown to members but the server does not stop a redeem past it; the rewards page marks a reward that went over. Use `askText` rather than `window.prompt` for new admin questions.

### BE-272 · Share picture drawn in code, new site tagline (owner 2026-11-06)
- **Why:** links shared in LINE showed `hero-bg-70.png`, the hero background (a square JPEG named .png, empty in the middle where the page puts its text), so the preview was two small groups of people.
- **What changed:** new `app/opengraph-image.tsx` draws a 1200×630 picture at build time: logo, "Chillwaa", "Social platform สำหรับคนชอบออกไปใช้ชีวิต" over the hero illustration. `DEFAULT_SHARE_IMAGE` in `lib/site.ts` and the root layout use `/opengraph-image`; pages with their own picture keep it. The fonts are in `assets/fonts/` (IBM Plex Sans Thai, OFL). Site title and share text: "Chillwaa | Social platform สำหรับคนชอบออกไปใช้ชีวิต" / "Social platform คนรุ่นใหม่ และคอมมูนิตี้ ที่ทำให้ทุกการใช้ชีวิตมีความหมาย".
- **What to do about it:** the image renderer cannot stack two marks on one Thai letter (ที่, ตี้ come out wrong), so keep such words out of text inside the picture.

### BE-271 · Admin: staff, audit log and master data survive; tighter permissions (owner 2026-11-06)
- **Why:** on Vercel these three lived in files under `/tmp`: a staff account or a master data edit vanished on the next deploy and differed from server to server, and the audit log kept nothing.
- **What changed:** staff accounts are read from `app.staff_accounts` on every admin request, so disabling someone or changing a role takes effect at once on every server. The audit log writes to `app.audit_log`, which the website can only add to. Master data is one document in `app.app_settings` on top of the bundled file. **`requireAdminApiAccess`, `getAdminActor`, `hasAdminCredentials` and the staff functions are now async: always `await` them.** Reading reports and moments in admin needs `community.review`, not `content.view` (they hold reporters' names and reported words). Resetting all events is refused in production. The rail screen and the `communityClubs`, `venueGroups`, `questCategories` lists are gone from admin and `/api/master`: no public page used them. The moods stay, the server still files events by them.
- **What to do about it:** **run `npm run db:migrate` on live for `0027_staff_created_by_note` with 0026, before `main` gets this.** Staff accounts made on live before now were never kept, so recreate them; the `ADMIN_PASSWORD` owner login is unchanged.

### BE-270 · Tester's TR-001 to TR-009, and My Hub's create button (owner 2026-11-06)
- **What changed:** see each report in `docs/TEST_REPORTS.md`. For other work to know: `joinBlocker` takes the event and can answer `'age'`; `PublicMember.birthYear` is new (sent only to the member themselves); the age rule lives in `lib/members/nightlife.ts`, used by the server and the forms. `EventDateList` has no `renderTile` and `ChallengeList` no strip: the list views are rows from the top. `withoutSampleHandle` (`lib/displayName.ts`) goes with the sample data. "งานที่จัด" in My Hub always shows, with "ตั้งตี้ใหม่", and open ตี้ are suggested to anyone with nothing coming up.

### BE-269 · Phone screens: quieter search, first tiles higher (owner 2026-11-06, from a tester's notes)
- **What changed:** the search button inside a search box is now quiet (`DESIGN_SYSTEM.md` updated), so it no longer competes with "สมัครฟรี". On phones, `DiscoverHeader` puts the create button, ♡ and the view switch at the start of the row of filters that scrolls, instead of a row of their own, and the three `/challenges` menus keep one row at 360 px. First tile at 360 px: `/community` 481 to 429, `/challenges` 613 to 569. With no campaign left to show, `/challenges` shows the rewards row on phones instead of nothing. A visitor sees a quiet "ไม่เจอที่ชอบ? ตั้งตี้เองเลย" under the `/community` list, which asks them to sign up; the create button stays members-only (owner 2026-10-25).

### BE-268 · Comments: reply, like, report, and the post's author can delete (owner 2026-11-05)
- **What changed:** new `components/moments/CommentThread.tsx`, used by the home feed and the moment page, so both behave the same. Replies go one level (a reply to a reply sits under the same comment). The author of a post can delete any comment on it, always after a confirm; a comment leaves with its replies, and their notices go too. New `like_comment` / `unlike_comment` actions and `parentId` on `comment`. A comment can be reported (`targetType: 'comment'`, `targetId: 'momentId/commentId'`) and staff can remove it from the reports screen. New notices `reply` and `comment_like`. A feed post's preview is its newest top comment, never a reply.
- **What to do about it:** **run `npm run db:migrate` on live for `0026_comment_replies_likes` BEFORE this reaches `main`.** Every moment read now uses the new column and table, so without it the feed and moment pages fail. It only adds things, so the current site keeps working once it has run. `db:migrate` reads `.env.local`, which is live; `npm run db:dev` is the one for the dev database.

### BE-267 · The database pages the moments feed (owner 2026-11-05)
- **Why:** every feed load read all matching posts with their photos, likes and comments, then kept 8 to 24; `/moments` did it a second time for its tab counts. Egress and connection time grew with every post.
- **What changed:** `momentRepository.feed()` applies every visibility rule in SQL and reads only one page; `typeCounts()` counts in SQL. A feed post now carries **only its newest comment** plus counts and the viewer's own liked/saved/reported answers; `GET /api/moments/[id]` still has every comment, and the home feed loads them when opened. New `?cursor=` with `pagination.nextCursor` for the newest order, so a new or deleted post between pages neither repeats nor skips one. `popular` still uses `page`. `pagination.totalCount` and `totalPages` come only without a cursor. `GET /api/moments/journey` is gone (nothing called it).
- **Checked:** on dev, all 13 filters as guest and 16 as member gave the same posts, order, counts and newest comment as before the change. At 30 posts it is about 50 ms slower on dev, which sits about 90 ms per query from the database; that cost stays flat as posts grow while the old read did not. Not measured on the live database.
- **Note:** a tag ends at any character outside ASCII letters and digits, `_` and the Thai block (depends on the database locale), so a tag running straight into another script could match wrongly.

### BE-266 · Service worker leaves sign-in alone; "no internet" only when true (owner 2026-11-05)
- **Why:** a friend on Chrome pressed Facebook sign-up and got our own `public/offline.html` ("ยังไม่มีอินเทอร์เน็ต"), retry included. Not reproduced: start and return both worked on the live site under the worker, with navigation preload on and off, using a headless desktop Chrome with an Android user agent. The cause on that device is unknown.
- **What changed:** `public/sw.js` no longer handles navigations under `/api/` (all social sign-in and email links), and a failed page load shows the offline page only when the browser reports it is offline; otherwise the browser's own error page names the error. Offline `/community` still shows the offline page (checked).
- **What to do about it:** after merge, ask the friend to try again. A device still holding the old worker gets the new one on its next visit. If it still fails, the browser's error code tells us where to look next.

### BE-265 · Fewer requests per member page (owner 2026-11-05)
- **What changed:** measured on a production build with the dev database. Home 7 to 5: the layout no longer asks for the session the page brought (`useMemberSession({ background: true })` waits 1.5 s), and the "first ตี้" line reads `earned === 0` from rewards instead of `GET /api/visits?mine=1&month=1`. That line used to show for anyone with no visits this month; now only for members who never earned XP. My Hub 13 to 10: no whole place catalog (saved places by id), and open ตี้ read once. Moving between pages no longer re-reads notifications and activity within a minute; `NotificationBell` focus refresh follows the same minute.
- **What to do about it:** the rest of a page's requests still leave together. Merging them into one request is the next step if the pool fills again.

### BE-264 · Lists load by themselves; phones and upright iPads open on the feed (owner 2026-11-05)
- **What changed:** `ShowMoreButton` loads 3 batches while scrolling, then waits for a press, which gives 3 more; filters start the count over. New `lib/useShownBatches.ts` returns a list to its length and place on the back button. The old page clamp in `/community` and `/events` is gone, and `/spots` asks for the batch after what is on screen. On member home below `lg`, the day line and "สวัสดี" are gone (the `h1` stays for screen readers); the first-ตี้ line stays. iPad on its side keeps them in the left column.

### BE-263 · Site held out of Google and AI crawlers until launch (owner 2026-11-05)
- **Why:** much of the content is still sample data, and connecting www.chillwaa.com would make it findable under the real brand.
- **What changed:** unless `SITE_INDEXING=on`, every response carries `X-Robots-Tag: noindex, nofollow`, the root metadata says noindex, `robots.txt` bars the AI crawlers it lists and names no sitemap, and the sitemap is empty. Link previews and members are not affected. `AGENTS.md` section 4 still applies to new pages.
- **What to do about it:** merge this before DNS points at the domain. At launch, after sample data is gone, set `SITE_INDEXING=on` on Production and redeploy.

### BE-262 · A host can move their own ตี้ (owner 2026-11-05)
- **What changed:** the host of a one-off ตี้ can change its date, time and place until it starts: `POST /api/events { action: "edit_tee" }` (`lib/social/editTee.ts`), link on the ตี้ page, `components/EditTeeDialog.tsx`. Title and description stay as staff saw them. People in the ตี้ and its waiting line get a `tee_changed` notice; a newer change replaces the older notice. Not for recurring ตี้, Spot Buddy trips or rejected ตี้. 10 real changes per hour.
- **What to do about it:** migration `0025_tee_changed_notice.sql` is already on live and dev (2026-11-05). Members with no year of birth stay blocked from bar ตี้ (owner confirmed). A ตี้ still waiting for review has no page, so it has no edit link yet.

### BE-261 · API checks, honest tickets, 20+ check (owner 2026-11-05)
- **What changed:** `POST /api/events` no longer takes server-owned fields from a member (rating, reviews, source, status and others), and a ตี้ always carries the member's own name and face. Links must be https. The event, quest, spot, report and upload POST routes reject other sites (`isSameOrigin`). Made-up `CCH-2026-…` ticket numbers and the pretend check-in are gone; the ticket shows the real code. Stock photos no longer stand in for a host without a photo. Joining or hosting a nightlife ตี้ needs a year of birth at 20 or more (`nightlifeAgeBlock`, `lib/members/activity.ts`).
- `JourneyBand.tsx` is gone: what onboarding needs is in `components/home/onboardingFirstStep.tsx`. Every page has a skip link (`components/SkipToContent.tsx`). Photo viewers, thumbnails and the place tiles go through the image optimizer.
- **What to do about it:** the age check uses the year the member gave, so it is a check, not proof. Members with no year of birth cannot join nightlife ตี้ until they give one.

### BE-260 · Staff decisions reach the member (owner 2026-11-05)
- **Why:** walking a ตี้ through to approval showed the review queue saved the decision and told nobody, because it writes to the database directly. Only the older ตี้ tab told the host.
- **What changed:** the queue now tells whoever sent the ตี้, อีเวนต์, place or challenge, with the staff reason in the preview. Approving or refusing a host request tells the member too (`notifyDecision` in `lib/social/notifications.ts`). The words no longer say ตี้ for everything. The trip form lost its red stars, shows Thai dates and uses the primary button. Admin popups use `askConfirm` (`components/admin/adminConfirm.tsx`), not the browser's `confirm`, and the admin sidebar numbers update right after a decision.
- **What to do about it:** a new way of deciding on member content must call `tellHost` or `notifyDecision`. No API shape changed.

### BE-259 · Design production pass, rounds 1 and 2 (owner 2026-11-05)
- **What changed:** 27 source files nothing imports are gone. `useDialogBehavior` in `components/auth/DialogShell.tsx` is the one Esc, focus and scroll-lock code; the join, date, safety, trip, pass, ticket, group chat and composer dialogs use it. Grids on detail pages have columns that can shrink, which fixed a page 18px wider than a 360 screen. `text-slate-400` on readable text became `slate-500` (about 200 lines). Meetup dark colour is `#C2410C`, moments dark is `#BE123C`. Admin text is 11px or larger, its search boxes have names and its selected chips are not black. `/spots` has `CollectionPage` JSON-LD for its first 30 places. No API or data shape changed.
- **What to do about it:** new dialogs use `DialogShell` or `useDialogBehavior`. Use `#C2410C` where `#D04A1B` was used. `next build` and `next start` read `.env.local`, the live database: pass the dev `DATABASE_URL` in the environment when testing locally.

### BE-258 · Install as an app + push notifications (owner 2026-11-04)
- **What changed:** the site is a PWA: `app/manifest.ts`, `public/icons/`, `public/sw.js` (push, tap, offline page), `public/offline.html`. Pages are never cached by the worker. Every notice saved through `lib/social/notifications.ts` is also pushed to the member's devices after the response (`lib/social/push.ts`, table `app.push_subscriptions`, migration 0024), with the bell's words and links and its block and closed-account rules. Likes on one moment collapse into one notification. Settings has a new card (`components/AppSettingsCard.tsx`); the bell links to it while push is off. Signing out takes the device off.
- **What to do about it:** add new notice types through the helpers in `notifications.ts` so they push too. Without `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` nothing is sent and the switch is hidden. Before merging to live: run 0024 on live and set both keys on Vercel; changing the keys later strands every device. Tests in headless Chrome only: real iPhone and Android, and LINE/Facebook login inside the installed iPhone app, are still untested (`docs/LAUNCH_CHECKLIST.md`).

### BE-257 · Moment photos sharper (owner 2026-11-04)
- **Why:** photos were squeezed twice: to 500 KB when sent, with quality down to 0.62 and size down to 800 px, then again at quality 75 when shown. Busy photos like food came out softer than calm ones.
- **What changed:** `encodeForUpload` aims for 1 MB, with a floor of quality 0.82 and 1080 px (a very busy photo goes over 1 MB, under the 5 MB upload limit). `MomentPhotos` asks the optimizer for quality 85, listed in `images.qualities` in `next.config.ts`. A new quality must be added there or the optimizer answers 400. This replaces the 500 KB in BE-236 and also covers other uploads through `compressImage`.
- **What to do about it:** new photos take more storage on Vercel Blob. Photos already stored get the better showing, not a better file.

### BE-256 · "สถานที่" tab on /moments counts a place typed by hand (owner 2026-11-04)
- **What changed:** a general moment with a real location text (`realPlace`, not the placeholders) is filed under "สถานที่" in the tab and its count. It stays `targetType: 'general'`, so XP and challenges are unchanged. A post with no place at all is only under "ทั้งหมด". `GET /api/moments?targetType=spot` without `targetId` means this tab.

### BE-255 · Campaigns on /rewards, rewards in My Hub, "แลกได้แล้ว" on the card (owner 2026-11-04)
- **What changed:** `/rewards` lists campaigns not yet joined, because draw prizes are not in the shop; its screen moved to `app/rewards/RewardsView.tsx` and `page.tsx` reads the campaigns on the server. The "XP · ชาเลนจ์ของฉัน" tab in My Hub shows the reward row in place of the banner to `/rewards`. `PromoBoard` takes `balance`: a reward the member's XP covers comes first with a "แลกได้แล้ว" badge. `rewardsOnPhone` keeps the row on phones. On `/rewards` the big prize card is gone, as draw prizes are reached through the campaign row (`?reward=ID` still opens one, and the wallet's next goal skips them), and the wallet is the soft `#FFF4D6`.

### BE-254 · Campaigns and rewards as one board on /challenges and the landing (owner 2026-11-04, after Trip.com)
- **What changed:** new `components/campaigns/PromoBoard.tsx`: the campaign on the left half, rewards as a sideways row on the right, and only rewards at full width when no campaign is left to show. Flat tints, no borders or headings, one card height (`CARD_HEIGHT`), photos as tilted stickers, and a small joke per reward category (`QUIPS`), after the owner asked for minimal and funny. Cards are 108 to 128 px tall, rewards are hidden on phones, and `CampaignStrip` on the member home has the same look. Quick repeated drags are covered in `useDragRail`: a press stops the glide and the snapping timer. It replaces the strip on `/challenges` and the visitor landing; the landing shows campaigns only (`withRewards={false}`, two at a time), because rewards belong where XP is earned. Member home keeps `CampaignShelf`. The drag code moved to `components/campaigns/useDragRail.ts`. The row lists `REWARD_SHOP_ITEMS` without draw entries and `campaignOnly`.

### BE-253 · Member home quieter: no month counts, campaigns as one folded line (owner 2026-11-04)
- **What changed:** the "ตี้ · ที่เที่ยว" counts under the greeting are gone on every size; the month stays in My Hub. Beside the feed, `CampaignShelf` with `layout="side"` is one folded line like `SideFolds`, closed at first; its line says what can be redeemed or how many are joined, and it opens to plain rows. On phones the swipe row in the feed is unchanged.

### BE-252 · Campaign row: the next card's edge instead of a count (owner 2026-11-04)
- **What changed:** Several in `CampaignShelf` show the next card's edge: phones swipe, a mouse drags or presses that edge (it brings the card in and does not open it). The "1/4" count, arrows and dots are gone. This replaces the look in BE-247; BE-254 has the colours now.

### BE-251 · Admin home no longer crashes (owner 2026-11-04)
- **Bug:** `/api/admin/reports` sent `counts.open` as an unresolved promise (`{}`) since the reports store became async, and the "ภาพรวมวันนี้" tile tried to show it, so `/admin` fell to the error page. Other modules opened by link kept working. The route now awaits the count.

### BE-250 · Prize draw: staff draw, announce, winner claims, public results (owner 2026-11-04)
- **What changed:** new admin page "จับรางวัล" (`?m=draws`, `components/admin/CampaignDrawsView.tsx`). Staff draw after the campaign ends and on or after the prize's `drawEntry.drawDate`; `lib/campaigns/draw.ts` picks with `crypto.randomInt` from active real members holding an entry. Nobody hears until staff press announce. Then the winner gets a `draw_won` notice and an email (a confirmed address, and only with `RESEND_API_KEY`), everyone else holding an entry gets `draw_result`, and `/campaigns/results` shows the entry code and a masked name. A winner has 7 days to press claim in the campaign popup; staff then check who they are and mark the prize given, or mark it forfeited and draw again (never the same person; the new winner is told at once).
- **Rules:** a draw needs both `members.manage` (contact details) and `content.edit`; in practice the owner role. A campaign with a winner cannot be deleted. Account deletion gives a prize not yet taken back and keeps only the entry code. An entry holder sees the campaign in My Hub until 30 days after the results, a winner until the prize is settled.
- **What to do about it:** before `main` gets this, run `npm run db:migrate` on live for `0023_campaign_winners` (required, with 0021 and 0022). A new prize still means a code change in `data/rewardsData.ts`: the catalog is not editable in admin.

### BE-249 · XP counts proof only (owner 2026-11-04)
- **What changed:** "มาที่นี่แล้ว" earns 0 XP (it keeps its rating and review), and a moment waiting for staff earns its 30 XP only once it passes. `VISIT_POINTS.marked` is 0; `progressOf` skips `pending` visits.
- **What to do about it:** balances are worked out on each read, so live members who marked places or have moments in the queue drop by that XP on the day this is merged, and a balance already spent stops at 0. Vouchers already redeemed stay. More XP now waits on the moment queue in "คิวตรวจ".

### BE-248 · Campaign popup wider, My Hub "ดูทั้งหมด" back past two (owner 2026-11-04)
- **What changed:** the popup is `size="lg"` with the picture beside the words from `sm`, step names are `text-xs`, and an ended campaign shows no steps. "กำลังทำอยู่" shows "ดูทั้งหมด N" only with more than 2 challenges (reverses part of BE-246, owner).

### BE-247 · Campaigns: sign up from a popup, several at once, My Hub list (owner 2026-11-04)
- **What changed:** pressing a campaign on the landing, member home or `/challenges` opens one popup (`components/campaigns/`). A guest is asked to sign up and is joined on the way back (`?campaign=ID` plus a wish in `sessionStorage`); a member joins there, which also starts its step challenges. Members can leave. Joined campaigns are in My Hub ("แคมเปญของฉัน"), and after the end only for a member holding an entry, until the draw. `/challenges` shows one campaign the visitor has not joined.
- **Look:** `CampaignStrip` is one calm cream line of a fixed height for every state; several become one long strip to swipe (`CampaignShelf`). `LaunchCampaignBanner` and the big yellow card are gone. Up to 10 show at once (`MAX_HOME_CAMPAIGNS`).
- **Rules from the E2E walk:** a draw entry needs a confirmed identity, every step of a running campaign done, and the XP; a campaign's prize closes with the campaign. Leaving a finished challenge keeps its XP and its campaign step (`questProgress`). See `docs/API.md`.
- **What to do about it:** before `main` gets this, run `npm run db:migrate` on live for `0021_campaign_members` (required) and `0022_launch_campaign_brand`. The three flight campaigns are in the development database only (`node db/seed-sample-campaigns.mjs`, `--remove` takes them out); their rewards are `campaignOnly`, so the shop never lists them.

### BE-246 · My Hub: no link beside "กำลังทำอยู่", empty month only without a plan (owner 2026-11-04)
- **What changed:** the "ชาเลนจ์ทั้งหมด" / "ดูทั้งหมด N" link is gone; "XP · ชาเลนจ์ของฉัน" under the title opens the same tab. "เดือนนี้ของฉัน" with nothing this month is hidden when the member has a next plan, and invites them to find a ตี้ only when they have none.

### BE-245 · My Hub: quiet "ถัดไปของคุณ", no links out for อีเวนต์, guests sign in (owner 2026-11-03)
- **What changed:** the row opens the event's page. อีเวนต์ have no button there and no "เส้นทาง" in the list: people reach the map through the event's page and stay on the site (owner). A ตี้ keeps "แชต" and "ดูบัตร" as outline buttons; "ดูบัตร" is solid black only on the day.
- **Guests:** `/myhub` goes to `/login?returnTo=...` and back. The old guest page is gone. Logging out on My Hub goes home.

### BE-244 · My Hub no longer flashes the guest page on refresh (owner 2026-11-03)
- **Bug:** until the session had loaded, `isLoggedIn` was false, so a signed-in member saw the sign-up invitation first. The same happened with "เริ่มที่ไหนดี" until their activity had loaded.
- **What changed:** a loading state shows until `isAuthReady`, and the schedule waits for `activity.isLoaded`. Elsewhere, use `isAuthReady && !isLoggedIn` to mean a guest.

### BE-243 · My Hub tabs reordered; no empty chips (owner 2026-11-03)
- **What changed:** tabs read กำลังจะมาถึง, ที่บันทึก, ที่ผ่านมา: what lies ahead first, history last. The "ชาเลนจ์" chip no longer shows at 0 in the list, where it looked like a wrong count next to the month view. Challenges under way stay in "กำลังทำอยู่" and return to the list in their last 7 days, as before.

### BE-242 · Every save button reaches the account (owner 2026-11-03)
- **Bug:** saving from a place page, a ตี้ page or a home page tile only wrote to the browser, and the account never got it. On a place page the sync even overwrote the save. An อีเวนต์ page's button joined the schedule instead, so it never showed under saved, while the tile's heart used the saved list.
- **What changed:** all of them call `activityActions.setSaved` and read `savedEventIds` / `savedSpotIds`; do not write saved lists to localStorage. An อีเวนต์ saved from now on is under "ที่บันทึก", not on the schedule; one already on the schedule stays there and its button removes it. Hearts stranded in `favorite_events` move to the account once. My Hub asks by id for a saved place missing from its catalog.
- **Removed:** the "โหมดพัฒนา" row in My Hub and `/api/dev/demo` (owner).

### BE-241 · My Hub: saved items are a tab of the schedule (owner 2026-11-03)
- **What changed:** "ที่บันทึก" joins "กำลังจะมาถึง" and "ที่ผ่านมา" in one line of tabs, like the profile, with ตี้, อีเวนต์ and places in one list. It replaces the left-column summary and the separate saved-places view (its search and vibe filters went with it). The "กำหนดการ" heading is gone. `/myhub#my-saved` and `?tab=scrapbook` open the tab.
- **Also fixed:** "ถัดไปของคุณ" and the list now order a shared day by start time; they used the date alone, so a 08:00 could come before a 07:30.

### BE-240 · Ended ตี้ and อีเวนต์ keep their colour; profile grid smaller (owner 2026-11-03)
- **What changed:** a ตี้ or อีเวนต์ that has ended is a good memory, not something broken, so its photo stays in colour with the "จบแล้ว" badge (`MeetupTile`, `FairTile`, `PosterPhoto` loses `dim`). My Hub: hosted and attended rows in colour; cancelled and missed stay faded. Ended challenges are faded only (`opacity-70`), since people browse them for what is still open. The profile's moment grid is 4 across from `sm` and shows 12 first.
- **What to do about it:** do not bring grayscale back for ended content. Admin's hidden moments keep it.

### BE-239 · Followers and following lists on your own profile (owner 2026-11-03)
- **What changed:** on your own profile the two numbers open `app/profile/FollowListDialog.tsx`, with a tab for each list. New `GET /api/members/follows`. "กำลังติดตาม" unfollows at once and the person stays as "ติดตาม", one tap to undo. Numbers on another member's profile stay plain, so who follows whom stays private until the owner decides otherwise.
- **To watch:** `followLists` reads all members, as `followerCount` does; both belong to the follower-count item in stage 7 of the checklist.

### BE-238 · "พาสปอร์ตของฉัน" removed for now (owner 2026-11-03)
- **Why:** the owner found no reason to keep it. It showed what "เหรียญของคุณ", the profile and `/challenges` already show, and its stamps were the same as badges.
- **What changed:** removed `components/home/StampPassport.tsx`, its section in My Hub and its link in the home page's "ของฉัน". Badges and challenge data are unchanged. The challenges named "พาสปอร์ตสุดสัปดาห์" keep their name.
- **What to do about it:** a real collect-the-places idea would be a new design, with stamps earned by going somewhere.

### BE-237 · Faces and profile photos through the optimizer (owner 2026-11-03)
- **What changed:** new `avatarImage(src, width = 128)` in `lib/optimizedImage.ts`, used wherever a member's face shows outside admin. The profile's moment grid and `VisitPanel` photos use `optimizedImage`. Use `avatarImage` for any new avatar.
- **Checked:** production build on the development database, phone size, cache off: `/profile?id=` 105 KB of images, against 7.43 MB for the same member on live (old code; live had one more image). No failed images or page errors. The development data has fewer members' photos than live, so `/moments` is not a like-for-like figure.

### BE-236 · Member photos: resized when shown, 500 KB limit when sent (owner 2026-11-03)
- **Why:** live moment photos reached 3.19 MB (mostly JPEG from Safari), and the feed loaded them whole because Vercel Blob was not an allowed optimizer host.
- **What changed:** our store's host is in `OPTIMIZED_REMOTE_IMAGES` (`lib/optimizedImage.ts`), by its exact name so the optimizer stays closed to other stores. A new store needs its host there. `MomentPhotos` gives Blob photos the same three widths as `/uploads`, and clip covers go through the optimizer. New `encodeForUpload` (`lib/media/compressor.ts`) is used by `exportPhoto` and `compressImage`: it lowers quality, then size down to 800 px, until a photo fits `MAX_PHOTO_BYTES`. `compressImage` used to send Safari's PNG when asked for WebP; it now sends JPEG.
- **Checked:** production build on the development database: a 1.07 MB live photo served at 58 KB (AVIF, 640) and 174 KB (JPEG, 828); another store gets `400`. Encoder in Chrome, and with Safari's WebP behaviour simulated: every case within 500 KB. Not yet tried on a real iPhone.
- **What to do about it:** watch Vercel's image optimization quota. Photos stored before this keep their size in storage. Other places that still load originals are listed in stage 7 of the checklist.

### BE-235 · Docs tidied before the production walk (owner 2026-11-03)
- **What changed:** this board started fresh; its 2,300 lines of history and `BACKEND_IMPLEMENTATION_LOG.md` moved to `docs/archive/`. `docs/LAUNCH_CHECKLIST.md` is rewritten by stage and checked against the code. `ARCHITECTURE.md` and `README.md` are rewritten to match the system as it is (Postgres, one builder, Chillwaa). `AGENTS.md` no longer calls the project a prototype, because the goal since 2026-11-03 is production.
- **What to do about it:** on `office-notebook`, an item added to the old board will conflict at the next merge. Keep the new `docs/HANDOFF.md` and add the item to it.
- **Egress check:** the live site runs BE-230 (`/api/spots` descriptions stop at 281 characters, no detail-only fields). Whether the shared cache saves downloads on Vercel is not proven yet; see stage 0 of the checklist.
