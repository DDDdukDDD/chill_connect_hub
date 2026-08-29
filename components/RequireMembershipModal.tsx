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
    <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md sm:max-w-lg w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-scale-up text-[#1E293B] relative p-6 sm:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors z-20 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header (Clean White / Light Style) */}
        <div className="text-center space-y-2.5 pt-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A7C59] bg-[#EBF3ED] px-3.5 py-1 rounded-full border border-[#C5DCCB]">
            <Sparkles className="w-3.5 h-3.5 text-[#4A7C59]" />
            <span>สมัครฟรี 100% ไม่มีค่าใช้จ่าย</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            สมัครสมาชิกเพื่อเข้าร่วมกิจกรรม
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
            สมัครสมาชิกหรือเข้าสู่ระบบ เพื่อปลดล็อกสิทธิพิเศษและเชื่อมต่อคอมมูนิตี้
          </p>
        </div>

        {/* Membership Perks (Clean Spacious Cards) */}
        <div className="space-y-3">
          {/* Card 1 */}
          <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:border-[#4A7C59]/40 hover:bg-white hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#4A7C59] border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">ร่วมทุกกิจกรรม & ชาเลนจ์</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">เข้าร่วมกิจกรรมสนุกๆ และรับภารกิจสะสมเหรียญรางวัล</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:border-[#F26430]/40 hover:bg-white hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F26430] border border-orange-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">โพสต์ชวนเพื่อน & หาตี้ใน Buddy Board</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">ปลดล็อกการชวนตี้และระบบทักทายหาเพื่อนใหม่</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:border-sky-400/40 hover:bg-white hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">ห้องแชตนัดพบ & คอมมูนิตี้ส่วนตัว</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">พูดคุยแลกเปลี่ยนใน Group Chat ของแต่ละกิจกรรม</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:border-amber-400/40 hover:bg-white hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">รับแต้มต้อนรับ +50 Connect Points ฟรี</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">สะสมแต้มทำภารกิจแลกของรางวัลและส่วนลดพิเศษ</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Spacious & Comfortable) */}
        <div className="pt-2 space-y-2.5">
          <Link
            href="/onboarding"
            onClick={onClose}
            className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-3 sm:py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>สมัครสมาชิกใหม่ฟรี (เพียง 1 นาที)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="w-full text-center py-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            มีบัญชีอยู่แล้ว? <span className="font-bold text-[#4A7C59] hover:underline">เข้าสู่ระบบ ➔</span>
          </button>
        </div>

      </div>
    </div>
  );
};

