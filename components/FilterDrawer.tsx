'use client';

import React from 'react';
import { X, RotateCcw, Check, MapPin, Users, Tag, Building2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { PUBLIC_VENUES } from '@/components/MoodFilterChips';
import { BANGKOK_ZONES } from '@/data/mockData';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: 'heal' | 'move' | 'chill' | 'learn' | null;
  setSelectedCategory: (cat: 'heal' | 'move' | 'chill' | 'learn' | null) => void;
  selectedVenueFilter: string | null;
  setSelectedVenueFilter: (venue: string | null) => void;
  selectedZone: string | null;
  setSelectedZone: (zone: string | null) => void;
  selectedGroupSize: 'community' | 'public_venue';
  setSelectedGroupSize: (size: 'community' | 'public_venue') => void;
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
  selectedZone,
  setSelectedZone,
  selectedGroupSize,
  setSelectedGroupSize,
  priceFilter,
  setPriceFilter,
  onResetAll,
  totalResultsCount,
}) => {
  if (!isOpen) return null;

  // Calculate total active filters count
  const activeCount = [
    selectedCategory !== null,
    selectedVenueFilter !== null,
    selectedZone !== null,
    priceFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-fade-in flex justify-end">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-[#E8E2D8]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A7C59] flex items-center justify-center text-white shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#1E293B]">
                  ตัวกรองค้นหาขั้นสูง
                </h3>
                {activeCount > 0 && (
                  <span className="text-[10px] font-black bg-[#F26430] text-white px-2 py-0.5 rounded-full">
                    ใช้งาน {activeCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B]">
                ปรับแต่งเงื่อนไขเพื่อค้นหากิจกรรมที่ตรงใจคุณ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200/80 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-[#1E293B]">
          
          {/* Section 1: สถานที่ & ศูนย์จัดงานหลัก */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>สถานที่ & ศูนย์แสดงสินค้าหลัก:</span>
              </label>
              {selectedVenueFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedVenueFilter(null)}
                  className="text-[11px] text-[#F26430] hover:underline font-bold cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedVenueFilter(null)}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                  selectedVenueFilter === null
                    ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
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
                    className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
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

          {/* Section 2: ทำเล / ย่านในกรุงเทพฯ */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>ทำเล / ย่านในกรุงเทพฯ:</span>
              </label>
              {selectedZone && (
                <button
                  type="button"
                  onClick={() => setSelectedZone(null)}
                  className="text-[11px] text-[#F26430] hover:underline font-bold cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className={`p-2.5 rounded-xl font-bold border transition-all text-xs text-left flex items-center justify-between cursor-pointer ${
                  selectedZone === null
                    ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>ทุกย่านทั่วกรุงเทพฯ</span>
                {selectedZone === null && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>

              {BANGKOK_ZONES.map((z) => {
                const isSelected = selectedZone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setSelectedZone(isSelected ? null : z.id)}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-xs text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <span className="truncate">{z.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: หมวดหมู่อารมณ์กิจกรรม */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#F26430]" />
                <span>หมวดหมู่อารมณ์ & สไตล์กิจกรรม:</span>
              </label>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-[11px] text-[#F26430] hover:underline font-bold cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: null, label: 'รวมทุกหมวดหมู่' },
                { id: 'heal', label: 'ฮีลใจ & พักผ่อน (Heal)' },
                { id: 'move', label: 'กีฬา & ออกกำลังกาย (Move)' },
                { id: 'chill', label: 'คาเฟ่ & นัดชิลล์ (Chill)' },
                { id: 'learn', label: 'ศิลปะ & เวิร์กช็อป (Learn)' },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id || 'all-cat'}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#F26430] text-white border-[#F26430] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: งบประมาณ / ค่าใช้จ่าย */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                <span>งบประมาณ / ค่าใช้จ่าย:</span>
              </label>
              {priceFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setPriceFilter('all')}
                  className="text-[11px] text-[#F26430] hover:underline font-bold cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'ทุกระดับราคา' },
                { id: 'free', label: '🎉 เข้าร่วมฟรี!' },
                { id: 'under500', label: '💵 ไม่เกิน ฿500' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriceFilter(p.id as any)}
                  className={`p-2.5 rounded-xl font-bold border transition-all text-center text-xs cursor-pointer ${
                    priceFilter === p.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: รูปแบบกิจกรรม & ขนาดกลุ่ม */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#4A7C59]" />
              <span>รูปแบบงาน:</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'public_venue', label: '🏛️ อีเวนต์ & งานแฟร์' },
                { id: 'community', label: '🌿 Chill & Connect Community' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGroupSize(item.id as any)}
                  className={`p-3 rounded-xl font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedGroupSize === item.id
                      ? item.id === 'public_venue'
                        ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                        : 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E2D8] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetAll}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>ล้างทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-[#4A7C59] hover:bg-[#3B6447] text-white px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            แสดง {totalResultsCount} กิจกรรม
          </button>
        </div>

      </div>
    </div>
  );
};
