'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Hash, Loader2, Search, X } from 'lucide-react';
import ImgOr from '@/components/ImgOr';
import { setFollowing } from '@/components/members/PeopleList';
import { MOMENT_TARGETS } from '@/components/moments/momentTargets';
import { addRecent, clearRecent, removeRecent, searchHref, useRecent, useSearch } from '@/components/discover/searchClient';
import { hashtagHref } from '@/lib/moments/hashtags';
import { avatarImage, optimizedImage } from '@/lib/optimizedImage';
import { nameInitial } from '@/lib/displayName';
import type { SearchHit, SearchPerson, SearchResult } from '@/lib/search/siteSearch';

/**
 * What the site's search shows (TR-012, BE-440/441): before typing, recent searches, people worth following, the
 * busiest challenges, this weekend and popular tags; while typing, every kind at once, three each, under a row that
 * opens all results (/search). The top bar shows it as a dropdown (SiteSearch), phones as a full screen (SearchSheet).
 * Every row a reader can open has `data-search-option`, so the arrow keys move through them (searchClient.ts).
 */

export type HitKind = 'spots' | 'meetups' | 'fairs' | 'challenges';
const HIT_LOOK: Record<HitKind, (typeof MOMENT_TARGETS)[keyof typeof MOMENT_TARGETS]> = {
  spots: MOMENT_TARGETS.spot,
  meetups: MOMENT_TARGETS.community,
  fairs: MOMENT_TARGETS.fair,
  challenges: MOMENT_TARGETS.challenge,
};
export const KIND_LABEL: Record<HitKind | 'people' | 'tags' | 'moments', string> = {
  people: 'คน',
  spots: 'ที่เที่ยว',
  meetups: 'ตี้',
  fairs: 'อีเวนต์',
  challenges: 'ชาเลนจ์',
  moments: 'โมเมนต์',
  tags: 'แท็ก',
};

const rowLook = 'flex items-center gap-3 px-4 py-2 min-h-14 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]';

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1">
      <h3 className="text-xs font-bold text-slate-500">{children}</h3>
      {action}
    </div>
  );
}

/** A place, ตี้, อีเวนต์ or challenge: its picture (or the pillar's icon), the title and one short line */
export function HitRow({ hit, kind, onPick }: { hit: SearchHit; kind: HitKind; onPick: () => void }) {
  const look = HIT_LOOK[kind];
  const icon = (
    <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${look.box}`}>
      <look.Icon className="w-5 h-5" aria-hidden="true" />
    </span>
  );
  return (
    <Link href={hit.href} onClick={onPick} data-search-option className={rowLook}>
      {hit.image ? <ImgOr src={optimizedImage(hit.image, 96)} fallback={icon} className="w-11 h-11 shrink-0 rounded-xl object-cover bg-slate-100" /> : icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900 truncate">{hit.title}</span>
        <span className="block text-xs text-slate-500 truncate">
          <span className={`font-semibold ${look.ink}`}>{KIND_LABEL[kind]}</span>
          {hit.subtitle ? ` · ${hit.subtitle}` : ''}
        </span>
      </span>
    </Link>
  );
}

/** A person with ติดตาม right there, as IG's search does; the name opens their profile */
export function PersonRow({ person, onPick, onToggle, busy }: { person: SearchPerson; onPick: () => void; onToggle: (person: SearchPerson) => void; busy: boolean }) {
  return (
    <div className="flex items-center gap-3 pr-4 hover:bg-slate-50">
      <Link href={`/profile?id=${encodeURIComponent(person.id)}`} onClick={onPick} data-search-option className={`${rowLook} flex-1 min-w-0 pr-0 hover:bg-transparent`}>
        {person.avatar ? (
          <ImgOr src={avatarImage(person.avatar)} fallback={<Initial name={person.name} />} className="w-11 h-11 shrink-0 rounded-full object-cover bg-slate-100" />
        ) : (
          <Initial name={person.name} />
        )}
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900 truncate">{person.name}</span>
          {person.followsMe && !person.isFollowing && <span className="block text-xs text-slate-500">ติดตามคุณ</span>}
          {person.isFollowing && <span className="block text-xs text-slate-500">กำลังติดตาม</span>}
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onToggle(person)}
        disabled={busy}
        aria-pressed={person.isFollowing}
        aria-label={`${person.isFollowing ? 'เลิกติดตาม' : 'ติดตาม'} ${person.name}`}
        className={`relative shrink-0 h-8 px-4 rounded-full text-[13px] font-bold inline-flex items-center justify-center after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] whitespace-nowrap cursor-pointer transition-colors disabled:cursor-default ${person.isFollowing ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : person.isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
      </button>
    </div>
  );
}

