'use client';
/* eslint-disable @next/next/no-img-element -- member photos load their phone-made small copy through optimizedImage, not the paid image optimizer */

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ImagePlus, Loader2, MapPin, Play, Plus, Star, Trash2, X } from 'lucide-react';
import { MomentsChrome } from '@/components/moments/MomentsChrome';
import { TripPlayer } from '@/components/trips/TripPlayer';
import { inputClass, VisibilitySwitch } from '@/components/trips/TripCreate';
import { compressImage } from '@/lib/media/compressor';
import { photoUploadForm } from '@/lib/media/uploadPhoto';
import { readPhotoFacts } from '@/lib/media/exif';
import { optimizedImage } from '@/lib/optimizedImage';
import {
  itemPicture,
  localNow,
  MAX_ITEM_CAPTION,
  MAX_TRIP_INTRO,
  MAX_TRIP_ITEMS,
  MAX_TRIP_TITLE,
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
 */

const UPLOAD_WORKERS = 3;
const SEND_EVERY = 10;
const PLACE_ROUNDS = 25;

type UploadState = { total: number; done: number; failed: number } | null;

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

export function TripEditor({ initialTrip }: { initialTrip: TripView }) {
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [uploading, setUploading] = useState<UploadState>(null);
  const [naming, setNaming] = useState(false);
  const [busy, setBusy] = useState('');
  const [openItem, setOpenItem] = useState<TripItemView | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sent = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    const json = await fetch(`/api/trips/${trip.id}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    if (json?.trip) setTrip(json.trip as TripView);
  }, [trip.id]);

  const patch = useCallback(
    async (body: Record<string, unknown>, toast: (m: string) => void, done?: string) => {
      const json = await fetch(`/api/trips/${trip.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then((r) => r.json())
        .catch(() => null);
      if (!json?.success) {
        toast(json?.message || 'บันทึกไม่สำเร็จ ลองอีกครั้งนะ');
        return false;
      }
      if (json.trip) setTrip(json.trip as TripView);
      if (done) toast(done);
      return true;
    },
    [trip.id],
  );

  const nameCities = useCallback(async () => {
    setNaming(true);
    for (let round = 0; round < PLACE_ROUNDS; round++) {
      const json = await fetch(`/api/trips/${trip.id}/places`, { method: 'POST' }).then((r) => r.json()).catch(() => null);
      if (!json?.success || !json.waiting) break;
    }
    await refresh();
    setNaming(false);
  }, [trip.id, refresh]);

  const addPhotos = async (picked: FileList | null, toast: (m: string) => void) => {
    const room = MAX_TRIP_ITEMS - trip.items.length;
    const files = [...(picked ?? [])].filter((f) => f.type.startsWith('image/') && !sent.current.has(`${f.name}:${f.size}:${f.lastModified}`));
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    if (files.length > room) toast(`ทริปหนึ่งมีได้ ${MAX_TRIP_ITEMS} รูป รอบนี้เพิ่มได้อีก ${room} รูป`);
    const queue = files.slice(0, Math.max(0, room));
    if (!queue.length) return;

    const state = { total: queue.length, done: 0, failed: 0 };
    setUploading({ ...state });
    let buffer: Record<string, unknown>[] = [];
    let reason = '';
    const flush = async () => {
      if (!buffer.length) return;
      const items = buffer;
      buffer = [];
      const json = await fetch(`/api/trips/${trip.id}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
        .then((r) => r.json())
        .catch(() => null);
      if (!json?.success) {
        state.failed += items.length;
        reason = json?.message || reason;
      }
    };

    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const file = queue[next++];
        try {
          const facts = await readPhotoFacts(file);
          const { url, ratio } = await upload(file);
          sent.current.add(`${file.name}:${file.size}:${file.lastModified}`);
          buffer.push({ mediaUrl: url, ratio, takenLocal: facts.takenLocal, lat: facts.lat, lng: facts.lng });
          if (buffer.length >= SEND_EVERY) await flush();
        } catch (error) {
          state.failed += 1;
          reason = error instanceof Error ? error.message : reason;
        }
        state.done += 1;
        setUploading({ ...state });
      }
    };
    await Promise.all(Array.from({ length: UPLOAD_WORKERS }, worker));
    await flush();
    setUploading(null);
    await refresh();
    if (state.failed) toast(`เพิ่มไม่สำเร็จ ${state.failed} รูป${reason ? ` (${reason})` : ''}`);
    else toast(`เพิ่ม ${queue.length} รูปแล้ว`);
    void nameCities();
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
    const parts = tripParts({ ...trip, items: trip.items.map((i) => ({ ...i, hidden: false })) });
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
  const suggestions = useMemo(() => suggestedLegs({ ...trip, items: trip.items.map((i) => ({ ...i, hidden: false })) }), [trip]);

  const outside = trip.items.filter((i) => i.takenLocal.slice(0, 10) < trip.startsOn || i.takenLocal.slice(0, 10) > trip.endsOn).length;
  const today = localNow().slice(0, 10);
  const going = today >= trip.startsOn && today <= trip.endsOn;
  const draft = trip.status !== 'published';
  const visibleCount = trip.items.filter((i) => !i.hidden).length;

  return (
    <MomentsChrome>
      {({ showToast }) => (
        <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pt-10">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">แก้ไขทริป</h1>
            <Link href={`/trips/${trip.id}`} className="whitespace-nowrap text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline">
              ดูหน้าทริป
            </Link>
          </div>

          <section className="mt-6 space-y-4">
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
                <input type="date" defaultValue={trip.startsOn} className={`${inputClass} mt-1`} onBlur={(e) => e.target.value && e.target.value !== trip.startsOn && patch({ startsOn: e.target.value }, showToast, 'บันทึกวันแล้ว')} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">วันกลับ</span>
                <input type="date" defaultValue={trip.endsOn} className={`${inputClass} mt-1`} onBlur={(e) => e.target.value && e.target.value !== trip.endsOn && patch({ endsOn: e.target.value }, showToast, 'บันทึกวันแล้ว')} />
              </label>
            </div>
            <VisibilitySwitch value={trip.visibility} onChange={(visibility) => patch({ visibility }, showToast)} />
          </section>

          <LegsEditor
            key={JSON.stringify(trip.legs)}
            trip={trip}
            suggestions={suggestions}
            onSave={(legs) => patch({ legs }, showToast, 'บันทึกทริปย่อยแล้ว')}
          />

          {going && (
            <p className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1D4ED8]">
              กำลังอยู่ในทริป: โพสต์โมเมนต์จากหน้าแรก แล้วเปิด &ldquo;เพิ่มเข้าทริป&rdquo; รูปจะมาอยู่ที่นี่พร้อมเวลาและเมือง
            </p>
          )}

          <section className="mt-8 flex flex-wrap items-center gap-3 border-y border-slate-200 py-5">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files, showToast)} />
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
            <div className="ml-auto">
              {draft ? (
                <button
                  type="button"
                  disabled={visibleCount === 0 || busy === 'publish'}
                  onClick={async () => {
                    setBusy('publish');
                    const ok = await patch({ status: 'published' }, showToast, 'เผยแพร่แล้ว');
                    setBusy('');
                    if (ok) router.push(`/trips/${trip.id}`);
                  }}
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

          <p className="mt-3 text-xs text-slate-500" aria-live="polite">
            {naming ? 'กำลังหาชื่อเมืองจากรูป…' : `${trip.items.length} รูป${trip.items.length ? ' · เรียงตามเวลาที่ถ่าย แตะรูปเพื่อแก้' : ''}`}
            {outside > 0 && ` · ${outside} รูปอยู่นอกวันทริป`}
          </p>

          {days.length === 0 && !uploading && (
            <div className="mt-10 text-center">
              <p className="text-base font-semibold text-slate-900">ยังไม่มีรูปในทริปนี้</p>
              <p className="mt-1 text-sm text-slate-500">เลือกรูปทั้งทริปได้ทีเดียว ระบบจะเรียงตามเวลาที่ถ่ายและแบ่งเป็นวันให้เอง</p>
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
          {previewing && <TripPlayer trip={{ ...trip, items: trip.items.filter((i) => !i.hidden) }} onClose={() => setPreviewing(false)} />}
        </main>
      )}
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

type LegDraft = { id?: string; city: string; from: string; to: string };

/**
 * Sub-trips by city (owner 2026-11-26): a few rows for the whole trip, e.g. กว่างโจว 4–6, เซินเจิ้น 7–9, ฮ่องกง 10–13.
 * Every photo then belongs to the city of its day, with or without GPS. "ตามเมืองในรูป" fills the rows from the photos.
 */
function LegsEditor({ trip, suggestions, onSave }: { trip: TripView; suggestions: Omit<TripLeg, 'id'>[]; onSave: (legs: LegDraft[]) => Promise<boolean> }) {
  const [rows, setRows] = useState<LegDraft[]>(trip.legs);
  const [saving, setSaving] = useState(false);
  const changed = JSON.stringify(rows) !== JSON.stringify(trip.legs);
  const suggestionDiffers = suggestions.length > 0 && JSON.stringify(suggestions) !== JSON.stringify(rows.map(({ city, from, to }) => ({ city, from, to })));
  const set = (i: number, change: Partial<LegDraft>) => setRows((list) => list.map((row, j) => (j === i ? { ...row, ...change } : row)));
  const add = () => {
    const last = rows[rows.length - 1];
    const next = last ? addDays(last.to, 1) : trip.startsOn;
    const from = next > trip.endsOn ? trip.endsOn : next;
    setRows([...rows, { city: '', from, to: from }]);
  };

  return (
    <section className="mt-8">
      <h2 className="text-base font-bold text-slate-900">ทริปย่อยตามเมือง</h2>
      <p className="mt-0.5 text-xs text-slate-500">ไปหลายเมือง แบ่งเป็นช่วงได้ รูปจะเข้าเมืองตามวันที่ถ่ายเอง แต่ละทริปย่อยมีลิงก์แชร์แยก</p>
      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
          {rows.map((row, i) => (
            <li key={row.id ?? `new-${i}`} className="flex gap-3 py-3">
              <span className="w-5 shrink-0 pt-2 text-center text-sm font-semibold tabular-nums text-slate-500">{i + 1}</span>
              <div className="min-w-0 flex-1 space-y-2 sm:flex sm:items-center sm:gap-2 sm:space-y-0">
                <input value={row.city} onChange={(e) => set(i, { city: e.target.value })} maxLength={60} placeholder="เมือง เช่น เซินเจิ้น" aria-label={`เมืองของทริปย่อย ${i + 1}`} className={`${inputClass} py-2 text-sm sm:flex-1`} />
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:w-80">
                  <input type="date" value={row.from} min={trip.startsOn} max={trip.endsOn} onChange={(e) => set(i, { from: e.target.value, ...(row.to < e.target.value ? { to: e.target.value } : {}) })} aria-label={`วันแรกของทริปย่อย ${i + 1}`} className={`${inputClass} min-w-0 px-3 py-2 text-sm`} />
                  <span className="text-slate-400" aria-hidden>–</span>
                  <input type="date" value={row.to} min={row.from} max={trip.endsOn} onChange={(e) => set(i, { to: e.target.value })} aria-label={`วันสุดท้ายของทริปย่อย ${i + 1}`} className={`${inputClass} min-w-0 px-3 py-2 text-sm`} />
                </div>
              </div>
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`ลบทริปย่อย ${i + 1}`} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
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
          <button type="button" onClick={() => setRows(suggestions.map((s) => ({ ...s })))} className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
            <MapPin className="size-4" aria-hidden /> ตามเมืองในรูป
          </button>
        )}
        {changed && (
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(rows.map((row) => ({ ...row, city: row.city.trim() })));
              setSaving(false);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} บันทึกทริปย่อย
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
