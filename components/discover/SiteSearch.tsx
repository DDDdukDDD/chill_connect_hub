'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_PROVINCES, discoverHref, type DiscoverCounts, type DiscoverKind } from '@/lib/discoverMatch';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';

/**
 * The top bar's search on every page outside ค้นพบ: the same box (word | province | blue button) in the same place.
 * Enter or the button opens ค้นพบ with the word and province, on the first tab that has something for them:
 * ตี้, then งานแฟร์, then ที่เที่ยว (owner 2026-10-23: a province with no ตี้ or fair opens on its places).
 * The numbers come from the same count the ค้นพบ tabs show; when nothing matches anywhere, ตี้ opens as before.
 */
const TAB_ORDER: DiscoverKind[] = ['meetups', 'fairs', 'spots'];

async function firstTabWithResults(query: string, province: string): Promise<DiscoverKind> {
  try {
    const params = new URLSearchParams({ province });
    if (query.trim()) params.set('q', query.trim());
    const res = await fetch(`/api/discover/counts?${params}`);
    const counts = (await res.json())?.counts as DiscoverCounts | undefined;
    return TAB_ORDER.find((kind) => (counts?.[kind] ?? 0) > 0) ?? 'meetups';
  } catch {
    return 'meetups';
  }
}
export function SiteSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState(ALL_PROVINCES);

  // "/" jumps to the search box, as on most sites
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== '/' || /INPUT|SELECT|TEXTAREA/.test(target?.tagName ?? '') || target?.isContentEditable) return;
      const input = document.getElementById('site-top-q');
      if (!input || input.offsetParent === null) return;
      e.preventDefault();
      input.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <DiscoverSearch
      idPrefix="site-top"
      kind="meetups"
      query={query}
      onQueryChange={setQuery}
      province={province}
      onProvinceChange={setProvince}
      onSubmit={async () => router.push(discoverHref(await firstTabWithResults(query, province), query, province))}
    />
  );
}
