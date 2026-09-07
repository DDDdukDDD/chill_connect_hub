'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EventItem } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import { Sparkles, Dices, X, RefreshCw, Calendar, MapPin, Users, ArrowRight, Clock, Mountain, Building2 } from 'lucide-react';

export type SurpriseItem =
  | {
      kind: 'spot';
      id: string;
      title: string;
      image: string;
      description: string;
      location: string;
      badgeText: string;
      tag?: string;
      openHours?: string;
      original: LifestyleSpotItem;
    }
  | {
      kind: 'community';
      id: string;
      title: string;
      image: string;
      description: string;
      location: string;
      badgeText: string;
      tag?: string;
      price?: string;
      date?: string;
      original: EventItem;
    }
  | {
      kind: 'fair';
      id: string;
      title: string;
      image: string;
      description: string;
      location: string;
      badgeText: string;
      tag?: string;
      price?: string;
      date?: string;
      original: EventItem;
    };

interface SurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'all' | 'spots' | 'community' | 'fairs';
  events: EventItem[];
  spots?: LifestyleSpotItem[];
  onSelectEvent?: (event: EventItem) => void;
  onSelectTarget?: (target: { type: 'spot' | 'community' | 'fair'; id: string }) => void;
}

export const SurpriseModal: React.FC<SurpriseModalProps> = ({
  isOpen,
  onClose,
  mode = 'all',
  events,
  spots = [],
  onSelectEvent,
  onSelectTarget,
}) => {
  const [isSpinning, setIsSpinning] = useState(true);
  const [pickedItem, setPickedItem] = useState<SurpriseItem | null>(null);

  // Build pool based on mode
  const itemsPool = useMemo(() => {
    const list: SurpriseItem[] = [];

    // Filter active (non-ended) events
    const activeEvents = events.filter((e) => {
      if (e.status === 'ended') return false;
      if (e.badgeText?.includes('สิ้นสุด') || e.badgeText?.includes('จบแล้ว')) return false;
      return true;
    });

    if (mode === 'spots' || mode === 'all') {
      spots.forEach((s) => {
        const cleanLabel = (s.categoryLabel || 'พิกัดเที่ยว').replace(/^[\p{Emoji}\u200d\uFE0F\s]+/gu, '').trim() || 'พิกัดเที่ยว';
        list.push({
          kind: 'spot',
          id: s.id,
          title: s.title,
          image: s.image,
          description: s.description || (s.vibeTags && s.vibeTags.join(', ')) || s.categoryLabel,
          location: `${s.district ? s.district + ', ' : ''}${s.province}`,
          badgeText: cleanLabel,
          openHours: s.openHours,
          tag: s.vibeTags?.[0] || s.categoryLabel,
          original: s,
        });
      });
    }

    if (mode === 'community' || mode === 'all') {
      const communityEvents = activeEvents.filter((e) => e.eventType !== 'public_venue');
      communityEvents.forEach((e) => {
        list.push({
          kind: 'community',
          id: e.id,
          title: e.title,
          image: e.image,
          description: e.description,
          location: e.location,
          badgeText: 'กิจกรรมคอมมูนิตี้',
          price: e.price,
          date: e.date,
          tag: e.tag,
          original: e,
        });
      });
    }

    if (mode === 'fairs' || mode === 'all') {
      const fairEvents = activeEvents.filter((e) => e.eventType === 'public_venue');
      fairEvents.forEach((e) => {
        list.push({
          kind: 'fair',
          id: e.id,
          title: e.title,
          image: e.image,
          description: e.description,
          location: e.location,
          badgeText: 'งานมหกรรม & เอ็กซ์โป',
          price: e.price,
          date: e.date,
          tag: e.venueTag || e.tag,
          original: e,
        });
      });
    }

    return list;
  }, [mode, events, spots]);

  const headerConfig = useMemo(() => {
    switch (mode) {
      case 'spots':
        return {
          gradient: 'from-[#2D5A3C] via-[#4A7C59] to-teal-800',
          title: 'สุ่มพิกัดฮีลใจ (Surprise Spot)',
          subtitle: isSpinning ? 'กำลังเสี่ยงทายพิกัดฮีลใจที่ดีที่สุดให้คุณ...' : 'วันหยุดนี้ ลองไปพักใจที่นี่ดูสิ!',
          spinningText: 'กำลังเลือกพิกัดฮีลใจจาก 77 จังหวัดทั่วไทย...',
          countText: `คัดสรรจาก ${itemsPool.length} พิกัดเที่ยว & จุดฮีลใจ`,
          btnColor: 'bg-[#4A7C59] hover:bg-[#386244] shadow-[#4A7C59]/25',
          btnLabel: 'ดูพิกัดสถานที่',
        };
      case 'community':
        return {
          gradient: 'from-orange-600 via-[#F26430] to-amber-600',
          title: 'สุ่มตี้กิจกรรม (Surprise Meetup)',
          subtitle: isSpinning ? 'กำลังเสี่ยงทายตี้เพื่อนใหม่ที่ใช่ให้คุณ...' : 'วันหยุดนี้ ลองไปจอยตี้กับเพื่อนใหม่!',
          spinningText: 'กำลังเลือกกิจกรรมคอมมูนิตี้ที่เปิดรับสมัคร...',
          countText: `คัดสรรจาก ${itemsPool.length} กิจกรรมที่เปิดรับสมัคร`,
          btnColor: 'bg-[#F26430] hover:bg-[#D95322] shadow-[#F26430]/25',
          btnLabel: 'ดูกิจกรรม',
        };
      case 'fairs':
        return {
          gradient: 'from-slate-900 via-[#2B527A] to-blue-900',
          title: 'สุ่มงานแฟร์ & เอ็กซ์โป (Surprise Fair)',
          subtitle: isSpinning ? 'กำลังเสี่ยงทายงานแฟร์น่าไปให้คุณ...' : 'วันหยุดนี้ ลองไปเดินงานนี้ดูสิ!',
          spinningText: 'กำลังคัดสรรงานมหกรรมและนิทรรศการน่าเดิน...',
          countText: `คัดสรรจาก ${itemsPool.length} งานแฟร์ทั่วประเทศ`,
          btnColor: 'bg-[#2B527A] hover:bg-[#1E3B59] shadow-[#2B527A]/25',
          btnLabel: 'ดูงานแฟร์',
        };
      default:
        return {
          gradient: 'from-[#4A7C59] via-[#F26430] to-[#2B527A]',
          title: 'สุ่มกิจกรรม & พิกัดเที่ยว (Surprise Me)',
          subtitle: isSpinning ? 'กำลังเสี่ยงทายสิ่งที่ใช่สำหรับวันหยุดคุณ...' : 'วันหยุดนี้ ลองไปที่นี่ดูสิ!',
          spinningText: 'กำลังสุ่มสิ่งที่ดีที่สุดสำหรับวันหยุดของคุณ...',
          countText: `คัดสรรจาก ${itemsPool.length} รายการทั่วไทย`,
          btnColor: 'bg-[#F26430] hover:bg-[#D95322] shadow-[#F26430]/25',
          btnLabel: 'ดูรายละเอียด',
        };
    }
  }, [mode, isSpinning, itemsPool.length]);

  const rollRandom = () => {
    if (itemsPool.length === 0) return;
    setIsSpinning(true);

    // Fast cycling effect for 1.2s
    let counter = 0;
    const interval = setInterval(() => {
      const rand = itemsPool[Math.floor(Math.random() * itemsPool.length)];
      setPickedItem(rand);
      counter++;
      if (counter >= 10) {
        clearInterval(interval);
        const finalPick = itemsPool[Math.floor(Math.random() * itemsPool.length)];
        setPickedItem(finalPick);
        setIsSpinning(false);
      }
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      rollRandom();
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleConfirmSelect = () => {
    if (!pickedItem) return;
    onClose();
    if (onSelectTarget) {
      onSelectTarget({ type: pickedItem.kind, id: pickedItem.id });
    } else if (onSelectEvent && pickedItem.kind !== 'spot') {
      onSelectEvent(pickedItem.original as EventItem);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 sm:pt-4 pb-24 sm:pb-4 overflow-y-auto bg-black/65 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-scale-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Dynamic Gradient Accent */}
        <div className={`bg-gradient-to-r ${headerConfig.gradient} p-4 sm:p-5 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                {headerConfig.title}
              </h3>
              <p className="text-[11px] text-white/80 font-medium truncate">
                {headerConfig.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 ml-2"
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
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto animate-bounce shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse text-[#F26430]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-[#1E293B] animate-pulse">
                  {headerConfig.spinningText}
                </p>
                <p className="text-xs text-slate-500">
                  {headerConfig.countText}
                </p>
              </div>
            </div>
          ) : pickedItem ? (
            /* Selected Item Card */
            <div className="space-y-3 animate-fade-in">
              {/* Image with Pillar Badge */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-slate-100">
                <img
                  src={pickedItem.image}
                  alt={pickedItem.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-xs">
                    {pickedItem.kind === 'spot' && <Mountain className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {pickedItem.kind === 'community' && <Users className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                    {pickedItem.kind === 'fair' && <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    <span>{pickedItem.badgeText}</span>
                  </span>
                </div>
                {pickedItem.kind !== 'spot' && pickedItem.price && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full text-white shadow-md ${
                      pickedItem.kind === 'fair' ? 'bg-[#2B527A]' : 'bg-[#F26430]'
                    }`}>
                      {pickedItem.price}
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-base text-slate-900 leading-snug line-clamp-2">
                  {pickedItem.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {pickedItem.description}
                </p>

                {/* Meta Details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-700">
                  {pickedItem.kind === 'spot' ? (
                    <>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                        <span className="truncate">{pickedItem.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                        <span className="truncate">{pickedItem.openHours || 'เปิดให้บริการปกติ'}</span>
                      </div>
                    </>
                  ) : pickedItem.kind === 'fair' ? (
                    <>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                        <span className="truncate">{pickedItem.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#2B527A] shrink-0" />
                        <span className="truncate">{pickedItem.location}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                        <span className="truncate">{pickedItem.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                        <span className="truncate">{pickedItem.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              ไม่พบข้อมูลสำหรับสุ่มในหมวดนี้
            </div>
          )}

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

            {pickedItem && (
              <button
                type="button"
                onClick={handleConfirmSelect}
                disabled={isSpinning}
                className={`flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm ${
                  pickedItem.kind === 'spot'
                    ? 'bg-[#4A7C59] hover:bg-[#386244] shadow-[#4A7C59]/25'
                    : pickedItem.kind === 'fair'
                    ? 'bg-[#2B527A] hover:bg-[#1E3B59] shadow-[#2B527A]/25'
                    : 'bg-[#F26430] hover:bg-[#D95322] shadow-[#F26430]/25'
                } text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
              >
                <span>
                  {pickedItem.kind === 'spot'
                    ? 'ดูพิกัดสถานที่'
                    : pickedItem.kind === 'fair'
                    ? 'ดูงานแฟร์'
                    : 'ดูกิจกรรม'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

