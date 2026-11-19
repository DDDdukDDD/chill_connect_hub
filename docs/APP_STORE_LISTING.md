# App Store listing (iPhone + iPad)

Draft for App Store Connect → Chillwaa → the 1.0 version page, 2026-11-19. Character limits are Apple's; the counts
were checked with a script (Thai vowel and tone marks count as characters). Only features that exist are named.

## Text

**Name** (30): `Chillwaa`

**Subtitle** (30): `โซเชียลคนชอบออกไปใช้ชีวิต`

**Promotional text** (170, can change any time without review):
```
ชวนเพื่อนไปตี้ ไปอีเวนต์ ไปที่ใหม่ๆ แล้วเก็บโมเมนต์ไว้ด้วยกัน ทำชาเลนจ์ให้ทุกวันว่างมีเรื่องเล่า
```

**Description** (4,000):
```
Chillwaa คือโซเชียลสำหรับคนชอบออกไปใช้ชีวิต ที่ทำให้ทุกการออกไปข้างนอกมีความหมาย ไม่ว่าจะไปคนเดียว ไปกับแก๊ง หรืออยากเจอเพื่อนใหม่ที่ชอบอะไรเหมือนกัน

ตี้
หาตี้เล็กๆ ที่ชอบแบบเดียวกัน วิ่ง เดินป่า บอร์ดเกม คาเฟ่ ดนตรี และอีกเยอะ หรือตั้งตี้เองแล้วชวนเพื่อนมาด้วย มีที่นั่งจำกัด จุดนัดชัดเจน และแชตกลุ่มไว้คุยกันก่อนวันจริง

อีเวนต์
เทศกาล งานแฟร์ คอนเสิร์ต งานวิ่ง และกีฬา รวมไว้ในที่เดียว บันทึกงานที่สนใจ แล้วชวนเพื่อนไปด้วยกัน

ที่เที่ยว
ที่เที่ยว คาเฟ่ และร้านทั่วไทย แยกตามสาย ทะเล ภูเขา คาเฟ่ ศิลปะ สายมู และอื่นๆ พร้อมเวลาเปิดและเรื่องเล่าของแต่ละที่

ชาเลนจ์
ทำชาเลนจ์ทีละขั้น เก็บ XP และป้าย แล้วแลกของรางวัล ทุกการออกไปจริงนับเป็นความคืบหน้า

โมเมนต์
โพสต์รูปหรือคลิปสั้นจากที่ที่ไปมา แท็กสถานที่และเพื่อน แล้วดูว่าเพื่อนๆ กำลังออกไปใช้ชีวิตที่ไหนกันบ้าง

Circles
แถววงกลมบนหน้าหลักที่บอกว่าเพื่อนทำชาเลนจ์อะไรสำเร็จ หรือเพิ่งไปตี้ไหนด้วยกัน กดชื่นชม หรือกดทำด้วยกันได้ในแตะเดียว

ปลอดภัยไว้ก่อน
สมาชิกต้องอายุ 18 ปีขึ้นไป คนตั้งตี้ต้องยืนยันตัวตน รายงานหรือบล็อกคนที่ไม่เหมาะสมได้ทุกเมื่อ และทีมงานตรวจทุกรายงาน

แจ้งเตือนเมื่อมีคนติดตาม คอมเมนต์ หรือมีความเคลื่อนไหวในตี้ที่คุณเข้าร่วม เข้าสู่ระบบได้ด้วย Apple, Google, Facebook, LINE หรืออีเมล

ข้อตกลงการใช้งานและนโยบายความเป็นส่วนตัว: https://www.chillwaa.com/legal
```

**Keywords** (100, comma separated, no spaces after commas; words in the name or subtitle are not repeated):
```
ตี้,หาเพื่อน,เพื่อนใหม่,เที่ยว,คาเฟ่,อีเวนต์,งานวิ่ง,ชาเลนจ์,ที่เที่ยว,กิจกรรม,เดินป่า,บอร์ดเกม
```

**URLs**
- Support URL: `https://www.chillwaa.com/about` (its "ติดต่อเรา" part lists hello@ and privacy@chillwaa.com, BE-433).
  Needs the @chillwaa.com mail working first (docs/EMAIL.md step 1).
- Marketing URL (optional): `https://www.chillwaa.com`
- Privacy Policy URL: `https://www.chillwaa.com/legal?tab=privacy`

**Copyright**: `2026 [ชื่อเจ้าของหรือบริษัท]`

**Category**: primary **Social Networking**, secondary **Lifestyle**.

## Age rating

