# Backend Implementation Log — Archive (up to 2026-10-03)

Older entries moved out of [BACKEND_IMPLEMENTATION_LOG.md](../../BACKEND_IMPLEMENTATION_LOG.md) on 2026-10-06 to keep the active log short. Some statements here are superseded (for example, `data/discovery_content.json` is tracked in git again since 2026-10-04).

## Implemented (up to 2026-10-04 FE-002)

- Added `GET /api/quests` in `app/api/quests/route.ts`. It reads through `db.findQuests`, supports `page`, `limit`, `category`, and `q`, caps page size at 100, and returns pagination metadata with a short shared-cache policy.
- Added `lib/contentClient.ts` to follow paginated `events`, `spots`, and `quests` API responses, up to the API's page limit.
- Connected the homepage and `/spots` content lists to `/api/spots`, preserving mock data as a fallback and retaining the existing client-side filters.
- Connected the homepage quest rail and `/challenges` catalog to `/api/quests`; the existing curated quest content remains as fallback/content, and API additions are deduplicated by normalized title.
- Updated filtered event GET requests to load the approved event set from `loadCache()` before filtering and pagination. This aligns filtered reads with the unfiltered route, which already excluded pending/rejected events.
- Expanded event filter detection to include `venueTag`, `status`, `includeEnded`, and `sortBy`. `status=ended` enables ended-event filtering.
- Updated `/community` to request paginated community events through `/api/events?type=community`; no duplicate `/api/community` route was added.
- Added `publicationStatus` to spots and `status` to quests; public repository queries omit draft spots, draft quests, and private quests unless `includeDrafts` is explicitly enabled.
- Added persistence for spot/quest create, update, bulk spot updates, delete, and quest progress in a separate discovery-content JSON file, avoiding concurrent writes with the event store.
- Replaced `/api/admin/spots`' private in-memory store with the shared repository. It now validates writes, supports publication status, and persists image enrichment through `bulkUpdateSpots`.
- Added `/api/admin/quests` with paginated admin reads and create, update, status, and delete actions. New quests start as drafts.
- Added `lib/adminApiAuth.ts` and applied it to admin events, spots, quests, scraper, and source-management routes.
- Added `data/discovery_content.json` to `.gitignore` because it is mutable local runtime data.
- Replaced the admin dashboard's hard-coded KPIs and fake activity feed with live counts, a moderation/draft queue, content-health checks, loading/error states, and shortcuts to real modules.
- Replaced the sample-only Quest Manager with an API-backed list, filters, draft-first create/edit, status transitions, deletion, and visible loading/error states.
- Added spot draft/published status to the admin Spots panel, lifecycle filtering, and publish/unpublish actions; admin-created spots now start as drafts.
- Made the admin navigation responsive with a mobile drawer, added a mobile menu trigger, removed the fixed-width mobile content squeeze, and changed the environment/role labels to Development/Production and Preview Role.
- Added `targetType: 'events' | 'spots'` to source records; legacy sources migrate to Events and stale hard-coded counters are cleared until a real run is recorded.
- Added `lib/structuredDataScraper.ts` to fetch public HTTPS sources with robots.txt checks, private-host rejection, redirect revalidation, size/time limits, JSON-LD extraction, and distinct Event/Place normalization.
- Added a dedicated `lib/spotScraper.ts` pipeline. It imports only Places with a title, province, coordinates, and description, deduplicates by stable ID/source URL/title+province, stores source provenance, and defaults imported records to draft.
- Changed `runScraperAndAIEngine` to read configured active Event sources instead of returning the static seed list. It records source-level scan/import/duplicate/error results and keeps moderation behavior.
- Updated `/api/admin/scrape` to dispatch by `targetType` and return target-specific records and per-source results. `/api/admin/sources` now stores the target and validates HTTPS URLs.
- Split the Scraper Engine panel into Event and Spot source tabs, with target-specific run actions, counters, empty states, source status, and import errors. The curated reset action is now explicitly labeled as sample data.
- Event normalization now avoids random participant/review values, assumed-free pricing, fabricated host avatars, and guessed central-Bangkok coordinates; source end dates, province, times, and valid source coordinates are preserved.

