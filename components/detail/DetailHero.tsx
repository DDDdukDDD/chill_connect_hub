import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Camera } from 'lucide-react';

/** Pillar colours from DESIGN_SYSTEM.md section 2 (colour on tags and icons only, never on buttons) */
export const PILLAR_STYLE = {
  community: { name: 'ตี้', color: '#F26430', dark: '#B93F12', tint: '#FFF4EE' },
  fair: { name: 'งานแฟร์', color: '#2B527A', dark: '#1F3D5C', tint: '#EEF4FA' },
  spot: { name: 'ที่เที่ยว', color: '#4A7C59', dark: '#2D5A3C', tint: '#EBF3ED' },
  challenge: { name: 'ชาเลนจ์', color: '#7C3AED', dark: '#6D28D9', tint: '#F5F3FF' },
  moment: { name: 'โมเมนต์', color: '#F43F5E', dark: '#BE123C', tint: '#FFF1F2' },
} as const;

export type DetailPillar = keyof typeof PILLAR_STYLE;

export interface DetailFact {
  icon: LucideIcon;
  /** The line people decide on ("เสาร์ 25 ต.ค. 2569") */
  title: React.ReactNode;
  /** The detail under it ("17:30 – 19:00 น.") */
  sub?: React.ReactNode;
}

interface DetailHeroProps {
  pillar: Exclude<DetailPillar, 'moment'>;
  image: string;
  imageAlt: string;
  /** More than one photo shows "ดูรูปทั้งหมด (n)" on the photo */
  photoCount?: number;
  onOpenPhotos?: () => void;
  /** A sticker on the photo's corner, e.g. "+300 XP" on a challenge */
  photoBadge?: React.ReactNode;
  chips?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  facts: DetailFact[];
  /** The one main action (blue) and its quiet neighbours */
  actions: React.ReactNode;
  /** One short line under the actions ("ฟรี · ยกเลิกได้ก่อน 24 ชม.") */
  note?: React.ReactNode;
}

/**
 * The top of every detail page (ตี้, งานแฟร์, ที่เที่ยว, ชาเลนจ์): the photo on the left and, beside it, everything
 * needed to decide (what, when, where, how much) with the one main action. Server-renderable, so the title and
 * facts are in the HTML that search engines and AI crawlers read.
 */
export function DetailHero({ pillar, image, imageAlt, photoCount = 1, onOpenPhotos, photoBadge, chips, title, subtitle, facts, actions, note }: DetailHeroProps) {
  const style = PILLAR_STYLE[pillar];
  return (
    <section className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 md:gap-10 items-center">
      <figure className="relative m-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- content images come from many hosts */}
        <img
          src={image}
          alt={imageAlt}
          className={`block w-full aspect-[4/3] object-cover rounded-3xl bg-slate-100 ${onOpenPhotos ? 'cursor-zoom-in' : ''}`}
          onClick={onOpenPhotos}
          fetchPriority="high"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs sm:text-[13px] font-semibold text-slate-900">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} aria-hidden="true" />
          {style.name}
        </span>
        {photoBadge && <span className="absolute right-3 bottom-3">{photoBadge}</span>}
        {!photoBadge && onOpenPhotos && photoCount > 1 && (
          <button
            type="button"
            onClick={onOpenPhotos}
            className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-white cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            ดูรูปทั้งหมด ({photoCount})
          </button>
        )}
      </figure>

      <div className="flex flex-col gap-4">
        {chips && <div className="flex flex-wrap gap-2">{chips}</div>}
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] lg:leading-[1.3] font-bold text-slate-900 tracking-tight break-words">{title}</h1>
        {subtitle && <p className="text-[15px] sm:text-base text-slate-600 leading-relaxed">{subtitle}</p>}
        {facts.length > 0 && (
          <ul className="flex flex-col gap-3 text-sm sm:text-[15px]">
            {facts.map((fact, i) => {
              const Icon = fact.icon;
              return (
                <li key={i} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: style.color }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{fact.title}</div>
                    {fact.sub && <div className="text-[13px] sm:text-sm text-slate-500">{fact.sub}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
        {note && <p className="-mt-1 text-[13px] text-slate-500">{note}</p>}
      </div>
    </section>
  );
}

/** A tinted chip in the pillar's colours (category name) */
export function PillarChip({ pillar, children }: { pillar: DetailPillar; children: React.ReactNode }) {
  const style = PILLAR_STYLE[pillar];
  return (
    <span className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ backgroundColor: style.tint, color: style.dark, borderColor: `${style.color}55` }}>
      {children}
    </span>
  );
}

/** A status chip: open (green), soon (pillar tint), closed or ended (grey) */
export function StatusChip({ tone, children }: { tone: 'open' | 'warn' | 'muted' | 'live'; children: React.ReactNode }) {
  const cls = {
    open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warn: 'bg-amber-50 text-amber-900 border-amber-200',
    muted: 'bg-slate-100 text-slate-700 border-slate-200',
    live: 'bg-rose-50 text-rose-700 border-rose-200',
  }[tone];
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}>{children}</span>;
}

/** The blue main action and its quiet neighbours share one height */
export const heroButton = {
  primary: 'inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[15px] sm:text-base font-semibold cursor-pointer transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed',
  done: 'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border-[1.5px] border-[#2563EB] bg-white text-[#1D4ED8] text-[15px] sm:text-base font-semibold cursor-pointer',
  secondary: 'inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-[15px] font-semibold cursor-pointer transition-colors',
  icon: 'inline-flex items-center justify-center w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors',
};
