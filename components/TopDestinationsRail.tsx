'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Check, Sparkles, Compass, X } from 'lucide-react';
import { usePublishedSpots } from '@/lib/usePublishedSpots';

export interface TopDestinationItem {
  id: string;
  nameEn: string;
  nameTh: string;
  provinceKey: string;
  imageUrl: string;
  tagline: string;
  isUserFavorite?: boolean;
}

export const TOP_DESTINATIONS: TopDestinationItem[] = [
  {
    id: 'bkk',
    nameEn: 'Bangkok',
    nameTh: 'กรุงเทพมหานคร',
    provinceKey: 'กรุงเทพฯ',
    imageUrl: '/images/destinations/bkk.jpg',
    tagline: 'เมืองหลวงแห่งคาเฟ่และพื้นที่สีเขียว',
  },
  {
    id: 'chonburi',
    nameEn: 'Pattaya / Chonburi',
    nameTh: 'พัทยา • ชลบุรี',
    provinceKey: 'ชลบุรี',
    imageUrl: '/images/destinations/chonburi.jpg',
    tagline: 'ทะเลใกล้กรุง คาเฟ่ริมหาด และเกาะสีชัง',
    isUserFavorite: true,
  },
  {
    id: 'chiangmai',
    nameEn: 'Chiang Mai',
    nameTh: 'เชียงใหม่',
    provinceKey: 'เชียงใหม่',
    imageUrl: '/images/destinations/chiangmai.jpg',
    tagline: 'ดินแดนสโลว์บาร์ ธรรมชาติ และดอยสูง',
  },
  {
    id: 'phuket',
    nameEn: 'Phuket',
    nameTh: 'ภูเก็ต',
    provinceKey: 'ภูเก็ต',
    imageUrl: '/images/destinations/phuket.jpg',
    tagline: 'ไข่มุกอันดามัน ย่านเมืองเก่าชิโนโปรตุกีส',
  },
  {
    id: 'huahin',
    nameEn: 'Hua Hin / Cha-am',
    nameTh: 'หัวหิน • ประจวบฯ',
    provinceKey: 'ประจวบคีรีขันธ์',
    imageUrl: '/images/destinations/huahin.jpg',
    tagline: 'หาดทรายขาว ลมทะเล และอ่างเก็บน้ำเขาเต่า',
    isUserFavorite: true,
  },
  {
    id: 'krabi',
    nameEn: 'Krabi',
    nameTh: 'กระบี่',
    provinceKey: 'กระบี่',
    imageUrl: '/images/destinations/krabi.jpg',
    tagline: 'สระมรกต หินผาอ่าวไร่เลย์ และน้ำทะเลใส',
    isUserFavorite: true,
  },
  {
    id: 'hatyai',
    nameEn: 'Hat Yai / Songkhla',
    nameTh: 'หาดใหญ่ • สงขลา',
    provinceKey: 'สงขลา',
    imageUrl: '/images/destinations/hatyai.jpg',
    tagline: 'เมืองเก่าถนนนางงาม วิวเขาคอหงส์ และคาเฟ่ธรรมชาติ',
    isUserFavorite: true,
  },
  {
    id: 'kanchanaburi',
    nameEn: 'Kanchanaburi',
    nameTh: 'กาญจนบุรี',
    provinceKey: 'กาญจนบุรี',
    imageUrl: '/images/destinations/kanchanaburi.jpg',
    tagline: 'แม่น้ำแคว ป่าเขียวขจี และน้ำตกเอราวัณ',
  },
  {
    id: 'khaoyai',
    nameEn: 'Khao Yai / Korat',
    nameTh: 'เขาใหญ่ • นครราชสีมา',
    provinceKey: 'นครราชสีมา',
    imageUrl: '/images/destinations/khaoyai.jpg',
    tagline: 'โอโซนบริสุทธิ์ ฟาร์ม และขุนเขาอันเงียบสงบ',
  },
  {
    id: 'nan',
    nameEn: 'Nan',
    nameTh: 'น่าน',
    provinceKey: 'น่าน',
    imageUrl: '/images/destinations/nan.jpg',
    tagline: 'ทุ่งนาปัว วิถีชีวิตเนิบช้า และขุนเขาเขียวขจี',
  },
  {
    id: 'samui',
    nameEn: 'Koh Samui / Surat',
    nameTh: 'เกาะสมุย • สุราษฎร์ฯ',
    provinceKey: 'สุราษฎร์ธานี',
    imageUrl: '/images/destinations/samui.jpg',
    tagline: 'ทะเลอ่าวไทย เขื่อนเชี่ยวหลาน และเกาะในฝัน',
  },
  {
    id: 'ayutthaya',
    nameEn: 'Ayutthaya',
    nameTh: 'พระนครศรีอยุธยา',
    provinceKey: 'พระนครศรีอยุธยา',
    imageUrl: '/images/destinations/ayutthaya.jpg',
    tagline: 'เมืองเก่ามรดกโลก คาเฟ่ริมน้ำ และเสน่ห์สยาม',
  },
];

