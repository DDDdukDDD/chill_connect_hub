'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Loader2,
  MailCheck,
  MapPin,
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
import { AuthPanel } from '@/components/auth/AuthPanel';
import { DialogShell } from '@/components/auth/DialogShell';
import { PhraseText } from '@/components/auth/PhraseText';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { nameInitial, tidyDisplayName } from '@/lib/displayName';
import { compressImage } from '@/lib/media/compressor';
import { resolveSpotImage } from '@/lib/spotImageResolver';
import { useAuth, type UserRole } from '@/lib/useAuth';
import { useMasterData } from '@/lib/useMasterData';
import { memberActions, useMemberSession } from '@/lib/useMemberSession';

/**
 * Onboarding for new members. It tells the brand story while it asks:
 *   "Chill" = time for yourself, "Connect" = going out to meet people.
 * Every choice is tagged with the pillar it leads to, and the side panel lights up the pillars the
 * visitor is heading for, so they learn the product by choosing rather than by reading about it.
 * The last screen shows real content (meetups, spots, fairs) matching the answers.
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
  community: { name: 'กิจกรรมคอมมูนิตี้', short: 'คอมมูนิตี้', line: 'กลุ่มเล็กๆ ของคนที่ชอบ อะไรเหมือนกัน', icon: Users, color: '#F26430', href: '/community' },
  fairs: { name: 'งานแฟร์และอีเวนต์', short: 'งานแฟร์', line: 'งานใหญ่ ที่ไม่อยากพลาด', icon: Ticket, color: '#2B527A', href: '/fairs' },
  challenges: { name: 'ชาเลนจ์', short: 'ชาเลนจ์', line: 'ภารกิจสนุกๆ ทำแล้วได้ XP', icon: Trophy, color: '#7C3AED', href: '/challenges' },
  // Moments is where every other pillar ends up: it lights up as soon as the visitor picks anything
  moments: { name: 'โมเมนต์', short: 'โมเมนต์', line: 'เก็บภาพดีๆ แล้วแชร์ให้เพื่อนเห็น', icon: Camera, color: '#F43F5E', href: '/moments' },
};
const PILLAR_ORDER: PillarId[] = ['spots', 'community', 'fairs', 'challenges', 'moments'];

interface Goal {
  id: string;
  group: 'chill' | 'connect' | 'host';
  title: string;
  desc: string;
  image: string;
  pillar: PillarId;
  role: OnboardingRole;
  icon?: LucideIcon;
}

// Spaces mark where a line may wrap (see PhraseText)
const MEMBER_GOALS: Goal[] = [
  { id: 'explore_spots', group: 'chill', title: 'หาที่สงบๆ ไว้พักใจ', desc: 'คาเฟ่เงียบๆ ธรรมชาติ ทริปสั้นๆ', image: '/images/destinations/nan.jpg', pillar: 'spots', role: 'member' },
  { id: 'heal_self', group: 'chill', title: 'ดูแลใจ และร่างกาย', desc: 'โยคะ สมาธิ ซาวด์บาธ', image: '/event-sound-bath.png', pillar: 'community', role: 'member' },
  { id: 'earn_xp', group: 'chill', title: 'มีเป้าหมายเล็กๆ ให้ตัวเอง', desc: 'ชาเลนจ์สนุกๆ สะสม XP', image: '/event-hyrox.png', pillar: 'challenges', role: 'member' },
  { id: 'find_friends', group: 'connect', title: 'เจอเพื่อนใหม่ ที่คุยกันถูกคอ', desc: 'เริ่มจากกลุ่มเล็กๆ ไม่ต้องรู้จักใคร', image: '/event-board-games.png', pillar: 'community', role: 'member' },
  { id: 'join_community', group: 'connect', title: 'ออกไปขยับตัว กับคนอื่น', desc: 'วิ่งเบาๆ ปั่นจักรยาน ตีแบด', image: '/event-city-run.png', pillar: 'community', role: 'member' },
  { id: 'explore_fairs', group: 'connect', title: 'ไปงานสนุกๆ สุดสัปดาห์นี้', desc: 'งานแฟร์ นิทรรศการ เทศกาล', image: '/images/venues/qsncc.jpg', pillar: 'fairs', role: 'member' },
];

const ALL_GOALS = () => [...MEMBER_GOALS, ...HOST_GOALS];

const HOST_GOALS: Goal[] = [
  { id: 'community_host', group: 'host', title: 'ชวนคน มาทำกิจกรรมด้วยกัน', desc: 'นำวิ่ง เปิดวงบอร์ดเกม สอนเวิร์กช็อป', image: '/event-city-run.png', pillar: 'community', role: 'host', icon: CalendarPlus },
  { id: 'venue_space', group: 'host', title: 'มีร้านหรือพื้นที่ อยากให้คนรู้จัก', desc: 'คาเฟ่ สตูดิโอ แกลเลอรี', image: '/images/venues/bacc.jpg', pillar: 'spots', role: 'venue', icon: Store },
  { id: 'event_organizer', group: 'host', title: 'จัดงานอยู่ อยากให้คนมาเยอะขึ้น', desc: 'งานแฟร์ นิทรรศการ งานวิ่ง', image: '/images/venues/bitec.jpg', pillar: 'fairs', role: 'organizer', icon: Ticket },
  { id: 'brand_org', group: 'host', title: 'ทำกิจกรรม ในนามแบรนด์ หรือองค์กร', desc: 'กิจกรรมพนักงาน แคมเปญ ชาเลนจ์', image: '/images/venues/paragon.jpg', pillar: 'challenges', role: 'organizer', icon: Building2 },
];

const GOAL_GROUPS: { id: Goal['group']; word: string; line: string }[] = [
  { id: 'chill', word: 'Chill', line: 'ให้เวลากับตัวเอง' },
  { id: 'connect', word: 'Connect', line: 'ออกไปเจอผู้คน' },
];

const GENDERS = [
  { id: '', label: 'ไม่บอก' },
  { id: 'female', label: 'หญิง' },
  { id: 'male', label: 'ชาย' },
  { id: 'lgbtq', label: 'LGBTQ+' },
] as const;

const STEPS = ['อยากทำอะไร', 'เกี่ยวกับคุณ', 'สิ่งที่ชอบ', 'คำมั่นของเรา'] as const;

// The community pledge: what every member promises. Accepting it is recorded on the account
// and is the stated ground for suspending an account that breaks it.
const PLEDGE: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserCheck, title: 'เป็นตัวเองจริงๆ', desc: 'ชื่อและรูปเป็นของฉันเอง ไม่แอบอ้างเป็นคนอื่น' },
  { icon: WalletMinimal, title: 'ไม่ขาย ไม่ชวนลงทุน', desc: 'ไม่ใช้ที่นี่ขายของ ขายประกัน ชวนลงทุน หรือปล่อยกู้' },
  { icon: HandHeart, title: 'ให้เกียรติกัน', desc: 'ไม่คุกคาม ไม่กดดัน และเคารพเมื่อใครบอกว่าไม่' },
  { icon: Flag, title: 'ช่วยกันดูแล', desc: 'เห็นสิ่งที่ไม่ปลอดภัย ฉันจะกดรายงานให้ทีมงานรู้' },
];
const MIN_AGE = 18;

// Side panel: one photo and one brand line per screen
const SCENES = [
  { image: '/hero-bkk-community-golden.jpg', headline: 'Chill ในแบบของคุณ Connect กับคนที่ใช่', position: 'object-[30%_center]' },
  { image: '/event-board-games.png', headline: 'ทุกมิตรภาพ เริ่มจาก การรู้จักชื่อกัน', position: 'object-center' },
  { image: '/hero-koh-phi-phi.jpg', headline: 'บอกสิ่งที่ชอบ ที่เหลือ เราพาไปเอง', position: 'object-center' },
  { image: '/event-city-run.png', headline: 'ที่นี่ปลอดภัย เพราะเราดูแลกัน', position: 'object-center' },
  { image: '/hero-bkk-park-sunny.jpg', headline: 'พร้อมแล้ว ออกไปใช้ชีวิตกัน', position: 'object-center' },
];

interface Pick {
  pillar: PillarId;
  id: string;
  title: string;
  meta: string;
  image: string;
  href: string;
}

interface QuestPick {
  id: string;
  title: string;
  badge: string;
}

interface MomentThumb {
  id: string;
  image: string;
  caption: string;
}

/* ---------- Small UI pieces ---------- */

