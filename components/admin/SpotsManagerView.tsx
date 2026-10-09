'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Edit3,
  HelpCircle,
  Image as ImageIcon,
  ImageOff,
  Plus,
  ScanSearch,
  Search,
  Trash2,
} from 'lucide-react';
import { AdminPageHeader, AdminStatusChip, adminButton } from './AdminUI';
import { ALL_THAI_PROVINCES, SPOT_CATEGORIES, LifestyleSpotItem } from '@/data/spotsData';
import { checkSpotQuality } from '@/lib/contentQuality';
import { defaultSpotCategoryLabel } from '@/lib/spotCategories';
import { SpotEditorDrawer } from './SpotEditorDrawer';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { AdminPagination, AdminPaginationState } from './AdminPagination';

type ImageStatus = 'ok' | 'broken' | 'missing' | 'unchecked';
type AdminSpot = LifestyleSpotItem & { imageStatus: ImageStatus };
type PublicationFilter = 'all' | 'draft' | 'published';
type ImageFilter = 'all' | 'problem' | 'missing' | 'broken';

interface SpotStats {
  totalCount: number;
  filteredCount: number;
  draftCount: number;
  missingImagesCount: number;
  brokenImagesCount: number;
  uncheckedImagesCount: number;
}

const PAGE_SIZE = 20;

const IMAGE_STATUS_META: Record<ImageStatus, { label: string; className: string; icon: React.ElementType }> = {
  ok: { label: 'รูปใช้ได้', className: 'text-emerald-700', icon: CheckCircle2 },
  broken: { label: 'รูปเสีย', className: 'text-rose-700', icon: ImageOff },
  missing: { label: 'ไม่มีรูป', className: 'text-amber-700', icon: AlertTriangle },
  unchecked: { label: 'ยังไม่ตรวจ', className: 'text-slate-400', icon: HelpCircle },
};

interface SpotsManagerViewProps {
  showToast: (message: string) => void;
}

