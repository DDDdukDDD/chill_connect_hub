# Design System & Guidelines: Chill & Connect Hub

เอกสารนี้สรุป **แกนหลักและปรัชญาการออกแบบ (Core Design Philosophy)** ของ Chill & Connect Hub เพื่อใช้เป็นเกณฑ์มาตรฐานและทบทวนร่วมกันในทุกๆ เซสชันการทำงาน

---

## 🏛️ 1. Core Platform Pillars (เสาหลักของแพลตฟอร์ม)

1. **🌲 พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด (`/spots`)**:
   - คัดสรรสถานที่ท่องเที่ยว คาเฟ่ สโลว์บาร์ ธรรมชาติ จุดชมวิว และย่านเก่าทั่วไทย 77 จังหวัด
   - ใช้ `SpotCard.tsx` และ `SpotCategoryRail.tsx` (7 Vibe Categories)
2. **👥 กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (`/community`)**:
   - กิจกรรมที่สร้างโดยผู้ใช้ในชุมชน มีการนับผู้เข้าร่วม (`4/10 คน`) และสถานะเปิดรับสมัคร
   - ใช้ `EventGrid.tsx` (Community Layout) และ `CommunityCategoryRail.tsx`
3. **🏛️ งานมหกรรม นิทรรศการ & เอ็กซ์โป (`/fairs`)**:
   - งานแสดงสินค้า มหกรรมใหญ่ (QSNCC, BITEC, IMPACT) งานวิ่งมาราธอน และเทศกาลเมือง
   - **ไม่มีการนับจำนวนคนเข้าร่วม** และ **ไม่มีปุ่มเปิดรับสมัคร** (แสดงสถานที่และวันจัดงาน)
   - ใช้ `EventGrid.tsx` (Public Venue Layout) และ `FairCategoryRail.tsx`
4. **⚡ ชาเลนจ์ & ภารกิจท้าทาย (`/challenges`)**:
   - ภารกิจสะสมเหรียญตรา (Badges) และ EXP ประจำตัว

---

## 🌿 2. Core Design Philosophy (ปรัชญาการออกแบบ)

### 🌿 "Clean, Minimal, Organic & Professional"
- **สะอาด & โปร่งตา (Clean & Breathable)**: เน้น Whitespace ที่พอเหมาะ ไม่แออัด ลดเส้นสายหรือขอบหนาที่ไม่จำเป็น
- **มินิมอลแบบสุขุม (Understated Sophistication)**: หลีกเลี่ยงความฉูดฉาด การใช้สีสดแป๊ดเกินไป หรือลูกเล่นที่รกรุงรัง
- **มืออาชีพ & ทันสมัย (Editorial & Modern Web Standards)**: ใช้ Typography คุณภาพสูง (Inter, Prompt, Outfit) จัดระดับ Heading/Subheading ชัดเจนแบบ Apple/Luma Style
- **โทนสีธรรมชาติ (Organic Nature Palette)**:
  - สีหลักของแบรนด์: Forest Green (`#4A7C59`), Soft Mint (`#EBF3ED`), Slate (`#1E293B`, `#0F172A`)
  - Accent เฉพาะจุด: Warm Amber (`#F26430` สำหรับ Community), Slate Blue (`#2B527A` สำหรับ Major Fairs), Gold (`#D97706` สำหรับ Quests)

---

## 📐 3. Key UI/UX Rules & Guidelines (กฎเหล็กในการดีไซน์)

### 1. Typography & Hierarchy (ตัวอักษรและการจัดลำดับ)
- **ห้ามมี Emoji รกๆ ในชื่อ Title**: ชื่อในการ์ดและฐานข้อมูลต้องไม่มี Emoji ตกแต่งต่อท้าย (เช่น `ปั้นเซรามิก` ✅ ไม่ใช่ `ปั้นเซรามิก 🎨` ❌)
- **ห้ามใส่ลูกศร `↗` (ArrowUpRight) ท้ายชื่อ**: ทุกการ์ดและหมวดหมู่ใช้ข้อความเรียบหรู คมชัด
- **การ์ดรายการ (Card Titles)**: ใช้การตัดคำแบบ 2 บรรทัด (`line-clamp-2`) พร้อมกำหนดความสูงขั้นต่ำที่สม่ำเสมอ (`min-h-[2.5rem]`) เพื่อให้การ์ดในแถวเดียวกันมีความสูงเท่ากันเสมอตลอดแนว
- **Dropdown List Typography**: ในแท็ก `<option>` ของ Dropdown ห้ามใส่อิโมจิรกรุงรัง ให้ใช้ตัวอักษรเรียบหรู อ่านง่าย

### 2. Badges & Overlays (ป้ายกำกับ)
- **ห้ามติด Badge หมวดหมู่ซ้ำซ้อนบนรูปการ์ด**: การ์ดใน `EventGrid` ไม่ติดป้าย "กิจกรรมชุมชน" หรือ "งานแฟร์ & อีเวนต์" ทับรูปภาพ
- **การ์ดงานแฟร์ (Public Fairs)**: ไม่แสดงแถบด้านล่าง `[ศูนย์จัดแสดง เปิดเข้าชม]`

