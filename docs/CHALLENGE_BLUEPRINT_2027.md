# พิมพ์เขียวชาเลนจ์พร้อมเปิดใช้งานจริง (Chillwaa Launch + เป้าหมายปีใหม่ 2027)

> **สถานะ:** เสนอโดย Antigravity (2026-11-23) ตามคำขอเจ้าของ เพื่อเตรียมเปิดใช้งานจริงสัปดาห์หน้า (ปลาย พ.ย. 2569) โดยไม่มีข้อมูลตัวอย่างเหลือใน `app.quests` และให้ Claude Code ตรวจ/ลงข้อมูลจริง (รูปปกทั้ง 35 รูปจะสร้างและส่งตามมาเพิ่มเป็นไฟล์ไม่ซ้ำกัน)

---

## 1. ผลคัดกรอง 56 ชาเลนจ์เดิมใน dev DB (ตัดข้อมูลตัวอย่างออกให้หมด)

### 1.1 รายการที่ควรลบ / ปิดก่อนขึ้น Live (14 รายการ)
| รายการเดิมใน dev DB | เหตุผลที่ตัดออก |
| :--- | :--- |
| `Bangkok Art Biennale: ตะลุย 5 แกลเลอรีริมเจ้าพระยา` | `rule = null` (ไม่มีกติกาในระบบ จบไม่ได้จริง) |
| `Winter Park Run: วิ่งรับลมหนาวสวนวชิรเบญจทัศ` | `rule = null` |
| `Morning Yoga 7 Days: ฮีลใจรับอรุณ` (draft) | `rule = null` (เปลี่ยนไปใช้ชุด New Year `QuestPlan` ข้อ 31 แทน) |
| `Step Count 30Days: เดินก้าวสุขภาพต่อเนื่อง 30 วัน` (draft) | `rule = null` |
| `HYROX 4 Stations` | ยุบ 2 อันให้เหลือ `HYROX & Hybrid Training` ข้อ 22 และแก้กติกาไม่ให้ล็อกเฉพาะตี้ |
| `Bookworm Expo 2026: ตะลุยงานสัปดาห์หนังสือแห่งชาติ` | งานผ่านไปแล้ว (ต.ค. 2569) |
| `พาสปอร์ตสุดสัปดาห์ พฤศจิกายน` | กำลังจะหมดเดือนใน 7 วัน (เก็บเฉพาะธันวาคม + เป้าหมายปีใหม่) |
| `Digital Detox 3 Hours: วันหยุดไร้จอมือถือ` | ซ้ำกับ `Digital Detox: วางจอมือถือ 3 ชั่วโมง` |
| `Digital Detox: วางจอมือถือ ร่วมกิจกรรมพบปะเพื่อนใหม่ 3 ชั่วโมง` | กติกาเหมือนไปตี้ 1 ครั้ง ซ้ำซ้อนกับก้าวแรก |
| `Sound Bath & Zen Healing` | ผูก `keywords` ตี้เฉพาะทาง (`Sound/Yoga/สมาธิ`) เสี่ยงค้างถ้าไม่มีตี้จริง |
| `BMA Park Run: วิ่งสะสม 3 สวนสาธารณะ` | ซ้ำกับ `เก็บครบ 3 สวนดัง กทม.` (ยุบเหลือข้อ 19 อันเดียว) |
| `Cafe Hunter 5: ตามรอย 5 คาเฟ่` | ซ้ำกับ `สายคาเฟ่ (3 คาเฟ่)` และ 5 ร้านจบยากกว่า 3 ร้าน |
| `ปั่นชมกรุงยามค่ำ`, `ตี้แรก มีของ`, `ตี้แรกของฉัน`, `อีเวนต์แรก` (`ended` เดิม) | ล้างประวัติตัวอย่างออกก่อนขึ้น Live |

### 1.2 จุดสำคัญที่ต้องแก้ในชาเลนจ์เดิมที่เก็บไว้
- ชาเลนจ์ 5 อันใน dev DB (`Road to ATMBKK 2026`, `เช็กอิน 4 ย่านฮิต กทม.`, `Morning Run & Coffee`, `ออกกำลังกายในสวน 3 ครั้งเดือนนี้`, `เก็บครบ 3 สวนดัง กทม.`) ตั้ง `rule = {"posts": {"withPlace": true}}` **โดยยังไม่มี `"tagged": true`** ทำให้โพสต์สถานที่ใดก็ได้ไปจบชาเลนจ์พร้อมกันหมด — ต้องใส่ `"tagged": true` (BE-438) และปรับ `category` ให้ใช้รหัสหมวดหมู่มาตรฐานเดียวกันทั้งหมด (`communityCategories`)

