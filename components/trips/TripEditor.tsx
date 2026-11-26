'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, ChevronLeft, Eye, EyeOff, ImagePlus, Loader2, MapPin, MessageCircle, MessageSquareText, Music, Pencil, Play, Plus, Star, Trash2, X } from 'lucide-react';
import { MomentsChrome } from '@/components/moments/MomentsChrome';
import { MusicPicker } from '@/components/moments/MusicPicker';
import { openLineShare } from '@/components/moments/lineInvite';
import { DEFAULT_MUSIC_VOLUME, findTrack, type MusicTrack } from '@/lib/media/musicLibrary';
import { TripPlayer } from '@/components/trips/TripPlayer';
import { HoldUntilBack, inputClass, VISIBILITY_OPTIONS, VisibilitySwitch } from '@/components/trips/TripCreate';
import { compressImage } from '@/lib/media/compressor';
import { photoUploadForm } from '@/lib/media/uploadPhoto';
import { readPhotoFacts } from '@/lib/media/exif';
import { optimizedImage } from '@/lib/optimizedImage';
import {
  itemPicture,
  localNow,
  MAX_ITEM_CAPTION,
  MAX_LEG_NOTE,
  MAX_TRIP_INTRO,
  MAX_TRIP_ITEMS,
  MAX_TRIP_TITLE,
  thaiDateRange,
  thaiShortDate,
  timeOf,
  suggestedLegs,
  tripParts,
  type TripItemView,
  type TripLeg,
  type TripView,
} from '@/lib/trips/story';

/**
 * /trips/[id]/edit (docs/TRIPS_PLAN.md): pick photos from the phone (time and place read from each file before it is
 * made small), name the days that had no location, pick the cover, hide or remove photos, publish.
 * Photos come first (owner 2026-11-27): the details entered on the create screen fold into one line, each photo shows
 * as soon as it is picked, and sub-trips are set from the photos' cities and save themselves.
 */

const UPLOAD_WORKERS = 3;
/** Small batches, so photos appear while the rest upload and little is lost if the page closes */
const SEND_EVERY = 4;
const PLACE_ROUNDS = 25;

type UploadState = { total: number; done: number; failed: number } | null;
type Pending = { key: string; file: File; preview: string; state: 'wait' | 'done' | 'failed' };

const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
const unhidden = (trip: TripView) => ({ ...trip, items: trip.items.map((i) => ({ ...i, hidden: false })) });

/** The photos' cities as sub-trips, kept inside the trip's days so the server accepts them */
function legsFromPhotos(trip: TripView) {
  return suggestedLegs(unhidden(trip))
    .map((leg) => ({ ...leg, from: leg.from < trip.startsOn ? trip.startsOn : leg.from, to: leg.to > trip.endsOn ? trip.endsOn : leg.to }))
    .filter((leg) => leg.from <= leg.to);
}

async function upload(file: File): Promise<{ url: string; ratio?: number }> {
  const small = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
  let ratio: number | undefined;
  try {
    const bitmap = await createImageBitmap(small);
    ratio = bitmap.height ? bitmap.width / bitmap.height : undefined;
    bitmap.close();
  } catch {
    ratio = undefined;
  }
  let lastError = 'อัปโหลดรูปไม่สำเร็จ';
  for (let attempt = 0; attempt < 3; attempt++) {
    const form = await photoUploadForm(small, 'trips');
    const json = await fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json()).catch(() => null);
    if (json?.success && json.url) return { url: json.url as string, ratio };
    lastError = json?.message || lastError;
    if (json?.message && !/บ่อยเกินไป/.test(json.message) && json.message !== 'อัปโหลดรูปไม่สำเร็จ') break;
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  throw new Error(lastError);
}

