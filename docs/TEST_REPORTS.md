# Test Reports

Problems found by the tester (Antigravity) and their fixes by Claude Code. See "Who Works Where" in [AGENTS.md](../AGENTS.md). Changes and announcements go in [HANDOFF.md](HANDOFF.md), not here.

## How this file works

**Antigravity (tester)**
1. Works on the `tester` branch. Before each test round: `git fetch`, then merge `origin/claude` into `tester`.
2. Changes only this file, never code or data. Commits and pushes to `origin/tester` after each round.
3. Adds each new problem at the end of "Open", using the next `TR-###` number. One problem per report.
4. Re-tests reports marked `Ready to re-test`. If the problem is gone, sets `Status: Confirmed fixed`. If not, sets `Status: Open` and adds what it saw under `Evidence`.

**Claude Code**
1. Merges `origin/tester` into its working branch before changing this file, so both sides' edits are kept. The owner allows this one merge; the `tester` branch holds no code changes of its own.
2. After a fix, fills in `Fix` with the commit and sets `Status: Ready to re-test`. If a report is not a bug or needs the owner to decide, sets `Status: Needs owner` with the reason in `Fix`.
3. Moves a report to "Fixed" only after it says `Confirmed fixed`. Reports are never deleted.

**Severity**
- **Critical:** the site is broken, data is lost, or there is a security problem.
- **High:** a main task fails (sign in, join, post, admin save).
- **Medium:** something is wrong but there is a way around it.
- **Low:** cosmetic.

**Before reporting:** do not put passwords, tokens or members' private details in this file. The repo is shared.

**Template**

```md
### TR-000 · Short title of the problem
- **Severity:** High
- **Tested on:** live site or branch, commit, date
- **Page and screen:** /community/123, 390x844, Chrome
- **Steps:** 1. ... 2. ... 3. ...
- **Expected:** ...
- **Actual:** ...
- **Evidence:** screenshot path or error text
- **Status:** Open
- **Fix:** (Claude Code adds the commit)
```

---

## Open

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

### TR-012 · `SiteSearch`: ช่องค้นหาหลักบน Navbar ค้นหาคน/เพื่อน (สมาชิก) และ `#แฮชแท็ก` โมเมนต์ไม่ได้
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** ทุกหน้า (Navbar `SiteSearch`), 390x844 และ 1280x800
- **Steps:**
  1. พิมพ์ชื่อสมาชิก/เพื่อน หรือ `#แฮชแท็ก` ลงในช่องค้นหาบน Navbar แล้วกด Enter
- **Expected:** สามารถค้นหาสมาชิก/เพื่อนตามชื่อเพื่อกดติดตาม และค้นหาโมเมนต์หรือ `#แฮชแท็ก` จากช่องค้นหาหลักได้ ซึ่งเป็นพื้นฐานสำคัญของ Social Platform
- **Actual:** `SiteSearch` ค้นหาเฉพาะ `['meetups', 'fairs', 'spots']` ผ่าน `/api/discover/counts` และยังไม่มีช่องทางค้นหาสมาชิกตามชื่อในระบบ (นอกจากส่งลิงก์โปรไฟล์ตรงๆ)
- **Evidence:** `components/discover/SiteSearch.tsx` (บรรทัด 16–27) และ `app/api/members/` (มีเฉพาะ `friends`, `follows`, `suggested`)
- **Status:** Ready to re-test
- **Fix:** BE-440 (เจ้าของให้ทำ 20 พ.ย.): `GET /api/search` และช่องค้นหาบนแถบด้านบนขึ้นรายการคนกับแท็กระหว่างพิมพ์ (`components/discover/SearchResults.tsx`) บนมือถือไอคอนค้นหาเปิดหน้าค้นหาเต็มจอ (`SearchSheet.tsx`) พิมพ์ `#แท็ก` แล้วกด Enter ไปหน้าแท็ก คนค้นได้เฉพาะตอนล็อกอิน ทดสอบที่ 390 และ 1280: ค้นชื่อเพื่อน กดติดตามจากรายการ ค้นด้วยอีเมลต้องไม่เจอใคร คนที่บล็อกกันต้องไม่ขึ้น BE-441 เพิ่ม: ระหว่างพิมพ์ขึ้นที่เที่ยว ตี้ อีเวนต์ ชาเลนจ์ด้วย กลุ่มที่ตรงที่สุดขึ้นก่อน ก่อนพิมพ์มีค้นหาล่าสุด คนน่าติดตาม สุดสัปดาห์นี้ ชาเลนจ์ฮิต และแท็ก ลูกศรขึ้นลงเลือกผลได้ Enter ไปหน้า `/search` ที่มีแท็บแยกประเภท และค้นโมเมนต์จากคำในแคปชันได้

