// =========================================================================
// 🌿 Chill & Connect Hub: Master Data Hub (Single Source of Truth)
// =========================================================================
// This file defines the permanent, unified Master Categories and Taxonomy
// across all 3 Discovery Pillars + Quests, used consistently in:
// - Category Rails (SpotCategoryRail, CommunityCategoryRail, FairCategoryRail)
// - Creation Modals (CreateEventModal, SpotBuddyGatheringModal, AdminCreateEventModal)
// - Search & Filter Drawers (FilterDrawer, MoodFilterChips)
// - Data Entities (spotsData, mockData, chill_database)
// =========================================================================

import {
  Mountain,
  Waves,
  Trees,
  Coffee,
  Landmark,
  Palette,
  Sparkles,
  Building2,
  Music,
  Flame,
  ShoppingBag,
  Dices,
  Laptop,
  HeartHandshake,
  LucideIcon,
  MicVocal,
  PartyPopper,
  Trophy,
  Utensils,
  Gamepad2,
  HeartPulse,
  Drama,
  BookOpen,
  Tent,
  House,
  PawPrint,
  Car,
  Clapperboard,
  Disc3,
  Gem,
  HandHeart,
  Camera,
  ChefHat,
  Sunset,
  TreeDeciduous,
  Flower2,
  Library,
  Store,
  Martini,
  FerrisWheel,
} from 'lucide-react';

// =========================================================================
// 1. 🌲 MASTER SPOT VIBE CATEGORIES (พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด)
// =========================================================================
export type SpotVibeId =
  | 'mountain_mist'
  | 'sea_island'
  | 'nature_camping'
  | 'cafe_slowbar'
  | 'oldtown_culture'
  | 'art_creative'
  | 'wellness_retreat'
  | 'views_rooftop'
  | 'city_parks'
  | 'temple_mu'
  | 'museum_learning'
  | 'food_street'
  | 'market_walking'
  | 'nightlife_bars'
  | 'fun_activities'
  | 'shopping_mall';

export interface MasterSpotCategory {
  id: SpotVibeId;
  name: string;
  nameEn: string;
  iconChar: string;
  icon: LucideIcon;
  colorScheme: {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    border: string;
  };
  keywords: string[];
  description: string;
}

export const MASTER_SPOT_CATEGORIES: MasterSpotCategory[] = [
  {
    id: 'mountain_mist',
    name: 'ภูเขา & ทะเลหมอก',
    nameEn: 'Mountain & Mist',
    iconChar: '🌄',
    icon: Mountain,
    colorScheme: {
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      border: 'border-emerald-200',
    },
    keywords: ['ดอย', 'เขา', 'mountain', 'หมอก', 'viewpoint', 'จุดชมวิว', 'ภู', 'สันป่าเกี๊ยะ', 'ม่อน', 'ยอดดอย'],
    description: 'ยอดดอย ทะเลหมอกยามเช้า จุดชมวิวภูเขา และอากาศบริสุทธิ์',
  },
  {
    id: 'sea_island',
    name: 'ทะเล & เกาะสวย',
    nameEn: 'Sea & Islands',
    iconChar: '🌊',
    icon: Waves,
    colorScheme: {
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-sky-700',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-800',
      border: 'border-sky-200',
    },
    keywords: ['ทะเล', 'หาด', 'เกาะ', 'beach', 'island', 'sea', 'อ่าว', 'กระบี่', 'ภูเก็ต', 'สมุย', 'พัทยา', 'หัวหิน', 'ชายหาด'],
    description: 'ชายหาด เกาะส่วนตัว เสียงคลื่น จุดชมพระอาทิตย์ตกริมทะเล',
  },
  {
    id: 'nature_camping',
    name: 'ป่า น้ำตก & กางเต็นท์',
    nameEn: 'Nature & Camping',
    iconChar: '🌿',
    icon: Trees,
    colorScheme: {
      iconBg: 'bg-teal-100/70',
      iconColor: 'text-teal-700',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-800',
      border: 'border-teal-200',
    },
    keywords: ['ป่า', 'สวน', 'park', 'nature', 'อุทยาน', 'แคมปิ้ง', 'camping', 'น้ำตก', 'ล่องแก่ง', 'อ่างเก็บน้ำ', 'ลานกางเต็นท์'],
    description: 'อุทยานแห่งชาติ ป่าเขียวขจี น้ำตก ลานกางเต็นท์ และกิจกรรมเอาต์ดอร์',
  },
  {
    id: 'views_rooftop',
    name: 'จุดชมวิว & รูฟท็อป',
    nameEn: 'Views & Rooftops',
    iconChar: '',
    icon: Sunset,
    colorScheme: {
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-700',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-800',
      border: 'border-orange-200',
    },
    keywords: ['จุดชมวิว', 'viewpoint', 'sunset', 'พระอาทิตย์ตก', 'rooftop', 'รูฟท็อป', 'วิวเมือง', 'skywalk'],
    description: 'จุดชมพระอาทิตย์ตก วิวเมือง จุดชมวิวริมน้ำ และดาดฟ้าวิวสวย',
  },
  {
    id: 'city_parks',
    name: 'สวน & พื้นที่สีเขียวในเมือง',
    nameEn: 'City Parks',
    iconChar: '',
    icon: TreeDeciduous,
    colorScheme: {
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      border: 'border-emerald-200',
    },
    keywords: ['สวนสาธารณะ', 'park', 'สวนพฤกษศาสตร์', 'ปิกนิก', 'picnic', 'green space'],
    description: 'สวนสาธารณะ สวนพฤกษศาสตร์ ลานปิกนิก และทางเดินเขียวๆ กลางเมือง',
  },
  {
    id: 'temple_mu',
    name: 'วัด & สายมู',
    nameEn: 'Temples & Lucky Spots',
    iconChar: '',
    icon: Flower2,
    colorScheme: {
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      border: 'border-amber-200',
    },
    keywords: ['วัด', 'temple', 'ศาลเจ้า', 'พระธาตุ', 'เจดีย์', 'ขอพร', 'สายมู', 'ไหว้พระ', 'shrine'],
    description: 'วัดสวย ศาลเจ้า พระธาตุ และจุดขอพรสายมู',
  },
  {
    id: 'oldtown_culture',
    name: 'ย่านเก่า & วิถีชุมชน',
    nameEn: 'Old Town & Heritage',
    iconChar: '🏮',
    icon: Landmark,
    colorScheme: {
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-700',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-800',
      border: 'border-orange-200',
    },
    keywords: ['ย่านเก่า', 'old town', 'oldtown', 'ชุมชน', 'วัด', 'temple', 'ประวัติศาสตร์', 'อยุธยา', 'เมืองเก่า', 'ตลาดน้ำ', 'สถาปัตย์'],
    description: 'สถาปัตยกรรมคลาสสิก ชุมชนดั้งเดิม ตลาดเก่า และมนต์เสน่ห์ประวัติศาสตร์',
  },
  {
    id: 'museum_learning',
    name: 'พิพิธภัณฑ์ & แหล่งเรียนรู้',
    nameEn: 'Museums & Learning',
    iconChar: '',
    icon: Library,
    colorScheme: {
      iconBg: 'bg-blue-100/70',
      iconColor: 'text-blue-700',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-800',
      border: 'border-blue-200',
    },
    keywords: ['พิพิธภัณฑ์', 'museum', 'มิวเซียม', 'ศูนย์วิทยาศาสตร์', 'science', 'อควาเรียม', 'aquarium', 'แหล่งเรียนรู้', 'ท้องฟ้าจำลอง'],
    description: 'พิพิธภัณฑ์ ศูนย์วิทยาศาสตร์ อควาเรียม และแหล่งเรียนรู้',
  },
  {
    id: 'art_creative',
    name: 'หอศิลป์ & สเปซศิลปะ',
    nameEn: 'Art & Creative Hubs',
    iconChar: '🎨',
    icon: Palette,
    colorScheme: {
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-700',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-800',
      border: 'border-purple-200',
    },
    keywords: ['art', 'ศิลปะ', 'หอศิลป์', 'museum', 'มิวเซียม', 'แกลเลอรี', 'gallery', 'craft', 'คราฟต์', 'นิทรรศการ', 'ครีเอทีฟ'],
    description: 'หอศิลป์ แกลเลอรีผลงานศิลปะ มิวเซียม และสเปซงานคราฟต์ร่วมสมัย',
  },
  {
    id: 'cafe_slowbar',
    name: 'คาเฟ่ & สเปซนั่งชิลล์',
    nameEn: 'Cafe & Slow Bar',
    iconChar: '☕',
    icon: Coffee,
    colorScheme: {
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      border: 'border-amber-200',
    },
    keywords: ['cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'slow bar', 'เบเกอรี่', 'tea', 'ชา', 'matcha', 'มัทฉะ', 'สโลว์บาร์'],
    description: 'กาแฟ Specialty ดริปสโลว์บาร์ คาเฟ่แสงสวย และที่นั่งอ่านหนังสือชิลล์ๆ',
  },
  {
    id: 'food_street',
    name: 'ร้านอร่อย & สตรีทฟู้ด',
    nameEn: 'Food & Street Food',
    iconChar: '',
    icon: Utensils,
    colorScheme: {
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-700',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-800',
      border: 'border-rose-200',
    },
    keywords: ['ร้านอาหาร', 'restaurant', 'สตรีทฟู้ด', 'street food', 'ก๋วยเตี๋ยว', 'ร้านข้าว', 'ภัตตาคาร', 'โอมากาเสะ', 'อาหารท้องถิ่น'],
    description: 'ร้านดังประจำเมือง สตรีทฟู้ด และอาหารท้องถิ่นที่ต้องลอง',
  },
  {
    id: 'market_walking',
    name: 'ตลาด & ถนนคนเดิน',
    nameEn: 'Markets & Walking Streets',
    iconChar: '',
    icon: Store,
    colorScheme: {
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-700',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-800',
      border: 'border-orange-200',
    },
    keywords: ['ตลาด', 'market', 'ถนนคนเดิน', 'walking street', 'ตลาดน้ำ', 'ตลาดนัด', 'night market'],
    description: 'ตลาดนัดกลางคืน ตลาดน้ำ ถนนคนเดิน และตลาดชุมชน',
  },
  {
    id: 'nightlife_bars',
    name: 'บาร์ & ไนท์ไลฟ์',
    nameEn: 'Bars & Nightlife',
    iconChar: '',
    icon: Martini,
    colorScheme: {
      iconBg: 'bg-indigo-100/70',
      iconColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-800',
      border: 'border-indigo-200',
    },
    keywords: ['บาร์', 'bar', 'ผับ', 'pub', 'ค็อกเทล', 'cocktail', 'speakeasy', 'ไนท์ไลฟ์', 'nightlife', 'ดนตรีสด'],
    description: 'บาร์ค็อกเทล รูฟท็อปบาร์ บาร์ดนตรีสด และย่านกลางคืน',
  },
  {
    id: 'fun_activities',
    name: 'สวนสนุก & กิจกรรม',
    nameEn: 'Fun & Activities',
    iconChar: '',
    icon: FerrisWheel,
    colorScheme: {
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-sky-700',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-800',
      border: 'border-sky-200',
    },
    keywords: ['สวนสนุก', 'theme park', 'สวนน้ำ', 'water park', 'สวนสัตว์', 'zoo', 'ซาฟารี', 'โกคาร์ท', 'go-kart', 'โบว์ลิ่ง', 'bowling', 'escape room'],
    description: 'สวนสนุก สวนน้ำ สวนสัตว์ โกคาร์ท โบว์ลิ่ง และห้องปริศนา',
  },
  {
    id: 'shopping_mall',
    name: 'ช้อปปิ้ง & ไลฟ์สไตล์มอลล์',
    nameEn: 'Shopping & Lifestyle Malls',
    iconChar: '',
    icon: ShoppingBag,
    colorScheme: {
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-700',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-800',
      border: 'border-purple-200',
    },
    keywords: ['ห้างสรรพสินค้า', 'มอลล์', 'mall', 'community mall', 'ช้อปปิ้ง', 'shopping', 'ร้านดีไซน์'],
    description: 'คอมมูนิตี้มอลล์ ไลฟ์สไตล์มอลล์ และร้านดีไซน์',
  },
  {
    id: 'wellness_retreat',
    name: 'สปา & จุดฮีลใจ',
    nameEn: 'Wellness & Healing',
    iconChar: '✨',
    icon: Sparkles,
    colorScheme: {
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-700',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-800',
      border: 'border-rose-200',
    },
    keywords: ['heal', 'ฮีลใจ', 'wellness', 'สปา', 'น้ำพุร้อน', 'onsen', 'สมาธิ', 'ผ่อนคลาย', 'บำบัด', 'โยคะ', 'รีทรีต'],
    description: 'สปาออนเซ็น แหล่งน้ำพุร้อนธรรมชาติ พื้นที่ฝึกสมาธิ และจุดฟื้นฟูจิตใจ',
  },
];

// =========================================================================
// 2. 👥 MASTER COMMUNITY CATEGORIES (กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่)
// =========================================================================
export type CommunityMoodId = 'chill' | 'move' | 'heal' | 'learn';

export interface MasterCommunityMood {
  id: CommunityMoodId;
  label: string;
  iconChar: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    dotColor: string;
    accent: string;
  };
}

