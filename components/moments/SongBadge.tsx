'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Music, Pause, Play } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { findTrack, type MusicTrack } from '@/lib/media/musicLibrary';
import { readSavedSongs, toggleSavedSong } from '@/lib/media/savedSongs';
import { SongPlayer } from '@/lib/media/songPlayer';
import { optimizedImage } from '@/lib/optimizedImage';

/** "ใช้ใน 1.2K คลิป": short counts, the way the big apps write them */
export const clipUses = (n: number) => `ใช้ใน ${n >= 1000 ? `${Math.round(n / 100) / 10}K` : n} คลิป`;

/**
 * The song on a clip (owner 2026-11-21, BE-446: "no less than IG or TikTok, cuter if we can"). A small record spins and
 * notes rise from it while the clip plays, and the song's name slides by; still for people who turn motion off. A tap
 * opens the song's sheet: the record slides out of its sleeve, it can be heard and saved for one's own next clip, and
 * the other clips that use it are listed.
 */

/** Each feel has its own colour: the sleeve in the sheet and the picker, and the label in the middle of the record */
const MOODS: Record<string, { tile: string; label: string }> = {
  ฟีลกู๊ด: { tile: 'bg-[#FFF3C4] text-[#8A6100]', label: 'bg-[#FFC93C]' },
  แดนซ์: { tile: 'bg-[#FCE1F0] text-[#A3245F]', label: 'bg-[#F0559A]' },
  ผจญภัย: { tile: 'bg-[#DDF0FB] text-[#1E5F8A]', label: 'bg-[#3BA3DD]' },
  ชิล: { tile: 'bg-[#DCEFE6] text-[#1F6B4F]', label: 'bg-[#34A57F]' },
  สนุก: { tile: 'bg-[#FFE7D6] text-[#B4471A]', label: 'bg-[#FF8A4C]' },
  อบอุ่น: { tile: 'bg-[#FDF0D5] text-[#8A5A12]', label: 'bg-[#F2B53A]' },
  โลไฟ: { tile: 'bg-[#E6E4F7] text-[#4B3F99]', label: 'bg-[#8B7CF6]' },
};
const moodOf = (mood: string) => MOODS[mood] ?? { tile: 'bg-slate-100 text-slate-600', label: 'bg-slate-400' };

