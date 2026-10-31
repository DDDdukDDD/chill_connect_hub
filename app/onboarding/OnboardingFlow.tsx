'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarPlus,
  Camera,
  Check,
  Flag,
  FlaskConical,
  HandHeart,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  RotateCcw,
  Store,
  Ticket,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  WalletMinimal,
  type LucideIcon,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { BrandWordmark } from '@/components/BrandWordmark';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { DialogShell } from '@/components/auth/DialogShell';
import { PhraseText } from '@/components/auth/PhraseText';
import type { EventItem } from '@/data/mockData';
import { MASTER_COMMUNITY_LIFESTYLE_CATEGORIES } from '@/data/masterHub';
import { meetupCategoryIcon } from '@/components/icons/CategoryIcons';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { NEW_MEMBER_NAME, nameInitial, reservedNameProblem, tidyDisplayName } from '@/lib/displayName';
import { compressImage } from '@/lib/media/compressor';
import { resolveSpotImage } from '@/lib/spotImageResolver';
import { useMasterData } from '@/lib/useMasterData';
import { memberActions, useMemberSession } from '@/lib/useMemberSession';
import { FIRST_STEP_KEY, FollowRow, flavourFromGoals, isSocialOnly, type FirstStep } from '@/components/home/JourneyBand';

/**
 * Onboarding for new members, continuing the landing hero ("คอมมูนิตี้ของคนชอบออกไปใช้ชีวิต").
 * Three questions (เลือกสิ่งที่ใช่ · บอกเราเกี่ยวกับคุณ · บอกสิ่งที่ชอบ), then the summary ("ออกไปใช้ชีวิตกัน"):
 * real content matching the answers (a ตี้, a ชาเลนจ์, a place or fair, shared moments) and the community
 * pledge, accepted with the summary's one button. The side panel previews live what the answers lead to.
 *
 * Interests and provinces come from admin-managed master data, so answers use the same ids as content.
 * Name and photo go to the member account; other answers stay in localStorage `cch_member_preferences`.
 * Preview mode (/onboarding?preview=1) needs no account and saves nothing.
 */

type OnboardingRole = 'member' | 'host' | 'venue' | 'organizer';
type PillarId = 'spots' | 'community' | 'fairs' | 'challenges' | 'moments';

// Pillar colors are allowed on badges and icons inside cards (DESIGN_SYSTEM.md section 3)
const PILLARS: Record<PillarId, { name: string; short: string; line: string; icon: LucideIcon; color: string; href: string }> = {
  spots: { name: 'พิกัดเที่ยว', short: 'พิกัดเที่ยว', line: 'ที่พักใจ คัดมาแล้ว ทั่วไทย', icon: MapPin, color: '#4A7C59', href: '/spots' },
  community: { name: 'ตี้', short: 'ตี้', line: 'กลุ่มเล็กๆ ของคนที่ชอบ อะไรเหมือนกัน', icon: Users, color: '#F26430', href: '/community' },
  fairs: { name: 'อีเวนต์', short: 'อีเวนต์', line: 'งานใหญ่ ที่ไม่อยากพลาด', icon: Ticket, color: '#2B527A', href: '/events' },
  challenges: { name: 'ชาเลนจ์', short: 'ชาเลนจ์', line: 'ภารกิจสนุกๆ ทำแล้วได้ XP', icon: Trophy, color: '#7C3AED', href: '/challenges' },
  // Moments is where every other pillar ends up: it lights up as soon as the visitor picks anything
  moments: { name: 'โมเมนต์', short: 'โมเมนต์', line: 'เก็บภาพดีๆ แล้วแชร์ให้เพื่อนเห็น', icon: Camera, color: '#F43F5E', href: '/moments' },
};
// Same order as the landing (owner 2026-10-23): the core three first, then places and fairs
const PILLAR_ORDER: PillarId[] = ['community', 'challenges', 'moments', 'spots', 'fairs'];

interface Goal {
  id: string;
  title: string;
  desc: string;
  image: string;
  pillar: PillarId;
  role: OnboardingRole;
  icon?: LucideIcon;
}

// Spaces mark where a line may wrap (see PhraseText)
// One set of six, no Chill / Connect groups since the name became Chillwaa (owner 2026-10-31). The first row is what
// anyone would tick (look at friends' moments, find something fun, join for rewards); the second row is the bigger
// steps (a ตี้ with new people, new places, posting). Moments has two cards because browsing and sharing are different
// reasons to come (owner 2026-10-23: members who only follow friends are a target too).
// Ids kept where the meaning stayed, so answers saved before still read right; `find_friends` is no longer offered
// (folded into the ตี้ card) but still counts for older accounts.
const MEMBER_GOALS: Goal[] = [
  { id: 'browse_moments', title: 'ส่องโมเมนต์ เพื่อนๆ', desc: 'กดใจ คอมเมนต์ ติดตามเพื่อน', image: '/images/onboarding/browse-moments.jpg', pillar: 'moments', role: 'member' },
  { id: 'explore_fairs', title: 'หากิจกรรม สนุกๆ', desc: 'อีเวนต์ งานวิ่ง คอนเสิร์ต', image: '/images/onboarding/fair-festival.jpg', pillar: 'fairs', role: 'member' },
  { id: 'earn_xp', title: 'ร่วมกิจกรรม รับรางวัล', desc: 'ชาเลนจ์ สะสม XP แลกของรางวัล', image: '/images/onboarding/challenge-cheer.jpg', pillar: 'challenges', role: 'member' },
  { id: 'join_community', title: 'เข้าตี้ เจอเพื่อนใหม่', desc: 'กิจกรรมกลุ่มคอเดียวกัน', image: '/event-board-games.png', pillar: 'community', role: 'member' },
  { id: 'explore_spots', title: 'ไปที่ใหม่ๆ', desc: 'คาเฟ่ วิวสวย ทริปสั้นๆ', image: '/images/onboarding/chill-cafe.jpg', pillar: 'spots', role: 'member' },
  { id: 'share_moments', title: 'แชร์ความประทับใจ', desc: 'ไปไหนมา เก็บไว้ให้เพื่อนเห็น', image: '/images/onboarding/share-moment.jpg', pillar: 'moments', role: 'member' },
];

const ALL_GOALS = () => [...MEMBER_GOALS, ...HOST_GOALS];

const HOST_GOALS: Goal[] = [
  { id: 'community_host', title: 'ชวนคน มาเปิดตี้ด้วยกัน', desc: 'นำวิ่ง เปิดวงบอร์ดเกม สอนเวิร์กช็อป', image: '/event-city-run.png', pillar: 'community', role: 'host', icon: CalendarPlus },
  { id: 'venue_space', title: 'มีร้านหรือพื้นที่ อยากให้คนรู้จัก', desc: 'คาเฟ่ สตูดิโอ แกลเลอรี', image: '/images/venues/bacc.jpg', pillar: 'spots', role: 'venue', icon: Store },
  { id: 'event_organizer', title: 'จัดงานอยู่ อยากให้คนมาเยอะขึ้น', desc: 'งานแฟร์ นิทรรศการ งานวิ่ง', image: '/images/venues/bitec.jpg', pillar: 'fairs', role: 'organizer', icon: Ticket },
  { id: 'brand_org', title: 'ทำกิจกรรม ในนามแบรนด์ หรือองค์กร', desc: 'กิจกรรมพนักงาน แคมเปญ ชาเลนจ์', image: '/images/venues/paragon.jpg', pillar: 'challenges', role: 'organizer', icon: Building2 },
];

const GENDERS = [
  { id: '', label: 'ไม่บอก' },
  { id: 'female', label: 'หญิง' },
  { id: 'male', label: 'ชาย' },
  { id: 'lgbtq', label: 'LGBTQ+' },
] as const;

// Three questions, then the summary ("ออกไปใช้ชีวิตกัน") where the pledge is accepted. Words follow the landing hero.
// Order (owner 2026-10-23): two choices first, the form last, when the member has already put something in
const STEPS = ['เลือกสิ่งที่ใช่', 'บอกสิ่งที่ชอบ', 'บอกเราเกี่ยวกับคุณ', 'ออกไปใช้ชีวิตกัน'] as const;
const STEP_LIKES = 1;
const STEP_ABOUT = 2;
const QUESTION_STEPS = 3;

/**
 * Step 3 is the landing's "ดูตี้ตามสายที่ชอบ" cards (owner 2026-10-23): one set, the ตี้ categories, with the
 * สาย that fit the step-1 goals first (`community`). Places and fairs are no longer asked: `spots` / `fairs` here, and
 * SAI_SPOTS / SAI_FAIRS below, stand in for them in suggestions. Ids are master data ids.
 */
const GOAL_INTERESTS: Record<string, { community?: string[]; spots?: string[]; fairs?: string[] }> = {
  explore_fairs: { community: ['movies_music', 'arts_crafts', 'food_hunt'], fairs: ['parks_openair', 'music_festivals', 'food_drinks', 'craft_market', 'art_festivals', 'convention_centers'] },
  explore_spots: { community: ['cafe_social', 'travel_outdoor', 'food_hunt'], spots: ['cafe_slowbar', 'views_rooftop', 'mountain_mist', 'sea_island', 'city_parks', 'food_street'] },
  share_moments: { community: ['photo_content', 'cafe_social', 'food_hunt', 'travel_outdoor'], spots: ['views_rooftop', 'cafe_slowbar'] },
  browse_moments: { community: ['photo_content', 'cafe_social', 'movies_music'], spots: ['views_rooftop', 'art_creative'] },
  join_community: { community: ['running_fitness', 'arts_crafts', 'boardgames_party', 'wellness_mind', 'sports_club', 'cooking_baking'] },
  earn_xp: { community: ['running_fitness', 'photo_content'], spots: ['cafe_slowbar', 'temple_mu'] },
  find_friends: { community: ['cafe_social', 'food_hunt', 'boardgames_party', 'gaming_anime', 'movies_music'] },
  community_host: { community: ['cafe_social', 'running_fitness', 'boardgames_party', 'arts_crafts'] },
  venue_space: { spots: ['cafe_slowbar', 'art_creative'] },
  event_organizer: { fairs: ['convention_centers', 'marathon_sports', 'art_festivals'] },
  brand_org: { community: ['volunteer', 'tech_skills'] },
};
const POPULAR_INTERESTS = { community: ['cafe_social', 'food_hunt', 'boardgames_party', 'running_fitness'], spots: ['cafe_slowbar', 'city_parks', 'sea_island'], fairs: ['music_festivals', 'food_drinks'] };

