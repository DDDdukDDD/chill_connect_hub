# Test reports: confirmed fixed

Moved out of [../TEST_REPORTS.md](../TEST_REPORTS.md). Never deleted; add new ones at the end.

### TR-001 · `/rewards`: คำว่า "ร้านพาร์ทเนอร์" ตัดคำกลางคำและซ้อนทับกราฟิก `WalletConfetti` บนหน้าจอ 360px
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `645c464`), 2026-11-05
- **Page and screen:** `/rewards`, 360x800, Chrome
- **Steps:**
  1. เปิดหน้า `/rewards` ในสถานะยังไม่เข้าสู่ระบบ (Guest) ที่ความกว้างหน้าจอ `360px`
  2. ดูข้อความในการ์ด `XP ของคุณ` (`app/rewards/RewardsView.tsx`)
- **Expected:** ข้อความ `"ออกไปเจอเพื่อนใหม่ ได้ XP มาแลกของจริงจากร้านพาร์ทเนอร์"` ไม่ตัดคำกลางคำ (`DESIGN_SYSTEM.md` หัวข้อ 6) และไม่ซ้อนทับกับกราฟิก `WalletConfetti` มุมขวาบน
- **Actual:** คำว่า `"จากร้านพาร์ทเนอร์"` ถูกตัดบรรทัดเป็น `"จากร้า"` แล้วขึ้นบรรทัดใหม่เป็น `"นพาร์ทเนอร์"` และตัวอักษร `"จากร้า"` ทับกับจุดสีของ `<WalletConfetti />`
- **Evidence:** `app/rewards/RewardsView.tsx` (บรรทัด 207 และ `WalletConfetti` บรรทัด 549–559)
- **Status:** Confirmed fixed
- **Fix:** 13f8949 แบ่งวลีไม่ให้ตัดกลางคำ และย่อ confetti บนจอเล็ก

### TR-002 · `/events`: รูปอีเวนต์ที่ลิงก์ต้นทางเสีย (HTTP 404) แสดงไอคอนรูปแตกแทนที่จะใช้รูปสำรอง (`PosterPhoto`)
- **Severity:** Medium
- **Tested on:** `tester` branch (`645c464`), 2026-11-05 (re-tested on `3745704`, 2026-11-06)
- **Page and screen:** `/events`, 360x800 และ 1280x800, Chrome
- **Steps:**
  1. เปิดหน้า `/events` ในมุมมองการ์ด (Grid view)
  2. ดูการ์ดอีเวนต์ที่ URL รูปภาพภายนอกตอบกลับ HTTP 404 (เช่น `https://www.thaiticketmajor.com/img_poster/prefix_1/0912/6912/one-fight-night-49-6abf6cd60c539-l.png`)
- **Expected:** เมื่อโหลดรูปไม่สำเร็จต้องเปลี่ยนเป็นรูปหมวดหมู่หรือรูปสำรองตาม `DESIGN_SYSTEM.md` หัวข้อ 14.2 ("An item without a good photo uses the pillar's category image, never a broken or empty box") เหมือนใน `components/discover/EventDateList.tsx`
- **Actual:** `components/PosterPhoto.tsx` (ที่ใช้ใน `FairTile.tsx` และ `MeetupTile.tsx`) ไม่มี `onError` fallback ทำให้ `<img>` แสดงไอคอนรูปแตกบนพื้นสีเทา (`naturalWidth === 0`)
- **Evidence:** `components/PosterPhoto.tsx` (บรรทัด 40–51) และ `components/FairTile.tsx` (บรรทัด 104)
  - **Re-test (2026-11-06 on `3745704`):** รูปที่เพิ่งโหลดหลังเลื่อนหน้าจอเปลี่ยนเป็น `PHOTO_STAND_IN` แล้ว แต่การ์ดชุดแรกที่อยู่ใน SSR HTML ของ `/events` (เช่น `/events/live-agg-50cd344c700e3fcf18fe` รูป `one-fight-night-49-6abf6cd60c539-l.png` และ `/events/live-agg-15c758f2787260a944cd` รูป `one-lumpinee-178-6ab4b8f1c402f-l.jpg`) โหลดล้มเหลว (HTTP 404) เสร็จก่อนที่ React จะ hydrate ทำให้ `onError` ไม่ถูกเรียก และใน `useEffect` (`components/PosterPhoto.tsx` บรรทัด 37–40) เช็กแค่ `if (ref.current?.complete) measure(ref.current)` ซึ่งทำเฉพาะกรณี `img.naturalWidth > 0` แต่ไม่ได้เรียก `setFailedSrc(src)` เมื่อ `ref.current.complete && ref.current.naturalWidth === 0` ทำให้ 2 การ์ดนี้ยังแสดงไอคอนรูปแตก (`naturalWidth === 0`)
- **Status:** Confirmed fixed
- **Fix:** 13f8949 PosterPhoto และ MeetupTile ใช้รูปสำรองเมื่อโหลดรูปไม่ได้ ตรวจแล้วโดยบังคับลิงก์เสียบน /events · c9fee5a (BE-289) รูปใน SSR ที่โหลดไม่ได้ก่อน hydrate: `useEffect` เช็ก `complete && naturalWidth === 0` แล้วเปลี่ยนเป็นรูปสำรอง · BE-390 ใช้วิธีเดียวกันกับรูปที่เหลือ (`components/FallbackImg.tsx`: EventDateList, แถวอีเวนต์หน้าแรก, ตี้แนะนำใน My Hub)

