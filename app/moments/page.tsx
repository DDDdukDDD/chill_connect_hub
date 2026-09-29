'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventDetailModal } from '@/components/EventDetailModal';
import { SpotDetailModal } from '@/components/SpotDetailModal';
import { JoinChallengeModal } from '@/components/JoinChallengeModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import {
  MOCK_EVENTS,
  MOCK_POSTS,
  MOCK_CHALLENGES,
  EventItem,
  CommunityPost,
  ChallengeQuest,
} from '@/data/mockData';
import { MOCK_SPOTS, LifestyleSpotItem } from '@/data/spotsData';
import { BrandLogo } from '@/components/BrandLogo';
import {
  Sparkles,
  Heart,
  Share2,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Flame,
  Camera,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  LogIn,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  MessageCircle,
  Send,
  Calendar,
  Users,
  UserPlus,
  Search,
  Navigation,
  Check,
} from 'lucide-react';
import { MomentsStoriesRail } from '@/components/MomentsStoriesRail';

// Popular Lifestyle Check-In Locations for Facebook-Style Check-In
const POPULAR_CHECKIN_SPOTS = [
  { name: 'สวนป่าเบญจกิติ', location: 'คลองเตย, กรุงเทพฯ', category: 'สวนสาธารณะ' },
  { name: 'ซอยอารีย์', location: 'พญาไท, กรุงเทพฯ', category: 'ย่านไลฟ์สไตล์ & คาเฟ่' },
  { name: 'ถนนทรงวาด - ตลาดน้อย', location: 'สัมพันธวงศ์, กรุงเทพฯ', category: 'ย่านเมืองเก่า' },
  { name: 'สยามสแควร์', location: 'ปทุมวัน, กรุงเทพฯ', category: 'แหล่งแฮงเอาท์' },
  { name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)', location: 'คลองเตย, กรุงเทพฯ', category: 'งานเอ็กซ์โป & นิทรรศการ' },
  { name: 'บางกระเจ้า (คุ้งบางกะเจ้า)', location: 'พระประแดง, สมุทรปราการ', category: 'ธรรมชาติ & ปั่นจักรยาน' },
  { name: 'อ่างแก้ว มหาวิทยาลัยเชียงใหม่', location: 'เมือง, เชียงใหม่', category: 'วิวธรรมชาติ & พระอาทิตย์ตก' },
  { name: 'หาดยะนุ้ย - แหลมพรหมเทพ', location: 'เมือง, ภูเก็ต', category: 'ชายหาด & ชมวิว' },
  { name: 'เขาใหญ่ (อุทยานแห่งชาติเขาใหญ่)', location: 'ปากช่อง, นครราชสีมา', category: 'ภูเขา & แคมป์ปิ้ง' },
  { name: 'เจริญกรุง - ครีเอทีฟ ดิสทริกต์', location: 'บางรัก, กรุงเทพฯ', category: 'ศิลปะ & แกลเลอรี' },
  { name: 'เอ็มสเฟียร์ (EMSPHERE)', location: 'คลองเตย, กรุงเทพฯ', category: 'ห้าง & แฮงเอาท์' },
  { name: 'สวนลุมพินี', location: 'ปทุมวัน, กรุงเทพฯ', category: 'สวนสาธารณะ & วิ่ง' },
];

// Curated active community members for "Suggested for you"
const SUGGESTED_MEMBERS = [
  {
    id: 'user-praew',
    name: 'คุณแพรว',
    handle: '@praew_art',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    vibe: 'สายอาร์ต นิทรรศการ & เอ็กซ์โป',
    badge: 'Art Explorer',
  },
  {
    id: 'user-kee',
    name: 'คุณกี้',
    handle: '@kee_explorer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    vibe: 'สวนป่า จุดฮีลใจ & เดินทาง 77 จว.',
    badge: 'Nature Lover',
  },
  {
    id: 'user-mook',
    name: 'คุณมุก',
    handle: '@mook_slowbar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    vibe: 'Slow Bar & Specialty Coffee',
    badge: 'Coffee Hopper',
  },
  {
    id: 'user-bas',
    name: 'คุณบาส',
    handle: '@bas_runner',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    vibe: 'City Run & Hyrox Bootcamp',
    badge: 'Urban Runner',
  },
  {
    id: 'user-nont',
    name: 'คุณนนท์',
    handle: '@nont_boardgame',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    vibe: 'Board Game & ตี้เพื่อนใหม่',
    badge: 'Game Master',
  },
];

