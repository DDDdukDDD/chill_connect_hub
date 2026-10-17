'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_PROVINCES, discoverHref } from '@/lib/discoverMatch';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';

/**
 * The top bar's search on every page outside ค้นพบ: the same box (word | province | blue button) in the same place.
 * Enter or the button opens ค้นพบ with the word and province (meetups first; its tabs count fairs and places).
 */
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
      onSubmit={() => router.push(discoverHref('meetups', query, province))}
    />
  );
}
