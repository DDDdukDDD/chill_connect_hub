'use client';

import { useId } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, PartyPopper } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { campaignStanding } from '@/components/campaigns/campaignStanding';
import { useMemberSession } from '@/lib/useMemberSession';
import { type CampaignView, type MyCampaign, RESULTS_PATH, campaignDay, isCampaignLive } from '@/lib/campaigns/types';
import { optimizedImage } from '@/lib/optimizedImage';
import type { useMyRewards } from '@/lib/useMyRewards';

interface CampaignDialogProps {
  campaign: CampaignView;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  entry?: MyCampaign;
  isEnrolling: boolean;
  rewards: ReturnType<typeof useMyRewards>;
  onClose: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onClaim: () => void;
  /** "แลกสิทธิ์ลุ้น": opens the prize's reward popup on this page (owner 2026-11-07: stay where you are) */
  onRedeemPrize: () => void;
}

/** A winner's part of the popup: warm like the rest of the rewards, with the one thing left for them to do */
function WinnerPanel({ win, isBusy, onClaim, resultsHref }: { win: NonNullable<MyCampaign['win']>; isBusy: boolean; onClaim: () => void; resultsHref: string }) {
  if (win.status === 'forfeited' || win.expired) {
    return (
      <p className="text-sm font-semibold text-slate-600 text-center">
        สิทธิ์รับรางวัลนี้หมดแล้ว{' '}
        <Link href={resultsHref} className="underline">ดูผลรางวัล</Link>
      </p>
    );
  }
  const claimDay = win.claimBy ? new Date(win.claimBy).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }) : '';
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#FFC83D] bg-amber-50 p-3.5">
      <p className="flex items-center gap-2 text-base font-bold text-slate-900">
        <PartyPopper className="w-5 h-5 shrink-0 text-[#F26430]" aria-hidden="true" />
        {win.status === 'confirmed' ? 'รับรางวัลเรียบร้อยแล้ว' : 'ยินดีด้วย คุณคือผู้โชคดี!'}
      </p>
      <p className="mt-1 text-xs text-slate-600">
        รหัสสิทธิ์ <span className="font-mono font-bold text-slate-900">{win.code}</span>
        {win.status === 'pending' && ` · ยืนยันภายใน ${claimDay}`}
      </p>
      {win.status === 'claimed' && <p className="mt-2 text-sm font-medium text-slate-700">ยืนยันแล้ว ทีมงานจะติดต่อกลับทางอีเมลหรือเบอร์โทรของบัญชีนี้เพื่อตรวจตัวตนและส่งรางวัล ทีมงานไม่ขอเงินหรือรหัสผ่านจากคุณ</p>}
      {win.status === 'pending' && (
        <button type="button" onClick={onClaim} disabled={isBusy} className={`${dialogButton.primary} w-full mt-3`}>
          {isBusy ? 'กำลังยืนยัน…' : 'ยืนยันรับรางวัล'}
        </button>
      )}
    </div>
  );
}

/**
 * One campaign: the prize, what to do, the rules, and the one action always in view at the bottom. Guests are asked to
 * sign up, members join here, and a member who joined comes back to see where they stand (owner 2026-11-04).
 */
