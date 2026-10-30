'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Loader2, Search } from 'lucide-react';
import { MODULE_PERMISSIONS, SIDEBAR_GROUPS, type AdminModuleFilters, type AdminModuleId, type AdminNavigate } from './AdminSidebar';
import { PillarBadge, type AdminPillar } from './AdminUI';
import { useAdminSession } from './AdminAuthGate';

interface PaletteResult {
  key: string;
  group: string;
  title: string;
  meta?: string;
  icon?: React.ElementType;
  pillar?: AdminPillar;
  module: AdminModuleId;
  filters?: AdminModuleFilters;
}

const MIN_CONTENT_QUERY = 2;
const RESULTS_PER_SOURCE = 5;

async function fetchItems<T>(url: string, key: string, signal: AbortSignal): Promise<T[]> {
  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.success && Array.isArray(data[key]) ? data[key] : [];
}

// One query, every content type the role may see; a source that fails simply shows nothing
async function searchContent(q: string, canMembers: boolean, signal: AbortSignal): Promise<PaletteResult[]> {
  const query = encodeURIComponent(q);
  type EventHit = { id: string; title: string; province?: string };
  const [meetups, fairs, spots, quests, members] = await Promise.all([
    fetchItems<EventHit>(`/api/admin/events?type=community&page=1&limit=${RESULTS_PER_SOURCE}&q=${query}`, 'events', signal),
    fetchItems<EventHit>(`/api/admin/events?type=public_venue&page=1&limit=${RESULTS_PER_SOURCE}&q=${query}`, 'events', signal),
    fetchItems<{ id: string; title: string; province: string; publicationStatus?: string }>(`/api/admin/spots?page=1&limit=${RESULTS_PER_SOURCE}&q=${query}`, 'spots', signal),
    fetchItems<{ id: string; title: string }>(`/api/admin/quests?limit=${RESULTS_PER_SOURCE}&q=${query}`, 'quests', signal),
    canMembers ? fetchItems<{ id: string; displayName: string; email: string; status: string }>(`/api/admin/members?limit=${RESULTS_PER_SOURCE}&q=${query}`, 'members', signal) : Promise.resolve([]),
  ]);

  const eventResults = (events: EventHit[], module: 'community' | 'fairs', group: string) =>
    events.map<PaletteResult>((event) => ({ key: `event-${event.id}`, group, title: event.title, meta: event.province, pillar: module, module, filters: { q: event.title } }));

  return [
    ...eventResults(meetups, 'community', 'ตี้'),
    ...eventResults(fairs, 'fairs', 'อีเวนต์'),
    ...spots.map<PaletteResult>((spot) => ({
      key: `spot-${spot.id}`,
      group: 'พิกัดเที่ยว',
      title: spot.title,
      meta: [spot.province, spot.publicationStatus === 'draft' ? 'ร่าง' : ''].filter(Boolean).join(' · '),
      pillar: 'spots',
      module: 'spots',
      filters: { q: spot.title },
    })),
    ...quests.map<PaletteResult>((quest) => ({ key: `quest-${quest.id}`, group: 'ชาเลนจ์', title: quest.title, pillar: 'quests', module: 'quests', filters: { q: quest.title } })),
    ...members.map<PaletteResult>((member) => ({
      key: `member-${member.id}`,
      group: 'สมาชิก',
      title: member.displayName || member.email,
      meta: member.displayName ? member.email : undefined,
      module: 'members',
      filters: { q: member.email || member.displayName },
    })),
  ];
}

/**
 * Global admin search (Ctrl/⌘ + K): jump to any page, or find a meetup, event, place, challenge or member
 * and open its list already filtered to it.
 */