export function TripEditor({ initialTrip, autoPreview = false }: { initialTrip: TripView; autoPreview?: boolean }) {
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [uploading, setUploading] = useState<UploadState>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [naming, setNaming] = useState(false);
  const [busy, setBusy] = useState('');
  const [openItem, setOpenItem] = useState<TripItemView | null>(null);
  const [previewing, setPreviewing] = useState(autoPreview);
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [telling, setTelling] = useState(false);
  const [pickingSong, setPickingSong] = useState(false);
  const hearRef = useRef<HTMLAudioElement | null>(null);
  /** Plays a song while choosing (MusicPicker); null stops it */
  const hear = useCallback(async (track: MusicTrack | null) => {
    hearRef.current?.pause();
    if (!track) return;
    const audio = hearRef.current ?? new Audio();
    hearRef.current = audio;
    audio.src = track.src;
    audio.volume = DEFAULT_MUSIC_VOLUME;
    await audio.play().catch(() => undefined);
  }, []);
  // Remounts the sub-trip rows when they change from outside them (set from photos, trip dates moved)
  const [legsKey, setLegsKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const sent = useRef(new Set<string>());

  // Closing or reloading the page mid-upload loses the photos not sent yet: the browser asks first
  useEffect(() => {
    if (!uploading) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [uploading]);

  const refresh = useCallback(async (): Promise<TripView | null> => {
    const json = await fetch(`/api/trips/${trip.id}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    if (!json?.trip) return null;
    setTrip(json.trip as TripView);
    return json.trip as TripView;
  }, [trip.id]);

  const patch = useCallback(
    async (body: Record<string, unknown>, toast: (m: string) => void, done?: string): Promise<TripView | null> => {
      const json = await fetch(`/api/trips/${trip.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then((r) => r.json())
        .catch(() => null);
      if (!json?.success) {
        toast(json?.message || 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
        return null;
      }
      if (json.trip) setTrip(json.trip as TripView);
      if (done) toast(done);
      return (json.trip as TripView) ?? null;
    },
    [trip.id],
  );

  /** Names the photos' cities, then sets the sub-trips from them when the author has none yet */
  const nameCities = useCallback(
    async (toast: (m: string) => void) => {
      setNaming(true);
      for (let round = 0; round < PLACE_ROUNDS; round++) {
        const json = await fetch(`/api/trips/${trip.id}/places`, { method: 'POST' }).then((r) => r.json()).catch(() => null);
        if (!json?.success || !json.waiting) break;
      }
      const fresh = await refresh();
      if (fresh && fresh.legs.length === 0) {
        const legs = legsFromPhotos(fresh);
        if (legs.length > 1 && (await patch({ legs }, () => undefined))) {
          setLegsKey((k) => k + 1);
          toast(`แบ่งเป็น ${legs.length} ทริปย่อยตามเมืองในรูปแล้ว แก้ได้ด้านล่าง`);
        }
      }
      setNaming(false);
    },
    [trip.id, refresh, patch],
  );

  const addPhotos = async (picked: File[], toast: (m: string) => void) => {
    const room = MAX_TRIP_ITEMS - trip.items.length;
    const files = picked.filter((f) => f.type.startsWith('image/') && !sent.current.has(fileKey(f)));
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    if (files.length > room) toast(`ทริปหนึ่งมีได้ ${MAX_TRIP_ITEMS} รูป รอบนี้เพิ่มได้อีก ${room} รูป`);
    const queue = files.slice(0, Math.max(0, room));
    if (!queue.length) return;

    // Every picked photo shows at once, faded until it is in the trip
    setPending((list) => [
      ...list.filter((p) => p.state !== 'failed' || !queue.some((f) => fileKey(f) === p.key)),
      ...queue.map((file) => ({ key: fileKey(file), file, preview: URL.createObjectURL(file), state: 'wait' as const })),
    ]);
    const mark = (keys: string[], state: Pending['state']) => setPending((list) => list.map((p) => (keys.includes(p.key) ? { ...p, state } : p)));
    const drop = (keys: string[]) =>
      setPending((list) => {
        list.filter((p) => keys.includes(p.key)).forEach((p) => URL.revokeObjectURL(p.preview));
        return list.filter((p) => !keys.includes(p.key));
      });

    const state = { total: queue.length, done: 0, failed: 0 };
    setUploading({ ...state });
    let buffer: { key: string; item: Record<string, unknown> }[] = [];
    let reason = '';
    const flush = async () => {
      if (!buffer.length) return;
      const batch = buffer;
      buffer = [];
      const keys = batch.map((b) => b.key);
      const json = await fetch(`/api/trips/${trip.id}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: batch.map((b) => b.item) }) })
        .then((r) => r.json())
        .catch(() => null);
      if (!json?.success) {
        state.failed += batch.length;
        reason = json?.message || reason;
        keys.forEach((k) => sent.current.delete(k));
        mark(keys, 'failed');
        return;
      }
      await refresh();
      drop(keys);
    };

    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const file = queue[next++];
        const key = fileKey(file);
        try {
          const facts = await readPhotoFacts(file);
          const { url, ratio } = await upload(file);
          sent.current.add(key);
          mark([key], 'done');
          buffer.push({ key, item: { mediaUrl: url, ratio, takenLocal: facts.takenLocal, lat: facts.lat, lng: facts.lng } });
          if (buffer.length >= SEND_EVERY) await flush();
        } catch (error) {
          state.failed += 1;
          reason = error instanceof Error ? error.message : reason;
          mark([key], 'failed');
        }
        state.done += 1;
        setUploading({ ...state });
      }
    };
    await Promise.all(Array.from({ length: UPLOAD_WORKERS }, worker));
    await flush();
    setUploading(null);
    if (state.failed) toast(`เพิ่มไม่สำเร็จ ${state.failed} รูป${reason ? ` (${reason})` : ''}`);
    else toast(`เพิ่ม ${queue.length} รูปแล้ว`);
    void nameCities(toast);
  };

  const itemAction = async (item: TripItemView, body: Record<string, unknown> | 'delete', toast: (m: string) => void) => {
    setBusy(item.id);
    const res = await fetch(`/api/trips/${trip.id}/items/${item.id}`, {
      method: body === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      ...(body === 'delete' ? {} : { body: JSON.stringify(body) }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setBusy('');
    if (!json?.success) {
      toast(json?.message || 'ทำไม่สำเร็จ ลองอีกครั้งนะ');
      return;
    }
    await refresh();
    setOpenItem(null);
  };

  // Every day that has photos, hidden ones too; names come from the story so the editor shows what viewers will see
  const { days, partCount } = useMemo(() => {
    const parts = tripParts(unhidden(trip));
    const partOf = new Map(parts.flatMap((p) => p.chapters.map((c) => [c.day, { part: p, chapter: c }] as const)));
    const byDay = new Map<string, TripItemView[]>();
    for (const item of [...trip.items].sort((a, b) => a.takenLocal.localeCompare(b.takenLocal))) {
      const day = item.takenLocal.slice(0, 10);
      byDay.set(day, [...(byDay.get(day) ?? []), item]);
    }
    let lastPart = '';
    const list = [...byDay.entries()].map(([day, items]) => {
      const found = partOf.get(day);
      const startsPart = Boolean(found && found.part.id !== lastPart);
      if (found) lastPart = found.part.id;
      return { day, items, label: found?.chapter.label ?? thaiShortDate(day), part: found?.part, startsPart };
    });
    return { days: list, partCount: parts.length };
  }, [trip]);
  const suggestions = useMemo(() => legsFromPhotos(trip), [trip]);

  const outside = trip.items.filter((i) => i.takenLocal.slice(0, 10) < trip.startsOn || i.takenLocal.slice(0, 10) > trip.endsOn).length;
  const today = localNow().slice(0, 10);
  const going = today >= trip.startsOn && today <= trip.endsOn;
  const draft = trip.status !== 'published';
  const visibleCount = trip.items.filter((i) => !i.hidden).length;
  const failed = pending.filter((p) => p.state === 'failed');
  const visibilityLabel = VISIBILITY_OPTIONS.find((o) => o.value === trip.visibility)?.label ?? '';
  const song = findTrack(trip.musicId);
  const captioned = trip.items.filter((i) => !i.hidden && i.caption).length;

  return (
    <MomentsChrome>
      {({ showToast }) => {
        const publish = async () => {
          setBusy('publish');
          const ok = await patch({ status: 'published' }, showToast);
          setBusy('');
          if (ok) router.push(`/trips/${trip.id}?published=1`);
        };
        return (
        <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pt-10">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{trip.title}</h1>
            <Link
              href={`/trips/${trip.id}`}
              onClick={(e) => {
                if (uploading && !window.confirm('ยังเพิ่มรูปไม่เสร็จ ออกตอนนี้รูปที่เหลือจะไม่เข้าทริป')) e.preventDefault();
              }}
              className="mt-1.5 whitespace-nowrap text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
            >
              ดูหน้าทริป
            </Link>
          </div>

          {/* The details were just entered on the create screen: one line here, open to change them */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <span>{thaiDateRange(trip.startsOn, trip.endsOn)}</span>
            <span aria-hidden>·</span>
            <span>{trip.visibility === 'public' && trip.followersUntilBack ? 'ทุกคนเห็นหลังกลับ' : `${visibilityLabel}เห็น`}</span>
            <span aria-hidden>·</span>
            <span>{draft ? 'ร่าง' : 'เผยแพร่แล้ว'}</span>
            <button
              type="button"
              onClick={() => setEditingDetails((v) => !v)}
              aria-expanded={editingDetails}
              className="ml-1 inline-flex cursor-pointer items-center gap-1 font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
            >
              <Pencil className="size-3.5" aria-hidden /> {editingDetails ? 'ปิด' : 'แก้รายละเอียด'}
            </button>
          </div>

          {editingDetails && (
            <section className="mt-4 space-y-4 rounded-3xl bg-slate-50 p-4">
              <input
                defaultValue={trip.title}
                maxLength={MAX_TRIP_TITLE}
                aria-label="ชื่อทริป"
                className={`${inputClass} text-lg font-semibold`}
                onBlur={(e) => e.target.value.trim() !== trip.title && patch({ title: e.target.value }, showToast, 'บันทึกชื่อแล้ว')}
              />
              <textarea
                defaultValue={trip.intro}
                maxLength={MAX_TRIP_INTRO}
                rows={2}
                placeholder="เล่าสั้นๆ ว่าทริปนี้เป็นยังไง (ไม่ใส่ก็ได้)"
                aria-label="เกริ่นทริป"
                className={`${inputClass} resize-none text-sm`}
                onBlur={(e) => e.target.value.trim() !== trip.intro && patch({ intro: e.target.value }, showToast, 'บันทึกแล้ว')}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">วันเริ่ม</span>
                  <input
                    type="date"
                    defaultValue={trip.startsOn}
                    className={`${inputClass} mt-1`}
                    onBlur={async (e) => {
                      if (e.target.value && e.target.value !== trip.startsOn && (await patch({ startsOn: e.target.value }, showToast, 'บันทึกวันแล้ว'))) setLegsKey((k) => k + 1);
                    }}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">วันกลับ</span>
                  <input
                    type="date"
                    defaultValue={trip.endsOn}
                    className={`${inputClass} mt-1`}
                    onBlur={async (e) => {
                      if (e.target.value && e.target.value !== trip.endsOn && (await patch({ endsOn: e.target.value }, showToast, 'บันทึกวันแล้ว'))) setLegsKey((k) => k + 1);
                    }}
                  />
                </label>
              </div>
              <div>
                <VisibilitySwitch value={trip.visibility} onChange={(visibility) => patch({ visibility }, showToast)} />
                {trip.visibility === 'public' && <HoldUntilBack checked={trip.followersUntilBack} onChange={(followersUntilBack) => patch({ followersUntilBack }, showToast, followersUntilBack ? 'ระหว่างทริปเห็นเฉพาะผู้ติดตามแล้ว' : 'ทุกคนเห็นได้แล้ว')} />}
              </div>
            </section>
          )}

          {going && (
            <p className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1D4ED8]">
              กำลังอยู่ในทริป: โพสต์โมเมนต์จากหน้าแรก แล้วเปิด &ldquo;เพิ่มเข้าทริป&rdquo; รูปจะมาอยู่ที่นี่พร้อมเวลาและเมือง
            </p>
          )}

          <section className="mt-6 flex flex-wrap items-center gap-3 border-y border-slate-200 py-5">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos([...(e.target.files ?? [])], showToast)} />
            <button
              type="button"
              disabled={Boolean(uploading)}
              onClick={() => fileRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
              {uploading ? `กำลังเพิ่มรูป ${uploading.done}/${uploading.total}` : 'เพิ่มรูปจากเครื่อง'}
            </button>
            {visibleCount > 0 && (
              <button
                type="button"
                onClick={() => setPreviewing(true)}
                className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                <Play className="size-4" aria-hidden /> ดูเรื่อง
              </button>
            )}
            {visibleCount > 0 && (
              <button
                type="button"
                onClick={() => setTelling(true)}
                className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                <MessageSquareText className="size-4" aria-hidden /> เล่าทีละรูป
              </button>
            )}
            <div className="ml-auto">
              {draft ? (
                <button
                  type="button"
                  disabled={visibleCount === 0 || busy === 'publish' || Boolean(uploading)}
                  onClick={publish}
                  className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {busy === 'publish' && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {busy === 'publish' ? 'กำลังเผยแพร่…' : 'เผยแพร่'}
                </button>
              ) : (
                <button type="button" onClick={() => patch({ status: 'draft' }, showToast, 'เก็บเป็นร่างแล้ว')} className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
                  เก็บเป็นร่าง
                </button>
              )}
            </div>
          </section>

          {visibleCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <button
                type="button"
                onClick={() => setPickingSong(true)}
                className="inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-[#BE123C] transition hover:bg-rose-100"
              >
                <Music className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{song ? `${song.title} · ${song.artist}` : 'ใส่เพลงประกอบเรื่อง'}</span>
              </button>
              {song && (
                <button type="button" onClick={() => patch({ musicId: null }, showToast, 'เอาเพลงออกแล้ว')} className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
                  เอาเพลงออก
                </button>
              )}
              {captioned < visibleCount && <span className="text-xs text-slate-500">มีคำบรรยาย {captioned} จาก {visibleCount} รูป · เรื่องที่มีคำบรรยายน่าดูกว่ามาก</span>}
            </div>
          )}

          {trip.follows && draft && <SourcePlan source={trip.follows} />}

          <p className="mt-3 text-xs text-slate-500" aria-live="polite">
            {uploading
              ? 'อยู่หน้านี้จนกว่าจะเสร็จนะ รูปที่ขึ้นแล้วอยู่ในทริปแล้ว'
              : naming
                ? 'กำลังหาชื่อเมืองจากรูป…'
                : `${trip.items.length} รูป${trip.items.length ? ' · เรียงตามเวลาที่ถ่าย แตะรูปเพื่อแก้' : ''}`}
            {!uploading && outside > 0 && ` · ${outside} รูปอยู่นอกวันทริป`}
          </p>

          {pending.length > 0 && (
            <section className="mt-6" aria-label="รูปที่กำลังเพิ่ม">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-base font-bold text-slate-900">{uploading ? 'กำลังเพิ่มเข้าทริป' : `เพิ่มไม่สำเร็จ ${failed.length} รูป`}</h2>
                {!uploading && failed.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => addPhotos(failed.map((p) => p.file), showToast)}
                      className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      ลองอีกครั้ง
                    </button>
                    <button
                      type="button"
                      onClick={() => setPending((list) => (list.forEach((p) => URL.revokeObjectURL(p.preview)), []))}
                      className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      ข้ามไป
                    </button>
                  </>
                )}
              </div>
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {pending.map((p) => (
                  <li key={p.key} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <img src={p.preview} alt="" className={`size-full object-cover transition ${p.state === 'wait' ? 'opacity-45' : ''}`} />
                    <span className="absolute inset-0 flex items-center justify-center">
                      {p.state === 'wait' && <Loader2 className="size-6 animate-spin text-white drop-shadow" aria-label="กำลังเพิ่ม" />}
                      {p.state === 'done' && (
                        <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-emerald-600" aria-label="ขึ้นแล้ว">
                          <Check className="size-4" />
                        </span>
                      )}
                      {p.state === 'failed' && (
                        <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-rose-600" aria-label="ไม่สำเร็จ">
                          <AlertCircle className="size-4" />
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {days.length === 0 && pending.length === 0 && (
            <div className="mt-10 text-center">
              <p className="text-base font-semibold text-slate-900">ยังไม่มีรูปในทริปนี้</p>
              <p className="mt-1 text-sm text-slate-500">เลือกรูปทั้งทริปได้ทีเดียว ระบบจะเรียงตามเวลาที่ถ่าย แบ่งเป็นวัน และแบ่งทริปย่อยตามเมืองให้เอง</p>
            </div>
          )}

          {days.map(({ day, items, label, part, startsPart }) => (
            <section key={day} className={startsPart && partCount > 1 ? 'mt-12' : 'mt-8'}>
              {startsPart && partCount > 1 && part && (
                <div className="mb-4 border-t border-slate-200 pt-6">
                  <h2 className="text-xl font-bold text-slate-900">{part.city || 'ยังไม่รู้เมือง'}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ทริปย่อย {part.number} · {part.from === part.to ? thaiShortDate(part.from) : `${thaiShortDate(part.from)} – ${thaiShortDate(part.to)}`}
                    {part.id.startsWith('auto-') && ' · จากรูป ยังไม่ได้ตั้ง'}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                <h3 className="text-base font-bold text-slate-900">{label}</h3>
                <span className="pb-0.5 text-xs text-slate-500">{thaiShortDate(day)} · {items.length} รูป</span>
              </div>
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => setOpenItem(item)} className="group relative block w-full cursor-pointer" aria-label={`แก้รูปเวลา ${timeOf(item.takenLocal)}`}>
                      <span className={`relative block aspect-square overflow-hidden rounded-xl bg-slate-100 ${item.hidden ? 'opacity-40' : ''}`}>
                        <img src={optimizedImage(itemPicture(item), 320)} alt="" loading="lazy" className="size-full object-cover" />
                      </span>
                      <span className="absolute left-1.5 top-1.5 flex gap-1">
                        {trip.coverItemId === item.id && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-900">ปก</span>}
                        {item.hidden && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700">ซ่อน</span>}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[11px] tabular-nums text-white">{timeOf(item.takenLocal)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <LegsEditor
            key={legsKey}
            trip={trip}
            suggestions={suggestions}
            onSave={async (legs) => (await patch({ legs }, () => undefined))?.legs ?? null}
            onSaveError={showToast}
          />

          <section className="mt-16 border-t border-slate-200 pt-6">
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-700">ลบทริปนี้และรูปที่เลือกมาเพิ่มทั้งหมด? โมเมนต์ที่โพสต์ไว้ยังอยู่</p>
                <button
                  type="button"
                  onClick={async () => {
                    const json = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' }).then((r) => r.json()).catch(() => null);
                    if (json?.success) router.push('/myhub');
                    else showToast(json?.message || 'ลบไม่สำเร็จ');
                  }}
                  className="whitespace-nowrap rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  ลบทริป
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="whitespace-nowrap rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 text-sm font-medium text-rose-700 hover:underline">
                <Trash2 className="size-4" aria-hidden /> ลบทริปนี้
              </button>
            )}
          </section>

          {openItem && (
            <ItemSheet
              item={trip.items.find((i) => i.id === openItem.id) ?? openItem}
              isCover={trip.coverItemId === openItem.id}
              busy={busy === openItem.id}
              onClose={() => setOpenItem(null)}
              onCaption={(caption) => itemAction(openItem, { caption }, showToast)}
              onToggleHidden={(hidden) => itemAction(openItem, { hidden }, showToast)}
              onDelete={() => itemAction(openItem, 'delete', showToast)}
              onCover={async () => {
                await patch({ coverItemId: openItem.id }, showToast, 'ตั้งเป็นปกแล้ว');
                setOpenItem(null);
              }}
            />
          )}
          {pickingSong && (
            <MusicPicker
              currentId={trip.musicId ?? null}
              onHear={hear}
              onPick={async (track) => {
                void hear(null);
                setPickingSong(false);
                await patch({ musicId: track.id }, showToast, `ใส่เพลง ${track.title} แล้ว`);
              }}
              onClose={() => {
                void hear(null);
                setPickingSong(false);
              }}
            />
          )}
          {telling && (
            <CaptionFlow
              items={[...trip.items].filter((i) => !i.hidden).sort((a, b) => a.takenLocal.localeCompare(b.takenLocal))}
              onSave={async (item, caption) => {
                const json = await fetch(`/api/trips/${trip.id}/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caption }) })
                  .then((r) => r.json())
                  .catch(() => null);
                if (!json?.success) showToast(json?.message || 'บันทึกคำบรรยายไม่สำเร็จ');
                return Boolean(json?.success);
              }}
              onClose={() => {
                setTelling(false);
                void refresh();
              }}
            />
          )}
          {previewing && (
            <TripPlayer
              trip={{ ...trip, items: trip.items.filter((i) => !i.hidden) }}
              onClose={() => {
                setPreviewing(false);
                // Opened from a suggestion (?play=1): a reload should not open it again
                if (window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname);
              }}
              actions={
                draft && !uploading
                  ? {
                      onPublish: () => {
                        setPreviewing(false);
                        void publish();
                      },
                    }
                  : {}
              }
            />
          )}
        </main>
        );
      }}
    </MomentsChrome>
  );
}

