'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Search, Zap } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { getQuestBrandReward } from '@/lib/questDisplay';
import { matchesQuery, questSearchText } from '@/lib/discoverMatch';
import { ChallengeTile, prizeReasons } from '@/components/ChallengeTile';
import { ShowMoreButton } from '@/components/discover/ShowMoreButton';
import { LaunchCampaignBanner } from '@/components/LaunchCampaignBanner';
import type { Campaign } from '@/lib/campaigns/types';
import { ChallengeList } from '@/components/ChallengeList';
import { FilterMenu, challengePillClass } from '@/components/ChallengeFilters';
import { COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { DiscoverCategoryTabs } from '@/components/discover/DiscoverCategoryTabs';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { ChallengeSearch } from '@/components/ChallengeSearch';
import { CreateEventModal } from '@/components/LazyCreateEventModal';
import { useResponsiveItemsPerPage } from '@/lib/useResponsiveItemsPerPage';
import { ChallengeQuest } from '@/data/mockData';
import { syncMyChallenges, useMyRewards, withRealProgress } from '@/lib/useMyRewards';
import { fetchAllContentPages } from '@/lib/contentClient';
import { useMyInterests } from '@/lib/useMyInterests';
import { Toast } from '@/components/Toast';

// Extended Quest Interface with Date, Duration & Image
export interface QuestWithDuration extends ChallengeQuest {
  startDate: string;
  endDate: string;
  daysRemaining: number;
  image?: string;
  status?: 'draft' | 'active' | 'ended';
  brandReward?: any;
}



// Tiles per "แสดงเพิ่มเติม": whole rows of the 2 / 3 / 4 / 6 column grid
// (4 rows on a wide screen, owner 2026-10-27)
const TILE_BATCH = { mobile: 12, sm: 12, md: 16, lg: 24, xl2: 24, defaultItems: 24 };

type WhenFilter ='open' | 'running' | 'upcoming' | 'ended';
// A challenge has ended, has not started yet (visits before its start do not count), or runs now
const whenOf = (quest: ChallengeQuest): Exclude<WhenFilter, 'open'> =>
  quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0) ? 'ended' : quest.startsInDays ? 'upcoming' : 'running';

const WHEN_ORDER = { running: 0, upcoming: 1, ended: 2 } as const;

/** A catalog challenge as this page lists it */
const toListQuest = (quest: ChallengeQuest): QuestWithDuration => ({
  ...quest,
  startDate: quest.startDate || '',
  endDate: quest.endDate || '',
  daysRemaining: quest.daysRemaining ?? 0,
  image: quest.badgeCoverImg || quest.image });

