'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AudioLines, Bookmark, Loader2, Music, Pause, Play } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { findTrack, type MusicTrack } from '@/lib/media/musicLibrary';
import { readSavedSongs, toggleSavedSong } from '@/lib/media/savedSongs';
import { SongPlayer, loadSong, songHook } from '@/lib/media/songPlayer';
import { optimizedImage } from '@/lib/optimizedImage';

/** "ใช้ใน 1.2K คลิป": short counts, the way the big apps write them */
export const clipUses = (n: number) => `ใช้ใน ${n >= 1000 ? `${Math.round(n / 100) / 10}K` : n} คลิป`;

/**
 * The song on a clip (owner 2026-11-21, BE-446): one small line, a note and "song · artist", as Reels shows it. The
 * owner chose this over a spinning record with a sliding name: quieter over someone's clip. A tap opens the song's
 * sheet, where it can be heard and saved for one's own next clip, with the other clips that use it.
 */

/** Each feel has its own colour, for the song's square in the picker and the sheet */
const MOODS: Record<string, string> = {
  ฟีลกู๊ด: 'bg-[#FFF3C4] text-[#8A6100]',
  แดนซ์: 'bg-[#FCE1F0] text-[#A3245F]',
  ผจญภัย: 'bg-[#DDF0FB] text-[#1E5F8A]',
  ชิล: 'bg-[#DCEFE6] text-[#1F6B4F]',
  สนุก: 'bg-[#FFE7D6] text-[#B4471A]',
  อบอุ่น: 'bg-[#FDF0D5] text-[#8A5A12]',
  โลไฟ: 'bg-[#E6E4F7] text-[#4B3F99]',
};
const tileOf = (mood: string) => MOODS[mood] ?? 'bg-slate-100 text-slate-600';

/** A song's square, in place of album art (the library has none); a spinner while it downloads, sound bars as it plays */
export function SongTile({ track, playing = false, loading = false, size = 'md' }: { track: MusicTrack; playing?: boolean; loading?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-20 h-20 rounded-2xl' : size === 'sm' ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-xl';
  const icon = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <span className={`shrink-0 ${box} ${tileOf(track.mood)} flex items-center justify-center`} aria-hidden="true">
      {loading ? <Loader2 className={`${icon} animate-spin`} /> : playing ? <AudioLines className={`${icon} motion-safe:animate-pulse`} /> : <Music className={icon} />}
    </span>
  );
}

interface SongBadgeProps {
  musicId: string;
  className?: string;
}

/**
 * The song's line itself, on a post's clip and in the clip editor (where a tap changes the song instead). White with a
 * soft shadow, so it reads on any picture without a box behind it.
 */
export function SongPill({ track, onClick, label, className = 'absolute z-10 bottom-3 left-3' }: { track: MusicTrack; onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={`flex items-center gap-1.5 h-7 max-w-[min(75%,16rem)] text-white/95 hover:text-white text-xs font-semibold [text-shadow:0_1px_3px_rgb(0_0_0/0.6)] cursor-pointer rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white ${className}`}
    >
      <Music className="w-3.5 h-3.5 shrink-0 drop-shadow" aria-hidden="true" />
      <span className="truncate">
        {track.title} · {track.artist}
      </span>
    </button>
  );
}

/** The song's line on a post's clip, opening the song's sheet; nothing for a song no longer in the library */
export function SongBadge({ musicId, className }: SongBadgeProps) {
  const track = findTrack(musicId);
  const [open, setOpen] = useState(false);
  if (!track) return null;
  return (
    <>
      <SongPill track={track} onClick={() => setOpen(true)} label={`เพลง ${track.title} โดย ${track.artist}`} className={className} />
      {open && <SongSheet track={track} onClose={() => setOpen(false)} />}
    </>
  );
}

type ClipCard = { id: string; images: string[] };

/** The song's own sheet: listen, save for one's own clip, and the clips that use it */
function SongSheet({ track, onClose }: { track: MusicTrack; onClose: () => void }) {
  const player = useRef<SongPlayer | null>(null);
  const [listening, setListening] = useState(false);
  const [loadingSong, setLoadingSong] = useState(false);
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
    setLoadingSong(true);
    // From the song's best part, as the editor starts it (BE-448)
    void loadSong(track.src)
      .then((song) => own.play(track.src, songHook(song, 15), 0.9))
      .catch(() => undefined)
      .finally(() => setLoadingSong(false));
  };

  return (
    <DialogShell onClose={onClose} size="md" layer="top" bare labelledBy="song-sheet-title" focusField={false}>
      <div className="overflow-y-auto p-5 sm:p-7">
        <div className="flex items-center gap-4 pr-10">
          <SongTile track={track} playing={listening} loading={loadingSong} size="lg" />
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
