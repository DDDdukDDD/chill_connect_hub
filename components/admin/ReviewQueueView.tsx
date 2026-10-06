'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CircleAlert, CircleCheck, ExternalLink, Inbox, Loader2, Pencil, RefreshCw, Search, X } from 'lucide-react';
import { SpotCard } from '@/components/SpotCard';
import { SpotListItem } from '@/components/SpotListItem';
import { EventGrid } from '@/components/EventGrid';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import type { QualityReport } from '@/lib/contentQuality';
import { AdminEmptyState, AdminPageHeader, PillarBadge, adminButton } from './AdminUI';
import { AdminPagination, AdminPaginationState } from './AdminPagination';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';
import type { AdminModuleId } from './AdminSidebar';

type Pillar = 'community' | 'fairs' | 'spots';

interface ReviewItem {
  kind: 'event' | 'spot';
  id: string;
  pillar: Pillar;
  title: string;
  province: string;
  source: string;
  submittedAt: number | null;
  quality: QualityReport;
  data: (EventItem & { sourceUrl?: string }) | LifestyleSpotItem;
}

interface Counts {
  all: number;
  community: number;
  fairs: number;
  spots: number;
}

const TABS: Array<{ id: Pillar | 'all'; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'community', label: 'คอมมูนิตี้' },
  { id: 'fairs', label: 'งานแฟร์' },
  { id: 'spots', label: 'พิกัดเที่ยว' },
];

const PAGE_SIZE = 20;
const noop = () => {};

