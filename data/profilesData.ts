export interface UserBadge {
  id: string;
  name: string;
  category: 'heal' | 'move' | 'chill' | 'learn' | 'host' | 'special';
  icon: string;
  description: string;
  earnedDate: string;
}

export interface UserReviewItem {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  date: string;
  eventTitle: string;
  comment: string;
}

export interface UserMomentItem {
  id: string;
  image: string;
  caption: string;
  likesCount: number;
  eventTitle: string;
  date: string;
}

export interface UserProfile {
  id: string;
  username: string; // e.g. @jirathiti_m
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  hometown?: string;
  occupation?: string;
  workplace?: string;
  education?: string;
  gender?: string;
  birthday?: string;
  relationshipStatus?: string;
  connectGoal?: string;
  frequentZones?: string;
  isVerified: boolean;
  personaTitle: string; // e.g. Super Host • Specialty Coffee Explorer
  trustTier: 'verified' | 'superhost' | 'rising_star';
  rating: number;
  reviewsCount: number;
  connectsCount: number;
  hostedCount: number;
  joinedCount: number;
  passions: string[]; // e.g. ['Specialty Coffee', 'Board Game', 'City Run']
  hostedEventIds?: string[];
  badges: UserBadge[];
  moments: UserMomentItem[];
  reviews: UserReviewItem[];
  verifiedDetails?: {
    phoneVerified: boolean;
    idVerified: boolean;
    cleanSafetyRecord: boolean;
    fastResponder: boolean;
  };
  socialLinks?: {
    instagram?: string;
    line?: string;
    facebook?: string;
  };
}

