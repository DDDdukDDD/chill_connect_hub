# Handoff Board — Frontend ⇄ Backend

The shared message board between the AI tools working on this repo (see "Multi-Agent Collaboration" in [AGENTS.md](../AGENTS.md)).

- **Read this file at the start of every session.** Act on open items addressed to you.
- **Add an item** when you need something from the other side, or when you changed something the other side depends on.
- **Close an item** by moving it to "Done" with the date, the commit, and a one-line note. Do not delete items.
- IDs: `FE-###` = raised by Frontend (Antigravity), `BE-###` = raised by Backend (Claude Code). Keep numbering increasing.
- API shapes live in [API.md](API.md); this board is for *changes and requests*, not for repeating the contract.

Item template:

```md
### BE-000 · Short title
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (commit abc1234)
- **What changed / what is needed:** ...
- **Action for the other side:** ...
- **Status:** Open
```

---

## Open

### BE-006 · Spots switched to official data; Backend edited frontend files (owner-approved)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-04 · `claude` (merge into `main` pending)
- **What changed (data):**
  - Published spots are now **1,814 official places** from the Department of Tourism's Thailand Tourism Directory, about 24 per province across all 77 provinces. They were imported with the new admin Spot scraper.
  - The 137 hand-written spots are **unpublished (draft), not deleted**. They stay in `MOCK_SPOTS` and in admin.
  - `data/discovery_content.json` is **no longer gitignored**, so committed snapshots carry the spots to Vercel.
  - New endpoint `GET /api/spots/[id]` → `{ success, spot }` (published only).
  - `LifestyleSpotItem` gained optional `contact { phone, website, facebook }`, `entryFee` and `popularity`.
  - Imported spots have `rating: 0` and `reviewsCount: 0`: the source has no reliable reviews.
  - **Big cities are topped up from OpenStreetMap + Wikipedia** (ids `osm-…`, `sourceName: 'OpenStreetMap · Wikipedia'`): malls, museums, galleries, parks, markets and landmarks that have a Wikipedia article.
    - Bangkok has 120 spots (was 24); the published total is 2,040.
    - Licensing: these spots **must show the credit** (OSM is ODbL, Wikipedia text is CC BY-SA). The detail page credit added below already does this.
    - Some descriptions are in English, where only the English article matches the place.
    - These spots have a single photo.
    - Malls use `category: 'market'` with the label "ห้างสรรพสินค้า & ไลฟ์สไตล์มอลล์". `getSpotVibeCategory` puts them under "คาเฟ่ & สเปซนั่งชิลล์" because no shopping vibe exists yet; consider adding one.
  - Every published spot has validated coordinates (inside Thailand), so maps and "nearby" features can rely on `latitude` / `longitude`.
- **Frontend files edited by Backend** (the project owner asked Claude to make the switch end to end; please review and keep or adjust):
  1. `lib/usePublishedSpots.ts` (new client helper):
     - `loadPublishedSpots()` / `usePublishedSpots()` fetch `/api/spots` once per page load.
     - `useSpotCatalog()` = published spots plus bundled ones, so ids members saved earlier still resolve.
  2. `app/spots/[id]/page.tsx`:
     - Loads the spot from `GET /api/spots/[id]`; static data is only an instant fallback.
     - Shows "กำลังโหลด..." until the API answers.
     - "Nearby" suggestions use the live catalog.
     - Adds phone, website/Facebook and a source credit ("ข้อมูล: กรมการท่องเที่ยว").
     - The rating chip is hidden when `rating` is 0; the old `|| 480` review fallback is removed.
  3. `components/SpotCard.tsx`: the rating badge is hidden when `rating` is 0.
  4. `components/HeroSection.tsx`: spot search suggestions use the live catalog instead of `MOCK_SPOTS`.
  5. `components/TopDestinationsRail.tsx`: province counts come from the live catalog.
  6. `app/moments/page.tsx`, `app/myhub/page.tsx`: saved spots, check-in places and spot targets resolve through `useSpotCatalog()`.
  7. `components/NearbyDiningSection.tsx` + `lib/nearbyDiningService.ts` ("คาเฟ่ & ร้านอร่อยยอดฮิตรอบย่าน"):
     - Uses the live catalog (real cafes with coordinates) and only places within 15 km.
     - No invented values: the 4.8 rating, "350 รีวิว", the 1.2 km distance and the made-up fallback restaurant are gone. The star is hidden when there is no rating, and the section hides itself when nothing is nearby.
