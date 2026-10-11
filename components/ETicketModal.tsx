'use client';

import React, { useEffect, useState } from 'react';
import { EventItem } from '@/data/mockData';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Share2,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Zap,
  Trash2,
  QrCode,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ETicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  ticketId: string;
  isCheckedIn: boolean;
  onCheckIn: (ticketId: string) => void;
  onOpenChat?: (event: EventItem) => void;
  onOpenCancel?: (event: EventItem, ticketId: string) => void;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({
  isOpen,
  onClose,
  event,
  ticketId,
  isCheckedIn,
  onCheckIn,
  onOpenChat,
  onOpenCancel,
}) => {
  const [copied, setCopied] = useState(false);
  // The ticket is read from the account each time it opens (the ticketId prop is only a placeholder while loading)
  const [ticket, setTicket] = useState<{ code: string; checkedInAt?: string; isHost: boolean; hasHostCheckIn: boolean } | null>(null);
  const [ticketState, setTicketState] = useState<'loading' | 'ready' | 'none'>('loading');
  const eventId = event?.id;
  useEffect(() => {
    if (!isOpen || !eventId) return;
    let active = true;
    setTicketState('loading');
    fetch(`/api/events/${encodeURIComponent(eventId)}/ticket`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        setTicket(json.ticket ?? null);
        setTicketState(json.ticket ? 'ready' : 'none');
      })
      .catch(() => active && setTicketState('none'));
    return () => {
      active = false;
    };
  }, [isOpen, eventId]);
  const shownCode = ticket?.code || (ticketState === 'loading' ? '······' : '—');

  if (!isOpen || !event) return null;

  const handleCopyTicket = () => {
    navigator.clipboard?.writeText(ticket?.code || ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100003] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 animate-scale-up text-[#1E293B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
              DIGITAL E-TICKET • VERIFIED PASS
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              ตั๋วเข้าร่วมกิจกรรมคอมมูนิตี้
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {isCheckedIn ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>เช็คอินเข้างานแล้ว</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>ยืนยันสิทธิ์แล้ว</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              aria-label="ปิดหน้าต่างตั๋ว"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Perforated Circular Notches for Vertical Divider */}
        <div className="hidden sm:block absolute left-[58.333%] top-[57px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950/70 border border-slate-300/80 shadow-inner z-20 pointer-events-none" />
        <div className="hidden sm:block absolute left-[58.333%] bottom-0 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-slate-950/70 border border-slate-300/80 shadow-inner z-20 pointer-events-none" />

        {/* 2-Column Boarding Pass Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-stretch relative">
          
          {/* Left Column: Event & Attendee Details (7 Cols) */}
          <div className="sm:col-span-7 p-6 sm:p-7 space-y-4 border-b sm:border-b-0 sm:border-r border-dashed border-slate-300 flex flex-col justify-between relative">
            {/* Mobile Perforated Notches on Horizontal Divider */}
            <div className="sm:hidden absolute -left-3.5 -bottom-3 w-6 h-6 rounded-full bg-slate-950/70 border border-slate-300/80 shadow-inner z-20 pointer-events-none" />
            <div className="sm:hidden absolute -right-3.5 -bottom-3 w-6 h-6 rounded-full bg-slate-950/70 border border-slate-300/80 shadow-inner z-20 pointer-events-none" />
            <div className="space-y-3">
              {/* Category & Title */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#F26430] uppercase tracking-wider">
                    #{event.tag || 'คอมมูนิตี้'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-slate-500">
                    โฮสต์: {event.hostName}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {event.title}
                </h3>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">วันที่จัดกิจกรรม</span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{event.date}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">ช่วงเวลา</span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{event.time}</p>
                </div>
              </div>

              {/* Location & Meeting Point */}
              <div className="space-y-1 text-xs">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">จุดนัดพบ & สถานที่</span>
                <p className="font-bold text-slate-900 leading-relaxed text-xs sm:text-sm">
                  {event.location}
                </p>
                {event.meetingPoint && (
                  <p className="text-xs text-[#D04A1B] font-bold bg-orange-50 px-3 py-1 rounded-xl border border-orange-200 inline-block">
                    จุดนัดพบเจาะจง: {event.meetingPoint}
                  </p>
                )}
              </div>
            </div>

            {/* Attendee Info & Ticket ID Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">รหัสบัตร</p>
                <p className="font-mono font-black text-slate-900 text-xs sm:text-sm tracking-widest">{shownCode}</p>
              </div>

              <button
                type="button"
                onClick={handleCopyTicket}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
              >
                {copied ? 'คัดลอกรหัสแล้ว!' : 'คัดลอกรหัส'}
              </button>
            </div>
          </div>

          {/* Right Column: QR Code & Verification Actions (5 Cols) */}
          <div className="sm:col-span-5 p-6 sm:p-7 bg-slate-50/60 flex flex-col items-center justify-between text-center space-y-4">
            
            {/* The code the host types at the meeting point */}
            <div className="space-y-2 w-full">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-500">รหัสบัตรของคุณ</p>
                <p className="mt-1 font-mono text-3xl font-black tracking-[0.2em] text-slate-900" aria-live="polite">{shownCode}</p>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {ticketState === 'none'
                  ? 'ไม่พบบัตรของคุณสำหรับกิจกรรมนี้ ลองเข้าร่วมกิจกรรมอีกครั้ง'
                  : ticket?.isHost
                  ? 'คุณเป็นคนจัดกิจกรรมนี้ เช็กอินผู้เข้าร่วมได้ที่มายฮับ'
                  : ticket && !ticket.hasHostCheckIn
                  ? 'งานนี้ไม่ต้องเช็กอิน เก็บรหัสไว้เป็นหลักฐานการลงทะเบียน'
                  : 'บอกรหัสนี้กับคนจัดที่จุดนัดพบ เพื่อเช็กอิน'}
              </p>
            </div>

            <div className="w-full space-y-2">
              {ticket?.checkedInAt && (
                <p className="w-full bg-emerald-50 text-emerald-800 font-bold text-xs py-2.5 px-3 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>เช็กอินแล้ว</span>
                </p>
              )}

              {/* Navigation & Chat Action Buttons */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>แผนที่</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenChat) onOpenChat(event);
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3 h-3 text-slate-500" />
                  <span>แชตกลุ่ม</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

