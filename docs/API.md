# Chill & Connect Hub — API Contract

> **Owner:** Backend (Claude Code). **Consumers:** Frontend (Antigravity IDE) and admin console.
> This is the source of truth for how the frontend talks to the backend. If a response shape here
> differs from the code, the code is wrong or this file is stale — report it in [HANDOFF.md](HANDOFF.md).
>
> **Status:** prototype. Data is seed/mock data stored in JSON files; there are no real users yet.
> Last updated: 2026-10-10

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

### Member accounts — `/api/auth/member/*`

The server decides who is signed in through an httpOnly cookie (`cch_member_session`, 30 days). The client never sends a user id or name to identify itself. **Use `useMemberSession()` from `lib/useMemberSession.ts`.**

| Method & path | Body | Response |
|---|---|---|
| `GET /api/auth/member` | — | `{ authenticated, member: PublicMember \| null, providers: { email, google, facebook, apple }, available }`. `providers.x` is `false` until that provider's credentials are set on the server; show those buttons disabled ("ยังไม่เปิดใช้"). `available: false` means AUTH_SECRET is missing in production |
| `DELETE /api/auth/member` | — | Logs out this browser |
| `POST /api/auth/member/register` | `{ displayName (2–40), email, password (≥ 8), consent: true }` | `200 { member }` + session cookie · `400` validation (Thai `message`) · `409` email exists · `429` too many |
| `POST /api/auth/member/login` | `{ email, password }` | `200 { member }` + cookie · `401` wrong credentials · `403` suspended/banned (message says until when) · `429` |
| `GET /api/auth/member/oauth/{google\|facebook\|apple}?returnTo=/path` | — | Full-page redirect to the provider. Afterwards: an existing member returns to `returnTo?auth=success`; a **new** member goes to `/onboarding?returnTo=…`; a failure goes to `/login?auth_error=<Thai message>&returnTo=…` (the login page shows it). `returnTo` must be a site path |
| `POST /api/auth/member/password-reset` | `{ email }` | Always `200 { minutes: 30 }` whether or not the email has an account. Emails a one-time link to `/reset-password?token=…`. Without a mailer (development only) the response also carries `devResetUrl` · `400` bad email · `429` (5 per 15 min) |
| `POST /api/auth/member/password-reset/confirm` | `{ token, password (≥ 8) }` | `200 { member }` + session cookie; ends other sessions; the link works once · `400` invalid or expired link |
| `PATCH /api/auth/member/profile` | `{ displayName?, avatarUrl? }` | `{ member }` · `401` not signed in |
| `POST /api/auth/member/password` | `{ currentPassword?, newPassword }` | Other sessions end; this browser stays signed in |
| `GET /api/auth/member/account` | — | PDPA export of the member's own data (JSON download) |
| `DELETE /api/auth/member/account` | `{ confirm: "DELETE" }` | Deletes the account and logs out |

`PublicMember = { id, displayName, email?, avatarUrl?, loginMethods: ('email'|'google'|'facebook'|'apple')[], createdAt }`.
Writes must be same-origin (`403` otherwise).

- **Social sign-in:** it links to an existing account with the same verified email, otherwise it creates one.
- **Provider credentials (server env):**
  - Google: `GOOGLE_OAUTH_CLIENT_ID/SECRET`
  - Facebook: `FACEBOOK_APP_ID/SECRET`
  - Apple: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
- **Redirect URI to register with each provider:** `<site>/api/auth/member/oauth/<provider>/callback`. `APP_URL` overrides the site origin.
- **Password-reset email:** set `RESEND_API_KEY` and `MAIL_FROM` (e.g. `Chill & Connect <no-reply@your-domain>`). Without them production sends nothing.
- **Client helpers:** `useMemberSession()` / `memberActions` in `lib/useMemberSession.ts` (one shared store), and `useAuth()` in `lib/useAuth.ts`, which now reads the same server session. UI: `components/auth/AuthPanel.tsx`, used by `AuthModal`, `/login` and `/onboarding`.

### Moments — `/api/moments`

Member photo posts. Reads are public; writes need a signed-in member (`401` otherwise) and must be same-origin.
Posts go live at once. **3 distinct member reports hide a post** until a moderator restores it. Posts by banned members are not shown.

