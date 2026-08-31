'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Search, ChevronDown } from 'lucide-react';
import { MASTER_77_PROVINCES, MASTER_POPULAR_PROVINCE_TAGS } from '@/data/masterHub';
import { BANGKOK_ZONES } from '@/data/mockData';

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

  const filteredRegions = useMemo(() => {
    if (!search) return REGIONS;
    const q = search.toLowerCase();
    return REGIONS
      .map((r) => ({ ...r, provinces: r.provinces.filter((p) => p.toLowerCase().includes(q)) }))
      .filter((r) => r.provinces.length > 0);
  }, [search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={17} className="text-[#4A7C59]" />
            <h1 className="text-xl font-bold text-slate-800">77 จังหวัด & โซน</h1>
          </div>
          <p className="text-slate-500 text-sm">ฐานข้อมูลจังหวัดที่ใช้ Tag-Filtering ทั่วทั้งแพลตฟอร์ม</p>
        </div>
        <span className="px-3 py-1.5 bg-[#EBF3ED] border border-[#4A7C59]/20 text-[#2D5A3C] rounded-xl text-xs font-semibold">
          {MASTER_77_PROVINCES.length} จังหวัด
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'จังหวัดทั้งหมด', value: MASTER_77_PROVINCES.length, accent: 'text-[#4A7C59]', bg: 'bg-[#EBF3ED] border-[#4A7C59]/15' },
          { label: 'Popular Province Tags', value: MASTER_POPULAR_PROVINCE_TAGS.length - 1, accent: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Bangkok Zones', value: BANGKOK_ZONES.length, accent: 'text-[#2B527A]', bg: 'bg-sky-50 border-sky-100' },
          { label: 'ภูมิภาค', value: REGIONS.length, accent: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
        ].map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-3.5 ${stat.bg}`}>
            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
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

      {/* Popular Tags */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Popular Province Quick-Tags</p>
        <div className="flex flex-wrap gap-2">
          {MASTER_POPULAR_PROVINCE_TAGS.map((tag) => (
            <span
              key={tag.id}
              className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-xs font-medium hover:bg-[#EBF3ED] hover:border-[#4A7C59]/20 hover:text-[#2D5A3C] transition-colors cursor-default"
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Bangkok Zones */}
      <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-[#2B527A] uppercase tracking-wider mb-3">🏙️ Bangkok Zone Breakdown</p>
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

      {/* Provinces by Region */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">จังหวัดจำแนกตามภูมิภาค</p>
        {filteredRegions.map((region) => (
          <div key={region.label} className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
            <button
              onClick={() => setOpenRegion(openRegion === region.label ? null : region.label)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-700 font-semibold text-sm">{region.label}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-xs font-medium">{region.provinces.length}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${openRegion === region.label ? 'rotate-180' : ''}`}
              />
            </button>
            {openRegion === region.label && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap gap-2">
                  {region.provinces.map((province) => (
                    <span
                      key={province}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-xs hover:bg-[#EBF3ED] hover:border-[#4A7C59]/15 hover:text-[#2D5A3C] transition-colors"
                    >
                      {province}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