export const MASTER_COMMUNITY_MOODS: MasterCommunityMood[] = [
  {
    id: 'chill',
    label: 'จิบกาแฟ & ชิลล์',
    iconChar: '☕',
    colorScheme: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dotColor: 'bg-amber-500',
      accent: '#F26430',
    },
  },
  {
    id: 'move',
    label: 'ขยับกาย & กีฬา',
    iconChar: '🏃',
    colorScheme: {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      dotColor: 'bg-orange-500',
      accent: '#EA580C',
    },
  },
  {
    id: 'heal',
    label: 'ฮีลใจ & สมาธิ',
    iconChar: '🌱',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dotColor: 'bg-emerald-500',
      accent: '#4A7C59',
    },
  },
  {
    id: 'learn',
    label: 'ศิลปะ & เวิร์กช็อป',
    iconChar: '🎨',
    colorScheme: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      dotColor: 'bg-purple-500',
      accent: '#7C3AED',
    },
  },
];

// 8 Sub-Lifestyles for Community Discovery Rail
export interface MasterCommunityLifestyleCategory {
  id: string;
  name: string;
  nameEn: string;
  desc: string;
  iconChar: string;
  icon: LucideIcon;
  coreMood: CommunityMoodId;
  colorScheme: {
    badgeBg: string;
    badgeText: string;
    borderHover: string;
    borderBottom: string;
    iconBg: string;
    iconColor: string;
    activeBg: string;
  };
  keywords: string[];
}

