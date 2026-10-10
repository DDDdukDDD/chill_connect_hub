# Backend Implementation Log

Last updated: 2026-10-09 (Google-rated nearby dining; older entries archived)

## Working Scope

The Discovery & Content work includes backend contracts and the admin control plane. Keep changes scoped to admin operations and their APIs; avoid changing the public discovery experience unless explicitly requested.

## Current Backend Shape

- `app/api/events/route.ts` serves event and fair reads and handles event creation/join actions.
- `app/api/spots/route.ts` serves paginated spot reads.
- `app/api/admin/*` contains admin-oriented routes for events, spots, scraping, cache, and media.
- `lib/db/repository.ts` defines repository contracts for events, spots, and quests.
- `lib/db/index.ts` currently always creates `JsonFileAdapter`; PostgreSQL is not wired in.
- `JsonFileAdapter` seeds events, spots, and quests from local mock datasets. Events and approval state use the existing event JSON file. Spots, quests, and quest progress use `data/discovery_content.json` locally, or instance-local `/tmp/discovery_content.json` when serverless flags are present.
- Events have a single owner: `JsonFileAdapter` holds `events` and `participants` in `data/chill_database.json`. `lib/eventsStore.ts` is a thin admin layer over the repository (`db.listAllEvents`, `createEvents`, `bulkUpdateEvents`, `replaceAllEvents`) and never writes events to disk itself.
- `lib/db/databaseFile.ts` owns file I/O for `chill_database.json`. All writers use `updateDatabase(mutator)`, which runs a serialized read-modify-write so each store only changes its own keys (events/participants, sources, autoPublish).
- `filterEvents` defaults to `approvalStatus: 'approved'`; pass `'all'` explicitly for admin reads.
- Stored events are normalized once on adapter init (`lib/eventNormalization.ts`): official URL fixes, pillar identity by id prefix, and re-adding any missing seed events from `MOCK_EVENTS`.
- Admin authorization (`lib/adminApiAuth.ts`) accepts either `Authorization: Bearer $ADMIN_API_TOKEN` or a signed admin session cookie (`lib/adminSession.ts`, HMAC-SHA256, httpOnly, SameSite=Strict, 8h). Cookie-authenticated writes must also pass a same-origin check. Every `/api/admin/*` route is guarded, including cache and media.
- Env vars: `ADMIN_PASSWORD` (login form), `AUTH_SECRET` (>= 32 chars, signs sessions), and optionally `ADMIN_API_TOKEN` (scripts/integrations). Local development with none of them set bypasses the guard. In production with none set, admin routes return 503.
- `/api/auth/admin`: GET returns session state, POST `{ password }` logs in (5 failed attempts per IP per 15 minutes, tracked per process), DELETE logs out. `/admin` is wrapped in `AdminAuthGate`, which shows the login form until the server confirms a session.
- `POST /api/events` determines admin status only from server-verified credentials; a client-sent `userRole` is ignored.

## Implemented In This Handoff

Entries up to 2026-10-04 (FE-002) and the 2026-10-03 verification notes are in [docs/archive/backend-log-2026-10-03.md](docs/archive/backend-log-2026-10-03.md).

- Scraper sources (2026-10-04): sources without Schema.org JSON-LD are read by site adapters (`lib/scrapers/*`, registry in `siteAdapters.ts`). Adapters are matched on the configured source URL, and all their requests go through the scraper's guarded fetch (SSRF guard, robots.txt, blocked platforms, size and time limits). Ended events are skipped. Live test results (scanned → imported; every rerun gave only duplicates):
  - **QSNCC** `qsncc.com/en/whats-on/event-calendar`: Prismic `calendar_event` docs in `__NEXT_DATA__`, first calendar page only. 9 → 9.
  - **IMPACT** `impact.co.th/th/visitors/event-calendar`: server-rendered event cards with Thai Buddhist-era date ranges. 22 → 22.
  - **BITEC** `bitec.co.th/whats-on`: WordPress events embedded in the Next.js RSC flight payload. 12 → 12.
  - **ThaiRun** `race.thai.run/`: the site's own GraphQL `listEvents` on `api.race.thai.run`. This API is undocumented. Only races open for registration are imported; virtual runs and races abroad (no Thai province) are skipped. English provinces are mapped to Thai (`thaiProvinces.ts`). 67 → 50.
  - **Visit Bangkok (BMA)** `visit.bangkok.go.th/th/festival-calendar`: the page and its CMS API need a key, so the adapter reads the CMS's public RSS feed (20 latest). Dates are parsed from the text (`parseThaiDateRange`), and items without a date are skipped because `pubDate` is only the listing date. The venue is taken only from an explicit `สถานที่:` / 📍 line. 20 → 15.