---

## 2. ชุดชาเลนจ์พร้อมเปิดใช้งานจริง (35 รายการ)

คุมจำนวนเปิดพร้อมกันที่ **35 รายการ** (26 หลัก + 9 ส่งท้ายปี 2026 & เป้าหมายปีใหม่ 2027) เพื่อให้คนมากองรวมกันใน **Circles (`เพื่อน N คนกำลังทำ`)** มากพอที่จะขับเคลื่อนด้วยกลไกโซเชียลได้เอง

### กลุ่ม A: ก้าวแรก 5 นาที & โพสต์จากโซฟา ("รู้สึกตัวอีกที อ้าว! ได้แล้ว") — 8 รายการ
| # | Slug รูปปก | ชื่อชาเลนจ์ | แหล่ง | กติกา (`QuestRule`) | XP |
| :---: | :--- | :--- | :---: | :--- | :---: |
| 1 | `first-like` | **กดใจโมเมนต์แรก** | ของเดิม | `actions: { kind: 'like' }`, `count: 1`, `newMemberDays: 30` | 20 |
| 2 | `first-follow` | **ติดตามเพื่อนคนแรก** | ของเดิม | `actions: { kind: 'follow' }`, `count: 1`, `newMemberDays: 30` | 20 |
| 3 | `save-first-spot` | **บันทึกที่เที่ยวที่อยากไป** | ของเดิม | `actions: { kind: 'save', targetType: 'spot' }`, `count: 1`, `newMemberDays: 30` | 20 |
| 4 | `join-first-tee` | **ลงชื่อเข้าร่วมตี้แรก** | ของเดิม | `actions: { kind: 'join' }`, `count: 1`, `newMemberDays: 30` | 50 |
| 5 | `share-nearby-fav` | **ป้ายยาที่โปรดใกล้ตัวคุณ** | ของเดิม | `posts: { withPlace: true }`, `count: 1` | 50 |
| 6 | `fav-regular-shop` | **ร้านประจำที่อยากบอกต่อ** | ของเดิม + `tagged` | `posts: { withPlace: true, tagged: true }`, `count: 1` | 60 |
| 7 | `recent-smile` | **ภาพล่าสุดที่ทำให้ยิ้มได้** | ของเดิม + `tagged` | `posts: { tagged: true }`, `count: 1` | 60 |
| 8 | `memorable-trip` | **ทริปที่ยังคิดถึง** | ของเดิม + `tagged` | `posts: { withPlace: true, tagged: true }`, `count: 1` | 60 |

### กลุ่ม B: โจทย์โซเชียล & คลิปสั้น (ขับเคลื่อนฟีดด้วยตัวมันเอง) — 7 รายการ
| # | Slug รูปปก | ชื่อชาเลนจ์ | แหล่ง | กติกา (`QuestRule`) | XP |
| :---: | :--- | :--- | :---: | :--- | :---: |
| 9 | `hidden-cafe` | **#คาเฟ่ลับ แชร์ร้านที่เพื่อนยังไม่รู้จัก** | ของเดิม | `targetTypes: ['spot']`, `categories: ['cafe']`, `count: 1`, `minEvidence: 'moment'` | 80 |
| 10 | `sunset-viewpoint` | **#จุดชมวิวยามเย็น แสงสุดท้ายของวัน** | ของเดิม | `targetTypes: ['spot']`, `categories: ['viewpoint']`, `count: 1`, `minEvidence: 'moment'` | 80 |
| 11 | `art-weekend` | **#วันหยุดสายอาร์ต เดินแกลเลอรีหรือพิพิธภัณฑ์** | ของเดิม | `targetTypes: ['spot']`, `categories: ['art', 'museum']`, `count: 1`, `minEvidence: 'moment'` | 80 |
| 12 | `city-park-chill` | **#สวนเขียวกลางเมือง พักใจที่สวนใกล้บ้าน** | ของเดิม | `targetTypes: ['spot']`, `categories: ['park']`, `count: 1`, `minEvidence: 'moment'` | 80 |
| 13 | `weekend-market` | **#ตลาดสุดสัปดาห์ ตะลุยของกินตลาดนัด** | ของเดิม | `targetTypes: ['spot']`, `categories: ['market']`, `count: 1`, `minEvidence: 'moment'` | 80 |
| 14 | `friday-comfort-food` | **มื้อเยียวยาใจวันศุกร์** | **ใหม่** | `posts: { withPlace: true, tagged: true }`, `count: 1` | 60 |
| 15 | `clip-15s-music` | **15 วิ พาเที่ยว (คลิปสั้นใส่เพลง)** | **ใหม่** | `posts: { tagged: true }`, `count: 1` *(แนะนำให้ใส่เพลงจากคลังเพลง Chillwaa)* | 100 |

