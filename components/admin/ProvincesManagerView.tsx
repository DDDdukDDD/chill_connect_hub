'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Globe, Sparkles, Compass, Users } from 'lucide-react';
import { MASTER_77_PROVINCES, MASTER_POPULAR_PROVINCE_TAGS } from '@/data/masterHub';
import { BANGKOK_ZONES, MOCK_EVENTS } from '@/data/mockData';
import { MOCK_SPOTS } from '@/data/spotsData';

const REGIONS: { label: string; provinces: string[] }[] = [
  {
    label: 'ภาคกลาง & ตะวันออก',
    provinces: ['กรุงเทพฯ','นนทบุรี','ปทุมธานี','นครปฐม','สมุทรปราการ','สมุทรสาคร','สมุทรสงคราม','สุพรรณบุรี','กาญจนบุรี','ราชบุรี','เพชรบุรี','ประจวบคีรีขันธ์','ลพบุรี','สระบุรี','สิงห์บุรี','อ่างทอง','พระนครศรีอยุธยา','ชัยนาท','นครนายก','ปราจีนบุรี','สระแก้ว','ฉะเชิงเทรา','ชลบุรี','ระยอง','จันทบุรี','ตราด'],
  },
  {
    label: 'ภาคเหนือ',
    provinces: ['เชียงใหม่','เชียงราย','ลำปาง','ลำพูน','แม่ฮ่องสอน','น่าน','แพร่','พะเยา','อุตรดิตถ์','ตาก','สุโขทัย','กำแพงเพชร','พิจิตร','พิษณุโลก','เพชรบูรณ์','นครสวรรค์','อุทัยธานี'],
  },
  {
    label: 'ภาคตะวันออกเฉียงเหนือ',
    provinces: ['ขอนแก่น','นครราชสีมา','อุบลราชธานี','อุดรธานี','บุรีรัมย์','สุรินทร์','ศรีสะเกษ','ยโสธร','อำนาจเจริญ','มุกดาหาร','สกลนคร','นครพนม','หนองคาย','หนองบัวลำภู','เลย','ชัยภูมิ','กาฬสินธุ์','มหาสารคาม','ร้อยเอ็ด','บึงกาฬ'],
  },
  {
    label: 'ภาคใต้',
    provinces: ['สุราษฎร์ธานี','กระบี่','ภูเก็ต','พังงา','ระนอง','ชุมพร','นครศรีธรรมราช','สงขลา','พัทลุง','ตรัง','สตูล','ยะลา','นราธิวาส','ปัตตานี'],
  },
];

