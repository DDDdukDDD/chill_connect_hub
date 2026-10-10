'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Users, MapPin, ArrowRight, Sparkles, Car, Plus, Heart, Coffee, Trees } from 'lucide-react';

interface SpotsDiscoveryHighlightsProps {
  onSelectProvince?: (province: string) => void;
  onOpenSpotBuddy?: () => void;
}

interface CuratedTrip {
  id: string;
  title: string;
  subtitle: string;
  province: string;
  imageUrl: string;
  highlights: string[];
  duration: string;
}

const CURATED_TRIPS: CuratedTrip[] = [
  {
    id: 'trip-near-bkk',
    title: 'วันเดย์ทริปฮีลใจใกล้กรุง',
    subtitle: 'ตลาดน้ำ คาเฟ่สวนร่มรื่น & วิถีริมคลอง',
    province: 'สมุทรสงคราม',
    imageUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
    highlights: ['อัมพวา', 'คาเฟ่ร่มไม้', 'พายคายัค'],
    duration: '1 วัน • ขับรถ 1.5 ชม.',
  },
  {
    id: 'trip-chiangmai-coffee',
    title: 'สโลว์ไลฟ์สายกาแฟ & ดอยหมอก',
    subtitle: 'แหล่งปลูก Specialty Coffee & วิวยอดดอย',
    province: 'เชียงใหม่',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    highlights: ['แม่ริม', 'ดอยช้างมูบ', 'ร้านกาแฟคราฟต์'],
    duration: '2-3 วัน • สายสโลว์ไลฟ์',
  },
  {
    id: 'trip-kanchanaburi-camp',
    title: 'แคมป์ปิ้งริมน้ำ & นอนนับดาว',
    subtitle: 'ริมแม่น้ำแคว ลานกางเต็นท์ใต้ร่มเงาไม้ใหญ่',
    province: 'กาญจนบุรี',
    imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    highlights: ['แม่น้ำแคว', 'ลานแคมป์ริมน้ำ', 'ดูดาว'],
    duration: '2 วัน 1 คืน • พักผ่อนธรรมชาติ',
  },
  {
    id: 'trip-krabi-nature',
    title: 'ทะเลเงียบสงบ & อ่าวธรรมชาติ',
    subtitle: 'หาดทรายขาว พายคายัคป่าโกงกาง & พระอาทิตย์ตก',
    province: 'กระบี่',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    highlights: ['อ่าวนาง', 'ท่าเลนคายัค', 'น้ำทะเลใส'],
    duration: '3 วัน 2 คืน • ทะเลฮีลใจ',
  },
];

const SPOT_BUDDY_PREVIEWS = [
  {
    id: 'sb-1',
    title: 'หาเพื่อนหารค่าน้ำมันไปกางเต็นท์ริมน้ำ กาญจนบุรี เสาร์-อาทิตย์นี้',
    hostName: 'ธนภัทร (ตั้ม)',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    location: 'กาญจนบุรี (ริมแม่น้ำแคว)',
    vacancies: 2,
    date: 'เสาร์นี้ 14 ต.ค.',
  },
  {
    id: 'sb-2',
    title: 'ชวนไปแวะคาเฟ่สไตล์วินเทจ & ถ่ายรูปฟิล์ม นครปฐม บ่ายวันอาทิตย์',
    hostName: 'รินลดา (พลอย)',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    location: 'นครปฐม (ย่านศาลายา)',
    vacancies: 3,
    date: 'อาทิตย์นี้ 15 ต.ค.',
  },
  {
    id: 'sb-3',
    title: 'ตี้พายคายัคชมวิวป่าชายเลน สมุทรสงคราม ช่วงแดดร่มลมตก',
    hostName: 'กิตติศักดิ์ (อาร์ท)',
    hostAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    location: 'สมุทรสงคราม (คลองโคน)',
    vacancies: 4,
    date: 'เสาร์หน้า 21 ต.ค.',
  },
];

export const SpotsDiscoveryHighlights: React.FC<SpotsDiscoveryHighlightsProps> = ({
  onSelectProvince,
  onOpenSpotBuddy,
}) => {
  return (
    <section className="space-y-6 pt-2 scroll-mt-24">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-transparent p-4 sm:p-5 rounded-2xl border border-emerald-100/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-[#4A7C59] flex items-center justify-center text-xs font-black shrink-0 border border-emerald-500/20 shadow-2xs">
              <Compass className="w-4 h-4 text-[#4A7C59]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              เส้นทางแนะนำ & Spot Buddy ชวนเพื่อนเที่ยว
            </h2>
            <span className="text-[10px] sm:text-xs font-bold text-[#4A7C59] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200/90 shadow-2xs">
              77 จังหวัดทั่วไทย
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
            สัมผัสแรงบันดาลใจการเดินทางตามเส้นทางคัดสรร หรือเปิดตี้หาเพื่อนร่วมทริปสายเดียวกัน
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSpotBuddy && (
            <button
              type="button"
              onClick={onOpenSpotBuddy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เปิดตี้ชวนเพื่อนเที่ยว</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Part Layout: Curated Roadtrips + Spot Buddy Gathering Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left: Curated Roadtrip Collections (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#4A7C59]" />
              <span>คอลเลกชันทริปแนะนำ & Roadtrips</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              แตะเพื่อสำรวจพิกัดในจังหวัด
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CURATED_TRIPS.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => {
                  if (onSelectProvince) {
                    onSelectProvince(trip.province);
                    const el = document.getElementById('section-spots-cards') || document.getElementById('section-spots');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group text-left bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <img
                    src={trip.imageUrl}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-80" />

                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{trip.province}</span>
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                    <span className="text-[10px] font-extrabold text-emerald-300 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                      {trip.duration}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 group-hover:text-[#4A7C59] transition-colors leading-snug">
                      {trip.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium line-clamp-1">
                      {trip.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#4A7C59]">
                    <div className="flex items-center gap-1 flex-wrap">
                      {trip.highlights.slice(0, 2).map((h, i) => (
                        <span key={i} className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-100 font-semibold">
                          #{h}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      ดูพิกัด <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Spot Buddy Gathering Invitations (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F26430]" />
              <span>Spot Buddy ชวนเพื่อนเที่ยว</span>
            </h3>
            {onOpenSpotBuddy && (
              <button
                type="button"
                onClick={onOpenSpotBuddy}
                className="text-xs font-bold text-[#4A7C59] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+ เปิดตี้ใหม่</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {SPOT_BUDDY_PREVIEWS.map((buddy) => (
              <div
                key={buddy.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={buddy.hostAvatar}
                      alt={buddy.hostName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {buddy.hostName}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                          โฮสต์
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        <span>{buddy.location}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 shrink-0">
                    ว่าง {buddy.vacancies} ที่
                  </span>
                </div>

                <p className="text-xs font-black text-slate-800 leading-snug line-clamp-2">
                  {buddy.title}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500">{buddy.date}</span>
                  {onOpenSpotBuddy ? (
                    <button
                      type="button"
                      onClick={onOpenSpotBuddy}
                      className="text-[#4A7C59] hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>ทักแชต / ขอร่วมตี้</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <Link
                      href="/community"
                      className="text-[#4A7C59] hover:underline flex items-center gap-0.5"
                    >
                      <span>ขอร่วมตี้</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