function ItemSheet({
  item,
  isCover,
  busy,
  onClose,
  onCaption,
  onToggleHidden,
  onDelete,
  onCover,
}: {
  item: TripItemView;
  isCover: boolean;
  busy: boolean;
  onClose: () => void;
  onCaption: (caption: string) => void;
  onToggleHidden: (hidden: boolean) => void;
  onDelete: () => void;
  onCover: () => void;
}) {
  const [caption, setCaption] = useState(item.caption);
  const fromPost = Boolean(item.momentId);
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 sm:items-center" role="dialog" aria-modal="true" aria-label="แก้รูป" onClick={onClose}>
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-900">
            {thaiShortDate(item.takenLocal.slice(0, 10))} · {timeOf(item.takenLocal)}
            {item.city && <span className="font-normal text-slate-500"> · {item.city}</span>}
          </p>
          <button type="button" onClick={onClose} aria-label="ปิด" className="flex size-10 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl bg-slate-100">
          <img src={optimizedImage(itemPicture(item), 640)} alt="" className="max-h-[40dvh] w-full object-contain" />
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-900">คำบรรยายในเรื่อง</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={MAX_ITEM_CAPTION}
            rows={3}
            placeholder="รูปนี้มีเรื่องอะไร (ไม่ใส่ก็ได้)"
            className={`${inputClass} mt-2 resize-none text-sm`}
          />
        </label>
        <button
          type="button"
          disabled={busy || caption.trim() === item.caption}
          onClick={() => onCaption(caption)}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2563EB] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} บันทึกคำบรรยาย
        </button>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" disabled={busy || isCover || item.hidden} onClick={onCover} className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-slate-100 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400">
            <Star className="size-4" aria-hidden /> {isCover ? 'เป็นปกอยู่' : 'ตั้งเป็นปก'}
          </button>
          <button type="button" disabled={busy} onClick={() => onToggleHidden(!item.hidden)} className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-slate-100 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
            {item.hidden ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />} {item.hidden ? 'แสดงในเรื่อง' : 'ซ่อนจากเรื่อง'}
          </button>
        </div>
        <button type="button" disabled={busy} onClick={onDelete} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-rose-700 hover:underline">
          <Trash2 className="size-4" aria-hidden /> {fromPost ? 'เอาออกจากทริป (โมเมนต์ยังอยู่)' : 'ลบรูปนี้'}
        </button>
      </div>
    </div>
  );
}

