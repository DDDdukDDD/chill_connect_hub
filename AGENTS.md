<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 🌿 Chill & Connect Hub: Mandatory Project Architecture & Design Rules

This document defines the strict, permanent architecture, data separation rules, and design conventions for **Chill & Connect Hub**. Every agent working on this codebase **MUST** strictly follow these rules without exception.

---

## 🏛️ 1. Core Platform Architecture (3 Distinct Discovery Pillars)

The platform is structured into 3 core discovery pillars + 1 community engagement pillar:

### 1. 🌲 พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด (Nationwide Lifestyle Spots - `/spots`)
- **Nature**: Curated lifestyle spots, viewpoints, cafes, slow bars, nature, old towns, and art spaces across all 77 Thai provinces.
- **Dataset**: Managed in `data/spotsData.ts` and submodule datasets (`data/spots/*`).
- **Cards & Rails**: Uses `SpotCard.tsx` and `SpotCategoryRail.tsx` (7 Vibe Categories).

### 2. 👥 กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (Community Meetups - `/community`)
- **Nature**: Peer-to-peer user-created meetups, running clubs, board games, workshops, and chill activities.
- **Rules**:
  - `eventType: 'community'`
  - Must display attendee count (`4/10 คน`) and recruitment status badge (`เปิดรับสมัคร` / `เต็มแล้ว`).
  - Cards show host avatars, participants, and category colors (`heal`, `move`, `chill`, `learn`).
- **Cards & Rails**: Uses `EventGrid.tsx` and `CommunityCategoryRail.tsx`.

### 3. 🏛️ งานมหกรรม นิทรรศการ & เอ็กซ์โป (Major Fairs & Public Venues - `/fairs`)
- **Nature**: Public venue exhibitions, convention center expos (QSNCC, BITEC, IMPACT), marathons, and city design festivals.
- **Rules**:
  - `eventType: 'public_venue'`
  - **NO attendee counting** and **NO recruitment status** (public walk-in / ticketed venues).
  - Cards show venue location badge, organizer name, and date range. **NO bottom attendee bar** (`[ศูนย์จัดแสดง เปิดเข้าชม]` was removed).
- **Cards & Rails**: Uses `EventGrid.tsx` and `FairCategoryRail.tsx`.

### 4. ⚡ ชาเลนจ์ & ภารกิจท้าทาย (Community Quests - `/challenges`)
- **Nature**: Gamified lifestyle check-ins and quests to earn XP and profile badges.

---

## 🎨 2. Strict UI/UX & Aesthetic Rules (Clean, Minimal & Editorial)

1. **Clean & Minimal Typography**:
   - **NO cluttered emojis in titles**: Titles in database (`data/mockData.ts`, `data/chill_database.json`, `data/spotsData.ts`) must never contain trailing decorative emojis (e.g. `ปั้นเซรามิก 🎨` ❌ -> `ปั้นเซรามิก` ✅).
   - **NO arrow icons (`↗`) on titles or category cards**: Cards and rails use clean typography without trailing diagonal arrows.
   - Use standard `line-clamp-2` with `min-h-[2.5rem]` for card titles to ensure uniform grid height.

2. **No Redundant Badges**:
   - **Do NOT put category overlay badges on card images** in `EventGrid.tsx` (e.g. "กิจกรรมชุมชน" or "งานแฟร์ & อีเวนต์" on top-left of image was removed).

3. **Compact Inline Empty State**:
   - Empty search / filter results must use a slim, unobtrusive horizontal banner (`bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200`) with a compact `ดูทั้งหมด` reset button. Never use huge vertical boxes with oversized emoji icons.

4. **Default Home View Direction**:
   - The default homepage layout is **Compact Mode (Editorial Discovery Feed)**.
   - The `Classic Mode` (Hero Banner with 3-tab segmented control) is preserved but subtle: switcher is located inside the user profile dropdown and mobile drawer menu.

5. **Soft Organic Color Palette**:
   - Primary: Forest Green (`#4A7C59`), Soft Mint (`#EBF3ED`), Slate (`#1E293B`, `#0F172A`).
   - Accent: Warm Amber (`#F26430` for Community), Slate Blue (`#2B527A` for Fairs), Royal Violet (`#7C3AED` for Quests & Badges).
   - **Never use pitch black (`bg-black` or heavy borders)** for active selections. Use soft tint fills (`bg-[#EBF3ED]` + `text-[#2D5A3C]`).

