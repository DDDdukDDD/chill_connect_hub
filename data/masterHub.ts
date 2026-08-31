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
  Flame,
  ShoppingBag,
  Dices,
  Laptop,
  HeartHandshake,
  LucideIcon,
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
  | 'wellness_retreat';

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
    name: 'ป่าธรรมชาติ & กางเต็นท์',
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
    id: 'running_fitness',
    name: 'งานวิ่ง & ฟิตเนส',
    nameEn: 'Running & Fitness',
    desc: 'งานวิ่ง ซิตี้รัน HYROX บอดี้เวท ปีนผา แบดมินตัน',
    iconChar: '🏃',
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
    keywords: ['วิ่ง', 'running', 'marathon', 'hyrox', 'fitness', 'กีฬา', 'sport', 'climbing', 'ปีน', 'badminton'],
  },
  {
    id: 'wellness_mind',
    name: 'ฮีลใจ & สมาธิ',
    nameEn: 'Health & Wellness',
    desc: 'โยคะ Sound Bath นั่งสมาธิ ผ่อนคลายจิตใจ',
    iconChar: '🌱',
    icon: Sparkles,
    coreMood: 'heal',
    colorScheme: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderHover: 'hover:border-emerald-400',
      borderBottom: 'border-b-emerald-500',
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-600',
      activeBg: 'bg-emerald-600 text-white',
    },
    keywords: ['sound bath', 'soundbath', 'yoga', 'โยคะ', 'สมาธิ', 'mindfulness', 'heal', 'ฮีลใจ', 'บำบัด', 'introvert'],
  },
  {
    id: 'cafe_social',
    name: 'คาเฟ่ & พบปะชิลล์',
    nameEn: 'Social & Hangout',
    desc: 'Slow Bar จิบกาแฟ แลกเปลี่ยน สนทนาหาเพื่อนใหม่',
    iconChar: '☕',
    icon: Coffee,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      borderHover: 'hover:border-amber-400',
      borderBottom: 'border-b-amber-500',
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
      activeBg: 'bg-amber-600 text-white',
    },
    keywords: ['cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'slow bar', 'hangout', 'จิบกาแฟ', 'พูดคุย', 'อาหาร', 'tea', 'ชา', 'มัทฉะ'],
  },
  {
    id: 'boardgames_party',
    name: 'บอร์ดเกม & ปาร์ตี้',
    nameEn: 'Board Games & Fun',
    desc: 'ปาร์ตี้บอร์ดเกม เล่นเกมกลุ่ม พูดคุยสนุกสนาน',
    iconChar: '🎲',
    icon: Dices,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      borderHover: 'hover:border-sky-400',
      borderBottom: 'border-b-sky-500',
      iconBg: 'bg-sky-100/70',
      iconColor: 'text-sky-600',
      activeBg: 'bg-sky-600 text-white',
    },
    keywords: ['board game', 'boardgame', 'บอร์ดเกม', 'เกม', 'catan', 'quiz', 'party', 'เกมกลุ่ม', 'เพื่อนใหม่'],
  },
  {
    id: 'arts_crafts',
    name: 'ศิลปะ & งานคราฟต์',
    nameEn: 'Arts & Creative',
    desc: 'ปั้นดิน เซรามิก วาดภาพสีน้ำ เวิร์กช็อปศิลปะ',
    iconChar: '🎨',
    icon: Palette,
    coreMood: 'learn',
    colorScheme: {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      borderHover: 'hover:border-purple-400',
      borderBottom: 'border-b-purple-500',
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-600',
      activeBg: 'bg-purple-600 text-white',
    },
    keywords: ['workshop', 'เวิร์กช็อป', 'art', 'ศิลปะ', 'craft', 'คราฟต์', 'เซรามิก', 'pottery', 'ปั้นดิน', 'painting', 'สีน้ำ', 'เทียน', 'candle', 'ภาพวาด'],
  },
  {
    id: 'travel_outdoor',
    name: 'ท่องเที่ยว & เอาต์ดอร์',
    nameEn: 'Travel & Outdoor',
    desc: 'เดินป่า กางเต็นท์ พายคายัค ซับบอร์ด ถ่ายรูป',
    iconChar: '🌿',
    icon: Trees,
    coreMood: 'move',
    colorScheme: {
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700',
      borderHover: 'hover:border-teal-400',
      borderBottom: 'border-b-teal-500',
      iconBg: 'bg-teal-100/70',
      iconColor: 'text-teal-600',
      activeBg: 'bg-teal-600 text-white',
    },
    keywords: ['outdoor', 'เอาต์ดอร์', 'camping', 'กางเต็นท์', 'เดินป่า', 'คายัค', 'sup board', 'ซับบอร์ด', 'ธรรมชาติ', 'photowalk', 'ถ่ายรูป'],
  },
  {
    id: 'tech_skills',
    name: 'ทักษะ & เทคโนโลยี',
    nameEn: 'Tech & Learning',
    desc: 'Tech Meetup, Coding, AI, ธุรกิจ, เสวนาหนังสือ',
    iconChar: '💻',
    icon: Laptop,
    coreMood: 'learn',
    colorScheme: {
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      borderHover: 'hover:border-indigo-400',
      borderBottom: 'border-b-indigo-500',
      iconBg: 'bg-indigo-100/70',
      iconColor: 'text-indigo-600',
      activeBg: 'bg-indigo-600 text-white',
    },
    keywords: ['tech', 'ai', 'coding', 'developer', 'startup', 'business', 'networking', 'หนังสือ', 'book', 'talk', 'เสวนา'],
  },
  {
    id: 'pets_family',
    name: 'สัตว์เลี้ยง & ครอบครัว',
    nameEn: 'Pets & Family',
    desc: 'พาน้องหมาน้องแมวเที่ยว สังคมคนรักสัตว์ กิจกรรมครอบครัว',
    iconChar: '🐾',
    icon: HeartHandshake,
    coreMood: 'chill',
    colorScheme: {
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      borderHover: 'hover:border-rose-400',
      borderBottom: 'border-b-rose-500',
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-600',
      activeBg: 'bg-rose-600 text-white',
    },
    keywords: ['pet', 'สัตว์เลี้ยง', 'หมา', 'แมว', 'dog', 'cat', 'family', 'ครอบครัว', 'เด็ก', 'kids'],
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
    id: 'convention_centers',
    name: 'ศูนย์ประชุม & ฮอลล์ใหญ่',
    nameEn: 'Convention Centers',
    iconChar: '🏛️',
    icon: Building2,
    colorScheme: {
      iconBg: 'bg-blue-100/70',
      iconColor: 'text-blue-700',
    },
    keywords: ['qsncc', 'สิริกิติ์', 'bitec', 'ไบเทค', 'impact', 'อิมแพ็ค', 'เมืองทอง', 'paragon', 'พารากอน', 'iconsiam', 'ไอคอนสยาม', 'kice', 'cmecc'],
  },
  {
    id: 'art_festivals',
    name: 'เทศกาลเมือง & งานศิลป์',
    nameEn: 'Design & Art Festivals',
    iconChar: '🎨',
    icon: Palette,
    colorScheme: {
      iconBg: 'bg-purple-100/70',
      iconColor: 'text-purple-700',
    },
    keywords: ['design week', 'biennale', 'art', 'ศิลปะ', 'creative', 'เทศกาล', 'festival', 'นิทรรศการ', 'gallery'],
  },
  {
    id: 'marathon_sports',
    name: 'งานวิ่งมาราธอน & กีฬา',
    nameEn: 'Marathons & Sports',
    iconChar: '🏃',
    icon: Flame,
    colorScheme: {
      iconBg: 'bg-orange-100/70',
      iconColor: 'text-orange-700',
    },
    keywords: ['วิ่ง', 'marathon', 'มาราธอน', 'กีฬา', 'sport', 'race', 'ไตรกีฬา', 'triathlon', 'แข่งขัน'],
  },
  {
    id: 'heritage_local',
    name: 'งานประเพณี & งานประจำปี',
    nameEn: 'Local Heritage Fairs',
    iconChar: '🏮',
    icon: Landmark,
    colorScheme: {
      iconBg: 'bg-amber-100/70',
      iconColor: 'text-amber-700',
    },
    keywords: ['ประเพณี', 'กาชาด', 'เกษตรแฟร์', 'งานวัด', 'heritage', 'วัฒนธรรม', 'ประจำปี', 'สมโภช'],
  },
  {
    id: 'craft_market',
    name: 'ตลาดนัด & คราฟต์แฟร์',
    nameEn: 'Creative & Craft Fairs',
    iconChar: '🛍️',
    icon: ShoppingBag,
    colorScheme: {
      iconBg: 'bg-rose-100/70',
      iconColor: 'text-rose-700',
    },
    keywords: ['craft', 'คราฟต์', 'ตลาดนัด', 'market', 'flea market', 'fair', 'แฟร์', 'สินค้าทำมือ', 'art toy', 'อาร์ตทอย'],
  },
  {
    id: 'parks_openair',
    name: 'สวนสาธารณะ & ลานดนตรี',
    nameEn: 'Parks & Open-Air',
    iconChar: '🌳',
    icon: Trees,
    colorScheme: {
      iconBg: 'bg-emerald-100/70',
      iconColor: 'text-emerald-700',
    },
    keywords: ['สวน', 'park', 'ดนตรีในสวน', 'open air', 'คอนเสิร์ต', 'music', 'ลานคนเมือง', 'สนามหลวง'],
  },
];

export interface MasterVenueOption {
  id: string;
  label: string;
  tag: 'qsncc' | 'bitec' | 'impact' | 'marathon' | 'park';
  transitHint: string;
  location: string;
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
}

export const MASTER_QUEST_CATEGORIES: MasterQuestCategory[] = [
  { id: 'general', name: 'ทั่วไป' },
  { id: 'exp_only', name: 'สะสม EXP' },
  { id: 'badge_only', name: 'สะสม Badge' },
  { id: 'exp_badge', name: 'สะสม EXP + Badge' },
];