function MomentsContent() {
  const searchParams = useSearchParams();
  const [activeNavTab, setActiveNavTab] = useState('moments');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อแชร์ภาพและแบ่งปันโมเมนต์');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Filter & Search States
  const urlLocation = searchParams.get('location') || '';
  const urlTab = searchParams.get('tab');
  const [locationFilter, setLocationFilter] = useState<string>(urlLocation);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'popular' | 'saved' | 'mine'>(
    urlTab === 'mine' ? 'mine' : urlTab === 'popular' ? 'popular' : 'all'
  );

  // Instagram-Grade Micro-Interactions States
  const [savedPostIds, setSavedPostIds] = useState<string[]>(['1', '3']);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>(['user-praew']);
  const [doubleTapPostId, setDoubleTapPostId] = useState<string | null>(null);
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState<string[]>(['post-spot-1']);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Sync if URL location changes
  useEffect(() => {
    if (urlLocation) {
      setLocationFilter(urlLocation);
    }
  }, [urlLocation]);

  // Posts State
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [uploadedPostImages, setUploadedPostImages] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Dynamic responsive initial count based on screen size (4 mobile, 6 tablet, 8 desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width >= 1024) {
      setVisibleCount(8);
    } else if (width >= 640) {
      setVisibleCount(6);
    } else {
      setVisibleCount(4);
    }
  }, []);

  // Lightbox Modal State for Viewing Fullscreen Images
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    index: number;
    caption?: string;
  } | null>(null);

  // Modal Selection Targets
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<LifestyleSpotItem | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeQuest | null>(null);
  const [eventFavorites, setEventFavorites] = useState<string[]>(['1', '7']);
  const [spotFavorites, setSpotFavorites] = useState<string[]>(['spot-bkk-1', 'spot-cnx-1']);

  // Create Moment Form State
  const [createTargetType, setCreateTargetType] = useState<
    'general' | 'spot' | 'community' | 'fair' | 'challenge'
  >('general');
  const [createTargetId, setCreateTargetId] = useState<string>('');
  const [customLocationInput, setCustomLocationInput] = useState<string>('');
  const [captionInput, setCaptionInput] = useState<string>('');

  // Facebook-Style Check-In States for General tab
  const [isCheckInPopoverOpen, setIsCheckInPopoverOpen] = useState<boolean>(false);
  const [checkInSearchQuery, setCheckInSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // User's booked/favorited community & fair events from MyHub
  const myBookedEvents = useMemo(() => {
    return MOCK_EVENTS.filter(
      (e) =>
        e.id === '1' ||
        e.id === '3' ||
        e.id === '4' ||
        e.id === 'live-agg-1' ||
        eventFavorites.includes(e.id)
    );
  }, [eventFavorites]);

  const myBookedCommunityEvents = useMemo(() => {
    return myBookedEvents.filter((e) => e.eventType === 'community' || e.id.startsWith('comm-'));
  }, [myBookedEvents]);

  const myBookedFairEvents = useMemo(() => {
    return myBookedEvents.filter((e) => e.eventType === 'public_venue' || !e.id.startsWith('comm-'));
  }, [myBookedEvents]);

  // User's saved spots in MyHub
  const mySavedSpots = useMemo(() => {
    const savedIds = new Set(['spot-bkk-1', 'spot-cnx-1', 'spot-bkk-2', ...spotFavorites]);
    return MOCK_SPOTS.filter((s) => savedIds.has(s.id));
  }, [spotFavorites]);

  // User's active quests
  const myQuests = useMemo(() => {
    return MOCK_CHALLENGES.slice(0, 4);
  }, []);

  // Filtered Check-in Places for Facebook-style Check-in
  const filteredCheckInPlaces = useMemo(() => {
    const query = checkInSearchQuery.trim().toLowerCase();
    const spotsAsCheckIn = MOCK_SPOTS.slice(0, 40).map((s) => ({
      name: s.title,
      location: `${s.district}, ${s.province}`,
      category: s.category || 'พิกัดเที่ยว',
    }));
    const all = [...POPULAR_CHECKIN_SPOTS, ...spotsAsCheckIn];

    const seen = new Set<string>();
    const unique = all.filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!query) return unique.slice(0, 8);
    return unique
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [checkInSearchQuery]);

  // Handle HTML5 Geolocation Check-In
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined') return;
    if (!navigator.geolocation) {
      showToast('เบราว์เซอร์ไม่รองรับการระบุพิกัด GPS');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setIsLocating(false);
        setCustomLocationInput('ตำแหน่งปัจจุบันของฉัน (GPS)');
        setIsCheckInPopoverOpen(false);
        showToast('ระบุพิกัดตำแหน่งปัจจุบันเรียบร้อย 📍');
      },
      () => {
        setIsLocating(false);
        setCustomLocationInput('กรุงเทพมหานคร (พิกัดใกล้ฉัน)');
        setIsCheckInPopoverOpen(false);
        showToast('ระบุพิกัดพื้นที่ใกล้เคียงเรียบร้อย 📍');
      },
      { timeout: 5000 }
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Create Moment Modal with Clean Reset
  const handleOpenCreateModal = () => {
    setCreateTargetType('general');
    setCreateTargetId('');
    setCustomLocationInput('');
    setCheckInSearchQuery('');
    setIsCheckInPopoverOpen(false);
    setIsLocating(false);
    setCaptionInput('');
    setUploadedPostImages([]);
    setIsCreateModalOpen(true);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxData) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxData(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxData((prev) => {
          if (!prev) return null;
          const newIdx = prev.index === 0 ? prev.images.length - 1 : prev.index - 1;
          return { ...prev, index: newIdx };
        });
      } else if (e.key === 'ArrowRight') {
        setLightboxData((prev) => {
          if (!prev) return null;
          const newIdx = prev.index === prev.images.length - 1 ? 0 : prev.index + 1;
          return { ...prev, index: newIdx };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxData]);

  // Open Lightbox
  const openLightbox = (images: string[], index: number, caption?: string) => {
    setLightboxData({ images, index, caption });
  };

  // Toggle Like (Cheer)
  const handleToggleLike = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อส่งหัวใจและกำลังใจให้เพื่อนๆ');
      setIsRequireMembershipOpen(true);
      return;
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          const newLikesCount = newIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          if (newIsLiked) showToast('ส่งหัวใจฮีลใจเรียบร้อย! ❤️');
          return { ...post, isLiked: newIsLiked, likesCount: newLikesCount };
        }
        return post;
      })
    );
  };

  // Double-Tap Image to Like (Instagram Style)
  const handleDoubleTapLike = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อส่งหัวใจและกำลังใจให้เพื่อนๆ');
      setIsRequireMembershipOpen(true);
      return;
    }

    // Trigger visual bursting heart animation
    setDoubleTapPostId(postId);
    setTimeout(() => {
      setDoubleTapPostId((prev) => (prev === postId ? null : prev));
    }, 750);

    // Like post if not already liked
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          if (p.isLiked) return p;
          showToast('ส่งหัวใจฮีลใจเรียบร้อย! ❤️');
          return {
            ...p,
            isLiked: true,
            likesCount: p.likesCount + 1,
          };
        }
        return p;
      })
    );
  };

  // Toggle Save / Bookmark to Personal Collection (Instagram Style)
  const handleToggleSave = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกโมเมนต์ลงคอลเลกชันส่วนตัว');
      setIsRequireMembershipOpen(true);
      return;
    }

    setSavedPostIds((prev) => {
      const isSaved = prev.includes(postId);
      if (isSaved) {
        showToast('ยกเลิกการบันทึกโมเมนต์');
        return prev.filter((id) => id !== postId);
      } else {
        showToast('บันทึกโมเมนต์ลงคอลเลกชันส่วนตัวแล้ว 🔖');
        return [...prev, postId];
      }
    });
  };


  // Toggle Comments Drawer
  const handleToggleCommentsDrawer = (postId: string) => {
    setExpandedCommentPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  // Submit Comment
  const handleSubmitComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อร่วมแสดงความคิดเห็นและส่งพลังบวก');
      setIsRequireMembershipOpen(true);
      return;
    }

    const newComment = {
      id: `c-${Date.now()}`,
      userName: 'คุณส้ม (Som_Chill)',
      userAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      text: text,
      content: text,
      timeAgo: 'เมื่อสักครู่นี้',
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const existing = p.comments || [];
          return {
            ...p,
            comments: [...existing, newComment],
            commentsCount: (p.commentsCount || existing.length) + 1,
          };
        }
        return p;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    showToast('ส่งความคิดเห็นเรียบร้อยแล้ว! 💬');
  };

  // Copy Share Link & Increment Share Count (Multi-platform & Mobile Web Share API support)
  const handleShareMoment = async (post: CommunityPost) => {
    // Increment share count
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          return { ...p, sharesCount: (p.sharesCount || 0) + 1 };
        }
        return p;
      })
    );

    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/moments?location=${encodeURIComponent(
        post.targetTitle || post.location || ''
      )}`;

      // 1. If mobile browser supports native Web Share API (iOS Safari / Android)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${post.userName} บน Chill & Connect Hub`,
            text: post.caption?.slice(0, 120) || 'ร่วมชมโมเมนต์ไลฟ์สไตล์บน Chill & Connect Hub',
            url: shareUrl,
          });
          showToast('แชร์โมเมนต์สำเร็จ! 🌟');
          return;
        } catch (err: any) {
          // If user aborted/cancelled the native share sheet, do not error out
          if (err.name === 'AbortError') return;
        }
      }

      // 2. Fallback to Clipboard Copy (Desktop & Web)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            showToast('คัดลอกลิงก์โมเมนต์เรียบร้อยแล้ว! 🔗');
          })
          .catch(() => {
            showToast('แชร์โมเมนต์สำเร็จ! 🌟');
          });
      } else {
        // Fallback for older browsers
        try {
          const tempInput = document.createElement('input');
          tempInput.value = shareUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast('คัดลอกลิงก์โมเมนต์เรียบร้อยแล้ว! 🔗');
        } catch {
          showToast('แชร์โมเมนต์สำเร็จ! 🌟');
        }
      }
    }
  };
 
  // Toggle Connect Member (Suggested for you)
  const handleToggleFollow = (member: (typeof SUGGESTED_MEMBERS)[number]) => {
    if (!isLoggedIn) {
      setMembershipActionTitle(`เพื่อ Connect กับ ${member.name} และรับการแจ้งเตือนโมเมนต์ใหม่`);
      setIsRequireMembershipOpen(true);
      return;
    }

    setFollowedUserIds((prev) => {
      const isFollowing = prev.includes(member.id);
      if (isFollowing) {
        showToast(`ยกเลิก Connect กับ ${member.name} เรียบร้อย`);
        return prev.filter((id) => id !== member.id);
      } else {
        showToast(`Connect กับ ${member.name} สำเร็จ! ✨`);
        return [...prev, member.id];
      }
    });
  };

  // Click on Target Tag Link
  const handleOpenTarget = (post: CommunityPost) => {
    const targetType = post.targetType || 'community';
    const targetId = post.targetId || post.eventId;

    if (targetType === 'general') {
      if (post.location && post.location !== 'ไลฟ์สไตล์ทั่วไป') {
        setLocationFilter(post.location);
      }
      return;
    }

    if (targetType === 'spot') {
      const matched =
        MOCK_SPOTS.find(
          (s) => s.id === targetId || s.title === post.targetTitle || s.title === post.location
        ) || MOCK_SPOTS[0];
      setSelectedSpot(matched);
      return;
    }

    if (targetType === 'challenge') {
      const matched =
        MOCK_CHALLENGES.find((c) => c.id === targetId || c.title === post.targetTitle) ||
        MOCK_CHALLENGES[0];
      setSelectedChallenge(matched);
      return;
    }

    // Community or Fair
    const matched =
      MOCK_EVENTS.find(
        (ev) => ev.id === targetId || ev.title === post.targetTitle || ev.id === post.eventId
      ) || MOCK_EVENTS[0];
    setSelectedEvent(matched);
  };

  // Handle Multi-Image Upload (Max 6)
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 6 - uploadedPostImages.length;
    if (remainingSlots <= 0) {
      showToast('สามารถแชร์ได้สูงสุดไม่เกิน 6 รูปต่อโพสต์ครับ');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedPostImages((prev) => {
            if (prev.length >= 6) return prev;
            return [...prev, reader.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedPostImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Post Creation
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captionInput.trim()) return;

    let targetTitle = '';
    let resolvedLocation = '';

    if (createTargetType === 'general') {
      resolvedLocation = customLocationInput.trim() || 'ไลฟ์สไตล์ทั่วไป';
      targetTitle = resolvedLocation;
    } else if (createTargetType === 'spot') {
      if (createTargetId === 'custom' || !createTargetId) {
        resolvedLocation = customLocationInput.trim() || 'พิกัดเที่ยว';
        targetTitle = resolvedLocation;
      } else {
        const spot = MOCK_SPOTS.find((s) => s.id === createTargetId) || mySavedSpots[0];
        targetTitle = spot ? spot.title : (customLocationInput.trim() || 'พิกัดเที่ยว');
        resolvedLocation = targetTitle;
      }
    } else if (createTargetType === 'challenge') {
      const quest = MOCK_CHALLENGES.find((c) => c.id === createTargetId) || myQuests[0] || MOCK_CHALLENGES[0];
      targetTitle = quest ? quest.title : 'ภารกิจไลฟ์สไตล์';
      resolvedLocation = targetTitle;
    } else if (createTargetType === 'fair') {
      if (createTargetId === 'custom' || !createTargetId) {
        resolvedLocation = customLocationInput.trim() || 'งานมหกรรม & เอ็กซ์โป';
        targetTitle = resolvedLocation;
      } else {
        const ev = MOCK_EVENTS.find((item) => item.id === createTargetId) || myBookedFairEvents[0];
        targetTitle = ev ? ev.title : 'งานเอ็กซ์โป';
        resolvedLocation = ev ? ev.location || ev.title : targetTitle;
      }
    } else {
      // Community
      if (createTargetId === 'custom' || !createTargetId) {
        resolvedLocation = customLocationInput.trim() || 'กิจกรรมคอมมูนิตี้';
        targetTitle = resolvedLocation;
      } else {
        const ev = MOCK_EVENTS.find((item) => item.id === createTargetId) || myBookedCommunityEvents[0];
        targetTitle = ev ? ev.title : 'กิจกรรมคอมมูนิตี้';
        resolvedLocation = ev ? ev.location || ev.title : targetTitle;
      }
    }

    const finalImages =
      uploadedPostImages.length > 0
        ? uploadedPostImages
        : [
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
          ];

    const createdPost: CommunityPost = {
      id: `post-${Date.now()}`,
      userName: 'คุณส้ม (Som_Chill)',
      userAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      userBadge:
        createTargetType === 'challenge'
          ? 'Quest Hunter'
          : createTargetType === 'general'
          ? 'Daily Chiller'
          : 'Life Explorer',
      targetType: createTargetType,
      targetId: createTargetId || `custom-${Date.now()}`,
      targetTitle,
      eventId: createTargetId || `custom-${Date.now()}`,
      eventTitle: targetTitle,
      category: 'chill',
      images: finalImages,
      caption: captionInput.trim(),
      location: resolvedLocation,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      timeAgo: 'เมื่อสักครู่นี้',
      isLiked: true,
      comments: [],
    };

    setPosts([createdPost, ...posts]);
    setCaptionInput('');
    setCustomLocationInput('');
    setUploadedPostImages([]);
    setIsCreateModalOpen(false);
    showToast('แชร์โมเมนต์ของคุณเรียบร้อยแล้ว! 🎉');
  };

  // Auto Infinite Scroll with IntersectionObserver
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && visibleCount < posts.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            const step = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 6 : 4;
            setVisibleCount((prev) => Math.min(prev + step, posts.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [visibleCount, posts.length, isLoadingMore]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    // Location/Target filter
    if (locationFilter) {
      const query = locationFilter.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.location.toLowerCase().includes(query) ||
          (p.targetTitle && p.targetTitle.toLowerCase().includes(query)) ||
          (p.eventTitle && p.eventTitle.toLowerCase().includes(query))
      );
    }

    // Tab filter
    if (activeTabFilter === 'popular') {
      return list.sort((a, b) => b.likesCount - a.likesCount);
    }
    if (activeTabFilter === 'saved') {
      return list.filter((p) => savedPostIds.includes(p.id));
    }
    if (activeTabFilter === 'mine') {
      if (!isLoggedIn) return [];
      return list.filter((p) => p.userName.includes('คุณส้ม'));
    }

    return list;
  }, [posts, locationFilter, activeTabFilter, isLoggedIn]);

  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  // Curated Recommended Events for Sidebar (Meetups & Fairs)
  const recommendedEvents = useMemo(() => {
    const valid = MOCK_EVENTS.filter((e) => e.status !== 'ended');
    const community = valid.filter((e) => e.eventType === 'community' || e.id.startsWith('comm-'));
    const fairs = valid.filter((e) => e.eventType === 'public_venue' || !e.id.startsWith('comm-'));

    const list: EventItem[] = [];
    if (community[0]) list.push(community[0]);
    if (fairs[0]) list.push(fairs[0]);
    if (community[1]) list.push(community[1]);
    if (fairs[1]) list.push(fairs[1]);

    return list.length > 0 ? list : valid.slice(0, 4);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#1E293B] flex flex-col font-sans selection:bg-slate-800 selection:text-white">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            setIsAuthModalOpen(true);
            showToast('กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรมใหม่');
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-2.5 pb-28 sm:pt-4 sm:pb-12 space-y-3 sm:space-y-4">
        
        {/* Hidden SEO/A11y H1 */}
        <h1 className="sr-only">โมเมนต์และบรรยากาศจริงจากชุมชน Chill & Connect Hub</h1>

        {/* 1.5 Moments Stories & Highlights Rail (Instagram-Style Stories & Pulse) */}
        <MomentsStoriesRail
          onAddStory={() => {
            if (!isLoggedIn) {
              setMembershipActionTitle('เพื่อแชร์สตอรี่โมเมนต์ของคุณ');
              setIsRequireMembershipOpen(true);
            } else {
              handleOpenCreateModal();
            }
          }}
          isLoggedIn={isLoggedIn}
          onOpenTargetLocation={(locName) => setLocationFilter(locName)}
        />

        {/* 2. Main Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8-cols): Main Visual Feed */}
          <div className="lg:col-span-8 space-y-4">
            {/* Quick Post Prompt Input Bar & Segmented Tabs Container */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
              {/* Quick Post Prompt Input Bar (Adaptive for Logged in vs Logged out) */}
              <div className="flex items-center gap-3">
                {isLoggedIn ? (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="User avatar"
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setMembershipActionTitle('เพื่อแชร์ภาพและแบ่งปันโมเมนต์กับชาวฮับ');
                      setIsRequireMembershipOpen(true);
                    } else {
                      handleOpenCreateModal();
                    }
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer border border-slate-200"
                >
                  <span>
                    {isLoggedIn
                      ? 'แชร์ภาพโมเมนต์กิจกรรมหรือพิกัดเที่ยวล่าสุดของคุณ...'
                      : 'เข้าสู่ระบบเพื่อร่วมแชร์ภาพโมเมนต์กับเพื่อนๆ...'}
                  </span>
                  {isLoggedIn ? (
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                  ) : (
                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                      เข้าสู่ระบบ
                    </span>
                  )}
                </button>
              </div>

              {/* Clean Segmented Tabs */}
              <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70">
                {[
                  { id: 'all', label: 'ฟีดทั้งหมด' },
                  { id: 'popular', label: 'ยอดนิยม' },
                  { id: 'saved', label: `ที่บันทึกไว้ (${savedPostIds.length})` },
                  { id: 'mine', label: 'โมเมนต์ของฉัน' },
                ].map((tab) => {
                  const isActive = activeTabFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTabFilter(tab.id as any)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Location Filter Pill (if any) */}
              {locationFilter && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-800 font-semibold animate-fade-in">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">
                      กำลังกรองโมเมนต์เฉพาะ: <strong>"{locationFilter}"</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationFilter('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    <X className="w-3 h-3" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                </div>
              )}
            </div>

            {/* Contextual Empty State for "ที่บันทึกไว้" (Saved Posts) */}
            {displayedPosts.length === 0 && activeTabFilter === 'saved' && (
              <div className="bg-amber-50/40 rounded-3xl p-8 border border-dashed border-amber-200/90 text-center space-y-3.5 animate-fade-in my-4">
                <div className="w-12 h-12 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs border border-amber-200/60">
                  <Bookmark className="w-6 h-6 fill-amber-500/20" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    ยังไม่มีโมเมนต์ที่คุณบันทึกไว้
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    พบภาพถ่ายบรรยากาศหรือพิกัดที่ถูกใจ? กดปุ่ม <strong>"บันทึก 🔖"</strong> ที่มุมขวาล่างของโพสต์ เพื่อเก็บไว้ในคอลเลกชันส่วนตัวของคุณ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('all')}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  สำรวจโมเมนต์ทั้งหมด
                </button>
              </div>
            )}

            {/* Standard Empty State for other tabs */}
            {displayedPosts.length === 0 && activeTabFilter !== 'saved' && (activeTabFilter !== 'mine' || isLoggedIn) && (
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-dashed border-slate-200 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  {locationFilter
                    ? `ไม่พบโมเมนต์ที่ตรงกับการค้นหา "${locationFilter}"`
                    : activeTabFilter === 'mine'
                    ? 'คุณยังไม่ได้แชร์โมเมนต์เลย ออกไปใช้ชีวิตแล้วมาแบ่งปันรูปสวยๆ กันนะ'
                    : 'ยังไม่มีโมเมนต์ในหมวดนี้'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLocationFilter('');
                    setActiveTabFilter('all');
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  ดูโมเมนต์ทั้งหมด
                </button>
              </div>
            )}

            {/* Guest State for "โมเมนต์ของฉัน" when Logged Out */}
            {activeTabFilter === 'mine' && !isLoggedIn && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3.5 animate-fade-in shadow-xs">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    เข้าสู่ระบบเพื่อดูโมเมนต์ของคุณ
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    บันทึกความทรงจำ รูปภาพบรรยากาศ และเรื่องราวที่คุณเคยร่วมแชร์กับชาวฮับจะแสดงที่นี่
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบทันที</span>
                </button>
              </div>
            )}

            {/* Feed Posts List */}
            <div className="space-y-5">
              {displayedPosts.map((post) => {
                const targetTitle = post.targetTitle || post.eventTitle;
                const images = post.images && post.images.length > 0 ? post.images : ['/event-hyrox.png'];
                const count = images.length;

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    {/* Post Author Bar */}
                    <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={post.userAvatar}
                          alt={post.userName}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 truncate">
                              {post.userName}
                            </h3>

                            {/* Facebook-Style Check-In Tag in Author Line */}
                            {post.targetType === 'general' && post.location && post.location !== 'ไลฟ์สไตล์ทั่วไป' && (
                              <span className="text-xs text-slate-500 font-normal flex items-center gap-1">
                                <span>— อยู่ที่</span>
                                <button
                                  type="button"
                                  onClick={() => setLocationFilter(post.location)}
                                  className="font-bold text-slate-800 hover:text-[#2563EB] hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                  title="คลิกเพื่อกรองโพสต์ในสถานที่นี้"
                                >
                                  <MapPin className="w-3 h-3 text-[#F26430] shrink-0" />
                                  <span className="max-w-[150px] sm:max-w-[220px] truncate">{post.location}</span>
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Sub-text: Destination Tag Link (Interactive POI Pill) for non-general posts */}
                          {post.targetType !== 'general' && targetTitle && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenTarget(post)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer group/poi shadow-2xs active:scale-95"
                                title="คลิกเพื่อดูข้อมูลสถานที่หรือกิจกรรมนี้"
                              >
                                <MapPin className="w-3 h-3 text-[#F26430] group-hover/poi:scale-110 transition-transform" />
                                <span className="truncate max-w-[180px] sm:max-w-[260px] font-bold">
                                  {targetTitle}
                                </span>
                                <span className="text-[10px] text-slate-400 group-hover/poi:text-slate-600 inline-flex items-center gap-0.5">
                                  <span>ดูข้อมูล</span>
                                  <ArrowRight className="w-2.5 h-2.5 group-hover/poi:translate-x-0.5 transition-transform" />
                                </span>
                              </button>
                            </div>
                          )}
                          {post.targetType === 'general' && (!post.location || post.location === 'ไลฟ์สไตล์ทั่วไป') && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold mt-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 text-[10px] font-medium">
                                <span>ไลฟ์สไตล์ทั่วไป</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-slate-400 font-medium shrink-0">
                        {post.timeAgo}
                      </span>
                    </div>

                    {/* Multi-Photo Collage Grid Layout (Facebook-Style Responsive Photo Engine + Double-Tap Like) */}
                    <div
                      className="w-full bg-slate-100 overflow-hidden relative select-none"
                      onDoubleClick={() => handleDoubleTapLike(post.id)}
                    >
                      {/* Instagram Bursting Heart Animation on Double-Tap */}
                      {doubleTapPostId === post.id && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center animate-fade-in">
                          <div className="p-4 rounded-full bg-black/40 backdrop-blur-xs shadow-2xl animate-scale-up">
                            <Heart className="w-16 h-16 sm:w-20 sm:h-20 text-rose-500 fill-rose-500 drop-shadow-[0_4px_24px_rgba(244,63,94,0.95)]" />
                          </div>
                        </div>
                      )}
                      {/* Case 1: Single Image (Flexible dynamic height, ambient backdrop blur, never cropped) */}
                      {count === 1 && (
                        <div
                          className="relative w-full bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[520px] sm:max-h-[580px] overflow-hidden cursor-pointer group"
                          onClick={() => openLightbox(images, 0, post.caption)}
                        >
                          {/* Ambient blurred backdrop for vertical/square photos so borders are never harsh */}
                          <img
                            src={images[0]}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-35 scale-110 pointer-events-none"
                            aria-hidden="true"
                          />
                          <img
                            src={images[0]}
                            alt={post.caption}
                            className="relative z-10 w-auto h-auto max-h-[520px] sm:max-h-[580px] max-w-full object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Case 2: Exactly 2 Images (Side by Side Equal Columns with generous height) */}
                      {count === 2 && (
                        <div className="grid grid-cols-2 gap-1.5 h-[300px] sm:h-[380px] w-full">
                          {images.slice(0, 2).map((img, idx) => (
                            <div
                              key={idx}
                              className="relative h-full w-full overflow-hidden cursor-pointer group"
                              onClick={() => openLightbox(images, idx, post.caption)}
                            >
                              <img
                                src={img}
                                alt={`รูปที่ ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Case 3: Exactly 3 Images (1 Large Left 7-cols + 2 Equal Stacked Right 5-cols) */}
                      {count === 3 && (
                        <div className="grid grid-cols-12 gap-1.5 h-[340px] sm:h-[420px] w-full">
                          {/* Left: 1 Large Image */}
                          <div
                            className="col-span-7 h-full overflow-hidden cursor-pointer group relative"
                            onClick={() => openLightbox(images, 0, post.caption)}
                          >
                            <img
                              src={images[0]}
                              alt="รูปหลัก"
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          </div>
                          {/* Right: 2 Stacked Images (50/50 heights with good visibility) */}
                          <div className="col-span-5 flex flex-col gap-1.5 h-full">
                            {images.slice(1, 3).map((img, idx) => (
                              <div
                                key={idx}
                                className="relative flex-1 min-h-0 w-full overflow-hidden cursor-pointer group"
                                onClick={() => openLightbox(images, idx + 1, post.caption)}
                              >
                                <img
                                  src={img}
                                  alt={`รูปย่อย ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Case 4: 4 or more Images (Facebook Classic 2x2 Grid with +X overlay on 4th cell) */}
                      {count >= 4 && (
                        <div className="grid grid-cols-2 gap-1.5 h-[340px] sm:h-[420px] w-full">
                          {images.slice(0, 4).map((img, idx) => {
                            const isFourth = idx === 3;
                            const moreCount = count - 4;

                            return (
                              <div
                                key={idx}
                                className="relative h-full w-full overflow-hidden cursor-pointer group"
                                onClick={() => openLightbox(images, idx, post.caption)}
                              >
                                <img
                                  src={img}
                                  alt={`รูปที่ ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {/* Facebook-style +X Overlay on 4th image if more than 4 */}
                                {isFourth && moreCount > 0 && (
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-xl sm:text-2xl group-hover:bg-black/75 transition-colors">
                                    +{moreCount + 1}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Body: Action Bar + Caption + Quick Cheers */}
                    <div className="p-4 space-y-3">
                      {/* Action Bar: Heart + Share on left, Bookmark / Save on right (Instagram-Style) */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          {/* Heart / Like Cheer Button (Numbers only, NO text) */}
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              post.isLiked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                            title="ส่งหัวใจ"
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform active:scale-125 ${
                                post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                              }`}
                            />
                            <span>{post.likesCount}</span>
                          </button>

                          {/* Comment Drawer Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCommentsDrawer(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              expandedCommentPostIds.includes(post.id)
                                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                            }`}
                            title="ความคิดเห็น"
                            aria-label="ความคิดเห็น"
                          >
                            <MessageCircle className="w-4 h-4 text-slate-500" />
                            <span>{(post.comments && post.comments.length) || post.commentsCount || 0}</span>
                          </button>

                          {/* Share Button (Icon + Shares Count, NO text word per user request) */}
                          <button
                            type="button"
                            onClick={() => handleShareMoment(post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="แชร์โมเมนต์"
                            aria-label="แชร์โมเมนต์"
                          >
                            <Share2 className="w-4 h-4 text-slate-500" />
                            <span>{post.sharesCount || 0}</span>
                          </button>
                        </div>

                        {/* Right: Instagram-Style Bookmark / Save to Collection Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSave(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            savedPostIds.includes(post.id)
                              ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                          }`}
                          title={savedPostIds.includes(post.id) ? 'บันทึกแล้ว' : 'บันทึกเก็บไว้ดู'}
                        >
                          <Bookmark
                            className={`w-4 h-4 transition-transform active:scale-125 ${
                              savedPostIds.includes(post.id) ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                            }`}
                          />
                          <span className="hidden sm:inline">
                            {savedPostIds.includes(post.id) ? 'บันทึกแล้ว' : 'บันทึก'}
                          </span>
                        </button>
                      </div>

                      {/* Caption Text */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {post.caption}
                      </p>

                      {/* Expandable Inline Comments Section */}
                      {expandedCommentPostIds.includes(post.id) && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-fade-in">
                          {/* Comments List */}
                          {post.comments && post.comments.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                              {post.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex items-start gap-2.5 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100"
                                >
                                  <img
                                    src={comment.userAvatar}
                                    alt={comment.userName}
                                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-slate-800 text-[11px] truncate">
                                        {comment.userName}
                                      </span>
                                      <span className="text-[10px] text-slate-400 shrink-0">
                                        {comment.timeAgo}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                                      {comment.content || comment.text}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 py-1 text-center">
                              ยังไม่มีความคิดเห็น ร่วมเป็นคนแรกที่ส่งพลังบวกกันนะ ✨
                            </p>
                          )}

                          {/* Inline Comment Input Box */}
                          <form
                            onSubmit={(e) => handleSubmitComment(post.id, e)}
                            className="flex items-center gap-2 pt-1"
                          >
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              placeholder={
                                isLoggedIn
                                  ? 'เขียนความคิดเห็นหรือส่งพลังบวก...'
                                  : 'เข้าสู่ระบบเพื่อแสดงความคิดเห็น...'
                              }
                              className="flex-1 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                            />
                            <button
                              type="submit"
                              disabled={!(commentInputs[post.id] || '').trim()}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Send className="w-3 h-3" />
                              <span>ส่ง</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Auto Infinite Scroll Sentinel Target */}
            {filteredPosts.length > visibleCount ? (
              <div ref={sentinelRef} className="py-6 text-center space-y-2">
                <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-full shadow-2xs text-xs text-slate-700 font-bold">
                  <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>
                    กำลังโหลดโมเมนต์เพิ่มเติม... ({displayedPosts.length}/{filteredPosts.length})
                  </span>
                </div>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="bg-slate-50/80 rounded-2xl p-5 text-center border border-slate-200 space-y-2 my-6">
                <p className="font-bold text-xs text-slate-700">
                  คุณได้อ่านโมเมนต์ล่าสุดครบทั้ง {filteredPosts.length} รายการแล้ว
                </p>
                <p className="text-[11px] text-slate-500">
                  ออกไปใช้ชีวิต เที่ยวคาเฟ่ หรือร่วมกิจกรรม แล้วมาแบ่งปันโมเมนต์ของคุณนะ
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setMembershipActionTitle('เพื่อแชร์ภาพและแบ่งปันโมเมนต์กับชาวฮับ');
                      setIsRequireMembershipOpen(true);
                    } else {
                      handleOpenCreateModal();
                    }
                  }}
                  className="mt-1 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  + สร้างโพสต์โมเมนต์ของคุณ
                </button>
              </div>
            ) : null}
          </div>

          {/* Right Column (4-cols): Sticky Sidebar */}
          <aside className="lg:col-span-4 space-y-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pb-6 shrink-0">
            {/* Widget 1: Suggested for you (แนะนำเพื่อนใหม่) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-none">Suggested for you</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">เพื่อนใหม่ที่มีไลฟ์สไตล์ตรงกัน</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {SUGGESTED_MEMBERS.map((member) => {
                  const isFollowing = followedUserIds.includes(member.id);
                  return (
                    <div key={member.id} className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-100"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">{member.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{member.vibe}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(member)}
                        className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          isFollowing
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                        }`}
                      >
                        {isFollowing ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Widget 2: กิจกรรมแนะนำ (Recommended Activities) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#F26430] flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-none">กิจกรรมแนะนำ</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">เปิดรับสมัคร & น่าสนใจ</p>
                  </div>
                </div>
                <Link
                  href="/community"
                  className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 transition-colors group"
                >
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="space-y-2 pt-1">
                {recommendedEvents.map((ev) => {
                  const isCommunity = ev.eventType === 'community' || ev.id.startsWith('comm-');
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/80 cursor-pointer"
                    >
                      <div className="relative w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src={ev.image}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              isCommunity
                                ? 'bg-[#FFF4EE] text-[#D04A1B]'
                                : 'bg-[#EEF4FA] text-[#1F3D5C]'
                            }`}
                          >
                            {isCommunity ? 'กิจกรรมชุมชน' : 'งานเอ็กซ์โป'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            {ev.date}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB] truncate transition-colors">
                          {ev.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                          <span className="truncate max-w-[110px]">{ev.location}</span>
                          {isCommunity ? (
                            <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                              {ev.participantsCount}/{ev.maxParticipants} คน
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                              Walk-in
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 space-y-2 mt-12 mb-16 md:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
          <BrandLogo size="xs" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">
          Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ
        </p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Mobile Floating Nav Bar */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={eventFavorites.length + spotFavorites.length}
      />

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {lightboxData && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 animate-fade-in"
          onClick={() => setLightboxData(null)}
        >
          {/* Top Bar: Counter & Close */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white text-xs font-bold pt-2 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs">
              รูปที่ {lightboxData.index + 1} จาก {lightboxData.images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxData(null)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="ปิด (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Image Container with Navigation Chevrons */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxData.images[lightboxData.index]}
              alt={`ภาพขยาย ${lightboxData.index + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl animate-scale-up"
            />

            {/* Left Chevron */}
            {lightboxData.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxData((prev) => {
                    if (!prev) return null;
                    const newIdx = prev.index === 0 ? prev.images.length - 1 : prev.index - 1;
                    return { ...prev, index: newIdx };
                  })
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                title="รูปก่อนหน้า (ลูกศรซ้าย)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right Chevron */}
            {lightboxData.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxData((prev) => {
                    if (!prev) return null;
                    const newIdx = prev.index === prev.images.length - 1 ? 0 : prev.index + 1;
                    return { ...prev, index: newIdx };
                  })
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                title="รูปถัดไป (ลูกศรขวา)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Caption & Thumbnails */}
          <div
            className="w-full max-w-5xl text-center space-y-2 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxData.caption && (
              <p className="text-white/80 text-xs sm:text-sm line-clamp-2 max-w-xl mx-auto font-normal">
                {lightboxData.caption}
              </p>
            )}

            {/* Thumbnails row */}
            {lightboxData.images.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                {lightboxData.images.map((thumb, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setLightboxData((prev) => prev ? { ...prev, index: tIdx } : null)}
                    className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      lightboxData.index === tIdx ? 'border-white scale-105' : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={thumb} alt={`Thumbnail ${tIdx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Spot Detail Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        isOpen={Boolean(selectedSpot)}
        onClose={() => setSelectedSpot(null)}
        isFavorite={selectedSpot ? spotFavorites.includes(selectedSpot.id) : false}
        onToggleFavorite={(id) => {
          setSpotFavorites((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          );
        }}
        isLoggedIn={isLoggedIn}
        onRequireLogin={() => setIsAuthModalOpen(true)}
      />

      {/* Modal 2: Event Detail Modal (Community & Fairs) */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? eventFavorites.includes(selectedEvent.id) : false}
        onToggleFavorite={(id) => {
          setEventFavorites((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          );
        }}
        onJoinSuccess={() => showToast('เข้าร่วมกิจกรรมสำเร็จ!')}
      />

      {/* Modal 3: Join Challenge Modal */}
      <JoinChallengeModal
        isOpen={Boolean(selectedChallenge)}
        onClose={() => setSelectedChallenge(null)}
        quest={selectedChallenge}
        onConfirmJoin={() => {
          showToast('รับภารกิจชาเลนจ์เรียบร้อยแล้ว! ⚡');
          setSelectedChallenge(null);
        }}
      />

      {/* Modal 4: Create Moment Modal (Multi-Photo up to 6 images - Luxury Global Standard) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-xl sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 sm:p-7 space-y-5 shadow-2xl relative animate-scale-up border border-slate-200/90"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Clean Typography (NO icons on top per user request) */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                  แชร์โมเมนต์ความประทับใจ
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  แบ่งปันภาพถ่ายจริงและบรรยากาศดีๆ ให้เพื่อนๆ ในคอมมูนิตี้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                title="ปิด (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 sm:space-y-5">
              {/* Pillar Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>เลือกประเภทการแชร์:</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {createTargetType === 'general'
                      ? 'ไลฟ์สไตล์ทั่วไป'
                      : createTargetType === 'spot'
                      ? 'พิกัดเที่ยวที่คุณเซฟไว้'
                      : createTargetType === 'community'
                      ? 'กิจกรรมที่คุณมีตั๋ว'
                      : createTargetType === 'fair'
                      ? 'งานแฟร์ที่คุณไปมา'
                      : 'ภารกิจชาเลนจ์'}
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                  {[
                    { id: 'general', label: 'ทั่วไป', activeClass: 'bg-white text-slate-900 shadow-2xs font-black border border-slate-200' },
                    { id: 'spot', label: 'พิกัดเที่ยว', activeClass: 'bg-white text-emerald-800 shadow-2xs font-black border border-emerald-200' },
                    { id: 'community', label: 'กิจกรรม', activeClass: 'bg-white text-amber-800 shadow-2xs font-black border border-amber-200' },
                    { id: 'fair', label: 'งานแฟร์', activeClass: 'bg-white text-blue-800 shadow-2xs font-black border border-blue-200' },
                    { id: 'challenge', label: 'ชาเลนจ์', activeClass: 'bg-white text-purple-800 shadow-2xs font-black border border-purple-200' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const newType = p.id as any;
                        setCreateTargetType(newType);
                        if (newType === 'general') {
                          setCreateTargetId('');
                        } else if (newType === 'spot') {
                          setCreateTargetId(mySavedSpots[0]?.id || 'custom');
                        } else if (newType === 'community') {
                          setCreateTargetId(myBookedCommunityEvents[0]?.id || 'custom');
                        } else if (newType === 'fair') {
                          setCreateTargetId(myBookedFairEvents[0]?.id || 'custom');
                        } else if (newType === 'challenge') {
                          setCreateTargetId(myQuests[0]?.id || '');
                        }
                      }}
                      className={`py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center ${
                        createTargetType === p.id
                          ? p.activeClass
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Target Input: Facebook-Style Check-In for General Tab */}
              {createTargetType === 'general' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
                      <span>เช็คอินสถานที่ (Check-in):</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {customLocationInput ? 'เช็คอินแล้ว' : 'ไม่บังคับ (ระบุหรือไม่ก็ได้)'}
                    </span>
                  </label>

                  {customLocationInput ? (
                    /* Checked-In Active Badge (Facebook Style) */
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 transition-all animate-fade-in shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#D04A1B] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-[#F26430]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10.5px] text-amber-700/80 font-medium">กำลังเช็คอินที่:</div>
                          <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {customLocationInput}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCheckInPopoverOpen(true);
                            setCheckInSearchQuery('');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                        >
                          เปลี่ยน
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomLocationInput('');
                            setIsCheckInPopoverOpen(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                          title="ลบการเช็คอิน"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Check-In Trigger Button */
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCheckInPopoverOpen(!isCheckInPopoverOpen)}
                          className="flex-1 bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between transition-all cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <MapPin className="w-4 h-4 text-[#F26430] group-hover:scale-110 transition-transform shrink-0" />
                            <span className="text-slate-500 font-normal">
                              คลิกเพื่อค้นหาสถานที่ หรือเช็คอินพิกัด...
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-lg shrink-0 shadow-2xs">
                            เช็คอิน
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                          className="shrink-0 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="ใช้ตำแหน่งปัจจุบันของคุณ"
                        >
                          <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">ตำแหน่งปัจจุบัน</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Facebook Check-In Search Dropdown / Popover */}
                  {isCheckInPopoverOpen && (
                    <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-lg space-y-2.5 animate-scale-up">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          value={checkInSearchQuery}
                          onChange={(e) => setCheckInSearchQuery(e.target.value)}
                          placeholder="ค้นหาสถานที่ คาเฟ่ ย่านท่องเที่ยว หรือพิมพ์ระบุเอง..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                        />
                        {checkInSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCheckInSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* GPS Action Shortcut */}
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-blue-50/70 text-blue-700 text-xs font-bold transition-colors cursor-pointer text-left"
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Navigation className={`w-3 h-3 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                        </div>
                        <span>ใช้ตำแหน่ง GPS ปัจจุบันของฉัน</span>
                      </button>

                      {/* Suggestions list */}
                      <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1 divide-y divide-slate-100">
                        {/* Custom typed option if user typed something */}
                        {checkInSearchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLocationInput(checkInSearchQuery.trim());
                              setIsCheckInPopoverOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#F26430] flex items-center justify-center shrink-0">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[#2563EB]">
                                เช็คอินที่ "{checkInSearchQuery.trim()}"
                              </div>
                              <div className="text-[10.5px] text-slate-400">ระบุพิกัดนี้</div>
                            </div>
                          </button>
                        )}

                        {/* Filtered suggestions */}
                        {filteredCheckInPlaces.map((place, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCustomLocationInput(place.name + (place.location ? `, ${place.location}` : ''));
                              setIsCheckInPopoverOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800 flex items-center justify-center shrink-0 transition-colors">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[#2563EB]">
                                {place.name}
                              </div>
                              <div className="text-[10.5px] text-slate-400 truncate">
                                {place.location} {place.category ? `• ${place.category}` : ''}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[10.5px] text-slate-400">
                          เลือกสถานที่หรือพิมพ์ชื่อเพื่อเช็คอิน
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCheckInPopoverOpen(false)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          ปิด
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : createTargetType === 'spot' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>เลือกพิกัดเที่ยวที่คุณบันทึกไว้ใน MyHub:</span>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {mySavedSpots.length} พิกัดที่บันทึก
                    </span>
                  </label>
                  <select
                    value={createTargetId}
                    onChange={(e) => setCreateTargetId(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all cursor-pointer truncate"
                  >
                    {mySavedSpots.length === 0 ? (
                      <option value="" disabled>
                        ยังไม่มีพิกัดที่บันทึกไว้ใน MyHub
                      </option>
                    ) : (
                      mySavedSpots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.district}, {s.province}) [บันทึกไว้]
                        </option>
                      ))
                    )}
                    <option value="custom">+ พิมพ์ระบุพิกัดอื่นด้วยตนเอง</option>
                  </select>
                  {createTargetId === 'custom' && (
                    <input
                      type="text"
                      value={customLocationInput}
                      onChange={(e) => setCustomLocationInput(e.target.value)}
                      placeholder="พิมพ์ชื่อพิกัดหรือสถานที่ท่องเที่ยวที่ไปมา..."
                      className="mt-2 w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                  )}
                </div>
              ) : createTargetType === 'community' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>เลือกกิจกรรมที่คุณลงทะเบียน / มีตั๋ว:</span>
                    <span className="text-[11px] font-semibold text-amber-600">
                      {myBookedCommunityEvents.length} กิจกรรมที่มีตั๋ว
                    </span>
                  </label>
                  <select
                    value={createTargetId}
                    onChange={(e) => setCreateTargetId(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all cursor-pointer truncate"
                  >
                    {myBookedCommunityEvents.length === 0 ? (
                      <option value="" disabled>
                        ยังไม่มีกิจกรรมที่คุณมีตั๋วใน MyHub
                      </option>
                    ) : (
                      myBookedCommunityEvents.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.location}) [มีตั๋วแล้ว]
                        </option>
                      ))
                    )}
                    <option value="custom">+ พิมพ์ระบุกิจกรรมอื่นด้วยตนเอง</option>
                  </select>
                  {createTargetId === 'custom' && (
                    <input
                      type="text"
                      value={customLocationInput}
                      onChange={(e) => setCustomLocationInput(e.target.value)}
                      placeholder="พิมพ์ชื่อกิจกรรมคอมมูนิตี้ที่ไปร่วมมา..."
                      className="mt-2 w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                  )}
                </div>
              ) : createTargetType === 'fair' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>เลือกงานมหกรรม / เอ็กซ์โปที่คุณไปมา:</span>
                    <span className="text-[11px] font-semibold text-blue-600">
                      {myBookedFairEvents.length} งานที่บันทึก
                    </span>
                  </label>
                  <select
                    value={createTargetId}
                    onChange={(e) => setCreateTargetId(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all cursor-pointer truncate"
                  >
                    {myBookedFairEvents.length === 0 ? (
                      <option value="" disabled>
                        ยังไม่มีงานแฟร์ที่คุณบันทึกไว้ใน MyHub
                      </option>
                    ) : (
                      myBookedFairEvents.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title} ({f.location}) [งานที่ไปมา]
                        </option>
                      ))
                    )}
                    <option value="custom">+ พิมพ์ชื่องานแฟร์อื่นด้วยตนเอง</option>
                  </select>
                  {createTargetId === 'custom' && (
                    <input
                      type="text"
                      value={customLocationInput}
                      onChange={(e) => setCustomLocationInput(e.target.value)}
                      placeholder="พิมพ์ชื่องานมหกรรม เช่น Book Expo, QSNCC..."
                      className="mt-2 w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>เลือกภารกิจชาเลนจ์ที่คุณทำสำเร็จ:</span>
                    <span className="text-[11px] font-semibold text-purple-600">
                      {myQuests.length} ภารกิจที่ทำ
                    </span>
                  </label>
                  <select
                    value={createTargetId}
                    onChange={(e) => setCreateTargetId(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all cursor-pointer truncate"
                  >
                    {myQuests.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} [ภารกิจที่ทำ]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Caption Text Area + Quick Mood Tags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <label>ความรู้สึก & บรรยากาศประทับใจ:</label>
                  <span className="text-[11px] font-medium text-slate-400">
                    {captionInput.length}/500 ตัวอักษร
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={captionInput}
                  maxLength={500}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="เล่าความประทับใจ กลิ่นกาแฟ ผู้คน บรรยากาศรอบตัว หรือมุมถ่ายรูปที่ไม่อยากให้เพื่อนๆ พลาด..."
                  className="w-full bg-slate-50/80 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none leading-relaxed placeholder:text-slate-400"
                  required
                />

                {/* Quick Vibe Chips to append to caption (# Format, No Emojis) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    แท็กอารมณ์:
                  </span>
                  {[
                    '#กาแฟดริปดีมาก',
                    '#ธรรมชาติฮีลใจ',
                    '#มุมถ่ายรูปปัง',
                    '#สดชื่นได้เหงื่อ',
                    '#บรรยากาศสงบ',
                    '#มู้ดดีฮีลใจ',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setCaptionInput((prev) => (prev ? `${prev} ${tag}` : tag))
                      }
                      className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-full border border-slate-200 transition-all cursor-pointer active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Photo Upload Section (Up to 6 images) */}
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>รูปภาพโมเมนต์บรรยากาศ ({uploadedPostImages.length}/6 รูป)</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    อัปโหลดได้สูงสุด 6 รูป
                  </span>
                </div>

                {/* Uploaded Thumbnails Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {uploadedPostImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 group shadow-2xs"
                    >
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9.5px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                          ภาพหน้าปก
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition-colors cursor-pointer shadow-md"
                        title="ลบรูปนี้"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add More Photos Slot (if < 6) */}
                  {uploadedPostImages.length < 6 && (
                    <label
                      className={`${
                        uploadedPostImages.length === 0
                          ? 'col-span-2 sm:col-span-3 py-6 px-4'
                          : 'aspect-[4/3]'
                      } rounded-2xl bg-slate-50 hover:bg-slate-100/80 border-2 border-dashed border-slate-300 hover:border-slate-500 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 group`}
                    >
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:scale-105 shadow-2xs border border-slate-200 transition-all">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {uploadedPostImages.length === 0
                            ? 'คลิกเพื่อเพิ่มรูปภาพ หรือลากไฟล์มาวาง'
                            : '+ เพิ่มรูปภาพ'}
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          {uploadedPostImages.length === 0
                            ? `รองรับ JPG, PNG, WEBP (เหลืออีก 6 รูป)`
                            : `เหลืออีก ${6 - uploadedPostImages.length} รูป`}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFilesChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Action Buttons: Signature Royal Blue Main CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  {uploadedPostImages.length === 0
                    ? 'ใส่รูปภาพอย่างน้อย 1 รูป เพื่อให้เพื่อนๆ เห็นบรรยากาศ'
                    : 'พร้อมแชร์ลงฟีดคอมมูนิตี้แล้ว'}
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={!captionInput.trim()}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:pointer-events-none text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                  >
                    โพสต์โมเมนต์เลย
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย! 🎉`);
        }}
      />

      {/* Free Membership Required Modal */}
      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipActionTitle}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userName) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${userName}! เข้าสู่ระบบเรียบร้อย 🎉`);
        }}
      />

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว (Guest View)');
        }}
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

export default function MomentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MomentsContent />
    </Suspense>
  );
}
