'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Flag, Loader2, RefreshCw, Search, Trash2, UserRound, X } from 'lucide-react';
import { RISK_FLAG_LABELS } from '@/lib/members/trust';
import type { HostApplication, LoginMethod, MemberConsent, MemberPreferences, MemberStatus, MemberTrust, RiskFlag } from '@/lib/members/types';
import { nameInitial } from '@/lib/displayName';
import { useMasterData } from '@/lib/useMasterData';
import { useAdminSession } from './AdminAuthGate';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { AdminPagination, AdminPaginationState } from './AdminPagination';
import { handleAdminUnauthorized } from './adminAuthUtils';

interface AdminMember {
  id: string;
  displayName: string;
  email?: string;
  emailVerified: boolean;
  avatarUrl?: string;
  hasPassword: boolean;
  providers: Array<{ provider: LoginMethod; linkedAt: string }>;
  status: MemberStatus;
  suspendedUntil?: string;
  statusReason?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginMethod?: LoginMethod;
  consentAt: string;
  consent?: MemberConsent;
  preferences?: MemberPreferences;
  onboardedAt?: string;
  trust: MemberTrust;
  hasOpenRisk: boolean;
  riskFlags?: RiskFlag[];
  riskReviewedAt?: string;
  reportsReceived?: { byId: string; reason: string; at: string }[];
  hostApplication?: HostApplication;
  pledgeAcceptedAt?: string;
}

type Queue = 'none' | 'flagged' | 'hosts';
const TRUST_LABELS: Record<MemberTrust['level'], string> = { new: 'บัญชีใหม่', verified: 'ยืนยันแล้ว', trusted: 'เชื่อถือได้' };
const HOST_KIND_LABELS: Record<HostApplication['kind'], string> = { host: 'เปิดกิจกรรมคอมมูนิตี้', venue: 'ร้านหรือพื้นที่', organizer: 'ผู้จัดงานหรือแบรนด์' };
const HOST_STATUS_LABELS: Record<HostApplication['status'], string> = { pending: 'รอตรวจ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' };

interface Overview {
  total: number;
  newThisWeek: number;
  onboarded: number;
  wantsToHost: number;
  emailVerified: number;
  pledged: number;
  flagged: number;
  pendingHosts: number;
  byMethod: Record<LoginMethod, number>;
  topInterests: { id: string; members: number }[];
  readiness: { sessionSecret: boolean; providers: Record<LoginMethod, boolean>; mailer: boolean; durableStorage: boolean };
}

const INTENT_LABELS: Record<MemberPreferences['intent'], string> = { member: 'ผู้เข้าร่วม', host: 'อยากเปิดกิจกรรม', venue: 'มีร้านหรือพื้นที่', organizer: 'ผู้จัดงานหรือแบรนด์' };
const GENDER_LABELS: Record<NonNullable<MemberPreferences['gender']>, string> = { female: 'หญิง', male: 'ชาย', lgbtq: 'LGBTQ+' };
const GOAL_LABELS: Record<string, string> = {
  explore_spots: 'หาที่สงบๆ ไว้พักใจ', heal_self: 'ดูแลใจและร่างกาย', earn_xp: 'มีเป้าหมายเล็กๆ ให้ตัวเอง',
  find_friends: 'เจอเพื่อนใหม่', join_community: 'ออกไปขยับตัวกับคนอื่น', explore_fairs: 'ไปงานสนุกๆ',
  community_host: 'ชวนคนมาทำกิจกรรม', venue_space: 'มีร้านหรือพื้นที่', event_organizer: 'จัดงานอีเวนต์', brand_org: 'แบรนด์หรือองค์กร',
};

/** Names for the ids stored in preferences (interests and provinces come from master data) */
function useInterestNames() {
  const master = useMasterData();
  return (id: string) => [...master.communityCategories, ...master.spotVibes, ...master.fairCategories].find((c) => c.id === id)?.name ?? id;
}

function ReadinessRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      {ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" /> : <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />}
      <span><span className="font-bold text-slate-800">{label}:</span> <span className="text-slate-600">{ok ? 'พร้อมใช้งาน' : detail}</span></span>
    </li>
  );
}

function OverviewPanel({ overview }: { overview: Overview }) {
  const nameOf = useInterestNames();
  const percent = overview.total ? Math.round((overview.onboarded / overview.total) * 100) : 0;
  const stats = [
    { label: 'สมาชิกทั้งหมด', value: overview.total },
    { label: 'สมัครใน 7 วันนี้', value: overview.newThisWeek },
    { label: 'ทำขั้นตอนเริ่มใช้งานแล้ว', value: `${overview.onboarded} (${percent}%)` },
    { label: 'อยากเป็นคนชวนหรือผู้จัด', value: overview.wantsToHost },
  ];
  const r = overview.readiness;
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-[11px] font-semibold text-slate-500">{stat.label}</dt>
              <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">ช่องทางเข้าสู่ระบบ:</span>{' '}
            {(Object.keys(METHOD_LABELS) as LoginMethod[]).map((m) => `${METHOD_LABELS[m]} ${overview.byMethod[m]}`).join(' · ')}
            <span className="block mt-1"><span className="font-bold text-slate-800">ความน่าเชื่อถือ:</span> ยืนยันอีเมล {overview.emailVerified} · รับคำมั่น {overview.pledged}</span>
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">ความสนใจที่เลือกมากสุด:</span>{' '}
            {overview.topInterests.length ? overview.topInterests.map((i) => `${nameOf(i.id)} ${i.members}`).join(' · ') : 'ยังไม่มีข้อมูล'}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xs font-extrabold text-slate-900">ความพร้อมของระบบสมาชิก</h2>
        <ul className="mt-2.5 space-y-1.5">
          <ReadinessRow ok={r.sessionSecret} label="การเข้าสู่ระบบ" detail="ยังไม่ได้ตั้งค่า AUTH_SECRET สมาชิกจะสมัครและเข้าสู่ระบบไม่ได้" />
          <ReadinessRow ok={r.providers.google} label="Google" detail="ยังไม่ได้ใส่ GOOGLE_OAUTH_CLIENT_ID / SECRET ปุ่มจะขึ้นว่า เร็วๆ นี้" />
          <ReadinessRow ok={r.providers.facebook} label="Facebook" detail="ยังไม่ได้ใส่ FACEBOOK_APP_ID / SECRET" />
          <ReadinessRow ok={r.providers.apple} label="Apple" detail="ยังไม่ได้ใส่ APPLE_CLIENT_ID, TEAM_ID, KEY_ID, PRIVATE_KEY" />
          <ReadinessRow ok={r.mailer} label="อีเมลลืมรหัสผ่าน" detail="ยังไม่ได้ใส่ RESEND_API_KEY และ MAIL_FROM ลิงก์ตั้งรหัสใหม่จะไม่ถูกส่ง" />
          <ReadinessRow ok={r.durableStorage} label="ที่เก็บข้อมูลถาวร" detail="บนเซิร์ฟเวอร์นี้บัญชีสมาชิกเก็บเป็นไฟล์ชั่วคราว จะหายเมื่อ deploy ใหม่ ต้องย้ายไปฐานข้อมูลก่อนเปิดจริง" />
        </ul>
      </div>
    </section>
  );
}