export function ProvincesManagerView() {
  const [search, setSearch] = useState('');
  const [openRegion, setOpenRegion] = useState<string | null>('ภาคกลาง & ตะวันออก');

  // Calculate content density across all provinces
  const densityMap = useMemo(() => {
    const map = new Map<string, { spots: number; events: number }>();
    MASTER_77_PROVINCES.forEach((p) => {
      map.set(p, { spots: 0, events: 0 });
    });

    MOCK_SPOTS.forEach((s) => {
      if (s.province && map.has(s.province)) {
        const curr = map.get(s.province)!;
        curr.spots++;
      }
    });

    MOCK_EVENTS.forEach((e) => {
      if (e.province && map.has(e.province)) {
        const curr = map.get(e.province)!;
        curr.events++;
      }
    });

    return map;
  }, []);

  // Online virtual events
  const onlineEvents = useMemo(() => {
    return MOCK_EVENTS.filter(
      (e) =>
        e.locationType === 'online' ||
        e.province === 'ออนไลน์' ||
        e.province === 'Online' ||
        Boolean(e.onlineJoinUrl)
    );
  }, []);

  // Top active provinces by content count
  const topProvinces = useMemo(() => {
    const list = Array.from(densityMap.entries())
      .map(([province, counts]) => ({
        province,
        total: counts.spots + counts.events,
        spots: counts.spots,
        events: counts.events,
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
    return list.slice(0, 6);
  }, [densityMap]);

  const filteredRegions = useMemo(() => {
    if (!search) return REGIONS;
    const q = search.toLowerCase();
    return REGIONS
      .map((r) => ({ ...r, provinces: r.provinces.filter((p) => p.toLowerCase().includes(q)) }))
      .filter((r) => r.provinces.length > 0);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-[#4A7C59]" />
            <h1 className="text-xl font-bold text-slate-800">77 จังหวัด & โซน (Regional Density Hub)</h1>
          </div>
          <p className="text-slate-500 text-sm">
            จัดการฐานข้อมูลจังหวัด, โซนกรุงเทพฯ, Hub กิจกรรมออนไลน์ และสถิติความหนาแน่นของเนื้อหา
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-[#EBF3ED] border border-[#4A7C59]/20 text-[#2D5A3C] rounded-xl text-xs font-semibold">
            {MASTER_77_PROVINCES.length} จังหวัด
          </span>
          <span className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-[#2B527A] rounded-xl text-xs font-semibold">
            🌐 {onlineEvents.length} กิจกรรมออนไลน์
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'จังหวัดทั้งหมด', value: MASTER_77_PROVINCES.length, accent: 'text-[#4A7C59]', bg: 'bg-[#EBF3ED] border-[#4A7C59]/15' },
          { label: 'พิกัดเที่ยวทั้งหมด', value: MOCK_SPOTS.length, accent: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'กิจกรรมชุมชน & แฟร์', value: MOCK_EVENTS.length, accent: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Virtual Online Hub', value: onlineEvents.length, accent: 'text-[#2B527A]', bg: 'bg-sky-50 border-sky-100' },
        ].map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-3.5 ${stat.bg}`}>
            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Virtual Online Events Hub Card */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-sky-50 border border-sky-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 flex items-center justify-center shadow-xs">
              <Globe size={20} className="text-[#2B527A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">🌐 ออนไลน์ (Virtual Meetups & Sessions)</h3>
                <span className="px-2 py-0.5 bg-[#2B527A] text-white text-[10px] font-bold rounded-full">
                  Virtual Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                กิจกรรมออนไลน์ที่ไม่ขึ้นกับพิกัดทางภูมิศาสตร์ (Zoom, Google Meet, Discord)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#2B527A] bg-white px-3 py-1.5 rounded-xl border border-sky-200">
              พบ {onlineEvents.length} กิจกรรมออนไลน์
            </span>
          </div>
        </div>
      </div>

      {/* Top Active Provinces Leaderboard */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Top Active Provinces (ความหนาแน่นของเนื้อหา)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">เรียงตามพิกัดและกิจกรรมที่เปิดใช้งาน</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {topProvinces.map((item, idx) => (
            <div
              key={item.province}
              className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl hover:border-[#4A7C59]/40 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 truncate">{item.province}</span>
                <span className="text-[10px] font-semibold text-[#4A7C59]">#{idx + 1}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span>📍 {item.spots} จุด</span>
                <span>·</span>
                <span>👥 {item.events} กิจกรรม</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="ค้นหาจังหวัด..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-[#4A7C59]/50 focus:ring-1 focus:ring-[#4A7C59]/20 shadow-xs"
        />
      </div>

      {/* Bangkok Zones */}
      <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-[#2B527A] uppercase tracking-wider mb-3">🏙️ Bangkok Zone Breakdown (5 โซนหลัก)</p>
        <div className="flex flex-wrap gap-2">
          {BANGKOK_ZONES.map((zone) => (
            <span
              key={zone.id}
              className="px-3 py-1 bg-white border border-sky-200 text-[#2B527A] rounded-full text-xs font-medium"
            >
              {zone.label}
            </span>
          ))}
        </div>
      </div>

      {/* Provinces by Region with Density Badges */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">77 จังหวัดจำแนกตามภูมิภาคพร้อม Content Density</p>
        {filteredRegions.map((region) => (
          <div key={region.label} className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
            <button
              onClick={() => setOpenRegion(openRegion === region.label ? null : region.label)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-700 font-semibold text-sm">{region.label}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-xs font-medium">
                  {region.provinces.length} จังหวัด
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${openRegion === region.label ? 'rotate-180' : ''}`}
              />
            </button>
            {openRegion === region.label && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {region.provinces.map((province) => {
                    const counts = densityMap.get(province) || { spots: 0, events: 0 };
                    const hasContent = counts.spots > 0 || counts.events > 0;
                    return (
                      <div
                        key={province}
                        className={`px-3 py-2 border rounded-xl flex items-center justify-between gap-2 transition-all ${
                          hasContent
                            ? 'bg-[#EBF3ED]/40 border-[#4A7C59]/20 text-[#2D5A3C]'
                            : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-xs font-medium truncate">{province}</span>
                        {hasContent ? (
                          <span className="px-1.5 py-0.2 bg-[#4A7C59]/10 text-[#4A7C59] rounded text-[10px] font-bold shrink-0">
                            {counts.spots + counts.events}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 shrink-0">0</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
