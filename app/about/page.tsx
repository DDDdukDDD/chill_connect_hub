'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { EventItem } from '@/data/mockData';
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
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isLoggedIn');
      if (saved === 'false') {
        setIsLoggedIn(false);
      } else {
        localStorage.setItem('isLoggedIn', 'true');
      }
    }
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    setIsLoggedIn(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
  };

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
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        
        {/* =========================================================================
            SECTION 1: HERO STORY BANNER (Balanced & Punchy)
           ========================================================================= */}
        <section className="bg-white py-10 sm:py-14 border-b border-slate-100 relative overflow-hidden">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
            
            {/* Platform Tag Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#4A7C59] bg-[#EBF3ED] px-4 py-1.5 rounded-full border border-[#4A7C59]/20 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>Lifestyle Discovery & Community Engagement Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug max-w-3xl mx-auto">
              แพลตฟอร์มค้นพบไลฟ์สไตล์ <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#F26430] via-[#E8590C] to-[#4A7C59] bg-clip-text text-transparent">
                สำหรับคนชอบออกไปใช้ชีวิต
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              <strong>Chill & Connect Hub</strong> คือศูนย์กลางที่รวม <span className="text-[#F26430] font-bold">สถานที่เที่ยว & จุดฮีลใจ</span>, <span className="text-[#4A7C59] font-bold">กิจกรรมและอีเวนต์</span>, และ <span className="text-[#2B527A] font-bold">เพื่อนร่วมทางคอเดียวกัน</span> เข้าไว้ในที่เดียว เพื่อให้ทุกวันหยุดของคุณมีความหมายและเติมเต็มพลังบวกได้ทุกวัน 🌿✨
            </p>

            {/* Impact Stats Banner (Compact & Aesthetic) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-3">
              {[
                { label: 'ผู้ใช้งานต่อวัน', val: '10,000+', icon: <Users className="w-4 h-4 text-[#F26430]" />, color: 'border-orange-100 hover:border-orange-300' },
                { label: 'สถานที่ & อีเวนต์', val: '1,000+', icon: <Compass className="w-4 h-4 text-[#4A7C59]" />, color: 'border-emerald-100 hover:border-emerald-300' },
                { label: 'มิตรภาพ & ตี้กลุ่มย่อย', val: '3,500+', icon: <Sparkles className="w-4 h-4 text-[#2B527A]" />, color: 'border-blue-100 hover:border-blue-300' },
                { label: 'Safe Space Community', val: '100%', icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, color: 'border-teal-100 hover:border-teal-300' },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-white p-3.5 rounded-2xl border ${stat.color} shadow-2xs text-center space-y-0.5 transition-all`}>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">{stat.val}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 2: INFOGRAPHIC USER JOURNEY (Connected 4 Steps Flow)
           ========================================================================= */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2B527A] bg-[#EBF2F7] px-3.5 py-1 rounded-full border border-[#2B527A]/20 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-[#2B527A]" />
              <span>Infographic: Platform User Journey</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              เส้นทางการใช้งานที่เชื่อมโยงทุกฟังก์ชันอย่างไร้รอยต่อ 🚀
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              ตั้งแต่การค้นหาสถานที่ จนถึงการออกไปเจอเพื่อนและสะสมรางวัล เป็นเรื่องง่ายและสนุก
            </p>
          </div>

          {/* 4-Step Connected Infographic Journey Container */}
          <div className="relative">
            
            {/* Desktop Connecting Track Behind Cards */}
            <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-1 bg-gradient-to-r from-orange-200 via-emerald-200 via-blue-200 to-purple-200 -translate-y-12 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
              
              {/* STEP 1: DISCOVER */}
              <div className="bg-white rounded-3xl p-5 border-2 border-orange-100 hover:border-[#F26430] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-[#F26430]" />
                
                <div className="space-y-3">
                  {/* Header: Step + Icon + Tag */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        01
                      </span>
                      <span className="w-7 h-7 rounded-xl bg-orange-50 text-[#F26430] flex items-center justify-center border border-orange-200/80">
                        <Compass className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/80">
                      Where & What
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      1. ค้นพบสถานที่ & อีเวนต์
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ค้นหาจุดฮีลใจและแลนด์มาร์กทั่วไทย พร้อมระบบเรดาร์ <strong>[ 🎯 ใกล้ฉัน ]</strong> คำนวณระยะทางจาก GPS จริง
                    </p>
                  </div>

                  {/* Micro Feature Badges */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                      <span>77 จังหวัดทั่วประเทศไทย</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <Sparkles className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                      <span>AI คัดกรองอีเวนต์สดใหม่</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <Link
                    href="/"
                    className="w-full bg-orange-50 hover:bg-[#F26430] text-[#F26430] hover:text-white py-1.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>สำรวจสถานที่ & อีเวนต์</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* STEP 2: CONNECT */}
              <div className="bg-white rounded-3xl p-5 border-2 border-emerald-100 hover:border-[#4A7C59] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-[#4A7C59]" />
                
                <div className="space-y-3">
                  {/* Header: Step + Icon + Tag */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-[#4A7C59] text-white font-black text-xs flex items-center justify-center shadow-xs">
                        02
                      </span>
                      <span className="w-7 h-7 rounded-xl bg-emerald-50 text-[#4A7C59] flex items-center justify-center border border-emerald-200/80">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      Who to go with
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      2. รวมตี้ & บัดดี้คอเดียวกัน
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เปิดตี้หรือจอยกลุ่มย่อย <strong>(Sub-activities)</strong> เช่น กาแฟ, วิ่ง, บอร์ดเกม มี Host ดูแลอบอุ่น สบายใจ ไร้แรงกดดัน
                    </p>
                  </div>

                  {/* Micro Feature Badges */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                      <span>100% Introvert-Friendly</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <MessageCircle className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                      <span>ห้องแชตกลุ่มเตรียมนัดพบ</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <Link
                    href="/"
                    className="w-full bg-emerald-50 hover:bg-[#4A7C59] text-[#4A7C59] hover:text-white py-1.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>ค้นหาตี้และเพื่อนร่วมทาง</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* STEP 3: ENGAGE & QUESTS */}
              <div className="bg-white rounded-3xl p-5 border-2 border-blue-100 hover:border-[#2B527A] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-[#2B527A]" />
                
                <div className="space-y-3">
                  {/* Header: Step + Icon + Tag */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-[#2B527A] text-white font-black text-xs flex items-center justify-center shadow-xs">
                        03
                      </span>
                      <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#2B527A] flex items-center justify-center border border-blue-200/80">
                        <Trophy className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                      Gamification
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      3. ทำเควสต์ & เช็คอิน E-Ticket
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      แตะรับภารกิจชาเลนจ์ เช็คอินด้วย QR E-Ticket หน้างาน รับเหรียญตรา Badge และสะสมแต้ม <strong>💎 XP</strong>
                    </p>
                  </div>

                  {/* Micro Feature Badges */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <QrCode className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                      <span>สแกนตั๋ว QR Code เช็คอิน</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <Award className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                      <span>สะสมเหรียญ Badges & XP</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <Link
                    href="/challenges"
                    className="w-full bg-blue-50 hover:bg-[#2B527A] text-[#2B527A] hover:text-white py-1.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>ดูเควสต์ & ชาเลนจ์</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* STEP 4: SHARE & REWARDS */}
              <div className="bg-white rounded-3xl p-5 border-2 border-purple-100 hover:border-purple-600 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-400 to-purple-600" />
                
                <div className="space-y-3">
                  {/* Header: Step + Icon + Tag */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        04
                      </span>
                      <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80">
                        <Gift className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/80">
                      Share & Perks
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      4. แชร์โมเมนต์ & แลกรางวัล
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      โพสต์ภาพความประทับใจลง <strong>Moments Feed</strong> และนำแต้ม XP ไปแลกรับเวาเชอร์ส่วนลดเครื่องดื่มใน <strong>MyHub</strong>
                    </p>
                  </div>

                  {/* Micro Feature Badges */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <Camera className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Moments โซเชียลฟีดจริง</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <Gift className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>แลกรับของรางวัลและส่วนลด</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <Link
                    href="/moments"
                    className="w-full bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white py-1.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>เปิดดู Moments ฟีด</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* =========================================================================
            SECTION 3: 3 CORE PILLARS (Editorial Visual Showcase)
           ========================================================================= */}
        <section className="bg-[#F8FAFC] py-12 sm:py-16 border-y border-slate-200/80">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="text-center space-y-2 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F26430] bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 shadow-2xs">
                <Target className="w-3.5 h-3.5 text-[#F26430]" />
                <span>3 เสาหลักของ Chill & Connect Hub</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                คำตอบครบทุกมิติของการออกไปใช้ชีวิต 🎯
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-xl mx-auto">
                ตอบ 3 คำถามสำคัญ เพื่อให้การวางแผนวันหยุดและการออกไปเปิดประสบการณ์ใหม่ของคุณง่ายและมีความสุขที่สุด
              </p>
            </div>

            {/* 3 Editorial Showcase Cards with Visual Imagery */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Pillar 1: Where to go */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
                <div>
                  {/* Visual Cover */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80"
                      alt="Lifestyle Spots & Parks"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />
                    
                    {/* Floating Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs text-[11px] font-black text-[#F26430] border border-white/50">
                      <MapPin className="w-3 h-3" />
                      <span>WHERE TO GO</span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="text-base sm:text-lg font-black tracking-tight">1. สถานที่เที่ยว & จุดฮีลใจ</div>
                      <div className="text-[11px] text-slate-200 font-medium">ไม่รู้จะไปไหน ให้เราช่วยคัดสรรพิกัดที่ดีที่สุด</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      คลังข้อมูลจุดเช็คอิน สวนสาธารณะ คาเฟ่ Slow Bar หอศิลป์ มิวเซียม และธรรมชาติคัดสรร <strong>ครบทั้ง 77 จังหวัดทั่วไทย</strong> อัปเดตพิกัด เวลาเปิด-ปิด และไฮไลท์ครบถ้วน
                    </p>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 bg-orange-50/70 p-2 rounded-xl border border-orange-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                        <span>เรดาร์ [ 🎯 ใกล้ฉัน ] คำนวณระยะทางจาก GPS จริง</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 bg-orange-50/70 p-2 rounded-xl border border-orange-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                        <span>คลังภาพความละเอียดสูง & Vibe Tags ตรงปก</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href="/"
                    className="w-full bg-[#F26430] hover:bg-[#D95322] text-white py-2 px-3 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <span>สำรวจจุดฮีลใจ 77 จังหวัด</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pillar 2: What to do */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
                <div>
                  {/* Visual Cover */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"
                      alt="Events & Workshops"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />
                    
                    {/* Floating Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs text-[11px] font-black text-[#4A7C59] border border-white/50">
                      <Calendar className="w-3 h-3" />
                      <span>WHAT TO DO</span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="text-base sm:text-lg font-black tracking-tight">2. กิจกรรมและอีเวนต์สดใหม่</div>
                      <div className="text-[11px] text-slate-200 font-medium">วันหยุดนี้ไม่มีเบื่อ รวมทุกงานแฟร์ & เวิร์กช็อป</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      ศูนย์รวมงานอีเวนต์ คอนเสิร์ต งานแฟร์ เวิร์กช็อปศิลปะ วิ่งมาราธอน และกิจกรรมไลฟ์สไตล์ อัปเดตสดใหม่ผ่านระบบ <strong>AI Aggregator Engine</strong> คุณภาพสูง
                    </p>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                        <span>AI จัดหมวดหมู่และกรองงานซ้ำ 100%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                        <span>ระบบตั๋ว E-Ticket ดิจิทัล เช็คอินสะดวก</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href="/"
                    className="w-full bg-[#4A7C59] hover:bg-[#3B6447] text-white py-2 px-3 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <span>ค้นหากิจกรรมและงานแฟร์</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pillar 3: Who to go with */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
                <div>
                  {/* Visual Cover */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
                      alt="Community & Friends"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />
                    
                    {/* Floating Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs text-[11px] font-black text-[#2B527A] border border-white/50">
                      <Users className="w-3 h-3" />
                      <span>WHO TO GO WITH</span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="text-base sm:text-lg font-black tracking-tight">3. เพื่อนและคอมมูนิตี้คอเดียวกัน</div>
                      <div className="text-[11px] text-slate-200 font-medium">ไม่ต้องไปคนเดียว ชวนเพื่อนใหม่ในเซฟสเปซ</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      เชื่อมต่อมิตรภาพอบอุ่นผ่านระบบ <strong>Buddy Matcher & Sub-activities</strong> ตั้งตี้กลุ่มย่อย จิบกาแฟ วิ่ง บอร์ดเกม พร้อมระบบ <strong>เควสต์ชาเลนจ์ & แต้ม XP</strong>
                    </p>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                        <span>100% Introvert-Friendly มี Host คอยต้อนรับ</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                        <span>สะสมแต้ม XP แลกรับส่วนลดและของรางวัล</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href="/"
                    className="w-full bg-[#2B527A] hover:bg-[#1F3D5C] text-white py-2 px-3 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <span>หาตี้และเพื่อนร่วมทาง</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 4: ALL-IN-ONE LIFESTYLE ADVANTAGES (Spots + Activities + Community)
           ========================================================================= */}
        <section className="bg-white py-10 sm:py-14 border-b border-slate-100">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
            
            <div className="max-w-3xl mx-auto text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A7C59] bg-[#EBF3ED] px-3.5 py-1 rounded-full border border-[#4A7C59]/20 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span>ออกแบบเพื่อตอบโจทย์คนชอบออกไปใช้ชีวิตทุกคน (All-in-One Lifestyle Hub)</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
                "หาสถานที่โดนใจ สร้างกิจกรรมสุดมันส์ พบเพื่อนใหม่คอเดียวกัน" ✨
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                ไม่ว่าจะอยากเที่ยวคนเดียวชิลๆ ชวนกลุ่มเพื่อนสนิท หรือเปิดตี้หากลุ่มเพื่อนใหม่ Chill & Connect Hub พร้อมตอบโจทย์ทุกไลฟ์สไตล์อย่างลงตัว:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { 
                  title: 'ค้นพบสถานที่ & จุดฮีลใจ 77 จังหวัด', 
                  desc: 'รวมคลังพิกัดลับ คาเฟ่ Slow Bar สวนสาธารณะ และธรรมชาติทั่วไทย พร้อมระบบเรดาร์ [ ใกล้ฉัน ] ช่วยแนะนำจุดเช็คอินตามพิกัดจริง',
                  icon: <MapPin className="w-5 h-5 text-[#F26430]" />,
                  bg: 'bg-orange-50 border-orange-100',
                  hover: 'hover:border-orange-300',
                  tag: 'Where to go',
                  tagColor: 'text-[#F26430] bg-orange-50 border-orange-200/60'
                },
                { 
                  title: 'สร้าง & จอยกิจกรรมหลากหลายสุดสนุก', 
                  desc: 'ทั้งสายวิ่ง จิบกาแฟ บอร์ดเกม เวิร์กช็อปศิลปะ และคอนเสิร์ต คุณสามารถเปิดตี้เป็น Host เองได้ง่ายๆ หรือกดจอยงานที่สนใจได้ทันที',
                  icon: <Sparkles className="w-5 h-5 text-[#4A7C59]" />,
                  bg: 'bg-emerald-50 border-emerald-100',
                  hover: 'hover:border-emerald-300',
                  tag: 'What to do',
                  tagColor: 'text-[#4A7C59] bg-emerald-50 border-emerald-200/60'
                },
                { 
                  title: 'พบเพื่อนใหม่ & คอมมูนิตี้ที่อบอุ่น', 
                  desc: 'เชื่อมต่อมิตรภาพผ่านความชอบจริง มีระบบห้องแชตนัดพบ และบรรยากาศที่เป็นกันเอง สบายใจสำหรับทุกคนทั้ง Introvert และ Extrovert',
                  icon: <Users className="w-5 h-5 text-[#2B527A]" />,
                  bg: 'bg-blue-50 border-blue-100',
                  hover: 'hover:border-blue-300',
                  tag: 'Who to connect',
                  tagColor: 'text-[#2B527A] bg-blue-50 border-blue-200/60'
                },
              ].map((item, idx) => (
                <div key={idx} className={`bg-white p-5 rounded-2xl border border-slate-200/90 ${item.hover} shadow-xs hover:shadow-md transition-all space-y-2.5 relative overflow-hidden group`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center border group-hover:scale-105 transition-transform`}>
                      {item.icon}
                    </div>
                    <span className={`text-[10px] font-bold ${item.tagColor} px-2 py-0.5 rounded-full border uppercase tracking-wider`}>
                      {item.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 5: CALL TO ACTION (CTA BANNER)
           ========================================================================= */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="bg-gradient-to-r from-[#4A7C59] via-[#3B6347] to-[#2B527A] rounded-3xl p-7 sm:p-10 text-white text-center space-y-4 shadow-md relative overflow-hidden">
            
            <div className="space-y-1.5 relative z-10 max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                พร้อมเริ่มออกไปค้นพบความสุขใหม่ๆ หรือยัง? 🎉
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 font-normal leading-relaxed">
                เลือกจุดฮีลใจใกล้ตัว ค้นหากิจกรรมที่คุณชอบ หรือชวนเพื่อนคอเดียวกันไปเปิดประสบการณ์ใหม่ แล้วปล่อยให้พลังบวกเกิดขึ้นเอง!
              </p>
            </div>

            <div className="pt-2 relative z-10 flex justify-center">
              <Link
                href="/"
                className="bg-[#F26430] hover:bg-[#D95322] text-white px-8 py-3 rounded-full font-black text-sm sm:text-base transition-all shadow-lg shadow-black/25 hover:shadow-xl hover:scale-102 active:scale-98 flex items-center gap-2.5 cursor-pointer group"
              >
                <span>เริ่มความสนุกกับ Chill & Connect Hub กันเลย</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-6 text-center text-xs text-slate-500 space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
          <Sprout className="w-4 h-4 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600 text-xs">Lifestyle Discovery & Community Engagement Platform ระดับประเทศ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Auth Login / Signup Popup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userName) => {
          setIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${userName}! เข้าสู่ระบบเรียบร้อย 🎉`);
        }}
      />

      {/* Logout Confirmation Popup Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          setIsLoggedIn(false);
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