export const MASTER_COMMUNITY_LIFESTYLE_CATEGORIES: MasterCommunityLifestyleCategory[] = [
  {
    id: 'cafe_social',
    name: 'คาเฟ่ & นั่งชิล',
    nameEn: 'Cafes & Hangouts',
    desc: 'คาเฟ่ฮอปปิ้ง นั่งคุย นั่งทำงานด้วยกัน บรันช์',
    iconChar: '',
    icon: Coffee,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      borderHover: 'hover:border-amber-400',
      borderBottom: 'border-b-amber-500',
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-600',
      activeBg: 'bg-amber-500 text-white',
    },
    keywords: ['คาเฟ่', 'cafe', 'coffee', 'กาแฟ', 'matcha', 'มัทฉะ', 'ชิล', 'ชิลล์', 'chill', 'จิบชา', 'coworking', 'นั่งทำงาน', 'brunch', 'บรันช์', 'พบปะ', 'เพื่อนใหม่', 'introvert'],
  },
  {
    id: 'food_hunt',
    name: 'ตะลุยกิน & ร้านเด็ด',
    nameEn: 'Food Hunting',
    desc: 'ตะลุยกินเยาวราช สตรีทฟู้ด โอมากาเสะ ชาบู หมูกระทะ',
    iconChar: '',
    icon: Utensils,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      borderHover: 'hover:border-orange-400',
      borderBottom: 'border-b-orange-500',
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-600',
      activeBg: 'bg-orange-500 text-white',
    },
    keywords: ['ตะลุยกิน', 'กิน', 'food', 'foodie', 'street food', 'สตรีทฟู้ด', 'ร้านอาหาร', 'ร้านเด็ด', 'omakase', 'โอมากาเสะ', 'บุฟเฟต์', 'buffet', 'หมูกระทะ', 'ชาบู', 'ปิ้งย่าง', 'ของกิน', 'food tour'],
  },
  {
    id: 'movies_music',
    name: 'ดูหนัง ฟังเพลง & คอนเสิร์ต',
    nameEn: 'Movies, Music & Concerts',
    desc: 'หาเพื่อนไปคอนเสิร์ต ดูหนังอินดี้ เทศกาลดนตรี แผ่นเสียง',
    iconChar: '',
    icon: Clapperboard,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      borderHover: 'hover:border-purple-400',
      borderBottom: 'border-b-purple-500',
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-600',
      activeBg: 'bg-purple-500 text-white',
    },
    keywords: ['ดูหนัง', 'ภาพยนตร์', 'movie', 'movies', 'cinema', 'film', 'คอนเสิร์ต', 'concert', 'ดนตรี', 'music', 'เพลง', 'vinyl', 'แผ่นเสียง', 'jazz', 'แจ๊ส', 'live music', 'guitar', 'กีตาร์', 'karaoke', 'คาราโอเกะ', 'เดี่ยวไมโครโฟน', 'stand-up'],
  },
  {
    id: 'running_fitness',
    name: 'ชวนวิ่ง & ฟิตเนส',
    nameEn: 'Running & Fitness',
    desc: 'ชวนวิ่ง ซิตี้รัน HYROX บอดี้เวท ปีนผา ปั่นจักรยาน',
    iconChar: '',
    icon: Flame,
    coreMood: 'move',
    colorScheme: {
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      borderHover: 'hover:border-orange-400',
      borderBottom: 'border-b-orange-500',
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-600',
      activeBg: 'bg-orange-500 text-white',
    },
    keywords: ['วิ่ง', 'run', 'running', 'runner', 'marathon', 'มาราธอน', 'hyrox', 'fitness', 'ฟิตเนส', 'gym', 'ยิม', 'workout', 'บอดี้เวท', 'bodyweight', 'ปีน', 'climbing', 'bouldering', 'crossfit', 'pilates', 'พิลาทิส', 'ออกกำลังกาย', 'ปั่นจักรยาน', 'cycling', 'bike'],
  },
  {
    id: 'bars_nightlife',
    name: 'บาร์ & ไนท์ไลฟ์',
    nameEn: 'Bars & Nightlife',
    // Thai law: 20+ only, and nothing that invites drinking (no brands, no "มาดื่ม"); describe the night out, not the drink
    desc: 'บาร์ดนตรีสด รูฟท็อป สปีกอีซี่ ไนท์คลับ สำหรับอายุ 20 ปีขึ้นไป',
    iconChar: '',
    icon: Martini,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-slate-50',
      badgeText: 'text-slate-700',
      borderHover: 'hover:border-slate-400',
      borderBottom: 'border-b-slate-500',
      iconBg: 'bg-slate-100/70',
      iconColor: 'text-slate-600',
      activeBg: 'bg-slate-500 text-white',
    },
    keywords: ['ไปบาร์', 'บาร์ค็อกเทล', 'บาร์ดนตรีสด', 'รูฟท็อปบาร์', 'แจ๊สบาร์', 'ผับ', 'ไนท์ไลฟ์', 'ไนท์คลับ', 'สปีกอีซี่', 'ค็อกเทล', 'คราฟต์เบียร์', 'bar', 'bars', 'pub', 'nightlife', 'nightclub', 'rooftop bar', 'speakeasy', 'cocktail', 'craft beer', 'bar hopping', 'party', 'ปาร์ตี้'],
  },
  {
    id: 'boardgames_party',
    name: 'บอร์ดเกม & เกมกลุ่ม',
    nameEn: 'Board Games & Parties',
    desc: 'บอร์ดเกม Werewolf ควิซไนต์ เกมไนต์',
    iconChar: '',
    icon: Dices,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      borderHover: 'hover:border-sky-400',
      borderBottom: 'border-b-sky-500',
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-sky-600',
      activeBg: 'bg-sky-500 text-white',
    },
    keywords: ['บอร์ดเกม', 'board game', 'board games', 'boardgame', 'boardgames', 'werewolf', 'มาเฟีย', 'pub quiz', 'quiz', 'ควิซ', 'trivia', 'game night', 'เกมไนต์'],
  },
  {
    id: 'travel_outdoor',
    name: 'ท่องเที่ยว & เอาต์ดอร์',
    nameEn: 'Travel & Outdoors',
    desc: 'ทริปวันเดียว เดินป่า แคมป์ปิ้ง ทะเล พายซับบอร์ด',
    iconChar: '',
    icon: Trees,
    coreMood: 'move',
    colorScheme: {
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700',
      borderHover: 'hover:border-teal-400',
      borderBottom: 'border-b-teal-500',
      iconBg: 'bg-teal-100/70',
      iconColor: 'text-teal-600',
      activeBg: 'bg-teal-500 text-white',
    },
    keywords: ['เที่ยว', 'ท่องเที่ยว', 'travel', 'trip', 'ทริป', 'เดินป่า', 'hiking', 'hike', 'trekking', 'camping', 'แคมป์', 'camp', 'ทะเล', 'beach', 'ดำน้ำ', 'diving', 'snorkel', 'ซับบอร์ด', 'sup', 'kayak', 'พายเรือ', 'ภูเขา', 'น้ำตก', 'ธรรมชาติ', 'nature', 'watersports', 'water sports', 'เดินเล่น', 'ปิกนิก', 'picnic', 'สวน'],
  },
  {
    id: 'sports_club',
    name: 'กีฬาทีม & แร็กเกต',
    nameEn: 'Team & Racket Sports',
    desc: 'แบดมินตัน พิกเคิลบอล ฟุตซอล เทนนิส บาส',
    iconChar: '',
    icon: Trophy,
    coreMood: 'move',
    colorScheme: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      borderHover: 'hover:border-amber-400',
      borderBottom: 'border-b-amber-500',
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-600',
      activeBg: 'bg-amber-500 text-white',
    },
    keywords: ['แบดมินตัน', 'แบด', 'badminton', 'pickleball', 'พิกเคิลบอล', 'tennis', 'เทนนิส', 'ฟุตบอล', 'football', 'futsal', 'ฟุตซอล', 'บาส', 'basketball', 'วอลเลย์', 'volleyball', 'ปิงปอง', 'table tennis', 'padel', 'กอล์ฟ', 'golf', 'แร็กเกต'],
  },
  {
    id: 'photo_content',
    name: 'ถ่ายรูป & ทำคอนเทนต์',
    nameEn: 'Photography & Content',
    desc: 'โฟโต้วอล์ก กล้องฟิล์ม แต่งรูป ทำคอนเทนต์ด้วยกัน',
    iconChar: '',
    icon: Camera,
    coreMood: 'learn',
    colorScheme: {
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      borderHover: 'hover:border-sky-400',
      borderBottom: 'border-b-sky-500',
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-sky-600',
      activeBg: 'bg-sky-500 text-white',
    },
    keywords: ['ถ่ายรูป', 'ถ่ายภาพ', 'photo', 'photography', 'photowalk', 'photo walk', 'street photo', 'streetphoto', 'กล้อง', 'camera', 'ฟิล์ม', 'analog film', 'darkroom', 'content', 'คอนเทนต์', 'creator', 'vlog', 'tiktok', 'reels'],
  },
  {
    id: 'gaming_anime',
    name: 'วิดีโอเกม อนิเมะ & ป๊อปคัลเจอร์',
    nameEn: 'Games, Anime & Pop Culture',
    desc: 'เล่นวิดีโอเกมด้วยกัน อนิเมะ คอสเพลย์ แฟนคลับ K-pop อาร์ตทอย',
    iconChar: '',
    icon: Gamepad2,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      borderHover: 'hover:border-indigo-400',
      borderBottom: 'border-b-indigo-500',
      iconBg: 'bg-indigo-100/70',
      iconColor: 'text-indigo-600',
      activeBg: 'bg-indigo-500 text-white',
    },
    keywords: ['เกม', 'game', 'games', 'gaming', 'esports', 'อนิเมะ', 'anime', 'manga', 'มังงะ', 'cosplay', 'คอสเพลย์', 'k-pop', 'kpop', 'idol', 'ไอดอล', 'art toy', 'อาร์ตทอย', 'figure', 'otaku', 'การ์ตูน', 'comic'],
  },
  {
    id: 'arts_crafts',
    name: 'ศิลปะ & งานคราฟต์',
    nameEn: 'Arts & Crafts',
    desc: 'ปั้นเซรามิก วาดรูป เครื่องหนัง เทอราเรียม งานปัก',
    iconChar: '',
    icon: Palette,
    coreMood: 'learn',
    colorScheme: {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      borderHover: 'hover:border-purple-400',
      borderBottom: 'border-b-purple-500',
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-600',
      activeBg: 'bg-purple-500 text-white',
    },
    keywords: ['ศิลปะ', 'art', 'arts', 'อาร์ต', 'แกลเลอรี', 'gallery', 'นิทรรศการ', 'painting', 'วาดรูป', 'วาด', 'ระบายสี', 'pottery', 'เซรามิก', 'ceramic', 'ปั้น', 'craft', 'คราฟต์', 'handmade', 'งานฝีมือ', 'leather', 'leatherwork', 'เครื่องหนัง', 'หนังแท้', 'terrarium', 'เทอราเรียม', 'จัดสวน', 'ดอกไม้', 'flower', 'candle', 'เทียนหอม', 'embroidery', 'ปักผ้า'],
  },
  {
    id: 'wellness_mind',
    name: 'ฮีลใจ & สมาธิ',
    nameEn: 'Mind & Wellness',
    desc: 'นั่งสมาธิ โยคะ ซาวด์ฮีลลิ่ง อโรมา เขียนบันทึก',
    iconChar: '',
    icon: Sparkles,
    coreMood: 'heal',
    colorScheme: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderHover: 'hover:border-emerald-400',
      borderBottom: 'border-b-emerald-500',
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-600',
      activeBg: 'bg-emerald-500 text-white',
    },
    keywords: ['สมาธิ', 'meditation', 'mindfulness', 'โยคะ', 'yoga', 'ฮีลใจ', 'ฮีล', 'healing', 'sound healing', 'sound bath', 'aromatherapy', 'อโรมา', 'บำบัด', 'therapy', 'ผ่อนคลาย', 'retreat', 'breathwork', 'journaling'],
  },
  {
    id: 'dance_move',
    name: 'เต้น & ขยับ',
    nameEn: 'Dance',
    desc: 'คัฟเวอร์แดนซ์ K-pop ซุมบ้า โซเชียลแดนซ์ ซัลซ่า',
    iconChar: '',
    icon: Disc3,
    coreMood: 'move',
    colorScheme: {
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      borderHover: 'hover:border-rose-400',
      borderBottom: 'border-b-rose-500',
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-600',
      activeBg: 'bg-rose-500 text-white',
    },
    keywords: ['เต้น', 'dance', 'dancing', 'zumba', 'ซุมบ้า', 'cover dance', 'salsa', 'ซัลซ่า', 'bachata', 'swing', 'social dance', 'hip hop'],
  },
  {
    id: 'cooking_baking',
    name: 'ทำอาหาร & เบเกอรี่',
    nameEn: 'Cooking & Baking',
    desc: 'อบซาวร์โดว์ คลาสทำอาหาร ทำขนม',
    iconChar: '',
    icon: ChefHat,
    coreMood: 'learn',
    colorScheme: {
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      borderHover: 'hover:border-orange-400',
      borderBottom: 'border-b-orange-500',
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-600',
      activeBg: 'bg-orange-500 text-white',
    },
    keywords: ['ทำอาหาร', 'cooking', 'cook', 'baking', 'bake', 'เบเกอรี่', 'bakery', 'ขนมปัง', 'sourdough', 'ซาวร์โดว์', 'อบขนม', 'ทำขนม'],
  },
  {
    id: 'pets_family',
    name: 'สัตว์เลี้ยง & คนรักสัตว์',
    nameEn: 'Pets & Animal Lovers',
    desc: 'พาน้องหมาเดินเล่น คาเฟ่แมว นัดเจอคนรักสัตว์',
    iconChar: '',
    icon: HeartHandshake,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      borderHover: 'hover:border-rose-400',
      borderBottom: 'border-b-rose-500',
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-600',
      activeBg: 'bg-rose-500 text-white',
    },
    keywords: ['สัตว์เลี้ยง', 'น้องหมา', 'สุนัข', 'แมว', 'ทาสแมว', 'pet', 'pets', 'dog', 'dogs', 'cat cafe', 'ครอบครัว', 'family', 'kids'],
  },
  {
    id: 'beauty_selfcare',
    name: 'บิวตี้ & แฟชั่น',
    nameEn: 'Beauty & Fashion',
    desc: 'เวิร์กช็อปแต่งหน้า สกินแคร์ ทริปช้อปมือสอง แฟชั่น',
    iconChar: '',
    icon: Gem,
    coreMood: 'heal',
    colorScheme: {
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      borderHover: 'hover:border-rose-400',
      borderBottom: 'border-b-rose-500',
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-600',
      activeBg: 'bg-rose-500 text-white',
    },
    keywords: ['บิวตี้', 'beauty', 'แต่งหน้า', 'makeup', 'skincare', 'สกินแคร์', 'แฟชั่น', 'fashion', 'แต่งตัว', 'thrift', 'มือสอง', 'ช้อปปิ้ง', 'shopping', 'nail', 'ทำเล็บ', 'น้ำหอม', 'perfume', 'self-care', 'selfcare', 'ดูแลตัวเอง'],
  },
  {
    id: 'books_language',
    name: 'หนังสือ & ภาษา',
    nameEn: 'Books & Languages',
    desc: 'บุ๊คคลับ นัดอ่านหนังสือเงียบๆ แลกเปลี่ยนภาษา',
    iconChar: '',
    icon: BookOpen,
    coreMood: 'learn',
    colorScheme: {
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      borderHover: 'hover:border-blue-400',
      borderBottom: 'border-b-blue-500',
      iconBg: 'bg-blue-100/70',
      iconColor: 'text-blue-600',
      activeBg: 'bg-blue-500 text-white',
    },
    keywords: ['หนังสือ', 'book', 'books', 'book club', 'reading', 'อ่าน', 'ภาษา', 'language', 'language exchange', 'ฝึกภาษา', 'english'],
  },
  {
    id: 'tech_skills',
    name: 'อาชีพ เทค & การเงิน',
    nameEn: 'Career, Tech & Money',
    desc: 'วางแผนการเงิน ลงทุน เขียนโค้ด AI งานเสริม',
    iconChar: '',
    icon: Laptop,
    coreMood: 'learn',
    colorScheme: {
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      borderHover: 'hover:border-indigo-400',
      borderBottom: 'border-b-indigo-500',
      iconBg: 'bg-indigo-100/70',
      iconColor: 'text-indigo-600',
      activeBg: 'bg-indigo-500 text-white',
    },
    keywords: ['ai', 'coding', 'code', 'developer', 'hack night', 'tech', 'startup', 'เทคโนโลยี', 'การเงิน', 'ลงทุน', 'หุ้น', 'finance', 'invest', 'investing', 'investor', 'ภาษี', 'career', 'อาชีพ', 'side hustle', 'freelance', 'networking'],
  },
  {
    id: 'volunteer',
    name: 'จิตอาสา & ทำดี',
    nameEn: 'Volunteering',
    desc: 'เก็บขยะชายหาด ช่วยงานบ้านสัตว์ ปลูกป่า',
    iconChar: '',
    icon: HandHeart,
    coreMood: 'heal',
    colorScheme: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderHover: 'hover:border-emerald-400',
      borderBottom: 'border-b-emerald-500',
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-600',
      activeBg: 'bg-emerald-500 text-white',
    },
    keywords: ['จิตอาสา', 'อาสา', 'volunteer', 'volunteering', 'เก็บขยะ', 'beach clean', 'cleanup', 'clean up', 'ปลูกป่า', 'ปลูกต้นไม้', 'บริจาค', 'charity'],
  },
];

