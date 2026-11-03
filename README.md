# Chillwaa

โซเชียลแพลตฟอร์มของคนชอบออกไปใช้ชีวิต: หาเพื่อนไปด้วยผ่านตี้ มีเหตุผลให้ออกไปจากชาเลนจ์ และเก็บเรื่องราวเป็นโมเมนต์

- เว็บจริงตอนนี้: https://chillwaa.vercel.app (โดเมน www.chillwaa.com ยังไม่ได้ต่อ)
- Next.js 16, Supabase Postgres, Vercel Blob

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

## เอกสาร

| ไฟล์ | อ่านเมื่อ |
| :--- | :--- |
| [AGENTS.md](AGENTS.md) | กฎการทำงาน ใครทำส่วนไหน และ branch ไหน |
| [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) | งานที่เหลือก่อนเปิดจริง |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ภาพรวมระบบ |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | กฎหน้าตาและการเขียน ต้องอ่านก่อนแก้ UI |
| [docs/PRODUCT_DIRECTION.md](docs/PRODUCT_DIRECTION.md) | ทิศทางสินค้า ก่อนตัดสินใจว่าหน้าไหนควรมีอะไร |
| [docs/API.md](docs/API.md) | สัญญาของ API |
| [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | เหตุผลการออกแบบฐานข้อมูล |
| [docs/HANDOFF.md](docs/HANDOFF.md) | บันทึกการเปลี่ยนแปลงล่าสุด |
| [docs/TEST_REPORTS.md](docs/TEST_REPORTS.md) | ปัญหาจากผู้ทดสอบ |
| [docs/archive/](docs/archive/) | ประวัติเก่า ไม่ต้องอ่านประจำ |
