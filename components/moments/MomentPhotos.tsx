'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

/**
 * A moment's photos the way Instagram and Lemon8 show them: one photo at a time, swiped sideways on a phone,
 * arrows on hover on a computer, "1/3" in the corner and dots underneath.
 * Every post uses the same square frame (owner, 2026-10-16), so the feed keeps one even rhythm; each photo fills it
 * and the viewer shows it whole.
 * A tap opens the viewer at the photo on screen; a double tap likes the post (when `onDoubleTap` is given).
 */

interface MomentPhotosProps {
  images: string[];
  /** Width / height of the first photo. Not used for the frame any more (every post is square); kept so callers need not change. */
  ratio?: number;
  alt: string;
  /** Opens the photo viewer at this photo */
  onOpen: (index: number) => void;
  /** Double tap: like the post. The heart shows either way. */
  onDoubleTap?: () => void;
}

/** Uploads are served through the image optimizer in three widths; other sources are used as they are */
const FRAME_WIDTHS = [640, 828, 1200];
const sized = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
const responsive = (src: string) =>
  src.startsWith('/uploads/') ? { src: sized(src, 828), srcSet: FRAME_WIDTHS.map((w) => `${sized(src, w)} ${w}w`).join(', '), sizes: '(min-width: 640px) 560px, 100vw' } : { src };

/** A second tap within this time is a double tap */
const DOUBLE_TAP_MS = 260;

export function MomentPhotos({ images, alt, onOpen, onDoubleTap }: MomentPhotosProps) {
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = images.length;

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
  }, []);

  const goTo = (next: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(count - 1, next)) * el.clientWidth, behavior: 'smooth' });
  };

  const onTap = () => {
    if (tapTimer.current) {
      // Second tap: like, and no viewer
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      if (onDoubleTap) {
        onDoubleTap();
        setHearts((n) => n + 1);
      }
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      onOpen(index);
    }, onDoubleTap ? DOUBLE_TAP_MS : 0);
  };

  return (
    <div className="space-y-2">
      <div className="group/photos relative w-full aspect-square overflow-hidden rounded-2xl bg-slate-100 select-none">
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            const next = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
            if (next !== index) setIndex(next);
          }}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar overscroll-x-contain"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={onTap}
              className="relative h-full w-full shrink-0 snap-center cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
              aria-label={count > 1 ? `ดูรูปที่ ${i + 1} จาก ${count}` : 'ดูรูปเต็ม'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- member uploads and remote sample images */}
              <img
                {...responsive(src)}
                alt={i === 0 ? alt : ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {count > 1 && (
          <>
            <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white tabular-nums">
              {index + 1}/{count}
            </span>
            {index > 0 && (
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="รูปก่อนหน้า"
                className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow items-center justify-center opacity-0 group-hover/photos:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {index < count - 1 && (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="รูปถัดไป"
                className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow items-center justify-center opacity-0 group-hover/photos:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}

        {hearts > 0 && (
          <span key={hearts} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg motion-safe:animate-heart-pop motion-reduce:opacity-0" />
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {images.map((src, i) => (
            <span key={`${src}-dot-${i}`} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-[#F43F5E]' : 'w-1.5 bg-slate-300'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
