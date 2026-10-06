'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Loader2, Plus, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { AdminPermission, StaffRole } from '@/lib/permissions';
import type { PublicStaffAccount } from '@/lib/staffStore';
import { AdminBadge, AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';

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

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]';
const labelClass = 'block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5';

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function StaffManagerView() {
  const { session } = useAdminSession();
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShieldCheck}
        title="ทีมงาน & สิทธิ์"
        description="บัญชีทีมงานแต่ละคน role และสิทธิ์ของแต่ละ role ทุกการเปลี่ยนแปลงถูกบันทึกในบันทึกการกระทำ"
        actions={
          <>
            <button type="button" onClick={load} disabled={isLoading} className={adminButton.secondary}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
            </button>
            <button type="button" onClick={() => setShowCreate((v) => !v)} className={adminButton.dark}>
              <Plus size={14} /> เพิ่มทีมงาน
            </button>
          </>
        }
      />

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

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">เพิ่มบัญชีทีมงาน</h2>
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
              <label htmlFor="staff-role" className={labelClass}>Role:</label>
              <select id="staff-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })} className={inputClass}>
                {data?.roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
              </select>
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
        </div>
        {data?.envOwnerEnabled && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">เจ้าของระบบ (รหัสจาก ADMIN_PASSWORD)</p>
              <p className="text-[11px] text-slate-500">บัญชีสำรองที่ตั้งบนเซิร์ฟเวอร์ ใช้ได้เสมอแม้ไฟล์บัญชีทีมงานหาย</p>
            </div>
            <AdminBadge>Owner</AdminBadge>
          </div>
        )}
        {isLoading && !data ? (
          <div>{[1, 2].map((n) => <div key={n} className="h-16 animate-pulse border-b border-slate-100 bg-slate-50/50" />)}</div>
        ) : data && data.staff.length === 0 ? (
          <div className="p-4"><AdminEmptyState>ยังไม่มีบัญชีทีมงาน กด “เพิ่มทีมงาน” เพื่อสร้างบัญชีแรก</AdminEmptyState></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5">ชื่อ / อีเมล</th>
                  <th className="px-4 py-2.5">Role</th>
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
                        <p className="font-bold text-slate-800">{account.name}{isSelf && <span className="ml-1.5 text-[11px] font-semibold text-slate-400">(คุณ)</span>}</p>
                        <p className="text-[11px] text-slate-500">{account.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`role ของ ${account.name}`}
                          value={account.role}
                          disabled={isSelf || busy}
                          onChange={(e) => post({ action: 'set_role', id: account.id, role: e.target.value }, `เปลี่ยน role ของ ${account.name} เป็น ${roleLabel(e.target.value as StaffRole)} แล้ว`)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:bg-slate-50"
                        >
                          {data.roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-extrabold ${account.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
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
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">สิทธิ์ของแต่ละ role</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">กำหนดไว้ในโค้ด (lib/permissions.ts) แก้จากหน้านี้ไม่ได้ เซิร์ฟเวอร์ตรวจสิทธิ์นี้ทุกครั้ง</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left">สิทธิ์</th>
                  {data.roles.map((role) => <th key={role.id} className="px-3 py-2.5 text-center" title={role.description}>{role.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Object.keys(data.permissionLabels) as AdminPermission[]).map((permission) => (
                  <tr key={permission}>
                    <td className="px-4 py-2.5 text-xs text-slate-700">{data.permissionLabels[permission]}</td>
                    {data.roles.map((role) => (
                      <td key={role.id} className="px-3 py-2.5 text-center">
                        {role.permissions.includes(permission)
                          ? <Check size={15} className="inline text-emerald-600" aria-label="มีสิทธิ์" />
                          : <span className="text-slate-300" aria-label="ไม่มีสิทธิ์">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