export function CampaignDialog({ campaign, isLoggedIn, isEnrolled, entry, isEnrolling, rewards, onClose, onJoin, onLeave, onClaim, onRedeemPrize }: CampaignDialogProps) {
  const titleId = useId();
  const { prize, cost, short, entered, ready, percent, done, total } = campaignStanding(campaign, rewards);
  // ตี้ and moments count only after these two; joining a campaign does not need them, so it says so here
  const trust = useMemberSession().member?.trust;
  const needsConfirming = Boolean(isLoggedIn && isEnrolled && !entered && trust && (!trust.identityConfirmed || !trust.pledged));
  const image = optimizedImage(campaign.prizeImage, 640);
  const code = prize ? rewards.codes[prize.id] : undefined;
  const live = isCampaignLive(campaign);
  const resultsHref = `${RESULTS_PATH}#${encodeURIComponent(campaign.id)}`;
  const facts = [
    ['เปิดถึง', campaignDay(campaign.endDate)],
    ['ประกาศผล', prize?.drawEntry?.drawLabel],
    ['แลกสิทธิ์', prize ? `${cost.toLocaleString()} XP` : undefined],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));

  // The same width as a reward popup (components/rewards/RewardDialog.tsx), owner 2026-11-07
  return (
    <DialogShell onClose={onClose} size="md" bare labelledBy={titleId}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-7 pt-5 sm:pt-7 pb-4">
        {campaign.eyebrow && <p className="pr-12 text-xs font-semibold text-slate-500">{campaign.eyebrow}</p>}
        <h2 id={titleId} className="pr-12 mt-1 text-lg sm:text-xl font-bold leading-snug text-slate-900">{campaign.headline}</h2>
        {/* From a tablet up the picture sits beside the words, so the steps start higher (owner 2026-11-04) */}
        <div className="mt-4 sm:flex sm:items-start sm:gap-5">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link
            <img src={image} alt="" className="w-full h-32 sm:w-40 sm:h-32 shrink-0 rounded-2xl border border-[#F5E6B8] bg-white object-contain p-2" />
          )}
          <div className="min-w-0 flex-1 mt-4 sm:mt-0">
            {campaign.text && <p className="text-sm text-slate-600 leading-relaxed">{campaign.text}</p>}
            {prize?.discountValue && (
              <p className="mt-3 text-sm">
                <span className="block text-xs text-slate-500">ของรางวัล</span>
                <span className="font-semibold text-slate-800">{prize.discountValue}</span>
              </p>
            )}
            <dl className="mt-3 grid grid-cols-3 gap-x-3 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-800 tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Once it ends the steps are history: the result at the bottom is what matters */}
        {live && campaign.steps.length > 0 && (
          <section className="mt-5" aria-label="ชาเลนจ์ในแคมเปญ">
            <h3 className="text-sm font-bold text-slate-900">ทำตามนี้ให้ครบ</h3>
            <ul className="mt-1 divide-y divide-slate-100">
              {campaign.steps.map((step) => {
                const progress = rewards.quests.find((item) => item.questId === step.id);
                const done = Boolean(progress?.completed && progress.joined);
                return (
                  <li key={step.id}>
                    <Link href={`/challenges/${encodeURIComponent(step.id)}`} className="group py-2.5 flex items-center gap-2.5">
                      {done ? (
                        <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" aria-label="ทำครบแล้ว" /></span>
                      ) : (
                        <span className="w-5 h-5 shrink-0 rounded-full border-2 border-slate-300" aria-hidden="true" />
                      )}
                      <span className="min-w-0 flex-1 text-xs font-medium text-slate-700 truncate group-hover:underline">{step.title}</span>
                      {progress?.joined && !done && <span className="shrink-0 text-xs font-semibold text-slate-500 tabular-nums">{progress.current}/{progress.total}</span>}
                      <span className="shrink-0 text-xs font-semibold text-slate-500 tabular-nums">+{step.rewardPoints} XP</span>
                      <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {prize && prize.terms.length > 0 && (
          <details className="mt-3 text-xs text-slate-500">
            <summary className="min-h-9 flex items-center font-semibold text-slate-600 cursor-pointer">กติกาและเงื่อนไข</summary>
            <ul className="mt-1 space-y-1 pl-4 list-disc leading-relaxed">
              {prize.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </details>
        )}
        {/* To swap to another campaign; an entry already redeemed stays */}
        {isEnrolled && !entered && live && (
          <button type="button" onClick={onLeave} disabled={isEnrolling} className="mt-1 min-h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer">
            ออกจากแคมเปญนี้
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-5 sm:px-7 py-4">
        {needsConfirming && (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            ยืนยันตัวตนและรับคำมั่นของคอมมูนิตี้ก่อน แล้วไปตี้กับโพสต์โมเมนต์ถึงจะนับในแคมเปญ{' '}
            <Link href="/profile/settings" className="font-bold underline">ไปตั้งค่า</Link>
          </p>
        )}
        {entry?.win ? (
          <WinnerPanel win={entry.win} isBusy={isEnrolling} onClaim={onClaim} resultsHref={resultsHref} />
        ) : entry?.resultsOut ? (
          <p className="text-sm font-semibold text-slate-600 text-center">
            ประกาศผลแล้ว รอบนี้ยังไม่ใช่คุณ ขอบคุณที่ร่วมสนุกนะ{' '}
            <Link href={resultsHref} className="underline">ดูผลรางวัล</Link>
          </p>
        ) : entered ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#FFC83D] bg-amber-50 p-3">
            <span className="min-w-0">
              <span className="block text-xs font-bold text-slate-500">คุณมีสิทธิ์ลุ้นแล้ว</span>
              {code && <span className="block font-mono text-lg font-bold text-slate-900 tracking-wider">{code}</span>}
            </span>
            <Link href="/rewards?tab=my_vouchers" className="shrink-0 inline-flex items-center min-h-10 px-3.5 rounded-full bg-white hover:bg-amber-100 text-slate-800 text-sm font-bold">
              ดูสิทธิ์ของฉัน
            </Link>
          </div>
        ) : !live ? (
          <p className="text-sm font-semibold text-slate-600 text-center">แคมเปญนี้ไม่ได้เปิดรับอยู่ตอนนี้</p>
        ) : !isEnrolled ? (
          <button type="button" onClick={onJoin} disabled={isEnrolling} className={`${dialogButton.primary} w-full`}>
            {isEnrolling ? 'กำลังเข้าร่วม…' : isLoggedIn ? 'เข้าร่วมแคมเปญ' : 'สมัครสมาชิกเพื่อเข้าร่วม'}
          </button>
        ) : ready ? (
          <button type="button" onClick={onRedeemPrize} className={`${dialogButton.primary} w-full`}>
            แลกสิทธิ์ลุ้น
          </button>
        ) : (
          <div>
            <p className="flex items-baseline justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><Check className="w-4 h-4" aria-hidden="true" />เข้าร่วมแล้ว</span>
              {prize && <span className="font-semibold text-slate-600 tabular-nums">{rewards.balance.toLocaleString()} / {cost.toLocaleString()} XP</span>}
            </p>
            {prize && (
              <span className="mt-2 block h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                <span className="block h-full rounded-full bg-[#F59E0B]" style={{ width: `${percent}%` }} />
              </span>
            )}
            {prize && (
              <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
                {[done < total && `เหลืออีก ${total - done} ชาเลนจ์`, short > 0 && `อีก ${short.toLocaleString()} XP`].filter(Boolean).join(' · ')} ก็แลกสิทธิ์ลุ้นได้
              </p>
            )}
          </div>
        )}
      </div>
    </DialogShell>
  );
}
