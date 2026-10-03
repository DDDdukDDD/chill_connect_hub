'use client';

import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, ArrowRight, CheckCircle2, Clock3, Leaf, RefreshCw, Trophy, Users, Zap } from 'lucide-react';
import { AdminModuleId } from './AdminSidebar';
import { AdminEventItem } from '@/lib/eventsStore';
import { LifestyleSpotItem } from '@/data/spotsData';
import { ChallengeQuest } from '@/data/mockData';
import { handleAdminUnauthorized } from './adminAuthUtils';

interface AdminDashboardViewProps {
  onNavigate: (module: AdminModuleId) => void;
}

interface DashboardData {
  spots: LifestyleSpotItem[];
  events: AdminEventItem[];
  quests: ChallengeQuest[];
  missingImages: number;
}

async function fetchDashboardData(): Promise<DashboardData> {
  const responses = await Promise.all([
    fetch('/api/admin/spots', { cache: 'no-store' }),
    fetch('/api/admin/events', { cache: 'no-store' }),
    fetch('/api/admin/quests?limit=100', { cache: 'no-store' }),
  ]);
  const unauthorized = responses.find((response) => response.status === 401);
  if (unauthorized) {
    handleAdminUnauthorized(unauthorized);
    throw new Error('เซสชันผู้ดูแลหมดอายุ กำลังนำทางไปหน้าเข้าสู่ระบบ...');
  }
  const [spotsData, eventsData, questsData] = await Promise.all(responses.map((response) => response.json()));
  const failedResponse = responses.find((response) => !response.ok);
  if (failedResponse || !spotsData.success || !eventsData.success || !questsData.success) {
    throw new Error('ไม่สามารถโหลดข้อมูลจาก Admin API ได้');
  }
  return {
    spots: spotsData.spots,
    events: eventsData.events,
    quests: questsData.quests,
    missingImages: spotsData.missingImagesCount || 0,
  };
}

