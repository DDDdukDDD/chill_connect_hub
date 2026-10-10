'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, Flag, Heart, Loader2, MessageCircle, RefreshCw, Search, X } from 'lucide-react';
import { AdminDrawer, Field, FormSection, fieldInputClass } from './AdminDrawer';
import { AdminEmptyState, AdminPageHeader, AdminStatus, AdminStatusChip, adminButton } from './AdminUI';
import { AdminPagination, AdminPaginationState } from './AdminPagination';
import { useAdminSession } from './AdminAuthGate';
import { handleAdminUnauthorized } from './adminAuthUtils';

type Filter = 'all' | 'reported' | 'hidden' | 'published' | 'samples';

interface AdminMoment {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  authorStatus: 'active' | 'suspended' | 'banned' | 'deleted' | 'sample';
  caption: string;
  images: string[];
  location: string;
  targetType: string;
  targetTitle?: string;
  likesCount: number;
  comments: Array<{ id: string; authorName: string; text: string; hidden: boolean; timeAgo: string }>;
  reports: Array<{ reason: string; createdAt: string }>;
  status: 'published' | 'hidden';
  hiddenBy?: 'reports' | 'admin';
  moderationNote?: string;
  isSample: boolean;
  timeAgo: string;
}

interface Counts { published: number; hidden: number; reported: number; samples: number }

const FILTERS: Array<{ id: Filter; label: string; count?: keyof Counts }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'reported', label: 'ถูกรายงาน', count: 'reported' },
  { id: 'hidden', label: 'ซ่อนอยู่', count: 'hidden' },
  { id: 'published', label: 'แสดงอยู่', count: 'published' },
  { id: 'samples', label: 'ตัวอย่าง', count: 'samples' },
];

const TARGET_LABELS: Record<string, string> = { spot: 'พิกัดเที่ยว', community: 'คอมมูนิตี้', fair: 'งานแฟร์', challenge: 'ชาเลนจ์', general: 'ทั่วไป' };
const statusOf = (moment: AdminMoment): AdminStatus => (moment.status === 'hidden' ? 'rejected' : 'published');

