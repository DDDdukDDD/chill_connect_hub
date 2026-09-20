'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { MoodFilterChips, SUB_CATEGORIES_MAP } from '@/components/MoodFilterChips';
import { SurpriseModal } from '@/components/SurpriseModal';
import { EventGrid } from '@/components/EventGrid';
import { MobileNav } from '@/components/MobileNav';
import { MOCK_EVENTS, MOCK_POSTS, EventItem, calculateDistanceKm, BANGKOK_ZONES } from '@/data/mockData';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { FilterDrawer } from '@/components/FilterDrawer';
import { StoryBar } from '@/components/StoryBar';
import { TrendingCarousel } from '@/components/TrendingCarousel';
import { CommunityChallengeBar } from '@/components/CommunityChallengeBar';
import { CommunityMomentsStrip } from '@/components/CommunityMomentsStrip';
import { PlatformTrustAndPerks } from '@/components/PlatformTrustAndPerks';
import { CommunityTrustSection } from '@/components/CommunityTrustSection';
import { FairsTrustSection } from '@/components/FairsTrustSection';
import { SpotsTrustSection } from '@/components/SpotsTrustSection';
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { CommunityCategoryRail, COMMUNITY_LIFESTYLE_CATEGORIES } from '@/components/CommunityCategoryRail';
import { TopCommunityRail, TOP_COMMUNITY_CLUBS } from '@/components/TopCommunityRail';
import { SpotCategoryRail, NATIONWIDE_SPOT_CATEGORIES } from '@/components/SpotCategoryRail';
import { TopDestinationsRail } from '@/components/TopDestinationsRail';
import { TopVenuesRail } from '@/components/TopVenuesRail';
import { FairCategoryRail, NATIONWIDE_FAIR_CATEGORIES } from '@/components/FairCategoryRail';
import { Pagination } from '@/components/Pagination';
import { BrandLogo } from '@/components/BrandLogo';
import { MOCK_SPOTS, SPOT_CATEGORIES, ALL_THAI_PROVINCES, LifestyleSpotItem, getSpotVibeCategory } from '@/data/spotsData';
import { getCommunityEventCategory, getFairEventCategory } from '@/data/masterHub';
import { SpotCard } from '@/components/SpotCard';
import { isEventEnded, isEventNew, parseEventDateToTimestamp, parseEventEndDateToTimestamp, isEventEndedByDate, isEventMatchingTimeFilter } from '@/lib/dateUtils';
import { useAuth } from '@/lib/useAuth';
import {
  Heart,
  Sprout,
  Flame,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
  Trophy,
  Users,
  Compass,
  Star,
  Tag,
  Calendar,
  MapPin,
  Clock,
  Building2,
  Sun,
  Filter,
  SlidersHorizontal,
  Dices,
  Info,
  PartyPopper,
  Navigation,
  LocateFixed,
  Loader2,
  ChevronDown,
  X,
  PlusCircle,
} from 'lucide-react';

