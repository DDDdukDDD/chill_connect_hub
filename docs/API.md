# Chill & Connect Hub — API Contract

> **Owner:** Backend (Claude Code). **Consumers:** Frontend (Antigravity IDE) and admin console.
> This is the source of truth for how the frontend talks to the backend. If a response shape here
> differs from the code, the code is wrong or this file is stale — report it in [HANDOFF.md](HANDOFF.md).
>
> **Status:** prototype. Data is seed/mock data stored in JSON files; there are no real users yet.
> Last updated: 2026-10-09

## Conventions

- All endpoints are Next.js Route Handlers under `app/api/`, same origin as the app, JSON in/out (except `/api/upload`, which takes `multipart/form-data`).
- **Shared types — import them, do not redefine them:**
  - `EventItem`, `ChallengeQuest` → `@/data/mockData`
  - `LifestyleSpotItem` → `@/data/spotsData`
  - `AdminEventItem` → `@/lib/eventsStore` (type import only)
  - Query/pagination types → `@/lib/db/types`
- **Success responses** always include `success: true`.
- **Error responses** include `success: false` and a human-readable reason. Public endpoints use `message`; most admin endpoints use `error`. Read errors as `data.message ?? data.error`.
- **Pagination object** (on every paginated list):
  ```ts
  pagination: {
    totalCount: number; page: number; limit: number; totalPages: number;
    hasNextPage: boolean; hasPrevPage: boolean; nextCursor: string | null;
  }
  ```
  `limit` is capped at **100** server-side. To load everything, use `fetchAllContentPages()` from `@/lib/contentClient`, which follows every page.
- **Never send roles or permissions from the client.** The server determines admin status from its own session. Fields like `userRole` are ignored.

---

## Public endpoints

### `GET /api/events` — community meetups and fairs

Returns **approved** events only (pending/rejected are never returned).

Two modes:
- **No query params** → every approved event, *including ended ones*, in one response (legacy; pagination block reports a single page).
- **Any of the params below** → filtered and paginated. Ended events are hidden unless `includeEnded=true` or `status=ended`.

| Param | Values | Default | Notes |
|---|---|---|---|
| `type` | `community` \| `public_venue` \| `all` | `all` | Pillar: `/community` = `community`, `/fairs` = `public_venue` |
| `category` | `heal` \| `move` \| `chill` \| `learn` \| `all` | — | |
| `province` | Thai province name, `online` / `ออนไลน์`, `ทั่วไทย` | — | Fuzzy; Bangkok spellings (กทม/กรุงเทพ/bangkok) are equivalent |
| `zone` | zone id, e.g. `ari`, `siam` | — | Matches `zone` or `location` text |
| `venueTag` | `qsncc` \| `bitec` \| `impact` \| `marathon` \| `park` | — | Fairs |
| `status` | `recruiting` \| `full` \| `ended` \| `all` | `all` | Capacity-based |
| `includeEnded` | `true` | `false` | |
| `q` | text | — | Searches title, description, location, host, tag, category |
| `sortBy` | `newest` \| `oldest` \| `popular` | `newest` | `popular` = participant count |
| `page` | ≥ 1 | `1` | |
| `limit` | 1–100 | `50` | |

Response `200`:
```ts
{ success: true, events: EventItem[], total: number, pagination: Pagination }
```
Cache: `public, s-maxage=30, stale-while-revalidate=120` — a newly created or approved event can take up to ~30s to appear through a CDN.

**Sample meetups roll forward (prototype stage):**
- Community events whose id comes from the bundled `MOCK_EVENTS` have fixed 2026 dates. When one has ended, every read (this endpoint, admin lists) returns its `date` moved forward by whole 77-day cycles, which keeps its weekday.
- Stored data is unchanged.
- Member-created, scraped, recurring and `status: 'ended'` events are never moved.

### `POST /api/events` — create an event