- Scraped ISO dates are converted to the Thai display format (`lib/scrapers/dates.ts`) before deduplication and storage. Previously, ISO dates from JSON-LD sources were stored as-is, but `lib/dateUtils` cannot parse them and dedup compared them against Thai dates.
- Spot scraper (2026-10-04): `lib/scrapers/tourismDirectory.ts` imports spots from the Department of Tourism's Thailand Tourism Directory, one province per run (`POST /api/admin/scrape {targetType:'spots', province, limit}`). It uses the site's own keyless search API (`api.thailandtourismdirectory.go.th/api/v2/maininfo/search`) to list attractions (MainTypeID 1) and keyword-matched cafes (MainTypeID 6), keeps the most viewed ones, and reads each place page's `__NEXT_DATA__`.
  - **Mapped fields:** Thai name, description, district, coordinates, up to 8 photos, opening hours (grouped days, Bangkok time), entry fee, travel modes and remarks, facilities, activities, and contacts.
  - **Categories:** rules on the place name first, then on the source types.
  - **`bestTime`:** generic advice per category, because the source has no such field.
  - **Import flow:** spots are imported as drafts and deduplicated by id, source URL, and title+province.
  - **Test results:** Nan 34, Bangkok 36, Chiang Mai 35, Lampang 12 (limit 10), each in about 4–6 s.
  - **Coverage gaps:** Bangkok has only ~51 attractions in the source, temple-heavy; cafes are thin (≤ ~10 per province). TAT Data API needs a key (declined); OSM and Wikidata were too sparse in Thailand; Google Places forbids storing its content.
- `GET /api/spots/[id]` returns one published spot (needed by the detail page, see BE-006). `LifestyleSpotItem` gained optional `contact`, `entryFee`, and `popularity`.
- Admin Scraper Engine, Spots tab: a province picker and a per-province limit. The scan stays disabled until a province is chosen.
- Spot switch (2026-10-04, owner request): all 77 provinces imported at limit 20, 1,814 spots (about 24 per province incl. cafes, 2–3 s each). They are published with `set_publication {scope:'tourism_directory'}`; the 137 curated spots are drafts (`scope:'curated'`), not deleted.
  - Imports are written once per run (`db.createSpots`, single file write). `bulkUpdateSpots` accepts partial updates.
  - The source `Rating` (67 of 1,814, no vote count) is not imported.
  - `getSpotVibeCategory` maps specific categories first. Final vibe counts: oldtown 816, nature 418, cafe 294, sea 132, mountain 71, art 61, wellness 22.
  - `data/discovery_content.json` (7.3 MB) is tracked in git so snapshots reach Vercel.
  - The owner approved Backend editing the frontend files listed in BE-006.
- OSM + Wikidata spot source (2026-10-04): `lib/scrapers/osmWikidata.ts` adds notable big-city places from OpenStreetMap: malls, museums, galleries, parks, markets, zoos, aquariums and landmarks.
  - **Selection:** one Overpass area query per province (`TH-xx`, `provinceIsoCode`), keeping only objects tagged with a Wikidata id.
  - **Enrichment:** Wikidata supplies labels, the photo (P18), the district (P131) and the website (P856); the Wikipedia page summary supplies the description and photo.
  - **Quality checks:** the OSM and Wikidata names must overlap, and the Wikipedia article title must match the place (sitelinks can redirect, e.g. Sea Life → Siam Paragon). Records without a photo or description, or with coordinates outside Thailand, are skipped.
  - **Results:** Bangkok 24 → 120 spots; big cities +2 to +14 each. Published total is 2,040. Surat Thani's OSM run hit Overpass 504; rerun from admin.
  - **robots.txt exemption (owner-approved):** Overpass `/api/interpreter`, Wikidata `/w/api.php` and Wikipedia `/api/rest_v1/page/summary/` disallow crawlers in robots.txt but are public APIs. They are listed in `DOCUMENTED_PUBLIC_APIS` in `structuredDataScraper.ts`, use a descriptive User-Agent, and requests are sequential; robots.txt still applies to every other URL. Overpass requests get a 70 s timeout.
  - **Credit:** OSM (ODbL) and Wikipedia (CC BY-SA) content is credited via `sourceName` / `sourceUrl`.