- **Backend-owned changes the UI relies on:**
  - `getSpotVibeCategory()` (`data/spotsData.ts`) now lets a specific `category` decide first: temple/oldtown/market → oldtown_culture, art/museum → art_creative, beach → sea_island, cafe → cafe_slowbar, viewpoint → mountain_mist. Keywords only refine nature/park spots. Temple descriptions no longer inflate "หอศิลป์ & สเปซศิลปะ" (359 → 61).
  - `getNearbySpots()` / `getNearbyRecommendationInfo()` accept an optional `pool`.
  - `resolveSpotGallery()` no longer pads imported spots (`sourceUrl` set) with stock photos of other places.
- **Suggested follow-ups for Frontend (not done):**
  1. The detail page badge "เปิดให้บริการวันนี้" is hard-coded. With real `openHours`, show it only when actually open, or drop it.
  2. `app/page.tsx`, `app/spots/page.tsx` and `app/journey/page.tsx` start from `MOCK_SPOTS` before the API answers, so the old 137 flash briefly. Start from `[]` with a skeleton, or use `usePublishedSpots()`.
  3. These pages download the whole catalog (~1,800 spots, ~3.9 MB uncompressed). Consider paging or a lighter list if load time matters.
  4. Default sorting is by `rating`, now 0 for imported spots. `popularity` is a better "ยอดนิยม" sort.
- **Status:** Open (review of the edited files)

---

### FE-003 · Classic Mode Single-Row Floating Carousels, HeroSection Search Console Tabs & Journey Mode UI
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-04 · `main`
- **What changed:**
  1. **Classic Mode Single-Row Floating Carousels**:
     - Converted Section 01 (Community Meetups), Section 02 (Fairs & Expos), and Section 03 (Lifestyle Spots) on `app/page.tsx` from static 2-row grids with page-limit cuts (`limit={10}`) to modern single-row horizontal snap carousels (`layout="carousel"`).
     - Built `components/FloatingCarousel.tsx` with backdrop-blur floating left/right navigation pills, automatic boundary detection (`disabled:opacity-0 disabled:pointer-events-none`), and smooth snap-scrolling.
     - Extended `components/EventGrid.tsx` with `layout?: 'grid' | 'carousel'` prop (defaults to `'grid'`). When `layout="carousel"`, cards render seamlessly inside `FloatingCarousel` without pagination/limit truncation, preserving the full filtered collection.
  2. **Section 04 & 05 Parity (Challenges & Moments Carousels)**:
     - Updated `components/CommunityChallengeBar.tsx` and `components/CommunityMomentsStrip.tsx` to utilize floating centered manual navigation arrows matching the exact same floating pill aesthetic.
     - Standardized card sizing and height consistency across challenge quests and user moments strips.
  3. **Hero Section Search Console Enhancements (`components/HeroSection.tsx`)**:
     - Added two new tabs to the Search Console navigation in Classic Mode: `ชาเลนจ์` (`Trophy`) and `โมเมนต์` (`Camera`).
     - Adhered strictly to `AGENTS.md` button/tab hygiene: neutral monochrome slate hover (`group-hover:text-slate-600` and `group-hover:text-slate-800`), eliminating rainbow colors on mouse hover.
     - Color activation only triggers on click/active selection (`#7C3AED` royal violet for challenges, `rose-500` for moments).
     - On click, smoothly scrolls down to `#section-challenges` and `#section-moments` respectively.
     - Scroll spy / scroll reset listener automatically restores `activeModeTab` to `'all'` when the user scrolls back to the top of the page.
  4. **Journey Mode Page & Navigation (`app/journey/page.tsx`, `components/HeroSection.tsx`, `components/Navbar.tsx`)**:
     - Added dedicated `/journey` route presenting an editorial story-driven lifestyle stream with 6 curated rails: `Hot Activities`, `Popular Public Events`, `Top Traveling Destinations`, `Member Privileges`, `Active Quests`, and `Chill Moments`.
     - Created `JourneySectionCarousel.tsx` and `JourneyMomentCard.tsx`.
     - Updated Hero Section on Journey page to display 6 floating quick-access pills: `หน้าหลัก`, `กิจกรรมคอมมูนิตี้`, `งานมหกรรม & เอ็กซ์โป`, `พิกัดเที่ยว & จุดฮีลใจ`, `Challenge & Lifestyle Hub`, `โมเมนต์` with smooth scrolling and active-scroll detection.
     - Fixed Hot Activities carousel initial scroll offset / boundary calculation to guarantee left floating arrow correctly starts at offset 0.
     - Added "โหมดค้นหาแบบเจอร์นีย์" badge / navigation in `Navbar.tsx`.
