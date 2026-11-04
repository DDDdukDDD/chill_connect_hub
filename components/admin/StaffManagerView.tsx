'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, Plus, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { AdminPermission, StaffRole } from '@/lib/permissions';
import type { PublicStaffAccount } from '@/lib/staffStore';
import { NEW_ACCOUNT_DAYS, NEW_ACCOUNT_LIMITS } from '@/lib/members/trust';
import { AdminBadge, AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { MODULE_EDIT_PERMISSIONS, MODULE_PERMISSIONS, SIDEBAR_GROUPS, type AdminNavigate } from './AdminSidebar';

/**
 * "บทบาท & สิทธิ์" (owner 2026-10-30): who does what, for staff in the admin and for people on the public site.
 * Both sides are read from code (lib/permissions.ts, MODULE_EDIT_PERMISSIONS, lib/members/trust.ts), so the page
 * explains the rules the server applies and cannot drift into its own version of them.
 */

interface RoleInfo {
  id: StaffRole;
  label: string;
  description: string;
  permissions: AdminPermission[];
}

interface StaffResponse {
  staff: PublicStaffAccount[];
  roles: RoleInfo[];
  permissionLabels: Record<AdminPermission, string>;
  envOwnerEnabled: boolean;
}

type MemberLevels = Record<'new' | 'verified' | 'trusted' | 'host' | 'organizer' | 'suspended' | 'banned', number>;

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]';
const labelClass = 'block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5';
const tabClass = (active: boolean) => `whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`;

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

/** What a role may do on one admin page: change all of it, part of it, only look, or nothing */
function accessOn(role: RoleInfo, moduleId: keyof typeof MODULE_PERMISSIONS) {
  if (!role.permissions.includes(MODULE_PERMISSIONS[moduleId])) return { level: 'none' as const, granted: [] };
  const edits = MODULE_EDIT_PERMISSIONS[moduleId];
  const granted = edits.filter((edit) => role.permissions.includes(edit.permission));
  if (!edits.length || !granted.length) return { level: 'view' as const, granted };
  return { level: granted.length === edits.length ? ('edit' as const) : ('partial' as const), granted };
}

