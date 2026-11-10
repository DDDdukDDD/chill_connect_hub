'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Heart, Play, Volume2, VolumeX } from 'lucide-react';

/**
 * A moment's clip, played the way Instagram plays one (owner 2026-11-02): it starts by itself once it is on screen,
 * silent and looping, and stops when it scrolls away. A tap pauses, a double tap likes, the speaker turns the sound on.
 * Only the topmost clip on screen plays, so a page of clips spends the data of one, and nothing loads before it plays.
 * On a computer the clip under the mouse plays instead (owner 2026-11-02), and the topmost takes over when the mouse leaves.
 *
 * Feeds and grids pass `preview` (docs/VIDEO_PLAN.md, stage 1, owner 2026-11-07): they autoplay the clip's small silent
 * loop, and the full file loads only when the reader turns the sound on or opens the post. A clip posted before previews
 * existed (`preview` null) shows its cover and loads nothing until a tap. Without `preview` (the post's own page) the
 * full clip plays as before.
 */

/** How much of a clip must be on screen before it plays */
const VISIBLE_SHARE = 0.6;
/** A second tap within this time is a double tap */
const DOUBLE_TAP_MS = 260;
const SAME_ROW_PX = 24;
const AUTOPLAY_REFUSED = 'clip-autoplay-refused';

const onScreen = new Set<HTMLVideoElement>();
const pausedByReader = new WeakSet<HTMLVideoElement>();
/** Clips that wait for a tap: no preview to play, and the full file is too heavy to start by itself in a feed */
const waitsForTap = new WeakSet<HTMLVideoElement>();
let playing: HTMLVideoElement | null = null;
let hovered: HTMLVideoElement | null = null;

// The sound stays as the reader left it from clip to clip
let soundOn = false;
const soundListeners = new Set<() => void>();
const subscribeSound = (listener: () => void) => {
  soundListeners.add(listener);
  return () => soundListeners.delete(listener);
};
function setSound(on: boolean) {
  soundOn = on;
  if (playing) playing.muted = !on;
  soundListeners.forEach((listener) => listener());
}

