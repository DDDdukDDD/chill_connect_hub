'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import type { LifestyleSpotItem } from '@/data/spotsData';
import type { SpotVibeId } from '@/data/masterHub';
import { getSpotVibeCategory } from '@/lib/spotVibe';

/**
 * The first "wow" of Chillwaa (owner 2026-11-11), between the onboarding answers and the summary:
 * 1. "เคยไปที่ไหนมาแล้วบ้าง?" well-known places in the member's own province, tapped in a few seconds;
 * 2. the reveal: how many, their สาย, the stamps, and a card for an IG Story;
 * 3. "ภารกิจแรกของคุณ" the two starter challenges (QuestRule.posts), joined for them, each one post from the sofa.
 * Places tapped here are marked visits: they fill the passport and earn no XP. A preview saves nothing.
 */

type Spot = Pick<LifestyleSpotItem, 'id' | 'title' | 'image' | 'category' | 'vibeTags' | 'description'> & { wikiMonthlyViews?: number };
type Starter = { id: string; title: string; objective?: string; image?: string; rewardPoints?: number; badgeLabel?: string };

const PICK_SHOWN = 24;
/** Short words for a สาย, as the member reads them on the reveal */
const SAI: Record<SpotVibeId, string> = {
  mountain_mist: 'สายภูเขา', sea_island: 'สายทะเล', nature_camping: 'สายธรรมชาติ', cafe_slowbar: 'สายคาเฟ่', oldtown_culture: 'สายเมืองเก่า',
  art_creative: 'สายอาร์ต', wellness_retreat: 'สายฮีลใจ', views_rooftop: 'สายวิวสวย', city_parks: 'สายสวน', temple_mu: 'สายวัด',
  museum_learning: 'สายพิพิธภัณฑ์', food_street: 'สายสตรีทฟู้ด', market_walking: 'สายตลาด', nightlife_bars: 'สายไนท์ไลฟ์', fun_activities: 'สายสนุก', shopping_mall: 'สายช้อป',
};

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);

/** The top สาย of the places picked, with their share (at most three) */
function saiOf(spots: Spot[]): { label: string; percent: number }[] {
  const counts = new Map<string, number>();
  for (const spot of spots) {
    const label = SAI[getSpotVibeCategory(spot as LifestyleSpotItem)];
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, n]) => ({ label, percent: Math.round((n / spots.length) * 100) }));
}