Body:
```ts
{ eventData: Partial<EventItem> & { title: string; location: string } }
```
- `title` and `location` are required (`400` otherwise).
- Content is screened against a banned-keyword list (`400`).
- **Approval:** community events (`eventType: 'community'`) are published immediately (`approved`). Fairs (`eventType: 'public_venue'`) are `pending` until an admin approves them — unless the request carries an admin session.
- If `eventData.id` is missing or already taken, the server assigns a new id. **Always use the returned `event.id`.**
- Server-set fields: `approvalStatus`, `source`, `createdAt`; defaults: `participantsCount` (1), `maxParticipants` (10 community / 500 fair), `status` (`recruiting`), `createdAtTimestamp`.

Response `200`:
```ts
{ success: true, message: string, event: EventItem }   // event.approvalStatus tells you if it is live
```

### `POST /api/events` with `action: "join"` — join a meetup (capacity-safe)

Body:
```ts
{ action: 'join', eventId: string, participant: { userId: string; userName: string; userAvatar?: string; note?: string } }
```
Responses:
| HTTP | `status` | Meaning |
|---|---|---|
| 200 | `joined` | Joined; `participantsCount`, `maxParticipants`, `updatedEvent` included |
| 409 | `already_joined` | This `userId` already joined |
| 409 | `event_full` | No seats left |
| 409 | `event_ended` | Event is over |
| 409 | `not_found` | Unknown `eventId` |
| 400 | — | Missing `eventId` / `participant.userId` |

Body shape: `{ success: boolean, message: string, status, updatedEvent?, participantsCount?, maxParticipants? }`.
Participants are persisted. Note: `userId` is not verified yet (no member login on the server).

### `GET /api/spots` — lifestyle spots (77 provinces)

Returns published spots only (drafts hidden).

| Param | Values | Default |
|---|---|---|
| `province` | Thai province name or `all` | — |
| `category` | `park` `art` `cafe` `oldtown` `workspace` `viewpoint` `nature` `temple` `beach` `market` `museum` `bar` `coworking` \| `all` | — |
| `vibe` | exact vibe tag text (case-insensitive) | — |
| `q` | text (title, description, province, district, category label, vibe tags, highlights) | — |
| `hasImageOnly` | `true` | `false` |
| `page` | ≥ 1 | `1` |
| `limit` | 1–100 | `12` |

Response `200`: `{ success: true, spots: LifestyleSpotItem[], pagination: Pagination }`. Cache: `s-maxage=60`.

Province names follow `MASTER_77_PROVINCES` (Bangkok is `"กรุงเทพฯ"`).

**Optional fields on imported spots** (all optional; curated spots usually lack them):
- `contact?: { phone?, website?, facebook? }`: official contact channels.
- `entryFee?: string`: entry fee as published, e.g. `"คนไทย ผู้ใหญ่ 40 บาท · ต่างชาติ ผู้ใหญ่ 200 บาท"` or `"เข้าชมฟรี"`. `price` carries the same text for attractions.
- `popularity?: number`: page views on the source site (higher = more visited).
- Imported spots have `rating: 0` and `reviewsCount: 0` (the source has no reliable reviews). Hide ratings when they are 0.
- `sourceName` / `sourceUrl`: where the record came from. Imported spots should show a credit, e.g. "ข้อมูล: กรมการท่องเที่ยว". Spots with `sourceName: "OpenStreetMap · Wikipedia"` (ids `osm-…`) **must** show it (ODbL / CC BY-SA).
- `latitude` / `longitude` are validated for imported spots (inside Thailand), so they are safe for maps and nearby searches.

### `GET /api/spots/[id]` — one spot

Returns one **published** spot (`404` for drafts and unknown ids). The id is URL-encoded.

Response `200`: `{ success: true, spot: LifestyleSpotItem }`. Cache: `s-maxage=60`.

### `GET /api/spots/[id]/nearby-dining`

| Param | Default |
|---|---|
| `limit` | `6` (1–12) |

Two sources:
- **`source: 'google'`** applies when the server has `GOOGLE_PLACES_API_KEY` and is under its monthly cap. It returns live Google Places results within 3 km, keeping only places rated **≥ 4.5 with ≥ 50 reviews**. Nothing is stored except the place id, and the response is `Cache-Control: no-store`. Items carry `reviewsSource: 'google'`.
  - **Google's terms require the UI to show the `attribution` text ("Google Maps")** next to these results. `image` is a neutral placeholder, because Google photos are a separate paid request.
  - An empty `data` means nothing nearby passed the filter.