### TR-013 · `/` (ฟีดโมเมนต์): เมนู `⋯` บนโพสต์คนอื่นยังไม่มีตัวเลือกเอาแท็กตัวเองออก (`isTaggedMe`), เลิกติดตาม และไม่สนใจโพสต์นี้
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (ฟีดสมาชิก), 390x844 และ 1280x800
- **Steps:**
  1. เปิดฟีดหน้าหลัก `/` แล้วกดปุ่มเมนู `⋯` บนโพสต์ของสมาชิกคนอื่น (รวมถึงโพสต์ที่เพื่อนแท็กเราไว้)
- **Expected:** มีตัวเลือกพื้นฐานในการจัดการความสัมพันธ์และฟีดจากโพสต์ได้ทันที ได้แก่ เอาแท็กตัวเองออก (เมื่อ `moment.isTaggedMe` เป็นจริง), เลิกติดตาม (เมื่อติดตามอยู่แล้ว) และไม่สนใจ/ซ่อนโพสต์นี้เพื่อส่งสัญญาณให้ฟีด `สำหรับคุณ`
- **Actual:** `menuItems` ของโพสต์คนอื่นมีเพียง `คัดลอกลิงก์` และ `รายงานโพสต์นี้` เท่านั้น แม้ฝั่งเซิร์ฟเวอร์จะส่ง `isTaggedMe` มาใน `FeedItem` แล้วก็ตาม
- **Evidence:** `components/home/HomeMomentFeed.tsx` (บรรทัด 169–179) และ `lib/moments/service.ts` (บรรทัด 126)
- **Status:** Ready to re-test
- **Fix:** BE-442 (เจ้าของให้ทำ 20 พ.ย.): เมนู `⋯` บนโพสต์คนอื่นในฟีดมี "เอาแท็กฉันออก" (เฉพาะโพสต์ที่แท็กเรา) และ "เลิกติดตาม" (เฉพาะคนที่เราติดตาม ไม่ขึ้นบนโพสต์ตัวอย่าง) ทุกโพสต์ของคนนั้นเปลี่ยนทันที ปุ่ม "ติดตาม" กลับมาข้างชื่อ ส่วน "ไม่สนใจโพสต์นี้" ยังไม่ทำ (ต้องมีตารางใหม่ อยู่ใน LAUNCH_CHECKLIST ขั้น 3) ทดสอบด้วยบัญชีที่ติดตามคนที่มีโพสต์จริง และโพสต์ที่เพื่อนแท็กเรา

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

