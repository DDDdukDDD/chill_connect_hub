'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, ChevronDown, Footprints, Loader2, Star } from 'lucide-react';
import type { ChallengeQuest } from '@/data/mockData';
import { ChallengeTile } from '@/components/ChallengeTile';
import { optimizedImage } from '@/lib/optimizedImage';
import { MomentComposer, CountedQuestNotice, type CountedQuest } from '@/components/moments/MomentComposer';

type TargetType = 'spot' | 'community' | 'fair';

interface TargetReward {
  questId: string;
  title: string;
  image?: string;
  rewardPoints: number;
  rewardTitle?: string;
  count: number;
  minEvidence?: Evidence;
}

type Evidence = 'checkin' | 'moment' | 'marked';
/** What one counted visit is called in a challenge line */
const COUNT_UNIT: Record<TargetType, string> = { spot: 'แห่ง', community: 'ตี้', fair: 'งาน' };

/** The fields ChallengeTile reads, from the short challenge line /api/visits sends (a running challenge with a rule) */
const asTileQuest = (quest: TargetReward) =>
  ({ id: quest.questId, title: quest.title, image: quest.image, rewardPoints: quest.rewardPoints, status: 'active', rule: { count: quest.count } }) as unknown as ChallengeQuest;
/** The signed-in member's part: how far they are in each challenge, and the evidence they have for this place */
interface MyPart {
  quests: Record<string, { current: number; total: number; completed: boolean; joined: boolean }>;
  evidence?: Evidence;
}

interface TargetProof {
  beenCount: number;
  people: { name: string; avatar?: string }[];
  photos: { url: string; momentId: string }[];
  momentsCount?: number;
  rating?: { average: number; count: number };
  quests?: TargetReward[];
}

interface VisitPanelProps {
  targetType: TargetType;
  targetId: string;
  /** Used to open the moment composer already tied to this place or event */
  title: string;
  location?: string;
  isLoggedIn: boolean;
  /** Opens the "members only" dialog of the page */
  onRequireLogin: () => void;
  onShowToast: (message: string) => void;
  /** The panel sits in a wide column: buttons go side by side */
  wide?: boolean;
  /** When the target opens (ms). Before then the "I have been here" button is replaced by a note (a fair that has not started) */
  markOpensAt?: number;
}

/**
 * Moments from members at one place or event (GET /api/visits), the button to share one,
 * and the quieter "I have been here" button for places and fairs. A community event has no button:
 * the host's check-in is its evidence.
 */
