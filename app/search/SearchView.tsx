'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Play } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { Toast } from '@/components/Toast';
import ImgOr from '@/components/ImgOr';
import { SearchField } from '@/components/discover/SearchField';
import { HitRow, KIND_LABEL, PersonRow, SearchResults, TagRow, useFollowToggle, type HitKind } from '@/components/discover/SearchResults';
import { addRecent, searchHref } from '@/components/discover/searchClient';
import { momentImageSrc, momentTitle } from '@/components/moments/momentTargets';
import { ALL_PROVINCES, discoverHref } from '@/lib/discoverMatch';
import { useAuth } from '@/lib/useAuth';
import type { SearchKind, SearchResult } from '@/lib/search/siteSearch';

/**
 * /search (BE-441): every kind found for a word, a tab per kind with its count (TikTok's results page). "ทั้งหมด"
 * shows six of each, best-matching kind first, with "ดูทั้งหมด"; a tab shows up to 30, and for places, ตี้ and
 * อีเวนต์ a link to the ค้นพบ page with its filters. Typing a new word shows live results under the box until Enter,
 * as the top bar's dropdown does.
 */
const TAB_ORDER: SearchKind[] = ['people', 'spots', 'meetups', 'fairs', 'challenges', 'moments', 'tags'];
/** The ค้นพบ page of a kind, for "more with filters" */
const DISCOVER_KIND = { spots: 'spots', meetups: 'meetups', fairs: 'fairs' } as const;
const isHitKind = (kind: SearchKind): kind is HitKind => kind === 'spots' || kind === 'meetups' || kind === 'fairs' || kind === 'challenges';

