'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, BadgeCheck, Ban, CalendarPlus, Check, CircleCheck, Clock, Flag, HandHeart, KeyRound, Loader2, LogOut, MailCheck, MapPin, Pencil, ShieldCheck, UserRound,
  type LucideIcon,
} from 'lucide-react';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { Navbar } from '@/components/Navbar';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { PhraseText } from '@/components/auth/PhraseText';
import { MOCK_PROFILES } from '@/data/profilesData';
import { nameInitial } from '@/lib/displayName';
import type { HostApplication, MemberPreferences, MemberProfile, ProfileFieldKey, PublicMember } from '@/lib/members/types';
import { NEW_ACCOUNT_DAYS } from '@/lib/members/trust';
import { useAuth } from '@/lib/useAuth';
import { useMasterData } from '@/lib/useMasterData';
import { memberActions } from '@/lib/useMemberSession';
import { EditProfileDialog, FIELD_LABELS } from './EditProfileDialog';

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
  viewer?: { hasBlocked: boolean; hasReported: boolean };
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
const HOST_KIND_LABELS: Record<HostApplication['kind'], string> = { host: 'เปิดกิจกรรมคอมมูนิตี้', venue: 'ร้านหรือพื้นที่', organizer: 'ผู้จัดงานหรือแบรนด์' };
const ABOUT_ORDER: ProfileFieldKey[] = ['connectGoal', 'occupation', 'workplace', 'education', 'livingArea', 'hometown', 'relationshipStatus'];
const card = 'bg-white rounded-3xl border border-slate-200 p-5 sm:p-7';
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

function Avatar({ name, url, size }: { name: string; url?: string; size: string }) {
  return (
    <span className={`${size} rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#2563EB] text-white font-black ring-4 ring-white shadow-sm`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- member photo from uploads or a provider
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        nameInitial(name, 'C')
      )}
    </span>
  );
}

