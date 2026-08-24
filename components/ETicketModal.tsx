'use client';

import React, { useState } from 'react';
import { EventItem } from '@/data/mockData';
import {
  X,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Share2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Ticket,
  User,
  ShieldCheck,
  Zap,
  Trash2,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Card (Event Image & Title) */}
        <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Event Header Info */}
          <div className="absolute bottom-3 left-4 right-12 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold bg-[#4A7C59] text-white px-2 py-0.5 rounded-full">
                #{event.tag}
              </span>
              <span className="text-[10px] font-bold text-slate-300">
                {event.eventType === 'public_venue' ? '🏛️ อีเวนต์ & งานแฟร์' : '🌿 Chill & Connect Community'}
              </span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base line-clamp-1 text-white">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Ticket Body (Boarding Pass / Concert Ticket Style) */}
        <div className="p-5 space-y-4">
          
          {/* Status Badge & Ticket ID */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">รหัสตั๋วอิเล็กทรอนิกส์</p>
              <p className="text-xs font-mono font-black text-slate-800 tracking-wider">
                {ticketId}
              </p>
            </div>

            {isCheckedIn ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>เช็คอินเข้างานแล้ว</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold px-3 py-1 rounded-full shadow-xs animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>พร้อมใช้งาน / เข้างานได้</span>
              </span>
            )}
          </div>

          {/* Key Event Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D8] text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#4A7C59]" />
                <span>วันและเวลา</span>
              </span>
              <p className="font-extrabold text-slate-800 text-[11px]">
                {event.date}
              </p>
              <p className="text-[10px] text-slate-600 font-medium">{event.time}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#F26430]" />
                <span>สถานที่จัดงาน</span>
              </span>
              <p className="font-extrabold text-slate-800 text-[11px] line-clamp-1">
                {event.location}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">กรุงเทพมหานคร</p>
            </div>
          </div>

          {/* Attendee Info */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-extrabold text-xs">
                👤
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">สมาชิก Chill & Connect Hub</p>
                <p className="text-[10px] text-slate-400">Pass Type: Regular Entry Pass</p>
              </div>
            </div>

            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {event.price || 'ฟรี!'}
            </span>
          </div>

          {/* Ticket Perforated Divider (รอยปรุตั๋ว) */}
          <div className="relative my-2">
            <div className="border-b-2 border-dashed border-slate-300 w-full" />
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-4 h-4 bg-black/70 rounded-full" />
            <div className="absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 bg-black/70 rounded-full" />
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="inline-block p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
              {/* Dynamic Simulated QR Code Visual */}
              <svg
                className="w-32 h-32 mx-auto"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Outer Framing */}
                <rect width="100" height="100" fill="white" />
                {/* Top-Left Finder */}
                <rect x="10" y="10" width="26" height="26" fill="#1E293B" rx="3" />
                <rect x="14" y="14" width="18" height="18" fill="white" rx="2" />
                <rect x="18" y="18" width="10" height="10" fill="#4A7C59" rx="1" />
                {/* Top-Right Finder */}
                <rect x="64" y="10" width="26" height="26" fill="#1E293B" rx="3" />
                <rect x="68" y="14" width="18" height="18" fill="white" rx="2" />
                <rect x="72" y="18" width="10" height="10" fill="#4A7C59" rx="1" />
                {/* Bottom-Left Finder */}
                <rect x="10" y="64" width="26" height="26" fill="#1E293B" rx="3" />
                <rect x="14" y="68" width="18" height="18" fill="white" rx="2" />
                <rect x="18" y="72" width="10" height="10" fill="#4A7C59" rx="1" />
                {/* Random Pattern Dots */}
                <rect x="42" y="12" width="6" height="6" fill="#1E293B" />
                <rect x="52" y="18" width="6" height="6" fill="#1E293B" />
                <rect x="42" y="28" width="6" height="6" fill="#1E293B" />
                <rect x="12" y="42" width="6" height="6" fill="#1E293B" />
                <rect x="22" y="52" width="6" height="6" fill="#1E293B" />
                <rect x="42" y="42" width="16" height="16" fill="#F26430" rx="3" />
                <circle cx="50" cy="50" r="3" fill="white" />
                <rect x="64" y="42" width="6" height="6" fill="#1E293B" />
                <rect x="74" y="52" width="6" height="6" fill="#1E293B" />
                <rect x="42" y="68" width="6" height="6" fill="#1E293B" />
                <rect x="52" y="78" width="6" height="6" fill="#1E293B" />
                <rect x="64" y="68" width="8" height="8" fill="#1E293B" />
                <rect x="78" y="78" width="10" height="10" fill="#1E293B" />
              </svg>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              ยื่น QR Code นี้ให้เจ้าหน้าที่ / โฮสต์สแกน ณ จุดลงทะเบียนเข้างาน
            </p>
          </div>

          {/* Interactive Check-in & Actions Bar */}
          <div className="space-y-2 pt-1">
            {!isCheckedIn ? (
              <button
                onClick={() => onCheckIn(ticketId)}
                className="w-full bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm py-3 rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>จำลองการสแกนเช็คอินหน้างาน (+50 XP)</span>
              </button>
            ) : (
              <div className="w-full bg-emerald-100 text-emerald-800 font-bold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>คุณได้ทำการเช็คอินเข้าร่วมกิจกรรมนี้เรียบร้อยแล้ว ✨</span>
              </div>
            )}

            {/* Quick Action Links */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                <span>เปิด Google Maps</span>
              </a>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenChat) onOpenChat(event);
                }}
                className="bg-[#EBF3ED] hover:bg-[#D6E8DC] text-[#4A7C59] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>แชตกลุ่มกิจกรรม</span>
              </button>
            </div>

            {/* Cancel Ticket Trigger (Bottom) */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCancel) onOpenCancel(event, ticketId);
                }}
                className="text-xs text-rose-500 hover:text-rose-700 hover:underline font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>ยกเลิกการเข้าร่วมกิจกรรมนี้</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