### TR-003 · `/moments` และ `/moments/[id]`: ชื่อผู้โพสต์แสดงชื่อบัญชีภาษาอังกฤษในวงเล็บต่อท้ายชื่อไทย เช่น `คุณกี้ (Kee_Explorer)`
- **Severity:** Low
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/moments` และ `/moments/sample-post-spot-1`, 360x800 และ 1280x800, Chrome
- **Steps:**
  1. เปิดหน้า `/moments` หรือหน้ารายละเอียด `/moments/sample-post-spot-1`
  2. ดูชื่อผู้โพสต์บนหัวการ์ดแต่ละใบและในหน้ารายละเอียด
- **Expected:** แสดงเฉพาะชื่อสมาชิก เช่น `คุณกี้`, `คุณมินท์` เหมือนหน้าแรก (`/`) และตามกฎ `DESIGN_SYSTEM.md` หัวข้อ 6 และ 11 ที่ไม่ให้ใส่วงเล็บภาษาอังกฤษต่อท้ายภาษาไทย
- **Actual:** แสดงชื่อพร้อมชื่อบัญชีภาษาอังกฤษในวงเล็บ เช่น `คุณกี้ (Kee_Explorer)`, `คุณมินท์ (Mint_Vibes)` ทำให้บรรทัดชื่อบนการ์ด 2 คอลัมน์ที่ความกว้าง `360px` แน่นและยาวเกินจำเป็น
- **Evidence:** หน้า `/moments` และ `/moments/sample-post-spot-1`
- **Status:** Confirmed fixed
- **Fix:** 13f8949 ตัดวงเล็บออกตอนแสดงผล เฉพาะบัญชีและโพสต์ตัวอย่าง (withoutSampleHandle) รวมกับ TR-007 · BE-390 หน้าโปรไฟล์ของบัญชีตัวอย่างด้วย (publicProfileOf)

### TR-004 · `/community`, `/events`, `/challenges`: สลับเป็นมุมมอง "รายการ" บนมือถือ 360px แล้วครึ่งบนของหน้าจอยังคงแสดงเป็นการ์ดรูปขนาดใหญ่
- **Severity:** Medium
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/community`, `/events`, `/challenges`, 360x800, Chrome
- **Steps:**
  1. เปิดหน้า `/community` (หรือ `/events`, `/challenges`) ที่ความกว้าง `360x800`
  2. กดปุ่มสลับมุมมองจาก `การ์ด` เป็น `รายการ` (`ViewModeToggle`)
- **Expected:** ผู้ใช้เห็นรายการใต้แถบหมวดหมู่เปลี่ยนเป็นแถวรายการ (List rows) ทันทีเมื่อกดปุ่ม `รายการ`
- **Actual:** โหมด `รายการ` ใน `components/discover/EventDateList.tsx` แสดงแถบการ์ดรูปขนาดใหญ่ (`สัปดาห์นี้` / `กำลังจัดอยู่ตอนนี้`) คั่นไว้ด้านบนสุดก่อนถึงรายการแบบแถว ซึ่งบนหน้าจอ `360x800` แถบการ์ดนี้กินพื้นที่เต็มหน้าจอพอดี ทำให้เมื่อกดสลับระหว่าง `การ์ด` กับ `รายการ` ผู้ใช้ไม่เห็นความเปลี่ยนแปลงบนหน้าจอจนกว่าจะเลื่อนลงไปด้านล่าง
- **Evidence:** `components/discover/EventDateList.tsx` (บรรทัด 193–208) และ `app/community/CommunityListView.tsx` (บรรทัด 459–461)
- **Status:** Confirmed fixed
- **Fix:** 13f8949 มุมมองรายการเป็นแถวตั้งแต่บนสุด ทั้ง /community, /events และ /challenges (เริ่มเร็วๆ นี้ แสดง 3 แถวแรก)