// =========================================================================
// 3. 🏛️ MASTER FAIRS & VENUES (งานมหกรรม & ศูนย์จัดแสดงชั้นนำ)
// =========================================================================
export interface MasterFairCategory {
  id: string;
  name: string;
  nameEn: string;
  iconChar: string;
  icon: LucideIcon;
  colorScheme: {
    iconBg: string;
    iconColor: string;
  };
  keywords: string[];
}

export const MASTER_FAIR_CATEGORIES: MasterFairCategory[] = [
  {
    id: 'parks_openair',
    name: 'คอนเสิร์ต & แฟนมีต',
    nameEn: 'Concerts & Fan Meetings',
    iconChar: '',
    icon: MicVocal,
    colorScheme: {
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-700',
    },
    keywords: ['คอนเสิร์ต', 'concert', 'แฟนมีต', 'fan meet', 'fanmeet', 'fancon', 'world tour', 'asia tour', 'live', 'ไลฟ์', 'ดนตรี', 'music', 'มิวสิค', 'jazz', 'แจ๊ส', 'showcase', 'recital'],
  },
  {
    id: 'music_festivals',
    name: 'เทศกาลดนตรี',
    nameEn: 'Music Festivals',
    iconChar: '',
    icon: PartyPopper,
    colorScheme: {
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-700',
    },
    keywords: ['เทศกาลดนตรี', 'music festival', 'music fest', 'มิวสิคเฟสติวัล', 'เฟสติวัลดนตรี', 'wonderfruit', 'big mountain', 's2o', 'summer sonic', 'rolling loud', 'edc', 'edm', 'rave', 'electronic festival', 'ดนตรีในสวน'],
  },
  {
    id: 'marathon_sports',
    name: 'งานวิ่ง',
    nameEn: 'Running',
    iconChar: '',
    icon: Flame,
    colorScheme: {
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-700',
    },
    keywords: ['วิ่ง', 'run', 'running', 'runner', 'marathon', 'มาราธอน', 'fun run', 'trail', 'เทรล', 'ultra'],
  },
  {
    id: 'sports_esports',
    name: 'กีฬา & อีสปอร์ต',
    nameEn: 'Sports & E-sports',
    iconChar: '',
    icon: Trophy,
    colorScheme: {
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
    },
    keywords: ['กีฬา', 'sport', 'sports', 'esport', 'esports', 'e-sport', 'e-sports', 'อีสปอร์ต', 'ไตรกีฬา', 'triathlon', 'ปั่นจักรยาน', 'cycling', 'ride', 'แข่งขัน', 'tournament', 'championship', 'มวย', 'boxing', 'muay', 'ฟุตบอล', 'football', 'บาสเกตบอล', 'basketball', 'วอลเลย์บอล', 'volleyball', 'กอล์ฟ', 'golf', 'ว่ายน้ำ', 'swim'],
  },
  {
    id: 'food_drinks',
    name: 'อาหาร & เครื่องดื่ม',
    nameEn: 'Food & Drinks',
    iconChar: '',
    icon: Utensils,
    colorScheme: {
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-700',
    },
    keywords: ['อาหาร', 'food', 'กาแฟ', 'coffee', 'drink', 'drinks', 'เครื่องดื่ม', 'beer', 'เบียร์', 'wine', 'ไวน์', 'tea', 'ชานม', 'ชาไทย', 'ขนม', 'dessert', 'bakery', 'เบเกอรี่', 'street food', 'chef', 'เชฟ', 'buffet', 'บุฟเฟต์', 'gastronomy'],
  },
  {
    id: 'craft_market',
    name: 'ตลาด & คราฟต์',
    nameEn: 'Markets & Crafts',
    iconChar: '',
    icon: ShoppingBag,
    colorScheme: {
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-700',
    },
    keywords: ['craft', 'crafting', 'คราฟต์', 'ตลาด', 'market', 'flea', 'handmade', 'ทำมือ', 'vintage', 'วินเทจ', 'มือสอง', 'thrift'],
  },
  {
    id: 'pop_culture',
    name: 'การ์ตูน เกม & ป๊อปคัลเจอร์',
    nameEn: 'Comics, Games & Pop Culture',
    iconChar: '',
    icon: Gamepad2,
    colorScheme: {
      iconBg: 'bg-indigo-100/70',
      iconColor: 'text-indigo-700',
    },
    keywords: ['game', 'games', 'gaming', 'เกม', 'comic', 'comics', 'การ์ตูน', 'anime', 'อนิเมะ', 'manga', 'มังงะ', 'cosplay', 'คอสเพลย์', 'toy', 'toys', 'art toy', 'อาร์ตทอย', 'figure', 'ฟิกเกอร์', 'otaku', 'idol'],
  },
  {
    id: 'art_festivals',
    name: 'ศิลปะ & นิทรรศการ',
    nameEn: 'Art & Exhibitions',
    iconChar: '',
    icon: Palette,
    colorScheme: {
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-700',
    },
    keywords: ['art', 'arts', 'ศิลปะ', 'ศิลป์', 'design week', 'biennale', 'นิทรรศการ', 'gallery', 'แกลเลอรี', 'museum', 'พิพิธภัณฑ์', 'photo', 'ภาพถ่าย'],
  },
  {
    id: 'wellness',
    name: 'สุขภาพ & เวลเนส',
    nameEn: 'Health & Wellness',
    iconChar: '',
    icon: HeartPulse,
    colorScheme: {
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-700',
    },
    keywords: ['สุขภาพ', 'health', 'healthy', 'wellness', 'เวลเนส', 'wellbeing', 'longevity', 'อายุยืน', 'anti-aging', 'anti aging', 'ชะลอวัย', 'yoga', 'โยคะ', 'meditation', 'สมาธิ', 'spa', 'สปา', 'beauty', 'ความงาม', 'nutrition', 'โภชนาการ', 'supplement', 'healing', 'retreat', 'รีทรีต', 'ออร์แกนิก', 'organic'],
  },
  {
    id: 'performing_arts',
    name: 'ละครเวที & การแสดง',
    nameEn: 'Theatre & Shows',
    iconChar: '',
    icon: Drama,
    colorScheme: {
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-sky-700',
    },
    keywords: ['ละคร', 'musical', 'musicals', 'มิวสิคัล', 'stand-up', 'stand up', 'standup', 'ทอล์คโชว์', 'เดี่ยวไมโครโฟน', 'ballet', 'บัลเลต์', 'dance', 'การแสดง', 'theatre', 'theater', 'โขน', 'circus', 'magic show'],
  },
  {
    id: 'books_learning',
    name: 'หนังสือ & การเรียนรู้',
    nameEn: 'Books & Learning',
    iconChar: '',
    icon: BookOpen,
    colorScheme: {
      iconBg: 'bg-blue-100/70',
      iconColor: 'text-blue-700',
    },
    keywords: ['หนังสือ', 'book', 'books', 'workshop', 'เวิร์คช็อป', 'เวิร์กช็อป', 'talk', 'เสวนา', 'สัมมนา', 'การศึกษา', 'education', 'learning', 'ศึกษาต่อ', 'career', 'job fair', 'งานอาชีพ'],
  },
  {
    id: 'heritage_local',
    name: 'เทศกาล & ประเพณี',
    nameEn: 'Festivals & Traditions',
    iconChar: '',
    icon: Landmark,
    colorScheme: {
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
    },
    keywords: ['ประเพณี', 'กาชาด', 'เกษตรแฟร์', 'งานวัด', 'heritage', 'วัฒนธรรม', 'ประจำปี', 'สมโภช', 'สงกรานต์', 'songkran', 'ลอยกระทง', 'loy krathong', 'countdown', 'เคานต์ดาวน์', 'light festival', 'เทศกาลไฟ', 'เทศกาล', 'festival'],
  },
  {
    id: 'travel_outdoor',
    name: 'ท่องเที่ยว & เอาท์ดอร์',
    nameEn: 'Travel & Outdoors',
    iconChar: '',
    icon: Tent,
    colorScheme: {
      iconBg: 'bg-teal-100/70',
      iconColor: 'text-teal-700',
    },
    keywords: ['ท่องเที่ยว', 'เที่ยว', 'travel', 'tourism', 'แคมป์', 'camp', 'camping', 'แคมปิ้ง', 'outdoor', 'เอาท์ดอร์', 'dive', 'diving', 'ดำน้ำ', 'trekking', 'เดินป่า', 'hotel', 'โรงแรม'],
  },
  {
    id: 'home_lifestyle',
    name: 'บ้าน & ไลฟ์สไตล์',
    nameEn: 'Home & Lifestyle',
    iconChar: '',
    icon: House,
    colorScheme: {
      iconBg: 'bg-teal-100/70',
      iconColor: 'text-teal-700',
    },
    keywords: ['บ้าน', 'home', 'furniture', 'เฟอร์นิเจอร์', 'decor', 'ตกแต่ง', 'living', 'garden', 'wedding', 'แต่งงาน', 'baby', 'แม่และเด็ก', 'mom', 'lifestyle', 'ไลฟ์สไตล์', 'fashion', 'แฟชั่น'],
  },
  {
    id: 'pets',
    name: 'สัตว์เลี้ยง',
    nameEn: 'Pets',
    iconChar: '',
    icon: PawPrint,
    colorScheme: {
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
    },
    keywords: ['สัตว์เลี้ยง', 'pet', 'pets', 'สุนัข', 'หมา', 'แมว', 'dog', 'dogs', 'cat', 'cats'],
  },
  {
    id: 'tech_motor',
    name: 'ไอที รถยนต์ & เทคโนโลยี',
    nameEn: 'Tech & Motor',
    iconChar: '',
    icon: Car,
    colorScheme: {
      iconBg: 'bg-slate-100/70',
      iconColor: 'text-slate-700',
    },
    keywords: ['ไอที', 'tech', 'technology', 'เทคโนโลยี', 'gadget', 'commart', 'คอมมาร์ท', 'motor', 'มอเตอร์', 'รถยนต์', 'car', 'cars', 'ev', 'บิ๊กไบค์', 'ai', 'startup'],
  },
  {
    id: 'convention_centers',
    name: 'งานแฟร์ & เอ็กซ์โป',
    nameEn: 'Fairs & Expos',
    iconChar: '',
    icon: Building2,
    colorScheme: {
      iconBg: 'bg-blue-100/70',
      iconColor: 'text-blue-700',
    },
    keywords: ['expo', 'เอ็กซ์โป', 'แฟร์', 'fair', 'มหกรรม', 'งานแสดงสินค้า', 'trade show', 'congress', 'conference', 'ประชุม'],
  },
];

