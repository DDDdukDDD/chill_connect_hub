'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { LifestyleSpotItem } from '@/data/spotsData';
import { resolveSpotImage } from '@/lib/spotImageResolver';

export interface ItineraryStopItem {
  timeSlot: string;
  slotLabel: string;
  stepNumber: string;
  spot: LifestyleSpotItem;
  isCurrentSpot?: boolean;
  estimatedTransit?: string;
  vibeReason?: string;
}

export interface SmartSpotPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpot: LifestyleSpotItem;
  stops: ItineraryStopItem[];
  multiStopMapsUrl: string;
  onShuffle?: () => void;
  stopCount?: number;
  onAddStop?: () => void;
  onResetStops?: () => void;
}

// Helper to strip rogue emojis from text fields for clean, minimal typography
const cleanText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const SmartSpotPlanModal: React.FC<SmartSpotPlanModalProps> = ({
  isOpen,
  onClose,
  currentSpot,
  stops,
  multiStopMapsUrl,
  onShuffle,
  stopCount = stops.length,
  onAddStop,
  onResetStops,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSharePlan = async () => {
    const tripTitle = `แผนเที่ยว 1 วันรอบย่าน ${cleanText(currentSpot.district || currentSpot.province)} (${stops.length} จุด)`;
    const stopsText = stops
      .map((s) => {
        const transit = s.estimatedTransit ? ` [เดินทาง: ${s.estimatedTransit}]` : '';
        return `${s.stepNumber}. ${s.slotLabel} (${s.timeSlot}): ${cleanText(s.spot.title)} - ${s.spot.district}, ${s.spot.province}${transit}`;
      })
      .join('\n');

    const fullMessage = `${tripTitle}\n\n${stopsText}\n\nเปิดเส้นทางรวมบน Google Maps: ${multiStopMapsUrl}\n\nวางแผนท่องเที่ยวได้ที่ Chill & Connect Hub`;

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

    navigator.clipboard.writeText(fullMessage).then(() => {
      setIsCopied(true);
      showToast('คัดลอกแผนเที่ยวแล้ว พร้อมแชร์ได้ทันที');
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#FAFBF9] via-white to-[#F4F8F5] rounded-3xl shadow-2xl border border-[#DFE8E1] overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#2D5A3C] text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-bold border border-[#4A7C59]/40 animate-in fade-in slide-in-from-top duration-150">
            {toastMessage}
          </div>
        )}

        {/* Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#4A7C59]/8 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header: Slim, Clean & Minimal */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#E2EAE4] flex items-center justify-between gap-3 relative z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#2D5A3C] to-[#3B6E4C] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] animate-pulse shrink-0" />
                <span>Smart Plan</span>
              </span>
              <span className="text-[11px] font-bold text-[#2D5A3C] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#C5DEC9]">
                {stops.length} จุดเช็คอิน
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight pt-1 truncate">
              แผนเที่ยวรอบย่าน {cleanText(currentSpot.district || currentSpot.province)}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onShuffle && (
              <button
                type="button"
                onClick={onShuffle}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2D5A3C] hover:text-[#1B432C] bg-white hover:bg-[#F4F8F5] px-2.5 py-1 rounded-xl border border-[#C5DEC9] shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="สลับพิกัดทางเลือกใหม่"
              >
                <span>สลับทริป</span>
                <span className="text-[#4A7C59]">↺</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white hover:bg-[#F4F8F5] text-slate-400 hover:text-slate-700 border border-[#DFE8E1] transition-colors cursor-pointer shadow-2xs"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Compact, Sleek Cards with Zero Information Overload */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 relative z-10">
          {stops.map((item, idx) => (
            <div key={`${item.spot.id}-${idx}`} className="relative pl-7 z-10">
              {/* Unbroken Continuous Connector Line */}
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

              {/* Compact Stop Card */}
              <div
                className={`p-2.5 rounded-2xl transition-all space-y-1.5 ${
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
                    <span className="text-[10.5px] text-slate-500 font-bold truncate">
                      {item.timeSlot}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.isCurrentSpot ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9.5px] font-black bg-[#2D5A3C] text-white shadow-2xs">
                        ★ พิกัดนี้
                      </span>
                    ) : (
                      <Link
                        href={`/spots/${item.spot.id}`}
                        onClick={onClose}
                        className="text-[10.5px] font-extrabold text-[#2D5A3C] hover:text-[#1B432C] hover:underline"
                      >
                        ดูข้อมูล
                      </Link>
                    )}
                  </div>
                </div>

                {/* Content: Thumbnail + Place Name + District */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border shadow-2xs relative ${
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
                    <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-snug line-clamp-1">
                      {cleanText(item.spot.title)}
                    </div>
                    <div className="text-[10.5px] text-slate-500 font-medium truncate pt-0.5">
                      {item.spot.district}, จังหวัด{item.spot.province}
                    </div>

                    {/* Transit Distance Pill */}
                    {item.estimatedTransit && (
                      <div className="pt-1 flex items-center text-[10px] text-[#2D5A3C] font-bold">
                        <span className="w-1 h-1 rounded-full bg-[#3D7850] mr-1 shrink-0" />
                        <span>เดินทาง: {item.estimatedTransit}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer: Compact & Coordinated */}
        <div className="px-4 py-3 border-t border-[#E2EAE4] bg-[#FAFBF9] flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5">
            {onAddStop && (
              <>
                {stopCount < 6 ? (
                  <button
                    type="button"
                    onClick={onAddStop}
                    className="py-1.5 px-2.5 rounded-lg font-black text-[11px] bg-[#EBF3ED] hover:bg-[#DDF0E1] text-[#20442D] border border-[#BBDDC3] transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                  >
                    + เพิ่มสถานที่ ({stopCount}/6)
                  </button>
                ) : onResetStops ? (
                  <button
                    type="button"
                    onClick={onResetStops}
                    className="py-1.5 px-2.5 rounded-lg font-black text-[11px] bg-[#EBF3ED] hover:bg-[#DDF0E1] text-[#20442D] border border-[#BBDDC3] transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                  >
                    รีเซ็ต (3 จุด)
                  </button>
                ) : null}
              </>
            )}

            <button
              type="button"
              onClick={handleSharePlan}
              className="py-1.5 px-2.5 rounded-lg font-bold text-[11px] bg-white hover:bg-[#F4F8F5] text-[#2D5A3C] border border-[#C5DEC9] hover:border-[#A8CEB3] transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
            >
              {isCopied ? '✓ คัดลอกแล้ว' : 'แชร์ทริป'}
            </button>
          </div>

          <a
            href={multiStopMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#2D5A3C] via-[#366846] to-[#2D5A3C] hover:from-[#234E32] hover:via-[#2C573A] hover:to-[#234E32] text-white text-[11px] font-black transition-all shadow-xs active:scale-98 flex items-center justify-center cursor-pointer text-center whitespace-nowrap"
          >
            เปิดบน Google Maps ({stops.length} จุด)
          </a>
        </div>
      </div>
    </div>
  );
};