### TR-005 · `SpotBuddyGatheringModal`: ใช้ native `<input type="date">` / `<input type="time">`, มีปุ่มสีน้ำเงินหลักซ้ำกัน, ผสมสีเขียวกับน้ำเงิน และไม่มี `htmlFor` ผูกกับช่องกรอก 17 ช่อง
- **Severity:** Medium
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/events/live-agg-84` และ `/spots/[id]`, 360x800 และ 1280x800, Chrome
- **Steps:**
  1. เข้าสู่ระบบด้วยบัญชีที่ผ่านเกณฑ์สร้างกิจกรรม แล้วเปิดหน้า `/events/live-agg-84` (กด `ตั้งกลุ่มเดินงาน`) หรือ `/spots/[id]` ที่เปิด `meetupAllowed` (กด `ชวนเพื่อนไปที่นี่`)
  2. ดูช่องกรอกวันที่/เวลา ปุ่มกด ชิปที่เลือก และข้อความด้านล่างของ `SpotBuddyGatheringModal`
- **Expected:**
  - ช่องวันที่และเวลาใช้ `DateInput` (`วว/ดด/ปปปป`) และ `TimeInput` (24 ชม.) เหมือน `CreateEventModal` และ `EditTeeDialog` (ไม่แสดง `MM/DD/YYYY` หรือ `AM/PM`)
  - ทุก `<input>` และ `<select>` มี `<label htmlFor="...">` หรือ `aria-label` (`DESIGN_SYSTEM.md` หัวข้อ 8)
  - มีปุ่มสีน้ำเงินหลัก (`bg-[#2563EB]`) เพียง 1 ปุ่มต่อหน้าต่าง ชิปที่เลือกใช้พื้นหลังอ่อน `border-[#2563EB] ring-1 ring-[#2563EB] bg-blue-50 text-[#1D4ED8]` (`DESIGN_SYSTEM.md` หัวข้อ 4, 5, 14.8) และไม่ผสมสีเขียวกับน้ำเงินในองค์ประกอบเดียวกัน
- **Actual:**
  - ช่อง `วันที่นัดหมาย` และ `ช่วงเวลาของตี้` ใช้ native `<input type="date">` และ `<input type="time">` (บรรทัด 501–537) แสดงผลเป็น `11/06/2026` (`MM/DD/YYYY`) และ `01:30 PM`
  - มี `<input>` และ `<select>` 17 ช่องในฟอร์มที่ไม่มี `id` ผูกกับ `<label htmlFor>` หรือ `aria-label`
  - มีปุ่ม/ชิปสีน้ำเงินทึบ `bg-[#2563EB] text-white` ซ้ำกันในหน้าต่างเดียว (ปุ่ม `เพิ่ม` บรรทัด 810, ชิปช่วงอายุที่เลือก บรรทัด 889, และปุ่มส่งฟอร์ม `เปิดวงชวนเพื่อนเลย` บรรทัด 969) และผสมพื้นหลังสีเขียวกับตัวหนังสือสีน้ำเงิน (`bg-emerald-50 border-emerald-200 text-[#2563EB]`, `bg-emerald-100 text-[#1D4ED8]`) ในชิปสิ่งของและกำหนดการ (บรรทัด 644, 654, 700, 760)
  - บนหน้าจอ `360x800` ข้อความ `"คนที่เข้าร่วมคุยกับคุณได้ใน "แชตกลุ่ม" ของทริปนี้..."` (บรรทัด 926) ตัดคำว่า `"ทริปนี้"` ขาดกลางคำ (`ของทริ` / `ปนี้`)
- **Evidence:** `components/SpotBuddyGatheringModal.tsx` (บรรทัด 476–975) (Re-test: ทดสอบกดส่งฟอร์มจริงทั้งโหมดงานอีเวนต์ `/events/live-agg-84` และโหมดสถานที่ `/spots/spot-bkk-1` สำเร็จ ปิดหน้าต่างและแสดง Toast ยืนยันถูกต้อง)
- **Status:** Confirmed fixed
- **Fix:** 13f8949 ใช้ DateInput/TimeInput ทุกช่องมีชื่อ ปุ่มหลักเหลือ 1 ปุ่ม ไม่ผสมเขียวกับน้ำเงิน ยังไม่ได้ส่งฟอร์มจริงรอบนี้ ช่วยลองส่งจนสำเร็จด้วย

### TR-006 · `OrganizerGateDialog`: ข้อความอธิบายใต้หัวข้อ `ยืนยันเบอร์โทรก่อนนะ` ยาวเกินความกว้างกล่องและเยื้องขวาบนหน้าจอ 360px
- **Severity:** Low
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/events/live-agg-84`, 360x800, Chrome
- **Steps:**
  1. เปิดหน้าจอขนาด `360x800` เข้าสู่ระบบด้วยบัญชีที่ยังไม่ได้ยืนยันเบอร์โทร (`need === 'phone'`)
  2. กดปุ่ม `ตั้งกลุ่มเดินงาน` ในหน้า `/events/live-agg-84` เพื่อเปิด `OrganizerGateDialog` (`ยืนยันเบอร์โทรก่อนนะ`)
- **Expected:** ข้อความอธิบายใต้หัวข้อจัดกึ่งกลาง (`text-center`) พอดีภายในกรอบหน้าต่าง ไม่ล้นขอบขวา
- **Actual:** `DialogShell` ใส่ `px-8` ซ้อนใน `p-5` ทำให้พื้นที่ข้อความเหลือความกว้างเพียง `224px` บนหน้าจอ `360px` ขณะที่วลีแรก `'คนที่ชวนเพื่อนออกไปเจอกันต้องยืนยันเบอร์โทร'` ยาวติดกัน 42 ตัวอักษรโดยไม่มีเว้นวรรค เมื่อถูกห่อด้วย `<PhraseText>` (`<span className="whitespace-nowrap">`) จึงกว้างเกิน `224px` และล้นทะลุขอบขวา ทำให้บรรทัดแรกเยื้องไปทางขวาอย่างชัดเจน
- **Evidence:** `components/auth/OrganizerGateDialog.tsx` (บรรทัด 17), `components/auth/DialogShell.tsx` (บรรทัด 119–128) และ `components/auth/PhraseText.tsx` (บรรทัด 24)
- **Status:** Confirmed fixed
- **Fix:** 13f8949 เว้นวรรคในข้อความ และลดระยะขอบบนจอเล็ก

### TR-007 · `data/members.json`: ชื่อสมาชิกตัวอย่างทั้ง 18 บัญชียังมีชื่อภาษาอังกฤษในวงเล็บต่อท้าย เช่น `คุณกี้ (Kee_Explorer)` ทำให้คำทักทายหน้าแรกและหัวข้อ `/myhub` ถูกตัดคำ
- **Severity:** Low
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/`, `/myhub`, `/u/mem_sample_kee_explorer`, 360x800 และ 1280x800, Chrome
- **Steps:**
  1. เข้าสู่ระบบด้วยบัญชีตัวอย่าง (เช่น `mem_sample_kee_explorer`) แล้วเปิดหน้าแรก (`/`) และหน้า `/myhub`
  2. ดูคำทักทายบนหน้าแรกและหัวข้อ `มายฮับของ ...` ในคอลัมน์ซ้ายของ `/myhub`
- **Expected:** แสดงเฉพาะชื่อภาษาไทย เช่น `สวัสดี คุณกี้` และ `มายฮับของ คุณกี้` ตาม `DESIGN_SYSTEM.md` หัวข้อ 6 และ 11 โดยไม่ถูกตัดเป็น `...`
- **Actual:** `data/members.json` และ `scripts/seedSampleMembers.mjs` เก็บ `displayName` เป็นรูปแบบ `"คุณกี้ (Kee_Explorer)"` ทั้ง 18 บัญชี ทำให้หน้าแรกแสดง `สวัสดี คุณกี้ (Kee_Explorer)` และหัวข้อใน `/myhub` บน Desktop (`1280x800`) ถูกตัดเป็น `มายฮับของ คุณกี้ (Kee_Explo...` (ต่อเนื่องจาก `TR-003`)
- **Evidence:** `data/members.json` (บรรทัด 4, 55, 106 ฯลฯ), `scripts/seedSampleMembers.mjs` และ `app/myhub/page.tsx`
- **Status:** Confirmed fixed
- **Fix:** 13f8949 แก้ที่การแสดงผลใน commit เดียวกับ TR-003 ไม่แก้ data/members.json เพราะไฟล์นี้ไม่อยู่ใน git และข้อมูลจริงอยู่ใน Postgres

### TR-008 · เงื่อนไขตี้หมวด `bars_nightlife` (อายุ 20+ ปี, `BE-261`) ไม่ได้ดักแจ้งล่วงหน้าในหน้าต่าง `ยืนยันการลงทะเบียน` และในขั้นที่ 1 ของ `CreateEventModal`
- **Severity:** Low
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/community/[id]` และ `CreateEventModal`, 360x800 และ 1280x800, Chrome
- **Steps:**
  1. เข้าสู่ระบบด้วยสมาชิกที่ยังไม่ได้ระบุปีเกิด (`birthYear`) หรืออายุต่ำกว่า 20 ปี
  2. กรณีเข้าร่วมตี้หมวด `bars_nightlife`: กด `ลงทะเบียนเข้าร่วม` จะพบว่าหน้าต่าง `ยืนยันการลงทะเบียน` เปิดให้กดปุ่ม `ยืนยันการเข้าร่วม` ได้ตามปกติ แต่พอกดแล้วหน้าต่างปิดลงพร้อม Toast แจ้งเตือนสั้นๆ โดยไม่มีลิงก์พาไปหน้าตั้งค่าโปรไฟล์
  3. กรณีสร้างตี้: เปิด `CreateEventModal` เลือกหมวด `บาร์ & ไนท์ไลฟ์` ในขั้นที่ 1 ระบบยอมให้กรอกข้อมูลครบทั้ง 4 ขั้นตอน แล้วจึงปฏิเสธตอนกดส่งในขั้นสุดท้าย
- **Expected:** แจ้งเงื่อนไขและบล็อกปุ่มยืนยันตั้งแต่ในหน้าต่าง `ยืนยันการลงทะเบียน` (พร้อมปุ่มลิงก์ไปกรอกปีเกิดที่ `/profile/settings` เหมือน `JoinReadinessNotice`) และดักแจ้งทันทีเมื่อเลือกหมวด `บาร์ & ไนท์ไลฟ์` ในขั้นที่ 1 ของ `CreateEventModal`
- **Actual:** การตรวจสอบ `nightlifeAgeBlock` ทำงานเฉพาะฝั่ง API ตอนกดส่งคำขอเท่านั้น ยังไม่มีการดักล่วงหน้าใน `JoinReadinessNotice` และ `CreateEventModal`
- **Evidence:** `components/JoinReadinessNotice.tsx` (บรรทัด 14–19), `app/community/[id]/CommunityDetailView.tsx` (บรรทัด 1142–1161) และ `components/CreateEventModal.tsx` (บรรทัด 211–220) (Re-test: ทดสอบทั้งหน้าต่างยืนยันเข้าตี้หมวด `bars_nightlife` กรณีไม่มี `birthYear` แสดงปุ่ม `ไปบอกปีเกิด` ไป `/onboarding?returnTo=...` และกรณีอายุต่ำกว่า 20 ปี บล็อกปุ่ม `ยืนยันการเข้าร่วม` รวมถึงขั้นที่ 1 ของ `CreateEventModal` ทำงานถูกต้องครบถ้วน)
- **Status:** Confirmed fixed
- **Fix:** 13f8949 แจ้งตั้งแต่หน้าต่างยืนยันและขั้นที่ 1 ของฟอร์ม กฎอายุไม่เปลี่ยน ตรวจฟอร์มสร้างในเบราว์เซอร์แล้ว แต่หน้าต่างเข้าร่วมตรวจจากโค้ดเท่านั้น เพราะฐานพัฒนาไม่มีตี้หมวดบาร์ ช่วยทดสอบจุดนี้ด้วย ลิงก์ไปกรอกปีเกิดพาไป /onboarding เพราะ /profile/settings ไม่มีช่องนี้

### TR-009 · `/events/[id]` และ `/community/[id]`: ชื่อ title fallback ซ้ำคำว่า `'อีเวนต์และอีเวนต์'` และหน้าต่างยืนยันเข้าตี้ยังมีคำภาษาอังกฤษ `'QR E-Ticket'` / `'MyHub'` / `'Verified Community Host'`
- **Severity:** Low
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/events/[id]` และ `/community/11`, 360x800 และ 1280x800, Chrome
- **Steps:**
  1. ดู `generateMetadata` ใน `app/events/[id]/page.tsx` บรรทัดที่ 13
  2. เปิดหน้า `/community/11` กด `ลงทะเบียนเข้าร่วม` แล้วดูข้อความในหน้าต่าง `ยืนยันการลงทะเบียน` (`app/community/[id]/CommunityDetailView.tsx` บรรทัด 1124 และ 1136)
- **Expected:** Fallback title ใน `app/events/[id]/page.tsx` เป็น `'อีเวนต์'` และข้อความในหน้าต่างยืนยันการลงทะเบียนใช้ภาษาไทยตาม `DESIGN_SYSTEM.md` หัวข้อ 6 (เช่น `'บัตรเข้างาน (QR)'`, `'มายฮับ'`, `'ผู้จัดตี้'`)
- **Actual:** `app/events/[id]/page.tsx` บรรทัด 13 คืนค่า `{ title: 'อีเวนต์และอีเวนต์' }` และ `app/community/[id]/CommunityDetailView.tsx` บรรทัด 1124 และ 1136 แสดง `'Verified Community Host'`, `'QR E-Ticket'`, และ `'MyHub'`
- **Evidence:** `app/events/[id]/page.tsx` (บรรทัด 13) และ `app/community/[id]/CommunityDetailView.tsx` (บรรทัด 1124, 1136)
- **Status:** Confirmed fixed
- **Fix:** 13f8949 แก้ title และเปลี่ยนเป็นภาษาไทย รวมคำว่า MyHub ใน FairDetailView

### TR-010 · `/` และ `CommentThread`: กดชื่อผู้โพสต์และรูป/ชื่อคนคอมเมนต์เพื่อเข้าโปรไฟล์ไม่ได้
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (ฟีดสมาชิก) และทุกหน้าที่มี `CommentThread`, 390x844 และ 1280x800
- **Steps:**
  1. เข้าสู่ระบบแล้วเปิดหน้าหลัก `/` (ฟีดโมเมนต์)
  2. ลองกดที่ชื่อผู้โพสต์บนหัวโพสต์ และชื่อผู้โพสต์หน้าแคปชัน
  3. เปิดคอมเมนต์ของโพสต์ แล้วลองกดที่รูป Avatar หรือชื่อของคนคอมเมนต์
- **Expected:** กดชื่อผู้โพสต์ (ทั้งบนหัวโพสต์และหน้าแคปชัน) รวมถึงรูปและชื่อคนคอมเมนต์ (เมื่อมี `authorId`) ต้องพาไปหน้าโปรไฟล์ `/profile?id=...` เหมือนหน้า `/moments/[id]` (`MomentDetailView.tsx`)
- **Actual:** บนฟีดหลัก ลิงก์ `/profile?id=...` ครอบเฉพาะรูป Avatar บนหัวโพสต์ ส่วนชื่อผู้โพสต์ (`moment.userName`) เป็น `<span>` / `<strong>` ธรรมดา และใน `CommentThread` ทั้ง `<MomentAvatar>` และชื่อคนคอมเมนต์ยังไม่ได้ครอบด้วย `<Link>` แม้มี `comment.authorId` ส่งมาแล้ว
- **Evidence:** `components/home/HomeMomentFeed.tsx` (บรรทัด 188–197, 351) และ `components/moments/CommentThread.tsx` (บรรทัด 120–125)
- **Status:** Confirmed fixed
- **Fix:** `b333c13` (BE-425): ชื่อผู้โพสต์บนหัวโพสต์และหน้าแคปชันเป็นลิงก์ไปโปรไฟล์ รูปและชื่อคนคอมเมนต์ก็เป็นลิงก์เมื่อมี `authorId` (คอมเมนต์ตัวอย่างไม่มี จึงยังเป็นข้อความธรรมดา) ฐานข้อมูล dev ไม่มีคอมเมนต์จากสมาชิกจริง ช่วยลองคอมเมนต์ด้วยบัญชีทดสอบแล้วกดชื่อ

### TR-011 · `MomentComposer`: ปุ่มปิด (`X`) มุมขวาบนข้ามการเตือน `confirmDiscard` ทำให้รูปและข้อความที่พิมพ์ค้างไว้หายทันที
- **Severity:** High
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (หน้าต่าง `แชร์โมเมนต์`), 390x844 และ 1280x800
- **Steps:**
  1. กดเปิดหน้าต่าง `แชร์โมเมนต์` จากหน้าหลัก `/`
  2. เลือกรูปหรือพิมพ์ข้อความค้างไว้ (`hasDraft === true`)
  3. กดปุ่มปิด (`X`) มุมขวาบนของหน้าต่าง
- **Expected:** ระบบต้องเรียก `leave()` เพื่อเปิดหน้าต่างยืนยัน `ทิ้งโพสต์` (`confirmDiscard`) เหมือนตอนกดปุ่ม `Esc` เพื่อกันผู้ใช้เผลอทำข้อมูลที่พิมพ์/เลือกรูปไว้หาย
- **Actual:** ปุ่มปิด `aria-label="ปิด"` เรียก `onClose` โดยตรงแทน `leave` ทำให้หน้าต่างปิดทันทีและข้อมูล draft หายทั้งหมดโดยไม่ถามยืนยัน
- **Evidence:** `components/moments/MomentComposer.tsx` (บรรทัด 164 ประกาศ `leave` และบรรทัด 443 ผูก `onClick={onClose}`)
- **Status:** Confirmed fixed
- **Fix:** `b333c13` (BE-425): ปุ่ม X เรียก `leave()` แล้ว ถ้ามีร่างจะถาม "ทิ้งโพสต์" เหมือนกด Esc

### TR-014 · `/` และ `MobileNav`: แถบ "โมเมนต์ใหม่" ทำงานเฉพาะแท็บ `ล่าสุด` และแตะแท็บ "หน้าหลัก" ซ้ำยังไม่เลื่อนขึ้นบนสุดพร้อมรีเฟรช
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (ฟีดสมาชิก) และ `MobileNav`, 390x844 และ 1280x800
- **Steps:**
  1. เปิดฟีดหน้าหลัก `/` บนแท็บเริ่มต้น `สำหรับคุณ` (`foryou`) หรือแท็บ `ติดตาม` (`following`) แล้วรอให้มีโพสต์ใหม่เข้ามา
  2. บนมือถือ เลื่อนฟีดลงไปด้านล่างแล้วแตะปุ่ม `หน้าหลัก` ใน `MobileNav` ซ้ำอีกครั้ง
- **Expected:** แท็บหลัก `สำหรับคุณ` และ `ติดตาม` ควรตรวจและแจ้งเตือนเมื่อมีโพสต์ใหม่ (หรือรีเฟรชได้ง่าย) และการแตะแท็บ `หน้าหลัก` ซ้ำขณะที่อยู่หน้า `/` ควรเลื่อนกลับขึ้นบนสุดและรีเฟรชฟีดเหมือนแอปโซเชียลทั่วไป
- **Actual:** `useEffect` ที่เช็กโพสต์ใหม่ทุก `NEW_CHECK_MS` ทำงานเฉพาะเมื่อ `sort === 'all'` (`ล่าสุด`) เท่านั้น และปุ่ม `หน้าหลัก` ใน `MobileNav` เป็น `<Link href="/">` ธรรมดาที่กดซ้ำแล้วไม่เลื่อนขึ้นบนสุดหรือรีเฟรชฟีด
- **Evidence:** `components/home/HomeMomentFeed.tsx` (บรรทัด 708–723) และ `components/MobileNav.tsx` (บรรทัด 63–79)
- **Status:** Confirmed fixed
- **Fix:** `b333c13` (BE-425): กด หน้าหลัก ซ้ำบนหน้า `/` (แถบล่างบนมือถือและเมนูบนคอม) จะเลื่อนขึ้นบนสุดและรีเฟรชแท็บที่ดูอยู่ แถบ "โมเมนต์ใหม่" ขึ้นในแท็บ ติดตาม ด้วยแล้ว ส่วนแท็บ สำหรับคุณ ตั้งใจไม่ใส่ เพราะเรียงตามคะแนน คำว่า "ใหม่ N รายการ" จึงไม่มีความหมาย ใช้กด หน้าหลัก ซ้ำเพื่อรีเฟรชแทน ตรวจในเบราว์เซอร์แล้ว scrollY 2500 → 0

### TR-015 · `/` (ฟีดโมเมนต์): โพสต์รูปภาพไม่มีลิงก์เปิดหน้าโพสต์เต็ม (`/moments/[id]`) จากเวลาโพสต์ (`timeAgo`)
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (ฟีดสมาชิก), 390x844 และ 1280x800
- **Steps:**
  1. เปิดฟีดหน้าหลัก `/` แล้วดูโพสต์ที่เป็นรูปภาพ
  2. ลองกดที่รูปภาพและเวลาโพสต์ (`moment.timeAgo`)
- **Expected:** กดที่เวลาโพสต์ (`timeAgo`) สามารถเปิดหน้าโพสต์เต็ม `/moments/[id]` ได้โดยตรง (เหมือนมาตรฐาน IG/X/Threads และสอดคล้องกับโพสต์คลิปที่เปิด `/moments/[id]` ได้)
- **Actual:** กดที่รูปจะเปิด `PhotoViewer` (Lightbox) ส่วน `moment.timeAgo` เป็นข้อความธรรมดา ไม่มีลิงก์ไป `/moments/[id]`
- **Evidence:** `components/home/HomeMomentFeed.tsx` (บรรทัด 212–215, 270–274)
- **Status:** Confirmed fixed
- **Fix:** `b333c13` (BE-425): เวลาโพสต์เป็นลิงก์ไป `/moments/[id]`

### TR-018 · `MomentPhotos`: รูปในโพสต์โมเมนต์ยังไม่มี `onError` fallback กรณีโหลดรูปไม่สำเร็จ
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` และ `/moments/[id]`, 390x844 และ 1280x800
- **Steps:**
  1. แสดงโพสต์โมเมนต์ที่ URL รูปภาพต้นทางไม่สามารถโหลดได้ (เช่น HTTP 404 หรือไฟล์หาย)
- **Expected:** มี `onError` fallback หรือใช้ `FallbackImg` / placeholder ที่สะอาดตาตาม `DESIGN_SYSTEM.md` หัวข้อ 14.2 ไม่แสดงไอคอนรูปแตก
- **Actual:** `<img>` ใน `MomentPhotos.tsx` ไม่มี `onError` handler จึงแสดงไอคอนรูปแตกของเบราว์เซอร์เมื่อโหลดรูปไม่สำเร็จ
- **Evidence:** `components/moments/MomentPhotos.tsx` (บรรทัด 108–115)
- **Status:** Confirmed fixed
- **Fix:** `b333c13` (BE-425): ถ้ารูปย่อโหลดไม่ได้ จะลองโหลดไฟล์ต้นฉบับอีกครั้ง ถ้ายังไม่ได้จะแสดงพื้นสีเทาพร้อมไอคอนและคำว่า "โหลดรูปไม่ได้" ตรวจในเบราว์เซอร์แล้ว

### TR-021 · `CircleViewer`: `GroupCircleBody` ลืมใส่ `key={item.id}` ทำให้ปัดข้าม Group Circle แล้วค้างอยู่ที่รูปเดิม (`shown`)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (`CircleViewer` — Group Circle), 390x844 และ 1280x800
- **Steps:**
  1. เปิด Group Circle ตี้ A ที่มีรูปมากกว่า 1 รูป แล้วกดเลือกดูรูปที่ 2 หรือ 3 (`shown > 0`)
  2. ปัดหรือกดปุ่ม `›` เพื่อเลื่อนไป Group Circle ตี้ B ที่อยู่ติดกัน
- **Expected:** `GroupCircleBody` ต้องรีเซ็ต `shown` กลับเป็น `0` (แสดงรูปแรกของตี้ B พร้อมไฮไลต์ thumbnail แรก) เหมือน `ChallengeCircleBody` ที่ใส่ `key={item.id}`
- **Actual:** `CircleViewer.tsx` เรนเดอร์ `<GroupCircleBody item={item} ... />` โดยไม่มี `key={item.id}` ทำให้ state `shown` จากตี้ A ค้างไปที่ตี้ B (กรอบไฮไลต์ thumbnail หายหากตี้ B มีรูปน้อยกว่า หรือเปิดข้ามไปรูปหลังทันที)
- **Evidence:** `components/home/CircleViewer.tsx` (บรรทัด 192–195) และ `components/home/GroupCircleView.tsx` (บรรทัด 87–89)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): ใส่ `key={item.id}` ให้ `GroupCircleBody` ปัดไปตี้ถัดไปแล้วกลับมารูปแรก

### TR-023 · `Circles`: เส้นคั่นระหว่างวงของฉัน (ส้ม) กับวงเพื่อน (น้ำเงิน) หายไปเมื่อมีเฉพาะวง `lead` (นัดถัดไป/แคมเปญ)
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (แถว Circles บนมือถือ/แท็บเล็ต), 390x844
- **Steps:**
  1. เข้าสู่ระบบด้วยสมาชิกที่มีวง `lead` สีส้ม (เช่น `นัดถัดไป`, `ไปมาแล้ว?`, หรือ `แคมเปญ`) แต่ยังไม่ได้รับชาเลนจ์ของตัวเอง (`ordered[0]` เป็นวงเพื่อนสีน้ำเงิน)
  2. ดูแถว Circles ด้านบนของฟีด
- **Expected:** มีเส้นคั่นแนวตั้ง (`w-px h-11 bg-slate-200`) แยกกลุ่มวงสีส้มของฉันออกจากวงสีน้ำเงินของเพื่อน
- **Actual:** เงื่อนไขสร้าง `divider` ใน `Circles.tsx` เช็กเฉพาะ `index > 0 && isOwnCircle(shown[index - 1]) && !isOwnCircle(item)` โดยไม่นับ `lead` ทำให้ไม่มีเส้นคั่นเมื่อวงสีส้มทั้งหมดมาจาก `lead`
- **Evidence:** `components/home/Circles.tsx` (บรรทัด 116–125)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): วง lead (นัดถัดไป, แคมเปญ) นับเป็นของฉัน ถ้ามีวง lead แล้วตามด้วยวงเพื่อนจะมีเส้นคั่น ถ้า lead ไม่แสดงอะไร เส้นจะเป็นอันแรกของแถวและซ่อนด้วย `first:hidden` บนจอใหญ่ (`lg`) วง lead ไปอยู่คอลัมน์ซ้าย เส้นนี้จึงซ่อนด้วย

### TR-024 · `GroupCircleView`: ขาด `safe-area-inset-bottom` ใน `GroupCircleBody` และ `GroupRowCircle` ไม่หรี่สีชื่อเมื่อดูแล้ว (`seen`)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (แถว Circles และ `GroupCircleBody`), 390x844 (iPhone / แอป iOS)
- **Steps:**
  1. เปิด Group Circle ใน `CircleViewer` แล้วดูระยะห่างขอบล่างสุดของปุ่ม `ดูโพสต์` / `ดูตี้นี้` บน iPhone ที่มี Home Bar
  2. ปิดหน้าต่างแล้วดูสีชื่อใต้ Group Circle ที่เพิ่งเปิดดูไป เทียบกับ `AchievementRowCircle` และ `ChallengeRowCircle`
- **Expected:** `GroupCircleBody` ควรใช้ `pb-[max(1.5rem,env(safe-area-inset-bottom))]` เหมือน `AchievementBody` และ `ChallengeCircleBody`, และ `GroupRowCircle` ควรหรี่สีชื่อเป็น `text-slate-500` เมื่อ `seen === true`
- **Actual:** `GroupCircleBody` ใช้ `pb-6` คงที่ (ไม่เผื่อ `safe-area-inset-bottom`) และ `GroupRowCircle` ใช้ `text-slate-700` ตลอดแม้ `seen === true`
- **Evidence:** `components/home/GroupCircleView.tsx` (บรรทัด 68 และ 152) เทียบกับ `components/home/CircleViewer.tsx` (บรรทัด 280) และ `components/home/ChallengeCircleView.tsx` (บรรทัด 57, 140)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): `GroupCircleBody` ใช้ `pb-[max(1.5rem,env(safe-area-inset-bottom))]` และชื่อใต้ `GroupRowCircle` เป็น `text-slate-500` เมื่อดูแล้ว

### TR-025 · `CircleViewer` และ `ChallengeCircleView`: กดชื่อหรือรูปเพื่อนในหน้าต่าง Circle เพื่อไปหน้าโปรไฟล์ไม่ได้
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (`CircleViewer`), 390x844 และ 1280x800
- **Steps:**
  1. เปิด Circle ของเพื่อน (`AchievementBody`) หรือวงกลุ่มเพื่อน (`ChallengeCircleBody`)
  2. ลองกดที่รูป Avatar หรือชื่อของเพื่อน
- **Expected:** กดรูปหรือชื่อเพื่อน (ที่ไม่ใช่ `isMe`) ควรพาไปหน้าโปรไฟล์ `/profile?id=...` เหมือนบนฟีดและหน้าโพสต์
- **Actual:** รูปและชื่อเพื่อนในหัวการ์ด `AchievementBody` และแถวเพื่อนใน `ChallengeCircleBody` ไม่ได้ครอบด้วย `<Link>`
- **Evidence:** `components/home/CircleViewer.tsx` (บรรทัด 246–256) และ `components/home/ChallengeCircleView.tsx` (บรรทัด 153–164)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): รูปและชื่อเพื่อนในหัว `AchievementBody` และในรายชื่อ `ChallengeCircleBody` เป็นลิงก์ `/profile?id=` (ไม่ใส่ให้ตัวเอง) ลองแล้วบน dev ทั้งมือถือและจอใหญ่

### TR-026 · `CircleViewer`: ไม่ได้ prefetch วงกลุ่มเพื่อน (`kind === 'challenge'`) ล่วงหน้า ทำให้ปัดเข้าแล้วต้องรอโหลดทุกครั้ง
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (`CircleViewer`), 390x844 และ 1280x800
- **Steps:**
  1. เปิด Circle ที่อยู่ก่อนหน้าวงกลุ่มเพื่อน (`เพื่อน N คน`, `kind === 'challenge'`)
  2. ปัดหรือกด `›` เข้าไปที่วงกลุ่มเพื่อน
- **Expected:** ควร prefetch `/api/circles/[id]` ของวงถัดไปที่เป็น `challenge` ล่วงหน้าเหมือนวงเดี่ยว เพื่อไม่ให้ค้าง `"กำลังโหลด…"` และล็อกปุ่ม `"ชื่นชม"` ทุกครั้งที่ปัดเข้า
- **Actual:** `fetchDetail` ใน `CircleViewer.tsx` ข้าม `circle.kind === 'challenge'` และให้ `ChallengeCircleBody` fetch เองตอน mount เท่านั้น
- **Evidence:** `components/home/CircleViewer.tsx` (บรรทัด 55–67) และ `components/home/ChallengeCircleView.tsx` (บรรทัด 79–85)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): `CircleViewer` โหลด detail ของวงกลุ่มเพื่อนล่วงหน้าเหมือนวงอื่น (เก็บแยกเป็น `challengeDetails`) `ChallengeCircleBody` รับ `detail` / `onDetail` / `onRetry` จาก viewer แทนการ fetch เอง การชื่นชมหรือเข้าร่วมจึงยังอยู่เมื่อปัดออกแล้วกลับมา ยังไม่ได้ลองในเบราว์เซอร์: ใน dev ไม่มีสมาชิกที่มีวงแบบนี้

### TR-027 · `ChallengeCircleView`: ตัวอักษรย่อบนรูปเพื่อนมุมขวาบนใช้ `text-[10px]` ต่ำกว่าขั้นต่ำ `11px` ของ `DESIGN_SYSTEM.md`
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (แถว Circles — วงกลุ่มเพื่อนที่เพื่อนไม่มีรูป Avatar), 390x844 และ 1280x800
- **Steps:**
  1. ดู `ChallengeRowCircle` ที่มีเพื่อนที่ยังไม่ได้ตั้งรูปโปรไฟล์ (แสดงตัวอักษรย่อใน `<Face>`)
- **Expected:** ไม่มีตัวอักษรขนาดเล็กกว่า `11px` (`text-[11px]`) ตาม `DESIGN_SYSTEM.md` หัวข้อ 6
- **Actual:** `ChallengeRowCircle` ส่ง `size="w-6 h-6 text-[10px]"` ให้ `<Face>`
- **Evidence:** `components/home/ChallengeCircleView.tsx` (บรรทัด 50)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): เปลี่ยนเป็น `text-[11px]`

### TR-028 · `Circles`: รูปภาพในแถวและหน้าต่าง Circles ยังไม่มี `onError` fallback กรณีโหลดรูปไม่สำเร็จ
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (แถว Circles และ `CircleViewer`), 390x844 และ 1280x800
- **Steps:**
  1. แสดง Circle ที่รูปโปรไฟล์เพื่อนหรือรูปปกชาเลนจ์/ตี้มีลิงก์เสีย (HTTP 404)
- **Expected:** เปลี่ยนเป็นรูปสำรองหรือตัวอักษรย่อ/ไอคอนตาม `DESIGN_SYSTEM.md` หัวข้อ 14.2 ไม่แสดงไอคอนรูปแตก
- **Actual:** `<img>` ใน `Circles.tsx`, `CircleViewer.tsx`, `ChallengeCircleView.tsx` และ `GroupCircleView.tsx` ไม่มี `onError` handler
- **Evidence:** `components/home/Circles.tsx` (บรรทัด 213, 284), `components/home/CircleViewer.tsx` (บรรทัด 249, 266, 338), `components/home/ChallengeCircleView.tsx` (บรรทัด 41, 68, 131) และ `components/home/GroupCircleView.tsx` (บรรทัด 56, 79, 121, 145)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): คอมโพเนนต์ใหม่ `components/ImgOr.tsx` (เหมือน `FallbackImg` แต่ fallback เป็น element) ใช้กับทุกรูปใน `Circles.tsx`, `CircleViewer.tsx`, `ChallengeCircleView.tsx`, `GroupCircleView.tsx`: รูปคนเสียแสดงตัวอักษรย่อ รูปปกเสียแสดงไอคอนบนพื้นสีเดิม

### TR-029 · `scripts/smoke.mjs`: ยังเรียก `/api/achievements` ซึ่งถูกเปลี่ยนชื่อเป็น `/api/circles` แล้ว
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `npm run smoke` (dev server)
- **Steps:**
  1. รัน `npm run dev` แล้วรัน `npm run smoke`
- **Expected:** สคริปต์ smoke test ตรวจแถว Circles ผ่าน `/api/circles` ได้สำเร็จ
- **Actual:** `scripts/smoke.mjs` บรรทัด 89 ยังเรียก `A.call('/api/achievements')` ซึ่งถูกลบและเปลี่ยนเป็น `app/api/circles/route.ts` แล้ว ทำให้เช็ก `home row shows the challenge A took on` ไม่ผ่าน
- **Evidence:** `scripts/smoke.mjs` (บรรทัด 89) (Re-test: รัน `npm run smoke` จริงกับ dev server `http://localhost:3000` บน `f5508b1` — `ok home row shows the challenge A took on` ผ่านแล้ว)
- **Status:** Confirmed fixed
- **Fix:** `c314120` (BE-426): `scripts/smoke.mjs` เรียก `/api/circles` แล้ว
