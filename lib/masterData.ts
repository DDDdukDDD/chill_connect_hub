import {
  Bike, BookOpen, Building, Building2, Camera, Coffee, Dices, Dumbbell, Flame, Gamepad2, HeartHandshake,
  Landmark, Laptop, LucideIcon, Mountain, Music, Palette, PawPrint, ShoppingBag, Sparkles, Sun, Tent,
  Trees, Utensils, Waves, Wine,
} from 'lucide-react';
import {
  MASTER_COMMUNITY_LIFESTYLE_CATEGORIES, MASTER_COMMUNITY_MOODS, MASTER_FAIR_CATEGORIES, MASTER_POPULAR_PROVINCE_TAGS,
  MASTER_QUEST_CATEGORIES, MASTER_SPOT_CATEGORIES, MASTER_VENUE_OPTIONS, MASTER_77_PROVINCES,
  MasterCommunityLifestyleCategory, MasterCommunityMood, MasterFairCategory, MasterSpotCategory, MasterVenueOption,
  CommunityMoodId, SpotVibeId,
} from '@/data/masterHub';
import { BANGKOK_ZONES } from '@/data/mockData';

/**
 * Editable master data (admin "ข้อมูลหลัก"), stored in data/master_data.json and served by /api/master.
 * Client-safe: types, icon and color presets, the seed built from data/masterHub.ts, and resolvers that turn
 * stored entries back into the shapes the UI already uses (MasterSpotCategory, MasterVenueOption, …).
 *
 * Rules: built-in entries (seeded from code) can be edited and deactivated but not deleted, because code
 * references their ids. Fixed collections (vibes, moods, provinces) cannot gain or lose entries.
 */

// ── Presets the UI can render (Tailwind needs literal class names, so every scheme is spelled out) ──

export const ICON_OPTIONS: Record<string, LucideIcon> = {
  Mountain, Waves, Trees, Coffee, Landmark, Palette, Sparkles, Building, Building2, Flame, ShoppingBag, Dices,
  Laptop, HeartHandshake, Bike, BookOpen, Camera, Dumbbell, Gamepad2, Music, PawPrint, Sun, Tent, Utensils, Wine,
};

