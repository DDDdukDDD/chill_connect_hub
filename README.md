# Chillwaa

โซเชียลแพลตฟอร์มของคนชอบออกไปใช้ชีวิต: หาเพื่อนไปด้วยผ่านตี้ มีเหตุผลให้ออกไปจากชาเลนจ์ และเก็บเรื่องราวเป็นโมเมนต์

- เว็บจริง: https://www.chillwaa.com
- Next.js 16, Supabase Postgres, Cloudflare R2 (รูปและคลิป), Vercel Pro

## เริ่มใช้งานบนเครื่อง

```bash
git pull
npm install
npm run dev     # http://localhost:3000
```

คอมเครื่องใหม่ต้องคัดลอก `.env.local` และ `.env.development.local` มาเอง เพราะไม่อยู่ใน Git

`npm run dev` ใช้ฐานข้อมูลพัฒนาจาก `.env.development.local` ส่วน `next start` และ `next build` อ่าน `.env.local` ซึ่งชี้ฐานจริง ถ้าจะทดสอบ production build ให้ส่ง `DATABASE_URL` ของฐานพัฒนาผ่าน environment ทุกครั้ง

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
| :--- | :--- |
| `npx tsc --noEmit` | ตรวจชนิดข้อมูล |
| `npm run lint` | ตรวจโค้ด |
| `npm run build` | build แบบ production |
| `npm run db:dev` | อัปเดตฐานพัฒนาให้ตรง migration (`-- --copy` คัดลอกข้อมูลจากฐานจริงมาด้วย) |
| `npm run db:migrate` | รัน migration |
| `npm run db:verify` | ตรวจสิทธิ์และความปลอดภัยของฐานข้อมูล |
| `npm run smoke` | ตรวจระบบหลักแบบเร็วบนฐานพัฒนา |
| `node db/copy-places-to-live.mjs` | ดูว่าสถานที่ที่เผยแพร่บน dev จะขึ้นเว็บจริงกี่แห่ง (`--apply` เพื่อย้ายจริง) |

## เอกสาร

**อ่านทุกครั้ง**

| ไฟล์ | อ่านเมื่อ |
| :--- | :--- |
| [AGENTS.md](AGENTS.md) | กฎการทำงาน ใครทำส่วนไหน และ branch ไหน |
| [docs/HANDOFF.md](docs/HANDOFF.md) | บันทึกการเปลี่ยนแปลงล่าสุด อ่านตอนเริ่มทุก session |
| [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) | งานที่เหลือ เรียงตามเวลาที่ต้องเสร็จ |
| [docs/TEST_REPORTS.md](docs/TEST_REPORTS.md) | ปัญหาจากผู้ทดสอบ (Antigravity) |

**อ้างอิงเมื่อแก้ส่วนนั้น**

| ไฟล์ | อ่านเมื่อ |
| :--- | :--- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ภาพรวมระบบ ชั้นต่างๆ cache ไฟล์สื่อ งานตั้งเวลา |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | กฎหน้าตาและการเขียน ต้องอ่านก่อนแก้ UI |
| [docs/PRODUCT_DIRECTION.md](docs/PRODUCT_DIRECTION.md) | ทิศทางสินค้า ก่อนตัดสินใจว่าหน้าไหนควรมีอะไร |
| [docs/API.md](docs/API.md) | สัญญาของ API แก้พร้อมกับโค้ดทุกครั้ง |
| [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) · [docs/DATABASE_REVIEW.md](docs/DATABASE_REVIEW.md) | เหตุผลการออกแบบฐานข้อมูล และผลตรวจรอบ 8 พ.ย. |
| [docs/FEED_PLAN.md](docs/FEED_PLAN.md) | ฟีด โมเมนต์ และการจัดอันดับ |
| [docs/TRACEABILITY.md](docs/TRACEABILITY.md) | log การกระทำ ใครพาใครมา (รายได้และส่วนแบ่งครีเอเตอร์) |
| [docs/TAT_IMPORT.md](docs/TAT_IMPORT.md) | สถานที่และร้านอาหารจาก ททท. และการย้ายขึ้นเว็บจริง |
| [docs/VIDEO_PLAN.md](docs/VIDEO_PLAN.md) | คลิป: สิ่งที่ทำแล้วและแนวทางต่อไป |
| [docs/EMAIL.md](docs/EMAIL.md) | อีเมล (Resend + Cloudflare) |
| [docs/IOS_APP.md](docs/IOS_APP.md) · [docs/ANDROID_APP.md](docs/ANDROID_APP.md) | แอป iPhone (Capacitor) และ Android (TWA) |

**ร่างและแผนที่ยังไม่ได้สร้าง**

| ไฟล์ | สถานะ |
| :--- | :--- |
| [docs/STORY_LANDING_PLAN.md](docs/STORY_LANDING_PLAN.md) | หน้าแรกแบบเล่าเรื่อง ออกแบบแล้ว เจ้าของยังไม่ตัดสินใจว่าจะใช้ |
| [docs/CHALLENGE_BLUEPRINT_2027.md](docs/CHALLENGE_BLUEPRINT_2027.md) | ต้นฉบับชาเลนจ์ 35 รายการตอนเปิดตัว ทำเป็นข้อมูลแล้ว (`db/content/challenges-2027.json`, BE-463) เหลือรูปปก |
| [docs/LEGAL_DRAFT.md](docs/LEGAL_DRAFT.md) | ร่างข้อตกลงและนโยบาย รอนักกฎหมาย |
| [docs/APP_STORE_LISTING.md](docs/APP_STORE_LISTING.md) · [docs/PLAY_STORE_LISTING.md](docs/PLAY_STORE_LISTING.md) | ข้อความหน้าร้านในสโตร์ |
| [docs/archive/](docs/archive/) | ประวัติเก่า ไม่ต้องอ่านประจำ |
