'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Footprints, Music, RotateCcw, Share2, Volume2, VolumeX, X } from 'lucide-react';
import { DEFAULT_MUSIC_VOLUME, findTrack } from '@/lib/media/musicLibrary';
import { optimizedImage, safeImageSrc } from '@/lib/optimizedImage';
import {
  itemPicture,
  thaiDateRange,
  timeOf,
  tripParts,
  thaiShortDate,
  daysBetween,
  tripCover,
  tripLength,
  tripPlaces,
  tripStops,
  tripTag,
  visibleItems,
  type TripChapter,
  type TripPart,
  type TripItemView,
  type TripStop,
  type TripView,
} from '@/lib/trips/story';

/**
 * The trip story player (docs/TRIPS_PLAN.md): full-screen frames, cover → route → each day's chapter and its photos and
 * clips → end. Tap right or left to move, hold to pause; arrows, space and Esc on a keyboard.
 */

type Frame =
  | { kind: 'cover' }
  | { kind: 'route' }
  | { kind: 'part'; part: TripPart; of: number }
  | { kind: 'chapter'; chapter: TripChapter; inPart: boolean }
  | { kind: 'item'; item: TripItemView; chapter: TripChapter }
  | { kind: 'end' };

const DURATION = { cover: 4000, route: 5000, part: 3200, chapter: 2600, item: 5000, end: 0 } as const;
const MAX_CLIP_MS = 30_000;
const HOLD_MS = 180;
const STAGE_SIZES = 1080;

/**
 * cover → route → each sub-trip's opening (when there are several) → each day's opening (when its sub-trip, or the
 * trip, has several days) → the day's photos and clips → end
 */
function buildFrames(stops: TripStop[], parts: TripPart[]): Frame[] {
  const frames: Frame[] = [{ kind: 'cover' }];
  if (stops.length >= 2) frames.push({ kind: 'route' });
  const days = parts.reduce((n, p) => n + p.chapters.length, 0);
  for (const part of parts) {
    if (parts.length > 1) frames.push({ kind: 'part', part, of: parts.length });
    for (const chapter of part.chapters) {
      if (parts.length > 1 ? part.chapters.length > 1 : days > 1) frames.push({ kind: 'chapter', chapter, inPart: parts.length > 1 });
      for (const item of chapter.items) frames.push({ kind: 'item', item, chapter });
    }
  }
  frames.push({ kind: 'end' });
  return frames;
}

/** One gentle arc per leg, like a flight route, so the line never swings past a stop */
function routePath(points: TripStop[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const bend = 0.18;
    d += ` Q ${(a.x + b.x) / 2 - (b.y - a.y) * bend} ${(a.y + b.y) / 2 + (b.x - a.x) * bend}, ${b.x} ${b.y}`;
  }
  return d;
}

function Avatar({ src, name, size }: { src?: string; name: string; size: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ring-2 ring-black/30" style={{ width: size, height: size }}>
      {src ? <img src={optimizedImage(src, 96)} alt={name} className="absolute inset-0 size-full object-cover" /> : name.slice(0, 1)}
    </span>
  );
}

function PlacePill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur">
      <span className="size-1.5 rounded-full bg-[#4A7C59]" aria-hidden />
      {name}
    </span>
  );
}

export interface TripPlayerActions {
  /** "ไปตามรอยทริปนี้"; missing = the button is not shown */
  onFollow?: () => void;
  onShare?: () => void;
  /** The owner's draft preview: publish from the end screen, where the choice is made */
  onPublish?: () => void;
}