### 3. Empty State (กรณีไม่พบข้อมูล)
- **ใช้ Compact Inline Strip**: ใช้แถบแนวนอนบางๆ สบายตา (`bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-200`) พร้อมปุ่มกด *"ดูทั้งหมด"* ขนาดกะทัดรัด ห้ามใช้กล่องการ์ดสี่เหลี่ยมขนาดใหญ่กินพื้นที่หน้าจอ

### 4. Active / Selected State
- **หลีกเลี่ยงการใช้สีดำทึบกระด้าง (`bg-black` หรือ `bg-slate-900`)** สำหรับกล่องที่ถูกเลือกในส่วนของคอนเทนต์
- **ให้ใช้สี Soft Tint ประจำธีม**: เช่น `bg-[#EBF3ED]` (Soft Mint Green) + กรอบ `border-[#4A7C59]` + ตัวหนังสือ `text-[#2D5A3C]` ให้ความรู้สึกเป็นมิตรและพรีเมียม

### 5. Homepage View Modes (มุมมองหน้าแรก)
- **Default View**: เป็น **Compact Mode (Editorial Discovery Feed)** เสมอ
- **Classic Mode**: สลับได้ผ่าน Profile Dropdown และ Mobile Drawer เพื่อรักษาความมินิมอลของหน้าแรก

---

## 🎯 4. Pre-flight Checklist ก่อนส่งมอบงานทุกครั้ง
- [ ] ความสะอาดตา สบายตา มินิมอล ตรงตามคอนเซ็ปต์หรือไม่?
- [ ] ไม่มี Emoji รกๆ ในชื่อหัวข้อ หรือลูกศร `↗` ห้อยท้ายหรือไม่?
- [ ] บนรูปการ์ดไม่มี Badge ซ้ำซ้อนทับภาพหรือไม่?
- [ ] ตัวหนังสือและฟอนต์ทั้งภาษาไทยและอังกฤษแสดงผลครบถ้วน ไม่ถูกตัดทับหรือไม่?
- [ ] การเลือกสถานะ (Active/Select) ดูนุ่มนวลและไม่มืดทึบเกินไปหรือไม่?
- [ ] ทดสอบทั้งบนหน้าจอมือถือ (Mobile View) และหน้าจอคอมพิวเตอร์ (Desktop) แล้วหรือยัง?
- [ ] ข้อมูลและตัวกรองแต่ละส่วนทำงานอิสระ ไม่ดึงฟิลเตอร์ข้ามส่วนจนข้อมูลหายหรือไม่?

---

## Mandatory UI Rules

Moved here from `AGENTS.md` on 2026-10-06 so agent instructions stay short. These rules are still mandatory for every agent.

### 💎 1. Core Design Philosophy: Global Luxury & Editorial Simplicity (9.8+)

Chill & Connect Hub employs a **Global Luxury & Minimal Editorial** aesthetic—combining the clarity of international lifestyle curation (e.g. Monocle, Apple, Airbnb, Klook) with warm, organic Thai hospitality:

1. **Frosted Trust Micro-Pills**:
   - Headers feature floating frosted white pills (`bg-white/90 border shadow-2xs`) displaying key quality signals and safety assurances (e.g. `✓ คัดสรรคุณภาพ 77 จังหวัด`, `ShieldCheck คอมมูนิตี้ปลอดภัย`).
2. **High-Clarity Hero Imagery**:
   - Hero media uses sunny, high-saturation, crisp landscape and city imagery (vibrant green Bangkok parks, turquoise Andaman waters) with subtle gradients and balanced auto-cycling.
3. **Voucher & Privilege Cards**:
   - New member vouchers and privilege cards must remain compact, elegant, and proportionate (`max-w-[270px]`, `min-h-[105px]`), never oversized or dominating the card grid below.

---

### 🔘 2. Unified Common Button System (`#2563EB` Royal Blue + Slate Black)

To eliminate "Rainbow Buttons" (visual clutter caused by buttons matching every section color), the platform strictly enforces a **Centralized Two-Tier Button Hierarchy**:

| Button Level | Color & Styling | Applied Locations |
| :--- | :--- | :--- |
| **Primary Action (Main CTA)** | **Royal Blue**<br>`bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm` | • Hero search buttons (Editorial & Classic modes)<br>• Primary login / conversion buttons (`/myhub`, `/about`) |
| **Editorial Header Action & Secondary** | **Slate Black**<br>`bg-slate-900 hover:bg-slate-800 text-white shadow-2xs`<br>or `bg-slate-100 hover:bg-slate-200 text-slate-700` | • Subpage header CTA (`+ แนะนำพิกัดเที่ยวใหม่`, `+ เปิดตี้ / สร้างกิจกรรมใหม่`, `+ สร้างงานมหกรรม / เอ็กซ์โป`)<br>• Navbar login trigger (`bg-[#1E293B]`)<br>• Register member buttons (`bg-slate-900`)<br>• Modal close / back buttons (`bg-slate-100`)<br>• Active filter chips |
| **Section Accent Identity** | **Strictly on Cards, Category Rails, and Badges only** | • Never apply section colors to action buttons.<br>• Section colors belong exclusively to cards, tags, and category pills. |