### TR-016 · `/profile`: ยังไม่มีแท็บ "ที่ถูกแท็ก" สำหรับรวมโมเมนต์ที่เพื่อนแท็กสมาชิกไว้
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/profile`, 390x844 และ 1280x800
- **Steps:**
  1. ให้เพื่อนโพสต์โมเมนต์แล้วแท็กบัญชีของเรา
  2. เปิดหน้าโปรไฟล์ `/profile` แล้วดูแท็บเนื้อหาทั้งหมด
- **Expected:** มีแท็บสำหรับดูโมเมนต์ที่ถูกแท็ก (Tagged) เพื่อรวมความทรงจำที่เพื่อนแชร์ร่วมกันไว้ในโปรไฟล์
- **Actual:** `ProfileTab` มีเพียง `'moments' | 'went' | 'hosted' | 'challenges'` ยังไม่มีแท็บโมเมนต์ที่ถูกแท็ก
- **Evidence:** `app/profile/ProfileScreen.tsx` (`type ProfileTab`)
- **Status:** Needs owner
- **Fix:** เป็นฟีเจอร์ใหม่ (แท็บ "ที่ถูกแท็ก" ในโปรไฟล์) ไม่ใช่บั๊ก ใส่ไว้ใน LAUNCH_CHECKLIST ขั้น 8 (ทำหลังเปิดได้) แล้ว

### TR-017 · `/` (ฟีดโมเมนต์): คอมเมนต์ขยายแบบ Inline ทั้งหมดในฟีด และยังแก้ไขคอมเมนต์/แท็กเพื่อน-สถานที่หลังโพสต์ไม่ได้
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (ฟีดสมาชิก), 390x844 และ 1280x800
- **Steps:**
  1. กดดูความคิดเห็นทั้งหมดบนโพสต์ที่มีคอมเมนต์จำนวนมากในฟีดหน้าหลัก
  2. ลองแก้ไขคอมเมนต์ของตัวเอง หรือกด `แก้ไขโพสต์` เพื่อแก้แท็กเพื่อน/สถานที่
- **Expected:** เมื่อโพสต์มีคอมเมนต์เยอะควรจำกัดความยาวในฟีดหรือเปิดเป็น Bottom Sheet/Dialog เพื่อไม่ให้ฟีดยาวหลุดจังหวะ และรองรับการแก้ไขคอมเมนต์รวมถึงแท็กเพื่อน/สถานที่หลังโพสต์ได้
- **Actual:** `shownComments` กางคอมเมนต์ทั้งหมดลงในฟีดแบบ Inline, `CommentThread` ทำได้เฉพาะลบคอมเมนต์ (แก้ไขไม่ได้) และหน้าต่าง `แก้ไขโพสต์` ใน `HomeMomentFeed` แก้ได้เฉพาะแคปชัน รูป และ `PostOptions`
- **Evidence:** `components/home/HomeMomentFeed.tsx` (บรรทัด 132, 382–411, 1134–1158) และ `components/moments/CommentThread.tsx` (บรรทัด 92–95)
- **Status:** Needs owner
- **Fix:** เจ้าของตัดสินใจแล้ว 2026-11-19 ว่าให้คอมเมนต์ในฟีดเป็นแบบเดิม (โชว์ 1 อัน กดแล้วกางในฟีด) ไม่ต้องแก้ ส่วนการแก้คอมเมนต์และแก้แท็กเพื่อน/สถานที่หลังโพสต์เป็นฟีเจอร์ใหม่ ใส่ไว้ใน LAUNCH_CHECKLIST ขั้น 8

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

### TR-019 · `/` (หน้าแรกสมาชิก): `MemberLiveHome` โหลดแบบ `ssr: false` ทำให้เห็น Skeleton กระพริบตอนเปิดหน้าแรกทั้งที่เซิร์ฟเวอร์ส่ง `feedStart` มาแล้ว
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (สมาชิกที่เข้าสู่ระบบแล้ว), 390x844 และ 1280x800
- **Steps:**
  1. เข้าสู่ระบบแล้วเปิดหรือรีเฟรชหน้าหลัก `/`
- **Expected:** เมื่อ `app/page.tsx` ดึง `memberData` และ `feedStart` จากเซิร์ฟเวอร์มาพร้อมหน้าเว็บแล้ว ฟีดหน้าแรกควรแสดงผลได้ทันทีโดยไม่กระพริบเป็น `MemberHomeSkeleton`
- **Actual:** `app/HomeView.tsx` โหลด `MemberLiveHome` ด้วย `dynamic(loadMemberHome, { ssr: false, loading: () => <MemberHomeSkeleton /> })` ทำให้สมาชิกเห็น Skeleton ชั่วคราวทุกครั้งที่โหลดหน้าจนกว่า JS chunk จะโหลดและ hydrate เสร็จ
- **Evidence:** `app/page.tsx` (บรรทัด 32–36, 57) และ `app/HomeView.tsx` (บรรทัด 48–49)
- **Status:** Needs owner
- **Fix:** ตั้งใจทำแบบนี้ (คอมเมนต์ใน `app/HomeView.tsx`) เพื่อไม่ให้ผู้เยี่ยมชมต้องโหลดโค้ดหน้าสมาชิก หน้านี้เป็นหน้าส่วนตัว ไม่มีผลกับ SEO ถ้าจะ render บนเซิร์ฟเวอร์เฉพาะตอนล็อกอิน ต้องวัดความเร็วก่อนและระวังหน้าบนเซิร์ฟเวอร์กับในเบราว์เซอร์ไม่ตรงกัน ใส่ไว้ใน LAUNCH_CHECKLIST ขั้น 7 แล้ว

### TR-020 · ฟีด `สำหรับคุณ` (`forYou.ts`) และ `เพื่อนๆ ที่น่าติดตาม`: คะแนนยังไม่นับ `invitesCount`/`sharesCount` และรายชื่อแนะนำยังไม่มี Social Proof
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (ฟีดสมาชิกและแถบ `เพื่อนๆ ที่น่าติดตาม`), 390x844 และ 1280x800
- **Steps:**
  1. ตรวจสอบสูตรคำนวณคะแนน Engagement ใน `lib/moments/forYou.ts`
  2. ดูบล็อก `เพื่อนๆ ที่น่าติดตาม` ในฟีดและแถบขวา (`PeopleRail`)
- **Expected:** สูตรจัดอันดับ `สำหรับคุณ` ควรให้น้ำหนัก `invitesCount` (ชวนเพื่อนไป) และ `sharesCount` ซึ่งสะท้อนการพาคนออกไปใช้ชีวิตจริงได้ตรงที่สุด และรายชื่อ `เพื่อนๆ ที่น่าติดตาม` ควรมีบริบทความเชื่อมโยงที่ปลอดภัยต่อความเป็นส่วนตัว (เช่น เพื่อนที่ติดตามเหมือนกัน) เพื่อช่วยตัดสินใจกดติดตาม
- **Actual:** `scoreParts` คิดเฉพาะ `saves * 4 + comments * 2 + likes * 1` โดยไม่รวม `invitesCount`/`sharesCount` และ `FollowRow` แสดงเฉพาะชื่อและจำนวน `N โมเมนต์`
- **Evidence:** `lib/moments/forYou.ts` (บรรทัด 98–99) และ `components/home/onboardingFirstStep.tsx` (บรรทัด 106–110)
- **Status:** Needs owner
- **Fix:** ตอนนี้ยังไม่มีผู้ใช้จริง สัญญาณการชวนและการแชร์ยังไม่มีข้อมูลให้เรียนรู้ และความสัมพันธ์ระหว่างคนยังน้อยเกินกว่าจะโชว์ "เพื่อนที่ติดตามเหมือนกัน" ได้ ใส่ไว้ใน LAUNCH_CHECKLIST ขั้น 8 แล้ว

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

### TR-022 · `CircleViewer`: เปิด `InviteSheet` จากใน Circle แล้วกด `Esc` ปิดทั้ง `InviteSheet` และ `CircleViewer` พร้อมกัน
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `23da611`), 2026-11-19
- **Page and screen:** `/` (`CircleViewer` + `InviteSheet`), 1280x800
- **Steps:**
  1. เปิด Circle ของตัวเองใน `CircleViewer` แล้วกดปุ่ม `ชวนเพื่อนมาทำด้วย` เพื่อเปิด `InviteSheet`
  2. กดปุ่ม `Esc` บนคีย์บอร์ด
- **Expected:** กด `Esc` ครั้งแรกควรปิดเฉพาะ `InviteSheet` ที่อยู่ชั้นบนสุด โดยยังคงเปิด `CircleViewer` ไว้ด้านหลัง
- **Actual:** `CircleViewer` ผูก `useDialogBehavior(panelRef, close)` ไว้ตลอดเวลาโดยไม่ได้ระงับตอน `inviteOpen === true` (ต่างจาก `ArrowLeft`/`ArrowRight` ที่เช็ก `if (inviteOpen) return;`) ทำให้ `Esc` ปิดทั้ง `InviteSheet` และ `CircleViewer` ทิ้งพร้อมกัน
- **Evidence:** `components/home/CircleViewer.tsx` (บรรทัด 38, 81, 211–213)
- **Status:** Needs owner
- **Fix:** ไม่ใช่บั๊ก: `useDialogBehavior` ปิดเฉพาะ `[data-dialog-shell]` ที่อยู่บนสุด และ `InviteSheet` (ผ่าน `DialogShell`) portal ไปท้าย `<body>` จึงอยู่บนสุด ลองในเบราว์เซอร์จริง (dev, 1280x800) แล้ว: Esc ครั้งแรกปิดแค่ `InviteSheet` (dialog 2 → 1) ครั้งที่สองจึงปิด `CircleViewer` (1 → 0) ไม่ต้องแก้

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

### TR-030 · `app/api/admin/spots`: `scopeMatchers` ใน `set_publication` ไม่รู้จัก prefix `osmb-` และ `tat-` ทำให้ `scope: 'curated'` เหมารวมสถานที่นำเข้าใหม่
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `f5508b1`), 2026-11-19
- **Page and screen:** `/api/admin/spots` (`action: 'set_publication'`)
- **Steps:**
  1. ตรวจสอบ `scopeMatchers` ใน `app/api/admin/spots/route.ts` หลังมีการนำเข้าสถานที่ `tat-` (BE-423) และ `osmb-` (BE-424)
- **Expected:**
  - `scope: 'osm'` ควรรวมทั้ง `osm-` และ `osmb-`
  - `scope: 'imported'` ควรรวมทั้ง `ttd-`, `osm-`, `osmb-` และ `tat-`
  - `scope: 'curated'` ต้องไม่รวม `osmb-` และ `tat-`
- **Actual:** `scopeMatchers` เช็กเฉพาะ `id.startsWith('ttd-')` และ `id.startsWith('osm-')` ทำให้ `scope: 'osm'` และ `'imported'` ข้าม `osmb-` กับ `tat-` ทั้งหมด ขณะที่ `scope: 'curated'` (`!ttd- && !osm-`) เหมารวม draft ของ `tat-` และสาขาเชน `osmb-` เข้าไปด้วย
- **Evidence:** `app/api/admin/spots/route.ts` (บรรทัด 302–307) (Re-test 2026-11-23 on `a970630`: ตรวจ `scopeMatchers` ใน `app/api/admin/spots/route.ts` บรรทัด 302–310 — `osm` รวม `osm-`/`osmb-`, เพิ่ม `tat` (`tat-`), `imported` รวม `ttd-`/`tat-`/`osm-`/`osmb-` และ `curated` แยกเป็น `!isImported(id)` ครบถ้วน)
- **Status:** Confirmed fixed
- **Fix:** BE-431: `osm` รวม `osm-` และ `osmb-`, เพิ่ม scope `tat`, `imported` รวม `ttd-` `tat-` `osm-` `osmb-` และ `curated` คือที่เหลือทั้งหมด

### TR-031 · `db/migrations/0063_circle_events.sql`: ตาราง `app.circle_events` ยังไม่ได้เปิด Row Level Security (RLS)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `f5508b1`), 2026-11-19
- **Page and screen:** Database schema (`app.circle_events`, `npm run db:verify`)
- **Steps:**
  1. ตรวจสอบไฟล์ migration `db/migrations/0063_circle_events.sql` เทียบกับตารางอื่นใน schema `app` (เช่น `0059_pending_joins.sql`)
- **Expected:** ตาราง `app.circle_events` เปิด `enable row level security`, `force row level security` และสร้าง policy `runtime_all` สำหรับ `app_runtime` ตามมาตรฐานความปลอดภัยของฐานข้อมูลในโปรเจกต์
- **Actual:** `0063_circle_events.sql` มีเฉพาะ `create table`, `create index` และ `grant` แต่ยังไม่ได้เปิด RLS และไม่ได้สร้าง policy
- **Evidence:** `db/migrations/0063_circle_events.sql` (บรรทัด 1–12) เทียบกับ `db/migrations/0059_pending_joins.sql` (บรรทัด 13–15) (Re-test 2026-11-23 on `a970630`: รัน `node --env-file=.env.development.local db/verify-security.mjs` บน dev DB — `PASS RLS on and forced on all 78 tables`)
- **Status:** Confirmed fixed
- **Fix:** BE-431: migration 0065 เปิดและบังคับ RLS พร้อม policy `runtime_all` บน `app.circle_events` (รันบน dev แล้ว `db/verify-security.mjs` ผ่าน 78/78 ตาราง; live ต้องรัน 0065)

### TR-032 · `GET /api/spots`: กรอง `chainBrand` หลังแบ่งหน้า ทำให้หน้าแรกๆ คืนรายการว่าง `[]` (`0.1 KB`) และ `totalCount` นับรวมสาขาเชน
- **Severity:** High
- **Tested on:** `tester` branch (merged `origin/claude` `40d6702`), 2026-11-19
- **Page and screen:** `/api/spots?limit=20` (dev DB ที่มีสาขาเชน `osmb-` 516 แห่ง)
- **Steps:**
  1. เรียก `GET /api/spots?limit=20` (โดยไม่ส่ง `q`) บน dev server ที่มีสาขาเชน `osmb-` (BE-424)
- **Expected:** คืนรายชื่อสถานที่ท่องเที่ยว/คาเฟ่ที่ไม่ใช่สาขาเชนจำนวน 20 รายการ และ `pagination.totalCount` ไม่นับรวมสาขาเชนที่ซ่อนจากหน้าหลัก
- **Actual:** `app/api/spots/route.ts` เรียก `db.findSpots({ page, limit })` ก่อนแล้วค่อย `.filter((spot) => !spot.chainBrand)` ทีหลัง เนื่องจากสาขาเชน 516 แห่งอยู่ช่วงบนของลำดับ หน้าแรกจึงได้สาขาเชนล้วนแล้วถูกกรองทิ้งหมด เหลือ `spots: []` (`0.1 KB`) และ `totalCount` ยังนับรวมสาขาเชน
- **Evidence:** `app/api/spots/route.ts` (บรรทัด 49–65) — ผลทดสอบจริงบน dev server `GET /api/spots?limit=20` ตอบกลับ `200` ขนาด `0.1 KB` (`spots: []`) (Re-test 2026-11-23 on `a970630`: ทดสอบจริงบน dev server `GET /api/spots?limit=20` ได้ `spots=20, chains=0, totalCount=2179` และ `GET /api/spots?q=Starbucks&limit=10` ได้ `spots=10, chains=10`)
- **Status:** Confirmed fixed
- **Fix:** BE-431: เพิ่ม `excludeChains` ใน `filterSpots` กรองสาขาเชนก่อนแบ่งหน้า บน dev หน้าแรกได้ 20 รายการ ไม่มีสาขาเชน และ `totalCount` ลดจาก 2,695 เหลือ 2,179 ค้นด้วย `q` ยังเจอสาขาเชนตามเดิม

### TR-033 · `/api/admin/spots`: Response ใหญ่ถึง `14.2 MB` เกินลิมิต Vercel Serverless (`4.5 MB`) และกิน Supabase Egress สูงมาก
- **Severity:** High
- **Tested on:** `tester` branch (merged `origin/claude` `40d6702`), 2026-11-19
- **Page and screen:** `GET /api/admin/spots` และ `POST /api/admin/spots` (`action: 'update'`), dev DB
- **Steps:**
  1. ล็อกอินแอดมินแล้วเรียก `GET /api/admin/spots` บน dev DB (ที่มีสถานที่นำเข้าจาก TAT + OSM รวม ~6,200 แห่ง)
  2. ตรวจสอบโค้ด `action: 'update'` ใน `app/api/admin/spots/route.ts`
- **Expected:** `GET /api/admin/spots` แบ่งหน้า (pagination) และส่งเฉพาะฟิลด์ที่ตารางต้องใช้ให้อยู่ในขนาดที่ปลอดภัยต่อลิมิต Vercel Serverless (`4.5 MB`) และ `action: 'update'` ส่งเฉพาะ `updatedSpot` กลับ (ไม่ส่ง `spots: await getAllSpots()` ทั้งหมด)
- **Actual:** `GET /api/admin/spots` ตอบกลับขนาด `14,156.9 KB` (~14.2 MB) และ `action: 'update'` ยังเรียก `spots: await getAllSpots()` ส่งกลับทั้งก้อนทุกครั้งที่แก้ไข 1 สถานที่ ซึ่งจะพังด้วย `FUNCTION_PAYLOAD_TOO_LARGE` บน Vercel Production ทันทีที่โปรโมตข้อมูล TAT/OSM ขึ้นเว็บจริง
- **Evidence:** `app/api/admin/spots/route.ts` (บรรทัด 260–268) — วัดขนาดจริงบน dev server ได้ `14,156.9 KB` (Re-test 2026-11-23 on `a970630`: ล็อกอินแอดมินเรียก `GET /api/admin/spots` บน dev server ได้ `spots=20`, ขนาด `28.2 KB` จากทั้งหมด `6535` แห่ง; เรียก `?limit=999` ถูกจำกัดปลอดภัยที่ `100` รายการ `139.0 KB`; และ `POST` คืนเฉพาะ `spot` ที่แก้)
- **Status:** Confirmed fixed
- **Fix:** BE-431: GET แบ่งหน้าเสมอ (ไม่ส่ง `page` = หน้า 1, ค่าเริ่มต้น 20 สูงสุด 200 รายการ) หน้าละ 20 รายการหนัก 27.5 KB บน dev (ทั้งก้อนเดิม 14 MB) และ POST ทุกแบบส่งกลับเฉพาะ `spot` ที่แก้ ไม่ส่ง `spots` ทั้งหมดแล้ว หน้าแอดมินทุกจุดส่ง `page` อยู่แล้ว ไม่กระทบหน้าจอ

### TR-034 · `db/migrations/0064_apple_tokens.sql`: ตาราง `app.apple_tokens` ยังไม่ได้เปิด Row Level Security (RLS)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `40d6702`), 2026-11-19
- **Page and screen:** Database schema (`app.apple_tokens`, `npm run db:verify`)
- **Steps:**
  1. รันตรวจสอบ `relrowsecurity` และ `relforcerowsecurity` ของทุกตารางใน schema `app` บน dev DB (ตาม `db/verify-security.mjs`)
- **Expected:** ตาราง `app.apple_tokens` เปิด `enable row level security`, `force row level security` และสร้าง policy `runtime_all` สำหรับ `app_runtime` ครบเหมือนตารางอื่น (76/78 ตารางผ่านแล้ว)
- **Actual:** `app.apple_tokens` มี `relrowsecurity = false` และ `relforcerowsecurity = false` ทำให้ `db/verify-security.mjs` ไม่ผ่าน (พร้อมกับ `app.circle_events` ใน `TR-031`)
- **Evidence:** `db/migrations/0064_apple_tokens.sql` (บรรทัด 1–9) — ตรวจจาก `pg_class` บน dev DB: `apple_tokens(rls=false,force=false)` (Re-test 2026-11-23 on `a970630`: รัน `node --env-file=.env.development.local db/verify-security.mjs` บน dev DB — `PASS RLS on and forced on all 78 tables`)
- **Status:** Confirmed fixed
- **Fix:** BE-431: migration 0065 เปิดและบังคับ RLS พร้อม policy `runtime_all` บน `app.apple_tokens` (dev ผ่าน 78/78 ตาราง; live ต้องรัน 0065 พร้อม 0064)

### TR-035 · `scripts/smoke.mjs`: `npm run smoke` ไม่ผ่าน 2 ข้อ (`5/10` ชาเลนจ์เริ่มต้น) หลังมีชาเลนจ์ที่ใช้ `posts.tagged` / โพสต์หลายครั้ง (BE-438)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/main` `a970630`), 2026-11-23
- **Page and screen:** `npm run smoke` (dev server + dev DB)
- **Steps:**
  1. รัน `npm run dev` แล้วรัน `npm run smoke`
