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

### BE-001 · `POST /api/events` ignores `userRole`; admin status comes from the server session
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** The server no longer trusts a role sent by the client. Fairs created by non-admins are `pending` until approved in `/admin`. Backend already removed `userRole` from the two requests in `components/CreateEventModal.tsx`.
- **Action for Frontend:** Do not re-add `userRole` (or any role/permission field) to requests. When showing the result of creating a fair, read `data.event.approvalStatus` and say "pending review" instead of "published" when it is `pending`.
- **Status:** Open

### BE-002 · `POST /api/events` returns only the created `event` (no `events` list)
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** The response used to include `events` (every event, including pending ones). It is now `{ success, message, event }`.
- **Action for Frontend:** Use `data.event`. The server may assign a different `id` than the one sent (if missing or taken): `CreateEventModal.tsx` currently stores and passes its own `communityPayload` / `fairPayload` (lines ~814–883). It should use `data.event` (especially `data.event.id`) for `user_created_events`, `joined_event_ids` and `onCreateSuccess`. `SpotBuddyGatheringModal.tsx` already does this.
- **Status:** Open

### BE-003 · Admin console is behind a server-verified login
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** `app/admin/page.tsx` is wrapped in `components/admin/AdminAuthGate.tsx`, which calls `/api/auth/admin` and shows a login form when the server requires it (production, or when `ADMIN_PASSWORD` + `AUTH_SECRET` are set). Locally with no env vars it opens directly, as before. All `/api/admin/*` calls return `401` without a session.
- **Action for Frontend:** Keep the gate when restyling the admin page. Admin views should treat a `401` response as "session expired" (e.g. reload so the gate shows the login form) instead of a generic error. The "Preview Role" switcher in `AdminHeader` is a client-side simulator only — it grants no server permissions.
- **Status:** Open

### BE-004 · `/api/upload` rejects SVG and checks file contents
- **From → To:** Backend → Frontend
- **Date / branch:** 2026-10-03 · `claude` (3b3256b)
- **What changed:** Accepted types are JPEG, PNG, WebP and AVIF; the file bytes must match the declared type.
- **Action for Frontend:** No change needed today (no upload UI advertises SVG). Don't add SVG to `accept=` attributes or upload hints; keep compressing to WebP before upload.
- **Status:** Open

---

## Done

_(nothing yet)_
