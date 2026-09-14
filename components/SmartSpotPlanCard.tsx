'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  LifestyleSpotItem,
  getNearbySpots,
  getDistanceKm,
} from '@/data/spotsData';
import { resolveSpotImage } from '@/lib/spotImageResolver';
import { SmartSpotPlanModal, ItineraryStopItem } from '@/components/SmartSpotPlanModal';

interface SmartSpotPlanCardProps {
  currentSpot: LifestyleSpotItem;
  onOpenFullModal?: () => void;
  onShowToast?: (msg: string) => void;
}

// Helper to strip rogue emojis from text fields for clean, minimal typography
const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const SmartSpotPlanCard: React.FC<SmartSpotPlanCardProps> = ({
  currentSpot,
  onOpenFullModal,
  onShowToast,
}) => {
  const [stopCount, setStopCount] = useState<number>(3);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Discover nearby spots
  const nearbyCandidates = useMemo(() => {
    return getNearbySpots(currentSpot, 14);
  }, [currentSpot]);

  const otherSpots = useMemo(() => {
    return nearbyCandidates.filter((s) => s.id !== currentSpot.id);
  }, [nearbyCandidates, currentSpot]);

  // Rotate based on shuffleSeed
  const shuffledOthers = useMemo(() => {
    if (otherSpots.length === 0) return [];
    const offset = shuffleSeed % otherSpots.length;
    return [...otherSpots.slice(offset), ...otherSpots.slice(0, offset)];
  }, [otherSpots, shuffleSeed]);

  const formatTransitTime = (km: number) => {
    if (km <= 0.5) return `ห่าง ${(km * 1000).toFixed(0)} ม. • เดิน 5 นาที`;
    if (km <= 1.5) return `ห่าง ${km.toFixed(1)} กม. • ขับรถ 4 นาที`;
    if (km <= 5) return `ห่าง ${km.toFixed(1)} กม. • ขับรถ 8-10 นาที`;
    return `ห่าง ${km.toFixed(1)} กม. • ขับรถ ${(km * 2.5).toFixed(0)} นาที`;
  };

  // Human-friendly time slot definitions based on total stops count
  const getSlotDetails = (index: number, total: number) => {
    if (total === 3) {
      if (index === 0) return { label: 'ช่วงเช้า', time: '09:00 - 11:30 น.' };
      if (index === 1) return { label: 'ช่วงกลางวัน', time: '12:00 - 15:30 น.' };
      return { label: 'ช่วงเย็น', time: '16:00 - 19:30 น.' };
    }
    if (total === 4) {
      if (index === 0) return { label: 'ช่วงเช้า', time: '09:00 - 11:00 น.' };
      if (index === 1) return { label: 'ช่วงกลางวัน', time: '11:30 - 14:00 น.' };
      if (index === 2) return { label: 'ช่วงบ่าย', time: '14:30 - 16:30 น.' };
      return { label: 'ช่วงเย็น', time: '17:00 - 19:30 น.' };
    }
    if (total === 5) {
      if (index === 0) return { label: 'ช่วงเช้าตรู่', time: '08:30 - 10:30 น.' };
      if (index === 1) return { label: 'ช่วงสาย/เที่ยง', time: '11:00 - 12:30 น.' };
      if (index === 2) return { label: 'ช่วงบ่าย', time: '13:00 - 15:00 น.' };
      if (index === 3) return { label: 'ช่วงบ่ายแก่', time: '15:30 - 17:30 น.' };
      return { label: 'ช่วงเย็น/ค่ำ', time: '18:00 - 20:00 น.' };
    }
    // total === 6
    if (index === 0) return { label: 'ช่วงเช้าตรู่', time: '08:00 - 09:45 น.' };
    if (index === 1) return { label: 'ช่วงสาย', time: '10:15 - 12:00 น.' };
    if (index === 2) return { label: 'ช่วงเที่ยง/บ่าย', time: '12:30 - 14:30 น.' };
    if (index === 3) return { label: 'ช่วงบ่าย', time: '15:00 - 16:30 น.' };
    if (index === 4) return { label: 'ช่วงเย็นชมวิว', time: '17:00 - 18:30 น.' };
    return { label: 'ช่วงค่ำ/ดินเนอร์', time: '19:00 - 20:45 น.' };
  };

  // Build the dynamic stops
  const stops: ItineraryStopItem[] = useMemo(() => {
    const list: ItineraryStopItem[] = [];
    const neededOthers = stopCount - 1;
    const selectedOthers = shuffledOthers.slice(0, neededOthers);

    // Keep currentSpot nicely anchored in the midday slot
    const currentSpotIndex = stopCount <= 4 ? 1 : 2;

    const allSpots: LifestyleSpotItem[] = [];
    let otherIdx = 0;
    for (let i = 0; i < stopCount; i++) {
      if (i === currentSpotIndex) {
        allSpots.push(currentSpot);
      } else {
        allSpots.push(selectedOthers[otherIdx] || currentSpot);
        otherIdx++;
      }
    }

    // Calculate transit times between consecutive stops
    for (let i = 0; i < allSpots.length; i++) {
      const sp = allSpots[i];
      const slot = getSlotDetails(i, allSpots.length);
      let estimatedTransit: string | undefined = undefined;

      if (i > 0) {
        const prev = allSpots[i - 1];
        const dist = getDistanceKm(prev.latitude, prev.longitude, sp.latitude, sp.longitude);
        estimatedTransit = formatTransitTime(dist);
      }

      list.push({
        timeSlot: slot.time,
        slotLabel: slot.label,
        stepNumber: String(i + 1).padStart(2, '0'),
        spot: sp,
        isCurrentSpot: sp.id === currentSpot.id,
        estimatedTransit,
      });
    }

    return list;
  }, [stopCount, shuffledOthers, currentSpot]);

  // Google Maps URL with multi-stop waypoints
  const multiStopMapsUrl = useMemo(() => {
    if (stops.length <= 1) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentSpot.title + ' ' + (currentSpot.district || currentSpot.province))}`;
    }
    const origin = encodeURIComponent(stops[0].spot.title + ' ' + (stops[0].spot.district || stops[0].spot.province));
    const destination = encodeURIComponent(stops[stops.length - 1].spot.title + ' ' + (stops[stops.length - 1].spot.district || stops[stops.length - 1].spot.province));
    const waypoints = stops
      .slice(1, -1)
      .map((s) => encodeURIComponent(s.spot.title + ' ' + (s.spot.district || s.spot.province)))
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
  }, [stops, currentSpot]);

  const handleShuffle = () => {
    setShuffleSeed((prev) => prev + 1);
    if (onShowToast) onShowToast('สลับพิกัดทางเลือกใหม่แล้ว');
  };

  const handleAddStop = () => {
    if (stopCount < 6) {
      const next = stopCount + 1;
      setStopCount(next);
      if (onShowToast) onShowToast(`เพิ่มจุดที่ ${next} ในเส้นทางแล้ว`);
    }
  };

  const handleResetStops = () => {
    setStopCount(3);
    if (onShowToast) onShowToast('รีเซ็ตกลับเป็น 3 พิกัดหลักแล้ว');
  };

  const handleSharePlan = async () => {
    const tripTitle = `แผนเที่ยว 1 วันรอบย่าน ${cleanText(currentSpot.district || currentSpot.province)} (${stops.length} จุด)`;
    const stopsText = stops
      .map((s) => `${s.stepNumber}. ${s.slotLabel}: ${cleanText(s.spot.title)} (${cleanText(s.spot.district || s.spot.province)})`)
      .join('\n');

    const fullMessage = `${tripTitle}\n\n${stopsText}\n\nเปิดเส้นทาง Google Maps: ${multiStopMapsUrl}\n\nวางแผนท่องเที่ยวได้ที่ Chill & Connect Hub`;

    // Universal Web Share API for Mobile and Desktop
    if (
      typeof window !== 'undefined' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ title: tripTitle, text: fullMessage })
    ) {
      try {
        await navigator.share({
          title: tripTitle,
          text: fullMessage,
          url: multiStopMapsUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(fullMessage).then(() => {
      setIsCopied(true);
      if (onShowToast) onShowToast('คัดลอกแผนเที่ยวแล้ว พร้อมแชร์ได้ทันที');
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  const openFullModal = () => {
    setIsModalOpen(true);
    if (onOpenFullModal) onOpenFullModal();
  };

  return (
    <>
      <div className="bg-gradient-to-b from-[#FAFBF9] via-white to-[#F4F8F5] rounded-3xl p-3.5 sm:p-4 border border-[#DFE8E1] shadow-sm relative overflow-hidden space-y-3">
        {/* Ambient Luxury Glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#4A7C59]/8 rounded-full blur-2xl pointer-events-none" />

        {/* Header: Organic Luxury Forest Green Badge & Compact Typography */}
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#2D5A3C] to-[#3B6E4C] text-white text-[10.5px] font-black shadow-xs border border-[#4A7C59]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] animate-pulse shrink-0" />
              <span className="tracking-wide">Smart Plan • เที่ยวรอบย่าน</span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
              ทริป 1 วันรอบย่าน {cleanText(currentSpot.district || currentSpot.province)}
            </h3>

            <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
              <span className="inline-flex items-center font-extrabold text-[#2D5A3C] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#C5DEC9]">
                {stops.length} จุดเช็คอิน
              </span>
              <span className="text-slate-500 font-medium truncate">
                ร้อยเรียงเส้นทางต่อเนื่อง
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2D5A3C] hover:text-[#1B432C] bg-white hover:bg-[#F4F8F5] px-2.5 py-1 rounded-xl border border-[#C5DEC9] hover:border-[#A8CEB3] shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 mt-0.5"
            title="สลับพิกัดทางเลือกใหม่"
          >
            <span>สลับทริป</span>
            <span className="text-[#4A7C59]">↺</span>
          </button>
        </div>

        {/* Dynamic Stops Sequence: Perfectly Sized (<=3 Stops fully visible with zero cutoff; >3 stops scrollable) */}
        <div
          className={`space-y-2 relative z-0 ${
            stops.length > 3 ? 'max-h-[300px] overflow-y-auto pr-1' : 'overflow-visible'
          }`}
        >
          {stops.map((item, idx) => (
            <div key={`${item.spot.id}-${idx}`} className="relative pl-7 z-10">
              {/* Unbroken Connecting Line to the next stop */}
              {idx < stops.length - 1 && (
                <div
                  className="absolute left-2.5 top-6 -bottom-2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-[#A8CEB3] to-[#88BD97] z-0 pointer-events-none rounded-full"
                  aria-hidden="true"
                />
              )}

              {/* Step Node Circle */}
              <div
                className={`absolute left-2.5 top-2.5 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-2xs z-10 ${
                  item.isCurrentSpot
                    ? 'bg-[#2D5A3C] text-white ring-3 ring-[#DDF0E1]'
                    : 'bg-white text-[#2D5A3C] border-[1.5px] border-[#A8CEB3] ring-2 ring-white'
                }`}
              >
                {item.stepNumber}
              </div>

              {/* Stop Content Card: Compact 20% reduced height */}
              <div
                className={`p-2.5 rounded-xl transition-all space-y-1.5 ${
                  item.isCurrentSpot
                    ? 'bg-gradient-to-br from-[#F2F8F4] via-white to-[#EBF5ED] border-[1.5px] border-[#3D7850] shadow-xs'
                    : 'bg-white hover:bg-[#FAFDFB] border border-[#D5E4D8] shadow-2xs hover:border-[#A8CEB3]'
                }`}
              >
                {/* Slot Header & Highlight Tag */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-black text-[10.5px] px-2 py-0.5 rounded-md border shrink-0 ${
                        item.isCurrentSpot
                          ? 'text-[#2D5A3C] bg-[#DDF0E1] border-[#BBDDC3]'
                          : 'text-slate-800 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {item.slotLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold truncate">
                      {item.timeSlot}
                    </span>
                  </div>

                  {item.isCurrentSpot ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9.5px] font-black bg-[#2D5A3C] text-white shadow-2xs shrink-0">
                      ★ พิกัดนี้
                    </span>
                  ) : (
                    <Link
                      href={`/spots/${item.spot.id}`}
                      className="text-[10.5px] font-extrabold text-[#2D5A3C] hover:text-[#1B432C] hover:underline shrink-0"
                    >
                      ดูข้อมูล
                    </Link>
                  )}
                </div>

                {/* Title & Compact Thumbnail */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-11 h-11 rounded-lg overflow-hidden shrink-0 border shadow-2xs relative ${
                      item.isCurrentSpot
                        ? 'border-[#BBDDC3] bg-[#EBF3ED]'
                        : 'border-slate-200 bg-slate-100'
                    }`}
                  >
                    <img
                      src={resolveSpotImage(item.spot)}
                      alt={item.spot.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {item.isCurrentSpot ? (
                      <div className="text-xs font-black text-slate-900 truncate leading-snug">
                        {cleanText(item.spot.title)}
                      </div>
                    ) : (
                      <Link
                        href={`/spots/${item.spot.id}`}
                        className="text-xs font-black text-slate-900 hover:text-[#2D5A3C] transition-colors truncate block leading-snug"
                      >
                        {cleanText(item.spot.title)}
                      </Link>
                    )}
                    <div className="text-[10.5px] text-slate-500 font-medium truncate pt-0.5">
                      {item.spot.district}, จังหวัด{item.spot.province}
                    </div>
                  </div>
                </div>

                {/* Transit Distance Pill */}
                {item.estimatedTransit && (
                  <div className="pt-1.5 border-t border-[#E8EFEA] flex items-center justify-between text-[10px]">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        item.isCurrentSpot ? 'text-[#2D5A3C]' : 'text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          item.isCurrentSpot ? 'bg-[#3D7850]' : 'bg-slate-400'
                        }`}
                      />
                      <span>เดินทาง: {item.estimatedTransit}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons: Forest Green Prestige CTA (NO Pitch Black!) */}
        <div className="space-y-2 pt-2 border-t border-[#DFE8E1] relative z-10">
          <a
            href={multiStopMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl font-black text-xs bg-gradient-to-r from-[#2D5A3C] via-[#366846] to-[#2D5A3C] hover:from-[#234E32] hover:via-[#2C573A] hover:to-[#234E32] text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer text-center"
          >
            <span>เปิดเส้นทางบน Google Maps ({stops.length} จุด)</span>
          </a>

          <div className="flex items-center gap-2">
            {stopCount < 6 ? (
              <button
                type="button"
                onClick={handleAddStop}
                className="flex-1 py-2 px-2.5 rounded-lg font-black text-[11px] bg-[#EBF3ED] hover:bg-[#DDF0E1] text-[#20442D] border border-[#BBDDC3] transition-all cursor-pointer text-center shadow-2xs active:scale-95 truncate"
              >
                + เพิ่มสถานที่ ({stopCount}/6)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetStops}
                className="flex-1 py-2 px-2.5 rounded-lg font-black text-[11px] bg-[#EBF3ED] hover:bg-[#DDF0E1] text-[#20442D] border border-[#BBDDC3] transition-all cursor-pointer text-center shadow-2xs active:scale-95 truncate"
              >
                รีเซ็ต (เหลือ 3 จุด)
              </button>
            )}

            <button
              type="button"
              onClick={handleSharePlan}
              className="flex-1 py-2 px-2.5 rounded-lg font-bold text-[11px] bg-white hover:bg-[#F4F8F5] text-[#2D5A3C] border border-[#C5DEC9] hover:border-[#A8CEB3] transition-all cursor-pointer text-center shadow-2xs active:scale-95 truncate"
            >
              {isCopied ? '✓ คัดลอกแล้ว' : 'แชร์ทริป'}
            </button>
          </div>

          <button
            type="button"
            onClick={openFullModal}
            className="w-full text-center text-[11px] font-extrabold text-slate-500 hover:text-[#2D5A3C] transition-colors py-0.5 cursor-pointer"
          >
            ดูรายละเอียดแผนทริปเต็มพร้อมภาพขยาย
          </button>
        </div>
      </div>

      {/* Synchronized Full Modal with Exact Same Stops & State */}
      <SmartSpotPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentSpot={currentSpot}
        stops={stops}
        multiStopMapsUrl={multiStopMapsUrl}
        onShuffle={handleShuffle}
        stopCount={stopCount}
        onAddStop={handleAddStop}
        onResetStops={handleResetStops}
      />
    </>
  );
};

