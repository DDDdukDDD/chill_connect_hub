'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Search, UserRound, X } from 'lucide-react';
import type { LoginMethod, MemberStatus } from '@/lib/members/types';
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
}

const STATUS_META: Record<MemberStatus, { label: string; className: string }> = {
  active: { label: 'ปกติ', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  suspended: { label: 'ระงับชั่วคราว', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  banned: { label: 'แบน', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};
const METHOD_LABELS: Record<LoginMethod, string> = { email: 'อีเมล', google: 'Google', facebook: 'Facebook', apple: 'Apple' };

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '–');

function ModerationDrawer({ member, onClose, onDone }: { member: AdminMember; onClose: () => void; onDone: (message: string) => void }) {
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
            <span className="text-slate-500">สถานะ:</span>{' '}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold ${STATUS_META[member.status].className}`}>{STATUS_META[member.status].label}</span>
            {member.suspendedUntil && <span className="text-xs text-slate-500"> ถึง {formatDate(member.suspendedUntil)}</span>}
            {member.statusReason && <span className="block text-xs text-slate-500">เหตุผล: {member.statusReason}</span>}
          </p>
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
    const params = new URLSearchParams({ page: String(page), limit: '20', status });
    if (debouncedQuery) params.set('q', debouncedQuery);
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
  }, [page, status, debouncedQuery, reloadToken]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserRound}
        title="สมาชิก"
        description="บัญชีสมาชิกของหน้าเว็บ ค้นหา ดูช่องทางเข้าสู่ระบบ ระงับ แบน หรือบังคับออกจากระบบ"
        actions={
          <button type="button" onClick={() => refetch(() => setReloadToken((t) => t + 1))} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'active', 'suspended', 'banned'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => refetch(() => { setStatus(s); setPage(1); })}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s === 'all' ? 'ทั้งหมด' : STATUS_META[s].label} <span className="opacity-70 tabular-nums">{counts ? counts[s] : '—'}</span>
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
        <AdminEmptyState>{counts?.all ? 'ไม่พบสมาชิกที่ตรงกับตัวกรอง' : 'ยังไม่มีสมาชิก เมื่อมีคนสมัครจากหน้าเว็บจะแสดงที่นี่'}</AdminEmptyState>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold text-slate-500">
                  <th className="px-4 py-2.5">สมาชิก</th>
                  <th className="px-4 py-2.5">ช่องทาง</th>
                  <th className="px-4 py-2.5">สมัครเมื่อ</th>
                  <th className="px-4 py-2.5">เข้าล่าสุด</th>
                  <th className="px-4 py-2.5">สถานะ</th>
                  <th className="px-4 py-2.5" aria-label="จัดการ" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && members.length === 0
                  ? [1, 2, 3].map((n) => <tr key={n}><td colSpan={6} className="h-12 animate-pulse bg-slate-50/50" /></tr>)
                  : members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {member.avatarUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={member.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                            : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{member.displayName.slice(0, 1)}</span>}
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{member.displayName}</p>
                            <p className="truncate text-[11px] text-slate-500">{member.email ?? 'ไม่มีอีเมล'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{[member.hasPassword && 'อีเมล', ...member.providers.map((p) => METHOD_LABELS[p.provider])].filter(Boolean).join(', ')}</td>
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
