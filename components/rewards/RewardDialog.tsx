'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Copy, Gift } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import type { RewardShopItem } from '@/data/rewardsData';
import type { useMyRewards } from '@/lib/useMyRewards';
import { optimizedImage } from '@/lib/optimizedImage';

/** Confetti pieces for the redeemed moment: where each flies, its colour and shape */
const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const reach = 90 + (i % 4) * 28;
  return {
    dx: `${Math.round(Math.cos(angle) * reach)}px`,
    dy: `${Math.round(Math.sin(angle) * reach * 0.8 + 40)}px`,
    spin: `${(i % 2 ? 1 : -1) * (180 + i * 25)}deg`,
    color: ['#F26430', '#FFC83D', '#2563EB', '#10B981', '#F472B6'][i % 5],
    round: i % 3 === 0,
    delay: `${(i % 5) * 30}ms`,
  };
});

/** A draw entry has the member's own code; a voucher has the partner's code */
export const rewardCodeOf = (rewards: ReturnType<typeof useMyRewards>, item: RewardShopItem) => rewards.codes[item.id] ?? item.voucherCode;
const amountOf = (item: RewardShopItem) =>
  item.drawEntry ? `${item.discountValue} · จับรางวัล ${item.drawEntry.drawLabel}` : `${item.discountValue} · เหลือ ${item.stockCount} สิทธิ์`;
const untilOf = (item: RewardShopItem) => (item.drawEntry ? `ประกาศผล ${item.drawEntry.drawLabel}` : `ใช้ได้ถึง ${item.validUntil}`);

/**
 * One reward in a popup, on whatever page it was pressed (owner 2026-11-07: pressing a reward on the landing or
 * /challenges keeps you there): details and conditions, then redeem (asks once to confirm), the code once redeemed,
 * and confetti right after redeeming. Used by /rewards and by the promo row (components/campaigns/PromoBoard.tsx).
 * Mount it with a `key` per reward so each opens fresh.
 */
