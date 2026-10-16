'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { FeedItem } from '@/lib/moments/service';

const LIMIT = 8;

/** Moments that match the home search: photo tiles in one sideways row, each opening the moment */
export function MomentSearchRow({ query }: { query: string }) {
  const [result, setResult] = useState<{ query: string; moments: FeedItem[] } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/moments?tab=all&q=${encodeURIComponent(query)}&limit=${LIMIT}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && setResult({ query, moments: ((json.moments ?? []) as FeedItem[]).filter((m) => m.images.length > 0) }))
      .catch(() => active && setResult({ query, moments: [] }));
    return () => {
      active = false;
    };
  }, [query]);

  if (!result || result.query !== query) {
    return (
      <div className="flex gap-3 overflow-hidden" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-40 sm:w-48 aspect-square shrink-0 rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }
  if (result.moments.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-600">ไม่พบโมเมนต์ที่ตรงกับคำค้นหา</p>;
  }
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {result.moments.map((moment) => (
        <Link key={moment.id} href={`/moments?momentId=${encodeURIComponent(moment.id)}`} className="group w-40 sm:w-48 shrink-0 space-y-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- member upload */}
          <img src={moment.images[0]} alt="" className="w-full aspect-square rounded-2xl object-cover bg-slate-100" />
          <span className="block text-[13px] font-bold text-slate-900 truncate">{moment.userName}</span>
          <span className="block text-xs font-medium text-slate-500 line-clamp-2 group-hover:underline">{moment.caption || moment.location}</span>
        </Link>
      ))}
    </div>
  );
}
