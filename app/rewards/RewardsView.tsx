'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PhraseText } from '@/components/auth/PhraseText';
import Link from 'next/link';
import { Activity, ArrowLeft, Camera, Check, ChevronRight, Coffee, Copy, Dices, Gift, Palette, ShoppingBag, Sparkles, Ticket, Trophy, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { dialogButton } from '@/components/auth/DialogShell';
import { RewardShopItem, REWARD_CATEGORIES, REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { useMyRewards } from '@/lib/useMyRewards';
import { optimizedImage } from '@/lib/optimizedImage';
import { Toast } from '@/components/Toast';
import { PromoBoard } from '@/components/campaigns/PromoBoard';
import { RewardDialog } from '@/components/rewards/RewardDialog';
import { useCampaigns } from '@/components/campaigns/useCampaigns';
import type { CampaignView } from '@/lib/campaigns/types';

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
  { icon: Camera, text: 'แชร์โมเมนต์ถ่ายที่นั่น (เปิดตำแหน่ง หรือรอทีมงานตรวจรูป)', xp: '+30' },
  { icon: Trophy, text: 'ทำชาเลนจ์ครบ', xp: 'รับเพิ่ม' },
];
/** The XP tickets lean a little, each its own way, like the challenge stickers */
const TICKET_TILTS = ['-rotate-6', 'rotate-3', '-rotate-3', 'rotate-6'];
/**
 * แลกของรางวัล in one calm column (owner 2026-11-08: more minimal, no big yellow block first on a phone): the title, one
 * slim sunny wallet strip (my XP, the next reward, my coupons), the rewards, then how to earn more. It should still feel
 * like getting a gift (owner 2026-10-25): yellow XP tickets, coloured category tiles, and confetti when a reward is redeemed.
 * Flat colours only (DESIGN_SYSTEM → Gradients); the one blue action stays blue; no purple.
 * Points and redemptions come from the account (GET/POST /api/rewards); the catalog is still sample data.
 */
export default function RewardsView({ campaigns }: { campaigns: CampaignView[] }) {
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
  const myCampaigns = useCampaigns({ campaigns, isLoggedIn, isAuthReady, rewards: myRewards, onLoggedIn: () => handleSetIsLoggedIn(true), onToast: showToast });
  const campaignsToJoin = campaigns.filter((item) => !myCampaigns.mine.some((entry) => entry.campaign.id === item.id));

  /** A draw entry has the member's own code; a voucher has the partner's code */
  const codeOf = (item: RewardShopItem) => myRewards.codes[item.id] ?? item.voucherCode;
  const untilOf = (item: RewardShopItem) => (item.drawEntry ? `ประกาศผล ${item.drawEntry.drawLabel}` : `ใช้ได้ถึง ${item.validUntil}`);

  const handleCopyVoucher = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('คัดลอกรหัสแล้ว');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const openItem = (item: RewardShopItem) => setDetailItem(item);

  const filteredRewards = useMemo(
    () =>
      REWARD_SHOP_ITEMS.filter(
        // A draw prize is reached through its campaign in the row above (owner 2026-11-04); ?reward=ID still opens it
        (item) => !item.campaignOnly && !item.drawEntry && (selectedCategory === 'all' || item.category === selectedCategory) && (!onlyAffordable || userXp >= item.costXp)
      ),
    [selectedCategory, onlyAffordable, userXp]
  );
  const myRedeemedItems = useMemo(() => REWARD_SHOP_ITEMS.filter((item) => redeemedRewardIds.includes(item.id)), [redeemedRewardIds]);
  // What the wallet cheers about: how many I can take now, or how far the next one is
  const openRewards = REWARD_SHOP_ITEMS.filter((item) => !item.campaignOnly && !item.drawEntry && !redeemedRewardIds.includes(item.id));
  const affordableCount = openRewards.filter((item) => item.costXp <= userXp).length;
  const nextGoal = openRewards.filter((item) => item.costXp > userXp).sort((a, b) => a.costXp - b.costXp)[0];


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
      {myCampaigns.dialog}

      <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 xl:pb-16">
        {viewTab === 'catalog' ? (
          <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">แลกของรางวัล</h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-slate-600">ส่วนลดและของจากร้านพาร์ทเนอร์ แลกด้วย XP ที่ได้จากการออกไปใช้ชีวิต</p>
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
          </>
        )}

        {/* The wallet: one slim, sunny strip with my XP, how close the next reward is, and my coupons (owner 2026-11-08:
            no big yellow block filling a phone screen first) */}
        <section aria-label="XP ของคุณ" className="relative mt-5 rounded-2xl bg-[#FFF6DC] px-4 py-3.5 sm:px-5 sm:py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <WalletConfetti />
          {isLoggedIn ? (
            <>
              <p className="relative flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-slate-900">{userXp.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-700">XP</span>
              </p>
              <div className="relative min-w-0 flex-1 basis-48">
                {affordableCount > 0 ? (
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-[#F26430]" aria-hidden="true" />
                    ตอนนี้แลกได้ <span className="tabular-nums">{affordableCount}</span> ชิ้น
                  </p>
                ) : nextGoal ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      อีก <span className="font-bold tabular-nums">{(nextGoal.costXp - userXp).toLocaleString()}</span> XP แลก {nextGoal.title} ได้
                    </p>
                    <span className="mt-1.5 block h-1.5 max-w-xs rounded-full bg-[#F5E6B8] overflow-hidden" aria-hidden="true">
                      <span className="block h-full rounded-full bg-[#F26430]" style={{ width: `${Math.max(4, Math.min(100, Math.round((userXp / nextGoal.costXp) * 100)))}%` }} />
                    </span>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-slate-800">ไปตี้ แชร์โมเมนต์ หรือทำชาเลนจ์ เพื่อเก็บ XP เพิ่ม</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewTab(viewTab === 'my_vouchers' ? 'catalog' : 'my_vouchers')}
                className="relative inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-full bg-white hover:bg-white/80 text-slate-900 text-sm font-bold shadow-xs cursor-pointer"
              >
                <Ticket className="w-4 h-4" aria-hidden="true" />
                {viewTab === 'my_vouchers' ? 'ดูของรางวัลทั้งหมด' : <>คูปองของฉัน <span className="tabular-nums">({redeemedRewardIds.length})</span></>}
              </button>
            </>
          ) : (
            <>
              <p className="relative min-w-0 flex-1 basis-56 text-sm font-semibold text-slate-800"><PhraseText text="ออกไปเจอเพื่อนใหม่ ได้ XP มาแลกของจริง จากร้านพาร์ทเนอร์" /></p>
              <button type="button" onClick={() => setIsAuthModalOpen(true)} className={`${dialogButton.primary} relative`}>
                เข้าสู่ระบบเพื่อดู XP
              </button>
            </>
          )}
        </section>

        {viewTab === 'catalog' ? (
          <>
            {/* Draw prizes are not in the shop: the campaigns are the way to them (owner 2026-11-04). Joined ones live in My Hub */}
            <PromoBoard campaigns={campaignsToJoin} onOpen={myCampaigns.open} withRewards={false} className="mt-6" />

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
                      className={`${CHIP} ${selected ? 'bg-amber-50 border border-amber-400 text-amber-900' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}`}
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
              <>
                {/* The site's tile: a square photo, the XP on a yellow ticket, the name and the partner below (owner 2026-10-31) */}
                <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8">
                  {filteredRewards.map((item, i) => {
                    const redeemed = redeemedRewardIds.includes(item.id);
                    const ready = isLoggedIn && !redeemed && userXp >= item.costXp;
                    const look = CATEGORY_LOOK[item.category] ?? { icon: Gift, tile: 'bg-slate-100 text-slate-700' };
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openItem(item)}
                          className="group w-full text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-3xl"
                        >
                          <span className="relative block transition-transform duration-300 group-hover:-translate-y-1">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element -- sized by the image optimizer link
                              <img
                                src={optimizedImage(item.image, 384)}
                                alt=""
                                loading="lazy"
                                className={`w-full aspect-square object-cover rounded-3xl bg-slate-100 shadow-md ${redeemed ? 'opacity-70' : ''} ${ready ? 'ring-2 ring-[#FFC83D] ring-offset-2' : ''}`}
                              />
                            ) : (
                              <span className={`w-full aspect-square rounded-3xl shadow-md flex items-center justify-center ${look.tile}`}>
                                <look.icon className="w-10 h-10" aria-hidden="true" />
                              </span>
                            )}
                            {/* XP on a yellow ticket, tilted like the challenge stickers */}
                            <span className={`absolute -top-2.5 -left-1.5 ${TICKET_TILTS[i % TICKET_TILTS.length]} inline-flex items-center gap-1 rounded-full bg-[#FFD84D] text-slate-900 px-2.5 py-1 text-xs font-bold shadow-md tabular-nums`}>
                              <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
                              {item.costXp.toLocaleString()} XP
                            </span>
                            {(redeemed || ready) && (
                              <span className={`absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shadow-sm ${redeemed ? 'bg-white text-emerald-700' : 'bg-[#FFD84D] text-slate-900'}`}>
                                {redeemed ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
                                {redeemed ? 'แลกแล้ว' : 'แลกได้เลย'}
                              </span>
                            )}
                          </span>
                          <span className="mt-3 block text-sm sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">{item.title}</span>
                          <span title={item.partner} className="mt-1 block text-xs text-slate-500 truncate">{item.partner}</span>
                          {/* How close I am: a warm bar while XP is short */}
                          {isLoggedIn && !redeemed && !ready ? (
                            <span className="mt-2 flex items-center gap-2">
                              <span className="h-1.5 flex-1 rounded-full bg-amber-100 overflow-hidden" aria-hidden="true">
                                <span className="block h-full rounded-full bg-[#F26430]" style={{ width: `${Math.min(100, Math.round((userXp / item.costXp) * 100))}%` }} />
                              </span>
                              <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">ขาด {(item.costXp - userXp).toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="mt-0.5 block text-xs text-slate-500 tabular-nums truncate">{item.drawEntry ? item.discountValue : `เหลือ ${item.stockCount} สิทธิ์`}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* How to get more XP, said once and quietly, after the rewards */}
            <section className="mt-14 pt-8 border-t border-slate-200">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">ได้ XP จาก</h2>
                <Link href="/challenges" className="inline-flex items-center gap-0.5 min-h-10 text-sm font-bold text-[#2563EB] hover:underline shrink-0">
                  ดูชาเลนจ์ที่เปิดอยู่
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {EARN.map((row) => (
                  <li key={row.text} className="flex items-center gap-3 text-sm">
                    <span className="w-9 h-9 rounded-full bg-[#FFF6DC] flex items-center justify-center shrink-0">
                      <row.icon className="w-4 h-4 text-slate-800" aria-hidden="true" />
                    </span>
                    <span className="flex-1 font-medium text-slate-700">{row.text}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{row.xp}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <>
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
      </main>

      {/* One popup per reward, shared with the promo row on other pages (components/rewards/RewardDialog.tsx) */}
      {detailItem && (
        <RewardDialog
          key={detailItem.id}
          item={detailItem}
          rewards={myRewards}
          isLoggedIn={isLoggedIn}
          onClose={() => setDetailItem(null)}
          onNeedLogin={() => setIsAuthModalOpen(true)}
          onShowMyVouchers={() => {
            setDetailItem(null);
            setViewTab('my_vouchers');
          }}
          onToast={showToast}
        />
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
      <MobileNav activeTab={activeNavTab} setActiveTab={setActiveNavTab} />
    </div>
  );
}

/** A few still confetti bits in the wallet's top corner: the card should look like good news */
function WalletConfetti() {
  return (
    <svg className="pointer-events-none absolute right-3 top-1 w-16 h-11 sm:w-20 sm:h-14" viewBox="0 0 112 80" aria-hidden="true">
      <rect x="70" y="6" width="9" height="9" rx="2" fill="#F26430" transform="rotate(18 74 10)" />
      <circle cx="98" cy="22" r="4.5" fill="#2563EB" />
      <rect x="86" y="44" width="12" height="5" rx="2.5" fill="#10B981" transform="rotate(-30 92 46)" />
      <circle cx="56" cy="30" r="3.5" fill="#F472B6" />
      <rect x="40" y="8" width="10" height="4.5" rx="2.25" fill="#FFFFFF" transform="rotate(35 45 10)" />
      <circle cx="104" cy="62" r="3" fill="#FFFFFF" />
    </svg>
  );
}
