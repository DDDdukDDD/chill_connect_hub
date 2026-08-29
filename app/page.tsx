'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { Pagination } from '@/components/Pagination';
import { MOCK_SPOTS, SPOT_CATEGORIES, ALL_THAI_PROVINCES, LifestyleSpotItem } from '@/data/spotsData';
import { SpotCard } from '@/components/SpotCard';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp, isEventEndedByDate } from '@/lib/dateUtils';
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
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 24;

export default function Home() {
  const router = useRouter();
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState<'heal' | 'move' | 'chill' | 'learn' | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [eventTypeTab, setEventTypeTab] = useState<'spots' | 'public_venue' | 'community'>('spots');
  const [selectedSpotCategory, setSelectedSpotCategory] = useState<string>('all');
  const [selectedSpotProvince, setSelectedSpotProvince] = useState<string>('all');
  const [selectedSpot, setSelectedSpot] = useState<LifestyleSpotItem | null>(null);
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>(['spot-bkk-1']);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>(['1', '3', 'live-agg-1', 'live-agg-3', 'live-agg-9']);
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
  const [isSurpriseModalOpen, setIsSurpriseModalOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'favorites'>('newest');
  const [sortByNearMe, setSortByNearMe] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [favorites, setFavorites] = useState<string[]>(['1', '7']);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSpotPage, setCurrentSpotPage] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] = useState<boolean>(false);
  const [joinedQuestTitles, setJoinedQuestTitles] = useState<string[]>(['Cafe Hunter 5', 'Step Count 30Days']);
  const [showEndedEvents, setShowEndedEvents] = useState<boolean>(false);
  const [heroVersion, setHeroVersion] = useState<'editorial' | 'classic'>('editorial');

  // Listen to hero version in URL or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlHero = urlParams.get('hero');
      if (urlHero === 'editorial' || urlHero === 'classic') {
        setHeroVersion(urlHero);
        return;
      }
      const savedVersion = localStorage.getItem('chill_hero_version') as 'editorial' | 'classic' | null;
      if (savedVersion === 'editorial' || savedVersion === 'classic') {
        setHeroVersion(savedVersion);
      }
    }
  }, []);

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
      const tabParam = urlParams.get('tab') as 'spots' | 'public_venue' | 'community' | null;
      const savedTab = sessionStorage.getItem('chill_active_tab') as 'spots' | 'public_venue' | 'community' | null;

      const targetTab = tabParam || savedTab;
      if (targetTab && ['spots', 'public_venue', 'community'].includes(targetTab)) {
        setEventTypeTab(targetTab);
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

  const toggleFavoriteSpot = (spotId: string) => {
    if (!isLoggedIn) {
      triggerMembershipPrompt('เพื่อบันทึกสถานที่นี้ไว้ใน Bucket List');
      return;
    }
    setFavoriteSpots((prev) => {
      const isFav = prev.includes(spotId);
      if (isFav) {
        showToast('ลบสถานที่ออกจากรายการบันทึกแล้ว');
        return prev.filter((id) => id !== spotId);
      } else {
        showToast('บันทึกสถานที่ลงใน Bucket List เรียบร้อย! 💖');
        return [...prev, spotId];
      }
    });
  };

  const triggerMembershipPrompt = (actionReason: string) => {
    setMembershipActionTitle(actionReason);
    setIsRequireMembershipOpen(true);
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
      if (isFav) {
        showToast('ลบออกจากรายการโปรดแล้ว');
        return prev.filter((id) => id !== eventId);
      } else {
        showToast('เพิ่มเข้าในรายการโปรดเรียบร้อย! ❤️');
        return [...prev, eventId];
      }
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
    setJoinedEventIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
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
    setJoinedEventIds((prev) => prev.filter((id) => id !== eventId));
    showToast('ยกเลิกการเข้าร่วมกิจกรรมเรียบร้อยแล้ว');
  };

  // Trending Events (isTrending = true)
  const trendingEvents = useMemo(() => {
    return eventsList.filter((e) => e.isTrending);
  }, [eventsList]);

  // Newly Added Events (isNew = true)
  const newEvents = useMemo(() => {
    return eventsList.filter((e) => e.isNew);
  }, [eventsList]);

  // Filtered and Sorted Events for Full Catalog
  const filteredEvents = useMemo(() => {
    let result = eventsList.filter((event) => {
      const matchesCategory =
        selectedCategory === null || event.category === selectedCategory;

      let matchesVenue = true;
      if (selectedVenueFilter) {
        matchesVenue = event.venueTag === selectedVenueFilter;
      }

      let matchesEventType = true;
      const currentEvType = event.eventType || 'community';
      if (eventTypeTab === 'public_venue') {
        matchesEventType = currentEvType === 'public_venue';
      } else if (eventTypeTab === 'community') {
        matchesEventType = currentEvType === 'community';
      }

      let matchesTime = true;
      if (timeFilter === 'today') {
        const startT = parseEventDateToTimestamp(event.date);
        const endT = parseEventEndDateToTimestamp(event.date);
        const todayStart = new Date(2026, 7, 22, 0, 0, 0).getTime();
        const todayEnd = new Date(2026, 7, 22, 23, 59, 59).getTime();
        matchesTime = (startT <= todayEnd && endT >= todayStart) || event.date.includes('22 ส.ค.');
      } else if (timeFilter === 'tomorrow') {
        const startT = parseEventDateToTimestamp(event.date);
        const endT = parseEventEndDateToTimestamp(event.date);
        const tomStart = new Date(2026, 7, 23, 0, 0, 0).getTime();
        const tomEnd = new Date(2026, 7, 23, 23, 59, 59).getTime();
        matchesTime = (startT <= tomEnd && endT >= tomStart) || event.date.includes('23 ส.ค.');
      } else if (timeFilter === 'weekend') {
        const startT = parseEventDateToTimestamp(event.date);
        const endT = parseEventEndDateToTimestamp(event.date);
        const wkndStart = new Date(2026, 7, 22, 0, 0, 0).getTime();
        const wkndEnd = new Date(2026, 7, 23, 23, 59, 59).getTime();
        matchesTime = (startT <= wkndEnd && endT >= wkndStart) || event.date.includes('เสาร์') || event.date.includes('อาทิตย์') || event.date.includes('22') || event.date.includes('23');
      } else if (timeFilter === 'next_month') {
        matchesTime = event.date.includes('ก.ย.') || event.date.includes('เม.ย.') || event.date.includes('พ.ค.');
      } else if (timeFilter === 'custom' && (startDate || endDate)) {
        matchesTime = true;
      }

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

      // Ended Events filter (Default: hide ended events, show when showEndedEvents is true)
      let matchesEnded = true;
      if (!showEndedEvents) {
        matchesEnded = !isEventEnded(event);
      }

      return matchesCategory && matchesVenue && matchesEventType && matchesTime && matchesSubCategory && matchesSearch && matchesPrice && matchesZone && matchesEnded;
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
    selectedVenueFilter,
    selectedZone,
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

  // Stream subsets for Option A (Unified Discovery Feed)
  const streamCommunityEvents = useMemo(() => {
    return eventsList.filter((e) => (e.eventType || 'community') === 'community');
  }, [eventsList]);

  const streamPublicEvents = useMemo(() => {
    return eventsList.filter((e) => e.eventType === 'public_venue');
  }, [eventsList]);

  // Filtered Lifestyle Spots (พิกัดเที่ยว & จุดฮีลใจ ทั่วประเทศ)
  const filteredSpots = useMemo(() => {
    let result = MOCK_SPOTS.filter((spot) => {
      // 1. Category Filter
      if (selectedSpotCategory !== 'all' && spot.category !== selectedSpotCategory) {
        return false;
      }

      // 2. Province Filter
      if (selectedSpotProvince !== 'all') {
        const pLower = selectedSpotProvince.toLowerCase();
        const spotProv = spot.province.toLowerCase();
        if (!spotProv.includes(pLower) && !pLower.includes(spotProv)) {
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
        const matchTitle = spot.title.toLowerCase().includes(q);
        const matchDesc = spot.description.toLowerCase().includes(q);
        const matchProv = spot.province.toLowerCase().includes(q);
        const matchDist = spot.district.toLowerCase().includes(q);
        const matchTag = spot.vibeTags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchProv && !matchDist && !matchTag) {
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
  }, [selectedSpotCategory, selectedSpotProvince, priceFilter, sortBy, sortByNearMe, userLocation, favoriteSpots, searchQuery]);

  const handleSearchSubmit = () => {
    // Smart Search Auto-Clear: reset conflicting sub-filters so the search result is not blocked
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedVenueFilter(null);
    setSelectedZone(null);
    setPriceFilter('all');
    setTimeFilter('all');
    setStartDate('');
    setEndDate('');
    setSortByNearMe(false);
    setCurrentPage(1);
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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
    setSelectedVenueFilter(null);
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
    setSelectedSpotProvince('all');
    setCurrentPage(1);
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
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            triggerMembershipPrompt('เพื่อสร้างกิจกรรมหรือเปิดตี้ใหม่');
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 space-y-2 sm:space-y-3">
        
        {/* 2. Hero Section (with h1 tag for SEO & Clean Instant Surprise Me) */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProvince={selectedSpotProvince}
          setSelectedProvince={setSelectedSpotProvince}
          onSearchSubmit={handleSearchSubmit}
          onOpenSurpriseModal={() => setIsSurpriseModalOpen(true)}
          initialVersion={heroVersion}
          onVersionChange={(v) => setHeroVersion(v)}
        />

        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pt-1 sm:pt-2 pb-6 relative z-10">
          
          {/* 3. Auto-Sliding Trending Events Carousel */}
          <TrendingCarousel
            events={eventsList}
            onSelectEvent={() => {}}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />

          {/* ========================================================================= */}
          {/* OPTION A: UNIFIED CURATED DISCOVERY STREAM (for Compact / Editorial Mode)  */}
          {/* ========================================================================= */}
          {heroVersion === 'editorial' ? (
            <div id="catalog-section" className="space-y-10 sm:space-y-12 pt-2 animate-fade-in">
              
              {/* ------------------------------------------------------------------------- */}
              {/* STREAM SECTION 1: 📍 LIFESTYLE SPOTS (พิกัดเที่ยว & จุดฮีลใจ ทั่วไทย)        */}
              {/* ------------------------------------------------------------------------- */}
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-emerald-50/50 via-slate-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-emerald-100/60 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-[#4A7C59] flex items-center justify-center text-xs font-black shrink-0 border border-emerald-500/20">
                        01
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>พิกัดเที่ยว & จุดฮีลใจทั่วไทย</span>
                        <span className="text-[10px] font-black text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-emerald-200">
                          {selectedSpotProvince === 'all' ? '77 จังหวัด' : selectedSpotProvince}
                        </span>
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
                      {selectedSpotProvince === 'all'
                        ? `คัดสรรคาเฟ่ สเปซฮีลใจ และแลนด์มาร์กเด่นทั่วประเทศ (${filteredSpots.length} แห่ง)`
                        : `สถานที่น่าสนใจในจังหวัด${selectedSpotProvince} (${filteredSpots.length} แห่ง)`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Category Filter Dropdown */}
                    <div className="relative hidden sm:block">
                      <select
                        value={selectedSpotCategory}
                        onChange={(e) => setSelectedSpotCategory(e.target.value)}
                        aria-label="เลือกหมวดหมู่สถานที่"
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-7 appearance-none transition-colors shadow-2xs"
                      >
                        {SPOT_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <Link
                      href={`/spots?category=${encodeURIComponent(selectedSpotCategory)}&province=${encodeURIComponent(selectedSpotProvince)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#4A7C59] text-[#4A7C59] hover:text-white border border-emerald-200/80 hover:border-[#4A7C59] rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer"
                    >
                      <span>ดูสถานที่ทั้งหมด ({filteredSpots.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Spot Cards Grid (Top 10 items - 2 rows of 5 on desktop) */}
                {filteredSpots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                    {filteredSpots.slice(0, 10).map((spot) => (
                      <SpotCard
                        key={spot.id}
                        spot={spot}
                        isFavorite={favoriteSpots.includes(spot.id)}
                        onToggleFavorite={(id) => {
                          if (!isLoggedIn) {
                            triggerMembershipPrompt('เพื่อบันทึกสถานที่โปรด');
                            return;
                          }
                          toggleFavoriteSpot(id);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center text-xs text-slate-500 font-medium">
                    ไม่พบสถานที่ในหมวดนี้ ลองเลือกล้างตัวกรองดูนะครับ
                  </div>
                )}
              </section>

              {/* ------------------------------------------------------------------------- */}
              {/* STREAM SECTION 2: 👥 COMMUNITY MEETUPS (กิจกรรมคอมมูนิตี้ & ชวนเพื่อน)     */}
              {/* ------------------------------------------------------------------------- */}
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-orange-50/50 via-slate-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-orange-100/60 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-[#F26430] flex items-center justify-center text-xs font-black shrink-0 border border-orange-500/20">
                        02
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่</span>
                        <span className="text-[10px] font-black text-[#F26430] bg-[#FFF4EE] px-2 py-0.5 rounded-full border border-orange-200">
                          Community
                        </span>
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
                      เปิดตี้วิ่ง บอร์ดเกม คาเฟ่ฮอปปิ้ง เวิร์กช็อปศิลปะ และคอมมูนิตี้สายชิลล์
                    </p>
                  </div>

                  <Link
                    href="/community"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F26430] text-[#F26430] hover:text-white border border-orange-200/80 hover:border-[#F26430] rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
                  >
                    <span>สำรวจกิจกรรมชุมชนทั้งหมด ({filteredEvents.filter(e => e.eventType !== 'public_venue').length})</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Community Events Grid (Top 10 items - 2 rows of 5 on desktop) */}
                <EventGrid
                  events={filteredEvents.filter(e => e.eventType !== 'public_venue').slice(0, 10)}
                  onSelectEvent={() => {}}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  joinedEventIds={joinedEventIds}
                  onResetFilters={handleResetAllFilters}
                />
              </section>

              {/* ------------------------------------------------------------------------- */}
              {/* STREAM SECTION 3: 🏛️ EXHIBITIONS & FAIRS (งานมหกรรม นิทรรศการ & งานแฟร์)  */}
              {/* ------------------------------------------------------------------------- */}
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-blue-50/50 via-slate-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-blue-100/60 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#2B527A] flex items-center justify-center text-xs font-black shrink-0 border border-blue-500/20">
                        03
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>งานมหกรรม นิทรรศการ & เอ็กซ์โป</span>
                        <span className="text-[10px] font-black text-[#2B527A] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Major Fairs
                        </span>
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
                      รวมงานใหญ่ระดับประเทศ ณ ศูนย์การประชุมแห่งชาติสิริกิติ์, BITEC, IMPACT, เมืองทองธานี
                    </p>
                  </div>

                  <Link
                    href="/fairs"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#2B527A] text-[#2B527A] hover:text-white border border-blue-200/80 hover:border-[#2B527A] rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
                  >
                    <span>ดูงานแฟร์ทั้งหมด ({filteredEvents.filter(e => e.eventType === 'public_venue').length})</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Public Venue Events Grid (Top 10 items - 2 rows of 5 on desktop) */}
                <EventGrid
                  events={filteredEvents.filter(e => e.eventType === 'public_venue').slice(0, 10)}
                  onSelectEvent={() => {}}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  joinedEventIds={joinedEventIds}
                  onResetFilters={handleResetAllFilters}
                />
              </section>

            </div>
          ) : (
            /* ========================================================================= */
            /* OPTION B: CLASSIC 3-TAB MODE SWITCHER (for Comparison)                    */
            /* ========================================================================= */
            <section id="catalog-section" className="space-y-3 pt-1">
              
              {/* Mode Header */}
              <div className="flex items-center justify-between px-0.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>เลือกหมวดหมู่ที่สนใจ</span>
                </h2>
              </div>

              {/* Modern Segmented Control */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60">
                
                {/* Tab 1: สถานที่เที่ยว */}
                <button
                  type="button"
                  onClick={() => handleSelectEventTypeTab('spots')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 ${
                    eventTypeTab === 'spots'
                      ? 'bg-white text-[#4A7C59] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>สถานที่เที่ยว</span>
                </button>

                {/* Tab 2: กิจกรรมคอมมูนิตี้ */}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectEventTypeTab('community');
                    setSelectedVenueFilter(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 ${
                    eventTypeTab === 'community'
                      ? 'bg-white text-[#4A7C59] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>กิจกรรมคอมมูนิตี้</span>
                </button>

                {/* Tab 3: อีเวนต์ & งานแฟร์ */}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectEventTypeTab('public_venue');
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 ${
                    eventTypeTab === 'public_venue'
                      ? 'bg-white text-[#4A7C59] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">อีเวนต์ & งานแฟร์</span>
                </button>

              </div>

              {/* ========================================================================= */}
              {/* VIEW A: LIFESTYLE SPOTS (พิกัดเที่ยว & จุดฮีลใจ ทั่วประเทศ)                 */}
              {/* ========================================================================= */}
              {eventTypeTab === 'spots' ? (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Dedicated Spot Control & Filter Bar */}
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                    
                    {/* Left: Dual Dropdowns (Category + Province) */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-1 min-w-0">
                      
                      {/* 1. Category Dropdown */}
                      <div className="relative flex items-center flex-1 min-w-[170px] max-w-xs">
                        <select
                          value={selectedSpotCategory}
                          onChange={(e) => setSelectedSpotCategory(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] cursor-pointer appearance-none transition-colors truncate"
                        >
                          {SPOT_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                      </div>

                      {/* 2. Province Dropdown */}
                      <div className="relative flex items-center flex-1 min-w-[130px] max-w-[180px]">
                        <select
                          value={selectedSpotProvince}
                          onChange={(e) => setSelectedSpotProvince(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4A7C59] cursor-pointer appearance-none transition-colors truncate"
                        >
                          <option value="all">ทุกจังหวัด</option>
                          {ALL_THAI_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                      </div>

                      {/* 3. Quick Free Spot Toggle */}
                      <button
                        type="button"
                        onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer border ${
                          priceFilter === 'free'
                            ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        เข้าฟรี
                      </button>

                    </div>

                    {/* Right Controls: Favorites */}
                    <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100">
                      
                      {/* Favorites Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (sortBy === 'favorites') {
                            setSortBy('newest');
                          } else {
                            setSortBy('favorites');
                            setSortByNearMe(false);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 border ${
                          sortBy === 'favorites'
                            ? 'bg-gradient-to-r from-orange-500 to-[#F26430] text-white border-[#F26430] shadow-sm ring-2 ring-orange-500/20'
                            : 'bg-white hover:bg-orange-50/80 text-[#1E293B] hover:text-[#F26430] border-[#E8E2D8] hover:border-orange-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${sortBy === 'favorites' ? 'fill-white text-white' : 'text-slate-400'}`} />
                        <span>บันทึกไว้ ({favoriteSpots.length})</span>
                      </button>

                      {/* 🎯 Near Me Button */}
                      <div className="relative group/tip shrink-0">
                        <button
                          type="button"
                          onClick={handleToggleNearMe}
                          disabled={isLocating}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 border ${
                            sortByNearMe
                              ? 'bg-gradient-to-r from-orange-500 to-[#F26430] text-white border-[#F26430] shadow-sm ring-2 ring-orange-500/20'
                              : 'bg-white hover:bg-orange-50/80 text-[#1E293B] hover:text-[#F26430] border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          {isLocating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F26430]" />
                          ) : (
                            <LocateFixed className={`w-3.5 h-3.5 ${sortByNearMe ? 'text-white animate-pulse' : 'text-[#F26430]'}`} />
                          )}
                          <span>{isLocating ? 'กำลังหาพิกัด...' : sortByNearMe ? 'ใกล้ฉัน (เปิดอยู่)' : 'ใกล้ฉัน'}</span>
                        </button>
                      </div>

                      {/* ⚙️ Advance Filter Drawer Button */}
                      <button
                        type="button"
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 border bg-white hover:bg-slate-50 text-[#1E293B] border-slate-200 hover:border-slate-300"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>ตัวกรอง</span>
                      </button>

                    </div>

                  </div>

                  {/* Spot Results Summary Notice */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                    <span className="flex items-center gap-1.5">
                      <span>พบทั้งหมด <strong className="text-slate-900 font-bold">{filteredSpots.length}</strong> แห่ง</span>
                      {selectedSpotProvince !== 'all' && (
                        <span className="text-slate-400">• จังหวัด: {selectedSpotProvince}</span>
                      )}
                    </span>
                    {(selectedSpotCategory !== 'all' || selectedSpotProvince !== 'all' || searchQuery.trim() !== '' || sortBy === 'favorites') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSpotCategory('all');
                          setSelectedSpotProvince('all');
                          setSearchQuery('');
                          setSortBy('newest');
                          showToast('ล้างตัวกรองสถานที่แล้ว');
                        }}
                        className="text-slate-500 hover:text-[#4A7C59] hover:underline cursor-pointer"
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>

                  {/* Spot Cards Grid */}
                  {filteredSpots.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                        {displayedSpots.map((spot) => (
                          <SpotCard
                            key={spot.id}
                            spot={spot}
                            isFavorite={favoriteSpots.includes(spot.id)}
                            onToggleFavorite={(id) => {
                              if (!isLoggedIn) {
                                triggerMembershipPrompt('เพื่อบันทึกสถานที่โปรด');
                                return;
                              }
                              toggleFavoriteSpot(id);
                            }}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      <Pagination
                        currentPage={currentSpotPage}
                        totalPages={totalSpotPages}
                        onPageChange={handleSpotPageChange}
                        totalItems={filteredSpots.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        itemUnit="สถานที่"
                      />
                    </>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center space-y-3 border border-slate-200 shadow-xs">
                      <div className="text-4xl">📍</div>
                      <h4 className="text-base font-black text-slate-800">ไม่พบสถานที่ตามเงื่อนไขที่เลือก</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">ลองเปลี่ยนหมวดหมู่ หรือสลับไปดูจังหวัดอื่นๆ ทั่วไทยได้เลยครับ</p>
                    </div>
                  )}

                </div>
              ) : (
                /* ========================================================================= */
                /* VIEW B: EVENTS & COMMUNITY MEETUPS (อีเวนต์ & กิจกรรมคอมมูนิตี้)              */
                /* ========================================================================= */
                <div className="space-y-4">
                  
                  {/* Event Grid */}
                  <EventGrid
                    events={displayedEvents}
                    onSelectEvent={() => {}}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                    joinedEventIds={joinedEventIds}
                    onResetFilters={handleResetAllFilters}
                    isFavoritesOnly={sortBy === 'favorites'}
                  />

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={filteredEvents.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                  />

                </div>
              )}
            </section>
          )}

          {/* SECTION 4: ⚡ ชาเลนจ์ & ภารกิจท้าทายจากคอมมูนิตี้ (Community Quests) */}
          <CommunityChallengeBar
            onJoinQuest={handleJoinQuestFromHome}
            joinedQuestTitles={joinedQuestTitles}
            onOpenCreateModal={() => {
              if (!isLoggedIn) {
                triggerMembershipPrompt('เพื่อสร้างชาเลนจ์ใหม่ในคอมมูนิตี้');
              } else {
                setIsCreateChallengeModalOpen(true);
              }
            }}
          />

        </div>

      </main>

      {/* Ultra-Clean Modern Editorial Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 mt-16 mb-16 sm:mb-0">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-base font-black text-white">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-[#4A7C59] flex items-center justify-center text-white shadow-sm">
                <Sprout className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span>Chill & Connect Hub</span>
              <span className="text-[10px] font-bold bg-white/10 text-emerald-300 px-2 py-0.5 rounded-full border border-white/10">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium max-w-md">
              Thailand's Curated Discovery & Community Experience Platform
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-400 flex-wrap justify-center">
            <Link href="/spots" className="hover:text-white transition-colors">พิกัดเที่ยว</Link>
            <Link href="/community" className="hover:text-white transition-colors">กิจกรรมชุมชน</Link>
            <Link href="/fairs" className="hover:text-white transition-colors">งานแฟร์</Link>
            <Link href="/challenges" className="hover:text-white transition-colors">ชาเลนจ์</Link>
            <Link href="/about" className="hover:text-white transition-colors">เกี่ยวกับเรา</Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 font-medium">
            <p>© 2026 Chill & Connect Hub. All rights reserved.</p>
            <p className="mt-0.5 text-slate-600">Built for authentic lifestyle discovery in 77 provinces.</p>
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

      {/* Surprise Me! Interactive Random Event Modal */}
      <SurpriseModal
        isOpen={isSurpriseModalOpen}
        onClose={() => setIsSurpriseModalOpen(false)}
        events={eventsList}
        onSelectEvent={(ev) => {
          const targetPath = ev.eventType === 'public_venue'
            ? `/fairs/${encodeURIComponent(ev.id)}`
            : `/community/${encodeURIComponent(ev.id)}`;
          router.push(targetPath);
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