- **`source: 'catalog'`** applies otherwise: no key, the monthly cap was reached, or Google failed. It returns nearby cafes from our published catalog (≤ 15 km), each with `spotId`. These have no ratings (`rating: 0`), so no star should be shown.

Response `200`:
```ts
{
  spotId: string; spotTitle: string; district: string; province: string;
  source: 'google' | 'catalog';
  attribution?: 'Google Maps';                       // present when source = 'google'
  filter?: { minRating: 4.5; minReviews: 50 };       // present when source = 'google'
  data: Array<{
    id: string; name: string;                        // google ids are "gplace-<place id>"
    category: 'cafe' | 'restaurant' | 'slowbar' | 'bakery' | 'local_food'; categoryLabel: string;
    image: string; rating: number; reviewsCount: number; distanceKm: number;
    openHours: string;                               // google: 'เปิดอยู่ตอนนี้' | 'ปิดอยู่ตอนนี้' | 'ไม่ระบุเวลาเปิด'
    priceRange?: string;                             // google: '฿' … '฿฿฿฿'
    specialty: string;                               // google: short address
    googleMapsUrl: string;
    isPartner?: boolean; spotId?: string;            // spotId = same place in our catalog
    reviewsSource?: 'google';
  }>;
}
```
`404 { error }` if the spot does not exist or is a draft. ⚠️ This endpoint has no `success` field (legacy shape).

### `GET /api/quests` — community challenges

Returns active/ended public quests (drafts and private quests hidden).

| Param | Default |
|---|---|
| `category` (`heal` `move` `chill` `learn`) | — |
| `q` | — |
| `page` | `1` |
| `limit` (1–100) | `12` |

Response `200`: `{ success: true, quests: ChallengeQuest[], pagination: Pagination }`. Cache: `s-maxage=60`.

**Quest lifecycle (computed by the server on every read, never stored):**
- `daysRemaining`: whole days left until the end of `endDate`; `0` once ended; absent when the quest has no `endDate`.
- `status`: `'ended'` once `endDate` has passed (or an admin closed it early), otherwise `'active'`. Ended quests **are returned** so the UI can show an archive; filter them out of "active" rails on the client.
- Dates are Thai (`"31 ธ.ค. 2026"`) or ISO (`"2026-12-31"`) strings. Display them as-is or parse both formats.

**Reward type — `brandReward` (`QuestReward` from `@/data/mockData`):**
```ts
brandReward?: {
  type: 'brand_partner' | 'hub_central';
  title: string;            // the reward / exclusive privilege
  partnerName: string;      // brand name; always "Chill & Connect Hub" for hub_central
  voucherCodePrefix?: string; exclusiveNotice?: string;   // brand_partner only
  hubRewardNote?: string;                                 // hub_central only
  terms?: string;
}
```
`brand_partner` quests always have `partnerName` and `title`. Quests without `brandReward` have no declared reward type yet — treat them as `hub_central`. `image` (optional cover URL) is also available.

### `POST /api/upload` — image upload

`multipart/form-data`:
| Field | Notes |
|---|---|
| `file` | JPEG, PNG, WebP or AVIF, ≤ 5 MB. The bytes must match the declared type. **SVG is rejected.** |
| `folder` | Optional, e.g. `community`, `fair`, `spot` (letters, digits, `-`, `_`) |

Compress on the client first (`compressImage()` → WebP). Response `200`:
```ts
{ success: true, url: string, key: string, size: number, mimeType: string, originalName: string }
```
`400 { success: false, message }` for type/size/content errors.

---

## Admin

All `/api/admin/*` routes require admin access:
- **Browser:** the admin session cookie set by `/api/auth/admin` (sent automatically for same-origin `fetch`; writes must be same-origin).
- **Scripts:** `Authorization: Bearer <ADMIN_API_TOKEN>` (acts as an Owner).
- **Local dev** with none of `ADMIN_PASSWORD` / `AUTH_SECRET` / `ADMIN_API_TOKEN` set and no staff accounts: access is open (acts as an Owner).

