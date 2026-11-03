<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Chillwaa: Working Rules

The rules every agent working on this codebase **MUST** follow. The public name is **Chillwaa**; the repo and older docs still say "Chill & Connect Hub".
System overview: [ARCHITECTURE.md](ARCHITECTURE.md). What is left before launch: [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

---

## 🤝 0. Who Works Where (Read First)

Since 2026-11-02 **Claude Code builds the whole project**: user-facing pages, admin console and backend. The old frontend/backend split (FE-001) is retired.

**Antigravity IDE (Gemini) is the tester.** It tests the site and reports problems as `TR-###` items in **[docs/TEST_REPORTS.md](docs/TEST_REPORTS.md)**, which also holds the format and the steps for both sides. It works on its own `tester` branch, changes only that file, and never changes code or data.

Claude Code runs in **two local clones** of `github.com/DDDdukDDD/chill_connect_hub`, one per computer. The clones share nothing except GitHub, so each has its own branch:

| Clone | Works on branch | Reaches `main` by |
| :--- | :--- | :--- |
| Main computer | `claude` | Owner merges `claude` into `main` |
| Office notebook | `office-notebook` | Pull request into `claude` |
| Antigravity (tester) | `tester` | Never merged into `main`; Claude Code picks up its reports |

**The project owner does the merges.** Agents never push to another agent's branch and never merge branches themselves unless the owner asks. The owner allows two exceptions, for keeping up to date: the session checklist merges below, and merging `origin/tester` to pick up test reports.

Work from the other clone only becomes visible after it is pushed and you pull. Never reference files by absolute local paths (e.g. `file:///c:/Users/...`) in docs or code — always use repo-relative paths, which resolve correctly in every clone and on GitHub.

### Session checklist (every clone, every session)
1. `git fetch`, then bring your branch up to date: `claude` pulls `origin/claude` and merges new `main` commits; `office-notebook` pulls itself and merges new `origin/claude` commits.
2. Read **[docs/HANDOFF.md](docs/HANDOFF.md)**: it is the change log both clones read. Then merge `origin/tester` and handle open reports in **[docs/TEST_REPORTS.md](docs/TEST_REPORTS.md)**. Before adding a HANDOFF item, check the highest `BE-###` on `origin/claude` so the two clones do not reuse a number.
3. Keep **[docs/API.md](docs/API.md)** accurate when you change an API.
4. Commit in small, focused commits with clear messages so the other clone can follow `git log`.

### Rules
- **Changing a response shape or behavior the UI relies on:** update `docs/API.md` and the UI in the same change, and post a `BE-###` note.
- **Shared utilities** (`lib/dateUtils.ts`, `lib/spotImageResolver.ts`, `lib/eventImageResolver.ts`, `lib/contentClient.ts`) are used across many pages; announce behavior changes to them in `docs/HANDOFF.md`.
- **`docs/API.md` is the contract.** Build UI against it, not against guesses from mock data.
- **Use shared types, never copies:** `EventItem` / `ChallengeQuest` from `@/data/mockData`, `LifestyleSpotItem` from `@/data/spotsData`, query and pagination types from `@/lib/db/types`.
- **Never send roles or permissions from the client.** The server decides admin access from its own session (`/api/auth/admin`).
- **Live data is in Postgres,** not in `data/*.json` (seed data and the no-database mode). Do not hand-edit those files to change what the site shows.
- **`npm run dev` uses the development database. Never write test data to the live one,** and never burst-test the live site.
- **The goal since 2026-11-03 is production at quality 9.5** (still seed data, no real users yet). Prefer clear, simple solutions; postponed work goes in `docs/LAUNCH_CHECKLIST.md`.

---

## 🎨 1. UI Design Rules (frontend)

The mandatory visual rules — button hierarchy, pillar colors, UI hygiene, typographic scale — live in **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)**. Every rule there is mandatory for new and edited code. Read it before editing any user-facing or admin UI.

Pillar facts every agent needs (data side):
- `/community` = `eventType: 'community'` — shows attendee count and recruitment status.
- `/events` (was `/fairs`, moved 2026-10-25; old links redirect) = `eventType: 'public_venue'`, called **อีเวนต์** on every screen (owner 2026-10-24; it holds fairs, runs, concerts and sports, so not "งานแฟร์") — **no** attendee count, **no** recruitment status.
- `/spots` = `LifestyleSpotItem` from `data/spotsData.ts` + the published catalog (7 vibe categories).
- `/challenges` = quests (XP and badges).
- No decorative emojis in titles stored in data files; no emojis in `<option>` text.

---

## 💾 2. Data Integrity & Persistence Rules

1. **Ended Events Filter**:
   - Past events must have `status: 'ended'`.
   - On homepage feeds, ended events are hidden by default via `isEventEnded(event)`.
2. **Filtering Isolation**:
   - Filters on Section 01, Section 02, and Section 03 operate independently and never block other sections from rendering.

---

## 📝 3. Form Validation & Safety Standards

- **All Entities**: `title` >= 5 chars, `province` required, `locationName` required, `description` >= 15 chars plain text, and `isSafetyAccepted` checked.
- **Community Meetups**: Date, start/end time, landmark meeting point, and max participants (2-15) required.
- **Fairs & Expos**: Start date, end date, and official organizer required.
- **Spots**: Open hours required.
- **Dedicated Spot Buddy Dialog**: Spot buddy trips triggered from `/spots/[id]` must use `SpotBuddyGatheringModal.tsx`.
- **Spot Buddy safety rules**: trips open only for places staff marked `meetupAllowed`, and the server applies the rules in `lib/social/spotTrips.ts` (3 people minimum, daytime, meet at the place, no shared rides, no contact channel). Never loosen them in the form alone; see `docs/API.md` ("Spot Buddy trips").



---

## 🔎 4. Search & AI Search Readiness (owner rule, 2026-10-17)

Every change to a public page must keep it findable by Google and by AI search (ChatGPT, Claude, Perplexity, Google AI Overviews):
- **Content in the server HTML.** AI crawlers mostly do not run JavaScript. Titles, dates, places and descriptions a visitor reads must be rendered on the server, not only fetched in `useEffect`.
- **Own metadata per page:** title, description, canonical URL and Open Graph image via `generateMetadata` (server `page.tsx` or `layout.tsx`).
- **Structured data on detail pages:** JSON-LD for meetups and fairs (`Event`), places (`Place`/`TouristAttraction`), challenges where it fits.
- **Crawlable structure:** one `<h1>` per page, real `<a href>` links between pages, readable Thai text (not text inside images), `alt` on content images.
- **Private pages stay out:** `/myhub`, `/profile`, `/onboarding`, auth pages are `noindex` and not in `app/sitemap.ts`; public detail pages are in it.
