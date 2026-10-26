'use client';

import React, { useState, useEffect, useMemo, useId } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, Camera, Check, ChevronRight, Coffee, Copy, Dices, Gift, Palette, ShoppingBag, Sparkles, Ticket, Trophy, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { RewardShopItem, REWARD_CATEGORIES, REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { useMyRewards } from '@/lib/useMyRewards';
import { Toast } from '@/components/Toast';

const CHIP = 'shrink-0 inline-flex items-center min-h-9 px-3.5 rounded-full text-sm font-bold transition-colors cursor-pointer';
const QUIET_BUTTON = 'inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-full border border-slate-300 hover:border-slate-900 text-slate-800 text-sm font-bold whitespace-nowrap cursor-pointer';
/** Each kind of reward has its own icon and a light, happy tile colour */
const CATEGORY_LOOK: Record<RewardShopItem['category'], { icon: LucideIcon; tile: string }> = {
  cafe: { icon: Coffee, tile: 'bg-amber-100 text-amber-700' },
  boardgame: { icon: Dices, tile: 'bg-sky-100 text-sky-700' },
  sports: { icon: Activity, tile: 'bg-emerald-100 text-emerald-700' },
  workshop: { icon: Palette, tile: 'bg-rose-100 text-rose-700' },
  merch: { icon: ShoppingBag, tile: 'bg-orange-100 text-orange-700' },
};
/** How XP is earned, said once in the wallet card */
const EARN: { icon: LucideIcon; text: string; xp: string }[] = [
  { icon: Users, text: 'ไปตี้ (คนจัดเช็กอินให้)', xp: '+50' },
  { icon: Camera, text: 'แชร์โมเมนต์จากที่เที่ยวหรืออีเวนต์', xp: '+30' },
  { icon: Trophy, text: 'ทำชาเลนจ์ครบ', xp: 'รับเพิ่ม' },
];
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

/**
 * แลกของรางวัล, laid out like the profile: a wallet card on the left (sticky from lg) with my XP, how close the
 * next reward is, how to earn more and my coupons; the rewards on the right. It should feel like getting a gift
 * (owner 2026-10-25): a sunny ticket-shaped wallet, coloured category tiles, and confetti when a reward is redeemed.
 * Flat colours only (DESIGN_SYSTEM → Gradients); the one blue action stays blue; no purple.
 * Points and redemptions come from the account (GET/POST /api/rewards); the catalog is still sample data.
 */
export default function RewardsPage() {
  const [activeNavTab, setActiveNavTab] = useState('rewards');
  const { isLoggedIn, isAuthReady, userProfile, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const myRewards = useMyRewards(isLoggedIn);
  const userXp = myRewards.balance;
  const redeemedRewardIds = myRewards.redeemedRewardIds;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [viewTab, setViewTab] = useState<'catalog' | 'my_vouchers'>('catalog');

  const [detailItem, setDetailItem] = useState<RewardShopItem | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  /** The reward just redeemed in this dialog: it opens on the celebration instead of the details */
  const [justRedeemedId, setJustRedeemedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const celebrateTitleId = useId();

  // ?tab=my_vouchers, ?category=cafe and ?reward=ID open the page where a link points
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'my_vouchers') setViewTab('my_vouchers');
    const category = params.get('category');
    if (category) setSelectedCategory(category);
    // ?reward=ID opens that reward (the launch campaign links to its prize)
    const reward = REWARD_SHOP_ITEMS.find((item) => item.id === params.get('reward'));
    if (reward) setDetailItem(reward);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  /** A draw entry has the member's own code; a voucher has the partner's code */
  const codeOf = (item: RewardShopItem) => myRewards.codes[item.id] ?? item.voucherCode;
  const amountOf = (item: RewardShopItem) =>
    item.drawEntry ? `${item.discountValue} · จับรางวัล ${item.drawEntry.drawLabel}` : `${item.discountValue} · เหลือ ${item.stockCount} สิทธิ์`;
  const untilOf = (item: RewardShopItem) => (item.drawEntry ? `ประกาศผล ${item.drawEntry.drawLabel}` : `ใช้ได้ถึง ${item.validUntil}`);

  const handleCopyVoucher = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('คัดลอกรหัสแล้ว');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const openItem = (item: RewardShopItem) => {
    setIsConfirming(false);
    setJustRedeemedId(null);
    setDetailItem(item);
  };

  const handleRedeem = async () => {
    if (!detailItem || isRedeeming) return;
    if (!isLoggedIn) {
      setDetailItem(null);
      setIsAuthModalOpen(true);
      return;
    }
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    // The server checks the balance again and records the spending
    setIsRedeeming(true);
    const result = await myRewards.redeem(detailItem.id);
    setIsRedeeming(false);
    setIsConfirming(false);
    if (!result.ok) {
      showToast(result.message || 'แลกไม่สำเร็จ ลองใหม่อีกครั้งนะ');
      return;
    }
    setJustRedeemedId(detailItem.id);
  };

  const filteredRewards = useMemo(
    () =>
      REWARD_SHOP_ITEMS.filter(
        (item) => (selectedCategory === 'all' || item.category === selectedCategory) && (!onlyAffordable || userXp >= item.costXp)
      ),
    [selectedCategory, onlyAffordable, userXp]
  );
  const myRedeemedItems = useMemo(() => REWARD_SHOP_ITEMS.filter((item) => redeemedRewardIds.includes(item.id)), [redeemedRewardIds]);
  // What the wallet cheers about: how many I can take now, or how far the next one is
  const openRewards = REWARD_SHOP_ITEMS.filter((item) => !redeemedRewardIds.includes(item.id));
  const affordableCount = openRewards.filter((item) => item.costXp <= userXp).length;
  const nextGoal = openRewards.filter((item) => item.costXp > userXp).sort((a, b) => a.costXp - b.costXp)[0];

  const detailRedeemed = detailItem ? redeemedRewardIds.includes(detailItem.id) : false;
  const detailShort = detailItem ? Math.max(0, detailItem.costXp - userXp) : 0;
  const celebrating = !!detailItem && justRedeemedId === detailItem.id;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        userName={userProfile?.name}
        isAuthReady={isAuthReady}
      />
      <Toast message={toastMessage} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-16">
        <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16 lg:items-start">
          {/* Wallet, shaped like a ticket: what I have and the next reward on top, how to get more below the tear line */}
          <aside className="lg:sticky lg:top-24">
            <section className="relative rounded-3xl bg-[#FFD84D] text-slate-900 shadow-[0_10px_30px_rgba(242,100,48,0.18)]">
              <WalletConfetti />
              <div className="relative p-6 sm:p-7">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Gift className="w-4 h-4" aria-hidden="true" />
                  XP ของคุณ
                </p>
                {isLoggedIn ? (
                  <>
                    <p className="mt-1 text-6xl font-bold tracking-tight tabular-nums">{userXp.toLocaleString()}</p>
                    {affordableCount > 0 ? (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-900">
                        <Sparkles className="w-4 h-4 text-[#F26430]" aria-hidden="true" />
                        ตอนนี้แลกได้ <span className="tabular-nums">{affordableCount}</span> ชิ้น
                      </p>
                    ) : nextGoal ? (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-slate-800">
                          อีก <span className="font-bold tabular-nums">{(nextGoal.costXp - userXp).toLocaleString()}</span> XP แลก {nextGoal.title} ได้
                        </p>
                        <span className="mt-2 block h-2 rounded-full bg-white/70 overflow-hidden" aria-hidden="true">
                          <span className="block h-full rounded-full bg-[#F26430]" style={{ width: `${Math.max(4, Math.min(100, Math.round((userXp / nextGoal.costXp) * 100)))}%` }} />
                        </span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm font-medium text-slate-800">ออกไปเจอเพื่อนใหม่ ได้ XP มาแลกของจริงจากร้านพาร์ทเนอร์</p>
                    <button type="button" onClick={() => setIsAuthModalOpen(true)} className={`${dialogButton.primary} mt-4 w-full`}>
                      เข้าสู่ระบบเพื่อดู XP
                    </button>
                  </>
                )}
              </div>

              {/* The tear line, with a notch cut on each side. On a phone the coupons view keeps only the top half, so the codes come first */}
              <div className={`relative h-0 ${viewTab === 'my_vouchers' ? 'hidden lg:block' : ''}`} aria-hidden="true">
                <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-white" />
                <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-white" />
                <span className="absolute left-5 right-5 top-0 border-t-2 border-dashed border-slate-900/15" />
              </div>

              <div className={`relative p-6 sm:p-7 ${viewTab === 'my_vouchers' ? 'hidden lg:block' : ''}`}>
                <p className="text-sm font-bold text-slate-900">ได้ XP จาก</p>
                <ul className="mt-3 space-y-3">
                  {EARN.map((row) => (
                    <li key={row.text} className="flex items-center gap-3 text-sm">
                      <span className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                        <row.icon className="w-4 h-4 text-slate-800" aria-hidden="true" />
                      </span>
                      <span className="flex-1 font-medium text-slate-800">{row.text}</span>
                      <span className="font-bold text-slate-900 tabular-nums">{row.xp}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/challenges" className="mt-4 inline-flex items-center gap-0.5 text-sm font-bold text-slate-900 underline-offset-4 hover:underline">
                  ดูชาเลนจ์ที่เปิดอยู่
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setViewTab(viewTab === 'my_vouchers' ? 'catalog' : 'my_vouchers')}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 min-h-11 rounded-full bg-white hover:bg-white/80 text-slate-900 text-sm font-bold shadow-sm cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" aria-hidden="true" />
                    {viewTab === 'my_vouchers' ? 'ดูของรางวัลทั้งหมด' : <>คูปองของฉัน <span className="tabular-nums">({redeemedRewardIds.length})</span></>}
                  </button>
                )}
              </div>
            </section>
          </aside>

          <div className="min-w-0">
            {viewTab === 'catalog' ? (
              <>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">แลกของรางวัล</h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600">ส่วนลดและของจากร้านพาร์ทเนอร์ แลกด้วย XP ที่ได้จากการออกไปใช้ชีวิต</p>

                {/* Filters: categories, and only what I can afford now */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
                    {REWARD_CATEGORIES.map((cat) => {
                      const selected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          aria-pressed={selected}
                          className={`${CHIP} ${selected ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {isLoggedIn && (
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none shrink-0">
                      <input type="checkbox" checked={onlyAffordable} onChange={(e) => setOnlyAffordable(e.target.checked)} className="w-4 h-4 accent-[#F26430] cursor-pointer" />
                      แลกได้ตอนนี้
                    </label>
                  )}
                </div>

                {filteredRewards.length === 0 ? (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 p-5">
                    <p className="text-sm font-medium text-slate-700">{onlyAffordable ? 'XP ยังไม่พอแลกชิ้นไหนในหมวดนี้ ไปตี้หรือทำชาเลนจ์เพิ่มอีกนิดนะ' : 'หมวดนี้ยังไม่มีของรางวัล'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setOnlyAffordable(false);
                      }}
                      className={QUIET_BUTTON}
                    >
                      ดูทั้งหมด
                    </button>
                  </div>
                ) : (
                  <ul className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredRewards.map((item) => {
                      const redeemed = redeemedRewardIds.includes(item.id);
                      const short = item.costXp - userXp;
                      const ready = isLoggedIn && !redeemed && short <= 0;
                      const look = CATEGORY_LOOK[item.category] ?? { icon: Gift, tile: 'bg-slate-100 text-slate-700' };
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => openItem(item)}
                            className={`w-full h-full text-left flex flex-col rounded-2xl border bg-white p-5 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.10)] transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] ${ready ? 'border-[#FFC83D] ring-1 ring-[#FFC83D]' : 'border-slate-200'}`}
                          >
                            <span className="flex items-center gap-3">
                              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${look.tile}`}>
                                <look.icon className="w-5 h-5" aria-hidden="true" />
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-slate-500 line-clamp-1">{item.partner}</span>
                            </span>
                            <span className="mt-4 text-base font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.75rem]">{item.title}</span>
                            <span className="mt-1 text-sm font-medium text-slate-500 tabular-nums">
                              {amountOf(item)}
                            </span>

                            <span className="mt-auto pt-5">
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-lg font-bold text-slate-900 tabular-nums">{item.costXp} XP</span>
                                {redeemed ? (
                                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                                    <Check className="w-4 h-4" aria-hidden="true" />
                                    แลกแล้ว
                                  </span>
                                ) : ready ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD84D] px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-900">
                                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                                    แลกได้เลย
                                  </span>
                                ) : isLoggedIn ? (
                                  <span className="text-sm font-bold text-slate-500 tabular-nums">ขาดอีก {short}</span>
                                ) : null}
                              </span>
                              {/* How close I am: a warm bar while XP is short */}
                              {isLoggedIn && !redeemed && short > 0 && (
                                <span className="mt-2 block h-1.5 rounded-full bg-amber-100 overflow-hidden" aria-hidden="true">
                                  <span className="block h-full rounded-full bg-[#F26430]" style={{ width: `${Math.min(100, Math.round((userXp / item.costXp) * 100))}%` }} />
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <>
                {/* My coupons: the codes to show at the shop */}
                <button type="button" onClick={() => setViewTab('catalog')} className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  ของรางวัลทั้งหมด
                </button>
                <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">คูปองของฉัน</h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600">โชว์รหัสให้พนักงานดูก่อนจ่ายเงิน</p>

                {myRedeemedItems.length === 0 ? (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 p-5">
                    <p className="text-sm font-medium text-slate-700">ยังไม่มีคูปอง ตอนนี้มี {userXp.toLocaleString()} XP ลองดูว่าแลกอะไรได้บ้าง</p>
                    <button type="button" onClick={() => setViewTab('catalog')} className={QUIET_BUTTON}>
                      ดูของรางวัล
                    </button>
                  </div>
                ) : (
                  <ul className="mt-6 grid gap-3">
                    {myRedeemedItems.map((item) => {
                      const look = CATEGORY_LOOK[item.category] ?? { icon: Gift, tile: 'bg-slate-100 text-slate-700' };
                      return (
                        <li key={item.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          <button type="button" onClick={() => openItem(item)} className="min-w-0 flex-1 flex items-center gap-3 text-left cursor-pointer group">
                            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${look.tile}`}>
                              <look.icon className="w-5 h-5" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-slate-500 truncate">{item.partner}</span>
                              <span className="block text-base font-bold text-slate-900 group-hover:underline">{item.title}</span>
                              <span className="block text-xs font-medium text-slate-500 tabular-nums">{untilOf(item)}</span>
                            </span>
                          </button>
                          <span className="flex items-center justify-between sm:justify-end gap-2 shrink-0 rounded-xl border-2 border-dashed border-[#FFC83D] bg-amber-50 pl-3 pr-1 py-1">
                            <span className="font-mono text-base font-bold text-slate-900 tracking-wider">{codeOf(item)}</span>
                            <button type="button" onClick={() => handleCopyVoucher(codeOf(item))} className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full bg-white hover:bg-amber-100 text-slate-800 text-sm font-bold cursor-pointer">
                              {copiedCode === codeOf(item) ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                              {copiedCode === codeOf(item) ? 'คัดลอกแล้ว' : 'คัดลอก'}
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Just redeemed: confetti, the code, and the way to my coupons */}
      {detailItem && celebrating && (
        <DialogShell onClose={() => setDetailItem(null)} size="sm" bare labelledBy={celebrateTitleId}>
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
              {detailItem.title}
              <br />
              ที่ {detailItem.partner} เป็นของคุณแล้ว
            </p>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-[#FFC83D] bg-amber-50 p-4">
              <p className="text-xs font-bold text-slate-500">{detailItem.drawEntry ? 'รหัสสิทธิ์ลุ้นของคุณ · เก็บไว้ดูตอนประกาศผล' : 'รหัสคูปอง · โชว์ให้พนักงานดูก่อนจ่ายเงิน'}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tracking-wider">{codeOf(detailItem)}</p>
              <button type="button" onClick={() => handleCopyVoucher(codeOf(detailItem))} className="mt-3 inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full bg-white hover:bg-amber-100 text-slate-800 text-sm font-bold cursor-pointer">
                {copiedCode === codeOf(detailItem) ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedCode === codeOf(detailItem) ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
              </button>
              <p className="mt-3 text-xs font-medium text-slate-500 tabular-nums">{untilOf(detailItem)} · เหลือ {userXp.toLocaleString()} XP</p>
            </div>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetailItem(null);
                  setViewTab('my_vouchers');
                }}
                className={`${dialogButton.primary} w-full`}
              >
                ดูคูปองของฉัน
              </button>
              <button type="button" onClick={() => setDetailItem(null)} className={`${dialogButton.quiet} w-full`}>
                แลกอย่างอื่นต่อ
              </button>
            </div>
          </div>
        </DialogShell>
      )}

      {/* One dialog per reward: details and conditions, then redeem (asks once to confirm), or the code once redeemed */}
      {detailItem && !celebrating && (
        <DialogShell onClose={() => setDetailItem(null)} size="sm" title={detailItem.title} subtitle={detailItem.partner}>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">{detailItem.description}</p>
          <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-sm">
            {[
              ['สิทธิ์', amountOf(detailItem)],
              ['ใช้ที่', detailItem.partnerLocation],
              ['ใช้ได้ถึง', detailItem.validUntil],
              ['ใช้', `${detailItem.costXp} XP`],
            ].map(([label, value]) => (
              <div key={label} className="py-2.5 grid grid-cols-[6rem_1fr] gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          {detailItem.terms.length > 0 && (
            <ul className="mt-4 space-y-1 pl-4 list-disc text-xs text-slate-500 leading-relaxed">
              {detailItem.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          )}

          {detailRedeemed ? (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#FFC83D] bg-amber-50 p-3">
              <span className="font-mono text-lg font-bold text-slate-900 tracking-wider">{codeOf(detailItem)}</span>
              <button type="button" onClick={() => handleCopyVoucher(codeOf(detailItem))} className="inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full bg-white hover:bg-amber-100 text-slate-800 text-sm font-bold cursor-pointer">
                {copiedCode === codeOf(detailItem) ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedCode === codeOf(detailItem) ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {isConfirming && (
                <p className="text-sm font-medium text-slate-700 tabular-nums">
                  ใช้ {detailItem.costXp} XP จาก {userXp.toLocaleString()} XP เหลือ {(userXp - detailItem.costXp).toLocaleString()} XP แลกเลยไหม
                </p>
              )}
              <button type="button" onClick={handleRedeem} disabled={(isLoggedIn && detailShort > 0) || isRedeeming} className={`${dialogButton.primary} w-full`}>
                {!isLoggedIn ? 'เข้าสู่ระบบเพื่อแลก' : detailShort > 0 ? `ขาดอีก ${detailShort} XP` : isRedeeming ? 'กำลังแลก…' : isConfirming ? 'ยืนยัน แลกเลย' : `แลกด้วย ${detailItem.costXp} XP`}
              </button>
            </div>
          )}
        </DialogShell>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบแล้ว');
        }}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบแล้ว');
        }}
      />
      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} favoritesCount={0} />
    </div>
  );
}

/** A few still confetti bits in the wallet's top corner: the card should look like good news */
function WalletConfetti() {
  return (
    <svg className="pointer-events-none absolute right-4 top-4 w-28 h-20" viewBox="0 0 112 80" aria-hidden="true">
      <rect x="70" y="6" width="9" height="9" rx="2" fill="#F26430" transform="rotate(18 74 10)" />
      <circle cx="98" cy="22" r="4.5" fill="#2563EB" />
      <rect x="86" y="44" width="12" height="5" rx="2.5" fill="#10B981" transform="rotate(-30 92 46)" />
      <circle cx="56" cy="30" r="3.5" fill="#F472B6" />
      <rect x="40" y="8" width="10" height="4.5" rx="2.25" fill="#FFFFFF" transform="rotate(35 45 10)" />
      <circle cx="104" cy="62" r="3" fill="#FFFFFF" />
    </svg>
  );
}