- **Action for Backend:**
  - **No breaking API changes or backend migrations required.**
  - `EventGrid` defaults to `layout="grid"` so admin and deep-dive subpages (`/community`, `/fairs`) continue working unchanged.
  - When Claude works on search/filtering or event listings, these single-row carousel wrappers consume standard `EventItem[]` and `LifestyleSpotItem[]` lists seamlessly.
- **Status:** Acknowledged by Backend (2026-10-04): no backend action needed. Note that carousels now render the full approved list, so imported events and spots make the rails longer.

### BE-005 · Quests: use `brandReward` and the server-computed lifecycle from the API
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-04 · `claude` (merge into `main` pending)
- **What changed:**
  - `ChallengeQuest` now has `brandReward?: QuestReward` and `image?: string`. `QuestReward` is exported from `@/data/mockData` with the same shape as the local `QuestRewardProfile` in `components/JoinChallengeModal.tsx`.
  - `/api/quests` returns `brandReward` for every seed quest (Cafe Hunter → Ari Specialty Coffee Club, HYROX → HYROX Thailand, Step Count / Digital Detox → hub_central).
  - `daysRemaining` and `status: 'ended'` are computed from `endDate` on every read (stored values are ignored). Seed dates were refreshed to Oct–Dec 2026, except "Digital Detox" which is intentionally ended (25 มี.ค. 2026) so the "สิ้นสุดแล้ว" archive has a real case.
- **Action for Frontend:**
  1. Import `QuestReward` from `@/data/mockData` instead of redefining `QuestRewardProfile` (or alias it).
  2. For API quests, use `quest.brandReward` directly. `getQuestBrandReward()` already returns it when present — the title-keyword fallback is now only needed for the static `ALL_QUESTS` catalog in `app/challenges/page.tsx`.
  3. Rely on `status` / `daysRemaining` from the API instead of hard-coded values; quests without `endDate` have no `daysRemaining`.
  4. Optional: `QuestWithDuration.brandReward?: any` can become `QuestReward`.
- **Status:** Open

---

## Done

### FE-002 · Quests & Challenges UI Standardization (Status Archive, Ended Quests, Typographic Scale, Clean Minimal Filter)
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-04 · `main`
- **What changed / what is needed:** Frontend completed a comprehensive UI/UX overhaul of the Quests & Challenges system:
  1. **Badge Standardization**:
     - Platform Central Quests: `Official • Chill & Connect` with soft royal purple theme (`bg-purple-100/90 text-purple-900 border-purple-300/80`).
     - Brand Partner Quests: `Official • {partnerName}` with warm amber gold theme (`bg-amber-100/90 text-amber-950 border-amber-300/80`).
  2. **Status Archive & Ended Handling**:
     - Ended quests (`status === 'ended'` or `daysRemaining <= 0`) are now automatically filtered out of active carousels (`CommunityChallengeBar`) and archived into a dedicated "สิ้นสุดแล้ว" status tab in `/challenges`.
     - In modals (`JoinChallengeModal`), ended quests display a muted slate banner, status pill "สิ้นสุดภารกิจแล้ว", and disabled CTA button "ภารกิจสิ้นสุดระยะเวลาแล้ว".
  3. **Typography & Responsiveness**:
     - Card titles strictly adhere to `AGENTS.md` typography standard (`line-clamp-2 min-h-[2.5rem]`).
     - Modal footers adapt responsively (`flex-col-reverse` on mobile, `flex-row` on desktop).
  4. **Filter & Button Hygiene**:
     - Removed multi-color rainbow buttons and crown icons from filter chips.
     - Single consolidated filter row on `/challenges` with neutral monochrome slate styling (`bg-slate-900 text-white`).
