'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Flag, Loader2, RefreshCw } from 'lucide-react';
import { AdminBadge, AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';
import type { AdminModuleId } from './AdminSidebar';

interface Report {
  id: string;
  targetType: 'community' | 'fair' | 'spot';
  targetId: string;
  targetTitle: string;
  reasonLabel: string;
  details: string;
  reporterName: string;
  hostName?: string;
  hostMemberId?: string;
  sameTargetOpen: number;
  createdAt: string;
  status: 'open' | 'closed';
  closedBy?: string;
  note?: string;
}

const TYPE_LABELS = { community: 'กิจกรรมคอมมูนิตี้', fair: 'งานแฟร์', spot: 'สถานที่' };
const PUBLIC_PATHS = { community: '/community/', fair: '/fairs/', spot: '/spots/' };
const MODULES: Record<Report['targetType'], AdminModuleId> = { community: 'community', fair: 'fairs', spot: 'spots' };
const formatDate = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

/** Safety reports members send from event, fair and place pages. Staff read them, act in the content module, then close them. */
export function ReportsManagerView({ onNavigate }: { onNavigate: (module: AdminModuleId) => void }) {
  const { can } = useAdminSession();
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [reports, setReports] = useState<Report[] | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/reports?status=${status}`, { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) throw new Error(json.error || 'โหลดรายงานไม่สำเร็จ');
        setReports(json.reports);
        setOpenCount(json.counts.open);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [status, reloadToken]);

  const close = async (report: Report) => {
    setBusyId(report.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'close', id: report.id, note: notes[report.id] ?? '' }) });
      if (handleAdminUnauthorized(res)) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'ปิดรายงานไม่สำเร็จ');
      setReloadToken((token) => token + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        icon={Flag}
        title="รายงานความปลอดภัย"
        description="สิ่งที่สมาชิกรายงานจากหน้ากิจกรรม งานแฟร์ และสถานที่ ผู้ถูกรายงานไม่เห็นว่าใครรายงาน"
        badge={openCount > 0 ? <AdminBadge tone="amber">{openCount} รอดู</AdminBadge> : undefined}
        actions={
          <button type="button" onClick={() => { setReports(null); setReloadToken((token) => token + 1); }} className={adminButton.secondary}>
            <RefreshCw size={13} /> โหลดใหม่
          </button>
        }
      />

      <div className="inline-flex rounded-xl bg-slate-100 p-0.5">
        {(['open', 'closed'] as const).map((value) => (
          <button key={value} type="button" onClick={() => { setReports(null); setStatus(value); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === value ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}>
            {value === 'open' ? 'รอดู' : 'ปิดแล้ว'}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

      {reports === null ? (
        <p className="flex items-center gap-2 py-10 justify-center text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> กำลังโหลด</p>
      ) : reports.length === 0 ? (
        <AdminEmptyState>{status === 'open' ? 'ไม่มีรายงานที่รอดู' : 'ยังไม่มีรายงานที่ปิดแล้ว'}</AdminEmptyState>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">{TYPE_LABELS[report.targetType]} · {formatDate(report.createdAt)}</p>
                  <h2 className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-900">{report.targetTitle}</h2>
                </div>
                {report.status === 'open' && report.sameTargetOpen > 1 && <AdminBadge tone="amber">ถูกรายงาน {report.sameTargetOpen} ครั้ง</AdminBadge>}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><dt className="font-semibold text-slate-500">เหตุผล</dt><dd className="mt-0.5 font-bold text-slate-900">{report.reasonLabel}</dd></div>
                <div><dt className="font-semibold text-slate-500">ผู้รายงาน</dt><dd className="mt-0.5 text-slate-800">{report.reporterName}</dd></div>
                {report.details && <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">รายละเอียด</dt><dd className="mt-0.5 text-slate-800 whitespace-pre-wrap">{report.details}</dd></div>}
                {report.hostName && <div><dt className="font-semibold text-slate-500">คนจัด</dt><dd className="mt-0.5 text-slate-800">{report.hostName}</dd></div>}
                {report.status === 'closed' && <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">ปิดโดย</dt><dd className="mt-0.5 text-slate-800">{report.closedBy}{report.note ? ` · ${report.note}` : ''}</dd></div>}
              </dl>
              <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-3">
                <a href={`${PUBLIC_PATHS[report.targetType]}${report.targetId}`} target="_blank" rel="noopener noreferrer" className={adminButton.secondary}>
                  เปิดหน้าเว็บ <ExternalLink size={12} />
                </a>
                <button type="button" onClick={() => onNavigate(MODULES[report.targetType])} className={adminButton.secondary}>ไปที่หน้าจัดการ</button>
                {report.hostMemberId && can('members.manage') && <button type="button" onClick={() => onNavigate('members')} className={adminButton.secondary}>ไปที่สมาชิก</button>}
                {report.status === 'open' && can('community.review') && (
                  <span className="flex items-center gap-2 ml-auto flex-1 sm:flex-none min-w-[240px]">
                    <label htmlFor={`note-${report.id}`} className="sr-only">บันทึกสิ่งที่ทำ</label>
                    <input id={`note-${report.id}`} value={notes[report.id] ?? ''} maxLength={300} onChange={(e) => setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))} placeholder="บันทึกสิ่งที่ทำ (ไม่บังคับ)" className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                    <button type="button" disabled={busyId === report.id} onClick={() => close(report)} className={adminButton.primary}>
                      {busyId === report.id && <Loader2 size={14} className="animate-spin" />} ปิดรายงาน
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
