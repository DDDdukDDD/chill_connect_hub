'use client';

import React from 'react';
import { 
  Compass, 
  MapPin, 
  Heart, 
  Users, 
  CheckCircle2, 
  Camera, 
  Trees
} from 'lucide-react';

interface SpotsTrustSectionProps {
  // Pure trust & safety section
}

export const SpotsTrustSection: React.FC<SpotsTrustSectionProps> = () => {
  const pillars = [
    {
      id: 'locals',
      icon: Compass,
      iconColor: 'text-[#4A7C59]',
      iconBg: 'bg-emerald-500/10 border-emerald-200/70',
      title: 'คัดสรรโดยคนท้องถิ่น 77 จังหวัด',
      description: 'ทุกพิกัดผ่านการกลั่นกรองโดยคนพื้นที่และนักเดินทางสายสโลว์ไลฟ์ ไร้หน้าม้า คัดเฉพาะสเปซที่เงียบสงบ ธรรมชาติงดงาม และฮีลใจได้จริง',
    },
    {
      id: 'bucketlist',
      icon: Heart,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-500/10 border-rose-200/70',
      title: 'บันทึก Bucket List & นำทางในคลิกเดียว',
      description: 'กดบันทึกพิกัดในฝันลงในโปรไฟล์ส่วนตัว พร้อมเชื่อมต่อ Google Maps เปิดระบบนำทางไปยังจุดหมายปลายทางได้อย่างแม่นยำ',
    },
    {
      id: 'spot_buddy',
      icon: Users,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-500/10 border-orange-200/70',
      title: 'Spot Buddy: ชวนเพื่อนไปเที่ยวด้วยกัน',
      description: 'อยากไปจุดชมวิว คาเฟ่ลับ หรือกางเต็นท์แต่ไม่มีเพื่อนร่วมทริป? สามารถเปิดตี้ Spot Buddy ชวนเพื่อนสายเดียวกันไปเที่ยวด้วยกันได้ทันที',
    },
    {
      id: 'moments',
      icon: Camera,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-500/10 border-purple-200/70',
      title: 'โมเมนต์ & ภาพบรรยากาศจริง',
      description: 'สัมผัสบรรยากาศจริงผ่านภาพถ่ายและรีวิวจากคอมมูนิตี้ผู้ไปเยือนล่าสุด รู้สภาพอากาศ วิวพระอาทิตย์ขึ้น และเมนูแนะนำก่อนออกเดินทาง',
    },
  ];

  return (
    <section className="space-y-6 pt-4 scroll-mt-24">
      {/* Header */}
      <div className="space-y-1.5 text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] sm:text-xs font-black text-[#4A7C59] uppercase tracking-wider">
          <span>Nationwide Lifestyle & Healing Spaces</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ทำไมต้องค้นหาพิกัดเที่ยวกับเรา?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
          เราเชื่อว่าการได้ออกไปชาร์จพลังในสเปซที่ใช่ คือจุดเริ่มต้นของการมีสุขภาพกายและใจที่ดี ค้นพบจุดพักผ่อน 77 จังหวัดที่ตรงกับจริตของคุณ
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
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>คัดสรรโดยคนท้องถิ่น 100%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
