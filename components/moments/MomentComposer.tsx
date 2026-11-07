'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Hash, Image as ImageIcon, MapPin, Play, Trophy, UserPlus, Video, X } from 'lucide-react';
import { FriendTagPicker, type TagFriend } from '@/components/moments/FriendTagPicker';
import { PlacePicker } from '@/components/moments/PlacePicker';
import type { EventItem } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { DialogShell, dialogButton, useDialogBehavior } from '@/components/auth/DialogShell';
import { ClipEditor } from '@/components/moments/ClipEditor';
import { PhotoEditor } from '@/components/moments/PhotoEditor';
import { VerifyToPostDialog } from '@/components/moments/VerifyToPostDialog';
import { parseEventDateToTimestamp } from '@/lib/dateUtils';
import { clipFrame, coverWithText, plainCover, readClipDuration, withClipType } from '@/lib/media/clip';
import { canShrinkClips } from '@/lib/media/clipCompress';
import { drawBase, drawOverlays, newPhoto, type EditedPhoto, type PhotoText, type PostShape } from '@/lib/media/photoEdit';
import { startPosting } from '@/lib/moments/postingJobs';
import { publishMoment } from '@/components/moments/publishMoment';
import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '@/lib/moments/types';
import { useMemberSession } from '@/lib/useMemberSession';
import { useMyActivity } from '@/lib/useMyActivity';
import { useMyRewards } from '@/lib/useMyRewards';

/**
 * The "แชร์โมเมนต์" form, shared by the home feed and /moments. Mount it only while it is open
 * (`{isOpen && <MomentComposer … />}`) so every opening starts clean.
 * Steps, the way Instagram goes (owner 2026-11-02): choose photos or a clip, edit them, then the words and the place.
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
  /** Files already chosen from the feed's รูป or คลิป button; the form starts at their edit step */
  photoFiles?: File[];
  clipFile?: File;
}

/** What the author closes on a post */
export interface PostOptions {
  commentsOff: boolean;
  likesOff: boolean;
  sharesOff: boolean;
}

export interface MomentComposerProps {
  onClose: () => void;
  /** The new moment as the server returned it, and the challenge it counted toward, if any */
  onPosted: (moment: { id: string } & Record<string, unknown>, counted: CountedQuest | null) => void;
  onToast: (message: string) => void;
  initial?: MomentComposerInitial | null;
}

