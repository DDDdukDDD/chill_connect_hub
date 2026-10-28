import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Camera } from 'lucide-react';
import { PosterPhoto } from '@/components/PosterPhoto';

/** The one live fact a visitor decides on, as a bold coloured line under the title: seats on a ตี้, open now on a place */
export interface DetailHighlight {
  icon: LucideIcon;
  text: string;
  /** open = go ahead (green), urgent = few left (orange), closed = full, ended or shut (grey) */
  tone: 'open' | 'urgent' | 'closed';
}

const HIGHLIGHT_TONE: Record<DetailHighlight['tone'], string> = { open: 'text-emerald-700', urgent: 'text-orange-600', closed: 'text-slate-500' };

/** Pillar colours from DESIGN_SYSTEM.md section 2 (colour on tags and icons only, never on buttons) */
export const PILLAR_STYLE = {
  community: { name: 'ตี้', color: '#F26430', dark: '#B93F12', tint: '#FFF4EE' },
  fair: { name: 'อีเวนต์', color: '#2B527A', dark: '#1F3D5C', tint: '#EEF4FA' },
  spot: { name: 'ที่เที่ยว', color: '#4A7C59', dark: '#2D5A3C', tint: '#EBF3ED' },
  challenge: { name: 'ชาเลนจ์', color: '#7C3AED', dark: '#6D28D9', tint: '#F5F3FF' },
  moment: { name: 'โมเมนต์', color: '#F43F5E', dark: '#BE123C', tint: '#FFF1F2' },
} as const;

export type DetailPillar = keyof typeof PILLAR_STYLE;

export interface DetailFact {
  icon: LucideIcon;
  /** One short fact, said once on the page ("เสาร์ 25 ต.ค. 2569 · 17:30 – 19:00 น.") */
  text: React.ReactNode;
}

interface DetailHeroProps {
  pillar: Exclude<DetailPillar, 'moment'>;
  image: string;
  imageAlt: string;
  /** More than one photo shows "รูปทั้งหมด (n)" on the photo */
  photoCount?: number;
  onOpenPhotos?: () => void;
  highlight?: DetailHighlight;
  title: string;
  subtitle?: React.ReactNode;
  facts: DetailFact[];
  /** The one main action (blue) and its quiet neighbours */
  actions: React.ReactNode;
  /** One short line under the actions ("ยกเลิกได้ก่อนเริ่ม 24 ชม.") */
  note?: React.ReactNode;
}

const STICKER = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200 shadow-2xs text-[11px] sm:text-xs font-bold text-slate-800';

/**
 * The top of the ตี้, อีเวนต์ and ที่เที่ยว pages, drawn like the challenge page's (owner 2026-10-24: clean and simple):
 * the photo with one small label, then the title, one bold live line (seats, open now), one row of grey facts and the main action.
 * Every fact is said here once; the rest of the page does not repeat it. Server-renderable, so the title and facts
 * are in the HTML that search engines and AI crawlers read.
 */
export function DetailHero({ pillar, image, imageAlt, photoCount = 1, onOpenPhotos, highlight, title, subtitle, facts, actions, note }: DetailHeroProps) {
  const style = PILLAR_STYLE[pillar];
  return (
    <section className="mt-2 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:items-center">
      <figure className="relative m-0 aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100">
        {/* A tall poster shows whole over a blurred copy of itself, so its text is not cut; photos fill the frame (owner 2026-10-28) */}
        <PosterPhoto
          src={image}
          alt={imageAlt}
          className={onOpenPhotos ? 'cursor-zoom-in' : ''}
          onClick={onOpenPhotos}
          fetchPriority="high"
        />
        <span className={`absolute top-3 left-3 ${STICKER}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.color }} aria-hidden="true" />
          {style.name}
        </span>
        {onOpenPhotos && photoCount > 1 && (
          <button type="button" onClick={onOpenPhotos} className={`absolute right-3 bottom-3 ${STICKER} cursor-pointer hover:bg-white`}>
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            รูปทั้งหมด {photoCount}
          </button>
        )}
      </figure>

      <div className="space-y-4 min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight break-words">{title}</h1>
        {highlight && (
          <p className={`inline-flex items-center gap-2 text-base sm:text-lg font-bold tabular-nums ${HIGHLIGHT_TONE[highlight.tone]}`}>
            <highlight.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            {highlight.text}
          </p>
        )}
        {subtitle && <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-prose">{subtitle}</p>}
        {facts.length > 0 && (
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {facts.map((fact, i) => {
              const Icon = fact.icon;
              return (
                <li key={i} className="inline-flex items-start gap-1.5 text-xs sm:text-sm font-bold text-slate-700 min-w-0">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
                  <span className="min-w-0 tabular-nums">{fact.text}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>
        {note && <p className="-mt-1 text-xs sm:text-[13px] font-medium text-slate-500">{note}</p>}
      </div>
    </section>
  );
}

/** The blue main action and its quiet neighbours share one height (as on the challenge page) */
export const heroButton = {
  primary: 'inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[15px] sm:text-base font-bold cursor-pointer whitespace-nowrap transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed',
  done: 'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border-[1.5px] border-[#2563EB] bg-white text-[#1D4ED8] text-[15px] sm:text-base font-bold cursor-pointer whitespace-nowrap',
  /** Share, chat, cancel: grey, never competing with the blue one */
  quiet: 'inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[15px] sm:text-base font-bold cursor-pointer whitespace-nowrap transition-colors',
  icon: 'inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors',
};

/** The host's schedule ("กำหนดการ" in the ตั้งตี้ / อีเวนต์ form), times down the left; nothing when there is none */
export function ItineraryList({ items }: { items?: { time: string; title: string }[] }) {
  const rows = (items ?? []).filter((row) => row.title?.trim());
  if (rows.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">กำหนดการ</h2>
      <ol className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="grid grid-cols-[4rem_1fr] gap-3 items-baseline">
            <span className="text-sm font-bold text-slate-900 tabular-nums">{row.time || '–'}</span>
            <span className="text-sm font-medium text-slate-700 leading-relaxed">{row.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A grey key / value table for the rules and details below the header, like the challenge page's กติกาและเงื่อนไข */
export function DetailTable({ title, rows }: { title: string; rows: { label: string; value: React.ReactNode }[] }) {
  const shown = rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== '' && row.value !== false);
  if (shown.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <dl className="divide-y divide-slate-200 border-y border-slate-200">
        {shown.map((row) => (
          <div key={row.label} className="grid grid-cols-[7rem_1fr] sm:grid-cols-[10rem_1fr] gap-3 py-3">
            <dt className="text-xs sm:text-sm font-medium text-slate-500">{row.label}</dt>
            <dd className="text-sm font-medium text-slate-800 leading-relaxed">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
