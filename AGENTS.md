<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 🌿 Chill & Connect Hub: Mandatory Architecture & Design Concept (Global Luxury 9.8+)

This document defines the strict, permanent architecture, design system, and editorial standards for **Chill & Connect Hub**. Every agent working on this codebase **MUST** strictly adhere to these conventions.
For a complete system blueprint, mental model (3-4-3), and usage guide, see [ARCHITECTURE.md](file:///c:/Users/Asus/.gemini/antigravity-ide/scratch/chill-and-connect-hub/ARCHITECTURE.md).

---

## 💎 1. Core Design Philosophy: Global Luxury & Editorial Simplicity (9.8+)

Chill & Connect Hub employs a **Global Luxury & Minimal Editorial** aesthetic—combining the clarity of international lifestyle curation (e.g. Monocle, Apple, Airbnb, Klook) with warm, organic Thai hospitality:

1. **Hierarchy via English Capsule Badges**:
   - Every page header and major section begins with a compact, uppercase English category pill (e.g. `Curated Spaces • 77 Provinces`, `Meetups & Circles`, `Major Fairs & Public Expos`, `Personal Lifestyle Hub`, `Our Vision & Architecture`).
2. **Frosted Trust Micro-Pills**:
   - Headers feature floating frosted white pills (`bg-white/90 border shadow-2xs`) displaying key quality signals and safety assurances (e.g. `✓ คัดสรรคุณภาพ 77 จังหวัด`, `ShieldCheck คอมมูนิตี้ปลอดภัย`).
3. **High-Clarity Hero Imagery**:
   - Hero media uses sunny, high-saturation, crisp landscape and city imagery (vibrant green Bangkok parks, turquoise Andaman waters) with subtle gradients and balanced auto-cycling.
4. **Voucher & Privilege Cards**:
   - New member vouchers and privilege cards must remain compact, elegant, and proportionate (`max-w-[270px]`, `min-h-[105px]`), never oversized or dominating the card grid below.

---

## 🔘 2. Unified Common Button System (`#2563EB` Royal Blue + Slate Black)

To eliminate "Rainbow Buttons" (visual clutter caused by buttons matching every section color), the platform strictly enforces a **Centralized Two-Tier Button Hierarchy**:

| Button Level | Color & Styling | Applied Locations |
| :--- | :--- | :--- |
| **Primary Action (Main CTA)** | **Royal Blue**<br>`bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm` | • Hero search buttons (Editorial & Classic modes)<br>• `+ แนะนำพิกัดเที่ยวใหม่` (`/spots`)<br>• `+ เปิดตี้ / สร้างกิจกรรมใหม่` (`/community`)<br>• `+ สร้างงานมหกรรม / เอ็กซ์โป` (`/fairs`)<br>• Primary login / conversion buttons (`/myhub`, `/about`) |
| **Secondary / Neutral Action** | **Slate Black**<br>`bg-slate-900 hover:bg-slate-800 text-white`<br>or `bg-slate-100 hover:bg-slate-200 text-slate-700` | • Navbar login trigger (`bg-[#1E293B]`)<br>• Register member buttons (`bg-slate-900`)<br>• Modal close / back buttons (`bg-slate-100`)<br>• Secondary navigation chips |
| **Section Accent Identity** | **Strictly on Cards, Category Rails, and Badges only** | • Never apply section colors to primary action buttons.<br>• Section colors belong exclusively to cards, tags, and category pills. |

---

## 🎨 3. Discovery Pillars & Color Separation

The platform is strictly organized into 3 discovery pillars + 1 community engagement pillar (Community-First Hierarchy):

### 1. 👥 กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (Community Meetups - `/community`)
- **Theme Color**: **Sunset Amber** (`#F26430` / `#D04A1B`, soft tint `#FFF4EE`).
- **Nature**: Peer-to-peer user-created meetups, running clubs, board games, workshops, and chill activities.
- **Rules**:
  - `eventType: 'community'`.
  - Must display attendee count (`4/10 คน`) and recruitment status badge (`เปิดรับสมัคร` / `เต็มแล้ว`).
  - Cards show host avatars, participants, and category colors (`heal`, `move`, `chill`, `learn`).
- **Cards & Rails**: Uses `EventGrid.tsx` and `CommunityCategoryRail.tsx`.

### 2. 🏛️ งานมหกรรม นิทรรศการ & เอ็กซ์โป (Major Fairs & Public Venues - `/fairs`)
- **Theme Color**: **Slate Blue** (`#2B527A` / `#1F3D5C`, soft tint `#EEF4FA`).
- **Nature**: Public venue exhibitions, convention center expos (QSNCC, BITEC, IMPACT), marathons, and design festivals.
- **Rules**:
  - `eventType: 'public_venue'`.
  - **NO attendee counting** and **NO recruitment status** (walk-in / ticketed venues).
  - Cards show venue location badge, organizer name, and date range. **NO bottom attendee bar**.
- **Cards & Rails**: Uses `EventGrid.tsx` and `FairCategoryRail.tsx`.

### 3. 🌲 พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด (Nationwide Lifestyle Spots - `/spots`)
- **Theme Color**: **Forest Green** (`#4A7C59` / `#2D5A3C`, soft mint `#EBF3ED`).
- **Nature**: Curated lifestyle spots, viewpoints, cafes, slow bars, nature, old towns, and art spaces across all 77 Thai provinces.
- **Dataset**: `data/spotsData.ts` and submodule datasets (`data/spots/*`).
- **Cards & Rails**: Uses `SpotCard.tsx` and `SpotCategoryRail.tsx` (7 Vibe Categories).

### 4. ⚡ ชาเลนจ์ & ภารกิจท้าทาย (Community Quests - `/challenges`)
- **Theme Color**: **Royal Violet** (`#7C3AED`, soft tint `#F5F3FF`).
- **Nature**: Gamified lifestyle check-ins and quests to earn XP and profile badges.

---

## 🧹 4. Strict UI/UX Hygiene & Editorial Conventions

1. **Clean & Minimal Typography**:
   - **NO cluttered emojis in titles or headers**: Titles in databases (`data/mockData.ts`, `data/chill_database.json`, `data/spotsData.ts`) and section headings must never contain trailing decorative emojis (e.g. `ปั้นเซรามิก 🎨` ❌ -> `ปั้นเซรามิก` ✅).
   - **NO raw unicode arrows (`↗`)**: Use clean typography without trailing diagonal arrows. Always use SVG `<ArrowRight />` when an arrow is needed.
   - Use standard `line-clamp-2` with `min-h-[2.5rem]` for card titles to maintain uniform grid rhythm.

2. **No Redundant Badges**:
   - Do NOT overlay category badges on card images in `EventGrid.tsx` (e.g. redundant "กิจกรรมชุมชน" or "งานแฟร์" overlay on top-left was removed).

3. **No Raw Markdown Asterisks in UI**:
   - Never output raw markdown asterisks `**text**` in JSX. Always use standard `<strong>` tags or WYSIWYG rendering via `RichTextEditor.tsx`.

4. **Dropdown Cleanliness**:
   - **NO emojis or icons in `<select>` dropdown options**: All `<option>` items must contain clean, plain text only (e.g. `<option value="chill">จิบกาแฟ & ชิลล์</option>` ✅).

5. **Compact Inline Empty State**:
   - Empty search / filter results must use a slim, horizontal banner (`bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200`) with a compact `ดูทั้งหมด` reset button. Never use huge vertical boxes with oversized emoji icons.

6. **Ultra-Minimal Slim Scrollbar Design**:
   - Modals and scroll containers must use ultra-slim 6px scrollbars (`scrollbar-width: thin`) with a transparent track and soft slate rounded pill thumb (`border-radius: 9999px`).

---

## 💾 5. Data Integrity & Persistence Rules

1. **Ended Events Filter**:
   - Past events must have `status: 'ended'`.
   - On homepage feeds, ended events are hidden by default via `isEventEnded(event)`.
2. **Filtering Isolation**:
   - Filters on Section 01, Section 02, and Section 03 operate independently and never block other sections from rendering.

---

## 📝 6. Form Validation & Safety Standards

- **All Entities**: `title` >= 5 chars, `province` required, `locationName` required, `description` >= 15 chars plain text, and `isSafetyAccepted` checked.
- **Community Meetups**: Date, start/end time, landmark meeting point, and max participants (2-15) required.
- **Fairs & Expos**: Start date, end date, and official organizer required.
- **Spots**: Open hours required.
- **Dedicated Spot Buddy Dialog**: Spot buddy trips triggered from `/spots/[id]` must use `SpotBuddyGatheringModal.tsx`.


