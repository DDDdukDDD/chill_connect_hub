'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { InviteFriendsCard } from '@/components/InviteFriendsCard';
import {
  AlertCircle, BadgeCheck, Ban, CalendarPlus, Check, CircleCheck, Clock, Flag, HandHeart, KeyRound, Loader2, LogOut, MailCheck, MapPin, Pencil, ShieldCheck, UserRound,
  Award, Briefcase, Building2, Camera, ChevronRight, GraduationCap, Heart, Home, Users, type LucideIcon
} from 'lucide-react';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { Navbar } from '@/components/Navbar';
import { ReportSafetyModal } from '@/components/ReportSafetyModal';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { PhraseText } from '@/components/auth/PhraseText';
import { MOCK_PROFILES } from '@/data/profilesData';
import { nameInitial } from '@/lib/displayName';
import type { HostApplication, MemberPreferences, MemberProfile, ProfileFieldKey, PublicMember } from '@/lib/members/types';
import { NEW_ACCOUNT_DAYS } from '@/lib/members/trust';
import { useAuth } from '@/lib/useAuth';
import { useMasterData } from '@/lib/useMasterData';
import { memberActions } from '@/lib/useMemberSession';
import { RelatedCards } from '@/components/detail/RelatedCards';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';
import { EditProfileDialog, FIELD_LABELS, type EditTab } from './EditProfileDialog';

/**
 * Member profile.
 *   /profile            → my own profile (needs a signed-in member)
 *   /profile?id=mem_…   → another member's public profile: only what they chose to show
 *   /profile?id=host-…  → a sample profile from data/profilesData.ts (sample hosts of sample events)
 * Badges show only facts the server checked (email verified, pledge accepted, trusted, approved host).
 */
interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  memberSince?: string;
  about: Partial<Record<ProfileFieldKey, string>>;
  gender?: MemberPreferences['gender'];
  ageBand?: string;
  province?: string;
  interests?: MemberPreferences['interests'];
  badges: { emailVerified: boolean; pledged: boolean; trusted: boolean; approvedHost: boolean; hostKind?: HostApplication['kind'] };
  isMe: boolean;
  viewer?: { isFollowing?: boolean; hasBlocked: boolean; hasReported: boolean };
  followerCount?: number;
  followingCount?: number;
  /** Badges of the challenges this member finished */
  challengeBadges?: { questId: string; badgeLabel: string; title: string }[];
  hostReviews?: { count: number; average: number; latest: { id: string; rating: number; text: string; eventTitle: string; authorId: string | null; authorName: string; timeAgo: string }[] };
  isSampleAccount?: boolean;
  isSample?: boolean;
  sampleInterests?: string[];
  sampleMoments?: { id: string; image: string; caption: string }[];
}

interface OwnData {
  member: PublicMember;
  details: MemberProfile;
  preferences: MemberPreferences | null;
  hostApplication: HostApplication | null;
}

/** An event this member created; the owner also sees the ones still waiting for review */
interface HostedEvent {
  id: string;
  title: string;
  date?: string;
  location?: string;
  image?: string;
  eventType?: string;
  status?: string;
  approvalStatus?: string;
}

interface MomentThumb {
  id: string;
  image: string;
  caption: string;
}

const GENDER_LABELS: Record<NonNullable<MemberPreferences['gender']>, string> = { female: 'หญิง', male: 'ชาย', lgbtq: 'LGBTQ+' };
const HOST_KIND_LABELS: Record<HostApplication['kind'], string> = { host: 'เปิดตี้', venue: 'ร้านหรือพื้นที่', organizer: 'ผู้จัดงานหรือแบรนด์' };
const ABOUT_ORDER: ProfileFieldKey[] = ['connectGoal', 'occupation', 'workplace', 'education', 'livingArea', 'hometown', 'relationshipStatus'];
// Open sections divided by a line, not boxes (owner 2026-10-24: drawn like the challenge page, people first)
const card = 'mt-10 pt-10 border-t border-slate-200';
// How much of a long list shows at first, and per "ดูเพิ่ม"
const PAGE_HOSTED = 6;
const FIRST_MOMENTS = 9;
const PAGE_MOMENTS = 12;
const FIRST_BADGES = 10;
const MORE_BUTTON = 'mt-5 inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full border border-slate-300 hover:border-slate-900 text-sm font-bold text-slate-800 cursor-pointer disabled:opacity-60';
/** About facts as short lines: an icon, a lead-in and the value ("ทำงานเป็น นักออกแบบ") */
const ABOUT_ICONS: Partial<Record<ProfileFieldKey, LucideIcon>> = {
  connectGoal: Users, occupation: Briefcase, workplace: Building2, education: GraduationCap, livingArea: Home, hometown: MapPin, relationshipStatus: Heart,
};
const ABOUT_LEADS: Partial<Record<ProfileFieldKey, string>> = {
  connectGoal: 'อยากเจอ', occupation: 'ทำงานเป็น', workplace: 'ทำงานที่', education: 'เรียนที่', livingArea: 'อยู่ย่าน', hometown: 'บ้านเกิด', relationshipStatus: 'สถานะ',
};
// The owner-only tray at the end: two columns from sm, so private settings stay one short block
const trayCard = 'min-w-0 scroll-mt-24';
const ACCOUNT_ROW = 'w-full flex items-center gap-3 min-h-11 text-left text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer';
const inputClass =
  'w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

const monthYear = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) : '');

async function getJson<T>(url: string): Promise<{ ok: boolean; status: number; json: T | null }> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return { ok: res.ok, status: res.status, json: (await res.json().catch(() => null)) as T | null };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}

function sampleProfile(id: string): PublicProfile | null {
  const p = MOCK_PROFILES[id];
  if (!p) return null;
  return {
    id: p.id,
    displayName: p.name,
    avatarUrl: p.avatar,
    about: { bio: p.bio, occupation: p.occupation, education: p.education, hometown: p.hometown, livingArea: p.location, connectGoal: p.connectGoal },
    badges: { emailVerified: false, pledged: false, trusted: false, approvedHost: false },
    isMe: false,
    isSample: true,
    sampleInterests: p.passions,
    sampleMoments: p.moments.map((m) => ({ id: m.id, image: m.image, caption: m.caption })),
  };
}

/* ---------- Pieces ---------- */

