# Storytelling first visit: plan (design agreed, not built)

Owner idea 2026-11-25, with a spec from Gemini (tester) and notes from Claude Code. Direction: [PRODUCT_DIRECTION.md](PRODUCT_DIRECTION.md) "Our own core: going out for real".

## Design agreed 2026-11-25 (owner) — supersedes the outline below where they differ

**Mockup:** [mockups/story-landing.html](mockups/story-landing.html), open in a browser (phone width and desktop). Plain HTML, not app code.

**Owner answers:** build it **before launch**; start from Gemini's headlines and improve them; **hide the phone bottom bar for every guest** (not only on `/`).

**What the page says, top to bottom**
1. **Header:** logo; เข้าสู่ระบบ (quiet, hidden on phones) + สมัครฟรี (secondary).
2. **Hero:** pill "เพิ่งเปิด ชวนแก๊งของคุณมาเป็นกลุ่มแรก" (honest early-stage framing instead of member counts). H1 **"ออกไปจริง กับเพื่อนจริง / เก็บไว้เป็นเรื่องของเรา"** (second line `#C2410C`). One blue primary "เริ่มต้นใช้งานฟรี" + link "ดูว่าทำงานยังไง"; small lines ฟรี · ไม่ต้องโหลดแอป · ไม่ขายของ ไม่สแปม. Right side is **product, not lifestyle photos**: one moment card (place, date, "ไปกับเพื่อน 3 คน", "ไปมาแล้ว") with a small "ไปกันไหม? … เพื่อนตอบว่าไป 3 จาก 4 คน" card over it.
3. **01 ชวน — "เลิกพูดว่า 'ไว้นัดกัน'":** three numbered steps: tap ชวนไป (the real `InviteIcon`, never a paper plane) → pick days for friends to vote → friends answer from the link without signing up or installing.
4. **02 เก็บ — "ทุกครั้งที่ได้ไป กลายเป็นเรื่องของเรา":** one large profile card marked **ตัวอย่าง** (moments / places / ตี้ counts, place tiles, "ที่ต่อไปของคุณ"), plus a challenge card (progress, XP and badge) and a tag-friends card. Solo counts too.
5. **03 เจอ — "อยากเจอคนใหม่ ก็มีตี้":** last and short (live has few ตี้). Four vibe chips swap one line of text; four safety points that the system enforces today: public places, 2–15 people, ตี้ host verified email, 18+ and Spot Buddy meets at the place (no shared rides).
6. **Join:** "สุดสัปดาห์นี้ ชวนใครไปดี", the sign-up box in place (tabs สมัครสมาชิกใหม่ / เข้าสู่ระบบ; LINE first, then Google, Facebook/Apple, email). Then a strip "ยังไม่พร้อมสมัคร ดูก่อนก็ได้" with place and อีเวนต์ counts and a link to `/this-week`.
7. **Phone:** no bottom bar for guests; a sticky "เริ่มต้นใช้งานฟรี / เข้าสู่ระบบ" bar after the hero, hidden once the sign-up box is on screen.

**Copy rules learned in review**
- **Never name or hint at other platforms** in page text (no IG, TikTok, "ปัดหน้า"). Say what we do, not what others do.
- **Do not lean on LINE.** Sharing uses the phone's share sheet (any chat app); write "แชตกลุ่ม" / "แชตที่ใช้อยู่". LINE stays only as the first sign-in button.
- **No feature that does not exist:** the "life map" is not built, so it is not on the page. Profile numbers are marked ตัวอย่าง.
- **Photos:** only real photos. Most people photos in `public/images/onboarding` and `challenges` are AI-made or taken abroad; the mockup uses `public/images/venues/benjakitti.jpg` and `lumpini_park.jpg`. Real photos of the team or friends going out would raise trust most.