function Badge({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-extrabold whitespace-nowrap">
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{children}</h2>
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
function TrustCard({ member, onChanged }: { member: PublicMember; onChanged: () => void }) {
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
      desc: t.emailVerified ? 'ยืนยันแล้ว' : t.hasEmail ? 'กดลิงก์ในอีเมลที่เราส่งให้ จึงจะโพสต์และคอมเมนต์ได้' : 'บัญชีนี้ยังไม่มีอีเมล',
      action: !t.emailVerified && t.hasEmail && (
        <button type="button" onClick={send} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap disabled:opacity-60">
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
          ส่งลิงก์
        </button>
      ),
    },
    {
      done: t.pledged,
      title: 'รับคำมั่นของคอมมูนิตี้',
      desc: t.pledged ? 'รับแล้ว' : 'คำมั่น 4 ข้อที่สมาชิกทุกคนรับร่วมกัน',
      action: !t.pledged && <Link href="/onboarding?step=pledge&returnTo=%2Fprofile" className="text-sm font-extrabold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">อ่านและรับ</Link>,
    },
    {
      done: t.level === 'trusted',
      title: `เป็นสมาชิกครบ ${NEW_ACCOUNT_DAYS} วัน`,
      desc: t.level === 'trusted' ? 'โพสต์ได้ตามปกติ และใส่ช่องทางติดต่อได้' : `อีก ${daysLeft} วัน ระหว่างนี้โพสต์ได้วันละ 3 โมเมนต์ และยังใส่ลิงก์หรือเบอร์โทรไม่ได้`,
    },
  ];

  return (
    <section id="trust" className={`${card} scroll-mt-24`}>
      <SectionTitle action={<span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">{levelText}</span>}>ความน่าเชื่อถือของบัญชี</SectionTitle>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.title} className="flex items-start gap-3">
            <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${row.done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {row.done ? <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" /> : <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-extrabold text-slate-900">{row.title}</span>
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
function HostCard({ member, application, onChanged }: { member: PublicMember; application: HostApplication | null; onChanged: () => void }) {
  const [kind, setKind] = useState<HostApplication['kind']>('host');
  const [about, setAbout] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [again, setAgain] = useState(false);
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
  return (
    <section id="host" className={`${card} scroll-mt-24`}>
      <SectionTitle>อยากเป็นคนชวน</SectionTitle>
      {status === 'approved' && (
        <p className="flex items-start gap-2 text-sm font-semibold text-emerald-800">
          <CircleCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span><PhraseText text={`ทีมงานอนุมัติแล้ว (${HOST_KIND_LABELS[application!.kind]}) กิจกรรมที่คุณสร้าง จะเผยแพร่ได้ทันที`} /></span>
        </p>
      )}
      {status === 'pending' && (
        <p className="flex items-start gap-2 text-sm font-semibold text-slate-700">
          <Clock className="w-5 h-5 shrink-0 text-slate-500" aria-hidden="true" />
          <span><PhraseText text="ส่งคำขอแล้ว ทีมงานกำลังตรวจ ระหว่างนี้กิจกรรมที่คุณสร้าง จะรอทีมงานอนุมัติก่อนเผยแพร่" /></span>
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
      {(!status || (status === 'rejected' && again)) && (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            <PhraseText text="เล่าให้ทีมงานฟังสั้นๆ ว่าอยากจัดอะไร เมื่ออนุมัติแล้ว กิจกรรมของคุณจะเผยแพร่ได้ทันที ถ้ายังไม่อนุมัติ ก็สร้างกิจกรรมได้ แต่ต้องรอทีมงานตรวจทีละงาน" />
          </p>
          <div className="space-y-1.5">
            <label htmlFor="host-kind" className="block text-xs sm:text-sm font-bold text-slate-800">คุณเป็น</label>
            <select id="host-kind" value={kind} onChange={(e) => setKind(e.target.value as HostApplication['kind'])} className={inputClass} disabled={!canApply}>
              <option value="host">คนที่อยากเปิดกิจกรรมคอมมูนิตี้</option>
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
      )}
    </section>
  );
}

function AccountCard({ member, onLogout }: { member: PublicMember; onLogout: () => void }) {
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
    <section className={card}>
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

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
        {!open && member.email && (
          <button type="button" onClick={() => { setOpen(true); setDone(false); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
            <KeyRound className="w-4 h-4" aria-hidden="true" />
            {hasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน'}
          </button>
        )}
        <Link href="/legal?tab=privacy" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          ข้อมูลและความเป็นส่วนตัว
        </Link>
        <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
          <LogOut className="w-4 h-4" aria-hidden="true" />
          ออกจากระบบ
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
  const [isEditing, setIsEditing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'missing' | 'signin'; profile?: PublicProfile; own?: OwnData; moments: MomentThumb[] }>({ status: 'loading', moments: [] });
  const [notice, setNotice] = useState('');
  const [hosted, setHosted] = useState<HostedEvent[]>([]);

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
      const toThumbs = (json: { moments?: { id: string; images: string[]; caption: string }[] } | null) =>
        (json?.moments ?? []).filter((m) => m.images?.[0]).map((m) => ({ id: m.id, image: m.images[0], caption: m.caption }));
      if (wantsOwn) {
        if (!memberId) return { status: 'signin' as const, moments: [] };
        const [own, mine] = await Promise.all([
          getJson<OwnData & { publicView: PublicProfile }>('/api/auth/member/profile'),
          getJson<{ moments: { id: string; images: string[]; caption: string }[] }>('/api/moments?tab=mine&limit=12'),
        ]);
        if (!own.ok || !own.json) return { status: 'signin' as const, moments: [] };
        return { status: 'ready' as const, profile: own.json.publicView, own: own.json, moments: toThumbs(mine.json) };
      }
      if (!profileId.startsWith('mem_')) {
        const sample = sampleProfile(profileId);
        return sample ? { status: 'ready' as const, profile: sample, moments: sample.sampleMoments ?? [] } : { status: 'missing' as const, moments: [] };
      }
      const [pub, posts] = await Promise.all([
        getJson<{ profile: PublicProfile }>(`/api/members/${encodeURIComponent(profileId)}`),
        getJson<{ moments: { id: string; images: string[]; caption: string }[] }>(`/api/moments?author=${encodeURIComponent(profileId)}&limit=12`),
      ]);
      if (!pub.ok || !pub.json?.profile) return { status: 'missing' as const, moments: [] };
      return { status: 'ready' as const, profile: pub.json.profile, moments: toThumbs(posts.json) };
    };
    load().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, [isAuthReady, wantsOwn, memberId, profileId, reload]);

  const refresh = () => setReload((n) => n + 1);
  const { profile, own } = state;
  const nameOf = (id: string) => [...master.communityCategories, ...master.spotVibes, ...master.fairCategories].find((c) => c.id === id)?.name ?? id;
  const interestNames = profile?.interests ? [...profile.interests.communityCategories, ...profile.interests.spotVibes, ...profile.interests.fairCategories].map(nameOf) : profile?.sampleInterests ?? [];
  const provinceName = profile?.province ? master.provinces.find((p) => p.id === profile.province)?.displayName ?? profile.province : undefined;
  const hiddenKeys = own?.details.hidden ?? [];

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
    ? ABOUT_ORDER.map((key) => ({ key, value: own ? own.details[key as keyof MemberProfile] as string | undefined : profile.about[key] })).filter((row) => row.value)
    : [];
  const bio = own ? own.details.bio : profile?.about.bio;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col">
      <Navbar
        activeTab="profile"
        setActiveTab={() => undefined}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthOpen(true)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-5">
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">โปรไฟล์ของคุณ</h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-6"><PhraseText text="เข้าสู่ระบบก่อน เพื่อดูและแก้ไขโปรไฟล์ของคุณ" /></p>
            <button type="button" onClick={() => setIsAuthOpen(true)} className={dialogButton.primary}>เข้าสู่ระบบ</button>
          </div>
        )}

        {state.status === 'missing' && (
          <div className={`${card} text-center`}>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">ไม่พบโปรไฟล์นี้</h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-6"><PhraseText text="สมาชิกคนนี้อาจลบบัญชี หรือถูกระงับการใช้งาน" /></p>
            <Link href="/" className={dialogButton.quiet}>กลับหน้าแรก</Link>
          </div>
        )}

        {state.status === 'ready' && profile && (
          <>
            {notice && <p role="status" className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{notice}</p>}

            {/* Header */}
            <section className={card}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                <Avatar name={profile.displayName} url={profile.avatarUrl} size="w-24 h-24 sm:w-28 sm:h-28 text-4xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight break-words min-w-0">{profile.displayName}</h1>
                    {profile.isMe ? (
                      <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                        แก้ไขโปรไฟล์
                      </button>
                    ) : (
                      profile.isSample && <span className="text-[11px] sm:text-xs font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">โปรไฟล์ตัวอย่าง</span>
                    )}
                  </div>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-semibold text-slate-500">
                    {profile.memberSince && <span className="whitespace-nowrap">สมาชิกตั้งแต่ {monthYear(profile.memberSince)}</span>}
                    {provinceName && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        {provinceName}
                      </span>
                    )}
                    {profile.ageBand && <span className="whitespace-nowrap">อายุ {profile.ageBand}</span>}
                    {profile.gender && <span className="whitespace-nowrap">{GENDER_LABELS[profile.gender]}</span>}
                  </p>

                  {(profile.badges.emailVerified || profile.badges.pledged || profile.badges.trusted || profile.badges.approvedHost) && (
                    <p className="mt-3 flex flex-wrap gap-1.5">
                      {profile.badges.approvedHost && <Badge icon={BadgeCheck}>โฮสต์ที่ทีมงานตรวจแล้ว</Badge>}
                      {profile.badges.trusted && !profile.badges.approvedHost && <Badge icon={ShieldCheck}>สมาชิกที่เชื่อถือได้</Badge>}
                      {profile.badges.emailVerified && <Badge icon={MailCheck}>ยืนยันอีเมลแล้ว</Badge>}
                      {profile.badges.pledged && <Badge icon={HandHeart}>รับคำมั่นแล้ว</Badge>}
                    </p>
                  )}

                  {bio ? (
                    <p className="mt-4 text-sm sm:text-base font-medium text-slate-700 leading-relaxed whitespace-pre-line break-words">
                      {bio}
                      {own && hiddenKeys.includes('bio') && <span className="ml-2 text-xs font-bold text-slate-400 whitespace-nowrap">(ซ่อนอยู่)</span>}
                    </p>
                  ) : (
                    profile.isMe && <p className="mt-4 text-sm font-medium text-slate-400"><PhraseText text="ยังไม่ได้แนะนำตัว กดแก้ไขโปรไฟล์ เพื่อเล่าเกี่ยวกับตัวเองสั้นๆ" /></p>
                  )}
                </div>
              </div>

              {!profile.isMe && !profile.isSample && isLoggedIn && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setIsReporting(true)} disabled={profile.viewer?.hasReported} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed">
                    <Flag className="w-4 h-4" aria-hidden="true" />
                    {profile.viewer?.hasReported ? 'รายงานแล้ว' : 'รายงาน'}
                  </button>
                  <button type="button" onClick={toggleBlock} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
                    <Ban className="w-4 h-4" aria-hidden="true" />
                    {profile.viewer?.hasBlocked ? 'เลิกบล็อก' : 'บล็อก'}
                  </button>
                </div>
              )}
            </section>

            {own && <TrustCard member={own.member} onChanged={() => { handleSetIsLoggedIn(true); refresh(); }} />}

            {/* About and interests */}
            {(aboutRows.length > 0 || interestNames.length > 0) && (
              <section className={card}>
                <SectionTitle>{`เกี่ยวกับ${profile.isMe ? 'ฉัน' : profile.displayName}`}</SectionTitle>
                {aboutRows.length > 0 && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {aboutRows.map((row) => (
                      <div key={row.key} className="min-w-0">
                        <dt className="text-[11px] sm:text-xs font-semibold text-slate-500">
                          {FIELD_LABELS[row.key]}
                          {own && hiddenKeys.includes(row.key) && <span className="ml-1.5 font-bold text-slate-400">(ซ่อนอยู่)</span>}
                        </dt>
                        <dd className="text-sm font-bold text-slate-800 break-words">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {interestNames.length > 0 && (
                  <div className={aboutRows.length > 0 ? 'mt-5 pt-4 border-t border-slate-100' : ''}>
                    <h3 className="text-[11px] sm:text-xs font-semibold text-slate-500 mb-2">
                      ความสนใจ
                      {own && hiddenKeys.includes('interests') && <span className="ml-1.5 font-bold text-slate-400">(ซ่อนอยู่)</span>}
                    </h3>
                    <p className="flex flex-wrap gap-1.5">
                      {interestNames.map((name) => (
                        <span key={name} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold whitespace-nowrap">{name}</span>
                      ))}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Events this member hosts: a visitor's best signal of who they are. Managing them happens in My Hub. */}
            {hosted.length > 0 && (
              <section className={card}>
                <SectionTitle action={profile.isMe ? <Link href="/myhub" className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">จัดการใน My Hub</Link> : undefined}>กิจกรรมที่จัด</SectionTitle>
                <p className="-mt-2 mb-4 text-xs font-semibold text-slate-500">
                  <PhraseText text={`จัดมาแล้ว ${hosted.filter((ev) => ev.approvalStatus === 'approved').length} กิจกรรม`} />
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hosted.slice(0, 6).map((ev) => {
                    const isLive = ev.approvalStatus === 'approved';
                    const body = (
                      <>
                        <span className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element -- remote content images */}
                          {ev.image && <img src={ev.image} alt="" loading="lazy" className="w-full h-full object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">{ev.title}</span>
                          <span className="block text-xs font-medium text-slate-500 mt-1 truncate">{[ev.date, ev.location].filter(Boolean).join(' · ')}</span>
                          {!isLive && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold whitespace-nowrap">
                              {ev.approvalStatus === 'rejected' ? 'ไม่ผ่านการตรวจ' : 'รอทีมงานตรวจ'}
                            </span>
                          )}
                          {isLive && ev.status === 'ended' && <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold whitespace-nowrap">จบแล้ว</span>}
                        </span>
                      </>
                    );
                    const rowClass = 'flex items-start gap-3 p-3 rounded-2xl border border-slate-200';
                    return (
                      <li key={ev.id}>
                        {isLive ? (
                          <Link href={`${ev.eventType === 'public_venue' ? '/fairs' : '/community'}/${ev.id}`} className={`${rowClass} hover:border-slate-300 hover:bg-slate-50`}>{body}</Link>
                        ) : (
                          <div className={rowClass}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Moments */}
            <section className={card}>
              <SectionTitle action={state.moments.length > 0 ? <Link href="/moments" className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ไปหน้าโมเมนต์</Link> : undefined}>โมเมนต์</SectionTitle>
              {state.moments.length > 0 ? (
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {state.moments.map((m) => (
                    <li key={m.id} className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote content images */}
                      <img src={m.image} alt={m.caption.slice(0, 60)} loading="lazy" className="w-full h-full object-cover" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600"><PhraseText text={profile.isMe ? 'ยังไม่มีโมเมนต์ ไปกิจกรรมแล้ว กลับมาแชร์ภาพกันนะ' : 'ยังไม่มีโมเมนต์'} /></p>
                  {profile.isMe && <Link href="/moments" className="text-sm font-extrabold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">ไปหน้าโมเมนต์</Link>}
                </div>
              )}
            </section>

            {own && <HostCard member={own.member} application={own.hostApplication} onChanged={() => { handleSetIsLoggedIn(true); refresh(); }} />}
            {own && <AccountCard member={own.member} onLogout={() => setIsLogoutOpen(true)} />}
          </>
        )}
      </main>

      {isEditing && own && (
        <EditProfileDialog
          member={own.member}
          details={own.details}
          preferences={own.preferences}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            setNotice('บันทึกโปรไฟล์แล้ว');
            refresh();
          }}
        />
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
