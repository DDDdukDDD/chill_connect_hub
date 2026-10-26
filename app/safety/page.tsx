'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DetailTable } from '@/components/detail/DetailHero';
import { useAuth } from '@/lib/useAuth';

const SECTION_TITLE = 'text-lg sm:text-xl font-bold text-slate-900 tracking-tight';
const BODY = 'text-sm sm:text-base font-medium text-slate-700 leading-relaxed';

/** Before you go: what a member does themselves */
const TIPS = [
  { title: 'บอกคนใกล้ตัวก่อนออกไป', text: 'ส่งลิงก์ตี้ให้เพื่อนหรือคนในบ้าน บอกว่าไปไหน กับใคร กลับประมาณกี่โมง' },
  { title: 'เดินทางไปเอง กลับเอง', text: 'ไม่ขึ้นรถส่วนตัวของคนที่เพิ่งเจอกันครั้งแรก นั่งรถสาธารณะหรือเรียกรถเองจะสบายใจกว่า' },
  { title: 'ไม่สบายใจ กลับได้ทันที', text: 'ถ้าบรรยากาศไม่เหมือนที่คุยกันไว้ ขอตัวกลับได้เลย ไม่ต้องเกรงใจใคร' },
  { title: 'เก็บเรื่องเงินและข้อมูลส่วนตัวไว้', text: 'ไม่โอนเงินให้สมาชิกด้วยกัน และไม่ต้องบอกที่อยู่บ้านหรือเลขบัญชีกับใคร' },
];

/** ตี้ may run past midnight (BE-148) and some meet online (BE-153): what changes for each */
const SITUATIONS = [
  {
    title: 'ตี้ตอนดึก',
    points: [
      'วางแผนทางกลับก่อนไป ดูรถเที่ยวสุดท้าย หรือเรียกรถเองจากจุดที่มีแสงสว่าง',
      'ส่งตำแหน่งให้คนใกล้ตัว และบอกเมื่อถึงบ้านแล้ว',
      'ดื่มเท่าที่ดูแลตัวเองได้ และไม่ปล่อยแก้วไว้กับคนที่เพิ่งรู้จัก',
    ],
  },
  {
    title: 'ตี้ออนไลน์',
    points: [
      'เข้าร่วมผ่านลิงก์ในแชตกลุ่มของตี้เท่านั้น ไม่กดลิงก์ที่ส่งมาทางอื่น',
      'ไม่ต้องเปิดกล้องถ้าไม่สบายใจ และไม่บอกข้อมูลส่วนตัวในห้อง',
      'ถ้ามีคนชวนคุยต่อนอกตี้ หรือชวนโอนเงิน ให้รายงานได้เลย',
    ],
  },
];

/**
 * คู่มือความปลอดภัย, drawn like the challenge page (owner 2026-10-24): open sections in a friendly voice, the rules
 * as grey rows, no English in brackets. The binding terms live on /legal; this page says them in plain words.
 */
export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState('safety');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isLoggedIn={isLoggedIn} setIsLoggedIn={handleSetIsLoggedIn} isAuthReady={isAuthReady} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-12 lg:pb-16">
        <Link href="/" className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          หน้าแรก
        </Link>

        <header className="mt-4 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">คู่มือความปลอดภัย</h1>
          <p className={BODY}>ออกไปเจอเพื่อนใหม่ให้สนุกและสบายใจทุกครั้ง นี่คือสิ่งที่เราอยากให้ทุกคนรู้ก่อนไปตี้</p>
        </header>

        <div className="mt-10 space-y-10">
          <section className="space-y-4">
            <h2 className={SECTION_TITLE}>ก่อนออกไป</h2>
            <ol className="space-y-4">
              {TIPS.map((tip, i) => (
                <li key={tip.title} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center tabular-nums">{i + 1}</span>
                  <span>
                    <span className="block text-sm sm:text-base font-bold text-slate-900">{tip.title}</span>
                    <span className="block text-sm font-medium text-slate-600 leading-relaxed">{tip.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <DetailTable
            title="กติกาของทุกตี้"
            rows={[
              { label: 'ที่นัดเจอ', value: 'ที่สาธารณะที่มีคนผ่านไปมา เช่น สวน คาเฟ่ หอศิลป์ พิพิธภัณฑ์ หรือสนามกีฬา' },
              { label: 'ที่ที่ห้ามนัด', value: 'บ้านหรือห้องพักส่วนตัว และที่ลับตาคน' },
              { label: 'เพื่อนร่วมทริป', value: 'ทริปไปที่เที่ยวด้วยกันต้องมีอย่างน้อย 3 คน ไปช่วงกลางวัน และเจอกันที่สถานที่เลย ไม่นัดรับส่งกัน' },
              { label: 'การยืนยันว่ามา', value: 'คนจัดสแกนบัตรของคุณที่จุดนัดพบ' },
            ]}
          />

          {SITUATIONS.map((situation) => (
            <section key={situation.title} className="space-y-3">
              <h2 className={SECTION_TITLE}>{situation.title}</h2>
              <ul className="space-y-2">
                {situation.points.map((point) => (
                  <li key={point} className={`${BODY} flex gap-2.5`}>
                    <span className="mt-2.5 w-1.5 h-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="space-y-3">
            <h2 className={SECTION_TITLE}>สิ่งที่เราไม่ยอมให้เกิด</h2>
            <p className={BODY}>
              การคุกคามทางเพศ ความรุนแรง การหลอกลวง ชวนเล่นพนัน หรือชวนทำธุรกิจลูกโซ่ ถ้าเจอ เราปิดบัญชีถาวรทันทีโดยไม่ต้องแจ้งก่อน และพร้อมส่งข้อมูลให้ตำรวจตามกฎหมาย
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={SECTION_TITLE}>เจอปัญหา บอกเราได้เลย</h2>
            <p className={BODY}>
              กด <span className="font-bold text-slate-900">รายงาน</span> ได้ที่หน้าตี้ โปรไฟล์ รีวิว หรือข้อความในแชต ทีมงานจะเข้าไปดูให้ และบล็อกสมาชิกคนนั้นได้ทันทีจากโปรไฟล์ของเขา คุณจะไม่เห็นตี้และโมเมนต์ของเขาอีก ถ้าอยู่ในอันตราย โทร <span className="font-bold text-slate-900 tabular-nums">191</span> ก่อนเสมอ
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={SECTION_TITLE}>เราเป็นพื้นที่กลาง</h2>
            <p className={BODY}>
              Chill &amp; Connect Hub เป็นที่ให้สมาชิกเจอกันและชวนกันไปทำกิจกรรม เราไม่ได้เป็นคนจัดตี้ ไม่ได้เป็นตัวแทนหรือนายหน้าของใคร คนจัดกับคนที่ไปตกลงและดูแลกันเอง การไปแต่ละครั้งเป็นการตัดสินใจของคุณเอง
              รายละเอียดเต็มอยู่ใน{' '}
              <Link href="/legal" className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
                ข้อตกลงการใช้งาน
              </Link>
            </p>
          </section>
        </div>
      </main>

      <SiteFooter className="mb-16 lg:mb-0" />
      <MobileNav activeTab="safety" setActiveTab={() => {}} />
    </div>
  );
}