export interface MasterVenueOption {
  id: string;
  label: string;
  tag: 'qsncc' | 'bitec' | 'impact' | 'marathon' | 'park';
  transitHint: string;
  location: string;
  /** Defaults to กรุงเทพฯ when left out */
  province?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
}

export const MASTER_VENUE_OPTIONS: MasterVenueOption[] = [
  {
    id: 'qsncc',
    label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
    tag: 'qsncc',
    transitHint: 'MRT ศูนย์การประชุมแห่งชาติสิริกิติ์ ทางออก 3',
    location: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
  },
  {
    id: 'bitec',
    label: 'ไบเทค บางนา (BITEC)',
    tag: 'bitec',
    transitHint: 'BTS บางนา ทางออก 1 (Skywalk เชื่อมเข้าอาคาร)',
    location: 'ศูนย์นิทรรศการและการประชุมไบเทค บางนา',
  },
  {
    id: 'impact',
    label: 'อิมแพ็ค เมืองทองธานี (IMPACT)',
    tag: 'impact',
    transitHint: 'MRT สายสีชมพู สถานีอิมแพ็คเมืองทองธานี / รถตู้ปรับอากาศ',
    location: 'อิมแพ็ค เมืองทองธานี อาคารชาเลนเจอร์ / เอ็กซิบิชั่น ฮอลล์',
  },
  {
    id: 'bacc',
    label: 'หอศิลปวัฒนธรรมแห่งกรุงเทพฯ (BACC)',
    tag: 'park',
    transitHint: 'BTS สนามกีฬาแห่งชาติ ทางออก 3 (Skybridge เข้าหอศิลป์)',
    location: 'หอศิลปวัฒนธรรมแห่งกรุงเทพมหานคร สี่แยกปทุมวัน',
  },
  // Venues that recur in the scraped อีเวนต์ (concerts, fairs, runs, fights), added 2026-10-30.
  // Coordinates are the main entrance as best known; check them with the map link in admin before relying on them
  {
    id: 'impact_arena',
    label: 'อิมแพ็ค อารีน่า เมืองทองธานี',
    tag: 'impact',
    transitHint: 'MRT สายสีชมพู สถานีอิมแพ็คเมืองทองธานี',
    location: 'อิมแพ็ค อารีน่า เมืองทองธานี ถนนป๊อปปูล่า',
    province: 'นนทบุรี',
    latitude: 13.9127,
    longitude: 100.5483,
  },
  {
    id: 'thunder_dome',
    label: 'ธันเดอร์โดม เมืองทองธานี',
    tag: 'impact',
    transitHint: 'MRT สายสีชมพู สถานีอิมแพ็คเมืองทองธานี',
    location: 'ธันเดอร์โดม สเตเดียม เมืองทองธานี',
    province: 'นนทบุรี',
  },
  {
    id: 'rajamangala',
    label: 'ราชมังคลากีฬาสถาน',
    tag: 'park',
    transitHint: 'Airport Rail Link รามคำแหง แล้วต่อรถ / รถเมล์สายรามคำแหง',
    location: 'ราชมังคลากีฬาสถาน การกีฬาแห่งประเทศไทย หัวหมาก',
    latitude: 13.7556,
    longitude: 100.6224,
  },
  {
    id: 'supachalasai',
    label: 'สนามศุภชลาศัย (สนามกีฬาแห่งชาติ)',
    tag: 'park',
    transitHint: 'BTS สนามกีฬาแห่งชาติ ทางออก 2',
    location: 'สนามศุภชลาศัย ถนนพระรามที่ 1 ปทุมวัน',
    latitude: 13.7465,
    longitude: 100.5294,
  },
  {
    id: 'lumpinee_boxing',
    label: 'สนามมวยเวทีลุมพินี',
    tag: 'park',
    transitHint: 'BTS สายสีเขียว สะพานใหม่ แล้วต่อรถไปถนนรามอินทรา',
    location: 'สนามมวยเวทีลุมพินี ถนนรามอินทรา',
  },
  {
    id: 'rbsc',
    label: 'ราชกรีฑาสโมสร (RBSC)',
    tag: 'marathon',
    transitHint: 'BTS ราชดำริ ทางออก 2 / MRT สีลม',
    location: 'ราชกรีฑาสโมสร ถนนอังรีดูนังต์ ปทุมวัน',
    latitude: 13.7395,
    longitude: 100.5367,
  },
  {
    id: 'iconsiam',
    label: 'ไอคอนสยาม & ทรู ไอคอน ฮอลล์',
    tag: 'park',
    transitHint: 'BTS สายสีทอง สถานีเจริญนคร / เรือข้ามฟากจากท่าสาทร',
    location: 'ไอคอนสยาม ถนนเจริญนคร คลองสาน',
    latitude: 13.7267,
    longitude: 100.5101,
  },
  {
    id: 'paragon_hall',
    label: 'รอยัล พารากอน ฮอลล์',
    tag: 'park',
    transitHint: 'BTS สยาม (เชื่อมเข้าห้างโดยตรง)',
    location: 'รอยัล พารากอน ฮอลล์ ชั้น 5 สยามพารากอน',
    latitude: 13.7462,
    longitude: 100.5348,
    image: '/images/venues/paragon.jpg',
  },
  {
    id: 'centralworld',
    label: 'ลานหน้าเซ็นทรัลเวิลด์',
    tag: 'park',
    transitHint: 'BTS ชิดลม ทางออก 6 (Skywalk) / BTS สยาม',
    location: 'ลานหน้าศูนย์การค้าเซ็นทรัลเวิลด์ ราชประสงค์',
    latitude: 13.7466,
    longitude: 100.5393,
  },
  {
    id: 'uob_live',
    label: 'ยูโอบี ไลฟ์ เอ็มสเฟียร์ (UOB LIVE)',
    tag: 'park',
    transitHint: 'BTS พร้อมพงษ์ ทางออก 6',
    location: 'UOB LIVE ชั้น 6 ศูนย์การค้าเอ็มสเฟียร์ สุขุมวิท',
    latitude: 13.7312,
    longitude: 100.5684,
  },
  {
    id: 'union_hall',
    label: 'ยูเนี่ยน ฮอลล์ ยูเนี่ยนมอลล์',
    tag: 'park',
    transitHint: 'MRT พหลโยธิน / BTS ห้าแยกลาดพร้าว',
    location: 'ยูเนี่ยน ฮอลล์ ชั้น 6 ยูเนี่ยนมอลล์ ลาดพร้าว',
    latitude: 13.8136,
    longitude: 100.5614,
  },
  {
    id: 'samyan_mitrtown_hall',
    label: 'สามย่านมิตรทาวน์ ฮอลล์',
    tag: 'park',
    transitHint: 'MRT สามย่าน ทางออก 2 (เชื่อมเข้าอาคาร)',
    location: 'สามย่านมิตรทาวน์ ฮอลล์ ชั้น 5 ถนนพระรามที่ 4',
    latitude: 13.7334,
    longitude: 100.5284,
  },
  {
    id: 'thailand_cultural_centre',
    label: 'ศูนย์วัฒนธรรมแห่งประเทศไทย',
    tag: 'park',
    transitHint: 'MRT ศูนย์วัฒนธรรมแห่งประเทศไทย ทางออก 1',
    location: 'หอประชุมใหญ่ ศูนย์วัฒนธรรมแห่งประเทศไทย ถนนรัชดาภิเษก',
    latitude: 13.7661,
    longitude: 100.5701,
  },
  {
    id: 'chulalongkorn',
    label: 'จุฬาลงกรณ์มหาวิทยาลัย & อุทยาน 100 ปี',
    tag: 'park',
    transitHint: 'MRT สามย่าน / BTS สนามกีฬาแห่งชาติ',
    location: 'จุฬาลงกรณ์มหาวิทยาลัย ปทุมวัน',
  },
  {
    id: 'benjakitti_park',
    label: 'สวนเบญจกิติ',
    tag: 'marathon',
    transitHint: 'MRT ศูนย์การประชุมแห่งชาติสิริกิติ์ ทางออก 3 / BTS อโศก',
    location: 'สวนเบญจกิติ ถนนรัชดาภิเษก คลองเตย',
    latitude: 13.7296,
    longitude: 100.5583,
    image: '/images/venues/benjakitti.jpg',
  },
  {
    id: 'lumpini_park',
    label: 'สวนลุมพินี',
    tag: 'marathon',
    transitHint: 'MRT ลุมพินี / MRT สีลม / BTS ศาลาแดง',
    location: 'สวนลุมพินี ถนนพระรามที่ 4 ปทุมวัน',
    latitude: 13.7307,
    longitude: 100.5418,
  },
  {
    id: 'vachirabenjatas_park',
    label: 'สวนวชิรเบญจทัศ (สวนรถไฟ)',
    tag: 'marathon',
    transitHint: 'MRT สวนจตุจักร / BTS หมอชิต',
    location: 'สวนวชิรเบญจทัศ จตุจักร',
    latitude: 13.8106,
    longitude: 100.553,
  },
  {
    id: 'sanam_luang',
    label: 'ท้องสนามหลวง',
    tag: 'park',
    transitHint: 'MRT สนามไชย ทางออก 1',
    location: 'ท้องสนามหลวง พระนคร',
    latitude: 13.755,
    longitude: 100.4928,
  },
  {
    id: 'cmecc',
    label: 'ศูนย์ประชุมและแสดงสินค้านานาชาติ เชียงใหม่ (CMECC)',
    tag: 'park',
    transitHint: 'รถแดงหรือรถรับจ้างจากตัวเมืองเชียงใหม่',
    location: 'ศูนย์ประชุมและแสดงสินค้านานาชาติฯ ถนนคลองชลประทาน เชียงใหม่',
    province: 'เชียงใหม่',
  },
  {
    id: 'kice',
    label: 'ศูนย์ประชุมและแสดงสินค้านานาชาติ ขอนแก่น (KICE)',
    tag: 'park',
    transitHint: 'รถรับจ้างหรือรถส่วนตัวจากตัวเมืองขอนแก่น',
    location: 'ขอนแก่น อินเตอร์เนชั่นแนล คอนเวนชั่น แอนด์ เอ็กซิบิชั่น เซ็นเตอร์',
    province: 'ขอนแก่น',
    image: '/images/venues/kice.webp',
  },
  {
    id: 'peach_pattaya',
    label: 'ศูนย์ประชุมพีช พัทยา (PEACH)',
    tag: 'park',
    transitHint: 'รถสองแถวสายพัทยาใต้ / รถรับจ้าง',
    location: 'Pattaya Exhibition and Convention Hall โรงแรมรอยัล คลิฟ พัทยา',
    province: 'ชลบุรี',
  },
  {
    id: 'chang_arena',
    label: 'ช้าง อารีนา & สนามช้าง อินเตอร์เนชั่นแนล เซอร์กิต',
    tag: 'marathon',
    transitHint: 'รถรับจ้างหรือรถส่วนตัวจากตัวเมืองบุรีรัมย์',
    location: 'ช้าง อารีนา ถนนบุรีรัมย์-ประโคนชัย บุรีรัมย์',
    province: 'บุรีรัมย์',
  },
  {
    id: 'other',
    label: 'ศูนย์จัดแสดง / พื้นที่สาธารณะอื่นๆ',
    tag: 'park',
    transitHint: 'เดินทางสะดวกด้วยระบบขนส่งสาธารณะ',
    location: 'พื้นที่จัดแสดงสาธารณะ',
  },
];

