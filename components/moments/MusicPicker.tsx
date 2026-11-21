'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Play, Search, X } from 'lucide-react';
import { useDialogBehavior } from '@/components/auth/DialogShell';
import { clipClock } from '@/lib/media/clip';
import { MUSIC_TRACKS, type MusicTrack } from '@/lib/media/musicLibrary';
import { readSavedSongs, toggleSavedSong } from '@/lib/media/savedSongs';
import { loadSong, songPeaks } from '@/lib/media/songPlayer';
import { SongTile, clipUses } from './SongBadge';

/**
 * Choosing a song for a clip, the way Reels does it (owner 2026-11-21, BE-446): a sheet over the editor with search,
 * แนะนำ, มาแรง (the songs most clips use) and บันทึกไว้, a tap to hear a song and "ใช้เพลงนี้" to put it under the
 * clip. Since BE-448 a tap plays the song with the clip above, from the song's best part, and a spinner shows while it
 * loads; the first songs load ahead. Then SongRange picks the part of the song on its waveform. Saved songs stay on
 * this device only.
 */

type PickerTab = 'all' | 'trending' | 'saved';

/** Every feel in the library, in the order the songs come, for the chips under the tabs */
const MOODS = [...new Set(MUSIC_TRACKS.map((t) => t.mood))];
/** How many songs at the top of the list load as the sheet opens, so the first taps sound at once */
const LOAD_AHEAD = 4;

interface MusicPickerProps {
  /** The song already under the clip */
  currentId: string | null;
  /** Plays a song with the clip (null stops it); resolves once it sounds, so the row can show it was loading */
  onHear: (track: MusicTrack | null) => Promise<void>;
  onPick: (track: MusicTrack) => void;
  onClose: () => void;
}

