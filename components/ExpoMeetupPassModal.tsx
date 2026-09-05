'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  Check,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Sparkles,
  QrCode,
  Calendar
} from 'lucide-react';

export interface ExpoMeetupPassData {
  id: string;
  fairTitle: string;
  fairLocation: string;
  fairDate: string;
  groupTitle: string;
  meetupPoint: string;
  time: string;
  creatorName: string;
  creatorAvatar: string;
  contactChannel?: string;
  note?: string;
  currentMembers: number;
  maxMembers: number;
}

interface ExpoMeetupPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  passData: ExpoMeetupPassData | null;
  onCancelJoin?: (groupId: string) => void;
}

export const ExpoMeetupPassModal: React.FC<ExpoMeetupPassModalProps> = ({
  isOpen,
  onClose,
  passData,
  onCancelJoin,
}) => {
  const [isCopiedContact, setIsCopiedContact] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!isOpen || !passData) return null;

  const handleCopyContact = () => {
    if (!passData.contactChannel) return;
    navigator.clipboard.writeText(passData.contactChannel);
    setIsCopiedContact(true);
    setTimeout(() => setIsCopiedContact(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in font-sans select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] sm:rounded-[32px] max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl relative animate-scale-up border border-slate-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                <Sparkles className="w-3 h-3 text-sky-600" />
                <span>Expo Meetup Pass</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ ยืนยันร่วมกลุ่มแล้ว
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ตั๋วนัดพบกลุ่มเดินดูงาน 🎫
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              ข้อมูลนัดหมายและช่องทางติดต่อเพื่อนร่วมทางสำหรับงานนี้
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Ticket Body (Editorial Design) */}
        <div className="rounded-3xl bg-gradient-to-b from-sky-50/70 to-slate-50 border border-sky-200 p-5 space-y-4 relative overflow-hidden shadow-xs">
          
          {/* Top Event Context */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 block">
              งานมหกรรม & นิทรรศการ
            </span>
            <h3 className="text-base font-black text-slate-900 leading-snug">
              {passData.fairTitle}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-700 shrink-0" />
              <span className="truncate">{passData.fairLocation}</span>
            </p>
          </div>

          {/* Perforated Ticket Divider */}
          <div className="relative py-1">
            <div className="border-t border-dashed border-sky-200" />
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-r border-sky-200" />
            <div className="absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-l border-sky-200" />
          </div>

          {/* Group Details */}
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                หัวข้อกลุ่มนัดเดินงาน
              </span>
              <h4 className="text-sm font-black text-slate-900 leading-snug">
                {passData.groupTitle}
              </h4>
            </div>

            {/* Grid Specs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#2B527A]" />
                  จุดนัดพบในงาน
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {passData.meetupPoint}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#2B527A]" />
                  เวลานัดพบ
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {passData.time}
                </p>
              </div>
            </div>

            {/* Note if any */}
            {passData.note && (
              <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/60 text-xs text-slate-600 leading-relaxed font-medium">
                <span className="font-bold text-slate-700 block mb-0.5">💬 ข้อความจากผู้จัด:</span>
                {passData.note}
              </div>
            )}

            {/* Host & Contact Box */}
            <div className="p-3.5 rounded-2xl bg-white border border-sky-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={passData.creatorAvatar}
                  alt={passData.creatorName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">
                    {passData.creatorName}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    ผู้เปิดกลุ่ม • รวมแล้ว {passData.currentMembers}/{passData.maxMembers} คน
                  </span>
                </div>
              </div>

              {passData.contactChannel && (
                <button
                  type="button"
                  onClick={handleCopyContact}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-all flex items-center gap-1 shrink-0 border border-sky-200 cursor-pointer active:scale-95"
                  title="คัดลอกช่องทางติดต่อ"
                >
                  {isCopiedContact ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{passData.contactChannel}</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Safety & Sync Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#2B527A] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            บันทึกกลุ่มนัดเดินนี้ลง <strong>MyHub</strong> ของคุณเรียบร้อยแล้ว แนะนำให้ไปถึงจุดนัดพบล่วงหน้า 5-10 นาที และพบกันในบริเวณพื้นที่เปิดของศูนย์นิทรรศการเพื่อความปลอดภัย
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/myhub"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>เปิดดูใน MyHub</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-[#2B527A] hover:bg-[#1E3B59] text-white text-xs font-black shadow-md shadow-sky-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>รับทราบ เข้าใจแล้ว</span>
            </button>
          </div>

          {/* Cancel participation link */}
          {onCancelJoin && (
            <div className="text-center pt-1">
              {!showCancelConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  ต้องการยกเลิกการเข้าร่วมกลุ่มนี้?
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-center animate-in fade-in duration-200">
                  <p className="text-xs text-rose-800 font-bold">
                    ยืนยันยกเลิกการเข้าร่วมกลุ่มเดินงานนี้?
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 font-bold"
                    >
                      ไม่ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onCancelJoin(passData.id);
                        setShowCancelConfirm(false);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black shadow-xs hover:bg-rose-700"
                    >
                      ยืนยันยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