export function TripPlayer({ trip, onClose, actions = {}, startItemId }: { trip: TripView; onClose: () => void; actions?: TripPlayerActions; /** Open at this photo instead of the cover */ startItemId?: string }) {
  const parts = useMemo(() => tripParts(trip), [trip]);
  const stops = useMemo(() => tripStops(trip), [trip]);
  const frames = useMemo(() => buildFrames(stops, parts), [stops, parts]);
  const cover = tripCover(trip);
  const coverSrc = cover ? itemPicture(cover) : '';

  const [index, setIndex] = useState(() => (startItemId ? Math.max(0, frames.findIndex((f) => f.kind === 'item' && f.item.id === startItemId)) : 0));
  const [elapsed, setElapsed] = useState(0);
  const [clipMs, setClipMs] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(true);
  // The trip's song (owner 2026-11-27): on from the tap that opened the story; off when the browser refuses or the reader turns it off
  const track = findTrack(trip.musicId);
  const [musicOn, setMusicOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const holdTimer = useRef<number | null>(null);
  const wasHold = useRef(false);
  const elapsedRef = useRef(0);

  const frame = frames[index];
  const isClip = frame.kind === 'item' && frame.item.kind === 'video';
  // A sub-trip with the author's line stays longer, so the line can be read
  const duration = isClip ? (clipMs ?? MAX_CLIP_MS) : frame.kind === 'part' && frame.part.note ? 5000 : DURATION[frame.kind];
  const paused = held || hidden || duration === 0;
  const chapterOf = frame.kind === 'item' || frame.kind === 'chapter' ? frame.chapter : null;
  const partOf = frame.kind === 'part' ? frame.part : null;

  const last = frames.length - 1;
  const go = useCallback(
    (step: number) => {
      setIndex((i) => Math.min(last, Math.max(0, i + step)));
      elapsedRef.current = 0;
      setElapsed(0);
      setClipMs(null);
    },
    [last, setIndex, setElapsed, setClipMs],
  );

  // Photos and title frames run on a timer; a clip runs on its own time
  useEffect(() => {
    if (paused || isClip) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;
      if (elapsedRef.current >= duration) {
        go(1);
        return;
      }
      setElapsed(elapsedRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, isClip, index, duration, go]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => undefined);
  }, [paused, index]);

  // The song plays under everything, quieter while a clip plays with its own sound
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isClip && !muted ? 0.15 : DEFAULT_MUSIC_VOLUME;
    if (held || hidden || !musicOn) audio.pause();
    else audio.play().catch(() => setMusicOn(false));
  }, [held, hidden, musicOn, isClip, muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ') {
        e.preventDefault();
        setHeld((h) => !h);
      }
    };
    const onVisibility = () => setHidden(document.hidden);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [go, onClose]);

  const onPointerDown = () => {
    wasHold.current = false;
    holdTimer.current = window.setTimeout(() => {
      wasHold.current = true;
      setHeld(true);
    }, HOLD_MS);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (wasHold.current) {
      setHeld(false);
      return;
    }
    if (frame.kind === 'end') return;
    const box = e.currentTarget.getBoundingClientRect();
    go(e.clientX - box.left < box.width * 0.3 ? -1 : 1);
  };
  const onPointerLeave = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (wasHold.current) setHeld(false);
  };

  const pictureOf = (f: Frame | undefined): string => {
    if (!f) return '';
    if (f.kind === 'item') return itemPicture(f.item);
    if (f.kind === 'chapter') return f.chapter.items[0] ? itemPicture(f.chapter.items[0]) : coverSrc;
    if (f.kind === 'part') {
      const first = f.part.chapters[0]?.items[0];
      return first ? itemPicture(first) : coverSrc;
    }
    return coverSrc;
  };
  const picture = pictureOf(frame);
  const nextPicture = pictureOf(frames[index + 1]);
  const playState = { animationPlayState: paused ? 'paused' : 'running' } as const;
  const progress = duration ? Math.min(100, (elapsed / duration) * 100) : 100;

  return (
    <div role="dialog" aria-modal="true" aria-label={`เรื่องเล่า: ${trip.title}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {track && <audio ref={audioRef} src={track.src} loop preload="auto" />}
      <style>{`
        @keyframes trip-zoom { from { transform: scale(1) } to { transform: scale(1.08) } }
        @keyframes trip-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        @keyframes trip-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes trip-fade { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .trip-motion { animation: none !important } }
      `}</style>

      {picture && (
        <div className="absolute inset-0 hidden overflow-hidden sm:block" aria-hidden>
          <img src={optimizedImage(picture, 640)} alt="" className="size-full scale-110 object-cover opacity-40 blur-2xl" />
        </div>
      )}

      <button
        type="button"
        onClick={() => go(-1)}
        disabled={index === 0}
        aria-label="ก่อนหน้า"
        className="relative mr-4 hidden size-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:invisible sm:flex"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div className="relative h-dvh w-full overflow-hidden bg-slate-900 sm:aspect-[9/16] sm:h-[min(calc(100dvh-48px),860px)] sm:w-auto sm:rounded-3xl">
        <div className="absolute inset-0 select-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave} onContextMenu={(e) => e.preventDefault()}>
          <FrameView
            key={index}
            trip={trip}
            frame={frame}
            picture={picture}
            stops={stops}
            playState={playState}
            duration={duration}
            videoRef={videoRef}
            muted={muted}
            onClipTime={(current, total) => {
              const ms = Math.min(MAX_CLIP_MS, total * 1000);
              setClipMs(ms);
              setElapsed(Math.min(ms, current * 1000));
            }}
            onClipEnd={() => go(1)}
          />
        </div>
        {nextPicture && nextPicture !== picture && (
          <img src={optimizedImage(nextPicture, STAGE_SIZES)} alt="" aria-hidden className="pointer-events-none absolute size-px opacity-0" />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {frames.map((_, i) => (
              <span key={i} className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/30">
                <span className="block h-full bg-white" style={{ width: i < index ? '100%' : i > index ? '0%' : `${progress}%` }} />
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar src={trip.author.avatar} name={trip.author.name} size={32} />
            <p className="min-w-0 flex-1 truncate text-sm text-white">
              <span className="font-semibold">{trip.author.name}</span>
              <span className="text-white/75"> · {chapterOf ? `${chapterOf.label}${chapterOf.title ? ` ${chapterOf.title}` : ''}` : partOf ? partOf.city : tripTag(trip)}</span>
            </p>
            {held && <span className="text-xs text-white/75">หยุดไว้</span>}
            {track && !isClip && (
              <button
                type="button"
                onClick={() => setMusicOn((on) => !on)}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}
                className="pointer-events-auto flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/15"
              >
                {musicOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
              </button>
            )}
            {isClip && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
                className="pointer-events-auto flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/15"
              >
                {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              aria-label="ปิด"
              className="pointer-events-auto flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {frame.kind === 'end' && (
          <EndActions
            trip={trip}
            actions={actions}
            onReplay={() => {
              setIndex(0);
              elapsedRef.current = 0;
              setElapsed(0);
            }}
            onJump={(itemId) => {
              setIndex(Math.max(0, frames.findIndex((f) => f.kind === 'item' && f.item.id === itemId)));
              elapsedRef.current = 0;
              setElapsed(0);
            }}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => go(1)}
        disabled={index === frames.length - 1}
        aria-label="ถัดไป"
        className="relative ml-4 hidden size-11 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:invisible sm:flex"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

function FrameView({
  trip,
  frame,
  picture,
  stops,
  playState,
  duration,
  videoRef,
  muted,
  onClipTime,
  onClipEnd,
}: {
  trip: TripView;
  frame: Frame;
  picture: string;
  stops: TripStop[];
  playState: React.CSSProperties;
  duration: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  onClipTime: (current: number, total: number) => void;
  onClipEnd: () => void;
}) {
  const rise = (delay = 0): React.CSSProperties => ({ animation: `trip-rise 350ms ease-out ${delay}ms both`, ...playState });
  const blurred = picture ? <img src={optimizedImage(picture, 640)} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-md" /> : null;

  if (frame.kind === 'route') {
    const drawMs = 3000;
    return (
      <div className="absolute inset-0">
        {blurred}
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-x-0 top-24 px-6 text-white">
          <p className="trip-motion text-sm text-white/75" style={rise()}>เส้นทางของทริป</p>
          <p className="trip-motion mt-1 text-2xl font-bold leading-snug" style={rise(80)}>{stops.map((p) => p.name).join(' → ')}</p>
        </div>
        <svg viewBox="-10 -10 120 120" className="absolute inset-x-6 top-1/2 aspect-square -translate-y-[40%]" aria-hidden>
          <path d={routePath(stops)} fill="none" stroke="white" strokeOpacity={0.25} strokeWidth={0.8} strokeDasharray="1.5 2" />
          <path
            className="trip-motion"
            d={routePath(stops)}
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeDasharray={1}
            style={{ strokeDashoffset: 0, animation: `trip-draw ${drawMs}ms ease-in-out both`, ...playState }}
          />
          {stops.map((p, i) => {
            const delay = (drawMs / Math.max(1, stops.length - 1)) * i;
            const labelLeft = p.x > 60;
            return (
              <g key={`${p.name}-${i}`} className="trip-motion" style={{ animation: `trip-fade 300ms ease-out ${delay}ms both`, ...playState }}>
                <circle cx={p.x} cy={p.y} r={2.6} fill="white" />
                <circle cx={p.x} cy={p.y} r={1.2} fill="#4A7C59" />
                <text x={labelLeft ? p.x - 4.5 : p.x + 4.5} y={p.y + 1.6} textAnchor={labelLeft ? 'end' : 'start'} fontSize={5} fontWeight={700} fill="white">
                  {i + 1}. {p.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (frame.kind === 'end') {
    return (
      <div className="absolute inset-0">
        {blurred}
        <div className="absolute inset-0 bg-black/70" />
      </div>
    );
  }

  const zoom: React.CSSProperties = { animation: `trip-zoom ${duration + 600}ms ease-out both`, ...playState };
  const item = frame.kind === 'item' ? frame.item : null;

  return (
    <div className="absolute inset-0">
      {item?.kind === 'video' ? (
        <video
          ref={videoRef}
          src={safeImageSrc(item.mediaUrl)}
          poster={item.posterUrl ? optimizedImage(item.posterUrl, STAGE_SIZES) : undefined}
          className="absolute inset-0 size-full object-cover"
          autoPlay
          playsInline
          muted={muted}
          onTimeUpdate={(e) => onClipTime(e.currentTarget.currentTime, e.currentTarget.duration || 0)}
          onEnded={onClipEnd}
          onError={onClipEnd}
        />
      ) : (
        picture && (
          <div className="trip-motion absolute inset-0" style={zoom}>
            <img src={optimizedImage(picture, STAGE_SIZES)} alt={item?.caption || trip.title} className="size-full object-cover" />
          </div>
        )
      )}

      {frame.kind === 'cover' && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 pb-[max(40px,env(safe-area-inset-bottom))] pt-32 text-white">
          <span className="trip-motion inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900" style={rise()}>
            <span className="size-1.5 rounded-full bg-[#E11D48]" aria-hidden />
            {tripTag(trip)}
          </span>
          <h2 className="trip-motion mt-3 text-3xl font-bold leading-tight tracking-tight" style={rise(80)}>{trip.title}</h2>
          <p className="trip-motion mt-2 text-sm text-white/80" style={rise(160)}>{thaiDateRange(trip.startsOn, trip.endsOn)}</p>
          {findTrack(trip.musicId) && (
            <p className="trip-motion mt-2 flex items-center gap-1.5 text-xs text-white/75" style={rise(180)}>
              <Music className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{findTrack(trip.musicId)!.title} · {findTrack(trip.musicId)!.artist}</span>
            </p>
          )}
          {trip.intro && <p className="trip-motion mt-3 max-w-prose text-sm leading-relaxed text-white/90" style={rise(200)}>{trip.intro}</p>}
          {trip.withPeople.length > 0 && (
            <div className="trip-motion mt-5 flex items-center gap-3" style={rise(240)}>
              <div className="flex -space-x-2">
                {[trip.author, ...trip.withPeople].slice(0, 6).map((p) => <Avatar key={p.id} src={p.avatar} name={p.name} size={28} />)}
              </div>
              <p className="min-w-0 truncate text-sm text-white/90">
                {trip.author.name} กับ {trip.withPeople.map((p) => p.name).join(' ')}
              </p>
            </div>
          )}
        </div>
      )}

      {frame.kind === 'part' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-6 text-center text-white">
          <p className="trip-motion text-sm text-white/80" style={rise()}>ทริปย่อย {frame.part.number} จาก {frame.of}</p>
          <p className="trip-motion mt-1 text-4xl font-bold tracking-tight" style={rise(80)}>{frame.part.city || 'ระหว่างทาง'}</p>
          <p className="trip-motion mt-2 text-sm tabular-nums text-white/75" style={rise(160)}>
            {daysBetween(frame.part.from, frame.part.to) + 1} วัน · {frame.part.from === frame.part.to ? thaiShortDate(frame.part.from) : `${thaiShortDate(frame.part.from)} – ${thaiShortDate(frame.part.to)}`}
          </p>
          {frame.part.note && <p className="trip-motion mt-5 max-w-sm text-lg leading-relaxed text-white" style={rise(260)}>{frame.part.note}</p>}
        </div>
      )}

      {frame.kind === 'chapter' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-6 text-center text-white">
          <p className="trip-motion text-sm text-white/80" style={rise()}>{frame.inPart ? frame.chapter.title : frame.chapter.label}</p>
          <p className="trip-motion mt-1 text-4xl font-bold tracking-tight" style={rise(80)}>{frame.inPart ? frame.chapter.label : frame.chapter.title || thaiShortDate(frame.chapter.day)}</p>
          <p className="trip-motion mt-2 text-sm text-white/75" style={rise(160)}>{frame.inPart ? `${thaiShortDate(frame.chapter.day)} · ` : ''}{frame.chapter.items.length} โมเมนต์</p>
        </div>
      )}

      {frame.kind === 'item' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-[max(32px,env(safe-area-inset-bottom))] pt-28 text-white">
          {(frame.item.city || frame.chapter.title) && (
            <div className="trip-motion" style={rise()}>
              <PlacePill name={frame.item.city || frame.chapter.title} />
            </div>
          )}
          {frame.item.caption && <p className="trip-motion mt-3 line-clamp-4 max-w-prose text-base leading-relaxed" style={rise(80)}>{frame.item.caption}</p>}
          <p className="trip-motion mt-1.5 text-xs tabular-nums text-white/75" style={rise(140)}>
            {frame.chapter.label} · {timeOf(frame.item.takenLocal)}
          </p>
        </div>
      )}
    </div>
  );
}

const MOSAIC_MAX = 30;

function EndActions({ trip, actions, onReplay, onJump }: { trip: TripView; actions: TripPlayerActions; onReplay: () => void; onJump: (itemId: string) => void }) {
  const { cities, countries } = tripPlaces(trip);
  const days = tripLength(trip);
  const stats = [
    days > 1 ? { value: days, label: 'วัน' } : null,
    countries.length > 1 ? { value: countries.length, label: 'ประเทศ' } : null,
    cities.length ? { value: cities.length, label: 'เมือง' } : null,
    { value: visibleItems(trip).length, label: 'โมเมนต์' },
    trip.withPeople.length ? { value: trip.withPeople.length, label: 'เพื่อนที่ไปด้วย' } : null,
  ].filter((s): s is { value: number; label: string } => s !== null).slice(0, 4);
  const stop = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), onPointerUp: (e: React.PointerEvent) => e.stopPropagation() };
  const anim = (delay: number) => ({ animation: `trip-rise 350ms ease-out ${delay}ms both` });

  // The whole trip at a glance (owner 2026-11-26): every moment as a small picture, a long trip sampled evenly
  const items = visibleItems(trip);
  const shown = items.length <= MOSAIC_MAX ? items : Array.from({ length: MOSAIC_MAX }, (_, i) => items[Math.round((i * (items.length - 1)) / (MOSAIC_MAX - 1))]);
  const more = items.length - shown.length;
  const columns = shown.length <= 4 ? 2 : shown.length <= 9 ? 3 : shown.length <= 16 ? 4 : 5;

  return (
    <div className="absolute inset-0 flex flex-col px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-24 text-white" {...stop}>
      <ul className="grid min-h-0 flex-1 content-end gap-1 overflow-hidden" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {shown.map((item, i) => (
          <li key={item.id} className="trip-motion" style={{ animation: `trip-fade 300ms ease-out ${Math.min(i * 40, 1200)}ms both` }}>
            <button type="button" onClick={() => onJump(item.id)} aria-label={`ดูรูป${item.caption ? ` ${item.caption}` : ''}`} className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-white/10">
              <img src={optimizedImage(itemPicture(item), 240)} alt="" className="size-full object-cover transition duration-300 hover:scale-105" />
              {more > 0 && i === shown.length - 1 && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold tabular-nums">+{more}</span>}
            </button>
          </li>
        ))}
      </ul>

      <p className="trip-motion mt-5 text-sm text-white/75" style={anim(200)}>{days > 1 ? 'จบทริปนี้แล้ว' : 'จบเรื่องนี้แล้ว'}</p>
      <h2 className="trip-motion mt-1 text-2xl font-bold leading-tight" style={anim(260)}>{trip.title}</h2>

      <dl className="trip-motion mt-3 flex flex-wrap gap-x-5 gap-y-1" style={anim(320)}>
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <dd className="text-xl font-bold tabular-nums">{s.value}</dd>
            <dt className="text-sm text-white/75">{s.label}</dt>
          </div>
        ))}
      </dl>

      {cities.length > 1 && (
        <p className="trip-motion mt-3 flex items-start gap-2 text-sm text-white/90" style={anim(380)}>
          <Footprints className="mt-0.5 size-4 shrink-0 text-white/80" aria-hidden />
          <span>{cities.join(' → ')}</span>
        </p>
      )}

      {actions.onPublish && (
        <button
          type="button"
          onClick={actions.onPublish}
          className="trip-motion mt-5 w-full cursor-pointer whitespace-nowrap rounded-full bg-[#2563EB] py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] active:scale-[0.98]"
          style={anim(440)}
        >
          เผยแพร่เลย
        </button>
      )}
      {actions.onFollow && (
        <button
          type="button"
          onClick={actions.onFollow}
          className="mt-5 w-full cursor-pointer whitespace-nowrap rounded-full bg-[#2563EB] py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] active:scale-[0.98]"
        >
          {days > 1 ? 'ไปตามรอยทริปนี้' : 'ชวนเพื่อนไปแบบนี้บ้าง'}
        </button>
      )}
      <div className={`grid gap-3 ${actions.onShare ? 'grid-cols-2' : 'grid-cols-1'} ${actions.onFollow || actions.onPublish ? 'mt-3' : 'mt-5'}`}>
        {actions.onShare && (
          <button type="button" onClick={actions.onShare} className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white/15 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
            <Share2 className="size-4" aria-hidden /> แชร์เรื่องนี้
          </button>
        )}
        <button type="button" onClick={onReplay} className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white/15 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
          <RotateCcw className="size-4" aria-hidden /> ดูอีกครั้ง
        </button>
      </div>
    </div>
  );
}
