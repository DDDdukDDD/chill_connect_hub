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
- **`ids=a,b,c`** (added 2026-10-25, BE-122) → those approved events in the order asked, ended ones included, at most 60; unknown, pending and blocked-host ids are left out. `{ success, events, total }`, no pagination. My Hub uses it for saved events.

| Param | Values | Default | Notes |
|---|---|---|---|
| `type` | `community` \| `public_venue` \| `all` | `all` | Pillar: `/community` = `community`, `/events` = `public_venue` |
| `category` | `heal` \| `move` \| `chill` \| `learn` \| `all` | — | |
| `province` | Thai province name, `online` / `ออนไลน์`, `ทั่วไทย` | — | Fuzzy; Bangkok spellings (กทม/กรุงเทพ/bangkok) are equivalent |
| `zone` | zone id, e.g. `ari`, `siam` | — | Matches `zone` or `location` text |
| `venueTag` | `qsncc` \| `bitec` \| `impact` \| `marathon` \| `park` | — | Fairs |
| `lifestyleCategory` | a `communityCategories` id, e.g. `boardgames_party` | — | Meetups in that group: their own `lifestyleCategory`, or the group their title maps to (as on the ค้นพบ tabs). Added 2026-10-23 |
| `fairCategory` | a `fairCategories` id, e.g. `pop_culture` | — | อีเวนต์ in that group: their own `fairCategory`, or the group their title maps to (`getFairEventCategory`). Added 2026-10-25 |
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
- `title` and `location` are required (`400` otherwise). _2026-10-25 (BE-132):_ `time` ("14:00 - 17:00 น.") is required for a ตี้ (`400`); an อีเวนต์ without it is stored as "ดูเวลาที่หน้างาน".
- _2026-10-27 (BE-171):_ `zone` (the area, e.g. "อารีย์", "คลองเตย"; ≤ 40 characters, trimmed) is required for a ตี้ (`400` "กรุณาระบุย่านหรือเขตของตี้…"); online ตี้ send `"online"`, Spot Buddy trips send the place's district (else its province). List tiles show it next to the day.
- Content is screened against a banned-keyword list (`400`).
- **Approval:** community events (`eventType: 'community'`) are published immediately (`approved`). Fairs (`eventType: 'public_venue'`) are `pending` until an admin approves them — unless the request carries an admin session.
- If `eventData.id` is missing or already taken, the server assigns a new id. **Always use the returned `event.id`.**
- **Group on the ค้นพบ tabs** (optional): a meetup sends `lifestyleCategory` (a `communityCategories` id from `/api/master`), a fair sends `fairCategory` (a `fairCategories` id). The server keeps it only when it is an active group of the right kind (otherwise it is dropped), and sets a meetup's `category` (mood) from the category's mood. Without a group, the lists sort the event by its title (`getCommunityEventCategory` / `getFairEventCategory` in `data/masterHub.ts`).
- **Place from our catalog** (optional, meetups, added 2026-10-25): `placeId` (a published spot id, picked from the place suggestions in the create dialog). The server keeps it only when that spot exists and is published, and sets `placeTitle` from the spot; otherwise both are dropped. It is not a Spot Buddy trip (`spotId`): no trip rules and no extra review. The detail page links it as "ที่นัดเจอ".
- **Who it suits** (optional booleans, meetups): `isSoloFriendly`, `isBeginnerFriendly`, `isPetFriendly`, and since 2026-10-25 `isIntrovertFriendly`, `canBringFriend`, `isEnglishFriendly`, `isKidFriendly`. `targetGender` (`all` | `female_only` | `male_only`) and `targetAge` (text, `ไม่จำกัดอายุ` when empty) are shown on the detail page's "เหมาะกับ" row.
- **Runs** (`public_venue` from ThaiRun, added 2026-10-25): `raceDistances?: number[]` (km, shortest first) and `registrationOpen?: boolean`; `price` is the fee range over distances and ticket types. The อีเวนต์ page shows them as the rows ระยะ / ค่าสมัคร / การรับสมัคร.
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
| 409 | `event_full` | No seats left (community events only: a fair, `public_venue`, has no seat limit and is never marked `full`) |
| 409 | `event_ended` | Event is over, or a one-day ตี้ has passed its start time (joining closes at the start, owner 2026-10-29; message "ตี้นี้เริ่มไปแล้ว ปิดรับคนเพิ่มแล้ว") |
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

### `GET /api/spots/browse` — the /spots list, worked out on the server (added 2026-10-28, BE-176)

What `/spots` shows: published places filtered, ranked and counted with the page's own rules (`lib/spotBrowse.ts`), so the browser no longer downloads the whole catalog (~7 MB). Hidden-tier places show only when searched for or saved.

