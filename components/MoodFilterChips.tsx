'use client';

import React from 'react';
import { MOOD_CATEGORIES, MoodCategory } from '@/data/mockData';
import { Sparkles, MapPin, Layers, Building2, Flame, Sprout } from 'lucide-react';

export interface SubCategoryItem {
  id: string;
  label: string;
  tagQuery?: string;
}

export const SUB_CATEGORIES_MAP: Record<'heal' | 'move' | 'chill' | 'learn', SubCategoryItem[]> = {
  heal: [
    { id: 'soundbath', label: '🧘 สมาธิ & Singing Bowls', tagQuery: 'Introvert-friendly' },
    { id: 'yoga', label: '🌿 โยคะ & ธรรมชาติ', tagQuery: 'Mindfulness' },
    { id: 'introvert', label: '🤍 Introvert Friendly', tagQuery: 'Introvert-friendly' },
  ],
  move: [
    { id: 'hyrox', label: '🔥 HYROX & ฟิตเนส', tagQuery: 'Hyrox' },
    { id: 'run', label: '🏃 วิ่งเมือง & Beginner', tagQuery: 'Beginner' },
    { id: 'climb', label: '🧗 ปีนหน้าผา & เอ็กซ์ตรีม', tagQuery: 'Climbing' },
    { id: 'watersport', label: '🚣 พายซับบอร์ดเจ้าพระยา', tagQuery: 'WaterSport' },
  ],
  chill: [
    { id: 'boardgame', label: '🎲 คืนบอร์ดเกม อโศก', tagQuery: 'BoardGame' },
    { id: 'coffee', label: '☕ จิบกาแฟ & ดนตรีสด', tagQuery: 'CoffeeLover' },
    { id: 'film', label: '📸 เดินถ่ายภาพกล้องฟิล์ม', tagQuery: 'FilmPhoto' },
  ],
  learn: [
    { id: 'pottery', label: '🏺 ปั้นดิน & เซรามิค', tagQuery: 'Handmade' },
    { id: 'latte', label: '☕ Latte Art & สกัดกาแฟ', tagQuery: 'CoffeeMaster' },
    { id: 'candle', label: '🕯️ เทียนหอมอโรมา', tagQuery: 'CraftWarmth' },
  ],
};

export const PUBLIC_VENUES = [
  { id: 'qsncc', label: '🏛️ ศูนย์ฯ สิริกิติ์ (QSNCC)', tagQuery: 'สิริกิติ์' },
  { id: 'bitec', label: '🏢 ไบเทค บางนา (BITEC)', tagQuery: 'ไบเทค' },
  { id: 'impact', label: '🎪 อิมแพ็ค เมืองทอง', tagQuery: 'อิมแพ็ค' },
  { id: 'marathon', label: '🏃 งานวิ่ง / มาราธอน', tagQuery: 'มาราธอน' },
  { id: 'park', label: '🌳 สวนสาธารณะ', tagQuery: 'สวน' },
];

interface MoodFilterChipsProps {
  eventTypeTab: 'public_venue' | 'community';
  selectedCategory: 'heal' | 'move' | 'chill' | 'learn' | null;
  setSelectedCategory: (categoryId: 'heal' | 'move' | 'chill' | 'learn' | null) => void;
  selectedSubCategory: string | null;
  setSelectedSubCategory: (subCatId: string | null) => void;
  selectedVenueFilter?: string | null;
  setSelectedVenueFilter?: (venueId: string | null) => void;
}

export const MoodFilterChips: React.FC<MoodFilterChipsProps> = ({
  eventTypeTab,
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
  selectedVenueFilter = null,
  setSelectedVenueFilter,
}) => {
  const currentSubList = selectedCategory ? SUB_CATEGORIES_MAP[selectedCategory] : [];
  const hasActiveFilter = selectedCategory || selectedSubCategory || selectedVenueFilter;

  const resetAllFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    if (setSelectedVenueFilter) setSelectedVenueFilter(null);
  };

  return (
    <div className="space-y-3">
      
      {/* 🏛️ MODE 1: PUBLIC VENUE / GENERAL EVENTS */}
      {eventTypeTab === 'public_venue' && (
        <div className="space-y-2.5 bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-2xs animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>ศูนย์แสดงสินค้า & สถานที่จัดงาน:</span>
            </h3>
            {selectedVenueFilter && (
              <button onClick={resetAllFilters} className="text-xs text-[#F26430] font-bold hover:underline cursor-pointer">
                ล้างฟิลเตอร์
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedVenueFilter && setSelectedVenueFilter(null)}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                selectedVenueFilter === null
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              ทุกสถานที่
            </button>

            {PUBLIC_VENUES.map((venue) => {
              const isVenueSelected = selectedVenueFilter === venue.id;
              return (
                <button
                  key={venue.id}
                  onClick={() => {
                    if (setSelectedVenueFilter) {
                      setSelectedVenueFilter(isVenueSelected ? null : venue.id);
                    }
                  }}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                    isVenueSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-102 font-extrabold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-white'
                  }`}
                >
                  <span>{venue.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 🌱 MODE 2: COMMUNITY MEETUPS & WORKSHOPS */}
      {eventTypeTab === 'community' && (
        <div className="space-y-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-2xs animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#4A7C59]" />
              <span>หมวดหมู่อารมณ์ & กิจกรรมชุมชน:</span>
            </h3>
            {hasActiveFilter && (
              <button onClick={resetAllFilters} className="text-xs text-[#F26430] font-bold hover:underline cursor-pointer">
                ล้างฟิลเตอร์
              </button>
            )}
          </div>

          {/* Level 1 Mood Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubCategory(null);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all border ${
                selectedCategory === null
                  ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                  : 'bg-white text-[#475569] border-[#E2DCD2] hover:border-[#4A7C59]'
              }`}
            >
              ✨ ทุกหมวดกิจกรรม
            </button>

            {MOOD_CATEGORIES.map((cat: MoodCategory) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                    } else {
                      setSelectedCategory(cat.id);
                      setSelectedSubCategory(null);
                    }
                  }}
                  className={`shrink-0 rounded-full px-4.5 py-2 text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs scale-102 font-extrabold'
                      : 'bg-[#FAF7F2] text-[#334155] border-[#E2DCD2] hover:border-[#4A7C59] hover:bg-white'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Level 2 Sub-category Chips */}
          {selectedCategory && currentSubList.length > 0 && (
            <div className="bg-[#EBF3ED]/80 rounded-xl p-2.5 border border-[#C5DCCB] space-y-1.5 animate-fade-in mt-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#4A7C59] px-1">
                <Layers className="w-3.5 h-3.5" />
                <span>กิจกรรมย่อยเฉพาะทาง:</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition-all border ${
                    selectedSubCategory === null
                      ? 'bg-[#1E293B] text-white border-[#1E293B]'
                      : 'bg-white text-[#475569] border-[#C5DCCB] hover:border-[#1E293B]'
                  }`}
                >
                  ทั้งหมดในหมวดนี้
                </button>

                {currentSubList.map((subItem) => {
                  const isSubSelected = selectedSubCategory === subItem.id;
                  return (
                    <button
                      key={subItem.id}
                      onClick={() =>
                        setSelectedSubCategory(isSubSelected ? null : subItem.id)
                      }
                      className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition-all border ${
                        isSubSelected
                          ? 'bg-[#F26430] text-white border-[#F26430] font-extrabold'
                          : 'bg-white text-[#334155] border-[#C5DCCB] hover:border-[#F26430] hover:text-[#F26430]'
                      }`}
                    >
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
