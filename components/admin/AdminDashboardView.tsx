'use client';

import React from 'react';
import {
  LayoutDashboard,
  Leaf,
  Users,
  Trophy,
  Zap,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { MASTER_SPOT_CATEGORIES, MASTER_COMMUNITY_LIFESTYLE_CATEGORIES, MASTER_FAIR_CATEGORIES } from '@/data/masterHub';

const STAT_CARDS = [
  {
    label: 'Lifestyle Spots',
    value: '1,247',
    delta: '+18 ใหม่',
    icon: Leaf,
    iconColor: 'text-[#4A7C59]',
    iconBg: 'bg-[#EBF3ED]',
    border: 'border-[#4A7C59]/15',
    deltaColor: 'text-[#4A7C59]',
  },
  {
    label: 'Community Events',
    value: '342',
    delta: '+34 ใหม่',
    icon: Users,
    iconColor: 'text-[#F26430]',
    iconBg: 'bg-[#FDF0EB]',
    border: 'border-[#F26430]/15',
    deltaColor: 'text-[#F26430]',
  },
  {
    label: 'Fairs & Expos',
    value: '89',
    delta: '+7 ใหม่',
    icon: Trophy,
    iconColor: 'text-[#2B527A]',
    iconBg: 'bg-sky-50',
    border: 'border-sky-100',
    deltaColor: 'text-sky-600',
  },
  {
    label: 'Active Quests',
    value: '24',
    delta: '+2 ใหม่',
    icon: Zap,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    border: 'border-amber-100',
    deltaColor: 'text-amber-600',
  },
];

const RECENT_ACTIONS = [
  { action: 'Spot อนุมัติแล้ว', name: 'Doi Inthanon Sunrise Point', time: '5 นาทีที่แล้ว', dot: 'bg-[#4A7C59]', textColor: 'text-[#4A7C59]' },
  { action: 'Event รออนุมัติ', name: 'งานวิ่ง Charity Run 2026', time: '22 นาทีที่แล้ว', dot: 'bg-amber-400', textColor: 'text-amber-600' },
  { action: 'Fair ถูกสร้างใหม่', name: 'Bangkok Design Week 2027', time: '1 ชั่วโมงที่แล้ว', dot: 'bg-[#2B527A]', textColor: 'text-[#2B527A]' },
  { action: 'Quest เสร็จสิ้น', name: '7-Day Fitness Streak — 210 คนสำเร็จ', time: '3 ชั่วโมงที่แล้ว', dot: 'bg-amber-500', textColor: 'text-amber-600' },
  { action: 'Scraper ดึงข้อมูลสำเร็จ', name: 'eventpop.me — 12 events ใหม่', time: '5 ชั่วโมงที่แล้ว', dot: 'bg-teal-500', textColor: 'text-teal-600' },
];

interface AdminDashboardViewProps {
  onNavigate: (module: any) => void;
}

export function AdminDashboardView({ onNavigate }: AdminDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#EBF3ED] to-white border border-[#4A7C59]/15 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={16} className="text-[#4A7C59]" />
            <h1 className="text-lg font-bold text-slate-800">แดชบอร์ดหลัก</h1>
          </div>
          <p className="text-slate-500 text-sm">
            ยินดีต้อนรับสู่ Chill & Connect Hub Admin Console · Production v2.1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4A7C59]" />
          <span className="text-[#4A7C59] text-xs font-semibold">ระบบทำงานปกติ</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`bg-white border ${s.border} rounded-2xl p-4 hover:shadow-sm transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <Icon size={16} className={s.iconColor} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-semibold ${s.deltaColor}`}>
                  <TrendingUp size={10} />
                  {s.delta}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* 2-Column: Recent Activity + Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-slate-400" />
            <h2 className="text-slate-700 font-bold text-sm">กิจกรรมล่าสุดในระบบ</h2>
          </div>
          <div className="space-y-3">
            {RECENT_ACTIONS.map((a, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${a.textColor}`}>{a.action}</p>
                  <p className="text-slate-500 text-xs truncate">{a.name}</p>
                </div>
                <p className="text-slate-300 text-[11px] shrink-0">{a.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={14} className="text-slate-400" />
            <h2 className="text-slate-700 font-bold text-sm">ทางลัดสำคัญ</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Master Taxonomy', emoji: '🗂️', module: 'taxonomy' },
              { label: '77 จังหวัด', emoji: '📍', module: 'provinces' },
              { label: 'Lifestyle Spots', emoji: '🌲', module: 'spots' },
              { label: 'Community Events', emoji: '👥', module: 'community' },
              { label: 'Fairs & Expos', emoji: '🏛️', module: 'fairs' },
              { label: 'Users & RBAC', emoji: '🛡️', module: 'rbac' },
              { label: 'Quests Engine', emoji: '⚡', module: 'quests' },
              { label: 'Backup & Logs', emoji: '💾', module: 'backup' },
            ].map((item) => (
              <button
                key={item.module}
                onClick={() => onNavigate(item.module)}
                className="flex items-center gap-2.5 bg-slate-50 hover:bg-[#EBF3ED] border border-slate-100 hover:border-[#4A7C59]/20 rounded-xl px-3 py-2.5 text-left transition-all group"
              >
                <span className="text-base">{item.emoji}</span>
                <span className="text-slate-600 group-hover:text-[#2D5A3C] text-xs font-semibold truncate transition-colors">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Spot Categories', count: MASTER_SPOT_CATEGORIES.length, unit: 'Vibe Types', emoji: '🌲' },
          { label: 'Community Sub-Types', count: MASTER_COMMUNITY_LIFESTYLE_CATEGORIES.length, unit: 'Lifestyle Tags', emoji: '👥' },
          { label: 'Fair Event Types', count: MASTER_FAIR_CATEGORIES.length, unit: 'Categories', emoji: '🏛️' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 shadow-xs">
            <span className="text-xl">{s.emoji}</span>
            <div>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-slate-800 font-bold">
                {s.count} <span className="text-slate-400 font-normal text-xs">{s.unit}</span>
              </p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-[#4A7C59]" title="OK" />
          </div>
        ))}
      </div>
    </div>
  );
}