function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-sm font-bold text-rose-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span><PhraseText text={message} /></span>
    </p>
  );
}

/** My standing, and what each step unlocks. Every row is a fact from the server. */
export function TrustCard({ member, onChanged }: { member: PublicMember; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [devUrl, setDevUrl] = useState<string | undefined>(() => {
    try {
      return sessionStorage.getItem('cch_dev_verify_url') ?? undefined;
    } catch {
      return undefined;
    }
  });
  const t = member.trust;
  const daysLeft = Math.max(0, NEW_ACCOUNT_DAYS - t.accountDays);
  const levelText = t.level === 'trusted' ? 'สมาชิกที่เชื่อถือได้' : t.level === 'verified' ? 'ยืนยันแล้ว' : 'บัญชีใหม่';

  const send = async () => {
    setBusy(true);
    setNote('');
    try {
      const result = await memberActions.sendEmailVerification();
      if (result.alreadyVerified) onChanged();
      else if (result.devVerifyUrl) setDevUrl(result.devVerifyUrl);
      else setNote(result.sent ? 'ส่งลิงก์ไปที่อีเมลของคุณแล้ว ลิงก์ใช้ได้ 48 ชั่วโมง' : 'ระบบส่งอีเมลยังไม่พร้อม กรุณาลองใหม่ภายหลัง');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'ส่งลิงก์ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const rows: { done: boolean; title: string; desc: string; action?: React.ReactNode }[] = [
    {
      done: t.emailVerified,
      title: 'ยืนยันอีเมล',
      desc: t.emailVerified ? 'ยืนยันแล้ว' : t.hasEmail ? 'กดลิงก์ในอีเมลที่เราส่งให้ จึงจะเข้าร่วมตี้ โพสต์ และคอมเมนต์ได้' : 'บัญชีนี้ยังไม่มีอีเมล',
      action: !t.emailVerified && t.hasEmail && (
        <button type="button" onClick={send} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap disabled:opacity-60">
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
          ส่งลิงก์
        </button>
      ),
    },
    {
      done: t.pledged,
      title: 'รับคำมั่นของคอมมูนิตี้',
      desc: t.pledged ? 'รับแล้ว' : 'คำมั่น 4 ข้อที่สมาชิกทุกคนรับร่วมกัน',
      action: !t.pledged && <Link href="/onboarding?step=pledge&returnTo=%2Fprofile" className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">อ่านและรับ</Link>,
    },
    {
      done: t.level === 'trusted',
      title: `เป็นสมาชิกครบ ${NEW_ACCOUNT_DAYS} วัน`,
      desc: t.level === 'trusted' ? 'ใส่ช่องทางติดต่อได้แล้ว' : `อีก ${daysLeft} วัน ระหว่างนี้ยังใส่ลิงก์หรือเบอร์โทรไม่ได้`,
    },
  ];

  return (
    <section id="trust" className={`${card} scroll-mt-24`}>
      <SectionTitle action={<span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">{levelText}</span>}>ความน่าเชื่อถือของบัญชี</SectionTitle>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.title} className="flex items-start gap-3">
            <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${row.done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {row.done ? <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" /> : <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-slate-900">{row.title}</span>
              <span className="block text-xs sm:text-sm font-medium text-slate-500 mt-0.5"><PhraseText text={row.desc} /></span>
            </span>
            {row.action}
          </li>
        ))}
      </ul>
      {note && <p className="mt-3 text-xs font-bold text-slate-600" role="status">{note}</p>}
      {devUrl && !t.emailVerified && (
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-bold text-amber-900"><PhraseText text="โหมดพัฒนา: ยังไม่ได้ตั้งค่าระบบส่งอีเมล ลิงก์ยืนยันจึงแสดงตรงนี้แทน" /></p>
          <a href={devUrl} className="mt-1 block text-xs font-bold text-[#2563EB] underline break-all">{devUrl}</a>
        </div>
      )}
    </section>
  );
}

/** Ask to become a host, venue or organizer; staff approve it before events publish without review */
export function HostCard({ member, application, onChanged }: { member: PublicMember; application: HostApplication | null; onChanged: () => void }) {
  const [kind, setKind] = useState<HostApplication['kind']>('host');
  const [about, setAbout] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [again, setAgain] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const canApply = member.trust.level !== 'new';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await memberActions.submitHostApplication({ kind, about, link: link.trim() || undefined });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งคำขอไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const status = application?.status;
  // Not applied yet (or trying again): one line here, the form opens in a dialog
  const showOffer = !status || (status === 'rejected' && again);
  return (
    <section id="host" className={trayCard}>
      <SectionTitle>อยากเป็นคนชวน</SectionTitle>
      {showOffer && !isFormOpen && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm font-medium text-slate-600"><PhraseText text="อยากเปิดตี้ให้คนอื่นมาร่วม? เมื่อทีมงานอนุมัติ ตี้ของคุณจะเผยแพร่ได้ทันที" /></p>
          <button type="button" onClick={() => setIsFormOpen(true)} className={dialogButton.quiet}>
            <CalendarPlus className="w-4 h-4" aria-hidden="true" />
            ส่งคำขอ
          </button>
        </div>
      )}
      {status === 'approved' && (
        <p className="flex items-start gap-2 text-sm font-semibold text-emerald-800">
          <CircleCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span><PhraseText text={`ทีมงานอนุมัติแล้ว (${HOST_KIND_LABELS[application!.kind]}) ตี้ที่คุณตั้ง จะเผยแพร่ได้ทันที`} /></span>
        </p>
      )}
      {status === 'pending' && (
        <p className="flex items-start gap-2 text-sm font-semibold text-slate-700">
          <Clock className="w-5 h-5 shrink-0 text-slate-500" aria-hidden="true" />
          <span><PhraseText text="ส่งคำขอแล้ว ทีมงานกำลังตรวจ ระหว่างนี้ตี้ที่คุณตั้ง จะรอทีมงานอนุมัติก่อนเผยแพร่" /></span>
        </p>
      )}
      {status === 'rejected' && !again && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            <PhraseText text="คำขอครั้งก่อนยังไม่ผ่าน" />
            {application?.note && <span className="block mt-1 text-slate-500">เหตุผลจากทีมงาน: {application.note}</span>}
          </p>
          <button type="button" onClick={() => setAgain(true)} className={dialogButton.quiet}>ส่งคำขอใหม่</button>
        </div>
      )}
      {showOffer && isFormOpen && (
        <DialogShell onClose={() => setIsFormOpen(false)} size="md" title="ส่งคำขอเป็นคนชวน">
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            <PhraseText text="เล่าให้ทีมงานฟังสั้นๆ ว่าอยากจัดอะไร เมื่ออนุมัติแล้ว กิจกรรมของคุณจะเผยแพร่ได้ทันที ถ้ายังไม่อนุมัติ ก็สร้างกิจกรรมได้ แต่ต้องรอทีมงานตรวจทีละงาน" />
          </p>
          <div className="space-y-1.5">
            <label htmlFor="host-kind" className="block text-xs sm:text-sm font-bold text-slate-800">คุณเป็น</label>
            <select id="host-kind" value={kind} onChange={(e) => setKind(e.target.value as HostApplication['kind'])} className={inputClass} disabled={!canApply}>
              <option value="host">คนที่อยากเปิดตี้</option>
              <option value="venue">เจ้าของร้านหรือพื้นที่</option>
              <option value="organizer">ผู้จัดงานหรือแบรนด์</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="host-about" className="block text-xs sm:text-sm font-bold text-slate-800">อยากจัดอะไร และเคยทำอะไรมาบ้าง</label>
            <textarea id="host-about" rows={3} maxLength={600} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="เช่น อยากเปิดกลุ่มวิ่งเช้าวันเสาร์ที่สวนเบญจกิติ เคยนำวิ่งกลุ่มเพื่อนมา 2 ปี" className={inputClass} disabled={!canApply} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="host-link" className="block text-xs sm:text-sm font-bold text-slate-800">
              ลิงก์ที่ทำให้ทีมงานรู้จักคุณ <span className="font-semibold text-slate-500">(ไม่บังคับ)</span>
            </label>
            <input id="host-link" type="url" inputMode="url" maxLength={200} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" className={inputClass} disabled={!canApply} />
          </div>
          <ErrorLine message={error} />
          {!canApply && <p className="text-xs font-bold text-slate-500"><PhraseText text="ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ก่อน จึงจะส่งคำขอได้" /></p>}
          <button type="submit" disabled={busy || !canApply} className={dialogButton.secondary}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CalendarPlus className="w-4 h-4" aria-hidden="true" />}
            ส่งคำขอให้ทีมงาน
          </button>
        </form>
        </DialogShell>
      )}
    </section>
  );
}