export function MusicPicker({ currentId, onHear, onPick, onClose }: MusicPickerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<PickerTab>('all');
  const [mood, setMood] = useState<string | null>(null);
  // The sheet opens only from a tap, never in the server HTML, so the device's list can be read straight away
  const [saved, setSaved] = useState<string[]>(readSavedSongs);
  const [uses, setUses] = useState<Record<string, number>>({});
  const [hearing, setHearing] = useState<string | null>(null);
  // The song still downloading after its tap
  const [loading, setLoading] = useState<string | null>(null);
  const tapTurn = useRef(0);
  useDialogBehavior(panel, onClose, { focusField: false });

  useEffect(() => {
    let live = true;
    fetch('/api/moments/music')
      .then((r) => r.json())
      .then((data) => live && data?.uses && setUses(data.uses))
      .catch(() => undefined);
    for (const t of MUSIC_TRACKS.slice(0, LOAD_AHEAD)) loadSong(t.src).catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const trending = useMemo(() => MUSIC_TRACKS.filter((t) => (uses[t.id] ?? 0) > 0).sort((a, b) => (uses[b.id] ?? 0) - (uses[a.id] ?? 0)), [uses]);
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase();
    const list = tab === 'trending' ? trending : tab === 'saved' ? MUSIC_TRACKS.filter((t) => saved.includes(t.id)) : MUSIC_TRACKS;
    return list.filter((t) => (!mood || t.mood === mood) && (!words || `${t.title} ${t.artist} ${t.mood}`.toLowerCase().includes(words)));
  }, [query, tab, saved, trending, mood]);
  const tabs: [PickerTab, string][] = [
    ['all', 'แนะนำ'],
    // Shown once any clip uses a song, so the tab is never an empty promise
    ...(trending.length ? ([['trending', 'มาแรง']] as [PickerTab, string][]) : []),
    ['saved', saved.length ? `บันทึกไว้ ${saved.length}` : 'บันทึกไว้'],
  ];

  const hear = async (track: MusicTrack) => {
    const turn = ++tapTurn.current;
    if (hearing === track.id) {
      setHearing(null);
      setLoading(null);
      return onHear(null);
    }
    setHearing(track.id);
    setLoading(track.id);
    await onHear(track);
    // A later tap owns the row state by now
    if (turn === tapTurn.current) setLoading(null);
  };
  const toggleSave = (id: string) => setSaved(toggleSavedSong(id));

  return (
    // A light veil and a sheet that stops near the middle: the clip stays in view while songs are tried (owner 2026-11-21)
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/15" onClick={onClose}>
      <div
        ref={panel}
        data-dialog-shell
        role="dialog"
        aria-modal="true"
        aria-labelledby="music-picker-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] h-[56%] min-h-[340px] flex flex-col bg-white rounded-t-3xl shadow-2xl outline-hidden"
      >
        <div className="shrink-0 px-4 pt-2 pb-2.5 space-y-2.5 border-b border-slate-100">
          <span className="block mx-auto w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <h3 id="music-picker-title" className="text-base font-bold text-slate-900">เลือกเพลง</h3>
            <button type="button" onClick={onClose} aria-label="ปิด" className="w-10 h-10 -mr-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="ค้นหาเพลง"
              placeholder="ค้นหาชื่อเพลง ศิลปิน หรืออารมณ์"
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-500 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5" role="tablist" aria-label="รายการเพลง">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`h-8 px-4 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${tab === id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* The feels as chips: with three dozen songs, the quickest way to the right one */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5" role="group" aria-label="อารมณ์เพลง">
            {[null, ...MOODS].map((m) => (
              <button
                key={m ?? 'all'}
                type="button"
                aria-pressed={mood === m}
                onClick={() => setMood(m)}
                className={`shrink-0 h-8 px-3.5 rounded-full border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${mood === m ? 'bg-blue-50 border-[#2563EB] text-[#1D4ED8]' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >
                {m ?? 'ทุกอารมณ์'}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 min-h-0 overflow-y-auto px-2 py-2" aria-label="เพลง">
          {shown.map((track) => {
            const on = hearing === track.id;
            const isSaved = saved.includes(track.id);
            return (
              <li key={track.id} className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${on ? 'bg-slate-50' : ''}`}>
                <button type="button" onClick={() => hear(track)} aria-pressed={on} aria-label={`${on ? 'หยุดฟัง' : 'ฟัง'} ${track.title}`} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]">
                  <SongTile track={track} playing={on} loading={loading === track.id} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <span className="truncate">{track.title}</span>
                      {currentId === track.id && <span className="shrink-0 text-[11px] font-bold text-[#1D4ED8]">ใช้อยู่</span>}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">
                      {track.artist} · {uses[track.id] ? clipUses(uses[track.id]) : track.mood} · {clipClock(track.durationS)}
                    </span>
                  </span>
                </button>
                {on ? (
                  <button type="button" onClick={() => onPick(track)} className="shrink-0 h-9 px-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap">
                    ใช้เพลงนี้
                  </button>
                ) : (
                  <span className="shrink-0 w-9 h-9 flex items-center justify-center text-slate-400" aria-hidden="true">
                    <Play className="w-4 h-4" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleSave(track.id)}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? `เลิกบันทึก ${track.title}` : `บันทึก ${track.title}`}
                  className="shrink-0 w-10 h-10 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-slate-900 text-slate-900' : ''}`} />
                </button>
              </li>
            );
          })}
          {shown.length === 0 && (
            <li className="m-2 bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-200 text-sm font-medium text-slate-600">
              {tab === 'saved' && !query ? 'แตะบุ๊กมาร์กข้างเพลงที่ชอบ แล้วเพลงจะมาอยู่ตรงนี้' : 'ไม่เจอเพลงนี้ ลองคำอื่นนะ'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/** The window's share of the strip: wide enough to grab with a thumb, whatever the clip's length */
const WINDOW_SHARE = 0.42;
/** One bar per this many pixels; capped so a short clip on a long song stays light to draw */
const BAR_PX = 5;
const MAX_BARS = 480;
/** The window settles this long after the waveform stops moving, then the clip and song start again from it */
const SETTLE_MS = 160;

interface SongRangeProps {
  track: MusicTrack;
  /** Where in the song the clip starts */
  startS: number;
  /** How long the clip is: the window covers this much of the song */
  clipS: number;
  /** Where the song is now, to draw the playhead; null when it is not playing */
  playingAtS: number | null;
  onChange: (startS: number) => void;
}

/**
 * Choosing the part of the song, as on Reels (BE-448): a fixed window in the middle and the song's waveform, enlarged,
 * slid under it with a finger. The window is the same width for any clip, so a 5 s clip on a 60 s song is as easy to
 * move as a 30 s one (the old window on the whole song was 25 px). With a mouse it drags; with the keyboard the arrow
 * keys move it a second at a time.
 */
export function SongRange({ track, startS, clipS, playingAtS, onChange }: SongRangeProps) {
  const outer = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseDrag = useRef<{ x: number; left: number } | null>(null);
  const [width, setWidth] = useState(0);
  // Where the window is while the member moves the waveform; null when it rests on `startS`
  const [live, setLive] = useState<number | null>(null);
  // Kept with the song and bar count they belong to, so another song shows flat bars until its own are ready
  const [drawn, setDrawn] = useState<{ key: string; peaks: number[] } | null>(null);

  const length = track.durationS;
  const fits = clipS >= length - 0.5;
  const max = fits ? 0 : length - clipS;
  const windowPx = fits ? width : Math.round(width * WINDOW_SHARE);
  const pps = windowPx / Math.max(0.1, fits ? length : clipS);
  const total = length * pps;
  const side = fits ? 0 : (width - windowPx) / 2;
  const bars = Math.max(1, Math.min(MAX_BARS, Math.floor(total / BAR_PX)));
  const key = `${track.src}|${bars}`;
  const peaks = drawn?.key === key ? drawn.peaks : [];
  const shown = Math.min(max, Math.max(0, live ?? startS));

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setWidth(el.clientWidth));
    watch.observe(el);
    setWidth(el.clientWidth);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    loadSong(track.src)
      .then((song) => alive && setDrawn({ key: `${track.src}|${bars}`, peaks: songPeaks(song, bars) }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [track.src, bars]);

  // The waveform follows a start chosen elsewhere (a new song starts at its best part), but never fights a finger
  useEffect(() => {
    const el = scroller.current;
    if (!el || live !== null || !pps) return;
    const want = Math.min(startS, max) * pps;
    if (Math.abs(el.scrollLeft - want) > 1) el.scrollLeft = want;
  }, [startS, pps, max, live]);

  useEffect(() => () => {
    if (settle.current) clearTimeout(settle.current);
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (!el || !pps || fits) return;
    const at = Math.min(max, Math.max(0, el.scrollLeft / pps));
    setLive(at);
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      setLive(null);
      const rounded = Math.round(at * 10) / 10;
      if (Math.abs(rounded - startS) >= 0.1) onChange(rounded);
    }, SETTLE_MS);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (fits || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    onChange(Math.min(max, Math.max(0, Math.round((startS + (e.key === 'ArrowRight' ? 1 : -1)) * 10) / 10)));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">เลือกท่อนเพลง</span>
        <span className="font-semibold text-slate-600 tabular-nums">
          {clipClock(shown)} – {clipClock(Math.min(length, shown + clipS))}
        </span>
      </div>
      <div ref={outer} className="relative h-14">
        <div
          ref={scroller}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse' || fits || !scroller.current) return;
            mouseDrag.current = { x: e.clientX, left: scroller.current.scrollLeft };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const drag = mouseDrag.current;
            if (drag && scroller.current) scroller.current.scrollLeft = drag.left - (e.clientX - drag.x);
          }}
          onPointerUp={() => (mouseDrag.current = null)}
          onPointerCancel={() => (mouseDrag.current = null)}
          tabIndex={fits ? -1 : 0}
          role="slider"
          aria-label="ท่อนเพลงที่ใช้"
          aria-valuemin={0}
          aria-valuemax={Math.round(max)}
          aria-valuenow={Math.round(shown)}
          aria-valuetext={`เริ่มที่ ${clipClock(shown)}`}
          className={`h-full rounded-xl bg-slate-50 overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${fits ? 'overflow-x-hidden' : 'overflow-x-auto cursor-grab active:cursor-grabbing touch-pan-x select-none'}`}
        >
          <div className="h-full flex items-center gap-[2px] py-2" style={{ width: total + side * 2, paddingLeft: side, paddingRight: side }} aria-hidden="true">
            {Array.from({ length: bars }, (_, i) => {
              const at = ((i + 0.5) / bars) * length;
              const inside = fits || (at >= shown && at <= shown + clipS);
              return <span key={i} className={`flex-1 min-w-px rounded-full ${inside ? 'bg-[#2563EB]' : 'bg-slate-300'}`} style={{ height: `${18 + (peaks[i] ?? 0.25) * 82}%` }} />;
            })}
          </div>
        </div>
        {/* The fixed window over the chosen part */}
        <div className="absolute inset-y-0 rounded-xl border-[3px] border-[#2563EB] bg-[#2563EB]/5 pointer-events-none" style={{ left: side, width: windowPx }} aria-hidden="true" />
        {playingAtS !== null && playingAtS >= shown && playingAtS <= shown + clipS && (
          <div className="absolute inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-slate-900 pointer-events-none" style={{ left: side + (playingAtS - shown) * pps }} aria-hidden="true" />
        )}
      </div>
      <p className="text-xs text-slate-500">{fits ? 'เพลงสั้นกว่าคลิป จะเล่นวนจนจบคลิป' : 'เลื่อนคลื่นเสียงใต้กรอบ เพื่อเลือกท่อนที่ชอบ'}</p>
    </div>
  );
}

