'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  Trophy, 
  Flame, 
  Sparkles, 
  Award, 
  Users, 
  Target, 
  ArrowRight,
  Crown, 
  Compass, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  Zap, 
  MapPin, 
  Camera, 
  Ticket, 
  Filter,
  Medal,
  Clock,
  AlertCircle,
  X,
  ShieldCheck,
  Check,
  Sprout,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { getQuestBrandReward } from '@/lib/questDisplay';
import { CreateEventModal } from '@/components/CreateEventModal';
import { BrandLogo } from '@/components/BrandLogo';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { Pagination } from '@/components/Pagination';
import { ChallengeQuest } from '@/data/mockData';
import { syncMyChallenges, useMyRewards, withRealProgress } from '@/lib/useMyRewards';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useMasterData } from '@/lib/useMasterData';

// Extended Quest Interface with Date, Duration & Image
export interface QuestWithDuration extends ChallengeQuest {
  startDate: string;
  endDate: string;
  daysRemaining: number;
  image?: string;
  status?: 'draft' | 'active' | 'ended';
  brandReward?: any;
}



export default function ChallengesDiscoveryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('challenges');
  const [statusFilter, setStatusFilter] = useState<'active' | 'ended'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  // What a challenge is about; the list of categories is managed in the admin console
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { questCategories } = useMasterData();
  
  // Auth state
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn, userProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 18;
  const [storedQuestList, setQuestList] = useState<QuestWithDuration[]>([]);
  // Points and the progress of challenges that count visits come from the account (GET /api/rewards)
  const myRewards = useMyRewards(isLoggedIn);
  const userXp = myRewards.balance;
  const questList = useMemo(() => withRealProgress(storedQuestList, myRewards.quests), [storedQuestList, myRewards.quests]);

  useEffect(() => {
    let isActive = true;
    fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (!isActive) return;
        // Every challenge on this page comes from the catalog (GET /api/quests)
        setQuestList(
          quests.map((quest) => ({
            ...quest,
            startDate: quest.startDate || '',
            endDate: quest.endDate || '',
            daysRemaining: quest.daysRemaining ?? 0,
            image: quest.badgeCoverImg || quest.image,
          }))
        );
      })
      .catch((error) => console.warn('Could not load challenges:', error));

    return () => {
      isActive = false;
    };
  }, []);

  // Which challenges the member joined comes from the account; the browser copy only keeps progress noted by hand
  const joinedQuestIds = myRewards.joinedQuestIds;

  useEffect(() => {
    if (isLoggedIn && myRewards.isLoaded && storedQuestList.length > 0) syncMyChallenges(myRewards.joinedQuestIds, storedQuestList);
  }, [isLoggedIn, myRewards.isLoaded, myRewards.joinedQuestIds, storedQuestList]);

  // Confirmation Modal states
  const [questToCancel, setQuestToCancel] = useState<QuestWithDuration | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProposeOpen, setIsProposeOpen] = useState(false);

  // Links from before the challenge page existed (/challenges?quest=id) go to that page
  useEffect(() => {
    const questId = new URLSearchParams(window.location.search).get('quest');
    if (questId) router.replace(`/challenges/${encodeURIComponent(questId)}`);
  }, [router]);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmJoin = async (quest: QuestWithDuration | ChallengeQuest) => {
    if (!isLoggedIn) {
      setIsRequireMembershipOpen(true);
      return;
    }
    const result = await myRewards.joinQuest(quest.id);
    showToast(result.ok ? `ร่วม "${quest.title}" แล้ว กดการ์ดเพื่อดูว่าไปที่ไหนได้บ้าง` : result.message || 'ร่วมไม่สำเร็จ ลองใหม่อีกครั้งนะ');
  };

  const handleConfirmCancel = async (targetQuest?: QuestWithDuration | ChallengeQuest | null) => {
    const quest = targetQuest || questToCancel;
    if (!quest) return;
    const result = await myRewards.leaveQuest(quest.id);
    if (!result.ok) {
      showToast(result.message || 'ยกเลิกไม่สำเร็จ กรุณาลองใหม่');
      return;
    }
    showToast(`ยกเลิกชาเลนจ์ "${quest.title}" เรียบร้อยแล้ว`);
    setQuestToCancel(null);
  };

  // Status and type counts
  const activeQuestsCount = useMemo(
    () => questList.filter((q) => q.status !== 'ended' && (q.daysRemaining === undefined || q.daysRemaining > 0)).length,
    [questList]
  );
  const endedQuestsCount = useMemo(
    () => questList.filter((q) => q.status === 'ended' || (q.daysRemaining !== undefined && q.daysRemaining <= 0)).length,
    [questList]
  );

  const relevantQuestsByStatus = useMemo(() => {
    return questList.filter((q) => {
      const isEnded = q.status === 'ended' || (q.daysRemaining !== undefined && q.daysRemaining <= 0);
      return statusFilter === 'active' ? !isEnded : isEnded;
    });
  }, [questList, statusFilter]);

  // Filtered Quests
  const filteredQuests = useMemo(() => {
    return questList.filter((quest) => {
      const isQuestEnded = quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);

      // Status match (Active vs Ended)
      if (statusFilter === 'active' && isQuestEnded) return false;
      if (statusFilter === 'ended' && !isQuestEnded) return false;

      const reward = getQuestBrandReward(quest);

      if (selectedCategory && quest.category !== selectedCategory) return false;

      // Search query match
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const text = `${quest.title} ${quest.targetGoal} ${quest.badgeLabel} ${quest.creatorName} ${reward.partnerName} ${reward.title}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [questList, statusFilter, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredQuests.length / itemsPerPage);
  const paginatedQuests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuests, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      
      {/* 1. Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 pb-28 sm:pt-4 sm:pb-12 space-y-4 sm:space-y-5 w-full">
        

        {/* 1. What this page is, with the side actions. No box: the cards below carry the weight */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-1 sm:pt-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">ชาเลนจ์ชวนออกไปใช้ชีวิต</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">ไปให้ครบ แล้วรับ XP กับของรางวัลกลับมา</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn && (
              <Link
                href={joinedQuestIds.length > 0 ? '/myhub?tab=quests_rewards' : '/rewards'}
                className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#7C3AED]" aria-hidden="true" />
                <span className="tabular-nums">{userXp.toLocaleString()} XP</span>
                {joinedQuestIds.length > 0 && <span className="text-slate-500 tabular-nums">· กำลังทำ {joinedQuestIds.length}</span>}
              </Link>
            )}
            {!isLoggedIn && (
              <Link href="/rewards" className="inline-flex items-center min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer">
                ดูของรางวัล
              </Link>
            )}
            <button
              type="button"
              onClick={() => (isLoggedIn ? setIsProposeOpen(true) : setIsRequireMembershipOpen(true))}
              className="inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              เสนอชาเลนจ์
            </button>
          </div>
        </header>

        {/* 2. Choosing: the category, open or ended, and a search, in one row on a desktop */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 lg:flex-1" role="group" aria-label="หมวดของชาเลนจ์">
              {[{ id: null as string | null, name: 'ทุกหมวด' }, ...questCategories.filter((category) => relevantQuestsByStatus.some((quest) => quest.category === category.id))].map((category) => {
                const selected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id ?? 'all'}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center min-h-9 px-3.5 rounded-full border text-sm font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      selected ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6]' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full shrink-0" role="group" aria-label="สถานะของชาเลนจ์">
                {([['active', 'เปิดอยู่', activeQuestsCount], ['ended', 'จบไปแล้ว', endedQuestsCount]] as const).map(([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={statusFilter === value}
                    onClick={() => {
                      setStatusFilter(value);
                      setSelectedCategory(null);
                      setCurrentPage(1);
                    }}
                    className={`min-h-8 px-3 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === value ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label} <span className="tabular-nums">{count}</span>
                  </button>
                ))}
              </div>
              <label className="relative flex-1 lg:flex-none lg:w-52 min-w-0">
                <span className="sr-only">ค้นหาชาเลนจ์</span>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="ค้นหา"
                  className="w-full min-h-10 pl-9 pr-3 text-sm font-medium bg-white rounded-full border border-slate-300 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </label>
            </div>
          </div>

          <div id="catalog-section" className="space-y-4">
              {filteredQuests.length === 0 ? (
                <div className="w-full bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-500 flex items-center justify-center shrink-0 shadow-2xs">
                      <Search className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight truncate">
                        ไม่พบชาเลนจ์ที่ตรงกับเงื่อนไข
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ลองเปลี่ยนหมวดหมู่หรือคำค้นหาดูใหม่อีกครั้ง
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center active:scale-95"
                  >
                    <span>ดูชาเลนจ์ทั้งหมด</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedQuests.map((quest) => {
                    const isEnded = quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);
                    const isJoined = joinedQuestIds.includes(quest.id);
                    const brandReward = getQuestBrandReward(quest);
                    const isPartner = brandReward.type === 'brand_partner';
                    const mine = isJoined && !isEnded ? myRewards.quests.find((progress) => progress.questId === quest.id) : undefined;

                    return (
                      // The card: photo, who runs it, what it is, what you get, then one action. Its page has the rest
                      <article
                        key={quest.id}
                        onClick={() => router.push(`/challenges/${encodeURIComponent(quest.id)}`)}
                        className={`group/card flex flex-col bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          isJoined && !isEnded ? 'border-[#7C3AED]' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                          <img
                            src={quest.image || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                            alt=""
                            loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-500 ${isEnded ? 'grayscale opacity-80' : 'group-hover/card:scale-105'}`}
                          />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 shadow-2xs text-[11px] sm:text-xs font-extrabold text-slate-800 whitespace-nowrap">
                            {isEnded ? (
                              'จบแล้ว'
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 text-[#7C3AED]" aria-hidden="true" />
                                <span className="tabular-nums">{quest.rule ? `+${(quest.rewardPoints ?? 0).toLocaleString()} XP` : 'บันทึกเอง'}</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex flex-col flex-1 p-4 gap-2">
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">{isPartner ? brandReward.partnerName : 'Chill & Connect Hub'}</p>
                          <h3 title={quest.title} className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-2 sm:min-h-[2.75rem]">
                            {quest.title}
                          </h3>
                          <p title={quest.targetGoal} className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-2">
                            {quest.targetGoal}
                          </p>
                          {isPartner && !isEnded && (
                            <p title={brandReward.title} className="flex items-center gap-1.5 text-sm font-bold text-slate-900 min-w-0">
                              <Ticket className="w-4 h-4 text-[#7C3AED] shrink-0" aria-hidden="true" />
                              <span className="truncate">{brandReward.title}</span>
                            </p>
                          )}

                          {/* The member's own progress, from the account */}
                          {isJoined && !isEnded && (
                            mine ? (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-800">
                                  <span>{mine.completed ? 'ทำครบแล้ว เก่งมาก' : 'ความคืบหน้าของคุณ'}</span>
                                  <span className="tabular-nums">{mine.current}/{mine.total}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[#F5F3FF] overflow-hidden">
                                  <div className="h-full rounded-full bg-[#7C3AED] transition-all" style={{ width: `${Math.round((mine.current / mine.total) * 100)}%` }} />
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] sm:text-xs font-bold text-slate-800 pt-1">ร่วมอยู่ บันทึกความคืบหน้าเองได้</p>
                            )
                          )}

                          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 min-w-0 truncate tabular-nums">
                              {isEnded
                                ? `จบเมื่อ ${quest.endDate}`
                                : [quest.daysRemaining !== undefined ? `เหลือ ${quest.daysRemaining} วัน` : '', quest.participantsCount ? `${quest.participantsCount.toLocaleString()} คนร่วมทำ` : ''].filter(Boolean).join(' · ')}
                            </p>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {isEnded ? (
                                <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                                  ดูย้อนหลัง
                                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </span>
                              ) : isJoined ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setQuestToCancel(quest)}
                                    className="inline-flex items-center min-h-10 px-3 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap transition-colors cursor-pointer"
                                  >
                                    เลิกทำ
                                  </button>
                                  <Link
                                    href={`/challenges/${encodeURIComponent(quest.id)}`}
                                    className="inline-flex items-center gap-1 min-h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
                                  >
                                    ไปต่อ
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                  </Link>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleConfirmJoin(quest)}
                                  className="inline-flex items-center justify-center min-h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
                                >
                                  ร่วมเลย
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {filteredQuests.length > itemsPerPage && (
                  <div className="pt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page)}
                      totalItems={filteredQuests.length}
                      itemsPerPage={itemsPerPage}
                      itemUnit="ชาเลนจ์"
                      scrollTargetId="catalog-section"
                    />
                  </div>
                )}
              </>
            )}
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-[#64748B] space-y-2 mt-12 mb-16 md:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <BrandLogo size="xs" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ</p>
        <p className="text-[11px] text-slate-500">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>


      {/* 4. POPUP 2: Confirm Cancel Quest Modal (Double Confirm) */}
      {questToCancel && (
        <DialogShell
          onClose={() => setQuestToCancel(null)}
          size="sm"
          title="เลิกทำชาเลนจ์นี้ใช่ไหม"
          subtitle={`"${questToCancel.title}" กลับมาร่วมใหม่ได้ทุกเมื่อก่อนหมดเขต`}
        >
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <button type="button" data-autofocus onClick={() => setQuestToCancel(null)} className={dialogButton.quiet}>
              ทำต่อ
            </button>
            <button type="button" onClick={() => handleConfirmCancel()} className={dialogButton.secondary}>
              เลิกทำ
            </button>
          </div>
        </DialogShell>
      )}

      {/* 5. Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Free Membership Required Modal */}
      <CreateEventModal
        isOpen={isProposeOpen}
        onClose={() => setIsProposeOpen(false)}
        initialType="challenge"
        onCreateSuccess={() => undefined}
      />

      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle="เพื่อร่วมชาเลนจ์และสะสม XP"
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ! สามารถร่วมชาเลนจ์และสะสม XP ได้แล้ว ');
        }}
      />

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

    </div>
  );
}