- `isThaiCoordinate`: imports require coordinates inside Thailand and latitude ≠ longitude. Two Tourism Directory records with broken coordinates were unpublished.
- Event link bug fixed (2026-10-04): on every load, `normalizeEvent` replaced the detail-page link of any event at QSNCC or BITEC with a venue-wide page (BITEC: the retired `/gallery`), and could copy a fake seed URL onto events with a similar title. It now fills an official URL only for events that have none. The 21 damaged links (QSNCC 9, BITEC 12) were recovered from the id hash (`live-agg-` + sha256(sourceUrl)) and restored; a restart confirms they stay. The BITEC adapter still fails because the page no longer embeds its event list.
- Nearby dining (`lib/nearbyDiningService.ts`) uses the live catalog within 15 km and no longer invents ratings, review counts, distances or a fallback restaurant.
- Tourism Directory opening hours: a closed day (00:00-00:00) now reads "ปิด". Name rules: "หอศิลป" (without the final mark) → art; "พลาซ่า / มอลล์ / ห้างสรรพสินค้า" → market.
- Content policy (`lib/scrapers/sourcePolicy.ts`): Meetup, Facebook, and aggregators that re-list their events (allevents.in, dev.events) are blocked. `POST /api/admin/sources` returns 400 for these hosts, fetches refuse them on every redirect hop, and JSON-LD items whose URL points to them are dropped. Community meetups come from our own members, so we never copy another platform's community content.

- Admin restructure (2026-10-06, owner request):
  - **Menu:** grouped by workflow (`components/admin/AdminSidebar.tsx`: `SIDEBAR_GROUPS`, `MODULE_PERMISSIONS`). Header breadcrumbs derive from it. The active state is slate, and pillar colors appear only as dots and badges.
  - **Removed screens:** the sample-only `RbacUsersView` and `DbBackupView`.
  - **Review queue:**
    - `GET/POST /api/admin/review` + `ReviewQueueView`.
    - Covers pending events and draft spots from scrapers or members; the retired curated `MOCK_SPOTS` drafts and rejected spots are excluded.
    - Quality checks come from `lib/contentQuality.ts`.
    - The preview renders the real frontend components with clicks swallowed.
    - Supports bulk approve/reject, a reject reason, and the keys J/K/A/R.
    - A rejected spot stays a draft and gets `reviewRejectedAt`.
  - **Overview:** `AdminDashboardView` now shows to-dos, data health from `?health=1` and recent audit entries. It no longer downloads the full spot list (~3.9 MB).
  - **Staff and roles:**
    - Code: `lib/permissions.ts` (role matrix) and `lib/staffStore.ts`.
    - Storage: `data/staff_accounts.json`, gitignored, with scrypt hashes.
    - Each session carries `{sub, ver}`. Staff sessions are re-checked against the store on every request, so disabling an account, changing its role, resetting its password or forcing logout revokes it at once.
    - `requireAdminApiAccess(request, permission)` returns 401 or 403.
    - Moderators may decide community items only.
  - **Audit:** `lib/auditLog.ts` writes `data/audit_log.json` (gitignored, newest first, capped at 2,000). Every admin write and every login/logout is recorded.
  - **UI:** login with email + password, `StaffManagerView` (with a read-only permission matrix), `AuditLogView`. Shared `PillarBadge`, `AdminStatusChip` and `AdminEmptyState` live in `AdminUI.tsx`.
  - **Verification:**
    - 30/30 API checks passed on a throwaway server with test credentials: 401/403 matrix, revocation, cross-origin write blocked, no hashes in responses, audit entries.
    - Reject flow: the queue went from 2 to 1, the spot stays hidden publicly, and the action was audited.
    - Puppeteer, desktop and 390px: no console errors, no horizontal overflow.
    - Test data and accounts were removed afterwards.
  - **Limits:** on Vercel the staff and audit files live in `/tmp` and do not persist, so only the env owner login is reliable there. Invitations are not emailed; the owner sets a temporary password.

