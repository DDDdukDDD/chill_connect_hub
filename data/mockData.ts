export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tag: string;
  category: 'heal' | 'move' | 'chill' | 'learn';
  image: string;
  participantsCount: number;
  maxParticipants: number;
  hostName: string;
  description: string;
  isTrending?: boolean;
  isNew?: boolean;
  rating?: number;
  badgeText?: string;
  createdAtTimestamp: number;
}

export interface MoodCategory {
  id: 'heal' | 'move' | 'chill' | 'learn';
  label: string;
  icon: string;
}

export interface ChallengeQuest {
  id: string;
  title: string;
  iconName: string;
  progressPercent: number;
  current: string;
  total: string;
  badgeLabel: string;
  completedCountInfo: string;
}

export interface PostComment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
  timeAgo: string;
}

export interface CommunityPost {
  id: string;
  userName: string;
  userAvatar: string;
  userBadge: string;
  eventId: string;
  eventTitle: string;
  category: 'heal' | 'move' | 'chill' | 'learn';
  images: string[];
  caption: string;
  location: string;
  likesCount: number;
  commentsCount: number;
  timeAgo: string;
  isLiked?: boolean;
  comments: PostComment[];
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  { id: 'heal', label: 'ฮีลใจ', icon: '🌱' },
  { id: 'move', label: 'ขยับตัว', icon: '🏃' },
  { id: 'chill', label: 'ชิลล์ๆ หาเพื่อน', icon: '☕' },
  { id: 'learn', label: 'เรียนรู้', icon: '🎨' },
];