function PillarTag({ pillar }: { pillar: PillarId }) {
  const p = PILLARS[pillar];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/95 text-[11px] font-extrabold text-slate-800 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
      {p.short}
    </span>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
        <PhraseText text={title} />
      </h1>
      <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
        <PhraseText text={subtitle} />
      </p>
    </div>
  );
}

function GroupLabel({ children, hint, pillar }: { children: string; hint?: string; pillar?: PillarId }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 min-w-0">
        {pillar && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PILLARS[pillar].color }} aria-hidden="true" />}
        <span><PhraseText text={children} /></span>
      </h2>
      {hint && <span className="text-xs font-semibold text-slate-500 shrink-0">{hint}</span>}
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

/** Photo card for a goal: the photo says the feeling, the tag says which part of the product it leads to */
/** A recommended item on the last screen: the photo fills the card and the text sits on it */
function PickCard({ item, big, delay }: { item: Pick; big: boolean; delay: number }) {
  return (
    <Link
      href={item.href}
      style={{ animationDelay: `${delay}ms` }}
      className="cch-rise group relative block h-full min-h-[120px] sm:min-h-0 rounded-3xl overflow-hidden bg-slate-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
    >
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element -- remote content images
        <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
      )}
      {/* Dark overlay keeps the text on the photo readable */}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" aria-hidden="true" />
      <span className="absolute top-3 left-3">
        <PillarTag pillar={item.pillar} />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <span className={`font-extrabold text-white leading-snug line-clamp-2 ${big ? 'text-base sm:text-xl' : 'text-sm sm:text-base'}`}>{item.title}</span>
        <span className="text-xs font-semibold text-white/85 mt-1 line-clamp-1">{item.meta}</span>
      </span>
    </Link>
  );
}

