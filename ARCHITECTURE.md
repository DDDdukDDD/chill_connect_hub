# 🗺️ Chill & Connect Hub - Master Architecture & System Blueprint
> **คู่มือแผนที่สถาปัตยกรรมระบบ สรุปวิธีจำโครงสร้างทั้งหมดของโปรเจกต์ในหน้าเดียว**

---

## 🧠 1. วิธีจำง่ายๆ ใน 1 นาที (The 3 - 4 - 3 Mental Model)

ไม่ต้องท่องจำโค้ดทุกบรรทัด ให้จำด้วยโมเดล **"3 - 4 - 3"** นี้ครับ:

```
┌─────────────────────────────────────────────────────────────┐
│                 🌟 3 เสาหลักหน้าบ้าน (Discovery Pillars)     │
│   1. พิกัดเที่ยว 77 จว.    2. ตี้เพื่อนใหม่ (Community)    3. งานแฟร์ & เอ็กซ์โป  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    🏢 4 ชั้นระบบ (System Layers)             │
│   Layer 1: Presentation (Next.js 16 + WebP Pre-compressor)  │
│   Layer 2: API & Edge Cache (Route Handlers + HTTP SWR)     │
│   Layer 3: App Engines (Cache Manager + Storage + DAO db)   │
│   Layer 4: Data Storage (Local Dev File -> Production DB)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│              🛡️ 3 เกราะป้องกันคอขวด (Anti-Bottleneck)        │
│   1. Async Mutex & ACID   (ล็อกการจอง ป้องกันคนแย่งชนกัน)    │
│   2. Multi-Tier Caching   (L1 RAM + L2 SWR ลดโหลด DB 90%)   │
│   3. Media CDN Pipeline   (บีบอัด WebP < 200KB แทน Base64)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 2. แผนที่ 4 ชั้นระบบ และตำแหน่งไฟล์ (System Map)

### 🔹 Layer 1: Presentation & Client-Side (`components/`, `app/`)
- หน้าเว็บ Next.js 16 App Router UI ทั้งหมด
- **จุดสำคัญเรื่องรูปภาพ**:
  - เมื่อผู้ใช้เลือกรูปใน [`CreateEventModal.tsx`](components/CreateEventModal.tsx) หรือ [`SpotBuddyGatheringModal.tsx`](components/SpotBuddyGatheringModal.tsx)
  - รูปจะถูกบีบอัดทันทีด้วย [`lib/media/compressor.ts`](lib/media/compressor.ts) (Canvas API) ให้กลายเป็น `.webp` ขนาดเล็ก (< 200KB) ก่อนส่งขึ้น Server

### 🔹 Layer 2: API & Edge Caching (`app/api/`)
- [`app/api/events/route.ts`](app/api/events/route.ts): API กิจกรรมคอมมูนิตี้และงานแฟร์ (รองรับ Pagination, Atomic Join, และ HTTP Cache `s-maxage=30`)
- [`app/api/spots/route.ts`](app/api/spots/route.ts): API พิกัดเที่ยว 77 จังหวัด (รองรับ Pagination, Fuzzy Search, และ HTTP Cache `s-maxage=60`)
- [`app/api/upload/route.ts`](app/api/upload/route.ts): Endpoint รับอัปโหลดรูปภาพ ตรวจสอบความปลอดภัยและส่งเข้า Media Storage

### 🔹 Layer 3: Application Core Engines (`lib/`)
นี่คือหัวใจของระบบหลังบ้าน แบ่งเป็น 3 ส่วนหลักที่จำได้ง่ายมาก:

| โมดูล | โฟลเดอร์ | หน้าที่ | วิธีเรียกใช้ในโค้ด |
| :--- | :--- | :--- | :--- |
| **🗄️ Database (DAO)** | [`lib/db/`](lib/db/) | ควบคุมการอ่าน/เขียนข้อมูล, ค้นหา 77 จังหวัด, ป้องกันการจองชนกัน | `import { db } from '@/lib/db'` |
| **⚡ Multi-Tier Cache** | [`lib/cache/`](lib/cache/) | แคชผลลัพธ์ใน RAM พร้อมระบบ TTL และ Tag Invalidation | `import { cacheManager } from '@/lib/cache'` |
| **📷 Media Storage** | [`lib/media/`](lib/media/) | บันทึกรูปภาพลง Local หรือ Cloud CDN | `import { mediaStorage } from '@/lib/media'` |

### 🔹 Layer 4: Data Storage & Persistence (`data/`, `database/`, `public/uploads/`)
- **โหมดพัฒนา (Local Dev)**:
  - ฐานข้อมูล: บันทึกและอ่านจากไฟล์ [`data/chill_database.json`](data/chill_database.json) (มี In-Memory Cache + Async Mutex ล็อกการเขียนไฟล์)
  - รูปภาพ: บันทึกเก็บในโฟลเดอร์ [`public/uploads/`](public/uploads/)
- **โหมดโปรดักชัน (Production Ready)**:
  - ไฟล์ SQL DDL และ Stored Procedures พร้อมรันบน Supabase / PostgreSQL ทันที:
    - [`database/schema.sql`](database/schema.sql) (PostGIS รัศมี 77 จังหวัด, GIN Tags)
    - [`database/atomic_functions.sql`](database/atomic_functions.sql) (`join_event_atomic` ล็อกแถวด้วย `SELECT ... FOR UPDATE`)
    - [`database/seed.sql`](database/seed.sql) (ข้อมูลเริ่มต้น)

---

## 💻 3. สรุป Code Snippets วิธีเรียกใช้งาน (Developer Cheatsheet)

### 1) การดึงข้อมูลผ่าน DAO (มีแคชอัตโนมัติ)
```ts
import { db } from '@/lib/db';

