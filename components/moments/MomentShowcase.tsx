'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Camera, Heart, Loader2, MessageCircle, Play, X } from 'lucide-react';
import type { FeedItem } from '@/lib/moments/service';
import { nameInitial } from '@/lib/displayName';
import { ClipPlayer } from '@/components/moments/ClipPlayer';
import { MomentsChrome } from '@/components/moments/MomentsChrome';
import { call } from '@/components/home/HomeMomentFeed';
import { MOMENT_TARGETS, isMomentTarget, momentImageSrc, momentTargetHref, momentTitle, type MomentTargetKey } from '@/components/moments/momentTargets';
import { saveShowcase, takeShowcase } from '@/components/moments/momentsReturn';

const PAGE_SIZE = 24;
/** The moments pillar colour (rose) */
const ROSE = '#F43F5E';

type Chip = 'all' | MomentTargetKey;
/** Text tabs like the ค้นพบ pages: a dot in each pillar colour, and a hand-drawn highlighter under the current one */
const TABS: { chip: Chip; label: string; dot: string; marker: string }[] = [
  { chip: 'all', label: 'ทั้งหมด', dot: 'bg-[#F43F5E]', marker: 'bg-[#F43F5E]/25' },
  { chip: 'spot', label: MOMENT_TARGETS.spot.label, dot: 'bg-[#4A7C59]', marker: 'bg-[#4A7C59]/25' },
  { chip: 'community', label: MOMENT_TARGETS.community.label, dot: 'bg-[#F26430]', marker: 'bg-[#F26430]/30' },
  { chip: 'fair', label: MOMENT_TARGETS.fair.label, dot: 'bg-[#2B527A]', marker: 'bg-[#2B527A]/20' },
  { chip: 'challenge', label: MOMENT_TARGETS.challenge.label, dot: 'bg-[#7C3AED]', marker: 'bg-[#7C3AED]/20' },
];

/** Moments of one place or event (links from its page); the tabs are hidden while it is set */
export interface ShowcasePlace {
  targetType?: string;
  targetId?: string;
  location?: string;
}

interface MomentShowcaseProps {
  initialMoments: FeedItem[];
  initialHasMore: boolean;
  initialChip: Chip;
  place: ShowcasePlace | null;
  /** How many moments each tab holds (counted on the server); left out on one place's moments */
  counts?: Record<Chip, number>;
}

/** The server HTML is the same for everyone, so a signed-in member's own hearts are read once in the browser */
function WhenSignedIn({ isLoggedIn, run }: { isLoggedIn: boolean; run: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    if (!isLoggedIn || done.current) return;
    done.current = true;
    run();
  }, [isLoggedIn, run]);
  return null;
}

/** One frame for every photo so the rows line up: 3:4 on phones and iPads (like Lemon8), square on computers (like the Home post) */
const frameClass = 'relative block aspect-[3/4] lg:aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-slate-100';
const focusRing = 'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2';
/** A label on a photo the way the landing page labels its collage */
const STICKER = 'absolute z-10 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs lg:text-sm font-semibold text-slate-900 shadow-md';

function Avatar({ name, src }: { name: string; src?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
    <img src={src} alt="" className="w-6 h-6 lg:w-9 lg:h-9 rounded-full object-cover bg-slate-100 shrink-0" />
  ) : (
    <span className="w-6 h-6 lg:w-9 lg:h-9 rounded-full bg-slate-200 text-[10px] lg:text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">{nameInitial(name)}</span>
  );
}

