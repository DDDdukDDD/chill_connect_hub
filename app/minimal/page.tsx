'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { EventGrid } from '@/components/EventGrid';
import { EventDetailModal } from '@/components/EventDetailModal';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import {
  Sparkles,
  Sun,
  ShieldCheck,
  Calendar,
  Search,
  ArrowRight,
  Zap,
  Users,
  Compass,
  Heart
} from 'lucide-react';

export default function MinimalPage() {
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  
  // Minimal Filter States
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'chill' | 'move' | 'heal' | 'learn'>('all');
  const [timeFilter, setTimeFilter] = useState<'weekend' | 'all' | 'custom'>('weekend');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic: Default to Weekend Community Events for Ultra-Focus
  const filteredEvents = MOCK_EVENTS.filter((ev) => {
    if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchTag = ev.tag.toLowerCase().includes(q);
      const matchLoc = ev.location.toLowerCase().includes(q);
      if (!matchTitle && !matchTag && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans">
      
      {/* 🌟 Version Comparison Switcher Banner */}
      <div className="bg-amber-500 text-white px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <span className="flex items-center gap-1.5 truncate">
            <Zap className="w-4 h-4 text-amber-200 shrink-0" />
            <span>กำลังแสดงดีไซน์ทดลอง: <strong>⚡ หน้าแรกใหม่ (Minimal Focus - เน้นจบใน 3 วินาที)</strong></span>
          </span>
          <Link
            href="/"
            className="bg-white text-[#1E293B] hover:bg-slate-100 px-3 py-1 rounded-full font-extrabold transition-all text-xs shrink-0 flex items-center gap-1 shadow-xs"
          >
            <span>🏡 กลับหน้าแรกเดิม (Full Hub) ➔</span>
          </Link>
        </div>
      </div>

      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
        
        {/* 1. Ultra-Focused Hero Header */}
        <section className="text-center space-y-4 pt-2">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#EBF3ED] border border-[#4A7C59]/30 text-[#4A7C59] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#4A7C59]" />
            <span>มีโฮสต์ดูแลทุกกลุ่มย่อย (4-8 คน) • Introvert Friendly 100%</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
            เสาร์-อาทิตย์นี้... <span className="text-[#F26430]">ไปชิลที่ไหนดี?</span>
          </h1>
          
          <p className="text-sm sm:text-base text-[#64748B] font-semibold max-w-lg mx-auto">
            คัดมาให้แล้วเฉพาะกิจกรรมน่าไป วงไม่ใหญ่ ไม่ต้องเกร็ง หาเพื่อนใหม่สบายใจ
          </p>

          {/* Super Simple Search Box */}
          <div className="pt-2 max-w-md mx-auto">
            <div className="flex items-center bg-white rounded-full p-2 border-2 border-[#E2DCD2] focus-within:border-[#F26430] shadow-md transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อกิจกรรม หรือสถานที่..."
                className="w-full text-sm text-[#1E293B] focus:outline-none font-medium"
              />
              <button
                className="bg-[#F26430] hover:bg-[#D95322] text-white px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0"
              >
                ค้นหา
              </button>
            </div>
          </div>
        </section>

        {/* 2. Hyper-Clean Single-Row Filter Tabs */}
        <section className="bg-white p-4 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-4">
          
          {/* Quick Date Toggle */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>ช่วงเวลา:</span>
              </span>
              <button
                onClick={() => setTimeFilter('weekend')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  timeFilter === 'weekend'
                    ? 'bg-[#F26430] text-white border-[#F26430] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ☀️ เสาร์-อาทิตย์นี้
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  timeFilter === 'all'
                    ? 'bg-[#1E293B] text-white border-[#1E293B]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ✨ ทุกวัน
              </button>
            </div>

            <span className="text-xs font-bold text-[#4A7C59] bg-[#EBF3ED] px-3 py-1 rounded-full">
              พบ {filteredEvents.length} กิจกรรม
            </span>
          </div>

          {/* Minimal Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: '✨ ทั้งหมด' },
              { id: 'chill', label: '☕ นัดชิลล์ / กาแฟ' },
              { id: 'move', label: '🏃 ออกกำลังกาย' },
              { id: 'heal', label: '🌿 ฮีลใจ & ธรรมชาติ' },
              { id: 'learn', label: '🎨 เวิร์กช็อปทำมือ' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`shrink-0 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-sm scale-102 font-extrabold'
                      : 'bg-[#FAF7F2] text-slate-700 border-[#E2DCD2] hover:border-[#4A7C59]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. High-Conversion Clean Event Cards Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>กิจกรรมแนะนำสัปดาห์นี้</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">คลิกการ์ดเพื่อดูรายละเอียด</span>
          </div>

          <EventGrid
            events={filteredEvents}
            onSelectEvent={(event) => setSelectedEvent(event)}
            favorites={[]}
            toggleFavorite={() => {}}
          />
        </section>

        {/* 4. Simple FAQ & Assurance Footer Box */}
        <section className="bg-[#FAF7F2] border-2 border-dashed border-[#C5DCCB] p-6 rounded-3xl text-center space-y-2">
          <h3 className="font-extrabold text-base text-[#1E293B]">🤝 ไปคนเดียวจะเกร็งไหม?</h3>
          <p className="text-xs text-[#64748B] max-w-lg mx-auto leading-relaxed font-medium">
            ไม่ต้องกังวลครับ! กิจกรรมชุมชนทุกวงจำกัดสมาชิกเพียง 4-8 คน และมีโฮสต์คอยต้อนรับ ชวนพูดคุยอย่างเป็นกันเอง เหมาะสำหรับคนที่อยากพักผ่อนหาเพื่อนใหม่แบบชิลๆ
          </p>
        </section>

      </main>

      {/* Modals */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onToggleFavorite={() => {}}
          isFavorite={false}
          onJoinSuccess={() => {}}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          setIsLoggedIn(true);
        }}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => setIsLoggedIn(false)}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          MOCK_EVENTS.unshift(newEvent);
        }}
      />

    </div>
  );
}