// =========================================================================
// 4. 📍 MASTER 77 PROVINCES & POPULAR REGIONS
// =========================================================================
export const MASTER_77_PROVINCES: string[] = [
  'กรุงเทพฯ', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี',
  'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม',
  'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์',
  'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พังงา', 'พัทลุง', 'พิจิตร',
  'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'พะเยา', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน',
  'ยะลา', 'ยโสธร', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ',
  'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
  'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อุดรธานี',
  'อุทัยธานี', 'อุตรดิตถ์', 'อุบลราชธานี', 'อำนาจเจริญ'
];

export const MASTER_POPULAR_PROVINCE_TAGS = [
  { id: 'all', label: 'ทั่วประเทศ' },
  { id: 'bangkok', label: 'กรุงเทพฯ', name: 'กรุงเทพฯ' },
  { id: 'chiangmai', label: 'เชียงใหม่', name: 'เชียงใหม่' },
  { id: 'chonburi', label: 'ชลบุรี / พัทยา', name: 'ชลบุรี' },
  { id: 'khaoyai', label: 'เขาใหญ่ / โคราช', name: 'นครราชสีมา' },
  { id: 'phuket', label: 'ภูเก็ต', name: 'ภูเก็ต' },
  { id: 'nan', label: 'น่าน', name: 'น่าน' },
  { id: 'kanchanaburi', label: 'กาญจนบุรี', name: 'กาญจนบุรี' },
  { id: 'ayutthaya', label: 'อยุธยา', name: 'อยุธยา' },
  { id: 'huahin', label: 'หัวหิน / ประจวบฯ', name: 'ประจวบคีรีขันธ์' },
  { id: 'krabi', label: 'กระบี่', name: 'กระบี่' },
  { id: 'samui', label: 'สุราษฎร์ฯ / สมุย', name: 'สุราษฎร์ธานี' },
  { id: 'khonkaen', label: 'ขอนแก่น', name: 'ขอนแก่น' },
];