export function AdminDashboardView({ onNavigate }: AdminDashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    fetchDashboardData()
      .then((result) => { if (isActive) setData(result); })
      .catch((loadError) => { if (isActive) setError(loadError instanceof Error ? loadError.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล'); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, []);

  const communityEvents = data?.events.filter((event) => event.eventType === 'community') || [];
  const fairs = data?.events.filter((event) => event.eventType === 'public_venue') || [];
  const pendingEvents = data?.events.filter((event) => event.approvalStatus === 'pending') || [];
  const draftSpots = data?.spots.filter((spot) => spot.publicationStatus === 'draft') || [];
  const activeQuests = data?.quests.filter((quest) => quest.status !== 'draft' && quest.status !== 'ended' && quest.visibility !== 'private') || [];
  const draftQuests = data?.quests.filter((quest) => quest.status === 'draft' || quest.visibility === 'private') || [];

  const metrics = [
    { label: 'Lifestyle spots', value: data?.spots.length, detail: `${draftSpots.length} แบบร่าง`, icon: Leaf, color: 'text-emerald-800', module: 'spots' as const },
    { label: 'Community meetups', value: communityEvents.length, detail: `${pendingEvents.filter((event) => event.eventType === 'community').length} รอตรวจ`, icon: Users, color: 'text-orange-800', module: 'community' as const },
    { label: 'Fairs & expos', value: fairs.length, detail: `${pendingEvents.filter((event) => event.eventType === 'public_venue').length} รอตรวจ`, icon: Trophy, color: 'text-sky-800', module: 'fairs' as const },
    { label: 'Active quests', value: activeQuests.length, detail: `${draftQuests.length} แบบร่าง`, icon: Zap, color: 'text-amber-800', module: 'quests' as const },
  ];

  const reviewItems = [
    ...pendingEvents.map((event) => ({ title: event.title, type: event.eventType === 'community' ? 'Community' : 'Fair', module: event.eventType === 'community' ? 'community' as const : 'fairs' as const })),
    ...draftSpots.map((spot) => ({ title: spot.title, type: 'Spot draft', module: 'spots' as const })),
    ...draftQuests.map((quest) => ({ title: quest.title, type: 'Quest draft', module: 'quests' as const })),
  ].slice(0, 7);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Chill & Connect / Content operations</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Discovery overview</h1>
          <p className="mt-1 text-sm text-slate-600">ภาพรวมเนื้อหาและรายการที่ต้องดำเนินการ</p>
        </div>
        <button type="button" onClick={refresh} disabled={isLoading} aria-label="รีเฟรชข้อมูลแดชบอร์ด" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </section>

      {error && <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}

      <section aria-label="Discovery content counts" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <button key={metric.label} type="button" onClick={() => onNavigate(metric.module)} className="group flex min-h-28 items-start justify-between rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
              <div>
                <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                <p className={`mt-2 text-3xl font-bold tabular-nums ${metric.color}`}>{isLoading ? '—' : metric.value}</p>
                <p className="mt-1 text-xs text-slate-500">{isLoading ? 'กำลังโหลด' : metric.detail}</p>
              </div>
              <Icon size={18} className={`${metric.color} opacity-80`} />
            </button>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold text-slate-950">Review queue</h2>
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-500">{isLoading ? '—' : reviewItems.length}</span>
          </div>
          {isLoading ? (
            <div className="space-y-px" aria-label="กำลังโหลดคิวตรวจสอบ">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse border-b border-slate-100 bg-slate-50/50" />)}</div>
          ) : reviewItems.length === 0 ? (
            <div className="space-y-4 px-4 py-5">
              <div className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 size={18} className="text-emerald-700" />ไม่มีเนื้อหารอตรวจสอบ</div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {[
                  { label: 'ตรวจสอบ meetups', module: 'community' as const },
                  { label: 'จัดการ spots', module: 'spots' as const },
                  { label: 'จัดการ quests', module: 'quests' as const },
                ].map((action) => (
                  <button key={action.module} type="button" onClick={() => onNavigate(action.module)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                    {action.label}<ArrowRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul>
              {reviewItems.map((item, index) => (
                <li key={`${item.module}-${item.title}-${index}`} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.type}</p>
                  </div>
                  <button type="button" onClick={() => onNavigate(item.module)} aria-label={`เปิด ${item.type}`} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><ArrowRight size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-950">Content health</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Spots with images', value: data ? `${Math.max(0, data.spots.length - data.missingImages)} / ${data.spots.length}` : '—', detail: `${data?.missingImages ?? 0} missing`, module: 'spots' as const },
              { label: 'Community approvals', value: data ? `${communityEvents.filter((event) => event.approvalStatus === 'approved').length} / ${communityEvents.length}` : '—', detail: 'approved', module: 'community' as const },
              { label: 'Fair approvals', value: data ? `${fairs.filter((event) => event.approvalStatus === 'approved').length} / ${fairs.length}` : '—', detail: 'approved', module: 'fairs' as const },
              { label: 'Quest publication', value: data ? `${activeQuests.length} / ${data.quests.length}` : '—', detail: `${draftQuests.length} drafts`, module: 'quests' as const },
            ].map((item) => (
              <button key={item.label} type="button" onClick={() => onNavigate(item.module)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 pb-3 text-left last:border-0 last:pb-0">
                <div><p className="text-xs font-semibold text-slate-700">{item.label}</p><p className="mt-0.5 text-[11px] text-slate-500">{isLoading ? 'กำลังโหลด' : item.detail}</p></div>
                <span className="text-sm font-bold tabular-nums text-slate-950">{isLoading ? '—' : item.value}</span>
              </button>
            ))}
          </div>
          <p className="mt-5 border-t border-slate-200 pt-3 text-[11px] text-slate-500">Data source: repository APIs · local JSON adapter</p>
        </div>
      </section>
    </div>
  );
}
