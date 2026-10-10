'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Trophy, Heart, ArrowRight, Sparkles, MapPin, Building2, Ticket } from 'lucide-react';
import { MOCK_POSTS, MOCK_CHALLENGES } from '@/data/mockData';

export const FairsDiscoveryHighlights: React.FC = () => {
  // Fair & Exhibition Moments (Curated from MOCK_POSTS with expo/creative/fair focus)
  const fairMoments = [
    {
      id: 'post-fair-1',
      userName: 'คุณแพรว (Praew_Art)',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'Cat Expo 2026',
      location: 'ไบเทค บางนา',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      caption: 'แวะมาเดินงาน Cat Expo ได้ยินเสียงดนตรีสดและได้ซื้อผลงานภาพพิมพ์จากศิลปินหน้าใหม่กลับบ้าน มู้ดดีมาก พลังงานบวกสุดๆ 🎶',
      likesCount: 88,
    },
    {
      id: 'post-fair-2',
      userName: 'คุณวิน (Win_Creative)',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'สัปดาห์หนังสือแห่งชาติ',
      location: 'ศูนย์ฯ สิริกิติ์ (QSNCC)',
      imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
      caption: 'บรรยากาศงานหนังสือที่ศูนย์ฯ สิริกิติ์ คึกคักมาก ได้หนังสือเล่มโปรดกลับมาอ่านครบทุกเล่ม การเดินทาง MRT สะดวกสบาย 📚',
      likesCount: 72,
    },
    {
      id: 'post-fair-3',
      userName: 'คุณฟ้า (Fah_Design)',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'Bangkok Art Biennale',
      location: 'หอศิลป์ BACC',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
      caption: 'เดินชมนิทรรศการศิลปะร่วมสมัย แสงและเงาในโถงหอศิลป์ถ่ายรูปออกมาสวยมาก มีผลงานจัดแสดงให้ชมฟรีหลายชั้นเลย 🎨',
      likesCount: 65,
    },
  ];

  // Fair & Exhibition Quests (Curated learning & creative challenge quests)
  const fairQuests = [
    {
      id: 'quest-fair-1',
      title: 'Art Walk 3: เช็กอิน 3 นิทรรศการสร้างสรรค์ & อาร์ตสเปซ',
      badgeIcon: '🎨',
      rewardPoints: 300,
      participantsCount: 290,
      badgeLabel: 'Art Collector',
    },
    {
      id: 'quest-fair-2',
      title: 'Bookworm 5: ตามล่าหนังสือเล่มโปรดในงานสัปดาห์หนังสือ',
      badgeIcon: '📚',
      rewardPoints: 250,
      participantsCount: 410,
      badgeLabel: 'Book Hunter',
    },
    {
      id: 'quest-fair-3',
      title: 'Convention Explorer: เช็กอินงานเอ็กซ์โปใหญ่ครบ 3 ศูนย์ประชุม',
      badgeIcon: '🏛️',
      rewardPoints: 400,
      participantsCount: 185,
      badgeLabel: 'Expo Master',
    },
  ];

  return (
    <section className="space-y-6 pt-2 scroll-mt-24">
      {/* Editorial Header - Slate Blue Theme */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-transparent p-4 sm:p-5 rounded-2xl border border-blue-100/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-7 h-7 rounded-xl bg-blue-500/10 text-[#2B527A] flex items-center justify-center text-xs font-black shrink-0 border border-blue-500/20 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#2B527A]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              โมเมนต์งานมหกรรม & เควสต์สะสมแต้ม
            </h2>
            <span className="text-[10px] sm:text-xs font-bold text-[#2B527A] bg-white px-2.5 py-0.5 rounded-full border border-blue-200/90 shadow-2xs">
              Expos & Creative Festivals
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
            ภาพบรรยากาศจริงจากงานมหกรรมระดับประเทศ และภารกิจสะสมเหรียญรางวัลสายครีเอทีฟ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 text-[#2B527A] border border-blue-200/90 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>ดูโมเมนต์ทั้งหมด</span>
          </Link>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2B527A] hover:bg-[#1F3D5C] text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>เควสต์ทั้งหมด</span>
          </Link>
        </div>
      </div>

      {/* Grid: 2 Columns on Desktop (Recent Moments + Trending Quests) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Recent Expo Moments (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#2B527A]" />
              <span>ภาพบรรยากาศจริงจากงานมหกรรม</span>
            </h3>
            <Link
              href="/moments"
              className="text-xs font-bold text-[#2B527A] hover:underline flex items-center gap-1"
            >
              <span>เรื่องราวทั้งหมด</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fairMoments.map((moment) => (
              <Link
                key={moment.id}
                href="/moments"
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={moment.imageUrl}
                    alt={moment.targetTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  
                  {/* Location badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-sky-400" />
                      <span className="truncate max-w-[100px]">{moment.targetTitle}</span>
                    </span>
                  </div>

                  {/* Likes Pill */}
                  <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold text-white bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                    <Heart className="w-3 h-3 fill-sky-400 text-sky-400" />
                    <span>{moment.likesCount}</span>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={moment.userAvatar}
                      alt={moment.userName}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {moment.userName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                    {moment.caption}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Trending Expo Quests (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-sky-600" />
              <span>เควสต์ท้าทายสายงานมหกรรม</span>
            </h3>
            <Link
              href="/challenges"
              className="text-xs font-bold text-[#2B527A] hover:underline flex items-center gap-1"
            >
              <span>ดูเควสต์ทั้งหมด</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {fairQuests.map((quest) => (
              <Link
                key={quest.id}
                href="/challenges"
                className="group bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-200/80 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                    {quest.badgeIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200">
                        +{quest.rewardPoints} XP
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {quest.participantsCount} คนกำลังทำ
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5 group-hover:text-[#2B527A] transition-colors">
                      {quest.title}
                    </h4>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2B527A] bg-blue-50 group-hover:bg-[#2B527A] group-hover:text-white px-2.5 py-1.5 rounded-xl border border-blue-200/80 group-hover:border-[#2B527A] transition-colors">
                    <span>ร่วมภารกิจ</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