export const COLOR_PRESETS = {
  emerald: { label: 'เขียวมรกต', swatch: '#10b981', iconBg: 'bg-emerald-100/70', iconColor: 'text-emerald-700', iconColorStrong: 'text-emerald-600', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-800', badgeTextSoft: 'text-emerald-700', border: 'border-emerald-200', borderHover: 'hover:border-emerald-400', borderBottom: 'border-b-emerald-500', activeBg: 'bg-emerald-500 text-white' },
  teal: { label: 'เขียวน้ำทะเล', swatch: '#14b8a6', iconBg: 'bg-teal-100/70', iconColor: 'text-teal-700', iconColorStrong: 'text-teal-600', badgeBg: 'bg-teal-50', badgeText: 'text-teal-800', badgeTextSoft: 'text-teal-700', border: 'border-teal-200', borderHover: 'hover:border-teal-400', borderBottom: 'border-b-teal-500', activeBg: 'bg-teal-500 text-white' },
  sky: { label: 'ฟ้า', swatch: '#0ea5e9', iconBg: 'bg-sky-100/70', iconColor: 'text-sky-700', iconColorStrong: 'text-sky-600', badgeBg: 'bg-sky-50', badgeText: 'text-sky-800', badgeTextSoft: 'text-sky-700', border: 'border-sky-200', borderHover: 'hover:border-sky-400', borderBottom: 'border-b-sky-500', activeBg: 'bg-sky-500 text-white' },
  blue: { label: 'น้ำเงิน', swatch: '#3b82f6', iconBg: 'bg-blue-100/70', iconColor: 'text-blue-700', iconColorStrong: 'text-blue-600', badgeBg: 'bg-blue-50', badgeText: 'text-blue-800', badgeTextSoft: 'text-blue-700', border: 'border-blue-200', borderHover: 'hover:border-blue-400', borderBottom: 'border-b-blue-500', activeBg: 'bg-blue-500 text-white' },
  indigo: { label: 'คราม', swatch: '#6366f1', iconBg: 'bg-indigo-100/70', iconColor: 'text-indigo-700', iconColorStrong: 'text-indigo-600', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-800', badgeTextSoft: 'text-indigo-700', border: 'border-indigo-200', borderHover: 'hover:border-indigo-400', borderBottom: 'border-b-indigo-500', activeBg: 'bg-indigo-500 text-white' },
  purple: { label: 'ม่วง', swatch: '#a855f7', iconBg: 'bg-purple-100/70', iconColor: 'text-purple-700', iconColorStrong: 'text-purple-600', badgeBg: 'bg-purple-50', badgeText: 'text-purple-800', badgeTextSoft: 'text-purple-700', border: 'border-purple-200', borderHover: 'hover:border-purple-400', borderBottom: 'border-b-purple-500', activeBg: 'bg-purple-500 text-white' },
  rose: { label: 'ชมพู', swatch: '#f43f5e', iconBg: 'bg-rose-100/70', iconColor: 'text-rose-700', iconColorStrong: 'text-rose-600', badgeBg: 'bg-rose-50', badgeText: 'text-rose-800', badgeTextSoft: 'text-rose-700', border: 'border-rose-200', borderHover: 'hover:border-rose-400', borderBottom: 'border-b-rose-500', activeBg: 'bg-rose-500 text-white' },
  orange: { label: 'ส้ม', swatch: '#f97316', iconBg: 'bg-orange-100/70', iconColor: 'text-orange-700', iconColorStrong: 'text-orange-600', badgeBg: 'bg-orange-50', badgeText: 'text-orange-800', badgeTextSoft: 'text-orange-700', border: 'border-orange-200', borderHover: 'hover:border-orange-400', borderBottom: 'border-b-orange-500', activeBg: 'bg-orange-500 text-white' },
  amber: { label: 'เหลืองอำพัน', swatch: '#f59e0b', iconBg: 'bg-amber-100/70', iconColor: 'text-amber-700', iconColorStrong: 'text-amber-600', badgeBg: 'bg-amber-50', badgeText: 'text-amber-800', badgeTextSoft: 'text-amber-700', border: 'border-amber-200', borderHover: 'hover:border-amber-400', borderBottom: 'border-b-amber-500', activeBg: 'bg-amber-500 text-white' },
  slate: { label: 'เทา', swatch: '#64748b', iconBg: 'bg-slate-100/70', iconColor: 'text-slate-700', iconColorStrong: 'text-slate-600', badgeBg: 'bg-slate-50', badgeText: 'text-slate-800', badgeTextSoft: 'text-slate-700', border: 'border-slate-200', borderHover: 'hover:border-slate-400', borderBottom: 'border-b-slate-500', activeBg: 'bg-slate-500 text-white' },
} as const;
export type ColorKey = keyof typeof COLOR_PRESETS;
export const COLOR_KEYS = Object.keys(COLOR_PRESETS) as ColorKey[];

export const REGIONS = ['ภาคกลาง & ตะวันออก', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคใต้'] as const;
export type Region = (typeof REGIONS)[number];
export const VENUE_TAGS = ['qsncc', 'bitec', 'impact', 'marathon', 'park'] as const;

// ── Stored entry types ──

interface MasterBase {
  id: string;
  active: boolean;
  sortOrder: number;
  /** Seeded from code; may be edited and deactivated but never deleted */
  builtIn: boolean;
  updatedAt?: string;
}

export interface MasterCategory extends MasterBase {
  name: string;
  nameEn: string;
  description: string;
  keywords: string[];
  image?: string;
  iconKey: string;
  colorKey: ColorKey;
  /** Community categories: the mood (chill/move/heal/learn) they belong to */
  parentId?: string;
}

export interface MasterVenue extends MasterBase {
  name: string;
  venueTag: (typeof VENUE_TAGS)[number];
  province: string;
  location: string;
  transitHint: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  image?: string;
}

/** id = the province name stored on content (e.g. "กรุงเทพฯ") */
export interface MasterProvince extends MasterBase {
  displayName: string;
  nameEn: string;
  region: Region;
  tagline: string;
  description: string;
  image?: string;
  /** Shown in "จังหวัดยอดนิยม" rails and filters */
  featured: boolean;
}

export interface MasterZone extends MasterBase {
  name: string;
  province: string;
}

/**
 * Image cards of the "Top" rails: community clubs (TopCommunityRail) and venue groups (TopVenuesRail).
 * Each card filters content by its keywords.
 */
export interface MasterFeaturedGroup extends MasterBase {
  name: string;
  nameEn: string;
  subtitle: string;
  image?: string;
  /** Small label on the card, e.g. "Running Crew" */
  badgeLabel?: string;
  keywords: string[];
}

export interface MasterData {
  version: 1;
  updatedAt: string;
  spotVibes: MasterCategory[];
  communityMoods: MasterCategory[];
  communityCategories: MasterCategory[];
  fairCategories: MasterCategory[];
  questCategories: MasterCategory[];
  venues: MasterVenue[];
  provinces: MasterProvince[];
  zones: MasterZone[];
  communityClubs: MasterFeaturedGroup[];
  venueGroups: MasterFeaturedGroup[];
}

export type CategoryCollection = 'spotVibes' | 'communityMoods' | 'communityCategories' | 'fairCategories' | 'questCategories';
export type MasterCollection = CategoryCollection | 'venues' | 'provinces' | 'zones' | 'communityClubs' | 'venueGroups';
export type MasterEntry = MasterCategory | MasterVenue | MasterProvince | MasterZone | MasterFeaturedGroup;
export const FEATURED_GROUP_COLLECTIONS = ['communityClubs', 'venueGroups'] as const;

export const CATEGORY_COLLECTIONS: CategoryCollection[] = ['spotVibes', 'communityMoods', 'communityCategories', 'fairCategories', 'questCategories'];
/** Collections whose entry list is fixed (code logic maps to exactly these ids) */
export const FIXED_COLLECTIONS: MasterCollection[] = ['spotVibes', 'communityMoods', 'provinces'];

export const COLLECTION_LABELS: Record<MasterCollection, string> = {
  spotVibes: 'vibe ของพิกัดเที่ยว',
  communityMoods: 'อารมณ์ของกิจกรรมคอมมูนิตี้',
  communityCategories: 'หมวดกิจกรรมคอมมูนิตี้',
  fairCategories: 'หมวดงานมหกรรม & เอ็กซ์โป',
  questCategories: 'หมวดชาเลนจ์',
  venues: 'สถานที่จัดงาน',
  provinces: '77 จังหวัด',
  zones: 'โซน / ย่าน',
  communityClubs: 'ชมรมแนะนำ (rail คอมมูนิตี้)',
  venueGroups: 'กลุ่มสถานที่แนะนำ (rail งานแฟร์)',
};

// ── Seed from the code constants ──

const iconKeyOf = (icon: LucideIcon | undefined) =>
  Object.entries(ICON_OPTIONS).find(([, candidate]) => candidate === icon)?.[0] ?? 'Sparkles';

const colorKeyOf = (iconBg: string | undefined): ColorKey => {
  const match = iconBg?.match(/bg-([a-z]+)-/)?.[1];
  return match && match in COLOR_PRESETS ? (match as ColorKey) : 'slate';
};

const stripEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}️?/gu, '').trim();

const MOOD_COLORS: Record<CommunityMoodId, ColorKey> = { chill: 'amber', move: 'orange', heal: 'emerald', learn: 'purple' };
const MOOD_ICONS: Record<CommunityMoodId, string> = { chill: 'Coffee', move: 'Flame', heal: 'Sparkles', learn: 'BookOpen' };

const PROVINCE_REGION_LISTS: Record<Region, string[]> = {
  'ภาคกลาง & ตะวันออก': ['กรุงเทพฯ', 'นนทบุรี', 'ปทุมธานี', 'นครปฐม', 'สมุทรปราการ', 'สมุทรสาคร', 'สมุทรสงคราม', 'สุพรรณบุรี', 'กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'ลพบุรี', 'สระบุรี', 'สิงห์บุรี', 'อ่างทอง', 'พระนครศรีอยุธยา', 'ชัยนาท', 'นครนายก', 'ปราจีนบุรี', 'สระแก้ว', 'ฉะเชิงเทรา', 'ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด'],
  'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'น่าน', 'แพร่', 'พะเยา', 'อุตรดิตถ์', 'ตาก', 'สุโขทัย', 'กำแพงเพชร', 'พิจิตร', 'พิษณุโลก', 'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'],
  'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น', 'นครราชสีมา', 'อุบลราชธานี', 'อุดรธานี', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'ยโสธร', 'อำนาจเจริญ', 'มุกดาหาร', 'สกลนคร', 'นครพนม', 'หนองคาย', 'หนองบัวลำภู', 'เลย', 'ชัยภูมิ', 'กาฬสินธุ์', 'มหาสารคาม', 'ร้อยเอ็ด', 'บึงกาฬ'],
  'ภาคใต้': ['สุราษฎร์ธานี', 'กระบี่', 'ภูเก็ต', 'พังงา', 'ระนอง', 'ชุมพร', 'นครศรีธรรมราช', 'สงขลา', 'พัทลุง', 'ตรัง', 'สตูล', 'ยะลา', 'นราธิวาส', 'ปัตตานี'],
};

// Featured destinations as the homepage rail shows them today (components/TopDestinationsRail.tsx)
const FEATURED_PROVINCES: Record<string, { displayName: string; nameEn: string; tagline: string; image: string }> = {
  'กรุงเทพฯ': { displayName: 'กรุงเทพมหานคร', nameEn: 'Bangkok', tagline: 'เมืองหลวงแห่งคาเฟ่และพื้นที่สีเขียว', image: '/images/destinations/bkk.jpg' },
  'ชลบุรี': { displayName: 'พัทยา • ชลบุรี', nameEn: 'Pattaya / Chonburi', tagline: 'ทะเลใกล้กรุง คาเฟ่ริมหาด และเกาะสีชัง', image: '/images/destinations/chonburi.jpg' },
  'เชียงใหม่': { displayName: 'เชียงใหม่', nameEn: 'Chiang Mai', tagline: 'ดินแดนสโลว์บาร์ ธรรมชาติ และดอยสูง', image: '/images/destinations/chiangmai.jpg' },
  'ภูเก็ต': { displayName: 'ภูเก็ต', nameEn: 'Phuket', tagline: 'ไข่มุกอันดามัน ย่านเมืองเก่าชิโนโปรตุกีส', image: '/images/destinations/phuket.jpg' },
  'ประจวบคีรีขันธ์': { displayName: 'หัวหิน • ประจวบฯ', nameEn: 'Hua Hin / Cha-am', tagline: 'หาดทรายขาว ลมทะเล และอ่างเก็บน้ำเขาเต่า', image: '/images/destinations/huahin.jpg' },
  'กระบี่': { displayName: 'กระบี่', nameEn: 'Krabi', tagline: 'สระมรกต หินผาอ่าวไร่เลย์ และน้ำทะเลใส', image: '/images/destinations/krabi.jpg' },
  'สงขลา': { displayName: 'หาดใหญ่ • สงขลา', nameEn: 'Hat Yai / Songkhla', tagline: 'เมืองเก่าถนนนางงาม วิวเขาคอหงส์ และคาเฟ่ธรรมชาติ', image: '/images/destinations/hatyai.jpg' },
  'กาญจนบุรี': { displayName: 'กาญจนบุรี', nameEn: 'Kanchanaburi', tagline: 'แม่น้ำแคว ป่าเขียวขจี และน้ำตกเอราวัณ', image: '/images/destinations/kanchanaburi.jpg' },
  'นครราชสีมา': { displayName: 'เขาใหญ่ • นครราชสีมา', nameEn: 'Khao Yai / Korat', tagline: 'โอโซนบริสุทธิ์ ฟาร์ม และขุนเขาอันเงียบสงบ', image: '/images/destinations/khaoyai.jpg' },
  'น่าน': { displayName: 'น่าน', nameEn: 'Nan', tagline: 'ทุ่งนาปัว วิถีชีวิตเนิบช้า และขุนเขาเขียวขจี', image: '/images/destinations/nan.jpg' },
  'สุราษฎร์ธานี': { displayName: 'เกาะสมุย • สุราษฎร์ฯ', nameEn: 'Koh Samui / Surat', tagline: 'ทะเลอ่าวไทย เขื่อนเชี่ยวหลาน และเกาะในฝัน', image: '/images/destinations/samui.jpg' },
  'พระนครศรีอยุธยา': { displayName: 'พระนครศรีอยุธยา', nameEn: 'Ayutthaya', tagline: 'เมืองเก่ามรดกโลก คาเฟ่ริมน้ำ และเสน่ห์สยาม', image: '/images/destinations/ayutthaya.jpg' },
};

const VENUE_PROVINCES: Record<string, string> = { impact: 'นนทบุรี' };
const VENUE_IMAGES: Record<string, string> = {
  qsncc: '/images/venues/qsncc.jpg',
  bitec: '/images/venues/bitec.jpg',
  impact: '/images/venues/impact.jpg',
  bacc: '/images/venues/bacc.jpg',
};

// The "Top" rail cards as the public site shows them today (TopCommunityRail / TopVenuesRail).
// Member counts on the club cards were illustrative numbers, so they are not carried over.
const SEED_COMMUNITY_CLUBS: Array<Omit<MasterFeaturedGroup, keyof MasterBase> & { id: string }> = [
  { id: 'ai_tech', name: 'กลุ่ม AI & เทค บิลเดอร์', nameEn: 'Bangkok AI & Tech', subtitle: 'สยาม • สามย่าน • AI, Tech & Coding', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80', badgeLabel: 'AI & Tech', keywords: ['ai', 'tech', 'coding', 'developer', 'startup', 'เทคโนโลยี', 'agent'] },
  { id: 'sport_fitness', name: 'ก๊วนออกกำลังกาย & ฟิตเนส', nameEn: 'Urban Sport & Fitness', subtitle: 'ทองหล่อ • พร้อมพงษ์ • HYROX & Workout', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', badgeLabel: 'Sport & Fitness', keywords: ['fitness', 'hyrox', 'ฟิตเนส', 'ออกกำลังกาย', 'bootcamp', 'weight', 'crossfit'] },
  { id: 'running', name: 'ชมรมวิ่งสวนเบญฯ & ลุมพินี', nameEn: 'Benjakitti Runners', subtitle: 'สวนเบญจกิติ • ลุมพินี • Pace 6.5-7.0', image: '/images/venues/benjakitti.jpg', badgeLabel: 'Running Crew', keywords: ['วิ่ง', 'running', 'marathon', 'จ็อกกิ้ง', 'เบญจกิติ', 'ลุมพินี'] },
  { id: 'climbing', name: 'ก๊วนปีนผาจำลองคนเมือง', nameEn: 'BKK Bouldering Club', subtitle: 'สุขุมวิท 49 • Bouldering & Wall', image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80', badgeLabel: 'Bouldering', keywords: ['climbing', 'ปีนผา', 'bouldering', 'ผาจำลอง'] },
  { id: 'boardgames', name: 'สมาคมบอร์ดเกม & ปาร์ตี้', nameEn: 'Bangkok Board Games', subtitle: 'สยาม • อุดมสุข • Catan & Strategy', image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80', badgeLabel: 'Board Games', keywords: ['board game', 'boardgame', 'บอร์ดเกม', 'catan', 'เกม'] },
  { id: 'coffee', name: 'ตี้สโลว์บาร์ & กาแฟดริป', nameEn: 'Slow Bar & Coffee', subtitle: 'อารีย์ • เจริญกรุง • Drip & Cupping', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80', badgeLabel: 'Slow Bar', keywords: ['cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'slow bar', 'ดริป'] },
  { id: 'wellness', name: 'วงฮีลใจ นั่งสมาธิ & เสียงบำบัด', nameEn: 'Mindful Sound Bath', subtitle: 'พร้อมพงษ์ • สาทร • Sound Bath & Yoga', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80', badgeLabel: 'Sound Healing', keywords: ['sound bath', 'soundbath', 'yoga', 'โยคะ', 'สมาธิ', 'mindfulness', 'heal', 'ฮีลใจ'] },
  { id: 'craft', name: 'ชมรมปั้นเซรามิก & งานคราฟต์', nameEn: 'Clay & Pottery Club', subtitle: 'เอกมัย • พระโขนง • Workshop & Art', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80', badgeLabel: 'Pottery & Craft', keywords: ['workshop', 'เวิร์กช็อป', 'art', 'ศิลปะ', 'craft', 'คราฟต์', 'เซรามิก', 'pottery', 'ปั้นดิน'] },
];

const SEED_VENUE_GROUPS: Array<Omit<MasterFeaturedGroup, keyof MasterBase> & { id: string }> = [
  { id: 'qsncc', name: 'ศูนย์ฯ สิริกิติ์', nameEn: 'QSNCC', subtitle: 'สุขุมวิท • คลองเตย (MRT)', image: '/images/venues/qsncc.jpg', keywords: ['สิริกิติ์', 'qsncc'] },
  { id: 'bitec', name: 'ไบเทค บางนา', nameEn: 'BITEC Bangna', subtitle: 'บางนา • สมุทรปราการ (BTS)', image: '/images/venues/bitec.jpg', keywords: ['ไบเทค', 'bitec'] },
  { id: 'impact', name: 'อิมแพ็ค เมืองทองธานี', nameEn: 'IMPACT Muang Thong', subtitle: 'ชาเลนเจอร์ & อารีนา (MRT)', image: '/images/venues/impact.jpg', keywords: ['อิมแพ็ค', 'impact', 'เมืองทอง'] },
  { id: 'paragon', name: 'พารากอน & ไอคอนสยาม', nameEn: 'Paragon & ICONSIAM', subtitle: 'รอยัล พารากอน & ทรู ไอคอน', image: '/images/venues/paragon.jpg', keywords: ['paragon', 'พารากอน', 'iconsiam', 'ไอคอนสยาม', 'สยาม'] },
  { id: 'bacc', name: 'หอศิลป์ BACC & ย่านอาร์ต', nameEn: 'BACC & Art Spaces', subtitle: 'ปทุมวัน • เจริญกรุง • พระนคร', image: '/images/venues/bacc.jpg', keywords: ['bacc', 'หอศิลป', 'เจริญกรุง', 'ปทุมวัน'] },
  { id: 'park', name: 'สวนสาธารณะ & ลานเมือง', nameEn: 'Parks & Open-Air', subtitle: 'สวนเบญจกิติ • ลุมพินี • รถไฟ', image: '/images/venues/benjakitti.jpg', keywords: ['สวน', 'park', 'สนามหลวง'] },
  { id: 'regional', name: 'ศูนย์ประชุมภูมิภาค', nameEn: 'Regional Mega Centers', subtitle: 'KICE ขอนแก่น • CMECC เชียงใหม่', image: '/images/venues/kice.webp', keywords: ['kice', 'ขอนแก่น', 'cmecc', 'เชียงใหม่', 'สงขลา', 'ภูเก็ต'] },
];

export function buildSeedMasterData(now: string = new Date().toISOString()): MasterData {
  const base = (id: string, index: number): MasterBase => ({ id, active: true, sortOrder: index, builtIn: true });
  const popularProvinces = new Set(MASTER_POPULAR_PROVINCE_TAGS.map((tag) => ('name' in tag ? tag.name : undefined)).filter(Boolean) as string[]);
  return {
    version: 1,
    updatedAt: now,
    spotVibes: MASTER_SPOT_CATEGORIES.map((c, i) => ({
      ...base(c.id, i), name: c.name, nameEn: c.nameEn, description: c.description, keywords: c.keywords,
      iconKey: iconKeyOf(c.icon), colorKey: colorKeyOf(c.colorScheme.iconBg),
    })),
    communityMoods: MASTER_COMMUNITY_MOODS.map((m, i) => ({
      ...base(m.id, i), name: m.label, nameEn: m.id, description: '', keywords: [],
      iconKey: MOOD_ICONS[m.id], colorKey: MOOD_COLORS[m.id],
    })),
    communityCategories: MASTER_COMMUNITY_LIFESTYLE_CATEGORIES.map((c, i) => ({
      ...base(c.id, i), name: c.name, nameEn: c.nameEn, description: c.desc, keywords: c.keywords,
      iconKey: iconKeyOf(c.icon), colorKey: colorKeyOf(c.colorScheme.iconBg), parentId: c.coreMood,
    })),
    fairCategories: MASTER_FAIR_CATEGORIES.map((c, i) => ({
      ...base(c.id, i), name: c.name, nameEn: c.nameEn, description: '', keywords: c.keywords,
      iconKey: iconKeyOf(c.icon), colorKey: colorKeyOf(c.colorScheme.iconBg),
    })),
    questCategories: MASTER_QUEST_CATEGORIES.map((c, i) => ({
      ...base(c.id, i), name: c.name, nameEn: c.id, description: '', keywords: [], iconKey: 'Sparkles', colorKey: 'purple' as ColorKey,
    })),
    venues: MASTER_VENUE_OPTIONS.map((v, i) => ({
      ...base(v.id, i), name: v.label, venueTag: v.tag, province: VENUE_PROVINCES[v.id] ?? 'กรุงเทพฯ',
      location: v.location, transitHint: v.transitHint, image: VENUE_IMAGES[v.id],
    })),
    provinces: MASTER_77_PROVINCES.map((name, i) => {
      const featured = FEATURED_PROVINCES[name];
      const region = (Object.entries(PROVINCE_REGION_LISTS).find(([, list]) => list.includes(name))?.[0] ?? 'ภาคกลาง & ตะวันออก') as Region;
      return {
        ...base(name, i), displayName: featured?.displayName ?? name, nameEn: featured?.nameEn ?? '', region,
        tagline: featured?.tagline ?? '', description: '', image: featured?.image,
        featured: Boolean(featured) || popularProvinces.has(name),
      };
    }),
    zones: BANGKOK_ZONES.map((zone, i) => ({ ...base(zone.id, i), name: zone.label, province: 'กรุงเทพฯ' })),
    communityClubs: SEED_COMMUNITY_CLUBS.map((club, i) => ({ ...base(club.id, i), ...club })),
    venueGroups: SEED_VENUE_GROUPS.map((group, i) => ({ ...base(group.id, i), ...group })),
  };
}

// ── Resolvers: stored entries → the shapes existing UI components consume ──

const byOrder = <T extends MasterBase>(entries: T[]) => [...entries].sort((a, b) => a.sortOrder - b.sortOrder);
const activeOnly = <T extends MasterBase>(entries: T[]) => byOrder(entries.filter((entry) => entry.active));
const iconOf = (key: string) => ICON_OPTIONS[key] ?? Sparkles;
const preset = (key: ColorKey) => COLOR_PRESETS[key] ?? COLOR_PRESETS.slate;

/** Same shape as MASTER_SPOT_CATEGORIES (plus `image`); a built-in keeps its original colors unless recolored */
export function resolveSpotVibes(entries: MasterCategory[]): Array<MasterSpotCategory & { image?: string }> {
  return activeOnly(entries).map((entry) => {
    const original = MASTER_SPOT_CATEGORIES.find((c) => c.id === entry.id);
    const p = preset(entry.colorKey);
    const keepOriginal = original && colorKeyOf(original.colorScheme.iconBg) === entry.colorKey;
    return {
      id: entry.id as SpotVibeId,
      name: entry.name,
      nameEn: entry.nameEn,
      iconChar: original?.iconChar ?? '',
      icon: iconOf(entry.iconKey),
      colorScheme: keepOriginal ? original.colorScheme : { iconBg: p.iconBg, iconColor: p.iconColor, badgeBg: p.badgeBg, badgeText: p.badgeText, border: p.border },
      keywords: entry.keywords,
      description: entry.description,
      image: entry.image,
    };
  });
}

export function resolveCommunityCategories(entries: MasterCategory[]): Array<MasterCommunityLifestyleCategory & { image?: string }> {
  return activeOnly(entries).map((entry) => {
    const original = MASTER_COMMUNITY_LIFESTYLE_CATEGORIES.find((c) => c.id === entry.id);
    const p = preset(entry.colorKey);
    const keepOriginal = original && colorKeyOf(original.colorScheme.iconBg) === entry.colorKey;
    return {
      id: entry.id,
      name: entry.name,
      nameEn: entry.nameEn,
      desc: entry.description,
      iconChar: original?.iconChar ?? '',
      icon: iconOf(entry.iconKey),
      coreMood: (entry.parentId ?? 'chill') as CommunityMoodId,
      colorScheme: keepOriginal ? original.colorScheme : {
        badgeBg: p.badgeBg, badgeText: p.badgeTextSoft, borderHover: p.borderHover, borderBottom: p.borderBottom,
        iconBg: p.iconBg, iconColor: p.iconColorStrong, activeBg: p.activeBg,
      },
      keywords: entry.keywords,
      image: entry.image,
    };
  });
}

export function resolveFairCategories(entries: MasterCategory[]): Array<MasterFairCategory & { image?: string }> {
  return activeOnly(entries).map((entry) => {
    const original = MASTER_FAIR_CATEGORIES.find((c) => c.id === entry.id);
    const p = preset(entry.colorKey);
    const keepOriginal = original && colorKeyOf(original.colorScheme.iconBg) === entry.colorKey;
    return {
      id: entry.id,
      name: entry.name,
      nameEn: entry.nameEn,
      iconChar: original?.iconChar ?? '',
      icon: iconOf(entry.iconKey),
      colorScheme: keepOriginal ? original.colorScheme : { iconBg: p.iconBg, iconColor: p.iconColor },
      keywords: entry.keywords,
      image: entry.image,
    };
  });
}

export function resolveCommunityMoods(entries: MasterCategory[]): Array<Pick<MasterCommunityMood, 'id' | 'label' | 'colorScheme'> & { image?: string }> {
  return activeOnly(entries).map((entry) => {
    const original = MASTER_COMMUNITY_MOODS.find((m) => m.id === entry.id);
    return {
      id: entry.id as CommunityMoodId,
      label: stripEmoji(entry.name),
      colorScheme: original?.colorScheme ?? { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200', dotColor: 'bg-slate-500', accent: 'text-slate-600' },
      image: entry.image,
    };
  });
}

export function resolveVenues(entries: MasterVenue[]): Array<MasterVenueOption & MasterVenue> {
  return activeOnly(entries).map((entry) => ({ ...entry, label: entry.name, tag: entry.venueTag }));
}

export const resolveProvinces = (entries: MasterProvince[]) => activeOnly(entries);
export const resolveFeaturedProvinces = (entries: MasterProvince[]) => activeOnly(entries).filter((entry) => entry.featured);
export const resolveZones = (entries: MasterZone[], province?: string) =>
  activeOnly(entries).filter((zone) => !province || zone.province === province);

/** Same shape as TOP_COMMUNITY_CLUBS in components/TopCommunityRail.tsx (membersCount is left empty) */
export const resolveCommunityClubs = (entries: MasterFeaturedGroup[]) => activeOnly(entries).map((entry) => ({
  id: entry.id, nameEn: entry.nameEn, nameTh: entry.name, subtitle: entry.subtitle, clubKey: entry.id,
  imageUrl: entry.image ?? '', membersCount: '', badgeLabel: entry.badgeLabel ?? '', keywords: entry.keywords,
}));

/** Same shape as TOP_VENUES in components/TopVenuesRail.tsx */
export const resolveVenueGroups = (entries: MasterFeaturedGroup[]) => activeOnly(entries).map((entry) => ({
  id: entry.id, nameEn: entry.nameEn, nameTh: entry.name, subtitle: entry.subtitle, venueKey: entry.id,
  imageUrl: entry.image ?? '', keywords: entry.keywords,
}));

/** URL-safe id from an English or Thai name */
export function slugifyId(text: string): string {
  const slug = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return slug || `item_${Date.now().toString(36)}`;
}
