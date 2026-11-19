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
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

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
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

### TR-012 · `SiteSearch`: ช่องค้นหาหลักบน Navbar ค้นหาคน/เพื่อน (สมาชิก) และ `#แฮชแท็ก` โมเมนต์ไม่ได้
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** ทุกหน้า (Navbar `SiteSearch`), 390x844 และ 1280x800
- **Steps:**
  1. พิมพ์ชื่อสมาชิก/เพื่อน หรือ `#แฮชแท็ก` ลงในช่องค้นหาบน Navbar แล้วกด Enter
- **Expected:** สามารถค้นหาสมาชิก/เพื่อนตามชื่อเพื่อกดติดตาม และค้นหาโมเมนต์หรือ `#แฮชแท็ก` จากช่องค้นหาหลักได้ ซึ่งเป็นพื้นฐานสำคัญของ Social Platform
- **Actual:** `SiteSearch` ค้นหาเฉพาะ `['meetups', 'fairs', 'spots']` ผ่าน `/api/discover/counts` และยังไม่มีช่องทางค้นหาสมาชิกตามชื่อในระบบ (นอกจากส่งลิงก์โปรไฟล์ตรงๆ)
- **Evidence:** `components/discover/SiteSearch.tsx` (บรรทัด 16–27) และ `app/api/members/` (มีเฉพาะ `friends`, `follows`, `suggested`)
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

### TR-013 · `/` (ฟีดโมเมนต์): เมนู `⋯` บนโพสต์คนอื่นยังไม่มีตัวเลือกเอาแท็กตัวเองออก (`isTaggedMe`), เลิกติดตาม และไม่สนใจโพสต์นี้
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (ฟีดสมาชิก), 390x844 และ 1280x800
- **Steps:**
  1. เปิดฟีดหน้าหลัก `/` แล้วกดปุ่มเมนู `⋯` บนโพสต์ของสมาชิกคนอื่น (รวมถึงโพสต์ที่เพื่อนแท็กเราไว้)
- **Expected:** มีตัวเลือกพื้นฐานในการจัดการความสัมพันธ์และฟีดจากโพสต์ได้ทันที ได้แก่ เอาแท็กตัวเองออก (เมื่อ `moment.isTaggedMe` เป็นจริง), เลิกติดตาม (เมื่อติดตามอยู่แล้ว) และไม่สนใจ/ซ่อนโพสต์นี้เพื่อส่งสัญญาณให้ฟีด `สำหรับคุณ`
- **Actual:** `menuItems` ของโพสต์คนอื่นมีเพียง `คัดลอกลิงก์` และ `รายงานโพสต์นี้` เท่านั้น แม้ฝั่งเซิร์ฟเวอร์จะส่ง `isTaggedMe` มาใน `FeedItem` แล้วก็ตาม
- **Evidence:** `components/home/HomeMomentFeed.tsx` (บรรทัด 169–179) และ `lib/moments/service.ts` (บรรทัด 126)
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

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
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

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
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

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
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

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
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

### TR-018 · `MomentPhotos`: รูปในโพสต์โมเมนต์ยังไม่มี `onError` fallback กรณีโหลดรูปไม่สำเร็จ
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` และ `/moments/[id]`, 390x844 และ 1280x800
- **Steps:**
  1. แสดงโพสต์โมเมนต์ที่ URL รูปภาพต้นทางไม่สามารถโหลดได้ (เช่น HTTP 404 หรือไฟล์หาย)
- **Expected:** มี `onError` fallback หรือใช้ `FallbackImg` / placeholder ที่สะอาดตาตาม `DESIGN_SYSTEM.md` หัวข้อ 14.2 ไม่แสดงไอคอนรูปแตก
- **Actual:** `<img>` ใน `MomentPhotos.tsx` ไม่มี `onError` handler จึงแสดงไอคอนรูปแตกของเบราว์เซอร์เมื่อโหลดรูปไม่สำเร็จ
- **Evidence:** `components/moments/MomentPhotos.tsx` (บรรทัด 108–115)
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

### TR-019 · `/` (หน้าแรกสมาชิก): `MemberLiveHome` โหลดแบบ `ssr: false` ทำให้เห็น Skeleton กระพริบตอนเปิดหน้าแรกทั้งที่เซิร์ฟเวอร์ส่ง `feedStart` มาแล้ว
- **Severity:** Low
- **Tested on:** `tester` branch (merged `origin/claude` `bd33376`), 2026-11-19
- **Page and screen:** `/` (สมาชิกที่เข้าสู่ระบบแล้ว), 390x844 และ 1280x800
- **Steps:**
  1. เข้าสู่ระบบแล้วเปิดหรือรีเฟรชหน้าหลัก `/`
- **Expected:** เมื่อ `app/page.tsx` ดึง `memberData` และ `feedStart` จากเซิร์ฟเวอร์มาพร้อมหน้าเว็บแล้ว ฟีดหน้าแรกควรแสดงผลได้ทันทีโดยไม่กระพริบเป็น `MemberHomeSkeleton`
- **Actual:** `app/HomeView.tsx` โหลด `MemberLiveHome` ด้วย `dynamic(loadMemberHome, { ssr: false, loading: () => <MemberHomeSkeleton /> })` ทำให้สมาชิกเห็น Skeleton ชั่วคราวทุกครั้งที่โหลดหน้าจนกว่า JS chunk จะโหลดและ hydrate เสร็จ
- **Evidence:** `app/page.tsx` (บรรทัด 32–36, 57) และ `app/HomeView.tsx` (บรรทัด 48–49)
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

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
- **Status:** Open
- **Fix:** (Claude Code adds the commit)

---

## Fixed

None yet.
