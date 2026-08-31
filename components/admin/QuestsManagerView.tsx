'use client';

import React, { useState } from 'react';
import { Zap, Trophy, Plus, Edit3 } from 'lucide-react';
import { MASTER_QUEST_CATEGORIES } from '@/data/masterHub';

const SAMPLE_QUESTS = [
  { id: 'q001', title: 'คาเฟ่ฮอปปิ้ง 5 ร้าน', type: 'exp_only', exp: 150, badge: null, difficulty: 'Easy', status: 'active', participants: 1240, completions: 320 },
  { id: 'q002', title: 'ออกกำลังกาย 7 วันติดต่อกัน', type: 'exp_badge', exp: 500, badge: '7-Day Streak 🔥', difficulty: 'Medium', status: 'active', participants: 890, completions: 210 },
  { id: 'q003', title: 'เที่ยวต่างจังหวัด 3 จังหวัด', type: 'badge_only', exp: 0, badge: 'Explorer Badge 🌏', difficulty: 'Hard', status: 'active', participants: 540, completions: 88 },
  { id: 'q004', title: 'เข้าร่วมกิจกรรม Sound Bath', type: 'general', exp: 50, badge: null, difficulty: 'Easy', status: 'draft', participants: 0, completions: 0 },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   'bg-[#EBF3ED] text-[#2D5A3C] border-[#4A7C59]/20',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard:   'bg-rose-50 text-rose-700 border-rose-200',
};

const TYPE_STYLES: Record<string, string> = {
  general:    'bg-slate-100 text-slate-600 border-slate-200',
  exp_only:   'bg-sky-50 text-[#2B527A] border-sky-200',
  badge_only: 'bg-purple-50 text-purple-700 border-purple-200',
  exp_badge:  'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#EBF3ED] text-[#4A7C59]',
  draft:  'bg-slate-100 text-slate-400',
  ended:  'bg-rose-50 text-rose-500',
};

export function QuestsManagerView() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'ended'>('all');
  const filtered = SAMPLE_QUESTS.filter((q) => filter === 'all' || q.status === filter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={17} className="text-amber-500" />
            <h1 className="text-xl font-bold text-slate-800">Quests & Badges Engine</h1>
          </div>
          <p className="text-slate-500 text-sm">สร้างและจัดการเควสต์ กำหนด EXP และเหรียญตราสำหรับ Gamification</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-amber-200">
          <Plus size={14} />
          สร้างเควสต์ใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'เควสต์ทั้งหมด', value: SAMPLE_QUESTS.length, style: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'กำลังดำเนินการ', value: SAMPLE_QUESTS.filter(q => q.status === 'active').length, style: 'text-[#4A7C59] bg-[#EBF3ED] border-[#4A7C59]/15' },
          { label: 'ผู้เข้าร่วมทั้งหมด', value: SAMPLE_QUESTS.reduce((a, q) => a + q.participants, 0).toLocaleString(), style: 'text-[#2B527A] bg-sky-50 border-sky-100' },
          { label: 'สำเร็จแล้ว', value: SAMPLE_QUESTS.reduce((a, q) => a + q.completions, 0).toLocaleString(), style: 'text-purple-700 bg-purple-50 border-purple-100' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3.5 ${s.style}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-slate-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quest Types Reference */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Master Quest Categories</p>
        <div className="flex flex-wrap gap-2">
          {MASTER_QUEST_CATEGORIES.map((cat) => (
            <span key={cat.id} className={`px-3 py-1 rounded-full border text-xs font-semibold ${TYPE_STYLES[cat.id]}`}>
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'draft', 'ended'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {{ all: 'ทั้งหมด', active: 'กำลังดำเนินการ', draft: 'แบบร่าง', ended: 'สิ้นสุดแล้ว' }[f]}
          </button>
        ))}
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {filtered.map((quest) => (
          <div
            key={quest.id}
            className="bg-white border border-slate-200/70 rounded-2xl p-4 hover:shadow-sm hover:border-[#4A7C59]/20 transition-all group shadow-xs"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[quest.status]}`}>
                    {quest.status === 'active' ? '● Active' : quest.status === 'draft' ? '○ Draft' : '✕ Ended'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_STYLES[quest.type]}`}>
                    {MASTER_QUEST_CATEGORIES.find((c) => c.id === quest.type)?.name}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLES[quest.difficulty]}`}>
                    {quest.difficulty}
                  </span>
                </div>
                <h3 className="text-slate-800 font-bold text-sm">{quest.title}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  {quest.exp > 0 && (
                    <span className="flex items-center gap-1 text-xs text-[#2B527A]">
                      <Zap size={10} /> +{quest.exp} EXP
                    </span>
                  )}
                  {quest.badge && (
                    <span className="flex items-center gap-1 text-xs text-purple-600">
                      <Trophy size={10} /> {quest.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">{quest.participants.toLocaleString()} คน</p>
                  <p className="text-[11px] text-slate-400">{quest.completions} สำเร็จ</p>
                </div>
                <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Edit3 size={13} />
                </button>
              </div>
            </div>

            {quest.participants > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Completion Rate</span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {Math.round((quest.completions / quest.participants) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: `${Math.round((quest.completions / quest.participants) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
