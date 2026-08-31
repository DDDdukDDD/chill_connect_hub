'use client';

import React, { useState } from 'react';
import {
  FolderTree,
  Edit3,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import {
  MASTER_SPOT_CATEGORIES,
  MASTER_COMMUNITY_LIFESTYLE_CATEGORIES,
  MASTER_FAIR_CATEGORIES,
  MASTER_QUEST_CATEGORIES,
  MASTER_COMMUNITY_MOODS,
} from '@/data/masterHub';

interface TaxonomySection {
  id: string;
  pillar: string;
  pillarEmoji: string;
  description: string;
  accentColor: string;
  badgeClass: string;
  headerBg: string;
}

const SECTIONS: TaxonomySection[] = [
  {
    id: 'spots',
    pillar: 'Lifestyle Spots — 7 Vibe Categories',
    pillarEmoji: '🌲',
    description: 'หมวดหมู่สำหรับพิกัดเที่ยวและจุดฮีลใจ 77 จังหวัด',
    accentColor: 'text-[#4A7C59]',
    badgeClass: 'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/20',
    headerBg: 'bg-[#EBF3ED]/50 border-[#4A7C59]/15',
  },
  {
    id: 'community_moods',
    pillar: 'Community — 4 Core Moods',
    pillarEmoji: '👥',
    description: 'มูดหลัก 4 ประเภทสำหรับการกรองกิจกรรม',
    accentColor: 'text-[#F26430]',
    badgeClass: 'bg-[#FDF0EB] text-[#D95322] border-[#F26430]/20',
    headerBg: 'bg-orange-50/50 border-orange-100',
  },
  {
    id: 'community_lifestyle',
    pillar: 'Community — 8 Lifestyle Sub-Categories',
    pillarEmoji: '👥',
    description: 'หมวดหมู่ย่อย 8 ประเภทสำหรับ Community Category Rail',
    accentColor: 'text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    headerBg: 'bg-amber-50/50 border-amber-100',
  },
  {
    id: 'fairs',
    pillar: 'Fairs & Expos — 6 Event Types',
    pillarEmoji: '🏛️',
    description: 'หมวดหมู่งานมหกรรม นิทรรศการ และงานสาธารณะ',
    accentColor: 'text-[#2B527A]',
    badgeClass: 'bg-sky-50 text-[#2B527A] border-sky-200',
    headerBg: 'bg-sky-50/50 border-sky-100',
  },
  {
    id: 'quests',
    pillar: 'Quests & Badges — 4 Quest Types',
    pillarEmoji: '⚡',
    description: 'ประเภทเควสต์และการสะสม EXP / Badge',
    accentColor: 'text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    headerBg: 'bg-amber-50/50 border-amber-100',
  },
];

export function TaxonomyManagerView() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    spots: true,
    community_moods: false,
    community_lifestyle: false,
    fairs: false,
    quests: false,
  });

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderTree size={17} className="text-[#4A7C59]" />
            <h1 className="text-xl font-bold text-slate-800">Master Taxonomy Hub</h1>
          </div>
          <p className="text-slate-500 text-sm">
            จัดการหมวดหมู่หลักของทุก Pillar — เปลี่ยนที่นี่แล้ว Component ทั้งระบบจะอัปเดตตาม
          </p>
        </div>
        <span className="px-3 py-1.5 bg-[#EBF3ED] border border-[#4A7C59]/20 text-[#2D5A3C] rounded-xl text-xs font-semibold">
          Single Source of Truth
        </span>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-3">
        <Tag size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-slate-500 text-xs leading-relaxed">
          ข้อมูลทั้งหมดในส่วนนี้มาจาก{' '}
          <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[#4A7C59] font-mono text-[11px]">
            data/masterHub.ts
          </code>{' '}
          ซึ่งเป็น Single Source of Truth ที่ Components ทั้งหมดดึงข้อมูลมาใช้ร่วมกัน
        </p>
      </div>

      {/* Taxonomy Sections */}
      {SECTIONS.map((section) => {
        const isOpen = openSections[section.id];

        let items: { id: string; name: string; iconChar?: string; labelEn?: string }[] = [];
        if (section.id === 'spots') {
          items = MASTER_SPOT_CATEGORIES.map((c) => ({ id: c.id, name: c.name, iconChar: c.iconChar, labelEn: c.nameEn }));
        } else if (section.id === 'community_moods') {
          items = MASTER_COMMUNITY_MOODS.map((c) => ({ id: c.id, name: c.label, iconChar: c.iconChar }));
        } else if (section.id === 'community_lifestyle') {
          items = MASTER_COMMUNITY_LIFESTYLE_CATEGORIES.map((c) => ({ id: c.id, name: c.name, iconChar: c.iconChar, labelEn: c.nameEn }));
        } else if (section.id === 'fairs') {
          items = MASTER_FAIR_CATEGORIES.map((c) => ({ id: c.id, name: c.name, iconChar: c.iconChar, labelEn: c.nameEn }));
        } else if (section.id === 'quests') {
          items = MASTER_QUEST_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
        }

        return (
          <div key={section.id} className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                isOpen ? section.headerBg : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.pillarEmoji}</span>
                <div>
                  <p className="text-slate-800 font-semibold text-sm">{section.pillar}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${section.badgeClass}`}>
                  {items.length} items
                </span>
                {isOpen ? (
                  <ChevronUp size={15} className="text-slate-400" />
                ) : (
                  <ChevronDown size={15} className="text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isOpen && (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3 group hover:bg-[#EBF3ED]/40 hover:border-[#4A7C59]/15 transition-colors"
                    >
                      {item.iconChar && (
                        <span className="text-base shrink-0 mt-0.5">{item.iconChar}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-semibold leading-tight">{item.name}</p>
                        {item.labelEn && (
                          <p className="text-slate-400 text-[11px] mt-0.5 truncate">{item.labelEn}</p>
                        )}
                        <code className="text-[10px] text-slate-300 font-mono">{item.id}</code>
                      </div>
                      <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white text-slate-400 hover:text-slate-600 transition-all" title="Edit">
                        <Edit3 size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-semibold transition-colors opacity-60 cursor-not-allowed" disabled>
                    + เพิ่มหมวดหมู่ใหม่
                  </button>
                  <p className="text-slate-400 text-xs">
                    แก้ไขได้โดยตรงใน{' '}
                    <code className="font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded text-[11px]">data/masterHub.ts</code>
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
