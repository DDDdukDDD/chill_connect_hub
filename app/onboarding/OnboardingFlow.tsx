'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CalendarPlus,
  Camera,
  Check,
  FlaskConical,
  Loader2,
  MapPin,
  RotateCcw,
  Store,
  Ticket,
  Trash2,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { PhraseText } from '@/components/auth/PhraseText';
import { compressImage } from '@/lib/media/compressor';
import { useAuth, type UserRole } from '@/lib/useAuth';
import { useMasterData } from '@/lib/useMasterData';
import { memberActions, useMemberSession } from '@/lib/useMemberSession';

/**
 * Onboarding (3 steps) for new members: what they feel like doing → about them → what they enjoy.
 * Copy speaks from the visitor's point of view (someone looking for something to do or a place to
 * unwind), not in platform terms. Interests and provinces come from admin-managed master data, so the
 * saved answers use the same ids as content.
 * Name and photo go to the member account; the other answers stay in localStorage
 * `cch_member_preferences` until the backend stores preferences.
 * Preview mode (/onboarding?preview=1) needs no account and saves nothing, for testing the flow.
 */

type Track = 'member' | 'host';
type OnboardingRole = 'member' | 'host' | 'venue' | 'organizer';

interface Goal {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  role: OnboardingRole;
}

// Spaces mark where a line may wrap (see PhraseText)
const MEMBER_GOALS: Goal[] = [
  { id: 'find_friends', icon: Users, title: 'อยากเจอเพื่อนใหม่ ที่คุยกันถูกคอ', desc: 'ไม่ต้องรู้จักใครมาก่อน เริ่มจากกลุ่มเล็กๆ', role: 'member' },
  { id: 'join_community', icon: CalendarDays, title: 'อยากออกไปทำอะไร กับคนอื่นบ้าง', desc: 'วิ่งเบาๆ เล่นบอร์ดเกม ลองเวิร์กช็อป', role: 'member' },
  { id: 'explore_spots', icon: MapPin, title: 'อยากหาที่สงบๆ ไว้พักใจ', desc: 'คาเฟ่เงียบๆ ธรรมชาติ ทริปสั้นๆ ทั่วไทย', role: 'member' },
  { id: 'explore_fairs', icon: Ticket, title: 'อยากรู้ว่า สุดสัปดาห์นี้ มีงานอะไรน่าไป', desc: 'งานแฟร์ นิทรรศการ เทศกาล งานวิ่ง', role: 'member' },
  { id: 'earn_xp', icon: Trophy, title: 'อยากมีเป้าหมายเล็กๆ ให้ตัวเอง', desc: 'ชาเลนจ์สนุกๆ ทำแล้วได้ XP และเหรียญ', role: 'member' },
];

const HOST_GOALS: Goal[] = [
  { id: 'community_host', icon: CalendarPlus, title: 'อยากชวนคน มาทำกิจกรรมด้วยกัน', desc: 'นำวิ่ง เปิดวงบอร์ดเกม สอนเวิร์กช็อป', role: 'host' },
  { id: 'venue_space', icon: Store, title: 'มีร้านหรือพื้นที่ อยากให้คนรู้จัก', desc: 'คาเฟ่ สตูดิโอ แกลเลอรี ที่จัดกิจกรรมได้', role: 'venue' },
  { id: 'event_organizer', icon: Ticket, title: 'จัดงานอยู่ อยากให้คนมาเยอะขึ้น', desc: 'งานแฟร์ นิทรรศการ งานวิ่ง เทศกาล', role: 'organizer' },
  { id: 'brand_org', icon: Building2, title: 'อยากทำกิจกรรม ในนามแบรนด์ หรือองค์กร', desc: 'กิจกรรมพนักงาน แคมเปญ สนับสนุนชาเลนจ์', role: 'organizer' },
];