const ACCESS_CHIP = {
  edit: { label: 'แก้ไข', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial: { label: 'แก้บางส่วน', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  view: { label: 'ดู', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

function RoleCards({ roles }: { roles: RoleInfo[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {roles.map((role) => {
        const groups = SIDEBAR_GROUPS.map((group) => ({
          label: group.groupLabel ?? 'งานประจำวัน',
          modules: group.modules.filter((m) => ['edit', 'partial'].includes(accessOn(role, m.id).level)).map((m) => m.label),
        })).filter((group) => group.modules.length);
        return (
          <div key={role.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-900">{role.label}</p>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{role.description}</p>
            <p className="mt-3 text-[11px] font-semibold text-slate-500">แก้ไขได้ใน</p>
            <ul className="mt-1 space-y-1">
              {groups.map((group) => (
                <li key={group.label} className="text-xs text-slate-700">
                  <span className="font-semibold">{group.label}:</span> {group.modules.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function AccessTable({ roles }: { roles: RoleInfo[] }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-slate-900">
        <ChevronRight size={16} className="transition-transform group-open:rotate-90" />
        ดูรายละเอียดสิทธิ์รายหน้า
        <span className="ml-auto text-[11px] font-normal text-slate-500">ตามเมนูด้านซ้าย</span>
      </summary>
      <div className="overflow-x-auto border-t border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2.5 text-left">หน้า</th>
              {roles.map((role) => <th key={role.id} className="px-3 py-2.5 text-center whitespace-nowrap">{role.label}</th>)}
            </tr>
          </thead>
          {SIDEBAR_GROUPS.map((group) => (
            <tbody key={group.groupLabel ?? 'daily'} className="divide-y divide-slate-100">
              <tr className="bg-slate-50">
                <th colSpan={roles.length + 1} className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-500">{group.groupLabel ?? 'งานประจำวัน'}</th>
              </tr>
              {group.modules.map((module) => (
                <tr key={module.id}>
                  <td className="px-4 py-2.5 text-xs text-slate-700">
                    {module.label}
                    {MODULE_EDIT_PERMISSIONS[module.id].length > 0 && (
                      <p className="text-[11px] text-slate-500">{MODULE_EDIT_PERMISSIONS[module.id].map((edit) => edit.what).join(' · ')}</p>
                    )}
                  </td>
                  {roles.map((role) => {
                    const access = accessOn(role, module.id);
                    if (access.level === 'none') return <td key={role.id} className="px-3 py-2.5 text-center text-slate-300" aria-label="ไม่มีสิทธิ์">–</td>;
                    const chip = ACCESS_CHIP[access.level];
                    return (
                      <td key={role.id} className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[11px] sm:text-xs font-bold whitespace-nowrap ${chip.className}`}
                          title={access.level === 'partial' ? `ทำได้: ${access.granted.map((g) => g.what).join(', ')}` : undefined}
                        >
                          {chip.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
        กำหนดไว้ในโค้ด (lib/permissions.ts) แก้จากหน้านี้ไม่ได้ เซิร์ฟเวอร์ตรวจสิทธิ์นี้ทุกครั้ง ชี้ที่ “แก้บางส่วน” เพื่อดูว่าทำอะไรได้
      </p>
    </details>
  );
}

/** The steps a person on the public site goes through, with what each step allows (lib/members/trust.ts) */
function MemberLadder({ roles, onNavigate }: { roles: RoleInfo[]; onNavigate?: AdminNavigate }) {
  const [levels, setLevels] = useState<MemberLevels | null>(null);
  const [pendingHosts, setPendingHosts] = useState(0);
  const [flagged, setFlagged] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/members?view=overview', { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res) || !res.ok) return;
        const json = await res.json();
        if (active && json.success) {
          setLevels(json.overview.levels);
          setPendingHosts(json.overview.pendingHosts);
          setFlagged(json.overview.flagged);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const rolesWith = (permission: AdminPermission) => roles.filter((r) => r.permissions.includes(permission)).map((r) => r.label).join(', ');
  const memberStaff = rolesWith('members.manage');

  const steps: Array<{ id: keyof MemberLevels | 'guest'; title: string; how: string; can: string[]; cannot?: string[]; staff?: string; link?: { label: string; queue?: 'hosts' | 'flagged' } }> = [
    { id: 'guest', title: 'ผู้เยี่ยมชม', how: 'ยังไม่เข้าสู่ระบบ', can: ['ดูทุกหน้าสาธารณะ: ตี้ อีเวนต์ ที่เที่ยว ชาเลนจ์ โมเมนต์'] },
    {
      id: 'new', title: 'บัญชีใหม่', how: 'สมัครสมาชิก',
      can: ['เข้าสู่ระบบ ตั้งโปรไฟล์ บันทึกอีเวนต์ลงแผน'],
      cannot: ['เข้าร่วมหรือสร้างตี้', 'โพสต์โมเมนต์และคอมเมนต์'],
    },
    {
      id: 'verified', title: 'ยืนยันแล้ว', how: 'ยืนยันอีเมล และรับคำมั่นของคอมมูนิตี้',
      can: ['เข้าร่วมตี้', 'สร้างตี้ (รอทีมงานตรวจก่อนขึ้นเว็บ)', 'โพสต์โมเมนต์และคอมเมนต์'],
      cannot: [`คอมเมนต์เกินวันละ ${NEW_ACCOUNT_LIMITS.commentsPerDay} ครั้ง`, `ใส่ลิงก์ เบอร์โทร หรือไอดีไลน์ใน ${NEW_ACCOUNT_DAYS} วันแรก`],
      link: flagged ? { label: `บัญชีที่ต้องตรวจ ${flagged}`, queue: 'flagged' } : undefined,
    },
    {
      id: 'trusted', title: 'ไว้ใจได้', how: `อัตโนมัติ เมื่อยืนยันแล้วครบ ${NEW_ACCOUNT_DAYS} วัน และไม่มีรายงานหรือสัญญาณเสี่ยงค้างอยู่`,
      can: ['ไม่จำกัดคอมเมนต์ต่อวัน', 'ใส่ช่องทางติดต่อได้'],
      staff: 'ถ้าถูกรายงานหรือมีสัญญาณเสี่ยงใหม่ จะกลับเป็น “ยืนยันแล้ว” จนกว่าทีมงานตรวจ',
    },
    {
      id: 'host', title: 'ผู้จัดตี้', how: 'ส่งคำขอเป็นโฮสต์ ทีมงานอนุมัติ',
      can: ['ตี้ขึ้นเว็บทันทีโดยไม่ต้องรอตรวจ', 'ทุกอย่างของ “ไว้ใจได้”'],
      cannot: ['ทริปชวนไปที่เที่ยว (Spot Buddy) ยังรอทีมงานตรวจทุกครั้ง'],
      staff: `อนุมัติโดย ${memberStaff} ในหน้าสมาชิก`,
      link: { label: pendingHosts ? `คำขอรอตรวจ ${pendingHosts}` : 'ดูคำขอ', queue: 'hosts' },
    },
    {
      id: 'organizer', title: 'ผู้จัดงาน / เจ้าของพื้นที่', how: 'ส่งคำขอแบบผู้จัดงานหรือเจ้าของพื้นที่ ทีมงานอนุมัติ',
      can: ['สร้างอีเวนต์ได้ (คนอื่นสร้างไม่ได้)', 'ทุกอย่างของ “ผู้จัดตี้”'],
      staff: `อนุมัติโดย ${memberStaff} ในหน้าสมาชิก`,
    },
    {
      id: 'suspended', title: 'ระงับชั่วคราว', how: 'ทีมงานระงับพร้อมวันสิ้นสุด',
      can: [], cannot: ['เข้าสู่ระบบ จนถึงวันที่กำหนด แล้วกลับมาใช้ได้เอง'],
      staff: `ระงับโดย ${memberStaff}`,
    },
    {
      id: 'banned', title: 'แบน', how: 'ทีมงานแบน',
      can: [], cannot: ['เข้าสู่ระบบ'],
      staff: `แบนโดย ${memberStaff} · ลบบัญชีถาวรได้เฉพาะ ${rolesWith('staff.manage')}`,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">
        สิ่งที่คนบนเว็บไซต์ทำได้ในแต่ละขั้น เซิร์ฟเวอร์ตรวจกฎเหล่านี้ทุกครั้ง (lib/members/trust.ts) ข้อความที่มีคำขาย ลงทุน หรือกู้เงินโพสต์ได้ แต่บัญชีจะถูกส่งให้ทีมงานตรวจ
      </p>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const count = step.id !== 'guest' && levels ? levels[step.id] : null;
          const stopped = step.id === 'suspended' || step.id === 'banned';
          return (
            <li key={step.id} className={`flex flex-col rounded-2xl border bg-white p-4 ${stopped ? 'border-rose-200' : 'border-slate-200'}`}>
              <div className="flex items-start gap-2">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${stopped ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>{stopped ? '!' : index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{step.title}</p>
                  <p className="text-[11px] text-slate-500">{step.how}</p>
                </div>
                {count !== null && <span className="text-sm font-bold text-slate-900" title="จำนวนสมาชิกในขั้นนี้">{count.toLocaleString('th-TH')}</span>}
              </div>
              {step.can.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {step.can.map((item) => <li key={item} className="text-xs text-slate-700"><span className="text-emerald-600 font-bold">✓</span> {item}</li>)}
                </ul>
              )}
              {step.cannot && (
                <ul className="mt-2 space-y-1">
                  {step.cannot.map((item) => <li key={item} className="text-xs text-slate-500"><span className="font-bold">–</span> {stopped ? '' : 'ยังไม่ได้: '}{item}</li>)}
                </ul>
              )}
              {step.staff && <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">{step.staff}</p>}
              {step.link && onNavigate && (
                <button type="button" onClick={() => onNavigate('members', step.link?.queue ? { queue: step.link.queue } : undefined)} className="mt-auto pt-3 self-start text-xs font-semibold text-[#2563EB] hover:underline">
                  {step.link.label} →
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function StaffManagerView({ onNavigate }: { onNavigate?: AdminNavigate }) {
  const { session } = useAdminSession();
  const [tab, setTab] = useState<'staff' | 'members'>('staff');
  const [data, setData] = useState<StaffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'editor' as StaffRole, password: '' });
  const [busyId, setBusyId] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const load = useCallback(() => {
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/staff', { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'โหลดรายชื่อทีมงานไม่สำเร็จ');
        if (active) { setData(json); setError(null); }
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดรายชื่อทีมงานไม่สำเร็จ'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

  const post = async (body: Record<string, unknown>, success: string) => {
    setBusyId(typeof body.id === 'string' ? body.id : 'create');
    setNotice(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (handleAdminUnauthorized(res)) return false;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'ทำรายการไม่สำเร็จ');
      setNotice(success);
      setError(null);
      load();
      return true;
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : 'ทำรายการไม่สำเร็จ');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await post({ action: 'create', ...form }, `สร้างบัญชี ${form.name} แล้ว ส่งอีเมลและรหัสผ่านชั่วคราวให้เจ้าตัวทางช่องทางที่ปลอดภัย`)) {
      setForm({ email: '', name: '', role: 'editor', password: '' });
      setShowCreate(false);
    }
  };

  const handleResetPassword = (account: PublicStaffAccount) => {
    const password = window.prompt(`รหัสผ่านใหม่สำหรับ ${account.name} (อย่างน้อย 10 ตัวอักษร)`);
    if (password) post({ action: 'reset_password', id: account.id, password }, `ตั้งรหัสผ่านใหม่ให้ ${account.name} แล้ว session เดิมถูกออกจากระบบ`);
  };

  const roleLabel = (role: StaffRole) => data?.roles.find((r) => r.id === role)?.label ?? role;
  const ownerLabel = roleLabel('owner');
  const pickedRole = data?.roles.find((r) => r.id === form.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShieldCheck}
        title="บทบาท & สิทธิ์"
        description="ใครทำอะไรได้บ้าง ทั้งทีมงานในระบบหลังบ้าน และคนบนเว็บไซต์ ทุกการเปลี่ยนแปลงถูกบันทึกในบันทึกการกระทำ"
        actions={tab === 'staff' && (
          <>
            <button type="button" onClick={load} disabled={isLoading} className={adminButton.secondary}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
            </button>
            <button type="button" onClick={() => setShowCreate((v) => !v)} className={adminButton.dark}>
              <Plus size={14} /> เพิ่มทีมงาน
            </button>
          </>
        )}
      />

      <div className="inline-flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="บทบาทของใคร">
        <button type="button" role="tab" aria-selected={tab === 'staff'} onClick={() => setTab('staff')} className={tabClass(tab === 'staff')}>ทีมงาน</button>
        <button type="button" role="tab" aria-selected={tab === 'members'} onClick={() => setTab('members')} className={tabClass(tab === 'members')}>สมาชิกบนเว็บไซต์</button>
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

      {tab === 'members' && data && <MemberLadder roles={data.roles} onNavigate={onNavigate} />}

      {tab === 'staff' && (
        <>
          {showCreate && (
            <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">เพิ่มบัญชีทีมงาน</h2>
                <p className="text-xs text-slate-500 mt-0.5">ระบบยังไม่ส่งอีเมลเชิญ ตั้งรหัสผ่านชั่วคราวแล้วแจ้งเจ้าตัวเอง</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="staff-name" className={labelClass}>ชื่อที่แสดง:</label>
                  <input id="staff-name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="staff-email" className={labelClass}>อีเมล:</label>
                  <input id="staff-email" type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="staff-role" className={labelClass}>บทบาท:</label>
                  <select id="staff-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })} className={inputClass}>
                    {data?.roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                  </select>
                  {pickedRole && <p className="mt-1.5 text-[11px] text-slate-500">{pickedRole.description}</p>}
                </div>
                <div>
                  <label htmlFor="staff-password" className={labelClass}>รหัสผ่านชั่วคราว (อย่างน้อย 10 ตัว):</label>
                  <input id="staff-password" type="password" required minLength={10} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className={adminButton.secondary}>ยกเลิก</button>
                <button type="submit" disabled={busyId === 'create'} className={adminButton.primary}>
                  {busyId === 'create' && <Loader2 size={14} className="animate-spin" />} สร้างบัญชี
                </button>
              </div>
            </form>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-900">บัญชีทีมงาน</h2>
              {session.actor && <p className="text-[11px] text-slate-500 mt-0.5">คุณเข้าใช้ในฐานะ {session.actor.roleLabel}</p>}
            </div>
            {data?.envOwnerEnabled && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">เจ้าของระบบ (รหัสจาก ADMIN_PASSWORD)</p>
                  <p className="text-[11px] text-slate-500">บัญชีสำรองที่ตั้งบนเซิร์ฟเวอร์ ใช้ได้เสมอแม้ไฟล์บัญชีทีมงานหาย</p>
                </div>
                <AdminBadge>{ownerLabel}</AdminBadge>
              </div>
            )}
            {isLoading && !data ? (
              <div>{[1, 2].map((n) => <div key={n} className="h-16 animate-pulse border-b border-slate-100 bg-slate-50/50" />)}</div>
            ) : data && data.staff.length === 0 ? (
              <div className="p-4">
                <AdminEmptyState>
                  ยังไม่มีบัญชีทีมงาน ตอนนี้ใช้ได้เฉพาะบัญชีเจ้าของระบบ กด “เพิ่มทีมงาน” แล้วเลือกบทบาทจากการ์ดด้านล่าง
                </AdminEmptyState>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                      <th className="px-4 py-2.5">ชื่อ / อีเมล</th>
                      <th className="px-4 py-2.5">บทบาท</th>
                      <th className="px-4 py-2.5">สถานะ</th>
                      <th className="px-4 py-2.5">เข้าระบบล่าสุด</th>
                      <th className="px-4 py-2.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.staff.map((account) => {
                      const isSelf = session.actor?.id === account.id;
                      const busy = busyId === account.id;
                      return (
                        <tr key={account.id} className={account.status === 'disabled' ? 'opacity-60' : ''}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800">{account.name}{isSelf && <span className="ml-1.5 text-[11px] font-semibold text-slate-500">(คุณ)</span>}</p>
                            <p className="text-[11px] text-slate-500">{account.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`บทบาทของ ${account.name}`}
                              value={account.role}
                              disabled={isSelf || busy}
                              onChange={(e) => post({ action: 'set_role', id: account.id, role: e.target.value }, `เปลี่ยนบทบาทของ ${account.name} เป็น ${roleLabel(e.target.value as StaffRole)} แล้ว`)}
                              className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:bg-slate-50"
                            >
                              {data.roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] sm:text-xs font-bold ${account.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {account.status === 'active' ? 'ใช้งาน' : 'ปิดแล้ว'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatDateTime(account.lastLoginAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              <button type="button" disabled={busy} onClick={() => handleResetPassword(account)} className={adminButton.secondarySm}>ตั้งรหัสใหม่</button>
                              <button type="button" disabled={busy} onClick={() => post({ action: 'force_logout', id: account.id }, `${account.name} ถูกออกจากระบบทุกอุปกรณ์แล้ว`)} className={adminButton.secondarySm}>บังคับออก</button>
                              {!isSelf && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => post({ action: 'set_status', id: account.id, status: account.status === 'active' ? 'disabled' : 'active' }, `${account.status === 'active' ? 'ปิด' : 'เปิด'}บัญชี ${account.name} แล้ว`)}
                                  className={account.status === 'active' ? adminButton.dangerSm : adminButton.secondarySm}
                                >
                                  {account.status === 'active' ? 'ปิดบัญชี' : 'เปิดบัญชี'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {data && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900">บทบาทของทีมงาน</h2>
              <RoleCards roles={data.roles} />
              <AccessTable roles={data.roles} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