/** A song's square, in place of album art (the library has none); its record spins while it plays */
export function SongTile({ track, playing = false, size = 'md' }: { track: MusicTrack; playing?: boolean; size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  return (
    <span className={`relative shrink-0 ${box} rounded-xl ${moodOf(track.mood).tile} flex items-center justify-center overflow-hidden`} aria-hidden="true">
      {playing ? <Vinyl track={track} spinning px={size === 'sm' ? 28 : 34} /> : <Music className="w-5 h-5" />}
    </span>
  );
}

/** A record drawn with flat shapes: black disc, one groove, the song's colour as the label */
export function Vinyl({ track, spinning = false, px }: { track: MusicTrack; spinning?: boolean; px: number }) {
  return (
    <span
      className={`relative block shrink-0 rounded-full bg-slate-900 ring-1 ring-white/30 ${spinning ? 'motion-safe:animate-[spin_3.2s_linear_infinite]' : ''}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      <span className="absolute inset-[16%] rounded-full border border-white/15" />
      <span className={`absolute inset-[31%] rounded-full ${moodOf(track.mood).label}`} />
      <span className="absolute left-[38%] top-[38%] w-[9%] h-[9%] rounded-full bg-white/70" />
      <span className="absolute inset-[46%] rounded-full bg-slate-900" />
    </span>
  );
}

/** The name slides by while the clip plays; still, it is cut with an ellipsis */
function Marquee({ text, running }: { text: string; running: boolean }) {
  return (
    <span className={`relative min-w-0 overflow-hidden text-xs font-semibold whitespace-nowrap ${running ? 'motion-safe:[mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]' : ''}`}>
      <span className={`flex gap-8 ${running ? 'motion-safe:w-max motion-safe:animate-song-marquee' : ''}`}>
        <span className={running ? 'motion-reduce:truncate' : 'truncate'}>{text}</span>
        {running && (
          <span className="motion-reduce:hidden" aria-hidden="true">
            {text}
          </span>
        )}
      </span>
    </span>
  );
}

interface SongBadgeProps {
  musicId: string;
  /** The clip is playing: the record spins and the name slides */
  playing: boolean;
  /** A pill over the clip's corner (feeds), or a quiet line under the author's name (full screen) */
  variant?: 'pill' | 'line';
  className?: string;
}

/** The pill itself, on a post's clip and in the clip editor (where a tap changes the song instead) */
export function SongPill({ track, playing, onClick, label, variant = 'pill', className = 'absolute z-10 bottom-3 left-3' }: { track: MusicTrack; playing: boolean; onClick: () => void; label: string; variant?: 'pill' | 'line'; className?: string }) {
  // 'line': one quiet line under the author's name on a full-screen clip, as Reels does it (owner 2026-11-21)
  const shape =
    variant === 'line'
      ? 'h-6 max-w-[min(75%,16rem)] text-white/90 hover:text-white'
      : 'h-9 max-w-[min(70%,15rem)] pl-1.5 pr-3.5 rounded-full bg-black/45 backdrop-blur-sm text-white hover:bg-black/60';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={`flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white ${shape} ${className}`}
    >
      <span className="relative shrink-0">
        <Vinyl track={track} spinning={playing} px={variant === 'line' ? 18 : 24} />
        {playing && (
          <span className="motion-reduce:hidden" aria-hidden="true">
            <Music className="absolute -top-1 left-3 w-2.5 h-2.5 opacity-0 motion-safe:animate-song-note" />
            <Music className="absolute -top-1 left-1 w-2 h-2 opacity-0 motion-safe:animate-song-note [animation-delay:1.2s] [--drift:-5px]" />
          </span>
        )}
      </span>
      <Marquee text={`${track.title} · ${track.artist}`} running={playing} />
    </button>
  );
}

/** The pill on a post's clip, opening the song's sheet; nothing for a song no longer in the library */
export function SongBadge({ musicId, playing, variant, className }: SongBadgeProps) {
  const track = findTrack(musicId);
  const [open, setOpen] = useState(false);
  if (!track) return null;
  return (
    <>
      <SongPill track={track} playing={playing} onClick={() => setOpen(true)} label={`เพลง ${track.title} โดย ${track.artist}`} variant={variant} className={className} />
      {open && <SongSheet track={track} onClose={() => setOpen(false)} />}
    </>
  );
}

type ClipCard = { id: string; images: string[] };

/** The song's own sheet: listen, save for one's own clip, and the clips that use it */
function SongSheet({ track, onClose }: { track: MusicTrack; onClose: () => void }) {
  const player = useRef<SongPlayer | null>(null);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState(() => readSavedSongs().includes(track.id));
  const [clips, setClips] = useState<ClipCard[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const own = new SongPlayer();
    player.current = own;
    let live = true;
    fetch(`/api/moments?music=${encodeURIComponent(track.id)}&media=clip&limit=12`)
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setClips(Array.isArray(data?.moments) ? data.moments : []);
        setTotal(typeof data?.pagination?.totalCount === 'number' ? data.pagination.totalCount : null);
      })
      .catch(() => live && setClips([]));
    return () => {
      live = false;
      own.stop();
    };
  }, [track.id]);

  const listen = () => {
    const own = player.current;
    if (!own) return;
    if (listening) {
      own.stop();
      return setListening(false);
    }
    // The clip behind would sing along with its own copy of the song
    document.querySelectorAll('video').forEach((v) => v.pause());
    setListening(true);
    void own.play(track.src, 0, 0.9);
  };

  return (
    <DialogShell onClose={onClose} size="md" layer="top" bare labelledBy="song-sheet-title" focusField={false}>
      <div className="overflow-y-auto p-5 sm:p-7">
        <div className="flex items-center gap-5 pr-10">
          {/* The sleeve, with the record sliding out of it while the song plays */}
          <div className="relative shrink-0 w-[124px] h-24" aria-hidden="true">
            <span className={`absolute top-1 left-0 transition-transform duration-500 ease-out ${listening ? 'translate-x-[36px]' : 'translate-x-[20px]'}`}>
              <Vinyl track={track} spinning={listening} px={88} />
            </span>
            <span className={`absolute inset-y-0 left-0 w-24 rounded-2xl ${moodOf(track.mood).tile} shadow-sm flex items-center justify-center`}>
              <Music className="w-9 h-9" />
            </span>
          </div>
          <div className="min-w-0">
            <h2 id="song-sheet-title" className="text-lg sm:text-xl font-bold text-slate-900 truncate">{track.title}</h2>
            <p className="text-sm text-slate-600 truncate">{track.artist}</p>
            <p className="mt-1 text-xs text-slate-500">{total ? `${clipUses(total)} · ${track.mood}` : track.mood}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={listen} aria-pressed={listening} className={dialogButton.quiet}>
            {listening ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
            {listening ? 'หยุดฟัง' : 'ฟังเพลง'}
          </button>
          <button type="button" onClick={() => setSaved(toggleSavedSong(track.id).includes(track.id))} aria-pressed={saved} className={saved ? dialogButton.quiet : dialogButton.primary}>
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
            {saved ? 'บันทึกแล้ว' : 'บันทึกเพลง'}
          </button>
        </div>
        <p className="mt-2.5 text-center text-xs text-slate-500">
          {saved ? 'ตอนใส่เพลงในคลิป เพลงนี้จะอยู่ในแท็บ บันทึกไว้' : 'บันทึกไว้ แล้วหยิบมาใส่คลิปของคุณได้ทีหลัง'}
        </p>

        <h3 className="mt-6 text-base font-bold text-slate-900">คลิปที่ใช้เพลงนี้</h3>
        {clips === null ? (
          <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => <span key={i} className="aspect-[9/16] rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : clips.length === 0 ? (
          <p className="mt-3 bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-200 text-sm font-medium text-slate-600">ยังไม่มีคลิปอื่นใช้เพลงนี้ คุณอาจเป็นคนแรก</p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {clips.map((clip) => (
              <li key={clip.id}>
                <Link href={`/moments/${clip.id}`} onClick={onClose} className="relative block aspect-[9/16] overflow-hidden rounded-xl bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]">
                  {clip.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element -- small covers from our own storage, sized by optimizedImage
                    <img src={optimizedImage(clip.images[0], 256)} alt="คลิปที่ใช้เพลงนี้" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <Play className="absolute bottom-1.5 left-1.5 w-4 h-4 text-white fill-white drop-shadow" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DialogShell>
  );
}
