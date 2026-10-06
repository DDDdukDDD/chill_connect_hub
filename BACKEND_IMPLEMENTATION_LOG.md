# Backend Implementation Log

Last updated: 2026-10-06 (admin restructure, staff roles, audit log; older entries archived)

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

## Known Limitations / Next Backend Work

1. Replace the prototype JSON/in-memory repository with durable shared storage before relying on production writes. `JsonFileAdapter` remains the configured adapter, and serverless `/tmp` storage is ephemeral and not shared across instances.
2. (Superseded 2026-10-06: staff accounts with roles now exist; they need durable storage before production.) Admin auth is a single shared password. Replace it with per-user accounts and roles (the admin header "Preview Role" is still a client-side simulator) once a user store exists. Member identity is still client-only (`useAuth` + localStorage), so join `userId` and event `hostId` are not verified.
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