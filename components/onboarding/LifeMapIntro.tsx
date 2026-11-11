'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { LifestyleSpotItem } from '@/data/spotsData';
import type { SpotVibeId } from '@/data/masterHub';
import { getSpotVibeCategory } from '@/lib/spotVibe';

/**
 * The first "wow" of Chillwaa (owner 2026-11-11), between the onboarding answers and the summary:
 * 1. "เคยไปที่ไหนมาแล้วบ้าง?" well-known places in the member's own province, then famous places elsewhere in the
 *    สาย they picked (owner 2026-11-11), tapped in a few seconds;
 * 2. the reveal: how many, their สาย, the stamps. No Story card here: sign-up keeps its focus (owner 2026-11-11);
 * 3. "ภารกิจแรกของคุณ" up to five starter challenges (QuestRule.posts); the member ticks the ones to take (at least
 *    one suggested) and only those are joined. The summary and the home row show them.
 * Places tapped here are marked visits: they fill the passport and earn no XP. A preview saves nothing.
 */

type Spot = Pick<LifestyleSpotItem, 'id' | 'title' | 'image' | 'category' | 'vibeTags' | 'description'> & { wikiMonthlyViews?: number };
export type Starter = { id: string; title: string; objective?: string; image?: string; rewardPoints?: number; badgeLabel?: string };

const PICK_SHOWN = 24;
/** Famous places outside the province, in the member's สาย */
const ELSEWHERE_SHOWN = 8;
const STARTERS_SHOWN = 5;
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

const primary = 'w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-[15px] font-bold text-white disabled:opacity-40 cursor-pointer transition-colors';
const quiet = 'w-full h-11 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer';

type Place = Spot & { province?: string };
const byViews = (a: Place, b: Place) => (b.wikiMonthlyViews ?? 0) - (a.wikiMonthlyViews ?? 0);

/** A square place tile that toggles on tap */
function PlaceTile({ spot, on, onToggle }: { spot: Place; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
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
  );
}