- Admin honesty pass (2026-10-03): removed the client-side role simulator and the notification bell; the header and sidebar now show the real server session (`useAdminSession()` from `AdminAuthGate`) with logout. Users & Permissions and Backup & Audit Logs are labeled as sample screens (`AdminPreviewNotice`), and their non-functional actions are disabled. Taxonomy and Venues are labeled read-only. 77 Provinces counts come from `/api/admin/spots?status=published` and approved events from `/api/admin/events` instead of mock arrays.
- Seed meetups `2`–`6` in `MOCK_EVENTS` had no `eventType`, which hid them from both moderation views. They are now `community`, and normalization infers a missing `eventType` (seed value → `comm-` prefix → venue/capacity heuristic).

- Admin lists step 2 (2026-10-03): `/api/admin/events` and `/api/admin/spots` support server-side pagination (only when `page` is passed, so full-list callers keep working). Moderation views open on the pending queue (falling back to "all" when it is empty), sort pending-first, and show state-dependent actions: pending → approve/reject, approved → unpublish (back to pending), rejected → back to pending. The Spots module moved out of `app/admin/page.tsx` into `components/admin/SpotsManagerView.tsx`.
- `lib/imageHealth.ts` + `check_images` action: actually loads every stored image URL (public HTTPS only, via the scraper's SSRF guard; local `/public` paths via the filesystem). Spots carry `imageStatus` (ok/broken/missing/unchecked). Results are cached in process memory for 6h — not persisted, so a restart shows "unchecked" until the next check. First run: 48 distinct URLs, 4 broken, affecting 10 spots.

- Admin design consistency (2026-10-03): every module uses `AdminPageHeader` and the shared `adminButton` styles from `components/admin/AdminUI.tsx` (primary = Royal Blue, dark/secondary = slate, danger = rose outline; no pillar colors on buttons, per AGENTS.md). Sidebar labels match page titles, decorative badges were replaced by real pending counts for Community/Fairs, the Quests table has fixed columns, and moderation rows stack on mobile.
- Admin modules are addressable by URL (`/admin?m=spots`) using the native History API (refresh, shared links, back/forward).

- FE-002 (2026-10-04): `ChallengeQuest` gained `brandReward?: QuestReward` (`brand_partner` | `hub_central`) and `image`. `lib/questLifecycle.ts` derives `daysRemaining` and `status: 'ended'` from `endDate` (Thai or ISO) on every repository read; stored `daysRemaining` is ignored. `/api/admin/quests` validates rewards (brand_partner requires `partnerName` + `title`), dates (end ≥ start) and image URLs, and refuses to activate an expired quest. Seed quests carry `brandReward`; persisted copies of the old seed are upgraded once on startup (`upgradeLegacySeedQuests`). Seed dates moved to Oct–Dec 2026 except "Digital Detox", kept ended on purpose.

## Verification (2026-10-03)

- Editor diagnostics reported no errors for the changed route, client helper, and consuming pages.
- Browser verification: `/api/spots?page=1&limit=2` returned pagination metadata for 137 spots.
- Browser verification: `/api/quests?page=1&limit=5` returned repository-backed quest records.
- Browser verification: `/api/events?type=community&limit=100` returned 11 events; every returned event was `eventType: community` and `approvalStatus: approved`.
- Browser verification: `/community` completed its filtered API request with HTTP 200 and rendered without an application error.
- Integration verification: draft spots and quests were hidden from public APIs; publishing/activating them made them visible.
- Persistence verification: a draft spot and quest remained in admin API results after restarting the dev server and remained hidden from public APIs; temporary records were deleted afterward.
- Admin UI verification: dashboard totals matched repository responses (137 spots, 45 community meetups, 88 fairs, 4 quests); quest create/publish made the record appear publicly; spot create/publish did the same.
- Responsive verification: at a 390px viewport the admin content fits without horizontal overflow; the mobile drawer opens and closes on module navigation.
- Cleanup verification: admin and public API searches returned no temporary test records.
- Scraper smoke test: a temporary Spot source targeting `https://localhost/` was rejected before network access and then removed.
- Scraper source test: Eventpop and QSNCC configured pages returned no Event JSON-LD; both runs correctly reported unsupported structured data and imported zero records.
- Browser verification: the Scraper Engine displays Event/Spot tabs, and the source form switches to Spot mode without Event-only categories.
- Cheerio is declared in `package.json` and `package-lock.json`, but was not verified in `node_modules`; the install command did not complete cleanly after a PowerShell prompt. Do not import Cheerio until `npm install` completes successfully.
- Full lint and production build were not run.
