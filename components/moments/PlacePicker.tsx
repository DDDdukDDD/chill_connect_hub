'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import type { MomentLinkTarget } from './MomentComposer';

const LINK_TYPE_LABELS: Record<MomentLinkTarget['type'], string> = { community: 'ตี้', fair: 'อีเวนต์', spot: 'ที่เที่ยว' };

type GeneralPlace = { name: string; detail: string };
type NearbyState = { status: 'idle' | 'loading' | 'denied' | 'error' } | { status: 'done'; spots: MomentLinkTarget[]; places: GeneralPlace[]; morePending: boolean };

const row = 'w-full flex items-center gap-3 px-3.5 min-h-12 py-2 text-left hover:bg-slate-50 cursor-pointer';
const groupTitle = 'text-xs font-bold text-slate-600 mb-1.5';
const listBox = 'rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden';

/**
 * Where a moment is from, like Instagram: what the member joined or saved, what is around them, and any place by search.
 * A place of ours or a ตี้ links the post to it; a general place is only its name on the post.
 */
export function PlacePicker({ mine, onPickTarget, onPickName, onClose }: {
  mine: MomentLinkTarget[];
  onPickTarget: (target: MomentLinkTarget) => void;
  onPickName: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MomentLinkTarget[]>([]);
  const [searching, setSearching] = useState(false);
  const [general, setGeneral] = useState<{ query: string; places: GeneralPlace[]; error?: string } | null>(null);
  const [generalBusy, setGeneralBusy] = useState(false);
  const [nearby, setNearby] = useState<NearbyState>({ status: 'idle' });
  const q = query.trim();

  const findNearby = useCallback(() => {
    if (!navigator.geolocation) return setNearby({ status: 'error' });
    setNearby({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const url = `/api/places/nearby?lat=${coords.latitude}&lng=${coords.longitude}`;
        const get = (address: string) => fetch(address, { cache: 'no-store' }).then((res) => res.json()).catch(() => null);
        const ours = await get(url);
        if (!ours?.success) return setNearby({ status: 'error' });
        const spots = (ours.spots as { id: string; title: string; location: string }[]).map((spot) => ({ type: 'spot' as const, ...spot }));
        // Our own places show at once; the outside services can take a few seconds
        setNearby({ status: 'done', spots, places: [], morePending: true });
        const general = await get(`${url}&general=1`);
        setNearby({ status: 'done', spots, places: general?.places ?? [], morePending: false });
      },
      (error) => setNearby({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'error' }),
      { timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  // Already allowed before: show what is around right away. Otherwise the question waits until the member asks
  useEffect(() => {
    let active = true;
    navigator.permissions?.query({ name: 'geolocation' }).then((permission) => {
      if (active && permission.state === 'granted') findNearby();
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [findNearby]);

  // Our own places, ตี้ and อีเวนต์, once typing pauses
  useEffect(() => {
    if (q.length < 2) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      const get = (url: string) => fetch(url).then((res) => res.json()).catch(() => ({}));
      const [events, spots] = await Promise.all([
        get(`/api/events?q=${encodeURIComponent(q)}&limit=5&includeEnded=true`),
        get(`/api/spots?q=${encodeURIComponent(q)}&limit=4`),
      ]);
      if (!active) return;
      setResults([
        ...((events.events ?? []) as EventItem[]).map((e) => ({ type: e.eventType === 'public_venue' ? ('fair' as const) : ('community' as const), id: e.id, title: e.title, location: e.location || '' })),
        ...((spots.spots ?? []) as LifestyleSpotItem[]).map((s) => ({ type: 'spot' as const, id: s.id, title: s.title, location: [s.district, s.province].filter(Boolean).join(', ') })),
      ]);
      setSearching(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  // The member's own matches come before the catalog's
  const matches = useMemo(() => {
    if (q.length < 2) return [];
    const lower = q.toLowerCase();
    const own = mine.filter((item) => item.title.toLowerCase().includes(lower) || item.location.toLowerCase().includes(lower)).slice(0, 4);
    return [...own, ...results.filter((r) => !own.some((item) => item.type === r.type && item.id === r.id))];
  }, [q, mine, results]);

  // OpenStreetMap asks for few requests, so this runs on a press, never while typing
  const searchGeneral = async () => {
    if (q.length < 2 || generalBusy) return;
    setGeneralBusy(true);
    const json = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' }).then((res) => res.json()).catch(() => null);
    setGeneral(json?.success ? { query: q, places: json.places } : { query: q, places: [], error: json?.message || 'ค้นหาไม่ได้ในตอนนี้ ลองอีกครั้งนะ' });
    setGeneralBusy(false);
  };

  const targetRow = (target: MomentLinkTarget) => (
    <li key={`${target.type}-${target.id}`}>
      <button type="button" className={row} onClick={() => onPickTarget(target)}>
        <span className="shrink-0 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">{LINK_TYPE_LABELS[target.type]}</span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900 truncate">{target.title}</span>
          {target.location && <span className="block text-xs text-slate-500 truncate">{target.location}</span>}
        </span>
      </button>
    </li>
  );
  const nameRow = (place: GeneralPlace) => (
    <li key={`${place.name}-${place.detail}`}>
      <button type="button" className={row} onClick={() => onPickName(place.name)}>
        <MapPin className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900 truncate">{place.name}</span>
          {place.detail && <span className="block text-xs text-slate-500 truncate">{place.detail}</span>}
        </span>
      </button>
    </li>
  );

  return (
    <DialogShell onClose={onClose} title="ไปที่ไหนมา" subtitle="เลือกที่เที่ยว ตี้ หรืออีเวนต์ เพื่อนๆ จะตามไปได้ และถ้าที่นั่นอยู่ในชาเลนจ์ ระบบจะนับให้เลย" size="md" layer="top" align="top">
      <div className="space-y-4">
        <form
          role="search"
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            void searchGeneral();
          }}
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            data-autofocus
            type="search"
            value={query}
            maxLength={80}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อสถานที่"
            aria-label="ค้นหาชื่อสถานที่"
            autoComplete="off"
            className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-3.5 py-3 text-base sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-500 placeholder:font-normal"
          />
        </form>

        {q.length >= 2 ? (
          <div className="space-y-4">
            {(matches.length > 0 || searching) && (
              <div>
                <p className={groupTitle}>ใน Chillwaa</p>
                {matches.length > 0 ? <ul className={listBox}>{matches.map(targetRow)}</ul> : <p className="text-sm text-slate-500">กำลังค้นหา…</p>}
              </div>
            )}
            <div>
              <p className={groupTitle}>สถานที่ทั่วไป</p>
              {general?.query === q && general.places.length > 0 && <ul className={`${listBox} mb-2`}>{general.places.map(nameRow)}</ul>}
              {general?.query === q && general.places.length === 0 && <p role="status" className="mb-2 text-sm text-slate-500">{general.error ?? 'ไม่เจอที่นี่บนแผนที่ ใช้ชื่อที่พิมพ์ไว้ได้เลย'}</p>}
              <ul className={listBox}>
                {general?.query !== q && (
                  <li>
                    <button type="button" className={row} onClick={searchGeneral} disabled={generalBusy}>
                      <Search className="w-4 h-4 shrink-0 text-[#2563EB]" aria-hidden="true" />
                      <span className="min-w-0 text-sm font-semibold text-[#2563EB] truncate">{generalBusy ? 'กำลังค้นหา…' : `ค้นหา "${q}" บนแผนที่`}</span>
                    </button>
                  </li>
                )}
                <li>
                  <button type="button" className={row} onClick={() => onPickName(q)}>
                    <MapPin className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="min-w-0 text-sm font-semibold text-slate-900 truncate">ใช้ชื่อ &quot;{q}&quot;</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mine.length > 0 && (
              <div>
                <p className={groupTitle}>ที่คุณเข้าร่วมหรือบันทึกไว้</p>
                <ul className={`${listBox} max-h-56 overflow-y-auto`}>{mine.map(targetRow)}</ul>
              </div>
            )}
            <div>
              <p className={groupTitle}>ใกล้คุณ</p>
              {nearby.status === 'done' ? (
                nearby.spots.length + nearby.places.length > 0 || nearby.morePending ? (
                  <>
                    {nearby.spots.length + nearby.places.length > 0 && (
                      <ul className={`${listBox} max-h-64 overflow-y-auto`}>
                        {nearby.spots.map(targetRow)}
                        {nearby.places.map(nameRow)}
                      </ul>
                    )}
                    {nearby.morePending && <p role="status" className="mt-2 text-xs font-medium text-slate-500">กำลังหาสถานที่อื่นๆ แถวนี้…</p>}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">ยังไม่เจอสถานที่ใกล้ๆ ลองค้นหาชื่อด้านบนนะ</p>
                )
              ) : nearby.status === 'loading' ? (
                <p role="status" className="text-sm text-slate-500">กำลังหาที่ใกล้ๆ คุณ…</p>
              ) : (
                <>
                  {nearby.status === 'denied' && <p role="status" className="mb-2 text-sm text-slate-600">ยังไม่ได้อนุญาตตำแหน่ง เปิดได้ที่การตั้งค่าเบราว์เซอร์ หรือค้นหาชื่อด้านบนแทนก็ได้</p>}
                  {nearby.status === 'error' && <p role="status" className="mb-2 text-sm text-slate-600">หาตำแหน่งไม่สำเร็จ ลองอีกครั้ง หรือค้นหาชื่อด้านบนแทนนะ</p>}
                  <button type="button" className={dialogButton.quiet} onClick={findNearby}>
                    <LocateFixed className="w-4 h-4" aria-hidden="true" />
                    แสดงที่ใกล้ฉัน
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        <p className="text-[11px] text-slate-500">ข้อมูลสถานที่ทั่วไปจาก © OpenStreetMap contributors</p>
      </div>
    </DialogShell>
  );
}
