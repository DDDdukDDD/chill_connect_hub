'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventDetailModal } from '@/components/EventDetailModal';
import { isEventEnded } from '@/lib/dateUtils';
import { EventItem } from '@/data/mockData';
import {
  Calendar,
  MapPin,
  Clock,
  Share2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  ExternalLink,
  Heart,
  Compass,
  Check,
  SplitSquareVertical,
  Layers,
  Sprout,
} from 'lucide-react';

export default function MyHubMinimalPage() {
  const [activeNavTab, setActiveNavTab] = useState('myhub');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['min-expo-1', 'min-comm-1']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Minimalist Personal Events
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'min-expo-1',
      title: 'ไทยเที่ยวไทย ครั้งที่ 71 @ ศูนย์การประชุมแห่งชาติสิริกิติ์',
      category: 'chill',
      tag: 'มหกรรมท่องเที่ยว',
      date: '22 - 25 ส.ค. 2026',
      time: '10:00 - 21:00 น.',
      location: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
      price: 'เข้าชมฟรี',
      description: 'มหกรรมท่องเที่ยวไทยที่ยิ่งใหญ่ที่สุดแห่งปี ดีลโรงแรม ที่พัก แพ็กเกจท่องเที่ยวลดสูงสุด 70% ชวนเพื่อนๆ และครอบครัวมาเลือกแพ็กเกจเที่ยวสบายกระเป๋า',
      hostName: 'ศูนย์การประชุมแห่งชาติสิริกิติ์',
      hostAvatar: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=120&q=80',
      eventType: 'public_venue',
      venueTag: 'qsncc',
      externalUrl: 'https://www.qsncc.com/th/event-calendar',
      participantsCount: 840,
      maxParticipants: 5000,
    },
    {
      id: 'min-comm-1',
      title: 'City Sunset Run & Recovery Stretch (วิ่งรับลม สวนเบญจกิติ)',
      category: 'move',
      tag: 'วิ่งเพื่อสุขภาพ',
      date: 'เสาร์ 23 ส.ค. 2026',
      time: '17:30 - 19:30 น.',
      location: 'ลานหน้าอาคารกระจก สวนเบญจกิติ',
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
      price: 'ฟรี',
      description: 'วิ่งรับลมสบายๆ ระยะทาง 5 กม. เพซ 6.30 - 7.00 พร้อมคูลดาวน์และยืดเหยียดกล้ามเนื้อ เหมาะสำหรับทั้งมือใหม่และนักวิ่งเพื่อสุขภาพ',
      hostName: 'โค้ชกานต์',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      eventType: 'community',
      participantsCount: 16,
      maxParticipants: 20,
    },
    {
      id: 'min-comm-2',
      title: 'Specialty Coffee Slow Bar & คุยภาษาอังกฤษชิลล์ๆ ย่านอารีย์',
      category: 'chill',
      tag: 'กาแฟดริป & สนทนา',
      date: 'อาทิตย์ 24 ส.ค. 2026',
      time: '14:00 - 16:30 น.',
      location: 'Ari Slow Bar Lab ซอยอารีย์ 4',
      image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
      price: '฿150',
      description: 'ลิ้มลองเมล็ดกาแฟ Specialty Single Origin พร้อมนั่งคุยแลกเปลี่ยนประสบการณ์เป็นกันเอง ไม่เกร็ง ฝึกภาษาและทำความรู้จักเพื่อนใหม่',
      hostName: 'คุณมายด์',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      eventType: 'community',
      participantsCount: 8,
      maxParticipants: 10,
    },
  ]);

  // Checklist of Weekend Goals (Simple & Stress-free)
  const [checklists, setChecklists] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'เดินดูแพ็กเกจเที่ยวงานไทยเที่ยวไทย ที่ศูนย์ฯ สิริกิติ์', done: true },
    { id: '2', text: 'วิ่งรับลมช่วงพระอาทิตย์ตก 5 กม. สวนเบญจกิติ', done: false },
    { id: '3', text: 'ชิมกาแฟดริป Specialty & ฝึกสนทนาภาษาอังกฤษ อารีย์', done: false },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleChecklist = (id: string) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
    showToast('อัปเดตบันทึกเรียบร้อย ✨');
  };

  const handleRemoveEvent = (id: string, title: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast(`ลบ "${title}" ออกจากตารางแล้ว`);
  };

  const handleShareLine = (event: EventItem) => {
    const text = `ไปด้วยกันไหม! "${event.title}" 📅 วันที่ ${event.date} 📍 ที่ ${event.location}`;
    const url = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredEvents = useMemo(() => {
    if (!selectedDay) return events;
    return events.filter((ev) => (ev.date || '').includes(selectedDay.toString()));
  }, [events, selectedDay]);

  const bookedDays = [22, 23, 24, 25];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] font-sans pb-24 md:pb-16 flex flex-col justify-between">
      <div>
        <Navbar
          activeTab={activeNavTab}
          setActiveTab={setActiveNavTab}
          isLoggedIn={true}
          setIsLoggedIn={() => {}}
          onOpenLogin={() => {}}
          onOpenLogout={() => {}}
          onOpenCreateEvent={() => {}}
        />

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-xl backdrop-blur-md animate-bounce-short border border-white/20">
            {toastMessage}
          </div>
        )}

        {/* 🌟 A/B COMPARISON TOP SWITCHER BAR */}
        <div className="bg-emerald-900 text-white py-2.5 px-4 text-xs font-semibold shadow-inner">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                หน้าเปรียบเทียบ A/B Test
              </span>
              <span>✨ คุณกำลังดูแบบ: <strong>มินิมอล สบายตา (Clean & Zen)</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/myhub"
                className="bg-white text-emerald-950 hover:bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs"
              >
                ➔ สลับไปดูแบบเต็ม (Full Super-App)
              </Link>
            </div>
          </div>
        </div>

        {/* Zen Header */}
        <header className="pt-8 pb-4 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight">
                  ตารางนัด & วันหยุดของฉัน
                </h1>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  สิงหาคม 2026
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B]">
                บันทึกอีเวนต์ที่สนใจ วางแผนเที่ยว และแชร์ชวนเพื่อนได้ง่ายๆ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="bg-[#4A7C59] hover:bg-[#3B6447] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มกิจกรรมใหม่</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Clean Layout */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-8">

          {/* 1. Minimal Date Strip */}
          <section className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>เลือกดูตามวัน (สิงหาคม 2026)</span>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-[#F26430] font-bold hover:underline"
                >
                  แสดงทั้งหมด ({events.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
              {[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((day) => {
                const isBooked = bookedDays.includes(day);
                const isToday = day === 22;
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-md scale-105'
                        : isToday
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-black'
                        : isBooked
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-100'
                        : 'bg-white/60 border-slate-200 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <span className="text-[10px] font-medium opacity-75">ส.ค.</span>
                    <span className="text-sm font-black">{day}</span>
                    {isBooked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] absolute top-1.5 right-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Clean Event Cards List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E293B] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4A7C59]" />
                <span>กิจกรรมที่คุณบันทึกไว้ ({filteredEvents.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => {
                const isPublic = event.eventType === 'public_venue';
                return (
                  <div
                    key={event.id}
                    onClick={() => setDetailModalEvent(event)}
                    className="group bg-white rounded-2xl border border-[#E8E2D8] hover:border-[#4A7C59]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
                    <div>
                      {/* Image Banner */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs ${
                            isPublic
                              ? 'bg-sky-100 text-sky-900 border border-sky-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {isPublic ? '🏛️ อีเวนต์ & งานแฟร์' : '🏡 กิจกรรมชุมชน'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 space-y-2">
                        <h3 className="font-extrabold text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#4A7C59] transition-colors">
                          {event.title}
                        </h3>

                        <div className="space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                            <span>{event.date} • {event.time}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div
                      className="p-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleShareLine(event)}
                        className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        title="แชร์ชวนเพื่อนลง LINE"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>ชวนเพื่อน (LINE)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailModalEvent(event)}
                          className="bg-white hover:bg-slate-100 text-[#1E293B] border border-slate-200 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                        >
                          ดูรายละเอียด
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvent(event.id, event.title)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-full hover:bg-rose-50 cursor-pointer"
                          title="ลบออกจากตาราง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredEvents.length === 0 && (
              <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-[#E8E2D8]">
                <p className="text-xs text-slate-500 font-semibold">ไม่มีกิจกรรมในวันที่คุณเลือก</p>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs font-bold text-[#4A7C59] underline"
                >
                  แสดงกิจกรรมทั้งหมด
                </button>
              </div>
            )}
          </section>

          {/* 3. Simple Weekend Checklist (No pressure, purely joyful) */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xs space-y-3.5">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4A7C59]" />
                <span>บันทึกความตั้งใจวันหยุด (Weekend Checklist)</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                เช็กลิสต์ง่ายๆ ไม่ต้องส่งหลักฐานรูปถ่าย แค่ติ๊กถูกเมื่อไปถึงเพื่อความสุขส่วนตัว
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {checklists.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                    item.done
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-500 line-through'
                      : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/70 font-semibold'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    item.done
                      ? 'bg-[#4A7C59] border-[#4A7C59] text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {item.done && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs sm:text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-12">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p>© 2026 Chill & Connect Hub - แชร์โมเมนต์ • พบเพื่อนใหม่ • ชิลล์ได้ทุกวัน. All rights reserved.</p>
      </footer>

      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={0}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={detailModalEvent}
        onClose={() => setDetailModalEvent(null)}
        isFavorite={detailModalEvent ? favorites.includes(detailModalEvent.id) : false}
        onToggleFavorite={(id) => {
          setFavorites((prev) =>
            prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
          );
        }}
        isJoined={true}
        isLoggedIn={true}
        onJoinSuccess={() => {}}
        onLeaveSuccess={(id) => {
          setEvents((prev) => prev.filter((e) => e.id !== id));
          setDetailModalEvent(null);
          showToast('ยกเลิกการบันทึกกิจกรรมเรียบร้อยแล้ว');
        }}
      />
    </div>
  );
}