/**
 * "เล่าทีละรูป" (owner 2026-11-27): one photo at a time with the caption box open, ถัดไป saves and moves on. Writing
 * captions one sheet at a time was slow, and a story without them is only photos and city names. Opens at the first
 * photo with no caption.
 */
function CaptionFlow({ items, onSave, onClose }: { items: TripItemView[]; onSave: (item: TripItemView, caption: string) => Promise<boolean>; onClose: () => void }) {
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((i) => !i.caption)));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>(() => Object.fromEntries(items.map((i) => [i.id, i.caption])));
  const [saving, setSaving] = useState(false);
  const item = items[index];
  if (!item) return null;
  const value = drafts[item.id] ?? saved[item.id] ?? '';
  const written = items.filter((i) => (saved[i.id] ?? '').trim()).length;

  const move = async (step: number) => {
    const text = value.trim();
    if (text !== (saved[item.id] ?? '').trim()) {
      setSaving(true);
      const ok = await onSave(item, text);
      setSaving(false);
      if (!ok) return;
      setSaved((s) => ({ ...s, [item.id]: text }));
    }
    const next = index + step;
    if (next >= items.length) onClose();
    else setIndex(Math.max(0, next));
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label="เล่าทีละรูป">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        <p className="text-sm text-white/80">
          รูป {index + 1} จาก {items.length} · มีคำบรรยาย {written} รูป
        </p>
        <button type="button" onClick={onClose} className="whitespace-nowrap rounded-full bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25">
          เสร็จ
        </button>
      </div>
      <div className="mx-4 h-1 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-white transition-all" style={{ width: `${((index + 1) / items.length) * 100}%` }} />
      </div>
      <div className="relative min-h-0 flex-1 px-4 py-3">
        <img src={optimizedImage(itemPicture(item), 1080)} alt="" className="size-full object-contain" />
        <span className="absolute bottom-5 left-6 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
          {thaiShortDate(item.takenLocal.slice(0, 10))} · {timeOf(item.takenLocal)}
          {item.city ? ` · ${item.city}` : ''}
        </span>
      </div>
      <div className="bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 text-slate-900">
        <textarea
          key={item.id}
          autoFocus
          value={value}
          onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
          maxLength={MAX_ITEM_CAPTION}
          rows={2}
          placeholder="รูปนี้มีเรื่องอะไร (ข้ามได้)"
          aria-label="คำบรรยายรูปนี้"
          className={`${inputClass} resize-none text-base`}
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={index === 0 || saving}
            onClick={() => move(-1)}
            aria-label="รูปก่อนหน้า"
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => move(1)}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#2563EB] text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-wait"
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {index === items.length - 1 ? 'บันทึกแล้วเสร็จ' : value.trim() ? 'บันทึก แล้วรูปถัดไป' : 'ข้าม ไปรูปถัดไป'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A trip planned from someone else's ("ไปตามรอย", owner 2026-11-27): before it has photos of its own, the source shows
 * as the plan, city by city with a few of its photos, and friends can be asked along in LINE.
 */
function SourcePlan({ source }: { source: NonNullable<TripView['follows']> }) {
  const [plan, setPlan] = useState<TripView | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/trips/${source.id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => live && json?.trip && setPlan(json.trip as TripView))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [source.id]);
  if (!plan) return null;
  const parts = tripParts(plan).filter((p) => p.city);
  const cities = [...new Set(parts.map((p) => p.city))];
  return (
    <section className="mt-6 rounded-3xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">แผนจากทริปของ {source.authorName}</p>
      <Link href={`/trips/${source.id}`} className="mt-0.5 block text-base font-bold text-slate-900 hover:underline">
        {source.title}
      </Link>
      <ol className="mt-3 space-y-3">
        {parts.map((part) => (
          <li key={part.id} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold tabular-nums text-slate-600">{part.number}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {part.city} <span className="font-normal text-slate-500">· {daysOf(part.from, part.to)} วัน</span>
              </p>
              {part.note && <p className="text-xs text-slate-600">{part.note}</p>}
              <div className="mt-1.5 flex gap-1.5">
                {part.chapters.flatMap((c) => c.items).slice(0, 4).map((i) => (
                  <img key={i.id} src={optimizedImage(itemPicture(i), 160)} alt="" loading="lazy" className="size-12 rounded-lg bg-slate-200 object-cover" />
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => openLineShare(`ไปเที่ยว${cities.length ? ` ${cities.join(' → ')}` : 'ทริปนี้'} ด้วยกันไหม? วางแผนตามทริปนี้อยู่\n${window.location.origin}/trips/${source.id}`)}
        className="mt-4 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-[#06C755] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#05B34C]"
      >
        <MessageCircle className="size-4" aria-hidden /> ชวนเพื่อนไปด้วยทาง LINE
      </button>
    </section>
  );
}

const daysOf = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;

type LegDraft = { id?: string; city: string; from: string; to: string; note?: string };
type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string } | { kind: 'needCity' };

/**
 * Sub-trips by city (owner 2026-11-26): a few rows for the whole trip, e.g. กว่างโจว 4–6, เซินเจิ้น 7–9, ฮ่องกง 10–13.
 * Every photo then belongs to the city of its day, with or without GPS. Set from the photos' cities on the first upload;
 * every change saves itself (owner 2026-11-27): a city when its box is left, dates and removals at once.
 */
function LegsEditor({
  trip,
  suggestions,
  onSave,
  onSaveError,
}: {
  trip: TripView;
  suggestions: Omit<TripLeg, 'id'>[];
  /** The saved legs (with their ids), or null when the server refused them */
  onSave: (legs: LegDraft[]) => Promise<TripLeg[] | null>;
  onSaveError: (message: string) => void;
}) {
  const [rows, setRowsState] = useState<LegDraft[]>(trip.legs);
  // The latest rows for a save on blur, which can come before the re-render of the last keystroke
  const latest = useRef(rows);
  const setRows = (list: LegDraft[]) => {
    latest.current = list;
    setRowsState(list);
  };
  const [status, setStatus] = useState<SaveState>({ kind: 'idle' });
  const plainOf = (list: LegDraft[]) => JSON.stringify(list.map(({ city, from, to, note }) => ({ city, from, to, note: note?.trim() || undefined })));
  const saved = useRef(plainOf(trip.legs));
  const suggestionDiffers = suggestions.length > 0 && JSON.stringify(suggestions) !== JSON.stringify(rows.map(({ city, from, to }) => ({ city, from, to })));

  const save = async (list: LegDraft[]) => {
    const clean = list.map((row) => ({ ...row, city: row.city.trim(), note: row.note?.trim() || undefined }));
    if (clean.some((row) => !row.city)) {
      setStatus({ kind: 'needCity' });
      return;
    }
    const plain = plainOf(clean);
    if (plain === saved.current) return;
    setStatus({ kind: 'saving' });
    const legs = await onSave(clean);
    if (!legs) {
      setStatus({ kind: 'error', message: 'บันทึกไม่สำเร็จ เช็กวันของแต่ละเมืองไม่ให้ซ้อนกันนะ' });
      onSaveError('บันทึกทริปย่อยไม่สำเร็จ');
      return;
    }
    saved.current = plainOf(legs);
    setRows(legs);
    setStatus({ kind: 'saved' });
  };
  const change = (i: number, patch: Partial<LegDraft>, now: boolean) => {
    const list = latest.current.map((row, j) => (j === i ? { ...row, ...patch } : row));
    setRows(list);
    if (now) void save(list);
  };
  const add = () => {
    const last = rows[rows.length - 1];
    const next = last ? addDays(last.to, 1) : trip.startsOn;
    const from = next > trip.endsOn ? trip.endsOn : next;
    setRows([...rows, { city: '', from, to: from }]);
    setStatus({ kind: 'idle' });
  };

  return (
    <section className="mt-14 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 className="text-base font-bold text-slate-900">ทริปย่อยตามเมือง</h2>
        <p className="text-xs text-slate-500" aria-live="polite">
          {status.kind === 'saving' && 'กำลังบันทึก…'}
          {status.kind === 'saved' && 'บันทึกแล้ว'}
          {status.kind === 'needCity' && 'ใส่ชื่อเมืองแล้วระบบบันทึกให้เอง'}
          {status.kind === 'error' && <span className="text-rose-700">{status.message}</span>}
        </p>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">ไปหลายเมือง แบ่งเป็นช่วงได้ รูปจะเข้าเมืองตามวันที่ถ่ายเอง แต่ละทริปย่อยมีลิงก์แชร์แยก ชื่อเมืองแก้ได้ตามที่เรียก</p>
      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
          {rows.map((row, i) => (
            <li key={row.id ?? `new-${i}`} className="flex gap-3 py-3">
              <span className="w-5 shrink-0 pt-2 text-center text-sm font-semibold tabular-nums text-slate-500">{i + 1}</span>
              <div className="min-w-0 flex-1 space-y-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:space-y-0">
                <input
                  value={row.city}
                  onChange={(e) => change(i, { city: e.target.value }, false)}
                  onBlur={() => void save(latest.current)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  maxLength={60}
                  placeholder="เมือง เช่น เซินเจิ้น"
                  aria-label={`เมืองของทริปย่อย ${i + 1}`}
                  className={`${inputClass} py-2 text-sm sm:flex-1`}
                />
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:w-80">
                  <input type="date" value={row.from} min={trip.startsOn} max={trip.endsOn} onChange={(e) => e.target.value && change(i, { from: e.target.value, ...(row.to < e.target.value ? { to: e.target.value } : {}) }, true)} aria-label={`วันแรกของทริปย่อย ${i + 1}`} className={`${inputClass} min-w-0 px-3 py-2 text-sm`} />
                  <span className="text-slate-400" aria-hidden>–</span>
                  <input type="date" value={row.to} min={row.from} max={trip.endsOn} onChange={(e) => e.target.value && change(i, { to: e.target.value }, true)} aria-label={`วันสุดท้ายของทริปย่อย ${i + 1}`} className={`${inputClass} min-w-0 px-3 py-2 text-sm`} />
                </div>
                <input
                  value={row.note ?? ''}
                  onChange={(e) => change(i, { note: e.target.value }, false)}
                  onBlur={() => void save(latest.current)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  maxLength={MAX_LEG_NOTE}
                  placeholder="ประโยคเดียวของเมืองนี้ เช่น เมืองที่เดินจนขาลาก (ไม่ใส่ก็ได้)"
                  aria-label={`ประโยคของทริปย่อย ${i + 1}`}
                  className={`${inputClass} py-2 text-sm sm:basis-full`}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const list = rows.filter((_, j) => j !== i);
                  setRows(list);
                  void save(list);
                }}
                aria-label={`ลบทริปย่อย ${i + 1}`}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={add} className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
          <Plus className="size-4" aria-hidden /> เพิ่มทริปย่อย
        </button>
        {suggestionDiffers && (
          <button
            type="button"
            onClick={() => {
              const list = suggestions.map((s) => ({ ...s }));
              setRows(list);
              void save(list);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            <MapPin className="size-4" aria-hidden /> ตั้งตามเมืองในรูป
          </button>
        )}
      </div>
    </section>
  );
}

function addDays(day: string, n: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}