### กลุ่ม C: สะสมตัวตน & กิจกรรมยอดฮิต (รวม HYROX และ Board Game) — 8 รายการ
| # | Slug รูปปก | ชื่อชาเลนจ์ | แหล่ง | กติกา (`QuestRule`) | XP |
| :---: | :--- | :--- | :---: | :--- | :---: |
| 16 | `life-map-3-spots` | **เปิดแผนที่ชีวิต: แชร์โมเมนต์ 3 ที่เที่ยว** | ของเดิม | `targetTypes: ['spot']`, `count: 3`, `minEvidence: 'moment'` | 150 |
| 17 | `cafe-hopping-3` | **สายคาเฟ่: ตะลุย 3 คาเฟ่โปรด** | ปรับทำได้ทั่วประเทศ | `targetTypes: ['spot']`, `categories: ['cafe']`, `count: 3`, `minEvidence: 'moment'` | 200 |
| 18 | `art-gallery-3` | **สายอาร์ต: เดินครบ 3 แกลเลอรีหรือพิพิธภัณฑ์** | ปรับทำได้ทั่วประเทศ | `targetTypes: ['spot']`, `categories: ['art', 'museum']`, `count: 3`, `minEvidence: 'moment'` | 200 |
| 19 | `park-lover-3` | **สายสวน: เก็บครบ 3 สวนสาธารณะ** | ยุบรวมของเดิม | `targetTypes: ['spot']`, `categories: ['park']`, `count: 3`, `minEvidence: 'moment'` | 200 |
| 20 | `bkk-3-districts` | **เช็กอิน 3 ย่านฮิต กทม. (อารีย์ · เจริญกรุง · บรรทัดทอง · เยาวราช)** | ของเดิม + `tagged` | `posts: { withPlace: true, tagged: true }`, `count: 3` | 250 |
| 21 | `morning-run-coffee` | **Morning Run & Coffee: วิ่งเสร็จแวะคาเฟ่ 2 ครั้ง** | ของเดิม + `tagged` | `posts: { withPlace: true, tagged: true }`, `count: 2` | 180 |
| 22 | `hyrox-training` | **HYROX & Hybrid Training: ซ้อมฟิต 3 ครั้ง** | ของฮิต + ปรับกติกา | `posts: { withPlace: true, tagged: true }`, `count: 3` *(เล่นได้ทันทีไม่ต้องรอตี้)* | 250 |
| 23 | `board-game-night` | **Board Game Night: ปาร์ตี้บอร์ดเกม 2 ครั้ง** | ของฮิต + ปรับกติกา | `posts: { withPlace: true, tagged: true }`, `count: 2` *(เล่นได้ทันทีไม่ต้องรอตี้)* | 200 |

### กลุ่ม D: ออกไปเจอคนจริง (ตี้ · ชวนเพื่อน · ปั้นโฮสต์) — 3 รายการ
| # | Slug รูปปก | ชื่อชาเลนจ์ | แหล่ง | กติกา (`QuestRule`) | XP |
| :---: | :--- | :--- | :---: | :--- | :---: |
| 24 | `invite-bestie-tee` | **ตั๋วเพื่อนซี้: ชวนเพื่อนสมัครแล้วไปตี้ด้วยกัน** | ของเดิม | `targetTypes: ['community']`, `withFriends: 1`, `friendsVia: 'invite'`, `minEvidence: 'checkin'`, `count: 1` | 250 |
| 25 | `squad-tee` | **ยกแก๊งไปตี้: ไปตี้เดียวกับเพื่อน 2 คนขึ้นไป** | ของเดิม | `targetTypes: ['community']`, `withFriends: 2`, `friendsVia: 'any'`, `minEvidence: 'checkin'`, `count: 1` | 150 |
| 26 | `first-time-host` | **โฮสต์มือใหม่: เปิดตี้แรก มีเพื่อนเช็กอินครบ 3 คน** | ของเดิม | `targetTypes: ['community']`, `asHost: 3`, `minEvidence: 'checkin'`, `count: 1` | 300 |