export function LifeMapIntro({ province, vibes, preview, onDone }: { province: string; /** The place สาย (SpotVibeId) inferred from the answers */ vibes: string[]; preview: boolean; onDone: (taken: Starter[]) => void }) {
  const [stage, setStage] = useState<'pick' | 'reveal' | 'missions'>('pick');
  const [spots, setSpots] = useState<Place[] | null>(null);
  const [elsewhere, setElsewhere] = useState<Place[]>([]);
  const [total, setTotal] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [starters, setStarters] = useState<Starter[] | null>(null);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const vibeKey = vibes.join(',');

  // The province's best-known places with a photo (most searched first), and famous places elsewhere in the member's
  // สาย. Both load at once; the second list never holds up the first
  useEffect(() => {
    let alive = true;
    void fetch(`/api/spots?province=${encodeURIComponent(province)}&limit=60&hasImageOnly=true`)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        const list: Place[] = Array.isArray(json?.spots) ? json.spots : [];
        setTotal(json?.pagination?.totalCount ?? json?.pagination?.total ?? list.length);
        setSpots([...list].sort(byViews).slice(0, PICK_SHOWN));
      })
      .catch(() => alive && setSpots([]));
    const wanted = new Set(vibeKey.split(',').filter(Boolean));
    if (wanted.size) {
      void fetch('/api/spots?limit=100&hasImageOnly=true')
        .then((r) => r.json())
        .then((json) => {
          if (!alive) return;
          const list: Place[] = Array.isArray(json?.spots) ? json.spots : [];
          setElsewhere(
            list
              .filter((s) => s.province !== province && (s.wikiMonthlyViews ?? 0) > 0 && wanted.has(getSpotVibeCategory(s as LifestyleSpotItem)))
              .sort(byViews)
              .slice(0, ELSEWHERE_SHOWN)
          );
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [province, vibeKey]);

  // The starter challenges, read while the member picks places so the missions screen opens ready
  useEffect(() => {
    let alive = true;
    void fetch('/api/quests?limit=100')
      .then((r) => r.json())
      .then((json) => {
        const list: (Starter & { rule?: { posts?: unknown }; status?: string })[] = json?.quests ?? json?.items ?? json?.data ?? [];
        if (alive) setStarters(list.filter((q) => q.rule?.posts && q.status !== 'ended').sort((a, b) => (b.rewardPoints ?? 0) - (a.rewardPoints ?? 0)).slice(0, STARTERS_SHOWN));
      })
      .catch(() => alive && setStarters([]));
    return () => {
      alive = false;
    };
  }, []);

  // A province with nothing to pick yet goes straight to the first missions
  const shown = stage === 'pick' && spots !== null && spots.length + elsewhere.length < 4 ? 'missions' : stage;

  const chosen = useMemo(() => [...(spots ?? []), ...elsewhere].filter((s) => picked.has(s.id)), [spots, elsewhere, picked]);
  const chosenHere = useMemo(() => (spots ?? []).filter((s) => picked.has(s.id)).length, [spots, picked]);
  const sai = useMemo(() => saiOf(chosen), [chosen]);
  const flip = (set: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) =>
    set((now) => {
      const next = new Set(now);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggle = flip(setPicked);
  const toggleTaken = flip(setTaken);
  const go = (next: typeof stage) => {
    setStage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reveal = async () => {
    setIsBusy(true);
    if (!preview) await post('/api/visits', { action: 'mark_many', targetIds: [...picked] });
    setIsBusy(false);
    go('reveal');
  };
  // Only the challenges ticked are joined; the summary and the home row show them
  const takeMissions = async (list: Starter[]) => {
    setIsBusy(true);
    if (!preview) await Promise.all(list.map((q) => post('/api/quests/join', { questId: q.id, action: 'join' })));
    setIsBusy(false);
    onDone(list);
  };

  if (shown === 'pick') {
    return (
      <section aria-labelledby="lifemap-pick" className="space-y-5">
        <header className="space-y-1.5">
          <h1 id="lifemap-pick" className="text-2xl font-bold text-slate-900 text-balance">เคยไปที่ไหนมาแล้วบ้าง?</h1>
          <p className="text-[15px] text-slate-600">แตะที่ที่เคยไป แล้วดูแผนที่ชีวิตของคุณ</p>
        </header>
        {spots === null ? (
          <div className="grid grid-cols-3 gap-2" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => <div key={i} className="aspect-square rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <>
            {spots.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-700">ใน{province}</h2>
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {spots.map((spot) => (
                    <li key={spot.id}>
                      <PlaceTile spot={spot} on={picked.has(spot.id)} onToggle={() => toggle(spot.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {elsewhere.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-sm font-semibold text-slate-700">ที่อื่นในสายที่คุณชอบ</h2>
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {elsewhere.map((spot) => (
                    <li key={spot.id}>
                      <PlaceTile spot={spot} on={picked.has(spot.id)} onToggle={() => toggle(spot.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white to-white/0 space-y-1">
          <button type="button" onClick={reveal} disabled={picked.size === 0 || isBusy} className={primary}>
            {picked.size ? `ดูแผนที่ชีวิตของฉัน · ${picked.size} ที่` : 'แตะที่ที่เคยไปก่อนนะ'}
          </button>
          <button type="button" onClick={() => go('missions')} className={quiet}>
            ยังไม่เคยไปที่ไหนเลย ข้ามไปก่อน
          </button>
        </div>
      </section>
    );
  }

  if (shown === 'reveal') {
    const rest = Math.max(0, total - chosenHere);
    const away = chosen.length - chosenHere;
    return (
      <section aria-labelledby="lifemap-reveal" className="space-y-7">
        <header className="space-y-1">
          <p className="text-sm font-semibold text-slate-500">แผนที่ชีวิตของคุณ</p>
          <h1 id="lifemap-reveal" className="flex items-baseline gap-3 text-slate-900">
            <span className="text-7xl font-bold tabular-nums text-[#F26430] motion-safe:animate-[toast-in_400ms_ease-out]">{chosen.length}</span>
            <span className="text-xl font-bold">ที่ที่คุณไปมาแล้ว</span>
          </h1>
          {away > 0 && chosenHere > 0 && (
            <p className="text-sm text-slate-500 tabular-nums">
              ใน{province} {chosenHere} · ที่อื่น {away}
            </p>
          )}
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
        <div className="space-y-1.5">
          {rest > 0 && <p className="text-[15px] text-slate-600">ใน{province}ยังมีอีก <span className="font-semibold text-slate-900 tabular-nums">{rest.toLocaleString()}</span> ที่รอคุณอยู่</p>}
          <p className="text-[13px] text-slate-500">เราเก็บที่เหล่านี้ไว้ในแผนที่ของคุณแล้ว</p>
        </div>
        <button type="button" onClick={() => go('missions')} className={primary}>
          ไปต่อ
        </button>
      </section>
    );
  }

  const list = starters ?? [];
  const takenList = list.filter((q) => taken.has(q.id));
  return (
    <section aria-labelledby="lifemap-missions" className="space-y-5">
      <header className="space-y-1.5">
        <h1 id="lifemap-missions" className="text-2xl font-bold text-slate-900">ภารกิจแรกของคุณ</h1>
        <p className="text-[15px] text-slate-600">เลือกภารกิจที่อยากทำ แนะนำอย่างน้อย 1 ภารกิจ โพสต์เดียวก็สำเร็จ</p>
      </header>
      {starters === null ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((quest) => {
            const on = taken.has(quest.id);
            return (
              <li key={quest.id}>
                <button
                  type="button"
                  onClick={() => toggleTaken(quest.id)}
                  aria-pressed={on}
                  className={`w-full flex items-center gap-3.5 p-2.5 pr-4 rounded-2xl text-left cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] ${on ? 'bg-slate-50 ring-2 ring-slate-900' : 'ring-1 ring-slate-200 hover:bg-slate-50'}`}
                >
                  {quest.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the challenge cover, a local file
                    <img src={quest.image} alt="" className="w-14 h-14 shrink-0 rounded-xl object-cover bg-slate-100" />
                  ) : (
                    <span className="w-14 h-14 shrink-0 rounded-xl bg-slate-100" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-slate-900">{quest.title}</span>
                    <span className="block mt-0.5 text-[13px] font-semibold text-[#B45309]">
                      +{quest.rewardPoints ?? 0} XP{quest.badgeLabel ? ` · เหรียญ ${quest.badgeLabel}` : ''}
                    </span>
                  </span>
                  <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${on ? 'bg-slate-900 text-white' : 'ring-2 ring-slate-300'}`} aria-hidden="true">
                    {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="space-y-1">
        <button type="button" onClick={() => takeMissions(takenList)} disabled={takenList.length === 0 || isBusy} className={primary}>
          {takenList.length ? `รับ ${takenList.length} ภารกิจ` : 'เลือกภารกิจที่อยากทำ'}
        </button>
        <button type="button" onClick={() => takeMissions([])} disabled={isBusy} className={quiet}>
          ไว้ก่อน
        </button>
      </div>
    </section>
  );
}
