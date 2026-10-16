'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Image as ImageIcon, MapPin, Navigation, Search, Trophy, X } from 'lucide-react';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';
import { compressImage } from '@/lib/media/compressor';
import { useMemberSession } from '@/lib/useMemberSession';
import { useMyActivity } from '@/lib/useMyActivity';
import { useMyRewards } from '@/lib/useMyRewards';

/**
 * The "แชร์โมเมนต์" form, shared by the home feed and /moments. Mount it only while it is open
 * (`{isOpen && <MomentComposer … />}`) so every opening starts clean.
 * A member who has not verified their email and taken the pledge sees why they cannot post yet instead.
 */

export const MAX_MOMENT_IMAGES = 10;

/** Where the moment is from: a real event or place. A challenge is not a choice, because only a visit counts toward one. */
export type MomentLinkTarget = { type: 'community' | 'fair' | 'spot'; id: string; title: string; location: string };

/** A member's progress in one challenge, as /api/visits?mine=1 serves it */
export interface CountedQuest {
  questId: string;
  title: string;
  current: number;
  total: number;
  completed: boolean;
  joined: boolean;
}

export interface MomentComposerInitial {
  target?: MomentLinkTarget;
  caption?: string;
  location?: string;
  image?: string;
}

export interface MomentComposerProps {
  onClose: () => void;
  /** The new moment as the server returned it, and the challenge it counted toward, if any */
  onPosted: (moment: { id: string } & Record<string, unknown>, counted: CountedQuest | null) => void;
  onToast: (message: string) => void;
  initial?: MomentComposerInitial | null;
}

const LINK_TYPE_LABELS: Record<MomentLinkTarget['type'], string> = { community: 'กิจกรรม', fair: 'งานแฟร์', spot: 'ที่เที่ยว' };
const MINE_SHOWN = 4;
const isVisitTarget = (type?: string): type is 'spot' | 'community' | 'fair' => type === 'spot' || type === 'community' || type === 'fair';

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; message: string; moment?: { id: string } & Record<string, unknown> }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ', moment: json?.moment };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