- Nearby dining with Google ratings (2026-10-09, owner request: only places above 4.5★):
  - **Why Google:** the Tourism Directory has 13,267 restaurants with coordinates, but its `Rating` was 0 on all 40 of the most viewed Bangkok restaurants, and it has no review counts. Google Places is the source of real ratings the owner chose.
  - **Implementation:** `lib/googlePlaces.ts` is server-only.
    - Calls Nearby Search (New) within 3 km, `rankPreference: POPULARITY`, with a minimal field mask.
    - Keeps rating ≥ 4.5 with userRatingCount ≥ 50, and links a result to our own spot when the name matches within 300 m.
  - **Google terms:** only the place id is stored. Responses are `no-store`, the "Google Maps" attribution is returned, and no photos are requested (separate SKU, and the URL needs the key).
  - **Budget:** a monthly counter in `data/google_places_usage.json` (gitignored) is capped by `GOOGLE_PLACES_MONTHLY_LIMIT` (default 900, below the 1,000 free Enterprise calls).
  - **Fixed in `lib/nearbyDiningService.ts`:**
    - The browser no longer calls Google: the key was in photo URLs, and a `NEXT_PUBLIC_` key fallback was accepted.
    - Invented 4.7 / 250 defaults are gone.
    - The fake `CURATED_REAL_DINING` list is removed.
    - Without Google, the route falls back to nearby catalog cafes with no ratings.
  - **Verification:**
    - Mocked Google response: kept 4.7/820 and 4.5/50; dropped 4.2, a 5.0 with 7 reviews, and an unrated place.
    - The key appears only in the request header.
    - The cap stopped calls after the limit.
    - The live route without a key returned `source: catalog`, 6 items, none with invented ratings.
    - Live Google test (6 calls): Siam and Chiang Mai each returned 6 real food places rated 4.5–4.9 (735–10,719 reviews), and a rural Nan spot returned none. Primary-type filtering (`includedPrimaryTypes`) was added because `includedTypes: restaurant` returned hotels and malls. The key is not in the client bundle.
- `lib/usePublishedSpots.ts`: a failed load no longer pins `cachedSpots` to MOCK_SPOTS, so the next mount retries (BE-009).

- Sample meetups roll forward (2026-10-09, owner choice "เลื่อนวันอัตโนมัติอย่างเดียว"):
  - **Problem:** 43 of 50 sample community meetups had passed their fixed dates and were hidden.
  - **Fix:** `lib/sampleEventDates.ts` is applied in `jsonAdapter.findEvents`, `findEventById` and `listAllEvents`. It moves ended `MOCK_EVENTS` community dates forward by whole cycles of 77 days. The cycle is the community samples' span rounded up to whole weeks; fairs, which run into 2027, are excluded from the span.
  - **Verification:** 50/50 visible, spread over Oct–Dec 2026, with weekdays kept. Member and scraped events are untouched, the stored file is unchanged, and the fair total is still 116.

- Admin phase 2, pillar content pages (2026-10-09):
  - **Shared drawer** (`components/admin/AdminDrawer.tsx`): slide-over editor with the form on the left and a live preview on the right, plus `FormSection`, `Field`, `QualityPanel`, `PreviewModeToggle`, `InertPreview` and a placeholder image.
  - **`SpotEditorDrawer`** (create and edit) replaces the old modals in `app/admin/page.tsx`.
    - Sections follow the detail page: main info, location (Thailand coordinate check plus a map link), hours and fees, photos, content, contact, source credit.
    - The preview uses the real `SpotCard` and `SpotListItem`, and the quality checks run live.
    - Publishing is disabled while a required check fails.
    - Labels come from `lib/spotCategories.ts`.
  - **`EventEditorDrawer`** for community and fairs: create (queued or published) and edit.
    - The preview is `EventGrid` forced to one column.
    - Community has online or physical mode, meeting point and 2–15 people. Fairs have the official organizer, venue and direct official link.
  - **Lists:**
    - Shared `AdminStatusChip` (events show "สิ้นสุด" when ended) and a quality % per row.
    - Thai page titles; create and edit only for `content.edit`.
    - The spot category filter now uses the 7 vibes: it previously compared vibe ids with stored categories and always returned 0.
  - **Server:**
    - Spot create no longer invents data: no 4.8 rating, no emoji labels and tags, no stock photo, no Bangkok fallback coordinates.
    - Coordinates must be inside Thailand on create and update; `contact` and `entryFee` are editable.
    - Events `create` and `update_fields` follow the platform form rules, and `update_fields` has a field whitelist, so approval cannot be changed outside the review flow.
    - `isThaiCoordinate` moved to `lib/contentQuality.ts` so it can run in the browser.
    - Tourism Directory: a "สวนสาธารณะ" name now beats the beach rule. Two published parks (เกาะลำพู, หนองบวกหาด) are still stored as `beach` and can be fixed in the editor.
  - **Verification:**
    - API 14/14: vibe filter, coordinate rejection, no invented spot data, map link from coordinates, contact/entryFee, fair without organizer, community with 30 people, update_fields cannot approve, title validation, cleanup.
    - Puppeteer: live preview follows typing, coordinate error shown, preview clicks do not navigate, Esc closes, publish disabled until checks pass, fair and community editors, 390px with no overflow, no console errors.

