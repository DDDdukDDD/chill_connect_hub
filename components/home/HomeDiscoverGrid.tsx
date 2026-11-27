'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedItem } from '@/lib/moments/service';
import { MomentGrid } from '@/components/moments/MomentShowcase';
import { call } from '@/components/home/HomeMomentFeed';

const PAGE_SIZE = 24;

/**
 * Home's โมเมนต์ mode (owner 2026-11-26, was ค้นพบ): the /moments photo grid inside Home, so members browse new places and moments
 * without leaving it. Same list as /moments ทั้งหมด (popular mixed with new). /moments stays the public page for
 * visitors and search engines.
 */
export function HomeDiscoverGrid({ onToast }: { onToast: (message: string) => void }) {
  const [moments, setMoments] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (nextPage: number, after?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ tab: 'mix', limit: String(PAGE_SIZE), page: String(nextPage), ...(after ? { cursor: after } : {}) });
      const json = await fetch(`/api/moments?${params}`, { cache: 'no-store' }).then((res) => res.json());
      const list: FeedItem[] = (json.moments ?? []).filter((m: FeedItem) => m.images?.[0]);
      setMoments((prev) => (nextPage === 1 ? list : [...prev, ...list.filter((m) => !prev.some((p) => p.id === m.id))]));
      setPage(nextPage);
      setHasMore(Boolean(json.pagination?.hasNextPage));
      setCursor(json.pagination?.nextCursor);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  // More cards as the reader nears the end
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading || page === 0) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void load(page + 1, cursor), { rootMargin: '600px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, load, page, cursor]);

  // Optimistic heart, put back with a message if the server says no (as on /moments)
  const toggleLike = (moment: FeedItem) => {
    const action = moment.isLiked ? 'unlike' : 'like';
    const flip = (liked: boolean) =>
      setMoments((prev) => prev.map((m) => (m.id === moment.id ? { ...m, isLiked: liked, likesCount: m.likesCount + (liked ? 1 : -1) } : m)));
    flip(action === 'like');
    void call(`/api/moments/${encodeURIComponent(moment.id)}/actions`, 'POST', { action }).then((result) => {
      if (!result.ok) {
        flip(action !== 'like');
        onToast(result.message);
      }
    });
  };

  if (page === 0) {
    return (
      <div className="mt-4 -mx-3 sm:mx-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-1 sm:gap-x-2 gap-y-4" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[4/5] rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    // Phones: 4px from the screen edge and 4px between tiles (owner 2026-11-27), so the photos get the width
    <div className="mt-4 -mx-3 sm:mx-0">
      {moments.length === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-slate-500">ยังไม่มีโมเมนต์ ออกไปเที่ยวแล้วมาเล่าให้เพื่อนๆ ฟังกัน</p>
      ) : (
        <MomentGrid items={moments} onLike={toggleLike} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-1 gap-y-4 sm:gap-x-3 sm:gap-y-5" />
      )}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" />}
      {isLoading && (
        <div className="py-6 flex justify-center" role="status" aria-label="กำลังโหลดโมเมนต์">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
        </div>
      )}
      {!hasMore && moments.length > PAGE_SIZE && <p className="py-8 text-center text-[13px] font-medium text-slate-500">ดูครบทุกโมเมนต์แล้ว</p>}
    </div>
  );
}
