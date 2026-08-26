'use client';

import React, { useState } from 'react';
import { X, RotateCcw, Check, MapPin, Users, Tag, Building2, SlidersHorizontal, Sparkles, Search, Compass, ShieldCheck } from 'lucide-react';
import { PUBLIC_VENUES } from '@/components/MoodFilterChips';
import { BANGKOK_ZONES } from '@/data/mockData';
import { SPOT_CATEGORIES, SPOT_PROVINCES } from '@/data/spotsData';

const ALL_THAI_PROVINCES = [
  'กรุงเทพฯ', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี',
  'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม',
  'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์',
  'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พังงา', 'พัทลุง', 'พิจิตร',
  'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'พะเยา', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน',
  'ยะลา', 'ยโสธร', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ',
  'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
  'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อุดรธานี',
  'อุทัยธานี', 'อุตรดิตถ์', 'อุบลราชธานี', 'อำนาจเจริญ'
];

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
  // Spot specific props
  isSpotsMode?: boolean;
  selectedSpotCategory?: string;
  setSelectedSpotCategory?: (cat: string) => void;
  selectedSpotProvince?: string;
  setSelectedSpotProvince?: (prov: string) => void;
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
  isSpotsMode = false,
  selectedSpotCategory = 'all',
  setSelectedSpotCategory,
  selectedSpotProvince = 'all',
  setSelectedSpotProvince,
}) => {
  const [provinceSearch, setProvinceSearch] = useState('');

  if (!isOpen) return null;

  // Calculate active filter count
  const activeCount = isSpotsMode
    ? [
        selectedSpotCategory !== 'all',
        selectedSpotProvince !== 'all',
        priceFilter !== 'all',
      ].filter(Boolean).length
    : [
        selectedCategory !== null,
        selectedVenueFilter !== null,
        selectedZone !== null,
        priceFilter !== 'all',
      ].filter(Boolean).length;

  const filteredProvinces = ALL_THAI_PROVINCES.filter((p) =>
    p.toLowerCase().includes(provinceSearch.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-black/60 backdrop-blur-xs animate-fade-in flex justify-end">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-[#E8E2D8]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A7C59] flex items-center justify-center text-white shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#1E293B]">
                  {isSpotsMode ? 'ตัวกรองสถานที่ขั้นสูง' : 'ตัวกรองค้นหาขั้นสูง'}
                </h3>
                {activeCount > 0 && (
                  <span className="text-[10px] font-black bg-[#F26430] text-white px-2 py-0.5 rounded-full">
                    ใช้งาน {activeCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B]">
                {isSpotsMode
                  ? 'เลือกจังหวัดและหมวดหมู่สถานที่เที่ยวทั่วประเทศ'
                  : 'ปรับแต่งเงื่อนไขเพื่อค้นหากิจกรรมที่ตรงใจคุณ'}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#1E293B]">
          
          {/* ========================================================================= */}
          {/* SPOTS MODE FILTERS (สถานที่เที่ยว & จุดฮีลใจ)                               */}
          {/* ========================================================================= */}
          {isSpotsMode ? (
            <>
              {/* Spot Section 1: เลือกจังหวัดทั่วไทย (77 จังหวัด พร้อมช่องค้นหา) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D95322]" />
                    <span>ค้นหา & เลือกจังหวัดทั่วไทย (77 จังหวัด):</span>
                  </label>
                  {selectedSpotProvince !== 'all' && setSelectedSpotProvince && (
                    <button
                      type="button"
                      onClick={() => setSelectedSpotProvince('all')}
                      className="text-[11px] text-[#F26430] hover:underline font-bold cursor-pointer"
                    >
                      ดูทั่วประเทศ
                    </button>
                  )}
                </div>

                {/* Search Box for Provinces */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    placeholder="พิมพ์ชื่อจังหวัด เช่น เชียงใหม่, น่าน, กาญจนบุรี..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#D95322]"
                  />
                </div>

                {/* Province Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setSelectedSpotProvince && setSelectedSpotProvince('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold border text-xs transition-all cursor-pointer ${
                      selectedSpotProvince === 'all'
                        ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    ✨ ทั่วประเทศ
                  </button>

                  {filteredProvinces.map((prov) => {
                    const isSelected = selectedSpotProvince === prov || (selectedSpotProvince === 'bangkok' && prov === 'กรุงเทพฯ') || (selectedSpotProvince === 'chiangmai' && prov === 'เชียงใหม่');
                    return (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => setSelectedSpotProvince && setSelectedSpotProvince(prov)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D95322] text-white border-[#D95322] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-[#D95322]/50'
                        }`}
                      >
                        {prov}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spot Section 2: หมวดหมู่สถานที่ */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#4A7C59]" />
                    <span>หมวดหมู่สถานที่ & บรรยากาศ:</span>
                  </label>
                  {selectedSpotCategory !== 'all' && setSelectedSpotCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedSpotCategory('all')}
                      className="text-[11px] text-[#F26430] hover:underline font-bold cursor-pointer"
                    >
                      ล้าง
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SPOT_CATEGORIES.map((cat) => {
                    const isSelected = selectedSpotCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedSpotCategory && setSelectedSpotCategory(cat.id)}
                        className={`p-2.5 rounded-xl font-bold border transition-all text-xs text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{cat.icon} {cat.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spot Section 3: ค่าเข้าชม / ราคา */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>ค่าเข้าชมสถานที่:</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceFilter('all')}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-xs text-left flex items-center justify-between cursor-pointer ${
                      priceFilter === 'all'
                        ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>ทั้งหมด (ฟรี & มีค่าเข้า)</span>
                    {priceFilter === 'all' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-xs text-left flex items-center justify-between cursor-pointer ${
                      priceFilter === 'free'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <span>🎉 เข้าฟรี 100%</span>
                    {priceFilter === 'free' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ========================================================================= */
            /* EVENTS MODE FILTERS (อีเวนต์ & กิจกรรมคอมมูนิตี้)                           */
            /* ========================================================================= */
            <>
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
                <label className="font-extrabold text-xs text-[#1E293B] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>งบประมาณ / ค่าใช้จ่าย:</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'free', label: 'ฟรี 100%' },
                    { id: 'under500', label: 'ไม่เกิน 500฿' },
                  ].map((p) => {
                    const isSelected = priceFilter === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriceFilter(p.id as any)}
                        className={`p-2.5 rounded-xl font-bold border transition-all text-xs text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-[#FAF7F2] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetAll}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างตัวกรองทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#4A7C59] hover:bg-[#3D6649] text-white py-2.5 px-5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer text-center"
          >
            <span>ดูผลลัพธ์ ({totalResultsCount} รายการ)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