export const MOCK_EVENTS: EventItem[] = [
  {
    id: '7',
    title: 'HYROX Physical Fitness Bootcamp 🏃‍♂️🏋️‍♀️',
    date: '05 ส.ค. 2024',
    time: '08:00 - 11:00 น.',
    location: 'HYROX Gym Studio, สุขุมวิท 39',
    tag: '#Hyrox',
    category: 'move',
    image: '/event-hyrox.png',
    participantsCount: 22,
    maxParticipants: 25,
    hostName: 'HYROX Thailand Community',
    description: 'เปิดประสบการณ์กีฬาฟิตเนสระดับโลก HYROX ที่กำลังเป็นกระแสฮิตที่สุด! เวิร์กช็อปฝึกซ้อมวิ่งสลับสถานี Workout (Sled Push, Rowing, Wall Balls) พร้อมโค้ชมืออาชีพดูแลอย่างใกล้ชิด เหมาะสำหรับผู้เริ่มเล่นและสายลุย!',
    isTrending: true,
    isNew: true,
    rating: 4.9,
    badgeText: '🔥 ฮิตแรง เหลือ 3 ที่',
    createdAtTimestamp: 1722816000000,
  },
  {
    id: '1',
    title: 'Sound Bath Meditation Rama 9 สมาธิเสียงคลื่น พระราม 9',
    date: '25 min. 2023',
    time: '14:00 - 16:00 น.',
    location: 'Introvert-friendly, พระราม 9',
    tag: '#Introvert-friendly',
    category: 'heal',
    image: '/event-sound-bath.png',
    participantsCount: 12,
    maxParticipants: 15,
    hostName: 'Mindful Community',
    description: 'ผ่อนคลายความเครียด เติมพลังบวกและความสงบทางจิตใจด้วยคลื่นเสียงสัจจะสะท้อนจาก Tibetan Singing Bowls ในบรรยากาศสงบ อบอุ่น และเป็นกันเอง เหมาะสำหรับผู้ที่ต้องการฮีลใจและพักผ่อนสมอง',
    isTrending: true,
    rating: 4.8,
    badgeText: '⭐ ยอดนิยม',
    createdAtTimestamp: 1722729600000,
  },
  {
    id: '2',
    title: 'City Run Morning วิ่งเช้าในเมือง',
    date: '13 min. 2023',
    time: '06:00 - 08:00 น.',
    location: 'สวนเบญจกิตติ, พระราม 9',
    tag: '#Beginner',
    category: 'move',
    image: '/event-city-run.png',
    participantsCount: 24,
    maxParticipants: 30,
    hostName: 'Urban Runners Club',
    description: 'วิ่งออกกำลังกายยามเช้า จังหวะสบายๆ สำหรับมือใหม่และผู้ที่อยากเริ่มต้นขยับตัว จบกิจกรรมพร้อมทานอาหารเช้าสดชื่นและพูดคุยต้อนรับวันใหม่ด้วยพลังงานสดใส',
    isTrending: true,
    rating: 4.7,
    badgeText: '🔥 ยอดฮิต',
    createdAtTimestamp: 1722643200000,
  },
  {
    id: '3',
    title: 'Board Game Night Asoke คืนบอร์ดเกม อโศก',
    date: '23 min. 2023',
    time: '18:30 - 21:30 น.',
    location: 'คืนบอร์ดเกม อโศก',
    tag: '#BoardGame',
    category: 'chill',
    image: '/event-board-games.png',
    participantsCount: 8,
    maxParticipants: 10,
    hostName: 'Dice & Chill Social',
    description: 'ค่ายบอร์ดเกมมิ่งสำหรับทุกระดับ สนุกสนานกับเกมวางแผนและโซเชียลเกม พร้อมเพื่อนใหม่ร่วมโต๊ะในบรรยากาศเป็นกันเอง มี Game Master คอยแนะนำตลอดการเล่น',
    isNew: true,
    rating: 4.9,
    badgeText: '🆕 มาใหม่',
    createdAtTimestamp: 1722800000000,
  },
  {
    id: '4',
    title: 'Pottery & Ceramic Workshop สตูดิโอปั้นดิน',
    date: '28 min. 2023',
    time: '10:00 - 13:00 น.',
    location: 'อารีย์ สตูดิโอ',
    tag: '#Handmade',
    category: 'learn',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    participantsCount: 6,
    maxParticipants: 8,
    hostName: 'Craft Space Ari',
    description: 'เรียนรู้เทคนิคการปั้นแก้วและจานเซรามิคด้วยมือ ปลดปล่อยจินตนาการและงานฝีมือสุดพิเศษ สามารถนำชิ้นงานกลับบ้านหลังจากลงสีและอบเสร็จสิ้น',
    isNew: true,
    rating: 4.9,
    badgeText: '🆕 มาใหม่',
    createdAtTimestamp: 1722780000000,
  },
  {
    id: '5',
    title: 'Acoustic Coffee Session กาแฟ & ดนตรีสด',
    date: '30 min. 2023',
    time: '15:00 - 17:30 น.',
    location: 'ทองหล่อ Soi 10',
    tag: '#CoffeeLover',
    category: 'chill',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
    participantsCount: 15,
    maxParticipants: 20,
    hostName: 'Bean & Melody Cafe',
    description: 'จิบกาแฟดริปหอมๆ ฟังเสียงดนตรีอะคูสติกสดใส และแลกเปลี่ยนความประทับใจกับเพื่อนคอกาแฟและดนตรีฟินๆ',
    isTrending: false,
    rating: 4.6,
    createdAtTimestamp: 1722500000000,
  },
  {
    id: '6',
    title: 'Sunset Park Yoga สวนลุมพินี',
    date: '02 min. 2024',
    time: '17:00 - 18:30 น.',
    location: 'สวนลุมพินี ปทุมวัน',
    tag: '#Mindfulness',
    category: 'move',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
    participantsCount: 18,
    maxParticipants: 25,
    hostName: 'Park Life Yoga',
    description: 'ยืดสายยืดเส้นท่ามกลางบรรยากาศร่มรื่นยามเย็น ชมพระอาทิตย์ตกดินในสวนสาธารณะ สูดอากาศบริสุทธิ์และผ่อนคลายร่างกาย',
    isTrending: false,
    rating: 4.7,
    createdAtTimestamp: 1722400000000,
  },
];

