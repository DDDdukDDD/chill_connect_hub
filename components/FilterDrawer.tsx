'use client';

import React from 'react';
import { X, Filter, RotateCcw, Check, MapPin, Users, Tag, Building2, SlidersHorizontal } from 'lucide-react';
import { PUBLIC_VENUES } from '@/components/MoodFilterChips';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: 'heal' | 'move' | 'chill' | 'learn' | null;
  setSelectedCategory: (cat: 'heal' | 'move' | 'chill' | 'learn' | null) => void;
  selectedVenueFilter: string | null;
  setSelectedVenueFilter: (venue: string | null) => void;
  selectedGroupSize: 'all' | 'community' | 'public_venue';
  setSelectedGroupSize: (size: 'all' | 'community' | 'public_venue') => void;
  priceFilter: 'all' | 'free' | 'under500';
  setPriceFilter: (price: 'all' | 'free' | 'under500') => void;
  onResetAll: () => void;
  totalResultsCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  setSelectedCategory,
  selectedVenueFilter,
  setSelectedVenueFilter,
  selectedGroupSize,
  setSelectedGroupSize,
  priceFilter,
  setPriceFilter,
  onResetAll,
  totalResultsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-[#E8E2D8]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F26430] flex items-center justify-center text-white shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1E293B]">
                ตัวกรองค้นหาละเอียด (Advanced Filter)
              </h3>
              <p className="text-[11px] text-[#64748B] font-medium">
                ค้นหากิจกรรมที่ตรงใจคุณมากที่สุด
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#1E293B]">
          
          {/* Section 1: รูปแบบกิจกรรม & ขนาดกลุ่ม */}
          <div className="space-y-2.5">
            <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#4A7C59]" />
              <span>รูปแบบการจัดงาน & ขนาดกลุ่ม:</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: '✨ ทั้งหมด' },
                { id: 'community', label: '🌱 กลุ่มย่อย 4-8 คน' },
                { id: 'public_venue', label: '🏛️ งานใหญ่ Hall' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGroupSize(item.id as any)}
                  className={`p-2.5 rounded-xl font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    selectedGroupSize === item.id
                      ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: หมวดหมู่อารมณ์กิจกรรม */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-4 h-4 text-[#F26430]" />
              <span>หมวดหมู่อารมณ์กิจกรรม:</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: null, label: '✨ รวมทุกอารมณ์' },
                { id: 'chill', label: '☕ นัดชิลล์ / จิบกาแฟ' },
                { id: 'move', label: '🏃 ออกกำลังกาย / สปอร์ต' },
                { id: 'heal', label: '🌿 ฮีลใจ / ธรรมชาติ' },
                { id: 'learn', label: '🎨 เวิร์กช็อป / งานคราฟต์' },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id || 'all-cat'}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#F26430] text-white border-[#F26430] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: สถานที่ / ย่านจัดงาน */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>สถานที่ / ศูนย์การแสดงสินค้า:</span>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedVenueFilter(null)}
                className={`px-3 py-1.5 rounded-full font-bold border transition-all ${
                  selectedVenueFilter === null
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                ทุกสถานที่
              </button>
              {PUBLIC_VENUES.map((venue) => {
                const isSelected = selectedVenueFilter === venue.id;
                return (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => setSelectedVenueFilter(isSelected ? null : venue.id)}
                    className={`px-3 py-1.5 rounded-full font-bold border transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {venue.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: ค่าใช้จ่าย */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5 uppercase tracking-wider">
              <span>💰 งบประมาณ / ค่าใช้จ่าย:</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'ทุกระดับราคา' },
                { id: 'free', label: '🎁 เข้าร่วมฟรี!' },
                { id: 'under500', label: '💵 ไม่เกิน 500 บาท' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriceFilter(p.id as any)}
                  className={`p-2 rounded-xl font-bold border transition-all text-center text-xs ${
                    priceFilter === p.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetAll}
            className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างฟิลเตอร์ทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
          >
            แสดง {totalResultsCount} กิจกรรม
          </button>
        </div>

      </div>
    </div>
  );
};
