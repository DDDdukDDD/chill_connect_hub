'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Compass, 
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface PlatformTrustAndPerksProps {
  onOpenLogin?: () => void;
}

export const PlatformTrustAndPerks: React.FC<PlatformTrustAndPerksProps> = () => {
  return (
    <section id="why-chill-and-connect" className="space-y-6 sm:space-y-8 pt-2 scroll-mt-24">
      
      {/* Header */}
      <div className="space-y-1.5 text-left">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ทำไมต้อง Chill & Connect Hub?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-none md:whitespace-nowrap">
          เพราะเราคัดสรรค์ รวบรวมทุกมิติของการออกไปใช้ชีวิต พร้อมตอบคำถาม ไปไหน ไปทำอะไร ไปกับใคร เพื่อให้ทุกวันหยุดและวันดีดีของคุณมีความหมาย
        </p>
      </div>

      {/* 3 Core Pillars Showcase Cards (Where to go / What to do / Who to go with) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          
          {/* Pillar 1: Where to go */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
            <div>
              {/* Visual Cover */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80"
                  alt="Lifestyle Spots & Parks"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
                
                {/* Floating Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-2xs text-[10.5px] font-black text-[#4A7C59] border border-white/60">
                  <MapPin className="w-3 h-3 text-[#4A7C59]" />
                  <span>WHERE TO GO</span>
                </div>

                {/* Bottom Title on Image */}
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                    1. สถานที่เที่ยว & จุดฮีลใจ
                  </h3>
                  <p className="text-[11px] text-slate-200 font-medium">
                    ไม่รู้จะไปไหน ให้เราช่วยคัดสรรพิกัดที่ดีที่สุด
                  </p>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  ค้นพบมุมสงบและพิกัดชาร์จพลังที่ใช่สำหรับคุณ รวบรวมตั้งแต่คาเฟ่ลับ สวนสีเขียว ไปจนถึงอาร์ตสเปซ <strong>77 จังหวัดทั่วไทย</strong> พร้อมข้อมูลอัปเดตจริงที่วางใจได้
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    <span>ปักหมุดพิกัดชิลล์ใกล้ตัว ค้นหาง่ายแค่ปลายนิ้ว</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    <span>ภาพบรรยากาศจริง ฟีลตรงปก มั่นใจได้ทุกการเดินทาง</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Link */}
            <div className="p-5 pt-0">
              <Link
                href="/spots"
                className="w-full bg-[#4A7C59] hover:bg-[#3B6447] text-white py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 group/btn cursor-pointer active:scale-[0.98]"
              >
                <span>สำรวจจุดฮีลใจ 77 จังหวัด</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: What to do */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
            <div>
              {/* Visual Cover */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"
                  alt="Events & Workshops"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
                
                {/* Floating Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-2xs text-[10.5px] font-black text-[#2B527A] border border-white/60">
                  <Calendar className="w-3 h-3 text-[#2B527A]" />
                  <span>WHAT TO DO</span>
                </div>

                {/* Bottom Title on Image */}
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                    2. กิจกรรมและงานมหกรรมสดใหม่
                  </h3>
                  <p className="text-[11px] text-slate-200 font-medium">
                    วันหยุดนี้ไม่มีเบื่อ รวมทุกงานแฟร์ & เวิร์กช็อป
                  </p>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  เปลี่ยนวันว่างให้มีสีสัน รวมทุกเทศกาล งานแฟร์ คอนเสิร์ต และเวิร์กช็อปน่าลอง <strong>คัดเฉพาะงานคุณภาพ</strong> อัปเดตสดใหม่ทุกสัปดาห์ ให้คุณไม่พลาดทุกเทรนด์ฮิต
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-blue-50/60 p-2 rounded-xl border border-blue-100/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                    <span>คัดเฉพาะงานน่าไป กรองงานซ้ำ หมดปัญหาข้อมูลล้น</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-blue-50/60 p-2 rounded-xl border border-blue-100/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                    <span>บันทึกงานโปรด พร้อมรับบัตรเข้างานทันทีบนมือถือ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Link */}
            <div className="p-5 pt-0">
              <Link
                href="/fairs"
                className="w-full bg-[#2B527A] hover:bg-[#1F3D5C] text-white py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 group/btn cursor-pointer active:scale-[0.98]"
              >
                <span>ค้นหากิจกรรมและงานแฟร์</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Pillar 3: Who to go with */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
            <div>
              {/* Visual Cover */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
                  alt="Community & Friends"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
                
                {/* Floating Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-2xs text-[10.5px] font-black text-[#F26430] border border-white/60">
                  <Users className="w-3 h-3 text-[#F26430]" />
                  <span>WHO TO GO WITH</span>
                </div>

                {/* Bottom Title on Image */}
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                    3. เพื่อนและคอมมูนิตี้คอเดียวกัน
                  </h3>
                  <p className="text-[11px] text-slate-200 font-medium">
                    ไม่ต้องไปคนเดียว ชวนเพื่อนใหม่ในเซฟสเปซ
                  </p>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  เจอเพื่อนใหม่คอเดียวกันในพื้นที่สบายใจ ไม่ว่าจะเป็นสายกาแฟ ชวนวิ่ง หรือบอร์ดเกม จะมาเดี่ยวหรือมาชิลล์ก็อบอุ่น เพราะทุกคนพร้อม <strong>เปิดรับมิตรภาพใหม่</strong>
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-orange-50/60 p-2 rounded-xl border border-orange-100/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                    <span>บรรยากาศเป็นกันเอง ปลอดภัย สบายใจแม้เป็น Introvert</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-orange-50/60 p-2 rounded-xl border border-orange-100/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                    <span>ยิ่งออกไปใช้ชีวิต ยิ่งสะสมแต้มแลกรับของรางวัลพิเศษ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Link */}
            <div className="p-5 pt-0">
              <Link
                href="/community"
                className="w-full bg-[#F26430] hover:bg-[#D95322] text-white py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 group/btn cursor-pointer active:scale-[0.98]"
              >
                <span>หาตี้และเพื่อนร่วมทาง</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

        {/* Trust & Community Stats Strip */}
        <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
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
                <Sparkles className="w-3.5 h-3.5 text-[#2B527A]" />
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

    </section>
  );
};
