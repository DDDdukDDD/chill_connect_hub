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
- **Status:** Ready to re-test
- **Fix:** 13f8949 PosterPhoto และ MeetupTile ใช้รูปสำรองเมื่อโหลดรูปไม่ได้ ตรวจแล้วโดยบังคับลิงก์เสียบน /events · c9fee5a (BE-289) รูปใน SSR ที่โหลดไม่ได้ก่อน hydrate: `useEffect` เช็ก `complete && naturalWidth === 0` แล้วเปลี่ยนเป็นรูปสำรอง

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
- **Fix:** 13f8949 ตัดวงเล็บออกตอนแสดงผล เฉพาะบัญชีและโพสต์ตัวอย่าง (withoutSampleHandle) รวมกับ TR-007

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

---

## Fixed

None yet.