function GoalCard({ goal, selected, onClick, wide }: { goal: Goal; selected: boolean; onClick: () => void; wide: boolean }) {
  return (
    <SelectCard selected={selected} onClick={onClick} className={`overflow-hidden ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
      <span className={`relative block sm:aspect-[4/3] ${wide ? 'aspect-[2/1]' : 'aspect-square'}`}>
        <Image src={goal.image} alt="" fill sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw" className="object-cover" />
        {/* Dark overlay keeps the text on the photo readable */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" aria-hidden="true" />
        <span className="absolute top-2.5 left-2.5">
          <PillarTag pillar={goal.pillar} />
        </span>
        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="block text-sm sm:text-base font-extrabold text-white leading-snug">
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
  moments: MomentThumb[];
  quests: QuestPick[];
}
let finishedRun: FinishedRun | null = null;

/* ---------- Flow ---------- */

export function OnboardingFlow({ preview, pledgeOnly = false, returnTo }: { preview: boolean; pledgeOnly?: boolean; returnTo: string }) {
  const router = useRouter();
  const session = useMemberSession();
  const { handleSetRole } = useAuth();
  const master = useMasterData();

  const [saved] = useState(() => (finishedRun && finishedRun.preview === preview ? finishedRun : null));
  const [step, setStep] = useState(saved || pledgeOnly ? STEPS.length - 1 : 0);
  const [done, setDone] = useState(Boolean(saved));
  const [error, setError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [nameError, setNameError] = useState('');
  const [picks, setPicks] = useState<Pick[] | null>(saved?.picks ?? null);
  const [moments, setMoments] = useState<MomentThumb[]>(saved?.moments ?? []);
  const [quests, setQuests] = useState<QuestPick[]>(saved?.quests ?? []);

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
  const [communityInterests, setCommunityInterests] = useState<string[]>(saved?.communityInterests ?? []);
  const [spotInterests, setSpotInterests] = useState<string[]>(saved?.spotInterests ?? []);
  const [fairInterests, setFairInterests] = useState<string[]>(saved?.fairInterests ?? []);
  const [province, setProvince] = useState(saved?.province ?? '');

  // Prefill the name from the account once per member (render-time derived state)
  if (!preview && session.member && prefilledFrom !== session.member.id) {
    setPrefilledFrom(session.member.id);
    if (!displayName) setDisplayName(tidyDisplayName(session.member.displayName));
  }

  // Free the preview image when it is replaced, unless a finished run still shows it
  useEffect(() => () => {
    if (photo && finishedRun?.photo !== photo) URL.revokeObjectURL(photo.preview);
  }, [photo]);

  // Keep the finished run current (picks and moments arrive after the screen opens)
  useEffect(() => {
    if (done) finishedRun = { preview, goals, displayName, photo, birthYear, gender, communityInterests, spotInterests, fairInterests, province, picks, moments, quests };
  }, [done, preview, goals, displayName, photo, birthYear, gender, communityInterests, spotInterests, fairInterests, province, picks, moments, quests]);

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
  const interestCount = communityInterests.length + spotInterests.length + fairInterests.length;
  const featuredProvinces = master.featuredProvinces.filter((p) => p.image);
  const isSignUpOpen = !preview && session.isLoaded && !session.member;
  const scene = SCENES[done ? SCENES.length - 1 : step];
  const firstName = displayName.trim();
  // With a challenges row on the last screen, the picks sit in one shorter row so the screen still fits
  const compactPicks = quests.length > 0;
  const summaryChips = [
    ...master.communityCategories.filter((c) => communityInterests.includes(c.id)).map((c) => c.name),
    ...master.spotVibes.filter((c) => spotInterests.includes(c.id)).map((c) => c.name),
    ...master.fairCategories.filter((c) => fairInterests.includes(c.id)).map((c) => c.name),
    ...(province ? [master.provinces.find((p) => p.id === province)?.displayName || province] : []),
  ].slice(0, 4);

  const interestGroups: { label: string; pillar: PillarId; items: { id: string; name: string; icon: LucideIcon }[]; value: string[]; set: React.Dispatch<React.SetStateAction<string[]>> }[] = [
    { label: 'อยากทำอะไร กับคนอื่น', pillar: 'community', items: master.communityCategories, value: communityInterests, set: setCommunityInterests },
    { label: 'ชอบไปพักผ่อน แบบไหน', pillar: 'spots', items: master.spotVibes, value: spotInterests, set: setSpotInterests },
    { label: 'งานแบบไหน ที่อยากไปเดิน', pillar: 'fairs', items: master.fairCategories, value: fairInterests, set: setFairInterests },
  ];

  const next = () => {
    setError('');
    if (step === 0 && goals.length === 0) return setError('เลือกสักข้อก่อนนะ');
    if (step === 1) {
      const name = displayName.trim();
      if (name.length < 2 || name.length > 40) {
        setNameError(name.length < 2 ? 'ใส่ชื่อก่อนนะ อย่างน้อย 2 ตัวอักษร' : 'ชื่อยาวได้ไม่เกิน 40 ตัวอักษร');
        const input = document.getElementById('onb-name');
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input?.focus({ preventScroll: true });
        return setError('ยังไม่ได้ใส่ชื่อที่อยากให้เรียก');
      }
    }
    if (step === STEPS.length - 1) return void finish();
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
    interests: { communityCategories: communityInterests, spotVibes: spotInterests, fairCategories: fairInterests },
    province: province || undefined,
  });

  /** Real content matching the answers, for the last screen */
  const loadPicks = async () => {
    const wanted: PillarId[] = (['community', 'spots', 'fairs'] as const).filter((p) => litPillars.has(p));
    const pillars = wanted.length ? wanted : (['community', 'spots', 'fairs'] as PillarId[]);
    const prov = province ? `&province=${encodeURIComponent(province)}` : '';
    const mood = master.communityCategories.find((c) => communityInterests.includes(c.id))?.coreMood;
    const vibeWord = master.spotVibes.find((v) => spotInterests.includes(v.id))?.keywords[0];
    const readEvents = (json: unknown) => ((json as { events?: EventItem[] } | null)?.events ?? []);
    const readSpots = (json: unknown) => ((json as { spots?: LifestyleSpotItem[] } | null)?.spots ?? []);
    const eventPick = (pillar: PillarId, base: string) => (e: EventItem): Pick => ({ pillar, id: e.id, title: e.title, meta: [e.date, e.location].filter(Boolean).join(' · '), image: e.image, href: `${base}/${e.id}` });

    const result = await Promise.all(
      pillars.map(async (pillar) => {
        if (pillar === 'community') {
          const base = '/api/events?type=community&status=recruiting&sortBy=popular&limit=3';
          const cat = mood ? `&category=${mood}` : '';
          const events = await firstNonEmpty([`${base}${cat}${prov}`, `${base}${prov}`, `${base}${cat}`, base], readEvents);
          return events.slice(0, 3).map(eventPick('community', '/community'));
        }
        if (pillar === 'fairs') {
          const base = '/api/events?type=public_venue&limit=3';
          const events = await firstNonEmpty([`${base}${prov}`, base], readEvents);
          return events.slice(0, 3).map(eventPick('fairs', '/fairs'));
        }
        const base = '/api/spots?hasImageOnly=true&limit=3';
        const q = vibeWord ? `&q=${encodeURIComponent(vibeWord)}` : '';
        // For trips the kind of place matters more than the home province
        const spots = await firstNonEmpty([`${base}${q}${prov}`, `${base}${q}`, `${base}${prov}`, base], readSpots);
        return spots.slice(0, 3).map((s): Pick => ({ pillar: 'spots', id: s.id, title: s.title, meta: [s.district, s.province].filter(Boolean).join(', '), image: resolveSpotImage(s), href: `/spots/${s.id}` }));
      })
    );
    // One card per pillar first, then second choices, until there are three: the screen ends without scrolling
    const chosen: Pick[] = [];
    for (let round = 0; round < 3 && chosen.length < 3; round++) {
      for (const list of result) if (list[round] && chosen.length < 3) chosen.push(list[round]);
    }
    setPicks(chosen);
  };

  /** A few real member photos for the last screen */
  const loadMoments = async () => {
    const json = await fetchJson<{ moments?: { id: string; images: string[]; caption: string }[] }>('/api/moments?tab=popular&limit=8');
    setMoments((json?.moments ?? []).filter((m) => m.images?.[0]).slice(0, 8).map((m) => ({ id: m.id, image: m.images[0], caption: m.caption })));
  };

  /** Active challenges, shown only to visitors who chose a challenge goal */
  const loadQuests = async () => {
    const json = await fetchJson<{ quests?: { id: string; title: string; badgeLabel?: string; status?: string }[] }>('/api/quests?limit=6');
    setQuests((json?.quests ?? []).filter((q) => q.status !== 'ended').slice(0, 2).map((q) => ({ id: q.id, title: q.title, badge: q.badgeLabel ?? '' })));
  };

  const finish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      // An existing member who came only for the pledge: record it and go back, leaving saved answers untouched
      if (pledgeOnly) {
        if (!session.member) throw new Error('เข้าสู่ระบบก่อน แล้วลองอีกครั้งนะ');
        await memberActions.acceptPledge();
        router.replace(returnTo || '/profile');
        return;
      }
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
        if (Object.keys(changes).length) await memberActions.updateProfile(changes);
        // Answers are saved on the account, so they follow the member to any device
        if (session.member) {
          await memberActions.savePreferences(preferences());
          // Pressing the last button is the acceptance of the pledge shown on that step
          await memberActions.acceptPledge();
        }
        try {
          localStorage.removeItem('cch_member_preferences'); // older builds kept a copy in the browser
        } catch {
          /* storage unavailable */
        }
        const previewRole: Record<OnboardingRole, UserRole> = { member: 'member', host: 'host', venue: 'venue_owner', organizer: 'organizer' };
        handleSetRole(previewRole[role]);
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void loadPicks();
      void loadMoments();
      if (litPillars.has('challenges')) void loadQuests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
    } finally {
      setIsFinishing(false);
    }
  };

  const destination = preview ? '/login?mode=signup' : returnTo || (role !== 'member' ? '/myhub?welcome=true' : '/?welcome=true');

  const restartPreview = () => {
    finishedRun = null;
    setDone(false);
    setPicks(null);
    setMoments([]);
    setQuests([]);
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

  const exitButton = !isSignUpOpen && !done && (
    <button
      type="button"
      onClick={() => router.push(preview ? '/' : returnTo || '/')}
      className="shrink-0 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap"
    >
      {preview ? 'ออกจากโหมดทดลอง' : pledgeOnly ? 'ไว้ทีหลัง' : 'ข้ามไปก่อน'}
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <style>{`@keyframes cch-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.cch-rise{animation:cch-rise .35s ease both}@media (prefers-reduced-motion:reduce){.cch-rise{animation:none}}`}</style>

      {/* Brand side: photo, brand line, and the pillars the visitor is heading for */}
      <aside className="relative h-44 sm:h-56 lg:h-screen lg:sticky lg:top-0 overflow-hidden bg-slate-900 text-white">
        <Image key={scene.image} src={scene.image} alt="" fill priority sizes="(min-width: 1024px) 42vw, 100vw" className={`object-cover cch-rise ${scene.position}`} />
        {/* Dark overlay keeps the text on the photo readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" aria-hidden="true" />
        <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 lg:p-10">
          <Link href="/" className="inline-flex items-center gap-2 self-start">
            <BrandLogo size="sm" />
            <span className="font-extrabold text-sm sm:text-base">Chill & Connect Hub</span>
          </Link>
          <div>
            <p key={scene.headline} className="cch-rise text-xl sm:text-2xl lg:text-4xl font-black leading-tight tracking-tight max-w-md">
              <PhraseText text={scene.headline} />
            </p>
            <ul className="hidden lg:block mt-8 space-y-3 max-w-sm">
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
                      <span className="block text-sm font-extrabold">{p.name}</span>
                      <span className="block text-xs font-medium text-white/80"><PhraseText text={p.line} /></span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>

      {/* Question side */}
      <main className="w-full max-w-2xl mx-auto px-4 sm:px-8 py-6 lg:py-10 flex flex-col min-h-0">
        {done ? (
          <section className="cch-rise">
            {/* Personal header: who they are and what they told us */}
            <div className="flex items-center gap-4 mb-5">
              <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#2563EB] text-white text-xl sm:text-2xl font-black ring-4 ring-blue-50">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  nameInitial(firstName, 'C')
                )}
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                  <PhraseText text={firstName ? `ยินดีที่ได้รู้จัก คุณ ${firstName}` : 'ยินดีที่ได้รู้จัก'} />
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  <PhraseText text="เราเลือก 3 อย่างนี้ มาให้คุณโดยเฉพาะ" />
                </p>
              </div>
            </div>

            {!preview && session.member && (!session.member.trust.emailVerified || role !== 'member') && (
              <div className="mb-5 space-y-2">
                {!session.member.trust.emailVerified && session.member.trust.hasEmail && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-2xl bg-blue-50 border border-blue-100 text-sm">
                    <MailCheck className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-[12rem] font-semibold text-slate-700">
                      <PhraseText text="อีกขั้นเดียว ยืนยันอีเมล แล้วเริ่มโพสต์ และคอมเมนต์ได้" />
                    </span>
                    <Link href="/profile#trust" onClick={() => { finishedRun = null; }} className="font-extrabold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
                      ยืนยันอีเมล
                    </Link>
                  </div>
                )}
                {role !== 'member' && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
                    <Users className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-[12rem] font-semibold text-slate-700">
                      <PhraseText text="อยากเป็นคนชวน ส่งคำขอสั้นๆ ให้ทีมงานดูก่อน" />
                    </span>
                    <Link href="/profile#host" onClick={() => { finishedRun = null; }} className="font-extrabold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
                      ส่งคำขอ
                    </Link>
                  </div>
                )}
              </div>
            )}

            {summaryChips.length > 0 && (
              <p className="flex flex-wrap items-center gap-1.5 mb-5 text-xs font-semibold text-slate-500">
                <span>เพราะคุณชอบ</span>
                {summaryChips.map((chip) => (
                  <span key={chip} className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1D4ED8] font-bold whitespace-nowrap">{chip}</span>
                ))}
              </p>
            )}

            {picks === null && (
              <div className="flex items-center gap-2 py-10 text-sm font-bold text-slate-500" role="status">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                กำลังหาสิ่งที่ใช่ให้คุณ…
              </div>
            )}

            {picks && picks.length > 0 && (
              <ul className={`grid gap-3 ${picks.length < 3 ? 'grid-cols-1 sm:grid-cols-2 sm:h-[240px]' : compactPicks ? 'grid-cols-2 sm:grid-cols-3 sm:h-[176px]' : 'grid-cols-2 sm:grid-cols-5 sm:grid-rows-2 sm:h-[264px]'}`}>
                {picks.map((item, index) => {
                  const first = index === 0 && picks.length >= 3;
                  const big = first && !compactPicks;
                  return (
                    <li key={`${item.pillar}-${item.id}`} className={picks.length < 3 ? 'aspect-[16/10] sm:aspect-auto' : first ? `col-span-2 aspect-[16/10] sm:aspect-auto ${compactPicks ? 'sm:col-span-1' : 'sm:col-span-3 sm:row-span-2'}` : `aspect-square sm:aspect-auto ${compactPicks ? '' : 'sm:col-span-2'}`}>
                      <PickCard item={item} big={big} delay={index * 90} />
                    </li>
                  );
                })}
              </ul>
            )}

            {picks?.length === 0 && (
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-200 text-sm font-semibold text-slate-600">
                <PhraseText text="ยังไม่มีรายการที่ตรงพอดี แต่มีอีกเยอะให้ดู ในหน้าแรก" />
              </div>
            )}

            {/* Moments: what people share after they go */}
            {moments.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PILLARS.moments.color }} aria-hidden="true" />
                    <span><PhraseText text="โมเมนต์ จากคนที่ไปมาแล้ว" /></span>
                  </h2>
                  <Link href="/moments" className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูโมเมนต์</Link>
                </div>
                <ul className={`grid grid-cols-4 gap-2 ${quests.length ? 'sm:grid-cols-8' : 'sm:grid-cols-6'}`}>
                  {moments.map((m, i) => (
                    <li key={m.id} className={i >= (compactPicks ? 8 : 6) ? 'hidden' : i >= 4 ? 'hidden sm:block' : ''}>
                      <Link href="/moments" aria-label={m.caption.slice(0, 60)} className="group block aspect-square rounded-2xl overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote content images */}
                        <img src={m.image} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Challenges: only for visitors who said they want a goal for themselves */}
            {quests.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PILLARS.challenges.color }} aria-hidden="true" />
                    <span><PhraseText text="ชาเลนจ์ ที่เริ่มได้เลย" /></span>
                  </h2>
                  <Link href="/challenges" className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ดูชาเลนจ์</Link>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quests.map((quest) => (
                    <li key={quest.id}>
                      <Link href="/challenges" className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white h-full">
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: PILLARS.challenges.color }}>
                          <Trophy className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug line-clamp-1">{quest.title}</span>
                          {quest.badge && <span className="text-xs font-semibold text-slate-500 line-clamp-1">เหรียญ {quest.badge} และ XP</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Where to go next: every pillar, the chosen ones first */}
            <p className="mt-5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span>ไปต่อได้ที่</span>
              {[...PILLAR_ORDER].sort((a, b) => Number(litPillars.has(b)) - Number(litPillars.has(a))).map((id) => (
                <Link key={id} href={PILLARS[id].href} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PILLARS[id].color }} aria-hidden="true" />
                  {PILLARS[id].name}
                </Link>
              ))}
            </p>

            {preview && (
              <details className="mt-5">
                <summary className="text-xs font-bold text-slate-600 cursor-pointer">ข้อมูลที่ระบบจะบันทึก ถ้าเป็นการสมัครจริง</summary>
                <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap break-words text-slate-700">
                  {JSON.stringify({ displayName: firstName, photo: photo ? 'เลือกแล้ว (ไม่อัปโหลดในโหมดทดลอง)' : 'ไม่มี', ...preferences() }, null, 2)}
                </pre>
              </details>
            )}

            <div className="sticky bottom-0 z-10 -mx-4 px-4 sm:-mx-8 sm:px-8 mt-6 py-3 bg-white/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-between gap-3">
              {preview ? (
                <button type="button" onClick={restartPreview} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">ลองใหม่</span>
                </button>
              ) : (
                <span />
              )}
              <span className="flex items-center gap-2 sm:gap-3 min-w-0">
                {previewNote}
                <Link href={destination} onClick={() => { finishedRun = null; }} className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm sm:text-base font-extrabold shadow-sm whitespace-nowrap">
                  เริ่ม Chill & Connect Hub
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </span>
            </div>
          </section>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                {pledgeOnly ? (
                  <p className="text-xs font-bold text-slate-800">{STEPS[step]}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                      {STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? 'bg-[#2563EB]' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="mt-2.5 text-xs font-semibold text-slate-500">
                      ขั้นที่ {step + 1} จาก {STEPS.length} · <span className="text-slate-800 font-bold">{STEPS[step]}</span>
                    </p>
                  </>
                )}
              </div>
              {exitButton}
            </div>

            <div key={step} className="cch-rise flex-1">
              {/* Step 1 */}
              {step === 0 && (
                <section>
                  <StepHeading title="ช่วงนี้ อยากทำอะไรบ้าง" subtitle="เลือกได้หลายข้อ ไม่มีถูกผิด จะ Chill จะ Connect หรือทั้งสองอย่างก็ได้" />
                  {GOAL_GROUPS.map((group) => (
                    <div key={group.id} className="mb-6">
                      <h2 className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg sm:text-xl font-black text-slate-900">{group.word}</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-500">{group.line}</span>
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {MEMBER_GOALS.filter((g) => g.group === group.id).map((goal, index, list) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            wide={list.length % 2 === 1 && index === list.length - 1}
                            selected={goals.includes(goal.id)}
                            onClick={() => {
                              setGoals((g) => toggle(g, goal.id));
                              setError('');
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Hosts choose here too: same screen, clearly optional, can be combined with the above */}
                  <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h2 className="flex flex-wrap items-baseline gap-x-2 mb-3">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">หรือคุณ อยากเป็นคนชวน</span>
                      <span className="text-xs font-semibold text-slate-500">ไม่ใช่ก็ข้ามได้</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {HOST_GOALS.map((goal) => {
                        const Icon = goal.icon ?? Users;
                        const selected = goals.includes(goal.id);
                        return (
                          <SelectCard
                            key={goal.id}
                            hideCheck
                            selected={selected}
                            onClick={() => {
                              setGoals((g) => toggle(g, goal.id));
                              setError('');
                            }}
                            className="p-3 flex items-center gap-3"
                          >
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {selected ? <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" /> : <Icon className="w-4 h-4" aria-hidden="true" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs sm:text-sm font-extrabold text-slate-900 leading-snug"><PhraseText text={goal.title} /></span>
                              <span className="block text-xs text-slate-500 font-medium mt-0.5"><PhraseText text={goal.desc} /></span>
                            </span>
                          </SelectCard>
                        );
                      })}
                    </div>
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

              {/* Step 2 */}
              {step === 1 && (
                <section>
                  <StepHeading title="เพื่อนใหม่ จะเรียกคุณว่าอะไรดี" subtitle="ใช้ชื่อเล่นก็ได้ ทุกอย่างในหน้านี้ แก้ทีหลังได้เสมอ" />
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex sm:flex-col items-center gap-4 sm:w-40 shrink-0">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                          <img src={photo.preview} alt="รูปที่เลือก" className="w-full h-full object-cover" />
                        ) : isCompressing ? (
                          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" aria-hidden="true" />
                        ) : (
                          <Camera className="w-7 h-7 text-slate-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex flex-col items-start sm:items-center gap-1.5 sm:text-center">
                        <label className="text-xs sm:text-sm font-bold text-slate-800 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap">
                          {photo ? 'เปลี่ยนรูป' : 'เพิ่มรูปของคุณ'}
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={pickPhoto} disabled={isCompressing} />
                        </label>
                        {photo ? (
                          <button type="button" onClick={() => setPhoto(null)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            ลบรูป
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            <PhraseText text="ไม่ใส่ก็ได้ แต่มีรูป เพื่อนจะจำได้ง่ายขึ้น" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-5 min-w-0">
                      <div className="space-y-1.5">
                        <label htmlFor="onb-name" className="block text-xs sm:text-sm font-bold text-slate-800">ชื่อที่อยากให้เรียก</label>
                        <input id="onb-name" type="text" autoComplete="nickname" maxLength={40} value={displayName} onChange={(e) => { setDisplayName(tidyDisplayName(e.target.value)); setNameError(''); setError(''); }} placeholder="เช่น ส้ม หรือ Som" aria-invalid={Boolean(nameError) || undefined} aria-describedby={nameError ? 'onb-name-error' : undefined} className={`${inputClass} aria-[invalid=true]:border-rose-400`} />
                        {nameError && <p id="onb-name-error" className="text-xs font-bold text-rose-600">{nameError}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor="onb-birth-year" className="block text-xs sm:text-sm font-bold text-slate-800">
                          เกิดปีไหน <span className="font-semibold text-slate-500">(ไม่บอกก็ได้)</span>
                        </label>
                        <select id="onb-birth-year" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={inputClass}>
                          <option value="">ไม่บอก</option>
                          {birthYears.map((y) => (
                            <option key={y} value={y}>พ.ศ. {y}</option>
                          ))}
                        </select>
                      </div>

                      <fieldset>
                        <legend className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                          เพศ <span className="font-semibold text-slate-500">(ไม่บอกก็ได้)</span>
                        </legend>
                        <div className="flex flex-wrap gap-2">
                          {GENDERS.map((g) => (
                            <button
                              key={g.id || 'none'}
                              type="button"
                              aria-pressed={gender === g.id}
                              onClick={() => setGender(g.id)}
                              className={`px-3.5 py-2 rounded-full border text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                gender === g.id ? 'border-[#2563EB] bg-blue-50 text-[#1D4ED8]' : 'border-slate-300 text-slate-700 hover:border-slate-400'
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

                  <div className="mt-8">
                    <GroupLabel hint="ไม่บอกก็ได้">ปกติอยู่แถวไหน</GroupLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {featuredProvinces.slice(0, 8).map((p) => (
                        <SelectCard key={p.id} selected={province === p.id} onClick={() => setProvince((cur) => (cur === p.id ? '' : p.id))} className="overflow-hidden">
                          <span className="relative block aspect-[16/10] bg-slate-100">
                            {p.image && <Image src={p.image} alt="" fill sizes="(min-width: 640px) 160px, 50vw" className="object-cover" />}
                          </span>
                          <span className="block px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                            <PhraseText text={(p.displayName || p.id).replace('•', ' • ')} />
                          </span>
                        </SelectCard>
                      ))}
                    </div>
                    <label htmlFor="onb-province" className="block text-xs font-semibold text-slate-500 mt-4 mb-1.5">หรือเลือกจังหวัดอื่น</label>
                    <select id="onb-province" value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass}>
                      <option value="">ไม่บอก</option>
                      {master.provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.displayName || p.id}</option>
                      ))}
                    </select>
                  </div>
                </section>
              )}

              {/* Step 3 */}
              {step === 2 && (
                <section className="space-y-8">
                  <StepHeading
                    title={firstName ? `คุณ ${firstName} อะไรทำให้คุณ รู้สึกดี` : 'อะไรทำให้คุณ รู้สึกดี'}
                    subtitle="แตะที่ชอบได้เลย เลือกเยอะ หรือไม่เลือกเลยก็ได้"
                  />

                  {interestGroups.map((group) => (
                    <div key={group.label}>
                      <GroupLabel pillar={group.pillar} hint={group.value.length ? `เลือกแล้ว ${group.value.length}` : PILLARS[group.pillar].name}>{group.label}</GroupLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const selected = group.value.includes(item.id);
                          return (
                            <SelectCard key={item.id} hideCheck selected={selected} onClick={() => group.set((v) => toggle(v, item.id))} className="p-3 flex flex-col items-start gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-2.5 min-h-[56px]">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {selected ? <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" /> : <Icon className="w-4 h-4" aria-hidden="true" />}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug min-w-0">
                                <PhraseText text={item.name} />
                              </span>
                            </SelectCard>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                </section>
              )}

              {/* Step 4: the community pledge */}
              {step === 3 && (
                <section>
                  <StepHeading title="ที่นี่ เราดูแลกัน แบบนี้" subtitle="คำมั่น 4 ข้อ ที่สมาชิกทุกคนรับร่วมกัน เพื่อให้ที่นี่ปลอดภัย สำหรับทุกคน" />
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PLEDGE.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.title} className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm sm:text-base font-extrabold text-slate-900 leading-snug"><PhraseText text={item.title} /></span>
                            <span className="block text-xs sm:text-sm text-slate-500 font-medium mt-1"><PhraseText text={item.desc} /></span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-5 text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                    <PhraseText text="กดปุ่มด้านล่าง เท่ากับคุณรับคำมั่นนี้ บัญชีที่ทำผิดคำมั่น จะถูกระงับการใช้งาน" />
                  </p>
                </section>
              )}
            </div>

            {/* Navigation: sticks to the bottom; errors show here so they are never off screen */}
            <div className="sticky bottom-0 z-10 -mx-4 px-4 sm:-mx-8 sm:px-8 mt-8 py-3 bg-white/95 backdrop-blur-sm border-t border-slate-100">
            {error && (
              <div role="alert" className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span><PhraseText text={error} /></span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              {step > 0 && !pledgeOnly ? (
                <button type="button" onClick={back} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  ย้อนกลับ
                </button>
              ) : (
                <span />
              )}
              <span className="flex items-center gap-2 sm:gap-3 min-w-0">
              {previewNote}
              <button
                type="button"
                onClick={next}
                disabled={isFinishing || isCompressing}
                className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-extrabold shadow-sm cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isFinishing && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>{step < STEPS.length - 1 ? (step === 2 && !interestCount ? 'ข้ามข้อนี้' : 'ถัดไป') : isFinishing ? 'กำลังบันทึก…' : 'ฉันรับคำมั่นนี้'}</span>
                {!isFinishing && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </button>
              </span>
            </div>
            </div>
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