- **Expected:** `scripts/smoke.mjs` กรองเฉพาะชาเลนจ์เริ่มต้นที่จบได้ด้วยโพสต์สถานที่ 1 ครั้งโดยไม่ต้องแท็กจากหน้าชาเลนจ์ (`!q.rule.posts.tagged` และจำนวนโพสต์ 1 ครั้ง) เพื่อให้ smoke test ผ่านครบทั้ง 28 ข้อ
- **Actual:** บรรทัด 86 ใช้ `const starters = quests.filter((q) => q.rule?.posts);` ทำให้เหมารวมชาเลนจ์วิ่ง ATMBKK ที่ตั้ง `posts.tagged: true` (BE-438) และชาเลนจ์ที่ต้องโพสต์มากกว่า 1 ครั้ง เข้าไปด้วย (รวม 10 ชาเลนจ์) ส่งผลให้ไม่ผ่าน 2 ข้อ: `one post at a place finishes every starter challenge taken (5/10)` และ `starter XP counts (fromQuests 310 of 1560)`
- **Evidence:** `scripts/smoke.mjs` (บรรทัด 86, 102–105) — ผลรัน `npm run smoke` บน `a970630`: `26 passed, 2 failed`
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

### TR-036 · `SongBadge` (`SongSheet`): กด "ฟังเพลง" แล้วหยุดหรือปิดหน้าต่างระหว่างโหลด เพลงจะเริ่มเล่นค้างในพื้นหลัง และไม่เรียก `unlock()` ในจังหวะแตะ
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/main` `a970630`), 2026-11-23
- **Page and screen:** `SongSheet` (หน้าต่างเพลงเมื่อแตะชื่อเพลงบนคลิป), มือถือ/iOS และเดสก์ท็อป
- **Steps:**
  1. เปิดหน้าต่างเพลง (`SongSheet`) บนคลิปที่ใส่เพลง (`BE-446`/`BE-448`)
  2. กดปุ่ม `ฟังเพลง` ขณะเพลงยังไม่ถูกแคชในหน่วยความจำ (เช่น เน็ตช้า) แล้วกด `หยุดฟัง` หรือปิดหน้าต่างก่อน `loadSong(track.src)` โหลดเสร็จ
  3. (บน iPhone/Safari) กด `ฟังเพลง` ครั้งแรกบนหน้าที่ยังไม่เคยปลดล็อก `AudioContext`
- **Expected:** เรียก `own.unlock()` ทันทีในจังหวะแตะก่อนรอโหลด, ถ้าผู้ใช้กดหยุดหรือปิดหน้าต่างก่อนโหลดเสร็จต้องไม่เริ่มเล่นเพลง, และถ้าโหลดเพลงล้มเหลวต้องคืนปุ่มกลับเป็น `ฟังเพลง` (`setListening(false)`)
- **Actual:** `SongSheet.listen()` ใน `components/moments/SongBadge.tsx` รอ `loadSong(track.src)` ให้เสร็จก่อนค่อยเรียก `own.play(...)` โดยไม่ได้เรียก `own.unlock()` ในจังหวะคลิก และไม่ได้ตรวจว่าผู้ใช้กดหยุดหรือปิดหน้าต่างไปแล้ว (`own.stop()` ถูกเรียกก่อน `.then()` จะเรียก `own.play(...)` ซึ่งเพิ่ม `this.turn` ใหม่และเริ่มเล่นเสียงค้างในพื้นหลัง) รวมถึง `.catch(() => undefined)` ไม่ได้รีเซ็ต `setListening(false)`
- **Evidence:** `components/moments/SongBadge.tsx` (บรรทัด 114–130) เทียบกับ `lib/media/songPlayer.ts` (บรรทัด 121–145)
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

---

## Fixed

None yet.
