'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Heart, Play, Volume2, VolumeX } from 'lucide-react';

/**
 * A moment's clip, played the way Instagram plays one (owner 2026-11-02): it starts by itself once it is on screen,
 * silent and looping, and stops when it scrolls away. A tap pauses, a double tap likes, the speaker turns the sound on.
 * Only the topmost clip on screen plays, so a page of clips spends the data of one, and nothing loads before it plays.
 */

/** How much of a clip must be on screen before it plays */
const VISIBLE_SHARE = 0.6;
/** A second tap within this time is a double tap */
const DOUBLE_TAP_MS = 260;

const onScreen = new Set<HTMLVideoElement>();
const pausedByReader = new WeakSet<HTMLVideoElement>();
let playing: HTMLVideoElement | null = null;

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
    if (err.name !== 'NotAllowedError' || el.muted) return;
    setSound(false);
    el.play().catch(() => undefined);
  });
}

function settle() {
  const next = [...onScreen].sort((a, b) => {
    const [boxA, boxB] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
    return boxA.top - boxB.top || boxA.left - boxB.left;
  })[0] ?? null;
  if (playing && playing !== next) playing.pause();
  playing = next;
  if (next && next.paused && !pausedByReader.has(next) && mayAutoplay()) start(next);
}

interface ClipPlayerProps {
  url: string;
  /** Left out where a photo already sits behind the clip */
  poster?: string;
  label?: string;
  fit?: 'contain' | 'cover';
  /** False on a grid tile: no buttons, and a tap goes to whatever the tile links to */
  interactive?: boolean;
  /** What a tap does instead of pausing: opens the clip full screen */
  onTap?: () => void;
  onDoubleTap?: () => void;
  className?: string;
}

export function ClipPlayer({ url, poster, label, fit = 'contain', interactive = true, onTap: onSingleTap, onDoubleTap, className = '' }: ClipPlayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [hearts, setHearts] = useState(0);
  const sound = useSyncExternalStore(subscribeSound, () => soundOn, () => false);

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
    return () => {
      observer.disconnect();
      onScreen.delete(el);
      el.pause();
      if (playing === el) playing = null;
      settle();
    };
  }, []);

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
  }, []);

  const togglePlay = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      pausedByReader.delete(el);
      if (playing && playing !== el) playing.pause();
      playing = el;
      start(el);
    } else {
      pausedByReader.add(el);
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
        src={url}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
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
            {isPaused && (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white" aria-hidden="true">
                <Play className="h-6 w-6 fill-current" />
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSound(!sound)}
            aria-label={sound ? 'ปิดเสียง' : 'เปิดเสียง'}
            aria-pressed={sound}
            className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            {sound ? <Volume2 className="h-5 w-5" aria-hidden="true" /> : <VolumeX className="h-5 w-5" aria-hidden="true" />}
          </button>
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