function scoreTone(report: QualityReport) {
  if (report.requiredFailures > 0) return 'text-rose-700 bg-rose-50 border-rose-200';
  if (report.score < 90) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

function sourceLink(item: ReviewItem): string | undefined {
  const data = item.data as { externalUrl?: string; sourceUrl?: string; link?: string };
  return data.externalUrl || data.sourceUrl || data.link || undefined;
}

// Renders the real frontend card/row so the admin sees exactly what members will see.
// Clicks are swallowed so the preview never navigates away from the console.
function FrontendPreview({ item, mode }: { item: ReviewItem; mode: 'card' | 'list' }) {
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  if (item.kind === 'spot') {
    const spot = item.data as LifestyleSpotItem;
    return (
      <div onClickCapture={stop} className={mode === 'card' ? 'max-w-[280px]' : ''}>
        {mode === 'card'
          ? <SpotCard spot={spot} isFavorite={false} onToggleFavorite={noop} />
          : <SpotListItem spot={spot} isFavorite={false} onToggleFavorite={noop} />}
      </div>
    );
  }
  return (
    <div onClickCapture={stop} className={mode === 'card' ? 'max-w-[300px]' : ''}>
      <EventGrid
        events={[item.data as EventItem]}
        onSelectEvent={noop}
        favorites={[]}
        toggleFavorite={noop}
        viewMode={mode === 'card' ? 'grid' : 'list'}
        columns={4}
      />
    </div>
  );
}

export function ReviewQueueView({ onNavigate }: { onNavigate: (module: AdminModuleId) => void }) {
  const { can } = useAdminSession();
  const [tab, setTab] = useState<Pillar | 'all'>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [pagination, setPagination] = useState<AdminPaginationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState<'card' | 'list'>('card');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (tab !== 'all') params.set('pillar', tab);
    if (debouncedQuery) params.set('q', debouncedQuery);
    fetch(`/api/admin/review?${params}`, { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.message || 'โหลดคิวตรวจไม่สำเร็จ');
        if (cancelled) return;
        setItems(data.items);
        setCounts(data.counts);
        setPagination(data.pagination);
        setError(null);
        setActiveId((current) => (data.items.some((item: ReviewItem) => item.id === current) ? current : data.items[0]?.id ?? null));
        setSelected((current) => new Set([...current].filter((id) => data.items.some((item: ReviewItem) => item.id === id))));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'โหลดคิวตรวจไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, debouncedQuery, page, reloadToken]);

  const activeIndex = items.findIndex((item) => item.id === activeId);
  const active = activeIndex >= 0 ? items[activeIndex] : null;
  const canDecide = useCallback(
    (item: ReviewItem) => can(item.pillar === 'community' ? 'community.review' : 'content.edit'),
    [can]
  );

  const decide = useCallback(async (action: 'approve' | 'reject', targets: ReviewItem[]) => {
    const allowed = targets.filter(canDecide);
    if (allowed.length === 0) return;
    setIsSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, items: allowed.map(({ kind, id }) => ({ kind, id })), reason: action === 'reject' ? reason : undefined }),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      const decidedIds = new Set(allowed.map((item) => item.id));
      // Move focus to the next item that is still waiting
      const next = items.slice(activeIndex + 1).find((item) => !decidedIds.has(item.id))
        ?? items.find((item) => !decidedIds.has(item.id));
      setActiveId(next?.id ?? null);
      setSelected(new Set());
      setReason('');
      setNotice(`${action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}แล้ว ${data.updated} รายการ`);
      refetch(() => setReloadToken((token) => token + 1));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeIndex, canDecide, items, reason]);

  // Keyboard: J / K move, A approve, R reject (ignored while typing)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey || isSubmitting) return;
      const key = event.key.toLowerCase();
      if (key === 'j' && activeIndex < items.length - 1) setActiveId(items[activeIndex + 1].id);
      else if (key === 'k' && activeIndex > 0) setActiveId(items[activeIndex - 1].id);
      else if (key === 'a' && active && canDecide(active)) decide('approve', [active]);
      else if (key === 'r' && active && canDecide(active)) decide('reject', [active]);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, activeIndex, canDecide, decide, isSubmitting, items]);

  const selectedItems = useMemo(() => items.filter((item) => selected.has(item.id)), [items, selected]);
  const toggleSelected = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Inbox}
        title="คิวตรวจ"
        description="ทุกอย่างที่รอการตัดสินใจ ทั้งงานที่ดึงมา สถานที่ร่าง และกิจกรรมที่สมาชิกสร้าง ดูตัวอย่างแบบที่ผู้ใช้จะเห็นก่อนอนุมัติ"
        actions={
          <button type="button" onClick={() => refetch(() => setReloadToken((token) => token + 1))} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => refetch(() => { setTab(t.id); setPage(1); })}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${tab === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t.label} <span className="tabular-nums opacity-70">{counts ? counts[t.id] : '—'}</span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => { const value = e.target.value; refetch(() => { setQuery(value); setPage(1); }); }}
            placeholder="ค้นหาชื่อหรือแหล่งที่มา"
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="ปิด"><X size={14} /></button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0" />
          {notice}
        </div>
      )}

      {!isLoading && items.length === 0 ? (
        <AdminEmptyState
          action={(tab !== 'all' || query) && (
            <button type="button" onClick={() => refetch(() => { setTab('all'); setQuery(''); })} className={adminButton.secondarySm}>ดูทั้งหมด</button>
          )}
        >
          {tab === 'all' && !query ? 'ไม่มีรายการรอตรวจ' : 'ไม่พบรายการที่ตรงกับตัวกรอง'}
        </AdminEmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
          {/* List */}
          <section aria-label="รายการรอตรวจ" className="min-w-0 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5 bg-slate-50/60">
              <input
                type="checkbox"
                aria-label="เลือกทั้งหน้า"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)))}
                className="h-4 w-4 accent-slate-900"
              />
              {selectedItems.length > 0 ? (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-700">เลือก {selectedItems.length} รายการ</span>
                  <button type="button" disabled={isSubmitting} onClick={() => decide('approve', selectedItems)} className={adminButton.primarySm}>อนุมัติที่เลือก</button>
                  <button type="button" disabled={isSubmitting} onClick={() => decide('reject', selectedItems)} className={adminButton.dangerSm}>ปฏิเสธที่เลือก</button>
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500">เรียงจากข้อมูลครบที่สุด · คีย์ลัด J / K เลื่อน, A อนุมัติ, R ปฏิเสธ</span>
              )}
            </div>
            {isLoading && items.length === 0 ? (
              <div aria-label="กำลังโหลด">{[1, 2, 3, 4].map((n) => <div key={n} className="h-16 animate-pulse border-b border-slate-100 bg-slate-50/50" />)}</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <li key={`${item.kind}-${item.id}`} className={`flex items-center gap-3 px-4 py-3 ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                      <input
                        type="checkbox"
                        aria-label={`เลือก ${item.title}`}
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        className="h-4 w-4 accent-slate-900 shrink-0"
                      />
                      <button type="button" onClick={() => setActiveId(item.id)} className="flex-1 min-w-0 text-left">
                        <p className={`text-sm truncate ${isActive ? 'font-extrabold text-slate-900' : 'font-bold text-slate-800'}`}>{item.title}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                          <PillarBadge pillar={item.pillar} />
                          {item.province && <span>{item.province}</span>}
                          <span className="truncate">· {item.source}</span>
                        </div>
                      </button>
                      <span
                        title={item.quality.requiredFailures ? `ขาดข้อบังคับ ${item.quality.requiredFailures} ข้อ` : 'ผ่านข้อบังคับครบ'}
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-extrabold tabular-nums ${scoreTone(item.quality)}`}
                      >
                        {item.quality.score}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {pagination && pagination.totalPages > 1 && (
              <div className="border-t border-slate-100 px-4 py-3">
                <AdminPagination pagination={pagination} onPageChange={(next) => refetch(() => setPage(next))} isLoading={isLoading} />
              </div>
            )}
          </section>

          {/* Preview & decision */}
          {active && (
            <section aria-label="ตัวอย่างและการตัดสินใจ" className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 xl:sticky xl:top-20 self-start">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1"><PillarBadge pillar={active.pillar} /></div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2">{active.title}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">แหล่งที่มา: {active.source}</p>
                </div>
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 shrink-0">
                  {(['card', 'list'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreviewMode(mode)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${previewMode === mode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                    >
                      {mode === 'card' ? 'การ์ด' : 'รายการ'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 overflow-hidden">
                <FrontendPreview item={active} mode={previewMode} />
              </div>

              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mb-2">ตรวจคุณภาพ · {active.quality.score}%</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                  {active.quality.checks.map((check) => (
                    <li key={check.id} className="flex items-start gap-1.5 text-xs">
                      {check.ok
                        ? <CircleCheck size={14} className="text-emerald-600 shrink-0 mt-px" />
                        : <CircleAlert size={14} className={`shrink-0 mt-px ${check.severity === 'required' ? 'text-rose-600' : 'text-amber-500'}`} />}
                      <span className={check.ok ? 'text-slate-600' : check.severity === 'required' ? 'text-rose-700 font-semibold' : 'text-amber-700'}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {sourceLink(active) && (
                <a href={sourceLink(active)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
                  เปิดหน้าต้นทาง <ExternalLink size={12} />
                </a>
              )}

              {canDecide(active) ? (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div>
                    <label htmlFor="review-reason" className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5">เหตุผลที่ปฏิเสธ (ไม่บังคับ):</label>
                    <textarea
                      id="review-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button type="button" disabled={isSubmitting} onClick={() => decide('reject', [active])} className={adminButton.danger}>ปฏิเสธ</button>
                    {can('content.edit') && (
                      <button type="button" onClick={() => onNavigate(active.pillar)} className={adminButton.secondary}>
                        <Pencil size={13} /> แก้ไข
                      </button>
                    )}
                    <button type="button" disabled={isSubmitting} onClick={() => decide('approve', [active])} className={`${adminButton.primary} ml-auto`}>
                      {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                      อนุมัติ
                    </button>
                  </div>
                </div>
              ) : (
                <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">บัญชีของคุณดูได้อย่างเดียวสำหรับรายการนี้</p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