const LINK_TYPE_LABELS: Record<MomentLinkTarget['type'], string> = { community: 'ตี้', fair: 'อีเวนต์', spot: 'ที่เที่ยว' };
const OPTION_ROWS: [keyof PostOptions, string][] = [
  ['commentsOff', 'ปิดความคิดเห็น'],
  ['likesOff', 'ปิดการกดถูกใจ'],
  ['sharesOff', 'ปิดการแชร์'],
];
/** The three switches, also used when editing a post later */
export function PostOptionFields({ value, onChange }: { value: PostOptions; onChange: (value: PostOptions) => void }) {
  return (
    <div className="divide-y divide-slate-100">
      {OPTION_ROWS.map(([key, label]) => (
        <label key={key} className="flex items-center justify-between gap-3 py-2.5 cursor-pointer">
          <span className="text-sm font-medium text-slate-800">{label}</span>
          <input type="checkbox" checked={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.checked })} className="sr-only peer" />
          <span aria-hidden="true" className="relative shrink-0 w-11 h-6 rounded-full bg-slate-200 peer-checked:bg-[#2563EB] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563EB]/40 transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      ))}
    </div>
  );
}

/** The first photo, small and with its edits, for the progress card while the post uploads */
function thumbnailOf(photo: EditedPhoto, shape: PostShape): string {
  const canvas = Object.assign(document.createElement('canvas'), { width: 120, height: Math.round(120 / shape) });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';
  drawBase(ctx, photo, canvas.width, canvas.height);
  drawOverlays(ctx, photo, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

/** A small picture of the edited photo, with everything on it */
function EditedThumb({ photo, shape }: { photo: EditedPhoto; shape: PostShape }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const height = Math.round(200 / shape);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    drawBase(ctx, photo, 200, height);
    drawOverlays(ctx, photo, 200, height);
  }, [photo, height]);
  return <canvas ref={canvas} width={200} height={height} className="w-full h-full object-cover" aria-hidden="true" />;
}

/** A clip on its way to a post: the chosen part, the cover's moment, text on it, and whether it keeps its sound */
type ClipDraft = { file: File; fullSeconds: number; startS: number; coverAtS: number; texts: PhotoText[]; muted: boolean; cover?: string };

export function MomentComposer({ onClose, onPosted, onToast, initial }: MomentComposerProps) {
  const session = useMemberSession();
  const trust = session.member?.trust;
  const needsVerification = Boolean(trust && !(trust.identityConfirmed && trust.pledged));

  const [step, setStep] = useState<'pick' | 'photos' | 'clip' | 'details'>('pick');
  const [photos, setPhotos] = useState<EditedPhoto[]>([]);
  const [shape, setShape] = useState<PostShape>(1);
  const [clip, setClip] = useState<ClipDraft | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [options, setOptions] = useState<PostOptions>({ commentsOff: false, likesOff: false, sharesOff: false });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const captionInput = useRef<HTMLTextAreaElement>(null);
  const photoUrls = useRef<string[]>([]);
  const isOpen = useRef(true);
  const [caption, setCaption] = useState(initial?.caption ?? '');
  const [customLocation, setCustomLocation] = useState(initial?.location ?? '');
  const [linkedTarget, setLinkedTarget] = useState<MomentLinkTarget | null>(initial?.target ?? null);
  const [tagged, setTagged] = useState<TagFriend[]>([]);
  const [pickerOpen, setPickerOpen] = useState<'place' | 'friends' | null>(null);
  const [targetQuests, setTargetQuests] = useState<Record<string, { questId: string; title: string }[]>>({});
  const [savedSpotTargets, setSavedSpotTargets] = useState<MomentLinkTarget[]>([]);
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [openedAt] = useState(() => Date.now());
  // Steady, because the clip editor keeps the cover inside the chosen part with an effect that calls it
  const setCoverAt = useCallback((coverAtS: number) => setClip((prev) => (prev && prev.coverAtS !== coverAtS ? { ...prev, coverAtS } : prev)), []);
  const activity = useMyActivity();
  const { joinedQuestIds } = useMyRewards(true);

  // Something is filled in: a tap outside the form must not throw it away
  const hasDraft = Boolean(caption.trim() || photos.length > 0 || clip || customLocation.trim() || tagged.length > 0);
  const placeChosen = Boolean(linkedTarget || customLocation.trim());
  const leave = () => (hasDraft ? setConfirmDiscard(true) : onClose());

  // Esc closes the form; a draft asks first
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, () => {
    if (pickerOpen) return;
    if (hasDraft) setConfirmDiscard(true);
    else onClose();
  }, { focusField: false });

  // The photo links go when the form really closes; React's test re-mount in development must not cut them while they load
  useEffect(() => {
    isOpen.current = true;
    return () => {
      isOpen.current = false;
      setTimeout(() => {
        if (!isOpen.current) photoUrls.current.forEach((url) => URL.revokeObjectURL(url));
      });
    };
  }, []);

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

  const addPhotos = async (files: File[]) => {
    const slots = MAX_MOMENT_IMAGES - photos.length;
    if (slots <= 0) return onToast(`แชร์ได้สูงสุด ${MAX_MOMENT_IMAGES} รูปต่อโพสต์`);
    setIsPreparing(true);
    const added: EditedPhoto[] = [];
    let failed = 0;
    for (const file of files.slice(0, slots)) {
      const url = URL.createObjectURL(file);
      photoUrls.current.push(url);
      // A blob: link from the browser, which encodeURI leaves as it is; CodeQL needs it for text that started in a file input
      const image = await new Promise<HTMLImageElement | null>((resolve) => {
        const el = new window.Image();
        el.onload = () => resolve(el);
        el.onerror = () => resolve(null);
        el.src = encodeURI(url);
      });
      if (image) added.push(newPhoto(url, encodeURI(url), image));
      else failed++;
    }
    setIsPreparing(false);
    // A format the browser cannot show, such as HEIC on a computer
    if (failed > 0) onToast(`เปิดไม่ได้ ${failed} รูป ลองใช้ไฟล์ JPG หรือ PNG นะ`);
    else if (files.length > slots) onToast(`แชร์ได้สูงสุด ${MAX_MOMENT_IMAGES} รูปต่อโพสต์`);
    if (added.length === 0) return;
    setPhotos((prev) => [...prev, ...added]);
    setStep('photos');
  };

  const addClip = async (picked: File) => {
    const file = withClipType(picked);
    if (!file) return onToast(`ยังไม่รองรับไฟล์ ${picked.name.split('.').pop()?.toUpperCase() ?? 'นี้'} ใช้คลิป MP4, MOV หรือ WEBM นะ`);
    // Only the chosen part uploads, shrunk on this phone, so a big file is fine here; a device that cannot shrink sends the whole file
    if (file.size > MAX_VIDEO_BYTES && !canShrinkClips()) return onToast(`คลิปนี้ ${Math.round(file.size / 1024 / 1024)}MB เครื่องนี้ส่งได้ไม่เกิน ${MAX_VIDEO_BYTES / 1024 / 1024}MB ลองโพสต์จากมือถือ หรือตัดคลิปให้สั้นลงก่อนนะ`);
    setIsPreparing(true);
    try {
      const fullSeconds = await readClipDuration(file);
      setClip({ file, fullSeconds, startS: 0, coverAtS: 0, texts: [], muted: false });
      setStep('clip');
    } catch {
      onToast('อุปกรณ์นี้เปิดคลิปนี้ไม่ได้ ลองเลือกจากมือถือ หรือแปลงเป็น MP4 นะ');
    } finally {
      setIsPreparing(false);
    }
  };

  // Files already chosen from the feed's buttons
  const startedFromFiles = useRef(false);
  useEffect(() => {
    if (startedFromFiles.current) return;
    startedFromFiles.current = true;
    if (initial?.photoFiles?.length) void addPhotos(initial.photoFiles);
    else if (initial?.clipFile) void addClip(initial.clipFile);
    // once, on opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Leaving the clip step: the chosen frame, with the clip's text on it, becomes the cover every grid shows */
  const finishClip = async () => {
    if (!clip) return;
    setIsPreparing(true);
    const frame = await clipFrame(clip.file, clip.coverAtS);
    const cover = frame ? await coverWithText(frame, clip.texts) : plainCover();
    setClip({ ...clip, cover });
    setIsPreparing(false);
    setStep('details');
  };

  /**
   * Hands the post to the background (lib/moments/postingJobs.ts) and closes the form at once, like Instagram:
   * PostingProgress shows the bar, and `onPosted` runs when the post is up.
   */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // A moment is the member's own photo: no stock image is added on their behalf
    if (photos.length === 0 && !clip?.cover) return onToast('เพิ่มรูปหรือคลิปก่อนนะ');
    // The picked place or event decides the title and the place shown on the post; otherwise the typed name does
    const location = linkedTarget ? linkedTarget.location || linkedTarget.title : customLocation.trim();
    const draft = {
      photos,
      shape,
      clip: clip?.cover ? { file: clip.file, fullSeconds: clip.fullSeconds, startS: clip.startS, texts: clip.texts, muted: clip.muted, cover: clip.cover } : null,
      caption: caption.trim(),
      location,
      target: linkedTarget,
      taggedIds: tagged.map((friend) => friend.id),
      options,
    };
    // The photo links must outlive the form: the background job still reads them, and they go with the page
    photoUrls.current = [];
    startPosting(clip?.cover ?? thumbnailOf(photos[0], shape), async (report) => {
      const { moment, counted } = await publishMoment(draft, report);
      onPosted(moment, counted);
    });
    onClose();
  };

  if (needsVerification) return <VerifyToPostDialog onClose={onClose} />;

  // Where it is from, and who was there: one optional row each, like Instagram
  const rowButton = 'w-full flex items-center gap-3 min-h-12 py-2 text-left cursor-pointer';
  const placeRow = (
      <div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPickerOpen('place')} className={`${rowButton} flex-1 min-w-0`}>
            <MapPin className={`w-5 h-5 shrink-0 ${placeChosen ? 'text-[#2563EB]' : 'text-slate-500'}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900 truncate">{linkedTarget?.title ?? (customLocation.trim() || 'เพิ่มสถานที่')}</span>
              {linkedTarget && <span className="block text-xs font-medium text-slate-600 truncate">{[LINK_TYPE_LABELS[linkedTarget.type], linkedTarget.location].filter(Boolean).join(' · ')}</span>}
              {!placeChosen && <span className="block text-xs font-medium text-slate-500">ไม่บังคับ แต่ถ้าที่นั่นอยู่ในชาเลนจ์ ระบบจะนับให้เลย</span>}
            </span>
            {!placeChosen && <ChevronRight className="w-5 h-5 shrink-0 text-slate-400" aria-hidden="true" />}
          </button>
          {placeChosen && (
            <button
              type="button"
              onClick={() => {
                setLinkedTarget(null);
                setCustomLocation('');
              }}
              className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              aria-label="เอาสถานที่ออก"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {linkedQuest && (
          <p className="pb-2 flex items-start gap-1.5 text-xs font-bold text-[#5B21B6] leading-relaxed">
            <Trophy className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="min-w-0 line-clamp-2">ที่นี่นับในชาเลนจ์ {linkedQuest.title}</span>
          </p>
        )}
        {linkedQuest && linkedTarget && (linkedTarget.type === 'spot' || linkedTarget.type === 'fair') && (
          <p className="pb-2 text-xs text-slate-600 leading-relaxed">
            โพสต์ตอนอยู่ที่นี่ แล้วกดอนุญาตตำแหน่ง รูปจะนับทันที ถ้าไม่ได้อยู่ที่นี่ ทีมงานจะตรวจรูปภายใน 24 ชม.
          </p>
        )}
      </div>
  );
  const placeField = (
    <div className="divide-y divide-slate-100 border-y border-slate-100">
      {placeRow}
      <button type="button" onClick={() => setPickerOpen('friends')} className={rowButton}>
        <UserPlus className={`w-5 h-5 shrink-0 ${tagged.length ? 'text-[#2563EB]' : 'text-slate-500'}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-sm font-bold text-slate-900 truncate">
          {tagged.length ? `กับ ${tagged.slice(0, 2).map((friend) => friend.name).join(', ')}${tagged.length > 2 ? ` และอีก ${tagged.length - 2} คน` : ''}` : 'แท็กเพื่อน'}
        </span>
        <ChevronRight className="w-5 h-5 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
    </div>
  );
  const placeTitle = linkedTarget?.title ?? (customLocation.trim() || null);
  const isWide = step === 'photos' || step === 'clip';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!hasDraft) onClose();
      }}
    >
      {/* Full screen on phones, a centred dialog on larger screens */}
      <div
        ref={panelRef}
        data-dialog-shell
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-moment-title"
        className={`focus:outline-hidden bg-white w-full flex flex-col overflow-hidden sm:rounded-3xl shadow-2xl sm:border border-slate-200/90 ${
          isWide ? `h-dvh sm:h-[min(92dvh,720px)] ${step === 'photos' ? 'sm:max-w-4xl' : 'sm:max-w-lg'}` : step === 'details' ? 'h-dvh sm:h-auto sm:max-h-[92dvh] sm:max-w-lg' : 'max-h-[92dvh] rounded-t-3xl sm:max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'pick' && (
          <>
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
              <h3 id="create-moment-title" className="font-bold text-base sm:text-lg text-slate-900">แชร์โมเมนต์</h3>
              <button type="button" onClick={onClose} aria-label="ปิด" className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 overflow-y-auto">
              {linkedTarget && <p className="text-sm font-medium text-slate-600 truncate">จาก {linkedTarget.title}</p>}
              {isPreparing ? (
                <p role="status" className="py-10 text-center text-sm font-semibold text-slate-600">กำลังเปิดไฟล์…</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="rounded-2xl bg-[#FFF1F2] hover:bg-[#FFE4E6] transition-colors text-center cursor-pointer flex flex-col items-center gap-1.5 px-3 py-7 focus-within:ring-2 focus-within:ring-[#F43F5E]">
                    <ImageIcon className="w-7 h-7 text-[#F43F5E]" aria-hidden="true" />
                    <span className="text-base font-bold text-slate-900">โพสต์รูป</span>
                    <span className="text-xs text-slate-600 leading-relaxed">สูงสุด {MAX_MOMENT_IMAGES} รูป แต่งรูป ติดสติกเกอร์ได้</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        e.target.value = '';
                        if (files.length) void addPhotos(files);
                      }}
                    />
                  </label>
                  <label className="rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors text-center cursor-pointer flex flex-col items-center gap-1.5 px-3 py-7 focus-within:ring-2 focus-within:ring-slate-500">
                    <Video className="w-7 h-7 text-slate-700" aria-hidden="true" />
                    <span className="text-base font-bold text-slate-900">โพสต์คลิป</span>
                    <span className="text-xs text-slate-600 leading-relaxed">เลือกช่วง {MAX_VIDEO_SECONDS} วินาที เลือกปก ใส่ข้อความได้</span>
                    {/* video/*, not a list of types: phones then open the gallery as well as the camera */}
                    <input
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void addClip(file);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'photos' && (
          <PhotoEditor
            photos={photos}
            onChange={(next) => {
              setPhotos(next);
              if (next.length === 0) setStep('pick');
            }}
            onAddFiles={(files) => void addPhotos(Array.from(files))}
            maxPhotos={MAX_MOMENT_IMAGES}
            shape={shape}
            onShapeChange={setShape}
            placeTitle={placeTitle}
            placeField={<div className="border-y border-slate-100">{placeRow}</div>}
            onBack={leave}
            onNext={() => setStep('details')}
          />
        )}

        {step === 'clip' && clip && (
          <ClipEditor
            file={clip.file}
            fullSeconds={clip.fullSeconds}
            startS={clip.startS}
            onStartChange={(startS) => setClip({ ...clip, startS })}
            coverAtS={clip.coverAtS}
            onCoverChange={setCoverAt}
            texts={clip.texts}
            onTextsChange={(texts) => setClip({ ...clip, texts })}
            muted={clip.muted}
            onMutedChange={(muted) => setClip({ ...clip, muted })}
            canEdit={canShrinkClips()}
            isBusy={isPreparing}
            onBack={leave}
            onNext={() => void finishClip()}
          />
        )}

        {step === 'details' && (
          <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-100 shrink-0">
              <button type="button" onClick={() => setStep(clip ? 'clip' : 'photos')} aria-label="ย้อนกลับ" className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 id="create-moment-title" className="font-bold text-base text-slate-900">โพสต์ใหม่</h3>
              <button type="submit" className="h-10 px-5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-sm cursor-pointer whitespace-nowrap">
                โพสต์
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-5">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100">
                  {clip?.cover ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                      <img src={clip.cover} alt="ปกคลิป" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"><Play className="h-4 w-4 fill-current" /></span>
                      </span>
                    </>
                  ) : (
                    photos[0] && <EditedThumb photo={photos[0]} shape={shape} />
                  )}
                  {photos.length > 1 && <span className="absolute top-1 right-1 rounded-full bg-black/60 px-1.5 text-[11px] font-bold text-white tabular-nums">{photos.length}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="moment-caption" className="sr-only">เล่าสั้นๆ</label>
                  <textarea
                    ref={captionInput}
                    id="moment-caption"
                    rows={4}
                    value={caption}
                    maxLength={500}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="เล่าสั้นๆ ว่าวันนี้เป็นยังไง (ไม่ใส่ก็ได้)"
                    className="w-full bg-white border border-slate-300 rounded-2xl p-3 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none leading-relaxed placeholder:text-slate-500"
                  />
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCaption((text) => `${text}${text && !/\s$/.test(text) ? ' ' : ''}#`);
                        captionInput.current?.focus();
                      }}
                      className="h-8 pl-2 pr-3 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Hash className="w-3.5 h-3.5" aria-hidden="true" />
                      แฮชแท็ก
                    </button>
                    <span className="text-xs font-medium text-slate-500 tabular-nums">{caption.length}/500</span>
                  </div>
                </div>
              </div>

              {placeField}

              <div>
                <p className="text-sm font-bold text-slate-900">ตั้งค่าโพสต์</p>
                <PostOptionFields value={options} onChange={setOptions} />
              </div>
            </div>
          </form>
        )}
      </div>

      {pickerOpen === 'place' && (
        <PlacePicker
          mine={myLinkTargets}
          onClose={() => setPickerOpen(null)}
          onPickTarget={(target) => {
            pickTarget(target);
            setPickerOpen(null);
          }}
          onPickName={(name) => {
            setLinkedTarget(null);
            setCustomLocation(name.slice(0, 80));
            setPickerOpen(null);
          }}
        />
      )}
      {pickerOpen === 'friends' && (
        <FriendTagPicker
          value={tagged}
          onClose={() => setPickerOpen(null)}
          onDone={(friends) => {
            setTagged(friends);
            setPickerOpen(null);
          }}
        />
      )}

      {confirmDiscard && (
        <DialogShell onClose={() => setConfirmDiscard(false)} title="ทิ้งโพสต์นี้ไหม" subtitle="รูปหรือคลิปและข้อความที่ทำไว้จะหายไป" size="sm">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" data-autofocus className={dialogButton.quiet} onClick={() => setConfirmDiscard(false)}>ทำต่อ</button>
            <button type="button" className={dialogButton.danger} onClick={onClose}>ทิ้งโพสต์</button>
          </div>
        </DialogShell>
      )}
    </div>
  );
}

/** After posting: the moment counted toward a challenge the member is doing; good news, so warm and light (never black) */
export function CountedQuestNotice({ counted, onClose }: { counted: CountedQuest; onClose: () => void }) {
  return (
    <div role="status" className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px] z-50 bg-[#FFF4C7] text-slate-900 p-4 rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.16)] border border-amber-200 animate-toast-in">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">แชร์โมเมนต์แล้ว</p>
          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
            {counted.completed ? `ทำชาเลนจ์ ${counted.title} ครบแล้ว` : `นับในชาเลนจ์ ${counted.title} แล้ว ${counted.current} จาก ${counted.total}`}
          </p>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 -mt-1.5 -mr-1.5 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer shrink-0" aria-label="ปิด">
          <X className="w-4 h-4" />
        </button>
      </div>
      <Link href={`/challenges/${encodeURIComponent(counted.questId)}`} className="mt-3 flex items-center justify-center h-10 rounded-xl bg-[#F26430] text-white text-sm font-bold hover:bg-[#E2551F] transition-colors">
        {counted.completed ? 'ดูรางวัล' : 'ดูชาเลนจ์'}
      </Link>
    </div>
  );
}