Every request is checked against the caller's **role** (matrix in `lib/permissions.ts`, read from the server session, never from the client):

| Permission | Owner | Editor | Moderator | Data Ops |
|---|:-:|:-:|:-:|:-:|
| `content.view` (every `GET`) | ✓ | ✓ | ✓ | ✓ |
| `community.review` (decide community meetups) | ✓ | ✓ | ✓ | – |
| `content.edit` (spots, fairs, quests, events writes; decide fairs and spots) | ✓ | ✓ | – | – |
| `sources.run` (sources, scrape) | ✓ | ✓ | – | ✓ |
| `system.manage` (media, cache, `reset_and_seed`) | ✓ | – | – | ✓ |
| `audit.view` | ✓ | ✓ | – | – |
| `staff.manage` | ✓ | – | – | – |

Not signed in → `401 { success: false, message: 'Unauthorized' }` · signed in without the permission → `403 { success: false, error, permission }` · not configured in production → `503`.
The admin UI should treat a `401` as "session expired" and show the login screen again.
Disabling a staff account, changing its role, resetting its password or forcing logout ends its existing sessions at once.
Every admin write is recorded in the audit log (`/api/admin/audit`).

### `/api/auth/admin`

| Method | Body | Response |
|---|---|---|
| `GET` | — | `{ success, authenticated, hasSession, authRequired, loginAvailable, actor: { id, name, role, roleLabel, permissions[] } \| null }` |
| `POST` | `{ email, password }` (staff) or `{ password }` (env owner, `ADMIN_PASSWORD`) | `200 { success: true }` + sets cookie · `401` wrong credentials or disabled account · `429` too many attempts · `503` not configured |
| `DELETE` | — | Logs out (clears cookie) |

### Admin routes (summary)

All writes are `POST` with an `action` field unless noted.

