'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { useAuth } from '@/lib/useAuth';
import { ShieldCheck, Lock, MapPin, AlertTriangle, CheckCircle2, PhoneCall, ArrowLeft } from 'lucide-react';

export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState('safety');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={handleSetIsLoggedIn}
        isAuthReady={isAuthReady}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A7C59] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#4A7C59] flex items-center justify-center border border-emerald-200 shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                แนวทางความปลอดภัยและข้อกำหนดชุมชน
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium pt-0.5">
                Community Safety Guidelines & Legal Terms of Service
              </p>
            </div>
          </div>
        </div>

        {/* Core Principles Cards */}
        <div className="space-y-6">
          
          {/* Card 1: Platform Intermediary */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
              <Lock className="w-5 h-5 text-[#4A7C59]" />
              <h2>1. สถานะตัวกลางของแพลตฟอร์ม (Platform Intermediary Notice)</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Chill & Connect Hub ให้บริการในฐานะ **พื้นที่สื่อกลางออนไลน์ (Bulletin Board / Platform Intermediary)** เพื่ออำนวยความสะดวกในการค้นพบสถานที่ท่องเที่ยว พักผ่อน ฮีลใจ และเปิดพื้นที่ให้สมาชิกในชุมชนได้แลกเปลี่ยนข้อมูลและนัดหมายทำกิจกรรมร่วมกันตามความสมัครใจ
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed font-medium">
              ⚠️ แพลตฟอร์มไม่ได้เป็นผู้จัดกิจกรรม, ตัวแทน, นายหน้า หรือผู้ว่าจ้างของสมาชิกใดๆ สมาชิกผู้จัดกิจกรรม (Host) และผู้เข้าร่วม (Participants) เป็นผู้ตกลงและรับผิดชอบร่วมกันเองโดยตรง
            </div>
          </div>

          {/* Card 2: Public Space Meeting Only */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
              <MapPin className="w-5 h-5 text-[#4A7C59]" />
              <h2>2. กฎการนัดพบในพื้นที่สาธารณะเท่านั้น (Public Space Meeting Policy)</h2>
            </div>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside font-normal">
              <li>การนัดหมายทุกกิจกรรม **ต้องเกิดขึ้นในพื้นที่สาธารณะที่เปิดโล่ง ปลอดภัย และมีผู้คนพลุกพล่าน** เช่น สวนสาธารณะ, คาเฟ่, หอศิลป์, พิพิธภัณฑ์ หรือสนามกีฬา</li>
              <li><strong>ข้อห้ามเด็ดขาด:</strong> ไม่อนุญาตให้นัดพบในที่รโหฐาน, ที่พักอาศัยส่วนตัว, หรือสถานที่ลับตาคนโดยเด็ดขาด เพื่อความปลอดภัยสูงสุดของสมาชิกทุกคน</li>
            </ul>
          </div>

          {/* Card 3: Assumption of Risk */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2>3. การยอมรับความเสี่ยงและสละสิทธิ์เรียกร้องค่าเสียหาย (Assumption of Risk & Waiver)</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              การตัดสินใจเข้าร่วมกิจกรรมใดๆ ถือเป็นการตัดสินใจโดยอิสระและสมัครใจของสมาชิก ผู้เข้าร่วมตกลงยอมรับความเสี่ยงส่วนบุคคลที่อาจเกิดขึ้นจากการเดินทางหรือการทำกิจกรรมภายนอก และสละสิทธิ์ในการฟ้องร้องดำเนินคดี หรือเรียกร้องค่าเสียหายใดๆ ต่อแพลตฟอร์ม ผู้บริหาร และทีมงานผู้พัฒนาในทุกกรณี
            </p>
          </div>

          {/* Card 4: Zero Tolerance */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
              <CheckCircle2 className="w-5 h-5 text-[#4A7C59]" />
              <h2>4. มาตรการจัดการพฤติกรรมไม่เหมาะสม (Zero Tolerance Policy)</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              แพลตฟอร์มมีนโยบายไม่ประนีประนอมต่อพฤติกรรมคุกคามทางเพศ, การใช้ความรุนแรง, การหลอกลวง, การชักชวนเล่นการพนัน หรือการชักชวนทำธุรกิจลูกโซ่ หากตรวจพบหรือได้รับการรายงาน แพลตฟอร์มจะดำเนินการระงับบัญชีถาวรทันทีโดยไม่ต้องแจ้งล่วงหน้า และพร้อมประสานงานกับเจ้าหน้าที่ตำรวจตามกฎหมาย
            </p>
          </div>

          {/* Card 5: Safety Tips */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-950 font-black text-base">
              <PhoneCall className="w-5 h-5 text-[#4A7C59]" />
              <h2>5. คำแนะนำเพื่อความปลอดภัยของตนเอง (Practical Safety Tips)</h2>
            </div>
            <div className="text-xs sm:text-sm text-emerald-900 space-y-2 font-medium">
              <p>• <strong>แจ้งคนใกล้ชิดเสมอ:</strong> ส่งลิงก์กิจกรรมและบอกคนในครอบครัวหรือเพื่อนสนิทก่อนออกไปทำกิจกรรม</p>
              <p>• <strong>เดินทางด้วยตนเอง:</strong> หลีกเลี่ยงการขึ้นรถส่วนตัวของผู้ที่เพิ่งรู้จักกันครั้งแรก</p>
              <p>• <strong>สิทธิในการออกจากกิจกรรม:</strong> หากรู้สึกไม่สบายใจหรือบรรยากาศไม่เป็นไปตามที่ตกลงไว้ สมาชิกสามารถขอตัวกลับได้ทันที</p>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-6 text-center text-xs text-slate-500 space-y-1 mt-12">
        <p className="font-medium text-slate-600 text-xs">Lifestyle Discovery & Safe Community Engagement Platform</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      <MobileNav activeTab="safety" setActiveTab={() => {}} />
    </div>
  );
}