// =========================================================================
// 5. ⚡ MASTER QUEST / CHALLENGE CATEGORIES (ชาเลนจ์ & ภารกิจท้าทาย)
// =========================================================================
export interface MasterQuestCategory {
  id: string;
  name: string;
  /** What kind of challenge belongs here, shown to staff */
  desc: string;
  /** A key of ICON_OPTIONS in lib/masterData.ts */
  iconKey: string;
}

/**
 * A challenge's category says what it is about, the way a visitor would look for it.
 * (How it is counted and what it gives are separate: the rule and the reward.)
 * Staff add, rename and switch categories off in the admin console; these are the ones every install starts with.
 */
export const MASTER_QUEST_CATEGORIES: MasterQuestCategory[] = [
  { id: 'cafe_food', name: 'คาเฟ่ & ของอร่อย', desc: 'ตระเวนคาเฟ่ ร้านอาหาร และตลาด', iconKey: 'Coffee' },
  { id: 'active_outdoor', name: 'ออกกำลัง & กลางแจ้ง', desc: 'วิ่ง เดิน ปั่น ฟิตเนส และสวนสาธารณะ', iconKey: 'Dumbbell' },
  { id: 'art_learn', name: 'ศิลปะ & เรียนรู้', desc: 'แกลเลอรี พิพิธภัณฑ์ งานหนังสือ และเวิร์กช็อป', iconKey: 'Palette' },
  { id: 'wellness', name: 'ฮีลใจ & ดูแลตัวเอง', desc: 'โยคะ สมาธิ และการพักจากหน้าจอ', iconKey: 'Sun' },
  { id: 'social', name: 'พบปะ & ทำด้วยกัน', desc: 'บอร์ดเกม กิจกรรมกลุ่ม และการเจอเพื่อนใหม่', iconKey: 'HeartHandshake' },
  { id: 'travel', name: 'เที่ยว & ต่างจังหวัด', desc: 'ธรรมชาติ วัด จุดชมวิว และเมืองเก่าทั่วไทย', iconKey: 'Mountain' },
];