export function AdminCommandPalette({ onClose, onNavigate }: { onClose: () => void; onNavigate: AdminNavigate }) {
  const { can } = useAdminSession();
  const canMembers = can('members.manage');
  const [query, setQuery] = useState('');
  const [contentResults, setContentResults] = useState<PaletteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const trimmed = query.trim();

  const moduleResults = useMemo<PaletteResult[]>(() => {
    const needle = trimmed.toLowerCase();
    return SIDEBAR_GROUPS.flatMap((group) =>
      group.modules
        .filter((mod) => can(MODULE_PERMISSIONS[mod.id]) && (!needle || mod.label.toLowerCase().includes(needle)))
        .map((mod) => ({ key: `module-${mod.id}`, group: 'ไปที่หน้า', title: mod.label, meta: group.groupLabel ?? undefined, icon: mod.icon, module: mod.id }))
    );
  }, [trimmed, can]);

  useEffect(() => {
    if (trimmed.length < MIN_CONTENT_QUERY) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchContent(trimmed, canMembers, controller.signal)
        .then(setContentResults)
        .catch(() => { if (!controller.signal.aborted) setContentResults([]); })
        .finally(() => { if (!controller.signal.aborted) setIsSearching(false); });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, canMembers]);

  const results = useMemo(
    () => (trimmed.length < MIN_CONTENT_QUERY ? moduleResults : [...moduleResults.slice(0, 4), ...contentResults]),
    [trimmed, moduleResults, contentResults]
  );
  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${safeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [safeIndex]);

  const choose = (result: PaletteResult | undefined) => {
    if (!result) return;
    onNavigate(result.module, result.filters);
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((safeIndex + 1) % Math.max(results.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((safeIndex - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[safeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const showNoResults = trimmed.length >= MIN_CONTENT_QUERY && !isSearching && results.length === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[10vh]" role="dialog" aria-modal="true" aria-label="ค้นหาในระบบผู้ดูแล">
      <button type="button" aria-label="ปิด" onClick={onClose} className="absolute inset-0 bg-slate-950/40" />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              if (event.target.value.trim().length < MIN_CONTENT_QUERY) setContentResults([]);
            }}
            placeholder="ค้นหาหน้า ตี้ อีเวนต์ สถานที่ ชาเลนจ์ หรือสมาชิก"
            aria-label="คำค้น"
            aria-controls="admin-palette-results"
            aria-activedescendant={results[safeIndex] ? `admin-palette-${results[safeIndex].key}` : undefined}
            className="h-12 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {isSearching && <Loader2 size={15} className="shrink-0 animate-spin text-slate-400" />}
          <kbd className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:block">Esc</kbd>
        </div>

        <ul id="admin-palette-results" ref={listRef} role="listbox" className="max-h-[60vh] overflow-y-auto py-2 [scrollbar-width:thin]">
          {results.map((result, index) => {
            const Icon = result.icon;
            const isActive = index === safeIndex;
            const startsGroup = index === 0 || results[index - 1].group !== result.group;
            return (
              <React.Fragment key={result.key}>
                {startsGroup && <li role="presentation" className="px-4 pb-1 pt-2 text-[11px] font-semibold text-slate-400">{result.group}</li>}
                <li
                  id={`admin-palette-${result.key}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={index}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => choose(result)}
                  className={`mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${isActive ? 'bg-slate-100' : ''}`}
                >
                  {Icon ? <Icon size={15} className="shrink-0 text-slate-500" /> : result.pillar ? <PillarBadge pillar={result.pillar} /> : null}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{result.title}</span>
                  {result.meta && <span className="max-w-[40%] shrink-0 truncate text-[11px] text-slate-500">{result.meta}</span>}
                  {isActive && <CornerDownLeft size={13} className="shrink-0 text-slate-400" />}
                </li>
              </React.Fragment>
            );
          })}
          {showNoResults && <li className="px-4 py-6 text-center text-sm text-slate-500">ไม่พบผลลัพธ์สำหรับ &quot;{trimmed}&quot;</li>}
        </ul>

        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
          <span><kbd className="font-semibold">↑ ↓</kbd> เลือก</span>
          <span><kbd className="font-semibold">Enter</kbd> เปิด</span>
          <span className="hidden sm:inline">พิมพ์อย่างน้อย {MIN_CONTENT_QUERY} ตัวอักษรเพื่อค้นหาเนื้อหา</span>
        </div>
      </div>
    </div>
  );
}
