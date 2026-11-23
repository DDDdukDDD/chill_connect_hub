/** A meetup's mood (components/CreateEventModal.tsx) */
export type TeeMood = 'move' | 'heal' | 'chill' | 'learn';

/**
 * "ไอเดียตี้" (owner 2026-11-24): ready-made starting points instead of sample ตี้ with made-up people. A card says
 * plainly that it is an idea; tapping it opens the create dialog filled in from the idea, and the member still picks
 * the day, the place and the meeting point, and can change everything else. Nothing here is shown as a real ตี้.
 *
 * `category` is a meetup category id (data/masterHub.ts, `communityCategories`), `mood` its coreMood, which also
 * picks the cover photo. Times are a suggestion for the day the member picks. Texts pass the form rules
 * (title ≥ 5, description ≥ 15 characters, 2–15 people).
 */
export interface TeeIdea {
  id: string;
  title: string;
  /** One line on the card: when and how many */
  hint: string;
  category: string;
  mood: TeeMood;
  description: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  whatToBring: string[];
  beginnerFriendly: boolean;
}

export const TEE_IDEAS: TeeIdea[] = [
  {
    id: 'run-event-together',
    title: 'ไปวิ่งงานวิ่งด้วยกัน',
    hint: 'เจอกันก่อนปล่อยตัว · 2-8 คน',
    category: 'running_fitness',
    mood: 'move',
    description: 'ใครสมัครงานวิ่งเดียวกันไว้ มาเจอกันก่อนปล่อยตัว ถ่ายรูปด้วยกัน แล้วต่างคนต่างวิ่งตามระยะของตัวเอง เข้าเส้นชัยแล้วไปหาอะไรกินต่อด้วยกัน',
    startTime: '04:00',
    endTime: '09:00',
    maxParticipants: 8,
    whatToBring: ['BIB และชิป', 'น้ำดื่ม'],
    beginnerFriendly: true,
  },
  {
    id: 'park-run-evening',
    title: 'วิ่งเบาๆ ในสวนตอนเย็น',
    hint: 'เย็นวันธรรมดา · 4-10 คน',
    category: 'running_fitness',
    mood: 'move',
    description: 'วิ่งช้าๆ คุยกันได้ระหว่างวิ่ง 3-5 กม. ใครเดินเร็วก็มาได้ วิ่งเสร็จยืดเหยียดด้วยกัน แล้วแยกย้ายหรือหาอะไรกินต่อ',
    startTime: '17:30',
    endTime: '19:00',
    maxParticipants: 10,
    whatToBring: ['น้ำดื่ม', 'รองเท้าวิ่ง'],
    beginnerFriendly: true,
  },
  {
    id: 'cafe-hop',
    title: 'คาเฟ่ฮอปปิ้งบ่ายวันเสาร์',
    hint: 'บ่ายสุดสัปดาห์ · 3-6 คน',
    category: 'cafe_social',
    mood: 'chill',
    description: 'ไล่ชิม 2-3 คาเฟ่ในย่านเดียวกัน นั่งคุยกันสบายๆ ถ่ายรูปกันได้ ต่างคนต่างจ่ายของตัวเอง มาคนเดียวก็ไม่เหงา',
    startTime: '13:00',
    endTime: '17:00',
    maxParticipants: 6,
    whatToBring: [],
    beginnerFriendly: true,
  },
  {
    id: 'food-walk',
    title: 'ตะลุยของกินย่านเก่า',
    hint: 'เย็นถึงค่ำ · 3-6 คน',
    category: 'food_hunt',
    mood: 'chill',
    description: 'เดินกินร้านเด็ดในย่านเดียวกัน สั่งมาแบ่งกันชิมหลายๆ อย่าง หารค่าอาหารกันตามจริง ใครมีร้านในใจเสนอได้เลย',
    startTime: '17:00',
    endTime: '20:00',
    maxParticipants: 6,
    whatToBring: ['เงินสดเผื่อร้านที่ไม่รับโอน'],
    beginnerFriendly: true,
  },
  {
    id: 'boardgame-night',
    title: 'บอร์ดเกมคืนวันศุกร์',
    hint: 'หลังเลิกงาน · 4-6 คน',
    category: 'boardgames_party',
    mood: 'chill',
    description: 'เล่นบอร์ดเกมที่ร้านด้วยกัน เกมง่ายๆ ที่สอนกันได้ในไม่กี่นาที ไม่เคยเล่นก็มาได้ หารค่าโต๊ะกันตามจริง',
    startTime: '18:30',
    endTime: '22:00',
    maxParticipants: 6,
    whatToBring: [],
    beginnerFriendly: true,
  },
  {
    id: 'photo-walk',
    title: 'เดินถ่ายรูปย่านเมืองเก่า',
    hint: 'แดดเย็น · 3-8 คน',
    category: 'photo_content',
    mood: 'learn',
    description: 'เดินถ่ายรูปช่วงแดดเย็นถึงพลบค่ำ ใช้มือถือก็พอ แลกมุมกันถ่าย ช่วยกันถ่ายรูปให้กัน จบแล้วนั่งดูรูปกันที่ร้านใกล้ๆ',
    startTime: '15:30',
    endTime: '18:30',
    maxParticipants: 8,
    whatToBring: ['มือถือหรือกล้อง', 'พาวเวอร์แบงก์'],
    beginnerFriendly: true,
  },
  {
    id: 'bike-morning',
    title: 'ปั่นจักรยานเช้าวันอาทิตย์',
    hint: 'เช้าสุดสัปดาห์ · 3-8 คน',
    category: 'travel_outdoor',
    mood: 'move',
    description: 'ปั่นเส้นทางร่มรื่นช่วงเช้าก่อนแดดแรง ปั่นช้าๆ แวะพักถ่ายรูปและกินข้าวเช้าระหว่างทาง ใครไม่มีจักรยานเช่าที่จุดเริ่มได้',
    startTime: '07:00',
    endTime: '11:00',
    maxParticipants: 8,
    whatToBring: ['น้ำดื่ม', 'หมวกหรือครีมกันแดด'],
    beginnerFriendly: true,
  },
  {
    id: 'park-yoga',
    title: 'โยคะในสวนตอนเช้า',
    hint: 'เช้าสุดสัปดาห์ · 3-10 คน',
    category: 'wellness_mind',
    mood: 'heal',
    description: 'ยืดเหยียดและโยคะง่ายๆ บนสนามหญ้าตอนเช้า ไม่ต้องเก่งมาก่อน ทำตามจังหวะตัวเอง จบแล้วนั่งพักคุยกันสักหน่อย',
    startTime: '07:00',
    endTime: '08:30',
    maxParticipants: 10,
    whatToBring: ['เสื่อโยคะหรือผ้าปู', 'น้ำดื่ม'],
    beginnerFriendly: true,
  },
  {
    id: 'movie-night',
    title: 'ดูหนังรอบค่ำแล้วนั่งคุยต่อ',
    hint: 'หลังเลิกงาน · 2-6 คน',
    category: 'movies_music',
    mood: 'chill',
    description: 'นัดดูหนังเรื่องเดียวกันรอบค่ำ ต่างคนต่างซื้อตั๋วที่นั่งใกล้กัน ดูจบแล้วไปนั่งคุยเรื่องหนังกันต่อที่ร้านแถวนั้น',
    startTime: '18:30',
    endTime: '22:30',
    maxParticipants: 6,
    whatToBring: [],
    beginnerFriendly: true,
  },
  {
    id: 'language-cafe',
    title: 'ฝึกภาษาที่คาเฟ่',
    hint: 'สายวันเสาร์ · 3-8 คน',
    category: 'books_language',
    mood: 'learn',
    description: 'นั่งคุยกันเป็นภาษาที่อยากฝึก ช่วยกันแก้ประโยค ไม่ต้องเก่งก็มาได้ ใครถนัดภาษาไหนช่วยเพื่อนได้เลย ต่างคนต่างจ่ายค่าเครื่องดื่ม',
    startTime: '10:00',
    endTime: '12:30',
    maxParticipants: 8,
    whatToBring: [],
    beginnerFriendly: true,
  },
];

export const teeIdeaById = (id: string | null | undefined) => TEE_IDEAS.find((idea) => idea.id === id);
