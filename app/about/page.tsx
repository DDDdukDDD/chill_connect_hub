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
  Sun
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        
        {/* SECTION 1: HERO STORY BANNER */}
        <section className="bg-gradient-to-b from-white via-[#FAF7F2] to-[#FAF7F2] py-12 sm:py-20 border-b border-[#E8E2D8] relative overflow-hidden">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#4A7C59] bg-[#EBF3ED] px-4 py-1.5 rounded-full border border-[#4A7C59]/20 shadow-xs">
              <Sprout className="w-4 h-4 text-[#4A7C59]" />
              <span>เกี่ยวกับเรา (About Chill & Connect Hub)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E293B] tracking-tight leading-tight max-w-4xl mx-auto">
              Hub กิจกรรม & คอมมูนิตี้ <br className="hidden sm:inline" />
              <span className="text-[#F26430]">สำหรับคนชอบออกไปใช้ชีวิต</span>
            </h1>

            <p className="text-base sm:text-xl text-[#475569] max-w-3xl mx-auto leading-relaxed font-medium">
              "เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุก และต่อยอดมิตรภาพได้อย่างเป็นธรรมชาติ" <br />
              <strong>Chill & Connect Hub</strong> เกิดขึ้นเพื่อเป็น Safe Space ที่เชื่อมโยงผู้คนผ่านกิจกรรมดีๆ ช่วยให้วันหยุดของคุณมีความหมายและได้พลังบวกกลับไปเต็มเปี่ยม
            </p>

            {/* Impact Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
              {[
                { label: 'กิจกรรมเกิดขึ้นแล้ว', val: '500+', icon: <Compass className="w-5 h-5 text-[#F26430]" /> },
                { label: 'มิตรภาพใหม่', val: '3,500+', icon: <Users className="w-5 h-5 text-[#4A7C59]" /> },
                { label: 'คะแนนความสุข', val: '4.9 / 5', icon: <Smile className="w-5 h-5 text-amber-500" /> },
                { label: 'Introvert Friendly', val: '100%', icon: <ShieldCheck className="w-5 h-5 text-[#4A7C59]" /> },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-sm text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#64748B]">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">{stat.val}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* SECTION 2: OUR 3 CORE PILLARS (เสาหลักของเรา) */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
              3 หัวใจสำคัญของ Chill & Connect Hub 💚
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              เราออกแบบทุกรายละเอียด เพื่อให้ผู้เข้าร่วมทุกคนรู้สึกสบายใจและได้พลังบวกกลับไปเต็มเปี่ยม
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF3ED] border border-[#4A7C59]/30 flex items-center justify-center text-[#4A7C59]">
                  <Sprout className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">1. 🌱 ฮีลใจ (Mindful Chill)</h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  สเปซพักผ่อนสมอง สลัดความเหนื่อยล้าและความเครียดจากการทำงาน ด้วยกิจกรรมบำบัดจิตใจ เช่น Sound Bath Meditation, โยคะในสวน, หรือเดินชมธรรมชาติสโลว์ไลฟ์
                </p>
              </div>
              <span className="text-xs font-bold text-[#4A7C59] bg-[#EBF3ED] px-3 py-1 rounded-full w-fit">
                #RestAndReset
              </span>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF0EB] border border-[#F26430]/30 flex items-center justify-center text-[#F26430]">
                  <Flame className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">2. 🏃 ขยับตัว & สนุกสนาน (Active Movement)</h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  ขยับร่างกายสร้างสารความสุขในบรรยากาศเป็นกันเอง ไร้แรงกดดัน ตั้งแต่การวิ่งเช้า City Run, ปีนหน้าผาจำลอง ไปจนถึงกีฬาฟิตเนสระดับโลกอย่าง HYROX Bootcamp!
                </p>
              </div>
              <span className="text-xs font-bold text-[#F26430] bg-[#FDF0EB] px-3 py-1 rounded-full w-fit">
                #EnergyBoost
              </span>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl p-8 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-600">
                  <Coffee className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">3. ☕ มิตรภาพอบอุ่น (Warm Connection)</h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  เชื่อมต่อกับเพื่อนใหม่ในบรรยากาศสบายๆ ผ่านกิจกรรมผ่อนคลาย เช่น คืนบอร์ดเกม, เวิร์กช็อปปั้นดินเซรามิค, ดนตรีอะคูสติก และจิบกาแฟดริปพูดคุยกัน
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full w-fit">
                #NewFriends
              </span>
            </div>

          </div>

        </section>

        {/* SECTION 3: INTROVERT-FRIENDLY GUARANTEE */}
        <section className="bg-[#1E293B] text-white py-16 border-y border-slate-700">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3.5 py-1 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
                <span>คำสัญญาของเรา (Safe & Welcoming Guarantee)</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                "มาคนเดียวก็สบายใจ ไม่เกร็ง ไร้ความกดดัน" 🤍
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                เรารู้ว่าการตัดสินใจออกไปเจอคนใหม่ๆ อาจทำให้รู้สึกประหม่า ดังนั้นเราจึงออกแบบกลไกดูแลผู้เข้าร่วมเป็นพิเศษ:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { title: 'มี Host คอยต้อนรับ', desc: 'ทุกกิจกรรมจะมี Host ใจดีคอยแนะนำตัว ช่วยละลายพฤติกรรม (Ice Breaking) อย่างนุ่มนวล' },
                { title: 'ไม่เกร็ง ไม่ต้องฝืนพูด', desc: 'เน้นการทำกิจกรรมร่วมกันอย่างเป็นธรรมชาติ หากเป็นคนเงียบๆ ก็สามารถจอยได้อย่างผ่อนคลาย' },
                { title: 'เลือกระดับพลังงานได้', desc: 'มีสัญลักษณ์บอกระดับพลังงานกิจกรรม (Low Social Energy vs High Energy) ให้เลือกตามความต้องการ' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* SECTION 4: CALL TO ACTION (CTA BANNER) */}
        <section className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-r from-[#4A7C59] to-[#3B6347] rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
            
            <div className="space-y-3 relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                พร้อมจะเริ่มวันดีๆ ไปด้วยกันหรือยัง? 🎉
              </h2>
              <p className="text-sm sm:text-base text-emerald-100 font-medium">
                เลือกกิจกรรมแรกที่คุณสนใจ ชวนเพื่อนมาจอย หรือเปิดใจมาคนเดียว แล้วปล่อยให้ความสุขเกิดขึ้นเอง!
              </p>
            </div>

            <div className="pt-2 relative z-10 flex justify-center">
              <Link
                href="/"
                className="bg-[#F26430] hover:bg-[#D95322] text-white px-8 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg shadow-black/20 flex items-center gap-2 active:scale-95"
              >
                <span>ค้นหากิจกรรมแรกของคุณ</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ</p>
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