function MomentDrawer({ moment, canModerate, onClose, onDone }: { moment: AdminMoment; canModerate: boolean; onClose: () => void; onDone: (message: string) => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (body: Record<string, unknown>, message: string, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/moments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: moment.id, ...body }) });
      if (handleAdminUnauthorized(res)) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || 'ทำรายการไม่สำเร็จ');
      onDone(message);
    } catch (actError) {
      setError(actError instanceof Error ? actError.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminDrawer
      title={`โมเมนต์ของ ${moment.authorName}`}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-2">
          <AdminStatusChip status={statusOf(moment)} />
          {moment.hiddenBy && <span>{moment.hiddenBy === 'reports' ? `ซ่อนอัตโนมัติจากการรายงาน` : `ซ่อนโดยแอดมิน${moment.moderationNote ? ` · ${moment.moderationNote}` : ''}`}</span>}
          {moment.isSample && <span>ข้อมูลตัวอย่าง</span>}
          <span className="text-slate-400">{moment.timeAgo}</span>
        </span>
      }
      onClose={onClose}
      footer={
        <>
          {error && <p role="alert" className="mr-auto text-xs font-semibold text-rose-600">{error}</p>}
          <button type="button" onClick={onClose} className={adminButton.secondary}>ปิด</button>
          {canModerate && (
            <>
              <button type="button" disabled={Boolean(busy)} onClick={() => { if (confirm('ลบโมเมนต์นี้ถาวร?')) act({ action: 'remove', note }, 'ลบโมเมนต์แล้ว', 'remove'); }} className={adminButton.danger}>ลบถาวร</button>
              {moment.reports.length > 0 && moment.status === 'published' && (
                <button type="button" disabled={Boolean(busy)} onClick={() => act({ action: 'dismiss_reports' }, 'ยกรายงานแล้ว', 'dismiss')} className={adminButton.secondary}>ยกรายงาน</button>
              )}
              {moment.status === 'hidden' ? (
                <button type="button" disabled={Boolean(busy)} onClick={() => act({ action: 'restore' }, 'คืนการแสดงโมเมนต์แล้ว', 'restore')} className={adminButton.primary}>
                  {busy === 'restore' && <Loader2 size={14} className="animate-spin" />} คืนการแสดง
                </button>
              ) : (
                <button type="button" disabled={Boolean(busy) || !note.trim()} onClick={() => act({ action: 'hide', note }, 'ซ่อนโมเมนต์แล้ว', 'hide')} className={adminButton.dark} title={!note.trim() ? 'ใส่เหตุผลก่อน' : undefined}>
                  {busy === 'hide' && <Loader2 size={14} className="animate-spin" />} ซ่อน
                </button>
              )}
            </>
          )}
        </>
      }
    >
      <FormSection title="เนื้อหา">
        <div className="sm:col-span-2 space-y-3">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {moment.images.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src + index} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-800">{moment.caption}</p>
          <p className="text-xs text-slate-500">
            {moment.location} · {TARGET_LABELS[moment.targetType] ?? moment.targetType}{moment.targetTitle ? `: ${moment.targetTitle}` : ''} · ถูกใจ {moment.likesCount}
          </p>
          <p className="text-xs text-slate-500">
            ผู้โพสต์: {moment.authorName}
            {moment.authorStatus === 'banned' && <span className="ml-1 font-semibold text-rose-600">(ถูกแบน · ไม่แสดงต่อสาธารณะ)</span>}
            {moment.authorStatus === 'suspended' && <span className="ml-1 font-semibold text-amber-600">(ถูกระงับชั่วคราว)</span>}
          </p>
        </div>
      </FormSection>

      {moment.reports.length > 0 && (
        <FormSection title={`การรายงาน (${moment.reports.length})`} hint="รายงานครบ 3 คน ระบบซ่อนอัตโนมัติ">
          <ul className="sm:col-span-2 space-y-1 text-xs text-slate-700">
            {moment.reports.map((report, index) => (
              <li key={index} className="flex items-center gap-2">
                <Flag size={12} className="shrink-0 text-rose-500" /> {report.reason}
                <span className="text-slate-400">· {new Date(report.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </li>
            ))}
          </ul>
        </FormSection>
      )}

      <FormSection title={`ความคิดเห็น (${moment.comments.length})`}>
        {moment.comments.length === 0 ? (
          <p className="sm:col-span-2 text-xs text-slate-500">ยังไม่มีความคิดเห็น</p>
        ) : (
          <ul className="sm:col-span-2 divide-y divide-slate-100">
            {moment.comments.map((comment) => (
              <li key={comment.id} className={`flex items-start gap-2 py-2 text-xs ${comment.hidden ? 'opacity-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-800">{comment.authorName}</span> <span className="text-slate-400">· {comment.timeAgo}</span>
                  <p className="text-slate-700">{comment.text}</p>
                </div>
                {canModerate && (
                  <div className="flex shrink-0 gap-1">
                    <button type="button" disabled={Boolean(busy)} onClick={() => act({ action: comment.hidden ? 'show_comment' : 'hide_comment', commentId: comment.id }, comment.hidden ? 'แสดงความคิดเห็นแล้ว' : 'ซ่อนความคิดเห็นแล้ว', `c:${comment.id}`)} className={adminButton.secondarySm}>
                      {comment.hidden ? 'แสดง' : 'ซ่อน'}
                    </button>
                    <button type="button" disabled={Boolean(busy)} onClick={() => act({ action: 'delete_comment', commentId: comment.id }, 'ลบความคิดเห็นแล้ว', `d:${comment.id}`)} className={adminButton.dangerSm}>ลบ</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      {canModerate && moment.status === 'published' && (
        <FormSection title="ซ่อนโมเมนต์">
          <Field label="เหตุผล (บังคับเมื่อซ่อน):" htmlFor="moment-note" wide>
            <textarea id="moment-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={fieldInputClass} />
          </Field>
        </FormSection>
      )}
    </AdminDrawer>
  );
}

export function MomentsManagerView() {
  const { can } = useAdminSession();
  const canModerate = can('community.review');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [moments, setMoments] = useState<AdminMoment[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [pagination, setPagination] = useState<AdminPaginationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminMoment | null>(null);
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
    const params = new URLSearchParams({ filter, page: String(page), limit: '24' });
    if (debouncedQuery) params.set('q', debouncedQuery);
    fetch(`/api/admin/moments?${params}`, { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || 'โหลดโมเมนต์ไม่สำเร็จ');
        if (!active) return;
        setMoments(json.moments);
        setCounts(json.counts);
        setPagination(json.pagination);
        setError(null);
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดโมเมนต์ไม่สำเร็จ'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filter, page, debouncedQuery, reloadToken]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Camera}
        title="โมเมนต์"
        description="โพสต์รูปจากสมาชิก โพสต์ขึ้นทันที ถูกรายงานครบ 3 คนจะซ่อนอัตโนมัติและรอตรวจที่นี่"
        actions={
          <button type="button" onClick={() => refetch(() => setReloadToken((t) => t + 1))} disabled={isLoading} className={adminButton.secondary}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> รีเฟรช
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => refetch(() => { setFilter(f.id); setPage(1); })}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f.label}
            {f.count && counts && (
              <span className={`ml-1 tabular-nums ${f.id === 'reported' && counts.reported > 0 && filter !== f.id ? 'rounded-full bg-amber-500 px-1.5 text-white' : 'opacity-70'}`}>{counts[f.count]}</span>
            )}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => { const value = e.target.value; refetch(() => { setQuery(value); setPage(1); }); }}
            placeholder="ค้นหาคำบรรยาย ผู้โพสต์ หรือสถานที่"
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

      {!isLoading && moments.length === 0 ? (
        <AdminEmptyState>{filter === 'reported' ? 'ไม่มีโมเมนต์ที่ถูกรายงาน' : 'ไม่พบโมเมนต์ที่ตรงกับตัวกรอง'}</AdminEmptyState>
      ) : (
        <>
          <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${isLoading ? 'opacity-60' : ''}`}>
            {isLoading && moments.length === 0
              ? [1, 2, 3, 4, 5, 6, 7, 8].map((n) => <div key={n} className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-100" />)
              : moments.map((moment) => (
                <button key={moment.id} type="button" onClick={() => setSelected(moment)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xs hover:border-slate-300">
                  <div className="relative aspect-square bg-slate-100">
                    {moment.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={moment.images[0]} alt="" className={`h-full w-full object-cover ${moment.status === 'hidden' ? 'opacity-40 grayscale' : ''}`} />
                    )}
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      <AdminStatusChip status={statusOf(moment)} />
                      {moment.reports.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white"><Flag size={10} />{moment.reports.length}</span>
                      )}
                    </div>
                    {moment.images.length > 1 && <span className="absolute right-2 top-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">{moment.images.length} รูป</span>}
                  </div>
                  <div className="space-y-1 p-2.5">
                    <p className="line-clamp-2 h-10 overflow-hidden text-xs font-semibold leading-5 text-slate-800">{moment.caption}</p>
                    <p className="truncate text-[11px] text-slate-500">{moment.authorName} · {moment.timeAgo}</p>
                    <p className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-0.5"><Heart size={11} /> {moment.likesCount}</span>
                      <span className="inline-flex items-center gap-0.5"><MessageCircle size={11} /> {moment.comments.length}</span>
                      {moment.isSample && <span className="text-slate-400">ตัวอย่าง</span>}
                    </p>
                  </div>
                </button>
              ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <AdminPagination pagination={pagination} onPageChange={(next) => refetch(() => setPage(next))} isLoading={isLoading} />
          )}
        </>
      )}

      {selected && (
        <MomentDrawer
          key={selected.id}
          moment={selected}
          canModerate={canModerate}
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
