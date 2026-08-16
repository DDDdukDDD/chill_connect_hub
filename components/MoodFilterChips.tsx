'use client';

import React from 'react';
import { MOOD_CATEGORIES, MoodCategory } from '@/data/mockData';
import { Sparkles, ChevronRight, Layers } from 'lucide-react';

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

interface MoodFilterChipsProps {
  selectedCategory: 'heal' | 'move' | 'chill' | 'learn' | null;
  setSelectedCategory: (categoryId: 'heal' | 'move' | 'chill' | 'learn' | null) => void;
  selectedSubCategory: string | null;
  setSelectedSubCategory: (subCatId: string | null) => void;
}

export const MoodFilterChips: React.FC<MoodFilterChipsProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
}) => {
  const currentSubList = selectedCategory ? SUB_CATEGORIES_MAP[selectedCategory] : [];

  return (
    <div className="space-y-3">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight flex items-center gap-2">
          <span>หมวดหมู่กิจกรรมยามว่าง</span>
        </h2>
        {(selectedCategory || selectedSubCategory) && (
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubCategory(null);
            }}
            className="text-xs font-semibold text-[#4A7C59] hover:underline flex items-center gap-1"
          >
            <span>ล้างฟิลเตอร์ทั้งหมด</span>
          </button>
        )}
      </div>

      {/* Level 1: Main Mood Category Chips */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 pt-1 scroll-smooth">
        
        {/* All option chip */}
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSelectedSubCategory(null);
          }}
          className={`shrink-0 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 border shadow-xs ${
            selectedCategory === null
              ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-[#4A7C59]/20 scale-102'
              : 'bg-white text-[#475569] border-[#E2DCD2] hover:border-[#4A7C59] hover:bg-[#EBF3ED]'
          }`}
        >
          <span>✨ ทั้งหมด</span>
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
                  setSelectedSubCategory(null); // Reset sub-category on level 1 change
                }
              }}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 border shadow-xs ${
                isSelected
                  ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-[#4A7C59]/20 scale-102'
                  : 'bg-white text-[#334155] border-[#E2DCD2] hover:border-[#4A7C59] hover:bg-[#EBF3ED]'
              }`}
            >
              <span className="text-sm sm:text-base">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Level 2: Dynamic Sub-category Chips (Appears when Level 1 is active) */}
      {selectedCategory && currentSubList.length > 0 && (
        <div className="bg-[#EBF3ED]/70 rounded-2xl p-3 border border-[#C5DCCB] space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4A7C59] px-1">
            <Layers className="w-3.5 h-3.5" />
            <span>เจาะจงประเภทกิจกรรมย่อย (Level 2):</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
            {/* Sub All option */}
            <button
              onClick={() => setSelectedSubCategory(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
                selectedSubCategory === null
                  ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                  : 'bg-white text-[#475569] border-[#C5DCCB] hover:border-[#1E293B]'
              }`}
            >
              <span>ทั้งหมดในหมวดนี้</span>
            </button>

            {currentSubList.map((subItem) => {
              const isSubSelected = selectedSubCategory === subItem.id;
              return (
                <button
                  key={subItem.id}
                  onClick={() =>
                    setSelectedSubCategory(isSubSelected ? null : subItem.id)
                  }
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
                    isSubSelected
                      ? 'bg-[#F26430] text-white border-[#F26430] shadow-xs scale-105'
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
  );
};