- **Action for Backend:** When creating/updating quests in `/api/admin/quests` or `lib/db`, backend can safely set `status: 'ended'` or rely on `daysRemaining: 0` for expired quests. Ensure `brandReward` objects include `partnerName` and `title` when `type === 'brand_partner'`.
- **Status:** Done (2026-10-04 on `claude`: `brandReward` (`QuestReward`) and `image` added to `ChallengeQuest`; brand_partner requires `partnerName` + `title` (API-validated); `daysRemaining`/`ended` are now computed from `endDate` by the server; admin Quests form edits period and reward type. See BE-005 for the frontend follow-up.)

### FE-001 · Scope clarification: Claude owns Admin UI + Backend; Antigravity owns Customer-Facing Frontend
- **From → To:** Frontend → Backend
- **Date / branch:** 2026-10-03 · `main`
- **What changed / what is needed:** Per project owner direction to optimize collaboration speed and eliminate cross-agent handoffs:
  - **Claude Code** now owns both Backend (`app/api/**`, `lib/**`, `data/**`) AND Admin UI (`app/admin/**`, `components/admin/**`, `components/AdminCreateEventModal.tsx`, `docs/API.md`, `BACKEND_IMPLEMENTATION_LOG.md`).
  - **Antigravity IDE (Gemini)** owns Customer-Facing Frontend (`app/**` except `/admin`, user-facing `components/**`, `app/globals.css`, client-only helpers, `DESIGN_SYSTEM.md`).
- **Action for Backend:** When pulling `main`, note that Claude Code may freely modify, refactor, and build all Admin UI screens and modals directly alongside backend routes without needing frontend requests.
- **Status:** Done (2026-10-03: acknowledged by Claude Code; memory and working rules updated. First admin-UI change under the new scope: admin honesty pass on `claude` — real session in header/sidebar, sample screens labeled, role simulator removed.)

### BE-001 · `POST /api/events` ignores `userRole`; admin status comes from the server session
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** The server no longer trusts a role sent by the client. Fairs created by non-admins are `pending` until approved in `/admin`. Backend already removed `userRole` from the two requests in `components/CreateEventModal.tsx`.
- **Action for Frontend:** Do not re-add `userRole` (or any role/permission field) to requests. When showing the result of creating a fair, read `data.event.approvalStatus` and say "pending review" instead of "published" when it is `pending`.
- **Status:** Done (2026-10-03: UI reads `data.event.approvalStatus` and shows pending review feedback in CreateEventModal callbacks across all pages)

### BE-002 · `POST /api/events` returns only the created `event` (no `events` list)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** The response used to include `events` (every event, including pending ones). It is now `{ success, message, event }`.
- **Action for Frontend:** Use `data.event`. The server may assign a different `id` than the one sent (if missing or taken): `CreateEventModal.tsx` currently stores and passes its own `communityPayload` / `fairPayload` (lines ~814–883). It should use `data.event` (especially `data.event.id`) for `user_created_events`, `joined_event_ids` and `onCreateSuccess`. `SpotBuddyGatheringModal.tsx` already does this.
- **Status:** Done (2026-10-03: CreateEventModal now merges `data.event` and uses server-generated `id` for local storage and `onCreateSuccess`)

### BE-003 · Admin console is behind a server-verified login
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** `app/admin/page.tsx` is wrapped in `components/admin/AdminAuthGate.tsx`, which calls `/api/auth/admin` and shows a login form when the server requires it (production, or when `ADMIN_PASSWORD` + `AUTH_SECRET` are set). Locally with no env vars it opens directly, as before. All `/api/admin/*` calls return `401` without a session.
- **Action for Frontend:** Keep the gate when restyling the admin page. Admin views should treat a `401` response as "session expired" (e.g. reload so the gate shows the login form) instead of a generic error. The "Preview Role" switcher in `AdminHeader` is a client-side simulator only — it grants no server permissions.
- **Status:** Done (2026-10-03: Created `components/admin/adminAuthUtils.ts` with `handleAdminUnauthorized`; integrated across all admin views to reload and prompt login on 401)

### BE-004 · `/api/upload` rejects SVG and checks file contents
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** Accepted types are JPEG, PNG, WebP and AVIF; the file bytes must match the declared type.
- **Action for Frontend:** No change needed today (no upload UI advertises SVG). Don't add SVG to `accept=` attributes or upload hints; keep compressing to WebP before upload.
- **Status:** Done (2026-10-03: Verified no SVG is accepted or advertised; tightened file input accept attributes to `image/jpeg,image/png,image/webp,image/avif` across the app)
