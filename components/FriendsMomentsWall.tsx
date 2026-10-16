'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import type { FeedItem } from '@/lib/moments/service';

const WALL_LIMIT = 8;

// "คุณกี้ (Kee_Explorer)" reads as "คุณกี้"
const shortName = (name: string) => name.split(' (')[0];

const targetHref = (m: FeedItem) => {
  if (!m.targetId) return null;
  const id = encodeURIComponent(m.targetId);
  if (m.targetType === 'spot') return `/spots/${id}`;
  if (m.targetType === 'community') return `/community/${id}`;
  if (m.targetType === 'fair') return `/fairs/${id}`;
  if (m.targetType === 'challenge') return `/challenges/${id}`;
  return null;
};

/**
 * "เพื่อน & โมเมนต์" on the homepage: a row of friends (tap one to read their story), and the chosen
 * moment told openly: photos, their words, a friend's reply, and a way to go there too. No card frames.
 */
export function FriendsMomentsWall() {
  const [moments, setMoments] = useState<FeedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    fetch(`/api/moments?tab=all&limit=${WALL_LIMIT}`)
      .then((response) => response.json())
      .then((result) => {
        if (!isActive || !result?.success || !Array.isArray(result.moments)) return;
        const withPhotos = (result.moments as FeedItem[]).filter((m) => m.images?.length > 0);
        setMoments(withPhotos);
      })
      .catch((error) => console.warn('Could not load moments:', error))
      .finally(() => {
        if (isActive) setIsLoaded(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="space-y-6" aria-hidden="true">
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 shrink-0" />
          ))}
        </div>
        <div className="h-72 sm:h-96 rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (moments.length === 0) {
    return (
      <p className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200 text-sm font-medium text-slate-600">
        ยังไม่มีโมเมนต์ ไปที่ไหนมาแล้ว{' '}
        <Link href="/moments" className="font-bold text-[#2563EB] hover:underline">แชร์เป็นคนแรก</Link>
      </p>
    );
  }

  const active = moments.find((m) => m.id === activeId) ?? moments[0];
  const reply = active.comments?.find((c) => !c.isMine);
  const placeHref = targetHref(active);
  const placeName = active.targetTitle || active.location;
  const photos = active.images.slice(0, 3);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Friends: tap one to read their story */}
      <div className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1" role="tablist" aria-label="เพื่อนที่แชร์โมเมนต์">
        <Link href="/moments" className="group flex flex-col items-center gap-1.5 w-16 sm:w-20 shrink-0">
          <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-slate-300 group-hover:border-[#2563EB] flex items-center justify-center text-slate-500 group-hover:text-[#2563EB] transition-colors">
            <Plus className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-slate-700 whitespace-nowrap">แชร์ของคุณ</span>
        </Link>
        {moments.map((m) => {
          const selected = m.id === active.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveId(m.id)}
              className="group flex flex-col items-center gap-1.5 w-16 sm:w-20 shrink-0 cursor-pointer"
            >
              <span className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] transition-colors ${selected ? 'bg-[#F26430]' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.images[0]} alt="" className="w-full h-full rounded-full object-cover border-2 border-white" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.userAvatar} alt="" className="absolute -bottom-0.5 -right-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-white" />
              </span>
              <span className={`max-w-full truncate text-[11px] sm:text-xs ${selected ? 'font-bold text-slate-900' : 'font-bold text-slate-600'}`}>
                {shortName(m.userName)}
              </span>
            </button>
          );
        })}
      </div>

      {/* The chosen moment, told openly */}
      <div key={active.id} className="grid lg:grid-cols-[1.2fr_1fr] gap-4 lg:gap-10 items-center animate-fade-in">
        <Link
          href={`/moments?momentId=${encodeURIComponent(active.id)}`}
          className={`grid gap-2 sm:gap-3 h-52 sm:h-[300px] overflow-hidden ${photos.length > 1 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-1 grid-rows-1'}`}
          aria-label={`ดูโมเมนต์ของ ${shortName(active.userName)}`}
        >
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className={`w-full h-full min-h-0 object-cover rounded-3xl hover:opacity-95 transition-opacity ${
                photos.length > 1 && i === 0 ? 'col-span-2 row-span-2' : ''
              } ${photos.length === 2 && i === 1 ? 'row-span-2' : ''}`}
            />
          ))}
        </Link>

        <div className="min-w-0">
          <Link href={active.authorId ? `/profile?id=${encodeURIComponent(active.authorId)}` : `/moments?momentId=${encodeURIComponent(active.id)}`} className="inline-flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            <span>
              <span className="block text-sm font-bold text-slate-900 group-hover:underline">{shortName(active.userName)}</span>
              <span className="block text-xs font-medium text-slate-500">{active.timeAgo}</span>
            </span>
          </Link>

          {placeName && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[#F26430] min-w-0">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">ไปที่ {placeName}</span>
            </p>
          )}

          <blockquote className="mt-2 text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight line-clamp-3">
            “{active.caption}”
          </blockquote>

          <p className="mt-3 flex items-center gap-4 text-sm font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />{active.likesCount.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" aria-hidden="true" />{active.commentsCount.toLocaleString()} ความเห็น</span>
          </p>

          {reply && (
            <div className="mt-3 flex items-start gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={reply.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <p className="min-w-0 rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700">
                <span className="block text-xs font-bold text-slate-900">{shortName(reply.userName)}</span>
                <span className="line-clamp-2">{reply.text}</span>
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            {placeHref && (
              <Link
                href={placeHref}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold whitespace-nowrap transition-colors"
              >
                ไปที่นี่บ้าง
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
            <Link href={`/moments?momentId=${encodeURIComponent(active.id)}`} className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
              อ่านต่อและคุยกัน
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
