'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Trophy, Heart, ArrowRight, Sparkles, MapPin, Compass, Trees } from 'lucide-react';
import { MOCK_POSTS, MOCK_CHALLENGES } from '@/data/mockData';

export const SpotsDiscoveryHighlights: React.FC = () => {
  // Lifestyle Spots & Nature Moments (Curated from MOCK_POSTS with spots/nature/cafe focus)
  const spotMoments = [
    {
      id: 'post-spot-1',
      userName: 'คุณกี้ (Kee_Explorer)',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'สวนป่าเบญจกิติ',
      location: 'คลองเตย, กรุงเทพฯ',
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
      caption: 'เดินรับลมยามเย็นบน Skywalk สวนป่าเบญจกิติ แสงสีทองกระทบผิวน้ำสวยจนลืมความเหนื่อยล้าทั้งสัปดาห์เลย 🌅🌿',
      likesCount: 84,
    },
    {
      id: 'post-spot-2',
      userName: 'คุณมิ้นท์ (Mint_Vibes)',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'ซอยอารีย์ Specialty Cafe',
      location: 'พญาไท, กรุงเทพฯ',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      caption: 'วันหยุดสบายๆ แวะมาเดินเล่นจิบกาแฟแถวอารีย์ แดดอุ่นๆ ลมพัดเย็นดีมาก คาเฟ่ Specialty คุณภาพเพียบ ☕✨',
      likesCount: 68,
    },
    {
      id: 'post-spot-3',
      userName: 'คุณอาร์ท (Art_Nature)',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'จุดชมวิวเสม็ดนางชี',
      location: 'ตะกั่วทุ่ง, พังงา',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      caption: 'ตื่นเช้ามาชมพระอาทิตย์ขึ้นเหนืออ่าวพังงา หมอกจางๆ ลอยเหนือน้ำและเกาะหินปูน สวยสะกดใจจนอยากอยู่นานๆ 🌊🏔️',
      likesCount: 94,
    },
  ];

  // Lifestyle Spots Quests (Curated travel, cafe, and nature challenge quests)
  const spotQuests = [
    {
      id: 'quest-spot-1',
      title: 'Cafe Hunter 5: ตามรอย 5 คาเฟ่ Specialty ย่านยอดฮิต',
      badgeIcon: '☕',
      rewardPoints: 300,
      participantsCount: 380,
      badgeLabel: 'Cafe Explorer',
    },
    {
      id: 'quest-spot-2',
      title: 'Green Nature Walk: สูดอากาศบริสุทธิ์ในพื้นที่สีเขียว 77 จังหวัด',
      badgeIcon: '🌿',
      rewardPoints: 250,
      participantsCount: 320,
      badgeLabel: 'Nature Seeker',
    },
    {
      id: 'quest-spot-3',
      title: 'Sunset Scenic Spot: ปักหมุดชมพระอาทิตย์ตก ณ จุดชมวิวแลนด์มาร์ก',
      badgeIcon: '🌅',
      rewardPoints: 200,
      participantsCount: 260,
      badgeLabel: 'Sunset Chaser',
    },
  ];

  return (
    <section className="space-y-6 pt-2 scroll-mt-24">
      {/* Editorial Header - Forest Green Theme */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-transparent p-4 sm:p-5 rounded-2xl border border-emerald-100/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-[#4A7C59] flex items-center justify-center text-xs font-black shrink-0 border border-emerald-500/20 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#4A7C59]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              โมเมนต์พิกัดฮีลใจ & เควสต์นักเดินทาง
            </h2>
            <span className="text-[10px] sm:text-xs font-bold text-[#4A7C59] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200/90 shadow-2xs">
              77 Provinces Hidden Gems
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
            ภาพบรรยากาศจริงจากจุดเช็คอินทั่วไทย และภารกิจสะสมเหรียญรางวัลตามรอยพิกัดธรรมชาติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-[#4A7C59] border border-emerald-200/90 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>ดูโมเมนต์ทั้งหมด</span>
          </Link>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>เควสต์ทั้งหมด</span>
          </Link>
        </div>
      </div>

      {/* Grid: 2 Columns on Desktop (Recent Moments + Trending Quests) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Recent Spot Moments (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#4A7C59]" />
              <span>ภาพบรรยากาศจริงจากพิกัดชิล</span>
            </h3>
            <Link
              href="/moments"
              className="text-xs font-bold text-[#4A7C59] hover:underline flex items-center gap-1"
            >
              <span>เรื่องราวทั้งหมด</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {spotMoments.map((moment) => (
              <Link
                key={moment.id}
                href="/moments"
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1"
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
                      <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="truncate max-w-[100px]">{moment.targetTitle}</span>
                    </span>
                  </div>

                  {/* Likes Pill */}
                  <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold text-white bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                    <Heart className="w-3 h-3 fill-emerald-400 text-emerald-400" />
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

        {/* Right Column: Trending Spot Quests (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-700" />
              <span>เควสต์ท้าทายสายท่องเที่ยว</span>
            </h3>
            <Link
              href="/challenges"
              className="text-xs font-bold text-[#4A7C59] hover:underline flex items-center gap-1"
            >
              <span>ดูเควสต์ทั้งหมด</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {spotQuests.map((quest) => (
              <Link
                key={quest.id}
                href="/challenges"
                className="group bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-200/80 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                    {quest.badgeIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-emerald-900 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        +{quest.rewardPoints} XP
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {quest.participantsCount} คนกำลังทำ
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5 group-hover:text-[#4A7C59] transition-colors">
                      {quest.title}
                    </h4>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#4A7C59] bg-emerald-50 group-hover:bg-[#4A7C59] group-hover:text-white px-2.5 py-1.5 rounded-xl border border-emerald-200/80 group-hover:border-[#4A7C59] transition-colors">
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