| Route | Reads | Actions |
|---|---|---|
| `/api/admin/events` | `GET` → `{ events: AdminEventItem[] (all moderation states), total, autoPublish }`. **Paginated mode** when `page` is present: `?page&limit(≤100)&type=community\|public_venue&status=pending\|approved\|rejected\|all&format=recurring\|online\|physical\|all&q` → `{ events, counts: {total,pending,approved,rejected,recurring,online}, pagination }`, sorted pending-first then newest; `counts` cover the whole `type` | `create {eventData}` (needs `eventType`; validated with the platform form rules (title ≥ 5, province, location, description ≥ 15 plain characters, date; community also needs time and 2–15 people; fairs need `hostName`) and returns `400` otherwise; `approvalStatus` is `approved` only when sent as such, otherwise `pending`), `update_status {id, status: approved\|rejected\|pending}`, `approve_all`, `update_fields {id, updatedFields}` (only content fields are applied; `approvalStatus`, `participantsCount`, `id`, `eventType` and `source` are ignored; changed fields are validated with the same rules), `delete {id}`, `toggle_auto_publish {autoPublish}`, `reset_and_seed` — each returns the updated `events` list |
| `/api/admin/spots` | `GET ?province&category (stored category such as temple, or one of the 7 vibes such as sea_island)&q&status=draft\|published&image=missing\|broken\|problem` (legacy `filter=missing_image`) → `{ spots (each with imageStatus: ok\|broken\|missing\|unchecked), totalCount, filteredCount, draftCount, missingImagesCount, brokenImagesCount, uncheckedImagesCount, distinctProvinces }`; add `page&limit` for paginated `spots` + `pagination` | `create {newSpot}` (starts as draft unless `publicationStatus: published`; stores only what was sent: `rating` and `reviewsCount` are 0, there is no stock image, labels default to the Thai category label, and `googleMapsUrl` defaults to a coordinates search link). Create and `update` require coordinates inside Thailand (`400` otherwise); `update` also accepts `contact` and `entryFee`, `update {spotId, updatedFields}`, `delete {spotId}`, `set_publication {status: published\|draft, spotIds? \| scope?: tourism_directory\|osm\|imported\|curated}` (one write; returns `{ updated }`), `auto_enrich_images` — each returns `spots`. `check_images` loads every stored image URL (public HTTPS only; results cached in memory for 6h) → `{ checked, ok, broken }` |
| `/api/admin/quests` | `GET ?status&category&q&page&limit` → `{ quests, total, pagination }` | `create {quest}` (starts as draft; accepts `startDate`, `endDate`, `image`, `brandReward`), `update {id, updatedFields}` (`brandReward: null` clears it; `daysRemaining` is ignored), `set_status {id, status: draft\|active\|ended}` (activating a quest whose `endDate` has passed returns `400`), `delete {id}` |
| `/api/admin/sources` | `GET` → `{ sources }` | `POST {name, url (https), targetType: events\|spots, ...}` add (`400` for blocked platforms: Meetup, Facebook, allevents.in, dev.events) · `PATCH {id, status}` toggle · `DELETE ?id=` remove |
| `/api/admin/scrape` | — | `POST {targetType: events\|spots, sourceId?, province?, limit?}` → `{ newCount, duplicateCount, totalScanned, sourceResults, events \| spots }`. Imported events are always `public_venue`, start as `pending` unless auto-publish is on, and use Thai display dates (`"12 ต.ค. 2026"`). Province-based spot sources (Tourism Directory) require `province` (one of `MASTER_77_PROVINCES`; otherwise `400`) and import up to `limit` attractions (1–100, default 30) plus a few cafes, as drafts |
| `/api/admin/cache` | `GET` → `{ stats, activeTags, supportedTags }` | `flush_all`, `flush_tag {tag}`, `flush_tags {tags}` |
| `/api/admin/media` | `GET` → `{ files (with isOrphan), stats }` | `DELETE ?key=` · `POST {action: 'clean_orphans'}` |
| `/api/admin/review` | `GET ?pillar=community\|fairs\|spots&province&q&page&limit(≤100)&health=1` → `{ items: [{ kind: event\|spot, id, pillar, title, province, source, submittedAt, quality: { checks[{id,label,ok,severity}], score, requiredFailures }, data }], counts: {all, community, fairs, spots}, pagination, health? }`. Queue = pending events + draft spots from scrapers or members (not the retired curated drafts, not already rejected), most complete first. `health` = `{ publishedSpots, spotsMissingImage, spotsBadCoordinates, thinProvinces[], fairsEndingSoon[], approvedEventsPastEnd, failedSources[] }` | `POST {action: approve\|reject, items: [{kind, id}] (1–200), reason?}` → `{ updated, skipped }`. Approve: event → `approved`, spot → `published`. Reject: event → `rejected` (+ `rejectionReason`), spot stays a hidden draft with `reviewRejectedAt` / `rejectionReason`. Moderators may decide community items only (`403` otherwise) |
| `/api/admin/staff` | `GET` → `{ staff: [{ id, email, name, role, status, createdAt, createdBy, lastLoginAt }], roles: [{ id, label, description, permissions }], permissionLabels, envOwnerEnabled }` (never password hashes) | `create {email, name, role, password (≥10)}`, `set_role {id, role}`, `set_status {id, status: active\|disabled}`, `reset_password {id, password}`, `force_logout {id}`. You cannot change your own role or disable yourself. Owner only |
| `/api/admin/audit` | `GET ?action (exact or prefix: event, spot, quest, scrape, source, staff, auth, media, cache)&actorId&q&page&limit(≤100)` → `{ entries: [{ id, at, actorId, actorName, actorRole, action, targetType?, targetId?, summary }], pagination }`, newest first, last 2,000 kept | — |

---

## Change rules

1. Backend changes to any request/response shape must update this file **in the same commit**.
2. Breaking changes (removing/renaming a field, changing a type) must also be announced in [HANDOFF.md](HANDOFF.md) with what the frontend needs to change.
3. Frontend needing a new endpoint or field: add a request to [HANDOFF.md](HANDOFF.md) rather than adding it under `app/api/` yourself.
