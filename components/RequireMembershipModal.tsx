'use client';

import React from 'react';
import Link from 'next/link';
import { X, Sparkles, Ticket, Users, MessageCircle, Gift, ArrowRight, LogIn } from 'lucide-react';

interface RequireMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  actionTitle?: string;
}

export const RequireMembershipModal: React.FC<RequireMembershipModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  actionTitle = 'เพื่อดำเนินการต่อ',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-scale-up text-[#1E293B] relative p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors z-20 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header (Clean White / Light Style) */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A7C59] bg-[#EBF3ED] px-3 py-0.5 rounded-full border border-[#C5DCCB]">
            <Sparkles className="w-3 h-3 text-[#4A7C59]" />
            <span>สมัครฟรี 100% ไม่มีค่าใช้จ่าย</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            สมัครสมาชิกเพื่อเข้าร่วมกิจกรรม
          </h3>

          <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed max-w-xs mx-auto">
            สมัครสมาชิกหรือเข้าสู่ระบบ เพื่อปลดล็อกสิทธิพิเศษมากมาย
          </p>
        </div>

        {/* Membership Perks (Clean 4 Pure White Cards) */}
        <div className="space-y-2.5">
          {/* Card 1 */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#4A7C59]/50 hover:shadow-xs transition-all">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#4A7C59] border border-emerald-200 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">ร่วมทุกกิจกรรม & ชาเลนต์</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">เข้าร่วมกิจกรรมสนุกๆ และรับภารกิจสะสมเหรียญรางวัล</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#F26430]/50 hover:shadow-xs transition-all">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F26430] border border-orange-200 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">โพสต์ชวนเพื่อน & หาตี้ใน Buddy Board</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">ปลดล็อกการชวนตี้และระบบทักทายหาเพื่อนใหม่</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-sky-400/50 hover:shadow-xs transition-all">
            <div className="w-7 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">ห้องแชตนัดพบ & คอมมูนิตี้ส่วนตัว</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">พูดคุยแลกเปลี่ยนใน Group Chat ของแต่ละกิจกรรม</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-400/50 hover:shadow-xs transition-all">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">รับแต้มต้อนรับ +50 Connect Points ฟรี</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">สะสมแต้มทำภารกิจแลกของรางวัลและส่วนลด</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Compact & Balanced Size) */}
        <div className="pt-2 space-y-2">
          <Link
            href="/onboarding"
            onClick={onClose}
            className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>สมัครสมาชิกใหม่ฟรี (เพียง 1 นาที)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="w-full text-center py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            มีบัญชีอยู่แล้ว? <span className="font-bold text-[#4A7C59] hover:underline">เข้าสู่ระบบ ➔</span>
          </button>
        </div>

      </div>
    </div>
  );
};

