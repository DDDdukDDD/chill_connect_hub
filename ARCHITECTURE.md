# Chillwaa: ภาพรวมระบบ

แผนที่สั้นๆ ว่าอะไรอยู่ตรงไหน ตรงกับระบบ ณ 2026-11-26 สัญญา API อยู่ใน [docs/API.md](docs/API.md) เหตุผลการออกแบบฐานข้อมูลอยู่ใน [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)

## สินค้า

แก่นคือ **ออกไปใช้ชีวิตจริง** เสาหลัก 3 อย่างคือ **ตี้ + ชาเลนจ์ + โมเมนต์** ส่วน **อีเวนต์** และ **สถานที่เที่ยว** คือปลายทางที่เสาหลักพาไป (ดู [docs/PRODUCT_DIRECTION.md](docs/PRODUCT_DIRECTION.md))

| หน้า | ข้อมูล |
| :--- | :--- |
| `/` | คนที่ยังไม่ล็อกอิน: หน้าแรก · สมาชิก: ฟีด 3 โหมด สำหรับคุณ · ค้นพบ · ติดตาม (BE-476) |
| `/this-week` | กิจกรรม: รวมตี้ อีเวนต์ และสถานที่ |
| `/community` | ตี้ (`eventType: 'community'`) |
| `/events` | อีเวนต์ (`eventType: 'public_venue'`) `/fairs` เดิม redirect มาที่นี่ |
| `/spots` | สถานที่เที่ยว (ตาราง `app.places`) |
| `/challenges` | ชาเลนจ์ (`app.quests`) |
| `/moments` | ตารางโมเมนต์สาธารณะ สำหรับคนที่ยังไม่ล็อกอินและเครื่องมือค้นหา สมาชิกเห็นชุดเดียวกันในโหมด "ค้นพบ" ของหน้าหลัก |
| `/myhub`, `/profile`, `/onboarding` | ของสมาชิก เป็น `noindex` |
| `/admin` | หลังบ้านทีมงาน หน้า "วิธีคิดของระบบ" อธิบายกฎสำคัญพร้อมตัวเลขจากโค้ด |

เมนู: บนมือถือและ iPad (ต่ำกว่า xl) สมาชิกมีแถบล่าง `หน้าหลัก | กิจกรรม | ＋ | ชาเลนจ์ | มายฮับ` คนที่ยังไม่ล็อกอินมี `หน้าหลัก · กิจกรรม · โมเมนต์ · ชาเลนจ์` บนคอมเมนูอยู่ด้านบน

## ชั้นของระบบ

```
เบราว์เซอร์      app/**/page.tsx, components/**  ย่อรูปก่อนส่งด้วย lib/media/compressor.ts
   │
CDN ของ Vercel  หน้ารายละเอียดสาธารณะ (revalidate 60–600 วินาที, BE-472) และ API สาธารณะ (s-maxage)
                ส่วนของสมาชิกเป็น private/no-store (CDN ไม่ดู cookie)
   │
API             app/api/**  ทุกเส้นทาง admin ผ่าน requireAdminApiAccess()
   │
Logic           lib/members, lib/moments, lib/social, lib/campaigns, lib/sponsored, lib/scrapers, lib/media
   │
ที่เก็บข้อมูล     lib/db (ตี้ อีเวนต์ สถานที่ ชาเลนจ์)  ·  repository/store ของแต่ละโมดูล
   │
Supabase Postgres (สคีมา app)  ·  Cloudflare R2 (รูปและคลิป ผ่าน media.chillwaa.com)
```

## ข้อมูล

- **Postgres คือข้อมูลจริง** เลือกด้วย `DATA_STORE=postgres` ([lib/db/index.ts](lib/db/index.ts)) โครงสร้างอยู่ใน `db/migrations/` การแปลงแถวอยู่ใน [lib/db/postgres/rows.mjs](lib/db/postgres/rows.mjs)
- **ไฟล์ JSON ใน `data/`** คือข้อมูลตั้งต้นและโหมดที่ไม่มีฐานข้อมูล ไม่ใช่ข้อมูลของเว็บจริง อย่าแก้เพื่อเปลี่ยนสิ่งที่เว็บแสดง
- **ฐานข้อมูล 2 ชุด** ฐานจริงอยู่ใน org `Duke` (แผนฟรี ดู egress ทุกวัน, LAUNCH_CHECKLIST หมวด 2) ฐานพัฒนาอยู่ใน org `Chillwaa` `next dev` ใช้ฐานพัฒนา migration บนฐานจริงเจ้าของเป็นคนรัน
- **สถานที่จาก dev ขึ้นเว็บจริง** ด้วย `node db/copy-places-to-live.mjs` (ดูก่อน แล้ว `--apply`) ย้ายเฉพาะที่เผยแพร่บน dev ([docs/TAT_IMPORT.md](docs/TAT_IMPORT.md))
- **การเชื่อมต่อ** ใช้ session pooler พอร์ต 5432 เซิร์ฟเวอร์ละ 1 การเชื่อมต่อ ([lib/db/postgres/client.ts](lib/db/postgres/client.ts)) รวมหลายคำสั่งที่ต้องไปด้วยกันไว้ใน transaction เดียว
- **เว็บใช้ล็อกอิน `app_runtime`** ไม่ใช้ service role