/** The kinds of places and fairs that go with each สาย (ตี้ category), so suggestions still fit without asking */
export const SAI_SPOTS: Record<string, string[]> = {
  cafe_social: ['cafe_slowbar'], food_hunt: ['food_street', 'market_walking'], boardgames_party: ['fun_activities'],
  gaming_anime: ['fun_activities', 'shopping_mall'], movies_music: ['nightlife_bars'], pets_family: ['city_parks'],
  running_fitness: ['city_parks'], sports_club: ['fun_activities'], dance_move: ['nightlife_bars'],
  travel_outdoor: ['mountain_mist', 'sea_island', 'nature_camping'], wellness_mind: ['wellness_retreat', 'temple_mu'],
  beauty_selfcare: ['wellness_retreat', 'shopping_mall'], volunteer: ['oldtown_culture'], arts_crafts: ['art_creative'],
  photo_content: ['views_rooftop', 'oldtown_culture'], cooking_baking: ['food_street'], books_language: ['museum_learning'],
  tech_skills: ['museum_learning'],
};
export const SAI_FAIRS: Record<string, string[]> = {
  cafe_social: ['food_drinks'], food_hunt: ['food_drinks'], boardgames_party: ['pop_culture'], gaming_anime: ['pop_culture', 'sports_esports'],
  movies_music: ['music_festivals', 'parks_openair'], pets_family: ['pets'], running_fitness: ['marathon_sports'], sports_club: ['sports_esports'],
  dance_move: ['music_festivals'], travel_outdoor: ['travel_outdoor'], wellness_mind: ['wellness'], beauty_selfcare: ['wellness'],
  volunteer: ['heritage_local'], arts_crafts: ['art_festivals', 'craft_market'], photo_content: ['art_festivals'], cooking_baking: ['food_drinks'],
  books_language: ['books_learning'], tech_skills: ['tech_motor'],
};
/** The landing cards' colors per สาย (components/CategoryStickerCards.tsx draws the same) */
const SAI_LOOK = new Map(MASTER_COMMUNITY_LIFESTYLE_CATEGORIES.map((c) => [c.id, c.colorScheme]));

// The community pledge: what every member promises. Accepting it is recorded on the account
// and is the stated ground for suspending an account that breaks it.
const PLEDGE: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserCheck, title: 'เป็นตัวเองจริงๆ', desc: 'ชื่อและรูปเป็นของฉันเอง ไม่แอบอ้างเป็นคนอื่น' },
  { icon: WalletMinimal, title: 'ไม่ขาย ไม่ชวนลงทุน', desc: 'ไม่ใช้ที่นี่ขายของ ขายประกัน ชวนลงทุน หรือปล่อยกู้' },
  { icon: HandHeart, title: 'ให้เกียรติกัน', desc: 'ไม่คุกคาม ไม่กดดัน และเคารพเมื่อใครบอกว่าไม่' },
  { icon: Flag, title: 'ช่วยกันดูแล', desc: 'เห็นสิ่งที่ไม่ปลอดภัย ฉันจะกดรายงานให้ทีมงานรู้' },
];
const MIN_AGE = 18;
/** The side panel shows the number only above this many members who share the สาย; below it, a welcome line (owner 2026-10-23) */
const SAME_PEOPLE_MIN = 1000;
/**
 * "บอกสิ่งที่ชอบ": a fixed example of friends' moments (stories row + one post), drawn like the landing's
 * "เพื่อน & โมเมนต์". Fixed rather than live so it always reads well, even before members post (owner 2026-10-23).
 * Names and photos are illustrations, not members.
 */
// The first story (orange ring) is the person whose post is shown below it
const STORY_SAMPLES = [
  { name: 'แพรว', image: '/images/destinations/chiangmai.jpg', avatar: '/images/onboarding/people/a.jpg' },
  { name: 'บีม', image: '/event-city-run.png', avatar: '/images/onboarding/people/c.jpg' },
  { name: 'ฝน', image: '/images/destinations/krabi.jpg', avatar: '/images/onboarding/people/d.jpg' },
  { name: 'มิว', image: '/event-board-games.png', avatar: '/images/onboarding/people/e.jpg' },
  { name: 'ข้าว', image: '/images/destinations/khaoyai.jpg', avatar: '/images/onboarding/people/f.jpg' },
];
/**
 * "บอกเราเกี่ยวกับคุณ": the example on "โมเมนต์แรกของคุณ" follows the first สาย picked that has one (owner 2026-10-23),
 * so the step carries on from the choices before it; the member's province is added to the caption
 */
const FIRST_MOMENT_DEFAULT = { image: '/images/onboarding/chill-cafe.jpg', caption: 'ออกไปใช้ชีวิตวันแรก กับเพื่อนใหม่ที่คุยกันถูกคอ' };
const FIRST_MOMENT_BY_SAI: Record<string, { image: string; caption: string }> = {
  running_fitness: { image: '/event-city-run.png', caption: 'วิ่งเช้าวันแรกกับเพื่อนใหม่ สดชื่นสุดๆ' },
  cafe_social: { image: '/images/onboarding/chill-cafe.jpg', caption: 'คาเฟ่ใหม่กับเพื่อนใหม่ คุยกันถูกคอ' },
  food_hunt: { image: '/images/onboarding/chill-cafe.jpg', caption: 'ตะลุยกินกับเพื่อนใหม่ ร้านเด็ดทั้งนั้น' },
  boardgames_party: { image: '/event-board-games.png', caption: 'วงบอร์ดเกมวันแรก หัวเราะกันทั้งคืน' },
  travel_outdoor: { image: '/images/destinations/khaoyai.jpg', caption: 'ทริปแรกกับเพื่อนใหม่ วิวสวยกว่าที่คิด' },
  photo_content: { image: '/images/onboarding/share-moment.jpg', caption: 'ออกไปเดินถ่ายรูปกับเพื่อนสายเดียวกัน' },
  movies_music: { image: '/images/onboarding/fair-festival.jpg', caption: 'คืนดนตรีสดกับเพื่อนใหม่ สนุกเกินคาด' },
  wellness_mind: { image: '/event-sound-bath.png', caption: 'ฮีลใจวันหยุด กับเพื่อนที่เข้าใจกัน' },
  sports_club: { image: '/event-hyrox.png', caption: 'ซ้อมวันแรก ได้ทั้งเหงื่อ ได้ทั้งเพื่อน' },
};
const POST_SAMPLE = {
  name: 'แพรว', avatar: '/images/onboarding/people/a.jpg', time: '2 ชม.', image: '/images/destinations/chiangmai.jpg',
  place: 'คาเฟ่บนดอย เชียงใหม่', caption: 'ทริปแรกกับตี้ใหม่ ตื่นมาเจอทะเลหมอกด้วยกัน คุยกันเหมือนรู้จักมานาน รอบหน้าใครไปด้วย',
  likes: 128, comments: 24, comment: { name: 'ต้น', text: 'รอบหน้าขอไปด้วยคนนะ!' },
};

// Side panel: one photo and one brand line per screen, carrying the landing hero's words
// ("คอมมูนิตี้ของคนชอบออกไปใช้ชีวิต" / "พบเจอมิตรภาพใหม่ ส่งต่อความประทับใจ"); `accent` is drawn in the landing orange
const SCENES = [
  { image: '/hero-bkk-community-golden.jpg', lead: 'คอมมูนิตี้ของคน', pre: 'ชอบ', accent: 'ออกไปใช้ชีวิต', tail: '', position: 'object-[30%_center]' },
  // "บอกสิ่งที่ชอบ": friends setting off together (owner 2026-10-23: Gen Z/Y starting the fun, not a beach)
  { image: '/images/onboarding/friends-start.jpg', lead: 'เลือกกิจกรรม ตามสายที่ชอบ', accent: '', tail: '', position: 'object-[center_35%]' },
  { image: '/event-board-games.png', lead: '', accent: 'มิตรภาพใหม่', tail: ' เริ่มจากรู้จักชื่อกัน', position: 'object-center' },
  // The summary (owner 2026-10-23): "พร้อมออกไปใช้ชีวิตกัน" big, the rest of the sentence as a smaller line
  { image: '/hero-bkk-park-sunny.jpg', lead: 'พร้อม', accent: 'ออกไปใช้ชีวิต', after: 'กัน', tail: '', sub: 'พบเจอมิตรภาพใหม่ และส่งต่อความประทับใจ', position: 'object-center' },
];

interface Pick {
  pillar: PillarId;
  id: string;
  title: string;
  meta: string;
  image: string;
  href: string;
  /** Why it was picked, shown on the summary's first-step card ("เพราะคุณชอบถ่ายรูป") */
  reason?: string;
  /** A ตี้ pick keeps its event, so the home band can show the same ตี้ first (FIRST_STEP_KEY) */
  event?: EventItem;
  /** The ตี้ the visitor was joining when they signed up (it leads the summary instead of a suggestion) */
  chosen?: boolean;
}

/** The ตี้ a visitor was joining when they signed up, read on the server from returnTo (app/onboarding/page.tsx) */
export interface CameFor {
  id: string;
  title: string;
  meta: string;
  image: string;
  href: string;
  lifestyleCategory?: string;
}

/* ---------- Small UI pieces ---------- */

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7 lg:mb-8">
      <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 leading-tight">
        <PhraseText text={title} />
      </h1>
      <p className="text-sm lg:text-base text-slate-500 font-medium mt-2 lg:mt-3 leading-relaxed">
        <PhraseText text={subtitle} />
      </p>
    </div>
  );
}

