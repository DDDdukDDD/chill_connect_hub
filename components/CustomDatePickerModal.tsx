'use client';

import React, { useState } from 'react';
import { X, Calendar, Check } from 'lucide-react';

interface CustomDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
  onReset: () => void;
}

// Convert YYYY-MM-DD to DD/MM/YYYY
const formatToDMY = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return dateStr;
};

// Convert DD/MM/YYYY to YYYY-MM-DD for native input
const formatToYMD = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
};

export const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onApply,
}) => {
  const [mode, setMode] = useState<'single' | 'range'>(endDate && endDate !== startDate ? 'range' : 'single');
  const [tempStart, setTempStart] = useState<string>(formatToYMD(startDate));
  const [tempEnd, setTempEnd] = useState<string>(formatToYMD(endDate || startDate));

  if (!isOpen) return null;

  const handleQuickPreset = (preset: 'this_weekend' | 'next_week' | 'next_month') => {
    const today = new Date();
    if (preset === 'this_weekend') {
      const day = today.getDay();
      const distToSat = (6 - day + 7) % 7;
      const sat = new Date(today);
      sat.setDate(today.getDate() + (distToSat === 0 ? 0 : distToSat));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);

      setTempStart(sat.toISOString().split('T')[0]);
      setTempEnd(sun.toISOString().split('T')[0]);
      setMode('range');
    } else if (preset === 'next_week') {
      const nextMon = new Date(today);
      nextMon.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      const nextSun = new Date(nextMon);
      nextSun.setDate(nextMon.getDate() + 6);

      setTempStart(nextMon.toISOString().split('T')[0]);
      setTempEnd(nextSun.toISOString().split('T')[0]);
      setMode('range');
    } else if (preset === 'next_month') {
      const startNextM = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endNextM = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      setTempStart(startNextM.toISOString().split('T')[0]);
      setTempEnd(endNextM.toISOString().split('T')[0]);
      setMode('range');
    }
  };

  const handleApply = () => {
    if (mode === 'single') {
      const dmy = formatToDMY(tempStart);
      onApply(dmy, dmy);
    } else {
      if (tempEnd && tempEnd < tempStart) {
        onApply(formatToDMY(tempEnd), formatToDMY(tempStart));
      } else {
        onApply(formatToDMY(tempStart), formatToDMY(tempEnd || tempStart));
      }
    }
    onClose();
  };

  const displayStartDMY = formatToDMY(tempStart);
  const displayEndDMY = formatToDMY(tempEnd);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E8E2D8] bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F26430] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1E293B]">ระบุช่วงเวลาตามใจคุณ</h3>
              <p className="text-xs text-slate-500 font-medium">เลือกวันเดี่ยว หรือช่วงวันที่ต้องการไปกิจกรรม</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => {
                setMode('single');
                setTempEnd(tempStart);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'single'
                  ? 'bg-white text-[#1E293B] shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 เลือกวันเดียว
            </button>
            <button
              onClick={() => setMode('range')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'range'
                  ? 'bg-[#F26430] text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-[#F26430]'
              }`}
            >
              🗓️ เลือกช่วงวันที่
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ทางลัดด่วน:</p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => handleQuickPreset('this_weekend')}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:border-amber-400 cursor-pointer"
              >
                ☀️ เสาร์-อาทิตย์นี้
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('next_week')}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:border-emerald-400 cursor-pointer"
              >
                📅 สัปดาห์หน้า
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('next_month')}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-900 border border-sky-200 hover:border-sky-400 cursor-pointer"
              >
                🗓️ เดือนหน้าทั้งเดือน
              </button>
            </div>
          </div>

          {/* Date Picker Form Inputs (Always formatted as DD/MM/YYYY inside the box) */}
          {mode === 'single' ? (
            <div className="space-y-2 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8]">
              <label className="block text-xs font-bold text-[#1E293B]">
                ระบุวันที่ต้องการไป:
              </label>
              <div className="relative bg-white border border-[#E8E2D8] hover:border-[#F26430] focus-within:border-[#F26430] rounded-xl p-3 flex items-center justify-between shadow-2xs transition-colors cursor-pointer group">
                <span className="text-sm font-extrabold text-[#1E293B] tracking-wide">
                  {displayStartDMY}
                </span>
                <Calendar className="w-4 h-4 text-[#F26430] group-hover:scale-110 transition-transform shrink-0" />
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => {
                    if (e.target.value) {
                      setTempStart(e.target.value);
                      setTempEnd(e.target.value);
                    }
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1E293B]">
                    วันที่เริ่มต้น:
                  </label>
                  <div className="relative bg-white border border-[#E8E2D8] hover:border-[#F26430] focus-within:border-[#F26430] rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-colors cursor-pointer group">
                    <span className="text-xs sm:text-sm font-extrabold text-[#1E293B] tracking-wide">
                      {displayStartDMY}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-[#4A7C59] group-hover:scale-110 transition-transform shrink-0" />
                    <input
                      type="date"
                      value={tempStart}
                      onChange={(e) => {
                        if (e.target.value) setTempStart(e.target.value);
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1E293B]">
                    ถึงวันที่:
                  </label>
                  <div className="relative bg-white border border-[#E8E2D8] hover:border-[#F26430] focus-within:border-[#F26430] rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-colors cursor-pointer group">
                    <span className="text-xs sm:text-sm font-extrabold text-[#1E293B] tracking-wide">
                      {displayEndDMY}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-[#4A7C59] group-hover:scale-110 transition-transform shrink-0" />
                    <input
                      type="date"
                      value={tempEnd}
                      onChange={(e) => {
                        if (e.target.value) setTempEnd(e.target.value);
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Date Summary Badge */}
          <div className="text-center p-3 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-[#F26430] font-bold flex items-center justify-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {mode === 'single'
                ? `เลือกวัน: ${displayStartDMY}`
                : `เลือกช่วงเวลา: ${displayStartDMY} ถึง ${displayEndDMY}`}
            </span>
          </div>

        </div>

        {/* Modal Footer (Single Prominent Apply Button - No cancel or reset button) */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E2D8]">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3 text-xs sm:text-sm font-bold text-white bg-[#F26430] hover:bg-[#D95322] rounded-xl shadow-md shadow-[#F26430]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>นำไปใช้</span>
          </button>
        </div>

      </div>
    </div>
  );
};
