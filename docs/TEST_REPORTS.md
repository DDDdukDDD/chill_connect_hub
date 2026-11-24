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

### TR-035 · `scripts/smoke.mjs`: `npm run smoke` ไม่ผ่าน 2 ข้อ (`5/10` ชาเลนจ์เริ่มต้น) หลังมีชาเลนจ์ที่ใช้ `posts.tagged` / โพสต์หลายครั้ง (BE-438)
- **Severity:** Medium
- **Tested on:** `tester` branch (merged `origin/main` `a970630`), 2026-11-23
- **Page and screen:** `npm run smoke` (dev server + dev DB)
- **Steps:**
  1. รัน `npm run dev` แล้วรัน `npm run smoke`
- **Expected:** `scripts/smoke.mjs` กรองเฉพาะชาเลนจ์เริ่มต้นที่จบได้ด้วยโพสต์สถานที่ 1 ครั้งโดยไม่ต้องแท็กจากหน้าชาเลนจ์ (`!q.rule.posts.tagged` และจำนวนโพสต์ 1 ครั้ง) เพื่อให้ smoke test ผ่านครบทั้ง 28 ข้อ
- **Actual:** บรรทัด 86 ใช้ `const starters = quests.filter((q) => q.rule?.posts);` ทำให้เหมารวมชาเลนจ์วิ่ง ATMBKK ที่ตั้ง `posts.tagged: true` (BE-438) และชาเลนจ์ที่ต้องโพสต์มากกว่า 1 ครั้ง เข้าไปด้วย (รวม 10 ชาเลนจ์) ส่งผลให้ไม่ผ่าน 2 ข้อ: `one post at a place finishes every starter challenge taken (5/10)` และ `starter XP counts (fromQuests 310 of 1560)`
- **Evidence:** `scripts/smoke.mjs` (บรรทัด 86, 102–105) — ผลรัน `npm run smoke` บน `a970630`: `26 passed, 2 failed`
  - **Re-test (2026-11-24 on `9c40f7e` หลัง `BE-456` + `BE-463`):** 2 ข้อเดิม (`one post at a place finishes every starter challenge taken` และ `starter XP counts`) ผ่านแล้ว แต่หลังลงชุด 35 ชาเลนจ์ (`BE-463`) ที่ใส่ `posts.tagged: true` ให้ 3 ใน 5 ชาเลนจ์เริ่มต้น ทำให้ `scripts/smoke.mjs` บรรทัด 87 (`five starter challenges exist`, เช็ก `starters.length >= 5`) ไม่ผ่านแทน (`2 found; run node db/seed-starter-quests.mjs`) — ผลรวม `26 passed, 1 failed`
- **Status:** Open
- **Fix:** `scripts/smoke.mjs` counts as starters only challenges with `rule.posts`, no `posts.tagged` and `count` 1 (BE-456)

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
- **Evidence:** `components/moments/SongBadge.tsx` (บรรทัด 114–130) เทียบกับ `lib/media/songPlayer.ts` (บรรทัด 121–145) (Re-test 2026-11-24 on `9c40f7e`: ตรวจโค้ด `components/moments/SongBadge.tsx` บรรทัด 91–145 — เรียก `own.unlock()` ในจังหวะคลิกก่อนรอโหลด, ใช้ `listenTurn` ref กันเล่นค้างเมื่อหยุดหรือปิดหน้าต่างระหว่างโหลด, และ `.catch` คืน `setListening(false)` ครบถ้วน)
- **Status:** Confirmed fixed
- **Fix:** `SongSheet.listen()` calls `unlock()` inside the tap, a turn counter moved on by stop and close keeps a late-loading song quiet, a failed load resets the button (BE-456)

---

## Fixed

Reports marked `Confirmed fixed` are moved to [archive/test-reports-fixed.md](archive/test-reports-fixed.md), newest at the end (27 so far, up to 2026-11-23).