export const VisitPanel: React.FC<VisitPanelProps> = ({ targetType, targetId, title, location, isLoggedIn, onRequireLogin, onShowToast, wide = false, markOpensAt }) => {
  const [proof, setProof] = useState<TargetProof | null>(null);
  const [isMarked, setIsMarked] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [myPart, setMyPart] = useState<MyPart | null>(null);
  // The share form opens right here, already tied to this place or event
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  // Both blocks start folded to one line (owner 2026-11-01): the challenge line still sells; moments fold only while empty
  const [questsOpen, setQuestsOpen] = useState(false);
  const [momentsOpen, setMomentsOpen] = useState(false);
  const [counted, setCounted] = useState<CountedQuest | null>(null);
  // Bumped after a post so the photos and the member's progress are read again
  const [reloadCount, setReloadCount] = useState(0);
  const key = `${targetType}:${targetId}`;
  const canMark = targetType !== 'community';
  const [openedAt] = useState(() => Date.now());
  const markUnavailableNote = markOpensAt && markOpensAt > openedAt ? 'บันทึกได้เมื่อถึงวันงาน' : undefined;

  useEffect(() => {
    let isActive = true;
    fetch(`/api/visits?targets=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isActive || !data.success) return;
        setProof(data.targets[key] ?? null);
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, [key, reloadCount]);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsMarked(false);
      setMyRating(0);
      setMyPart(null);
      return;
    }
    let isActive = true;
    fetch('/api/visits?mine=1')
      .then((res) => res.json())
      .then((data) => {
        if (!isActive || !data.success) return;
        const mark = (data.marks ?? []).find((m: { targetType: string; targetId: string }) => m.targetType === targetType && m.targetId === targetId);
        setIsMarked(Boolean(mark));
        setMyRating(mark?.rating ?? 0);
        const visit = (data.visits ?? []).find((v: { targetType: string; targetId: string }) => v.targetType === targetType && v.targetId === targetId);
        setMyPart({
          quests: Object.fromEntries((data.quests ?? []).map((q: { questId: string; current: number; total: number; completed: boolean; joined: boolean }) => [q.questId, q])),
          evidence: visit?.evidence,
        });
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
    // Pressing "been here" changes what counts, so the member's part is read again
  }, [isLoggedIn, targetType, targetId, isMarked, reloadCount]);

  const send = useCallback(
    async (action: 'mark' | 'unmark', rating?: number) => {
      if (!isLoggedIn) {
        onRequireLogin();
        return;
      }
      setIsSaving(true);
      try {
        const res = await fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, targetType, targetId, rating }),
        });
        const data = await res.json();
        if (!data.success) {
          onShowToast(data.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
          return;
        }
        setIsMarked(Boolean(data.mark));
        setMyRating(data.mark?.rating ?? 0);
        // The answer has no challenge list, so the one already loaded is kept
        setProof((prev) => ({ ...data.proof, quests: prev?.quests ?? [] }));
        if (action === 'unmark') onShowToast('ยกเลิกแล้ว');
        else onShowToast(rating ? 'บันทึกคะแนนแล้ว' : 'บันทึกแล้ว');
      } catch {
        onShowToast('บันทึกไม่สำเร็จ กรุณาลองใหม่');
      } finally {
        setIsSaving(false);
      }
    },
    [isLoggedIn, onRequireLogin, onShowToast, targetType, targetId]
  );

  if (!proof) return null;

  // Fair pages never show a head count (DESIGN_SYSTEM.md, Pillars); photos and faces still show
  const showCount = targetType !== 'fair' && proof.beenCount > 0;
  const hasProof = proof.beenCount > 0 || proof.photos.length > 0;
  const quests = proof.quests ?? [];
  // The ones the member is doing first
  const sortedQuests = [...quests].sort((a, b) => Number(Boolean(myPart?.quests[b.questId]?.joined)) - Number(Boolean(myPart?.quests[a.questId]?.joined)));
  const doingCount = quests.filter((quest) => myPart?.quests[quest.questId]?.joined).length;
  const bestPoints = quests.length ? Math.max(...quests.map((quest) => quest.rewardPoints)) : 0;
  const hasPartnerReward = quests.some((quest) => quest.rewardTitle);
  const questsSummary =
    doingCount > 0
      ? `คุณทำอยู่ ${doingCount} ชาเลนจ์ · กดดูความคืบหน้า`
      : [bestPoints > 0 ? `ได้สูงสุด +${bestPoints.toLocaleString()} XP` : '', hasPartnerReward ? 'มีของรางวัลจากร้าน' : ''].filter(Boolean).join(' · ') || 'กดดูว่ามีชาเลนจ์อะไรบ้าง';
  // No moments yet and nothing of the member's here: the box folds to one line until opened
  const momentsFolded = !hasProof && !isMarked && !momentsOpen;
  const momentsCount = proof.momentsCount ?? proof.photos.length;
  const feedHref = `/moments?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}&location=${encodeURIComponent(title)}`;

  return (
    <div className="space-y-4">
      {/* Challenges a visit here counts toward: one line with their photos and the best reward, photo tiles when opened */}
      {quests.length > 0 && (
        <section aria-labelledby="counts-in-title">
          <button
            type="button"
            onClick={() => setQuestsOpen((open) => !open)}
            aria-expanded={questsOpen}
            aria-controls="counts-in-tiles"
            className="w-full flex items-center gap-4 rounded-2xl bg-[#F5F3FF] hover:bg-[#EDE9FE] p-3 text-left cursor-pointer transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            {/* The photos with how many challenges are inside, on the icon itself (owner 2026-11-01) */}
            <span className="relative flex -space-x-3 shrink-0" aria-hidden="true">
              {sortedQuests.slice(0, 3).map((quest) => (
                <span key={quest.questId} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#F5F3FF] bg-violet-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- challenge covers come from uploads or partners */}
                  {quest.image && <img src={optimizedImage(quest.image, 96)} alt="" loading="lazy" className="w-full h-full object-cover" />}
                </span>
              ))}
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#7C3AED] border-2 border-[#F5F3FF] text-[11px] font-bold text-white flex items-center justify-center tabular-nums">
                {quests.length}
              </span>
            </span>
            <span className="flex-1 min-w-0">
              <span id="counts-in-title" className="block text-sm font-bold text-slate-900">
                นับในชาเลนจ์<span className="sr-only"> {quests.length} รายการ</span>
              </span>
              <span className="block text-xs font-semibold text-[#5B21B6] tabular-nums truncate">{questsSummary}</span>
            </span>
            <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${questsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {questsOpen && (
            <ul id="counts-in-tiles" className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
              {sortedQuests.map((quest, index) => {
                // The same tile as /challenges; a member who joined sees their progress bar, everyone else the offer
                const mine = myPart?.quests[quest.questId];
                return (
                  <li key={quest.questId}>
                    <ChallengeTile
                      quest={asTileQuest(quest)}
                      index={index}
                      mine={mine?.joined ? { ...mine, questId: quest.questId, title: quest.title, rewardPoints: quest.rewardPoints } : undefined}
                      reason={{ kind: 'count', text: `ไปครบ ${quest.count} ${COUNT_UNIT[targetType]} รับรางวัล`, Icon: Footprints, tone: 'text-violet-700' }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
      {momentsFolded ? (
        <button
          type="button"
          data-visit-panel
          onClick={() => setMomentsOpen(true)}
          aria-expanded={false}
          className="w-full flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 hover:bg-slate-50 text-left cursor-pointer transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0" aria-hidden="true">
            <Camera className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-slate-900">โมเมนต์จากเพื่อนๆ</span>
            <span className="block text-xs font-medium text-slate-600 truncate">ยังไม่มีโมเมนต์ · มาแชร์เป็นคนแรกกัน</span>
          </span>
          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
        </button>
      ) : (
      <div data-visit-panel className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        {/* Who has been */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">โมเมนต์จากเพื่อนๆ</h3>
            {proof.rating && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {proof.rating.average.toFixed(1)}
                <span className="font-medium text-slate-500">จาก {proof.rating.count} คน</span>
              </span>
            )}
          </div>

          {hasProof ? (
            <>
              <div className="flex items-center gap-2.5">
                {proof.people.length > 0 && (
                  <span className="flex -space-x-2">
                    {proof.people.map((person, index) =>
                      person.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element -- member avatars come from uploads or providers
                        <img key={`${index}-${person.name}`} src={person.avatar} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white bg-slate-100" />
                      ) : (
                        <span key={`${index}-${person.name}`} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center">
                          {person.name.slice(0, 1)}
                        </span>
                      )
                    )}
                  </span>
                )}
                <p className="text-xs font-medium text-slate-600 tabular-nums">
                  {showCount ? `เพื่อนๆ ${proof.beenCount.toLocaleString()} คนมาที่นี่แล้ว` : 'เพื่อนๆ แชร์โมเมนต์จากที่นี่'}
                </p>
              </div>
              {proof.photos.length > 0 && (
                <div className="flex gap-2">
                  {proof.photos.map((photo) => (
                    <Link
                      key={photo.momentId}
                      href={`/moments/${encodeURIComponent(photo.momentId)}`}
                      className="block w-[calc((100%-16px)/3)] max-w-28 aspect-square rounded-2xl overflow-hidden bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- member photos come from uploads */}
                      <img src={photo.url} alt="โมเมนต์จากสมาชิก" loading="lazy" className="w-full h-full object-cover" />
                    </Link>
                  ))}
                </div>
              )}
              {momentsCount > proof.photos.length && (
                <Link href={feedHref} className="inline-block text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline tabular-nums">
                  ดูทั้งหมด {momentsCount.toLocaleString()} โมเมนต์
                </Link>
              )}
            </>
          ) : (
            <p className="text-xs font-medium text-slate-600">ยังไม่มีโมเมนต์จากที่นี่ มาแชร์เป็นคนแรกกัน</p>
          )}
        </div>


        {/* Actions: share a moment first; "been here" is the quiet second step */}
        <div className={wide ? 'grid gap-2.5 sm:grid-cols-2 sm:items-start' : 'space-y-2.5'}>
          <button
            type="button"
            onClick={() => (isLoggedIn ? setIsComposerOpen(true) : onRequireLogin())}
            className="cursor-pointer w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold whitespace-nowrap transition-colors duration-200 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            ร่วมแชร์โมเมนต์
          </button>
          {canMark && markUnavailableNote && !isMarked && (
            <p className="min-h-11 flex items-center justify-center rounded-full bg-slate-50 px-4 text-xs font-medium text-slate-600 text-center">{markUnavailableNote}</p>
          )}
          {canMark &&
            !(markUnavailableNote && !isMarked) &&
            (isMarked ? (
              <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    คุณมาที่นี่แล้ว
                  </span>
                  <button
                    type="button"
                    onClick={() => send('unmark')}
                    disabled={isSaving}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    ยกเลิก
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">ชอบที่นี่แค่ไหน</span>
                  <span className="flex" role="group" aria-label="ให้คะแนนที่นี่">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => send('mark', value)}
                        disabled={isSaving}
                        aria-label={`${value} ดาว`}
                        aria-pressed={myRating === value}
                        className="w-8 h-8 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-full"
                      >
                        <Star className={`w-5 h-5 ${value <= myRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
                      </button>
                    ))}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => send('mark')}
                disabled={isSaving}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap cursor-pointer transition-colors duration-200 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
                {isSaving ? 'กำลังบันทึก…' : 'มาที่นี่แล้ว'}
              </button>
            ))}
        </div>
      </div>
      )}

        {/* Outside the box, so a folded box still shows the share form and the "counted" notice */}
        {isComposerOpen && (
          <MomentComposer
            initial={{
              target: { type: targetType, id: targetId, title, location: location ?? '' },
              location,
              caption: targetType === 'community' ? `แชร์ความประทับใจจากตี้ "${title}"\n` : `ไปมาแล้ว "${title}"\n`,
            }}
            onClose={() => setIsComposerOpen(false)}
            onToast={onShowToast}
            onPosted={(_moment, countedQuest) => {
              setIsComposerOpen(false);
              setReloadCount((n) => n + 1);
              if (countedQuest) setCounted(countedQuest);
              else onShowToast('แชร์โมเมนต์แล้ว');
            }}
          />
        )}
        {counted && <CountedQuestNotice counted={counted} onClose={() => setCounted(null)} />}
    </div>
  );
};