/** A reader on a data saver, or who asked for less motion, starts clips with a tap */
function mayAutoplay(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function start(el: HTMLVideoElement) {
  el.muted = !soundOn;
  el.play().catch((err: DOMException) => {
    // A browser may refuse sound before the first tap on this page; silent is always allowed
    if (err.name !== 'NotAllowedError') return;
    // Refused even silent (a phone in low power mode): the player then shows its play button
    if (el.muted) return void el.dispatchEvent(new Event(AUTOPLAY_REFUSED));
    setSound(false);
    el.play().catch(() => undefined);
  });
}

function settle() {
  const next = (hovered && !waitsForTap.has(hovered) ? hovered : null) ?? [...onScreen].filter((el) => !waitsForTap.has(el)).sort((a, b) => {
    const [boxA, boxB] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
    // Tiles in one row are not quite level while a hovered one still leans, so the row counts first, then the leftmost
    return Math.abs(boxA.top - boxB.top) > SAME_ROW_PX ? boxA.top - boxB.top : boxA.left - boxB.left;
  })[0] ?? null;
  if (playing && playing !== next) playing.pause();
  playing = next;
  if (next && next.paused && !pausedByReader.has(next) && mayAutoplay()) start(next);
}

interface ClipPlayerProps {
  url: string;
  /** The small silent loop to autoplay in place of `url`; null for an older clip with none (then it waits for a tap) */
  preview?: string | null;
  /** The part of the file to play and loop, when the member picked one from a longer clip */
  startS?: number;
  durationS?: number;
  /** Left out where a photo already sits behind the clip */
  poster?: string;
  label?: string;
  fit?: 'contain' | 'cover';
  /** False on a grid tile: no buttons, and a tap goes to whatever the tile links to */
  interactive?: boolean;
  /** What a tap does instead of pausing: opens the clip full screen */
  onTap?: () => void;
  onDoubleTap?: () => void;
  /** A thin time bar along the bottom that can be dragged to any part of the clip (the Reel, FEED_PLAN step 3) */
  showTime?: boolean;
  className?: string;
}

/** How long the part that plays is: the chosen part, or the file after its start */
const partLength = (el: HTMLVideoElement, startS: number, durationS?: number) => durationS || (Number.isFinite(el.duration) ? el.duration - startS : 0);

/**
 * The Reel's time bar: a native range input, so a finger, a mouse and the keyboard all work. It follows the clip
 * every frame without re-rendering the player.
 */
function TimeBar({ videoRef, startS, durationS }: { videoRef: React.RefObject<HTMLVideoElement | null>; startS: number; durationS?: number }) {
  const bar = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const el = videoRef.current;
      const len = el ? partLength(el, startS, durationS) : 0;
      if (el && bar.current && len > 0 && !dragging.current) {
        const share = Math.min(1, Math.max(0, (el.currentTime - startS) / len));
        bar.current.value = String(share * 1000);
        bar.current.style.setProperty('--share', `${share * 100}%`);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [videoRef, startS, durationS]);
  const seek = (value: number) => {
    const el = videoRef.current;
    const len = el ? partLength(el, startS, durationS) : 0;
    if (!el || len <= 0) return;
    el.currentTime = startS + (value / 1000) * len;
    bar.current?.style.setProperty('--share', `${value / 10}%`);
  };
  return (
    <input
      ref={bar}
      type="range"
      min={0}
      max={1000}
      step={1}
      defaultValue={0}
      aria-label="เลื่อนดูช่วงในคลิป"
      onPointerDown={() => {
        dragging.current = true;
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      onInput={(e) => seek(Number(e.currentTarget.value))}
      className="clip-time absolute inset-x-0 bottom-[env(safe-area-inset-bottom)] z-20 w-full"
    />
  );
}

export function ClipPlayer({ url, preview, startS = 0, durationS, poster, label, fit = 'contain', interactive = true, onTap: onSingleTap, onDoubleTap, showTime = false, className = '' }: ClipPlayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  // The big play button only when a tap is what it takes; a clip about to start by itself just shows its cover
  const [needsTap, setNeedsTap] = useState(false);
  const [hearts, setHearts] = useState(0);
  const sound = useSyncExternalStore(subscribeSound, () => soundOn, () => false);
  // The full file, rather than the preview or nothing; switched on by the reader, never back
  const [isFull, setIsFull] = useState(preview === undefined);
  const switchedToFull = useRef(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= VISIBLE_SHARE) {
          onScreen.add(el);
        } else {
          onScreen.delete(el);
          // Paused, scrolled away and back: it plays again
          pausedByReader.delete(el);
        }
        settle();
      },
      { threshold: [0, VISIBLE_SHARE] }
    );
    observer.observe(el);
    const onRefused = () => setNeedsTap(true);
    el.addEventListener(AUTOPLAY_REFUSED, onRefused);
    // Data saver and reduced motion start clips with a tap
    const startsByItself = mayAutoplay() && preview !== null;
    if (preview === null) waitsForTap.add(el);
    if (!startsByItself) queueMicrotask(onRefused);
    // A grid tile's player lets the pointer through to its link, so there the mouse is watched on the tile
    const wrapper = el.parentElement;
    const host = interactive ? wrapper : wrapper?.parentElement;
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      hovered = el;
      settle();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || hovered !== el) return;
      hovered = null;
      settle();
    };
    host?.addEventListener('pointerenter', onEnter);
    host?.addEventListener('pointerleave', onLeave);
    return () => {
      observer.disconnect();
      el.removeEventListener(AUTOPLAY_REFUSED, onRefused);
      host?.removeEventListener('pointerenter', onEnter);
      host?.removeEventListener('pointerleave', onLeave);
      onScreen.delete(el);
      el.pause();
      if (hovered === el) hovered = null;
      if (playing === el) playing = null;
      settle();
    };
  }, [interactive, preview]);

  // Preview to full file: the reader asked for it, so it plays at once, in place of whatever else was playing
  useEffect(() => {
    const el = video.current;
    if (!isFull || !switchedToFull.current || !el) return;
    waitsForTap.delete(el);
    pausedByReader.delete(el);
    if (playing && playing !== el) playing.pause();
    playing = el;
    start(el);
  }, [isFull]);

  const goFull = () => {
    switchedToFull.current = true;
    setIsFull(true);
  };

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
  }, []);

  // Stays inside the chosen part. A shrunk clip is exactly that part and just loops; an original file that could not be
  // shrunk may run on past the chosen end (the end can be pulled in since 2026-11-09), so the end is held too
  const keepInPart = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isFull || !durationS) return;
    const el = e.currentTarget;
    if (el.currentTime < startS - 0.25 || el.currentTime >= startS + durationS + 0.1) el.currentTime = startS;
  };

  const togglePlay = () => {
    const el = video.current;
    if (!el) return;
    if (!isFull) return goFull();
    if (el.paused) {
      pausedByReader.delete(el);
      if (playing && playing !== el) playing.pause();
      playing = el;
      start(el);
    } else {
      pausedByReader.add(el);
      setNeedsTap(true);
      el.pause();
    }
  };

  const onTap = () => {
    if (tapTimer.current) {
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
      if (onSingleTap) onSingleTap();
      else togglePlay();
    }, onDoubleTap ? DOUBLE_TAP_MS : 0);
  };

  return (
    <div className={`${className} ${interactive ? '' : 'pointer-events-none'}`}>
      <video
        ref={video}
        src={isFull ? url : (preview ?? undefined)}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onLoadedMetadata={keepInPart}
        onTimeUpdate={keepInPart}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
        className={`absolute inset-0 w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
      />
      {interactive && (
        <>
          <button
            type="button"
            onClick={onTap}
            aria-label={onSingleTap ? 'ดูคลิปเต็มจอ' : isPaused ? 'เล่นคลิป' : 'หยุดคลิป'}
            className="absolute inset-0 flex items-center justify-center cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
          >
            {isPaused && needsTap && (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white" aria-hidden="true">
                <Play className="h-6 w-6 fill-current" />
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              // The preview has no sound: turning it on brings the full clip
              if (!isFull) {
                setSound(true);
                return goFull();
              }
              setSound(!sound);
            }}
            aria-label={sound && isFull ? 'ปิดเสียง' : 'เปิดเสียง'}
            aria-pressed={sound && isFull}
            className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            {sound && isFull ? <Volume2 className="h-5 w-5" aria-hidden="true" /> : <VolumeX className="h-5 w-5" aria-hidden="true" />}
          </button>
          {showTime && isFull && <TimeBar videoRef={video} startS={startS} durationS={durationS} />}
          {hearts > 0 && (
            <span key={hearts} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg motion-safe:animate-heart-pop motion-reduce:opacity-0" />
            </span>
          )}
        </>
      )}
    </div>
  );
}
