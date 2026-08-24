'use client';

import React, { useState, useEffect } from 'react';
import { EventItem } from '@/data/mockData';
import { Sparkles, Dices, X, RefreshCw, Calendar, MapPin, Users, ArrowRight, Flame } from 'lucide-react';

interface SurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
}

export const SurpriseModal: React.FC<SurpriseModalProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
}) => {
  const activeEvents = events.filter((e) => {
    if (e.status === 'ended') return false;
    if (e.badgeText?.includes('สิ้นสุด') || e.badgeText?.includes('จบแล้ว')) return false;
    return true;
  });
  const [isSpinning, setIsSpinning] = useState(true);
  const [pickedEvent, setPickedEvent] = useState<EventItem | null>(null);

  const rollRandom = () => {
    if (activeEvents.length === 0) return;
    setIsSpinning(true);

    // Fast cycling effect for 1.2s
    let counter = 0;
    const interval = setInterval(() => {
      const rand = activeEvents[Math.floor(Math.random() * activeEvents.length)];
      setPickedEvent(rand);
      counter++;
      if (counter >= 10) {
        clearInterval(interval);
        const finalPick = activeEvents[Math.floor(Math.random() * activeEvents.length)];
        setPickedEvent(finalPick);
        setIsSpinning(false);
      }
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      rollRandom();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 sm:pt-4 pb-24 sm:pb-4 overflow-y-auto bg-black/65 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8E2D8] overflow-hidden animate-scale-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Gradient Accent */}
        <div className="bg-gradient-to-r from-orange-500 via-[#F26430] to-amber-500 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                สุ่มกิจกรรมวันหยุด (Surprise Me!)
              </h3>
              <p className="text-[11px] text-orange-100 font-medium">
                {isSpinning ? 'กำลังเสี่ยงทายกิจกรรมที่ใช่ให้คุณ...' : 'วันหยุดนี้ ลองไปงานนี้ดูสิ! 🎉'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {isSpinning ? (
            /* Spinning Excitement Placeholder */
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-[#F26430] flex items-center justify-center mx-auto animate-bounce shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-[#1E293B] animate-pulse">
                  กำลังเลือกกิจกรรมเด็ดประจำวันหยุด...
                </p>
                <p className="text-xs text-slate-500">
                  คัดสรรจาก {activeEvents.length} กิจกรรมที่กำลังเปิดรับสมัคร
                </p>
              </div>
            </div>
          ) : pickedEvent ? (
            /* Selected Event Card */
            <div className="space-y-3 animate-fade-in">
              {/* Event Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100">
                <img
                  src={pickedEvent.image}
                  alt={pickedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {pickedEvent.eventType === 'public_venue' ? '🏛️ อีเวนต์ & งานแฟร์' : '🌿 Chill & Connect Community'}
                  </span>
                </div>
                {pickedEvent.price && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-md">
                      {pickedEvent.price}
                    </span>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-base text-[#1E293B] leading-snug line-clamp-2">
                  {pickedEvent.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {pickedEvent.description}
                </p>

                {/* Meta Details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    <span className="truncate">{pickedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                    <span className="truncate">{pickedEvent.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={rollRandom}
              disabled={isSpinning}
              className="flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>สุ่มใหม่อีกที</span>
            </button>

            {pickedEvent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectEvent(pickedEvent);
                }}
                disabled={isSpinning}
                className="flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-[#F26430] hover:bg-[#D95322] text-white shadow-md shadow-[#F26430]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>ดูรายละเอียด</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