export function RewardDialog({ item, rewards, isLoggedIn, onClose, onNeedLogin, onShowMyVouchers, onToast }: {
  item: RewardShopItem;
  rewards: ReturnType<typeof useMyRewards>;
  isLoggedIn: boolean;
  onClose: () => void;
  /** A visitor pressed redeem: the page opens its sign-in */
  onNeedLogin: () => void;
  /** "ดูคูปองของฉัน" after redeeming; elsewhere than /rewards it goes to the coupons there */
  onShowMyVouchers?: () => void;
  onToast?: (message: string) => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<{ id: string; message: string; needsIdentity: boolean } | null>(null);
  const celebrateTitleId = useId();
  const router = useRouter();
  const userXp = rewards.balance;
  const detailRedeemed = rewards.redeemedRewardIds.includes(item.id);
  const detailShort = Math.max(0, item.costXp - userXp);
  const codeOf = (reward: RewardShopItem) => rewardCodeOf(rewards, reward);

  const handleCopyVoucher = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onToast?.('คัดลอกรหัสแล้ว');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRedeem = async () => {
    if (isRedeeming) return;
    if (!isLoggedIn) {
      onClose();
      onNeedLogin();
      return;
    }
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    // The server checks the balance again and records the spending
    setIsRedeeming(true);
    const result = await rewards.redeem(item.id);
    setIsRedeeming(false);
    setIsConfirming(false);
    if (!result.ok) {
      // Said inside the dialog: a toast would sit behind it
      setRedeemError({ id: item.id, message: result.message || 'แลกไม่สำเร็จ ลองใหม่อีกครั้งนะ', needsIdentity: Boolean(result.needsIdentity) });
      return;
    }
    setCelebrating(true);
  };

  return (
    <>
      {/* Just redeemed: confetti, the code, and the way to my coupons */}
      {celebrating ? (
        <DialogShell onClose={() => onClose()} size="md" bare labelledBy={celebrateTitleId}>
          <div className="relative text-center p-6 sm:p-8 overflow-y-auto">
            <span className="pointer-events-none absolute left-1/2 top-16 sm:top-[4.5rem] motion-reduce:hidden" aria-hidden="true">
              {CONFETTI.map((piece, i) => (
                <span
                  key={i}
                  className={`absolute w-2.5 h-2.5 animate-confetti ${piece.round ? 'rounded-full' : 'rounded-[2px]'}`}
                  style={{ backgroundColor: piece.color, animationDelay: piece.delay, ['--dx' as string]: piece.dx, ['--dy' as string]: piece.dy, ['--spin' as string]: piece.spin } as React.CSSProperties}
                />
              ))}
            </span>
            <span className="relative mx-auto w-20 h-20 rounded-full bg-[#FFD84D] flex items-center justify-center animate-pop-in">
              <Gift className="w-9 h-9 text-slate-900" aria-hidden="true" />
            </span>
            <h2 id={celebrateTitleId} className="mt-5 text-2xl font-bold tracking-tight">แลกสำเร็จแล้ว!</h2>
            <p className="mt-2 text-sm font-medium text-slate-600 leading-relaxed">
              {item.title}
              <br />
              ที่ {item.partner} เป็นของคุณแล้ว
            </p>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-[#FFC83D] bg-amber-50 p-4">
              <p className="text-xs font-bold text-slate-500">{item.drawEntry ? 'รหัสสิทธิ์ลุ้นของคุณ · เก็บไว้ดูตอนประกาศผล' : 'รหัสคูปอง · โชว์ให้พนักงานดูก่อนจ่ายเงิน'}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tracking-wider">{codeOf(item)}</p>
              <button type="button" onClick={() => handleCopyVoucher(codeOf(item))} className="mt-3 inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full bg-white hover:bg-amber-100 text-slate-800 text-sm font-bold cursor-pointer">
                {copiedCode === codeOf(item) ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedCode === codeOf(item) ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
              </button>
              <p className="mt-3 text-xs font-medium text-slate-500 tabular-nums">{untilOf(item)} · เหลือ {userXp.toLocaleString()} XP</p>
            </div>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={onShowMyVouchers ?? (() => router.push('/rewards?tab=my_vouchers'))}
                className={`${dialogButton.primary} w-full`}
              >
                ดูคูปองของฉัน
              </button>
              <button type="button" onClick={() => onClose()} className={`${dialogButton.quiet} w-full`}>
                แลกอย่างอื่นต่อ
              </button>
            </div>
          </div>
        </DialogShell>
      ) : (
        <>
      {/* One dialog per reward: details and conditions, then redeem (asks once to confirm), or the code once redeemed */}
      
        <DialogShell onClose={() => onClose()} size="md" title={item.title} subtitle={item.partner}>
          {item.image && (
            // eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link
            <img src={optimizedImage(item.image, 640)} alt="" className={`mb-4 w-full aspect-[16/9] rounded-2xl bg-amber-50 ${item.drawEntry ? 'object-contain p-3 mix-blend-multiply' : 'object-cover'}`} />
          )}
          <p className="text-sm font-medium text-slate-600 leading-relaxed">{item.description}</p>
          <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-sm">
            {[
              ['สิทธิ์', amountOf(item)],
              ['ใช้ที่', item.partnerLocation],
              ['ใช้ได้ถึง', item.validUntil],
              ['ใช้', `${item.costXp} XP`],
            ].map(([label, value]) => (
              <div key={label} className="py-2.5 grid grid-cols-[6rem_1fr] gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          {item.terms.length > 0 && (
            <ul className="mt-4 space-y-1 pl-4 list-disc text-xs text-slate-500 leading-relaxed">
              {item.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          )}

          {detailRedeemed ? (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#FFC83D] bg-amber-50 p-3">
              <span className="font-mono text-lg font-bold text-slate-900 tracking-wider">{codeOf(item)}</span>
              <button type="button" onClick={() => handleCopyVoucher(codeOf(item))} className="inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full bg-white hover:bg-amber-100 text-slate-800 text-sm font-bold cursor-pointer">
                {copiedCode === codeOf(item) ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedCode === codeOf(item) ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {isConfirming && (
                <p className="text-sm font-medium text-slate-700 tabular-nums">
                  ใช้ {item.costXp} XP จาก {userXp.toLocaleString()} XP เหลือ {(userXp - item.costXp).toLocaleString()} XP แลกเลยไหม
                </p>
              )}
              {redeemError?.id === item.id && (
                <p role="alert" className="text-sm font-semibold text-rose-700">
                  {redeemError.message}
                  {redeemError.needsIdentity && <> <Link href="/profile/settings" className="underline">ไปยืนยันตัวตน</Link></>}
                </p>
              )}
              <button type="button" onClick={handleRedeem} disabled={(isLoggedIn && detailShort > 0) || isRedeeming} className={`${dialogButton.primary} w-full`}>
                {!isLoggedIn ? 'เข้าสู่ระบบเพื่อแลก' : detailShort > 0 ? `ขาดอีก ${detailShort} XP` : isRedeeming ? 'กำลังแลก…' : isConfirming ? 'ยืนยัน แลกเลย' : `แลกด้วย ${item.costXp} XP`}
              </button>
            </div>
          )}
        </DialogShell>
        </>
      )}
    </>
  );
}