- Admin phase 3, coverage, map and run history (2026-10-10):
  - **New module "ความครอบคลุม & แผนที่"** (`CoverageView`), backed by `GET /api/admin/coverage`.
    - A 77 × 7 heatmap of published spots per province and vibe. It uses a binned sequential blue scale, with 0 shown in neutral gray so gaps stand out.
    - Every cell has its number, a hover tooltip and a legend. Rows can be sorted by fewest spots, most gaps, most spots or name.
    - Clicking a cell opens the spots list filtered to that province and vibe (`?m=spots&province=&vibe=`). "ดึงเพิ่ม" opens the scraper with the province preselected.
  - **Map tab** (`SpotsMapPanel`):
    - Leaflet + OSM tiles on a canvas renderer showing all 2,179 points.
    - Validated categorical pair: blue is published, orange is draft. The legend doubles as a filter, alongside province and vibe filters.
    - Clicking a point opens `SpotEditorDrawer`. The 2 spots with invalid coordinates are listed under the map with a fix button.
    - Uses the new `GET /api/admin/spots?id=`.
  - **Run history:** `recordSourceScrape` keeps `runHistory` (the last 20 runs, with the province as context for spot runs). The scraper page shows it under each source ("ประวัติ"); older sources show their last run.
  - **Findings on current data:**
    - 164 of 539 province × vibe cells are empty.
    - The thinnest provinces are ลพบุรี (19), สุโขทัย (20) and อุทัยธานี (20).
    - The least covered vibe is สปา & จุดฮีลใจ, with 24 spots nationwide.
  - **Verification (puppeteer):**
    - 77 rows; the tooltip works.
    - A cell click opens the list filtered to the right province and vibe with 3 rows; "ดึงเพิ่ม" preselects the province.
    - The history panel renders.
    - The map loads its canvas, 24 tiles and the OSM attribution; the invalid list opens the editor.
    - No console errors.

- Editable master data (2026-10-10, owner request):
  - **`lib/masterData.ts`** (client-safe):
    - Types for categories, venues, provinces and zones.
    - `ICON_OPTIONS` (25 lucide icons) and `COLOR_PRESETS` (10 colors, literal Tailwind classes).
    - A seed built from `data/masterHub.ts`, including the homepage destination profiles and regions.
    - Resolvers back to the old constant shapes; a built-in keeps its original colors unless recolored.
  - **`lib/masterDataStore.ts`:**
    - `data/master_data.json` is committed; serverless writes go to `/tmp`. Seed entries are merged in for built-ins added later.
    - Validation: no emoji in names, icons and colors from the presets, `https://` or `/` image URLs, coordinates, provinces from the 77.
    - Built-in entries cannot be deleted, and the fixed collections (vibes, moods, provinces) cannot gain entries.
  - **APIs:** public `GET /api/master`; admin `GET/POST /api/admin/master` (save / set_active / delete / reorder, `system.manage`, audited).
  - **Client hook:** `lib/useMasterData.ts` for the frontend (BE-013).
  - **Admin views rewritten** (they were read-only):
    - `TaxonomyManagerView`: 5 category collections, icon grid, color swatches, image upload, live chip preview, reorder, activate/deactivate, delete for custom entries.
    - `ProvincesManagerView`: 77 provinces with region filter, featured toggle, spot counts and a destination-card preview; plus a zones tab.
    - `VenuesManagerView`: venue editor with coordinates check and website.
    - Shared pieces in `components/admin/masterAdmin.tsx`: `useMasterAdmin`, `ImageField` (compressed upload via `/api/upload`), `MasterList`.
  - **Verification:**
    - API 20/20: create/keywords; emoji, unknown icon and bad image URL rejected; fixed collections and built-in delete rejected; deactivate hides it publicly; built-in edit with image; province featured; zone and venue create; reorder applied; cleanup.
    - Puppeteer: all three views and their editors render with no console errors.
    - The test data file was restored to the seed.
  - **Rail cards:** the image cards the public site already shows in TopCommunityRail (8 clubs) and TopVenuesRail (7 venue groups) are now the `communityClubs` and `venueGroups` collections.
    - They are seeded from those components; the illustrative member counts are dropped.
    - They are edited in the new admin module "การ์ดแนะนำ (rail)" (`FeaturedRailsView`) with a card preview.
    - Venues also got their `/images/venues/*` photos.
  - **Limits:**
    - Uploaded images go to `public/uploads`, which does not persist on Vercel.
    - The public site still reads the code constants until BE-013 is done.

