'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { MoodFilterChips, SUB_CATEGORIES_MAP } from '@/components/MoodFilterChips';
import { SurpriseModal } from '@/components/SurpriseModal';
import { EventGrid } from '@/components/EventGrid';
import { EventDetailModal } from '@/components/EventDetailModal';
import { MobileNav } from '@/components/MobileNav';
import { MOCK_EVENTS, MOCK_POSTS, EventItem, calculateDistanceKm, BANGKOK_ZONES } from '@/data/mockData';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { FilterDrawer } from '@/components/FilterDrawer';
import { StoryBar } from '@/components/StoryBar';
import { TrendingCarousel } from '@/components/TrendingCarousel';
import { ReviewCarousel } from '@/components/ReviewCarousel';
import { CommunityChallengeBar } from '@/components/CommunityChallengeBar';
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { Pagination } from '@/components/Pagination';
import { MOCK_SPOTS, SPOT_CATEGORIES, ALL_THAI_PROVINCES, LifestyleSpotItem } from '@/data/spotsData';
import { SpotCard } from '@/components/SpotCard';
import { SpotDetailModal } from '@/components/SpotDetailModal';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp, isEventEndedByDate } from '@/lib/dateUtils';
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSpotPage, setCurrentSpotPage] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] = useState<boolean>(false);
  const [joinedQuestTitles, setJoinedQuestTitles] = useState<string[]>(['Cafe Hunter 5', 'Step Count 30Days']);
  const [hideEndedEvents, setHideEndedEvents] = useState<boolean>(true);

  const toggleFavoriteSpot = (spotId: string) => {
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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isLoggedIn');
      if (saved === 'true') {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    setIsLoggedIn(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (eventId: string) => {
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
        matchesPrice = priceStr === 'ฟรี!' || priceStr === 'ฟรี';
      } else if (priceFilter === 'under500') {
        matchesPrice = priceStr === 'ฟรี!' || priceStr === 'ฟรี' || priceStr.includes('150') || priceStr.includes('200') || priceStr.includes('350');
      }

      let matchesZone = true;
      if (selectedZone) {
        matchesZone = event.zone === selectedZone;
      }

      // Hide Ended Events filter
      let matchesEnded = true;
      if (hideEndedEvents) {
        matchesEnded = !isEventEnded(event);
      }

      return matchesCategory && matchesVenue && matchesEventType && matchesTime && matchesSubCategory && matchesSearch && matchesPrice && matchesZone && matchesEnded;
    });

    // Calculate distance for all events if userLocation is available
    result = result.map((ev) => {
      if (userLocation && ev.latitude && ev.longitude) {
        return {
          ...ev,
          distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude),
        };
      }
      return ev;
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
    hideEndedEvents,
  ]);

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

      // 4. Search Query Filter
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
      if (userLocation && spot.latitude && spot.longitude) {
        return {
          ...spot,
          distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, spot.latitude, spot.longitude),
        };
      }
      return spot;
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
  }, [selectedSpotCategory, selectedSpotProvince, sortBy, sortByNearMe, userLocation, favoriteSpots, searchQuery]);

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
    setSelectedSpotCategory('all');
    setSelectedSpotProvince('all');
    setCurrentPage(1);
    showToast('ล้างตัวกรองทั้งหมดแล้ว ✨');
  };

  const handleToggleNearMe = () => {
    if (sortByNearMe) {
      setSortByNearMe(false);
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

  const eventListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: eventsList.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.title,
        description: event.description,
        location: {
          "@type": "Place",
          name: event.location,
          address: event.location,
        },
        image: event.image,
        organizer: {
          "@type": "Organization",
          name: event.hostName,
        },
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
      },
    })),
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
          onSearchSubmit={handleSearchSubmit}
          onOpenSurpriseModal={() => setIsSurpriseModalOpen(true)}
        />

        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pt-1 sm:pt-2 pb-6 relative z-10">
          
          {/* 3. Auto-Sliding Trending Events Carousel */}
          <TrendingCarousel
            events={eventsList}
            onSelectEvent={(event) => setSelectedEvent(event)}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />

          {/* 5. 🌿 คลังกิจกรรม & พิกัดเที่ยว (Mobile-First 3-Tab Mode Switcher) */}
          <section id="catalog-section" className="space-y-2 sm:space-y-2.5 pt-1">
            
            {/* Clean & Compact Mode Header matching TrendingCarousel Style */}
            <div className="flex items-center gap-2 px-0.5 min-w-0">
              <div className="p-1 sm:p-1.5 rounded-lg bg-orange-50 text-[#F26430] border border-orange-200/80 shrink-0 shadow-2xs">
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F26430]" />
              </div>
              <h2 className="text-xs sm:text-base font-extrabold text-[#1E293B] flex items-baseline gap-1.5 flex-wrap">
                <span>วันนี้อยากไปไหน ทำอะไรดี?</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-normal">
                  (แตะเลือกกลุ่มกิจกรรมด้านล่างเพื่อเริ่มความสนุกได้เลย)
                </span>
              </h2>
            </div>

            {/* 📱 3-Tab Segmented Mode Switcher (Pure White Floating Segmented Pill - Option B) */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-1.5">
              
              {/* Tab 1: 📍 สถานที่เที่ยว & จุดฮีลใจ (Lifestyle Spots ทั่วประเทศ - Chill) */}
              <div className="relative flex-1 group/tip">
                <button
                  type="button"
                  onClick={() => {
                    setEventTypeTab('spots');
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 ${
                    eventTypeTab === 'spots'
                      ? 'bg-[#F26430] hover:bg-[#D95322] text-white shadow-md shadow-[#F26430]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${eventTypeTab === 'spots' ? 'text-amber-100' : 'text-slate-400'}`} />
                  <span className="inline sm:hidden">สถานที่เที่ยว</span>
                  <span className="hidden sm:inline">สถานที่เที่ยว & จุดฮีลใจ</span>
                </button>
                {/* Instant Floating Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-2.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-relaxed backdrop-blur-md text-center">
                  <strong className="block text-amber-300 font-extrabold mb-0.5">📍 สถานที่เที่ยว & จุดฮีลใจ:</strong>
                  สถานที่ท่องเที่ยว สวนสาธารณะ หอศิลป์ คาเฟ่ และจุดเช็คอินแนะนำทั่วประเทศ
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                </div>
              </div>

              {/* Tab 2: 👥 กิจกรรมคอมมูนิตี้ (Community Meetups & Workshops - Connect) */}
              <div className="relative flex-1 group/tip">
                <button
                  type="button"
                  onClick={() => {
                    setEventTypeTab('community');
                    setSelectedVenueFilter(null);
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 ${
                    eventTypeTab === 'community'
                      ? 'bg-[#4A7C59] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${eventTypeTab === 'community' ? 'text-emerald-200' : 'text-slate-400'}`} />
                  <span className="inline sm:hidden">คอมมูนิตี้</span>
                  <span className="hidden sm:inline">กิจกรรมคอมมูนิตี้</span>
                </button>
                {/* Instant Floating Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-2.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-relaxed backdrop-blur-md text-center">
                  <strong className="block text-emerald-300 font-extrabold mb-0.5">🌿 กิจกรรมคอมมูนิตี้:</strong>
                  กิจกรรมนัดพบกลุ่มย่อยจากเพื่อนๆ และโฮสต์บนแพลตฟอร์ม ชวนทำกิจกรรมสนุกๆ ไปด้วยกัน
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                </div>
              </div>

              {/* Tab 3: 🏛️ อีเวนต์ & งานแฟร์ (Major Exhibitions & Public Venue Events) */}
              <div className="relative flex-1 group/tip">
                <button
                  type="button"
                  onClick={() => {
                    setEventTypeTab('public_venue');
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-98 ${
                    eventTypeTab === 'public_venue'
                      ? 'bg-[#2B527A] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${eventTypeTab === 'public_venue' ? 'text-sky-300' : 'text-slate-400'}`} />
                  <span className="truncate">อีเวนต์ & งานแฟร์</span>
                </button>
                {/* Instant Floating Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-60 p-2.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-relaxed backdrop-blur-md text-center">
                  <strong className="block text-sky-300 font-extrabold mb-0.5">🏛️ อีเวนต์ & งานแฟร์:</strong>
                  งานคอนเสิร์ต มหกรรม นิทรรศการ หรือแมตช์กีฬาจัดโดยผู้จัดทางการ
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* VIEW A: LIFESTYLE SPOTS (พิกัดเที่ยว & จุดฮีลใจ ทั่วประเทศ)                 */}
            {/* ========================================================================= */}
            {eventTypeTab === 'spots' ? (
              <div className="space-y-4 animate-fade-in">
                
                {/* Dedicated Spot Control & Filter Bar (Compact Dual-Dropdown + Actions) */}
                <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                  
                  {/* Left: Dual Dropdowns (Category + Province) */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-1 min-w-0">
                    
                    {/* 1. Category Dropdown */}
                    <div className="relative flex items-center flex-1 min-w-[170px] max-w-xs">
                      <Compass className="w-3.5 h-3.5 text-[#F26430] absolute left-3 pointer-events-none" />
                      <select
                        value={selectedSpotCategory}
                        onChange={(e) => setSelectedSpotCategory(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F26430] cursor-pointer shadow-2xs appearance-none transition-colors truncate"
                      >
                        {SPOT_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                    </div>

                    {/* 2. Province Dropdown (Clean 77 Thai Provinces) */}
                    <div className="relative flex items-center flex-1 min-w-[130px] max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-[#F26430] absolute left-3 pointer-events-none" />
                      <select
                        value={selectedSpotProvince}
                        onChange={(e) => setSelectedSpotProvince(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F26430] cursor-pointer shadow-2xs appearance-none transition-colors truncate"
                      >
                        <option value="all">ทั่วประเทศ</option>
                        {ALL_THAI_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                    </div>

                  </div>

                  {/* Right Controls: Favorites + Near Me (GPS) + Filter Drawer */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100">
                    
                    {/* 💖 Favorites Button */}
                    <div className="relative group/tip shrink-0">
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
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 border ${
                          sortBy === 'favorites'
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                            : 'bg-white hover:bg-rose-50/80 text-[#1E293B] hover:text-rose-600 border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${sortBy === 'favorites' ? 'fill-white text-white' : 'fill-rose-500/20 text-rose-500'}`} />
                        <span>ที่บันทึกไว้ ({favoriteSpots.length})</span>
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                        💖 ดูสถานที่ที่คุณกดหัวใจหรือบันทึกไว้
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>

                    {/* 🎯 Near Me (Location Search) Button with LocateFixed Icon */}
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
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                        📍 ค้นหาและเรียงลำดับสถานที่ตามระยะทางจากพิกัดของคุณ
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>

                    {/* ⚙️ Advance Filter Drawer Button */}
                    <button
                      type="button"
                      onClick={() => setIsFilterDrawerOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 border ${
                        (selectedSpotCategory !== 'all' || selectedSpotProvince !== 'all' || priceFilter !== 'all')
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-[#1E293B] border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>ตัวกรอง</span>
                      {(selectedSpotCategory !== 'all' || selectedSpotProvince !== 'all' || priceFilter !== 'all') && (
                        <span className="w-2 h-2 rounded-full bg-[#F26430] animate-pulse" />
                      )}
                    </button>

                  </div>

                </div>

                {/* Spot Results Summary Notice */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                  <span className="flex items-center gap-1.5">
                    <span>📍 พบสถานที่ทั้งหมด <strong className="text-slate-900 font-extrabold">{filteredSpots.length}</strong> แห่ง</span>
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
                        showToast('ล้างตัวกรองสถานที่แล้ว ✨');
                      }}
                      className="text-[#F26430] hover:underline cursor-pointer"
                    >
                      ✕ ล้างตัวกรองสถานที่
                    </button>
                  )}
                </div>

                {/* Spot Cards Grid with 24 items per page pagination */}
                {filteredSpots.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                      {displayedSpots.map((spot) => (
                        <SpotCard
                          key={spot.id}
                          spot={spot}
                          onSelect={(s) => setSelectedSpot(s)}
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

                    {/* Google-Style Pagination Bar for Spots (24 items per page) */}
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
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpotCategory('all');
                        setSelectedSpotProvince('all');
                        setSearchQuery('');
                        setSortBy('newest');
                      }}
                      className="px-4 py-2 bg-[#F26430] hover:bg-[#D95322] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      แสดงสถานที่ทั้งหมด
                    </button>
                  </div>
                )}

              </div>
            ) : (
              /* ========================================================================= */
              /* VIEW B: EVENTS & COMMUNITY MEETUPS (อีเวนต์ & กิจกรรมคอมมูนิตี้)              */
              /* ========================================================================= */
              <div className="space-y-4">
                
                {/* Search/Filter Results Notice (Only when explicitly searching or filtering) */}
                {searchQuery.trim() !== '' || selectedCategory !== null || selectedVenueFilter !== null || selectedZone !== null || sortByNearMe || priceFilter !== 'all' || (timeFilter === 'custom' && startDate) ? (
                  <div className="flex items-center justify-between bg-amber-50 p-2.5 px-4 rounded-xl border border-amber-200/80 text-xs font-semibold text-[#1E293B] animate-fade-in">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span>🔍 ผลการค้นหา: พบทั้งหมด {filteredEvents.length} รายการ {sortByNearMe ? '(📍 เรียงจากใกล้ไปไกล)' : ''} {selectedZone ? `• โซน: ${BANGKOK_ZONES.find(z => z.id === selectedZone)?.label}` : ''}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      className="text-xs text-[#F26430] hover:underline font-bold cursor-pointer"
                    >
                      ✕ ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                ) : null}

                {/* Unified 1-Row Control Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-[#E8E2D8] shadow-xs">
                  
                  {/* Left: Time Filter Tabs + Free Filter + Upcoming Events Checkbox */}
                  <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5">
                    {/* Time Filter Tabs */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[
                        { id: 'all', label: 'ทั้งหมด', desc: 'แสดงกิจกรรมและงานทุกช่วงเวลา' },
                        { id: 'today', label: '🔥 วันนี้', desc: 'เฉพาะกิจกรรมและงานที่จัดขึ้นในวันนี้' },
                        { id: 'tomorrow', label: 'พรุ่งนี้', desc: 'เฉพาะกิจกรรมที่จัดขึ้นในวันพรุ่งนี้' },
                        { id: 'weekend', label: 'เสาร์-อาทิตย์นี้', desc: 'เฉพาะกิจกรรมวันหยุดเสาร์-อาทิตย์นี้' },
                      ].map((tab) => {
                        const isActive = timeFilter === tab.id;
                        return (
                          <div key={tab.id} className="relative group/tip">
                            <button
                              type="button"
                              onClick={() => {
                                setTimeFilter(tab.id as any);
                                setStartDate('');
                                setEndDate('');
                              }}
                              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                                isActive
                                  ? 'bg-[#1E293B] text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {tab.label}
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                              {tab.desc}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                            </div>
                          </div>
                        );
                      })}

                      {/* Custom Date Picker Tab */}
                      {timeFilter === 'custom' && startDate ? (
                        <div className="relative group/tip">
                          <button
                            type="button"
                            onClick={() => {
                              setTimeFilter('all');
                              setStartDate('');
                              setEndDate('');
                            }}
                            className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold bg-[#F26430] text-white shadow-xs flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer animate-fade-in"
                          >
                            <Calendar className="w-3 h-3 text-white" />
                            <span>{startDate}{endDate && endDate !== startDate ? ` - ${endDate}` : ''}</span>
                            <X className="w-3 h-3 ml-0.5" />
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-1.5 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 text-center">
                            คลิกเพื่อล้างวันที่เลือก
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative group/tip">
                          <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(true)}
                            className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer transition-all border border-dashed border-slate-300 hover:border-slate-400"
                          >
                            <Calendar className="w-3 h-3 text-[#4A7C59]" />
                            <span>ระบุวันที่เอง</span>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 text-center">
                            ระบุช่วงวันที่ต้องการค้นหาเอง
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

                    {/* 🆓 Quick Filter: Free Events (ข้อ 2) */}
                    <div className="relative group/tip shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPriceFilter(priceFilter === 'free' ? 'all' : 'free');
                        }}
                        className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer border ${
                          priceFilter === 'free'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
                        }`}
                      >
                        <span>🎉 เข้าร่วมฟรี</span>
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                        🎉 กรองเฉพาะกิจกรรมและงานที่เข้าร่วมได้ฟรี 100%
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>

                    <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

                    {/* Checkbox: Hide Ended Events */}
                    <div className="relative group/tip shrink-0">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer select-none bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200/80 transition-all">
                        <input
                          type="checkbox"
                          checked={hideEndedEvents}
                          onChange={(e) => {
                            setHideEndedEvents(e.target.checked);
                          }}
                          className="w-3.5 h-3.5 accent-[#4A7C59] rounded cursor-pointer"
                        />
                        <span>ซ่อนงานที่จบไปแล้ว</span>
                      </label>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                        🗓️ ซ่อนกิจกรรมและงานที่จัดเสร็จสิ้นไปแล้ว
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>
                  </div>

                  {/* Right: Favorites Quick Tab + Near Me Button + Filter Drawer */}
                  <div className="flex items-center justify-end gap-2 pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    
                    {/* 💖 Prominent Favorites / Saved Events Tab */}
                    <div className="relative group/tip shrink-0">
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
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 border ${
                          sortBy === 'favorites'
                            ? 'bg-gradient-to-r from-rose-500 to-[#F26430] text-white border-[#F26430] shadow-sm ring-2 ring-rose-500/20'
                            : 'bg-white hover:bg-rose-50/80 text-[#1E293B] hover:text-[#F26430] border-[#E8E2D8] hover:border-rose-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${sortBy === 'favorites' ? 'fill-white text-white' : 'fill-rose-500/20 text-rose-500'}`} />
                        <span>ที่บันทึกไว้ ({favorites.length})</span>
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                        💖 ดูกิจกรรมที่คุณกดหัวใจหรือบันทึกไว้
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>

                    {/* 🎯 Near Me Button with Single Modern Radar/GPS Icon */}
                    <div className="relative group/tip shrink-0">
                      <button
                        type="button"
                        onClick={handleToggleNearMe}
                        disabled={isLocating}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 border ${
                          sortByNearMe
                            ? 'bg-gradient-to-r from-orange-500 to-[#F26430] text-white border-[#F26430] shadow-sm ring-2 ring-orange-500/20'
                            : 'bg-white hover:bg-orange-50/80 text-[#1E293B] hover:text-[#F26430] border-[#E8E2D8] hover:border-orange-300'
                        }`}
                      >
                        {isLocating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F26430]" />
                        ) : (
                          <LocateFixed className={`w-3.5 h-3.5 ${sortByNearMe ? 'text-white animate-pulse' : 'text-[#F26430]'}`} />
                        )}
                        <span>{isLocating ? 'กำลังหาพิกัด...' : sortByNearMe ? 'ใกล้ฉัน (เปิดอยู่)' : 'ใกล้ฉัน'}</span>
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                        📍 ค้นหาและเรียงลำดับกิจกรรมตามระยะทางจากพิกัดของคุณ
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>

                    {/* Minimalist Filter Drawer Trigger */}
                    <div className="relative group/tip shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className={`flex items-center gap-1.5 bg-white hover:bg-slate-50 text-[#334155] border px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                          selectedZone || selectedVenueFilter || priceFilter !== 'all' || selectedCategory ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/10 text-[#4A7C59]' : 'border-[#E8E2D8]'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#4A7C59]" />
                        <span>ตัวกรอง {selectedZone ? '(1)' : ''}</span>
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-900/95 text-white text-[10px] font-medium rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 leading-tight text-center">
                        ⚙️ ตัวกรองขั้นสูง: เลือกศูนย์แสดงสินค้า, ทำเลย่าน, และราคา
                        <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Event Grid */}
                <EventGrid
                  events={displayedEvents}
                  onSelectEvent={(event) => setSelectedEvent(event)}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  joinedEventIds={joinedEventIds}
                  onResetFilters={handleResetAllFilters}
                  isFavoritesOnly={sortBy === 'favorites'}
                />

                {/* Google-Style Pagination Bar */}
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

          {/* SECTION 5: 💬 เสียงตอบรับจากเพื่อนๆ (Auto-Slide Carousel) */}
          <ReviewCarousel />

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-12 mb-16 sm:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Event Detail Popup Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? favorites.includes(selectedEvent.id) : false}
        onToggleFavorite={toggleFavorite}
        onJoinSuccess={handleJoinSuccess}
        onLeaveSuccess={handleLeaveSuccess}
        isJoined={selectedEvent ? joinedEventIds.includes(selectedEvent.id) : false}
        isLoggedIn={isLoggedIn}
        onRequireLogin={() => {
          triggerMembershipPrompt('เพื่อจองตั๋ว E-Ticket และเข้าร่วมกิจกรรม');
        }}
      />

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
          setIsLoggedIn(true);
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
        onSelectEvent={(event) => setSelectedEvent(event)}
      />

      {/* Lifestyle Spot Detail Popup Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        isOpen={!!selectedSpot}
        onClose={() => setSelectedSpot(null)}
        isFavorite={selectedSpot ? favoriteSpots.includes(selectedSpot.id) : false}
        onToggleFavorite={(id) => {
          if (!isLoggedIn) {
            triggerMembershipPrompt('เพื่อบันทึกสถานที่โปรด');
            return;
          }
          toggleFavoriteSpot(id);
        }}
        isLoggedIn={isLoggedIn}
        onRequireLogin={() => {
          triggerMembershipPrompt('เพื่อรับภารกิจ ชวนเพื่อนเที่ยว และบันทึกสถานที่');
        }}
        onAcceptQuest={handleJoinQuestFromHome}
        joinedQuestTitles={joinedQuestTitles}
        onCancelQuest={handleCancelQuestFromHome}
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
