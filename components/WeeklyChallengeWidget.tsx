'use client';

import React from 'react';
import { MOCK_CHALLENGES } from '@/data/mockData';
import { Coffee, Footprints, Users, Flame } from 'lucide-react';

export const WeeklyChallengeWidget: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-4 h-4 text-[#F26430]" />;
      case 'Footprints':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-amber-300" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-rose-400" />;
      default:
        return <Coffee className="w-4 h-4 text-[#F26430]" />;
    }
  };

  return (
    <section className="bg-[#1E293B] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden border border-slate-700/60 my-10">
      
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-700/60">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>ชาเลนจ์ประจำสัปดาห์</span>
            <span className="text-xs bg-[#F26430] text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">New Quests</span>
          </h2>
        </div>
        <p className="text-sm text-slate-300 font-medium">
          ร่วมท้าทาย รับ Badges พิเศษ!
        </p>
      </div>

      {/* Row-by-Row Vertical Quest List */}
      <div className="space-y-4 pt-6">
        {MOCK_CHALLENGES.map((quest, idx) => (
          <div
            key={quest.id}
            className="bg-slate-800/80 hover:bg-slate-800 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
          >
            
            {/* Left: Number, Hexagon Icon, Title & Badge */}
            <div className="flex items-center gap-3.5 min-w-[260px]">
              {/* Number */}
              <span className="text-base font-bold text-slate-400 w-5 text-center shrink-0">
                {idx + 1}
              </span>

              {/* Icon Badge */}
              <div className="w-10 h-10 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                {getIcon(quest.iconName)}
              </div>

              {/* Title & Badge Tag */}
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                  <span>{quest.title}</span>
                </h4>
                <span className="text-xs text-amber-300/90 font-medium">
                  🏅 {quest.badgeLabel}
                </span>
              </div>
            </div>

            {/* Middle: Progress Bar */}
            <div className="flex-1 max-w-md w-full space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>ความคืบหน้า</span>
                <span>{quest.progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    quest.iconName === 'Flame'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                      : quest.iconName === 'Coffee'
                      ? 'bg-gradient-to-r from-[#F26430] to-orange-400'
                      : quest.iconName === 'Footprints'
                      ? 'bg-gradient-to-r from-[#4A7C59] to-emerald-400'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  }`}
                  style={{ width: `${quest.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Right: Completed Count Info (ต่อท้ายในแต่ละ Challenge) */}
            <div className="shrink-0 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/50">
              <div className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{quest.completedCountInfo}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};
