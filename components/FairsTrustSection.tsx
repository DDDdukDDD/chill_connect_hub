'use client';

import React from 'react';
import { 
  Building2, 
  QrCode, 
  Map, 
  CalendarCheck, 
  CheckCircle2, 
  Ticket, 
  Sparkles
} from 'lucide-react';

interface FairsTrustSectionProps {
  // Pure trust & safety section
}

export const FairsTrustSection: React.FC<FairsTrustSectionProps> = () => {
  const pillars = [
    {
      id: 'venues',
      icon: Building2,
      iconColor: 'text-[#2B527A]',
      iconBg: 'bg-blue-500/10 border-blue-200/70',
      title: 'รวมทุกศูนย์ประชุมใหญ่ทั่วไทย',
      description: 'อัปเดตงานอีเวนต์ระดับชาติจาก QSNCC, BITEC, IMPACT, รอยัล พารากอน ฮอลล์, BACC, KICE ขอนแก่น และ CMECC เชียงใหม่ ครบจบในที่เดียว',
    },
    {
      id: 'epass',
      icon: QrCode,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-500/10 border-sky-200/70',
      title: 'ระบบบัตรผ่านดิจิทัล E-Pass',
      description: 'ลงทะเบียนล่วงหน้า บันทึกตั๋วหรือบัตรผ่านเข้างานไว้ในสมาร์ตโฟน สแกนเข้างานได้รวดเร็วทันใจ ไม่ต้องรอคิวหน้าฮอลล์',
    },
    {
      id: 'highlights',
      icon: Map,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-500/10 border-indigo-200/70',
      title: 'ผังงาน & ไฮไลต์บูธแม่นยำ',
      description: 'เข้าถึงผังงานจัดแสดง โซนเวทีสัมมนา โปรโมชันหนังสือและสินค้าพิเศษ ตรงจากผู้จัดงานและองค์กรพันธมิตร',
    },
    {
      id: 'calendar',
      icon: CalendarCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-500/10 border-emerald-200/70',
      title: 'ปฏิทินเตือน ไม่พลาดงานใหญ่',
      description: 'ระบบบันทึกปฏิทินส่วนตัว พร้อมแจ้งเตือนก่อนวันจัดงาน ให้คุณวางแผนการเดินทางและร่วมสัมมนาได้อย่างคุ้มค่า',
    },
  ];

  return (
    <section className="space-y-6 pt-4 scroll-mt-24">
      {/* Header */}
      <div className="space-y-1.5 text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] sm:text-xs font-black text-[#2B527A] uppercase tracking-wider">
          <span>Official Exhibition & Fair Network</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ทำไมต้องเช็กงานมหกรรมและเอ็กซ์โปกับเรา?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
          แพลตฟอร์มศูนย์รวมงานนิทรรศการ เทศกาลสร้างสรรค์ และเอ็กซ์โกระดับประเทศ ช่วยให้คุณวางแผนการเข้าชมงานได้อย่างสะดวกและคุ้มค่าที่สุด
        </p>
      </div>

      {/* 4 Trust Pillars Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-2xl ${item.iconBg} border flex items-center justify-center ${item.iconColor} shadow-2xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>ข้อมูลตรงจากผู้จัดงาน</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