## Cache

| ชั้น | ที่ไหน | หมดอายุ |
| :--- | :--- | :--- |
| CDN หน้า | `export const revalidate` ในหน้ารายละเอียดสาธารณะ | ตี้ 60 วินาที · อีเวนต์และชาเลนจ์ 5 นาที · สถานที่ 10 นาที |
| CDN API | header `s-maxage` ของ API สาธารณะ | 30-60 วินาที |
| หน่วยความจำของเซิร์ฟเวอร์ | `cacheManager` ([lib/cache/](lib/cache/)) | ประมาณ 1 นาที เขียนข้อมูลแล้วล้างทันที |
| ข้ามเซิร์ฟเวอร์ | `sharedAcrossServers` ใน [postgresAdapter.ts](lib/db/adapters/postgresAdapter.ts) ใส่ fingerprint ของตารางไว้ใน key | เปลี่ยนเมื่อตารางเปลี่ยน |

เมื่อ cache หมด ระบบถาม fingerprint ของตารางก่อน แล้วโหลดใหม่เฉพาะเมื่อข้อมูลเปลี่ยน การเขียน `app.places` ทุกครั้งทำให้ทุกเซิร์ฟเวอร์อ่านทั้งตารางใหม่ (~8 MB) จึงควรเขียนหลายแถวใน transaction เดียว

## การเข้าสู่ระบบและสิทธิ์

- **สมาชิก** [lib/members/](lib/members/) รองรับ LINE, Google, Facebook และอีเมล ถือว่าบัญชีโซเชียลคือตัวตน การเปิดตี้ ชาเลนจ์ และทริปต้องยืนยันอีเมลก่อน (`organizerNeeds` ใน [lib/members/trust.ts](lib/members/trust.ts); ยังไม่มี SMS ตอนเปิดตัว, BE-468)
- **ทีมงาน** [lib/adminSession.ts](lib/adminSession.ts) สิทธิ์อยู่ใน [lib/permissions.ts](lib/permissions.ts) เซิร์ฟเวอร์เป็นคนตัดสินเสมอ
- **ความปลอดภัยของหน้าเว็บ** CSP และ header อยู่ใน [next.config.ts](next.config.ts) ถ้าเพิ่มบริการภายนอกต้องเพิ่มโดเมนในนั้น

## ไฟล์สื่อ

รูปอัปโหลดผ่าน `/api/upload` ส่วนคลิปส่งตรงจากเบราว์เซอร์ไป R2 ด้วยลิงก์ที่เซิร์ฟเวอร์เซ็นให้ (`/api/upload/video`) ทั้งหมดเก็บที่ R2 ([lib/media/r2.ts](lib/media/r2.ts)) เว็บจริงใช้ `media.chillwaa.com` dev ใช้ `media-dev.chillwaa.com` รูปสถานที่จาก Wikimedia และ ททท. ถูกคัดลอกเข้า R2 ทุก 3 ชั่วโมง ([lib/media/placePhotoBackfill.ts](lib/media/placePhotoBackfill.ts)) [lib/optimizedImage.ts](lib/optimizedImage.ts) กำหนดโดเมนรูปที่ให้ Vercel ย่อ

## งานตั้งเวลา

- **Vercel Cron** (`vercel.json`): `/api/cron/hourly` ทุกชั่วโมง และ `/api/cron/weekly` ทุกสัปดาห์ (BE-471)
- **GitHub Actions**: คัดลอกรูปสถานที่ทุก 3 ชั่วโมง (`place-photos.yml` ใช้ CPU มาก จึงไม่รันบน Vercel), CodeQL และ build แอป iPhone ส่วน `hourly-jobs.yml` กับ `weekly-jobs.yml` เหลือไว้กดรันเอง

## นำเข้าข้อมูล

แอดมินสั่งผ่าน `/api/admin/scrape` และสคริปต์ใน `db/` และ `scripts/` ตัวอ่านแต่ละแหล่งอยู่ใน [lib/scrapers/](lib/scrapers/) เก็บเฉพาะแหล่งทางการ และห้ามคัดลอกตี้จากแพลตฟอร์มคอมมูนิตี้อื่น ข้อมูลที่ดึงมาเข้า dev เป็นร่างก่อน ทีมงานเผยแพร่แล้วค่อยย้ายขึ้นเว็บจริง สถานที่ที่สมาชิกแจ้ง "ที่นี่ปิดแล้ว" ครบ 2 คนถูกซ่อนเอง (BE-477)

## ก่อนส่งงาน

```bash
npx tsc --noEmit
npm run lint
npm run build
```

คำสั่งทดสอบอื่นและวิธีตั้งเครื่องอยู่ใน [README.md](README.md)
