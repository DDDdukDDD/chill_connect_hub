'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera, Flag, Flame, Heart, MapPin, QrCode, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/SiteFooter';
import { BrandWordmark } from '@/components/BrandWordmark';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { useAuth } from '@/lib/useAuth';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
import { EventItem } from '@/data/mockData';
import { Toast } from '@/components/Toast';

/**
 * About: who we are (owner 2026-10-26). A social platform for people who love going out, driven by four parts:
 * ตี้, ที่เที่ยว & อีเวนต์, ชาเลนจ์, โมเมนต์ (docs/PRODUCT_DIRECTION.md), in the order of an outing: friends first, then going out, then sharing (owner 2026-10-31). Open rows, no boxed grids; no numbers we cannot back.
 */
const PARTS = [
  {
    key: 'tee',
    label: 'ตี้',
    Icon: Users,
    tone: 'bg-[#FFF4EE] text-[#D04A1B]',
    title: 'ชวนก๊วนไปด้วยกัน',
    text: 'เปิดตี้ชวนเพื่อนสนิทไปวิ่ง นั่งคาเฟ่ เล่นบอร์ดเกม หรือดูคอนเสิร์ตด้วยกัน หรือเข้าตี้ของคนสายเดียวกันที่เปิดไว้ อยากได้เพื่อนใหม่ก็มี อยากไปกับแก๊งเดิมก็ได้',
    image: '/event-board-games.png',
    links: [{ href: '/community', label: 'ดูตี้ที่เปิดรับ' }],
  },
  {
    key: 'place',
    label: 'ที่เที่ยว & อีเวนต์',
    Icon: MapPin,
    tone: 'bg-[#EBF3ED] text-[#2D5A3C]',
    title: 'มีที่ให้ไปเสมอ',
    text: 'ที่เที่ยวกว่า 2,000 แห่งทั่วไทย และอีเวนต์อย่างงานวิ่ง คอนเสิร์ต และเอ็กซ์โปจากผู้จัดตัวจริง เป็นจุดหมายของตี้และชาเลนจ์ หรือจะไปเองวันว่างก็ได้',
    image: '/hero-koh-phi-phi.jpg',
    links: [
      { href: '/spots', label: 'ดูที่เที่ยว' },
      { href: '/events', label: 'ดูอีเวนต์' },
    ],
  },
  {
    key: 'challenge',
    label: 'ชาเลนจ์',
    Icon: Flag,
    tone: 'bg-[#F5F3FF] text-[#6D28D9]',
    title: 'มีเหตุผลให้ออกไป',
    text: 'ภารกิจสนุกๆ อย่างตามรอยคาเฟ่ 5 ร้าน หรือวิ่งให้ครบ 3 สวน ไปครบแล้วได้ XP เหรียญ และของรางวัลจากพาร์ตเนอร์ ทำคนเดียวหรือชวนเพื่อนมาทำด้วยกันก็ได้',
    image: '/event-hyrox.png',
    links: [{ href: '/challenges', label: 'ดูชาเลนจ์' }],
  },
  {
    key: 'moment',
    label: 'โมเมนต์',
    Icon: Camera,
    tone: 'bg-[#FFF1F2] text-[#E11D48]',
    title: 'มีเรื่องเล่ากลับมา',
    text: 'แชร์รูปและเรื่องราวจากทุกการออกไป ดูว่าเพื่อนๆ ไปไหนกันมา ส่งหัวใจ คุยกันต่อ และโมเมนต์ของคุณยังนับเป็นการไปในชาเลนจ์ได้ด้วย',
    image: '/hero-bkk-park-sunny.jpg',
    links: [{ href: '/moments', label: 'ดูโมเมนต์เพื่อนๆ' }],
  },
] as const;

const LOOP = [
  { Icon: Flag, text: 'เจอชาเลนจ์หรือตี้ที่ใช่' },
  { Icon: Users, text: 'ไปกับก๊วน หรือเพื่อนใหม่' },
  { Icon: Camera, text: 'แชร์โมเมนต์ที่ได้ไปมา' },
  { Icon: Trophy, text: 'ได้ XP เหรียญ และของรางวัล' },
  { Icon: Heart, text: 'เพื่อนๆ เห็น แล้วออกไปต่อ' },
];

const CARE = [
  { Icon: ShieldCheck, text: 'ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ ก่อนเข้าร่วมตี้' },
  { Icon: Flame, text: 'คนที่จะเปิดตี้ ต้องผ่านการตรวจจากทีมงานก่อน' },
  { Icon: QrCode, text: 'นัดเจอในที่สาธารณะ และเช็กอินด้วยบัตรที่จุดนัด' },
  { Icon: Heart, text: 'รายงานหรือบล็อกได้ทันที ทีมงานดูให้ทุกเรื่อง' },
];

