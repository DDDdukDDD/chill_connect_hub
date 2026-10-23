'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, MapPin, Trophy, Users } from 'lucide-react';
import { PILLAR_STYLE, type DetailPillar } from './DetailHero';

export interface PillarLink {
  pillar: DetailPillar;
  /** Small coloured label ("นับในชาเลนจ์") */
  label: string;
  /** The line itself ("เพื่อนใหม่ต้นปี · +300 XP") */
  text: string;
  href: string;
}

const ICON: Record<DetailPillar, typeof Trophy> = { challenge: Trophy, spot: MapPin, community: Users, fair: Users, moment: Camera };

/**
 * The strip under a detail page's header that joins it to the other pillars: the challenge it counts toward,
 * the place or ตี้ it connects to, and the moments people shared. Pages pass the links they know; with
 * `target`, the challenge and moments links are read from the visits API (one public, cached call).
 */
export function PillarLinks({ links = [], target, momentsNoun = 'ที่นี่' }: { links?: PillarLink[]; target?: { type: 'spot' | 'community' | 'fair'; id: string; title: string }; momentsNoun?: string }) {
  const [fromVisits, setFromVisits] = useState<PillarLink[]>([]);

  useEffect(() => {
    if (!target) return;
    const key = `${target.type}:${target.id}`;
    let active = true;
    fetch(`/api/visits?targets=${encodeURIComponent(key)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const info = json?.targets?.[key] as { momentsCount?: number; quests?: { questId: string; title: string; rewardPoints?: number }[] } | undefined;
        if (!active || !info) return;
        const found: PillarLink[] = [];
        const quest = info.quests?.[0];
        if (quest) {
          found.push({ pillar: 'challenge', label: 'นับในชาเลนจ์', text: `${quest.title}${quest.rewardPoints ? ` · +${quest.rewardPoints} XP` : ''}`, href: `/challenges/${encodeURIComponent(quest.questId)}` });
        }
        if (info.momentsCount) {
          found.push({ pillar: 'moment', label: 'โมเมนต์', text: `${info.momentsCount} โพสต์จาก${momentsNoun}`, href: `/moments?targetType=${target.type}&targetId=${encodeURIComponent(target.id)}&location=${encodeURIComponent(target.title)}` });
        }
        setFromVisits(found);
      })
      .catch(() => {
        /* the strip simply shows the links the page already knows */
      });
    return () => {
      active = false;
    };
  }, [target?.type, target?.id, target?.title, momentsNoun]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = [...fromVisits.filter((l) => l.pillar === 'challenge'), ...links, ...fromVisits.filter((l) => l.pillar !== 'challenge')].slice(0, 3);
  if (all.length === 0) return null;

  return (
    <nav aria-label="เชื่อมกับส่วนอื่น" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {all.map((link) => {
        const style = PILLAR_STYLE[link.pillar];
        const Icon = ICON[link.pillar];
        return (
          <Link key={`${link.pillar}-${link.href}`} href={link.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 hover:border-slate-300 hover:bg-slate-50 transition-colors">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: style.tint, color: style.dark }}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold" style={{ color: style.dark }}>{link.label}</span>
              <span className="block text-sm font-semibold text-slate-900 truncate">{link.text}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
