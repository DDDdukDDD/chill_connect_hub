'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Calendar, MapPin, ArrowRight, Sparkles, Ticket, Train } from 'lucide-react';
import { EventItem, MOCK_EVENTS } from '@/data/mockData';
import { TOP_VENUES } from '@/components/TopVenuesRail';
import { isEventEnded } from '@/lib/dateUtils';

interface FairsDiscoveryHighlightsProps {
  onSelectVenue?: (venueKey: string) => void;
  eventsList?: EventItem[];
}

export const FairsDiscoveryHighlights: React.FC<FairsDiscoveryHighlightsProps> = ({
  onSelectVenue,
  eventsList = MOCK_EVENTS,
}) => {
  // Filter active public venue expos for the upcoming highlights rail
  const upcomingFairs = eventsList
    .filter((e) => e.eventType === 'public_venue' && !isEventEnded(e))
    .slice(0, 3);

  // Compute event counts per top venue
  const venuesWithCounts = TOP_VENUES.slice(0, 4).map((venue) => {
    const count = eventsList.filter((event) => {
      if (event.eventType !== 'public_venue' || isEventEnded(event)) return false;
      const titleLower = (event.title || '').toLowerCase();
      const locLower = (event.location || '').toLowerCase();
      const vTag = (event.venueTag || '').toLowerCase();
      return (
        venue.keywords.some((k) => titleLower.includes(k.toLowerCase()) || locLower.includes(k.toLowerCase())) ||
        vTag === venue.venueKey
      );
    }).length;
    return { ...venue, count };
  });

  return (
    <section className="space-y-6 pt-2 scroll-mt-24">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-transparent p-4 sm:p-5 rounded-2xl border border-blue-100/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-7 h-7 rounded-xl bg-blue-500/10 text-[#2B527A] flex items-center justify-center text-xs font-black shrink-0 border border-blue-500/20 shadow-2xs">
              <Building2 className="w-4 h-4 text-[#2B527A]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ศูนย์การประชุมชั้นนำ & ไฮไลต์งานมหกรรม
            </h2>
            <span className="text-[10px] sm:text-xs font-bold text-[#2B527A] bg-white px-2.5 py-0.5 rounded-full border border-blue-200/90 shadow-2xs">
              National Conventions & Expos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
            เลือกสำรวจตามศูนย์แสดงสินค้าระดับชาติ พร้อมปฏิทินงานเอ็กซ์โปและนิทรรศการที่คุณไม่ควรพลาด
          </p>
        </div>

        <Link
          href="/fairs"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 text-[#2B527A] border border-blue-200/90 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>ดูปฏิทินงานทั้งหมด</span>
        </Link>
      </div>

      {/* 2-Part Layout: Top Venues Showcase + Upcoming Mega Expos */}
      <div className="space-y-6">
        
        {/* Top Venues Interactive Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2B527A]" />
              <span>ศูนย์การประชุม & แลนด์มาร์กจัดแสดงยอดนิยม</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              แตะเพื่อกรองงานเฉพาะสถานที่
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {venuesWithCounts.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => {
                  if (onSelectVenue) {
                    onSelectVenue(venue.venueKey);
                    const el = document.getElementById('section-fairs-cards') || document.getElementById('section-fairs');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group text-left bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer hover:-translate-y-1"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#2B527A] font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5 text-[#2B527A]" />
                    </div>
                    <span className="text-[10px] font-black text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                      {venue.count} งาน
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#2B527A] transition-colors leading-snug">
                      {venue.nameTh}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                      <Train className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{venue.subtitle}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#2B527A]">
                  <span>สำรวจงานที่นี่</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming National Expo Highlights Cards */}
        {upcomingFairs.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-sky-600" />
                <span>ไฮไลต์งานมหกรรมและเทศกาลเร็วๆ นี้</span>
              </h3>
              <Link
                href="/fairs"
                className="text-xs font-bold text-[#2B527A] hover:underline flex items-center gap-1"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {upcomingFairs.map((fair) => (
                <Link
                  key={fair.id}
                  href={`/fairs/${encodeURIComponent(fair.id)}`}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    <img
                      src={fair.image}
                      alt={fair.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-sky-400" />
                        <span>{fair.date}</span>
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 z-10">
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                        {fair.price || 'เข้าชมฟรี'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#2B527A] transition-colors line-clamp-1 leading-snug">
                        {fair.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{fair.location}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="text-slate-500 truncate max-w-[150px]">โดย {fair.hostName}</span>
                      <span className="text-[#2B527A] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        รายละเอียด <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
