'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export default function PreviewLogoPage() {
  const [selectedVariant, setSelectedVariant] = useState<'embrace' | 'infinity' | 'duo' | 'minimal'>('embrace');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const variants = [
    {
      id: 'embrace' as const,
      name: 'Option 1: The Harmonic Embrace (แนะนำ - ระดับ Airbnb / Stripe)',
      desc: 'เส้นริบบิ้นคู่ประสานโอบกอดกันเป็นตัว C ส้มแทงเจอรีน (Connect) สานกับเขียวมรกต (Chill) สื่อถึงมิตรภาพและพื้นที่ปลอดภัย คมชัดทุกขนาด',
    },
    {
      id: 'infinity' as const,
      name: 'Option 2: The Continuous Möbius (ระดับ Apple / Tech Flagship)',
      desc: 'ริบบิ้นเดี่ยวเส้นเดียวบิดหมุนวนไร้จุดสิ้นสุด (Möbius Strip) ไล่เฉดสี Sunset สู่ Forest Green ทรงคุณค่า ไร้กาลเวลา',
    },
    {
      id: 'duo' as const,
      name: 'Option 3: The Geometric Duo (ระดับ Figma / Swiss Modernism)',
      desc: 'โครงสร้างเรขาคณิต Bold & Crisp วงโค้งคู่หน้าตัดกลมมน สมดุลทองคำ สวยงาม ชัดเจน ไร้ความรก',
    },
    {
      id: 'minimal' as const,
      name: 'Option 4: The Pure Monogram (ระดับ Nike / Notion)',
      desc: 'ตัว C โค้งหนา ทึบ หนักแน่น โดดเด่น มองเห็นจากระยะ 100 เมตรก็รู้ว่าเป็น Chill & Connect Hub',
    },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-[#FAF7F2] text-slate-900'} p-6 sm:p-12 transition-colors`}>
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-slate-200/60">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#4A7C59]">Brand Identity Redesign</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              Global Brand Logo Showcase: Letter "C"
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              เปรียบเทียบงานออกแบบระดับสากล (Global Tech Standard) แบบ Pure Vector SVG คมชัด 100% ทุกขนาด
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              สลับโหมด: {theme === 'light' ? '☀️ สว่าง' : '🌙 มืด'}
            </button>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-[#4A7C59] text-white text-xs font-bold shadow-xs hover:bg-[#3B6447] transition-colors"
            >
              กลับหน้าแรก ➔
            </Link>
          </div>
        </div>

        {/* Variant Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariant(v.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedVariant === v.id
                  ? 'border-[#4A7C59] bg-[#EBF3ED]/70 dark:bg-emerald-950/40 ring-2 ring-[#4A7C59]/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <BrandLogo variant={v.id} size="sm" withShadow={false} />
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  selectedVariant === v.id ? 'bg-[#4A7C59] text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                }`}>
                  {v.id.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold text-xs leading-snug">{v.name}</h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{v.desc}</p>
            </button>
          ))}
        </div>

        {/* Live Simulation Sections */}
        <div className="space-y-8">
          
          {/* 1. Real Navbar Simulation */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
              1. จำลองการแสดงผลบนแถบ Navbar จริง (ความสูง 40px)
            </h2>
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandLogo variant={selectedVariant} size="md" />
                <div>
                  <span className="font-black text-lg sm:text-[19px] tracking-tight text-slate-900 dark:text-white leading-none block">
                    Chill & Connect Hub
                  </span>
                  <p className="text-[10.5px] text-slate-400 font-medium mt-1.5 flex items-center gap-1.5">
                    <span>ค้นหาที่เที่ยว</span>
                    <span>•</span>
                    <span>ออกไปใช้ชีวิต</span>
                    <span>•</span>
                    <span>พบเพื่อนใหม่</span>
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                  ค้นพบ
                </span>
                <span className="text-xs px-3 py-1.5 rounded-xl text-slate-400 font-bold">
                  ชาเลนจ์
                </span>
                <span className="text-xs px-3 py-1.5 rounded-xl text-slate-400 font-bold">
                  โมเมนต์
                </span>
              </div>
            </div>
          </div>

          {/* 2. Scale Stress Test (16px Favicon -> 128px Hero Icon) */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
              2. การทดสอบการมองเห็นในทุกระดับขนาด (Scale & Legibility Test)
            </h2>
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-end justify-around gap-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <BrandLogo variant={selectedVariant} size="xs" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 block">24px (Favicon / Tab)</span>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <BrandLogo variant={selectedVariant} size="sm" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 block">32px (Mobile Nav)</span>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <BrandLogo variant={selectedVariant} size="md" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 block">40px (Desktop Navbar)</span>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <BrandLogo variant={selectedVariant} size="lg" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 block">48px (Footer / Card)</span>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <BrandLogo variant={selectedVariant} size="xl" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 block">64px (Profile / Banner)</span>
              </div>
            </div>
          </div>

          {/* 3. Mobile App Icon Squircle (App Store Standard) */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
              3. ไอคอนแอปบนหน้าจอมือถือ (iOS / Android App Icon)
            </h2>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center space-y-2">
                <div className="w-24 h-24 rounded-[26px] bg-white dark:bg-slate-950 p-4 shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                  <BrandLogo variant={selectedVariant} size="lg" withShadow={false} />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">iOS Home Screen</span>
              </div>

              <div className="text-center space-y-2">
                <div className="w-24 h-24 rounded-[26px] bg-gradient-to-br from-slate-900 to-[#0F172A] p-4 shadow-xl border border-slate-800 flex items-center justify-center">
                  <BrandLogo variant={selectedVariant} size="lg" withShadow={false} />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Dark Edition</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
