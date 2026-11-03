# Handoff Board

The change log for the Claude Code clones working on this repo (see "Who Works Where" in [AGENTS.md](../AGENTS.md)). Test reports from Antigravity go in [TEST_REPORTS.md](TEST_REPORTS.md).

- **Read this file at the start of every session.**
- **Add an item** when you changed something another session must know: behaviour, a rule, a migration, a shared utility.
- **Keep it short.** What is left to do goes in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md), API shapes in [API.md](API.md), not here.
- **IDs:** `BE-###`, increasing. Check the highest number on `origin/claude` first, so the clones do not reuse one.
- **When this file passes about 300 lines,** move the older items to `docs/archive/`.

Items up to BE-234, including every `FE-###`, are in [archive/handoff-until-2026-11-03.md](archive/handoff-until-2026-11-03.md). Code comments that cite `docs/HANDOFF.md BE-###` with a lower number mean that file.

Item template:

```md
### BE-000 · Short title (owner 2026-10-03)
- **What changed:** ...
- **What to do about it:** ... (leave out if nothing)
```

---

### BE-240 · Ended ตี้ and อีเวนต์ keep their colour; profile grid smaller (owner 2026-11-03)
- **What changed:** a ตี้ or อีเวนต์ that has ended is a good memory, not something broken, so its photo stays in colour with the "จบแล้ว" badge (`MeetupTile`, `FairTile`, `PosterPhoto` loses `dim`). My Hub: hosted and attended rows in colour; cancelled and missed stay faded. Ended challenges are faded only (`opacity-70`), since people browse them for what is still open. The profile's moment grid is 4 across from `sm` and shows 12 first.
- **What to do about it:** do not bring grayscale back for ended content. Admin's hidden moments keep it.

### BE-239 · Followers and following lists on your own profile (owner 2026-11-03)
- **What changed:** on your own profile the two numbers open `app/profile/FollowListDialog.tsx`, with a tab for each list. New `GET /api/members/follows`. "กำลังติดตาม" unfollows at once and the person stays as "ติดตาม", one tap to undo. Numbers on another member's profile stay plain, so who follows whom stays private until the owner decides otherwise.
- **To watch:** `followLists` reads all members, as `followerCount` does; both belong to the follower-count item in stage 7 of the checklist.

### BE-238 · "พาสปอร์ตของฉัน" removed for now (owner 2026-11-03)
- **Why:** the owner found no reason to keep it. It showed what "เหรียญของคุณ", the profile and `/challenges` already show, and its stamps were the same as badges.
- **What changed:** removed `components/home/StampPassport.tsx`, its section in My Hub and its link in the home page's "ของฉัน". Badges and challenge data are unchanged. The challenges named "พาสปอร์ตสุดสัปดาห์" keep their name.
- **What to do about it:** a real collect-the-places idea would be a new design, with stamps earned by going somewhere.

### BE-237 · Faces and profile photos through the optimizer (owner 2026-11-03)
- **What changed:** new `avatarImage(src, width = 128)` in `lib/optimizedImage.ts`, used wherever a member's face shows outside admin. The profile's moment grid and `VisitPanel` photos use `optimizedImage`. Use `avatarImage` for any new avatar.
- **Checked:** production build on the development database, phone size, cache off: `/profile?id=` 105 KB of images, against 7.43 MB for the same member on live (old code; live had one more image). No failed images or page errors. The development data has fewer members' photos than live, so `/moments` is not a like-for-like figure.

### BE-236 · Member photos: resized when shown, 500 KB limit when sent (owner 2026-11-03)
- **Why:** live moment photos reached 3.19 MB (mostly JPEG from Safari), and the feed loaded them whole because Vercel Blob was not an allowed optimizer host.
- **What changed:** our store's host is in `OPTIMIZED_REMOTE_IMAGES` (`lib/optimizedImage.ts`), by its exact name so the optimizer stays closed to other stores. A new store needs its host there. `MomentPhotos` gives Blob photos the same three widths as `/uploads`, and clip covers go through the optimizer. New `encodeForUpload` (`lib/media/compressor.ts`) is used by `exportPhoto` and `compressImage`: it lowers quality, then size down to 800 px, until a photo fits `MAX_PHOTO_BYTES`. `compressImage` used to send Safari's PNG when asked for WebP; it now sends JPEG.
- **Checked:** production build on the development database: a 1.07 MB live photo served at 58 KB (AVIF, 640) and 174 KB (JPEG, 828); another store gets `400`. Encoder in Chrome, and with Safari's WebP behaviour simulated: every case within 500 KB. Not yet tried on a real iPhone.
- **What to do about it:** watch Vercel's image optimization quota. Photos stored before this keep their size in storage. Other places that still load originals are listed in stage 7 of the checklist.

### BE-235 · Docs tidied before the production walk (owner 2026-11-03)
- **What changed:** this board started fresh; its 2,300 lines of history and `BACKEND_IMPLEMENTATION_LOG.md` moved to `docs/archive/`. `docs/LAUNCH_CHECKLIST.md` is rewritten by stage and checked against the code. `ARCHITECTURE.md` and `README.md` are rewritten to match the system as it is (Postgres, one builder, Chillwaa). `AGENTS.md` no longer calls the project a prototype, because the goal since 2026-11-03 is production.
- **What to do about it:** on `office-notebook`, an item added to the old board will conflict at the next merge. Keep the new `docs/HANDOFF.md` and add the item to it.
- **Egress check:** the live site runs BE-230 (`/api/spots` descriptions stop at 281 characters, no detail-only fields). Whether the shared cache saves downloads on Vercel is not proven yet; see stage 0 of the checklist.