interface TopDestinationsRailProps {
  selectedProvince: string;
  onSelectProvince: (prov: string) => void;
  className?: string;
}

export const TopDestinationsRail: React.FC<TopDestinationsRailProps> = ({
  selectedProvince,
  onSelectProvince,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Actual counts per province from the live published catalog
  const { spots } = usePublishedSpots();
  const countsMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    spots.forEach((spot) => {
      const p = spot.province;
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [spots]);

  const totalAllSpots = spots.length;

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const distance = 240;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const isCurrentActive = (destKey: string) => {
    if (selectedProvince === 'all') return false;
    const pLow = selectedProvince.toLowerCase();
    const dLow = destKey.toLowerCase();
    return pLow.includes(dLow) || dLow.includes(pLow);
  };

  return (
    <div className={`relative space-y-2 sm:space-y-2.5 ${className}`}>
      
      {/* Header Row: Title & Quick Reset Pill */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
            <span>จุดหมายปลายทางยอดนิยมในไทย</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 font-sans uppercase tracking-wider hidden sm:inline">
              Top Destinations in Thailand
            </span>
          </h3>
        </div>

        {/* 77 Provinces Quick Reset Pill */}
        {selectedProvince !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectProvince('all')}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] sm:text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 group/clear"
            title="คลิกเพื่อล้างตัวกรองและแสดงพิกัดทั่วประเทศทั้งหมด"
          >
            <X className="w-3 h-3 text-slate-300 group-hover/clear:text-white transition-colors" />
            <span>ล้างตัวกรอง (ดูครบ 77 จังหวัด {totalAllSpots})</span>
          </button>
        )}
      </div>

      {/* Rail Outer Wrapper with Floating Scroll Buttons */}
      <div className="relative group/rail">
        
        {/* Left Arrow Button (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute -left-2.5 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            aria-label="เลื่อนซ้าย"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Right Arrow Button (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute -right-2.5 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            aria-label="เลื่อนขวา"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none scroll-smooth pt-1.5 pb-2 px-1 select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TOP_DESTINATIONS.map((dest) => {
            const active = isCurrentActive(dest.provinceKey);
            const spotCount = countsMap[dest.provinceKey] || 4;

            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => {
                  if (active) {
                    onSelectProvince('all'); // Toggle off back to all
                  } else {
                    onSelectProvince(dest.provinceKey);
                  }
                }}
                className="group flex flex-col items-center text-center shrink-0 w-[94px] sm:w-[108px] md:w-[118px] cursor-pointer focus:outline-none transition-all duration-200"
              >
                {/* Image Container with Rounded Shape (Agoda/Airbnb Style) */}
                <div className={`relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-xs transition-all duration-300 ${
                  active
                    ? 'ring-2 sm:ring-3 ring-[#4A7C59] ring-offset-1 sm:ring-offset-2 scale-[1.02] shadow-md'
                    : 'group-hover:shadow-md group-hover:scale-[1.02] border border-slate-200/80'
                }`}>
                  <img
                    src={dest.imageUrl}
                    alt={dest.nameTh}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-[1.02] saturate-[1.05]"
                    loading="lazy"
                  />

                  {/* Gentle gradient bottom scrim for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Active Checked Badge */}
                  {active && (
                    <div className="absolute top-1.5 right-1.5 bg-[#4A7C59] text-white p-0.5 sm:p-1 rounded-full shadow-md animate-fade-in">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Spot Count Pill on Image (Bottom Left) */}
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-[9px] sm:text-[10px] font-bold text-white tracking-tight">
                    {spotCount} จุด
                  </div>
                </div>

                {/* Destination Name below image */}
                <div className="mt-1.5 w-full px-0.5 text-center">
                  <p className={`text-[11px] sm:text-xs font-extrabold truncate transition-colors leading-tight ${
                    active ? 'text-[#4A7C59]' : 'text-slate-900 group-hover:text-[#4A7C59]'
                  }`}>
                    {dest.nameEn}
                  </p>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 truncate mt-0.5">
                    {dest.nameTh}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
