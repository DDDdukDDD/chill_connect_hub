'use client';

import React from 'react';
import { Building2, MapPin, Navigation, ExternalLink } from 'lucide-react';
import { MASTER_VENUE_OPTIONS } from '@/data/masterHub';

const VENUE_DETAILS = [
  {
    id: 'qsncc',
    name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์',
    nameEn: 'Queen Sirikit National Convention Center (QSNCC)',
    address: 'ถนนรัชดาภิเษก แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    capacity: '~50,000 คน',
    halls: 'Hall 1-8, Meeting Rooms 1-20, Ballroom',
    website: 'https://www.qsncc.com',
    tag: 'QSNCC',
    tagStyle: 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/20',
    cardBorder: 'border-[#4A7C59]/15',
    cardBg: 'bg-white hover:bg-[#EBF3ED]/20',
  },
  {
    id: 'bitec',
    name: 'ศูนย์นิทรรศการและการประชุมไบเทค บางนา',
    nameEn: 'Bangkok International Trade & Exhibition Centre (BITEC)',
    address: '88 ถนนบางนา-ตราด กิโลเมตรที่ 1 บางนา กรุงเทพฯ 10260',
    capacity: '~40,000 คน',
    halls: 'Exhibition Hall 98-105, Meeting Rooms, Grand Hall',
    website: 'https://www.bitec.co.th',
    tag: 'BITEC',
    tagStyle: 'bg-sky-50 text-[#2B527A] border-sky-200',
    cardBorder: 'border-sky-100',
    cardBg: 'bg-white hover:bg-sky-50/30',
  },
  {
    id: 'impact',
    name: 'อิมแพ็ค เมืองทองธานี',
    nameEn: 'IMPACT Convention Center Muang Thong Thani',
    address: 'ถนนแจ้งวัฒนะ ปากเกร็ด นนทบุรี 11120',
    capacity: '~100,000 คน',
    halls: 'Challenger Hall 1-3, Exhibition Hall 1-12, Arena, Forum',
    website: 'https://www.impact.co.th',
    tag: 'IMPACT',
    tagStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    cardBorder: 'border-amber-100',
    cardBg: 'bg-white hover:bg-amber-50/30',
  },
  {
    id: 'bacc',
    name: 'หอศิลปวัฒนธรรมแห่งกรุงเทพมหานคร',
    nameEn: 'Bangkok Art and Culture Centre (BACC)',
    address: '939 ถนนพระราม 1 วังใหม่ ปทุมวัน กรุงเทพฯ 10330',
    capacity: '~5,000 คน',
    halls: 'Gallery 1-9, Auditorium, Public Space',
    website: 'https://www.bacc.or.th',
    tag: 'BACC',
    tagStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    cardBorder: 'border-purple-100',
    cardBg: 'bg-white hover:bg-purple-50/30',
  },
  {
    id: 'paragon',
    name: 'พารากอน ฮอลล์ & รอยัล พารากอน ฮอลล์',
    nameEn: 'Paragon Hall & Royal Paragon Hall, Siam Paragon',
    address: 'สยามพารากอน ถนนพระราม 1 ปทุมวัน กรุงเทพฯ',
    capacity: '~12,000 คน',
    halls: 'Paragon Hall (EG Floor), Royal Paragon Hall (4F)',
    website: 'https://www.siamparagon.co.th',
    tag: 'PARAGON',
    tagStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    cardBorder: 'border-rose-100',
    cardBg: 'bg-white hover:bg-rose-50/30',
  },
];

export function VenuesManagerView() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={17} className="text-[#2B527A]" />
            <h1 className="text-xl font-bold text-slate-800">Venue Master Hub</h1>
          </div>
          <p className="text-slate-500 text-sm">ศูนย์ประชุม ฮอลล์จัดงาน และสถานที่สาธารณะขนาดใหญ่ที่ใช้บ่อย</p>
        </div>
        <span className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-[#2B527A] rounded-xl text-xs font-semibold">
          {VENUE_DETAILS.length} Venues
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Major Convention Centers', value: '3', icon: '🏛️', style: 'bg-sky-50 border-sky-100 text-[#2B527A]' },
          { label: 'Cultural / Art Venues', value: '1', icon: '🎨', style: 'bg-purple-50 border-purple-100 text-purple-700' },
          { label: 'Retail / Shopping Venues', value: '1', icon: '🛍️', style: 'bg-rose-50 border-rose-100 text-rose-700' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3.5 ${s.style}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <span className="text-xl font-bold">{s.value}</span>
            </div>
            <p className="text-slate-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Venue Cards */}
      <div className="space-y-3">
        {VENUE_DETAILS.map((venue) => (
          <div
            key={venue.id}
            className={`border rounded-2xl p-5 ${venue.cardBg} ${venue.cardBorder} transition-all shadow-xs`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${venue.tagStyle}`}>
                    {venue.tag}
                  </span>
                </div>
                <h3 className="text-slate-800 font-bold text-base leading-tight">{venue.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{venue.nameEn}</p>
              </div>
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs hover:text-[#4A7C59] hover:border-[#4A7C59]/30 transition-colors shrink-0 shadow-xs"
              >
                <ExternalLink size={10} />
                Website
              </a>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-slate-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">ที่อยู่</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{venue.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation size={12} className="text-slate-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">ความจุสูงสุด</p>
                  <p className="text-slate-600 text-xs">{venue.capacity}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 size={12} className="text-slate-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Halls / Zones</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{venue.halls}</p>
                </div>
              </div>
            </div>

            {/* Transit Hint */}
            {MASTER_VENUE_OPTIONS.find((v) => v.id === venue.id) && (
              <div className="mt-3 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <span className="text-xs">🚇</span>
                <p className="text-slate-500 text-xs">
                  {MASTER_VENUE_OPTIONS.find((v) => v.id === venue.id)?.transitHint}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