export const MOCK_PROFILES: Record<string, UserProfile> = {
  me: {
    id: 'me',
    username: '@jirathiti_m',
    name: 'Jirathitigorn Maneekord',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bio: 'ชอบออกไปลองคาเฟ่ใหม่ๆ วิ่งรับลมตอนเย็นที่สวนเบญจกิติ และเล่นบอร์ดเกมกับเพื่อนๆ ยินดีที่ได้ Connect กับทุกคนครับ! 🌿☕',
    location: 'อโศก - สุขุมวิท, กรุงเทพฯ',
    hometown: 'เชียงใหม่',
    occupation: 'Senior Software Engineer & Tech Lead',
    workplace: 'Agoda Thailand (CentralWorld Office)',
    education: 'ปริญญาตรี วิศวกรรมคอมพิวเตอร์ • จุฬาลงกรณ์มหาวิทยาลัย',
    gender: 'ชาย (Male)',
    birthday: '14 กุมภาพันธ์ (28 ปี)',
    relationshipStatus: 'โสด (Single)',
    connectGoal: 'หาเพื่อนไปลองคาเฟ่, ตี้บอร์ดเกม & วิ่งสวนเบญจกิติ',
    frequentZones: 'อโศก, พร้อมพงษ์, สวนเบญจกิติ, อารีย์',
    isVerified: true,
    personaTitle: 'Active Explorer & Cafe Hunter',
    trustTier: 'verified',
    rating: 4.9,
    reviewsCount: 14,
    connectsCount: 128,
    hostedCount: 3,
    joinedCount: 18,
    passions: ['ดริปกาแฟ Specialty', 'วิ่งรับลมยามเย็น สวนเบญจกิติ', 'บอร์ดเกมกลยุทธ์', 'นิทรรศการศิลปะ & แกลเลอรี', 'Sound Bath พักผ่อนใจ'],
    hostedEventIds: ['joined-community-1', 'live-agg-38'],
    verifiedDetails: {
      phoneVerified: true,
      idVerified: true,
      cleanSafetyRecord: true,
      fastResponder: true,
    },
    badges: [
      {
        id: 'b-1',
        name: 'Coffee Explorer',
        category: 'chill',
        icon: '☕',
        description: 'เช็คอิน Specialty Cafe ครบ 5 ร้านในย่านอารีย์และทองหล่อ',
        earnedDate: 'ส.ค. 2026',
      },
      {
        id: 'b-2',
        name: 'Park Runner',
        category: 'move',
        icon: '🏃',
        description: 'วิ่งสะสมระยะทางครบ 3 สวนสาธารณะในกรุงเทพฯ',
        earnedDate: 'ก.ค. 2026',
      },
      {
        id: 'b-3',
        name: 'Friendly Buddy',
        category: 'special',
        icon: '🤝',
        description: 'เชื่อมต่อและทำกิจกรรมร่วมกับเพื่อนใหม่มากกว่า 10 ครั้ง',
        earnedDate: 'มิ.ย. 2026',
      },
      {
        id: 'b-4',
        name: 'Sound Healer',
        category: 'heal',
        icon: '🧘',
        description: 'เข้าร่วมคลาส Sound Bath และโยคะยามเช้า 3 ครั้ง',
        earnedDate: 'พ.ค. 2026',
      },
    ],
    moments: [
      {
        id: 'm-1',
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
        caption: 'ไปเดินงานหนังสือกับเพื่อนกลุ่มย่อย สนุกมาก ได้หนังสือกลับมาเต็มกระสอบ! 📚✨',
        likesCount: 24,
        eventTitle: 'สัปดาห์หนังสือแห่งชาติ @ QSNCC',
        date: '2 วันที่แล้ว',
      },
      {
        id: 'm-2',
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
        caption: 'Sunset Run สวนเบญจกิติ บรรยากาศยามเย็นดีมาก เพซชิลล์ๆ กับเพื่อนใหม่ 🏃🌅',
        likesCount: 38,
        eventTitle: 'City Sunset Run สวนเบญจกิติ',
        date: '1 สัปดาห์ที่แล้ว',
      },
    ],
    reviews: [
      {
        id: 'r-1',
        reviewerName: 'คุณมายด์ (Mind Barista)',
        reviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        rating: 5,
        date: '18 ส.ค. 2026',
        eventTitle: 'Specialty Coffee Slow Bar ย่านอารีย์',
        comment: 'คุณจิรฐิติกานต์เป็นกันเองมาก ชวนคุยสนุก แลกเปลี่ยนเรื่องเมล็ดกาแฟดริปได้เพลินสุดๆ ครับ ยินดีที่ได้ Connect กันครับ!',
      },
      {
        id: 'r-2',
        reviewerName: 'โค้ชกานต์ (City Runners)',
        reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        rating: 5,
        date: '12 ส.ค. 2026',
        eventTitle: 'City Sunset Run สวนเบญจกิติ',
        comment: 'มาตรงเวลา มีพลังบวกสูงมาก ช่วยดูแลและให้กำลังใจเพื่อนๆ ในกลุ่มวิ่งตลอดทาง เยี่ยมมากครับ ⭐',
      },
    ],
  },
  'host-mind': {
    id: 'host-mind',
    username: '@mind_barista',
    name: 'คุณมายด์ & ทีม Slow Bar',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80',
    bio: 'บาริสต้าอิสระและผู้หลงใหลใน Specialty Coffee ชอบจัด Session ดริปกาแฟพูดคุยสบายๆ ยินดีต้อนรับทุกคนที่อยากลองเปิดใจสัมผัสรสชาติกาแฟแท้ๆ ครับ ☕🌿',
    location: 'อารีย์ - พญาไท, กรุงเทพฯ',
    hometown: 'กรุงเทพมหานคร',
    occupation: 'Specialty Coffee Roaster & Community Host',
    workplace: 'Slow Bar Studio Ari & Freelance Q-Grader',
    education: 'ปริญญาตรี ศิลปกรรมศาสตร์ • มหาวิทยาลัยธรรมศาสตร์',
    gender: 'หญิง (Female)',
    birthday: '22 ตุลาคม (26 ปี)',
    relationshipStatus: 'โสด (Single)',
    connectGoal: 'ชวนเพื่อนแลกเปลี่ยนเรื่องเมล็ดกาแฟ Specialty & งานคราฟต์',
    frequentZones: 'อารีย์, ประดิพัทธ์, พญาไท',
    isVerified: true,
    personaTitle: 'Super Host • Specialty Coffee Master',
    trustTier: 'superhost',
    rating: 4.96,
    reviewsCount: 38,
    connectsCount: 342,
    hostedCount: 16,
    joinedCount: 22,
    passions: ['ดริปกาแฟ Slow Bar', 'เมล็ดกาแฟ Specialty Single Origin', 'สำรวจคาเฟ่ Specialty', 'แลกเปลี่ยนภาษาอังกฤษ', 'เสวนาและพบปะเพื่อนใหม่'],
    hostedEventIds: ['joined-community-2', 'sub-1'],
    verifiedDetails: {
      phoneVerified: true,
      idVerified: true,
      cleanSafetyRecord: true,
      fastResponder: true,
    },
    badges: [
      {
        id: 'bm-1',
        name: 'Super Host 2026',
        category: 'host',
        icon: '🏆',
        description: 'จัดกิจกรรมสำเร็จมากกว่า 15 ครั้งพร้อมคะแนนเฉลี่ย 4.9+ ดาว',
        earnedDate: 'ก.ค. 2026',
      },
      {
        id: 'bm-2',
        name: 'Coffee Master',
        category: 'chill',
        icon: '☕',
        description: 'ผู้เชี่ยวชาญด้าน Specialty Single Origin และการคั่วบด',
        earnedDate: 'ม.ค. 2026',
      },
    ],
    moments: [
      {
        id: 'mm-1',
        image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
        caption: 'Slow Bar Session วันนี้สนุกมาก ขอบคุณเพื่อนๆ ทุกคนที่แวะมาจิบกาแฟและแลกเปลี่ยนความรู้กันนะครับ!',
        likesCount: 64,
        eventTitle: 'Ari Slow Bar Specialty Drip',
        date: '3 วันที่แล้ว',
      },
    ],
    reviews: [
      {
        id: 'rm-1',
        reviewerName: 'แพรววา (Praew)',
        reviewerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        rating: 5,
        date: '20 ส.ค. 2026',
        eventTitle: 'Specialty Coffee Slow Bar ย่านอารีย์',
        comment: 'คุณมายด์อธิบายเมล็ดกาแฟแต่ละตัวได้เข้าใจง่ายมาก กาแฟอร่อย บรรยากาศเป็นกันเองสุดๆ ใครมาคนเดียวแนะนำเลยค่ะ!',
      },
    ],
  },
  'host-karn': {
    id: 'host-karn',
    username: '@coach_karn_runner',
    name: 'โค้ชกานต์ (City Runners)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
    bio: 'โค้ชวิ่งเพื่อสุขภาพและนักวิ่งมาราธอน ชวนทุกคนมาวิ่งรับลมยามเย็น สวนเบญจกิติและสวนลุมพินี เน้นความสนุก สุขภาพดี และไม่ทิ้งใครไว้ข้างหลังครับ 🏃🔥',
    location: 'อโศก - สวนเบญจกิติ, กรุงเทพฯ',
    hometown: 'ขอนแก่น',
    occupation: 'Running Coach & Sport Scientist',
    workplace: 'Bangkok City Runners Club & Personal Trainer',
    education: 'วิทยาศาสตร์การกีฬาและการออกกำลังกาย • มหาวิทยาลัยมหิดล',
    gender: 'ชาย (Male)',
    birthday: '5 กันยายน (32 ปี)',
    relationshipStatus: 'มีแฟนแล้ว (In a relationship)',
    connectGoal: 'ชวนวิ่งออกกำลังกายเพื่อสุขภาพ & ซ้อมมาราธอน',
    frequentZones: 'สวนเบญจกิติ, สวนลุมพินี, พระราม 4',
    isVerified: true,
    personaTitle: 'Super Host • City Marathon Coach',
    trustTier: 'superhost',
    rating: 4.98,
    reviewsCount: 52,
    connectsCount: 518,
    hostedCount: 24,
    joinedCount: 30,
    passions: ['ซิตี้รัน สวนเบญจกิติ', 'ยืดเหยียด Sunset Stretch', 'เตรียมความพร้อมวิ่งมาราธอน', 'HYROX & ฟิตเนส', 'การวิ่งเพื่อสุขภาพ'],
    hostedEventIds: ['joined-community-1'],
    verifiedDetails: {
      phoneVerified: true,
      idVerified: true,
      cleanSafetyRecord: true,
      fastResponder: true,
    },
    badges: [
      {
        id: 'bk-1',
        name: 'Marathon Champion',
        category: 'move',
        icon: '🏃',
        description: 'โค้ชวิ่งนำทริปซิตี้รันระยะสะสมมากกว่า 500 กม.',
        earnedDate: 'พ.ค. 2026',
      },
    ],
    moments: [
      {
        id: 'mk-1',
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
        caption: 'วิ่งจบ 5K สบายๆ ท่ามกลางวิวเมืองยามเย็นสวนเบญจกิติ ทุกคนเก่งมากครับ!',
        likesCount: 92,
        eventTitle: 'City Sunset Run',
        date: '5 วันที่แล้ว',
      },
    ],
    reviews: [
      {
        id: 'rk-1',
        reviewerName: 'กวินท์ (Nut)',
        reviewerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        rating: 5,
        date: '21 ส.ค. 2026',
        eventTitle: 'City Sunset Run สวนเบญจกิติ',
        comment: 'โค้ชคอยคุมเพซให้วิ่งตามได้สบาย ไม่เหนื่อยเกินไป มีท่ายืดเหยียดกล้ามเนื้อหลังวิ่งช่วยคลายปวดได้ดีมากครับ',
      },
    ],
  },
  'host-nut': {
    id: 'host-nut',
    username: '@nut_craftcoffee',
    name: 'คุณน็อต',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    bio: 'ชอบเดินงานเอ็กซ์โปและนัดจิบกาแฟคราฟต์ พูดคุยแลกเปลี่ยนไอเดีย ชอบชวนเพื่อนๆ ไปทำกิจกรรมสบายๆ ยินดีที่ได้รู้จักครับ! 😊',
    location: 'สยาม - พระราม 9, กรุงเทพฯ',
    isVerified: true,
    personaTitle: '☕ Craft Lover & Expo Explorer',
    trustTier: 'verified',
    rating: 4.88,
    reviewsCount: 12,
    connectsCount: 96,
    hostedCount: 5,
    joinedCount: 14,
    passions: ['#CraftDrip', '#ExpoExplorer', '#TechTalks', '#BoardGames'],
    badges: [
      {
        id: 'bn-1',
        name: 'Expo Master',
        category: 'chill',
        icon: '🏛️',
        description: 'เข้าร่วมงานนิทรรศการและอีเวนต์ใหญ่ครบ 5 งาน',
        earnedDate: 'ส.ค. 2026',
      },
    ],
    moments: [],
    reviews: [],
  },
  'host-som': {
    id: 'host-som',
    username: '@som_chill',
    name: 'คุณส้ม (Som_Chill)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bio: 'สายอาร์ตและคนรักหนังสือ ชอบชวนเดินดูนิทรรศการศิลปะ โซนนิยายแปล และจิบชาในงานแฟร์ สไตล์สบายๆ ไม่เกร็งค่ะ 🎨📚',
    location: 'สามย่าน - สยาม, กรุงเทพฯ',
    isVerified: true,
    personaTitle: '🎨 Creative Art & Book Explorer',
    trustTier: 'verified',
    rating: 4.92,
    reviewsCount: 19,
    connectsCount: 185,
    hostedCount: 7,
    joinedCount: 16,
    passions: ['#ArtExhibition', '#BookFair', '#CeramicWorkshop', '#SpecialtyTea'],
    badges: [],
    moments: [],
    reviews: [],
  },
};