const Initial = ({ name }: { name: string }) => (
  <span aria-hidden="true" className="w-11 h-11 shrink-0 rounded-full bg-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center">{nameInitial(name)}</span>
);

export function TagRow({ tag, posts, onPick }: { tag: string; posts: number; onPick: () => void }) {
  return (
    <Link href={hashtagHref(tag)} onClick={onPick} data-search-option className={rowLook}>
      <span className="w-11 h-11 shrink-0 rounded-full bg-rose-50 flex items-center justify-center text-[#E11D48]">
        <Hash className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900 truncate">#{tag}</span>
        <span className="block text-xs text-slate-500">{posts.toLocaleString()} โพสต์</span>
      </span>
    </Link>
  );
}

/** Follow and unfollow from a list; the row changes at once, the list is not asked again */
export function useFollowToggle() {
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const shown = (person: SearchPerson): SearchPerson => (person.id in followed ? { ...person, isFollowing: followed[person.id] } : person);
  const toggle = async (person: SearchPerson) => {
    setBusyId(person.id);
    setError('');
    const problem = await setFollowing(person, !person.isFollowing);
    setBusyId(null);
    if (problem) setError(problem);
    else setFollowed((now) => ({ ...now, [person.id]: !person.isFollowing }));
  };
  return { shown, toggle, busyId, error };
}

