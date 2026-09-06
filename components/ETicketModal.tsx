'use client';

import React, { useState } from 'react';
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

  if (!isOpen || !event) return null;

  const handleCopyTicket = () => {
    navigator.clipboard?.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100003] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up text-[#1E293B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider bg-[#EBF3ED] text-[#2D5A3C] px-3 py-1 rounded-full border border-[#C5DCCB]">
              Digital E-Ticket
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
              <span className="inline-flex items-center gap-1 bg-[#EBF3ED] text-[#2D5A3C] border border-[#A3CEB0] text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A3C]" />
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

        {/* 2-Column Boarding Pass Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-stretch">
          
          {/* Left Column: Event & Attendee Details (7 Cols) */}
          <div className="sm:col-span-7 p-6 sm:p-7 space-y-4 border-b sm:border-b-0 sm:border-r border-dashed border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Category & Title */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#4A7C59] uppercase tracking-wider">
                    #{event.tag || 'คอมมูนิตี้'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10.5px] font-medium text-slate-500">
                    โฮสต์: {event.hostName}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2">
                  {event.title}
                </h3>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block">วันที่จัดกิจกรรม</span>
                  <p className="font-bold text-slate-800 text-xs truncate">{event.date}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block">ช่วงเวลา</span>
                  <p className="font-bold text-slate-800 text-xs truncate">{event.time}</p>
                </div>
              </div>

              {/* Location & Meeting Point */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 block">จุดนัดพบ & สถานที่</span>
                <p className="font-bold text-slate-800 leading-relaxed text-xs">
                  {event.location}
                </p>
                {event.meetingPoint && (
                  <p className="text-[11px] text-[#2D5A3C] font-semibold bg-[#EBF3ED] px-2.5 py-1 rounded-xl border border-[#C5DCCB] inline-block">
                    จุดนัดพบเจาะจง: {event.meetingPoint}
                  </p>
                )}
              </div>
            </div>

            {/* Attendee Info & Ticket ID Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-medium">รหัสตั๋ว E-Ticket</p>
                <p className="font-mono font-bold text-slate-800 text-xs">{ticketId}</p>
              </div>

              <button
                type="button"
                onClick={handleCopyTicket}
                className="text-[11px] font-bold text-[#4A7C59] hover:underline cursor-pointer"
              >
                {copied ? 'คัดลอกรหัสแล้ว!' : 'คัดลอกรหัส'}
              </button>
            </div>
          </div>

          {/* Right Column: QR Code & Verification Actions (5 Cols) */}
          <div className="sm:col-span-5 p-6 sm:p-7 bg-slate-50/60 flex flex-col items-center justify-between text-center space-y-4">
            
            {/* QR Code Container */}
            <div className="space-y-2">
              <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <svg
                  className="w-28 h-28 mx-auto"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="26" height="26" fill="#1E293B" rx="3" />
                  <rect x="14" y="14" width="18" height="18" fill="white" rx="2" />
                  <rect x="18" y="18" width="10" height="10" fill="#4A7C59" rx="1" />
                  <rect x="64" y="10" width="26" height="26" fill="#1E293B" rx="3" />
                  <rect x="68" y="14" width="18" height="18" fill="white" rx="2" />
                  <rect x="72" y="18" width="10" height="10" fill="#4A7C59" rx="1" />
                  <rect x="10" y="64" width="26" height="26" fill="#1E293B" rx="3" />
                  <rect x="14" y="68" width="18" height="18" fill="white" rx="2" />
                  <rect x="18" y="72" width="10" height="10" fill="#4A7C59" rx="1" />
                  <rect x="42" y="12" width="6" height="6" fill="#1E293B" />
                  <rect x="52" y="18" width="6" height="6" fill="#1E293B" />
                  <rect x="42" y="28" width="6" height="6" fill="#1E293B" />
                  <rect x="12" y="42" width="6" height="6" fill="#1E293B" />
                  <rect x="22" y="52" width="6" height="6" fill="#1E293B" />
                  <rect x="42" y="42" width="16" height="16" fill="#4A7C59" rx="3" />
                  <circle cx="50" cy="50" r="3" fill="white" />
                  <rect x="64" y="42" width="6" height="6" fill="#1E293B" />
                  <rect x="74" y="52" width="6" height="6" fill="#1E293B" />
                  <rect x="42" y="68" width="6" height="6" fill="#1E293B" />
                  <rect x="52" y="78" width="6" height="6" fill="#1E293B" />
                  <rect x="64" y="68" width="8" height="8" fill="#1E293B" />
                  <rect x="78" y="78" width="10" height="10" fill="#1E293B" />
                </svg>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                ยื่น QR Code นี้ให้โฮสต์สแกน ณ จุดนัดพบ
              </p>
            </div>

            {/* Check-in Simulator Button */}
            <div className="w-full space-y-2">
              {!isCheckedIn ? (
                <button
                  onClick={() => onCheckIn(ticketId)}
                  className="w-full bg-[#4A7C59] hover:bg-[#3B6447] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>จำลองเช็คอินหน้างาน (+50 XP)</span>
                </button>
              ) : (
                <div className="w-full bg-emerald-50 text-emerald-800 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เช็คอินเข้ากิจกรรมแล้ว</span>
                </div>
              )}

              {/* Navigation & Chat Action Buttons */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-[#4A7C59]" />
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
                  <MessageCircle className="w-3 h-3 text-[#4A7C59]" />
                  <span>แชตกลุ่ม</span>
                </button>
              </div>

              {/* Cancel Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenCancel) onOpenCancel(event, ticketId);
                  }}
                  className="text-[11px] text-rose-500 hover:text-rose-700 hover:underline font-semibold transition-colors cursor-pointer"
                >
                  ยกเลิกการเข้าร่วมกิจกรรมนี้
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