/** A moment the way the Home feed shows a post, in a smaller size: who, the photo, the words, where it was, and the reactions */
function MomentCard({ moment, index, onLike }: { moment: FeedItem; index: number; onLike?: (moment: FeedItem) => void }) {
  const title = momentTitle(moment.caption);
  const target = isMomentTarget(moment.targetType) ? MOMENT_TARGETS[moment.targetType] : null;
  const targetHref = momentTargetHref(moment.targetType, moment.targetId);
  const place = moment.targetTitle || moment.location;
  const href = `/moments/${encodeURIComponent(moment.id)}${moment.video ? '?full=1' : ''}`;
  // Photos lean a little left or right when pointed at, like prints picked up from a table
  const tilt = index % 2 ? 'group-hover:rotate-1' : 'group-hover:-rotate-1';
  return (
    <article className="min-w-0 flex flex-col">
      <div className="flex items-center gap-2 lg:gap-2.5 min-w-0 mb-2 lg:mb-3">
        <Avatar name={moment.userName} src={moment.userAvatar} />
        <div className="min-w-0">
          <p className="text-xs lg:text-sm font-bold text-slate-900 truncate">{moment.userName}</p>
          <p className="hidden lg:block text-xs font-medium text-slate-500 truncate">
            {moment.timeAgo}
            {place && ` · ${place}`}
          </p>
        </div>
      </div>

      <Link href={href} className={`group block rounded-xl lg:rounded-2xl ${focusRing}`}>
        <span className="relative block">
          <span className={`${frameClass} transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg ${tilt}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote and local photos */}
            <img src={momentImageSrc(moment.images[0], 828)} alt={title || `โมเมนต์จาก ${place}`} loading="lazy" className="w-full h-full object-cover" />
            {moment.video && <ClipPlayer url={moment.video.url} fit="cover" interactive={false} className="absolute inset-0" />}
            {moment.video && (
              <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white">
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span className="sr-only">คลิปวิดีโอ</span>
              </span>
            )}
            {moment.images.length > 1 && (
              <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                1/{moment.images.length}
                <span className="sr-only"> รูป</span>
              </span>
            )}
          </span>
        </span>
        {title && <span className="mt-2 lg:mt-3 px-0.5 text-[13px] lg:text-sm font-medium text-slate-800 leading-relaxed line-clamp-2 group-hover:text-slate-950">{title}</span>}
      </Link>

      {/* Where it was: straight to that place, meetup, fair or challenge */}
      {target && targetHref ? (
        <Link href={targetHref} className={`mt-2 lg:mt-3 flex items-center gap-2 lg:gap-2.5 rounded-xl lg:rounded-2xl ${target.box} p-1.5 lg:pl-2 lg:pr-3 lg:py-2 hover:opacity-90 min-w-0 ${focusRing}`}>
          <span className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-white ${target.icon} flex items-center justify-center shrink-0 ${index % 2 ? 'rotate-6' : '-rotate-6'}`} aria-hidden="true">
            <target.Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="hidden lg:block text-[11px] font-medium opacity-80">{target.label}</span>
            <span className="block text-[11px] lg:text-[13px] font-semibold truncate">{place}</span>
          </span>
          <span className="hidden lg:inline text-xs font-semibold whitespace-nowrap">{target.go} →</span>
        </Link>
      ) : (
        place && (
          <p className="mt-2 px-0.5 flex items-center gap-1 text-[11px] lg:text-xs font-medium text-slate-500 min-w-0">
            <MOMENT_TARGETS.spot.Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{place}</span>
          </p>
        )
      )}

      <div className="mt-2 px-0.5 flex items-center gap-3 lg:gap-4 text-xs lg:text-sm font-medium text-slate-600 tabular-nums">
        {onLike ? (
          // Liked straight from the grid; the padding gives a finger-sized target without moving the row
          <button
            type="button"
            onClick={() => onLike(moment)}
            aria-pressed={moment.isLiked}
            aria-label={`${moment.isLiked ? 'เลิกถูกใจ' : 'ถูกใจ'} (${moment.likesCount.toLocaleString()})`}
            className={`-m-2 p-2 inline-flex items-center gap-1 rounded-full cursor-pointer active:scale-90 transition-transform ${moment.isLiked ? 'text-rose-600' : 'hover:text-rose-600'} ${focusRing}`}
          >
            <Heart className={`w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 ${moment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
            {moment.likesCount.toLocaleString()}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Heart className={`w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 ${moment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
            {moment.likesCount.toLocaleString()}
            <span className="sr-only">ถูกใจ</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5" aria-hidden="true" />
          {moment.commentsCount.toLocaleString()}
          <span className="sr-only">ความคิดเห็น</span>
        </span>
      </div>
    </article>
  );
}

/** Rows that line up: two across on phones and iPads, three on computers */
export function MomentGrid({ items, onLike }: { items: FeedItem[]; onLike?: (moment: FeedItem) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-7 sm:gap-x-4 lg:gap-x-8 lg:gap-y-12">
      {items.map((moment, index) => (
        <MomentCard key={moment.id} moment={moment} index={index} onLike={onLike} />
      ))}
    </div>
  );
}

/**
 * Fixed photos for the header collage (owner 2026-10-23): the header is decoration,
 * so it must not change with whatever members posted last.
 */
const COLLAGE = {
  a: { image: '/images/onboarding/friends-start.jpg', likesCount: 128 },
  b: { image: '/images/onboarding/challenge-cheer.jpg' },
  c: { image: '/images/onboarding/fair-festival.jpg' },
};

/** Three photos as tilted prints with stickers, like the collage on the landing page */
function Collage() {
  const { a, b, c } = COLLAGE;
  const print = 'w-full h-full object-cover shadow-lg border-4 border-white';
  return (
    <div className="relative h-[120px] sm:h-[200px] md:h-[240px] lg:h-[270px] w-full max-w-[240px] sm:max-w-[320px] md:max-w-[440px] mx-auto" aria-hidden="true">
      <figure className="absolute left-[2%] top-[8%] w-[44%] h-[78%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote and local photos */}
        <img src={momentImageSrc(a.image)} alt="" className={`${print} -rotate-6 rounded-[1.5rem] lg:rounded-[1.75rem]`} />
        <span className={`${STICKER} -bottom-3 left-1/2 -translate-x-1/2 -rotate-3`}>
          <Heart className="w-3.5 h-3.5 fill-[#F43F5E] text-[#F43F5E]" />
          {a.likesCount.toLocaleString()}
        </span>
      </figure>
      <figure className="absolute right-[6%] top-0 w-[34%] aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote and local photos */}
        <img src={momentImageSrc(b.image)} alt="" className={`${print} rounded-full`} />
        <span className={`${STICKER} top-[8%] -left-[38%] rotate-3`}>ไปมาแล้ว!</span>
      </figure>
      <figure className="absolute right-0 bottom-[2%] w-[42%] h-[46%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote and local photos */}
        <img src={momentImageSrc(c.image)} alt="" className={`${print} rotate-3 rounded-[1.5rem] lg:rounded-[1.75rem]`} />
        <span className={`${STICKER} -bottom-3 right-3 rotate-2`}>
          <Camera className="w-3.5 h-3.5 text-[#F43F5E]" />
          ภาพจริง
        </span>
      </figure>
    </div>
  );
}

const tabHref = (chip: Chip) => (chip === 'all' ? '/moments' : `/moments?type=${chip}`);

const listUrl = (chip: Chip, place: ShowcasePlace | null, page: number) => {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
  if (place?.targetType && place.targetId) {
    params.set('targetType', place.targetType);
    params.set('targetId', place.targetId);
  } else if (place?.location) {
    params.set('location', place.location);
  } else if (chip !== 'all') {
    params.set('targetType', chip);
  }
  return `/api/moments?${params}`;
};

/**
 * /moments: a playful header (the landing page's cream band, tilted prints and stickers) over a full-width grid
 * of moment posts. Posting happens on Home; a card opens the moment's own page.
 */
export function MomentShowcase({ initialMoments, initialHasMore, initialChip, place, counts }: MomentShowcaseProps) {
  const [chip, setChip] = useState<Chip>(initialChip);
  const [moments, setMoments] = useState(initialMoments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (nextChip: Chip, nextPage: number) => {
      const request = ++requestRef.current;
      setIsLoading(true);
      try {
        const json = await fetch(listUrl(nextChip, place, nextPage), { cache: 'no-store' }).then((res) => res.json());
        if (request !== requestRef.current) return;
        const list: FeedItem[] = (json.moments ?? []).filter((m: FeedItem) => m.images?.[0]);
        setMoments((prev) => (nextPage === 1 ? list : [...prev, ...list.filter((m) => !prev.some((p) => p.id === m.id))]));
        setPage(nextPage);
        setHasMore(Boolean(json.pagination?.hasNextPage));
      } catch {
        if (request === requestRef.current) setHasMore(false);
      } finally {
        if (request === requestRef.current) setIsLoading(false);
      }
    },
    [place]
  );

  /** The tab shown, read by the URL sync below without re-running it on every tab click */
  const chipRef = useRef(chip);
  // Each tab is its own history entry, so the browser's Back steps through the tabs the reader looked at
  const pickChip = (next: Chip) => {
    if (next === chip) return;
    setChip(next);
    chipRef.current = next;
    window.history.pushState(null, '', tabHref(next));
    void load(next, 1);
  };
  const searchParams = useSearchParams();
  const urlChip: Chip = isMomentTarget(searchParams.get('type') ?? undefined) ? (searchParams.get('type') as MomentTargetKey) : 'all';
  useEffect(() => {
    if (place || urlChip === chipRef.current) return;
    setChip(urlChip);
    chipRef.current = urlChip;
    void load(urlChip, 1);
  }, [place, urlChip, load]);

  // Back from a moment: the tab, the cards loaded so far and the scroll position come back as they were.
  // A layout effect, so it runs before the signed-in reload below and the reader never sees the top of the page.
  const restoredRef = useRef(false);
  useLayoutEffect(() => {
    const snapshot = takeShowcase(window.location.pathname + window.location.search);
    if (!snapshot) return;
    restoredRef.current = true;
    chipRef.current = urlChip;
    setChip(urlChip);
    setMoments(snapshot.moments);
    setPage(snapshot.page);
    setHasMore(snapshot.hasMore);
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, snapshot.scrollY)));
    // once, on arriving at the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Remembers where the reader is when a card opens its moment */
  const rememberPlace = (e: React.MouseEvent) => {
    const href = (e.target as HTMLElement).closest('a')?.getAttribute('href');
    const momentId = href?.startsWith('/moments/') ? decodeURIComponent(href.slice('/moments/'.length)) : null;
    if (!momentId) return;
    saveShowcase({ url: window.location.pathname + window.location.search, momentId, moments, page, hasMore, scrollY: window.scrollY });
  };

  // More cards as the reader nears the end
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void load(chip, page + 1), { rootMargin: '600px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [chip, hasMore, isLoading, load, page]);

  // After signing in, the member's own hearts are filled into the cards already on screen, so the grid stays where
  // the reader is; a restored grid already carries them
  const refreshHearts = useCallback(() => {
    if (restoredRef.current) return;
    const pages = Array.from({ length: page }, (_, i) => i + 1);
    void Promise.all(pages.map((p) => fetch(listUrl(chip, place, p), { cache: 'no-store' }).then((res) => res.json()).catch(() => null))).then((results) => {
      const fresh = new Map(results.flatMap((json) => (json?.moments ?? []) as FeedItem[]).map((m) => [m.id, m]));
      setMoments((prev) =>
        prev.map((m) => {
          const f = fresh.get(m.id);
          return f ? { ...m, isLiked: f.isLiked, isSaved: f.isSaved, likesCount: f.likesCount, commentsCount: f.commentsCount } : m;
        })
      );
    });
  }, [chip, place, page]);

  // Optimistic heart, put back with a message if the server says no (same as the moment's own page)
  const toggleLike = (moment: FeedItem, showToast: (message: string) => void) => {
    const action = moment.isLiked ? 'unlike' : 'like';
    const flip = (liked: boolean) =>
      setMoments((prev) => prev.map((m) => (m.id === moment.id ? { ...m, isLiked: liked, likesCount: m.likesCount + (liked ? 1 : -1) } : m)));
    flip(action === 'like');
    call(`/api/moments/${encodeURIComponent(moment.id)}/actions`, 'POST', { action }).then((result) => {
      if (!result.ok) {
        flip(action !== 'like');
        showToast(result.message);
      }
    });
  };

  const placeName = place?.location;

  return (
    <MomentsChrome>
      {({ isLoggedIn, requireLogin, showToast }) => (
        <main className="flex-1 pb-28 xl:pb-16">
          <WhenSignedIn isLoggedIn={isLoggedIn} run={refreshHearts} />
          {/* Header band: the landing page's cream with soft circles, tilted prints on one side and the words on the other */}
          <section className="relative overflow-hidden bg-[#FFF8F1]">
            <div className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[#FFE4E8]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-40 -right-28 w-80 h-80 rounded-full bg-[#E3EDFF]" aria-hidden="true" />
            <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-5 sm:pt-5 sm:pb-8 md:py-10 grid md:grid-cols-[1.05fr_1fr] gap-4 sm:gap-6 md:gap-10 items-center">
              <div className="text-center md:text-left order-2 md:order-1">
                <h1 className="text-[24px] leading-[1.3] sm:text-[34px] lg:text-[42px] lg:leading-[1.22] font-bold text-slate-900 tracking-tight">
                  {placeName ? (
                    <>
                      โมเมนต์จาก
                      <br />
                      <span style={{ color: ROSE }}>{placeName}</span>
                    </>
                  ) : (
                    <>
                      ไปไหนมา?
                      <br />
                      ดู<span style={{ color: ROSE }}>โมเมนต์จริง</span>จากเพื่อนๆ
                    </>
                  )}
                </h1>
                <p className="mt-2 sm:mt-3 text-sm sm:text-lg font-semibold text-slate-700">
                  เห็นที่ไหนน่าไป <span className="whitespace-nowrap">แตะดูแล้วไปต่อได้เลย</span>
                </p>
                <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Link
                    href="/?share=new"
                    onClick={(e) => {
                      if (!isLoggedIn) {
                        e.preventDefault();
                        requireLogin('เพื่อแชร์โมเมนต์ของคุณ');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-7 rounded-full bg-[#F43F5E] hover:bg-[#E11D48] text-white text-base font-semibold shadow-[0_8px_20px_rgba(244,63,94,0.28)] whitespace-nowrap transition-colors"
                  >
                    <Camera className="w-5 h-5" aria-hidden="true" />
                    แชร์โมเมนต์ของคุณ
                  </Link>
                  {placeName && (
                    <Link href="/moments" className="inline-flex items-center gap-1.5 h-12 px-5 rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm hover:text-slate-900">
                      <X className="w-4 h-4" aria-hidden="true" />
                      ดูทั้งหมด
                    </Link>
                  )}
                </div>
              </div>
              <div className="order-1 md:order-2">
                <Collage />
              </div>
            </div>
          </section>

          <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
            {!placeName && (
              <nav aria-label="ประเภทโมเมนต์" className="mt-3 sm:mt-7 flex gap-5 sm:gap-7 overflow-x-auto no-scrollbar -mx-3 px-4 sm:mx-0 sm:px-0">
                {TABS.map((tab) => {
                  const isHere = tab.chip === chip;
                  return (
                    // A real link, so search engines reach each tab and a new tab can be opened; a plain click switches in place
                    <a
                      key={tab.chip}
                      href={tabHref(tab.chip)}
                      aria-current={isHere ? 'page' : undefined}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                        e.preventDefault();
                        pickChip(tab.chip);
                      }}
                      className={`group relative isolate inline-flex items-center gap-1.5 h-10 text-[15px] sm:text-base whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        isHere ? 'font-bold text-slate-900' : 'font-medium text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {/* The current tab gets a highlighter stroke in its pillar colour, a little tilted like a hand-drawn mark */}
                      <span
                        className={`absolute -inset-x-1.5 bottom-2 h-3 -z-10 rounded-full -rotate-2 transition-transform origin-left ${tab.marker} ${isHere ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`}
                        aria-hidden="true"
                      />
                      <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} aria-hidden="true" />
                      <span>{tab.label}</span>
                      {counts && <span className="text-xs sm:text-[13px] font-medium text-slate-400 tabular-nums">{counts[tab.chip].toLocaleString()}</span>}
                    </a>
                  );
                })}
              </nav>
            )}

            <div className={`mt-4 sm:mt-7 transition-opacity duration-200 ${isLoading && page === 1 ? 'opacity-50' : ''}`} aria-busy={isLoading} onClickCapture={rememberPlace}>
              {moments.length === 0 && !isLoading ? (
                <p className="py-16 text-center text-sm font-medium text-slate-500">ยังไม่มีโมเมนต์ในหมวดนี้ ไปที่ไหนมาแล้ว มาแชร์เป็นคนแรกกัน</p>
              ) : (
                <MomentGrid items={moments} onLike={(moment) => (isLoggedIn ? toggleLike(moment, showToast) : requireLogin())} />
              )}
            </div>

            {hasMore && (
              <div ref={sentinelRef} className="py-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => void load(chip, page + 1)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 cursor-pointer disabled:cursor-wait"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {isLoading ? 'กำลังโหลด…' : 'ดูเพิ่ม'}
                </button>
              </div>
            )}
            {!hasMore && moments.length > PAGE_SIZE && <p className="py-8 text-center text-[13px] font-medium text-slate-400">ดูครบทุกโมเมนต์แล้ว</p>}
          </div>
        </main>
      )}
    </MomentsChrome>
  );
}
