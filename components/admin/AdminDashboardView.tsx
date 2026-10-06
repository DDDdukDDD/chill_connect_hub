'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertCircle, ArrowRight, CheckCircle2, History, Inbox, LayoutDashboard, RefreshCw } from 'lucide-react';
import type { AuditEntry } from '@/lib/auditLog';
import { AdminPageHeader, PillarBadge, adminButton } from './AdminUI';
import type { AdminModuleId } from './AdminSidebar';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';

interface QueueItem {
  id: string;
  pillar: 'community' | 'fairs' | 'spots';
  title: string;
  province: string;
  quality: { score: number; requiredFailures: number };
}

interface Health {
  publishedSpots: number;
  spotsMissingImage: number;
  spotsBadCoordinates: number;
  thinProvinces: Array<{ province: string; count: number }>;
  fairsEndingSoon: Array<{ id: string; title: string; date: string }>;
  approvedEventsPastEnd: number;
  failedSources: Array<{ id: string; name: string; lastRunAt: string | null }>;
}

interface OverviewData {
  counts: { all: number; community: number; fairs: number; spots: number };
  items: QueueItem[];
  health: Health;
  activity: AuditEntry[] | null;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (handleAdminUnauthorized(res)) throw new Error('เซสชันผู้ดูแลหมดอายุ กำลังนำทางไปหน้าเข้าสู่ระบบ...');
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'ไม่สามารถโหลดข้อมูลได้');
  return data;
}

// "Today" for the admin: what needs a decision, what is unhealthy, and what the team did recently
export function AdminDashboardView({ onNavigate }: { onNavigate: (module: AdminModuleId) => void }) {
  const { can } = useAdminSession();
  const canViewAudit = can('audit.view');
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (): Promise<OverviewData> => {
    const [queue, audit] = await Promise.all([
      fetchJson('/api/admin/review?limit=5&health=1'),
      canViewAudit ? fetchJson('/api/admin/audit?limit=6') : Promise.resolve(null),
    ]);
    return { counts: queue.counts, items: queue.items, health: queue.health, activity: audit?.entries ?? null };
  }, [canViewAudit]);

  const [reloadToken, setReloadToken] = useState(0);
  const load = () => {
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  };

  useEffect(() => {
    let active = true;
    fetchOverview()
      .then((result) => { if (active) { setData(result); setError(null); } })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [fetchOverview, reloadToken]);

  const health = data?.health;
  const healthRows: Array<{ label: string; value: string; problem: boolean; detail?: string; module: AdminModuleId }> = health ? [
    { label: 'สถานที่ที่เผยแพร่', value: health.publishedSpots.toLocaleString('th-TH'), problem: false, module: 'spots' },
    { label: 'สถานที่ไม่มีรูป', value: String(health.spotsMissingImage), problem: health.spotsMissingImage > 0, module: 'spots' },
    { label: 'สถานที่พิกัดผิด', value: String(health.spotsBadCoordinates), problem: health.spotsBadCoordinates > 0, module: 'spots' },
    {
      label: 'จังหวัดที่ข้อมูลบาง (ต่ำกว่า 10 แห่ง)',
      value: String(health.thinProvinces.length),
      problem: health.thinProvinces.length > 0,
      detail: health.thinProvinces.slice(0, 6).map((p) => `${p.province} ${p.count}`).join(' · '),
      module: 'scraper',
    },
    {
      label: 'งานแฟร์ที่จะจบภายใน 7 วัน',
      value: String(health.fairsEndingSoon.length),
      problem: false,
      detail: health.fairsEndingSoon.slice(0, 3).map((f) => f.title).join(' · '),
      module: 'fairs',
    },
    { label: 'งานที่จบแล้วแต่ยังแสดงสถานะเดิม', value: String(health.approvedEventsPastEnd), problem: health.approvedEventsPastEnd > 0, module: 'fairs' },
    {
      label: 'แหล่งข้อมูลที่ดึงล้มเหลวรอบล่าสุด',
      value: String(health.failedSources.length),
      problem: health.failedSources.length > 0,
      detail: health.failedSources.map((s) => s.name).join(' · '),
      module: 'scraper',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={LayoutDashboard}
        title="ภาพรวมวันนี้"
        description="สิ่งที่รอการตัดสินใจ สุขภาพของข้อมูล และสิ่งที่ทีมทำล่าสุด"
        actions={
          <button type="button" onClick={load} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        }
      />

      {error && <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* To do */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">สิ่งที่ต้องทำ</h2>
            </div>
            <button type="button" onClick={() => onNavigate('review')} className={adminButton.primarySm}>
              เปิดคิวตรวจ <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            {(['community', 'fairs', 'spots'] as const).map((pillar) => (
              <button key={pillar} type="button" onClick={() => onNavigate('review')} className="px-4 py-3 text-left hover:bg-slate-50">
                <PillarBadge pillar={pillar} />
                <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{isLoading && !data ? '—' : data?.counts[pillar] ?? 0}</p>
                <p className="text-[11px] text-slate-500">รอตรวจ</p>
              </button>
            ))}
          </div>
          {isLoading && !data ? (
            <div>{[1, 2, 3].map((n) => <div key={n} className="h-12 animate-pulse border-b border-slate-100 bg-slate-50/50" />)}</div>
          ) : data && data.items.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-600"><CheckCircle2 size={18} className="text-emerald-700" />ไม่มีรายการรอตรวจ</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.items.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onNavigate('review')} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <PillarBadge pillar={item.pillar} />
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-800">{item.title}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">{item.province}</span>
                    <span className={`shrink-0 text-[11px] font-extrabold tabular-nums ${item.quality.requiredFailures ? 'text-rose-600' : 'text-emerald-700'}`}>{item.quality.score}%</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Data health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">สุขภาพข้อมูล</h2>
          </div>
          <ul className="space-y-0.5">
            {(isLoading && !health ? [] : healthRows).map((row) => (
              <li key={row.label}>
                <button type="button" onClick={() => onNavigate(row.module)} className="flex w-full items-start justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{row.label}</p>
                    {row.detail && <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{row.detail}</p>}
                  </div>
                  <span className={`text-sm font-bold tabular-nums shrink-0 ${row.problem ? 'text-rose-600' : 'text-slate-900'}`}>{row.value}</span>
                </button>
              </li>
            ))}
            {isLoading && !health && [1, 2, 3, 4].map((n) => <li key={n} className="h-9 animate-pulse rounded-lg bg-slate-50" />)}
          </ul>
        </div>
      </section>

      {canViewAudit && (
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">ทีมทำอะไรไปล่าสุด</h2>
            </div>
            <button type="button" onClick={() => onNavigate('audit')} className={adminButton.secondarySm}>ดูทั้งหมด</button>
          </div>
          {data?.activity && data.activity.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500">ยังไม่มีบันทึก</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.activity?.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  <span className="w-28 shrink-0 text-slate-400 tabular-nums">{new Date(entry.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="w-28 shrink-0 truncate font-bold text-slate-700">{entry.actorName}</span>
                  <span className="flex-1 min-w-0 truncate text-slate-600">{entry.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