---

### 🎨 3. Discovery Pillars & Color Separation

The platform is strictly organized into 3 discovery pillars + 1 community engagement pillar (Community-First Hierarchy):

#### 1. 👥 กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่ (Community Meetups - `/community`)
- **Theme Color**: **Sunset Amber** (`#F26430` / `#D04A1B`, soft tint `#FFF4EE`).
- **Nature**: Peer-to-peer user-created meetups, running clubs, board games, workshops, and chill activities.
- **Rules**:
  - `eventType: 'community'`.
  - Must display attendee count (`4/10 คน`) and recruitment status badge (`เปิดรับสมัคร` / `เต็มแล้ว`).
  - Cards show host avatars, participants, and category colors (`heal`, `move`, `chill`, `learn`).
- **Cards & Rails**: Uses `EventGrid.tsx` and `CommunityCategoryRail.tsx`.

#### 2. 🏛️ งานมหกรรม นิทรรศการ & เอ็กซ์โป (Major Fairs & Public Venues - `/fairs`)
- **Theme Color**: **Slate Blue** (`#2B527A` / `#1F3D5C`, soft tint `#EEF4FA`).
- **Nature**: Public venue exhibitions, convention center expos (QSNCC, BITEC, IMPACT), marathons, and design festivals.
- **Rules**:
  - `eventType: 'public_venue'`.
  - **NO attendee counting** and **NO recruitment status** (walk-in / ticketed venues).
  - Cards show venue location badge, organizer name, and date range. **NO bottom attendee bar**.
- **Cards & Rails**: Uses `EventGrid.tsx` and `FairCategoryRail.tsx`.

#### 3. 🌲 พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด (Nationwide Lifestyle Spots - `/spots`)
- **Theme Color**: **Forest Green** (`#4A7C59` / `#2D5A3C`, soft mint `#EBF3ED`).
- **Nature**: Curated lifestyle spots, viewpoints, cafes, slow bars, nature, old towns, and art spaces across all 77 Thai provinces.
- **Dataset**: `data/spotsData.ts` and submodule datasets (`data/spots/*`).
- **Cards & Rails**: Uses `SpotCard.tsx` and `SpotCategoryRail.tsx` (7 Vibe Categories).

#### 4. ⚡ ชาเลนจ์ & ภารกิจท้าทาย (Community Quests - `/challenges`)
- **Theme Color**: **Royal Violet** (`#7C3AED`, soft tint `#F5F3FF`).
- **Nature**: Gamified lifestyle check-ins and quests to earn XP and profile badges.

---

### 🧹 4. Strict UI/UX Hygiene & Editorial Conventions

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

7. **Platform Typographic Scale Standard (มาตรฐานขนาดตัวอักษรของ Platform)**:
   - Every text element must strictly follow this balanced hierarchy to maintain readability and global luxury rhythm across devices:
     | Hierarchy Level | Tailwind Classes | Actual Size (Mobile ➔ Desktop) | Use Case & Standard |
     | :--- | :--- | :--- | :--- |
     | **Page H1 (Hero Title)** | `text-2xl sm:text-3xl md:text-4xl font-black` | 24px ➔ 36px | Homepage hero, detail page primary titles (`/spots/[id]`, `/community/[id]`, `/fairs/[id]`) |
     | **Section H2** | `text-xl sm:text-2xl font-black` | 20px ➔ 24px | Pillar headers (Section 01, 02, 03) and primary subpage section titles |
     | **Modal / Pass Title** | `text-lg sm:text-xl md:text-2xl font-black` | 18px ➔ 24px | Primary event title in `ETicketModal`, `ExpoMeetupPassModal`, and confirmation dialogs |
     | **Card / List Title** | `text-sm sm:text-base font-extrabold` | 14px ➔ 16px | Card titles in feeds (`EventGrid`, `SpotCard`), strictly using `line-clamp-2 min-h-[2.5rem]` |
     | **Key Info / Values** | `text-xs sm:text-sm font-bold` | 12px ➔ 14px | Key specs (dates, times, locations, price tags, ticket IDs) |
     | **Field Labels** | `text-[11px] sm:text-xs font-semibold` | 11px ➔ 12px | Input/spec labels (`วันที่จัดกิจกรรม:`, `จุดนัดพบ:`) with slate-500 tone (never < 11px) |
     | **Micro Badges / Pills** | `text-[10px] sm:text-xs font-extrabold` | 10px ➔ 12px | Trust pills, quality signals, and category tags |

