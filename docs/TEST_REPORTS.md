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
- **Status:** Open
- **Fix:**

### TR-002 · `/events`: รูปอีเวนต์ที่ลิงก์ต้นทางเสีย (HTTP 404) แสดงไอคอนรูปแตกแทนที่จะใช้รูปสำรอง (`PosterPhoto`)
- **Severity:** Medium
- **Tested on:** `tester` branch (`645c464`), 2026-11-05
- **Page and screen:** `/events`, 360x800 และ 1280x800, Chrome
- **Steps:**
  1. เปิดหน้า `/events` ในมุมมองการ์ด (Grid view)
  2. ดูการ์ดอีเวนต์ที่ URL รูปภาพภายนอกตอบกลับ HTTP 404 (เช่น `https://www.thaiticketmajor.com/img_poster/prefix_1/0912/6912/one-fight-night-49-6abf6cd60c539-l.png`)
- **Expected:** เมื่อโหลดรูปไม่สำเร็จต้องเปลี่ยนเป็นรูปหมวดหมู่หรือรูปสำรองตาม `DESIGN_SYSTEM.md` หัวข้อ 14.2 ("An item without a good photo uses the pillar's category image, never a broken or empty box") เหมือนใน `components/discover/EventDateList.tsx`
- **Actual:** `components/PosterPhoto.tsx` (ที่ใช้ใน `FairTile.tsx` และ `MeetupTile.tsx`) ไม่มี `onError` fallback ทำให้ `<img>` แสดงไอคอนรูปแตกบนพื้นสีเทา (`naturalWidth === 0`)
- **Evidence:** `components/PosterPhoto.tsx` (บรรทัด 40–51) และ `components/FairTile.tsx` (บรรทัด 104)
- **Status:** Open
- **Fix:**

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
- **Status:** Open
- **Fix:**

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
- **Status:** Open
- **Fix:**

---

## Fixed

None yet.