export function AccountCard({ member, onLogout }: { member: PublicMember; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const hasPassword = member.loginMethods.includes('email');
  const methods = member.loginMethods.map((m) => ({ email: 'อีเมลและรหัสผ่าน', google: 'Google', facebook: 'Facebook', apple: 'Apple' })[m]).join(', ');

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
    setBusy(true);
    setError('');
    try {
      await memberActions.changePassword(current, next);
      setDone(true);
      setOpen(false);
      setCurrent('');
      setNext('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="account" className={trayCard}>
      <SectionTitle>บัญชีของฉัน</SectionTitle>
      <dl className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-slate-500">อีเมล</dt>
          <dd className="font-bold text-slate-800 break-all">{member.email ?? 'ไม่มี'}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-slate-500">เข้าสู่ระบบด้วย</dt>
          <dd className="font-bold text-slate-800">{methods || 'ไม่มี'}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs font-medium text-slate-500">อีเมลของคุณไม่แสดงให้สมาชิกคนอื่นเห็น</p>

      {done && <p className="mt-3 text-sm font-bold text-emerald-700" role="status">เปลี่ยนรหัสผ่านแล้ว อุปกรณ์อื่นถูกออกจากระบบ</p>}
      {open && (
        <form onSubmit={change} className="mt-4 space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          {hasPassword && (
            <div className="space-y-1.5">
              <label htmlFor="pw-current" className="block text-xs sm:text-sm font-bold text-slate-800">รหัสผ่านปัจจุบัน</label>
              <input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="pw-next" className="block text-xs sm:text-sm font-bold text-slate-800">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</label>
            <input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
          </div>
          <ErrorLine message={error} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(false)} className={dialogButton.quiet}>ยกเลิก</button>
            <button type="submit" disabled={busy} className={dialogButton.primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              บันทึกรหัสผ่าน
            </button>
          </div>
        </form>
      )}

      {/* Settings as quiet rows, like a phone's settings list */}
      <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
        {!open && member.email && (
          <button type="button" onClick={() => { setOpen(true); setDone(false); }} className={ACCOUNT_ROW}>
            <KeyRound className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span className="flex-1">{hasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน'}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </button>
        )}
        <Link href="/legal?tab=privacy" className={ACCOUNT_ROW}>
          <ShieldCheck className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span className="flex-1">ข้อมูลและความเป็นส่วนตัว</span>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
        </Link>
        <button type="button" onClick={onLogout} className={ACCOUNT_ROW}>
          <LogOut className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span className="flex-1">ออกจากระบบ</span>
        </button>
      </div>
    </section>
  );
}

function ReportDialog({ profile, onClose, onDone }: { profile: PublicProfile; onClose: () => void; onDone: () => void }) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ reasons: string[] }>(`/api/members/${encodeURIComponent(profile.id)}/actions`).then((r) => {
      if (active && r.json?.reasons) setReasons(r.json.reasons);
    });
    return () => {
      active = false;
    };
  }, [profile.id]);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(profile.id)}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'report', reason }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || 'รายงานไม่สำเร็จ');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'รายงานไม่สำเร็จ');
      setBusy(false);
    }
  };

  return (
    <DialogShell onClose={onClose} size="sm" title={`รายงาน ${profile.displayName}`} subtitle="ทีมงานจะตรวจสอบ โดยไม่บอกว่าใครเป็นคนรายงาน">
      <fieldset className="space-y-2 mb-5">
        <legend className="sr-only">เหตุผล</legend>
        {reasons.map((r) => (
          <label key={r} className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer ${reason === r ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="w-4 h-4 accent-[#2563EB]" />
            <span className="text-sm font-semibold text-slate-800">{r}</span>
          </label>
        ))}
      </fieldset>
      <ErrorLine message={error} />
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button type="button" data-autofocus onClick={onClose} className={dialogButton.quiet}>ยกเลิก</button>
        <button type="button" onClick={submit} disabled={busy || !reason} className={dialogButton.secondary}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          ส่งรายงาน
        </button>
      </div>
    </DialogShell>
  );
}