export function SearchResults({ query, onNavigate, enabled = true, province, before }: {
  query: string;
  /** Called when the reader leaves for a result, so the dropdown or sheet closes */
  onNavigate: () => void;
  /** The dropdown passes false while closed */
  enabled?: boolean;
  province?: string;
  /** Shown above the start (the phone screen's ตี้ / อีเวนต์ / ที่เที่ยว tiles) */
  before?: React.ReactNode;
}) {
  const { answer, loading, word } = useSearch(query, { enabled, province });
  const { shown, toggle, busyId, error } = useFollowToggle();
  const recent = useRecent();

  // Opening a result from a typed word remembers the word, as IG's recent searches do
  const pick = () => {
    if (word) addRecent(word);
    onNavigate();
  };

  if (!word) {
    const start = answer?.kind === 'start' ? answer.start : null;
    return (
      <div className="pb-3">
        {recent.length > 0 && (
          <section aria-label="ค้นหาล่าสุด">
            <SectionTitle action={<button type="button" onClick={clearRecent} className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer">ล้างทั้งหมด</button>}>ค้นหาล่าสุด</SectionTitle>
            <ul>
              {recent.map((item) => (
                <li key={item} className="flex items-center hover:bg-slate-50">
                  <Link href={searchHref(item)} onClick={() => { addRecent(item); onNavigate(); }} data-search-option className={`${rowLook} flex-1 min-w-0 min-h-11 py-1.5 hover:bg-transparent`}>
                    <Clock className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="text-sm font-semibold text-slate-800 truncate">{item}</span>
                  </Link>
                  <button type="button" onClick={() => removeRecent(item)} aria-label={`ลบ ${item} ออกจากที่ค้นหาล่าสุด`} className="w-11 h-11 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {before}
        {start && start.people.length > 0 && (
          <section aria-label="คนน่าติดตาม">
            <SectionTitle>คนน่าติดตาม</SectionTitle>
            {start.people.map((p) => <PersonRow key={p.id} person={shown(p)} onPick={pick} onToggle={toggle} busy={busyId === p.id} />)}
          </section>
        )}
        {start && start.weekend.length > 0 && (
          <section aria-label="สุดสัปดาห์นี้">
            <SectionTitle>สุดสัปดาห์นี้</SectionTitle>
            {start.weekend.map((hit) => <HitRow key={hit.href} hit={hit} kind={hit.href.startsWith('/community') ? 'meetups' : 'fairs'} onPick={pick} />)}
          </section>
        )}
        {start && start.challenges.length > 0 && (
          <section aria-label="ชาเลนจ์กำลังฮิต">
            <SectionTitle>ชาเลนจ์กำลังฮิต</SectionTitle>
            {start.challenges.map((hit) => <HitRow key={hit.id} hit={hit} kind="challenges" onPick={pick} />)}
          </section>
        )}
        {start && start.tags.length > 0 && (
          <section aria-label="แท็กยอดนิยม">
            <SectionTitle>แท็กยอดนิยม</SectionTitle>
            {start.tags.map((t) => <TagRow key={t.tag} tag={t.tag} posts={t.posts} onPick={pick} />)}
          </section>
        )}
        {error && <p role="alert" className="px-4 pt-2 text-xs font-semibold text-red-700">{error}</p>}
        {!start && loading && <Waiting />}
      </div>
    );
  }

  const result = answer?.kind === 'found' ? answer.result : null;
  const tagOnly = word.startsWith('#');
  const people = (result?.people ?? []).map(shown);
  const nothing = result && result.order.length === 0;
  // Each kind that found something, in the server's order (best match first)
  const section = (kind: SearchResult['order'][number]) => {
    if (!result) return null;
    if (kind === 'people') {
      return people.length > 0 ? (
        <section key={kind} aria-label="คน">
          <SectionTitle>คน</SectionTitle>
          {people.map((p) => <PersonRow key={p.id} person={p} onPick={pick} onToggle={toggle} busy={busyId === p.id} />)}
          {error && <p role="alert" className="px-4 pb-1 text-xs font-semibold text-red-700">{error}</p>}
        </section>
      ) : null;
    }
    if (kind === 'tags') {
      return result.tags.length > 0 ? (
        <section key={kind} aria-label="แท็ก">
          <SectionTitle>แท็ก</SectionTitle>
          {result.tags.map((t) => <TagRow key={t.tag} tag={t.tag} posts={t.posts} onPick={pick} />)}
        </section>
      ) : null;
    }
    const list: SearchHit[] = result[kind];
    return list.length > 0 ? (
      <section key={kind} aria-label={KIND_LABEL[kind]}>
        <SectionTitle>{KIND_LABEL[kind]}</SectionTitle>
        {list.map((hit) => <HitRow key={hit.href} hit={hit} kind={kind} onPick={pick} />)}
      </section>
    ) : null;
  };

  return (
    <div className="pb-3" aria-live="polite" aria-busy={loading}>
      <Link href={searchHref(word)} onClick={pick} data-search-option className={`${rowLook} border-b border-slate-100`}>
        <span className="w-11 h-11 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Search className="w-5 h-5" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1 text-sm text-slate-700 truncate">
          {tagOnly ? 'ดูโมเมนต์ใน' : 'ดูผลทั้งหมดของ'} <span className="font-bold text-slate-900">“{word}”</span>
        </span>
        <ArrowUpRight className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
      </Link>

      {result?.order.map(section)}
      {/* A guest: names are for members (lib/members/safety.ts searchMembers) */}
      {result && result.people === null && !tagOnly && <p className="px-4 pt-3 text-xs text-slate-500">เข้าสู่ระบบเพื่อค้นหาเพื่อนจากชื่อ</p>}
      {nothing && <p className="px-4 pt-4 text-sm text-slate-500">ไม่พบ{tagOnly ? 'แท็ก' : ''}ที่ตรงกับ “{word}” ลองคำที่สั้นลง หรือคำอื่นที่ใกล้เคียง</p>}
      {!result && loading && <Waiting />}
    </div>
  );
}

const Waiting = () => (
  <p className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
    กำลังค้นหา…
  </p>
);