/** What "waa" means in Japanese (owner 2026-10-31): each reading matches one part of the platform */
const NAME_MEANINGS = [
  { mark: '輪', reading: 'wa', title: 'วงเพื่อน', text: 'วงกลมของคนที่มาเจอกัน อย่างคำว่า 友達の輪 ที่แปลว่าวงของเพื่อน ทุก⁠ตี้คือวงเพื่อนวงใหม่ที่พร้อมให้คุณเข้ามาร่วม', tone: 'text-[#128A64]' },
  { mark: 'わあ', reading: 'waa', title: 'ว้าว!', text: 'เสียงตื่นเต้นตอนได้เจออะไรดีๆ ช่วงเวลาแบบนี้แหละที่อยากเก็บไว้เป็นโมเมนต์ แล้วแชร์ให้เพื่อนๆ ดู', tone: 'text-[#EA5A1A]' },
  { mark: '和', reading: 'wa', title: 'ความกลมกลืน', text: 'อยู่ด้วยกันอย่างสบายใจ เคารพกัน และดูแลกันแบบเพื่อน ไม่ว่าจะเพิ่งรู้จักกันวันแรกก็ตาม', tone: 'text-slate-900' },
];

const WRAP = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

export default function AboutPage() {
  const [activeNavTab, setActiveNavTab] = useState('about');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isGuest = isAuthReady && !isLoggedIn;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => openAuth('login')}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      <main className="flex-1 pb-24 xl:pb-12">
        {/* 1. Who we are */}
        <section className="bg-[#FFF8F1]">
          <div className={`${WRAP} py-12 sm:py-16 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center`}>
            <div className="space-y-5 text-center lg:text-left">
              <p className="text-sm font-semibold text-[#D04A1B]">เกี่ยวกับ Chillwaa</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                คอมมูนิตี้ของคน
                <br />
                ชอบ<span className="text-[#F26430]">ออกไปใช้ชีวิต</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl mx-auto lg:mx-0">
                เราอยากทำให้ทุกการออกไปใช้ชีวิตมีความหมาย ให้ทุกครั้งที่ออกไป มีเพื่อนไปด้วย มีเหตุผลให้ไป และมีเรื่องเล่ากลับมา
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-1">
                <Link href="/community" className="inline-flex items-center gap-2 rounded-full bg-[#F26430] hover:bg-[#E2551F] px-6 py-3 text-sm sm:text-base font-bold text-white shadow-sm">
                  หากิจกรรมที่ใช่
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                {isGuest && (
                  <button type="button" onClick={() => openAuth('signup')} className="rounded-full bg-white border border-slate-200 hover:bg-slate-50 px-6 py-3 text-sm sm:text-base font-bold text-slate-800 cursor-pointer">
                    สมัครฟรี
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto w-full lg:max-w-none">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-md -rotate-2">
                <Image src="/event-city-run.png" alt="เพื่อนๆ วิ่งด้วยกันในสวนสาธารณะ" fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" priority />
              </div>
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-md rotate-2 mt-8">
                <Image src="/hero-bkk-community-golden.jpg" alt="คนในคอมมูนิตี้ออกไปเที่ยวด้วยกันตอนเย็น" fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" priority />
              </div>
            </div>
          </div>
        </section>

        {/* What the name means */}
        <section className={`${WRAP} py-14 sm:py-20 grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-start`}>
          <div className="group space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">ทำไมต้องชื่อ Chillwaa</h2>
            <BrandWordmark sizeClass="text-5xl sm:text-6xl" />
            <p className="text-slate-700 leading-relaxed">
              &ldquo;Chill&rdquo; คือความสบายๆ ของการออกไปใช้ชีวิต ส่วน &ldquo;Waa&rdquo; มาจากภาษาญี่ปุ่น ที่มีความหมายดีๆ ซ่อนอยู่ถึงสามแบบ
            </p>
            <p className="text-slate-600 leading-relaxed">
              จุดสามจุดตรงกลางคือเพื่อนที่เดินเข้าหากัน จากสีเขียวที่สบายๆ ไปสู่สีส้มที่ตื่นเต้น เหมือนสองเส้นโค้งในโลโก้ของเราที่มาบรรจบกัน
              นี่แหละ <span className="whitespace-nowrap font-semibold text-slate-900">chill &amp; connect</span>
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {NAME_MEANINGS.map((item) => (
              <li key={item.title} className="flex items-start gap-5 py-5 first:pt-0">
                <span lang="ja" className={`w-16 sm:w-20 shrink-0 text-center text-3xl sm:text-4xl font-bold leading-none whitespace-nowrap ${item.tone}`}>{item.mark}</span>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">
                    {item.title} <span className="text-sm font-medium text-slate-500">({item.reading})</span>
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-pretty">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 2. The four parts that take people out */}
        <section className={`${WRAP} py-14 sm:py-20`}>
          <div className="max-w-2xl space-y-2 mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">สี่อย่างที่พาเราออกไปด้วยกัน</h2>
            <p className="text-slate-600 leading-relaxed">เริ่มจากเพื่อน ออกไปใช้ชีวิตด้วยกัน แล้วกลับมาแชร์เรื่องราวให้กันฟัง</p>
          </div>
          <div className="space-y-14 sm:space-y-20">
            {PARTS.map((part, i) => (
              <article key={part.key} className="grid gap-6 sm:gap-10 md:grid-cols-2 md:items-center">
                <div className={`relative aspect-[4/3] rounded-3xl overflow-hidden shadow-md ${i % 2 ? 'md:order-2' : ''}`}>
                  <Image src={part.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="space-y-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${part.tone}`}>
                    <part.Icon className="w-4 h-4" aria-hidden="true" />
                    {part.label}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{part.title}</h3>
                  <p className="text-slate-700 leading-relaxed text-pretty">{part.text}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                    {part.links.map((link) => (
                      <Link key={link.href} href={link.href} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900">
                        {link.label}
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 3. How one outing goes */}
        <section className="bg-slate-50">
          <div className={`${WRAP} py-14 sm:py-16`}>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 sm:mb-10">หนึ่งการออกไป เป็นแบบนี้</h2>
            <ol className="grid gap-5 sm:grid-cols-5 sm:gap-4">
              {LOOP.map((step, i) => (
                <li key={step.text} className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3">
                  <span className="relative w-12 h-12 shrink-0 rounded-full bg-white shadow-sm flex items-center justify-center text-[#F26430]">
                    <step.Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  </span>
                  <span className="text-slate-800 font-medium leading-snug text-pretty">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. How members look after each other (only what the site really does) */}
        <section className={`${WRAP} py-14 sm:py-20 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-start`}>
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">ดูแลกันแบบเพื่อน</h2>
            <p className="text-slate-600 leading-relaxed text-pretty">ออกไปด้วยกันอย่างสนุกและสบายใจ นี่คือสิ่งที่เราทำร่วมกัน</p>
            <Link href="/safety" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900">
              อ่านคู่มือความปลอดภัย
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {CARE.map((item) => (
              <li key={item.text} className="flex items-center gap-4 py-4 first:pt-0">
                <span className="w-10 h-10 shrink-0 rounded-full bg-[#EBF3ED] text-[#2D5A3C] flex items-center justify-center">
                  <item.Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="text-slate-800 leading-snug">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Come along */}
        <section className="bg-[#FFF8F1]">
          <div className={`${WRAP} py-12 sm:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 text-center sm:text-left`}>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">มาออกไปด้วยกันนะ เพื่อนๆ รอคุณอยู่</h2>
              <p className="text-slate-600">{isGuest ? 'สมัครฟรี แล้วเริ่มออกไปใช้ชีวิต ติดตามเรื่องราวจากเพื่อนๆ และแบ่งปันเรื่องราวของคุณ' : 'ดูว่ามีตี้และชาเลนจ์อะไรรออยู่บ้าง'}</p>
            </div>
            {isGuest ? (
              <button type="button" onClick={() => openAuth('signup')} className="shrink-0 rounded-full bg-[#F26430] hover:bg-[#E2551F] px-7 py-3 font-bold text-white shadow-sm cursor-pointer">
                สมัครสมาชิกฟรี
              </button>
            ) : (
              <Link href="/" className="shrink-0 rounded-full bg-[#F26430] hover:bg-[#E2551F] px-7 py-3 font-bold text-white shadow-sm">
                ไปหน้าแรก
              </Link>
            )}
          </div>
        </section>
      </main>

      <SiteFooter className="bg-white mb-24 xl:mb-0" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${name}`);
        }}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          showToast('ออกจากระบบแล้ว');
        }}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          showToast(newEvent.approvalStatus === 'pending' ? `ส่ง "${newEvent.title}" ให้ทีมงานตรวจแล้ว` : `สร้าง "${newEvent.title}" แล้ว`);
        }}
      />

      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} />
      <Toast message={toastMessage} />
    </div>
  );
}
