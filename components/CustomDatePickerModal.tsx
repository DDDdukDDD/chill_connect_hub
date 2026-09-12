'use client';

import React, { useState } from 'react';
import { X, Calendar, Check, RotateCcw } from 'lucide-react';

interface CustomDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
  onReset?: () => void;
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
  onReset,
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

  const handleClear = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTempStart(todayStr);
    setTempEnd(todayStr);
    if (onReset) {
      onReset();
      onClose();
    }
  };

  const displayStartDMY = formatToDMY(tempStart);
  const displayEndDMY = formatToDMY(tempEnd);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-slate-50/40 to-transparent flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
              ระบุช่วงเวลาตามใจคุณ
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              เลือกวันเดียว หรือช่วงวันที่ต้องการไปกิจกรรม
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200/80 transition-colors flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setMode('single');
                setTempEnd(tempStart);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                mode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>เลือกวันเดียว</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                mode === 'range'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>เลือกช่วงวันที่</span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-500">ทางลัดด่วน:</p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => handleQuickPreset('this_weekend')}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <span>เสาร์-อาทิตย์นี้</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('next_week')}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <span>สัปดาห์หน้า</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('next_month')}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <span>เดือนหน้าทั้งเดือน</span>
              </button>
            </div>
          </div>

          {/* Date Picker Inputs (Formatted as DD/MM/YYYY) */}
          {mode === 'single' ? (
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-700">
                ระบุวันที่ต้องการไป:
              </label>
              <div className="relative bg-white border border-slate-200 hover:border-[#2563EB] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 rounded-xl p-3 flex items-center justify-between shadow-2xs transition-all cursor-pointer group">
                <span className="text-sm font-extrabold text-slate-900 tracking-wide font-mono">
                  {displayStartDMY}
                </span>
                <Calendar className="w-4 h-4 text-[#2563EB] group-hover:scale-110 transition-transform shrink-0" />
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
            <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    วันที่เริ่มต้น:
                  </label>
                  <div className="relative bg-white border border-slate-200 hover:border-[#2563EB] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-all cursor-pointer group">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide font-mono">
                      {displayStartDMY}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB] group-hover:scale-110 transition-transform shrink-0" />
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
                  <label className="block text-xs font-bold text-slate-700">
                    ถึงวันที่:
                  </label>
                  <div className="relative bg-white border border-slate-200 hover:border-[#2563EB] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 rounded-xl p-2.5 flex items-center justify-between shadow-2xs transition-all cursor-pointer group">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide font-mono">
                      {displayEndDMY}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB] group-hover:scale-110 transition-transform shrink-0" />
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

          {/* Selected Date Summary Frosted Badge */}
          <div className="text-center p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-800 font-bold flex items-center justify-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>
              {mode === 'single'
                ? `เลือกวัน: ${displayStartDMY}`
                : `เลือกช่วงเวลา: ${displayStartDMY} ถึง ${displayEndDMY}`}
            </span>
          </div>

        </div>

        {/* Modal Footer: Unified Royal Blue CTA (#2563EB) + Reset Option */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2.5">
          {onReset && (
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 px-3.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>ล้างตัวเลือก</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>นำไปใช้</span>
          </button>
        </div>

      </div>
    </div>
  );
};
