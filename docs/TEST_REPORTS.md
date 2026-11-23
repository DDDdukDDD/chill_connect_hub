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
- **Evidence:** `app/api/admin/spots/route.ts` (บรรทัด 302–307)
- **Status:** Ready to re-test
- **Fix:** BE-431: `osm` รวม `osm-` และ `osmb-`, เพิ่ม scope `tat`, `imported` รวม `ttd-` `tat-` `osm-` `osmb-` และ `curated` คือที่เหลือทั้งหมด

### TR-031 · `db/migrations/0063_circle_events.sql`: ตาราง `app.circle_events` ยังไม่ได้เปิด Row Level Security (RLS)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `f5508b1`), 2026-11-19
- **Page and screen:** Database schema (`app.circle_events`, `npm run db:verify`)
- **Steps:**
  1. ตรวจสอบไฟล์ migration `db/migrations/0063_circle_events.sql` เทียบกับตารางอื่นใน schema `app` (เช่น `0059_pending_joins.sql`)
- **Expected:** ตาราง `app.circle_events` เปิด `enable row level security`, `force row level security` และสร้าง policy `runtime_all` สำหรับ `app_runtime` ตามมาตรฐานความปลอดภัยของฐานข้อมูลในโปรเจกต์
- **Actual:** `0063_circle_events.sql` มีเฉพาะ `create table`, `create index` และ `grant` แต่ยังไม่ได้เปิด RLS และไม่ได้สร้าง policy
- **Evidence:** `db/migrations/0063_circle_events.sql` (บรรทัด 1–12) เทียบกับ `db/migrations/0059_pending_joins.sql` (บรรทัด 13–15)
- **Status:** Ready to re-test
- **Fix:** BE-431: migration 0065 เปิดและบังคับ RLS พร้อม policy `runtime_all` บน `app.circle_events` (รันบน dev แล้ว `db/verify-security.mjs` ผ่าน 78/78 ตาราง; live ต้องรัน 0065)

### TR-032 · `GET /api/spots`: กรอง `chainBrand` หลังแบ่งหน้า ทำให้หน้าแรกๆ คืนรายการว่าง `[]` (`0.1 KB`) และ `totalCount` นับรวมสาขาเชน
- **Severity:** High
- **Tested on:** `tester` branch (merged `origin/claude` `40d6702`), 2026-11-19
- **Page and screen:** `/api/spots?limit=20` (dev DB ที่มีสาขาเชน `osmb-` 516 แห่ง)
- **Steps:**
  1. เรียก `GET /api/spots?limit=20` (โดยไม่ส่ง `q`) บน dev server ที่มีสาขาเชน `osmb-` (BE-424)
- **Expected:** คืนรายชื่อสถานที่ท่องเที่ยว/คาเฟ่ที่ไม่ใช่สาขาเชนจำนวน 20 รายการ และ `pagination.totalCount` ไม่นับรวมสาขาเชนที่ซ่อนจากหน้าหลัก
- **Actual:** `app/api/spots/route.ts` เรียก `db.findSpots({ page, limit })` ก่อนแล้วค่อย `.filter((spot) => !spot.chainBrand)` ทีหลัง เนื่องจากสาขาเชน 516 แห่งอยู่ช่วงบนของลำดับ หน้าแรกจึงได้สาขาเชนล้วนแล้วถูกกรองทิ้งหมด เหลือ `spots: []` (`0.1 KB`) และ `totalCount` ยังนับรวมสาขาเชน
- **Evidence:** `app/api/spots/route.ts` (บรรทัด 49–65) — ผลทดสอบจริงบน dev server `GET /api/spots?limit=20` ตอบกลับ `200` ขนาด `0.1 KB` (`spots: []`)
- **Status:** Ready to re-test
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
- **Evidence:** `app/api/admin/spots/route.ts` (บรรทัด 260–268) — วัดขนาดจริงบน dev server ได้ `14,156.9 KB`
- **Status:** Ready to re-test
- **Fix:** BE-431: GET แบ่งหน้าเสมอ (ไม่ส่ง `page` = หน้า 1, ค่าเริ่มต้น 20 สูงสุด 200 รายการ) หน้าละ 20 รายการหนัก 27.5 KB บน dev (ทั้งก้อนเดิม 14 MB) และ POST ทุกแบบส่งกลับเฉพาะ `spot` ที่แก้ ไม่ส่ง `spots` ทั้งหมดแล้ว หน้าแอดมินทุกจุดส่ง `page` อยู่แล้ว ไม่กระทบหน้าจอ

### TR-034 · `db/migrations/0064_apple_tokens.sql`: ตาราง `app.apple_tokens` ยังไม่ได้เปิด Row Level Security (RLS)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/claude` `40d6702`), 2026-11-19
- **Page and screen:** Database schema (`app.apple_tokens`, `npm run db:verify`)
- **Steps:**
  1. รันตรวจสอบ `relrowsecurity` และ `relforcerowsecurity` ของทุกตารางใน schema `app` บน dev DB (ตาม `db/verify-security.mjs`)
- **Expected:** ตาราง `app.apple_tokens` เปิด `enable row level security`, `force row level security` และสร้าง policy `runtime_all` สำหรับ `app_runtime` ครบเหมือนตารางอื่น (76/78 ตารางผ่านแล้ว)
- **Actual:** `app.apple_tokens` มี `relrowsecurity = false` และ `relforcerowsecurity = false` ทำให้ `db/verify-security.mjs` ไม่ผ่าน (พร้อมกับ `app.circle_events` ใน `TR-031`)
- **Evidence:** `db/migrations/0064_apple_tokens.sql` (บรรทัด 1–9) — ตรวจจาก `pg_class` บน dev DB: `apple_tokens(rls=false,force=false)`
- **Status:** Ready to re-test
- **Fix:** BE-431: migration 0065 เปิดและบังคับ RLS พร้อม policy `runtime_all` บน `app.apple_tokens` (dev ผ่าน 78/78 ตาราง; live ต้องรัน 0065 พร้อม 0064)

---

## Fixed

Reports marked `Confirmed fixed` are moved to [archive/test-reports-fixed.md](archive/test-reports-fixed.md), newest at the end (22 so far, up to 2026-11-23).