const STATUS_META: Record<MemberStatus, { label: string; className: string }> = {
  active: { label: 'ปกติ', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  suspended: { label: 'ระงับชั่วคราว', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  banned: { label: 'แบน', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};
const METHOD_LABELS: Record<LoginMethod, string> = { email: 'อีเมล', google: 'Google', facebook: 'Facebook', apple: 'Apple' };

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '–');

function ModerationDrawer({ member, onClose, onDone }: { member: AdminMember; onClose: () => void; onDone: (message: string) => void }) {
  const { can } = useAdminSession();
  const nameOf = useInterestNames();
  const master = useMasterData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [hostNote, setHostNote] = useState('');
  const reviewedAt = member.riskReviewedAt ? new Date(member.riskReviewedAt).getTime() : 0;
  const openFlags = (member.riskFlags ?? []).filter((f) => new Date(f.at).getTime() > reviewedAt);
  const openReports = (member.reportsReceived ?? []).filter((r) => new Date(r.at).getTime() > reviewedAt);
  const application = member.hostApplication;
  const prefs = member.preferences;
  const interests = prefs ? [...prefs.interests.communityCategories, ...prefs.interests.spotVibes, ...prefs.interests.fairCategories] : [];
  const [status, setStatus] = useState<MemberStatus>(member.status === 'active' ? 'suspended' : 'active');
  const [days, setDays] = useState('7');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (body: Record<string, unknown>, message: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (handleAdminUnauthorized(res)) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || 'ทำรายการไม่สำเร็จ');
      onDone(message);
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminDrawer
      title={member.displayName}
      subtitle={<span>id: {member.id}</span>}
      onClose={onClose}
      footer={
        <>
          {error && <p role="alert" className="mr-auto text-xs font-semibold text-rose-600">{error}</p>}
          <button type="button" onClick={onClose} className={adminButton.secondary}>ปิด</button>
          <button type="button" disabled={isSaving} onClick={() => post({ action: 'force_logout', id: member.id }, `${member.displayName} ถูกออกจากระบบทุกอุปกรณ์แล้ว`)} className={adminButton.secondary}>
            บังคับออกจากระบบ
          </button>
          <button
            type="button"
            disabled={isSaving || status === member.status && status === 'active'}
            onClick={() => post({ action: 'set_status', id: member.id, status, days: Number(days), reason }, status === 'active' ? `คืนสถานะ ${member.displayName} แล้ว` : `${STATUS_META[status].label} ${member.displayName} แล้ว`)}
            className={status === 'active' ? adminButton.primary : adminButton.dark}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />} บันทึกสถานะ
          </button>
        </>
      }
    >
      <FormSection title="ข้อมูลบัญชี">
        <div className="sm:col-span-2 grid gap-2 text-sm text-slate-700">
          <p><span className="text-slate-500">อีเมล:</span> {member.email ?? '–'} {member.email && (member.emailVerified ? <span className="text-xs text-emerald-700">(ยืนยันแล้ว)</span> : <span className="text-xs text-slate-400">(ยังไม่ยืนยัน)</span>)}</p>
          <p><span className="text-slate-500">ช่องทางเข้าสู่ระบบ:</span> {[member.hasPassword && 'อีเมล', ...member.providers.map((p) => METHOD_LABELS[p.provider])].filter(Boolean).join(', ') || '–'}</p>
          <p><span className="text-slate-500">สมัครเมื่อ:</span> {formatDate(member.createdAt)} · <span className="text-slate-500">เข้าล่าสุด:</span> {formatDate(member.lastLoginAt)}{member.lastLoginMethod ? ` (${METHOD_LABELS[member.lastLoginMethod]})` : ''}</p>
          <p>
            <span className="text-slate-500">ระดับความน่าเชื่อถือ:</span> {TRUST_LABELS[member.trust.level]} · อีเมล{member.trust.emailVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'} · คำมั่น{member.trust.pledged ? `รับแล้ว (${formatDate(member.pledgeAcceptedAt)})` : 'ยังไม่รับ'} · อายุบัญชี {member.trust.accountDays} วัน
          </p>
          <p>
            <span className="text-slate-500">สถานะ:</span>{' '}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold ${STATUS_META[member.status].className}`}>{STATUS_META[member.status].label}</span>
            {member.suspendedUntil && <span className="text-xs text-slate-500"> ถึง {formatDate(member.suspendedUntil)}</span>}
            {member.statusReason && <span className="block text-xs text-slate-500">เหตุผล: {member.statusReason}</span>}
          </p>
        </div>
      </FormSection>
      {(openFlags.length > 0 || openReports.length > 0 || (member.riskFlags?.length ?? 0) > 0) && (
        <FormSection title="ธงเตือนและรายงาน" hint="ระบบตั้งธงให้อัตโนมัติเมื่อพบสัญญาณเสี่ยง และเมื่อสมาชิกคนอื่นรายงาน ธงไม่ได้แปลว่าผิด ให้ทีมงานดูแล้วตัดสิน">
          <div className="sm:col-span-2 space-y-3">
            {openFlags.length === 0 && openReports.length === 0 ? (
              <p className="text-sm text-slate-500">ตรวจแล้วทั้งหมด (ครั้งล่าสุด {formatDate(member.riskReviewedAt)}) มีประวัติธง {member.riskFlags?.length ?? 0} รายการ</p>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {openFlags.map((flag, i) => (
                    <li key={`${flag.code}-${i}`} className="flex items-start gap-2 text-sm text-slate-700">
                      <Flag size={14} className="mt-1 shrink-0 text-amber-600" aria-hidden="true" />
                      <span><span className="font-bold text-slate-800">{RISK_FLAG_LABELS[flag.code]}</span>{flag.detail ? ` · ${flag.detail}` : ''} <span className="text-xs text-slate-400">{formatDate(flag.at)}</span></span>
                    </li>
                  ))}
                </ul>
                {openReports.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-600">รายงานจากสมาชิก {openReports.length} คน</p>
                    <ul className="mt-1 space-y-1">
                      {openReports.map((report, i) => (
                        <li key={i} className="text-sm text-slate-700">“{report.reason}” <span className="text-xs text-slate-400">{formatDate(report.at)}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                <button type="button" disabled={isSaving} onClick={() => post({ action: 'clear_flags', id: member.id }, `ตรวจธงเตือนของ ${member.displayName} แล้ว`)} className={adminButton.secondary}>
                  <CheckCircle2 size={14} /> ตรวจแล้ว ไม่พบปัญหา
                </button>
                <p className="text-xs text-slate-500">ถ้าพบว่าผิดจริง ใช้ “เปลี่ยนสถานะ” ด้านล่างเพื่อระงับหรือแบน</p>
              </>
            )}
          </div>
        </FormSection>
      )}
      {application && (
        <FormSection title="คำขอเป็นโฮสต์" hint="เมื่ออนุมัติ กิจกรรมคอมมูนิตี้ที่สมาชิกคนนี้สร้างจะเผยแพร่ทันทีโดยไม่ต้องรอตรวจทีละงาน">
          <div className="sm:col-span-2 space-y-2 text-sm text-slate-700">
            <p><span className="text-slate-500">ประเภท:</span> {HOST_KIND_LABELS[application.kind]} · <span className="text-slate-500">สถานะ:</span> <span className="font-bold">{HOST_STATUS_LABELS[application.status]}</span> · ส่งเมื่อ {formatDate(application.submittedAt)}</p>
            <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3">{application.about}</p>
            {application.link && <p><span className="text-slate-500">ลิงก์:</span> <a href={application.link} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-[#2563EB] underline break-all">{application.link}</a></p>}
            {application.reviewedAt && <p className="text-xs text-slate-500">ตรวจโดย {application.reviewedBy ?? '–'} เมื่อ {formatDate(application.reviewedAt)}{application.note ? ` · ${application.note}` : ''}</p>}
            {application.status === 'pending' && (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-semibold text-slate-600" htmlFor="host-note">หมายเหตุ (บังคับเมื่อไม่อนุมัติ สมาชิกจะเห็นข้อความนี้)</label>
                <input id="host-note" value={hostNote} onChange={(e) => setHostNote(e.target.value)} className={fieldInputClass} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isSaving} onClick={() => post({ action: 'host_decision', id: member.id, decision: 'approve', note: hostNote }, `อนุมัติ ${member.displayName} เป็นโฮสต์แล้ว`)} className={adminButton.primary}>อนุมัติ</button>
                  <button type="button" disabled={isSaving || !hostNote.trim()} onClick={() => post({ action: 'host_decision', id: member.id, decision: 'reject', note: hostNote }, `ไม่อนุมัติคำขอของ ${member.displayName}`)} className={adminButton.danger}>ไม่อนุมัติ</button>
                </div>
              </div>
            )}
          </div>
        </FormSection>
      )}
      <FormSection title="คำตอบตอนเริ่มใช้งาน" hint="สมาชิกตอบเองในขั้นตอนเริ่มใช้งาน ทุกข้อไม่บังคับ ใช้เพื่อแนะนำเนื้อหา ไม่แสดงต่อสมาชิกคนอื่น">
        <div className="sm:col-span-2 grid gap-2 text-sm text-slate-700">
          {prefs ? (
            <>
              <p><span className="text-slate-500">มาเพื่อ:</span> {INTENT_LABELS[prefs.intent]}{prefs.goals.length ? ` · ${prefs.goals.map((g) => GOAL_LABELS[g] ?? g).join(', ')}` : ''}</p>
              <p><span className="text-slate-500">ความสนใจ:</span> {interests.length ? interests.map(nameOf).join(', ') : '–'}</p>
              <p>
                <span className="text-slate-500">จังหวัด:</span> {prefs.province ? master.provinces.find((p) => p.id === prefs.province)?.displayName ?? prefs.province : '–'}
                {' · '}<span className="text-slate-500">ปีเกิด:</span> {prefs.birthYear ? `พ.ศ. ${prefs.birthYear + 543}` : '–'}
                {' · '}<span className="text-slate-500">เพศ:</span> {prefs.gender ? GENDER_LABELS[prefs.gender] : '–'}
              </p>
              <p className="text-xs text-slate-500">ตอบล่าสุด {formatDate(prefs.updatedAt)}</p>
            </>
          ) : (
            <p className="text-slate-500">ยังไม่ได้ทำขั้นตอนเริ่มใช้งาน</p>
          )}
        </div>
      </FormSection>
      <FormSection title="การยินยอม (PDPA)" hint="หลักฐานว่าสมาชิกยอมรับข้อตกลงเมื่อไร และจากหน้าไหน">
        <div className="sm:col-span-2 grid gap-2 text-sm text-slate-700">
          <p><span className="text-slate-500">ยอมรับข้อตกลงเมื่อ:</span> {formatDate(member.consent?.acceptedAt ?? member.consentAt)}{member.consent ? ` · ฉบับ ${member.consent.termsVersion}` : ''}</p>
          <p>
            <span className="text-slate-500">ยืนยันอายุ 18 ปีขึ้นไป:</span>{' '}
            {member.consent?.ageConfirmedAt ? `ยืนยันแล้ว (${formatDate(member.consent.ageConfirmedAt)})` : 'ยังไม่มีบันทึก'}
          </p>
          <p>
            <span className="text-slate-500">ยอมรับจาก:</span>{' '}
            {!member.consent ? 'บัญชีเก่า ไม่มีรายละเอียด' : member.consent.source === 'signup_form' ? 'หน้าสมัครสมาชิก (ติ๊กยอมรับเอง)' : 'ปุ่มโซเชียลในหน้าเข้าสู่ระบบ (แสดงข้อความแจ้ง ไม่มีช่องติ๊ก)'}
          </p>
        </div>
      </FormSection>
      <FormSection title="คำขอเกี่ยวกับข้อมูลส่วนบุคคล" hint="ใช้เมื่อสมาชิกติดต่อเข้ามาขอสำเนาข้อมูลหรือขอลบบัญชี ทุกครั้งถูกบันทึกในบันทึกการกระทำ">
        <div className="sm:col-span-2 space-y-3">
          <a href={`/api/admin/members?export=${encodeURIComponent(member.id)}`} download className={adminButton.secondary}>
            <Download size={14} /> ดาวน์โหลดข้อมูลของสมาชิก
          </a>
          {can('staff.manage') ? (
            !isDeleting ? (
              <div>
                <button type="button" onClick={() => setIsDeleting(true)} className={adminButton.danger}>
                  <Trash2 size={14} /> ลบบัญชีถาวร
                </button>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-bold text-rose-800">ลบแล้วกู้คืนไม่ได้ โมเมนต์ คอมเมนต์ และไลก์ของสมาชิกจะถูกลบทั้งหมด</p>
                <label className="block text-[11px] font-semibold text-slate-600" htmlFor="member-delete-reason">เหตุผล (บังคับ) เช่น เลขที่คำขอ</label>
                <input id="member-delete-reason" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className={fieldInputClass} />
                <label className="block text-[11px] font-semibold text-slate-600" htmlFor="member-delete-name">พิมพ์ชื่อสมาชิก “{member.displayName}” เพื่อยืนยัน</label>
                <input id="member-delete-name" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} className={fieldInputClass} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setIsDeleting(false)} className={adminButton.secondary}>ยกเลิก</button>
                  <button
                    type="button"
                    disabled={isSaving || !deleteReason.trim() || confirmName !== member.displayName}
                    onClick={() => post({ action: 'delete', id: member.id, reason: deleteReason, confirmName }, `ลบบัญชี ${member.displayName} แล้ว`)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />} ลบบัญชีถาวร
                  </button>
                </div>
              </div>
            )
          ) : (
            <p className="text-xs text-slate-500">การลบบัญชีทำได้เฉพาะ Owner</p>
          )}
        </div>
      </FormSection>
      <FormSection title="เปลี่ยนสถานะ" hint="ระงับหรือแบนแล้ว สมาชิกจะถูกออกจากระบบทันทีและเข้าใหม่ไม่ได้ ทุกครั้งถูกบันทึกในบันทึกการกระทำ">
        <Field label="สถานะใหม่:" htmlFor="member-status">
          <select id="member-status" value={status} onChange={(e) => setStatus(e.target.value as MemberStatus)} className={fieldInputClass}>
            <option value="active">ปกติ (คืนสถานะ)</option>
            <option value="suspended">ระงับชั่วคราว</option>
            <option value="banned">แบนถาวร</option>
          </select>
        </Field>
        {status === 'suspended' && (
          <Field label="จำนวนวัน:" htmlFor="member-days" hint="1-365 วัน">
            <input id="member-days" type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} className={fieldInputClass} />
          </Field>
        )}
        {status !== 'active' && (
          <Field label="เหตุผล (บังคับ):" htmlFor="member-reason" wide>
            <textarea id="member-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={fieldInputClass} />
          </Field>
        )}
      </FormSection>
    </AdminDrawer>
  );
}

export function MembersManagerView() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [counts, setCounts] = useState<Record<MemberStatus | 'all', number> | null>(null);
  const [pagination, setPagination] = useState<AdminPaginationState | null>(null);
  const [status, setStatus] = useState<MemberStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminMember | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [queue, setQueue] = useState<Queue>('none');
  const refetch = (apply: () => void) => {
    setIsLoading(true);
    apply();
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/members?view=overview', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (active && json?.success) setOverview(json.overview); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [reloadToken]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: '20', status });
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (queue !== 'none') params.set('queue', queue);
    fetch(`/api/admin/members?${params}`, { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || 'โหลดรายชื่อสมาชิกไม่สำเร็จ');
        if (!active) return;
        setMembers(json.members);
        setCounts(json.counts);
        setPagination(json.pagination);
        setError(null);
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดรายชื่อสมาชิกไม่สำเร็จ'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [page, status, debouncedQuery, queue, reloadToken]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserRound}
        title="สมาชิก"
        description="บัญชีสมาชิกของหน้าเว็บ ดูภาพรวม คำตอบตอนเริ่มใช้งาน การยินยอม และจัดการบัญชี"
        actions={
          <button type="button" onClick={() => refetch(() => setReloadToken((t) => t + 1))} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        }
      />

      {overview && <OverviewPanel overview={overview} />}

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'active', 'suspended', 'banned'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => refetch(() => { setStatus(s); setQueue('none'); setPage(1); })}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${queue === 'none' && status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s === 'all' ? 'ทั้งหมด' : STATUS_META[s].label} <span className="opacity-70 tabular-nums">{counts ? counts[s] : '—'}</span>
          </button>
        ))}
        {([['flagged', 'น่าสงสัย', overview?.flagged], ['hosts', 'คำขอเป็นโฮสต์', overview?.pendingHosts]] as const).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => refetch(() => { setQueue(id); setStatus('all'); setPage(1); })}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${queue === id ? 'bg-slate-900 text-white' : count ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {id === 'flagged' && <Flag size={12} aria-hidden="true" />}
            {label} <span className="opacity-70 tabular-nums">{count ?? '—'}</span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => { const value = e.target.value; refetch(() => { setQuery(value); setPage(1); }); }}
            placeholder="ค้นหาชื่อ อีเมล หรือ id"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="ปิด"><X size={14} /></button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0" />{notice}
        </div>
      )}

      {!isLoading && members.length === 0 ? (
        <AdminEmptyState>{queue === 'flagged' ? 'ไม่มีบัญชีที่รอตรวจ' : queue === 'hosts' ? 'ไม่มีคำขอเป็นโฮสต์ที่รอตรวจ' : counts?.all ? 'ไม่พบสมาชิกที่ตรงกับตัวกรอง' : 'ยังไม่มีสมาชิก เมื่อมีคนสมัครจากหน้าเว็บจะแสดงที่นี่'}</AdminEmptyState>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold text-slate-500">
                  <th className="px-4 py-2.5">สมาชิก</th>
                  <th className="px-4 py-2.5">ช่องทาง</th>
                  <th className="px-4 py-2.5">เริ่มใช้งาน</th>
                  <th className="px-4 py-2.5">ระดับ</th>
                  <th className="px-4 py-2.5">สมัครเมื่อ</th>
                  <th className="px-4 py-2.5">เข้าล่าสุด</th>
                  <th className="px-4 py-2.5">สถานะ</th>
                  <th className="px-4 py-2.5" aria-label="จัดการ" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && members.length === 0
                  ? [1, 2, 3].map((n) => <tr key={n}><td colSpan={8} className="h-12 animate-pulse bg-slate-50/50" /></tr>)
                  : members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {member.avatarUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={member.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                            : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{nameInitial(member.displayName)}</span>}
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">
                              {member.displayName}
                              {member.hasOpenRisk && <span className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-extrabold text-amber-800 align-middle"><Flag size={10} aria-hidden="true" />รอตรวจ</span>}
                              {member.hostApplication?.status === 'pending' && <span className="ml-1.5 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-extrabold text-blue-800 align-middle">ขอเป็นโฮสต์</span>}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">{member.email ?? 'ไม่มีอีเมล'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{[member.hasPassword && 'อีเมล', ...member.providers.map((p) => METHOD_LABELS[p.provider])].filter(Boolean).join(', ')}</td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                        {member.onboardedAt
                          ? <span className="text-slate-700">{member.preferences && member.preferences.intent !== 'member' ? INTENT_LABELS[member.preferences.intent] : 'ทำแล้ว'}</span>
                          : <span className="text-slate-400">ยังไม่ทำ</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap">{TRUST_LABELS[member.trust.level]}{member.hostApplication?.status === 'approved' ? ' · โฮสต์' : ''}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(member.createdAt)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(member.lastLoginAt)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold whitespace-nowrap ${STATUS_META[member.status].className}`}>{STATUS_META[member.status].label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button type="button" onClick={() => setSelected(member)} className={adminButton.secondarySm}>จัดการ</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <AdminPagination pagination={pagination} onPageChange={(next) => refetch(() => setPage(next))} isLoading={isLoading} />
            </div>
          )}
        </section>
      )}

      {selected && (
        <ModerationDrawer
          key={selected.id}
          member={selected}
          onClose={() => setSelected(null)}
          onDone={(message) => {
            setSelected(null);
            setNotice(message);
            refetch(() => setReloadToken((t) => t + 1));
          }}
        />
      )}
    </div>
  );
}
