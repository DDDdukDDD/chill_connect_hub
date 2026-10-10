'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Trophy, Heart, ArrowRight, Sparkles, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

export const SpotsDiscoveryHighlights: React.FC = () => {
  // Lifestyle Spots & Nature Moments (Curated 8 scenic/cafe/nature moments for manual sliding)
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
    {
      id: 'post-spot-4',
      userName: 'คุณต้น (Ton_Camp)',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'ลานกางเต็นท์ผากล้วยไม้',
      location: 'อุทยานฯ เขาใหญ่',
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
      caption: 'นอนดูดาวท่ามกลางลมหนาวเขาใหญ่ ก่อกองไฟต้มกาแฟยามเช้า ได้ยินเสียงนกร้องสดชื่นเป็นธรรมชาติสุดๆ ⛺🌲',
      likesCount: 87,
    },
    {
      id: 'post-spot-5',
      userName: 'คุณพลอย (Ploy_Peak)',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'กิ่วแม่ปาน ยอดดอยอินทนนท์',
      location: 'จอมทอง, เชียงใหม่',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      caption: 'เดินเทรลเส้นทางธรรมชาติกิ่วแม่ปาน ทะเลหมอกสีขาวแน่นสุดลูกหูลูกตา อากาศ 10 องศาเย็นสดชื่นมาก 🏔️❄️',
      likesCount: 99,
    },
    {
      id: 'post-spot-6',
      userName: 'คุณเบนซ์ (Benz_Street)',
      userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'ย่านตลาดน้อยริมน้ำ',
      location: 'สัมพันธวงศ์, กรุงเทพฯ',
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      caption: 'ถ่ายรูปเล่นสตรีทอาร์ตและตึกแถวโบราณตลาดน้อย จิบชาไทยเย็นริมแม่น้ำเจ้าพระยาช่วงบ่ายแก่ๆ คลาสสิกมาก 📸🏮',
      likesCount: 73,
    },
    {
      id: 'post-spot-7',
      userName: 'คุณแนน (Nan_Ride)',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'คุ้งบางกะเจ้า ปอดสีเขียว',
      location: 'พระประแดง, สมุทรปราการ',
      imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
      caption: 'เช่าจักรยานปั่นเลียบคลองชมสวนมะพร้าว แวะตลาดน้ำบางน้ำผึ้งเติมพลัง สูดโอโซนใกล้กรุงได้เต็มปอด 🚲🍃',
      likesCount: 81,
    },
    {
      id: 'post-spot-8',
      userName: 'คุณกาย (Guy_Sunset)',
      userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      targetTitle: 'หาดไร่เลย์ & ถ้ำพระนาง',
      location: 'อ่าวนาง, กระบี่',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      caption: 'นั่งเรือหางยาวมาปีนหน้าผาไร่เลย์ วิวหน้าผาหินปูนตัดกับน้ำทะเลสีมรกต พระอาทิตย์ตกสวยจนแทบลืมหายใจ ⛵🌅',
      likesCount: 92,
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [spotMoments.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 200;
    const gap = 12;
    const scrollAmount = (cardWidth + gap) * 2;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

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
        
        {/* Left Column: Recent Spot Moments (7 cols) with Manual Slide */}
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

          {/* Manual Scrollable Container with Floating Mid-Arrows */}
          <div className="relative group/carousel">
            {/* Floating Left Arrow */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
              title="เลื่อนไปทางซ้าย"
              aria-label="Previous moments"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Floating Right Arrow */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md hover:shadow-lg hover:bg-white flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
              title="เลื่อนไปทางขวา"
              aria-label="Next moments"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex overflow-x-auto no-scrollbar gap-3 pb-2 pt-0.5 px-0.5 snap-x snap-mandatory scroll-smooth"
            >
              {spotMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="w-[185px] sm:w-[200px] md:w-[210px] shrink-0 snap-start"
                >
                  <Link
                    href="/moments"
                    className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer w-full select-none"
                  >
                    {/* Full-bleed Photo */}
                    <img
                      src={moment.imageUrl}
                      alt={moment.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Subtle Top Shadow for Location Badge */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

                    {/* Deep Bottom Shadow for Text & Info */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />

                    {/* Top Location Badge */}
                    {(moment.location || moment.targetTitle) && (
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/95 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 truncate max-w-full">
                          <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{moment.location || moment.targetTitle}</span>
                        </span>
                      </div>
                    )}

                    {/* Bottom Overlaid Caption and Author Details (Borderless) */}
                    <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end space-y-1.5 z-10">
                      <p className="text-white text-xs font-semibold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-emerald-200 transition-colors">
                        {moment.caption}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between text-white/90 border-t border-white/15">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img
                            src={moment.userAvatar}
                            alt={moment.userName}
                            className="w-4 h-4 rounded-full object-cover border border-white/40 shrink-0"
                          />
                          <span className="truncate text-[10.5px] font-medium text-white/90">
                            {moment.userName.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-rose-300 font-bold text-[10.5px] shrink-0 ml-1">
                          <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                          <span>{moment.likesCount}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
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