export default function SearchView({ q, tab, result }: { q: string; tab: SearchKind | 'all'; result: SearchResult | null }) {
  const router = useRouter();
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  // No bottom-bar tab is /search, so none lights up
  const [activeNavTab, setActiveNavTab] = useState('search');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState(q);
  const { shown, toggle, busyId, error } = useFollowToggle();

  const submit = () => {
    if (!query.trim()) return;
    addRecent(query);
    router.push(searchHref(query));
  };
  const field = (id: string, className: string) => <SearchField id={id} value={query} onChange={setQuery} onSubmit={submit} className={className} />;
  // A new word typed but not sent yet: live results instead of the page's
  const typing = query.trim() !== q;
  const tabHref = (kind: SearchKind | 'all') => `/search?q=${encodeURIComponent(q)}${kind === 'all' ? '' : `&tab=${kind}`}`;
  const count = (kind: SearchKind) => result?.counts[kind] ?? 0;
  const tabs = result ? TAB_ORDER.filter((kind) => count(kind) > 0 || kind === tab) : [];
  const nothing = result && TAB_ORDER.every((kind) => count(kind) === 0);
  const pick = () => addRecent(q);
  const people = (result?.people ?? []).map(shown);
  const moments = result?.moments ?? [];

  // "ทั้งหมด": the server's order (best match first), with the moment photos after the first two kinds
  const kindsShown: SearchKind[] =
    tab !== 'all' ? [tab] : result ? (moments.length ? [...result.order.slice(0, 2), 'moments', ...result.order.slice(2)] : result.order) : [];

  const sectionHead = (kind: SearchKind, shownCount: number) => (
    <div className="flex items-baseline justify-between gap-3 px-4 sm:px-0 pt-6 pb-2">
      <h2 className="text-base sm:text-lg font-bold text-slate-900">
        {KIND_LABEL[kind]} <span className="text-slate-500 font-medium tabular-nums">{count(kind).toLocaleString()}</span>
      </h2>
      {tab === 'all' && count(kind) > shownCount && (
        <Link href={tabHref(kind)} scroll={false} className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
          ดูทั้งหมด
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );

  const renderKind = (kind: SearchKind) => {
    if (!result) return null;
    if (kind === 'people') {
      return people.length > 0 ? (
        <section key={kind} aria-label="คน">
          {sectionHead('people', people.length)}
          <div className="sm:-mx-4">
            {people.map((p) => <PersonRow key={p.id} person={p} onPick={pick} onToggle={toggle} busy={busyId === p.id} />)}
          </div>
          {error && <p role="alert" className="px-4 sm:px-0 pt-1 text-xs font-semibold text-red-700">{error}</p>}
        </section>
      ) : null;
    }
    if (kind === 'tags') {
      return result.tags.length > 0 ? (
        <section key={kind} aria-label="แท็ก">
          {sectionHead('tags', result.tags.length)}
          <div className="sm:-mx-4">
            {result.tags.map((t) => <TagRow key={t.tag} tag={t.tag} posts={t.posts} onPick={pick} />)}
          </div>
        </section>
      ) : null;
    }
    if (kind === 'moments') {
      return moments.length > 0 ? (
        <section key={kind} aria-label="โมเมนต์">
          {sectionHead('moments', moments.length)}
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 px-4 sm:px-0">
            {moments.map((m) => (
              <li key={m.id}>
                <Link href={`/moments/${encodeURIComponent(m.id)}`} onClick={pick} className="group block rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]">
                  <span className="relative block aspect-[3/4] rounded-xl overflow-hidden bg-slate-100">
                    {m.images[0] && <ImgOr src={momentImageSrc(m.images[0], 384)} fallback={null} className="w-full h-full object-cover group-hover:brightness-95 transition-[filter]" />}
                    {m.video && (
                      <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 flex items-center justify-center text-white" aria-label="คลิป">
                        <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{momentTitle(m.caption) || m.targetTitle || m.location}</span>
                  <span className="block text-xs text-slate-500 truncate">{m.userName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null;
    }
    if (!isHitKind(kind)) return null;
    const hits = result[kind];
    return hits.length > 0 ? (
      <section key={kind} aria-label={KIND_LABEL[kind]}>
        {sectionHead(kind, hits.length)}
        <div className="sm:-mx-4">
          {hits.map((hit) => <HitRow key={hit.href} hit={hit} kind={kind} onPick={pick} />)}
        </div>
        {tab === kind && kind !== 'challenges' && count(kind) > hits.length && (
          <Link href={discoverHref(DISCOVER_KIND[kind], q, ALL_PROVINCES)} className="mx-4 sm:mx-0 mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline">
            ดูทั้งหมดในหน้า{KIND_LABEL[kind]} พร้อมตัวกรอง
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        )}
      </section>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        searchSlot={field('search-top', 'w-full')}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto sm:px-6 pt-4 sm:pt-6 pb-28 xl:pb-12">
        <div className="px-4 sm:px-0 md:hidden mb-3">{field('search-phone', 'w-full')}</div>
        <h1 className="px-4 sm:px-0 text-xl sm:text-2xl font-bold text-slate-900">{q ? <>ผลการค้นหา “{q}”</> : 'ค้นหา'}</h1>

        {typing || !result ? (
          <div className="mt-2 sm:-mx-4">
            <SearchResults key={String(isLoggedIn)} query={query} onNavigate={() => undefined} />
          </div>
        ) : (
          <>
            {tabs.length > 0 && (
              <nav aria-label="ประเภทผลการค้นหา" className="sticky z-30 top-[calc(4rem+env(safe-area-inset-top))] sm:top-[calc(4.25rem+env(safe-area-inset-top))] mt-3 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                <ul className="flex gap-1 overflow-x-auto no-scrollbar px-4 sm:px-0">
                  {(['all', ...tabs] as (SearchKind | 'all')[]).map((kind) => {
                    const here = kind === tab;
                    return (
                      <li key={kind} className="shrink-0">
                        <Link
                          href={tabHref(kind)}
                          scroll={false}
                          aria-current={here ? 'page' : undefined}
                          className={`relative inline-flex items-center gap-1 h-11 px-3 text-sm whitespace-nowrap ${here ? 'font-bold text-slate-900' : 'font-medium text-slate-600 hover:text-slate-900'}`}
                        >
                          {kind === 'all' ? 'ทั้งหมด' : KIND_LABEL[kind]}
                          {kind !== 'all' && <span className="text-xs text-slate-500 tabular-nums">{count(kind) > 99 ? '99+' : count(kind)}</span>}
                          {here && <span className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-slate-900" aria-hidden="true" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}

            {nothing && (
              <div className="px-4 sm:px-0 py-10 text-center">
                <p className="text-base font-semibold text-slate-900">ไม่พบผลสำหรับ “{q}”</p>
                <p className="mt-1 text-sm text-slate-600">ลองคำที่สั้นลง สะกดอีกแบบ หรือค้นเป็นภาษาอังกฤษ</p>
              </div>
            )}

            {tab === 'all' && result.people === null && !q.startsWith('#') && (
              <p className="px-4 sm:px-0 pt-5 text-sm text-slate-600">
                <button type="button" onClick={() => setIsAuthModalOpen(true)} className="font-semibold text-[#2563EB] hover:underline cursor-pointer">เข้าสู่ระบบ</button> เพื่อค้นหาเพื่อนจากชื่อ
              </p>
            )}
            {kindsShown.map(renderKind)}
          </>
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(name) => {
          handleSetIsLoggedIn(true);
          setIsAuthModalOpen(false);
          setToast(`ยินดีต้อนรับ ${name}`);
          router.refresh();
        }}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
        }}
      />
      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} />
      <Toast message={toast} />
    </div>
  );
}
