'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  Trophy,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  RefreshCw,
  CheckCheck,
  Building2,
  Repeat,
  Globe,
  Undo2,
  EyeOff,
} from 'lucide-react';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { AdminPagination, AdminPaginationState } from './AdminPagination';
import { AdminEventItem } from '@/lib/eventsStore';
import { stripHtmlToPlainText } from '@/components/RichTextEditor';

interface EventsModerationViewProps {
  type: 'community' | 'fairs' | 'all';
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type FormatFilter = 'all' | 'recurring' | 'online' | 'physical';
type ApprovalStatus = 'approved' | 'rejected' | 'pending';

interface ModerationCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recurring: number;
  online: number;
}

const PAGE_SIZE = 20;
const EMPTY_COUNTS: ModerationCounts = { total: 0, pending: 0, approved: 0, rejected: 0, recurring: 0, online: 0 };

const STATUS_META: Record<ApprovalStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'รอตรวจสอบ', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'อนุมัติแล้ว', className: 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/20', icon: CheckCircle2 },
  rejected: { label: 'ปฏิเสธ', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

function isOnline(ev: AdminEventItem) {
  return ev.locationType === 'online' || ev.province === 'ออนไลน์' || Boolean(ev.onlineJoinUrl);
}

function isRecurring(ev: AdminEventItem) {
  return ev.scheduleType === 'recurring' || Boolean(ev.recurrence);
}

// Online meeting links outside well-known platforms deserve a phishing check
function verifyOnlineLink(url?: string, platform?: string) {
  if (!url) return { isSafe: true, label: 'ไม่มีลิงก์แนบ' };
  const lower = url.toLowerCase();
  const isKnown = ['zoom.us', 'meet.google.com', 'discord.gg', 'discord.com', 'teams.microsoft.com'].some((host) => lower.includes(host));
  return isKnown
    ? { isSafe: true, label: `ลิงก์ ${platform || 'ห้องประชุม'} ที่รู้จัก` }
    : { isSafe: false, label: 'ลิงก์ภายนอก ควรตรวจก่อนอนุมัติ' };
}

export function EventsModerationView({ type }: EventsModerationViewProps) {
  const apiType = type === 'fairs' ? 'public_venue' : type;
  const isCommunity = type === 'community';

  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [counts, setCounts] = useState<ModerationCounts>(EMPTY_COUNTS);
  const [pagination, setPagination] = useState<AdminPaginationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // Opens on the review queue; switches to "all" after the first load if nothing is pending
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [page, setPage] = useState(1);
  const hasAutoSelectedStatus = useRef(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Debounce search typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadEvents = useCallback(async () => {
    const params = new URLSearchParams({
      type: apiType,
      status: statusFilter,
      format: formatFilter,
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (searchQuery) params.set('q', searchQuery);

    const res = await fetch(`/api/admin/events?${params}`, { cache: 'no-store' });
    if (handleAdminUnauthorized(res)) return null;
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || data.message || 'โหลดรายการกิจกรรมไม่สำเร็จ');
    return data as { events: AdminEventItem[]; counts: ModerationCounts; pagination: AdminPaginationState };
  }, [apiType, statusFilter, formatFilter, page, searchQuery]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    let refetchPending = false;
    try {
      const data = await loadEvents();
      if (!data) return;
      if (!hasAutoSelectedStatus.current) {
        hasAutoSelectedStatus.current = true;
        if (statusFilter === 'pending' && data.counts.pending === 0) {
          setStatusFilter('all');
          refetchPending = true;
          return;
        }
      }
      // A mutation can empty the last page; step back instead of showing a blank page
      if (data.events.length === 0 && data.pagination.page > 1) {
        setPage(data.pagination.totalPages);
        refetchPending = true;
        return;
      }
      setEvents(data.events);
      setCounts(data.counts);
      setPagination(data.pagination);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'โหลดรายการกิจกรรมไม่สำเร็จ');
    } finally {
      // Keep the spinner when a follow-up fetch is about to run
      if (!refetchPending) setIsLoading(false);
    }
  }, [loadEvents, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    // Run after paint so state updates happen asynchronously
    const timer = setTimeout(() => {
      if (!cancelled) refresh();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  const runAction = async (id: string | null, body: Record<string, unknown>, successMessage: string) => {
    setBusyId(id ?? '__all__');
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (handleAdminUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'ดำเนินการไม่สำเร็จ');
      showToast(successMessage);
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = (ev: AdminEventItem, status: ApprovalStatus) => {
    const messages: Record<ApprovalStatus, string> = {
      approved: `อนุมัติ "${ev.title}" แล้ว`,
      rejected: `ปฏิเสธ "${ev.title}" แล้ว`,
      pending: `ย้าย "${ev.title}" กลับไปรอตรวจแล้ว`,
    };
    return runAction(ev.id, { action: 'update_status', id: ev.id, status }, messages[status]);
  };

  const deleteEvent = (ev: AdminEventItem) => {
    if (!confirm(`ยืนยันการลบกิจกรรม "${ev.title}"? การลบไม่สามารถย้อนกลับได้`)) return;
    return runAction(ev.id, { action: 'delete', id: ev.id }, `ลบ "${ev.title}" แล้ว`);
  };

  const changeStatusFilter = (status: StatusFilter) => {
    hasAutoSelectedStatus.current = true;
    setStatusFilter(status);
    setPage(1);
  };

  const changeFormatFilter = (format: FormatFilter) => {
    setFormatFilter(format);
    setPage(1);
  };

  const segmentClass = (active: boolean) =>
    `px-3 py-1 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-md">
          <div className="w-2 h-2 rounded-full bg-[#4A7C59] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isCommunity ? 'bg-[#FDF0EB] text-[#F26430] border-[#F26430]/20' : 'bg-sky-50 text-[#2B527A] border-sky-100'
              }`}
            >
              {isCommunity ? <Users size={16} /> : <Trophy size={16} />}
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              {isCommunity ? 'Community Meetups Moderation' : 'Major Fairs & Expos Moderation'}
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            {isCommunity
              ? 'ตรวจกิจกรรมคอมมูนิตี้ นัดประจำ และความปลอดภัยของลิงก์ห้องประชุมออนไลน์'
              : 'ตรวจงานแฟร์ นิทรรศการ และเอ็กซ์โปที่มาจาก Scraper หรือผู้ใช้ส่งเข้ามา'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {counts.pending > 0 && (
            <button
              onClick={() => runAction(null, { action: 'approve_all' }, `อนุมัติรายการที่รอทั้งหมดแล้ว`)}
              disabled={busyId !== null}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4A7C59] hover:bg-[#3B6347] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-60"
              title="อนุมัติทุกรายการที่รอตรวจในทุก pillar"
            >
              <CheckCheck size={13} />
              อนุมัติทั้งหมดที่รอ
            </button>
          )}
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Status summary (click to filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { status: 'all', label: 'ทั้งหมด', value: counts.total, style: 'bg-slate-50 border-slate-200 text-slate-800' },
          { status: 'pending', label: 'รอตรวจสอบ', value: counts.pending, style: 'bg-amber-50 border-amber-200 text-amber-800' },
          { status: 'approved', label: 'อนุมัติแล้ว', value: counts.approved, style: 'bg-[#EBF3ED] border-[#4A7C59]/20 text-[#2D5A3C]' },
          { status: 'rejected', label: 'ปฏิเสธ', value: counts.rejected, style: 'bg-rose-50 border-rose-200 text-rose-800' },
        ] as const).map((s) => (
          <button
            key={s.status}
            type="button"
            onClick={() => changeStatusFilter(s.status)}
            className={`text-left border rounded-xl p-3.5 transition-all ${s.style} ${
              statusFilter === s.status ? 'ring-2 ring-offset-1 ring-slate-400/40' : 'hover:brightness-[0.98]'
            }`}
          >
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs opacity-75 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อกิจกรรม, สถานที่, หรือผู้จัด..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl" role="group" aria-label="กรองรูปแบบกิจกรรม">
          <button onClick={() => changeFormatFilter('all')} className={segmentClass(formatFilter === 'all')}>ทุกรูปแบบ</button>
          <button onClick={() => changeFormatFilter('recurring')} className={segmentClass(formatFilter === 'recurring')}>นัดประจำ ({counts.recurring})</button>
          <button onClick={() => changeFormatFilter('online')} className={segmentClass(formatFilter === 'online')}>ออนไลน์ ({counts.online})</button>
          <button onClick={() => changeFormatFilter('physical')} className={segmentClass(formatFilter === 'physical')}>สถานที่จริง</button>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl" role="group" aria-label="กรองสถานะการตรวจ">
          {(['pending', 'all', 'approved', 'rejected'] as const).map((st) => (
            <button key={st} onClick={() => changeStatusFilter(st)} className={segmentClass(statusFilter === st)}>
              {{ all: 'ทุกสถานะ', pending: `รอตรวจ (${counts.pending})`, approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }[st]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loadError ? (
        <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <p className="text-xs sm:text-sm font-bold text-rose-700">{loadError}</p>
          <button onClick={refresh} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold">ลองอีกครั้ง</button>
        </div>
      ) : isLoading && events.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4A7C59]/30 border-t-[#4A7C59] rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-between gap-3 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200">
          <p className="text-slate-500 text-sm">
            {statusFilter === 'pending' ? 'ไม่มีรายการรอตรวจ' : 'ไม่พบกิจกรรมที่ตรงกับเงื่อนไข'}
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              changeFormatFilter('all');
              changeStatusFilter('all');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            ดูทั้งหมด
          </button>
        </div>
      ) : (
        <div className={`space-y-3 ${isLoading ? 'opacity-60' : ''}`}>
          {events.map((ev) => {
            const status = (STATUS_META[ev.approvalStatus as ApprovalStatus] ? ev.approvalStatus : 'pending') as ApprovalStatus;
            const meta = STATUS_META[status];
            const StatusIcon = meta.icon;
            const online = isOnline(ev);
            const recurring = isRecurring(ev);
            const linkCheck = verifyOnlineLink(ev.onlineJoinUrl, ev.onlinePlatform);
            const isBusy = busyId === ev.id || busyId === '__all__';

            return (
              <div
                key={ev.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
                  status === 'pending' ? 'border-amber-200' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      {ev.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          {isCommunity ? <Users size={20} /> : <Building2 size={20} />}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.className}`}>
                          <StatusIcon size={10} />
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                          {ev.tag || ev.category}
                        </span>
                        {recurring && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Repeat size={10} />
                            {ev.recurrence?.frequency === 'monthly' ? 'รายเดือน' : 'ทุกสัปดาห์'}
                          </span>
                        )}
                        {online && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#2B527A] border border-sky-200 flex items-center gap-1">
                            <Globe size={10} />
                            ออนไลน์{ev.onlinePlatform ? `: ${ev.onlinePlatform}` : ''}
                          </span>
                        )}
                        {online && ev.onlineJoinUrl && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              linkCheck.isSafe ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {linkCheck.label}
                          </span>
                        )}
                        {ev.source && <span className="text-[10px] text-slate-400 font-medium">แหล่งที่มา: {ev.source}</span>}
                      </div>

                      <h3 className="text-slate-800 font-bold text-sm leading-tight mb-1">{ev.title}</h3>

                      <div className="flex items-center gap-x-3 gap-y-1 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" /> {ev.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" /> {ev.date}
                        </span>
                        {ev.price && <span className="text-[#4A7C59] font-medium">{ev.price}</span>}
                        {isCommunity && ev.participantsCount !== undefined && (
                          <span className="text-[#D04A1B] font-medium">
                            {ev.participantsCount}/{ev.maxParticipants || 10} คน
                          </span>
                        )}
                        {ev.hostName && <span className="text-slate-400">โดย: {ev.hostName}</span>}
                      </div>

                      {ev.description && (
                        <p className="text-slate-400 text-xs mt-1.5 line-clamp-1">{stripHtmlToPlainText(ev.description)}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions depend on the moderation state */}
                  <div className="flex items-center gap-2 shrink-0 self-center sm:self-start">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(ev, 'approved')}
                          disabled={isBusy}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#4A7C59] hover:bg-[#3B6347] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                        >
                          <CheckCircle2 size={12} />
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => updateStatus(ev, 'rejected')}
                          disabled={isBusy}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                        >
                          <XCircle size={12} />
                          ปฏิเสธ
                        </button>
                      </>
                    )}
                    {status === 'approved' && (
                      <button
                        onClick={() => updateStatus(ev, 'pending')}
                        disabled={isBusy}
                        title="ซ่อนจากหน้าเว็บและย้ายกลับไปรอตรวจ"
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                      >
                        <EyeOff size={12} />
                        ถอนการเผยแพร่
                      </button>
                    )}
                    {status === 'rejected' && (
                      <button
                        onClick={() => updateStatus(ev, 'pending')}
                        disabled={isBusy}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                      >
                        <Undo2 size={12} />
                        กลับไปรอตรวจ
                      </button>
                    )}

                    <Link
                      href={isCommunity ? `/community/${ev.id}` : `/fairs/${ev.id}`}
                      target="_blank"
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                      title="ดูหน้าเว็บจริง"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <button
                      onClick={() => deleteEvent(ev)}
                      disabled={isBusy}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-60"
                      title="ลบกิจกรรม"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <AdminPagination pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}