/** A 9:16 card for an IG Story: the number, the สาย and the places, drawn in the page's own font */
async function lifeMapCard(count: number, province: string, sai: { label: string; percent: number }[], names: string[]): Promise<'shared' | 'saved' | 'cancelled'> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d')!;
  const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  ctx.fillStyle = '#FFFBF7';
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = '#F26430';
  ctx.beginPath();
  ctx.arc(960, 160, 260, 0, Math.PI * 2);
  ctx.globalAlpha = 0.08;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0F172A';
  ctx.font = `600 54px ${font}`;
  ctx.fillText('แผนที่ชีวิตของฉัน', 96, 300);
  ctx.fillStyle = '#F26430';
  ctx.font = `700 320px ${font}`;
  ctx.fillText(String(count), 84, 640);
  ctx.fillStyle = '#0F172A';
  ctx.font = `600 64px ${font}`;
  ctx.fillText(`ที่ใน${province}ที่ฉันไปมาแล้ว`, 96, 760);
  let y = 900;
  ctx.font = `600 46px ${font}`;
  for (const s of sai) {
    ctx.fillStyle = '#F1F5F9';
    const text = `${s.label} ${s.percent}%`;
    const w = ctx.measureText(text).width + 64;
    ctx.beginPath();
    ctx.roundRect(96, y - 56, w, 84, 42);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillText(text, 128, y);
    y += 112;
  }
  y += 40;
  ctx.font = `500 44px ${font}`;
  for (const name of names.slice(0, 6)) {
    ctx.fillStyle = '#16A34A';
    ctx.fillText('✓', 96, y);
    ctx.fillStyle = '#334155';
    const short = name.length > 26 ? `${name.slice(0, 25)}…` : name;
    ctx.fillText(short, 160, y);
    y += 76;
  }
  ctx.fillStyle = '#94A3B8';
  ctx.font = `500 40px ${font}`;
  ctx.fillText('Chillwaa · ทำให้ทุกการใช้ชีวิตมีความหมาย', 96, 1800);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.92));
  const file = new File([blob], 'chillwaa-life-map.jpg', { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}

const primary = 'w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-[15px] font-bold text-white disabled:opacity-40 cursor-pointer transition-colors';
const quiet = 'w-full h-11 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer';

export function LifeMapIntro({ province, preview, onDone }: { province: string; preview: boolean; onDone: () => void }) {
  const [stage, setStage] = useState<'pick' | 'reveal' | 'missions'>('pick');
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [total, setTotal] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [starters, setStarters] = useState<Starter[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [note, setNote] = useState('');

  // The province's best-known places with a photo: the ones people search for most come first
  useEffect(() => {
    let alive = true;
    void fetch(`/api/spots?province=${encodeURIComponent(province)}&limit=60&hasImageOnly=true`)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        const list: Spot[] = Array.isArray(json?.spots) ? json.spots : [];
        setTotal(json?.pagination?.totalCount ?? json?.pagination?.total ?? list.length);
        setSpots([...list].sort((a, b) => (b.wikiMonthlyViews ?? 0) - (a.wikiMonthlyViews ?? 0)).slice(0, PICK_SHOWN));
      })
      .catch(() => alive && setSpots([]));
    return () => {
      alive = false;
    };
  }, [province]);

  // A province with nothing to pick yet goes straight to the first missions
  const shown = stage === 'pick' && spots !== null && spots.length < 4 ? 'missions' : stage;

  // The starter challenges, joined as they are shown (a preview only shows them)
  useEffect(() => {
    if (shown !== 'missions' || starters) return;
    void fetch('/api/quests?limit=100')
      .then((r) => r.json())
      .then(async (json) => {
        const list: (Starter & { rule?: { posts?: unknown } })[] = json?.quests ?? json?.items ?? json?.data ?? [];
        const found = list.filter((q) => q.rule?.posts).sort((a, b) => (b.rewardPoints ?? 0) - (a.rewardPoints ?? 0));
        setStarters(found);
        if (!preview) await Promise.all(found.map((q) => post('/api/quests/join', { questId: q.id, action: 'join' })));
      })
      .catch(() => setStarters([]));
  }, [shown, starters, preview]);

  const chosen = useMemo(() => (spots ?? []).filter((s) => picked.has(s.id)), [spots, picked]);
  const sai = useMemo(() => saiOf(chosen), [chosen]);
  const toggle = (id: string) =>
    setPicked((now) => {
      const next = new Set(now);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const reveal = async () => {
    setIsBusy(true);
    if (!preview) await post('/api/visits', { action: 'mark_many', targetIds: [...picked] });
    setIsBusy(false);
    setStage('reveal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const share = async () => {
    setNote('');
    const done = await lifeMapCard(chosen.length, province, sai, chosen.map((s) => s.title)).catch(() => null);
    setNote(done === 'saved' ? 'บันทึกการ์ดลงเครื่องแล้ว ลงสตอรี่ได้เลย' : done === 'shared' ? 'แชร์แล้ว' : done === null ? 'ทำการ์ดไม่สำเร็จ ลองอีกครั้งนะ' : '');
  };

  if (shown === 'pick') {
    return (
      <section aria-labelledby="lifemap-pick" className="space-y-5">
        <header className="space-y-1.5">
          <h1 id="lifemap-pick" className="text-2xl font-bold text-slate-900 text-balance">เคยไปที่ไหนมาแล้วบ้าง?</h1>
          <p className="text-[15px] text-slate-600">แตะที่ที่เคยไปใน{province} แล้วดูแผนที่ชีวิตของคุณ</p>
        </header>
        {spots === null ? (
          <div className="grid grid-cols-3 gap-2" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => <div key={i} className="aspect-square rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {spots.map((spot) => {
              const on = picked.has(spot.id);
              return (
                <li key={spot.id}>
                  <button
                    type="button"
                    onClick={() => toggle(spot.id)}
                    aria-pressed={on}
                    className={`relative block w-full aspect-square overflow-hidden rounded-2xl bg-slate-100 cursor-pointer transition-transform duration-150 motion-safe:active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] ${on ? 'ring-[3px] ring-slate-900' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- place photos from many hosts, small tiles */}
                    <img src={spot.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-left text-[11px] sm:text-xs font-semibold leading-snug text-white line-clamp-2 overflow-hidden">{spot.title}</span>
                    {on && (
                      <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center" aria-hidden="true">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white to-white/0 space-y-1">
          <button type="button" onClick={reveal} disabled={picked.size === 0 || isBusy} className={primary}>
            {picked.size ? `ดูแผนที่ชีวิตของฉัน · ${picked.size} ที่` : 'แตะที่ที่เคยไปก่อนนะ'}
          </button>
          <button type="button" onClick={() => setStage('missions')} className={quiet}>
            ยังไม่เคยไปที่ไหนเลย ข้ามไปก่อน
          </button>
        </div>
      </section>
    );
  }

  if (shown === 'reveal') {
    const rest = Math.max(0, total - chosen.length);
    return (
      <section aria-labelledby="lifemap-reveal" className="space-y-7">
        <header className="space-y-1">
          <p className="text-sm font-semibold text-slate-500">แผนที่ชีวิตของคุณ</p>
          <h1 id="lifemap-reveal" className="flex items-baseline gap-3 text-slate-900">
            <span className="text-7xl font-bold tabular-nums text-[#F26430] motion-safe:animate-[toast-in_400ms_ease-out]">{chosen.length}</span>
            <span className="text-xl font-bold">ที่ใน{province}ที่คุณไปมาแล้ว</span>
          </h1>
        </header>
        {/* The stamps: the photos of the places, like a passport */}
        <ul className="flex flex-wrap gap-2.5" aria-label="ที่ที่ไปมาแล้ว">
          {chosen.slice(0, 12).map((spot, i) => (
            <li key={spot.id} className={`w-16 h-16 rounded-full overflow-hidden ring-4 ring-white shadow-sm bg-slate-100 ${i % 3 === 0 ? '-rotate-6' : i % 3 === 1 ? 'rotate-3' : 'rotate-0'}`} title={spot.title}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a stamp of the place photo */}
              <img src={spot.image} alt={spot.title} className="w-full h-full object-cover" />
            </li>
          ))}
        </ul>
        {sai.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">คุณเป็น</p>
            <ul className="flex flex-wrap gap-2">
              {sai.map((s) => (
                <li key={s.label} className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-sm font-semibold text-slate-800">
                  {s.label}
                  <span className="text-slate-500 tabular-nums">{s.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {rest > 0 && <p className="text-[15px] text-slate-600">ใน{province}ยังมีอีก <span className="font-semibold text-slate-900 tabular-nums">{rest.toLocaleString()}</span> ที่รอคุณอยู่</p>}
        <div className="space-y-1">
          <button type="button" onClick={() => setStage('missions')} className={primary}>
            ไปต่อ
          </button>
          <button type="button" onClick={share} className={`${quiet} inline-flex items-center justify-center gap-2`}>
            <Share2 className="w-4 h-4" aria-hidden="true" />
            ทำการ์ดลงสตอรี่
          </button>
          {note && <p role="status" className="text-center text-[13px] text-slate-500">{note}</p>}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="lifemap-missions" className="space-y-6">
      <header className="space-y-1.5">
        <h1 id="lifemap-missions" className="text-2xl font-bold text-slate-900">ภารกิจแรกของคุณ</h1>
        <p className="text-[15px] text-slate-600">ทำได้ในหนึ่งนาทีจากโซฟา โพสต์แล้วรับรางวัลทันที</p>
      </header>
      {starters === null ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {starters.map((quest) => (
            <li key={quest.id} className="flex items-center gap-3.5 py-3.5">
              {quest.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- the challenge cover, a local file
                <img src={quest.image} alt="" className="w-16 h-16 shrink-0 rounded-2xl object-cover bg-slate-100" />
              ) : (
                <span className="w-16 h-16 shrink-0 rounded-2xl bg-slate-100" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-slate-900">{quest.title}</p>
                {quest.objective && <p className="text-[13px] text-slate-600 line-clamp-2">{quest.objective}</p>}
                <p className="mt-0.5 text-[13px] font-semibold text-[#B45309]">+{quest.rewardPoints ?? 0} XP · เหรียญ {quest.badgeLabel}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[13px] text-slate-500">เราใส่ภารกิจนี้ไว้ในชาเลนจ์ของคุณแล้ว ทำเมื่อพร้อมได้เลย</p>
      <button type="button" onClick={onDone} className={primary}>
        ไปต่อ
      </button>
    </section>
  );
}