/* ---------- Screen ---------- */

export function ProfileScreen({ profileId }: { profileId: string }) {
  const { isLoggedIn, isAuthReady, member, handleSetIsLoggedIn } = useAuth();
  const master = useMasterData();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [editTab, setEditTab] = useState<EditTab | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportingReview, setReportingReview] = useState<{ id: string; eventTitle: string } | null>(null);
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'missing' | 'signin';
    profile?: PublicProfile;
    own?: OwnData;
    moments: MomentThumb[];
    /** All of this member's moments, and where to read more of them */
    momentsTotal?: number;
    momentsSource?: string;
  }>({ status: 'loading', moments: [] });
  // Long lists open a little at a time
  const [hostedShown, setHostedShown] = useState(PAGE_HOSTED);
  const [momentsShown, setMomentsShown] = useState(FIRST_MOMENTS);
  const [isLoadingMoments, setIsLoadingMoments] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [allReviews, setAllReviews] = useState<NonNullable<PublicProfile['hostReviews']>['latest'] | null>(null);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [hosted, setHosted] = useState<HostedEvent[]>([]);
  const [previewPublic, setPreviewPublic] = useState(false);
  const [myStats, setMyStats] = useState<{ tee: number; xp: number | null } | null>(null);

  const wantsOwn = profileId === 'me' || (member !== null && profileId === member.id);
  const memberId = member?.id;

  // Events this member created: the owner sees every one, visitors only the published ones
  useEffect(() => {
    if (!isAuthReady) return;
    const isMember = profileId.startsWith('mem_');
    if (!(wantsOwn && memberId) && !(isMember && !wantsOwn)) return;
    let active = true;
    getJson<{ events: HostedEvent[] }>(wantsOwn ? '/api/events?mine=1' : `/api/events?host=${encodeURIComponent(profileId)}`).then((res) => {
      if (active) setHosted(res.json?.events ?? []);
    });
    return () => {
      active = false;
    };
  }, [isAuthReady, wantsOwn, memberId, profileId, reload]);

  useEffect(() => {
    if (!isAuthReady) return;
    let active = true;
    const load = async () => {
      type MomentsAnswer = { moments: { id: string; images: string[]; caption: string }[]; pagination?: { totalCount: number } };
      const toThumbs = (json: { moments?: { id: string; images: string[]; caption: string }[] } | null) =>
        (json?.moments ?? []).filter((m) => m.images?.[0]).map((m) => ({ id: m.id, image: m.images[0], caption: m.caption }));
      if (wantsOwn) {
        if (!memberId) return { status: 'signin' as const, moments: [] };
        const [own, mine] = await Promise.all([
          getJson<OwnData & { publicView: PublicProfile }>('/api/auth/member/profile'),
          getJson<MomentsAnswer>(`/api/moments?tab=mine&limit=${PAGE_MOMENTS}`),
        ]);
        if (!own.ok || !own.json) return { status: 'signin' as const, moments: [] };
        return { status: 'ready' as const, profile: own.json.publicView, own: own.json, moments: toThumbs(mine.json), momentsTotal: mine.json?.pagination?.totalCount, momentsSource: '/api/moments?tab=mine' };
      }
      if (!profileId.startsWith('mem_')) {
        const sample = sampleProfile(profileId);
        return sample ? { status: 'ready' as const, profile: sample, moments: sample.sampleMoments ?? [] } : { status: 'missing' as const, moments: [] };
      }
      const [pub, posts] = await Promise.all([
        getJson<{ profile: PublicProfile }>(`/api/members/${encodeURIComponent(profileId)}`),
        getJson<MomentsAnswer>(`/api/moments?author=${encodeURIComponent(profileId)}&limit=${PAGE_MOMENTS}`),
      ]);
      if (!pub.ok || !pub.json?.profile) return { status: 'missing' as const, moments: [] };
      return { status: 'ready' as const, profile: pub.json.profile, moments: toThumbs(posts.json), momentsTotal: posts.json?.pagination?.totalCount, momentsSource: `/api/moments?author=${encodeURIComponent(profileId)}` };
    };
    load().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, [isAuthReady, wantsOwn, memberId, profileId, reload]);

  // My own numbers: ตี้ I went to (host check-ins) and my XP
  useEffect(() => {
    if (!isAuthReady || !wantsOwn || !memberId) return;
    let active = true;
    Promise.all([
      getJson<{ visits: { targetType: string; targetId: string }[] }>('/api/visits?mine=1'),
      getJson<{ points?: { balance: number } }>('/api/rewards'),
    ]).then(([visits, rewards]) => {
      if (!active) return;
      const tee = new Set((visits.json?.visits ?? []).filter((v) => v.targetType === 'community').map((v) => v.targetId)).size;
      setMyStats({ tee, xp: rewards.json?.points?.balance ?? null });
    });
    return () => {
      active = false;
    };
  }, [isAuthReady, wantsOwn, memberId, reload]);

  const refresh = () => setReload((n) => n + 1);

  // "ดูเพิ่ม" on moments: show what is loaded, then read the next page
  const showMoreMoments = async () => {
    const next = momentsShown + PAGE_MOMENTS;
    setMomentsShown(next);
    const total = state.momentsTotal ?? state.moments.length;
    if (next <= state.moments.length || state.moments.length >= total || !state.momentsSource) return;
    setIsLoadingMoments(true);
    const page = Math.floor(state.moments.length / PAGE_MOMENTS) + 1;
    const res = await getJson<{ moments: { id: string; images: string[]; caption: string }[] }>(`${state.momentsSource}&limit=${PAGE_MOMENTS}&page=${page}`);
    const more = (res.json?.moments ?? []).filter((m) => m.images?.[0]).map((m) => ({ id: m.id, image: m.images[0], caption: m.caption }));
    setState((now) => ({ ...now, moments: [...now.moments, ...more.filter((m) => !now.moments.some((had) => had.id === m.id))] }));
    setIsLoadingMoments(false);
  };

  const openAllReviews = async () => {
    setIsReviewsOpen(true);
    if (allReviews || !state.profile) return;
    const res = await getJson<{ reviews: { latest: NonNullable<PublicProfile['hostReviews']>['latest'] } }>(`/api/members/${encodeURIComponent(state.profile.id)}/reviews`);
    setAllReviews(res.json?.reviews.latest ?? []);
  };
  const { profile, own } = state;
  // The owner's view of their own page; null for visitors and while previewing as others
  const viewOwn = own && !previewPublic ? own : null;
  const provinceName = profile?.province ? master.provinces.find((p) => p.id === profile.province)?.displayName ?? profile.province : undefined;
  const hiddenKeys = own?.details.hidden ?? [];
  const liveHosted = hosted.filter((ev) => ev.approvalStatus === 'approved').length;
  const hostedRank = (ev: HostedEvent) => (ev.approvalStatus !== 'approved' ? 0 : ev.status === 'ended' ? 2 : 1);
  const hostedSorted = [...hosted].sort((a, b) => {
    const rank = hostedRank(a) - hostedRank(b);
    if (rank !== 0) return rank;
    const when = parseEventDateToTimestamp(a.date ?? '') - parseEventDateToTimestamp(b.date ?? '');
    return hostedRank(a) === 2 ? -when : when;
  });

  const toggleFollow = async () => {
    if (!profile) return;
    const following = !profile.viewer?.isFollowing;
    const res = await fetch(`/api/members/${encodeURIComponent(profile.id)}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: following ? 'follow' : 'unfollow' }) });
    const json = await res.json().catch(() => null);
    if (res.ok) {
      setNotice(following ? `ติดตาม ${profile.displayName} แล้ว ดูโพสต์ได้ที่หน้าโมเมนต์ แท็บ "ติดตาม"` : `เลิกติดตาม ${profile.displayName} แล้ว`);
      refresh();
    } else setNotice(json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ');
  };

  const toggleBlock = async () => {
    if (!profile) return;
    const blocking = !profile.viewer?.hasBlocked;
    const res = await fetch(`/api/members/${encodeURIComponent(profile.id)}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: blocking ? 'block' : 'unblock' }) });
    if (res.ok) {
      setNotice(blocking ? `บล็อก ${profile.displayName} แล้ว คุณจะไม่เห็นโพสต์ของเขาอีก` : `เลิกบล็อก ${profile.displayName} แล้ว`);
      refresh();
    }
  };

  // Own profile shows every filled field (hidden ones are marked); a public profile shows only visible ones
  const aboutRows = profile
    ? ABOUT_ORDER.map((key) => ({ key, value: viewOwn ? viewOwn.details[key as keyof MemberProfile] as string | undefined : profile.about[key] })).filter((row) => row.value)
    : [];
  const bio = viewOwn ? viewOwn.details.bio : profile?.about.bio;

  // สายที่ชอบ: only the สาย the member picked (as in onboarding), with the สาย's own icon and colour; the places and
  // events inferred from them are for suggestions, not something the member said (the owner sees hidden ones too)
  const interestSource = viewOwn ? viewOwn.preferences?.interests : profile?.interests;
  const interestChips: { name: string; icon?: LucideIcon; tone: string }[] = interestSource
    ? interestSource.communityCategories.flatMap((id) => {
        const cat = master.communityCategories.find((c) => c.id === id);
        return cat ? [{ name: cat.name, icon: cat.icon, tone: `${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor}` }] : [];
      })
    : (profile?.sampleInterests ?? []).map((name) => ({ name, tone: 'bg-slate-100 text-slate-700' }));

  // The numbers under the name; each one appears only when it says something
  const hostedVisible = viewOwn ? hostedSorted : hostedSorted.filter((ev) => ev.approvalStatus === 'approved');
  const momentsCount = String(state.momentsTotal ?? state.moments.length);
  const stats: { label: string; value: string; href?: string; tone?: string }[] = (profile
    ? [
        ...(viewOwn && myStats ? [{ label: 'ตี้ที่ไปมาแล้ว', value: String(myStats.tee) }] : []),
        ...(liveHosted > 0 ? [{ label: 'ตี้ที่จัด', value: String(liveHosted), href: '#hosted' }] : []),
        ...(profile.hostReviews && profile.hostReviews.count > 0 ? [{ label: `จาก ${profile.hostReviews.count} รีวิว`, value: `★ ${profile.hostReviews.average.toFixed(1)}`, href: '#reviews' }] : []),
        ...(state.moments.length > 0 || viewOwn ? [{ label: 'โมเมนต์', value: momentsCount, href: '#moments' }] : []),
        ...(profile.challengeBadges && profile.challengeBadges.length > 0 ? [{ label: 'เหรียญ', value: String(profile.challengeBadges.length), href: '#badges' }] : []),
        ...(profile.followerCount !== undefined ? [{ label: 'ผู้ติดตาม', value: String(profile.followerCount) }] : []),
        ...(viewOwn && myStats?.xp != null ? [{ label: 'XP', value: myStats.xp.toLocaleString(), href: '/rewards' }] : []),
      ]
    : []
  ).filter((stat) => stat.value !== '0');

  // How complete my profile is: what a new friend looks at before joining my ตี้
  const strengthSteps = viewOwn
    ? [
        { done: Boolean(profile?.avatarUrl), label: 'ใส่รูปโปรไฟล์', tab: 'me' as EditTab },
        { done: Boolean(viewOwn.details.bio), label: 'แนะนำตัวสั้นๆ', tab: 'me' as EditTab },
        { done: interestChips.length > 0, label: 'บอกสายที่ชอบ', tab: 'interests' as EditTab },
        { done: aboutRows.length >= 2, label: 'เล่าเกี่ยวกับตัวเอง', tab: 'about' as EditTab },
        { done: viewOwn.member.trust.emailVerified, label: 'ยืนยันอีเมล', href: '/profile/settings' },
        { done: viewOwn.member.trust.pledged, label: 'รับคำมั่นของคอมมูนิตี้', href: '/onboarding?step=pledge&returnTo=%2Fprofile' },
      ]
    : [];
  const strengthLeft = strengthSteps.filter((step) => !step.done) as { done: boolean; label: string; href?: string; tab?: EditTab }[];
  const strengthPercent = strengthSteps.length ? Math.round(((strengthSteps.length - strengthLeft.length) / strengthSteps.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <Navbar
        showMenuOnMobile
        activeTab="profile"
        setActiveTab={() => undefined}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthOpen(true)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-28 lg:pb-16">
        {state.status === 'loading' && (
          <div className={`${card} flex items-center gap-2 text-sm font-bold text-slate-500`} role="status">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            กำลังโหลดโปรไฟล์…
          </div>
        )}

        {state.status === 'signin' && (
          <div className={`${card} text-center`}>
            <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <UserRound className="w-7 h-7" aria-hidden="true" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">โปรไฟล์ของคุณ</h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-6"><PhraseText text="เข้าสู่ระบบก่อน เพื่อดูและแก้ไขโปรไฟล์ของคุณ" /></p>
            <button type="button" onClick={() => setIsAuthOpen(true)} className={dialogButton.primary}>เข้าสู่ระบบ</button>
          </div>
        )}

        {state.status === 'missing' && (
          <div className={`${card} text-center`}>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ไม่พบโปรไฟล์นี้</h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-6"><PhraseText text="สมาชิกคนนี้อาจลบบัญชี หรือถูกระงับการใช้งาน" /></p>
            <Link href="/" className={dialogButton.quiet}>กลับหน้าแรก</Link>
          </div>
        )}

        {state.status === 'ready' && profile && (
          <>
            {notice && <p role="status" className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{notice}</p>}

            {/* Seeing my page as others do: one bar, one way back */}
            {own && previewPublic && (
              <div className="sticky top-16 z-20 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white px-4 py-3">
                <p className="text-sm font-bold">นี่คือโปรไฟล์ที่คนอื่นเห็น</p>
                <button type="button" onClick={() => setPreviewPublic(false)} className="inline-flex items-center min-h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-sm font-bold cursor-pointer whitespace-nowrap">
                  กลับไปแก้ไข
                </button>
              </div>
            )}

            {/* Identity card on the left (sticky from lg), the person's story on the right: Airbnb-like, no cover (owner 2026-10-25) */}
            <div className="mt-6 grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16 lg:items-start">
              <aside className="lg:sticky lg:top-24">
                <section className="rounded-3xl border border-slate-200 shadow-[0_6px_24px_rgba(15,23,42,0.06)] p-6 sm:p-7">
                  <div className="flex flex-col items-center text-center">
                    <span className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#F26430] to-[#7C3AED] text-white text-5xl font-bold flex items-center justify-center">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- member photo from uploads or a provider
                        <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        nameInitial(profile.displayName, 'C')
                      )}
                    </span>
                    <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight break-words">{profile.displayName}</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {[provinceName, profile.ageBand ? `อายุ ${profile.ageBand}` : '', profile.gender ? GENDER_LABELS[profile.gender] : ''].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {profile.memberSince ? `สมาชิกตั้งแต่ ${monthYear(profile.memberSince)}` : ''}
                    </p>
                    {(profile.isSample || profile.isSampleAccount) && !profile.isMe && <span className="mt-2 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">โปรไฟล์ตัวอย่าง</span>}
                  </div>

                  {/* The numbers, one per line; zeros are left out */}
                  {stats.length > 0 && (
                    <dl className="mt-6 pt-5 border-t border-slate-200 space-y-3">
                      {stats.map((stat) => {
                        const row = (
                          <>
                            <dd className={`w-16 shrink-0 text-2xl font-bold tabular-nums ${stat.tone ?? 'text-slate-900'}`}>{stat.value}</dd>
                            <dt className="text-sm font-medium text-slate-600">{stat.label}</dt>
                          </>
                        );
                        return stat.href ? (
                          <a key={stat.label} href={stat.href} className="flex items-baseline hover:opacity-80">{row}</a>
                        ) : (
                          <div key={stat.label} className="flex items-baseline">{row}</div>
                        );
                      })}
                    </dl>
                  )}

                  {/* What the server checked */}
                  {(profile.badges.emailVerified || profile.badges.pledged || profile.badges.trusted || profile.badges.approvedHost) && (
                    <ul className="mt-5 pt-5 border-t border-slate-200 space-y-2 text-sm font-medium text-slate-700">
                      {profile.badges.approvedHost && <li className="flex items-center gap-2.5"><BadgeCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />โฮสต์ที่ทีมงานตรวจแล้ว</li>}
                      {profile.badges.trusted && !profile.badges.approvedHost && <li className="flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />สมาชิกที่เชื่อถือได้</li>}
                      {profile.badges.emailVerified && <li className="flex items-center gap-2.5"><MailCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />ยืนยันอีเมลแล้ว</li>}
                      {profile.badges.pledged && <li className="flex items-center gap-2.5"><HandHeart className="w-4 h-4 text-emerald-600" aria-hidden="true" />รับคำมั่นของคอมมูนิตี้แล้ว</li>}
                    </ul>
                  )}

                  {/* One action: edit for the owner, follow for a visitor */}
                  {viewOwn && (
                    <button type="button" onClick={() => setEditTab('me')} className="mt-6 w-full inline-flex items-center justify-center gap-2 min-h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer">
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      แก้ไขโปรไฟล์
                    </button>
                  )}
                  {!profile.isMe && !profile.isSample && isLoggedIn && !profile.viewer?.hasBlocked && (
                    <button
                      type="button"
                      onClick={toggleFollow}
                      aria-pressed={Boolean(profile.viewer?.isFollowing)}
                      className={`mt-6 w-full inline-flex items-center justify-center min-h-11 rounded-full text-sm font-bold cursor-pointer ${profile.viewer?.isFollowing ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm'}`}
                    >
                      {profile.viewer?.isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
                    </button>
                  )}
                </section>

                {!profile.isMe && !profile.isSample && isLoggedIn && (
                  <div className="mt-3 flex justify-center gap-x-5">
                    <button type="button" onClick={() => setIsReporting(true)} disabled={profile.viewer?.hasReported} className="inline-flex items-center gap-1.5 min-h-10 text-sm font-semibold text-slate-500 hover:text-slate-800 underline-offset-4 hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                      <Flag className="w-4 h-4" aria-hidden="true" />
                      {profile.viewer?.hasReported ? 'รายงานแล้ว' : 'รายงานโปรไฟล์นี้'}
                    </button>
                    <button type="button" onClick={toggleBlock} className="inline-flex items-center gap-1.5 min-h-10 text-sm font-semibold text-slate-500 hover:text-slate-800 underline-offset-4 hover:underline cursor-pointer">
                      <Ban className="w-4 h-4" aria-hidden="true" />
                      {profile.viewer?.hasBlocked ? 'เลิกบล็อก' : 'บล็อก'}
                    </button>
                  </div>
                )}
              </aside>

              <div className="min-w-0">
                {/* Owner only: how complete the profile is, as one line with the next step */}
                {viewOwn && strengthLeft.length > 0 && (
                  <div className="mb-8 flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">โปรไฟล์ครบ {strengthPercent}%</span>
                    <span className="hidden sm:block flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
                      <span className="block h-full rounded-full bg-[#2563EB]" style={{ width: `${strengthPercent}%` }} />
                    </span>
                    {strengthLeft[0].href ? (
                      <Link href={strengthLeft[0].href} className="ml-auto sm:ml-0 inline-flex items-center gap-0.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap">
                        {strengthLeft[0].label}
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    ) : (
                      <button type="button" onClick={() => setEditTab(strengthLeft[0].tab ?? 'me')} className="ml-auto sm:ml-0 inline-flex items-center gap-0.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap cursor-pointer">
                        {strengthLeft[0].label}
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                {/* About: a short story with icons, not a form */}
                <section>
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{profile.isMe ? 'เกี่ยวกับฉัน' : `เกี่ยวกับ ${profile.displayName}`}</h2>
                    {viewOwn && (
                      <button type="button" onClick={() => setEditTab('about')} className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer">แก้ไข</button>
                    )}
                  </div>
                  {bio ? (
                    <p className="mt-4 text-base sm:text-lg font-medium text-slate-800 leading-relaxed whitespace-pre-line break-words max-w-prose">
                      {bio}
                      {viewOwn && hiddenKeys.includes('bio') && <span className="ml-2 text-xs font-bold text-slate-400 whitespace-nowrap">(ซ่อนอยู่)</span>}
                    </p>
                  ) : (
                    viewOwn && (
                      <button type="button" onClick={() => setEditTab('me')} className="mt-4 text-base font-medium text-slate-400 hover:text-slate-600 cursor-pointer text-left">
                        + เล่าเกี่ยวกับตัวเองสักประโยค ให้เพื่อนใหม่รู้จักคุณ
                      </button>
                    )
                  )}
                  {aboutRows.length > 0 && (
                    <ul className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
                      {aboutRows.map((row) => {
                        const Icon = ABOUT_ICONS[row.key] ?? UserRound;
                        return (
                          <li key={row.key} className="flex items-start gap-3 text-sm sm:text-base text-slate-800">
                            <Icon className="w-5 h-5 mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
                            <span className="min-w-0 break-words">
                              <span className="text-slate-500">{ABOUT_LEADS[row.key] ?? FIELD_LABELS[row.key]}</span> <span className="font-semibold">{row.value}</span>
                              {viewOwn && hiddenKeys.includes(row.key) && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-500 whitespace-nowrap">ซ่อนอยู่</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* สายที่ชอบ under the story, in each สาย's colour */}
                  {interestChips.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-sm font-bold text-slate-900">{viewOwn && hiddenKeys.includes('interests') ? 'สายที่ชอบ (ซ่อนอยู่)' : 'สายที่ชอบ'}</h3>
                        {viewOwn && (
                          <button type="button" onClick={() => setEditTab('interests')} className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer">แก้ไข</button>
                        )}
                      </div>
                      <ul className="mt-2.5 flex flex-wrap gap-2">
                        {interestChips.map((chip) => (
                          <li key={chip.name} className={`inline-flex items-center gap-2 min-h-9 px-3.5 rounded-full text-sm font-bold ${chip.tone}`}>
                            {chip.icon && <chip.icon className="w-4 h-4" aria-hidden="true" />}
                            {chip.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {viewOwn && interestChips.length === 0 && (
                    <button type="button" onClick={() => setEditTab('interests')} className="mt-6 block text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer">+ บอกสายที่ชอบ</button>
                  )}
                </section>

                {/* ตี้ this member hosts: a visitor's best signal of who they are. Managing them happens in My Hub. */}
                {hostedVisible.length > 0 && (
                  <div id="hosted" className={`${card} scroll-mt-24`}>
                    <RelatedCards
                      className=""
                      gridClassName="grid-cols-2 sm:grid-cols-3"
                      title="ตี้ที่จัด"
                      allHref={viewOwn ? '/myhub' : undefined}
                      allLabel="จัดการในมายฮับ"
                      items={hostedVisible.slice(0, hostedShown).map((ev) => {
                        const isLive = ev.approvalStatus === 'approved';
                        return {
                          id: ev.id,
                          href: isLive ? `${ev.eventType === 'public_venue' ? '/fairs' : '/community'}/${encodeURIComponent(ev.id)}` : undefined,
                          image: ev.image,
                          dateText: ev.date,
                          title: ev.title,
                          note: !isLive ? (ev.approvalStatus === 'rejected' ? 'ไม่ผ่านการตรวจ' : 'รอทีมงานตรวจ') : ev.status === 'ended' ? 'จบแล้ว' : ev.location || '',
                        };
                      })}
                    />
                    {hostedVisible.length > hostedShown && (
                      <button type="button" onClick={() => setHostedShown((n) => n + PAGE_HOSTED)} className={MORE_BUTTON}>
                        ดูเพิ่ม <span className="tabular-nums">({(hostedVisible.length - hostedShown).toLocaleString()})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Reviews from people who joined this member's ตี้ */}
                {profile.hostReviews && profile.hostReviews.count > 0 && (
                  <section id="reviews" className={`${card} scroll-mt-24`}>
                    <SectionTitle>{`★ ${profile.hostReviews.average.toFixed(1)} · ${profile.hostReviews.count} รีวิวจากคนที่ไป`}</SectionTitle>
                    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                      {profile.hostReviews.latest.map((r) => (
                        <li key={r.id}>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <span className="font-bold text-slate-900">{r.authorName}</span>
                            <span className="text-slate-500">{r.timeAgo}</span>
                            {isLoggedIn && r.authorId !== member?.id && (
                              <button type="button" onClick={() => setReportingReview({ id: r.id, eventTitle: r.eventTitle })} className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 cursor-pointer" aria-label={`รายงานรีวิวของ ${r.authorName}`}>
                                <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </p>
                          <p className="text-amber-500 text-sm" aria-label={`${r.rating} จาก 5 ดาว`}>{'★'.repeat(r.rating)}<span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span></p>
                          {r.text && <p className="mt-1 text-sm sm:text-base text-slate-700 leading-relaxed">{r.text}</p>}
                          <p className="mt-1 text-xs text-slate-500 truncate">ตี้: {r.eventTitle}</p>
                        </li>
                      ))}
                    </ul>
                    {profile.hostReviews.count > profile.hostReviews.latest.length && (
                      <button type="button" onClick={openAllReviews} className={MORE_BUTTON}>
                        ดูรีวิวทั้งหมด <span className="tabular-nums">{profile.hostReviews.count.toLocaleString()}</span>
                      </button>
                    )}
                  </section>
                )}

                {/* Medals from finished challenges: proof of going out and doing */}
                {profile.challengeBadges && profile.challengeBadges.length > 0 && (
                  <section id="badges" className={`${card} scroll-mt-24`}>
                    <SectionTitle>เหรียญจากชาเลนจ์</SectionTitle>
                    <ul className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                      {(showAllBadges ? profile.challengeBadges : profile.challengeBadges.slice(0, FIRST_BADGES)).map((badge) => (
                        <li key={badge.questId}>
                          <Link href={`/challenges/${encodeURIComponent(badge.questId)}`} title={badge.title} className="group flex flex-col items-center text-center gap-2 cursor-pointer">
                            <span className="w-16 h-16 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#6D28D9] text-white flex items-center justify-center ring-4 ring-[#F5F3FF] transition-transform group-hover:scale-105">
                              <Award className="w-8 h-8" aria-hidden="true" />
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2">{badge.badgeLabel}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {!showAllBadges && profile.challengeBadges.length > FIRST_BADGES && (
                      <button type="button" onClick={() => setShowAllBadges(true)} className={MORE_BUTTON}>
                        ดูอีก <span className="tabular-nums">{profile.challengeBadges.length - FIRST_BADGES}</span> เหรียญ
                      </button>
                    )}
                  </section>
                )}

                {/* Owner only: the invite link (ตั๋วเพื่อนซี้) and friends who signed up with it */}
                {profile.isMe && (
                  <section id="invite" className={`${card} scroll-mt-24`}>
                    <InviteFriendsCard />
                  </section>
                )}

                {/* Moments; an empty list is one quiet line, only for the owner */}
                {state.moments.length > 0 ? (
                  <section id="moments" className={`${card} scroll-mt-24`}>
                    <SectionTitle>{`โมเมนต์ (${momentsCount})`}</SectionTitle>
                    <ul className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {state.moments.slice(0, momentsShown).map((m) => (
                        <li key={m.id} className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100">
                          <Link href={`/moments/${encodeURIComponent(m.id)}`} className="block w-full h-full group">
                            {/* eslint-disable-next-line @next/next/no-img-element -- remote content images */}
                            <img src={m.image} alt={m.caption.slice(0, 60)} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {(state.momentsTotal ?? state.moments.length) > momentsShown && (
                      <button type="button" onClick={showMoreMoments} disabled={isLoadingMoments} className={MORE_BUTTON}>
                        {isLoadingMoments && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                        ดูเพิ่ม
                      </button>
                    )}
                  </section>
                ) : (
                  viewOwn && (
                    <p className={`${card} flex items-center gap-2 text-sm font-medium text-slate-500`}>
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      ยังไม่มีโมเมนต์
                      <Link href="/?share=new" className="font-bold text-[#2563EB] hover:text-[#1D4ED8]">แชร์โมเมนต์แรก ›</Link>
                    </p>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {editTab && own && (
        <EditProfileDialog
          initialTab={editTab}
          onPreview={() => {
            setEditTab(null);
            setPreviewPublic(true);
          }}
          member={own.member}
          details={own.details}
          preferences={own.preferences}
          onClose={() => setEditTab(null)}
          onSaved={() => {
            setEditTab(null);
            setNotice('บันทึกโปรไฟล์แล้ว');
            refresh();
          }}
        />
      )}
      {isReviewsOpen && profile?.hostReviews && (
        <DialogShell onClose={() => setIsReviewsOpen(false)} size="md" title={`★ ${profile.hostReviews.average.toFixed(1)} · ${profile.hostReviews.count} รีวิว`} subtitle={`จากคนที่ไปตี้ของ ${profile.displayName}`}>
          {allReviews === null ? (
            <p className="flex items-center gap-2 text-sm font-bold text-slate-500" role="status"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />กำลังโหลด…</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto -mx-1 px-1">
              {allReviews.map((r) => (
                <li key={r.id} className="py-4 first:pt-0">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm"><span className="font-bold text-slate-900">{r.authorName}</span><span className="text-slate-500">{r.timeAgo}</span></p>
                  <p className="text-amber-500 text-sm" aria-label={`${r.rating} จาก 5 ดาว`}>{'★'.repeat(r.rating)}<span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span></p>
                  {r.text && <p className="mt-1 text-sm text-slate-700 leading-relaxed">{r.text}</p>}
                  <p className="mt-1 text-xs text-slate-500 truncate">ตี้: {r.eventTitle}</p>
                </li>
              ))}
            </ul>
          )}
        </DialogShell>
      )}
      {reportingReview && (
        <ReportSafetyModal isOpen onClose={() => setReportingReview(null)} targetType="review" targetId={reportingReview.id} targetTitle={`รีวิวของตี้ "${reportingReview.eventTitle}"`} />
      )}
      {isReporting && profile && (
        <ReportDialog
          profile={profile}
          onClose={() => setIsReporting(false)}
          onDone={() => {
            setIsReporting(false);
            setNotice('ส่งรายงานแล้ว ขอบคุณที่ช่วยกันดูแล ทีมงานจะตรวจสอบ');
            refresh();
          }}
        />
      )}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => handleSetIsLoggedIn(true)} />
      <LogoutConfirmModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirmLogout={() => handleSetIsLoggedIn(false)} />
    </div>
  );
}
