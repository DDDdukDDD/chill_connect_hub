<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 🌿 Chill & Connect Hub: Mandatory Architecture & Design Concept (Global Luxury 9.8+)

This document defines the strict, permanent architecture, design system, and editorial standards for **Chill & Connect Hub**. Every agent working on this codebase **MUST** strictly adhere to these conventions.
For a complete system blueprint, mental model (3-4-3), and usage guide, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🤝 0. Multi-Agent Collaboration (Read First)

Two AI tools build this project in parallel. Each one owns one side of the codebase and coordinates with the other through shared files in this repo — never through assumptions about the other side's code.

| Agent | Role | Works on branch | Owns (may edit freely) |
| :--- | :--- | :--- | :--- |
| **Antigravity IDE (Gemini)** | Frontend (User-Facing UI) | `main` | All user-facing pages: `app/**/page.tsx`, `app/**/layout.tsx` (except `app/admin/**`), `app/globals.css`, user-facing components in `components/**` (except `components/admin/**` and `components/AdminCreateEventModal.tsx`), `public/**` (except uploads), client-only helpers (`lib/useAuth.ts`, `lib/useResponsiveItemsPerPage.ts`, `lib/media/compressor.ts`), `DESIGN_SYSTEM.md` |
| **Claude Code** | Backend & Admin Console | `claude` | Admin UI: `app/admin/**`, `components/admin/**`, `components/AdminCreateEventModal.tsx`; Backend: `app/api/**`, all other `lib/**`, `data/**` stores and datasets, `docs/API.md`, `BACKEND_IMPLEMENTATION_LOG.md` |

Ownership is about **editing**, not importing: the frontend may import anything from `lib/` and `data/` (types, `contentClient`, `dateUtils`, image resolvers). Shared utilities used by both sides (`lib/dateUtils.ts`, `lib/spotImageResolver.ts`, `lib/eventImageResolver.ts`, `lib/contentClient.ts`) are backend-owned; behavior changes to them must be announced in `docs/HANDOFF.md`.

Shared (either may edit, keep changes minimal and announce them in `docs/HANDOFF.md`): `AGENTS.md`, `ARCHITECTURE.md`, `docs/HANDOFF.md`, `package.json`, config files.

**The project owner merges `claude` into `main`.** Agents never push to the other agent's branch and never merge branches themselves unless the owner asks.

**Each agent works in its own local clone** of `github.com/DDDdukDDD/chill_connect_hub`; the clones share nothing except GitHub. The other agent's work only becomes visible after it is pushed (and, for backend work, merged into `main`) and you pull. Never reference files by absolute local paths (e.g. `file:///c:/Users/...`) in docs or code — always use repo-relative paths, which resolve correctly in every clone and on GitHub.

### Session checklist (every agent, every session)
1. `git pull` before starting (Frontend: `main`; Backend: `claude`, then merge in new `main` commits if any). Push when you finish so the other clone can see your work.
2. Read **[docs/HANDOFF.md](docs/HANDOFF.md)** and handle open items addressed to you.
3. Frontend: read **[docs/API.md](docs/API.md)** before calling or changing any API usage. Backend: keep it accurate.
4. Commit in small, focused commits with clear messages so the other agent can follow `git log`.

### Rules across the boundary
- **Do not edit files the other agent owns.** If you need a change there, write a request in `docs/HANDOFF.md` (what, why, and the exact file/area).
  - Frontend needs a new endpoint, field, or filter → `FE-###` request; do **not** add code under `app/api/`, `lib/`, or `app/admin/`.
  - Backend changes a response shape or behavior the UI relies on → update `docs/API.md` in the same commit and post a `BE-###` note with the required frontend action.
- **`docs/API.md` is the contract.** Build UI against it, not against guesses from mock data. Report mismatches in `docs/HANDOFF.md`.
- **Use shared types, never copies:** `EventItem` / `ChallengeQuest` from `@/data/mockData`, `LifestyleSpotItem` from `@/data/spotsData`, query and pagination types from `@/lib/db/types`.
- **Never send roles or permissions from the client.** The server decides admin access from its own session (`/api/auth/admin`).
- **Mutable runtime data** (`data/chill_database.json`, `data/discovery_content.json`) is written by the backend at runtime. Do not hand-edit it to change UI behavior; ask for a data or API change instead.
- The project is a **prototype** (seed data, no real users). Prefer clear, simple solutions over production-scale infrastructure.

---

## 🎨 1. UI Design Rules (frontend)

The mandatory visual rules — button hierarchy, pillar colors, UI hygiene, typographic scale — live in **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** (section "Mandatory UI Rules"). Read it before editing any user-facing or admin UI.

Pillar facts every agent needs (data side):
- `/community` = `eventType: 'community'` — shows attendee count and recruitment status.
- `/fairs` = `eventType: 'public_venue'` — **no** attendee count, **no** recruitment status.
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