| Param | Values | Default |
|---|---|---|
| `q` | search words (same matching as the ค้นพบ search) | — |
| `province` | Thai province name (aliases like "เชียงใหม่" work as on the page) | all |
| `category` | a vibe group id (`MASTER_SPOT_CATEGORIES`) or a plain spot category | all |
| `price` | `free` | — |
| `ids` | comma-separated place ids (the member's saved places; ≤ 500) | — |
| `lat`, `lng` | a position: nearest first, each place gets `distanceKm` | ranked order |
| `t` | ms timestamp the list was opened (keeps "new" places in place across "แสดงเพิ่มเติม") | now |
| `limit` | 1–200 | `24` |

Response `200`: `{ success: true, spots: LifestyleSpotItem[], total, counts: Record<vibeId | 'all', number>, railIds: string[], openedAt }`. `spots` are list items: no gallery, contact or source fields, description cut to 280 characters, `curation` reduced to tier and score. Open `/spots/[id]` (or `GET /api/spots/[id]`) for the full place. `counts` are per vibe group in the picked province (for the category tabs); `railIds` are the groups with enough places to show on the rail.

### `GET /api/spots/[id]` — one spot

Returns one **published** spot (`404` for drafts and unknown ids). The id is URL-encoded.

Response `200`: `{ success: true, spot: LifestyleSpotItem }`. Cache: `s-maxage=60`.

`spot.meetupAllowed` is `true` when staff opened the place for member meet-ups (Spot Buddy). Places in the `bar` category never qualify.

### `GET /api/spots/[id]/trips` — Spot Buddy on one place

Response `200`: `{ success: true, meetupAllowed: boolean, trips: EventItem[], host?: { canHost: boolean, reason?: string } }`. Never shared-cached.

- `meetupAllowed: false` → `trips` is empty and the page shows no Spot Buddy block.
- `trips`: approved, not ended community events with this `spotId`, soonest first, without events from people the viewer blocked. Each carries `spotId`, `spotTitle` and `minParticipants` (3); a trip is confirmed when `participantsCount >= minParticipants` (`isTripConfirmed` in `lib/spotTripRules.ts`).
- `host`: only for a signed-in viewer. `canHost: false` comes with a Thai `reason` to show next to the disabled button.

### Spot Buddy trips — `POST /api/events` with `eventData.spotId`

Sending `spotId` makes the event a Spot Buddy trip, and the server applies these rules (`lib/social/spotTrips.ts`). A refusal answers `{ success: false, message }` with `400`, `403` or `404`.

- The place must exist, be published and have `meetupAllowed`.
- The member must be allowed to host: no open report or risk flag, at most 2 trips still open, and they have been to something before (checked in by a host, or a fair in their plan or a fair meet-up group that is over). Members with an approved host application skip the last check.
- `date` is `YYYY-MM-DD`, today or later. `time` is `HH:MM - HH:MM`, inside 06:00 - 19:00, one day only. The saved event stores the date like every other ตี้ (`"12 ต.ค. 2569"`), not the `YYYY-MM-DD` that was sent.
- Send `meetingSpot`: one of `SPOT_TRIP_MEETING_POINTS` (`lib/spotTripRules.ts`). Anything else falls back to the first.
- The server sets these itself and ignores what was sent: `eventType: 'community'`, `location`, `province`, `meetingPoint`, `latitude`, `longitude`, `spotTitle`, `transportation`, `minParticipants: 3`, and `maxParticipants` held to 3 - 15.
- A member's trip always starts as `pending` and waits for staff review, approved hosts included. Without `spotId`, the fields `spotId`, `spotTitle` and `minParticipants` are dropped.

`GET /api/events` also takes `spotId` as a filter.

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
| `POST /api/auth/member/register` | `{ email, password (≥ 8), consent: true, ageConfirmed: true, displayName? (2–40) }`; without `displayName` the account is named "สมาชิกใหม่" until onboarding sets one (the sign-up form no longer asks) (both must be `true`; the server records the consent, see below) | `200 { member }` + session cookie · `400` validation (Thai `message`) · `409` email exists · `429` too many |
| `GET /api/auth/member/invite` (added 2026-10-25, BE-136) | — | `{ code, url, invitees: [{ id, displayName, avatarUrl?, joinedAt, wentTogether }] }`: my invite link (`/?ref=CODE`, made on first ask) for "ตั๋วเพื่อนซี้" and the friends who signed up with it; `wentTogether` = both were checked in at one ตี้ · `401`. Any page opened with `?ref=CODE` keeps the code in the cookie `cch_ref` (30 days, `components/InviteRefCapture.tsx`); sign-up by email or social login then links the new account to that member (`invitedBy`, never shown to others). `POST /register` also accepts `ref` in the body. A bad code never fails sign-up |
| `POST /api/auth/member/login` | `{ email, password }` | `200 { member }` + cookie · `401` wrong credentials · `403` suspended/banned (message says until when) · `429` |
| `POST /api/auth/member/demo` | — | **Prototype only** (added 2026-10-15): signs in as the shared test account "ผู้ทดลองใช้" (`mem_demo_tester`, verified, pledged, onboarded). `200 { member }` + cookie · `404` unless the server has `DEMO_LOGIN=on` (always on in local development) · `503` without `AUTH_SECRET`. The account is rebuilt on any server instance that lacks it, so its session survives Vercel instances. `GET /api/auth/member` returns `demoLogin: true` when the login screen should offer it |
| `GET /api/auth/member/oauth/{google\|facebook\|apple}?returnTo=/path` | — | Full-page redirect to the provider. Afterwards: an existing member returns to `returnTo?auth=success`; a **new** member goes to `/onboarding?returnTo=…`; a failure goes to `/login?auth_error=<Thai message>&returnTo=…` (the login page shows it). `returnTo` must be a site path |
| `POST /api/auth/member/password-reset` | `{ email }` | Always `200 { minutes: 30 }` whether or not the email has an account. Emails a one-time link to `/reset-password?token=…`. Without a mailer (development only) the response also carries `devResetUrl` · `400` bad email · `429` (5 per 15 min) |
| `POST /api/auth/member/password-reset/confirm` | `{ token, password (≥ 8) }` | `200 { member }` + session cookie; ends other sessions; the link works once · `400` invalid or expired link |
| `GET /api/auth/member/preferences` | — | `{ preferences: MemberPreferences \| null, onboarded }` · `401` |
| `PUT /api/auth/member/preferences` | `{ intent: member\|host\|venue\|organizer, goals: string[], birthYear?, gender?: female\|male\|lgbtq, interests: { communityCategories[], spotVibes[], fairCategories[] }, province? }` | `{ preferences, member }`. Replaces the stored answers; ids not in master data are dropped; the first save sets `onboarded`. `400` if `birthYear` is under 18 or invalid |
| `GET /api/auth/member/profile` | — | My own profile: `{ member, details: MemberProfile, preferences, hostApplication, publicView }` (`details` includes hidden fields) |
| `PATCH /api/auth/member/profile` | `{ displayName?, avatarUrl?, bio?, occupation?, workplace?, education?, hometown?, livingArea?, relationshipStatus?, connectGoal?, hidden?: ProfileFieldKey[] }` | `{ member, details }` · `400` when a not-yet-trusted member puts contact details in a field |
| `POST /api/auth/member/pledge` | `{ accept: true }` | `{ member }`. Records acceptance of the community pledge |
| `POST /api/auth/member/verify-email` | — | Sends the verification link again. `{ sent, devVerifyUrl? }` (`devVerifyUrl` only in development without a mailer) · `429`. With `SKIP_EMAIL_VERIFICATION=true` it verifies the email at once and returns `{ alreadyVerified: true }` |
| `POST /api/auth/member/verify-email/confirm` | `{ token }` | `{ member }` · `400` invalid or expired (48 hours). The link opens `/verify-email?token=…` |
| _2026-10-23 (BE-103)_ | `register` and `verify-email` also take `returnTo` (a same-site path such as `/community/<id>?join=1`). The emailed link then ends with `&next=…`, and `/verify-email` offers a button back there. Anything that is not a same-site path is dropped (`safeReturnPath`). | |
| `GET /api/auth/member/host-application` | — | `{ application: HostApplication \| null }` |
| `POST /api/auth/member/host-application` | `{ kind: host\|venue\|organizer, about (30–600), link? (https) }` | `{ application, member }` · `403` until verified · `400` when one is pending or approved |
| `GET /api/members/[id]` | — | Public profile: `{ profile: { id, displayName, avatarUrl?, memberSince, about: {visible fields}, gender?, ageBand?, province?, interests?, badges: { emailVerified, pledged, trusted, approvedHost, hostKind? }, isMe, viewer?: { hasBlocked, hasReported } } }` · `404` for suspended, banned or unknown members |
| `GET /api/members/[id]/reviews` | — | Every review of the ตี้ this member hosted (up to 200): `{ reviews: { count, average, latest: [{ id, rating, text, eventTitle, authorId, authorName, timeAgo }] } }`; the profile itself (`hostReviews`) carries the latest 4 (added 2026-10-25, BE-121) |
| `GET /api/members/[id]/actions` | — | `{ reasons: string[] }` for the report dialog |
| `POST /api/members/[id]/actions` | `{ action: 'report', reason }` (once per member) · `{ action: 'block' }` · `{ action: 'unblock' }` | `{ success }` · `403` reporter not verified · `409` already reported |
| `POST /api/auth/member/password` | `{ currentPassword?, newPassword }` | Other sessions end; this browser stays signed in |
| `GET /api/auth/member/account` | — | PDPA export of the member's own data (JSON download) |
| `DELETE /api/auth/member/account` | `{ confirm: "DELETE" }` | Deletes the account and logs out. Since 2026-10-13 (BE-061) the uploaded files of the member's moments, stories and avatar are deleted too (`lib/media/cleanup.ts`), except a file that remaining content still shows |

`PublicMember = { id, displayName, email?, avatarUrl?, loginMethods: ('email'|'google'|'facebook'|'apple')[], createdAt, onboarded, trust }`, with `trust = { level: 'new'|'verified'|'trusted', emailVerified, hasEmail, pledged, hostStatus: 'none'|'pending'|'approved'|'rejected', accountDays }`.
Writes must be same-origin (`403` otherwise).

- **Social sign-in:** it links to an existing account with the same verified email, otherwise it creates one. Add `&consent=1` to the OAuth start URL only when the member ticked the age and terms boxes on the sign-up screen (`memberActions.loginWith(provider, returnTo, true)`).
- **Trust levels** (`lib/members/trust.ts`): `new` → `verified` (email verified and pledge accepted) → `trusted` (verified, 7 days old and no open risk flag, or an approved host).
  - Posting a moment or a comment needs `verified` (`403` with a Thai message that says what is missing).
  - Until `trusted`: 3 moments and 20 comments a day (`429`), and no links, phone numbers or LINE ids in captions, comments or profile fields (`400`).
  - Register returns `verification: { sent, devVerifyUrl? }`; social accounts arrive with a verified email.
  - **Prototype switch `SKIP_EMAIL_VERIFICATION=true`** (server env, added 2026-10-16): email sign-ups are verified at once and no link is sent, so a deployment without a mailer (Vercel) can join meetups and post. The pledge is still asked. Must be off at launch (docs/LAUNCH_CHECKLIST.md).
  - Badges on a profile come only from these facts. Do not draw a "verified" badge from anything else.
- **Risk flags** are staff-only: throwaway email, risky words in a name, post, profile or host application, attempts to post contact details, and reports from members. They never appear in any member-facing response.
- **Blocking** hides the blocked member's moments from the blocker's feed. `GET /api/moments?author=<memberId>` lists one member's public moments.
- **Community events** created through `POST /api/events` publish at once only for staff and for members whose host application is approved; everyone else's wait for review (`approvalStatus: 'pending'`).
- **Consent record (PDPA):** each account stores `consent = { termsVersion, acceptedAt, ageConfirmedAt?, source: 'signup_form' | 'social_login' }`. `social_login` means a new account was created from the log-in screen, which shows the terms notice but has no boxes, so there is no age confirmation.
- **Onboarding answers** live on the account (`preferences`), not in the browser. `intent` other than `member` is what the member said they want to do; it grants no role.
- **Display names** are cleaned on the way in and when shown (`lib/displayName.ts`): stray Thai marks, invisible characters and repeated spaces are removed.
- **Export and delete:** `GET /api/auth/member/account` now includes `consent` and `preferences` and never includes password or reset data. A self-delete writes an audit entry with the member id only.
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
| `GET /api/moments` | `?tab=all|popular|following|saved|mine&category=heal|move|chill|learn&location&targetType&targetId&q&page&limit(≤30)`\|popular\|saved\|mine&location&targetType&targetId&q&page&limit(≤30)` | `{ moments: FeedItem[], pagination }`; `saved`/`mine` without login → `{ moments: [], requiresLogin: true }` |
| `POST /api/moments` | `{ caption (1–500), images: string[] (1–10, URLs returned by /api/upload), location?, category?: heal\|move\|chill\|learn, targetType?: spot\|community\|fair\|challenge\|general, targetId?, targetTitle? }` | `201 { moment: FeedItem }` · `400` (Thai `message`) · `429` (10 posts/hour) |
| `GET /api/moments/[id]` | — | `{ moment }` (published, or the viewer's own) · `404` |
| `PATCH /api/moments/[id]` | `{ caption?, location? }` | own posts only (`403`) |
| `DELETE /api/moments/[id]` | — | own posts only |
| `POST /api/moments/[id]/actions` | `{ action: like\|unlike\|save\|unsave }` · `{ action: 'comment', text (1–300) }` · `{ action: 'delete_comment', commentId }` (commenter or post author) · `{ action: 'report', reason }` (once per member, not your own) | `{ moment: FeedItem }`; report also returns `autoHidden` · `409` already reported |

`FeedItem` keeps the `CommunityPost` shape (`data/mockData.ts`) so the current UI fits:
`{ id, authorId, userName, userAvatar, userBadge, images, caption, location, category?, likesCount, commentsCount, timeAgo (Thai), createdAt, isLiked, isSaved, isMine, hasReported, comments: [{ id, userName, userAvatar, text, timeAgo, createdAt, isMine }], targetType, targetId?, targetTitle?, isSample }`.

- **Author details are live:** `userName` and `userAvatar` follow the author's current profile.
- **Samples:** the 24 bundled `MOCK_POSTS` are seeded as `isSample: true`, with their illustrative like counts. 20 of them are tied to a real place or event in the stores (BE-042); on start, a stored sample takes `targetType`, `targetId`, `targetTitle` and `location` from the bundled one, and nothing else.
- **Homepage row:** `components/CommunityMomentsStrip.tsx` shows the 12 newest from `GET /api/moments?tab=all&limit=12` and the full count from `pagination.totalCount`.
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
| `category` (an id of the master data `communityCategories` since 2026-10-16: `running_fitness` `wellness_mind` `cafe_social` `boardgames_party` `arts_crafts` `travel_outdoor` `tech_skills` `pets_family`, plus any staff added; older ids are mapped on read, see `LEGACY_QUEST_CATEGORIES`) | — |
| `q` | — |
| `page` | `1` |
| `limit` (1–100) | `12` |

Response `200`: `{ success: true, quests: ChallengeQuest[], pagination: Pagination }`. Cache: `s-maxage=60`.

**The catalog is the only source (BE-042, BE-043).** `/challenges` also shows this endpoint only; the four quests once typed into that page are seed quests now. The homepage challenge row (`components/CommunityChallengeBar.tsx`) shows what this endpoint returns and keeps no list of its own. The sample quests live in `MOCK_CHALLENGES` (`data/mockData.ts`); a store written earlier is given each new seed quest once on start, and the ids already given are kept in `questSeedIds` in `data/discovery_content.json`, so a seed quest staff deleted does not come back. The cover photo is `badgeCoverImg`.

**Quest lifecycle (computed by the server on every read, never stored):**
- `daysRemaining`: whole days left until the end of `endDate`; `0` once ended; absent when the quest has no `endDate`.
- `startsInDays`: whole days until `startDate` while the challenge has not started (added 2026-10-15); absent once it runs. Visits before `startDate` never count. Derived on every read, like `daysRemaining`.
- `status`: `'ended'` once `endDate` has passed (or an admin closed it early), otherwise `'active'`. Ended quests **are returned** so the UI can show an archive; filter them out of "active" rails on the client.
- Dates are Thai (`"31 ธ.ค. 2026"`) or ISO (`"2026-12-31"`) strings. Display them as-is or parse both formats.

**Reward type — `brandReward` (`QuestReward` from `@/data/mockData`):**
```ts
brandReward?: {
  type: 'brand_partner' | 'hub_central';
  title: string;            // the reward / exclusive privilege
  shortTitle?: string;      // card label, at most 24 characters (Thai letter + marks = 1); 400 when longer
  partnerName: string;      // brand name; always "Chill & Connect Hub" for hub_central
  voucherCodePrefix?: string; exclusiveNotice?: string;   // brand_partner only
  hubRewardNote?: string;                                 // hub_central only
  terms?: string;
}
```
`brand_partner` quests always have `partnerName` and `title`. Cards show the prize with `questPrizeLabel(quest)` from `@/lib/questDisplay`: `shortTitle`, else `title` without "(มูลค่า …)" and a trailing "+ N XP", empty for the generic "สะสม XP…" line (added 2026-10-19). Quests without `brandReward` have no declared reward type yet — treat them as `hub_central`. `image` (optional cover URL) is also available.

### `GET /api/discover/counts` — numbers on the ค้นพบ tabs (added 2026-10-17, BE-082)

Query: `q` (search word, optional), `province` (`all` or a province name; `ออนไลน์` for online meetups).
Response: `{ success: true, counts: { meetups, fairs, spots, challenges } }`.

- `meetups`, `fairs`: approved and not over; `spots`: published places; `challenges`: open challenges, counted only when `q` is given (it ignores `province`).
- Matching is `lib/discoverMatch.ts`, the same code `/community`, `/events`, `/spots` and `/challenges` filter with, so a tab's number equals the cards that page shows for the same word and province with its other filters at their defaults.
- Cached for 60 seconds (`s-maxage=60`).

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
| `/api/admin/events` | `GET` → `{ events: AdminEventItem[] (all moderation states), total, autoPublish }`. **Paginated mode** when `page` is present: `?page&limit(≤100)&type=community\|public_venue&status=pending\|approved\|rejected\|all&format=recurring\|online\|physical\|all&q` → `{ events, counts: {total,pending,approved,rejected,recurring,online}, pagination }`, sorted pending-first then newest; `counts` cover the whole `type` | `create {eventData}` (needs `eventType`; `lifestyleCategory` / `fairCategory` checked as on `POST /api/events`; validated with the platform form rules (title ≥ 5, province, location, description ≥ 15 plain characters, date; community also needs time and 2–15 people; fairs need `hostName`) and returns `400` otherwise; `approvalStatus` is `approved` only when sent as such, otherwise `pending`), `update_status {id, status: approved\|rejected\|pending}`, `approve_all`, `update_fields {id, updatedFields}` (only content fields are applied, including `lifestyleCategory` / `fairCategory`, checked as on `POST /api/events`; `approvalStatus`, `participantsCount`, `id`, `eventType` and `source` are ignored; changed fields are validated with the same rules), `delete {id}`, `toggle_auto_publish {autoPublish}`, `reset_and_seed` — each returns the updated `events` list |
| `/api/admin/spots` | `GET ?id=<spotId>` → `{ spot }` (any publication state, `404` if missing). `GET ?province&category (stored category such as temple, or one of the 7 vibes such as sea_island)&q&status=draft\|published&image=missing\|broken\|problem` (legacy `filter=missing_image`) → `{ spots (each with imageStatus: ok\|broken\|missing\|unchecked), totalCount, filteredCount, draftCount, missingImagesCount, brokenImagesCount, uncheckedImagesCount, distinctProvinces }`; add `page&limit` for paginated `spots` + `pagination` | `create {newSpot}` (starts as draft unless `publicationStatus: published`; stores only what was sent: `rating` and `reviewsCount` are 0, there is no stock image, labels default to the Thai category label, and `googleMapsUrl` defaults to a coordinates search link). Create and `update` require coordinates inside Thailand (`400` otherwise); `update` also accepts `contact` and `entryFee`, `update {spotId, updatedFields}`, `delete {spotId}`, `set_publication {status: published\|draft, spotIds? \| scope?: tourism_directory\|osm\|imported\|curated}` (one write; returns `{ updated }`), `auto_enrich_images` — each returns `spots`. `check_images` loads every stored image URL (public HTTPS only; results cached in memory for 6h) → `{ checked, ok, broken }` |
| `/api/admin/quests` | `GET ?status&category&q&page&limit` → `{ quests, total, pagination }` | `create {quest}` (starts as draft; accepts `startDate`, `endDate`, `image`; `brandReward` and `rule` are required, `400` without either), `update {id, updatedFields}` (`brandReward` and `rule` can be changed but not removed: `null` returns `400`; `daysRemaining` is ignored), `set_status {id, status: draft\|active\|ended}` (activating a quest whose `endDate` has passed, or one that has no `rule`, returns `400`), `delete {id}` | `preview_rule {rule}` → `{ total, targets: [{ title, detail }] (up to 5) }`: how many places or events a rule being written would count (added 2026-10-15). A rule may also name `vibes` (spotVibes ids such as `mountain_mist`), matched with `getSpotVibeCategory`, the grouping /spots uses.
| `/api/admin/campaigns` (added 2026-10-25, BE-136) | `GET` → `{ campaigns: (Campaign & { live, stats: CampaignStats })[], quests: [{ id, title, status, startDate, endDate, rewardPoints }], rewards: [{ id, title, costXp, drawLabel? }] }` (types in `lib/campaigns/types.ts`; stats are worked out on each read: sign-ups in the period, first ตี้ within 14 days, sign-ups through invite links and how many went to a ตี้ with their inviter, prize entries, and joined/finished per challenge) `GET ?lite=1` → `{ campaigns: [{ id, name, questIds, extraQuestIds, published }] }` without stats | `save {campaign}` (new when `campaign.id` is empty or unknown; `400` with a Thai `error` for a short name or headline, a headline saying "รับฟรี", bad dates, an unknown reward; unknown challenge ids are dropped), `delete {id}`. Needs `content.edit`; audited. Public pages read the running campaign on the server (`liveCampaign()`); there is no public campaign endpoint |
| `/api/admin/moments` | `GET ?filter=all\|reported\|evidence\|hidden\|published\|samples&q&page&limit(≤60)` → `{ moments (with reports, all comments, authorStatus, hiddenBy, moderationNote, countsToward, evidenceRejected), counts: {published, hidden, removed, reported, samples}, pagination }` | `hide {id, note (required)}`, `restore {id}` (also clears reports), `dismiss_reports {id}`, `remove {id}` (permanent), `hide_comment\|show_comment\|delete_comment {id, commentId}`, `reject_evidence {id, note (required)}`, `accept_evidence {id}` (see "Evidence review"). Needs `community.review`; audited |
| `/api/admin/stories` | `GET` → `{ stories: [{ id, authorId, authorName, authorStatus, image, caption, createdAt, hoursLeft, views, hidden, reports: [{ reason, at }] }], counts: { active, reported, hidden } }`: every story still inside its 24 hours, hidden ones included, most reported first | `remove {id}` (permanent), `hide {id}` (until it expires), `restore {id}` (shows it again and clears its reports); `404` when the story has expired. Needs `community.review`; audited |
| `/api/admin/members?queue=flagged\|hosts` | `GET` → the same list shape, limited to accounts with open risk flags or reports, or with a pending host application. Each member also carries `trust`, `hasOpenRisk`, `riskFlags`, `reportsReceived`, `hostApplication` | Actions: `clear_flags {id}` and `host_decision {id, decision: approve\|reject, note? (required to reject)}`. Needs `members.manage`; audited |
| `/api/admin/members?view=overview` | `GET` → `{ overview: { total, newThisWeek, onboarded, wantsToHost, byMethod, topInterests[{id, members}], readiness: { sessionSecret, providers, mailer, durableStorage } } }` | Needs `members.manage` |
| `/api/admin/members?export=<id>` | `GET` → JSON download of everything stored about one member (for a PDPA access request); audited | Needs `members.manage` |
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

## Events created by a member (added 2026-10-10)
- `GET /api/events?mine=1` → `{ success, events, total }`: events the signed-in member created, any `approvalStatus` (`approved`, `pending`, `rejected`). Signed out: empty list with `requiresLogin: true`. Not cached.
- `GET /api/events?host=<memberId>` → `{ success, events, total }`: that member's `approved` events only. Public. Not cached.

## Following and suggested members (added 2026-10-11)
- `POST /api/members/{id}/actions` with `{ action: 'follow' | 'unfollow' }` → `{ success, following, followerCount }`. Signed-in members only; blocking a member also unfollows them.
- `GET /api/members/{id}` and `GET /api/auth/member/profile` (`publicView`) now include `followerCount`, `followingCount`; `viewer.isFollowing` on another member's profile.
- `GET /api/members/suggested` → `{ success, members: [{ id, displayName, avatarUrl, momentCount, trusted, approvedHost }] }`: up to 5 verified members with published moments, without the viewer, people they follow or blocked, and accounts with open risk flags.
- `GET /api/members/interest-count?ids=cafe_social,running_fitness` (added 2026-10-23) → `{ success, people }`: how many active members picked at least one of these `communityCategories` ids in onboarding. A number only, never names (interests are private answers). Used by the onboarding "บอกสิ่งที่ชอบ" side panel.
- `GET /api/moments?tab=following`: moments by members the viewer follows (signed out: empty list with `requiresLogin`).
- `GET /api/moments/journey` (added 2026-10-23) → `{ success, following, reacted, posted }`: the signed-in member's steps on the moments path of the home journey band (people followed; has liked or commented on someone else's published moment; has posted one). `401` signed out.

## Stories and notifications (added 2026-10-11)
- `GET /api/stories` → `{ success, groups: [{ author: { id, displayName, avatarUrl }, isMine, isFollowing, allSeen, stories: [{ id, image, caption, captionLayout?, captionColor?, target?, createdAt, hoursLeft, seen, views? }] }] }`. Only stories younger than 24 hours; `views` is sent to the author only. Order: own, followed, unseen, seen.
- `POST /api/stories` `{ image (from /api/upload), caption? (≤120), captionLayout?, captionColor?, target? }` → `201 { story }`. `captionColor` is one of `white | black | yellow | orange | pink | blue | green` (`lib/storyTextColors.ts`); anything else, or none, is white. `captionLayout` `{ x, y, rotate }` is where the text sits: its centre as a share (0..1) of the photo frame's width and height, and its turn in degrees (kept to -180..180); without it the text sits in the middle. `target` is the "อยู่ที่ไหน" sticker, `{ type: 'community' | 'fair' | 'spot', id, title (≤120) }`; one with a missing part or an id that is not a plain slug is dropped (2026-10-30). Same trust rules as a moment (verified account, no contact details for new accounts); at most 5 active stories per member.
- `POST /api/stories/{id}` with `{}` marks it seen by the signed-in member; with `{ action: 'report', reason }` reports it (once per member, 3 distinct reports hide it, staff get a risk flag). Story items include `hasReported`. `DELETE /api/stories/{id}` removes one's own story.
- `GET /api/notifications` → `{ success, items: [{ id, type, actorId, actorName, actorAvatar, momentId?, href?, message, preview?, timeAgo, read }], unread }`. `POST /api/notifications` marks all as read. Types: `follow`, `like`, `comment`, `challenge`, `evidence`, `match`, `seat`, `question`, `answer`, and since 2026-10-26 (BE-154) for hosts: `approved` (staff published their ตี้ or อีเวนต์; `href` is its page), `rejected` (`href` is `/myhub`), `joined` (someone joined their ตี้; the actor is that person, `href` is the ตี้). The preview of these three is the ตี้'s title. Site notices (`challenge`, `evidence`, `seat`, `approved`, `rejected`) carry `actorName: 'Chill & Connect Hub'`.
  - _2026-10-23 (BE-105):_ `type` may also be `match` (someone picked the member back after a ตี้; `href` points to that ตี้ `#meet-again`).
- Created by the server on follow, like and comment (never for one's own action; a repeated like or follow is one item). Deleted with the account.
- Feed items of sample posts (`isSample`) are returned without decorative emoji.
- `POST /api/moments` also accepts `imageRatio` (number, width / height of the first photo, stored between 0.3 and 3); feed items return `imageRatio` when it was saved.

## Member activity: joining events, saved places (added 2026-10-11)
- `GET /api/auth/member/activity` → `{ success, joined, hosted, cancelled, joinedIds, savedSpotIds, savedEventIds }`. `joined` / `hosted` / `cancelled` are full events (`joinedAt`, `cancelledAt`, `isHost` added). Signed out: empty lists with `requiresLogin`.
- `POST /api/auth/member/activity`
  - `{ action: 'join', eventId }` → `{ success, status: 'joined' | 'already_joined' | 'event_full' | 'event_ended' | 'not_found' | 'not_allowed', message, event }`. HTTP 200 / 409 / 404 / 403. Community events need a verified account (email + pledge); fairs (`public_venue`) only need a signed-in member. Only `approved` events can be joined.
  - `{ action: 'leave', eventId }` gives the seat back and records the event under `cancelled`. The creator of an event cannot leave it (409).
  - `{ action: 'forget_cancelled', eventId }` removes it from the cancelled history.
  - `{ action: 'save' | 'unsave', kind: 'spot' | 'event', id }` → `{ success, savedSpotIds, savedEventIds }`.
- `POST /api/events { action: 'join', eventId }` (older route) now uses the session member and the same rules; `participant` in the body is ignored.
- Creating an event adds its creator as the first participant. Deleting an account removes the member from every event and gives the seats back.
- Client: `lib/useMyActivity.ts` (`useMyActivity()`, `activityActions.join/leave/setSaved`). The Navbar mounts `useActivitySync()`, which also mirrors the lists into the older localStorage keys (`joined_event_ids`, `favorites`, `favorite_spots`) and sends hearts toggled by older pages to the account.

## Tickets, host check-in and reviews (added 2026-10-11)
- `GET /api/events/{id}/ticket` → `{ ticket: { code, joinedAt, checkedInAt, isHost, hasHostCheckIn } }` for the signed-in participant (404 otherwise). `code` is 6 characters (A–Z without I/O, 2–9), unique within the event and created when the member joins. `hasHostCheckIn` is false for official and sample events, which nobody checks in.
- `GET /api/events/{id}/participants` → `{ event, participants: [{ userId, userName, userAvatar, joinedAt, checkedInAt, isHost }] }` for the member who created the event only (403 otherwise). Ticket codes are never listed.
- `GET /api/quests/{id}/members` → the same shape as attendees below, for a challenge: who joined it, in join order (added 2026-10-16). `total` is `participantsCount` (sample starting count) plus the listed joins. 404 for an unknown id.
- `GET /api/events/faces?ids=a,b,c` → `{ stacks: { [eventId]: { faces: [{ id, name, avatar }], listed } } }` for anyone (added 2026-10-27, BE-170): the first 3 people of up to 60 ตี้ in one request, for list tiles (`components/MeetupTile.tsx` batches the tiles on screen). In join order; people the viewer blocked are left out; `listed` is how many people the ตี้ lists. Unknown ids come back with no faces. Use `/attendees` below for the full list.
- `GET /api/events/{id}/attendees` → `{ total, attendees: [{ id, name, avatar, verified, isHost, isMe }] }` for anyone, signed in or not (added 2026-10-16; the owner decided the list is open and members cannot hide from it). Host first, then in join order; people the viewer blocked are left out. `verified` = email verified and pledge accepted. `total` is the event's `participantsCount`, which can be larger than the list for sample events. 404 for fairs (`public_venue`) and unknown ids.
- `POST /api/events/{id}/participants` `{ action: 'check_in', code }` or `{ action: 'check_in' | 'undo', userId }` → `{ participant }`. Host only; a wrong code is 404.
- `POST /api/events/{id}/review` `{ rating: 1-5, text? (≤300) }` → 201. One per participant per event. Events with a member host need the host's check-in; other events can be reviewed after they end. The host cannot review their own event. Text follows the same trust rules as a comment.
- `GET /api/events/{id}/meet-again` → `{ people: [{ id, name, avatar, picked, matched, roomId? }] }` and `POST … { userId, want?: boolean }` → `{ picked, matched, roomId? }` (added 2026-10-23, BE-105). "อยากเจออีก" after a ตี้: only the host and the participants the host checked in can see and pick each other (403 otherwise; 400 for events without a member host). Picks are private: someone else's pick is never returned unless it is mutual. A mutual pick returns `roomId` = `pair~<id>~<id>` for `GET/POST /api/chat/{roomId}` (only the two can open it, and only while the pick stands and neither blocked the other) and sends the other person a `match` notification (`href` = the ตี้ page `#meet-again`).
- _2026-10-23 (BE-107):_ `GET /api/events/{id}/dates` (public) → `{ dates: [{ date: YYYY-MM-DD, label, eventId|null, taken, max, full }] }` for a recurring ตี้; join one date with `POST /api/auth/member/activity { action: 'join', eventId: <series>, date }` (the response's `event` is that date's own event, id `<series>--YYYY-MM-DD`, `seriesId` set; such events are never listed on their own). `GET/POST /api/events/{id}/waitlist` (`{ action: 'join'|'leave' }`) → `{ inLine, position?, offeredUntil?, waiting }`; an offered seat is held 2 hours (join by others answers 409 `event_full`). `GET /api/events/{id}/questions` (public) → `{ canAnswer, hostName, questions: [{ id, authorName, text, timeAgo, isMine, answer? }] }`; `POST { action: 'ask', text } | { action: 'answer', id, text } (host) | { action: 'remove', id }`. `GET /api/events/{id}/attendees` items add `attendance: { attended, total }` (member-hosted ตี้) and `arrived` (only when the viewer is in the ตี้). `GET /api/quests/{id}/checklist` (signed in) → `{ items: [{ targetType, id, title, href, at, status: counted|pending|rejected, note?, momentId? }], current, total }`. `POST /api/visits { action: 'mark', …, review? (≤300) }` and `GET /api/visits?reviews=spot:ID|fair:ID` → `{ count, average, reviews: [{ id, authorName, rating, text, at }] }`. Notifications add types `seat`, `question`, `answer`.
- `GET /api/members/{id}` and the own-profile `publicView` include `hostReviews: { count, average, latest: [{ id, rating, text, eventTitle, authorId, authorName, timeAgo }] }`.
- `GET /api/auth/member/activity`: joined events carry `checkedInAt` and `hasHostCheckIn`; the response adds `reviewedEventIds`.

## Group chat and fair meet-up groups (added 2026-10-11)
- `GET /api/chat/{roomId}?after=<ISO time>` → `{ room: { title, members }, messages: [{ id, authorId, authorName, authorAvatar, text, createdAt, isMine }] }`. `roomId` is an event id (participants and the event's host) or a fair group id `grp_…` (group members). Others get 403. Up to 100 messages per call; poll with `after`.
- `POST /api/chat/{roomId}` `{ text }` (≤500) → 201; `{ action: 'delete', id }` removes one's own message. Verified accounts only; accounts younger than 7 days cannot send links, phone numbers or LINE ids.
- `GET /api/events/{fairId}/groups` → `{ groups: [{ id, title, meetupPoint, time, note, maxMembers, currentMembers, creator: { id, displayName, avatarUrl }, isJoined, isMine }] }` (public).
- `POST /api/events/{fairId}/groups` `{ action: 'create', title, meetupPoint, time, note?, maxMembers? (2-15) }` · `{ action: 'join' | 'leave', groupId }` → `{ groups }`. Verified accounts only; at most 2 groups per member per fair; a full group answers 409; leaving one's own group closes it. Creating or joining also adds the fair to the member's plan.
- `GET /api/auth/member/activity` adds `fairGroups: [{ id, fairId, fairTitle, title, time, meetupPoint, isMine }]`.
- **Development only:** `POST /api/dev/demo` fills the signed-in account with sample activity (verified and trusted, upcoming events, a hosted event with participants and chat, an attended past event); `DELETE /api/dev/demo` removes the two sample events. Both return 404 in production.
- **Check-in link (2026-10-11):** a ticket's QR encodes `/checkin?event={id}&code={ticketCode}`. The page calls `POST /api/events/{id}/participants { action: 'check_in', code }` with the visitor's session, so only the event's host can complete it.
  - _2026-10-26 (BE-153):_ `check_in` returns `409 "เช็กอินได้ตั้งแต่วันที่ตี้เริ่ม"` before the event's start date (opens 12 hours before that date's midnight, to cover the server time zone). Dates without a day number (a series) are not limited; `undo` is never limited.

---

## Member submissions and dates (added 2026-10-11, BE-028)

### Dates are in the Buddhist Era
Every event `date` / `endDate` and quest `startDate` / `endDate` returned by the API is Thai text with a B.E. year (`"14 ต.ค. 2569"`, `"21 ต.ค. 2569 - 24 ต.ค. 2569"`). Stored C.E. values are converted when read. `lib/dateUtils.ts` parsers read both eras. Use `formatThaiDateBE('2026-10-14')` to format a date input's value and `toBuddhistEra(text)` for existing text.

### `POST /api/events` — who may create
Signed-in, verified members only (email verified and pledge accepted); otherwise `401` / `403`. `eventType: 'public_venue'` (a fair) is accepted only from an approved organizer or venue (`403` otherwise). `contactChannel` from members is dropped. Community events of an approved host are `approved` at once; everything else is `pending`.

### `POST /api/spots` — a member suggests a place
Body: `{ title, category, province, description, openHours, latitude, longitude, district?, googleMapsUrl?, bestTime?, price?, image?, highlights?: string[] }`.
`category` is one of the stored spot categories (`lib/spotCategories.ts`). Saved as `publicationStatus: 'draft'` with `suggestedByMemberId`; it appears in the staff review queue (pillar `spots`) and not on the site. A pin inside Thailand is required (since BE-030): `latitude` and `longitude` from the map picker, or a `googleMapsUrl` that carries coordinates. Without one the answer is `400`. When no link is sent, `googleMapsUrl` is built from the pin.
Errors: `401` not signed in, `403` not verified, `400` validation, `409` same name in the same province, `429` five suggestions already waiting.
Response `201`: `{ success, spot, message }`.

### `GET /api/spots?mine=1` — places the signed-in member suggested (any state)

### `POST /api/quests` — a member proposes a challenge
Body: `{ title, category: 'heal'|'move'|'chill'|'learn', objective, steps: string[], total: 1-100, badgeLabel, startDate, endDate (YYYY-MM-DD), verificationMethod?, image? }`.
Saved as `status: 'draft'`, `isOfficial: false`, `rewardPoints: 0`, with `createdByMemberId`. Staff set points and rewards and publish it from the admin challenge manager. Same error codes as above (`429` at five waiting).

### `GET /api/quests?mine=1` — challenges the signed-in member proposed (any state)

---

## Safety reports and the review queue for challenges (added 2026-10-11, BE-029)

### `POST /api/reports` — a member reports an event, a fair or a place
Body: `{ targetType: 'community' | 'fair' | 'spot', targetId, reason, details? }`.
`reason` is one of `investment_mlm`, `harassment`, `unsafe_location`, `fake_or_spam`, `wrong_info`, `other` (`other` needs `details` of 5+ characters). The title and the host are read from the server's own data.
Errors: `401` not signed in, `400` validation or reporting one's own event, `404` unknown target, `409` already reported and still open, `429` ten reports in a day. Response `201`: `{ success: true }`.
Use `components/ReportSafetyModal.tsx` (props `targetType`, `targetId`, `targetTitle`, optional `subject`).

### `GET /api/admin/reports?status=open|closed|all` and `POST { action: 'close', id, note? }` — staff
Listing needs `content.view`; closing needs `community.review`.

### `/api/admin/review` — challenges
The queue has a fourth pillar `quests` (`kind: 'quest'`): draft challenges a member proposed. `counts.quests` is returned. Approving sets `status: 'active'` (refused when the end date has passed); rejecting sets `reviewRejectedAt` and `rejectionReason` and keeps the draft hidden.

## Place pin: link reader and place search (added 2026-10-11, BE-030)

Both need a signed-in member or a staff session, and are rate limited per account. Used by `components/LocationPinPicker.tsx` and the admin spot editor.

### `POST /api/places/resolve`
Body: `{ url }` (a Google Maps link, `https://` only). Answer: `{ success, coordinates: { latitude, longitude } | null }`.
Reads the coordinates in the link's address. A short link (`maps.app.goo.gl`) is followed on Google hosts only. `null` means the link carries no pin inside Thailand, which is common for links shared from the phone app; ask for a pin on the map instead. No Google API is called.

### `GET /api/places/search?q=`
Answer: `{ success, places: [{ name, detail, latitude, longitude }] }` (at most 5, Thailand only), from OpenStreetMap (Nominatim). Call it on a button press, not while typing. `502` when the search service does not answer.

### `/api/admin/review` — places need a pin
`POST { action: 'approve' }` answers `400` when a place in the request has no coordinates inside Thailand. Nothing in the request is approved; staff set the pin in the spot editor first.

### `POST /api/events` — participant count (BE-031)
For a signed-in member the server ignores `participantsCount` in the body: the event starts at 0 and the creator is added as the first participant, so the answer's `event.participantsCount` is 1.

## Reports for reviews and chat messages; blocking in event lists (added 2026-10-11, BE-032)

### `POST /api/reports` — two more targets
`targetType` may also be `review` (`targetId` = review id, as returned in a profile's `hostReviews.latest[].id`) or `chat_message` (`targetId` = message id from `GET /api/chat/{roomId}`). The server reads the words and their author from its own data; `targetTitle` in the body is ignored for these two. A chat message can be reported only by someone who can read that room (`403` otherwise). Reporting one's own review or message answers `400`.

### `/api/admin/reports`
- Each report may carry `excerpt` (the reported words when the report was sent). `hostMemberId` / `hostName` is the author for these two target types.
- `POST { action: 'remove_content', id, note? }` (permission `community.review`): deletes the reported review or chat message and closes every open report about it. `404` when the report is closed or is about an event, a fair or a place.
- `GET ?room=<reportId>` (permission `community.review`) → `{ reportedMessageId, messages: [{ id, authorId, authorName, text, createdAt }] }`: the whole chat room of a reported message. Works only for a report about a chat message (`404` otherwise) and writes `report.read_chat` to the audit log. Chat reports carry `roomId`.
- `POST { action: 'remove_chat_message', id: reportId, messageId }` (permission `community.review`): deletes another message of that room. The report stays open.

### `GET /api/events` — blocked members
When the signed-in viewer has blocked someone, events that person created are left out of every list and search answer, and that answer is sent with `Cache-Control: private, no-store`. Other answers stay shared-cached. All answers carry `Vary: Cookie`. `total` and `pagination` are not recounted after the filter, so a page can be a few items short.

### Moments feed — blocked members
`comments` and `commentsCount` of each moment leave out comments from people the viewer blocked.


## Visits: who has been, challenge progress and points (added 2026-10-13, BE-039)

A **visit** is one member having been to one place or event, with evidence. It is the link between the parts of the product: "who has been" on a place or event, challenge progress and points are all worked out from visits on each read. Nothing is stored as a balance. Code: `lib/social/visits.ts`, `lib/social/questProgress.ts`.

| Evidence | Where it comes from | Applies to | Points |
| :--- | :--- | :--- | :--- |
| `checkin` | The host checked the member in (`POST /api/events/[id]/participants`) | community events | 50 |
| `moment` | The member posted a moment with `targetType` and `targetId` set (`POST /api/moments`) | places, community events, fairs | 30 |
| | _2026-10-23 (BE-106)_: a moment at a place or fair records `evidence: { status: auto|pending|approved, at, distanceM?, reason? }`. `POST /api/moments` takes `capture: { lat, lng, accuracy, at }` (`at` in epoch milliseconds) from the browser at posting time; within 300 m of the place (fix ≤ 10 min old, accuracy ≤ 200 m) it is `auto`, otherwise `pending` until staff `accept_evidence`. A pending moment still shows the member has been (`GET /api/visits?mine=1` visits carry `pending: true`) but does **not** count toward challenges. Moments without `evidence` (older posts) count as before. | | |
| `marked` | The member pressed "I have been here" (`POST /api/visits`) | places, fairs | 10 |

One visit per member per target; the strongest evidence wins. Target types are `spot`, `community` and `fair` (an event is `fair` when its `eventType` is `public_venue`).

### `GET /api/visits?targets=spot:ID,community:ID,fair:ID` — public
Up to 40 targets in one call, so a row of cards needs one request. Shared-cached for 30 seconds.
```
{ success, pointsPerVisit: { checkin, moment, marked },
  targets: { "spot:ID": {
    beenCount,                         // distinct people with any evidence
    people: [{ name, avatar? }],       // up to 3, from public moments only
    photos: [{ url, momentId }],       // up to 3, newest first (a preview)
    momentsCount,                      // all published moments tied to the target; the full list is the feed below
    rating?: { average, count },       // from the ratings given with a mark
    quests: [{ questId, title, badgeLabel, rewardPoints, rewardTitle?, count, minEvidence }]  // running challenges a visit here counts toward; for a ตี้ or fair, only those whose period overlaps the event's date
  } } }
```
A mark or a check-in adds to `beenCount` but never publishes the member's name; names and photos come only from moments the member posted publicly. Do not show `beenCount` on fair cards or fair pages (the fair pillar shows no head count); photos and faces are fine.

The full list of a target's moments is the paged moments feed: `GET /api/moments?targetType=spot&targetId=ID` (page link: `/moments?targetType=spot&targetId=ID&location=NAME`, where `location` is only the text of the filter chip). The server reads the 60 newest moments of a target for faces and photos; when a target has more, each older moment adds one to `beenCount`.

### `GET /api/visits?mine=1` — the signed-in member
`{ success, visits: [{ targetType, targetId, evidence, at }], marks: [{ targetType, targetId, rating?, createdAt }], quests: [{ questId, title, current, total, completed, rewardPoints }], points: { total, fromVisits, fromQuests } }`. Signed out: `requiresLogin: true` with empty lists. `quests` lists every non-draft challenge that has a rule, joined or not.

With `&month=1` the answer adds `month: { month: "2026-10", chill: MonthItem[], connect: MonthItem[] }` (Bangkok month). `MonthItem` = `{ targetType, targetId, title, image?, place?, at, hasMoment, people?: [{ name, avatar? }], peopleCount? }`. **Chill** = places and fairs with a visit this month (marked, a moment or a check-in). **Connect** = meetups the member joined that took place this month, checked in or not; `people` are up to three others who joined. Used by the home greeting (counts) and My Hub "เดือนนี้ของฉัน" (lists).

### `POST /api/visits` — the signed-in member
- `{ action: 'mark', targetType: 'spot' | 'fair', targetId, rating? }`: "I have been here". `rating` is a whole number 1 to 5 and is optional; sending the action again updates the rating. A fair can be marked from its start date. `community` is refused: the host's check-in is its evidence.
- `{ action: 'unmark', targetType, targetId }`.
- Answer: `{ success, mark | null, proof, points, quests }` (`proof` has the fields of one target above, without `quests`). Errors: 401 signed out, 403 inactive account, 404 unknown target, 429 more than 30 marks an hour.

### Challenge rules (`rule` on a quest)
`GET /api/quests` now returns `rule` when a challenge counts visits:
```
rule?: { targetTypes: ('spot' | 'community' | 'fair')[], count,
         categories?, provinces?, keywords?, targetIds?, minEvidence?: 'marked' | 'moment' | 'checkin' }
**2026-10-23 (BE-106):** `minEvidence: 'marked'` is treated as `'moment'`: pressing "มาที่นี่แล้ว" never counts toward a challenge (owner rule). Rules with no `minEvidence` also need at least a passed photo moment or a host check-in.
```
Every filter given must match. `categories` is a place's `category` (`cafe`, `park`, ...) or an event's (`heal`, `move`, `chill`, `learn`); `keywords` match the title. Only visits made between the challenge's `startDate` and `endDate` count. Staff set it with `/api/admin/quests` (`action: 'update'`, `updatedFields.rule`; `null` removes it); an invalid rule is refused. Three seed challenges have rules: Cafe Hunter 5 (five cafes, a photo each), Digital Detox and HYROX (one community event, host check-in).

**2026-10-25 (BE-135, BE-136): more rule fields**, all optional; `parseQuestRule` checks them, and the admin challenge form sets them:
- `newMemberDays` (1–90): only visits within this many days of the member's sign-up count (welcome challenge).
- `asHost` (1–15, `community` only): counts ตี้ the member **hosted** where at least this many guests were checked in, instead of ones they went to. Such a challenge has no list of places (`targets` empty) and is not in `GET /api/visits?targets=` answers.
- `withFriends` (1–15, `community` only) and `friendsVia: 'invite' | 'any'`: a ตี้ counts only when at least this many friends were checked in there too. Friends = the member who invited them and those they invited (`invite`), plus members who follow each other (`any`, the default).
- `perWeekend: true`: counts weekends instead of places; only visits on a Saturday or Sunday (Bangkok) count, and each weekend counts once; `count` is the number of weekends.

`progressPercent`, `current`, `total` and `completedCountInfo` on a quest are still the old display text; real progress for the signed-in member is in `GET /api/visits?mine=1`.

### Moments composer link
`/moments?createForEvent=ID&createForType=spot|fair|community&eventTitle=...&location=...` opens the composer tied to that target (`createForType` is new; without it the target is a community event, as before).

### Account deletion and export
Deleting an account removes the member's marks. `GET /api/auth/member/account` (export) includes them as `visits`.

## Points and rewards (added 2026-10-13, BE-040)

A member's points are no longer kept in the browser. The balance is what the member earned from visits and finished challenges (see "Visits") minus what they spent on rewards. Only the spending is stored (`data/redemptions.json`, gitignored). Code: `lib/social/rewardsLedger.ts`. Client hook: `useMyRewards(isLoggedIn)` in `lib/useMyRewards.ts`.

### `GET /api/rewards` — the signed-in member
`{ success, points: { earned, fromVisits, fromQuests, spent, balance }, quests: [{ questId, title, current, total, completed, joined, rewardPoints }], joinedQuestIds, redeemedRewardIds, redemptions: [{ rewardId, cost, createdAt }] }`. Signed out: `requiresLogin: true`, zeros and empty lists. A new member starts at 0.

### `POST /api/rewards` — `{ rewardId }`
Redeems a reward of the catalog (`REWARD_SHOP_ITEMS` in `data/rewardsData.ts`). One of each reward per member. _2026-10-25 (BE-132):_ a catalog item with `drawEntry: { drawLabel, prizeCount }` is a prize-draw entry: `redemptions[]` carries `code` (`CC-XXXXXX`, the member's own entry code; `null` for vouchers, which use the catalog `voucherCode`). `/rewards?reward=ID` opens a reward. The answer has the same fields as the GET. Errors: 400 not enough points (the message says how many more), 404 unknown reward, 409 already redeemed, 401 signed out, 429 more than 20 an hour.

### Joining a challenge — `POST /api/quests/join` (added 2026-10-13, BE-043)
Body `{ questId, action: 'join' | 'leave', reason? }`; signed-in, active member, same origin. `reason` (leave only, up to 200 characters, optional) is why the member stops; it is written to the audit log as `quest.leave` without the member's name (BE-064). The answer has the same fields as `GET /api/rewards`. Joins are stored in `data/quest_joins.json` (gitignored); code in `lib/social/questJoins.ts`. Errors: 404 unknown or draft challenge, 409 the challenge has ended, 401 signed out, 429 more than 60 an hour. Joining twice changes nothing.
- **What joining does:** the challenge appears in My Hub, the member counts among its participants, and its reward points are theirs when they finish. Progress is counted from visits whether or not the member joined, so visits made before joining still count; the reward points are added only while the member is joined (`quests[].joined`).
- **`participantsCount` in `GET /api/quests`** is the number the quest was written with (sample data for seed quests, 0 for new ones) plus the members who joined.
- **Client:** `useMyRewards` gives `joinedQuestIds`, `joinQuest(questId)` and `leaveQuest(questId)`. `syncMyChallenges(joinedQuestIds, catalog)` rebuilds the browser list `cch_my_challenges` from the account; that list now only keeps progress noted by hand on challenges without a rule. A new member starts with no joined challenge (the browser used to start with four).
- **Account deletion** removes the member's joins; the account export lists them as `joinedChallenges`.

### `GET /api/quests/[id]` — one challenge for its detail window (added 2026-10-13, BE-044)
Public; `404` for an unknown or draft challenge. Answer:
```
{ success, quest,                 // with participantsCount as in the list
  tracked,                        // false: the server cannot count it (no rule); the member only notes progress for themselves
  minEvidence,                    // 'marked' | 'moment' | 'checkin' | null
  targets: [{ targetType, id, title, image?, detail?, href, visited }],   // up to 6: published places, and events not ended that match the rule and fall inside the challenge period (2026-10-16)
  targetsTotal, browseHref,       // how many match in all, and the list page to see the rest
  mine: null | { joined, current, total, completed, voucherCode,        // the signed-in member
                 finishedAt, memories },                                // finished challenges only (BE-058)
  next: null | { id, title, image, rewardPoints, rewardTitle },          // finished challenges only (BE-058)
  related: (ChallengeQuest & { period })[] }  // up to 6 open challenges not joined, same category first (2026-10-16); since 2026-10-27 (BE-173) each is the whole challenge (participantsCount includes joins) so the page draws the /challenges tile; id, title, image, rewardPoints, period, startsInDays still there
```
- `visited` marks a place the member already has a counting visit at; those come first. A rule with `targetIds` keeps its order.
- **Near the member first (BE-058):** after the counted places, places in the province the member gave at sign-up (`preferences.province`) come before the rest.
- **A finished challenge (BE-058):** `mine.finishedAt` is when it was recorded. `mine.memories` is `[{ targetType, id, title, image?, ownPhoto, href, at }]`, the visits that counted, oldest first, at most the number the rule asks for; `image` is the member's own photo from a moment there (`ownPhoto: true`) or the place's photo. `next` is one running challenge with a rule that the member has neither joined nor finished, the same category first. All three are empty or `null` until the challenge is finished.
- **Own profile (BE-058):** `GET /api/auth/member/profile` now returns `publicView.challengeBadges`, the same list as `GET /api/members/[id]`.
- `mine.completed` is true only when the member joined **and** the server counted every visit. Progress (`current`) is shown either way.
- `mine.voucherCode`: for a `brand_partner` challenge, the member's own code (the reward's `voucherCodePrefix` plus 8 random characters), issued the first time the finished challenge is read and the same afterwards. Stored in `data/quest_vouchers.json` (gitignored); code in `lib/social/questVouchers.ts`. A platform challenge gives no code. Staff look a code up and mark it used in the admin challenge manager: `POST /api/admin/quests` with `{ action: 'check_voucher' | 'use_voucher', code }` answers `{ voucher: { code, issuedAt, usedAt, questTitle, rewardTitle, partnerName, memberName } }` (`404` unknown code). `mine.voucherUsedAt` tells the member (BE-046).
- **Evidence floor (BE-052):** `minEvidence` in this answer is what really counts. For a `brand_partner` challenge it is never below `'moment'`, whatever the stored rule says.
- **Finishing (BE-052):** the first read that sees the challenge finished records it, issues the partner code and notifies the member (notification type `'challenge'` with `href`). `GET /api/rewards` lists `finished` challenges (badge, code).
- **Reward type comes from the data only.** Every seed quest now carries `brandReward`; `getQuestBrandReward` no longer guesses a brand from words in the title. A quest without `brandReward` is a platform challenge.
- Account deletion removes the member's codes; the account export lists them as `challengeRewardCodes`.

### What the pages do
- `/rewards`, `/myhub`, `/challenges` read the balance and the redeemed rewards from `useMyRewards`. The old browser keys `cch_user_xp` and `cch_redeemed_reward_ids` are not read any more (the helpers stay in `data/rewardsData.ts`, unused).
- `withRealProgress(quests, progress)` puts the server's count on challenges that have a rule. A challenge without a rule keeps the progress the member notes by hand in the browser (`cch_my_challenges`); that progress earns no points.
- Joining a challenge is kept with the account (BE-043); see "Joining a challenge" below.

## Live activity, "ตอนนี้ในชิลล์" (added 2026-10-16, BE-076)

### `GET /api/activity`
The server decides from its own session which shape to send.

- **Signed in:** `{ success, mode: 'member', items: LiveItem[] }`, the 12 newest lines, newest first, at most 2 per shown name. Never the viewer's own actions, people the viewer blocked, people who blocked the viewer, or banned members. `Cache-Control: private, no-store`.
- **Signed out:** `{ success, mode: 'public', counts: { since, meetupJoins, questJoins, moments } }`, the last 7 days, no names. Cached 60 seconds.

`LiveItem` (`lib/social/liveActivity.ts`): `{ id, kind, at, timeAgo, person: { name, avatar? }, target: { type, id?, title } }`.
- `kind`: `meetup_join` | `meetup_host` | `quest_join` | `quest_finish` | `moment`
- `target.type`: `community` | `challenge` | `spot` | `fair` | `general` (a moment tied to nothing; `id` is then the moment id). Links: `/community/ID`, `/challenges/ID`, `/spots/ID`, `/events/ID`, `/moments?momentId=ID` (`liveHref` in `components/home/LiveActivity.tsx`).

Only actions already public elsewhere are named: meetup attendees, "ใครทำอยู่บ้าง" on challenges, posted moments. Meetup lines cover open, approved community events only. Check-ins and "I have been here" marks are never named, the same rule as `SocialProof` in `/api/visits`.

## Evidence review and story moderation (added 2026-10-13, BE-060)

A moment tied to a place or event is a visit, and a visit counts toward challenges (see "Visits"). Staff can now decide that a photo is not evidence of a visit.

- `GET /api/admin/moments?filter=evidence` lists members' published moments whose place or event counts toward at least one running challenge. Every admin moment carries `countsToward: [{ questId, title, needsPhoto }]` (`needsPhoto` is true for a challenge with a partner reward, where a photo moment is the minimum evidence) and `evidenceRejected?: { at, note }`.
- `POST /api/admin/moments` `{ action: 'reject_evidence', id, note }`: the moment stays published, but it is no longer a visit, so the member's challenge progress and visit XP drop. The author gets a notification of type `evidence` (opens the moment; `preview` is the reason). `{ action: 'accept_evidence', id }` undoes it. A reward code already issued for a finished challenge is not withdrawn.
- **Feed item:** `evidenceRejected?: { note }` is present only on the author's own moment.
- **Notifications:** `type` can now be `evidence` (`actorName` is "Chill & Connect Hub", `momentId` set, no `href`).
- **Composer:** the share form no longer offers a challenge as what a moment is about. `POST /api/moments` still accepts `targetType: 'challenge'`, but such a moment was never a visit and counts toward nothing.
- **Stories:** `/api/admin/stories` (table above) is the staff view of stories, including the ones hidden by three reports.
- **Places by id:** `GET /api/spots?ids=a,b,c` (at most 30) → `{ success, spots }`: those published places in the order asked; unknown and draft ids are left out. The share form uses it for the member's saved places.
- **Places for the member home** (added 2026-10-26, BE-154): `GET /api/spots?home=1` → `{ success, spots }`, not cached by the browser: the 30 best-ranked places, the best two of each vibe that are open for meet-ups and two that are not, and, signed in, the member's saved and visited places (≤ 200). ~50 places in one request instead of the whole catalog. The member home and My Hub use it (`useHomeSpots`, `useSpotCatalog('home')` in `lib/usePublishedSpots.ts`).
