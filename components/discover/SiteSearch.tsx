'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_PROVINCES } from '@/lib/discoverMatch';
import { DiscoverSearch } from '@/components/discover/DiscoverSearch';
import { SearchResults } from '@/components/discover/SearchResults';
import { addRecent, moveThroughResults, searchHref } from '@/components/discover/searchClient';
import { useAuth } from '@/lib/useAuth';

/**
 * The top bar's search on every page outside ค้นพบ: the same box (word | province | button) in the same place.
 * Focus opens a dropdown (BE-441): recent searches and things to tap before typing, then every kind of result while
 * typing (SearchResults). Enter opens all results (/search), or the tag's page for "#tag"; the province puts that
 * province's results first. The arrow keys move through the dropdown and Escape closes it.
 */
export function SiteSearch() {
  const router = useRouter();
  const { member, isLoggedIn } = useAuth();
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState(ALL_PROVINCES);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // A signed-in member starts in their own province (owner 2026-11-01); once they pick another, theirs stays picked
  const [pickedByHand, setPickedByHand] = useState(false);
  const ownProvince = member?.province;
  useEffect(() => {
    if (!pickedByHand) setProvince(ownProvince ?? ALL_PROVINCES);
  }, [ownProvince, pickedByHand]);

  const input = () => document.getElementById('site-top-q');

  // "/" jumps to the search box, as on most sites
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== '/' || /INPUT|SELECT|TEXTAREA/.test(target?.tagName ?? '') || target?.isContentEditable) return;
      const box = input();
      if (!box || box.offsetParent === null) return;
      e.preventDefault();
      box.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // The dropdown closes on a click outside or Escape (focus goes back to the box)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      if (boxRef.current?.contains(document.activeElement)) input()?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const done = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <div
      ref={boxRef}
      className="relative w-full"
      // The province picker is part of the box but needs no dropdown
      onFocus={(e) => (e.target as HTMLElement).tagName !== 'SELECT' && setOpen(true)}
      // Focus leaving the box and its dropdown (Tab past the last result) closes it
      onBlur={(e) => !boxRef.current?.contains(e.relatedTarget as Node | null) && setOpen(false)}
    >
      <DiscoverSearch
        idPrefix="site-top"
        kind="meetups"
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        province={province}
        onProvinceChange={(value) => {
          setPickedByHand(true);
          setProvince(value);
        }}
        placeholder="ค้นหากิจกรรม คน #แท็ก"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown') return;
          e.preventDefault();
          setOpen(true);
          moveThroughResults(panelRef.current, 1);
        }}
        onSubmit={() => {
          if (!query.trim()) return;
          addRecent(query);
          setOpen(false);
          router.push(searchHref(query));
        }}
      />
      {open && (
        <div
          ref={panelRef}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            moveThroughResults(panelRef.current, e.key === 'ArrowDown' ? 1 : -1, input());
          }}
          className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[min(75vh,640px)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          {/* Asked again on sign-in or out: people are for members */}
          <SearchResults key={String(isLoggedIn)} query={query} province={province} onNavigate={done} enabled={open} />
        </div>
      )}
    </div>
  );
}