export function MomentComposer({ onClose, onPosted, onToast, initial }: MomentComposerProps) {
  const session = useMemberSession();
  const trust = session.member?.trust;
  const needsVerification = Boolean(trust && !(trust.emailVerified && trust.pledged));

  const [isPosting, setIsPosting] = useState(false);
  const [images, setImages] = useState<string[]>(initial?.image ? [initial.image] : []);
  const [isCompressing, setIsCompressing] = useState(false);
  const [caption, setCaption] = useState(initial?.caption ?? '');
  const [customLocation, setCustomLocation] = useState(initial?.location ?? '');
  const [isLocating, setIsLocating] = useState(false);
  const [linkedTarget, setLinkedTarget] = useState<MomentLinkTarget | null>(initial?.target ?? null);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<MomentLinkTarget[]>([]);
  const [isLinkSearching, setIsLinkSearching] = useState(false);
  const [showAllMine, setShowAllMine] = useState(false);
  const [targetQuests, setTargetQuests] = useState<Record<string, { questId: string; title: string }[]>>({});
  const [savedSpotTargets, setSavedSpotTargets] = useState<MomentLinkTarget[]>([]);
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [openedAt] = useState(() => Date.now());
  const activity = useMyActivity();
  const { joinedQuestIds } = useMyRewards(true);

  // Something is filled in: a tap outside the form must not throw it away
  const hasDraft = Boolean(caption.trim() || images.length > 0 || linkedTarget || customLocation.trim());

  // Esc closes the form unless a post is on its way
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !isPosting && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPosting, onClose]);

  // Search both catalogs once typing pauses
  useEffect(() => {
    const q = linkQuery.trim();
    if (q.length < 2 || linkedTarget) return;
    let active = true;
    const timer = setTimeout(async () => {
      setIsLinkSearching(true);
      const get = (url: string) => fetch(url).then((res) => res.json()).catch(() => ({}));
      const [events, spots] = await Promise.all([
        get(`/api/events?q=${encodeURIComponent(q)}&limit=5&includeEnded=true`),
        get(`/api/spots?q=${encodeURIComponent(q)}&limit=4`),
      ]);
      if (!active) return;
      setLinkResults([
        ...((events.events ?? []) as EventItem[]).map((e) => ({ type: e.eventType === 'public_venue' ? ('fair' as const) : ('community' as const), id: e.id, title: e.title, location: e.location || '' })),
        ...((spots.spots ?? []) as LifestyleSpotItem[]).map((s) => ({ type: 'spot' as const, id: s.id, title: s.title, location: [s.district, s.province].filter(Boolean).join(', ') })),
      ]);
      setIsLinkSearching(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [linkQuery, linkedTarget]);

  // Before the member types, offer what they joined or saved: the likeliest places a moment is from
  const savedSpotKey = activity.savedSpotIds.slice(0, 30).join(',');
  useEffect(() => {
    if (!savedSpotKey) return;
    let active = true;
    fetch(`/api/spots?ids=${encodeURIComponent(savedSpotKey)}`)
      .then((res) => res.json())
      .then((json: { spots?: LifestyleSpotItem[] }) => {
        if (active) setSavedSpotTargets((json.spots ?? []).map((spot) => ({ type: 'spot' as const, id: spot.id, title: spot.title, location: [spot.district, spot.province].filter(Boolean).join(', ') })));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [savedSpotKey]);
  const savedEventKey = activity.savedEventIds.join(',');
  useEffect(() => {
    if (!savedEventKey) return;
    let active = true;
    fetch('/api/events')
      .then((res) => res.json())
      .then((json: { events?: EventItem[] }) => {
        const saved = new Set(savedEventKey.split(','));
        if (active) setSavedEvents((json.events ?? []).filter((e) => saved.has(e.id)));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [savedEventKey]);

  const myLinkTargets = useMemo(() => {
    const ofEvent = (e: EventItem): MomentLinkTarget => ({ type: e.eventType === 'public_venue' ? 'fair' : 'community', id: e.id, title: e.title, location: e.location || '' });
    const when = (e: EventItem) => parseEventDateToTimestamp(e.date);
    // Most likely first: events already attended (latest first), saved places, saved events that have started, then what is still ahead
    const all = [
      ...activity.joined.filter((e) => when(e) <= openedAt).sort((a, b) => when(b) - when(a)).map(ofEvent),
      ...savedSpotTargets,
      ...savedEvents.filter((e) => when(e) <= openedAt).map(ofEvent),
      ...activity.joined.filter((e) => when(e) > openedAt).sort((a, b) => when(a) - when(b)).map(ofEvent),
      ...savedEvents.filter((e) => when(e) > openedAt).map(ofEvent),
    ];
    return all.filter((item, index) => all.findIndex((other) => other.type === item.type && other.id === item.id) === index);
  }, [activity.joined, savedSpotTargets, savedEvents, openedAt]);

  // While typing, the member's own matches come before the catalog's
  const linkMatches = useMemo(() => {
    const q = linkQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const mine = myLinkTargets.filter((item) => item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q)).slice(0, 4);
    return [...mine, ...linkResults.filter((r) => !mine.some((item) => item.type === r.type && item.id === r.id))];
  }, [linkQuery, linkResults, myLinkTargets]);

  // Which challenges the picked place or event counts toward; the one the member is doing is named first
  const linkedKey = linkedTarget ? `${linkedTarget.type}:${linkedTarget.id}` : '';
  useEffect(() => {
    if (!linkedKey || targetQuests[linkedKey]) return;
    let active = true;
    fetch(`/api/visits?targets=${encodeURIComponent(linkedKey)}`)
      .then((res) => res.json())
      .then((json: { targets?: Record<string, { quests?: { questId: string; title: string }[] }> }) => {
        if (active) setTargetQuests((prev) => ({ ...prev, [linkedKey]: json.targets?.[linkedKey]?.quests ?? [] }));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [linkedKey, targetQuests]);
  const linkedQuests = linkedKey ? targetQuests[linkedKey] ?? [] : [];
  const linkedQuest = linkedQuests.find((q) => joinedQuestIds.includes(q.questId)) ?? linkedQuests[0];

  const pickTarget = (target: MomentLinkTarget) => {
    setLinkedTarget(target);
    setCustomLocation('');
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return onToast('เบราว์เซอร์ไม่รองรับการระบุพิกัด GPS');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setIsLocating(false);
        setCustomLocation('ตำแหน่งปัจจุบันของฉัน (GPS)');
      },
      () => {
        setIsLocating(false);
        setCustomLocation('กรุงเทพมหานคร (พิกัดใกล้ฉัน)');
      },
      { timeout: 5000 }
    );
  };

  const addImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const slots = MAX_MOMENT_IMAGES - images.length;
    if (slots <= 0) return onToast(`แชร์ได้สูงสุด ${MAX_MOMENT_IMAGES} รูปต่อโพสต์`);
    setIsCompressing(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, slots)) {
        const compressed = await compressImage(file, { maxWidth: 1440, maxHeight: 1800, quality: 0.82, targetMimeType: 'image/webp' });
        added.push(
          await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(compressed);
          })
        );
      }
      setImages((prev) => [...prev, ...added].slice(0, MAX_MOMENT_IMAGES));
    } catch (err) {
      console.error('Error compressing images:', err);
      onToast('เตรียมรูปไม่สำเร็จ ลองรูปอื่นนะ');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || isPosting) return;
    // A moment is the member's own photo: no stock image is added on their behalf
    if (images.length === 0) return onToast('เพิ่มรูปอย่างน้อย 1 รูปก่อนนะ');
    // The picked place or event decides the title and the place shown on the post; otherwise the typed name does
    const location = linkedTarget ? linkedTarget.location || linkedTarget.title : customLocation.trim() || 'ไลฟ์สไตล์ทั่วไป';

    setIsPosting(true);
    try {
      const imageUrls: string[] = [];
      for (const image of images) {
        if (!image.startsWith('data:')) {
          imageUrls.push(image);
          continue;
        }
        const form = new FormData();
        form.append('file', await (await fetch(image)).blob(), 'moment.webp');
        form.append('folder', 'moments');
        const upload = await fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json()).catch(() => null);
        if (!upload?.success || !upload.url) return onToast(upload?.error || upload?.message || 'อัปโหลดรูปไม่สำเร็จ ลองอีกครั้งนะ');
        imageUrls.push(upload.url);
      }
      const imageRatio = await new Promise<number | undefined>((resolve) => {
        const probe = new window.Image();
        probe.onload = () => resolve(probe.naturalHeight > 0 ? probe.naturalWidth / probe.naturalHeight : undefined);
        probe.onerror = () => resolve(undefined);
        probe.src = images[0];
      });
      const result = await postJson('/api/moments', {
        caption: caption.trim(),
        images: imageUrls,
        imageRatio,
        location,
        category: 'chill',
        targetType: linkedTarget ? linkedTarget.type : 'general',
        targetId: linkedTarget?.id,
        targetTitle: linkedTarget ? linkedTarget.title : location,
      });
      if (!result.ok || !result.moment) return onToast(result.message);

      // A moment at a place or event is a visit: say so when it counted toward a challenge the member is doing
      let counted: CountedQuest | null = null;
      if (linkedTarget && isVisitTarget(linkedTarget.type)) {
        const key = `${linkedTarget.type}:${linkedTarget.id}`;
        const get = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => res.json()).catch(() => ({}));
        const [here, mine] = await Promise.all([get(`/api/visits?targets=${encodeURIComponent(key)}`), get('/api/visits?mine=1')]);
        const hereIds = new Set(((here.targets?.[key]?.quests ?? []) as { questId: string }[]).map((q) => q.questId));
        counted = ((mine.quests ?? []) as CountedQuest[]).find((q) => q.joined && q.current > 0 && hereIds.has(q.questId)) ?? null;
      }
      onPosted(result.moment, counted);
    } finally {
      setIsPosting(false);
    }
  };

  if (needsVerification) {
    return (
      <DialogShell onClose={onClose} title="อีกนิดเดียว ก็โพสต์ได้แล้ว" subtitle="ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ก่อน เพื่อให้ที่นี่ปลอดภัยสำหรับทุกคน" size="sm">
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" className={dialogButton.quiet} onClick={onClose}>ไว้ทีหลัง</button>
          <Link href="/profile#trust" className={dialogButton.primary}>ไปยืนยันที่โปรไฟล์</Link>
        </div>
      </DialogShell>
    );
  }

  const renderLinkRow = (r: MomentLinkTarget) => (
    <li key={`${r.type}-${r.id}`}>
      <button type="button" onClick={() => pickTarget(r)} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 cursor-pointer">
        <span className="shrink-0 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">{LINK_TYPE_LABELS[r.type]}</span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900 truncate">{r.title}</span>
          {r.location && <span className="block text-xs text-slate-500 truncate">{r.location}</span>}
        </span>
      </button>
    </li>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!hasDraft && !isPosting) onClose();
      }}
    >
      {/* A sheet from the bottom on phones, a centred dialog on larger screens */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-moment-title"
        className="bg-white w-full sm:max-w-lg max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
          <h3 id="create-moment-title" className="font-bold text-base sm:text-lg text-slate-900">แชร์โมเมนต์</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            {/* 1. Photos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">รูปภาพ</span>
                <span className="text-xs font-medium text-slate-500">{isCompressing ? 'กำลังเตรียมรูป…' : `${images.length}/${MAX_MOMENT_IMAGES} รูป`}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                    <img src={img} alt={`รูปที่ ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">ปก</span>}
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                      aria-label={`ลบรูปที่ ${idx + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_MOMENT_IMAGES && (
                  <label
                    className={`${
                      images.length === 0 ? 'col-span-3 sm:col-span-4 py-7' : 'aspect-square'
                    } rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 px-2`}
                  >
                    <ImageIcon className="w-6 h-6 text-slate-500" aria-hidden="true" />
                    <span className="text-sm font-bold text-slate-800">{images.length === 0 ? 'เลือกรูป' : 'เพิ่มรูป'}</span>
                    {images.length === 0 && <span className="text-xs text-slate-500">อย่างน้อย 1 รูป สูงสุด {MAX_MOMENT_IMAGES} รูป</span>}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={isCompressing} onChange={addImages} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* 2. Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="moment-caption" className="text-sm font-bold text-slate-900">เล่าสั้นๆ</label>
                <span className="text-xs font-medium text-slate-500">{caption.length}/500</span>
              </div>
              <textarea
                id="moment-caption"
                rows={3}
                value={caption}
                maxLength={500}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="วันนี้ไปไหนมา รู้สึกยังไง"
                className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none leading-relaxed placeholder:text-slate-400"
                required
              />
            </div>

            {/* 3. What it is about: one optional choice */}
            <div className="space-y-2">
              <label htmlFor="moment-link" className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">ไปที่ไหนมา</span>
                <span className="text-xs font-medium text-slate-500 shrink-0">ไม่บังคับ</span>
              </label>
              {!linkedTarget && (
                <p className="text-xs font-medium text-slate-600 leading-relaxed">เลือกที่เที่ยว กิจกรรม หรืองานที่ไปมา เพื่อนๆ จะตามไปได้ และถ้าที่นั่นอยู่ในชาเลนจ์ ระบบจะนับให้เลย</p>
              )}
              {linkedTarget ? (
                <div>
                  <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border border-blue-200 bg-blue-50/60">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900 truncate">{linkedTarget.title}</span>
                      <span className="block text-xs font-medium text-slate-600 truncate">{[LINK_TYPE_LABELS[linkedTarget.type], linkedTarget.location].filter(Boolean).join(' · ')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkedTarget(null);
                        setLinkQuery('');
                      }}
                      className="shrink-0 w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                      aria-label="เอารายการนี้ออก"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {linkedQuest && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs font-bold text-[#5B21B6] leading-relaxed">
                      <Trophy className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="min-w-0 line-clamp-2">ที่นี่นับในชาเลนจ์ {linkedQuest.title}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="moment-link"
                      type="search"
                      value={linkQuery}
                      onChange={(e) => setLinkQuery(e.target.value)}
                      placeholder="ค้นหาที่เที่ยว กิจกรรม หรืองานแฟร์"
                      autoComplete="off"
                      className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-3.5 py-3 text-base sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  {linkQuery.trim().length < 2 && myLinkTargets.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-xs font-bold text-slate-600">ที่คุณเข้าร่วมหรือบันทึกไว้</p>
                        {myLinkTargets.length > MINE_SHOWN && (
                          <button type="button" onClick={() => setShowAllMine((open) => !open)} className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap">
                            {showAllMine ? 'ย่อ' : `ดูทั้งหมด ${myLinkTargets.length}`}
                          </button>
                        )}
                      </div>
                      <ul className={`rounded-2xl border border-slate-200 divide-y divide-slate-100 ${showAllMine ? 'max-h-64 overflow-y-auto' : 'overflow-hidden'}`} aria-label="ที่คุณเข้าร่วมหรือบันทึกไว้">
                        {(showAllMine ? myLinkTargets : myLinkTargets.slice(0, MINE_SHOWN)).map(renderLinkRow)}
                      </ul>
                    </div>
                  )}
                  {linkQuery.trim().length >= 2 && (
                    <ul className="mt-2 rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden" aria-label="ผลการค้นหา">
                      {linkMatches.map(renderLinkRow)}
                      {linkMatches.length === 0 && (
                        <li className="px-3.5 py-3 text-sm font-medium text-slate-500">{isLinkSearching ? 'กำลังค้นหา…' : 'ไม่พบรายการที่ตรง ลองคำอื่น หรือพิมพ์ชื่อสถานที่ด้านล่างแทน'}</li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              {!linkedTarget && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      type="text"
                      value={customLocation}
                      maxLength={80}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="หรือพิมพ์ชื่อสถานที่"
                      aria-label="ชื่อสถานที่"
                      className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-3.5 py-3 text-base sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={isLocating}
                    className="shrink-0 w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer disabled:opacity-50"
                    aria-label="ใช้ตำแหน่งปัจจุบัน"
                    title="ใช้ตำแหน่งปัจจุบัน"
                  >
                    <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions stay in view while the form scrolls */}
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center gap-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={onClose} className="px-4 py-3 rounded-full text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap">
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!caption.trim() || images.length === 0 || isCompressing || isPosting}
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none text-white px-6 py-3 rounded-full font-bold text-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              {isCompressing ? 'กำลังเตรียมรูป…' : isPosting ? 'กำลังโพสต์…' : images.length === 0 ? 'เลือกรูปก่อนนะ' : !caption.trim() ? 'เขียนเล่าสั้นๆ ก่อนนะ' : 'โพสต์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** After posting: the moment counted toward a challenge the member is doing */
export function CountedQuestNotice({ counted, onClose }: { counted: CountedQuest; onClose: () => void }) {
  return (
    <div role="status" className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px] z-50 bg-[#1E293B] text-white p-4 rounded-2xl shadow-xl border border-slate-700 animate-slide-up">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">แชร์โมเมนต์แล้ว</p>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {counted.completed ? `ทำชาเลนจ์ ${counted.title} ครบแล้ว` : `นับในชาเลนจ์ ${counted.title} แล้ว ${counted.current} จาก ${counted.total}`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 -mt-1.5 -mr-1.5 flex items-center justify-center rounded-lg text-slate-400 hover:text-white cursor-pointer shrink-0" aria-label="ปิด">
          <X className="w-4 h-4" />
        </button>
      </div>
      <Link href={`/challenges/${encodeURIComponent(counted.questId)}`} className="mt-3 flex items-center justify-center h-10 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-colors">
        {counted.completed ? 'ดูรางวัล' : 'ดูชาเลนจ์'}
      </Link>
    </div>
  );
}
