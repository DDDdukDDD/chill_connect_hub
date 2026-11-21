'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Play, Search, X } from 'lucide-react';
import { useDialogBehavior } from '@/components/auth/DialogShell';
import { clipClock } from '@/lib/media/clip';
import { MUSIC_TRACKS, type MusicTrack } from '@/lib/media/musicLibrary';
import { readSavedSongs, toggleSavedSong } from '@/lib/media/savedSongs';
import { SongPlayer, loadSong, songPeaks } from '@/lib/media/songPlayer';
import { SongTile, clipUses } from './SongBadge';

/**
 * Choosing a song for a clip, the way Reels does it (owner 2026-11-21, BE-446): a sheet over the editor with search,
 * แนะนำ, มาแรง (the songs most clips use) and บันทึกไว้, a tap to hear a song and "ใช้เพลงนี้" to put it under the
 * clip. Then SongRange picks the part of the song on its waveform. Saved songs stay on this device only.
 */

type PickerTab = 'all' | 'trending' | 'saved';

/** Every feel in the library, in the order the songs come, for the chips under the tabs */
const MOODS = [...new Set(MUSIC_TRACKS.map((t) => t.mood))];

interface MusicPickerProps {
  /** The song already under the clip */
  currentId: string | null;
  onPick: (track: MusicTrack) => void;
  onClose: () => void;
}

export function MusicPicker({ currentId, onPick, onClose }: MusicPickerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const player = useRef<SongPlayer | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<PickerTab>('all');
  const [mood, setMood] = useState<string | null>(null);
  // The sheet opens only from a tap, never in the server HTML, so the device's list can be read straight away
  const [saved, setSaved] = useState<string[]>(readSavedSongs);
  const [uses, setUses] = useState<Record<string, number>>({});
  const [hearing, setHearing] = useState<string | null>(null);
  useDialogBehavior(panel, onClose, { focusField: false });

  useEffect(() => {
    const own = new SongPlayer();
    player.current = own;
    let live = true;
    fetch('/api/moments/music')
      .then((r) => r.json())
      .then((data) => live && data?.uses && setUses(data.uses))
      .catch(() => undefined);
    return () => {
      live = false;
      own.stop();
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

  const hear = (track: MusicTrack) => {
    const own = player.current;
    if (!own) return;
    if (hearing === track.id) {
      own.stop();
      setHearing(null);
      return;
    }
    setHearing(track.id);
    void own.play(track.src, 0, 0.9);
  };
  const toggleSave = (id: string) => setSaved(toggleSavedSong(id));
  const pick = (track: MusicTrack) => {
    player.current?.stop();
    onPick(track);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        ref={panel}
        data-dialog-shell
        role="dialog"
        aria-modal="true"
        aria-labelledby="music-picker-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] h-[82%] flex flex-col bg-white rounded-t-3xl shadow-2xl outline-hidden"
      >
        <div className="shrink-0 px-4 pt-2.5 pb-3 space-y-3 border-b border-slate-100">
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
                  <SongTile track={track} playing={on} />
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
                  <button type="button" onClick={() => pick(track)} className="shrink-0 h-9 px-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap">
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

/** How many bars the waveform has; enough to look like a song, few enough to stay crisp on a phone */
const BARS = 56;

interface SongRangeProps {
  track: MusicTrack;
  /** Where in the song the clip starts */
  startS: number;
  /** How long the clip is: the width of the window on the waveform */
  clipS: number;
  /** Where the song is now, to draw the playhead; null when it is not playing */
  playingAtS: number | null;
  onChange: (startS: number) => void;
}

/**
 * The song as a waveform with a window as long as the clip; dragging the window chooses the part under the clip. The
 * window is the thumb of a range input, so it also works with the keyboard and a screen reader: its width is the
 * clip's share of the song, which makes the thumb's position match the start exactly.
 */
export function SongRange({ track, startS, clipS, playingAtS, onChange }: SongRangeProps) {
  // Kept with the song they belong to, so another song shows flat bars until its own are ready
  const [drawn, setDrawn] = useState<{ src: string; peaks: number[] } | null>(null);
  const peaks = drawn?.src === track.src ? drawn.peaks : [];
  const strip = useRef<HTMLDivElement>(null);
  // The thumb's width must be in pixels: a percentage there is not read against the input in every browser
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setWidth(el.clientWidth));
    watch.observe(el);
    setWidth(el.clientWidth);
    return () => watch.disconnect();
  }, []);
  useEffect(() => {
    let live = true;
    loadSong(track.src)
      .then((song) => live && setDrawn({ src: track.src, peaks: songPeaks(song, BARS) }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [track.src]);

  const length = track.durationS;
  const share = Math.min(1, clipS / length);
  const max = Math.max(0, length - Math.min(clipS, length));
  const from = startS / length;
  const to = from + share;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">เลือกท่อนเพลง</span>
        <span className="font-semibold text-slate-600 tabular-nums">
          {clipClock(startS)} – {clipClock(Math.min(length, startS + clipS))}
        </span>
      </div>
      <div ref={strip} className="relative h-14 rounded-xl bg-slate-50">
        <div className="absolute inset-x-1 inset-y-2 flex items-center gap-[2px]" aria-hidden="true">
          {Array.from({ length: BARS }, (_, i) => {
            const at = (i + 0.5) / BARS;
            const inside = at >= from && at <= to;
            return <span key={i} className={`flex-1 rounded-full ${inside ? 'bg-[#2563EB]' : 'bg-slate-300'}`} style={{ height: `${18 + (peaks[i] ?? 0.25) * 82}%` }} />;
          })}
        </div>
        {/* The window over the chosen part */}
        <div className="absolute inset-y-0 rounded-xl border-[3px] border-[#2563EB] bg-[#2563EB]/5 pointer-events-none" style={{ left: `${from * 100}%`, width: `${share * 100}%` }} aria-hidden="true" />
        {playingAtS !== null && (
          <div className="absolute inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-slate-900 pointer-events-none" style={{ left: `${(playingAtS / length) * 100}%` }} aria-hidden="true" />
        )}
        <input
          type="range"
          aria-label="ท่อนเพลงที่ใช้"
          aria-valuetext={`เริ่มที่ ${clipClock(startS)}`}
          min={0}
          max={max}
          step={0.1}
          value={Math.min(startS, max)}
          disabled={max === 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-grab active:cursor-grabbing disabled:cursor-default [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-14 [&::-webkit-slider-thumb]:w-[var(--window)] [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-14 [&::-moz-range-thumb]:w-[var(--window)] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 rounded-xl"
          style={{ ['--window' as string]: `${Math.max(24, share * width)}px` }}
        />
      </div>
      <p className="text-xs text-slate-500">{max === 0 ? 'เพลงสั้นกว่าคลิป จะเล่นวนจนจบคลิป' : 'ลากกรอบเพื่อเลือกท่อนที่ชอบ'}</p>
    </div>
  );
}
