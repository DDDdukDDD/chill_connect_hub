'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, History, RefreshCw, Search } from 'lucide-react';
import type { AuditEntry } from '@/lib/auditLog';
import { AdminEmptyState, AdminPageHeader, adminButton } from './AdminUI';
import { AdminPagination, AdminPaginationState } from './AdminPagination';
import { handleAdminUnauthorized } from './adminAuthUtils';

const ACTION_GROUPS = [
  { id: '', label: 'ทุกประเภท' },
  { id: 'event', label: 'กิจกรรม / งานแฟร์' },
  { id: 'spot', label: 'สถานที่' },
  { id: 'quest', label: 'ชาเลนจ์' },
  { id: 'scrape', label: 'การดึงข้อมูล' },
  { id: 'source', label: 'แหล่งข้อมูล' },
  { id: 'staff', label: 'ทีมงาน' },
  { id: 'auth', label: 'เข้า / ออกระบบ' },
  { id: 'media', label: 'รูปภาพ' },
  { id: 'cache', label: 'Cache' },
];

function actionTone(action: string) {
  if (/(delete|reject|login_failed|disabled|force_logout)/.test(action)) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (/(approve|publish|create)/.test(action)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export function AuditLogView() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationState | null>(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  // Filter changes start the spinner here; the fetch effect itself only reports results
  const refetch = (apply: () => void) => {
    setIsLoading(true);
    apply();
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (action) params.set('action', action);
    if (debouncedQuery) params.set('q', debouncedQuery);
    fetch(`/api/admin/audit?${params}`, { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'โหลดบันทึกไม่สำเร็จ');
        if (cancelled) return;
        setEntries(data.entries);
        setPagination(data.pagination);
        setError(null);
      })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'โหลดบันทึกไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, action, debouncedQuery, reloadToken]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={History}
        title="บันทึกการกระทำ"
        description="ใครทำอะไร กับอะไร เมื่อไร ในหน้า admin (เก็บล่าสุด 2,000 รายการ)"
        actions={
          <button type="button" onClick={() => refetch(() => setReloadToken((t) => t + 1))} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <select
          aria-label="ประเภทการกระทำ"
          value={action}
          onChange={(e) => { const value = e.target.value; refetch(() => { setAction(value); setPage(1); }); }}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
        >
          {ACTION_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
        </select>
        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => { const value = e.target.value; refetch(() => { setQuery(value); setPage(1); }); }}
            placeholder="ค้นหาในรายละเอียด"
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      {!isLoading && entries.length === 0 ? (
        <AdminEmptyState>ยังไม่มีบันทึกที่ตรงกับตัวกรอง</AdminEmptyState>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5 whitespace-nowrap">เวลา</th>
                  <th className="px-4 py-2.5">ผู้กระทำ</th>
                  <th className="px-4 py-2.5">การกระทำ</th>
                  <th className="px-4 py-2.5">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && entries.length === 0
                  ? [1, 2, 3].map((n) => <tr key={n}><td colSpan={4} className="h-12 animate-pulse bg-slate-50/50" /></tr>)
                  : entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap tabular-nums">
                        {new Date(entry.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-bold text-slate-800">{entry.actorName}</p>
                        <p className="text-[11px] text-slate-400">{entry.actorRole}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-extrabold whitespace-nowrap ${actionTone(entry.action)}`}>{entry.action}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-700">{entry.summary}</td>
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
    </div>
  );
}