/** `initialQuests` comes from the server page, so the list is in the HTML search engines read; the browser refreshes it. */
export default function ChallengesDiscoveryPage({ initialQuests, initialQuery = '', campaign = null }: { initialQuests?: ChallengeQuest[]; initialQuery?: string; campaign?: Campaign | null }) {
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
  // The top bar box (computers) and the box on the page (phones) both search challenges here
  const changeSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const chooseView = (mode: 'list' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('cch_challenges_view', mode);
    } catch {}
  };
  // ?q= comes from the ค้นพบ search ("ชาเลนจ์ที่ตรงกับ…")
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  // What a challenge is about: the same categories as community meetups (owner 2026-10-16)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Auth state
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn, userProfile } = useAuth();
  // The member's สาย from onboarding: their tabs come first, marked (owner 2026-10-23)
  const myInterests = useMyInterests(isLoggedIn);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Whole rows at every width of the tile grid (2, 3, 4 and 6 columns)
  const itemsPerPage = useResponsiveItemsPerPage(TILE_BATCH);
  const [storedQuestList, setQuestList] = useState<QuestWithDuration[]>(() => (initialQuests ?? []).map(toListQuest));
  // Points and the progress of challenges that count visits come from the account (GET /api/rewards)
  const myRewards = useMyRewards(isLoggedIn);
  const userXp = myRewards.balance;
  const questList = useMemo(() => withRealProgress(storedQuestList, myRewards.quests), [storedQuestList, myRewards.quests]);

  useEffect(() => {
    if (initialQuests) return;
    let isActive = true;
    fetchAllContentPages<ChallengeQuest>('/api/quests', 'quests')
      .then((quests) => {
        if (!isActive) return;
        // Every challenge on this page comes from the catalog (GET /api/quests)
        setQuestList(quests.map(toListQuest));
      })
      .catch((error) => console.warn('Could not load challenges:', error));

    return () => {
      isActive = false;
    };
  }, [initialQuests]);

  // Which challenges the member joined comes from the account; the browser copy only keeps progress noted by hand
  const joinedQuestIds = myRewards.joinedQuestIds;
  // Joined, running and not finished: a finished, ended or not yet started challenge is not being done now
  const doingCount = joinedQuestIds.filter((id) => {
    const quest = storedQuestList.find((item) => item.id === id);
    if (quest && ((quest.startsInDays ?? 0) > 0 || quest.status === 'ended' || quest.daysRemaining <= 0)) return false;
    return !myRewards.quests.some((progress) => progress.questId === id && progress.completed);
  }).length;
  // "ที่ฉันทำอยู่" only when the member joined something (or the filter is on), so it never leads to an empty list
  const hasMine = isLoggedIn && (joinedQuestIds.length > 0 || mineOnly);
  const toggleMine = () => {
    setMineOnly(!mineOnly);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (isLoggedIn && myRewards.isLoaded && storedQuestList.length > 0) syncMyChallenges(myRewards.joinedQuestIds, storedQuestList);
  }, [isLoggedIn, myRewards.isLoaded, myRewards.joinedQuestIds, storedQuestList]);

  const [toast, setToast] = useState<{ message: string; at: number } | null>(null);
  const [isProposeOpen, setIsProposeOpen] = useState(false);

  // Links from before the challenge page existed (/challenges?quest=id) go to that page
  useEffect(() => {
    const questId = new URLSearchParams(window.location.search).get('quest');
    if (questId) router.replace(`/challenges/${encodeURIComponent(questId)}`);
  }, [router]);


  const showToast = (message: string) => setToast({ message, at: Date.now() });
  // Each new message gets its own full three seconds, even when one comes right after another
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

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

  // Filtered Quests, in the list view's order so the card view starts with what can be done today (owner 2026-10-27):
  // running ones by closing day, then those starting soon by starting day, then ended ones
  const filteredQuests = useMemo(() => {
    return relevantQuests
      .filter((quest) => {
        if (selectedCategory && quest.category !== selectedCategory) return false;
        // The same match as the ค้นพบ search, so its "ชาเลนจ์ที่ตรงกับ…" count is what this list shows
        return matchesQuery(questSearchText(quest), searchQuery);
      })
      .sort((a, b) => {
        const wa = WHEN_ORDER[whenOf(a)];
        const wb = WHEN_ORDER[whenOf(b)];
        if (wa !== wb) return wa - wb;
        if (wa === 0) return (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
        if (wa === 1) return (a.startsInDays ?? 0) - (b.startsInDays ?? 0);
        return 0;
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

  // "แสดงเพิ่มเติม" grows the grid: currentPage = how many batches are on screen
  const shownQuests = useMemo(() => filteredQuests.slice(0, currentPage * itemsPerPage), [filteredQuests, currentPage, itemsPerPage]);
  const tileReasons = useMemo(() => prizeReasons(filteredQuests), [filteredQuests]);

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
        searchSlot={<ChallengeSearch idPrefix="challenge-top" query={searchQuery} onQueryChange={changeSearch} />}
      />

      {/* Toast Notification */}
      <Toast message={toast?.message ?? null} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 pb-28 sm:pt-4 sm:pb-12 space-y-4 sm:space-y-5 w-full">
        

        {/* 1. What this page is, with the side actions. No box: the cards below carry the weight */}
        {/* The side actions stay on the title's row at every width, so nothing takes a row of its own on a phone (owner 2026-10-27) */}
        <header className="flex items-end justify-between gap-3 pt-1 sm:pt-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">ชาเลนจ์ชวนออกไปใช้ชีวิต</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">
              ไปให้ครบ แล้วรับ XP กับของรางวัลกลับมา
              {/* Guests: the rewards are a link in the sentence that promises them */}
              {!isLoggedIn && (
                <Link href="/rewards" className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">
                  ดูของรางวัล
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </p>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Phone: "ที่ฉันทำอยู่" takes the XP pill's place, since the filter row has no room for it (XP is in มายฮับ on the bottom bar) */}
              {hasMine && (
                <button type="button" aria-pressed={mineOnly} onClick={toggleMine} className={`sm:hidden ${challengePillClass(mineOnly)}`}>
                  ที่ฉันทำอยู่
                </button>
              )}
              <Link
                href={joinedQuestIds.length > 0 ? '/myhub?tab=quests_rewards' : '/rewards'}
                className={`${hasMine ? 'hidden sm:inline-flex' : 'inline-flex'} items-center gap-1.5 min-h-10 px-3.5 sm:px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer`}
              >
                <Zap className="w-4 h-4 text-[#7C3AED]" aria-hidden="true" />
                <span className="tabular-nums">{userXp.toLocaleString()} XP</span>
                {doingCount > 0 && <span className="hidden sm:inline text-slate-500 tabular-nums">· กำลังทำ {doingCount}</span>}
              </Link>
              {/* Members only (owner 2026-10-25); just the + on a phone */}
              <button
                type="button"
                onClick={() => setIsProposeOpen(true)}
                aria-label="เสนอชาเลนจ์"
                className="inline-flex items-center justify-center gap-1.5 min-h-10 min-w-10 sm:px-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">เสนอชาเลนจ์</span>
              </button>
            </div>
          )}
        </header>

        {/* The running campaign (admin ?m=campaigns): its challenges toward the prize draw */}
        <LaunchCampaignBanner
          campaign={campaign}
          quests={questList}
          isLoggedIn={isLoggedIn}
          balance={userXp}
          progress={myRewards.quests}
          redeemedRewardIds={myRewards.redeemedRewardIds}
          onSignUp={() => setIsAuthModalOpen(true)}
        />

        {/* 2. Choosing, laid out like the ค้นพบ pages: filters on the left, what is mine and how to view on the right,
            then the category tabs right above the list (owner 2026-10-19) */}
        <section className="space-y-4 sm:space-y-5">
          <div className="space-y-3">
            {/* Searches challenges in place; computers have the same box in the top bar */}
            {/* Below md the view switch sits beside the box, so it does not take a row of its own (owner 2026-10-27) */}
            <div className="flex items-center gap-2 md:hidden">
              <ChallengeSearch idPrefix="challenge-phone" query={searchQuery} onQueryChange={changeSearch} className="flex-1 min-w-0" />
              <ViewModeToggle viewMode={viewMode === 'cards' ? 'grid' : 'list'} onChange={(mode) => chooseView(mode === 'grid' ? 'cards' : 'list')} />
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
                  { value: 'fair', label: 'ไปอีเวนต์' },
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
              {isFiltered && (
                <button type="button" onClick={clearFilters} className="h-9 px-2 text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap">
                  ล้างตัวกรอง
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {/* What I am doing sits with the view, like ♡ ที่บันทึกไว้ on the ค้นพบ pages */}
                {/* Only when there is something of mine to show; on a phone it sits in the header */}
                {hasMine && (
                  <span className="hidden sm:block">
                    <button type="button" aria-pressed={mineOnly} onClick={toggleMine} className={challengePillClass(mineOnly)}>
                      ที่ฉันทำอยู่
                    </button>
                  </span>
                )}
                <div className="hidden md:flex">
                  <ViewModeToggle viewMode={viewMode === 'cards' ? 'grid' : 'list'} onChange={(mode) => chooseView(mode === 'grid' ? 'cards' : 'list')} />
                </div>
              </div>
            </div>

            {/* The ค้นพบ category tabs, violet; only categories that have challenges */}
            <DiscoverCategoryTabs
              kind="challenges"
              categories={COMMUNITY_LIFESTYLE_CATEGORIES}
              mineIds={myInterests.communityCategories}
              counts={{
                all: relevantQuests.length,
                ...Object.fromEntries(COMMUNITY_LIFESTYLE_CATEGORIES.map((category) => [category.id, relevantQuests.filter((quest) => quest.category === category.id).length])),
              }}
              selectedId={selectedCategory}
              onSelect={(id) => {
                setSelectedCategory(id);
                setCurrentPage(1);
              }}
            />
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
                    // Every filter, so the button always brings challenges back (a filter pill alone can empty the list)
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center active:scale-95"
                  >
                    <span>ดูชาเลนจ์ทั้งหมด</span>
                  </button>
                </div>
              ) : (
                viewMode === 'list' ? (
                  <ChallengeList
                    // A new choice starts again from the first rows
                    key={`${whenFilter}|${byFilter}|${rewardFilter}|${mineOnly}|${selectedCategory}|${searchQuery}`}
                    pageSize={10}
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
                  {/* The landing's tiles at the landing's widths, so moving between the pages feels the same (owner 2026-10-27) */}
                  <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-8 pt-4">
                  {shownQuests.map((quest, i) => {
                    const isJoined = joinedQuestIds.includes(quest.id);
                    const mine = isJoined ? myRewards.quests.find((progress) => progress.questId === quest.id) : undefined;
                    return (
                      <li key={quest.id}>
                        <ChallengeTile quest={quest} index={i} reason={tileReasons.get(quest.id)} mine={mine} isJoined={isJoined} showDates />
                      </li>
                    );
                  })}
                </ul>

                {/* The grid grows in place, like the other ค้นพบ pages */}
                <ShowMoreButton shown={shownQuests.length} total={filteredQuests.length} onClick={() => setCurrentPage(currentPage + 1)} />
              </>
                )
            )}
          </div>

        </section>

      </main>

      {/* Footer */}
      <SiteFooter className="bg-white mt-12 mb-16 md:mb-0" />


      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* A member proposes a challenge */}
      <CreateEventModal
        isOpen={isProposeOpen}
        onClose={() => setIsProposeOpen(false)}
        initialType="challenge"
        onCreateSuccess={() => undefined}
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
