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
  List, 
  LayoutGrid, 
  CheckCircle2, 
  Zap, 
  MapPin, 
  Camera, 
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
import { ChallengeCard } from '@/components/ChallengeCard';
import { ChallengeList } from '@/components/ChallengeList';
import { FilterMenu } from '@/components/ChallengeFilters';
import { CommunityCategoryRail, COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { CreateEventModal } from '@/components/CreateEventModal';
import { BrandLogo } from '@/components/BrandLogo';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { Pagination } from '@/components/Pagination';
import { ChallengeQuest } from '@/data/mockData';
import { syncMyChallenges, useMyRewards, withRealProgress } from '@/lib/useMyRewards';
import { fetchAllContentPages } from '@/lib/contentClient';

// Extended Quest Interface with Date, Duration & Image
export interface QuestWithDuration extends ChallengeQuest {
  startDate: string;
  endDate: string;
  daysRemaining: number;
  image?: string;
  status?: 'draft' | 'active' | 'ended';
  brandReward?: any;
}



type WhenFilter = 'open' | 'running' | 'upcoming' | 'ended';
// A challenge has ended, has not started yet (visits before its start do not count), or runs now
const whenOf = (quest: ChallengeQuest): Exclude<WhenFilter, 'open'> =>
  quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0) ? 'ended' : quest.startsInDays ? 'upcoming' : 'running';