/**
 * Ids earlier versions used for challenge categories, mapped to today's.
 * Since 2026-10-16 challenges use the community categories (master data communityCategories), as the owner asked.
 */
export const LEGACY_QUEST_CATEGORIES: Record<string, string> = {
  // Challenge topics of 2026-10-13 to 2026-10-15
  cafe_food: 'cafe_social',
  active_outdoor: 'running_fitness',
  art_learn: 'arts_crafts',
  wellness: 'wellness_mind',
  social: 'cafe_social',
  travel: 'travel_outdoor',
  // Moods of the first version
  heal: 'wellness_mind',
  move: 'running_fitness',
  learn: 'arts_crafts',
  chill: 'cafe_social',
  general: 'cafe_social',
  exp_only: 'cafe_social',
  badge_only: 'cafe_social',
  exp_badge: 'cafe_social',
};

/** A challenge's category id as used today: one of the community categories */
export const questCategoryId = (category: string | undefined): string => (category && LEGACY_QUEST_CATEGORIES[category]) || category || 'cafe_social';

// =========================================================================
// 6. 🎯 DETERMINISTIC SINGLE-CATEGORY CLASSIFIERS (1 Card = Exactly 1 Category)
// =========================================================================

/** Which meetup group wins when a title fits several: the most specific first (a photo walk before a walk, a cooking
 * class before a food hunt, board games before games, a dog walk is pets). Anything left is a cafe hangout. */
const MEETUP_MATCH_ORDER = ['tech_skills', 'pets_family', 'volunteer', 'photo_content', 'cooking_baking', 'food_hunt', 'books_language', 'dance_move', 'sports_club', 'running_fitness', 'wellness_mind', 'beauty_selfcare', 'boardgames_party', 'gaming_anime', 'bars_nightlife', 'movies_music', 'arts_crafts', 'travel_outdoor', 'cafe_social'];

/**
 * Maps any community event to EXACTLY ONE of the Community Lifestyle Categories, so category rail counts sum to
 * 100% of cards. Reads the title first, then the host's tag (tags are broad: "🎨 เวิร์กช็อป"), then the old mood.
 */
export function getCommunityEventCategory(event: {
  lifestyleCategory?: string;
  tag?: string;
  title?: string;
  description?: string;
  location?: string;
  category?: string;
}): string {
  if (event.lifestyleCategory) return event.lifestyleCategory;
  for (const text of [event.title, event.tag]) {
    const lower = (text || '').toLowerCase();
    if (!lower) continue;
    for (const id of MEETUP_MATCH_ORDER) {
      const cat = MASTER_COMMUNITY_LIFESTYLE_CATEGORIES.find((c) => c.id === id);
      if (cat?.keywords.some((kw) => keywordHit(lower, kw))) return id;
    }
  }

  // Fallback by legacy coreMood category
  if (event.category === 'move') return 'running_fitness';
  if (event.category === 'heal') return 'wellness_mind';
  if (event.category === 'learn') return 'arts_crafts';
  return 'cafe_social';
}

/** Which fair group wins when a title fits several: the most specific first (a music festival before music,
 * a musical before a concert, healthy food before food, an art toy before art). Anything left is a fair or expo. */
const FAIR_MATCH_ORDER = ['music_festivals', 'pets', 'tech_motor', 'marathon_sports', 'sports_esports', 'performing_arts', 'parks_openair', 'pop_culture', 'wellness', 'food_drinks', 'craft_market', 'home_lifestyle', 'travel_outdoor', 'art_festivals', 'books_learning', 'heritage_local'];

/** Latin words match whole words ("cat" not "catering", "art" not "party"); Thai has no spaces, so it matches inside text */
const keywordHit = (text: string, kw: string) =>
  /^[a-z0-9 &'-]+$/.test(kw) ? new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`).test(text) : text.includes(kw);

/**
 * Maps any major fair or public venue event to EXACTLY ONE of the Master Fair Categories, by what the event is
 * (its title; fair tags are too loose to trust, e.g. a game show tagged as a workshop), never by where it is. Category rail counts sum to 100% of cards.
 * Ids kept from the first version: parks_openair = concerts, marathon_sports = running, heritage_local = festivals.
 */
export function getFairEventCategory(event: {
  fairCategory?: string;
  tag?: string;
  title?: string;
  description?: string;
  venueTag?: string;
  location?: string;
}): string {
  if (event.fairCategory) return event.fairCategory;
  if ((event.venueTag || '').toLowerCase() === 'marathon') return 'marathon_sports';
  const title = (event.title || '').toLowerCase();
  for (const id of FAIR_MATCH_ORDER) {
    const cat = MASTER_FAIR_CATEGORIES.find((c) => c.id === id);
    if (cat?.keywords.some((kw) => keywordHit(title, kw))) return id;
  }
  return 'convention_centers';
}

