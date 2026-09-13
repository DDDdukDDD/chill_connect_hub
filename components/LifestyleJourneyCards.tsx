'use client';

import React from 'react';
import {
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  QrCode,
  Award,
  Camera,
  Gift,
} from 'lucide-react';

export const LifestyleJourneyCards: React.FC = () => {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${sectionId}`);
      } else {
        // Fallback for Classic mode where sections are tabbed inside catalog-section
        const catalogEl = document.getElementById('catalog-section');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
        window.dispatchEvent(new CustomEvent('chill_switch_tab', { detail: { sectionId } }));
      }
    }
  };

  return (
    <div className="relative">
      {/* Desktop Ribbon Path connecting all milestone nodes through center */}
      <div className="hidden lg:block absolute top-[30px] left-10 right-10 h-[2px] bg-gradient-to-r from-emerald-400/50 via-orange-400/50 via-purple-400/50 to-blue-400/50 z-0" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
        
        {/* STEP 1: WHERE & WHAT (Spots) -> Forest Green */}
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl hover:bg-white/95 hover:shadow-lg transition-all duration-300 group lg:border-r border-slate-200/50 last:border-r-0 lg:pr-5">
          <div className="space-y-3">
            {/* Header: Milestone Node + Tag */}
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-2 relative z-10">
                <span className="w-8 h-8 rounded-xl bg-white text-[#4A7C59] border-2 border-emerald-400 font-black text-xs flex items-center justify-center shadow-xs ring-4 ring-white group-hover:scale-110 group-hover:bg-[#4A7C59] group-hover:text-white group-hover:border-[#4A7C59] transition-all duration-300">
                  01
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] ring-2 ring-emerald-100" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                Where & What
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#4A7C59] transition-colors leading-snug">
                1. ปักหมุดพิกัดพักใจ & งานน่าไป
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                หมดกังวลเรื่องไม่รู้จะไปไหน ให้คุณค้นพบมุมสงบ คาเฟ่ลับ และอีเวนต์น่าสนใจใกล้ตัวได้ในคลิกเดียว พร้อมออกเดินทางได้ทันที
              </p>
            </div>

            {/* Clean Micro Features: Borderless Bullet Stream */}
            <div className="space-y-2 pt-1 text-slate-600">
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                <span>สเปซพักผ่อนใกล้คุณ เดินทางสะดวก</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                <span>ภาพจริง ฟีลตรงปก การันตีความประทับใจ</span>
              </div>
            </div>
          </div>

          {/* Action Link -> Refined Editorial Link */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <a
              href="/#section-spots"
              onClick={(e) => handleScrollTo(e, 'section-spots')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A7C59] hover:text-[#3B6447] group/btn cursor-pointer transition-all hover:gap-2.5"
            >
              <span>เริ่มค้นหาพิกัดที่ใช่</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* STEP 2: WHO TO GO WITH (Community) -> Sunset Amber */}
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl hover:bg-white/95 hover:shadow-lg transition-all duration-300 group lg:border-r border-slate-200/50 last:border-r-0 lg:pr-5 lg:pl-3">
          <div className="space-y-3">
            {/* Header: Milestone Node + Tag */}
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-2 relative z-10">
                <span className="w-8 h-8 rounded-xl bg-white text-[#F26430] border-2 border-orange-400 font-black text-xs flex items-center justify-center shadow-xs ring-4 ring-white group-hover:scale-110 group-hover:bg-[#F26430] group-hover:text-white group-hover:border-[#F26430] transition-all duration-300">
                  02
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26430] ring-2 ring-orange-100" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-[#C2410C] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/80">
                Who to go with
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#F26430] transition-colors leading-snug">
                2. เจอเพื่อนใหม่คอเดียวกัน
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                ไม่ต้องเที่ยวคนเดียวอีกต่อไป จอยกลุ่มกิจกรรมที่ชอบได้อย่างสบายใจ มาเดี่ยวก็ไม่เคอะเขิน เพราะทุกคนพร้อมเปิดรับมิตรภาพใหม่อย่างอบอุ่น
              </p>
            </div>

            {/* Clean Micro Features: Borderless Bullet Stream */}
            <div className="space-y-2 pt-1 text-slate-600">
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                <span>พื้นที่ปลอดภัย สบายใจ ไร้ความกดดัน</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <MessageCircle className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                <span>ทำความรู้จักล่วงหน้า บรรยากาศเป็นมิตร</span>
              </div>
            </div>
          </div>

          {/* Action Link -> Refined Editorial Link */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <a
              href="/#section-community"
              onClick={(e) => handleScrollTo(e, 'section-community')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F26430] hover:text-[#D95322] group/btn cursor-pointer transition-all hover:gap-2.5"
            >
              <span>หาเพื่อนร่วมทางรู้ใจ</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* STEP 3: LIFESTYLE QUESTS (Quests & Challenges) -> Royal Violet */}
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl hover:bg-white/95 hover:shadow-lg transition-all duration-300 group lg:border-r border-slate-200/50 last:border-r-0 lg:pr-5 lg:pl-3">
          <div className="space-y-3">
            {/* Header: Milestone Node + Tag */}
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-2 relative z-10">
                <span className="w-8 h-8 rounded-xl bg-white text-[#7C3AED] border-2 border-purple-400 font-black text-xs flex items-center justify-center shadow-xs ring-4 ring-white group-hover:scale-110 group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED] transition-all duration-300">
                  03
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] ring-2 ring-purple-100" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/80">
                Lifestyle Quests
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#7C3AED] transition-colors leading-snug">
                3. สนุกกับชาเลนจ์ & เช็คอินง่าย
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                เปลี่ยนการออกไปใช้ชีวิตให้มีสีสัน ร่วมภารกิจไลฟ์สไตล์สนุกๆ เช็คอินเข้างานสะดวกผ่านมือถือ พร้อมสะสมเหรียญตราแทนความทรงจำ
              </p>
            </div>

            {/* Clean Micro Features: Borderless Bullet Stream */}
            <div className="space-y-2 pt-1 text-slate-600">
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <QrCode className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                <span>เข้างานง่ายไร้รอยต่อ ด้วยบัตรในมือถือ</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <Award className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                <span>พิชิตเป้าหมายสนุกๆ พร้อมสะสมแต้ม HubXP</span>
              </div>
            </div>
          </div>

          {/* Action Link -> Refined Editorial Link */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <a
              href="/#section-challenges"
              onClick={(e) => handleScrollTo(e, 'section-challenges')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] group/btn cursor-pointer transition-all hover:gap-2.5"
            >
              <span>ดูภารกิจชาเลนจ์ทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* STEP 4: SHARE & REWARDS (Moments & Perks) -> Slate Blue */}
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl hover:bg-white/95 hover:shadow-lg transition-all duration-300 group lg:pl-3">
          <div className="space-y-3">
            {/* Header: Milestone Node + Tag */}
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-2 relative z-10">
                <span className="w-8 h-8 rounded-xl bg-white text-[#2B527A] border-2 border-blue-400 font-black text-xs flex items-center justify-center shadow-xs ring-4 ring-white group-hover:scale-110 group-hover:bg-[#2B527A] group-hover:text-white group-hover:border-[#2B527A] transition-all duration-300">
                  04
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2B527A] ring-2 ring-blue-100" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80">
                Share & Rewards
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#2B527A] transition-colors leading-snug">
                4. แชร์ความทรงจำ & รับสิทธิพิเศษ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                ส่งต่อรอยยิ้มและโมเมนต์ประทับใจให้คอมมูนิตี้ พร้อมเปลี่ยนทุกก้าวของการใช้ชีวิตเป็นของรางวัล ส่วนลดคาเฟ่ และสิทธิพิเศษเพื่อคุณ
              </p>
            </div>

            {/* Clean Micro Features: Borderless Bullet Stream */}
            <div className="space-y-2 pt-1 text-slate-600">
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <Camera className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                <span>แบ่งปันภาพความสุข ส่งต่อแรงบันดาลใจ</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <Gift className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                <span>แลกรับส่วนลดคาเฟ่ & สิทธิ์พิเศษไลฟ์สไตล์</span>
              </div>
            </div>
          </div>

          {/* Action Link -> Refined Editorial Link */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <a
              href="/#section-moments"
              onClick={(e) => handleScrollTo(e, 'section-moments')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2B527A] hover:text-[#1F3D5C] group/btn cursor-pointer transition-all hover:gap-2.5"
            >
              <span>เปิดดูโมเมนต์ชุมชน</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

