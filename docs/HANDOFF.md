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