**Open before building (Claude's recommendation, owner not yet decided)**
- **Hybrid with today's landing:** keep a short real-content strip before the footer (4–6 upcoming อีเวนต์, the real moments wall once there are enough) for proof and for search crawlers, which the current `/` does well.
- **Bring back the owner's positioning line** "ทำให้ทุกการใช้ชีวิตมีความหมาย" (H1 copy of 2026-11-09) as a closing line in the join section or footer.
- Read the hero/explore numbers from Postgres at render time, rounded down.
- `DESIGN_SYSTEM.md` still describes ชวนไป as a paper plane in a `slate-100` pill; the code uses `InviteIcon`. Fix the doc when building.

## Why

- Today's guest `/` is a directory: menu, search, lists. Strangers read it as a listing site (Wongnai, Eventpop), not a social app.
- After sample data was removed (BE-462) there are few or no open ตี้ (live had 0 on 2026-11-25). An explore-first page shows that emptiness first.
- Goal: guests on `/` feel what Chillwaa is (going out with friends, kept as a story) and go straight to sign-up. Exploring stays possible through a small link.

## What does not change

- Signed-in members: `/` stays the feed with Circles.
- Shared and public pages open without sign-in: `/this-week`, `/community/[id]`, `/events/[id]`, `/spots/[id]`, `/moments/[id]`, `/i/[code]`, "ไปกัน" links. Friends' LINE links are the main way in and must never hit a wall.
- Search and AI search (AGENTS.md section 4): story text and the `<h1>` are in the server HTML (no `ssr: false`), page keeps its metadata, `app/sitemap.ts` unchanged.

## Page outline (phone-first 390 px, then desktop)

1. **Clean header:** logo left; right: เข้าสู่ระบบ (quiet) + สมัครฟรี. No menu, no search, no phone bottom bar on this page.
2. **Hero:** stacked lifestyle photos (desktop 2×2 grid on the right). Headline, short line, one primary button **เริ่มต้นใช้งานฟรี** (scrolls to the sign-up box). One trust line with real numbers read from Postgres (see "Numbers").
3. **Story 01, Friday evening, "เริ่มจากคำว่า ไปกันไหม?":** a friend's moment at a café → tap ชวนไป → pick a day → the group says yes in LINE. This is the core loop; it leads.
4. **Story 02, Saturday, "ไม่ต้องมีแก๊งมาก่อน ก็ออกไปทำสิ่งที่ชอบได้":** an interactive vibe picker (คาเฟ่ · วิ่ง · บอร์ดเกม · เที่ยว & ฮีลใจ). Picking one swaps the card and the short story, so the visitor already plays with their own taste before signing up.
5. **Story 03, Sunday, "ทุกการออกไป เก็บไว้เป็นเรื่องราว":** what going out adds up to: moments with place and friends, the life map, challenges and XP for guaranteed rewards. Circles appear only as a picture of finished challenges, not as a feature to learn.
6. **Sign-up:** comfort line (18+, ตี้ hosts verify identity first, no selling or spam), the sign-up/login box in place (tabs สมัครสมาชิกใหม่ / เข้าสู่ระบบ, buttons for the sign-in ways that are on: LINE first, then Google, Facebook, Apple, email). Phone: a small sticky bar (เริ่มต้นใช้งานฟรี / เข้าสู่ระบบ) after the hero, hidden once the box is on screen. Footer: logo, **ดูก่อนว่าสัปดาห์นี้มีอะไร → /this-week**, about, terms and privacy.

## Notes from Claude Code on the Gemini spec

- **Numbers must be real and rounded down:** live on 2026-11-25 had 2,062 places, 126 อีเวนต์ and 12 open challenges, not "2,700+" or "35". Read them at render time; leave out any number that is small (open ตี้ today).
- **Headline:** Gemini's "เลิกเลื่อนจอคนเดียว แล้วออกไปสนุกด้วยกัน" is a strong hook. The short line under it should carry the core ("ทุกการออกไปมีความหมาย" / "เก็บไว้เป็นเรื่องราว"), so the page says what we are, not only "go out".
- **Story 03:** Gemini put Circles here; a stranger cannot read Circles yet. Lead with "kept as a story" (life map, moments with friends), rewards second.
- **Honest UI:** no made-up names, times, like counts or notifications. Lifestyle photos are fine when they do not pose as real members; real public moments only from `lib/landingMoments.ts` when there are enough.
- **Pictures:** `public/images/challenges/*.webp` (10 of 35 from tester so far). Check they are ours to use and look like real life.
- **Rules:** DESIGN_SYSTEM.md (warm `#FAF7F2` background, white cards, `#E8E2D8` borders, one blue `#2563EB` primary per view, secondary `slate-900`, no gradients on buttons or badges, Lucide icons, no decorative emoji), Thai weights up to 700 only, ตี้ wording, friendly copy.
- **After sign-up:** the 4-step onboarding repeats part of the story; consider shortening it once this page is live.
- **Measure:** first-visit sign-up rate before and after (visits to `/` as a guest vs. new members that day).

## Open questions for the owner

1. Ship before launch (Thu 26 Nov 2026) or after?
2. Headline and the three story titles: keep Gemini's or rewrite together?
3. Phone: hide the bottom bar for guests on `/` only, or on every page for guests?