- Vercel Blob for uploads (2026-10-10; the owner created a Blob store):
  - `lib/media/adapters/blobStorageAdapter.ts` implements upload, delete, list and stats on `@vercel/blob`. Files are public, get a random suffix and a 1-year cache, and the storage key is the blob URL.
  - `lib/media/index.ts` picks Blob when `BLOB_READ_WRITE_TOKEN` is set, or when `BLOB_STORE_ID` is set on Vercel (OIDC, which the connected store uses) or with a pulled `VERCEL_OIDC_TOKEN` locally; local disk otherwise.
  - The placeholder `CloudStorageAdapter` was removed: it returned CDN URLs without uploading anything.
  - `/api/upload` allows 20 uploads per 10 minutes per IP for non-admin callers.
  - Pending: a live upload test. The store uses OIDC (only `BLOB_STORE_ID` was provided); a local test needs `vercel env pull`, otherwise test on the deploy.

- Member accounts (2026-10-10, owner choices: real accounts before Moments; the 4 channels of the current AuthModal; JSON store first, database later):
  - **`lib/members/`:**
    - `types.ts` defines the `Member` type and the `MemberRepository` interface.
    - `jsonMemberRepository.ts` stores `data/members.json` (gitignored, with a mutex); swap it out in `index.ts` for a database.
    - `session.ts` signs the 30-day httpOnly cookie with `{sub, ver, exp}` and re-checks the member on every request. In local dev without `AUTH_SECRET`, the signing key goes in the gitignored `data/.dev_session_secret`.
    - `accounts.ts` handles register/login, OAuth sign-in with verified-email linking, profile and password.
    - `oauth.ts` covers Google, Facebook and Apple: PKCE for Google and Facebook, nonce for Google and Apple, an Apple ES256 client secret, and issuer/audience checks.
  - **Shared helpers:** `lib/passwordHash.ts` (now also used by `staffStore`) and `lib/rateLimit.ts`.
  - **Routes `/api/auth/member/*`:**
    - session, register, login, profile, password, account (PDPA export/delete).
    - OAuth start and callback (GET for Google and Facebook, form POST for Apple). The state cookie is signed and SameSite=None for Apple's POST.
    - `returnTo` is restricted to site paths.
  - **Admin:**
    - New permission `members.manage` (Owner, Moderator).
    - `/api/admin/members` (list without hashes; suspend with days and a reason, ban, restore, force logout; audited).
    - `MembersManagerView` with a moderation drawer.
  - **Client hook:** `lib/useMemberSession.ts` (BE-015).
  - **Verification:**
    - API 26/26: consent, password rules and the cross-site block on register; duplicate email; session; profile; wrong password; case-insensitive login; a password change ends other sessions; the admin list has no hashes; suspend needs a reason, ends the session and blocks login with a dated message; restore; an unconfigured provider redirects back with an error; `returnTo` cannot leave the site; a forged callback is rejected; PDPA export and delete; audit entries.
    - The admin page renders with no errors.
  - **Not yet tested:** live Google, Facebook and Apple sign-in (no credentials).
  - **Limits:** member accounts on Vercel do not persist until a database repository replaces the JSON one; email verification and password reset need an email service.

- Moments backend (2026-10-10, owner choices: posts go live at once and hide after reports; real member accounts):
  - **`lib/moments/`:**
    - `types.ts` defines the `Moment` type and the `MomentRepository` interface.
    - `jsonMomentRepository.ts` stores `data/moments.json` (gitignored); `MOCK_POSTS` are seeded as samples on first load.
    - `service.ts`:
      - The `CommunityPost`-shaped `FeedItem` uses live author profiles; banned authors and hidden comments are filtered out.
      - Validation: caption 1–500, 1–10 images that must be our uploads, comments up to 300.
      - Likes and saves are idempotent. A comment can be deleted by its author or the post author. One report per member; 3 reports auto-hide.
  - **Public routes:**
    - `/api/moments`: the feed (tabs, filters, paging) and create (10 per hour).
    - `/api/moments/[id]`: get, edit own, delete own.
    - `/api/moments/[id]/actions`: like, save, comment (30 per 10 minutes), delete comment, report.
  - **PDPA:** account deletion removes the member's moments, comments, likes, saves and reports; the export includes their moments.
  - **Admin:**
    - `/api/admin/moments` (list with filters and counts; hide with a reason, restore and clear reports, dismiss reports, remove, hide/show/delete comments; `community.review`; audited).
    - `MomentsManagerView` shows a photo grid with status and report badges and a moderation drawer.
    - The sidebar badge shows the reported count.
  - `/public/uploads/` is now gitignored (runtime uploads).
  - **Verification:**
    - API 32/32: upload; seeded feed; anonymous post blocked; data URL, foreign image and long caption rejected; create, like (idempotent), save, saved and mine tabs, login-required tab; comment and its delete rights; edit rights; live author name; report rules; auto-hide at 3; author still sees the hidden post; admin reported list; restore; hide needs a reason; banned author hidden; PDPA cascade; audit.
    - The admin grid and drawer render with no errors.
  - **Next:** the frontend switch (BE-016). Follows and notifications are not built.
