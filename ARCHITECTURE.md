# Chillwaa: ภาพรวมระบบ

แผนที่สั้นๆ ว่าอะไรอยู่ตรงไหน ตรงกับระบบ ณ 2026-11-03 สัญญา API อยู่ใน [docs/API.md](docs/API.md) เหตุผลการออกแบบฐานข้อมูลอยู่ใน [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)

## สินค้า

เสาหลัก 3 อย่างคือ **ตี้ + ชาเลนจ์ + โมเมนต์** ส่วน **อีเวนต์** และ **สถานที่เที่ยว** คือปลายทางที่เสาหลักพาไป (ดู [docs/PRODUCT_DIRECTION.md](docs/PRODUCT_DIRECTION.md))

| หน้า | ข้อมูล |
| :--- | :--- |
| `/community` | ตี้ (`eventType: 'community'`) |
| `/events` | อีเวนต์ (`eventType: 'public_venue'`) `/fairs` เดิม redirect มาที่นี่ |
| `/spots` | สถานที่เที่ยว (ตาราง `app.places`) |
| `/challenges` | ชาเลนจ์ (`app.quests`) |
| `/moments` | โมเมนต์ |
| `/myhub`, `/profile`, `/onboarding` | ของสมาชิก เป็น `noindex` |
| `/admin` | หลังบ้านทีมงาน |

## ชั้นของระบบ

```
เบราว์เซอร์      app/**/page.tsx, components/**  ย่อรูปก่อนส่งด้วย lib/media/compressor.ts
   │
CDN ของ Vercel  API สาธารณะส่ง s-maxage ส่วนของสมาชิกเป็น private/no-store
   │
API             app/api/**  ทุกเส้นทาง admin ผ่าน requireAdminApiAccess()
   │
Logic           lib/members, lib/moments, lib/social, lib/campaigns, lib/sponsored, lib/scrapers
   │
ที่เก็บข้อมูล     lib/db (ตี้ อีเวนต์ สถานที่ ชาเลนจ์)  ·  repository/store ของแต่ละโมดูล
   │
Supabase Postgres (สคีมา app)  ·  Vercel Blob (รูปและคลิป)
```

## ข้อมูล

- **Postgres คือข้อมูลจริง** เลือกด้วย `DATA_STORE=postgres` ([lib/db/index.ts](lib/db/index.ts)) โครงสร้างอยู่ใน `db/migrations/` การแปลงแถวอยู่ใน [lib/db/postgres/rows.mjs](lib/db/postgres/rows.mjs)
- **ไฟล์ JSON ใน `data/`** คือข้อมูลตั้งต้นและโหมดที่ไม่มีฐานข้อมูล ไม่ใช่ข้อมูลของเว็บจริง อย่าแก้เพื่อเปลี่ยนสิ่งที่เว็บแสดง
- **ฐานข้อมูล 2 ชุด** ฐานจริงอยู่ใน org `Duke` ฐานพัฒนาอยู่ใน org `Chillwaa` `next dev` ใช้ฐานพัฒนา ไฟล์อัปโหลดยังไม่ได้แยก
- **การเชื่อมต่อ** ใช้ session pooler พอร์ต 5432 เซิร์ฟเวอร์ละ 1 การเชื่อมต่อ ([lib/db/postgres/client.ts](lib/db/postgres/client.ts)) รวมหลายคำสั่งที่ต้องไปด้วยกันไว้ใน transaction เดียว
- **เว็บใช้ล็อกอิน `app_runtime`** ไม่ใช้ service role

## Cache

| ชั้น | ที่ไหน | หมดอายุ |
| :--- | :--- | :--- |
| CDN | header `s-maxage` ของ API สาธารณะ | 30-60 วินาที |
| หน่วยความจำของเซิร์ฟเวอร์ | `cacheManager` ([lib/cache/](lib/cache/)) | ประมาณ 1 นาที เขียนข้อมูลแล้วล้างทันที |
| ข้ามเซิร์ฟเวอร์ | `sharedAcrossServers` ใน [postgresAdapter.ts](lib/db/adapters/postgresAdapter.ts) ใส่ fingerprint ของตารางไว้ใน key | เปลี่ยนเมื่อตารางเปลี่ยน |

เมื่อ cache หมด ระบบถาม fingerprint ของตารางก่อน แล้วโหลดใหม่เฉพาะเมื่อข้อมูลเปลี่ยน รายการสาธารณะอ่านเฉพาะคอลัมน์ที่ต้องใช้ เพื่อลด egress ของ Supabase

## การเข้าสู่ระบบและสิทธิ์

- **สมาชิก** [lib/members/](lib/members/) รองรับ LINE, Google, Facebook และอีเมล ถือว่าบัญชีโซเชียลคือตัวตน ส่วนการยืนยันเบอร์ใช้กับการเปิดตี้ ชาเลนจ์ และทริป
- **ทีมงาน** [lib/adminSession.ts](lib/adminSession.ts) สิทธิ์อยู่ใน [lib/permissions.ts](lib/permissions.ts) เซิร์ฟเวอร์เป็นคนตัดสินเสมอ
- **ความปลอดภัยของหน้าเว็บ** CSP และ header อยู่ใน [next.config.ts](next.config.ts) ถ้าเพิ่มบริการภายนอกต้องเพิ่มโดเมนในนั้น

## ไฟล์สื่อ

อัปโหลดผ่าน `/api/upload` ส่วนคลิปส่งตรงจากเบราว์เซอร์ไป Blob (`/api/upload/video`) [lib/optimizedImage.ts](lib/optimizedImage.ts) กำหนดโดเมนรูปที่ให้ Vercel ย่อ

## นำเข้าข้อมูล

แอดมินสั่งผ่าน `/api/admin/scrape` โดยตัวอ่านแต่ละเว็บอยู่ใน [lib/scrapers/](lib/scrapers/) เก็บเฉพาะแหล่งทางการ และห้ามคัดลอกตี้จากแพลตฟอร์มคอมมูนิตี้อื่น ข้อมูลที่ดึงมาต้องผ่านคิวตรวจ

## ก่อนส่งงาน

```bash
npx tsc --noEmit
npm run lint
npm run build
```

คำสั่งทดสอบอื่นและวิธีตั้งเครื่องอยู่ใน [README.md](README.md)