function SelectCard({ selected, onClick, children, className = '', hideCheck = false }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string; hideCheck?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative text-left rounded-2xl border bg-white transition-all duration-200 cursor-pointer active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
        selected ? 'border-[#2563EB] ring-2 ring-[#2563EB]' : 'border-slate-200 hover:border-slate-300'
      } ${className}`}
    >
      {children}
      {selected && !hideCheck && (
        <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-sm" aria-hidden="true">
          <Check className="w-4 h-4 stroke-[3]" />
        </span>
      )}
    </button>
  );
}

/** How the summary button names a card tapped before the pledge ("ตกลงตามนี้ ไปดูตี้นี้") */
const PICK_WORD: Record<PillarId, string> = { community: 'ตี้นี้', challenges: 'ชาเลนจ์นี้', spots: 'ที่นี่', fairs: 'งานนี้', moments: 'โมเมนต์นี้' };

/** The summary's heading over the one first step, by what it is */
const FIRST_STEP_HEADING: Record<PillarId, string> = {
  community: 'ตี้แรกที่ใช่สำหรับคุณ', challenges: 'ชาเลนจ์แรกที่ใช่สำหรับคุณ', spots: 'ที่แรกที่น่าไป', fairs: 'งานแรกที่น่าไป', moments: 'โมเมนต์ที่น่าดู',
};

/**
 * The one first step on the summary: the words lead (title, why it was picked, when and where) and the photo sits
 * beside them, so a dark or plain cover photo cannot sink the card
 */
function FirstStepCard({ item, onOpen }: { item: Pick; onOpen: (e: React.MouseEvent, href: string, label: string) => void }) {
  const pillar = PILLARS[item.pillar];
  return (
    <Link
      href={item.href}
      onClick={(e) => onOpen(e, item.href, PICK_WORD[item.pillar])}
      className="cch-rise group flex items-stretch gap-4 rounded-3xl border border-slate-200 bg-white p-2.5 pr-4 hover:border-slate-300 hover:shadow-md transition-shadow focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
    >
      <span className="relative w-[32%] max-w-[176px] shrink-0 overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3]">
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element -- remote content images
          <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        )}
      </span>
      <span className="min-w-0 flex-1 flex flex-col justify-center py-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pillar.color }} aria-hidden="true" />
          {pillar.short}
        </span>
        <span className="mt-1 text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 group-hover:underline">{item.title}</span>
        {item.reason && <span className="mt-1 text-sm font-semibold line-clamp-1" style={{ color: pillar.color }}>{item.reason}</span>}
        {item.meta && <span className="mt-1 text-xs sm:text-sm text-slate-500 line-clamp-1">{item.meta}</span>}
      </span>
    </Link>
  );
}

/**
 * A goal on "เลือกสิ่งที่ใช่". Phones: one row per goal, the same size each (photo left, words right, easy to read);
 * from iPad up: the photo fills the card and the words sit on it (owner 2026-10-23)
 */
function GoalCard({ goal, selected, onClick }: { goal: Goal; selected: boolean; onClick: () => void }) {
  return (
    <SelectCard selected={selected} onClick={onClick} className="overflow-hidden">
      <span className="sm:hidden flex items-center gap-3 p-2 pr-10">
        <span className="relative w-20 h-20 shrink-0 overflow-hidden rounded-xl">
          <Image src={goal.image} alt="" fill sizes="80px" className="object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold text-slate-900 leading-snug">
            <PhraseText text={goal.title} />
          </span>
          <span className="block text-xs text-slate-500 font-medium mt-0.5">
            <PhraseText text={goal.desc} />
          </span>
        </span>
      </span>
      <span className="hidden sm:block relative aspect-[4/3] lg:aspect-[4/5]">
        <Image src={goal.image} alt="" fill sizes="(min-width: 1024px) 220px, 33vw" className="object-cover" />
        {/* Dark overlay keeps the text on the photo readable */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="block text-base font-bold text-white leading-snug">
            <PhraseText text={goal.title} />
          </span>
          <span className="block text-xs text-white/85 font-medium mt-0.5">
            <PhraseText text={goal.desc} />
          </span>
        </span>
      </span>
    </SelectCard>
  );
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Tries the most specific query first, then widens until something comes back */
async function firstNonEmpty<T>(urls: string[], read: (json: unknown) => T[]): Promise<T[]> {
  for (const url of [...new Set(urls)]) {
    const items = read(await fetchJson(url));
    if (items.length) return items;
  }
  return [];
}

/**
 * A finished run, kept in memory for this browser tab. Opening a recommended card and pressing Back
 * mounts this page again; without this the visitor would land on step 1 with everything lost.
 * It is cleared when they leave through the main button or restart. A full reload starts fresh.
 */
interface FinishedRun {
  preview: boolean;
  /** The account the run belongs to: another account in the same tab never sees it */
  memberId: string | null;
  goals: string[];
  displayName: string;
  photo: { file: File; preview: string } | null;
  birthYear: string;
  gender: string;
  communityInterests: string[];
  spotInterests: string[];
  fairInterests: string[];
  province: string;
  picks: Pick[] | null;
}
let finishedRun: FinishedRun | null = null;
/** Leaving the summary for good (or starting over) forgets the kept run */
const clearFinishedRun = () => {
  finishedRun = null;
};

/* ---------- Flow ---------- */

export function OnboardingFlow({ preview, pledgeOnly = false, returnTo, cameFor }: { preview: boolean; pledgeOnly?: boolean; returnTo: string; cameFor?: CameFor }) {
  const router = useRouter();
  const session = useMemberSession();
  const master = useMasterData();

  const [saved] = useState(() => (finishedRun && finishedRun.preview === preview && finishedRun.memberId === (session.member?.id ?? null) ? finishedRun : null));
  const [step, setStep] = useState(saved ? QUESTION_STEPS - 1 : 0);
  const [done, setDone] = useState(Boolean(saved));
  const [error, setError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [nameError, setNameError] = useState('');
  const [birthYearMissing, setBirthYearMissing] = useState(false);
  const [provinceMissing, setProvinceMissing] = useState(false);
  const [picks, setPicks] = useState<Pick[] | null>(saved?.picks ?? null);
  // Summary: a card tapped before the pledge waits here; the button then says where it goes (owner option ข)
  const [pendingOpen, setPendingOpen] = useState<{ href: string; label: string } | null>(null);
  // "บอกสิ่งที่ชอบ": active members who share at least one picked สาย (null until loaded)
  const [samePeople, setSamePeople] = useState<number | null>(null);

  // Step 1
  const [goals, setGoals] = useState<string[]>(saved?.goals ?? []);
  // Step 2
  const [displayName, setDisplayName] = useState(saved?.displayName ?? '');
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(saved?.photo ?? null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [birthYear, setBirthYear] = useState(saved?.birthYear ?? '');
  const [gender, setGender] = useState(saved?.gender ?? '');
  // Step 3
  const [communityInterests, setCommunityInterests] = useState<string[]>(saved?.communityInterests ?? (cameFor?.lifestyleCategory ? [cameFor.lifestyleCategory] : []));
  const [spotInterests, setSpotInterests] = useState<string[]>(saved?.spotInterests ?? []);
  const [fairInterests, setFairInterests] = useState<string[]>(saved?.fairInterests ?? []);
  const [province, setProvince] = useState(saved?.province ?? '');

  // Prefill the name from the account once per member (render-time derived state).
  // Email sign-ups start as "สมาชิกใหม่", and social ones may carry the email's first part: start those empty
  if (!preview && session.member && prefilledFrom !== session.member.id) {
    setPrefilledFrom(session.member.id);
    const accountName = tidyDisplayName(session.member.displayName);
    const isPlaceholder = accountName === NEW_MEMBER_NAME || accountName === session.member.email?.split('@')[0];
    // LINE, Google and Facebook bring the full name: suggest the first name only, so the surname is not shown to strangers
    const suggested = session.member.loginMethods.includes('email') ? accountName : accountName.split(/\s+/)[0];
    if (!displayName && !isPlaceholder) setDisplayName(suggested);
  }
  // A picked photo wins; otherwise show the picture the account already has (from LINE, Google or Facebook)
  const shownPhoto = photo?.preview ?? (preview ? null : session.member?.avatarUrl ?? null);

  // Free the preview image when it is replaced, unless a finished run still shows it
  useEffect(() => () => {
    if (photo && finishedRun?.photo !== photo) URL.revokeObjectURL(photo.preview);
  }, [photo]);

  // Keep the finished run current (picks and moments arrive after the screen opens)
  useEffect(() => {
    if (done) finishedRun = { preview, memberId: session.member?.id ?? null, goals, displayName, photo, birthYear, gender, communityInterests, spotInterests, fairInterests, province, picks };
  }, [done, preview, session.member?.id, goals, displayName, photo, birthYear, gender, communityInterests, spotInterests, fairInterests, province, picks]);

  // A visitor may pick member and host goals together; any host goal decides the role
  const role: OnboardingRole = useMemo(() => HOST_GOALS.find((g) => goals.includes(g.id))?.role ?? 'member', [goals]);

  // Pillars the visitor is heading for, from goals and interests
  const litPillars = useMemo(() => {
    const lit = new Set<PillarId>(ALL_GOALS().filter((g) => goals.includes(g.id)).map((g) => g.pillar));
    if (communityInterests.length) lit.add('community');
    if (spotInterests.length) lit.add('spots');
    if (fairInterests.length) lit.add('fairs');
    if (lit.size) lit.add('moments');
    return lit;
  }, [goals, communityInterests, spotInterests, fairInterests]);

  const thisYearBE = new Date().getFullYear() + 543;
  const birthYears = useMemo(() => Array.from({ length: 63 }, (_, i) => String(thisYearBE - MIN_AGE - i)), [thisYearBE]);
  // At least three สาย (owner 2026-10-23): enough to suggest ตี้, places and fairs that fit
  const MIN_SAI = 3;
  const saiPicked = communityInterests.length;
  const featuredProvinces = master.featuredProvinces;
  const isSignUpOpen = !preview && session.isLoaded && !session.member;
  const scene = SCENES[done ? SCENES.length - 1 : step];
  const firstName = displayName.trim();
  // Came for moments only: the summary leads with moments and people to follow, outings come after
  const socialOnly = isSocialOnly(goals);
  // The summary's member card: the สาย picked, and the month they joined ("ต.ค. 2569")
  const pickedSai = communityInterests.map((id) => master.communityCategories.find((c) => c.id === id)).filter((c): c is (typeof master.communityCategories)[number] => Boolean(c));
  const joinedMonth = new Date().toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });
  // "บอกเราเกี่ยวกับคุณ": the first-moment example, and which required answers are in (ticks and "อีก N ข้อ")
  const firstMomentBase = FIRST_MOMENT_BY_SAI[communityInterests.find((id) => FIRST_MOMENT_BY_SAI[id]) ?? ''] ?? FIRST_MOMENT_DEFAULT;
  const firstMoment = { image: firstMomentBase.image, caption: province ? `${firstMomentBase.caption} ที่${province}` : firstMomentBase.caption };
  const nameOk = displayName.trim().length >= 2 && !reservedNameProblem(displayName);
  const aboutLeft = [!nameOk, !birthYear, !province].filter(Boolean).length;
  // The province's own name (the landing tiles' "หาดใหญ่ • สงขลา" style is for travel picks, not where someone lives)
  const provinceName = province;
  const alreadyPledged = Boolean(session.member?.trust.pledged);

  // Step 3 shows what fits the goals; with no goal (skipped), a few popular ones
  const suggested = useMemo(() => {
    const picked = goals.map((g) => GOAL_INTERESTS[g]).filter(Boolean);
    const from = picked.length ? picked : [POPULAR_INTERESTS];
    const merge = (key: 'community' | 'spots' | 'fairs') => [...new Set(from.flatMap((m) => m[key] ?? []))];
    return { community: merge('community'), spots: merge('spots'), fairs: merge('fairs') };
  }, [goals]);

  // Step 3 cards: every สาย, the ones that fit the goals first
  const saiCards = useMemo(() => {
    const fit = suggested.community;
    const all = master.communityCategories;
    return [...all.filter((c) => fit.includes(c.id)).sort((a, b) => fit.indexOf(a.id) - fit.indexOf(b.id)), ...all.filter((c) => !fit.includes(c.id))];
  }, [master.communityCategories, suggested]);

  // Places and fairs are no longer asked: the สาย picked and the goals stand in for them
  const goalBased = goals.length > 0;
  const inferredSpots = useMemo(
    () => [...new Set([...spotInterests, ...communityInterests.flatMap((id) => SAI_SPOTS[id] ?? []), ...(goalBased ? suggested.spots : [])])],
    [spotInterests, communityInterests, goalBased, suggested]
  );
  const inferredFairs = useMemo(
    () => [...new Set([...fairInterests, ...communityInterests.flatMap((id) => SAI_FAIRS[id] ?? []), ...(goalBased ? suggested.fairs : [])])],
    [fairInterests, communityInterests, goalBased, suggested]
  );

  const next = () => {
    setError('');
    if (step === 0 && goals.length === 0) return setError('เลือกสักข้อก่อนนะ');
    if (step === STEP_LIKES && saiPicked < MIN_SAI) return setError(`เลือกอย่างน้อย ${MIN_SAI} สายนะ ตอนนี้เลือกแล้ว ${saiPicked}`);
    // Name, birth year and area are required (owner 2026-10-23): matching ตี้ by age and distance depends on them
    if (step === STEP_ABOUT) {
      const name = displayName.trim();
      const nameProblem = name.length < 2 ? 'ใส่ชื่อก่อนนะ อย่างน้อย 2 ตัวอักษร' : name.length > 40 ? 'ชื่อยาวได้ไม่เกิน 40 ตัวอักษร' : reservedNameProblem(name);
      setNameError(nameProblem);
      setBirthYearMissing(!birthYear);
      setProvinceMissing(!province);
      const firstMissing = nameProblem ? 'onb-name' : !birthYear ? 'onb-birth-year' : !province ? 'onb-province' : '';
      if (firstMissing) {
        const field = document.getElementById(firstMissing);
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field?.focus({ preventScroll: true });
        const missing = [nameProblem && 'ชื่อ', !birthYear && 'ปีเกิด', !province && 'จังหวัด'].filter(Boolean).join(' ');
        return setError(`ยังขาด ${missing} ช่วยกรอกให้ครบก่อนนะ`);
      }
    }
    if (step === QUESTION_STEPS - 1) return void finish();
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsCompressing(true);
    setError('');
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85, targetMimeType: 'image/webp' });
      setPhoto({ file: compressed, preview: URL.createObjectURL(compressed) });
    } catch {
      setError('ใช้รูปนี้ไม่ได้ ลองเลือกรูปอื่น (JPG, PNG หรือ WebP)');
    } finally {
      setIsCompressing(false);
    }
  };

  const preferences = () => ({
    intent: role,
    goals,
    birthYear: birthYear ? Number(birthYear) - 543 : undefined,
    gender: (gender || undefined) as 'female' | 'male' | 'lgbtq' | undefined,
    interests: { communityCategories: communityInterests, spotVibes: inferredSpots, fairCategories: inferredFairs },
    province: province || undefined,
  });

  /** Real content matching the answers, for the summary: a ตี้ and a ชาเลนจ์ (the two drivers), then a place or a fair */
  const loadPicks = async () => {
    const support: PillarId = litPillars.has('fairs') && !litPillars.has('spots') ? 'fairs' : 'spots';
    // The first card is the summary's one first step: a challenge for members who came for challenges, else a ตี้
    const pillars: PillarId[] = flavourFromGoals(goals) === 'challenge' ? ['challenges', 'community', support] : ['community', 'challenges', support];
    const prov = province ? `&province=${encodeURIComponent(province)}` : '';
    const mood = master.communityCategories.find((c) => communityInterests.includes(c.id))?.coreMood;
    const vibeWord = master.spotVibes.find((v) => inferredSpots.includes(v.id))?.keywords[0];
    const readEvents = (json: unknown) => ((json as { events?: EventItem[] } | null)?.events ?? []);
    const readSpots = (json: unknown) => ((json as { spots?: LifestyleSpotItem[] } | null)?.spots ?? []);
    const eventPick = (pillar: PillarId, base: string) => (e: EventItem): Pick => ({ pillar, id: e.id, title: e.title, meta: [e.date, e.location].filter(Boolean).join(' · '), image: e.image, href: `${base}/${e.id}` });

    const result = await Promise.all(
      pillars.map(async (pillar) => {
        if (pillar === 'community') {
          const base = '/api/events?type=community&status=recruiting&sortBy=popular&limit=3';
          const cat = mood ? `&category=${mood}` : '';
          // The สาย picked themselves first (near home, then anywhere), so the card can say why; the mood and
          // popular ones only when none of them has a ตี้
          for (const near of [prov, '']) {
            const found = await Promise.all(communityInterests.slice(0, 8).map(async (id) => ({ id, events: readEvents(await fetchJson(`${base}&lifestyleCategory=${id}${near}`)) })));
            const hit = found.find((f) => f.events.length);
            if (hit) {
              const name = master.communityCategories.find((c) => c.id === hit.id)?.name.split(' & ')[0];
              return hit.events.slice(0, 3).map((e) => ({ ...eventPick('community', '/community')(e), reason: name ? `เพราะคุณชอบ${name}` : undefined, event: e }));
            }
          }
          const events = await firstNonEmpty([`${base}${cat}${prov}`, `${base}${prov}`, `${base}${cat}`, base], readEvents);
          return events.slice(0, 3).map((e) => ({ ...eventPick('community', '/community')(e), reason: 'ตี้ที่คนสนใจเยอะตอนนี้', event: e }));
        }
        if (pillar === 'challenges') {
          // Challenges share the ตี้ สาย (owner 2026-10-16): the ones in the สาย picked come first, in the order picked
          const json = await fetchJson<{ quests?: { id: string; title: string; image?: string; badgeCoverImg?: string; status?: string; category?: string; rewardPoints?: number; daysRemaining?: number }[] }>('/api/quests?limit=50');
          // The cover falls back to the badge picture, as the home band does
          const open = (json?.quests ?? []).map((q) => ({ ...q, image: q.image || q.badgeCoverImg })).filter((q) => q.status !== 'ended' && q.image);
          const rank = (q: { category?: string }) => { const i = communityInterests.indexOf(q.category ?? ''); return i < 0 ? communityInterests.length : i; };
          return [...open]
            .sort((a, b) => rank(a) - rank(b))
            .slice(0, 3)
            .map((q): Pick => {
              const sai = communityInterests.includes(q.category ?? '') ? master.communityCategories.find((c) => c.id === q.category)?.name.split(' & ')[0] : undefined;
              return { pillar: 'challenges', id: q.id, title: q.title, meta: [q.rewardPoints ? `+${q.rewardPoints} XP` : '', q.daysRemaining ? `เหลือ ${q.daysRemaining} วัน` : ''].filter(Boolean).join(' · '), image: q.image ?? '', href: `/challenges/${q.id}`, reason: sai ? `เพราะคุณชอบ${sai}` : 'ไปคนเดียวก็ได้ ตามจังหวะตัวเอง' };
            });
        }
        if (pillar === 'fairs') {
          const base = '/api/events?type=public_venue&limit=3';
          const events = await firstNonEmpty([`${base}${prov}`, base], readEvents);
          return events.slice(0, 3).map(eventPick('fairs', '/events'));
        }
        const base = '/api/spots?hasImageOnly=true&limit=3';
        const q = vibeWord ? `&q=${encodeURIComponent(vibeWord)}` : '';
        // A first outing is close to home: another place in the member's province beats the right kind of place far away
        const spots = await firstNonEmpty([`${base}${q}${prov}`, `${base}${prov}`, `${base}${q}`, base], readSpots);
        return spots.slice(0, 3).map((s): Pick => ({ pillar: 'spots', id: s.id, title: s.title, meta: [s.district, s.province].filter(Boolean).join(', '), image: resolveSpotImage(s), href: `/spots/${s.id}` }));
      })
    );
    // One card per pillar first, then second choices, until there are three: the screen ends without scrolling
    const chosen: Pick[] = [];
    for (let round = 0; round < 3 && chosen.length < 3; round++) {
      for (const list of result) if (list[round] && chosen.length < 3) chosen.push(list[round]);
    }
    // Signed up to join a ตี้: that ตี้ leads, the suggestions follow as "หรือ …"
    if (cameFor) {
      const own: Pick = { pillar: 'community', id: cameFor.id, title: cameFor.title, meta: cameFor.meta, image: cameFor.image, href: cameFor.href, reason: 'ตี้ที่คุณเลือกไว้ กลับไปลงทะเบียนต่อได้เลย', chosen: true };
      setPicks([own, ...chosen.filter((p) => p.id !== cameFor.id)].slice(0, 3));
      return;
    }
    setPicks(chosen);
  };

  // "บอกสิ่งที่ชอบ" side panel: how many members share the สาย picked so far. One number, no ตี้ and no names: a ตี้
  // could be the wrong one for a newcomer, and interests are private answers (owner 2026-10-23)
  useEffect(() => {
    if (done || step !== STEP_LIKES) return;
    if (!communityInterests.length) return; // the panel shows its "เลือกสายที่ชอบ" line then
    let active = true;
    const timer = setTimeout(() => {
      void fetchJson<{ people?: number }>(`/api/members/interest-count?ids=${communityInterests.join(',')}`).then((json) => {
        if (active) setSamePeople(json?.people ?? 0);
      });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [done, step, communityInterests]);

  /** Saves the answers and opens the summary. The pledge is accepted there, with its button (owner 2026-10-22). */
  const finish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    // The summary's picks need only the answers on screen: look them up while the answers save, not after
    const picksLoading = loadPicks();
    try {
      if (!preview) {
        const changes: { displayName?: string; avatarUrl?: string } = {};
        const name = displayName.trim();
        if (session.member && name && name !== session.member.displayName) changes.displayName = name;
        if (session.member && photo) {
          const form = new FormData();
          form.append('file', photo.file);
          form.append('folder', 'avatars');
          const upload = await fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json()).catch(() => null);
          if (!upload?.success || !upload.url) throw new Error(upload?.error || 'อัปโหลดรูปไม่สำเร็จ ลองใหม่หรือข้ามรูปไปก่อน');
          changes.avatarUrl = upload.url;
        }
        // Name/photo and answers are separate records: save both at once. Answers are saved on the account, so they
        // follow the member to any device
        await Promise.all([
          Object.keys(changes).length ? memberActions.updateProfile(changes) : null,
          session.member ? memberActions.savePreferences(preferences()) : null,
        ]);
        try {
          localStorage.removeItem('cch_member_preferences'); // older builds kept a copy in the browser
        } catch {
          /* storage unavailable */
        }
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void picksLoading;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
    } finally {
      setIsFinishing(false);
    }
  };

  /**
   * The summary's one button: accept the pledge, then go home (or to the card tapped before).
   * Also the only button of /onboarding?step=pledge, for members who skipped it.
   */
  const acceptAndGo = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setError('');
    try {
      if (!preview && !alreadyPledged) {
        if (!session.member) throw new Error('เข้าสู่ระบบก่อน แล้วลองอีกครั้งนะ');
        await memberActions.acceptPledge();
      }
      // The home band opens on the same first step the summary offered, with the same reason
      const first = picks?.[0];
      if (!preview && session.member && first && (first.pillar === 'community' || first.pillar === 'challenges')) {
        try {
          const saved: FirstStep = { pillar: first.pillar, id: first.id, reason: first.reason, event: first.event };
          localStorage.setItem(FIRST_STEP_KEY(session.member.id), JSON.stringify(saved));
        } catch {
          /* storage unavailable: the band keeps its own order */
        }
      }
      clearFinishedRun();
      if (pledgeOnly) router.replace(returnTo || '/profile');
      else router.push(pendingOpen?.href ?? destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
      setIsFinishing(false);
    }
  };

  const backFromSummary = () => {
    clearFinishedRun();
    setDone(false);
    setPendingOpen(null);
    setError('');
    setStep(QUESTION_STEPS - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // The browser's back button works like "ย้อนกลับ". Without this it leaves the flow, and after LINE, Google or
  // Facebook sign-in the page behind is the provider's used-up consent screen ("Something went wrong").
  // On the first step it stays put: onboarding has no skip (owner 2026-10-23)
  const browserBack = useRef(back);
  useEffect(() => {
    browserBack.current = done ? backFromSummary : back;
  });
  useEffect(() => {
    if (preview || pledgeOnly) return;
    window.history.pushState({ onboarding: true }, '');
    const onPop = () => {
      window.history.pushState({ onboarding: true }, '');
      browserBack.current();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [preview, pledgeOnly]);

  /** A link on the summary tapped before the pledge: show the pledge first, then go there (option ข) */
  const openFromSummary = (e: React.MouseEvent, href: string, label: string) => {
    if (preview || alreadyPledged) {
      clearFinishedRun();
      return;
    }
    e.preventDefault();
    setPendingOpen({ href, label });
    document.getElementById('onb-pledge')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const destination = preview ? '/login?mode=signup' : returnTo || (role !== 'member' ? '/myhub?welcome=true' : '/?welcome=true');

  // The summary leads to home (or the card tapped): fetch those pages while the member reads, so the button opens them
  // at once instead of starting a server render on tap
  useEffect(() => {
    if (!done || preview || pledgeOnly) return;
    router.prefetch(destination);
    for (const pick of picks ?? []) router.prefetch(pick.href);
  }, [done, preview, pledgeOnly, destination, picks, router]);

  const restartPreview = () => {
    clearFinishedRun();
    setDone(false);
    setPicks(null);
    setPendingOpen(null);
    setStep(0);
    setGoals([]);
    setDisplayName('');
    setPhoto(null);
    setBirthYear('');
    setGender('');
    setCommunityInterests([]);
    setSpotInterests([]);
    setFairInterests([]);
    setProvince('');
    setError('');
  };

  const inputClass =
    'w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

  // Preview mode is stated beside the main button, so the page itself looks exactly like the real one
  const previewNote = preview && (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-bold whitespace-nowrap" role="note" title="ไม่ต้องสมัคร และไม่บันทึกข้อมูลใดๆ">
      <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only sm:hidden">โหมดทดลอง</span>
      <span className="hidden sm:inline">โหมดทดลอง ไม่บันทึกข้อมูล</span>
    </span>
  );

  // No skipping onboarding (owner 2026-10-23). A way out stays only on the pledge-only screen (members arriving from
  // elsewhere) and in preview mode; inside the flow, "ย้อนกลับ" moves between steps
  const exitButton = !isSignUpOpen && (preview || pledgeOnly) && (
    <button
      type="button"
      onClick={() => {
        clearFinishedRun();
        router.push(preview ? '/' : returnTo || '/');
      }}
      className="shrink-0 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap"
    >
      {preview ? 'ออกจากโหมดทดลอง' : 'ไว้ทีหลัง'}
    </button>
  );

  // Progress: each step named under its bar; the summary is step 4 ("ออกไปใช้ชีวิตกัน")
  const current = done ? STEPS.length - 1 : step;
  const progress = (
    <div className={`${done ? 'mb-5 lg:mb-6' : 'mb-8 lg:mb-10'} flex items-start gap-4`}>
      <div className="flex-1 min-w-0">
        <ol className="grid grid-cols-4 gap-2" aria-label={`ขั้นที่ ${current + 1} จาก ${STEPS.length}`}>
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === current ? 'step' : undefined} className="min-w-0">
              <span className={`block h-1.5 rounded-full transition-colors duration-300 ${i <= current ? 'bg-[#2563EB]' : 'bg-slate-200'}`} aria-hidden="true" />
              {/* Names under each bar where they fit; phones get the one line below instead */}
              <span className={`mt-2 hidden sm:flex items-center gap-1 text-xs leading-tight transition-colors ${i === current ? 'font-bold text-slate-900' : i < current ? 'font-semibold text-[#2563EB]' : 'font-semibold text-slate-400'}`}>
                {i < current && <Check className="w-3 h-3 stroke-[3] shrink-0" aria-hidden="true" />}
                <span className="truncate">{label}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="sm:hidden mt-2.5 text-xs font-semibold text-slate-500">
          ขั้นที่ {current + 1} จาก {STEPS.length} · <span className="text-slate-800 font-bold">{STEPS[current]}</span>
        </p>
      </div>
      {exitButton && <span className="-mt-2">{exitButton}</span>}
    </div>
  );

  // The four pledge lines, short enough to read in a few seconds
  const pledgeList = (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 rounded-2xl bg-slate-50 p-3.5">
      {PLEDGE.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.title} className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-white text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900 leading-snug"><PhraseText text={item.title} /></span>
              <span className="block text-xs text-slate-500 font-medium mt-0.5"><PhraseText text={item.desc} /></span>
            </span>
          </li>
        );
      })}
    </ul>
  );

  const errorBox = error && (
    <div role="alert" className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-start gap-2">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span><PhraseText text={error} /></span>
    </div>
  );

  // The summary button names what it does: accept the pledge, and where it goes next
  const acceptLabel = isFinishing
    ? 'กำลังบันทึก…'
    : alreadyPledged || preview
      ? pendingOpen ? `ไปดู${pendingOpen.label}` : 'ออกไปใช้ชีวิตกัน'
      : pendingOpen ? `ตกลงตามนี้ ไปดู${pendingOpen.label}` : 'ตกลงตามนี้ ไปกันเลย';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <style>{`@keyframes cch-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.cch-rise{animation:cch-rise .35s ease both}@media (prefers-reduced-motion:reduce){.cch-rise{animation:none}}`}</style>

      {/* Brand side: photo, brand line, and the pillars the visitor is heading for */}
      <aside className="relative h-44 sm:h-56 lg:h-screen lg:sticky lg:top-0 overflow-hidden bg-slate-900 text-white">
        <Image key={scene.image} src={scene.image} alt="" fill priority sizes="(min-width: 1024px) 42vw, 100vw" className={`object-cover cch-rise ${scene.position}`} />
        {/* Dark overlay keeps the text on the photo readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" aria-hidden="true" />
        <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 lg:p-10">
          {/* Same size and subtitle as the landing top bar (components/Navbar.tsx), in white on the photo */}
          {/* A link home only in preview: real onboarding has no skip, and an unfinished member would be sent back */}
          {preview ? (
            <Link href="/" className="group inline-flex items-center gap-2 sm:gap-3 self-start min-w-0">
              <BrandLogo size="md" />
              <BrandWordmark sizeClass="text-base min-[400px]:text-xl sm:text-[22px]" tagline taglineClass="hidden sm:block" onDark />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 sm:gap-3 self-start min-w-0">
              <BrandLogo size="md" />
              <BrandWordmark sizeClass="text-base min-[400px]:text-xl sm:text-[22px]" tagline taglineClass="hidden sm:block" onDark />
            </span>
          )}
          <div className={done && !pledgeOnly ? 'lg:my-auto' : undefined}>
            {/* The landing hero's words, one line per screen; the accent in the landing orange */}
            <p key={scene.image} className="cch-rise text-xl sm:text-2xl lg:text-4xl font-bold leading-tight tracking-tight max-w-md">
              {scene.lead && <PhraseText text={scene.lead} />}
              {/* A line of its own when the lead comes first, as on the landing ("คอมมูนิตี้ของคน / ชอบออกไปใช้ชีวิต") */}
              {'pre' in scene && <br />}
              {scene.accent && (
                <span className="whitespace-nowrap">
                  {'pre' in scene && scene.pre}
                  <span className="text-[#FF8A5B]">{scene.accent}</span>
                  {'after' in scene && scene.after}
                </span>
              )}
              {/* PhraseText drops a leading space, so the gap after the accent is written out */}
              {scene.tail && <>{' '}<PhraseText text={scene.tail.trim()} /></>}
            </p>
            {'sub' in scene && (
              <p key={`${scene.image}-sub`} className="cch-rise mt-2 lg:mt-3 text-sm sm:text-base lg:text-xl font-semibold text-white/85 max-w-md">
                <PhraseText text={scene.sub ?? ''} />
              </p>
            )}

            {/* The summary: the member card they just made, with the สาย they picked as stickers (computers) */}
            {done && !pledgeOnly && (
              <div className="hidden lg:block mt-8 max-w-sm cch-rise">
                <div className="relative -rotate-2 rounded-3xl bg-white text-slate-900 p-5 shadow-2xl">
                  <span className="absolute -top-3 -right-3 rotate-6 rounded-full bg-[#F26430] px-3 py-1 text-xs font-bold text-white shadow-md">ยินดีต้อนรับ!</span>
                  <div className="flex items-center gap-3.5">
                    <span className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#2563EB] text-white text-2xl font-bold ring-4 ring-blue-50">
                      {shownPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                        <img src={shownPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        nameInitial(firstName, 'C')
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xl font-bold leading-tight truncate">{firstName || 'สมาชิกใหม่'}</span>
                      <span className="block mt-0.5 text-xs font-semibold text-slate-500">สมาชิก Chillwaa</span>
                      <span className="block mt-0.5 text-xs text-slate-500 truncate">{[provinceName, joinedMonth].filter(Boolean).join(' · ')}</span>
                    </span>
                  </div>
                  {pickedSai.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex flex-wrap gap-1.5">
                      {pickedSai.slice(0, 5).map((cat, i) => (
                        <span key={cat.id} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${SAI_LOOK.get(cat.id)?.iconBg ?? 'bg-slate-100'} ${SAI_LOOK.get(cat.id)?.iconColor ?? 'text-slate-700'} ${i % 2 ? 'rotate-2' : '-rotate-1'}`}>
                          <cat.icon className="w-3.5 h-3.5" aria-hidden="true" />
                          {cat.name.split(' & ')[0]}
                        </span>
                      ))}
                      {pickedSai.length > 5 && <span className="px-1 py-1 text-xs font-semibold text-slate-500">+{pickedSai.length - 5} สาย</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A live preview of what the answers lead to (computers; phones get the thumbnails below) */}
            {!done && !pledgeOnly && (
              <div key={`side-${step}`} className="hidden lg:block mt-8 max-w-md cch-rise">
                {step === 0 ? (
                  // "เลือกสิ่งที่ใช่": each card picked on the right lights the part of the site it leads to (owner 2026-10-23)
                  <ul className="space-y-3 max-w-sm">
                    {PILLAR_ORDER.map((id) => {
                      const p = PILLARS[id];
                      const Icon = p.icon;
                      const lit = litPillars.has(id);
                      return (
                        <li key={id} className={`flex items-center gap-3 transition-opacity duration-300 ${lit ? 'opacity-100' : 'opacity-50'}`}>
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300" style={{ backgroundColor: lit ? p.color : 'rgba(255,255,255,0.14)' }}>
                            {lit ? <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" /> : <Icon className="w-4 h-4" aria-hidden="true" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold">{p.name}</span>
                            <span className="block text-xs font-medium text-white/80"><PhraseText text={p.line} /></span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : step === STEP_ABOUT ? (
                  // "บอกเราเกี่ยวกับคุณ": the member's name and photo on a moment, the way friends will see it
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-3">โมเมนต์แรกของคุณ จะหน้าตาแบบนี้</p>
                    <div className="bg-white text-slate-900 rounded-3xl p-3.5 shadow-2xl -rotate-2 max-w-sm">
                      <div className="flex items-center gap-2.5 px-1">
                        <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#2563EB] text-white text-sm font-bold">
                          {shownPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                            <img src={shownPhoto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            nameInitial(firstName, '?')
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-sm font-bold truncate ${firstName ? 'text-slate-900' : 'text-slate-400'}`}>{firstName || 'ชื่อของคุณ'}</span>
                          <span className="block text-xs text-slate-500 truncate">เพิ่งแชร์{provinceName ? ` · ${provinceName}` : ''}</span>
                        </span>
                      </div>
                      {/* A fixed photo for the first สาย picked, so it fits the caption (a live one could be anything) */}
                      {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                      <img key={firstMoment.image} src={firstMoment.image} alt="" className="cch-rise mt-3 w-full aspect-[4/3] object-cover rounded-2xl" />
                      <p className="mt-2.5 px-1 text-sm font-semibold text-slate-800 leading-snug">{firstMoment.caption}</p>
                      <p className="mt-2 px-1 flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />เพื่อนๆ กดถูกใจ</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />ทักทายกัน</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* One number of people who share the สาย picked (owner 2026-10-23); small numbers read as empty, so a
                        friendly line until there are enough */}
                    <p className="text-base font-semibold leading-snug text-white/90">
                      {samePeople !== null && samePeople > SAME_PEOPLE_MIN ? (
                        <>
                          เพื่อนสายเดียวกัน <span className="mx-0.5 text-[28px] font-bold text-[#FFB08F] tabular-nums align-[-3px]">{samePeople.toLocaleString()}</span> คน รออยู่ที่นี่แล้ว
                        </>
                      ) : communityInterests.length ? (
                        <PhraseText text="มาร่วมเป็นส่วนหนึ่งของคอมมูนิตี้สำหรับคุณรุ่นใหม่ แล้วออกไปใช้ชีวิตกัน" />
                      ) : (
                        'เลือกสายที่ชอบ แล้วไปเจอเพื่อนสายเดียวกัน'
                      )}
                    </p>
                    {/* Friends' moments the way the landing's "เพื่อน & โมเมนต์" shows them: a stories row, then one post (a fixed example) */}
                    <div aria-hidden="true">
                      <p className="text-sm font-semibold text-white/80 mb-3">โมเมนต์จากเพื่อนๆ</p>
                      <ul className="flex gap-3 mb-4">
                        {STORY_SAMPLES.map((story, i) => (
                          <li key={story.name} className="w-14 text-center">
                            <span className={`relative block w-14 h-14 rounded-full p-[2px] ${i === 0 ? 'bg-[#F26430]' : 'bg-white/70'}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                              <img src={story.image} alt="" className="w-full h-full rounded-full object-cover border-2 border-black/20" />
                              {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                              <img src={story.avatar} alt="" className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full object-cover border-2 border-white" />
                            </span>
                            <span className="block mt-1 text-[11px] font-semibold text-white/90 truncate">{story.name}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-3 bg-white text-slate-900 rounded-3xl p-3 shadow-2xl max-w-md">
                        {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                        <img src={POST_SAMPLE.image} alt="" className="w-28 h-28 xl:w-32 xl:h-32 rounded-2xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="flex items-center gap-2 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                            <img src={POST_SAMPLE.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            <span className="min-w-0 text-sm font-bold truncate">{POST_SAMPLE.name}</span>
                            <span className="shrink-0 text-[11px] text-slate-500">{POST_SAMPLE.time}</span>
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#D04A1B] min-w-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">ไปที่ {POST_SAMPLE.place}</span>
                          </p>
                          <p className="mt-1 text-[13px] font-semibold leading-snug line-clamp-2">{POST_SAMPLE.caption}</p>
                          <p className="mt-1.5 flex items-center gap-3 text-xs font-semibold text-slate-500 tabular-nums">
                            <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />{POST_SAMPLE.likes}</span>
                            <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{POST_SAMPLE.comments} ความเห็น</span>
                          </p>
                          <p className="mt-2 rounded-2xl bg-slate-100 px-2.5 py-1.5 text-xs leading-snug line-clamp-1">
                            <span className="font-bold">{POST_SAMPLE.comment.name}</span> {POST_SAMPLE.comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Phones: the same shared moments as three small prints on the photo band */}
        {!done && !pledgeOnly && step === STEP_ABOUT && (
          <ul className="lg:hidden absolute right-4 top-4 flex" aria-hidden="true">
            {STORY_SAMPLES.slice(0, 3).map((m, i) => (
              <li key={m.name} className={`${i ? '-ml-3' : ''} ${['-rotate-6', 'rotate-3', '-rotate-2'][i]}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                <img src={m.image} alt="" className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-white shadow-md" />
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Question side */}
      {/* Full height on computers so the buttons always sit at the bottom of the screen, even on short steps */}
      <main className={`w-full max-w-2xl mx-auto px-4 sm:px-8 py-6 ${done ? 'lg:py-8' : 'lg:py-12'} flex flex-col min-h-0 lg:min-h-screen`}>
        {pledgeOnly ? (
          // /onboarding?step=pledge: a member who skipped onboarding accepts the pledge before posting
          <section className="cch-rise flex-1 flex flex-col">
            <div className="mb-8 flex items-start justify-between gap-4">
              <StepHeading title="ก่อนออกไปเจอกัน เราดูแลกันแบบนี้" subtitle="คำมั่น 4 ข้อ ที่สมาชิกทุกคนรับร่วมกัน เพื่อให้ที่นี่ปลอดภัย สำหรับทุกคน" />
              {exitButton}
            </div>
            {pledgeList}
            <div className="flex-1" aria-hidden="true" />
            <div className="sticky bottom-0 z-10 -mx-4 px-4 sm:-mx-8 sm:px-8 mt-6 py-3 bg-white/95 backdrop-blur-sm border-t border-slate-100">
              {errorBox}
              <div className="flex justify-end">
                <button type="button" onClick={acceptAndGo} disabled={isFinishing} className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-bold shadow-sm cursor-pointer disabled:cursor-not-allowed whitespace-nowrap">
                  {isFinishing && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>{isFinishing ? 'กำลังบันทึก…' : 'ตกลงตามนี้'}</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {progress}
            {done ? (
              <section className="cch-rise flex-1 flex flex-col">
                {/* Welcome (owner 2026-10-23: the summary has one job, "you are in", then the pledge and one first step) */}
                <div className="flex items-center gap-4 mb-5">
                  <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#2563EB] text-white text-xl sm:text-2xl font-bold ring-4 ring-blue-50">
                    {shownPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                      <img src={shownPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      nameInitial(firstName, 'C')
                    )}
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                      <PhraseText text={firstName ? `ยินดีต้อนรับ คุณ ${firstName}` : 'ยินดีต้อนรับสู่คอมมูนิตี้'} />
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-500 font-medium">ก้าวแรกของคุณ เริ่มจากตรงนี้</p>
                  </div>
                </div>
                {/* Phones have no member card on the photo side: the สาย picked as a line under the welcome */}
                {pickedSai.length > 0 && (
                  <p className="lg:hidden -mt-3 mb-6 flex flex-wrap gap-1.5">
                    {pickedSai.slice(0, 4).map((cat) => (
                      <span key={cat.id} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${SAI_LOOK.get(cat.id)?.iconBg ?? 'bg-slate-100'} ${SAI_LOOK.get(cat.id)?.iconColor ?? 'text-slate-700'}`}>
                        <cat.icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {cat.name.split(' & ')[0]}
                      </span>
                    ))}
                    {pickedSai.length > 4 && <span className="px-1 py-1 text-xs font-semibold text-slate-500">+{pickedSai.length - 4}</span>}
                  </p>
                )}

                {/* The first step: one card that fits the answers, with why. Moments-only members: people to follow */}
                {socialOnly ? (
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">ติดตามเพื่อนสายเดียวกัน</h2>
                    <p className="mt-1 mb-4 text-sm text-slate-500 font-medium">โมเมนต์ของเขาจะขึ้นในหน้าแรกของคุณ</p>
                    <FollowRow emptyText="เดี๋ยวจะมีเพื่อนๆ ให้ติดตามในหน้าแรกนะ" />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5">{picks?.[0]?.chosen ? 'ตี้ที่คุณเลือกไว้' : picks?.[0] ? FIRST_STEP_HEADING[picks[0].pillar] : 'ก้าวแรกที่ใช่สำหรับคุณ'}</h2>
                    {picks === null && (
                      <div className="flex items-center gap-2 h-[140px] text-sm font-bold text-slate-500" role="status">
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        กำลังหาสิ่งที่ใช่ให้คุณ…
                      </div>
                    )}
                    {picks?.[0] && <FirstStepCard item={picks[0]} onOpen={openFromSummary} />}
                    {picks?.length === 0 && (
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-200 text-sm font-semibold text-slate-600">
                        <PhraseText text="ยังไม่มีรายการที่ตรงพอดี แต่มีอีกเยอะให้ดู ในหน้าแรก" />
                      </div>
                    )}
                  </div>
                )}

                {/* The pledge sits right above the button that accepts it (no page of its own, owner 2026-10-22) */}
                {!alreadyPledged && (
                  <div id="onb-pledge" className="mt-6 scroll-mt-24">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">ก่อนออกไปเจอกัน เราดูแลกันแบบนี้</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mb-2.5">คำมั่น 4 ข้อ ที่สมาชิกทุกคนรับร่วมกัน</p>
                    {pledgeList}
                  </div>
                )}

                {preview && (
                  <details className="mt-5">
                    <summary className="text-xs font-bold text-slate-600 cursor-pointer">ข้อมูลที่ระบบจะบันทึก ถ้าเป็นการสมัครจริง</summary>
                    <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap break-words text-slate-700">
                      {JSON.stringify({ displayName: firstName, photo: photo ? 'เลือกแล้ว (ไม่อัปโหลดในโหมดทดลอง)' : 'ไม่มี', ...preferences() }, null, 2)}
                    </pre>
                  </details>
                )}

                <div className="flex-1" aria-hidden="true" />
                <div className="sticky bottom-0 z-10 -mx-4 px-4 sm:-mx-8 sm:px-8 mt-4 py-3 bg-white/95 backdrop-blur-sm border-t border-slate-100">
                  {errorBox}
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      {/* Back to "บอกสิ่งที่ชอบ" with every answer kept */}
                      <button type="button" onClick={backFromSummary} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">ย้อนกลับ</span>
                      </button>
                      {preview && (
                        <button type="button" onClick={restartPreview} aria-label="ลองใหม่ตั้งแต่ต้น" className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                          <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </span>
                    <span className="flex items-center gap-2 sm:gap-3 min-w-0">
                      {previewNote}
                      <button type="button" onClick={acceptAndGo} disabled={isFinishing} className="inline-flex items-center gap-2 min-w-0 px-5 sm:px-8 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-bold shadow-sm cursor-pointer disabled:cursor-not-allowed">
                        {isFinishing && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
                        <span className="truncate">{acceptLabel}</span>
                        {!isFinishing && <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                      </button>
                    </span>
                  </div>
                </div>
              </section>
            ) : (
          <>

            <div key={step} className="cch-rise flex-1">
              {/* Step 1 */}
              {step === 0 && (
                <section>
                  {/* The question in words: without the Chill / Connect headings the cards needed one (owner 2026-10-31) */}
                  <div className="mb-5">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      <PhraseText text="มาที่นี่ อยากทำอะไรบ้าง?" />
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      <PhraseText text="เลือกได้หลายข้อ เราจะหาสิ่งที่ใช่ ให้คุณ" />
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
                    {MEMBER_GOALS.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        selected={goals.includes(goal.id)}
                        onClick={() => {
                          setGoals((g) => toggle(g, goal.id));
                          setError('');
                        }}
                      />
                    ))}
                  </div>

                  {/* Small screens have no side panel: say what the choices lead to here */}
                  {litPillars.size > 0 && (
                    <p className="lg:hidden flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <span>คุณจะได้เจอ</span>
                      {PILLAR_ORDER.filter((id) => litPillars.has(id)).map((id) => (
                        <span key={id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PILLARS[id].color }} aria-hidden="true" />
                          {PILLARS[id].name}
                        </span>
                      ))}
                    </p>
                  )}
                </section>
              )}

              {/* บอกเราเกี่ยวกับคุณ */}
              {step === STEP_ABOUT && (
                <section>
                  {/* No visible title, like step 1 (owner 2026-10-23) */}
                  <h1 className="sr-only">บอกเราเกี่ยวกับคุณ</h1>
                  {/* Phones have no side panel: the first-moment example as one small card */}
                  <div className="lg:hidden mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                    <img src={firstMoment.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-500">โมเมนต์แรกของคุณ จะหน้าตาแบบนี้</span>
                      <span className={`block text-sm font-bold truncate ${firstName ? 'text-slate-900' : 'text-slate-400'}`}>{firstName || 'ชื่อของคุณ'}{provinceName && <span className="font-medium text-slate-500"> · {provinceName}</span>}</span>
                      <span className="block text-xs text-slate-600 line-clamp-1">{firstMoment.caption}</span>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex sm:flex-col items-center gap-4 sm:w-40 shrink-0">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {shownPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element -- picked photo, or the account picture from LINE, Google or Facebook
                          <img src={shownPhoto} alt="รูปที่เลือก" className="w-full h-full object-cover" />
                        ) : isCompressing ? (
                          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" aria-hidden="true" />
                        ) : (
                          <Camera className="w-7 h-7 text-slate-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex flex-col items-start sm:items-center gap-1.5 sm:text-center">
                        <label className="text-xs sm:text-sm font-bold text-slate-800 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap">
                          {shownPhoto ? 'เปลี่ยนรูป' : 'เพิ่มรูปของคุณ'}
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={pickPhoto} disabled={isCompressing} />
                        </label>
                        {photo ? (
                          <button type="button" onClick={() => setPhoto(null)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            ลบรูป
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            <PhraseText text="ใส่รูปจริง เพื่อนจะทักง่ายขึ้น ไม่ใส่ก็ได้" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-5 min-w-0">
                      <div className="space-y-1.5">
                        <label htmlFor="onb-name" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">ชื่อที่เพื่อนๆ จะเห็น {nameOk && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" aria-label="กรอกแล้ว" />}</label>
                        <input id="onb-name" type="text" autoComplete="nickname" maxLength={40} value={displayName} onChange={(e) => { setDisplayName(tidyDisplayName(e.target.value)); setNameError(''); setError(''); }} placeholder="เช่น ส้ม หรือ Som" aria-invalid={Boolean(nameError) || undefined} aria-describedby={nameError ? 'onb-name-error' : 'onb-name-hint'} className={`${inputClass} aria-[invalid=true]:border-rose-400`} />
                        {/* Says where the name shows: it is the profile name everyone sees (owner 2026-10-31) */}
                        {nameError ? (
                          <p id="onb-name-error" className="text-xs font-bold text-rose-600">{nameError}</p>
                        ) : (
                          <p id="onb-name-hint" className="text-xs font-medium text-slate-500">แสดงบนโปรไฟล์ โมเมนต์ และในตี้ เปลี่ยนได้ทีหลัง</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor="onb-birth-year" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">เกิดปีไหน {Boolean(birthYear) && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" aria-label="กรอกแล้ว" />}</label>
                        <select id="onb-birth-year" value={birthYear} onChange={(e) => { setBirthYear(e.target.value); setBirthYearMissing(false); setError(''); }} aria-invalid={birthYearMissing || undefined} aria-describedby={birthYearMissing ? 'onb-birth-year-error' : undefined} className={`${inputClass} aria-[invalid=true]:border-rose-400 ${birthYear ? '' : 'text-slate-400'}`}>
                          <option value="" disabled>เลือกปีเกิด (พ.ศ.)</option>
                          {birthYears.map((y) => (
                            <option key={y} value={y} className="text-slate-800">พ.ศ. {y}</option>
                          ))}
                        </select>
                        {birthYearMissing && <p id="onb-birth-year-error" className="text-xs font-bold text-rose-600">เลือกปีเกิดก่อนนะ</p>}
                      </div>

                      {/* One list, popular provinces first so most people pick without scrolling (owner 2026-10-23: no photos, no extra buttons) */}
                      <div className="space-y-1.5">
                        <label htmlFor="onb-province" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">ปกติอยู่แถวไหน {Boolean(province) && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" aria-label="กรอกแล้ว" />}</label>
                        <select id="onb-province" value={province} onChange={(e) => { setProvince(e.target.value); setProvinceMissing(false); setError(''); }} aria-invalid={provinceMissing || undefined} aria-describedby={provinceMissing ? 'onb-province-error' : undefined} className={`${inputClass} aria-[invalid=true]:border-rose-400 ${province ? '' : 'text-slate-400'}`}>
                          <option value="" disabled>เลือกจังหวัด</option>
                          <optgroup label="ยอดนิยม">
                            {featuredProvinces.map((p) => (
                              <option key={p.id} value={p.id} className="text-slate-800">{p.id}</option>
                            ))}
                          </optgroup>
                          <optgroup label="ทุกจังหวัด">
                            {master.provinces.filter((p) => !featuredProvinces.some((f) => f.id === p.id)).map((p) => (
                              <option key={p.id} value={p.id} className="text-slate-800">{p.id}</option>
                            ))}
                          </optgroup>
                        </select>
                        {provinceMissing && <p id="onb-province-error" className="text-xs font-bold text-rose-600">เลือกจังหวัดที่อยู่ก่อนนะ</p>}
                      </div>

                      <fieldset>
                        <legend className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                          เพศ <span className="font-semibold text-slate-500">(ไม่บอกก็ได้)</span>
                        </legend>
                        {/* One row of four, the same height as the year box above it */}
                        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100">
                          {GENDERS.map((g) => (
                            <button
                              key={g.id || 'none'}
                              type="button"
                              aria-pressed={gender === g.id}
                              onClick={() => setGender(g.id)}
                              className={`px-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                                gender === g.id ? 'bg-white text-[#1D4ED8] shadow-sm ring-1 ring-[#2563EB]/30' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      </div>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        <PhraseText text={`ช่วยให้เจอกิจกรรม ที่คนวัยใกล้ๆ กันไป ไม่แสดงบนโปรไฟล์ สมาชิกต้องอายุ ${MIN_AGE} ปีขึ้นไป`} />
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* บอกสิ่งที่ชอบ */}
              {step === STEP_LIKES && (
                <section className="space-y-9">
                  {/* No visible title, like step 1 (owner 2026-10-23) */}
                  <h1 className="sr-only">บอกสิ่งที่ชอบ</h1>

                  {/* Phones have no side panel: the welcome line and friends' stories sit above the สาย cards */}
                  <div className="lg:hidden -mt-2" aria-hidden="true">
                    <p className="text-sm font-semibold text-slate-700 leading-snug">
                      {samePeople !== null && samePeople > SAME_PEOPLE_MIN ? (
                        <>เพื่อนสายเดียวกัน <span className="text-[#D04A1B] font-bold tabular-nums">{samePeople.toLocaleString()}</span> คน รออยู่ที่นี่แล้ว</>
                      ) : (
                        <PhraseText text="มาร่วมเป็นส่วนหนึ่งของคอมมูนิตี้สำหรับคุณรุ่นใหม่ แล้วออกไปใช้ชีวิตกัน" />
                      )}
                    </p>
                    <ul className="mt-3 flex gap-3">
                      {STORY_SAMPLES.map((story, i) => (
                        <li key={story.name} className="w-14 text-center">
                          <span className={`relative block w-14 h-14 rounded-full p-[2px] ${i === 0 ? 'bg-[#F26430]' : 'bg-slate-200'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                            <img src={story.image} alt="" className="w-full h-full rounded-full object-cover border-2 border-white" />
                            {/* eslint-disable-next-line @next/next/no-img-element -- small local illustration */}
                            <img src={story.avatar} alt="" className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full object-cover border-2 border-white" />
                          </span>
                          <span className="block mt-1 text-[11px] font-semibold text-slate-700 truncate">{story.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* The landing's สาย cards (tilted icon tile, colored base), many may be picked; no counts (owner 2026-10-23) */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2.5 gap-y-4 pt-2">
                    {saiCards.map((cat, i) => {
                      const look = SAI_LOOK.get(cat.id);
                      const Icon = meetupCategoryIcon(cat.id) ?? cat.icon;
                      const selected = communityInterests.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => { setCommunityInterests((v) => toggle(v, cat.id)); setError(''); }}
                          className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 border-b-4 ${look?.borderBottom ?? 'border-b-slate-300'} px-1 py-3 sm:py-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${
                            selected ? 'bg-blue-50/70 border-x-[#2563EB] border-t-[#2563EB] -translate-y-0.5 shadow-md' : 'bg-white border-x-slate-100 border-t-slate-100'
                          }`}
                        >
                          {selected && (
                            <span className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full bg-[#2563EB] text-white border-2 border-white flex items-center justify-center shadow-sm" aria-hidden="true">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                          <span className={`w-11 h-11 md:w-[54px] md:h-[54px] rounded-2xl flex items-center justify-center ${look?.iconBg ?? 'bg-slate-100'} ${look?.iconColor ?? 'text-slate-600'} ${selected ? 'scale-110' : i % 2 ? 'rotate-6' : '-rotate-6'} group-hover:rotate-0 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-7 h-7 md:w-9 md:h-9" aria-hidden="true" />
                          </span>
                          {/* Break only at the ampersand, never inside a Thai word */}
                          <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center leading-tight">
                            {cat.name.split(' & ').map((part, j, all) => (
                              <span key={part} className="block whitespace-nowrap">
                                {part}
                                {j < all.length - 1 ? ' &' : ''}
                              </span>
                            ))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

            </div>

            {/* Navigation: sticks to the bottom; errors show here so they are never off screen */}
            <div className="sticky bottom-0 z-10 -mx-4 px-4 sm:-mx-8 sm:px-8 mt-8 py-3 bg-white/95 backdrop-blur-sm border-t border-slate-100">
            {errorBox}
            <div className="flex items-center justify-between gap-3">
              {step > 0 ? (
                <button type="button" onClick={back} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  ย้อนกลับ
                </button>
              ) : (
                <span />
              )}
              <span className="flex items-center gap-2 sm:gap-3 min-w-0">
              {previewNote}
              {step === STEP_ABOUT && (
                <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${aboutLeft ? 'text-slate-500' : 'text-[#2563EB]'}`} aria-live="polite">
                  {aboutLeft ? `อีก ${aboutLeft} ข้อ` : 'ครบแล้ว'}
                </span>
              )}
              {step === 0 && goals.length > 0 && (
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap text-[#2563EB]" aria-live="polite">
                  เลือกแล้ว {goals.length}
                </span>
              )}
              {step === STEP_LIKES && (
                <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${saiPicked >= MIN_SAI ? 'text-[#2563EB]' : 'text-slate-500'}`} aria-live="polite">
                  เลือกแล้ว {saiPicked}{saiPicked < MIN_SAI ? `/${MIN_SAI}` : ""}
                </span>
              )}
              <button
                type="button"
                onClick={next}
                disabled={isFinishing || isCompressing}
                className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-bold shadow-sm cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isFinishing && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>{isFinishing ? 'กำลังบันทึก…' : 'ถัดไป'}</span>
                {!isFinishing && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </button>
              </span>
            </div>
            </div>
          </>
            )}
          </>
        )}
      </main>

      {/* Visitors without an account sign up first (shared AuthPanel) */}
      {isSignUpOpen && (
        <DialogShell onClose={() => router.push('/')} labelledBy="onboarding-auth-title">
          <AuthPanel
            initialView="signup"
            titleId="onboarding-auth-title"
            returnTo={`/onboarding${pledgeOnly ? '?step=pledge' : ''}${returnTo ? `${pledgeOnly ? '&' : '?'}returnTo=${encodeURIComponent(returnTo)}` : ''}`}
            onAuthenticated={() => undefined}
          />
          {process.env.NODE_ENV !== 'production' && (
            <p className="mt-4 text-center text-xs font-semibold text-slate-500">
              <Link href="/onboarding?preview=1" className="underline hover:text-slate-800">ทดลองขั้นตอนนี้โดยไม่สมัคร (โหมดพัฒนา)</Link>
            </p>
          )}
        </DialogShell>
      )}
    </div>
  );
}
