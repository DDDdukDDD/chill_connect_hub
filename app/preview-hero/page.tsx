'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  X, 
  Dices, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Flame, 
  Heart, 
  ArrowRight, 
  Compass, 
  Users, 
  Star,
  CheckCircle2,
  Layers,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Filter
} from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';

export default function HeroComparisonLabPage() {
  const [activeConcept, setActiveConcept] = useState<'current' | 'concept1' | 'concept2' | 'concept3'>('concept1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ทั่วไทย');
  const [isFocused, setIsFocused] = useState(false);

  const QUICK_TAGS = [
    { label: '🌿 ธรรมชาติ & สวน', query: 'สวน', color: 'bg-emerald-50 text-[#4A7C59] border-emerald-200' },
    { label: '☕ คาเฟ่ Slow Bar', query: 'คาเฟ่', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { label: '🎨 หอศิลป์ & คราฟต์', query: 'หอศิลป์', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { label: '🏃‍♂️ วิ่ง & HYROX', query: 'งานวิ่ง', color: 'bg-orange-50 text-[#F26430] border-orange-200' },
    { label: '🎪 มหกรรม & งานแฟร์', query: 'งานอีเวนต์', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    { label: '🧘 โยคะ & สมาธิ', query: 'โยคะ', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1E293B] font-sans pb-24 selection:bg-[#F26430] selection:text-white">
      
      {/* Top Sticky Header for Lab Controller */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-[#4A7C59] flex items-center gap-1 transition-colors"
            >
              ← กลับหน้าแรก
            </Link>
            <div className="h-4 w-px bg-slate-300 hidden sm:block" />
            <h1 className="text-sm sm:text-base font-extrabold text-[#1E293B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F26430]" />
              Hero Section Comparison Lab (เปรียบเทียบดีไซน์หน้าแรก)
            </h1>
          </div>

          {/* Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveConcept('concept1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeConcept === 'concept1'
                  ? 'bg-[#4A7C59] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>1. Clean Editorial (แนะนำ)</span>
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full">Modern</span>
            </button>

            <button
              onClick={() => setActiveConcept('concept2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeConcept === 'concept2'
                  ? 'bg-[#F26430] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>2. Asymmetric Split</span>
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full">Magazine</span>
            </button>

            <button
              onClick={() => setActiveConcept('concept3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeConcept === 'concept3'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>3. Compact Feed-First</span>
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full">Minimal</span>
            </button>

            <button
              onClick={() => setActiveConcept('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeConcept === 'current'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <span>0. แบบปัจจุบัน</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">Classic</span>
            </button>
          </div>
        </div>
      </header>

      {/* Description Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#4A7C59]">
                {activeConcept === 'concept1' && 'แบบที่ 1: Clean Editorial & Floating Search Capsule'}
                {activeConcept === 'concept2' && 'แบบที่ 2: Asymmetric Split Hero (Live Featured of the Day)'}
                {activeConcept === 'concept3' && 'แบบที่ 3: Ultra Compact & Feed-First (เน้นเนื้อหาขึ้นมาเร็ว)'}
                {activeConcept === 'current' && 'แบบปัจจุบัน: Classic Full-bleed Photo Banner with Overlay'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              {activeConcept === 'concept1' && 'ดีไซน์สไตล์ Airbnb / Notion ยุคใหม่: พื้นหลังคลีนสว่าง Typography ชัดเจน ตัวหนังสือคมอ่านง่าย พร้อมกล่องค้นหาแบบ Floating Multi-Segment และ Quick Pills ด้านล่าง'}
              {activeConcept === 'concept2' && 'ดีไซน์สไตล์นิตยสาร Kinfolk / Contemporary: ฝั่งซ้ายเป็น Typography + Search สบายตา ส่วนฝั่งขวาเป็นการ์ดไฮไลต์ Spot/Event เด่นประจำวัน คมชัด ไม่โดนฟิลเตอร์มืดทับ'}
              {activeConcept === 'concept3' && 'ดีไซน์สไตล์ Pinterest / Linear: ลดความสูงส่วนหัวให้บางที่สุด เพื่อให้แท็บ 77 จังหวัด และ Feed ที่เที่ยวลอยขึ้นมาให้เห็นทันทีในหน้าจอแรก'}
              {activeConcept === 'current' && 'แบบเดิมที่ใช้อยู่: ภาพพื้นหลังแบนเนอร์ครอบคลุมทั้งกรอบ พร้อมดาร์กโอเวอร์เลย์สีเข้ม'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-slate-400">ทดสอบกดเล่น & สลับดูความรู้สึกได้แบบ Real-time</span>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE CONCEPT */}
      <div className="mt-6">
        {/* ========================================================================= */}
        {/* CONCEPT 1: Clean Editorial & Floating Capsule (RECOMMENDED) */}
        {/* ========================================================================= */}
        {activeConcept === 'concept1' && (
          <section className="relative overflow-hidden pt-3 pb-5 sm:pt-5 sm:pb-7 bg-gradient-to-b from-[#F7F4EE] via-[#FAF8F5] to-[#FDFCFB] border-y border-amber-100/60">
            {/* Subtle Ambient Decorative Glows */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#4A7C59]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-[#F26430]/8 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-3 sm:space-y-4">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-emerald-200/80 shadow-2xs text-[11px] font-bold text-[#4A7C59] animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-[#F26430]" />
                <span>ศูนย์รวม 460+ พิกัดฮีลใจ & 100+ อีเวนต์ทั่วไทย</span>
              </div>

              {/* High-Impact Clean Editorial Headline */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight leading-tight">
                  วันหยุดนี้... <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4A7C59] via-[#2D5A3C] to-[#F26430]">ไปไหนดี?</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mx-auto">
                  ค้นพบสถานที่ฮีลใจ เวิร์กช็อปสร้างแรงบันดาลใจ และเชื่อมต่อเพื่อนใหม่ที่มีไลฟ์สไตล์ตรงใจคุณ
                </p>
              </div>

              {/* Modern Floating Search Capsule */}
              <div className="max-w-3xl mx-auto pt-1">
                <div className="bg-white rounded-xl sm:rounded-full p-1.5 sm:p-2 shadow-lg shadow-slate-200/60 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-1.5 transition-all focus-within:ring-4 focus-within:ring-[#4A7C59]/15 focus-within:border-[#4A7C59]">
                  
                  {/* Segment 1: Main Query Search */}
                  <div className="flex items-center gap-2 flex-1 px-3 py-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหากิจกรรม, สวน, คาเฟ่, งานวิ่ง, ย่านเก่า..."
                      className="w-full bg-transparent text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none font-medium"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-6 bg-slate-200 my-auto" />

                  {/* Segment 2: Quick Region / Province Picker */}
                  <div className="flex items-center gap-1.5 px-3 py-1 w-full sm:w-auto text-left justify-between sm:justify-start">
                    <MapPin className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    <select 
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="bg-transparent text-xs sm:text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="ทั่วไทย">🇹🇭 ทุกจังหวัด (77 จว.)</option>
                      <option value="กรุงเทพมหานคร">📍 กรุงเทพฯ</option>
                      <option value="เชียงใหม่">🌲 เชียงใหม่</option>
                      <option value="ภูเก็ต">🌊 ภูเก็ต</option>
                      <option value="ชลบุรี">🏖️ ชลบุรี (พัทยา/บางแสน)</option>
                    </select>
                  </div>

                  {/* Segment 3: Surprise / Roll Dice Action */}
                  <button
                    title="สุ่มพิกัดเที่ยวฮีลใจ"
                    className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#4A7C59] hover:bg-emerald-50 rounded-full transition-colors shrink-0"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>สุ่มพิกัด</span>
                  </button>

                  {/* CTA Search Button */}
                  <button className="w-full sm:w-auto bg-[#4A7C59] hover:bg-[#3B6447] text-white px-5 sm:px-6 py-2 rounded-lg sm:rounded-full font-black text-xs sm:text-sm transition-all shadow-md shadow-[#4A7C59]/25 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer">
                    <Search className="w-3.5 h-3.5" />
                    <span>ค้นหาเลย</span>
                  </button>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* CONCEPT 2: Asymmetric Split Hero (Kinfolk / Contemporary Magazine) */}
        {/* ========================================================================= */}
        {activeConcept === 'concept2' && (
          <section className="pt-4 pb-8 sm:pt-8 sm:pb-12 bg-white border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Column: Headline & Action (7 Cols) */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                    <Flame className="w-3.5 h-3.5 text-[#F26430]" />
                    <span>Lifestyle & Community Discovery Platform</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1E293B] tracking-tight leading-[1.15]">
                    ค้นพบจุดฮีลใจ <br />
                    และกิจกรรมที่ทำให้ <br />
                    <span className="text-[#F26430] underline decoration-[#F26430]/30 underline-offset-8">วันหยุดมีความหมาย</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 max-w-lg">
                    แพลตฟอร์มรวบรวม 460+ ที่เที่ยว 77 จังหวัด และอีเวนต์คอมมูนิตี้สำหรับคนรุ่นใหม่ที่รักการพักผ่อนและหาเพื่อนร่วมทาง
                  </p>

                  {/* Clean High-Contrast Search Input */}
                  <div className="relative max-w-xl">
                    <div className="flex items-center bg-slate-50 rounded-2xl p-2 border-2 border-slate-200 focus-within:border-[#F26430] focus-within:bg-white transition-all shadow-sm">
                      <div className="pl-3 pr-2 text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="พิมพ์สถานที่, ย่าน หรือกิจกรรมที่สนใจ..."
                        className="w-full bg-transparent text-sm sm:text-base text-[#1E293B] placeholder-slate-400 focus:outline-none font-medium pr-2"
                      />
                      <button className="bg-[#F26430] hover:bg-[#D95322] text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md shadow-[#F26430]/20 shrink-0">
                        ค้นหา
                      </button>
                    </div>
                  </div>

                  {/* Community Trust Stats */}
                  <div className="pt-2 flex items-center gap-6 border-t border-slate-100">
                    <div>
                      <p className="text-xl font-black text-[#4A7C59]">460+</p>
                      <p className="text-[11px] font-bold text-slate-500">พิกัด 77 จังหวัด</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <p className="text-xl font-black text-[#F26430]">100%</p>
                      <p className="text-[11px] font-bold text-slate-500">Safe Community</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <p className="text-xl font-black text-slate-800">4.9 ★</p>
                      <p className="text-[11px] font-bold text-slate-500">เรตติ้งเฉลี่ย</p>
                    </div>
                  </div>

                </div>

                {/* Right Column: Featured Spot / Event of the Day Card (5 Cols) */}
                <div className="lg:col-span-5">
                  <div className="relative group bg-[#FAF7F2] rounded-3xl p-3 border border-amber-200/80 shadow-xl transition-all hover:shadow-2xl">
                    <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80"
                        alt="Spot of the day"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-extrabold text-[#4A7C59] shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-[#F26430]" />
                        <span>Spot of the Day (แนะนำวันนี้)</span>
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 text-white text-left space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                          <span>📍 กรุงเทพมหานคร</span>
                          <span>•</span>
                          <span>★ 4.9 (1,240 รีวิว)</span>
                        </div>
                        <h3 className="text-lg font-black text-white">สวนเบญจกิติ (ป่าใจกลางเมือง)</h3>
                        <p className="text-xs text-slate-200 line-clamp-1">พื้นที่สีเขียวขนาดใหญ่ สะพานลอยฟ้า Skywalk วิวพระอาทิตย์ตกดิน</p>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="bg-emerald-100 text-[#4A7C59] px-2 py-0.5 rounded-md">เข้าฟรี</span>
                        <span>เปิด 05:00 - 21:00 น.</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#F26430] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        ดูรายละเอียด <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* CONCEPT 3: Ultra Compact & Feed-First (Minimalist App Style) */}
        {/* ========================================================================= */}
        {activeConcept === 'concept3' && (
          <section className="pt-3 pb-4 bg-white border-y border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              
              {/* Compact Search & Action Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#FAF7F2] p-2 sm:p-2.5 rounded-2xl border border-[#E8E2D8]">
                
                {/* Micro Brand / Title */}
                <div className="flex items-center gap-2 px-2 text-left w-full md:w-auto">
                  <div className="w-8 h-8 rounded-xl bg-[#4A7C59] flex items-center justify-center text-white font-black text-sm">
                    🌿
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-[#1E293B] leading-none">Chill & Connect Hub</h2>
                    <p className="text-[11px] font-medium text-slate-500">460+ พิกัดเที่ยว & อีเวนต์ทั่วไทย</p>
                  </div>
                </div>

                {/* Compact Search Box */}
                <div className="flex-1 max-w-xl w-full">
                  <div className="flex items-center bg-white rounded-xl px-3 py-1.5 border border-slate-300 focus-within:border-[#4A7C59] shadow-2xs">
                    <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาที่เที่ยว, งานแฟร์, กิจกรรม..."
                      className="w-full bg-transparent text-xs sm:text-sm text-[#1E293B] placeholder-slate-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-slate-400 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Surprise Button */}
                <button className="w-full md:w-auto px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-xs font-bold text-[#4A7C59] flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                  <Dices className="w-3.5 h-3.5 text-[#F26430]" />
                  <span>สุ่มพิกัดวันนี้</span>
                </button>

              </div>

              {/* Instant Category Ribbon */}
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {QUICK_TAGS.map((tag, idx) => (
                  <button
                    key={`c3-tag-${idx}`}
                    onClick={() => setSearchQuery(tag.query)}
                    className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* CONCEPT 0: Current Version (Classic Dark Photo Overlay Banner) */}
        {/* ========================================================================= */}
        {activeConcept === 'current' && (
          <div>
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchSubmit={() => {}}
            />
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* SIMULATED PAGE CONTENT (TO SHOW HOW IT FLOWS INTO CATALOG TABS) */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Tab Switcher Simulation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex items-center justify-center gap-2 max-w-xl mx-auto mb-8">
          <button className="flex-1 py-2.5 px-4 rounded-xl bg-[#4A7C59] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm">
            <span>🌿 ที่เที่ยว & จุดฮีลใจ 77 จังหวัด</span>
          </button>
          <button className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors">
            <span>🎪 งานแฟร์ & มหกรรม</span>
          </button>
          <button className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors">
            <span>💬 คอมมูนิตี้</span>
          </button>
        </div>

        {/* Mock Sample Spot Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-48 bg-slate-100 relative">
              <img src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&q=80" alt="spot" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-white/90 text-xs font-bold px-2.5 py-1 rounded-full text-[#4A7C59]">🌳 สวนสาธารณะ</span>
            </div>
            <div className="p-4 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">📍 กรุงเทพฯ</span>
                <span className="text-xs font-extrabold text-amber-500">★ 4.9</span>
              </div>
              <h3 className="font-extrabold text-base text-[#1E293B]">สวนเบญจกิติ (ป่าใจกลางเมือง)</h3>
              <p className="text-xs text-slate-500 line-clamp-2">สะพาน Skywalk และพื้นที่ชุ่มน้ำขนาดใหญ่ใจกลางกรุงเทพฯ สเปซยอดฮิตในการวิ่งและนั่งรับลม</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-48 bg-slate-100 relative">
              <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80" alt="spot" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-white/90 text-xs font-bold px-2.5 py-1 rounded-full text-amber-800">☕ คาเฟ่ Slow Bar</span>
            </div>
            <div className="p-4 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">📍 เชียงใหม่</span>
                <span className="text-xs font-extrabold text-amber-500">★ 4.9</span>
              </div>
              <h3 className="font-extrabold text-base text-[#1E293B]">บ้านข้างวัด (Baan Kang Wat)</h3>
              <p className="text-xs text-slate-500 line-clamp-2">ชุมชนคราฟต์ไม้และคาเฟ่ท่ามกลางสวนร่มรื่น สัมผัสความสโลว์ไลฟ์และงานศิลปะ</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-48 bg-slate-100 relative">
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" alt="spot" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-white/90 text-xs font-bold px-2.5 py-1 rounded-full text-indigo-800">🌅 ทะเล & ธรรมชาติ</span>
            </div>
            <div className="p-4 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">📍 ภูเก็ต</span>
                <span className="text-xs font-extrabold text-amber-500">★ 4.8</span>
              </div>
              <h3 className="font-extrabold text-base text-[#1E293B]">แหลมพรหมเทพ (Promthep Cape)</h3>
              <p className="text-xs text-slate-500 line-clamp-2">จุดชมพระอาทิตย์ตกดินที่สวยและมีชื่อเสียงที่สุดแห่งหนึ่งในเอเชีย บรรยากาศโรแมนติก</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
