# Product Direction

Agreed with the project owner on 2026-10-16. Read this before deciding what a page shows first, what goes in the menu, or which feature to build next.

## The shift

| | Before (until 2026-10-15) | From 2026-10-16 |
| :--- | :--- | :--- |
| Main promise | "วันหยุดนี้ไปไหนดี" (where to go this weekend) | Make every time you go out count |
| Core | Places, meetups and fairs as three equal pillars | **Meetups + challenges + moments** |
| Places and fairs | Pillars | **Support**: the places a challenge sends people to, and where meetups gather |

## Commitment and differentiator (owner, 2026-11-09)

**"เราเป็นโซเชียลแพลตฟอร์มสำหรับคนชอบออกไปใช้ชีวิต ที่ทำให้ทุกการใช้ชีวิตมีความหมาย"**

- **Differentiator and strength:** "ทำให้ทุกการใช้ชีวิตมีความหมาย" (making every part of life meaningful). The owner sees this as what will make Chillwaa succeed as a **global platform**.
- **Meaning is the goal; fun is a driver** (owner, 2026-11-09). Fun is one of the things that gets people to go out and come back, but it is not the promise. Meaningful = going out adds up to something: a memory, a friendship, progress, a reward.
- **Test for every feature and screen:** does it make going out more meaningful? Fun counts when it pushes people toward that, not on its own.
- Global ambition: keep the core idea free of Thailand-only assumptions where it costs nothing (structure, data, wording that can be translated later), while launch stays Thai-first.

## Positioning (owner, 2026-10-22)

**"โซเชียลแพลตฟอร์มของคนชอบออกไปใช้ชีวิต ที่ทำให้ทุกการออกไปมีความหมาย"** (a social platform for people who love going out, where every outing counts).

- **Three main pillars: ตี้ + ชาเลนจ์ + โมเมนต์.** ตี้ and ชาเลนจ์ drive people out; โมเมนต์ is what makes it a social platform at all (people see each other, what they did, and want to go too). None of the three is optional.
- **Support: อีเวนต์ (fairs, runs, concerts, sports; called งานแฟร์ before 2026-10-24) and สถานที่เที่ยว**, the places the pillars lead to.

## Our own core: going out for real (owner, 2026-11-25)

Social is the core, because we are a social platform for people who love going out. To become number 1 we need a core that no one else has, and a reason for people to try us although they already have IG and TikTok.

- **The core is "going out for real", not the activity.** IG measures how good you look and TikTok how fun you are. No one measures how much you really go out and with whom. This is what "ทำให้ทุกการใช้ชีวิตมีความหมาย" means in the product.
- **The unit is one outing:** where, when, with whom, and a moment as proof. Feed, profile and challenges are built from outings, not from loose posts.
- **The loop:** go out → record it as a moment with the place and the people → friends see where you went and with whom → they tap "ไปด้วย" or "ไปกัน" → you go out together and it becomes the group's shared record → go out again.
- **What we already have:** moments with a place, tagging friends, "ไปกัน" group plans, "ชวนไป", challenges, the passport. The work is to join them into this one loop and tell it as one story, before building anything new.
- **Social, made our own way:** people get to know each other because they went to the same ตี้, friends invite each other out, and moments prove they went together. We do not compete on feed, likes or follower counts.

### Getting people to try us (three layers, in this order)

1. **Useful before any friend joins.** Like Strava, where people log runs alone: a personal life map (places, areas, friends this year) and challenges that work solo. The first member gets value on day one and stays until friends follow.
2. **Easier to invite existing friends than to plan in chat.** "ไปกัน" sent into a LINE group, answered without signing up first, is the main way in. Opening up to friends comes before opening up to strangers.
3. **Safe enough to meet new people.** Identity checks, public places, small groups (lib/social/spotTrips.ts and the ตี้ rules). This layer grows once people trust the brand.

### How we describe ourselves

Not "a social app" in general terms: people then compare us with IG and we lose. Say what has no direct rival: **"ที่เก็บเรื่องการออกไปใช้ชีวิตของคุณกับเพื่อน"** (the place that keeps the story of you going out with your friends). Exact wording is the owner's call.

### Numbers that tell us the core is working

- Share of new members who came from an invite (`app.action_log`).
- Share of people who went to a ตี้ and then followed someone they met or went out again with the same group.
- ตี้ opened by members versus by the team. Team-opened ตี้ and challenges are scaffolding for launch, not the growth engine.

### Open idea: storytelling first visit (owner, 2026-11-25)

A first-visit page that tells the story (who we are, what we have, why it is worth it) and leads straight to sign-up, instead of today's landing that invites people to explore first. A small "ดูก่อน" link keeps exploring possible. Not built. Conditions: it applies only to a first visit to `/`; links friends share (ตี้, moments, "ไปกัน", invite links) open what was shared; public pages stay readable for Google and AI search (AGENTS.md section 4).

## The core loop (2026-10-16, now part of the loop above)

Each part answers one question, and each feeds the next:

1. **Meetups (Events):** who to go with.
2. **Challenges:** a reason to go, and what you get for going.
3. **Moments:** proof that people really went, which makes the next person go.

The cycle: see a challenge → go to a meetup or a place → post a moment → earn XP and a badge → others see the moment and go too.

## What "support" means for places and fairs

- They are not hidden or cut. The 2,040 places and the fairs are what challenges point to and where meetups (Spot Buddy) meet. Without them a challenge has nowhere to send people.
- What changes is their place in the menu and on the homepage, and that their pages lead back into the loop ("challenges that count here", "meetups that meet here").

## Mission and wording

- **Mission (owner's wording):** "platform ที่ทำให้ทุกการใช้ชีวิตมีความหมาย". Suggested narrower form for the team: "ทำให้ทุกการ**ออกไป**ใช้ชีวิตมีความหมาย", because what we do is about going out.
- **Test for a new feature:** does it give going out more company, a better reason, or a memory worth keeping?
- **Tagline on the site:** not decided. Options proposed: (1) "ออกไปใช้ชีวิต มีเพื่อนไปด้วย มีเรื่องเล่ากลับมา" (closest to the loop), (2) "หาเพื่อนไปด้วย หาเหตุผลให้ออกไป เก็บทุกโมเมนต์ไว้", (3) "ทุกการออกไป นับเป็นความทรงจำ".

## Lessons from other platforms

No platform found (2026-10-16, a short search) does the whole loop, especially in Thai and across lifestyles.

- **Foursquare Swarm:** check-ins and badges alone faded; there was no one to go with and no reason to go again.
- **Strava:** challenges and social proof work when the group is focused; starting with a few categories people do often may beat opening all at once.
- **Timeleft** (group dinners with strangers, in Bangkok): people pay to meet new people, but nothing carries on after the first meeting. Challenges such as "ร่วมตี้ 2 ครั้ง" fill that gap.

## Things to watch

- **Meetup supply:** early on there will be few meetups. If the homepage leads with them and shows only a handful, the site feels empty. Challenges that point to places and fairs, which already have plenty of data, can bring people in first.
- **Moments:** most are sample data now. Challenges that need a moment as proof will fill this over time.
- **Earlier owner decision (2026-10-11):** most visitors do not come to find new friends, so company is offered clearly but never required. Keep this in copy even with meetups at the core.

## Next steps

1. Homepage: challenges, meetups and moments first; places and fairs below or shown as "where challenges send you". **Done 2026-10-16 (BE-068).**
2. Menu order to match.
3. Place and fair pages: make "challenges that count here" and "meetups that meet here" prominent.