export function SpotsManagerView({ showToast }: SpotsManagerViewProps) {
  // undefined = closed, null = creating, spot = editing
  const [editing, setEditing] = useState<LifestyleSpotItem | null | undefined>(undefined);
  const [reloadToken, setReloadToken] = useState(0);
  const [spots, setSpots] = useState<AdminSpot[]>([]);
  const [stats, setStats] = useState<SpotStats | null>(null);
  const [pagination, setPagination] = useState<AdminPaginationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [province, setProvince] = useState('all');
  const [category, setCategory] = useState('all');
  const [publication, setPublication] = useState<PublicationFilter>('all');
  const [imageFilter, setImageFilter] = useState<ImageFilter>('all');
  const [page, setPage] = useState(1);
  // Thumbnails that failed to load in this browser (shown immediately, before a server check)
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    let refetchPending = false;
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchQuery) params.set('q', searchQuery);
      if (province !== 'all') params.set('province', province);
      if (category !== 'all') params.set('category', category);
      if (publication !== 'all') params.set('status', publication);
      if (imageFilter !== 'all') params.set('image', imageFilter);

      const res = await fetch(`/api/admin/spots?${params}`, { cache: 'no-store' });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'โหลดรายการสถานที่ไม่สำเร็จ');

      if (data.spots.length === 0 && data.pagination?.page > 1) {
        setPage(data.pagination.totalPages);
        refetchPending = true;
        return;
      }
      setSpots(data.spots);
      setStats(data);
      setPagination(data.pagination ?? null);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'โหลดรายการสถานที่ไม่สำเร็จ');
    } finally {
      if (!refetchPending) setIsLoading(false);
    }
  }, [page, searchQuery, province, category, publication, imageFilter]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh, reloadToken]);

  const postAction = async (key: string, body: Record<string, unknown>, successMessage?: string) => {
    setBusyAction(key);
    try {
      const res = await fetch('/api/admin/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'ดำเนินการไม่สำเร็จ');
      showToast(successMessage || data.message || 'ดำเนินการเรียบร้อย');
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setBusyAction(null);
    }
  };

  const togglePublication = (spot: AdminSpot) => {
    const publicationStatus = spot.publicationStatus === 'draft' ? 'published' : 'draft';
    return postAction(
      `pub:${spot.id}`,
      { action: 'update', spotId: spot.id, updatedFields: { publicationStatus } },
      publicationStatus === 'published' ? `เผยแพร่ "${spot.title}" แล้ว` : `ย้าย "${spot.title}" เป็นแบบร่างแล้ว`
    );
  };

  const deleteSpot = (spot: AdminSpot) => {
    if (!confirm(`ยืนยันการลบ "${spot.title}"? การลบไม่สามารถย้อนกลับได้`)) return;
    return postAction(`del:${spot.id}`, { action: 'delete', spotId: spot.id }, `ลบ "${spot.title}" แล้ว`);
  };

  const resetFilters = () => {
    setSearchInput('');
    setProvince('all');
    setCategory('all');
    setPublication('all');
    setImageFilter('all');
    setPage(1);
  };

  const withPageReset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const selectClass =
    'px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:border-[#4A7C59]/50 shadow-xs';

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Compass}
        title="พิกัดเที่ยว 77 จังหวัด"
        description="สถานที่เที่ยวและจุดฮีลใจทั่ว 77 จังหวัด กรองตาม vibe แบบเดียวกับหน้าเว็บ"
        actions={
          <>
            <button
              onClick={() => postAction('check', { action: 'check_images' })}
              disabled={busyAction !== null}
              title="เปิดรูปของทุกสถานที่จริงเพื่อหารูปที่เสีย"
              className={adminButton.secondary}
            >
              <ScanSearch size={14} />
              {busyAction === 'check' ? 'กำลังตรวจรูป...' : 'ตรวจรูปภาพ'}
            </button>
            <button
              onClick={() => postAction('enrich', { action: 'auto_enrich_images' })}
              disabled={busyAction !== null}
              title="ใส่รูปตามหมวดหมู่ให้สถานที่ที่ยังไม่มีรูป"
              className={adminButton.secondary}
            >
              <ImageIcon size={14} />
              {busyAction === 'enrich' ? 'กำลังเติมรูป...' : 'เติมรูปที่ขาด'}
            </button>
            <button onClick={() => setEditing(null)} className={adminButton.primary}>
              <Plus size={14} />
              เพิ่มสถานที่
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'สถานที่ทั้งหมด', value: stats?.totalCount, color: 'text-slate-950 border-slate-200', onClick: resetFilters },
          { label: 'แบบร่าง', value: stats?.draftCount, color: 'text-amber-900 border-amber-200', onClick: () => withPageReset(setPublication)('draft') },
          { label: 'ไม่มีรูป', value: stats?.missingImagesCount, color: 'text-amber-900 border-amber-200', onClick: () => withPageReset(setImageFilter)('missing') },
          {
            label: stats?.uncheckedImagesCount ? `รูปเสีย · ยังไม่ตรวจ ${stats.uncheckedImagesCount}` : 'รูปเสีย',
            value: stats?.brokenImagesCount,
            color: 'text-rose-900 border-rose-200',
            onClick: () => withPageReset(setImageFilter)('broken'),
          },
        ].map((s) => (
          <button key={s.label} type="button" onClick={s.onClick} className={`text-left border-l-2 bg-white py-1 pl-3 hover:bg-slate-50 ${s.color}`}>
            <p className="text-xl font-bold tabular-nums">{s.value ?? '…'}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ จังหวัด อำเภอ หรือคำอธิบาย..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20 shadow-xs"
          />
        </div>
        <select value={category} onChange={(e) => withPageReset(setCategory)(e.target.value)} aria-label="กรองหมวดหมู่" className={selectClass}>
          <option value="all">ทุก vibe</option>
          {SPOT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={province} onChange={(e) => withPageReset(setProvince)(e.target.value)} aria-label="กรองจังหวัด" className={selectClass}>
          <option value="all">ทุกจังหวัด</option>
          {ALL_THAI_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={publication} onChange={(e) => withPageReset(setPublication)(e.target.value as PublicationFilter)} aria-label="กรองสถานะการเผยแพร่" className={selectClass}>
          <option value="all">ทุกสถานะ</option>
          <option value="published">เผยแพร่แล้ว</option>
          <option value="draft">แบบร่าง</option>
        </select>
        <select value={imageFilter} onChange={(e) => withPageReset(setImageFilter)(e.target.value as ImageFilter)} aria-label="กรองสถานะรูปภาพ" className={selectClass}>
          <option value="all">รูปทุกสถานะ</option>
          <option value="problem">รูปมีปัญหา</option>
          <option value="broken">รูปเสีย</option>
          <option value="missing">ไม่มีรูป</option>
        </select>
      </div>

      {/* List */}
      {loadError ? (
        <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <p className="text-xs sm:text-sm font-bold text-rose-700">{loadError}</p>
          <button onClick={refresh} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold">ลองอีกครั้ง</button>
        </div>
      ) : isLoading && spots.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : spots.length === 0 ? (
        <div className="flex items-center justify-between gap-3 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200">
          <p className="text-slate-500 text-sm">ไม่พบสถานที่ที่ตรงกับเงื่อนไข</p>
          <button onClick={resetFilters} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">ดูทั้งหมด</button>
        </div>
      ) : (
        <div className={`space-y-3 ${isLoading ? 'opacity-60' : ''}`}>
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            {spots.map((spot) => {
              const thumbFailed = failedThumbs.has(spot.id);
              const imageStatus: ImageStatus = thumbFailed && spot.imageStatus !== 'missing' ? 'broken' : spot.imageStatus;
              const imageMeta = IMAGE_STATUS_META[imageStatus];
              const ImageStatusIcon = imageMeta.icon;
              const isDraft = spot.publicationStatus === 'draft';
              const quality = checkSpotQuality(spot);
              const rowBusy = busyAction === `pub:${spot.id}` || busyAction === `del:${spot.id}`;

              return (
                <div
                  key={spot.id}
                  className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 gap-y-2 border-b border-slate-100 px-3 py-3 last:border-b-0 sm:flex sm:items-center sm:gap-4 sm:px-4"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                    {imageStatus !== 'missing' && imageStatus !== 'broken' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={spot.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setFailedThumbs((prev) => new Set(prev).add(spot.id))}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${imageStatus === 'broken' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                        <ImageStatusIcon size={16} className={imageMeta.className} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 font-semibold text-sm truncate">{spot.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-500 text-xs">{spot.province}</span>
                      {spot.district && <span className="text-slate-400 text-xs">· {spot.district}</span>}
                      <span className="px-1.5 py-0.5 bg-[#EBF3ED] text-[#2D5A3C] border border-[#4A7C59]/20 rounded text-[10px] font-semibold truncate">
                        {spot.categoryLabel || defaultSpotCategoryLabel(spot.category)}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2 sm:ml-auto sm:col-span-1 sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-3">
                      <AdminStatusChip status={spot.reviewRejectedAt ? 'rejected' : isDraft ? 'draft' : 'published'} />
                      <span
                        title={quality.requiredFailures ? `ขาดข้อบังคับ ${quality.requiredFailures} ข้อ` : 'ผ่านข้อบังคับครบ'}
                        className={`rounded-full border px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                          quality.requiredFailures ? 'border-rose-200 bg-rose-50 text-rose-700' : quality.score < 90 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {quality.score}%
                      </span>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold w-[84px] ${imageMeta.className}`}>
                        <ImageStatusIcon size={13} />
                        {imageMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => togglePublication(spot)}
                        disabled={rowBusy}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                          isDraft ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isDraft ? 'เผยแพร่' : 'ถอนเผยแพร่'}
                      </button>
                      <button onClick={() => setEditing(spot)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="แก้ไข">
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deleteSpot(spot)}
                        disabled={rowBusy}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50"
                        title="ลบ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <AdminPagination pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
        </div>
      )}

      {editing !== undefined && (
        <SpotEditorDrawer
          key={editing?.id ?? 'new'}
          spot={editing}
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            setEditing(undefined);
            showToast(message);
            setReloadToken((token) => token + 1);
          }}
        />
      )}
    </div>
  );
}
