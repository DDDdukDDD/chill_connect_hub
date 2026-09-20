'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  HeartHandshake, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Coffee
} from 'lucide-react';

interface CommunityTrustSectionProps {
  // Pure trust & safety section
}

export const CommunityTrustSection: React.FC<CommunityTrustSectionProps> = () => {
  const pillars = [
    {
      id: 'safety',
      icon: ShieldCheck,
      iconColor: 'text-[#F26430]',
      iconBg: 'bg-orange-500/10 border-orange-200/70',
      title: 'พื้นที่ปลอดภัย 100% ไร้แรงกดดัน',
      description: 'ระบบยืนยันตัวตนสมาชิก และนโยบายคอมมูนิตี้เชิงบวก (Positive Community Guidelines) ที่ไม่อนุญาตการขายตรงหรือสร้างความอึดอัดใจ',
    },
    {
      id: 'small_groups',
      icon: Users,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-500/10 border-amber-200/70',
      title: 'กลุ่มย่อยขนาดอบอุ่น 4-10 คน',
      description: 'จำกัดจำนวนผู้เข้าร่วมเพื่อการสนทนาที่ทั่วถึง เป็นกันเอง ไม่ต้องกลัวเก้อเขิน มีโฮสต์คอยต้อนรับและแนะนำเพื่อนใหม่เสมอ',
    },
    {
      id: 'diverse',
      icon: Coffee,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-500/10 border-emerald-200/70',
      title: 'กิจกรรมหลากหลาย ไม่จำเจ',
      description: 'ตั้งแต่ตี้วิ่งสวนสาธารณะ บอร์ดเกมยามบ่าย จิบกาแฟ Specialty เวิร์กช็อปเซรามิก ไปจนถึงทริปเดินป่าคายัคใกล้กรุง',
    },
    {
      id: 'transparent',
      icon: HeartHandshake,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-500/10 border-purple-200/70',
      title: 'โปร่งใส ไม่มีค่าใช้จ่ายแอบแฝง',
      description: 'รายละเอียดค่าใช้จ่ายชัดเจน ไม่ว่าจะหารเฉลี่ยตามจริง หรือเข้าร่วมฟรี ทุกข้อมูลระบุไว้อย่างตรงไปตรงมาหน้าตี้กิจกรรม',
    },
  ];

  return (
    <section className="space-y-6 pt-4 scroll-mt-24">
      {/* Header */}
      <div className="space-y-1.5 text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-[10px] sm:text-xs font-black text-[#F26430] uppercase tracking-wider">
          <span>Community Trust & Culture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ทำไมต้องร่วมกิจกรรมคอมมูนิตี้กับเรา?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
          เราออกแบบประสบการณ์ให้ทุกคนสามารถก้าวออกจากคอมฟอร์ตโซน มาพบเพื่อนรู้ใจในบรรยากาศที่เป็นมิตร ปลอดภัย และไร้แรงกดดัน
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
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>มาตรฐานคอมมูนิตี้รับรอง</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
