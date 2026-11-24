# Storytelling first visit: plan (draft, not built)

Owner idea 2026-11-25, with a spec from Gemini (tester) and notes from Claude Code. Waiting for the owner's OK on story and wording before any code. Direction: [PRODUCT_DIRECTION.md](PRODUCT_DIRECTION.md) "Our own core: going out for real".

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
