'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Gift, Award, ArrowRight, Coffee, Ticket, Sparkles } from 'lucide-react';

interface MemberPrivilegesSectionProps {
  isLoggedIn?: boolean;
}

export const MemberPrivilegesSection: React.FC<MemberPrivilegesSectionProps> = ({
  isLoggedIn = false,
}) => {
  const [showcaseTab, setShowcaseTab] = useState<'vouchers' | 'rewards'>('vouchers');

  return (
    <section className="w-full space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 pb-1 pt-2 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Member Privileges
        </h2>

        {/* Tab Switcher (Compact Segmented Control) */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setShowcaseTab('vouchers')}
            className={`px-3 py-1 rounded-lg font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              showcaseTab === 'vouchers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-blue-600" />
            <span>สิทธิ์ต้อนรับ</span>
          </button>
          <button
            type="button"
            onClick={() => setShowcaseTab('rewards')}
            className={`px-3 py-1 rounded-lg font-extrabold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              showcaseTab === 'rewards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>XP แลกรางวัล</span>
          </button>
        </div>
      </div>

      {/* TAB 1: New User Exclusive Perforated Ticket Vouchers */}
      {showcaseTab === 'vouchers' && (
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible no-scrollbar sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 animate-fade-in pb-1.5 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
          {/* Card 1: Welcome Privilege */}
          <div className="relative rounded-xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-indigo-50/70 border border-blue-100/90 p-3 flex flex-col justify-between shadow-2xs group hover:border-blue-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block leading-none">
                  Welcome Privilege
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate">
                  สิทธิ์พิเศษสำหรับ สมาชิก
                </h3>
                <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                  สร้างโปรไฟล์ สมัครสมาชิกฟรี เพื่อปลดล็อกสิทธิ์พิเศษ
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white text-blue-600 shadow-xs flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                <Gift className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={isLoggedIn ? '/rewards' : '/onboarding'}
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer gap-1 leading-none"
              >
                <span>{isLoggedIn ? 'ดูสิทธิ์ของคุณ' : 'เข้าสู่ระบบเพื่อรับสิทธิ์'}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: 10% off Specialty Coffee */}
          <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="p-3 flex-1 min-w-0 flex flex-col justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                    ลด 10%
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                    เครื่องดื่ม
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                  Specialty Coffee 77 จังหวัด
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/rewards"
                  className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                >
                  เก็บสิทธิ์
                </Link>
              </div>
            </div>

            {/* Perforated Vertical Divider */}
            <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
            </div>

            {/* Right Stub: Amber Category Icon */}
            <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-amber-50/70 rounded-r-xl border-l border-dashed border-slate-200">
              <Coffee className="w-5 h-5 text-amber-700 group-hover:scale-105 transition-transform" />
              <span className="text-[9.5px] font-bold text-amber-800 mt-1 text-center truncate">
                คาเฟ่
              </span>
            </div>
          </div>

          {/* Card 3: Free Community Meetup Pass */}
          <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="p-3 flex-1 min-w-0 flex flex-col justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                    จอยตี้ฟรี
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                    ตี้แรก
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                  คอมมูนิตี้ & เพื่อนใหม่
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                >
                  เก็บสิทธิ์
                </Link>
              </div>
            </div>

            {/* Perforated Vertical Divider */}
            <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
            </div>

            {/* Right Stub: Orange Category Icon */}
            <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-orange-50/70 rounded-r-xl border-l border-dashed border-slate-200">
              <Ticket className="w-5 h-5 text-orange-700 group-hover:scale-105 transition-transform" />
              <span className="text-[9.5px] font-bold text-orange-800 mt-1 text-center truncate">
                มีตอัป
              </span>
            </div>
          </div>

          {/* Card 4: 50 THB Creative Workshop Discount */}
          <div className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-stretch group min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="p-3 flex-1 min-w-0 flex flex-col justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                    ส่วนลด ฿50
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                    เวิร์กช็อป
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                  ปั้นเซรามิก & ศิลปะฮีลใจ
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/rewards"
                  className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
                >
                  เก็บสิทธิ์
                </Link>
              </div>
            </div>

            {/* Perforated Vertical Divider */}
            <div className="relative flex flex-col justify-between items-center w-0 shrink-0">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.04)]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-200/90 z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
            </div>

            {/* Right Stub: Indigo Category Icon */}
            <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center p-2 bg-indigo-50/70 rounded-r-xl border-l border-dashed border-slate-200">
              <Sparkles className="w-5 h-5 text-indigo-700 group-hover:scale-105 transition-transform" />
              <span className="text-[9.5px] font-bold text-indigo-800 mt-1 text-center truncate">
                เวิร์กช็อป
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: XP Redemption Rewards */}
      {showcaseTab === 'rewards' && (
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible no-scrollbar sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 animate-fade-in pb-1.5 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
          {/* Reward 1 */}
          <div className="rounded-xl bg-white border border-slate-200/90 p-3 flex flex-col justify-between shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                  ⚡ 500 XP
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate mt-1">
                  คูปองเครื่องดื่มฟรี 1 แก้ว
                </h3>
                <p className="text-[10.5px] text-slate-500 truncate">
                  ร้าน Specialty Coffee พาร์ทเนอร์
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/rewards"
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
              >
                แลกรางวัล
              </Link>
            </div>
          </div>

          {/* Reward 2 */}
          <div className="rounded-xl bg-white border border-slate-200/90 p-3 flex flex-col justify-between shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                  ⚡ 800 XP
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate mt-1">
                  ส่วนลดบัตรงานแฟร์ ฿100
                </h3>
                <p className="text-[10.5px] text-slate-500 truncate">
                  ใช้ได้กับงานมหกรรมและเอ็กซ์โป
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/rewards"
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
              >
                แลกรางวัล
              </Link>
            </div>
          </div>

          {/* Reward 3 */}
          <div className="rounded-xl bg-white border border-slate-200/90 p-3 flex flex-col justify-between shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                  ⚡ 1,200 XP
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate mt-1">
                  ชุด Gift Set รักษ์โลก
                </h3>
                <p className="text-[10.5px] text-slate-500 truncate">
                  กระบอกน้ำ Chill & Connect รุ่น Limited
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/rewards"
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 hover:bg-[#2563EB] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer leading-none"
              >
                แลกรางวัล
              </Link>
            </div>
          </div>

          {/* Reward 4 */}
          <div className="rounded-xl bg-white border border-slate-200/90 p-3 flex flex-col justify-between shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[96px] sm:min-h-[105px] min-w-[250px] max-w-[270px] sm:min-w-0 sm:max-w-none shrink-0 sm:shrink snap-start">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                  ⚡ ศูนย์ของรางวัล
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate mt-1">
                  สิทธิพิเศษอื่นๆ อีก 20+
                </h3>
                <p className="text-[10.5px] text-slate-500 truncate">
                  สำรวจแคตตาล็อกของรางวัลทั้งหมด
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/rewards"
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer gap-1 leading-none"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