- **2026-10-10 · Member login and sign-up UI on the real API (owner handed these frontend files to Claude Code; BE-017)**
  - **Problems found in the old UI:**
    - Any email and password logged in; the social buttons logged in as a sample user.
    - The same sign-up UI existed in three copies (`/login`, `AuthModal`, `/onboarding`).
    - A fake hCaptcha box and pre-ticked age and consent boxes.
    - localStorage keys did not match between pages.
    - No forgot-password flow.
  - **Shared card:** `components/auth/AuthPanel.tsx` has login, sign-up, sign-up with email, forgot password and link-sent views.
    - Consent boxes start unticked and gate every sign-up button. Social buttons are disabled until configured.
    - Inline field errors, server messages, and a "go to login" link when the email already exists.
    - A password strength meter with a text label; `autocomplete` attributes; labelled password toggles.
    - Buttons follow the design system: Royal Blue primary, slate-900 for register.
  - **Where the card is used:**
    - `AuthModal` (same props, now a real dialog: Esc, focus trap, scroll lock, focus restore).
    - `/login` (server page reading `mode`, `returnTo` and `auth_error`; signed-in visitors are forwarded).
    - `/onboarding` (sign-up popup only for visitors).
  - **Client session:** `lib/useMemberSession.ts` is one shared store (`memberActions`, `refreshMemberSession`). `lib/useAuth.ts` keeps its shape on top of it; the role remains a local preview only.
  - **Forgot password:**
    - `createPasswordReset` / `resetPasswordWithToken`: token `<memberId>.<secret>`, sha256 stored, 30 minutes, single use. A reset ends other sessions and marks the email verified.
    - Routes `/api/auth/member/password-reset` and `/confirm`, plus the `/reset-password` page.
    - `lib/members/mailer.ts` sends through Resend when `RESEND_API_KEY` + `MAIL_FROM` are set. In development the link is logged and returned as `devResetUrl`.
  - **OAuth:**
    - Failures land on `/login?auth_error=…&returnTo=…`; new social members go to `/onboarding?returnTo=…`.
    - `signInWithOAuth` now returns `{ member, created }`.
    - The admin members view also hides `passwordReset`.
  - **Onboarding:**
    - No stranger photos by default; photos are optional; the fake "name taken" check is gone.
    - Finishing saves the name and avatar (uploaded to `/api/upload`, folder `avatars`) to the account. It keeps the other answers in `cch_member_preferences` and never invents an email.
  - **Verification:**
    - API 18/18: reset flow, single use, sessions ended, old password rejected, admin view, OAuth error redirect, open-redirect guard, pages.
    - Browser end to end:
      - login errors, consent gating, sign-up → onboarding, modal login, forgot → reset → signed in
      - no horizontal scroll at 390px
      - onboarding walk-through back to `returnTo`
      - no console errors except the intended 401

- **2026-10-10 · Onboarding redesign (owner handed the whole page to Claude Code)**
  - **Steps:** 5 steps became 3: goals (member or host track), profile, and interests plus province.
  - **Data:**
    - Interests come from master data (community categories, spot vibes, fair categories); provinces are the featured provinces with photos, plus all 77 in a select.
    - Answers are saved with content ids in `cch_member_preferences`.
  - **Removed:**
    - Overlapping goal, style and interest lists; the hard-coded province list.
    - Claims of features that do not exist (AI matching, Buddy Matcher, chat rooms, verification, +50 Points badge); feature promo banners on every step.
    - Emojis in headings and options; gradients.
    - Required birth date (it had a default) and gender; occupation, workplace, education and institution.
  - **Design:**
    - Royal Blue primary button and progress; selection shown by a blue border plus a check.
    - Type follows the platform scale, so nothing is below 11px.
    - Labels keep each "A & B" part on one line, so Thai words do not break on mobile.
    - Header has a "ข้ามไปก่อน" (skip) link.
  - **Rules:** birth year is optional (พ.ศ.), offering only ages 18 and up; one optional profile photo is compressed and uploaded on finish.
  - **Verification:** browser walk-through on 390px and 1280px: goal validation, name prefill, selections, saved preferences, return to `returnTo`; no horizontal scroll; no page errors.