// ดึงกิจกรรมคอมมูนิตี้แบบแบ่งหน้า
const events = await db.findEvents({ page: 1, limit: 12, eventType: 'community', province: 'เชียงใหม่' });

// ดึงพิกัดเที่ยว 77 จังหวัด
const spots = await db.findSpots({ page: 1, limit: 12, province: 'กรุงเทพมหานคร', vibeTag: 'nature' });

// การกดเข้าร่วมกิจกรรมแบบป้องกันคนแย่งที่กัน (Atomic)
const joinResult = await db.atomicJoinEvent('ev-123', {
  userId: 'usr-001',
  userName: 'สมชาย',
  userAvatar: 'https://...',
});
```

### 2) การใช้งาน Caching ด้วยตนเอง
```ts
import { cacheManager } from '@/lib/cache';

// แคชผลลัพธ์การคำนวณที่ใช้เวลานาน 60 วินาที
const data = await cacheManager.getOrSet('custom-key', async () => {
  return await doHeavyCalculation();
}, { ttlMs: 60000, tags: ['custom-tag'] });

// ล้างแคชเมื่อมีการแก้ไขข้อมูล
cacheManager.invalidateTag('custom-tag');
```

### 3) การใช้งานบีบอัดรูปภาพหน้าบ้าน (Client-Side)
```ts
import { compressImage } from '@/lib/media/compressor';

// ย่อรูปจาก 10MB เหลือ < 200KB WebP ก่อนส่งขึ้นเซิร์ฟเวอร์
const compressedFile = await compressImage(originalFile, {
  maxWidth: 1600,
  quality: 0.82,
});
```

---

## 🧪 4. คำสั่งทดสอบสุขภาพระบบ (Verification Commands)

เมื่อมีการแก้ไขโค้ด สามารถรันคำสั่งตรวจสอบเหล่านี้เพื่อการันตีความถูกต้อง 100%:

```bash
# 1. ทดสอบระบบ DAO + ทดสอบ Concurrency คนแย่งจองพร้อมกัน 10 คน
npx tsx scripts/test_db_adapter.ts

# 2. ทดสอบระบบ Cache TTL, Tag Invalidation และ Media Storage Upload
npx tsx scripts/test_cache_and_storage.ts

# 3. ตรวจสอบชนิดข้อมูล TypeScript ทั่วทั้งโปรเจกต์
npx tsc --noEmit

# 4. ทดสอบคอมไพล์โปรดักชัน Next.js ทุก Routes
npm run build
```

---

## 📍 5. สถาปัตยกรรมการระบุตำแหน่ง & โซนพื้นที่ (Nationwide Location & Zone Architecture)

ระบบค้นหาและระบุตำแหน่งของทั้ง 3 เสาหลัก (พิกัดเที่ยว, คอมมูนิตี้, งานแฟร์) ถูกออกแบบด้วยโครงสร้างลำดับชั้น 3 ระดับ (3-Level Location Hierarchy) เพื่อตอบโจทย์พฤติกรรมจริงของผู้ใช้:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Level 1: จังหวัด (Province)                                               │
│  - 77 จังหวัดทั่วไทย + "ออนไลน์ (ไม่จำกัดสถานที่)"                           │
│  - มี Normalization รองรับ "กทม", "กรุงเทพ", "กรุงเทพฯ", "กรุงเทพมหานคร"      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Level 2: เขต / โซนไลฟ์สไตล์ (District / Zone)                              │
│  - กรุงเทพฯ: siam, ari, bangna, silom, thonglor, ladprao, oldtown          │
│  - ปริมณฑล & ต่างจังหวัด: nonthaburi, rangsit, chiangmai_city, bangsaen   │
│  - ไร้พรมแดน: online (Zoom / Discord)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Level 3: จุดนัดพบ & สถานที่จัดงานจริง (Venue Landmark & Meeting Point)      │
│  - ศูนย์แสดงสินค้า: QSNCC, BITEC, IMPACT, Paragon Hall, ICONSIAM             │
│  - พิกัดไลฟ์สไตล์ / นัดตี้: สวนวชิรเบญจทัศ (ประตู 1), อ่างแก้ว มช., หาดวอนนภา │
└─────────────────────────────────────────────────────────────────────────────┘
```