// Helper to get connected user IDs from localStorage
export function getConnectedUserIds(): string[] {
  if (typeof window === 'undefined') return ['host-mind', 'host-karn'];
  try {
    const raw = localStorage.getItem('connectedUserIds');
    if (!raw) {
      const defaultConnects = ['host-mind', 'host-karn'];
      localStorage.setItem('connectedUserIds', JSON.stringify(defaultConnects));
      return defaultConnects;
    }
    return JSON.parse(raw);
  } catch (e) {
    return ['host-mind', 'host-karn'];
  }
}

// Helper to toggle connect status
export function toggleUserConnect(userId: string): { isConnected: boolean; countDelta: number } {
  if (typeof window === 'undefined') return { isConnected: true, countDelta: 1 };
  try {
    const list = getConnectedUserIds();
    const alreadyConnected = list.includes(userId);
    let updated: string[];
    let delta = 0;

    if (alreadyConnected) {
      updated = list.filter((id) => id !== userId);
      delta = -1;
    } else {
      updated = [...list, userId];
      delta = 1;
    }

    localStorage.setItem('connectedUserIds', JSON.stringify(updated));
    return { isConnected: !alreadyConnected, countDelta: delta };
  } catch (e) {
    return { isConnected: true, countDelta: 1 };
  }
}

// Helper to find profile by ID or name
export function findProfileByIdOrName(query: string): UserProfile {
  const clean = query.trim().toLowerCase();
  if (clean === 'me' || clean.includes('jirathitigorn') || clean.includes('คุณ')) {
    if (clean.includes('มายด์') || clean.includes('mind')) return MOCK_PROFILES['host-mind'];
    if (clean.includes('กานต์') || clean.includes('karn')) return MOCK_PROFILES['host-karn'];
    if (clean.includes('น็อต') || clean.includes('nut')) return MOCK_PROFILES['host-nut'];
    if (clean.includes('ส้ม') || clean.includes('som')) return MOCK_PROFILES['host-som'];
    return MOCK_PROFILES['me'];
  }
  return MOCK_PROFILES[query] || MOCK_PROFILES['host-mind'] || MOCK_PROFILES['me'];
}
