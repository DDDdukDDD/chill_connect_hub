'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
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
  Sparkles,
  RefreshCw,
  CheckCheck,
  Building2,
  Repeat,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { AdminEventItem } from '@/lib/eventsStore';
import { stripHtmlToPlainText } from '@/components/RichTextEditor';

interface EventsModerationViewProps {
  type: 'community' | 'fairs' | 'all';
}

export function EventsModerationView({ type }: EventsModerationViewProps) {
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'recurring' | 'online' | 'physical'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        showToast(newStatus === 'approved' ? '✅ อนุมัติกิจกรรมเรียบร้อย!' : 'ย้ายไปสถานะที่เลือกแล้ว');
      }
    } catch (err) {
      showToast('❌ ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleApproveAll = async () => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all' }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        showToast('⚡ อนุมัติกิจกรรมทั้งหมดที่รอดำเนินการเรียบร้อยแล้ว!');
      }
    } catch (err) {
      showToast('❌ เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ยืนยันการลบกิจกรรม "${title}"?`)) return;
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        showToast('🗑️ ลบกิจกรรมออกจากระบบแล้ว');
      }
    } catch (err) {
      showToast('❌ ไม่สามารถลบกิจกรรมได้');
    }
  };

  // Safe online link verifier
  const verifyOnlineLink = (url?: string, platform?: string) => {
    if (!url) return { isSafe: true, label: 'ไม่มีลิงก์แนบ' };
    const lower = url.toLowerCase();
    const isKnown =
      lower.includes('zoom.us') ||
      lower.includes('meet.google.com') ||
      lower.includes('discord.gg') ||
      lower.includes('discord.com') ||
      lower.includes('teams.microsoft.com');
    if (isKnown) {
      return { isSafe: true, label: `🛡️ Verified ${platform || 'Meeting Link'}` };
    }
    return { isSafe: false, label: '⚠️ ลิงก์ภายนอก (ควรตรวจ Phishing)' };
  };

  // Filter events by type, status, format, and search
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Type matching
      if (type === 'community' && ev.eventType !== 'community') return false;
      if (type === 'fairs' && ev.eventType !== 'public_venue') return false;

      // Status matching
      if (statusFilter !== 'all' && ev.approvalStatus !== statusFilter) return false;

      // Format matching (recurring / online / physical)
      if (formatFilter === 'recurring') {
        const isRecurring = ev.scheduleType === 'recurring' || Boolean(ev.recurrence);
        if (!isRecurring) return false;
      } else if (formatFilter === 'online') {
        const isOnline = ev.locationType === 'online' || ev.province === 'ออนไลน์' || Boolean(ev.onlineJoinUrl);
        if (!isOnline) return false;
      } else if (formatFilter === 'physical') {
        const isOnline = ev.locationType === 'online' || ev.province === 'ออนไลน์' || Boolean(ev.onlineJoinUrl);
        if (isOnline) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = ev.title?.toLowerCase().includes(q);
        const matchesLoc = ev.location?.toLowerCase().includes(q);
        const matchesHost = ev.hostName?.toLowerCase().includes(q);
        const matchesTag = ev.tag?.toLowerCase().includes(q);
        return matchesTitle || matchesLoc || matchesHost || matchesTag;
      }
      return true;
    });
  }, [events, type, statusFilter, formatFilter, searchQuery]);

  const stats = useMemo(() => {
    const scope = events.filter((ev) => {
      if (type === 'community') return ev.eventType === 'community';
      if (type === 'fairs') return ev.eventType === 'public_venue';
      return true;
    });
    const pending = scope.filter((e) => e.approvalStatus === 'pending').length;
    const approved = scope.filter((e) => e.approvalStatus === 'approved').length;
    const rejected = scope.filter((e) => e.approvalStatus === 'rejected').length;
    const recurring = scope.filter((e) => e.scheduleType === 'recurring' || Boolean(e.recurrence)).length;
    const online = scope.filter((e) => e.locationType === 'online' || e.province === 'ออนไลน์' || Boolean(e.onlineJoinUrl)).length;

    return { total: scope.length, pending, approved, rejected, recurring, online };
  }, [events, type]);

  const isCommunity = type === 'community';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-in max-w-md">
          <div className="w-2 h-2 rounded-full bg-[#4A7C59] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isCommunity
                  ? 'bg-[#FDF0EB] text-[#F26430] border-[#F26430]/20'
                  : 'bg-sky-50 text-[#2B527A] border-sky-100'
              }`}
            >
              {isCommunity ? <Users size={16} /> : <Trophy size={16} />}
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              {isCommunity ? 'Community Meetups Moderation' : 'Major Fairs & Expos Moderation'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isCommunity
                  ? 'bg-[#FDF0EB] text-[#D95322] border-[#F26430]/20'
                  : 'bg-sky-50 text-[#2B527A] border-sky-200'
              }`}
            >
              {isCommunity ? 'ตี้เพื่อน & นัดซ้ำ & ออนไลน์' : 'งานมหกรรม & ศูนย์ประชุม'}
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            {isCommunity
              ? 'ตรวจสอบกิจกรรมคอมมูนิตี้ คัดกรองนัดซ้ำทุกสัปดาห์ (Recurring) และตรวจสอบความปลอดภัยของลิงก์ห้องประชุมออนไลน์'
              : 'จัดการนิทรรศการ งานแฟร์ และเอ็กซ์โปขนาดใหญ่ที่ดึงมาจาก Scraper และพาร์ทเนอร์จัดแสดง'}
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5">
          {stats.pending > 0 && (
            <button
              onClick={handleApproveAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4A7C59] hover:bg-[#3B6347] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <CheckCheck size={13} />
              อนุมัติทั้งหมดที่รอ ({stats.pending})
            </button>
          )}
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'กิจกรรมทั้งหมด', value: stats.total, style: 'bg-slate-50 border-slate-200 text-slate-800' },
          { label: 'รอตรวจสอบ (Pending)', value: stats.pending, style: 'bg-amber-50 border-amber-200 text-amber-800' },
          { label: 'อนุมัติแล้ว (Approved)', value: stats.approved, style: 'bg-[#EBF3ED] border-[#4A7C59]/20 text-[#2D5A3C]' },
          { label: '🔁 นัดประจำ (Recurring)', value: stats.recurring, style: 'bg-purple-50 border-purple-200 text-purple-800' },
          { label: '🌐 ออนไลน์ (Virtual)', value: stats.online, style: 'bg-sky-50 border-sky-200 text-[#2B527A]' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3.5 ${s.style}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs opacity-75 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อกิจกรรม, สถานที่, หรือผู้จัด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20"
          />
        </div>

        {/* Format Selector */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFormatFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              formatFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ทุกรูปแบบ
          </button>
          <button
            onClick={() => setFormatFilter('recurring')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              formatFilter === 'recurring' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔁 นัดประจำ ({stats.recurring})
          </button>
          <button
            onClick={() => setFormatFilter('online')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              formatFilter === 'online' ? 'bg-[#2B527A] text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🌐 ออนไลน์ ({stats.online})
          </button>
          <button
            onClick={() => setFormatFilter('physical')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              formatFilter === 'physical' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📍 สถานที่จริง
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {{
                all: 'ทุกสถานะ',
                pending: `รอตรวจ (${stats.pending})`,
                approved: 'อนุมัติแล้ว',
                rejected: 'ปฏิเสธ',
              }[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4A7C59]/30 border-t-[#4A7C59] rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-400 text-sm">ไม่พบกิจกรรมที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((ev) => {
            const isPending = ev.approvalStatus === 'pending';
            const isApproved = ev.approvalStatus === 'approved';
            const isRejected = ev.approvalStatus === 'rejected';
            const isRecurring = ev.scheduleType === 'recurring' || Boolean(ev.recurrence);
            const isOnline = ev.locationType === 'online' || ev.province === 'ออนไลน์' || Boolean(ev.onlineJoinUrl);
            const linkCheck = verifyOnlineLink(ev.onlineJoinUrl, ev.onlinePlatform);

            return (
              <div
                key={ev.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:border-[#4A7C59]/30 hover:shadow-sm transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Event Thumbnail & Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      {ev.image ? (
                        <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          {isCommunity ? <Users size={20} /> : <Building2 size={20} />}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isApproved
                              ? 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/20'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isApproved ? '● อนุมัติแล้ว' : isPending ? '⏳ รอตรวจสอบ' : '✕ ปฏิเสธ'}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                          {ev.tag || ev.category}
                        </span>

                        {/* Recurring badge */}
                        {isRecurring && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Repeat size={10} />
                            นัดซ้ำ: {ev.recurrence?.frequency === 'monthly' ? 'รายเดือน' : 'ทุกสัปดาห์'}
                          </span>
                        )}

                        {/* Virtual / Online badge */}
                        {isOnline && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#2B527A] border border-sky-200 flex items-center gap-1">
                            <Globe size={10} />
                            ออนไลน์: {ev.onlinePlatform || 'Virtual'}
                          </span>
                        )}

                        {/* Safe link verification badge */}
                        {isOnline && ev.onlineJoinUrl && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              linkCheck.isSafe
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {linkCheck.label}
                          </span>
                        )}

                        {ev.source && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            แหล่งที่มา: {ev.source}
                          </span>
                        )}
                      </div>

                      <h3 className="text-slate-800 font-bold text-sm leading-tight mb-1">{ev.title}</h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" /> {ev.location}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" /> {ev.date}
                        </span>
                        {ev.price && (
                          <>
                            <span>·</span>
                            <span className="text-[#4A7C59] font-medium">{ev.price}</span>
                          </>
                        )}
                        {isCommunity && ev.participantsCount !== undefined && (
                          <>
                            <span>·</span>
                            <span className="text-[#F26430] font-medium">
                              👥 {ev.participantsCount}/{ev.maxParticipants || 10} คน
                            </span>
                          </>
                        )}
                        {ev.hostName && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">โดย: {ev.hostName}</span>
                          </>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-slate-400 text-xs mt-1.5 line-clamp-1">
                          {stripHtmlToPlainText(ev.description)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-center sm:self-start">
                    {/* Public link */}
                    <Link
                      href={isCommunity ? `/community/${ev.id}` : `/fairs/${ev.id}`}
                      target="_blank"
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-[#4A7C59] hover:bg-slate-50 transition-colors"
                      title="ดูหน้าเว็บจริง"
                    >
                      <ExternalLink size={13} />
                    </Link>

                    {/* Status Toggle Buttons */}
                    {!isApproved && (
                      <button
                        onClick={() => handleUpdateStatus(ev.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#EBF3ED] hover:bg-[#4A7C59] text-[#2D5A3C] hover:text-white border border-[#4A7C59]/30 rounded-xl text-xs font-semibold transition-all"
                        title="อนุมัติขึ้นหน้าเว็บ"
                      >
                        <CheckCircle2 size={12} />
                        อนุมัติ
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        onClick={() => handleUpdateStatus(ev.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-xs font-semibold transition-all"
                        title="ปฏิเสธกิจกรรม"
                      >
                        <XCircle size={12} />
                        ปฏิเสธ
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(ev.id, ev.title)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                      title="ลบกิจกรรม"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