### การทำงานร่วมกันข้ามทั้ง 3 เสาหลัก:
1. **Hero Search (หน้าแรก)**: เมื่อผู้ใช้เลือกจังหวัดในช่องค้นหา ทุกเสาหลัก (`พิกัดเที่ยว`, `คอมมูนิตี้`, `งานแฟร์`) จะฟิลเตอร์พร้อมกันแบบเรียลไทม์
2. **หน้ากิจกรรมคอมมูนิตี้ (`/community`)**: มีตัวเลือกจังหวัดและโซนออนไลน์ รองรับทั้งตี้พบปะตัวจริงและตี้พูดคุยออนไลน์
3. **หน้างามหกรรม & เอ็กซ์โป (`/fairs`)**: เชื่อมโยงจังหวัดเข้ากับศูนย์ประชุม (เช่น IMPACT -> นนทบุรี, BITEC/QSNCC -> กรุงเทพฯ, เชียงใหม่ ดีไซน์ วีค -> เชียงใหม่)
4. **ฟอร์มสร้างกิจกรรม (`CreateEventModal.tsx`)**: บันทึก `province` และ `zone` ลงฐานข้อมูลอัตโนมัติ ทำให้กิจกรรมใหม่สามารถถูกค้นหาและจัดหมวดหมู่ได้ทันที

---

## 🔄 6. ระบบกำหนดการประจำ (Recurring / Interval Schedule) และกิจกรรมออนไลน์ (Virtual Gatherings)

### 1) สถาปัตยกรรมตารางเวลาแบบสากล (iCalendar RFC 5545 Standard)
เพื่อรองรับพฤติกรรมคอมมูนิตี้จริง เช่น "วิ่งทุกเย็น จันทร์-พุธ-ศุกร์" หรือ "บอร์ดเกมทุกวันเสาร์-อาทิตย์" ระบบได้ผสานมาตรฐาน RFC 5545 RRULE เข้าสู่ Data Model:

```ts
export type DayOfWeek = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface EventRecurrence {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval?: number;              // ทุกๆ 1 สัปดาห์, 2 สัปดาห์
  daysOfWeek?: DayOfWeek[];       // ['MO', 'WE', 'FR'] หรือ ['SA', 'SU']
  endType: 'never' | 'on_date';
  endDate?: string;
  customSummary?: string;         // ข้อความแสดงผล เช่น "ทุกวันพุธ และ วันศุกร์"
}
```

- **Community Meetups (`/community`)**: รองรับทั้ง `single` (จัดครั้งเดียว) และ `recurring` (จัดซ้ำเป็นประจำ) พร้อมปุ่มเลือกวันรายสัปดาห์และ Preset สำเร็จรูป (`วันธรรมดา`, `วันหยุดเสาร์-อาทิตย์`)
- **Major Fairs & Expos (`/fairs`)**: คงโครงสร้างแบบช่วงวันที่ต่อเนื่อง (`fairStartDate` ถึง `fairEndDate`) เหมาะกับนิทรรศการและมหกรรมแสดงสินค้าในศูนย์ประชุมจริง

### 2) ระบบกิจกรรมออนไลน์ไร้พรมแดน (Virtual / Online Gatherings)
- **รูปแบบการจัดงาน**: รองรับการสลับระหว่าง `📍 นัดเจอสถานที่จริง (On-site)` และ `🌐 รวมตัวออนไลน์ (Virtual)`
- **แพลตฟอร์มที่รองรับ**: Zoom, Google Meet, Discord, Microsoft Teams และ Custom Platform
- **การจัดการข้อมูล**:
  - กำหนด `province: 'ออนไลน์'` และ `zone: 'online'` อัตโนมัติ ทำให้ผู้ใช้สามารถค้นหาผ่านฟิลเตอร์จังหวัด "ออนไลน์" ได้ทันที
  - ปรับการตรวจสอบฟอร์ม (Validation) ไม่บังคับจุดนัดพบทางกายภาพเมื่อเลือกรูปแบบออนไลน์
  - ระบบความปลอดภัย & สิทธิเข้าถึง: ลิงก์ห้องประชุม (`onlineJoinUrl`) จะถูกปกป้องและเปิดเผยให้เฉพาะสมาชิกที่ลงทะเบียนเข้าร่วมสำเร็จแล้วเท่านั้น