6. **Ultra-Minimal Slim Scrollbar Design**:
   - All scrollbars across modals, popups, and containers must be ultra-slim (`width: 6px`, `height: 6px`) with fully rounded pill thumb (`border-radius: 9999px`).
   - **Track**: Always 100% `transparent` (never use visible gray or solid track bars).
   - **Thumb**: Soft slate tint (`rgba(148, 163, 184, 0.35)`) and darkens softly to `rgba(100, 116, 139, 0.6)` on hover.
   - Maintain cross-browser compatibility using `scrollbar-width: thin` and `scrollbar-color`.

7. **Icon & Emoji Usage Rules (Strict No Duplication & Clean Dropdowns)**:
   - **NO Redundant / Duplicate Icons**: Never display duplicate icons or emojis side-by-side representing the same concept (e.g. duplicating Lucide icon + emoji in the same label, or rendering both icon and emoji in the same pill).
   - **NO Emojis / Icons in `<select>` Dropdown Options**: All `<option>` items inside HTML `<select>` dropdowns must contain clean, plain text only (e.g. `<option value="chill">จิบกาแฟ & ชิลล์</option>` ✅ instead of `<option value="chill">☕ จิบกาแฟ & ชิลล์</option>` ❌). This guarantees uniform, accessible, and elegant cross-platform typography without misaligned OS emojis.

---

## 💾 3. Data Integrity & Persistence Rules

1. **Ended Events Filter**:
   - Past events (date prior to current active date) must have `status: 'ended'` in both `data/chill_database.json` and `data/mockData.ts`.
   - On homepage feeds, ended events are auto-hidden by default using `isEventEnded(event)`.
2. **Filtering Isolation**:
   - Filters on Section 01, Section 02, and Section 03 must operate independently and not block other sections from rendering.

---

## 📝 4. Content Creation, Rich Text Editor & Form Validation Rules

1. **Rich Text Editor Standard (`RichTextEditor.tsx`)**:
   - Long-form content inputs (such as event descriptions, spot details, and buddy trip plans) must use `RichTextEditor.tsx` with WYSIWYG rendering.
   - Headers and bold text must be styled as actual bold text (`<strong>`) in the editor and preview—**never display raw markdown asterisks `**`** to users.
   - Use `renderDescriptionContent()` from `RichTextEditor.tsx` in detail pages (`/community/[id]`, `/spots/[id]`, `/fairs/[id]`) for unified, clean editorial typography.
   - Use `stripHtmlToPlainText()` whenever rendering descriptions inside card snippets or list views with `line-clamp`.

2. **Dedicated Spot Buddy Gathering Dialog (`SpotBuddyGatheringModal.tsx`)**:
   - Spot buddy trips triggered from `/spots/[id]` must use the specialized, purpose-built `SpotBuddyGatheringModal.tsx` (preserving spot pre-fill, meeting point, participants counter 2-15, and community safety pledge).

3. **Strict Form Validation & Required Fields Matrix**:
   - **All Entity Types**:
     - `title`: >= 5 chars, required.
     - `province`: required for regional tagging and filtering.
     - `locationName`: required (spot name / venue name / district).
     - `description`: Rich text with plain text length >= 15 chars, required.
     - `isSafetyAccepted`: Platform safety pledge checkbox must be checked.
   - **👥 Community Meetups (`community` / `SpotBuddyGatheringModal`)**:
     - `communityDate` & `time` (`startTime`, `endTime`): required.
     - `meetingPoint`: required (specific spot landmark e.g., in front of cafe, entrance gate).
     - `maxParticipants`: >= 2 people, required.
   - **🏛️ Fairs & Public Venues (`fair`)**:
     - `fairStartDate` & `fairEndDate`: required (`fairEndDate >= fairStartDate`).
     - `fairOrganizer`: required (organizing association / company name).
   - **🌲 Lifestyle Spots (`spot`)**:
     - `spotOpenHours`: required (e.g. 08:00 - 18:00 น.).
   - **⚡ Quests & Challenges (`challenge`)**:
     - `questBadgeName`: required badge identifier.


