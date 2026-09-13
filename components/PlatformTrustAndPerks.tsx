'use client';

import React from 'react';
import { 
  Sparkles, 
  Users, 
  ShieldCheck, 
  Compass, 
} from 'lucide-react';
import { LifestyleJourneyCards } from '@/components/LifestyleJourneyCards';

interface PlatformTrustAndPerksProps {
  onOpenLogin?: () => void;
}

export const PlatformTrustAndPerks: React.FC<PlatformTrustAndPerksProps> = () => {
  return (
    <section id="why-chill-and-connect" className="space-y-5 sm:space-y-6 pt-2 scroll-mt-24">
      
      {/* Header */}
      <div className="space-y-1.5 text-left">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ทำไมต้อง Chill & Connect Hub?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-none lg:whitespace-nowrap">
          เราคัดสรรค์ รวบรวมทุกมิติของการออกไปใช้ชีวิต ตั้งแต่ค้นหาพิกัดใจฟู ชวนเพื่อนรู้ใจ ชาเลนจ์สนุกๆ ไปจนถึงรับรางวัลพิเศษ ให้ทุกการพักผ่อนมีความหมาย
        </p>
      </div>

      {/* The Unified Lifestyle Canvas (Organic Panoramic Stage - Direction 1) */}
      <div className="bg-gradient-to-b from-white via-slate-50/40 to-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.04)] p-5 sm:p-7 lg:p-8 relative overflow-hidden">
        
        {/* Soft Ambient Corner Glows */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 right-1/4 w-64 h-64 bg-purple-100/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* 4-Step Connected Infographic Journey (Borderless Columns) */}
        <div className="relative z-10">
          <LifestyleJourneyCards />
        </div>

        {/* Integrated Trust & Community Stats Horizon Strip */}
        <div className="mt-7 sm:mt-9 pt-6 sm:pt-7 border-t border-slate-200/70 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
            
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                <Users className="w-3.5 h-3.5 text-[#F26430]" />
                <span>ผู้ใช้งานต่อวัน</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">10,000+</p>
            </div>

            <div className="p-2 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                <Compass className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span>สถานที่ & อีเวนต์</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">1,000+</p>
            </div>

            <div className="p-2 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>มิตรภาพ & ตี้กลุ่มย่อย</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">3,500+</p>
            </div>

            <div className="p-2 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe Space Community</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">100%</p>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};