- **2026-10-10 · Onboarding copy, Thai line breaks, preview mode**
  - **Copy:** onboarding questions are rewritten from the visitor's point of view (feelings and wants, not platform terms), e.g. "ช่วงนี้ อยากทำอะไรบ้าง", "เพื่อนใหม่ จะเรียกคุณว่าอะไรดี", "อะไรทำให้คุณ รู้สึกดี".
  - **Line breaks:**
    - `components/auth/PhraseText` keeps each space-separated phrase on one line and keeps "&" with the phrase before it. It is used in onboarding, `AuthPanel` and `RequireMembershipModal`.
    - The popup is wider (520px). Social buttons show just the provider name below 400px, with a shorter "เร็วๆ นี้" (coming soon) badge.
    - Interest chips stack the icon above the text below 400px.
  - **Preview mode:** `/onboarding` became a server page passing `preview` and `returnTo` to `OnboardingFlow`. `?preview=1` skips sign-up, saves nothing, and ends with the data it would save. In development the sign-up popup links to it.
  - **Verification:** browser checks at 360px and 1280px: no text overflows its box in any step or popup; preview shows the result and leaves localStorage empty; no page errors.
  - **Found:** the homepage is 429px wide on a 360px screen (`HeroSection` pill), reported to the frontend in BE-017.

## Known Limitations / Next Backend Work

1. Replace the prototype JSON/in-memory repository with durable shared storage before relying on production writes. `JsonFileAdapter` remains the configured adapter, and serverless `/tmp` storage is ephemeral and not shared across instances.
2. (Superseded 2026-10-10: member accounts and the login UI are real; `useAuth` reads the server session. Superseded 2026-10-06: staff accounts with roles now exist; both need durable storage before production.) Admin auth is a single shared password. Replace it with per-user accounts and roles (the admin header "Preview Role" is still a client-side simulator) once a user store exists. Member identity is still client-only (`useAuth` + localStorage), so join `userId` and event `hostId` are not verified.
3. `/api/upload` is still unauthenticated, because members have no server identity yet. It now rejects SVG and checks file signatures, but it has no rate limit.
4. Add server-side pagination to the admin Spots API as the dataset grows; the current panel receives the complete local catalog.
5. Participants are now persisted, but mutexes, the login throttle, and the in-memory event state are process-local, so multiple instances will diverge until the storage moves to a shared database.
6. Add a backend API and persistence contract for Moments/posts if that feature is brought into the dynamic-content scope.
7. Add focused route/repository tests for approval filtering, query parsing, pagination, persistence, and authorization.
8. Ingestion supports Schema.org JSON-LD plus site adapters for QSNCC, IMPACT, BITEC, ThaiRun and Visit Bangkok. Site adapters break when a site changes its layout or internal API, and then fail with a clear per-source error. Still unsupported (live probe 2026-10-04): ThaiTicketMajor returns 403 (bot block); The Concert and Ticketmelon load listings client-side; Eventpop's listing page has no Event JSON-LD; SET and pr-bangkok are untested. A browser inspection confirmed Eventpop cards use `a[data-gtm-product-id][data-gtm-product-name]`, `.event-date`, `.event-title`, `.short-location`, and poster images; a Cheerio-based Eventpop listing adapter was started but not applied. First verify/install Cheerio, then add and test that adapter. Do not claim broad live-source coverage until this works.
9. Spot sources: the Tourism Directory adapter covers attractions nationwide. Bangkok and cafes still need a second source. `data/discovery_content.json` (spots) is gitignored, so imported spots do not reach Vercel until that file is tracked or spots move to shared storage.
10. The reset action still uses the curated event seed catalog and is not a live scrape.

## Handoff Notes

- Collaboration: Antigravity IDE (Gemini) owns the frontend on `main`; Claude Code owns the backend on `claude`. Rules are in AGENTS.md section 0. Keep `docs/API.md` in sync with every response-shape change, and post cross-side changes or requests in `docs/HANDOFF.md`.
- Keep events and fairs on the shared `/api/events` resource and filter by `type`; avoid a duplicate community events API unless the community data model becomes distinct.
- The current APIs expose prototype seed data, not a production database or verified third-party feed.
- Check `AGENTS.md` and the installed Next.js documentation under `node_modules/next/dist/docs/` before changing route handlers or backend architecture.