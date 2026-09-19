'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { useAuth } from '@/lib/useAuth';
import { CreateEventModal } from '@/components/CreateEventModal';
import { EventItem } from '@/data/mockData';
import { BrandLogo } from '@/components/BrandLogo';
import { LifestyleJourneyCards } from '@/components/LifestyleJourneyCards';
import {
  Sprout,
  Heart,
  Users,
  Sparkles,
  ShieldCheck,
  Award,
  Smile,
  Compass,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Flame,
  Sun,
  MapPin,
  Calendar,
  Zap,
  Target,
  QrCode,
  Gift,
  Camera,
  MessageCircle,
  Trophy,
  SmilePlus,
  BatteryCharging
} from 'lucide-react';

export default function AboutPage() {
  const [activeNavTab, setActiveNavTab] = useState('about');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* 1. Header Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-28 sm:pb-12">
        
        {/* =========================================================================
            SECTION 1: HERO STORY BANNER (Balanced & Punchy)
           ========================================================================= */}
        <section className="bg-white py-10 sm:py-14 border-b border-slate-100 relative overflow-hidden">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
            

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug max-w-3xl mx-auto">
              แพลตฟอร์มค้นพบไลฟ์สไตล์ <br className="hidden sm:inline" />
              <span className="text-[#4A7C59]">
                สำหรับคนชอบออกไปใช้ชีวิต
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              <strong>Chill & Connect Hub</strong> คือศูนย์กลางที่รวมสถานที่เที่ยว & จุดฮีลใจ, กิจกรรมและอีเวนต์, และเพื่อนร่วมทางคอเดียวกันเข้าไว้ในที่เดียว เพื่อให้ทุกวันหยุดของคุณมีความหมายและเติมเต็มพลังบวกได้ทุกวัน
            </p>

            {/* Impact Stats: Integrated Frosted Horizon Bar */}
            <div className="max-w-4xl mx-auto pt-3">
              <div className="bg-gradient-to-r from-slate-50/80 via-white/90 to-slate-50/80 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 p-2 sm:p-3 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
                  {[
                    { label: 'ผู้ใช้งานต่อวัน', val: '10,000+', icon: <Users className="w-3.5 h-3.5 text-[#F26430]" /> },
                    { label: 'สถานที่ & อีเวนต์', val: '1,000+', icon: <Compass className="w-3.5 h-3.5 text-[#4A7C59]" /> },
                    { label: 'มิตรภาพ & ตี้กลุ่มย่อย', val: '3,500+', icon: <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> },
                    { label: 'Safe Space Community', val: '100%', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> },
                  ].map((stat, idx) => (
                    <div key={idx} className="p-2 sm:p-2.5 space-y-0.5">
                      <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500">
                        {stat.icon}
                        <span>{stat.label}</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">{stat.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 2: INFOGRAPHIC USER JOURNEY (Connected 4 Steps Flow)
           ========================================================================= */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              4 สเต็ปง่ายๆ ออกไปใช้ชีวิตในแบบที่คุณรัก
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              ตั้งแต่ค้นหาพิกัดใจฟู ชวนเพื่อนรู้ใจ ไปจนถึงรับรางวัลพิเศษ ให้ทุกการพักผ่อนมีความหมาย
            </p>
          </div>

          {/* 4-Step Connected Infographic Journey in Unified Lifestyle Canvas */}
          <div className="bg-gradient-to-b from-white via-slate-50/40 to-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.04)] p-5 sm:p-7 lg:p-8 relative overflow-hidden">
            {/* Soft Ambient Corner Glows */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 right-1/4 w-64 h-64 bg-purple-100/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <LifestyleJourneyCards />
            </div>
          </div>

        </section>

        {/* =========================================================================
            SECTION 3: 3 CORE PILLARS (The Unified Lifestyle Canvas - Organic Panoramic Stage)
           ========================================================================= */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              คำตอบครบทุกมิติของการออกไปใช้ชีวิต
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              ตอบ 3 คำถามสำคัญ เพื่อให้การวางแผนวันหยุดและการออกไปเปิดประสบการณ์ใหม่ของคุณง่ายและมีความสุขที่สุด
            </p>
          </div>

          {/* The Unified Lifestyle Canvas (Organic Panoramic Stage) */}
          <div className="bg-gradient-to-b from-white via-slate-50/40 to-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.04)] p-5 sm:p-7 lg:p-9 relative overflow-hidden">
            
            {/* Soft Ambient Corner Glows */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-100/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-100/35 rounded-full blur-3xl pointer-events-none" />

            {/* 3 Borderless Columns Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 relative z-10">
              
              {/* PILLAR 1: WHERE TO GO (Spots) -> Forest Green */}
              <div className="flex flex-col justify-between space-y-4 lg:border-r border-slate-200/60 lg:pr-7 lg:pl-2 group">
                <div className="space-y-4">
                  
                  {/* Panoramic Visual Window */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80"
                      alt="Lifestyle Spots & Parks"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />
                    
                    {/* Floating Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs text-[10px] font-black text-[#4A7C59] border border-white/60">
                      <MapPin className="w-3 h-3 text-[#4A7C59]" />
                      <span>WHERE TO GO</span>
                    </div>

                    {/* Bottom Title inside Image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <p className="text-sm sm:text-base font-black tracking-tight">1. สถานที่เที่ยว & จุดฮีลใจ</p>
                      <p className="text-[11px] text-slate-200 font-medium">ไม่รู้จะไปไหน ให้เราช่วยคัดสรรพิกัดที่ดีที่สุด</p>
                    </div>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#4A7C59] border border-emerald-200 text-xs font-black flex items-center justify-center shrink-0">
                        01
                      </span>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#4A7C59] transition-colors">
                        พิกัดชาร์จพลัง 77 จังหวัดทั่วไทย
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      ค้นพบมุมสงบและพิกัดชาร์จพลังที่ใช่ รวบรวมตั้งแต่คาเฟ่ลับ สเปซสีเขียว ไปจนถึงอาร์ตสเปซทั่วไทย พร้อมข้อมูลอัปเดตตรงปก
                    </p>
                  </div>

                  {/* Borderless Micro Features Stream */}
                  <div className="space-y-2 pt-1 text-slate-600">
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                      <span>ปักหมุดพิกัดชิลล์ใกล้ตัว ค้นหาง่ายแค่ปลายนิ้ว</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                      <span>ภาพบรรยากาศจริง ฟีลตรงปก มั่นใจได้ทุกการเดินทาง</span>
                    </div>
                  </div>

                </div>

                {/* Editorial Action Link */}
                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/spots"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A7C59] hover:text-[#3B6447] group/btn cursor-pointer transition-all hover:gap-2.5"
                  >
                    <span>สำรวจจุดฮีลใจ 77 จังหวัด</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* PILLAR 2: WHAT TO DO (Fairs & Events) -> Slate Blue */}
              <div className="flex flex-col justify-between space-y-4 lg:border-r border-slate-200/60 lg:px-7 group">
                <div className="space-y-4">
                  
                  {/* Panoramic Visual Window */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"
                      alt="Events & Workshops"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />
                    
                    {/* Floating Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs text-[10px] font-black text-[#2B527A] border border-white/60">
                      <Calendar className="w-3 h-3 text-[#2B527A]" />
                      <span>WHAT TO DO</span>
                    </div>

                    {/* Bottom Title inside Image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <p className="text-sm sm:text-base font-black tracking-tight">2. กิจกรรมและงานมหกรรมสดใหม่</p>
                      <p className="text-[11px] text-slate-200 font-medium">วันหยุดนี้ไม่มีเบื่อ รวมทุกงานแฟร์ & เวิร์กช็อป</p>
                    </div>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#2B527A] border border-blue-200 text-xs font-black flex items-center justify-center shrink-0">
                        02
                      </span>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#2B527A] transition-colors">
                        งานแฟร์ นิทรรศการ & เทศกาลสดใหม่
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      เปลี่ยนวันว่างให้มีสีสัน รวมทุกเทศกาล งานแฟร์ คอนเสิร์ต และเวิร์กช็อปน่าลอง คัดเฉพาะงานคุณภาพ อัปเดตสดใหม่สม่ำเสมอ
                    </p>
                  </div>

                  {/* Borderless Micro Features Stream */}
                  <div className="space-y-2 pt-1 text-slate-600">
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                      <span>คัดเฉพาะงานน่าไป กรองงานซ้ำ หมดปัญหาข้อมูลล้น</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <QrCode className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                      <span>บันทึกงานโปรด พร้อมรับบัตรเข้างานทันทีบนมือถือ</span>
                    </div>
                  </div>

                </div>

                {/* Editorial Action Link */}
                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/fairs"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2B527A] hover:text-[#1F3D5C] group/btn cursor-pointer transition-all hover:gap-2.5"
                  >
                    <span>ค้นหากิจกรรมและงานแฟร์</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* PILLAR 3: WHO TO GO WITH (Community) -> Sunset Amber */}
              <div className="flex flex-col justify-between space-y-4 lg:pl-7 lg:pr-2 group">
                <div className="space-y-4">
                  
                  {/* Panoramic Visual Window */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
                      alt="Community & Friends"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />
                    
                    {/* Floating Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs text-[10px] font-black text-[#F26430] border border-white/60">
                      <Users className="w-3 h-3 text-[#F26430]" />
                      <span>WHO TO GO WITH</span>
                    </div>

                    {/* Bottom Title inside Image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <p className="text-sm sm:text-base font-black tracking-tight">3. เพื่อนและคอมมูนิตี้คอเดียวกัน</p>
                      <p className="text-[11px] text-slate-200 font-medium">ไม่ต้องไปคนเดียว ชวนเพื่อนใหม่ในเซฟสเปซ</p>
                    </div>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-50 text-[#F26430] border border-orange-200 text-xs font-black flex items-center justify-center shrink-0">
                        03
                      </span>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#F26430] transition-colors">
                        ตี้เพื่อนรู้ใจ ในพื้นที่ปลอดภัย 100%
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      เจอเพื่อนใหม่คอเดียวกันในพื้นที่สบายใจ ไม่ว่าจะเป็นสายกาแฟ วิ่ง หรือบอร์ดเกม ทุกคนพร้อมเปิดรับมิตรภาพใหม่อย่างอบอุ่น
                    </p>
                  </div>

                  {/* Borderless Micro Features Stream */}
                  <div className="space-y-2 pt-1 text-slate-600">
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                      <span>บรรยากาศเป็นกันเอง ปลอดภัย สบายใจแม้เป็น Introvert</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <Gift className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                      <span>ยิ่งออกไปใช้ชีวิต ยิ่งสะสมแต้มแลกรับของรางวัลพิเศษ</span>
                    </div>
                  </div>

                </div>

                {/* Editorial Action Link */}
                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/community"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F26430] hover:text-[#D95322] group/btn cursor-pointer transition-all hover:gap-2.5"
                  >
                    <span>หาตี้และเพื่อนร่วมทาง</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

            </div>

            {/* Stage Horizon Guarantee Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200/70 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
                <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-[#4A7C59]" />
                  <span>คัดสรรคุณภาพ 77 จังหวัดทั่วไทย</span>
                </div>
                <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-[#2B527A]" />
                  <span>อัปเดตงานสดใหม่ ไร้ข้อมูลซ้ำซ้อน</span>
                </div>
                <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-[#F26430]" />
                  <span>เซฟสเปซ อบอุ่น สบายใจ ปลอดภัย 100%</span>
                </div>
              </div>
            </div>

          </div>

        </section>

        {/* =========================================================================
            SECTION 4: GAMIFICATION & LIFESTYLE PERKS (Connected Value Progression Flow)
           ========================================================================= */}
        <section className="bg-[#FAF9F6] py-12 sm:py-16 border-y border-slate-200/80">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="max-w-3xl mx-auto text-center space-y-2.5">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
                พิชิตเป้าหมายสนุกๆ สะสมแต้ม HubXP แลกรับสิทธิพิเศษเพื่อคุณ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                เปลี่ยนทุกวันหยุดและการออกไปเปิดประสบการณ์ใหม่ให้มีความหมายยิ่งขึ้น ด้วยภารกิจไลฟ์สไตล์สนุกๆ สะสมเหรียญตรา และแลกรับของรางวัลพิเศษ
              </p>
            </div>

            {/* Connected Progression Stage Canvas */}
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.04)] p-6 sm:p-8 lg:p-9 relative overflow-hidden">
              
              {/* Soft Ambient Glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                
                {/* Step 1: Quests */}
                <div className="flex flex-col justify-between space-y-4 pt-4 md:pt-0 md:pr-6 group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-200/80 font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-300">
                        01
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/80">
                        Lifestyle Quests
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#7C3AED] transition-colors">
                        1. พิชิตภารกิจชาเลนจ์สนุกๆ
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-normal">
                        ร่วมสนุกกับเควสต์หลากหลายธีม เช่น วิ่งรับลมเช้า ตะลุยคาเฟ่ลับ หรือเช็คอินงานอาร์ตสเปซ พร้อมรับเหรียญตรา Badges แทนความทรงจำ
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 pt-1">
                      <Target className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                      <span>มีภารกิจอัปเดตใหม่ทุกสัปดาห์</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href="/challenges"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] group/btn transition-all hover:gap-2"
                    >
                      <span>ดูภารกิจชาเลนจ์</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Step 2: HubXP */}
                <div className="flex flex-col justify-between space-y-4 pt-6 md:pt-0 md:px-6 group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-2xl bg-blue-50 text-[#2B527A] border border-blue-200/80 font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-[#2B527A] group-hover:text-white transition-all duration-300">
                        02
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80">
                        HubXP Points
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#2B527A] transition-colors">
                        2. สะสมแต้ม HubXP อัปเลเวล
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-normal">
                        ทุกการเช็คอินเข้างาน จอยตี้เพื่อนใหม่ หรือแชร์โมเมนต์ความสุข จะถูกแปลงเป็นคะแนน HubXP เพื่อไต่อันดับและปลดล็อกสถานะสมาชิกพิเศษ
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 pt-1">
                      <Zap className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                      <span>รับแต้มอัตโนมัติเมื่อร่วมกิจกรรมจริง</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href="/myhub"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2B527A] hover:text-[#1F3D5C] group/btn transition-all hover:gap-2"
                    >
                      <span>เช็คคะแนนและระดับสมาชิก</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Step 3: Perks */}
                <div className="flex flex-col justify-between space-y-4 pt-6 md:pt-0 md:pl-6 group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-2xl bg-orange-50 text-[#F26430] border border-orange-200/80 font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-[#F26430] group-hover:text-white transition-all duration-300">
                        03
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#C2410C] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/80">
                        Lifestyle Perks
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#F26430] transition-colors">
                        3. แลกรับสิทธิ์พิเศษ & ส่วนลด
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-normal">
                        นำแต้ม HubXP ที่สะสมได้ไปแลกรับเวาเชอร์ส่วนลดคาเฟ่ สิทธิ์เข้างานนิทรรศการรอบพิเศษ และของรางวัลจากพาร์ทเนอร์ชั้นนำมากมาย
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 pt-1">
                      <Gift className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                      <span>แลกใช้งานได้จริงผ่านแอป MyHub</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href="/myhub"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F26430] hover:text-[#D95322] group/btn transition-all hover:gap-2"
                    >
                      <span>สำรวจรางวัลไลฟ์สไตล์</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 5: CALL TO ACTION (The Luminous Finale Stage - Option 1)
           ========================================================================= */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="bg-gradient-to-b from-white via-slate-50/50 to-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 p-8 sm:p-14 text-center space-y-6 shadow-[0_8px_35px_-10px_rgba(0,0,0,0.04)] relative overflow-hidden">
            
            {/* Soft Ambient Aurora Corner Glows */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-orange-100/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-100/25 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 relative z-10 max-w-4xl mx-auto">
              
              {/* Trust Micro-Pills */}
              <div className="flex items-center justify-center gap-2 flex-wrap pb-1">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>Safe Space 100%</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 border border-orange-200/80 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#F26430]" />
                  <span>สมัครฟรี ไม่มีค่าใช้จ่าย</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 sm:whitespace-nowrap">
                พร้อมเริ่มออกไปค้นพบความสุขใหม่ๆ หรือยัง?
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
                เลือกจุดฮีลใจใกล้ตัว ค้นหากิจกรรมที่คุณชอบ หรือชวนเพื่อนคอเดียวกันไปเปิดประสบการณ์ใหม่ แล้วปล่อยให้พลังบวกเกิดขึ้นเอง!
              </p>
            </div>

            <div className="pt-2 relative z-10 flex justify-center">
              <Link
                href="/"
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-full font-black text-sm sm:text-base transition-all shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 flex items-center gap-2.5 cursor-pointer group"
              >
                <span>เริ่มความสนุกกับ Chill & Connect Hub กันเลย</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-6 text-center text-xs text-slate-500 space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
          <BrandLogo size="xs" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600 text-xs">Lifestyle Discovery & Community Engagement Platform ระดับประเทศ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Auth Login / Signup Popup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${name}! เข้าสู่ระบบเรียบร้อย 🎉`);
        }}
      />

      {/* Logout Confirmation Popup Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว (Guest View)');
        }}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย! 🎉`);
        }}
      />

      {/* Mobile Nav Bar */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