const ITEMS_PER_PAGE = 24;

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialScopeTab = tabParam === 'community' ? 'community' : tabParam === 'fairs' || tabParam === 'public_venue' ? 'fairs' : tabParam === 'spots' ? 'spots' : 'all';
  const initialEvType = initialScopeTab === 'community' ? 'community' : initialScopeTab === 'fairs' ? 'public_venue' : initialScopeTab === 'spots' ? 'spots' : 'community';

  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState<'heal' | 'move' | 'chill' | 'learn' | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedCommunityClub, setSelectedCommunityClub] = useState<string | null>(null);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [eventTypeTab, setEventTypeTab] = useState<'community' | 'public_venue' | 'spots'>(initialEvType);
  const [selectedSpotCategory, setSelectedSpotCategory] = useState<string>('all');
  const [selectedSpotRailCategory, setSelectedSpotRailCategory] = useState<string | null>(null);
  const [selectedFairRailCategory, setSelectedFairRailCategory] = useState<string | null>(null);
  const [selectedSpotProvince, setSelectedSpotProvince] = useState<string>('all');
  const [selectedSpot, setSelectedSpot] = useState<LifestyleSpotItem | null>(null);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'weekend' | 'next_month' | 'custom'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'under500'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState<boolean>(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState<string>('เพื่อดำเนินการต่อ');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState<boolean>(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<'community' | 'fair' | 'spot' | 'challenge'>('community');
  const [isSurpriseModalOpen, setIsSurpriseModalOpen] = useState<boolean>(false);
  const [surpriseModalMode, setSurpriseModalMode] = useState<'all' | 'spots' | 'community' | 'fairs'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'favorites'>('newest');
  const [sortByNearMe, setSortByNearMe] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentCommunityPage, setCurrentCommunityPage] = useState<number>(1);
  const [currentFairPage, setCurrentFairPage] = useState<number>(1);
  const [currentSpotPage, setCurrentSpotPage] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] = useState<boolean>(false);
  const [joinedQuestTitles, setJoinedQuestTitles] = useState<string[]>([]);
  const [showEndedEvents, setShowEndedEvents] = useState<boolean>(false);
  const [activeScopeTab, setActiveScopeTab] = useState<'all' | 'spots' | 'community' | 'fairs'>(initialScopeTab);

  // Sync state when URL searchParams change
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'community') {
      setActiveScopeTab('community');
      setEventTypeTab('community');
    } else if (currentTab === 'fairs' || currentTab === 'public_venue') {
      setActiveScopeTab('fairs');
      setEventTypeTab('public_venue');
    } else if (currentTab === 'spots') {
      setActiveScopeTab('spots');
      setEventTypeTab('spots');
    } else if (currentTab === 'all' || !currentTab) {
      setActiveScopeTab('all');
    }
  }, [searchParams]);

  // Sync and persist active tab switcher
  const handleSelectEventTypeTab = (tab: 'spots' | 'public_venue' | 'community') => {
    setEventTypeTab(tab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('chill_active_tab', tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.error('Session storage error:', err);
      }
    }
  };

  // Restore Active Tab & Scroll to Card when navigating back from Event/Spot details
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const savedScopeTab = sessionStorage.getItem('chill_active_scope_tab');
      const savedTab = sessionStorage.getItem('chill_active_tab');

      const targetTab = tabParam || savedScopeTab || savedTab;
      if (targetTab) {
        if (targetTab === 'public_venue' || targetTab === 'fairs') {
          setActiveScopeTab('fairs');
          setEventTypeTab('public_venue');
        } else if (targetTab === 'community') {
          setActiveScopeTab('community');
          setEventTypeTab('community');
        } else if (targetTab === 'spots') {
          setActiveScopeTab('spots');
          setEventTypeTab('spots');
        } else if (targetTab === 'all') {
          setActiveScopeTab('all');
        }
      }

      // Scroll to previous card if available
      const lastEventId = sessionStorage.getItem('chill_last_viewed_event');
      const lastSpotId = sessionStorage.getItem('chill_last_viewed_spot');
      const hash = window.location.hash;

      const targetId = hash ? hash.replace('#', '') : (lastEventId ? `event-${lastEventId}` : (lastSpotId ? `spot-${lastSpotId}` : null));

      if (targetId) {
        const timer = setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-[#4A7C59]/40', 'transition-all', 'duration-500');
            setTimeout(() => {
              el.classList.remove('ring-4', 'ring-[#4A7C59]/40');
            }, 2000);
          }
          sessionStorage.removeItem('chill_last_viewed_event');
          sessionStorage.removeItem('chill_last_viewed_spot');
        }, 400);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('Tab & scroll restore error:', e);
    }
  }, []);

  // Support custom event for seamless tab switching from lifestyle journey links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleCustomTabSwitch = (e: Event) => {
      const customEvent = e as CustomEvent<{ sectionId: string }>;
      if (!customEvent.detail) return;
      const { sectionId } = customEvent.detail;
      if (sectionId === 'section-spots') {
        handleSelectEventTypeTab('spots');
      } else if (sectionId === 'section-community') {
        handleSelectEventTypeTab('community');
      } else if (sectionId === 'section-fairs') {
        handleSelectEventTypeTab('public_venue');
      }
    };
    window.addEventListener('chill_switch_tab', handleCustomTabSwitch);
    return () => window.removeEventListener('chill_switch_tab', handleCustomTabSwitch);
  }, []);

  // Sync favorites & joined events with localStorage (Only active when user is logged in)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isLoggedIn) {
      setFavorites([]);
      setFavoriteSpots([]);
      setJoinedEventIds([]);
      setJoinedQuestTitles([]);
      return;
    }

    try {
      const savedFavEvents = localStorage.getItem('favorite_events');
      if (savedFavEvents) {
        const parsed = JSON.parse(savedFavEvents);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
      const savedFavSpots = localStorage.getItem('favorite_spots');
      if (savedFavSpots) {
        const parsed = JSON.parse(savedFavSpots);
        if (Array.isArray(parsed)) setFavoriteSpots(parsed);
      }
      const savedJoined = localStorage.getItem('joined_event_ids');
      if (savedJoined) {
        const parsed = JSON.parse(savedJoined);
        if (Array.isArray(parsed)) setJoinedEventIds(parsed);
      }
    } catch (e) {
      console.error('Error loading stored favorites/joined:', e);
    }
  }, [isLoggedIn]);

  const toggleFavoriteSpot = (spotId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อบันทึกสถานที่นี้ไว้ใน Bucket List');
      return;
    }
    setFavoriteSpots((prev) => {
      const isFav = prev.includes(spotId);
      const updated = isFav ? prev.filter((id) => id !== spotId) : [...prev, spotId];
      if (isFav) {
        showToast('ลบสถานที่ออกจากรายการบันทึกแล้ว');
      } else {
        showToast('บันทึกสถานที่ลงใน Bucket List เรียบร้อย! 💖');
      }
      try {
        localStorage.setItem('favorite_spots', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const triggerMembershipPrompt = (actionReason: string) => {
    setMembershipActionTitle(actionReason);
    setIsRequireMembershipOpen(true);
  };

  const handleOpenCreateModal = (type: 'community' | 'fair' | 'spot' | 'challenge' = 'community') => {
    if (!isLoggedIn) {
      triggerMembershipPrompt(
        type === 'spot' ? 'เพื่อแนะนำพิกัดสถานที่ใหม่' :
        type === 'fair' ? 'เพื่อสร้างงานมหกรรมหรือเอ็กซ์โป' :
        type === 'challenge' ? 'เพื่อสร้างเควสต์และชาเลนจ์ใหม่' :
        'เพื่อสร้างกิจกรรมหรือเปิดตี้ใหม่'
      );
    } else {
      setCreateModalInitialType(type);
      setIsCreateEventModalOpen(true);
    }
  };

  const handleJoinQuestFromHome = (questTitle: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อเข้าร่วมภารกิจและรับแต้มโบนัส');
      return;
    }
    if (!joinedQuestTitles.includes(questTitle)) {
      setJoinedQuestTitles((prev) => [...prev, questTitle]);
      showToast(`🎉 คุณได้รับภารกิจ "${questTitle}" เข้าสู่หน้ารายการของคุณเรียบร้อย! (+XP Bonus)`);
    }
  };

  const handleCancelQuestFromHome = (questTitle: string) => {
    setJoinedQuestTitles((prev) => prev.filter((t) => t !== questTitle));
    showToast(`ยกเลิกภารกิจ "${questTitle}" เรียบร้อยแล้ว`);
  };

  // Deep Linking Effect: Detect ?event=id in URL and open Event Detail Modal automatically
  React.useEffect(() => {
    if (typeof window !== 'undefined' && eventsList.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const eventParamId = params.get('event');
      if (eventParamId) {
        const found = eventsList.find((e) => e.id === eventParamId);
        if (found) {
          setSelectedEvent(found);
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [eventsList]);

  // Hash Anchor Smooth-Scroll on Load (e.g. from /about or direct deep link)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const target = document.getElementById(hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch live approved events from server
  React.useEffect(() => {
    const loadLiveEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          setEventsList(data.events);
        }
      } catch (err) {
        console.log('Using default mock events fallback:', err);
      }
    };
    loadLiveEvents();
  }, []);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อบันทึกกิจกรรมนี้ไว้ในรายการโปรด');
      return;
    }
    setFavorites((prev) => {
      const isFav = prev.includes(eventId);
      const updated = isFav ? prev.filter((id) => id !== eventId) : [...prev, eventId];
      if (isFav) {
        showToast('ลบออกจากรายการโปรดแล้ว');
      } else {
        showToast('เพิ่มเข้าในรายการโปรดเรียบร้อย! ❤️');
      }
      try {
        localStorage.setItem('favorite_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleJoinSuccess = (eventId: string) => {
    setEventsList((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? { ...item, participantsCount: Math.min(item.participantsCount + 1, item.maxParticipants) }
          : item
      )
    );
    setJoinedEventIds((prev) => {
      const updated = prev.includes(eventId) ? prev : [...prev, eventId];
      try {
        localStorage.setItem('joined_event_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('ยินดีด้วย! คุณลงทะเบียนเข้าร่วมกิจกรรมเรียบร้อย 🎉');
  };

  const handleLeaveSuccess = (eventId: string) => {
    setEventsList((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? { ...item, participantsCount: Math.max(item.participantsCount - 1, 0) }
          : item
      )
    );
    setJoinedEventIds((prev) => {
      const updated = prev.filter((id) => id !== eventId);
      try {
        localStorage.setItem('joined_event_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('ยกเลิกการเข้าร่วมกิจกรรมเรียบร้อยแล้ว');
  };

  // Trending Events (isTrending = true)
  const trendingEvents = useMemo(() => {
    return eventsList.filter((e) => e.isTrending);
  }, [eventsList]);

  // Newly Added Events (isNew within 3 days, not ended)
  const newEvents = useMemo(() => {
    return eventsList.filter((e) => isEventNew(e));
  }, [eventsList]);

  // Filtered and Sorted Events for Full Catalog
  const filteredEvents = useMemo(() => {
    let result = eventsList.filter((event) => {
      const eventText = `${event.title} ${event.description} ${event.tag} ${event.badgeText || ''} ${event.location} ${event.hostName || ''} ${event.category} ${event.zone || ''}`.toLowerCase();

      let matchesCategory = true;
      if (selectedCategory !== null) {
        const cat = selectedCategory as string;
        if (cat === 'heal' || cat === 'move' || cat === 'chill' || cat === 'learn') {
          matchesCategory = event.category === cat;
        } else if (cat === 'running_fitness') {
          matchesCategory = ['วิ่ง', 'running', 'marathon', 'hyrox', 'fitness', 'กีฬา', 'sport', 'climbing', 'ปีน', 'badminton'].some(k => eventText.includes(k));
        } else if (cat === 'wellness_mind') {
          matchesCategory = ['sound bath', 'soundbath', 'yoga', 'โยคะ', 'สมาธิ', 'mindfulness', 'heal', 'ฮีลใจ', 'บำบัด', 'introvert'].some(k => eventText.includes(k));
        } else if (cat === 'cafe_social') {
          matchesCategory = ['cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'slow bar', 'hangout', 'จิบกาแฟ', 'พูดคุย', 'อาหาร', 'tea', 'ชา', 'มัทฉะ'].some(k => eventText.includes(k));
        } else if (cat === 'boardgames_party') {
          matchesCategory = ['board game', 'boardgame', 'บอร์ดเกม', 'เกม', 'catan', 'quiz', 'party', 'เกมกลุ่ม', 'เพื่อนใหม่'].some(k => eventText.includes(k));
        } else if (cat === 'arts_crafts') {
          matchesCategory = ['workshop', 'เวิร์กช็อป', 'art', 'ศิลปะ', 'craft', 'คราฟต์', 'เซรามิก', 'pottery', 'ปั้นดิน', 'painting', 'สีน้ำ', 'เทียน', 'candle', 'ภาพวาด'].some(k => eventText.includes(k));
        } else if (cat === 'travel_outdoor') {
          matchesCategory = ['outdoor', 'เอาต์ดอร์', 'camping', 'กางเต็นท์', 'เดินป่า', 'คายัค', 'sup board', 'ซับบอร์ด', 'ธรรมชาติ', 'photowalk', 'ถ่ายรูป'].some(k => eventText.includes(k));
        } else if (cat === 'tech_skills') {
          matchesCategory = ['tech', 'ai', 'coding', 'developer', 'startup', 'business', 'networking', 'หนังสือ', 'book', 'talk', 'เสวนา'].some(k => eventText.includes(k));
        } else if (cat === 'pets_family') {
          matchesCategory = ['pet', 'สัตว์เลี้ยง', 'หมา', 'แมว', 'dog', 'cat', 'family', 'ครอบครัว', 'เด็ก', 'kids'].some(k => eventText.includes(k));
        }
      }

      let matchesVenue = true;
      if (selectedVenueFilter) {
        matchesVenue = event.venueTag === selectedVenueFilter;
      }

      let matchesCommunityClub = true;
      if (selectedCommunityClub && selectedCommunityClub !== 'all') {
        const clubDef = TOP_COMMUNITY_CLUBS.find((c) => c.clubKey === selectedCommunityClub);
        if (clubDef) {
          matchesCommunityClub = clubDef.keywords.some((kw) => eventText.includes(kw.toLowerCase()));
        }
      }

      let matchesEventType = true;
      const currentEvType = event.eventType || 'community';
      if (eventTypeTab === 'public_venue') {
        matchesEventType = currentEvType === 'public_venue';
      } else if (eventTypeTab === 'community') {
        matchesEventType = currentEvType === 'community';
      }

      const matchesTime = isEventMatchingTimeFilter(event.date, timeFilter, startDate, endDate);

      let matchesSubCategory = true;
      if (selectedCategory && selectedSubCategory) {
        const subList = SUB_CATEGORIES_MAP[selectedCategory];
        const matchedSubItem = subList.find((s) => s.id === selectedSubCategory);
        if (matchedSubItem && matchedSubItem.tagQuery) {
          const q = matchedSubItem.tagQuery.toLowerCase();
          matchesSubCategory =
            event.tag.toLowerCase().includes(q) ||
            event.title.toLowerCase().includes(q) ||
            event.description.toLowerCase().includes(q);
        }
      }

      // Smart Search Query Matcher (Supports 10 Preset Category Titles and Multi-token Fuzzy Match)
      let matchesSearch = true;
      const rawQ = searchQuery.toLowerCase().trim();
      if (rawQ !== '') {
        const eventText = `${event.title} ${event.description} ${event.tag} ${event.badgeText || ''} ${event.location} ${event.hostName || ''} ${event.category} ${event.zone || ''}`.toLowerCase();

        // 1. Direct or partial full phrase match
        if (eventText.includes(rawQ)) {
          matchesSearch = true;
        }
        // 2. Preset category keyword maps
        else if (rawQ.includes('วิ่ง') || rawQ.includes('มาราธอน') || rawQ.includes('marathon')) {
          matchesSearch = eventText.includes('วิ่ง') || eventText.includes('มาราธอน') || eventText.includes('marathon') || eventText.includes('trail') || eventText.includes('fun run') || eventText.includes('10k') || eventText.includes('21k');
        } else if (rawQ.includes('มหกรรม') || rawQ.includes('งานใหญ่') || rawQ.includes('งานอีเวนต์') || rawQ.includes('expo')) {
          matchesSearch = eventText.includes('expo') || eventText.includes('มหกรรม') || eventText.includes('fair') || eventText.includes('festival') || eventText.includes('qsncc') || eventText.includes('bitec') || eventText.includes('impact') || eventText.includes('สิริกิติ์') || eventText.includes('หนังสือ') || eventText.includes('game show') || eventText.includes('comic con') || eventText.includes('biennale');
        } else if (rawQ.includes('ฟิตเนส') || rawQ.includes('hyrox') || rawQ.includes('ไฮร็อกซ์') || rawQ.includes('bootcamp')) {
          matchesSearch = eventText.includes('hyrox') || eventText.includes('fitness') || eventText.includes('ฟิตเนส') || eventText.includes('bootcamp') || eventText.includes('workout') || eventText.includes('functional') || eventText.includes('ยืดเหยียด');
        } else if (rawQ.includes('โยคะ') || rawQ.includes('sound bath') || rawQ.includes('สมาธิ') || rawQ.includes('เสียงคลื่น') || rawQ.includes('ฮีลใจ')) {
          matchesSearch = eventText.includes('โยคะ') || eventText.includes('yoga') || eventText.includes('sound bath') || eventText.includes('soundbath') || eventText.includes('สมาธิ') || eventText.includes('บำบัด') || eventText.includes('ขันธิเบต') || eventText.includes('ฮีลใจ') || eventText.includes('พักใจ');
        } else if (rawQ.includes('คาเฟ่') || rawQ.includes('กาแฟ') || rawQ.includes('ดนตรี') || rawQ.includes('อะคูสติก') || rawQ.includes('คอนเสิร์ต') || rawQ.includes('แจ๊ส')) {
          matchesSearch = eventText.includes('คาเฟ่') || eventText.includes('cafe') || eventText.includes('กาแฟ') || eventText.includes('coffee') || eventText.includes('ดนตรี') || eventText.includes('music') || eventText.includes('acoustic') || eventText.includes('jazz') || eventText.includes('folk') || eventText.includes('concert') || eventText.includes('คอนเสิร์ต') || eventText.includes('orchestra') || eventText.includes('cat expo') || eventText.includes('maho rasop') || eventText.includes('ไวนิล') || eventText.includes('vinyl');
        } else if (rawQ.includes('บอร์ดเกม') || rawQ.includes('เพื่อนใหม่') || rawQ.includes('boardgame')) {
          matchesSearch = eventText.includes('บอร์ดเกม') || eventText.includes('board game') || eventText.includes('boardgame') || eventText.includes('catan') || eventText.includes('quiz') || eventText.includes('social') || eventText.includes('เพื่อนใหม่');
        } else if (rawQ.includes('ศิลปะ') || rawQ.includes('คราฟต์') || rawQ.includes('เวิร์กช็อป') || rawQ.includes('workshop')) {
          matchesSearch = eventText.includes('workshop') || eventText.includes('เวิร์กช็อป') || eventText.includes('ศิลปะ') || eventText.includes('art') || eventText.includes('คราฟต์') || eventText.includes('craft') || eventText.includes('เซรามิก') || eventText.includes('pottery') || eventText.includes('สีน้ำ') || eventText.includes('painting') || eventText.includes('เทียนหอม') || eventText.includes('candle') || eventText.includes('แหวน') || eventText.includes('silver') || eventText.includes('tufting') || eventText.includes('พรม') || eventText.includes('หนัง') || eventText.includes('leather');
        } else if (rawQ.includes('ชงชา') || rawQ.includes('อาหาร') || rawQ.includes('ทำอาหาร') || rawQ.includes('ขนม') || rawQ.includes('มัทฉะ')) {
          matchesSearch = eventText.includes('ชงชา') || eventText.includes('ชา') || eventText.includes('tea') || eventText.includes('มัทฉะ') || eventText.includes('matcha') || eventText.includes('อาหาร') || eventText.includes('อบขนม') || eventText.includes('baking') || eventText.includes('sourdough') || eventText.includes('ขนมปัง') || eventText.includes('เบเกอรี่');
        } else if (rawQ.includes('ถ่ายรูป') || rawQ.includes('ถ่ายภาพ') || rawQ.includes('สำรวจเมือง') || rawQ.includes('photo')) {
          matchesSearch = eventText.includes('ถ่ายรูป') || eventText.includes('ถ่ายภาพ') || eventText.includes('photo') || eventText.includes('photowalk') || eventText.includes('photo walk') || eventText.includes('กล้อง') || eventText.includes('ฟิล์ม') || eventText.includes('darkroom') || eventText.includes('สตรีท') || eventText.includes('street') || eventText.includes('biennale') || eventText.includes('portrait');
        } else if (rawQ.includes('กีฬา') || rawQ.includes('เอาต์ดอร์') || rawQ.includes('outdoor')) {
          matchesSearch = eventText.includes('กีฬา') || eventText.includes('sport') || eventText.includes('เอาต์ดอร์') || eventText.includes('outdoor') || eventText.includes('ปีน') || eventText.includes('climbing') || eventText.includes('แบดมินตัน') || eventText.includes('badminton') || eventText.includes('จักรยาน') || eventText.includes('bike') || eventText.includes('cycling') || eventText.includes('pickleball') || eventText.includes('พิกเคิลบอล') || eventText.includes('มวยไทย') || eventText.includes('boxing');
        } else {
          // 3. Multi-token fallback (e.g. "สวนรถไฟ", "อารีย์", "ฟรี", "เยาวราช")
          const tokens = rawQ
            .split(/[\s,&/()+_-]+/)
            .map((t) => t.trim())
            .filter((t) => t.length >= 2);

          matchesSearch = tokens.length === 0 || tokens.some((token) => eventText.includes(token));
        }
      }

      let matchesPrice = true;
      const priceStr = event.price || '';
      if (priceFilter === 'free') {
        matchesPrice = priceStr.includes('ฟรี');
      } else if (priceFilter === 'under500') {
        const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
        matchesPrice = priceStr.includes('ฟรี') || (!isNaN(num) && num <= 500);
      }

      let matchesZone = true;
      if (selectedZone) {
        matchesZone = event.zone === selectedZone;
      }

      // Province filter
      let matchesProvince = true;
      if (selectedSpotProvince && selectedSpotProvince !== 'all' && selectedSpotProvince !== 'ทั่วไทย') {
        const pLower = selectedSpotProvince.toLowerCase().trim();
        const isOnlineQuery = pLower === 'online' || pLower.includes('ออนไลน์');
        if (isOnlineQuery) {
          matchesProvince = event.province === 'ออนไลน์' || (event.location || '').toLowerCase().includes('ออนไลน์');
        } else {
          const evLocation = (event.location || '').toLowerCase();
          const evProv = (event.province || '').toLowerCase();
          const isBkkQuery = pLower.includes('กรุงเทพ') || pLower.includes('กทม') || pLower.includes('bangkok');
          const isEvBkk = evProv.includes('กรุงเทพ') || evProv.includes('กทม') || evLocation.includes('กรุงเทพ') || evLocation.includes('กทม');
          if (isBkkQuery) {
            matchesProvince = isEvBkk;
          } else {
            const cleanQuery = pLower.replace('จังหวัด', '').trim();
            matchesProvince = evLocation.includes(cleanQuery) || evProv.includes(cleanQuery);
          }
        }
      }

      // Ended Events filter (Default: hide ended events, show when showEndedEvents is true)
      let matchesEnded = true;
      if (!showEndedEvents) {
        matchesEnded = !isEventEnded(event);
      }

      return matchesCategory && matchesVenue && matchesCommunityClub && matchesEventType && matchesTime && matchesSubCategory && matchesSearch && matchesPrice && matchesZone && matchesProvince && matchesEnded;
    });

    // Calculate distance for all events ONLY when sortByNearMe is active
    result = result.map((ev) => {
      if (sortByNearMe && userLocation && ev.latitude && ev.longitude) {
        return {
          ...ev,
          distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude),
        };
      }
      return {
        ...ev,
        distanceKm: undefined,
      };
    });

    if (sortByNearMe) {
      result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (sortBy === 'favorites') {
      result = result.filter((event) => favorites.includes(event.id));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Option A: Chronological Event Date Sorting (closest upcoming event date first)
      result.sort((a, b) => {
        const timeA = parseEventDateToTimestamp(a.date);
        const timeB = parseEventDateToTimestamp(b.date);
        if (timeA !== timeB) return timeA - timeB;
        return (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0);
      });
    }

    return result;
  }, [
    eventsList,
    selectedCategory,
    selectedSubCategory,
    selectedCommunityClub,
    selectedVenueFilter,
    selectedZone,
    selectedSpotProvince,
    eventTypeTab,
    joinedEventIds,
    timeFilter,
    priceFilter,
    startDate,
    endDate,
    searchQuery,
    sortBy,
    sortByNearMe,
    userLocation,
    favorites,
    showEndedEvents,
  ]);

  // Stream subsets for Option A (Unified Discovery Feed - Upcoming & Active Events Only)
  const streamCommunityEvents = useMemo(() => {
    return eventsList.filter((event) => {
      if ((event.eventType || 'community') !== 'community') return false;
      // Auto-hide ended events on homepage
      if (isEventEnded(event)) return false;

      const eventText = `${event.title} ${event.description} ${event.tag} ${event.badgeText || ''} ${event.location} ${event.hostName || ''} ${event.category} ${event.zone || ''}`.toLowerCase();

      // Category filter for Community Stream (1 Card = 1 Category)
      if (selectedCategory !== null) {
        const cat = selectedCategory as string;
        if (cat === 'heal' || cat === 'move' || cat === 'chill' || cat === 'learn') {
          if (event.category !== cat) return false;
        } else {
          if (getCommunityEventCategory(event) !== cat) return false;
        }
      }

      // Top Community Club Filter
      if (selectedCommunityClub && selectedCommunityClub !== 'all') {
        const clubDef = TOP_COMMUNITY_CLUBS.find((c) => c.clubKey === selectedCommunityClub);
        if (clubDef) {
          const matches = clubDef.keywords.some((kw) => eventText.includes(kw.toLowerCase()));
          if (!matches) return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const isCoffee = q.includes('slow bar') || q.includes('สโลว์บาร์') || q.includes('coffee') || q.includes('กาแฟ') || q.includes('drip') || q.includes('ดริป');
        const matches = eventText.includes(q) || (isCoffee && (eventText.includes('กาแฟ') || eventText.includes('coffee') || eventText.includes('สโลว์บาร์') || eventText.includes('slow bar') || eventText.includes('ดริป')));
        if (!matches) return false;
      }

      // Time filter for Community Stream
      if (timeFilter !== 'all') {
        if (!isEventMatchingTimeFilter(event.date, timeFilter, startDate, endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [eventsList, selectedCategory, selectedCommunityClub, searchQuery, timeFilter, startDate, endDate]);

  // Dynamic community category counts (supports club filter context from TopCommunityRail)
  const communityCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseEvents = eventsList.filter((event) => {
      if ((event.eventType || 'community') !== 'community') return false;
      if (isEventEnded(event)) return false;

      // Filter by selected community club if active
      if (selectedCommunityClub && selectedCommunityClub !== 'all') {
        const clubDef = TOP_COMMUNITY_CLUBS.find((c) => c.clubKey === selectedCommunityClub);
        if (clubDef) {
          const eventText = `${event.title} ${event.description} ${event.tag || ''} ${event.badgeText || ''} ${event.location} ${event.hostName || ''} ${event.category || ''} ${event.zone || ''}`.toLowerCase();
          const matches = clubDef.keywords.some((kw) => eventText.includes(kw.toLowerCase()));
          if (!matches) return false;
        }
      }
      return true;
    });

    counts['all'] = baseEvents.length;
    COMMUNITY_LIFESTYLE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = baseEvents.filter((event) => getCommunityEventCategory(event) === cat.id).length;
    });

    return counts;
  }, [eventsList, selectedCommunityClub]);

  const streamPublicEvents = useMemo(() => {
    return eventsList.filter((event) => {
      if (event.eventType !== 'public_venue') return false;
      // Auto-hide ended events on homepage
      if (isEventEnded(event)) return false;

      // Category Rail Filter for Fairs Stream (1 Card = 1 Category)
      if (selectedFairRailCategory && selectedFairRailCategory !== 'all') {
        if (getFairEventCategory(event) !== selectedFairRailCategory) return false;
      }

      // Independent Venue filter for Fairs Stream (supports venueTag, location name, and keywords)
      if (selectedVenueFilter) {
        const v = selectedVenueFilter.toLowerCase();
        const vTag = (event.venueTag || '').toLowerCase();
        const loc = (event.location || '').toLowerCase();
        const title = (event.title || '').toLowerCase();
        const text = `${vTag} ${loc} ${title}`;

        if (v === 'qsncc' && !text.includes('สิริกิติ์') && !text.includes('qsncc')) return false;
        else if (v === 'bitec' && !text.includes('ไบเทค') && !text.includes('bitec')) return false;
        else if (v === 'impact' && !text.includes('อิมแพ็ค') && !text.includes('impact') && !text.includes('เมืองทอง')) return false;
        else if (v === 'paragon' && !text.includes('paragon') && !text.includes('พารากอน') && !text.includes('iconsiam') && !text.includes('ไอคอนสยาม') && !text.includes('สยาม')) return false;
        else if (v === 'bacc' && !text.includes('bacc') && !text.includes('หอศิลป') && !text.includes('เจริญกรุง') && !text.includes('ปทุมวัน')) return false;
        else if (v === 'marathon' && !text.includes('วิ่ง') && !text.includes('มาราธอน') && !text.includes('marathon')) return false;
        else if (v === 'park' && !text.includes('สวน') && !text.includes('park') && !text.includes('สนามหลวง')) return false;
        else if (v === 'regional' && !text.includes('kice') && !text.includes('ขอนแก่น') && !text.includes('cmecc') && !text.includes('เชียงใหม่') && !text.includes('สงขลา') && !text.includes('ภูเก็ต')) return false;
        else if (!['qsncc', 'bitec', 'impact', 'paragon', 'bacc', 'marathon', 'park', 'regional'].includes(v) && !text.includes(v)) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const eventText = `${event.title} ${event.description} ${event.tag} ${event.location} ${event.hostName} ${event.venueTag || ''}`.toLowerCase();
        const isCoffee = q.includes('slow bar') || q.includes('สโลว์บาร์') || q.includes('coffee') || q.includes('กาแฟ');
        const isQsncc = q.includes('qsncc') || q.includes('สิริกิติ์');
        const isBitec = q.includes('bitec') || q.includes('ไบเทค');
        const isImpact = q.includes('impact') || q.includes('อิมแพ็ค');
        const matches =
          eventText.includes(q) ||
          (isCoffee && (eventText.includes('กาแฟ') || eventText.includes('coffee'))) ||
          (isQsncc && (eventText.includes('qsncc') || eventText.includes('สิริกิติ์'))) ||
          (isBitec && (eventText.includes('bitec') || eventText.includes('ไบเทค'))) ||
          (isImpact && (eventText.includes('impact') || eventText.includes('อิมแพ็ค')));
        if (!matches) return false;
      }

      // Time filter for Fairs Stream
      if (timeFilter !== 'all') {
        if (!isEventMatchingTimeFilter(event.date, timeFilter, startDate, endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [eventsList, selectedFairRailCategory, selectedVenueFilter, searchQuery, timeFilter, startDate, endDate]);

  // Dynamic fair category counts (supports venue filter context)
  const fairCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseEvents = eventsList.filter((e) => {
      if (e.eventType !== 'public_venue') return false;
      if (isEventEnded(e)) return false;
      if (selectedVenueFilter) {
        const v = selectedVenueFilter.toLowerCase();
        const vTag = (e.venueTag || '').toLowerCase();
        const loc = (e.location || '').toLowerCase();
        const title = (e.title || '').toLowerCase();
        const text = `${vTag} ${loc} ${title}`;
        if (v === 'qsncc' && !text.includes('สิริกิติ์') && !text.includes('qsncc')) return false;
        else if (v === 'bitec' && !text.includes('ไบเทค') && !text.includes('bitec')) return false;
        else if (v === 'impact' && !text.includes('อิมแพ็ค') && !text.includes('impact') && !text.includes('เมืองทอง')) return false;
        else if (v === 'paragon' && !text.includes('paragon') && !text.includes('พารากอน') && !text.includes('iconsiam') && !text.includes('ไอคอนสยาม') && !text.includes('สยาม')) return false;
        else if (v === 'bacc' && !text.includes('bacc') && !text.includes('หอศิลป') && !text.includes('เจริญกรุง') && !text.includes('ปทุมวัน')) return false;
        else if (v === 'marathon' && !text.includes('วิ่ง') && !text.includes('มาราธอน') && !text.includes('marathon')) return false;
        else if (v === 'park' && !text.includes('สวน') && !text.includes('park') && !text.includes('สนามหลวง')) return false;
        else if (v === 'regional' && !text.includes('kice') && !text.includes('ขอนแก่น') && !text.includes('cmecc') && !text.includes('เชียงใหม่') && !text.includes('สงขลา') && !text.includes('ภูเก็ต')) return false;
        else if (!['qsncc', 'bitec', 'impact', 'paragon', 'bacc', 'marathon', 'park', 'regional'].includes(v) && !text.includes(v)) return false;
      }
      return true;
    });

    counts['all'] = baseEvents.length;
    NATIONWIDE_FAIR_CATEGORIES.forEach((cat) => {
      counts[cat.id] = baseEvents.filter((ev) => getFairEventCategory(ev) === cat.id).length;
    });
    return counts;
  }, [eventsList, selectedVenueFilter]);

  // Filtered Lifestyle Spots (พิกัดเที่ยว & จุดฮีลใจ ทั่วประเทศ)
  const filteredSpots = useMemo(() => {
    const result = MOCK_SPOTS.filter((spot) => {
      // 0. Spot Category Rail Filter (1 Card = 1 Category)
      if (selectedSpotRailCategory && selectedSpotRailCategory !== 'all') {
        if (getSpotVibeCategory(spot) !== selectedSpotRailCategory) return false;
      }

      // 1. Category Filter
      if (selectedSpotCategory !== 'all' && spot.category !== selectedSpotCategory) {
        return false;
      }

      // 2. Province Filter (Smart City Matching: Hat Yai <-> Songkhla, Hua Hin <-> Prachuap, Pattaya <-> Chonburi)
      if (selectedSpotProvince !== 'all') {
        const pLower = selectedSpotProvince.toLowerCase();
        const spotProv = spot.province.toLowerCase();
        const spotDistrict = (spot.district || '').toLowerCase();
        const spotTitle = spot.title.toLowerCase();
        const spotVibe = (spot.vibeTags || []).join(' ').toLowerCase();
        const fullSpotText = `${spotProv} ${spotDistrict} ${spotTitle} ${spotVibe}`;

        const isMatch =
          spotProv.includes(pLower) ||
          pLower.includes(spotProv) ||
          (pLower.includes('หาดใหญ่') && fullSpotText.includes('หาดใหญ่')) ||
          (pLower.includes('หัวหิน') && fullSpotText.includes('หัวหิน')) ||
          (pLower.includes('พัทยา') && fullSpotText.includes('พัทยา')) ||
          (pLower.includes('ชลบุรี') && fullSpotText.includes('ชลบุรี')) ||
          (pLower.includes('ประจวบ') && (fullSpotText.includes('ประจวบ') || fullSpotText.includes('หัวหิน'))) ||
          (pLower.includes('สงขลา') && (fullSpotText.includes('สงขลา') || fullSpotText.includes('หาดใหญ่')));

        if (!isMatch) {
          return false;
        }
      }

      // 3. Favorites Filter
      if (sortBy === 'favorites' && !favoriteSpots.includes(spot.id)) {
        return false;
      }

      // 4. Price Filter (เข้าฟรี)
      if (priceFilter === 'free') {
        if (!spot.price.includes('ฟรี')) {
          return false;
        }
      }

      // 5. Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const isCoffee = q.includes('slow bar') || q.includes('สโลว์บาร์') || q.includes('coffee') || q.includes('กาแฟ');
        const matchTitle = spot.title.toLowerCase().includes(q);
        const matchDesc = spot.description.toLowerCase().includes(q);
        const matchProv = spot.province.toLowerCase().includes(q);
        const matchDist = spot.district.toLowerCase().includes(q);
        const matchTag = spot.vibeTags.some((t) => t.toLowerCase().includes(q));
        const matchCat = (spot.categoryLabel || '').toLowerCase().includes(q);
        const matchHighlights = (spot.highlights || []).some((h) => h.toLowerCase().includes(q));
        const matchSynonym = isCoffee && (
          spot.title.toLowerCase().includes('กาแฟ') ||
          spot.title.toLowerCase().includes('coffee') ||
          spot.title.toLowerCase().includes('สโลว์บาร์') ||
          spot.description.toLowerCase().includes('กาแฟ') ||
          (spot.categoryLabel || '').toLowerCase().includes('กาแฟ') ||
          spot.vibeTags.some((t) => t.toLowerCase().includes('กาแฟ') || t.toLowerCase().includes('slow bar'))
        );

        if (!matchTitle && !matchDesc && !matchProv && !matchDist && !matchTag && !matchCat && !matchHighlights && !matchSynonym) {
          return false;
        }
      }

      return true;
    }).map((spot) => {
      if (sortByNearMe && userLocation && spot.latitude && spot.longitude) {
        return {
          ...spot,
          distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude),
        };
      }
      return {
        ...spot,
        distanceKm: undefined,
      };
    });

    if (sortByNearMe) {
      result.sort((a, b) => ((a as any).distanceKm ?? 999) - ((b as any).distanceKm ?? 999));
    } else if (sortBy === 'favorites') {
      // Keep order
    } else {
      // Default: highest rating
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [selectedSpotRailCategory, selectedSpotCategory, selectedSpotProvince, priceFilter, sortBy, sortByNearMe, userLocation, favoriteSpots, searchQuery]);

  // Dynamic spot category counts (supports province context)
  const spotCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseSpots = MOCK_SPOTS.filter((spot) => {
      if (selectedSpotProvince !== 'all') {
        const pLower = selectedSpotProvince.toLowerCase();
        const spotProv = spot.province.toLowerCase();
        const spotDistrict = (spot.district || '').toLowerCase();
        const spotTitle = spot.title.toLowerCase();
        const spotVibe = (spot.vibeTags || []).join(' ').toLowerCase();
        const fullSpotText = `${spotProv} ${spotDistrict} ${spotTitle} ${spotVibe}`;

        return (
          spotProv.includes(pLower) ||
          pLower.includes(spotProv) ||
          (pLower.includes('หาดใหญ่') && fullSpotText.includes('หาดใหญ่')) ||
          (pLower.includes('หัวหิน') && fullSpotText.includes('หัวหิน')) ||
          (pLower.includes('พัทยา') && fullSpotText.includes('พัทยา')) ||
          (pLower.includes('ชลบุรี') && fullSpotText.includes('ชลบุรี')) ||
          (pLower.includes('ประจวบ') && (fullSpotText.includes('ประจวบ') || fullSpotText.includes('หัวหิน'))) ||
          (pLower.includes('สงขลา') && (fullSpotText.includes('สงขลา') || fullSpotText.includes('หาดใหญ่')))
        );
      }
      return true;
    });

    counts['all'] = baseSpots.length;
    NATIONWIDE_SPOT_CATEGORIES.forEach((cat) => {
      counts[cat.id] = baseSpots.filter((spot) => getSpotVibeCategory(spot) === cat.id).length;
    });
    return counts;
  }, [selectedSpotProvince]);

  const trendingSpotsAsEvents: EventItem[] = useMemo(() => {
    return MOCK_SPOTS.slice(0, 10).map((spot) => ({
      id: spot.id,
      title: spot.title,
      description: spot.description,
      image: spot.image,
      date: spot.openHours || 'เปิดบริการทุกวัน',
      time: '10:00 - 18:00',
      location: `${spot.district ? spot.district + ', ' : ''}${spot.province}`,
      category: 'chill',
      tag: spot.categoryLabel,
      price: spot.price || 'เข้าชมฟรี',
      hostName: spot.province,
      eventType: 'spots' as any,
      participantsCount: 10,
      maxParticipants: 10,
      rating: spot.rating || 4.9,
      reviewsCount: spot.reviewsCount || 10,
      isNew: spot.isNew,
      createdAtTimestamp: Date.now(),
    }));
  }, []);

  const trendingCarouselProps = useMemo(() => {
    switch (activeScopeTab) {
      case 'community':
        return {
          events: eventsList.filter((e) => (e.eventType || 'community') === 'community'),
          title: 'Trending Community Circles',
          subtitle: 'ตี้กิจกรรมและเวิร์กช็อปที่มีเพื่อนๆ สมัครเข้าร่วมคึกคักที่สุดในสัปดาห์นี้',
          badgeText: 'ตี้มาแรง',
          badgeColor: 'bg-orange-50 text-[#F26430] border border-orange-200/80',
          mode: 'community' as const,
        };
      case 'fairs':
        return {
          events: eventsList.filter((e) => e.eventType === 'public_venue'),
          title: 'Trending Mega Expos & Fairs',
          subtitle: 'งานมหกรรม นิทรรศการ และเทศกาลระดับชาติที่ผู้คนรอคอยมากที่สุด',
          badgeText: 'งานไฮไลต์',
          badgeColor: 'bg-blue-50 text-[#2B527A] border border-blue-200/80',
          mode: 'fairs' as const,
        };
      case 'spots':
        return {
          events: trendingSpotsAsEvents,
          title: 'Trending Curated Lifestyle Spots',
          subtitle: 'พิกัดพักผ่อน คาเฟ่ธรรมชาติ และสเปซฮีลใจที่ได้รับคะแนนรีวิวสูงสุด 77 จังหวัด',
          badgeText: 'จุดฮิตคนท้องถิ่น',
          badgeColor: 'bg-emerald-50 text-[#4A7C59] border border-emerald-200/80',
          mode: 'spots' as const,
        };
      default:
        return {
          events: eventsList,
          title: 'Trending Lifestyle Agenda',
          subtitle: 'คัดสรรกิจกรรมและงานอีเวนต์ที่มีผู้ให้ความสนใจสูงสุดประจำสัปดาห์นี้',
          badgeText: 'ยอดนิยม',
          badgeColor: undefined,
          mode: 'all' as const,
        };
    }
  }, [activeScopeTab, eventsList, trendingSpotsAsEvents]);

  const handleSearchSubmit = () => {
    // Smart Search Auto-Clear: reset conflicting sub-filters so the search result is not blocked
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedCommunityClub(null);
    setSelectedVenueFilter(null);
    setSelectedFairRailCategory(null);
    setSelectedSpotRailCategory(null);
    setSelectedZone(null);
    setPriceFilter('all');
    setSortByNearMe(false);
    setCurrentPage(1);
    setCurrentCommunityPage(1);
    setCurrentFairPage(1);
    setCurrentSpotPage(1);

    // Scroll down to the search cards display section based on the active scope tab
    const performScroll = () => {
      let targetId = 'catalog-section';
      if (activeScopeTab === 'community') {
        targetId = 'section-community-cards';
      } else if (activeScopeTab === 'fairs') {
        targetId = 'section-fairs-cards';
      } else if (activeScopeTab === 'spots') {
        targetId = 'section-spots-cards';
      }

      const el = document.getElementById(targetId) || document.getElementById('catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    performScroll();
    setTimeout(performScroll, 60);
  };

  // AI Search & Google Events Rich Results Schema (GEO / Generative Engine Optimization)
  const itemListSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'กิจกรรมยามว่าง ฮีลใจ & ชุมชนน่าสนใจ',
      description: 'รวมกิจกรรมยามว่าง เวิร์กช็อป ออกกำลังกาย HYROX บอร์ดเกม และงานอีเวนต์ใหญ่ในกรุงเทพฯ',
      itemListElement: eventsList.slice(0, 20).map((ev, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Event',
          name: ev.title,
          description: ev.description,
          image: ev.image,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: ev.location,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Bangkok',
              addressCountry: 'TH',
            },
          },
          offers: {
            '@type': 'Offer',
            price: ev.price ? ev.price.replace(/[^0-9]/g, '') || '0' : '0',
            priceCurrency: 'THB',
            availability: 'https://schema.org/InStock',
            url: 'https://chillconnecthub.com',
          },
          organizer: {
            '@type': 'Person',
            name: ev.hostName,
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ev.rating || 4.9,
            reviewCount: ev.reviewsCount || 24,
          },
        },
      })),
    };
  }, [eventsList]);

  const handleResetAllFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedCommunityClub(null);
    setSelectedVenueFilter(null);
    setSelectedFairRailCategory(null);
    setSelectedZone(null);
    setTimeFilter('all');
    setPriceFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSortBy('newest');
    setSortByNearMe(false);
    setUserLocation(null);
    setShowEndedEvents(false);
    setSelectedSpotCategory('all');
    setSelectedSpotRailCategory(null);
    setSelectedSpotProvince('all');
    setCurrentPage(1);
    setCurrentCommunityPage(1);
    setCurrentFairPage(1);
    setCurrentSpotPage(1);
    showToast('ล้างตัวกรองทั้งหมดแล้ว ✨');
  };

  const handleToggleNearMe = () => {
    if (sortByNearMe) {
      setSortByNearMe(false);
      setUserLocation(null);
      showToast('ปิดการเรียงตามระยะทางใกล้ฉันแล้ว');
      return;
    }

    setIsLocating(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSortByNearMe(true);
          setIsLocating(false);
          setCurrentPage(1);
          showToast('📍 ค้นหากิจกรรมใกล้คุณ เรียงจากใกล้ไปไกลเรียบร้อย ✨');
        },
        (err) => {
          console.warn('Geolocation denied or timeout, fallback to Siam default:', err);
          setUserLocation({ lat: 13.7466, lng: 100.5349 });
          setSortByNearMe(true);
          setIsLocating(false);
          setCurrentPage(1);
          showToast('📍 เรียงกิจกรรมจากใกล้โซนสยาม / ใจกลางเมืองให้เรียบร้อย ✨');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setUserLocation({ lat: 13.7466, lng: 100.5349 });
      setSortByNearMe(true);
      setIsLocating(false);
      setCurrentPage(1);
      showToast('📍 เรียงกิจกรรมจากใกล้โซนสยาม / ใจกลางเมืองให้เรียบร้อย ✨');
    }
  };

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;

  // Auto-adjust currentPage within bounds without abruptly resetting to page 1
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const displayedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Community Pagination Engine
  const totalCommunityPages = Math.ceil(streamCommunityEvents.length / ITEMS_PER_PAGE) || 1;

  React.useEffect(() => {
    if (currentCommunityPage > totalCommunityPages) {
      setCurrentCommunityPage(Math.max(1, totalCommunityPages));
    }
  }, [totalCommunityPages, currentCommunityPage]);

  const displayedCommunityEvents = useMemo(() => {
    const start = (currentCommunityPage - 1) * ITEMS_PER_PAGE;
    return streamCommunityEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [streamCommunityEvents, currentCommunityPage]);

  const handleCommunityPageChange = (page: number) => {
    setCurrentCommunityPage(page);
    const el = document.getElementById('section-community-cards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fairs & Expos Pagination Engine
  const totalFairPages = Math.ceil(streamPublicEvents.length / ITEMS_PER_PAGE) || 1;

  React.useEffect(() => {
    if (currentFairPage > totalFairPages) {
      setCurrentFairPage(Math.max(1, totalFairPages));
    }
  }, [totalFairPages, currentFairPage]);

  const displayedFairEvents = useMemo(() => {
    const start = (currentFairPage - 1) * ITEMS_PER_PAGE;
    return streamPublicEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [streamPublicEvents, currentFairPage]);

  const handleFairPageChange = (page: number) => {
    setCurrentFairPage(page);
    const el = document.getElementById('section-fairs-cards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Nationwide Spots Pagination Engine
  const totalSpotPages = Math.ceil(filteredSpots.length / ITEMS_PER_PAGE) || 1;

  React.useEffect(() => {
    if (currentSpotPage > totalSpotPages) {
      setCurrentSpotPage(Math.max(1, totalSpotPages));
    }
  }, [totalSpotPages, currentSpotPage]);

  const displayedSpots = useMemo(() => {
    const start = (currentSpotPage - 1) * ITEMS_PER_PAGE;
    return filteredSpots.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSpots, currentSpotPage]);

  const handleSpotPageChange = (page: number) => {
    setCurrentSpotPage(page);
    const el = document.getElementById('section-spots-cards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectDiscoveryTab = (tab: 'all' | 'spots' | 'community' | 'fairs') => {
    setActiveScopeTab(tab);
    if (tab === 'community') setEventTypeTab('community');
    else if (tab === 'fairs') setEventTypeTab('public_venue');
    else if (tab === 'spots') setEventTypeTab('spots');

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('chill_active_scope_tab', tab);
        const url = new URL(window.location.href);
        if (tab === 'all') {
          url.searchParams.delete('tab');
        } else {
          url.searchParams.set('tab', tab);
        }
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.error('Session storage error:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">

      {/* Schema.org Structured Data for AI Engine & Google Events Parsing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* 1. Header / Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={(status) => {
          handleSetIsLoggedIn(status);
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => handleOpenCreateModal('community')}
      />

      {/* Main Content Area */}
      <main className="flex-1 space-y-2 sm:space-y-3">

        {/* 2. Hero Section (with h1 tag for SEO & Clean Instant Surprise Me) */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProvince={selectedSpotProvince}
          setSelectedProvince={setSelectedSpotProvince}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          startDate={startDate}
          endDate={endDate}
          onOpenDatePicker={() => setIsDatePickerOpen(true)}
          onClearCustomDate={() => {
            setStartDate('');
            setEndDate('');
            setTimeFilter('all');
          }}
          onSearchSubmit={handleSearchSubmit}
          onOpenSurpriseModal={(mode) => {
            setSurpriseModalMode(mode || activeScopeTab || 'all');
            setIsSurpriseModalOpen(true);
          }}
          onJoinQuest={handleJoinQuestFromHome}
          joinedQuestTitles={joinedQuestTitles}
          onCancelQuest={handleCancelQuestFromHome}
          onSelectDiscoveryTab={handleSelectDiscoveryTab}
          activeTab={activeScopeTab}
        />

        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 pt-1 sm:pt-2 pb-6 relative z-10">

          {/* 3. Auto-Sliding Trending Events Carousel (Contextually Adapted) */}
          <TrendingCarousel
            events={trendingCarouselProps.events}
            title={trendingCarouselProps.title}
            subtitle={trendingCarouselProps.subtitle}
            badgeText={trendingCarouselProps.badgeText}
            badgeColor={trendingCarouselProps.badgeColor}
            mode={trendingCarouselProps.mode}
            onSelectEvent={() => { }}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />

          {/* ========================================================================= */}
          {/* UNIFIED CURATED DISCOVERY STREAM (Global Luxury Editorial 9.8+)           */}
          {/* ========================================================================= */}
          <div id="catalog-section" className="space-y-12 sm:space-y-14 pt-1 animate-fade-in">
            {/* ========================================================================= */}
            {/* 🌟 MODE 1: SHOWROOM (Master Magazine Overview Across All 3 Pillars)         */}
            {/* ========================================================================= */}
            {activeScopeTab === 'all' && (
              <>
                {/* ------------------------------------------------------------------------- */}
                {/* STREAM SECTION 1: 👥 COMMUNITY MEETUPS (กิจกรรมคอมมูนิตี้)                 */}
                {/* ------------------------------------------------------------------------- */}
                <section id="section-community" className="space-y-4 scroll-mt-20">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-orange-50/50 via-slate-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-orange-100/60 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-[#F26430] flex items-center justify-center text-xs font-black shrink-0 border border-orange-500/20">
                          01
                        </span>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>กิจกรรมคอมมูนิตี้</span>
                          <span className="text-[10px] font-black text-[#F26430] bg-[#FFF4EE] px-2 py-0.5 rounded-full border border-orange-200">
                            {selectedCommunityClub ? (
                              TOP_COMMUNITY_CLUBS.find((c) => c.clubKey === selectedCommunityClub)?.nameTh || selectedCommunityClub
                            ) : 'Community Circles'}
                          </span>
                        </h2>
                        {timeFilter !== 'all' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-950 bg-orange-100/90 px-2.5 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                            <Calendar className="w-3 h-3 text-[#F26430]" />
                            <span>
                              {timeFilter === 'today' && 'วันนี้ (12 ก.ย.)'}
                              {timeFilter === 'tomorrow' && 'พรุ่งนี้ (13 ก.ย.)'}
                              {timeFilter === 'weekend' && 'สุดสัปดาห์นี้'}
                              {timeFilter === 'next_month' && 'เดือนนี้'}
                              {timeFilter === 'custom' && (startDate ? `${startDate}${endDate && endDate !== startDate ? ` - ${endDate}` : ''}` : 'ระบุวันที่')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTimeFilter('all');
                                setStartDate('');
                                setEndDate('');
                              }}
                              className="p-0.5 hover:bg-orange-200 rounded-full cursor-pointer ml-0.5"
                              title="ล้างตัวกรองช่วงเวลา"
                            >
                              <X className="w-3 h-3 text-orange-700" />
                            </button>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
                        เชื่อมต่อมิตรภาพผ่านกิจกรรมสร้างสรรค์ ในบรรยากาศอบอุ่น เป็นกันเอง และปลอดภัย
                      </p>
                    </div>

                    <Link
                      href={`/community${selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F26430] text-[#F26430] hover:text-white border border-orange-200/80 hover:border-[#F26430] rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
                    >
                      <span>สำรวจกิจกรรมคอมมูนิตี้ทั้งหมด ({streamCommunityEvents.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Top Community Flagship Circles & Clubs Visual Rail */}
                  <div className="pt-1 pb-1">
                    <TopCommunityRail
                      selectedClub={selectedCommunityClub}
                      onSelectClub={(clubKey) => {
                        setSelectedCommunityClub(clubKey);
                        setSelectedCategory(null);
                        setSelectedSubCategory(null);
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          const el = document.getElementById('section-community-cards');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                      eventsList={eventsList}
                    />
                  </div>

                  {/* Meetup & Luma Inspired Lifestyle Category Rail */}
                  <div className="pt-0.5">
                    <CommunityCategoryRail
                      selectedCategoryId={selectedCategory}
                      onSelectCategory={(catId) => {
                        setSelectedCategory(catId as any);
                        setSelectedSubCategory(null);
                      }}
                      eventCounts={communityCategoryCounts}
                      variant="rail"
                    />
                  </div>

                  {/* Community Events Grid (10 items across all screen sizes with dynamic responsive columns) */}
                  <div id="section-community-cards" className="scroll-mt-24">
                    <EventGrid
                      events={streamCommunityEvents}
                      limit={10}
                      onSelectEvent={() => { }}
                      favorites={isLoggedIn ? favorites : []}
                      toggleFavorite={toggleFavorite}
                      joinedEventIds={isLoggedIn ? joinedEventIds : []}
                      onResetFilters={handleResetAllFilters}
                    />
                  </div>
                </section>

                {/* ------------------------------------------------------------------------- */}
                {/* STREAM SECTION 2: 🏛️ EXHIBITIONS & FAIRS (งานมหกรรม & เอ็กซ์โป)           */}
                {/* ------------------------------------------------------------------------- */}
                <section id="section-fairs" className="space-y-4 scroll-mt-20">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-blue-50/50 via-slate-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-blue-100/60 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#2B527A] flex items-center justify-center text-xs font-black shrink-0 border border-blue-500/20">
                          02
                        </span>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>งานมหกรรม & เอ็กซ์โป</span>
                          <span className="text-[10px] font-black text-[#2B527A] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            {selectedVenueFilter ? (
                              selectedVenueFilter === 'qsncc' ? 'ศูนย์ฯ สิริกิติ์' :
                              selectedVenueFilter === 'bitec' ? 'ไบเทค บางนา' :
                              selectedVenueFilter === 'impact' ? 'อิมแพ็ค เมืองทองธานี' :
                              selectedVenueFilter === 'paragon' ? 'พารากอน & ไอคอนสยาม' :
                              selectedVenueFilter === 'bacc' ? 'หอศิลป์ BACC' :
                              selectedVenueFilter === 'park' ? 'สวนสาธารณะ & ลานเมือง' :
                              selectedVenueFilter === 'regional' ? 'ศูนย์ประชุมภูมิภาค' : selectedVenueFilter
                            ) : 'ศูนย์จัดแสดงทั่วประเทศ'}
                          </span>
                        </h2>
                        {timeFilter !== 'all' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-950 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                            <Calendar className="w-3 h-3 text-[#2B527A]" />
                            <span>
                              {timeFilter === 'today' && 'วันนี้ (12 ก.ย.)'}
                              {timeFilter === 'tomorrow' && 'พรุ่งนี้ (13 ก.ย.)'}
                              {timeFilter === 'weekend' && 'สุดสัปดาห์นี้'}
                              {timeFilter === 'next_month' && 'เดือนนี้'}
                              {timeFilter === 'custom' && (startDate ? `${startDate}${endDate && endDate !== startDate ? ` - ${endDate}` : ''}` : 'ระบุวันที่')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTimeFilter('all');
                                setStartDate('');
                                setEndDate('');
                              }}
                              className="p-0.5 hover:bg-blue-200 rounded-full cursor-pointer ml-0.5"
                              title="ล้างตัวกรองช่วงเวลา"
                            >
                              <X className="w-3 h-3 text-blue-700" />
                            </button>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
                        {selectedVenueFilter
                          ? `นิทรรศการและงานมหกรรม ณ ${
                              selectedVenueFilter === 'qsncc' ? 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)' :
                              selectedVenueFilter === 'bitec' ? 'ศูนย์นิทรรศการและการประชุมไบเทค บางนา (BITEC)' :
                              selectedVenueFilter === 'impact' ? 'อิมแพ็ค เมืองทองธานี (IMPACT)' :
                              selectedVenueFilter === 'paragon' ? 'รอยัล พารากอน ฮอลล์ & ทรู ไอคอน ฮอลล์' :
                              selectedVenueFilter === 'bacc' ? 'หอศิลปวัฒนธรรมแห่งกรุงเทพมหานคร (BACC) & ย่านสร้างสรรค์' :
                              selectedVenueFilter === 'park' ? 'สวนสาธารณะ & ลานเมืองกลางแจ้ง' :
                              selectedVenueFilter === 'regional' ? 'ศูนย์การประชุมและแสดงสินค้านานาชาติระดับภูมิภาค (KICE / CMECC)' : selectedVenueFilter
                            } (${streamPublicEvents.length} งาน)`
                          : `นิทรรศการ คอนเวนชัน และเทศกาลระดับประเทศ ณ ศูนย์การประชุมและแลนด์มาร์กชั้นนำ (${streamPublicEvents.length} งาน)`}
                      </p>
                    </div>

                    <Link
                      href={`/fairs${selectedVenueFilter ? `?venue=${encodeURIComponent(selectedVenueFilter)}` : ''}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#2B527A] text-[#2B527A] hover:text-white border border-blue-200/80 hover:border-[#2B527A] rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
                    >
                      <span>สำรวจงานมหกรรม & เอ็กซ์โปทั้งหมด ({streamPublicEvents.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Top Venues in Thailand Visual Rail (Convention Centers & Iconic Venues) */}
                  <div className="pt-1 pb-1">
                    <TopVenuesRail
                      selectedVenue={selectedVenueFilter}
                      onSelectVenue={(venueKey) => {
                        setSelectedVenueFilter(venueKey);
                        setSelectedFairRailCategory(null);
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          const el = document.getElementById('section-fairs-cards');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                      eventsList={eventsList}
                    />
                  </div>

                  {/* Major Fairs & Expo Category Rail */}
                  <div className="pt-0.5">
                    <FairCategoryRail
                      selectedCategoryId={selectedFairRailCategory}
                      onSelectCategory={(catId) => {
                        setSelectedFairRailCategory(catId);
                      }}
                      fairCounts={fairCategoryCounts}
                    />
                  </div>

                  {/* Public Venue Events Grid (10 items across all screen sizes with dynamic responsive columns) */}
                  <div id="section-fairs-cards" className="scroll-mt-24">
                    <EventGrid
                      events={streamPublicEvents}
                      limit={10}
                      onSelectEvent={() => { }}
                      favorites={isLoggedIn ? favorites : []}
                      toggleFavorite={toggleFavorite}
                      joinedEventIds={isLoggedIn ? joinedEventIds : []}
                      onResetFilters={handleResetAllFilters}
                    />
                  </div>
                </section>

                {/* ------------------------------------------------------------------------- */}
                {/* STREAM SECTION 3: 📍 LIFESTYLE SPOTS (พิกัดเที่ยว & จุดฮีลใจ ทั่วไทย)        */}
                {/* ------------------------------------------------------------------------- */}
                <section id="section-spots" className="space-y-4 scroll-mt-20">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-emerald-50/50 via-slate-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-emerald-100/60 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-[#4A7C59] flex items-center justify-center text-xs font-black shrink-0 border border-emerald-500/20">
                          03
                        </span>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>พิกัดเที่ยว & จุดฮีลใจ</span>
                          <span className="text-[10px] font-black text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-emerald-200">
                            {selectedSpotProvince === 'all' ? '77 จังหวัด' : selectedSpotProvince}
                          </span>
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
                        {selectedSpotProvince === 'all'
                          ? `พื้นที่ชาร์จพลัง คาเฟ่รักษ์โลก และจุดพักผ่อนธรรมชาติที่ผ่านการคัดสรรโดยคนท้องถิ่น (${filteredSpots.length} แห่ง)`
                          : `พื้นที่พักผ่อนและสเปซน่าหลงใหลในจังหวัด${selectedSpotProvince} (${filteredSpots.length} แห่ง)`}
                      </p>
                    </div>

                    <Link
                      href={`/spots?category=${encodeURIComponent(selectedSpotCategory)}&province=${encodeURIComponent(selectedSpotProvince)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#4A7C59] text-[#4A7C59] hover:text-white border border-emerald-200/80 hover:border-[#4A7C59] rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
                    >
                      <span>สำรวจพิกัดเที่ยวทั้งหมด ({filteredSpots.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Top Destinations in Thailand Visual Rail */}
                  <div className="pt-1 pb-1">
                    <TopDestinationsRail
                      selectedProvince={selectedSpotProvince}
                      onSelectProvince={(prov) => {
                        setSelectedSpotProvince(prov);
                        setSelectedSpotRailCategory(null);
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          const el = document.getElementById('section-spots-cards');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                    />
                  </div>

                  {/* Nationwide Spot Category Rail */}
                  <div className="pt-0.5">
                    <SpotCategoryRail
                      selectedCategoryId={selectedSpotRailCategory}
                      onSelectCategory={(catId) => {
                        setSelectedSpotRailCategory(catId);
                      }}
                      spotCounts={spotCategoryCounts}
                    />
                  </div>

                  {/* Spot Cards Grid: 10 items across all screen sizes */}
                  <div id="section-spots-cards" className="scroll-mt-24">
                    {filteredSpots.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                        {filteredSpots.slice(0, 10).map((spot) => (
                          <div
                            key={spot.id}
                            className="block"
                          >
                            <SpotCard
                              spot={spot}
                              isFavorite={isLoggedIn && favoriteSpots.includes(spot.id)}
                              isJoined={isLoggedIn && joinedEventIds.includes(spot.id)}
                              onToggleFavorite={(id) => {
                                if (!isLoggedIn) {
                                  triggerMembershipPrompt('เพื่อบันทึกสถานที่โปรด');
                                  return;
                                }
                                toggleFavoriteSpot(id);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50/80 rounded-2xl p-5 border border-dashed border-slate-200 text-center space-y-3">
                        <p className="text-xs sm:text-sm font-bold text-slate-700">
                          {selectedSpotProvince !== 'all' && selectedSpotRailCategory
                            ? `ไม่พบสถานที่ในหมวด "${NATIONWIDE_SPOT_CATEGORIES.find(c => c.id === selectedSpotRailCategory)?.name}" ในพื้นที่ ${selectedSpotProvince}`
                            : selectedSpotProvince !== 'all'
                            ? `ไม่พบสถานที่ในพื้นที่ ${selectedSpotProvince}`
                            : 'ไม่พบสถานที่ตามตัวกรองที่เลือก'}
                        </p>
                        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                          {selectedSpotProvince !== 'all' && selectedSpotRailCategory && (
                            <button
                              type="button"
                              onClick={() => setSelectedSpotProvince('all')}
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#4A7C59] font-bold hover:bg-emerald-50 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                            >
                              สำรวจหมวดนี้ทั่วไทย (77 จังหวัด)
                            </button>
                          )}
                          {selectedSpotRailCategory && (
                            <button
                              type="button"
                              onClick={() => setSelectedSpotRailCategory(null)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 shadow-2xs transition-all cursor-pointer active:scale-95"
                            >
                              ดูทุกหมวด{selectedSpotProvince !== 'all' ? `ใน${selectedSpotProvince}` : ''}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-2xs transition-all cursor-pointer active:scale-95"
                          >
                            ล้างตัวกรองทั้งหมด
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* ------------------------------------------------------------------------- */}
                {/* STREAM SECTION 4: ⚡ COMMUNITY QUESTS (ชาเลนจ์ & ภารกิจท้าทาย)             */}
                {/* ------------------------------------------------------------------------- */}
                <div id="section-challenges" className="scroll-mt-24">
                  <CommunityChallengeBar
                    onJoinQuest={handleJoinQuestFromHome}
                    joinedQuestTitles={isLoggedIn ? joinedQuestTitles : []}
                  />
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* STREAM SECTION 5: 📸 SOCIAL STORIES (โมเมนต์ & บรรยากาศจริงจากชุมชน)        */}
                {/* ------------------------------------------------------------------------- */}
                <div id="section-moments" className="scroll-mt-24">
                  <CommunityMomentsStrip />
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* STREAM SECTION 6: 💎 PLATFORM TRUST & LIFESTYLE PERKS                     */}
                {/* ------------------------------------------------------------------------- */}
                <PlatformTrustAndPerks onOpenLogin={() => setIsAuthModalOpen(true)} />
              </>
            )}

            {/* ========================================================================= */}
            {/* 👥 MODE 2: COMMUNITY CIRCLES DEEP DIVE                                    */}
            {/* ========================================================================= */}
            {activeScopeTab === 'community' && (
              <div className="space-y-8 sm:space-y-10 animate-fade-in">
                {/* Community Pillar Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-orange-50/60 via-slate-50/40 to-transparent p-4 sm:p-5 rounded-2xl border border-orange-100/70 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] sm:text-xs font-black tracking-wider text-[#F26430] uppercase bg-[#FFF4EE] px-2.5 py-0.5 rounded-full border border-orange-200">
                        Community Meetups • Bangkok & Urban Circles
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                        {streamCommunityEvents.length} กิจกรรมที่เปิดรับสมัคร
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                      เชื่อมต่อมิตรภาพผ่านกิจกรรมสร้างสรรค์ ขนาดกลุ่มอบอุ่น 4-10 คน บรรยากาศปลอดภัย เป็นกันเอง และไร้แรงกดดัน
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('community')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-start sm:self-auto active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 text-orange-400 group-hover/btn:rotate-90 transition-transform duration-300" />
                    <span>เปิดตี้ / สร้างกิจกรรมใหม่</span>
                  </button>
                </div>

                {/* Top Community Flagship Circles & Clubs Visual Rail */}
                <div className="pt-1 pb-1">
                  <TopCommunityRail
                    selectedClub={selectedCommunityClub}
                    onSelectClub={(clubKey) => {
                      setSelectedCommunityClub(clubKey);
                      setCurrentCommunityPage(1);
                    }}
                    eventsList={eventsList}
                  />
                </div>

                {/* Community Category Rail */}
                <div className="pt-0.5">
                  <CommunityCategoryRail
                    selectedCategoryId={selectedCategory}
                    onSelectCategory={(catId) => {
                      setSelectedCategory(catId as any);
                      setSelectedSubCategory(null);
                      setCurrentCommunityPage(1);
                    }}
                    eventCounts={communityCategoryCounts}
                    variant="rail"
                  />
                </div>

                {/* Full Community Event Grid with Pagination */}
                <div id="section-community-cards" className="scroll-mt-24">
                  <EventGrid
                    events={displayedCommunityEvents}
                    onSelectEvent={() => { }}
                    favorites={isLoggedIn ? favorites : []}
                    toggleFavorite={toggleFavorite}
                    joinedEventIds={isLoggedIn ? joinedEventIds : []}
                    onResetFilters={handleResetAllFilters}
                  />

                  {/* Community Pagination Controls */}
                  {streamCommunityEvents.length > ITEMS_PER_PAGE && (
                    <div className="pt-6">
                      <Pagination
                        currentPage={currentCommunityPage}
                        totalPages={totalCommunityPages}
                        onPageChange={handleCommunityPageChange}
                        totalItems={streamCommunityEvents.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        itemUnit="กิจกรรม"
                        scrollTargetId="section-community-cards"
                      />
                    </div>
                  )}
                </div>


                {/* Community Trust Section */}
                <CommunityTrustSection />
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🏛️ MODE 3: MAJOR FAIRS & PUBLIC EXPOS DEEP DIVE                           */}
            {/* ========================================================================= */}
            {activeScopeTab === 'fairs' && (
              <div className="space-y-8 sm:space-y-10 animate-fade-in">
                {/* Fairs Pillar Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-blue-50/60 via-slate-50/40 to-transparent p-4 sm:p-5 rounded-2xl border border-blue-100/70 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] sm:text-xs font-black tracking-wider text-[#2B527A] uppercase bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Major Fairs & Public Expos • Nationwide
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                        {streamPublicEvents.length} งานมหกรรมทั่วไทย
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      งานมหกรรม นิทรรศการ & เอ็กซ์โป
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                      ปฏิทินงานมหกรรม คอนเวนชัน และเอ็กซ์โประดับประเทศ ณ ศูนย์การประชุมและแลนด์มาร์กชั้นนำทั่วไทย
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('fair')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-start sm:self-auto active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-400 group-hover/btn:rotate-90 transition-transform duration-300" />
                    <span>สร้างงานมหกรรม / เอ็กซ์โป</span>
                  </button>
                </div>

                {/* Top Venues Rail (Where: Venues) */}
                <div className="pt-1 pb-1">
                  <TopVenuesRail
                    selectedVenue={selectedVenueFilter}
                    onSelectVenue={(venueKey) => {
                      setSelectedVenueFilter(venueKey);
                      setCurrentFairPage(1);
                    }}
                    eventsList={eventsList}
                  />
                </div>

                {/* Fair Category Rail (What: 8 Fair Themes) */}
                <div className="pt-0.5">
                  <FairCategoryRail
                    selectedCategoryId={selectedFairRailCategory}
                    onSelectCategory={(catId) => {
                      setSelectedFairRailCategory(catId);
                      setCurrentFairPage(1);
                    }}
                    fairCounts={fairCategoryCounts}
                  />
                </div>

                {/* Full Fairs Event Grid with Pagination */}
                <div id="section-fairs-cards" className="scroll-mt-24">
                  <EventGrid
                    events={displayedFairEvents}
                    onSelectEvent={() => { }}
                    favorites={isLoggedIn ? favorites : []}
                    toggleFavorite={toggleFavorite}
                    joinedEventIds={isLoggedIn ? joinedEventIds : []}
                    onResetFilters={handleResetAllFilters}
                  />

                  {/* Fairs Pagination Controls */}
                  {streamPublicEvents.length > ITEMS_PER_PAGE && (
                    <div className="pt-6">
                      <Pagination
                        currentPage={currentFairPage}
                        totalPages={totalFairPages}
                        onPageChange={handleFairPageChange}
                        totalItems={streamPublicEvents.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        itemUnit="งานมหกรรม"
                        scrollTargetId="section-fairs-cards"
                      />
                    </div>
                  )}
                </div>


                {/* Fairs Trust Section */}
                <FairsTrustSection />
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🌲 MODE 4: LIFESTYLE SPOTS 77 PROVINCES DEEP DIVE                         */}
            {/* ========================================================================= */}
            {activeScopeTab === 'spots' && (
              <div className="space-y-8 sm:space-y-10 animate-fade-in">
                {/* Spots Pillar Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-emerald-50/60 via-slate-50/40 to-transparent p-4 sm:p-5 rounded-2xl border border-emerald-100/70 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] sm:text-xs font-black tracking-wider text-[#4A7C59] uppercase bg-[#EBF3ED] px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Curated Spots & Healing Spaces • 77 Provinces
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                        {filteredSpots.length} พิกัดคัดสรรทั่วไทย
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                      พื้นที่ชาร์จพลัง คาเฟ่รักษ์โลก และจุดพักผ่อนธรรมชาติที่ผ่านการคัดสรรโดยคนท้องถิ่น ทั่วประเทศไทย
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('spot')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-start sm:self-auto active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400 group-hover/btn:rotate-90 transition-transform duration-300" />
                    <span>แนะนำพิกัดเที่ยวใหม่</span>
                  </button>
                </div>

                {/* Top Destinations Rail (Where: Provinces) */}
                <div className="pt-1 pb-1">
                  <TopDestinationsRail
                    selectedProvince={selectedSpotProvince}
                    onSelectProvince={(prov) => {
                      setSelectedSpotProvince(prov);
                      setCurrentSpotPage(1);
                    }}
                  />
                </div>

                {/* Spot Category Rail (What: 7 Vibe Categories) */}
                <div className="pt-0.5">
                  <SpotCategoryRail
                    selectedCategoryId={selectedSpotRailCategory}
                    onSelectCategory={(catId) => {
                      setSelectedSpotRailCategory(catId);
                      setCurrentSpotPage(1);
                    }}
                    spotCounts={spotCategoryCounts}
                  />
                </div>

                {/* Full Spots Grid with Pagination */}
                <div id="section-spots-cards" className="scroll-mt-24">
                  {displayedSpots.length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                        {displayedSpots.map((spot) => (
                          <div
                            key={spot.id}
                            className="block"
                          >
                            <SpotCard
                              spot={spot}
                              isFavorite={isLoggedIn && favoriteSpots.includes(spot.id)}
                              isJoined={isLoggedIn && joinedEventIds.includes(spot.id)}
                              onToggleFavorite={(id) => {
                                if (!isLoggedIn) {
                                  triggerMembershipPrompt('เพื่อบันทึกสถานที่โปรด');
                                  return;
                                }
                                toggleFavoriteSpot(id);
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {filteredSpots.length > ITEMS_PER_PAGE && (
                        <Pagination
                          currentPage={currentSpotPage}
                          totalPages={totalSpotPages}
                          onPageChange={handleSpotPageChange}
                          totalItems={filteredSpots.length}
                          itemsPerPage={ITEMS_PER_PAGE}
                          itemUnit="พิกัด"
                          scrollTargetId="section-spots-cards"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-dashed border-slate-200 text-center space-y-3">
                      <p className="text-xs sm:text-sm font-bold text-slate-700">
                        {selectedSpotProvince !== 'all' && selectedSpotRailCategory
                          ? `ไม่พบสถานที่ในหมวด "${NATIONWIDE_SPOT_CATEGORIES.find(c => c.id === selectedSpotRailCategory)?.name}" ในพื้นที่ ${selectedSpotProvince}`
                          : selectedSpotProvince !== 'all'
                          ? `ไม่พบสถานที่ในพื้นที่ ${selectedSpotProvince}`
                          : 'ไม่พบสถานที่ตามตัวกรองที่เลือก'}
                      </p>
                      <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                        {selectedSpotProvince !== 'all' && selectedSpotRailCategory && (
                          <button
                            type="button"
                            onClick={() => setSelectedSpotProvince('all')}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#4A7C59] font-bold hover:bg-emerald-50 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                          >
                            สำรวจหมวดนี้ทั่วไทย (77 จังหวัด)
                          </button>
                        )}
                        {selectedSpotRailCategory && (
                          <button
                            type="button"
                            onClick={() => setSelectedSpotRailCategory(null)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 shadow-2xs transition-all cursor-pointer active:scale-95"
                          >
                            ดูทุกหมวด{selectedSpotProvince !== 'all' ? `ใน${selectedSpotProvince}` : ''}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleResetAllFilters}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-2xs transition-all cursor-pointer active:scale-95"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      </div>
                    </div>
                  )}
                </div>


                {/* Spots Trust Section */}
                <SpotsTrustSection />
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Elegant Organic Lifestyle Footer (Clean, Minimal & Natural Editorial) */}
      <footer 
        role="contentinfo"
        aria-label="Chill & Connect Hub Footer"
        className="bg-[#FAF9F6] text-slate-700 border-t border-slate-200/80 pt-12 sm:pt-14 pb-24 sm:pb-12 px-4 sm:px-6 lg:px-8 mt-16 transition-colors"
      >
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-8">

          {/* Top Row: Brand Info + Navigation Columns */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 pb-8 border-b border-slate-200/80">
            
            {/* Brand Intro */}
            <div className="space-y-3 max-w-md">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="sm" />
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Chill & Connect Hub
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                แพลตฟอร์มค้นพบพิกัดเที่ยว จุดฮีลใจ คาเฟ่ และกิจกรรมคอมมูนิตี้สำหรับคนรักการใช้ชีวิต เชื่อมต่อเพื่อนใหม่และสร้างบทสนทนาที่มีความหมาย
              </p>
            </div>

            {/* Quick Links Group */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10 text-xs sm:text-sm w-full lg:w-auto">
              
              {/* Col 1: เสาหลักการค้นพบ */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                  สำรวจไลฟ์สไตล์
                </h4>
                <ul className="space-y-2.5 font-medium text-slate-600">
                  <li>
                    <Link 
                      href="/spots" 
                      title="ค้นหาพิกัดเที่ยวและคาเฟ่"
                      className="hover:text-[#4A7C59] transition-colors flex items-center gap-1.5 focus:outline-none focus:underline"
                    >
                      <span>พิกัดเที่ยว & จุดฮีลใจ</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/community" 
                      title="หากิจกรรมคอมมูนิตี้และเปิดตี้เพื่อนใหม่"
                      className="hover:text-[#F26430] transition-colors flex items-center gap-1.5 focus:outline-none focus:underline"
                    >
                      <span>ตี้เพื่อนใหม่ & กิจกรรม</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/fairs" 
                      title="งานมหกรรม นิทรรศการ และเอ็กซ์โป"
                      className="hover:text-blue-700 transition-colors flex items-center gap-1.5 focus:outline-none focus:underline"
                    >
                      <span>งานมหกรรม & เอ็กซ์โป</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 2: ชุมชนและการมีส่วนร่วม */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                  คอมมูนิตี้ & ชาเลนจ์
                </h4>
                <ul className="space-y-2.5 font-medium text-slate-600">
                  <li>
                    <Link 
                      href="/challenges" 
                      title="ภารกิจสะสมเหรียญตราและแต้ม EXP"
                      className="hover:text-purple-700 transition-colors flex items-center gap-1.5 focus:outline-none focus:underline"
                    >
                      <span>ชาเลนจ์สะสมเหรียญตรา</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/moments" 
                      title="แชร์และบันทึกโมเมนต์ความทรงจำ"
                      className="hover:text-[#4A7C59] transition-colors focus:outline-none focus:underline"
                    >
                      <span>โมเมนต์ & ความทรงจำ</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/myhub" 
                      title="ดูตั๋วและกิจกรรมที่เข้าร่วม"
                      className="hover:text-[#4A7C59] transition-colors focus:outline-none focus:underline"
                    >
                      <span>มายฮับ & บอร์ดนัดพบ</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 3: ความช่วยเหลือ & ข้อกำหนด */}
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                  ความปลอดภัย & ช่วยเหลือ
                </h4>
                <ul className="space-y-2.5 font-medium text-slate-600">
                  <li>
                    <Link 
                      href="/about" 
                      title="รู้จักวิสัยทัศน์ของ Chill & Connect Hub"
                      className="hover:text-[#4A7C59] transition-colors focus:outline-none focus:underline"
                    >
                      <span>เกี่ยวกับเรา</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/safety" 
                      title="มาตรฐานความปลอดภัยในการพบเพื่อนใหม่"
                      className="hover:text-[#4A7C59] transition-colors focus:outline-none focus:underline"
                    >
                      <span>คู่มือความปลอดภัย</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/onboarding" 
                      title="เริ่มต้นตั้งค่าโปรไฟล์และสไตล์ที่ชอบ"
                      className="hover:text-[#4A7C59] transition-colors focus:outline-none focus:underline"
                    >
                      <span>แนะนำตัวสมาชิก</span>
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Bottom Row: Clean Copyright & Global Regional Tag */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-3 flex-wrap">
              <p>© 2026 Chill & Connect Hub. สร้างขึ้นด้วยความใส่ใจเพื่อชุมชนคนชอบใช้ชีวิต</p>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-400 text-[11px]">Curated Lifestyle Discovery & Community Network</span>
            </div>
            
            {/* Global International / Currency / Language Selector Mock */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/80 hover:bg-slate-200/60 transition-colors cursor-pointer select-none">
                <span>🇹🇭</span>
                <span className="font-semibold text-slate-700">ไทย (TH)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/80 hover:bg-slate-200/60 transition-colors cursor-pointer select-none">
                <span className="font-semibold text-slate-700">THB (฿)</span>
              </span>
            </div>
          </div>

        </div>
      </footer>



      {/* Advanced Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedVenueFilter={selectedVenueFilter}
        setSelectedVenueFilter={setSelectedVenueFilter}
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
        selectedGroupSize={eventTypeTab === 'public_venue' ? 'public_venue' : 'community'}
        setSelectedGroupSize={(size) => setEventTypeTab(size)}
        priceFilter={priceFilter}
        setPriceFilter={setPriceFilter}
        onResetAll={handleResetAllFilters}
        totalResultsCount={eventTypeTab === 'spots' ? filteredSpots.length : filteredEvents.length}
        isSpotsMode={eventTypeTab === 'spots'}
        selectedSpotCategory={selectedSpotCategory}
        setSelectedSpotCategory={setSelectedSpotCategory}
        selectedSpotProvince={selectedSpotProvince}
        setSelectedSpotProvince={setSelectedSpotProvince}
      />

      {/* Custom Date Picker Popup Modal */}
      <CustomDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        startDate={startDate}
        endDate={endDate}
        onApply={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setTimeFilter('custom');
          showToast(`เลือกช่วงเวลา: ${start} ${start !== end ? `ถึง ${end}` : ''}`);
        }}
        onReset={() => {
          setStartDate('');
          setEndDate('');
          setTimeFilter('all');
          showToast('ล้างการกรองช่วงเวลาเรียบร้อย');
        }}
      />

      {/* Create Custom Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setEventsList([newEvent, ...eventsList]);
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย! 🎉`);
        }}
      />

      {/* Create Custom Challenge Modal */}
      <CreateChallengeModal
        isOpen={isCreateChallengeModalOpen}
        onClose={() => setIsCreateChallengeModalOpen(false)}
        onCreateSuccess={(newQuest) => {
          setJoinedQuestTitles((prev) => [...prev, newQuest.title]);
          showToast(`🎉 สร้างชาเลนจ์ "${newQuest.title}" (${newQuest.visibility === 'public' ? 'สาธารณะ 🌐' : 'ส่วนตัว 🔒'}) สำเร็จแล้ว!`);
        }}
      />

      {/* Free Membership Required Prompt Modal */}
      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipActionTitle}
      />

      {/* Auth Login / Signup Popup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userName) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${userName}! เข้าสู่ระบบเรียบร้อย 🎉`);
        }}
      />

      {/* Logout Confirmation Popup Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว (Guest View)');
        }}
      />

      {/* Surprise Me! Interactive Random Event / Spot Modal */}
      <SurpriseModal
        isOpen={isSurpriseModalOpen}
        mode={surpriseModalMode}
        onClose={() => setIsSurpriseModalOpen(false)}
        events={eventsList}
        spots={MOCK_SPOTS}
        onSelectTarget={({ type, id }) => {
          setIsSurpriseModalOpen(false);
          if (type === 'spot') {
            router.push(`/spots/${encodeURIComponent(id)}`);
          } else if (type === 'fair') {
            router.push(`/fairs/${encodeURIComponent(id)}`);
          } else {
            router.push(`/community/${encodeURIComponent(id)}`);
          }
        }}
      />

      {/* Create Unified Event/Spot/Fair/Quest Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        initialType={createModalInitialType}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent: EventItem) => {
          setEventsList((prev) => [newEvent, ...prev]);
          showToast(`สร้าง "${newEvent.title}" เรียบร้อยแล้ว! 🎉`);
        }}
      />

      {/* Mobile Nav */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={favorites.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}