| Method & path | Body / params | Response |
|---|---|---|
| `GET /api/moments` | `?tab=all\|popular\|saved\|mine&location&targetType&targetId&q&page&limit(≤30)` | `{ moments: FeedItem[], pagination }`; `saved`/`mine` without login → `{ moments: [], requiresLogin: true }` |
| `POST /api/moments` | `{ caption (1–500), images: string[] (1–10, URLs returned by /api/upload), location?, category?: heal\|move\|chill\|learn, targetType?: spot\|community\|fair\|challenge\|general, targetId?, targetTitle? }` | `201 { moment: FeedItem }` · `400` (Thai `message`) · `429` (10 posts/hour) |
| `GET /api/moments/[id]` | — | `{ moment }` (published, or the viewer's own) · `404` |
| `PATCH /api/moments/[id]` | `{ caption?, location? }` | own posts only (`403`) |
| `DELETE /api/moments/[id]` | — | own posts only |
| `POST /api/moments/[id]/actions` | `{ action: like\|unlike\|save\|unsave }` · `{ action: 'comment', text (1–300) }` · `{ action: 'delete_comment', commentId }` (commenter or post author) · `{ action: 'report', reason }` (once per member, not your own) | `{ moment: FeedItem }`; report also returns `autoHidden` · `409` already reported |

`FeedItem` keeps the `CommunityPost` shape (`data/mockData.ts`) so the current UI fits:
`{ id, authorId, userName, userAvatar, userBadge, images, caption, location, category?, likesCount, commentsCount, timeAgo (Thai), createdAt, isLiked, isSaved, isMine, hasReported, comments: [{ id, userName, userAvatar, text, timeAgo, createdAt, isMine }], targetType, targetId?, targetTitle?, isSample }`.

- **Author details are live:** `userName` and `userAvatar` follow the author's current profile.
- **Samples:** the 24 bundled `MOCK_POSTS` are seeded as `isSample: true`, with their illustrative like counts.
- **Account deletion** removes the member's moments, comments, likes, saves and reports.

### `GET /api/master` — master data (admin-managed)

Active entries only, ordered for display:
`{ success, updatedAt, spotVibes, communityMoods, communityCategories, fairCategories, questCategories, venues, provinces, zones, communityClubs, venueGroups }`.
Cache: `public, s-maxage=60`.

- **Categories:** `{ id, name, nameEn, description, keywords[], image?, iconKey, colorKey, parentId? }`. `parentId` is the mood of a community category.
- **Venues:** `{ id, name, venueTag, province, location, transitHint, latitude?, longitude?, website?, image? }`.
- **Provinces:** `{ id (stored province name, e.g. "กรุงเทพฯ"), displayName, nameEn, region, tagline, description, image?, featured }`.
- **Zones:** `{ id, name, province }`.
- **Rail cards** (`communityClubs` for TopCommunityRail, `venueGroups` for TopVenuesRail): `{ id, name, nameEn, subtitle, image?, badgeLabel?, keywords[] }`.

Icons and colors are keys. **Use `useMasterData()` from `lib/useMasterData.ts`.** It fetches this endpoint once, falls back to the bundled defaults, and returns lists in the old constant shapes (`spotVibes` like `MASTER_SPOT_CATEGORIES`, `venues` like `MASTER_VENUE_OPTIONS`, …) plus `featuredProvinces`, `zonesFor(province)`, `communityClubs` (`TOP_COMMUNITY_CLUBS` shape) and `venueGroups` (`TOP_VENUES` shape).

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

Storage: **Vercel Blob** when the server has `BLOB_READ_WRITE_TOKEN`, or `BLOB_STORE_ID` with Vercel OIDC (automatic on Vercel) (persistent; `url` is an absolute `https://…public.blob.vercel-storage.com/…` address). Without it (local dev), files go to `public/uploads` and `url` is a site path such as `/uploads/spot/….webp`. Treat `url` as opaque either way.
Limit: 20 uploads per 10 minutes per IP for non-admin callers → `429 { success: false, message }`.

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
| `members.manage` (member accounts) | ✓ | – | ✓ | – |
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
| `/api/admin/spots` | `GET ?id=<spotId>` → `{ spot }` (any publication state, `404` if missing). `GET ?province&category (stored category such as temple, or one of the 7 vibes such as sea_island)&q&status=draft\|published&image=missing\|broken\|problem` (legacy `filter=missing_image`) → `{ spots (each with imageStatus: ok\|broken\|missing\|unchecked), totalCount, filteredCount, draftCount, missingImagesCount, brokenImagesCount, uncheckedImagesCount, distinctProvinces }`; add `page&limit` for paginated `spots` + `pagination` | `create {newSpot}` (starts as draft unless `publicationStatus: published`; stores only what was sent: `rating` and `reviewsCount` are 0, there is no stock image, labels default to the Thai category label, and `googleMapsUrl` defaults to a coordinates search link). Create and `update` require coordinates inside Thailand (`400` otherwise); `update` also accepts `contact` and `entryFee`, `update {spotId, updatedFields}`, `delete {spotId}`, `set_publication {status: published\|draft, spotIds? \| scope?: tourism_directory\|osm\|imported\|curated}` (one write; returns `{ updated }`), `auto_enrich_images` — each returns `spots`. `check_images` loads every stored image URL (public HTTPS only; results cached in memory for 6h) → `{ checked, ok, broken }` |
| `/api/admin/quests` | `GET ?status&category&q&page&limit` → `{ quests, total, pagination }` | `create {quest}` (starts as draft; accepts `startDate`, `endDate`, `image`, `brandReward`), `update {id, updatedFields}` (`brandReward: null` clears it; `daysRemaining` is ignored), `set_status {id, status: draft\|active\|ended}` (activating a quest whose `endDate` has passed returns `400`), `delete {id}` |
| `/api/admin/moments` | `GET ?filter=all\|reported\|hidden\|published\|samples&q&page&limit(≤60)` → `{ moments (with reports, all comments, authorStatus, hiddenBy, moderationNote), counts: {published, hidden, removed, reported, samples}, pagination }` | `hide {id, note (required)}`, `restore {id}` (also clears reports), `dismiss_reports {id}`, `remove {id}` (permanent), `hide_comment\|show_comment\|delete_comment {id, commentId}`. Needs `community.review`; audited |
| `/api/admin/members` | `GET ?q&status=all\|active\|suspended\|banned&page&limit` → `{ members (no password hashes; `hasPassword`), counts, pagination }` | `set_status {id, status: active\|suspended\|banned, days (suspended, 1–365), reason (required unless active)}` (suspend/ban ends the member's sessions), `force_logout {id}`. Needs `members.manage`; audited |
| `/api/admin/master` | `GET` → all collections including inactive entries (each entry has `active`, `sortOrder`, `builtIn`) | `save {collection, item}` (create when `item.id` is absent; id from `nameEn`/`name`), `set_active {collection, id, active}`, `delete {collection, id}` (not for built-in entries), `reorder {collection, ids}`. Collections: `spotVibes`, `communityMoods`, `provinces` (fixed: edit only), `communityCategories`, `fairCategories`, `questCategories`, `venues`, `zones`, `communityClubs`, `venueGroups` (rail cards need ≥ 1 keyword). Names cannot contain emoji; icons and colors must be from `ICON_OPTIONS`/`COLOR_PRESETS`; image URLs must be `https://` or `/`. Needs `system.manage` |
| `/api/admin/coverage` | `GET` → `{ vibes: [{id, label}], provinces: [{ province, total, drafts, vibes: {<vibeId>: count} }], totals: { published, drafts, vibes, emptyCells }, unknownProvinces }`. Published spots per province × the 7 frontend vibes; drafts are counted separately. `GET ?view=points` → `{ points: [{ id, title, province, vibe, status: published\|draft, lat, lng, validCoordinates }] }` for every spot (admin map) | — |
| `/api/admin/sources` | `GET` → `{ sources }` (each may carry `runHistory: [{ at, status: success\|partial\|failed, scanned, imported, duplicates, errors (≤ 3), context? }]`, newest first, last 20 runs; `context` is the province for spot runs) | `POST {name, url (https), targetType: events\|spots, ...}` add (`400` for blocked platforms: Meetup, Facebook, allevents.in, dev.events) · `PATCH {id, status}` toggle · `DELETE ?id=` remove |
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
