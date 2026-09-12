'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Gift, 
  Sparkles, 
  Award, 
  Zap, 
  Tag, 
  Copy, 
  Check, 
  ChevronRight, 
  ArrowRight, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  ExternalLink, 
  AlertCircle, 
  Info, 
  Ticket, 
  X,
  Coffee,
  Dices,
  Shirt,
  Activity,
  Package,
  Palette,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Compass,
  QrCode
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { BrandLogo } from '@/components/BrandLogo';
import { 
  RewardShopItem, 
  REWARD_CATEGORIES, 
  REWARD_SHOP_ITEMS,
  getStoredUserXp,
  setStoredUserXp,
  getStoredRedeemedRewardIds,
  setStoredRedeemedRewardIds
} from '@/data/rewardsData';

export default function RewardsPage() {
  const [activeNavTab, setActiveNavTab] = useState('rewards');
  const { isLoggedIn, isAuthReady, userProfile, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Rewards State
  const [userXp, setUserXp] = useState<number>(650);
  const [redeemedRewardIds, setRedeemedRewardIds] = useState<string[]>(['reward-1']);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAffordable, setOnlyAffordable] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'catalog' | 'my_vouchers'>('catalog');

  // Modals
  const [confirmRedeemItem, setConfirmRedeemItem] = useState<RewardShopItem | null>(null);
  const [voucherDetailItem, setVoucherDetailItem] = useState<RewardShopItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sync with localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUserXp(getStoredUserXp());
    setRedeemedRewardIds(getStoredRedeemedRewardIds());

    // Check URL query parameters (e.g. ?tab=my_vouchers or ?category=cafe)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'my_vouchers') {
      setViewTab('my_vouchers');
    }
    const catParam = params.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, []);

  // Show auto-dismiss toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Copy voucher code
  const handleCopyVoucher = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(`คัดลอกรหัสคูปอง "${code}" เรียบร้อยแล้ว!`);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Execute redemption
  const handleConfirmRedemption = () => {
    if (!confirmRedeemItem) return;

    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      setConfirmRedeemItem(null);
      return;
    }

    if (userXp < confirmRedeemItem.costXp) {
      showToast('แต้มสะสม XP ไม่เพียงพอสำหรับของรางวัลนี้');
      setConfirmRedeemItem(null);
      return;
    }

    const newXp = userXp - confirmRedeemItem.costXp;
    const newRedeemedIds = [...redeemedRewardIds, confirmRedeemItem.id];

    setUserXp(newXp);
    setStoredUserXp(newXp);
    setRedeemedRewardIds(newRedeemedIds);
    setStoredRedeemedRewardIds(newRedeemedIds);

    const redeemed = confirmRedeemItem;
    setConfirmRedeemItem(null);
    showToast(`🎉 แลกรางวัล "${redeemed.title}" สำเร็จ! รหัสคูปอง: ${redeemed.voucherCode}`);
    setVoucherDetailItem(redeemed);
  };

  // Filtered Catalog
  const filteredRewards = useMemo(() => {
    return REWARD_SHOP_ITEMS.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchPartner = item.partner.toLowerCase().includes(query);
        const matchCat = item.categoryLabel.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchPartner && !matchCat) return false;
      }
      // 3. Affordability Filter
      if (onlyAffordable && userXp < item.costXp) {
        return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery, onlyAffordable, userXp]);

  // Redeemed items list
  const myRedeemedItems = useMemo(() => {
    return REWARD_SHOP_ITEMS.filter((item) => redeemedRewardIds.includes(item.id));
  }, [redeemedRewardIds]);

  // Helper for category Lucide icon
  const renderCategoryIcon = (category: string, className: string = 'w-4 h-4') => {
    switch (category) {
      case 'cafe':
        return <Coffee className={className} />;
      case 'boardgame':
        return <Dices className={className} />;
      case 'sports':
        return <Activity className={className} />;
      case 'workshop':
        return <Palette className={className} />;
      case 'merch':
        return <ShoppingBag className={className} />;
      default:
        return <Gift className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col selection:bg-[#4A7C59] selection:text-white pb-20 md:pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-bold py-3 px-6 rounded-2xl shadow-xl border border-slate-700 animate-fade-in flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        userName={userProfile?.name}
        isAuthReady={isAuthReady}
      />

      {/* ========================================================================= */}
      {/* 1. HERO & REWARDS IDENTITY BANNER                                         */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-white via-white/80 to-[#FDFBF7] border-b border-slate-200/80 pt-8 pb-10 sm:pt-12 sm:pb-12">
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <span>หน้าแรก</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">ศูนย์สิทธิพิเศษ & ของรางวัลไลฟ์สไตล์</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF3EE] border border-[#FCD5C5] text-[#D04A1B] text-xs font-bold shadow-2xs">
                <Gift className="w-3.5 h-3.5" />
                <span>Member Privileges & Rewards</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                ศูนย์สิทธิพิเศษ & ของรางวัลไลฟ์สไตล์
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                แลกรับสิทธิประโยชน์ ส่วนลดคาเฟ่ ตั๋วเวิร์กช็อป และของที่ระลึกพิเศษ ด้วยแต้มสะสม XP จากการออกไปใช้ชีวิตในทุกๆ วัน
              </p>
            </div>

            {/* Cross-Link Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/challenges"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>ทำภารกิจสะสมแต้ม XP</span>
              </Link>
              <Link
                href="/myhub"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>มายฮับ & นัดหมายของฉัน</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. USER XP WALLET CARD (Interactive Member Status)                         */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: XP Status */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-[#F26430] flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                  <Award className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      กระเป๋าแต้มสะสมของคุณ
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#2D5A3C] border border-[#A3CEB0]">
                      Level 2: Active Explorer
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                      {userXp.toLocaleString()}
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#F26430]">
                      XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Center / Right: Quick Actions */}
              <div className="flex items-center gap-3 flex-wrap border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewTab('my_vouchers')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                    viewTab === 'my_vouchers'
                      ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-emerald-600" />
                  <span>คลังคูปองของฉัน ({redeemedRewardIds.length} ใบ)</span>
                </button>

                <Link
                  href="/challenges"
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>วิธีรับแต้มเพิ่ม</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT: DUAL VIEWS (Catalog vs My Vouchers)                      */}
      {/* ========================================================================= */}
      <main className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">

        {/* View Mode Switcher */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200/80">
          <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className={`w-4 h-4 ${viewTab === 'catalog' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>แคตตาล็อกของรางวัลทั้งหมด ({REWARD_SHOP_ITEMS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab('my_vouchers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewTab === 'my_vouchers'
                  ? 'bg-[#EBF3ED] text-[#2D5A3C] shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ticket className={`w-4 h-4 ${viewTab === 'my_vouchers' ? 'text-[#2D5A3C]' : 'text-slate-400'}`} />
              <span>คลังคูปองที่แลกแล้ว ({redeemedRewardIds.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#4A7C59]" />
            <span>พาร์ทเนอร์ทางการของคอมมูนิตี้ ตรวจสอบสิทธิ์ได้ 100%</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: CATALOG OF REWARDS                                                */}
        {/* ========================================================================= */}
        {viewTab === 'catalog' && (
          <div className="space-y-6">
            
            {/* Category Filter Pills & Search Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Horizontal Scrollable Category Rail */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {REWARD_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#2D5A3C] text-white shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                        }`}
                      >
                        {cat.id !== 'all' && renderCategoryIcon(cat.id, 'w-3.5 h-3.5')}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & Only Affordable Checkbox */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหารางวัล หรือร้านค้า..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2D5A3C]/30 focus:border-[#2D5A3C]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-100 transition-colors shrink-0">
                    <input
                      type="checkbox"
                      checked={onlyAffordable}
                      onChange={(e) => setOnlyAffordable(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#2D5A3C] focus:ring-[#2D5A3C] cursor-pointer"
                    />
                    <span>เฉพาะที่แต้มพอ</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Rewards Cards Grid */}
            {filteredRewards.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-slate-200 text-center space-y-4 max-w-md mx-auto my-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/60">
                  <Gift className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-base">ไม่พบของรางวัลตามเงื่อนไขที่เลือก</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ลองปรับคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อสำรวจของรางวัลและคูปองส่วนลดที่มีทั้งหมด
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setOnlyAffordable(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredRewards.map((item) => {
                  const isRedeemed = redeemedRewardIds.includes(item.id);
                  const canAfford = userXp >= item.costXp;

                  return (
                    <div
                      key={item.id}
                      className={`group bg-white rounded-3xl border ${
                        isRedeemed
                          ? 'border-emerald-300 bg-emerald-50/10'
                          : 'border-slate-200/90 hover:border-amber-400/80'
                      } shadow-2xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between overflow-hidden relative`}
                    >
                      {/* Top Ribbon Header */}
                      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-b border-amber-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-white border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                            {renderCategoryIcon(item.category, 'w-3.5 h-3.5')}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 truncate">
                            {item.categoryLabel}
                          </span>
                        </div>

                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#F26430] text-white shadow-2xs shrink-0">
                          {item.costXp} XP
                        </span>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-[#D04A1B] bg-[#FEF3EE] px-2 py-0.5 rounded-md border border-[#FCD5C5]/70">
                              {item.discountValue}
                            </span>
                            <span className="text-slate-400">
                              เหลือ {item.stockCount} สิทธิ์
                            </span>
                          </div>

                          <h3
                            onClick={() => setVoucherDetailItem(item)}
                            className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] group-hover:text-[#D04A1B] transition-colors cursor-pointer"
                            title={item.title}
                          >
                            {item.title}
                          </h3>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5 text-[#2D5A3C] font-semibold">
                              <Tag className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                              <span className="truncate">{item.partner}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.partnerLocation}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Area */}
                        <div className="pt-3 border-t border-slate-100 mt-auto">
                          {isRedeemed ? (
                            /* Already Redeemed View */
                            <div className="bg-[#EBF3ED] border border-dashed border-[#A3CEB0] rounded-2xl p-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[10px] text-[#2D5A3C] font-bold block">รหัสคูปองของคุณ</span>
                                <strong className="text-xs font-mono font-black text-[#1E3F29] truncate block">
                                  {item.voucherCode}
                                </strong>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopyVoucher(item.voucherCode)}
                                  className="p-1.5 rounded-xl bg-white hover:bg-emerald-100 text-[#2D5A3C] border border-[#A3CEB0] transition-colors cursor-pointer shadow-2xs"
                                  title="คัดลอกรหัส"
                                >
                                  {copiedCode === item.voucherCode ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVoucherDetailItem(item)}
                                  className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                                  title="ดูเงื่อนไข & QR Code"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Redeem CTA Button */
                            <button
                              type="button"
                              onClick={() => setConfirmRedeemItem(item)}
                              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 ${
                                canAfford
                                  ? 'bg-gradient-to-r from-amber-500 to-[#F26430] hover:from-amber-600 hover:to-[#D95322] text-white shadow-orange-500/20'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>
                                {canAfford
                                  ? `แลกรับสิทธิ์ (${item.costXp} XP)`
                                  : `ต้องการอีก ${item.costXp - userXp} XP`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: MY VOUCHERS LOCKER                                                */}
        {/* ========================================================================= */}
        {viewTab === 'my_vouchers' && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#2D5A3C]" />
                  <span>คลังคูปองและสิทธิพิเศษที่คุณแลกไว้ ({myRedeemedItems.length} ใบ)</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  แสดงรหัสคูปองหรือให้พนักงานสแกน QR Code ณ ร้านค้าพาร์ทเนอร์ก่อนชำระเงินเพื่อรับส่วนลด
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewTab('catalog')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>แลกของรางวัลเพิ่ม</span>
              </button>
            </div>

            {myRedeemedItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-slate-200 text-center space-y-4 max-w-md mx-auto my-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                  <Ticket className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 text-base">คุณยังไม่มีคูปองในคลัง</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    คุณมีแต้มสะสม {userXp} XP สามารถเลือกแลกคูปองส่วนลด Specialty Coffee หรือตั๋วบอร์ดเกมได้ทันที
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewTab('catalog')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  ไปยังแคตตาล็อกของรางวัล
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {myRedeemedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between gap-4 relative overflow-hidden"
                  >
                    {/* Perforated ticket edge styling */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#D04A1B] bg-[#FEF3EE] px-2 py-0.5 rounded-md border border-[#FCD5C5]/70">
                          {item.discountValue}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#2D5A3C] font-semibold flex items-center gap-1 pt-0.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{item.partner}</span>
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-[#EBF3ED] text-[#2D5A3C] flex items-center justify-center shrink-0 border border-[#A3CEB0]">
                        {renderCategoryIcon(item.category, 'w-5 h-5')}
                      </div>
                    </div>

                    {/* Voucher Ticket Cutout Box */}
                    <div className="bg-[#EBF3ED]/70 rounded-2xl border border-dashed border-[#A3CEB0] p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>รหัสคูปอง (Voucher Code)</span>
                        <span className="text-emerald-800 font-bold">ใช้ได้ถึง {item.validUntil}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-2 border border-[#A3CEB0]/60">
                        <span className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-wider">
                          {item.voucherCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyVoucher(item.voucherCode)}
                          className="px-3 py-1 rounded-lg bg-[#2D5A3C] hover:bg-[#1E3F29] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          {copiedCode === item.voucherCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>คัดลอก</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setVoucherDetailItem(item)}
                        className="text-[#2D5A3C] hover:text-[#1E3F29] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>แสดง QR Code & เงื่อนไข</span>
                      </button>
                      <span className="text-slate-400 text-[11px]">
                        แลกด้วย {item.costXp} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. MODALS & DIALOGS                                                       */}
      {/* ========================================================================= */}

      {/* Confirmation Modal to Redeem */}
      {confirmRedeemItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <Gift className="w-5 h-5 text-[#F26430]" />
                <span>ยืนยันการแลกของรางวัล</span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRedeemItem(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold text-[#D04A1B] bg-[#FEF3EE] px-2 py-0.5 rounded-md border border-[#FCD5C5]/70">
                {confirmRedeemItem.discountValue}
              </span>
              <h4 className="font-bold text-sm text-slate-900">
                {confirmRedeemItem.title}
              </h4>
              <p className="text-xs text-slate-500">
                {confirmRedeemItem.description}
              </p>
              <div className="text-[11px] text-[#2D5A3C] font-semibold pt-1">
                พาร์ทเนอร์: {confirmRedeemItem.partner} ({confirmRedeemItem.partnerLocation})
              </div>
            </div>

            {/* XP Calculation Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>แต้มสะสมปัจจุบันของคุณ</span>
                <span className="font-bold text-slate-900">{userXp} XP</span>
              </div>
              <div className="flex items-center justify-between text-rose-600">
                <span>แต้มที่ต้องใช้แลก</span>
                <span className="font-bold">- {confirmRedeemItem.costXp} XP</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-bold text-slate-900">
                <span>แต้มสะสมคงเหลือหลังแลก</span>
                <span className="text-[#2D5A3C] font-black text-sm">
                  {userXp - confirmRedeemItem.costXp} XP
                </span>
              </div>
            </div>

            {/* Confirmation CTAs */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRedeemItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRedemption}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#F26430] hover:from-amber-600 hover:to-[#D95322] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>ยืนยันการแลกรับ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Detail & QR Code Modal */}
      {voucherDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <Ticket className="w-5 h-5 text-[#2D5A3C]" />
                <span>รายละเอียดคูปอง & สิทธิพิเศษ</span>
              </div>
              <button
                type="button"
                onClick={() => setVoucherDetailItem(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Card Showcase */}
            <div className="bg-[#EBF3ED] rounded-2xl border-2 border-dashed border-[#A3CEB0] p-5 text-center space-y-3">
              <span className="text-[10px] font-bold text-[#D04A1B] bg-[#FEF3EE] px-2.5 py-0.5 rounded-full border border-[#FCD5C5]">
                {voucherDetailItem.discountValue}
              </span>
              <h4 className="font-bold text-base text-slate-900">
                {voucherDetailItem.title}
              </h4>
              <p className="text-xs text-[#2D5A3C] font-semibold">
                {voucherDetailItem.partner}
              </p>

              {/* QR Mockup Box */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-2xs border border-slate-200 mx-auto">
                <div className="w-32 h-32 bg-slate-900 rounded-xl flex items-center justify-center text-white p-2">
                  <QrCode className="w-full h-full" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  SCAN TO REDEEM
                </span>
              </div>

              {/* Code display */}
              <div className="flex items-center justify-center gap-2 bg-white py-2 px-4 rounded-xl border border-[#A3CEB0]">
                <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                  {voucherDetailItem.voucherCode}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyVoucher(voucherDetailItem.voucherCode)}
                  className="text-xs text-[#2D5A3C] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                ใช้ได้ถึงวันที่ {voucherDetailItem.validUntil}
              </p>
            </div>

            {/* Terms and conditions */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>เงื่อนไขการใช้สิทธิ์:</span>
              </h5>
              <ul className="space-y-1 pl-4 list-disc text-slate-500 text-[11px] leading-relaxed">
                {voucherDetailItem.terms.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setVoucherDetailItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Auth Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับครับ!');
        }}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 space-y-2 mt-auto">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
          <BrandLogo size="xs" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">
          ศูนย์ของรางวัลและสิทธิพิเศษคอมมูนิตี้ เพื่อเชื่อมต่อความสุขและมิตรภาพของทุกไลฟ์สไตล์
        </p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Mobile Floating Nav Bar */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={0}
      />
    </div>
  );
}
