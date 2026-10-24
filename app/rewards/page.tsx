'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Ticket, Zap } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { RewardShopItem, REWARD_CATEGORIES, REWARD_SHOP_ITEMS } from '@/data/rewardsData';
import { useMyRewards } from '@/lib/useMyRewards';

const CHIP = 'shrink-0 inline-flex items-center min-h-9 px-3.5 rounded-full text-sm font-bold transition-colors cursor-pointer';

/**
 * แลกของรางวัล, drawn like the challenge page (owner 2026-10-24): open sections, no boxes inside boxes.
 * The catalog is the page; "คูปองของฉัน" is a second view opened from the top. Points and redemptions come from
 * the account (GET/POST /api/rewards); the catalog itself is still sample data (data/rewardsData.ts).
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ?tab=my_vouchers and ?category=cafe open the page where a link points
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'my_vouchers') setViewTab('my_vouchers');
    const category = params.get('category');
    if (category) setSelectedCategory(category);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyVoucher = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('คัดลอกรหัสแล้ว');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const openItem = (item: RewardShopItem) => {
    setIsConfirming(false);
    setDetailItem(item);
  };

  const handleRedeem = async () => {
    if (!detailItem) return;
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
    const result = await myRewards.redeem(detailItem.id);
    setIsConfirming(false);
    if (!result.ok) {
      showToast(result.message || 'แลกไม่สำเร็จ ลองใหม่อีกครั้งนะ');
      return;
    }
    showToast(`แลก "${detailItem.title}" แล้ว คูปองอยู่ในคูปองของฉัน`);
  };

  const filteredRewards = useMemo(
    () =>
      REWARD_SHOP_ITEMS.filter(
        (item) => (selectedCategory === 'all' || item.category === selectedCategory) && (!onlyAffordable || userXp >= item.costXp)
      ),
    [selectedCategory, onlyAffordable, userXp]
  );
  const myRedeemedItems = useMemo(() => REWARD_SHOP_ITEMS.filter((item) => redeemedRewardIds.includes(item.id)), [redeemedRewardIds]);

  const detailRedeemed = detailItem ? redeemedRewardIds.includes(detailItem.id) : false;
  const detailShort = detailItem ? Math.max(0, detailItem.costXp - userXp) : 0;

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
      {toastMessage && (
        <div role="status" className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-bold">
          {toastMessage}
        </div>
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-16">
        {viewTab === 'catalog' ? (
          <>
            {/* Head: what this page is, what the member has, how to get more */}
            <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">แลกของรางวัล</h1>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">XP จากการออกไปใช้ชีวิต แลกเป็นส่วนลดและของจากร้านพาร์ทเนอร์</p>
              </div>
              {isLoggedIn && (
                <button type="button" onClick={() => setViewTab('my_vouchers')} className={`${dialogButton.quiet} self-start sm:self-auto`}>
                  <Ticket className="w-4 h-4" aria-hidden="true" />
                  คูปองของฉัน <span className="tabular-nums">{redeemedRewardIds.length}</span>
                </button>
              )}
            </section>

            <section className="mt-6 py-5 border-y border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {isLoggedIn ? (
                <p className="inline-flex items-baseline gap-2">
                  <Zap className="w-6 h-6 self-center text-[#7C3AED]" aria-hidden="true" />
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">{userXp.toLocaleString()}</span>
                  <span className="text-base font-bold text-[#7C3AED]">XP ของคุณ</span>
                </p>
              ) : (
                <button type="button" onClick={() => setIsAuthModalOpen(true)} className={dialogButton.primary}>
                  เข้าสู่ระบบเพื่อดู XP ของคุณ
                </button>
              )}
              <p className="text-sm font-medium text-slate-600">
                ไปตี้ <span className="font-bold text-slate-900">+50</span> · แชร์โมเมนต์ <span className="font-bold text-slate-900">+30</span> · ทำชาเลนจ์ครบรับเพิ่ม{' '}
                <Link href="/challenges" className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
                  ดูชาเลนจ์
                </Link>
              </p>
            </section>

            {/* Filters: categories, and only what the member can afford now */}
            <section className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {REWARD_CATEGORIES.map((cat) => {
                  const selected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      aria-pressed={selected}
                      className={`${CHIP} ${selected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              {isLoggedIn && (
                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none shrink-0">
                  <input type="checkbox" checked={onlyAffordable} onChange={(e) => setOnlyAffordable(e.target.checked)} className="w-4 h-4 accent-slate-900 cursor-pointer" />
                  แลกได้ตอนนี้
                </label>
              )}
            </section>

            {filteredRewards.length === 0 ? (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200">
                <p className="text-sm font-medium text-slate-700">{onlyAffordable ? 'XP ยังไม่พอแลกชิ้นไหนในหมวดนี้ ไปตี้หรือทำชาเลนจ์เพิ่มอีกนิดนะ' : 'หมวดนี้ยังไม่มีของรางวัล'}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setOnlyAffordable(false);
                  }}
                  className="inline-flex items-center justify-center min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap cursor-pointer"
                >
                  ดูทั้งหมด
                </button>
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredRewards.map((item) => {
                  const redeemed = redeemedRewardIds.includes(item.id);
                  const short = item.costXp - userXp;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className="group w-full h-full text-left flex flex-col rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                      >
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">{item.partner}</span>
                        <span className="mt-1 text-sm sm:text-base font-bold text-slate-900 line-clamp-2 min-h-[2.5rem]">{item.title}</span>
                        <span className="mt-1 text-[11px] sm:text-xs font-semibold text-slate-600 tabular-nums truncate">
                          {item.discountValue} · เหลือ {item.stockCount} สิทธิ์
                        </span>
                        <span className="mt-auto pt-3 flex items-center justify-between gap-2">
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#7C3AED] text-white text-[11px] sm:text-xs font-bold tabular-nums">{item.costXp} XP</span>
                          <span className={`text-[11px] sm:text-xs font-bold tabular-nums truncate ${redeemed ? 'text-emerald-700' : isLoggedIn && short <= 0 ? 'text-[#2563EB]' : 'text-slate-500'}`}>
                            {redeemed ? 'แลกแล้ว' : !isLoggedIn ? 'ดูรายละเอียด' : short <= 0 ? 'แลกได้เลย' : `ขาดอีก ${short} XP`}
                          </span>
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
            {/* My vouchers: the codes to show at the shop */}
            <button type="button" onClick={() => setViewTab('catalog')} className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              ของรางวัลทั้งหมด
            </button>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">คูปองของฉัน</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">โชว์รหัสให้พนักงานดูก่อนจ่ายเงิน</p>

            {myRedeemedItems.length === 0 ? (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200">
                <p className="text-sm font-medium text-slate-700">ยังไม่มีคูปอง ตอนนี้มี {userXp.toLocaleString()} XP ลองดูว่าแลกอะไรได้บ้าง</p>
                <button type="button" onClick={() => setViewTab('catalog')} className="inline-flex items-center justify-center min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap cursor-pointer">
                  ดูของรางวัล
                </button>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                {myRedeemedItems.map((item) => (
                  <li key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button type="button" onClick={() => openItem(item)} className="min-w-0 text-left cursor-pointer group">
                      <span className="block text-xs font-semibold text-slate-500 truncate">{item.partner}</span>
                      <span className="block text-base font-bold text-slate-900 group-hover:underline">{item.title}</span>
                      <span className="block text-xs font-medium text-slate-500 tabular-nums">ใช้ได้ถึง {item.validUntil}</span>
                    </button>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-base font-bold text-slate-900 tracking-wider">{item.voucherCode}</span>
                      <button type="button" onClick={() => handleCopyVoucher(item.voucherCode)} className="inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer">
                        {copiedCode === item.voucherCode ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                        {copiedCode === item.voucherCode ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* One dialog per reward: details and conditions, then redeem (asks once to confirm), or the code once redeemed */}
      {detailItem && (
        <DialogShell onClose={() => setDetailItem(null)} size="sm" title={detailItem.title} subtitle={detailItem.partner}>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">{detailItem.description}</p>
          <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-sm">
            {[
              ['สิทธิ์', `${detailItem.discountValue} · เหลือ ${detailItem.stockCount} สิทธิ์`],
              ['ใช้ที่', detailItem.partnerLocation],
              ['ใช้ได้ถึง', detailItem.validUntil],
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
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-3">
              <span className="font-mono text-lg font-bold text-emerald-900 tracking-wider">{detailItem.voucherCode}</span>
              <button type="button" onClick={() => handleCopyVoucher(detailItem.voucherCode)} className="inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full bg-white hover:bg-emerald-100 text-emerald-800 text-sm font-bold cursor-pointer">
                {copiedCode === detailItem.voucherCode ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedCode === detailItem.voucherCode ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {isConfirming && (
                <p className="text-sm font-medium text-slate-700 tabular-nums">
                  ใช้ {detailItem.costXp} XP จาก {userXp.toLocaleString()} XP เหลือ {(userXp - detailItem.costXp).toLocaleString()} XP แลกเลยไหม
                </p>
              )}
              <button
                type="button"
                onClick={handleRedeem}
                disabled={isLoggedIn && detailShort > 0}
                className={`${dialogButton.primary} w-full`}
              >
                {!isLoggedIn ? 'เข้าสู่ระบบเพื่อแลก' : detailShort > 0 ? `ขาดอีก ${detailShort} XP` : isConfirming ? 'ยืนยัน แลกเลย' : `แลกด้วย ${detailItem.costXp} XP`}
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