### กลุ่ม E: ส่งท้ายปี 2026 & เป้าหมายปีใหม่ 2027 (Seasonal Rotation) — 9 รายการ
| # | Slug รูปปก | ชื่อชาเลนจ์ | แหล่ง | กติกา (`QuestRule` / `QuestPlan`) | XP |
| :---: | :--- | :--- | :---: | :--- | :---: |
| 27 | `dec-weekend-passport` | **พาสปอร์ตสุดสัปดาห์ ธันวาคม: ออกไปใช้ชีวิต 3 สุดสัปดาห์** | ปรับ 4→3 | `perWeekend: true`, `count: 3`, `targetTypes: ['spot','community','fair']`, `minEvidence: 'moment'` | 200 |
| 28 | `dec-events-2` | **ส่งท้ายปีที่งานอีเวนต์: ไปงาน 2 งานในเดือนธันวาคม** | ของเดิม (แก้งานแฟร์→อีเวนต์) | `targetTypes: ['fair']`, `count: 2`, `minEvidence: 'moment'` | 200 |
| 29 | `winter-mist-2` | **ทะเลหมอกรับลมหนาว: ชมวิวหน้าหนาว 2 จุด** | ของเดิม | `targetTypes: ['spot']`, `vibes: ['mountain_mist']`, `categories: ['viewpoint','nature']`, `count: 2`, `minEvidence: 'moment'` | 300 |
| 30 | `best-moment-2026` | **โมเมนต์ดีที่สุดของปี 2026** | **ใหม่** | `posts: { tagged: true }`, `count: 1` | 80 |
| 31 | `newyear-2027-active` | **ปีใหม่ ร่างใหม่: ขยับตัวสัปดาห์ละ 2 วัน (แผน 3 สัปดาห์)** | **ใหม่ (`QuestPlan`)** | `plan: { weeks: 3, perWeek: 2, task: 'ออกกำลังกายหรือเดินสวนอย่างน้อย 20 นาที' }` + `posts: { tagged: true }` | 250 |
| 32 | `newyear-2027-temples` | **ไหว้พระรับปีใหม่ 2027 (3 วัด)** | ปรับ 5→3 วัด | `targetTypes: ['spot']`, `categories: ['temple']`, `count: 3`, `minEvidence: 'moment'` | 200 |
| 33 | `newyear-2027-first-try` | **ลองทำสิ่งที่ไม่เคยทำ 1 อย่างในปี 2027** | **ใหม่** | `posts: { tagged: true }`, `count: 1` | 100 |
| 34 | `newyear-2027-sat-morning` | **ตื่นเช้าวันเสาร์ 3 ครั้งรับปีใหม่** | **ใหม่** | `posts: { withPlace: true, tagged: true }`, `count: 3` | 200 |
| 35 | `newyear-2027-friends` | **เพื่อนใหม่ต้นปี 2027: ออกไปร่วมตี้ 2 ครั้ง** | ของเดิม (อัปเดตปี 2027) | `targetTypes: ['community']`, `count: 2`, `minEvidence: 'checkin'` | 250 |

*(หมายเหตุ: `Road to ATMBKK 2026` และ `ATMBKK 2026 Finisher` เก็บแยกเป็นชาเลนจ์เฉพาะงานวิ่งนั้นๆ และปิดเป็น `ended` หลังจบงาน)*

---

## 3. แนวทางรูปปก 35 รูป (ไม่ซ้ำกัน)
- เก็บไฟล์แยกตาม `Slug รูปปก` ในตารางด้านบน (`public/images/challenges/<slug>.webp` หรืออัปโหลดขึ้น R2)
- สไตล์: ภาพถ่ายไลฟ์สไตล์ไทยจริงแสงอุ่น จุดเด่นอยู่กลางภาพ (เพื่อให้ครอปสวยทั้งการ์ด `/challenges` และวงกลม **Circles**) และ **ไม่มีตัวหนังสือ/โลโก้ในภาพ**
- แผนการผลิต: Antigravity จะสร้างรูปปกทั้ง 35 รูปให้ครบเมื่อ image-generator พร้อมใช้งาน
