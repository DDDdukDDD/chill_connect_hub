/**
 * "ไอเดียชาเลนจ์" (owner 2026-11-26): starting points for a member's own challenge, like the ตี้ ideas
 * (data/teeIdeas.ts). Tapping one fills the create dialog; the member still picks the dates and who can see it, and
 * can change everything else. Nothing here is shown as a real challenge.
 *
 * `category` is a meetup category id (data/masterHub.ts, `communityCategories`), the list challenges use too.
 * Texts pass the form rules (title ≥ 5, objective ≥ 15 characters, 1–100 times, at least one step).
 */
export interface ChallengeIdea {
  id: string;
  title: string;
  /** One line on the card: how many times and how long */
  hint: string;
  category: string;
  objective: string;
  steps: string[];
  total: number;
  badgeLabel: string;
  /** Suggested length in days, counted from today */
  days: number;
}

export const CHALLENGE_IDEAS: ChallengeIdea[] = [
  {
    id: 'cafe-3-new',
    title: 'ลองคาเฟ่ใหม่ 3 ร้านในเดือนนี้',
    hint: '3 ครั้ง · 1 เดือน',
    category: 'cafe_social',
    objective: 'ออกไปลองคาเฟ่ที่ยังไม่เคยไป 3 ร้าน ถ่ายรูปเมนูที่ชอบแล้วโพสต์จากหน้าชาเลนจ์นี้',
    steps: ['เลือกร้านที่ยังไม่เคยไป', 'สั่งเมนูที่ร้านแนะนำ', 'โพสต์รูปจากหน้าชาเลนจ์นี้'],
    total: 3,
    badgeLabel: 'นักล่าคาเฟ่',
    days: 30,
  },
  {
    id: 'morning-walk-week',
    title: 'เดินหรือวิ่งตอนเช้า 4 วันในสัปดาห์',
    hint: '4 ครั้ง · 1 สัปดาห์',
    category: 'running_fitness',
    objective: 'ตื่นเช้าออกไปเดินหรือวิ่งอย่างน้อย 20 นาที ให้ครบ 4 วันในหนึ่งสัปดาห์ แล้วโพสต์ทุกครั้ง',
    steps: ['ออกไปเดินหรือวิ่งอย่างน้อย 20 นาที', 'ถ่ายรูปวิวระหว่างทาง', 'โพสต์จากหน้าชาเลนจ์นี้'],
    total: 4,
    badgeLabel: 'คนตื่นเช้า',
    days: 7,
  },
  {
    id: 'food-hunt-street',
    title: 'ตะลุยของกินริมทาง 5 ร้าน',
    hint: '5 ครั้ง · 1 เดือน',
    category: 'food_hunt',
    objective: 'ชวนเพื่อนไปตะลุยร้านริมทางหรือตลาด 5 ร้าน เล่าสั้นๆ ว่าร้านไหนเด็ดสุดในโพสต์',
    steps: ['เลือกตลาดหรือย่านของกิน', 'ลองร้านละหนึ่งเมนู', 'โพสต์รูปพร้อมชื่อร้าน'],
    total: 5,
    badgeLabel: 'สายกินตัวจริง',
    days: 30,
  },
  {
    id: 'photo-walk-weekend',
    title: 'เดินถ่ายรูปย่านเก่า 2 สุดสัปดาห์',
    hint: '2 ครั้ง · 2 สัปดาห์',
    category: 'photo_content',
    objective: 'เดินเล่นถ่ายรูปย่านเก่าหรือย่านที่ยังไม่เคยไป 2 สุดสัปดาห์ เลือกรูปที่ชอบที่สุดมาโพสต์',
    steps: ['เลือกย่านที่อยากเดิน', 'ถ่ายรูปอย่างน้อย 10 รูป', 'โพสต์รูปที่ชอบที่สุดจากหน้าชาเลนจ์นี้'],
    total: 2,
    badgeLabel: 'นักเดินถ่ายรูป',
    days: 14,
  },
  {
    id: 'park-picnic',
    title: 'ปิกนิกในสวนกับเพื่อน 2 ครั้ง',
    hint: '2 ครั้ง · 1 เดือน',
    category: 'travel_outdoor',
    objective: 'ชวนเพื่อนไปปิกนิกในสวนสาธารณะ 2 ครั้ง เตรียมของกินไปคนละอย่าง แล้วโพสต์บรรยากาศ',
    steps: ['นัดเพื่อนและเลือกสวน', 'เตรียมของกินไปคนละอย่าง', 'โพสต์รูปจากหน้าชาเลนจ์นี้'],
    total: 2,
    badgeLabel: 'สายปิกนิก',
    days: 30,
  },
  {
    id: 'board-game-nights',
    title: 'คืนบอร์ดเกมกับแก๊ง 3 ครั้ง',
    hint: '3 ครั้ง · 1 เดือน',
    category: 'boardgames_party',
    objective: 'รวมแก๊งเล่นบอร์ดเกมที่ร้านหรือที่บ้าน 3 ครั้ง ลองเกมใหม่อย่างน้อยหนึ่งเกม แล้วโพสต์ทุกครั้ง',
    steps: ['นัดแก๊งและเลือกร้านหรือบ้าน', 'ลองเกมที่ยังไม่เคยเล่น', 'โพสต์รูปจากหน้าชาเลนจ์นี้'],
    total: 3,
    badgeLabel: 'เซียนบอร์ดเกม',
    days: 30,
  },
  {
    id: 'read-outside',
    title: 'อ่านหนังสือนอกบ้าน 4 ครั้ง',
    hint: '4 ครั้ง · 1 เดือน',
    category: 'books_language',
    objective: 'ออกไปอ่านหนังสือที่คาเฟ่ สวน หรือห้องสมุด 4 ครั้ง โพสต์หน้าปกกับประโยคที่ชอบ',
    steps: ['เลือกหนังสือหนึ่งเล่ม', 'ออกไปอ่านนอกบ้านอย่างน้อย 30 นาที', 'โพสต์หน้าปกและประโยคที่ชอบ'],
    total: 4,
    badgeLabel: 'หนอนหนังสือนอกบ้าน',
    days: 30,
  },
  {
    id: 'slow-day-wellness',
    title: 'วันพักใจ 3 ครั้ง ไม่จับมือถือ 1 ชั่วโมง',
    hint: '3 ครั้ง · 3 สัปดาห์',
    category: 'wellness_mind',
    objective: 'หาเวลาพักใจนอกบ้าน 3 ครั้ง เช่น โยคะ สวน หรือริมน้ำ วางมือถืออย่างน้อย 1 ชั่วโมง แล้วเล่าความรู้สึกสั้นๆ',
    steps: ['เลือกที่สงบนอกบ้าน', 'วางมือถืออย่างน้อย 1 ชั่วโมง', 'โพสต์เล่าความรู้สึกจากหน้าชาเลนจ์นี้'],
    total: 3,
    badgeLabel: 'ใจสงบ',
    days: 21,
  },
];