Answer the questionnaire truthfully with the answers below. The rating it works out may be lower than 18+ (Apple
changed the age ratings in 2025; not checked which one these answers give). The terms require members to be 18 (bar
ตี้ 20), so if App Store Connect offers a higher minimum age than the calculated one, choose **18+**.
- User-generated content / social features: **Yes** (posts, comments, group chat, profiles). App Review checks there is
  a way to report and block (there is) and to filter or review content (staff review queue).
- Alcohol, tobacco or drug use or references: **Infrequent/Mild** (the bar and nightlife category).
- Unrestricted web access: **No** (the app opens only www.chillwaa.com; outside links open the system browser).
- Gambling, contests: prize draws in campaigns are free to enter and pay no money, so **not** "simulated gambling";
  if the campaign format changes (docs/LEGAL_DRAFT.md, ข้อ 7) revisit this answer.
- Everything else (violence, sexual content, medical, horror): **None**.

## App Privacy ("nutrition label")

Tracking: **No**. Chillwaa does not link data with other companies' data for advertising and has no ad or tracking SDK.

All types below are **linked to the user**, not used for tracking.

| Data type (Apple's name) | Collected | Purposes |
| :--- | :--- | :--- |
| Contact Info → Name | Yes (display name) | App Functionality |
| Contact Info → Email Address | Yes | App Functionality |
| Contact Info → Phone Number | Yes (only when a host verifies a phone) | App Functionality |
| User Content → Photos or Videos | Yes (moments, avatars) | App Functionality |
| User Content → Other User Content | Yes (captions, comments, reviews, group chat, ตี้ questions) | App Functionality |
| User Content → Customer Support | Yes (reports to staff) | App Functionality |
| Identifiers → User ID | Yes | App Functionality |
| Usage Data → Product Interaction | Yes (what is opened, joined, saved; Circle opens; where a join came from) | Analytics, Product Personalization, App Functionality |
| Other Data | Yes (year of birth, gender, interests, province from onboarding) | Product Personalization, App Functionality |
| Location | **No**: the position is used only during the request (distance check, nearby places) and not kept | – |
| Purchases, Financial Info, Health, Contacts, Browsing History, Search History, Sensitive Info, Diagnostics | No | – |

Check before submitting: if a crash or analytics tool is added later, update this table.

## App Review information

- **Sign-in required:** Yes. Provide a demo account that has finished onboarding and joined a ตี้ and a challenge:
  `[อีเมลบัญชีทดลอง]` / `[รหัสผ่าน]` (an email account, not a social one; make it on live, keep it out of campaigns).
- **Notes for the reviewer** (English):
```
Chillwaa is a Thai social app for going out: small group meetups ("ตี้"), events, places, challenges and photo posts.
The app shows our website (www.chillwaa.com) with native features: push notifications (APNs), the iOS share sheet,
camera and photo library for posts, and sign-in through the system authentication sheet (Sign in with Apple, Google,
Facebook, LINE, or email).
Demo account: see above. Guests can browse; posting, joining and chat need an account.
Account deletion: profile menu > ตั้งค่าบัญชี > ลบบัญชี > ลบบัญชีของฉัน > ลบบัญชีถาวร. Deleting an account removes the member's posts
and files and revokes the Sign in with Apple token.
User-generated content: every post, comment, profile and chat message can be reported; members can block others;
reports go to a staff review queue, and new accounts cannot post links or contact details for their first 7 days.
Members must be 18 or older.
```
- Contact: owner's name, phone and email (App Store Connect asks; not shown publicly).

## Screenshots

Required: **iPhone 6.9"** (1320 × 2868 or 1290 × 2796) and, because the app also runs on iPad
(`TARGETED_DEVICE_FAMILY = "1,2"`), **iPad 13"** (2064 × 2752 or 2048 × 2732). 3 to 10 each; the first 3 are what
most people see. Use real content on live (no "[ตัวอย่าง]" sample data) and a member with a full profile.

Suggested order, one line of Thai text on top of each:
1. Home with Circles and the feed: "ดูว่าเพื่อนๆ ออกไปใช้ชีวิตที่ไหน"
2. A ตี้ page: "หาตี้ที่ชอบแบบเดียวกัน"
3. A challenge with steps and XP: "ทำชาเลนจ์ เก็บ XP แลกรางวัล"
4. อีเวนต์ list: "อีเวนต์ทั่วไทยในที่เดียว"
5. A place page: "ที่เที่ยวแยกตามสาย"
6. Posting a moment: "เก็บโมเมนต์ไว้ด้วยกัน"

Claude can capture these from the site at the exact sizes once the content on live is real.
