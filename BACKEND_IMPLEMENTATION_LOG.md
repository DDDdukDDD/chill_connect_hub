# Backend Implementation Log

Last updated: 2026-10-03 (event-store unification + admin sessions)

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

## Verification

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

## Known Limitations / Next Backend Work

1. Replace the prototype JSON/in-memory repository with durable shared storage before relying on production writes. `JsonFileAdapter` remains the configured adapter, and serverless `/tmp` storage is ephemeral and not shared across instances.
2. Admin auth is a single shared password. Replace it with per-user accounts and roles (the admin header "Preview Role" is still a client-side simulator) once a user store exists. Member identity is still client-only (`useAuth` + localStorage), so join `userId` and event `hostId` are not verified.
3. `/api/upload` is still unauthenticated, because members have no server identity yet. It now rejects SVG and checks file signatures, but it has no rate limit.
4. Add server-side pagination to the admin Spots API as the dataset grows; the current panel receives the complete local catalog.
5. Participants are now persisted, but mutexes, the login throttle, and the in-memory event state are process-local, so multiple instances will diverge until the storage moves to a shared database.
6. Add a backend API and persistence contract for Moments/posts if that feature is brought into the dynamic-content scope.
7. Add focused route/repository tests for approval filtering, query parsing, pagination, persistence, and authorization.
8. The current ingestion adapter supports Schema.org JSON-LD only. Eventpop and QSNCC's configured listing pages do not expose Event JSON-LD. A browser inspection confirmed Eventpop cards use `a[data-gtm-product-id][data-gtm-product-name]`, `.event-date`, `.event-title`, `.short-location`, and poster images; a Cheerio-based Eventpop listing adapter was started but not applied. First verify/install Cheerio, then add and test that adapter. Do not claim broad live-source coverage until this works.
9. No Spot sources are configured by default. Add specific intended Spot source URLs and source-specific parsing rules; imported Places will remain drafts until reviewed.
10. The reset action still uses the curated event seed catalog and is not a live scrape.

## Handoff Notes

- Keep events and fairs on the shared `/api/events` resource and filter by `type`; avoid a duplicate community events API unless the community data model becomes distinct.
- The current APIs expose prototype seed data, not a production database or verified third-party feed.
- Check `AGENTS.md` and the installed Next.js documentation under `node_modules/next/dist/docs/` before changing route handlers or backend architecture.