const GENDERS = [
  { id: '', label: 'ไม่บอก' },
  { id: 'female', label: 'หญิง' },
  { id: 'male', label: 'ชาย' },
  { id: 'lgbtq', label: 'LGBTQ+' },
] as const;

const STEPS = ['อยากทำอะไร', 'เกี่ยวกับคุณ', 'สิ่งที่ชอบ'] as const;
const MIN_AGE = 18;

/* ---------- Small UI pieces ---------- */

function SelectCard({ selected, onClick, children, className = '', hideCheck = false }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string; hideCheck?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative text-left rounded-2xl border bg-white transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
        selected ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-slate-200 hover:border-slate-300'
      } ${className}`}
    >
      {children}
      {selected && !hideCheck && (
        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center" aria-hidden="true">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
    </button>
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

function GroupLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
        <PhraseText text={children} />
      </h2>
      {hint && <span className="text-xs font-semibold text-slate-500 shrink-0">{hint}</span>}
    </div>
  );
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/* ---------- Flow ---------- */

export function OnboardingFlow({ preview, returnTo }: { preview: boolean; returnTo: string }) {
  const router = useRouter();
  const session = useMemberSession();
  const { handleSetRole } = useAuth();
  const master = useMasterData();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [previewResult, setPreviewResult] = useState<Record<string, unknown> | null>(null);

  // Step 1
  const [track, setTrack] = useState<Track>('member');
  const [goals, setGoals] = useState<string[]>([]);
  // Step 2
  const [displayName, setDisplayName] = useState('');
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  // Step 3
  const [communityInterests, setCommunityInterests] = useState<string[]>([]);
  const [spotInterests, setSpotInterests] = useState<string[]>([]);
  const [fairInterests, setFairInterests] = useState<string[]>([]);
  const [province, setProvince] = useState('');

  // Prefill the name from the account once per member (render-time derived state)
  if (!preview && session.member && prefilledFrom !== session.member.id) {
    setPrefilledFrom(session.member.id);
    if (!displayName) setDisplayName(session.member.displayName);
  }

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.preview);
  }, [photo]);

  const goalOptions = track === 'member' ? MEMBER_GOALS : HOST_GOALS;
  const role: OnboardingRole = useMemo(() => {
    if (track === 'member') return 'member';
    return HOST_GOALS.find((g) => goals.includes(g.id))?.role ?? 'host';
  }, [track, goals]);

  const thisYearBE = new Date().getFullYear() + 543;
  const birthYears = useMemo(() => Array.from({ length: 63 }, (_, i) => String(thisYearBE - MIN_AGE - i)), [thisYearBE]);
  const interestCount = communityInterests.length + spotInterests.length + fairInterests.length;
  const featuredProvinces = master.featuredProvinces.filter((p) => p.image);
  const isSignUpOpen = !preview && session.isLoaded && !session.member;

  const interestGroups = [
    { label: 'อยากทำอะไร กับคนอื่น', items: master.communityCategories, value: communityInterests, set: setCommunityInterests },
    { label: 'ชอบไปพักผ่อน แบบไหน', items: master.spotVibes, value: spotInterests, set: setSpotInterests },
    { label: 'งานแบบไหน ที่อยากไปเดิน', items: master.fairCategories, value: fairInterests, set: setFairInterests },
  ];

  const next = () => {
    setError('');
    if (step === 0 && goals.length === 0) return setError('เลือกสักข้อก่อนนะ');
    if (step === 1) {
      const name = displayName.trim();
      if (name.length < 2) return setError('ขอชื่อสั้นๆ อย่างน้อย 2 ตัวอักษร');
      if (name.length > 40) return setError('ชื่อยาวได้ไม่เกิน 40 ตัวอักษร');
    }
    if (step === 2) return void finish();
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
    role,
    goals,
    birthYear: birthYear ? Number(birthYear) - 543 : undefined,
    gender: gender || undefined,
    interests: { communityCategories: communityInterests, spotVibes: spotInterests, fairCategories: fairInterests },
    province: province || undefined,
    completedAt: new Date().toISOString(),
  });

  const finish = async () => {
    if (preview) {
      setPreviewResult({ displayName: displayName.trim(), photo: photo ? 'เลือกแล้ว (ไม่อัปโหลดในโหมดทดลอง)' : 'ไม่มี', ...preferences() });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (isFinishing) return;
    setIsFinishing(true);
    try {
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
      try {
        localStorage.setItem('cch_member_preferences', JSON.stringify(preferences()));
      } catch {
        /* storage unavailable */
      }
      const previewRole: Record<OnboardingRole, UserRole> = { member: 'member', host: 'host', venue: 'venue_owner', organizer: 'organizer' };
      handleSetRole(previewRole[role]);
      router.push(returnTo || (role !== 'member' ? '/myhub?welcome=true' : '/?welcome=true'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
      setIsFinishing(false);
    }
  };

  const restartPreview = () => {
    setPreviewResult(null);
    setStep(0);
    setTrack('member');
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col">
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between gap-3 border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <BrandLogo size="sm" />
          <span className="font-extrabold text-sm sm:text-base text-[#1E293B] truncate">Chill & Connect Hub</span>
        </Link>
        {!isSignUpOpen && (
          <button
            type="button"
            onClick={() => router.push(preview ? '/' : returnTo || '/')}
            className="shrink-0 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap"
          >
            {preview ? 'ออกจากโหมดทดลอง' : 'ข้ามไปก่อน'}
          </button>
        )}
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {preview && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold flex items-start gap-2" role="note">
            <FlaskConical className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span><PhraseText text="โหมดทดลอง: ไม่ต้องสมัคร และไม่บันทึกข้อมูลใดๆ ลงบัญชีหรือเครื่องนี้" /></span>
          </div>
        )}

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 sm:p-8">
          {previewResult ? (
            <section>
              <StepHeading title="ทดลองครบแล้ว" subtitle="นี่คือข้อมูลที่ระบบจะบันทึก ถ้าเป็นการสมัครจริง" />
              <pre className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap break-words text-slate-700">
                {JSON.stringify(previewResult, null, 2)}
              </pre>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={restartPreview} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  ลองใหม่
                </button>
                <Link href="/login?mode=signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-extrabold shadow-sm whitespace-nowrap">
                  ไปสมัครจริง
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-7">
                <div className="grid grid-cols-3 gap-2" aria-hidden="true">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full ${i <= step ? 'bg-[#2563EB]' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className="mt-2.5 text-xs font-semibold text-slate-500">
                  ขั้นที่ {step + 1} จาก {STEPS.length} · <span className="text-slate-800 font-bold">{STEPS[step]}</span>
                </p>
              </div>

              {/* Step 1 */}
              {step === 0 && (
                <section>
                  <StepHeading title="ช่วงนี้ อยากทำอะไรบ้าง" subtitle="เลือกได้หลายข้อ ไม่มีถูกผิด เราจะหาสิ่งที่น่าจะถูกใจ มาให้ก่อน" />
                  <div className="inline-flex p-1 rounded-full bg-slate-100 mb-5" role="tablist" aria-label="คุณมาในฐานะ">
                    {([['member', 'อยากไปร่วม'], ['host', 'อยากชวนคนมา']] as const).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={track === id}
                        onClick={() => {
                          setTrack(id);
                          setGoals([]);
                          setError('');
                        }}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          track === id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {goalOptions.map((goal) => {
                      const Icon = goal.icon;
                      return (
                        <SelectCard
                          key={goal.id}
                          selected={goals.includes(goal.id)}
                          onClick={() => {
                            setGoals((g) => toggle(g, goal.id));
                            setError('');
                          }}
                          className="p-4 pr-10 flex items-start gap-3"
                        >
                          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                              <PhraseText text={goal.title} />
                            </span>
                            <span className="block text-xs sm:text-sm text-slate-500 font-medium mt-1">
                              <PhraseText text={goal.desc} />
                            </span>
                          </span>
                        </SelectCard>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Step 2 */}
              {step === 1 && (
                <section>
                  <StepHeading title="เพื่อนใหม่ จะเรียกคุณว่าอะไรดี" subtitle="ใช้ชื่อเล่นก็ได้ แก้ทีหลังได้เสมอ" />
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
                        <input id="onb-name" type="text" autoComplete="nickname" maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="เช่น ส้ม หรือ Som" className={inputClass} />
                      </div>

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
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                          <PhraseText text={`ช่วยให้เจอกิจกรรม ที่คนวัยใกล้ๆ กันไป ไม่แสดงบนโปรไฟล์ สมาชิกต้องอายุ ${MIN_AGE} ปีขึ้นไป`} />
                        </p>
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
                              className={`px-3.5 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                gender === g.id ? 'border-[#2563EB] bg-blue-50 text-[#1D4ED8]' : 'border-slate-300 text-slate-700 hover:border-slate-400'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </div>
                </section>
              )}

              {/* Step 3 */}
              {step === 2 && (
                <section className="space-y-8">
                  <StepHeading title="อะไรทำให้คุณ รู้สึกดี" subtitle="แตะที่ชอบได้เลย เลือกเยอะ หรือไม่เลือกเลยก็ได้" />

                  {interestGroups.map((group) => (
                    <div key={group.label}>
                      <GroupLabel hint={group.value.length ? `เลือกแล้ว ${group.value.length}` : undefined}>{group.label}</GroupLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const selected = group.value.includes(item.id);
                          return (
                            <SelectCard key={item.id} hideCheck selected={selected} onClick={() => group.set((v) => toggle(v, item.id))} className="p-3 flex flex-col items-start gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-2.5 min-h-[56px]">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-[#2563EB] text-white' : `${item.colorScheme.iconBg} ${item.colorScheme.iconColor}`}`}>
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

                  <div>
                    <GroupLabel hint="ไม่บอกก็ได้">ปกติอยู่แถวไหน</GroupLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {featuredProvinces.slice(0, 8).map((p) => (
                        <SelectCard key={p.id} selected={province === p.id} onClick={() => setProvince((cur) => (cur === p.id ? '' : p.id))} className="overflow-hidden">
                          <span className="block aspect-[4/3] bg-slate-100">
                            {p.image && (
                              // eslint-disable-next-line @next/next/no-img-element -- small static thumbnails
                              <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                            )}
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

              {error && (
                <div role="alert" className="mt-6 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span><PhraseText text={error} /></span>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <button type="button" onClick={back} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    ย้อนกลับ
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={next}
                  disabled={isFinishing || isCompressing}
                  className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-extrabold shadow-sm cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isFinishing && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>{step < STEPS.length - 1 ? 'ถัดไป' : isFinishing ? 'กำลังบันทึก…' : interestCount ? 'ไปดูกันเลย' : 'ข้ามไปก่อน'}</span>
                  {!isFinishing && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-[#E8E2D8] bg-white/50">Chill & Connect Hub © 2026</footer>

      {/* Visitors without an account sign up first (shared AuthPanel) */}
      {isSignUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="onboarding-auth-title" className="bg-white rounded-[32px] max-w-[520px] w-full border border-slate-200 shadow-2xl p-6 sm:p-10 max-h-[92vh] overflow-y-auto">
            <AuthPanel
              initialView="signup"
              titleId="onboarding-auth-title"
              returnTo={`/onboarding${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
              onClose={() => router.push('/')}
              onAuthenticated={() => undefined}
            />
            {process.env.NODE_ENV !== 'production' && (
              <p className="mt-4 text-center text-xs font-semibold text-slate-500">
                <Link href="/onboarding?preview=1" className="underline hover:text-slate-800">ทดลองขั้นตอนนี้โดยไม่สมัคร (โหมดพัฒนา)</Link>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