export const MOCK_CHALLENGES: ChallengeQuest[] = [
  {
    id: '1',
    title: 'Cafe Hunter 5',
    iconName: 'Coffee',
    progressPercent: 60,
    current: '3',
    total: '5',
    badgeLabel: 'Cafe Explorer',
    completedCountInfo: 'ทำสำเร็จแล้ว 3/5 คาเฟ่',
  },
  {
    id: '2',
    title: 'Step Count 30Days',
    iconName: 'Footprints',
    progressPercent: 85,
    current: '25.5',
    total: '30',
    badgeLabel: 'Active Walker',
    completedCountInfo: 'ทำสำเร็จแล้ว 25.5/30 วัน',
  },
  {
    id: '3',
    title: 'Offline 3 Hours',
    iconName: 'Users',
    progressPercent: 30,
    current: '1',
    total: '3',
    badgeLabel: 'Digital Detox',
    completedCountInfo: 'ทำสำเร็จแล้ว 1/3 ชม.',
  },
  {
    id: '4',
    title: 'HYROX 4 Stations Workout Challenge',
    iconName: 'Flame',
    progressPercent: 75,
    current: '3',
    total: '4',
    badgeLabel: 'HYROX Warrior',
    completedCountInfo: 'ทำสำเร็จแล้ว 3/4 สถานี',
  },
];

export const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    userName: 'คุณส้ม (Som_Chill)',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    userBadge: '🏆 HYROX Finisher',
    eventId: '7',
    eventTitle: 'HYROX Physical Fitness Bootcamp 🏃‍♂️🏋️‍♀️',
    category: 'move',
    images: [
      '/event-hyrox.png',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    ],
    caption: 'ได้ลอง HYROX ครั้งแรกโหดแต่อารมณ์ดีสุดๆ! สลัดความเหนื่อยล้าด้วยพลังกลุ่มเพื่อนๆ โค้ชดูแลดีมาก ใครอยากขยับตัวลองมาซ้อมด้วยกันรอบหน้าครับ 🔥💪',
    location: 'HYROX Gym Studio, สุขุมวิท 39',
    likesCount: 42,
    commentsCount: 5,
    timeAgo: '2 ชั่วโมงที่แล้ว',
    isLiked: false,
    comments: [
      {
        id: 'c1',
        userName: 'คุณต้น (Ton_Runner)',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        text: 'เหนื่อยสถานี Sled Push มากครับ แต่สนุกสุดๆ รอบหน้าไปอีกแน่!',
        timeAgo: '1 ชั่วโมงที่แล้ว',
      },
      {
        id: 'c2',
        userName: 'คุณพลอย (Ploy_Mind)',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        text: 'อยากไปลองจอยบ้างจังเลยค่ะ มือใหม่ไหวไหมคะ?',
        timeAgo: '30 นาทีที่แล้ว',
      },
    ],
  },
  {
    id: 'post-2',
    userName: 'คุณเอก (Eak_Mindfulness)',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    userBadge: '🧘 Zen Master',
    eventId: '1',
    eventTitle: 'Sound Bath Meditation Rama 9 สมาธิเสียงคลื่น พระราม 9',
    category: 'heal',
    images: [
      '/event-sound-bath.png',
    ],
    caption: 'หลับลึกและเบาสมองมากหลังจากฟังคลื่นเสียง Singing Bowls 2 ชั่วโมงเต็ม ได้เพื่อนใหม่สาย Introvert น่ารักๆ เพิ่มขึ้นเยอะเลยครับ 🌱🤍',
    location: 'Introvert-friendly, พระราม 9',
    likesCount: 58,
    commentsCount: 3,
    timeAgo: '5 ชั่วโมงที่แล้ว',
    isLiked: true,
    comments: [
      {
        id: 'c3',
        userName: 'คุณเมย์ (May_Coffee)',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        text: 'ยินดีที่ได้รู้จักทุกคนในคลาสเมื่อวานนะคะ บรรยากาศอบอุ่นมาก',
        timeAgo: '4 ชั่วโมงที่แล้ว',
      },
    ],
  },
  {
    id: 'post-3',
    userName: 'คุณเบส (Best_Gamer)',
    userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    userBadge: '🎲 Dice Master',
    eventId: '3',
    eventTitle: 'Board Game Night Asoke คืนบอร์ดเกม อโศก',
    category: 'chill',
    images: [
      '/event-board-games.png',
    ],
    caption: 'คืนบอร์ดเกมเมื่อคืนเล่น Catan กับเพื่อนใหม่ลากยาวถึงสี่ทุ่ม ฮาจนท้องแข็ง ไว้สัปดาห์หน้าเจอกันใหม่น้าทุกคน! 🎲☕',
    location: 'คืนบอร์ดเกม อโศก',
    likesCount: 35,
    commentsCount: 2,
    timeAgo: '1 วันที่แล้ว',
    isLiked: false,
    comments: [],
  },
];