export default function ChallengesDiscoveryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('challenges');
  // Filters folded into pills: when it runs, how it is done, what it gives, and only the member's own
  const [whenFilter, setWhenFilter] = useState<WhenFilter>('open');
  const [byFilter, setByFilter] = useState<'all' | 'spot' | 'community' | 'fair'>('all');
  const [rewardFilter, setRewardFilter] = useState<'all' | 'partner' | 'hub'>('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  // A dated list by default (like the schedule in My Hub); the cards stay one tap away and the choice is remembered
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  useEffect(() => {
    try {
      if (localStorage.getItem('cch_challenges_view') === 'cards') setViewMode('cards');
    } catch {}
  }, []);
  const chooseView = (mode: 'list' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('cch_challenges_view', mode);
    } catch {}
  };
  const [searchQuery, setSearchQuery] = useState('');
  // What a challenge is about: the same categories as community meetups (owner 2026-10-16)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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
  // Joined, running and not finished: a finished, ended or not yet started challenge is not being done now
  const doingCount = joinedQuestIds.filter((id) => {
    const quest = storedQuestList.find((item) => item.id === id);
    if (quest && ((quest.startsInDays ?? 0) > 0 || quest.status === 'ended' || quest.daysRemaining <= 0)) return false;
    return !myRewards.quests.some((progress) => progress.questId === id && progress.completed);
  }).length;

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

  // How many challenges each choice of "ช่วงเวลา" holds
  const whenCounts = useMemo(() => {
    const counts = { open: 0, running: 0, upcoming: 0, ended: 0 };
    for (const quest of questList) {
      const when = whenOf(quest);
      counts[when] += 1;
      if (when !== 'ended') counts.open += 1;
    }
    return counts;
  }, [questList]);

  // Everything but the topic and the search: the topic row counts from this
  const relevantQuests = useMemo(() => {
    return questList.filter((quest) => {
      const when = whenOf(quest);
      if (whenFilter === 'open' ? when === 'ended' : when !== whenFilter) return false;
      if (byFilter !== 'all' && !quest.rule?.targetTypes.includes(byFilter)) return false;
      if (rewardFilter !== 'all' && (getQuestBrandReward(quest).type === 'brand_partner') !== (rewardFilter === 'partner')) return false;
      if (mineOnly && !joinedQuestIds.includes(quest.id)) return false;
      return true;
    });
  }, [questList, whenFilter, byFilter, rewardFilter, mineOnly, joinedQuestIds]);

  // Filtered Quests
  const filteredQuests = useMemo(() => {
    return relevantQuests.filter((quest) => {
      if (selectedCategory && quest.category !== selectedCategory) return false;
      // Search query match
      if (searchQuery.trim() !== '') {
        const reward = getQuestBrandReward(quest);
        const q = searchQuery.toLowerCase();
        const text = `${quest.title} ${quest.targetGoal} ${quest.badgeLabel} ${quest.creatorName} ${reward.partnerName} ${reward.title}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [relevantQuests, selectedCategory, searchQuery]);
  const isFiltered = whenFilter !== 'open' || byFilter !== 'all' || rewardFilter !== 'all' || mineOnly || selectedCategory !== null;
  const clearFilters = () => {
    setWhenFilter('open');
    setByFilter('all');
    setRewardFilter('all');
    setMineOnly(false);
    setSelectedCategory(null);
    setSearchQuery('');
    setCurrentPage(1);
  };

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">ชาเลนจ์ชวนออกไปใช้ชีวิต</h1>
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
                {doingCount > 0 && <span className="text-slate-500 tabular-nums">· กำลังทำ {doingCount}</span>}
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

        {/* 2. Choosing: topics as a row of icons, then the other filters folded into pills, the view and a search */}
        <section className="space-y-4 sm:space-y-5">
          <div className="space-y-3">
            {/* Same category rail as the community page */}
            <div className="bg-slate-50/60 p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
              <CommunityCategoryRail
                selectedCategoryId={selectedCategory}
                onSelectCategory={(id) => {
                  setSelectedCategory(id);
                  setCurrentPage(1);
                }}
                eventCounts={{
                  all: relevantQuests.length,
                  ...Object.fromEntries(COMMUNITY_LIFESTYLE_CATEGORIES.map((category) => [category.id, relevantQuests.filter((quest) => quest.category === category.id).length])),
                }}
                allLabelEn="All Challenges"
                variant="rail"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterMenu
                id="when"
                label="ช่วงเวลา"
                value={whenFilter}
                defaultValue="open"
                options={[
                  { value: 'open', label: 'เปิดอยู่ทั้งหมด', count: whenCounts.open },
                  { value: 'running', label: 'ทำได้เลยตอนนี้', count: whenCounts.running },
                  { value: 'upcoming', label: 'เริ่มเร็วๆ นี้', count: whenCounts.upcoming },
                  { value: 'ended', label: 'จบไปแล้ว', count: whenCounts.ended },
                ]}
                openId={openMenu}
                setOpenId={setOpenMenu}
                onChange={(value) => {
                  setWhenFilter(value);
                  setCurrentPage(1);
                }}
              />
              <FilterMenu
                id="by"
                label="ทำอย่างไร"
                value={byFilter}
                defaultValue="all"
                options={[
                  { value: 'all', label: 'ทุกแบบ' },
                  { value: 'spot', label: 'ไปที่เที่ยว' },
                  { value: 'community', label: 'ร่วมตี้' },
                  { value: 'fair', label: 'ไปงานแฟร์' },
                ]}
                openId={openMenu}
                setOpenId={setOpenMenu}
                onChange={(value) => {
                  setByFilter(value);
                  setCurrentPage(1);
                }}
              />
              <FilterMenu
                id="reward"
                label="ของรางวัล"
                value={rewardFilter}
                defaultValue="all"
                options={[
                  { value: 'all', label: 'ทุกแบบ' },
                  { value: 'partner', label: 'ของรางวัลจากร้านหรือแบรนด์' },
                  { value: 'hub', label: 'XP และเหรียญจาก Hub' },
                ]}
                openId={openMenu}
                setOpenId={setOpenMenu}
                onChange={(value) => {
                  setRewardFilter(value);
                  setCurrentPage(1);
                }}
              />
              {isLoggedIn && (
                <button
                  type="button"
                  aria-pressed={mineOnly}
                  onClick={() => {
                    setMineOnly(!mineOnly);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center min-h-9 px-3.5 rounded-full border text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    mineOnly ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6]' : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                  }`}
                >
                  ที่ฉันทำอยู่
                </button>
              )}
              {isFiltered && (
                <button type="button" onClick={clearFilters} className="min-h-9 px-2 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap">
                  ล้างตัวกรอง
                </button>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full shrink-0" role="group" aria-label="วิธีดู">
                  {([['list', 'รายการ', List], ['cards', 'การ์ด', LayoutGrid]] as const).map(([value, label, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={viewMode === value}
                      onClick={() => chooseView(value)}
                      className={`inline-flex items-center gap-1 min-h-8 px-3 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        viewMode === value ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                <label className="relative flex-1 sm:flex-none sm:w-52 min-w-0">
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
                viewMode === 'list' ? (
                  <ChallengeList
                    quests={filteredQuests}
                    joinedIds={joinedQuestIds}
                    progress={myRewards.quests}
                    onBrowseAllSoon={() => {
                      setWhenFilter('upcoming');
                      setCurrentPage(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedQuests.map((quest) => {
                    const isEnded = quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);
                    const isJoined = joinedQuestIds.includes(quest.id);
                    const mine = isJoined && !isEnded ? myRewards.quests.find((progress) => progress.questId === quest.id) : undefined;
                    return <ChallengeCard key={quest.id} quest={quest} isJoined={isJoined} mine={mine} />;
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
                )
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
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-xs text-slate-500 pt-1 flex-wrap">
          <Link href="/about" className="hover:text-slate-800 hover:underline">เกี่ยวกับเรา</Link>
          <span className="text-slate-300">•</span>
          <Link href="/safety" className="hover:text-slate-800 hover:underline">คู่มือความปลอดภัย</Link>
          <span className="text-slate-300">•</span>
          <Link href="/legal" className="hover:text-slate-800 hover:underline">ข้อตกลงการใช้งาน</Link>
          <span className="text-slate-300">•</span>
          <Link href="/legal?tab=privacy" className="hover:text-slate-800 hover:underline">นโยบายความเป็นส่วนตัว</Link>
        </div>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
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
