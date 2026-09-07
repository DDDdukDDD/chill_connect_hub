'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
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
} from 'lucide-react';

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
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'popular' | 'mine'>(
    urlTab === 'mine' ? 'mine' : urlTab === 'popular' ? 'popular' : 'all'
  );

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
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
  const [spotFavorites, setSpotFavorites] = useState<string[]>([]);

  // Create Moment Form State
  const [createTargetType, setCreateTargetType] = useState<'spot' | 'community' | 'fair' | 'challenge'>('spot');
  const [createTargetId, setCreateTargetId] = useState<string>(MOCK_SPOTS[0]?.id || '');
  const [captionInput, setCaptionInput] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  // Click on Target Tag Link
  const handleOpenTarget = (post: CommunityPost) => {
    const targetType = post.targetType || 'community';
    const targetId = post.targetId || post.eventId;

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

    if (createTargetType === 'spot') {
      const spot = MOCK_SPOTS.find((s) => s.id === createTargetId) || MOCK_SPOTS[0];
      targetTitle = spot.title;
      resolvedLocation = spot.title;
    } else if (createTargetType === 'challenge') {
      const quest = MOCK_CHALLENGES.find((c) => c.id === createTargetId) || MOCK_CHALLENGES[0];
      targetTitle = quest.title;
      resolvedLocation = quest.title;
    } else {
      const ev = MOCK_EVENTS.find((item) => item.id === createTargetId) || MOCK_EVENTS[0];
      targetTitle = ev.title;
      resolvedLocation = ev.title;
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
      userBadge: createTargetType === 'challenge' ? '🏆 Quest Hunter' : '🌿 Life Explorer',
      targetType: createTargetType,
      targetId: createTargetId,
      targetTitle,
      eventId: createTargetId,
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
            setVisibleCount((prev) => Math.min(prev + 4, posts.length));
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
    if (activeTabFilter === 'mine') {
      if (!isLoggedIn) return [];
      return list.filter((p) => p.userName.includes('คุณส้ม'));
    }

    return list;
  }, [posts, locationFilter, activeTabFilter, isLoggedIn]);

  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  // Trending Spots for Sidebar
  const trendingSpots = useMemo(
    () => [
      { title: 'สวนป่าเบญจกิติ', count: '128 โมเมนต์' },
      { title: 'ศูนย์ประชุมแห่งชาติสิริกิติ์ (QSNCC)', count: '94 โมเมนต์' },
      { title: 'ตลาดน้อย - เจริญกรุง', count: '87 โมเมนต์' },
      { title: 'HYROX Studio', count: '65 โมเมนต์' },
      { title: 'อารีย์ สตูดิโอ คราฟต์', count: '52 โมเมนต์' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#1E293B] flex flex-col font-sans selection:bg-[#4A7C59] selection:text-white">
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
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8-cols): Main Visual Feed */}
          <div className="lg:col-span-8 space-y-5">
            {/* Header Title Banner (No icon in front of title per user request) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    โมเมนต์ & บรรยากาศจริงจากชาวฮับ
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    ภาพถ่ายความประทับใจ รอยยิ้ม และความทรงจำจริงจากพิกัดเที่ยว กิจกรรม งานแฟร์ และภารกิจชาเลนจ์
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setMembershipActionTitle('เพื่อแชร์ภาพและแบ่งปันโมเมนต์กับชาวฮับ');
                      setIsRequireMembershipOpen(true);
                    } else {
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#4A7C59] hover:bg-[#3B6347] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>แชร์โมเมนต์ของคุณ</span>
                </button>
              </div>

              {/* Quick Post Prompt Input Bar (Adaptive for Logged in vs Logged out) */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
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
                      setIsCreateModalOpen(true);
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
                    <span className="text-xs font-bold text-[#4A7C59] bg-[#EBF3ED] px-2.5 py-1 rounded-lg">
                      เข้าสู่ระบบ
                    </span>
                  )}
                </button>
              </div>

              {/* Clean Segmented Tabs */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                {[
                  { id: 'all', label: 'ฟีดทั้งหมด' },
                  { id: 'popular', label: 'ยอดนิยม (ส่งใจสูงสุด)' },
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
                          ? 'bg-white text-[#2D5A3C] shadow-xs'
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
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#EBF3ED]/80 border border-[#4A7C59]/20 text-xs text-[#2D5A3C] font-semibold animate-fade-in">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    <span className="truncate">
                      กำลังกรองโมเมนต์เฉพาะ: <strong>"{locationFilter}"</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationFilter('')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                </div>
              )}
            </div>

            {/* Guest State for "โมเมนต์ของฉัน" when Logged Out */}
            {activeTabFilter === 'mine' && !isLoggedIn && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3.5 animate-fade-in shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EBF3ED] text-[#4A7C59] flex items-center justify-center mx-auto border border-[#4A7C59]/20">
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
                  className="px-5 py-2 bg-[#4A7C59] hover:bg-[#3B6347] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบทันที</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {displayedPosts.length === 0 && (activeTabFilter !== 'mine' || isLoggedIn) && (
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
                  className="px-4 py-1.5 bg-[#4A7C59] text-white rounded-full text-xs font-bold hover:bg-[#3B6347] transition-colors cursor-pointer shadow-xs"
                >
                  ดูโมเมนต์ทั้งหมด
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
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Header: User Profile, Destination Link & Time */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={post.userAvatar}
                          alt={post.userName}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {post.userName}
                          </h3>

                          {/* Sub-text: User badge & Destination Tag Link (Clean & Privacy-first) */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                            <span className="truncate">{post.userBadge}</span>
                            {targetTitle && (
                              <>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTarget(post)}
                                  className="text-[#4A7C59] hover:underline font-semibold truncate hover:text-[#2D5A3C] transition-colors cursor-pointer text-left"
                                  title="คลิกเพื่อดูข้อมูลสถานที่หรือกิจกรรมนี้"
                                >
                                  @{targetTitle}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-slate-400 font-medium shrink-0">
                        {post.timeAgo}
                      </span>
                    </div>

                    {/* Multi-Photo Collage Grid Layout (Social Media Style - Exact Match to Reference) */}
                    <div className="w-full bg-slate-100 overflow-hidden">
                      {/* Case 1: Single Image */}
                      {count === 1 && (
                        <div
                          className="relative aspect-[16/9] sm:aspect-[16/10] max-h-[320px] sm:max-h-[340px] w-full overflow-hidden cursor-pointer group"
                          onClick={() => openLightbox(images, 0, post.caption)}
                        >
                          <img
                            src={images[0]}
                            alt={post.caption}
                            className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Case 2: Exactly 2 Images (Side by Side Equal Columns) */}
                      {count === 2 && (
                        <div className="grid grid-cols-2 gap-1 h-[260px] sm:h-[300px] w-full">
                          {images.slice(0, 2).map((img, idx) => (
                            <div
                              key={idx}
                              className="relative h-full overflow-hidden cursor-pointer group"
                              onClick={() => openLightbox(images, idx, post.caption)}
                            >
                              <img
                                src={img}
                                alt={`รูปที่ ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Case 3: Exactly 3 Images (1 Large Left + 2 Stacked Right with equal 50/50 heights) */}
                      {count === 3 && (
                        <div className="grid grid-cols-12 gap-1.5 h-[300px] sm:h-[350px] w-full">
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
                          {/* Right: 2 Stacked Images (strictly equal 50/50 heights) */}
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
                                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Case 4: 4 or more Images (1 Large Vertical Left + 3 Stacked Right with equal 33.3% heights) */}
                      {count >= 4 && (
                        <div className="grid grid-cols-12 gap-1.5 h-[320px] sm:h-[380px] w-full">
                          {/* Left: 1 Large Vertical Image (col-span-7) */}
                          <div
                            className="col-span-7 h-full overflow-hidden cursor-pointer group relative"
                            onClick={() => openLightbox(images, 0, post.caption)}
                          >
                            <img
                              src={images[0]}
                              alt="รูปหลัก"
                              className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
                            />
                          </div>

                          {/* Right: 3 Stacked Images (strictly equal 33.3% heights) */}
                          <div className="col-span-5 flex flex-col gap-1.5 h-full">
                            {images.slice(1, 4).map((img, idx) => {
                              const photoIdx = idx + 1;
                              const isThirdRight = idx === 2;
                              const moreCount = count - 4;

                              return (
                                <div
                                  key={idx}
                                  className="relative flex-1 min-h-0 w-full overflow-hidden cursor-pointer group"
                                  onClick={() => openLightbox(images, photoIdx, post.caption)}
                                >
                                  <img
                                    src={img}
                                    alt={`รูปย่อย ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                  />
                                  {/* Overlay badge on the 3rd right image if there are more than 4 images */}
                                  {isThirdRight && moreCount > 0 && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-lg sm:text-xl group-hover:bg-black/75 transition-colors">
                                      +{moreCount + 1}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Body: Action Bar + Caption */}
                    <div className="p-4 space-y-3">
                      {/* Action Bar: Heart (Number only) + Share (Icon + Number only, NO text) */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
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
                      </div>

                      {/* Caption Text */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {post.caption}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Auto Infinite Scroll Sentinel Target */}
            {filteredPosts.length > visibleCount ? (
              <div ref={sentinelRef} className="py-6 text-center space-y-2">
                <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-full shadow-2xs text-xs text-[#4A7C59] font-bold">
                  <div className="w-4 h-4 border-2 border-[#4A7C59] border-t-transparent rounded-full animate-spin shrink-0" />
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
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="mt-1 bg-[#4A7C59] hover:bg-[#3B6347] text-white px-5 py-2 rounded-full font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  + สร้างโพสต์โมเมนต์ของคุณ
                </button>
              </div>
            ) : null}
          </div>

          {/* Right Column (4-cols): Sticky Sidebar */}
          <aside className="lg:col-span-4 space-y-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pb-6 shrink-0">
            {/* Widget: Trending Spots (พิกัด & จุดเช็คอินยอดฮิต) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F26430]" />
                <span>พิกัดเช็คอินยอดฮิต</span>
              </h3>

              <div className="space-y-1.5">
                {trendingSpots.map((spot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLocationFilter(spot.title)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group flex items-center justify-between cursor-pointer"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#4A7C59] truncate transition-colors">
                      {spot.title}
                    </p>
                    <span className="text-[10px] font-bold text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-full shrink-0">
                      {spot.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Safe Space Note */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#2D5A3C]">
                <ShieldCheck className="w-4 h-4 text-[#4A7C59]" />
                <span>พื้นที่ปลอดภัย & ความเป็นส่วนตัว</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ทุกโมเมนต์เน้นส่งต่อพลังบวกและบันทึกความสุข ระบบไม่เปิดเผยพิกัดที่อยู่ส่วนตัว เพื่อความปลอดภัยของทุกคน 🌿
              </p>
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

      {/* Modal 4: Create Moment Modal (Multi-Photo up to 6 images) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl relative animate-scale-up border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4A7C59]" />
                <span>แชร์โมเมนต์ความประทับใจ</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Pillar Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  เลือกหมวดหมู่ที่ต้องการแชร์:
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'spot', label: 'พิกัดเที่ยว' },
                    { id: 'community', label: 'กิจกรรม' },
                    { id: 'fair', label: 'งานแฟร์' },
                    { id: 'challenge', label: 'ชาเลนจ์' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const newType = p.id as any;
                        setCreateTargetType(newType);
                        if (newType === 'spot') setCreateTargetId(MOCK_SPOTS[0]?.id || '');
                        else if (newType === 'challenge') setCreateTargetId(MOCK_CHALLENGES[0]?.id || '');
                        else if (newType === 'fair') {
                          const fair =
                            MOCK_EVENTS.find((e) => e.eventType === 'public_venue') || MOCK_EVENTS[0];
                          setCreateTargetId(fair.id);
                        } else {
                          const comm =
                            MOCK_EVENTS.find((e) => e.eventType === 'community') || MOCK_EVENTS[0];
                          setCreateTargetId(comm.id);
                        }
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        createTargetType === p.id
                          ? 'bg-white text-[#2D5A3C] shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Target Dropdown (Clean Plain Text per Rule 7) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  {createTargetType === 'spot'
                    ? 'เลือกสถานที่/พิกัดที่ไปมา:'
                    : createTargetType === 'challenge'
                    ? 'เลือกภารกิจที่ทำสำเร็จ:'
                    : createTargetType === 'fair'
                    ? 'เลือกงานมหกรรม/เอ็กซ์โป:'
                    : 'เลือกกิจกรรมคอมมูนิตี้:'}
                </label>
                <select
                  value={createTargetId}
                  onChange={(e) => setCreateTargetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4A7C59]"
                >
                  {createTargetType === 'spot' &&
                    MOCK_SPOTS.slice(0, 30).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.district}, {s.province})
                      </option>
                    ))}

                  {createTargetType === 'challenge' &&
                    MOCK_CHALLENGES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}

                  {createTargetType === 'fair' &&
                    MOCK_EVENTS.filter((e) => e.eventType === 'public_venue').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title} ({f.location})
                      </option>
                    ))}

                  {createTargetType === 'community' &&
                    MOCK_EVENTS.filter((e) => e.eventType === 'community').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.location})
                      </option>
                    ))}
                </select>
              </div>

              {/* Caption Text Area */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  ความรู้สึก / บรรยากาศประทับใจ:
                </label>
                <textarea
                  rows={3}
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="เช่น บรรยากาศสงบ กาแฟดริปหอมละมุน หรือฝึกซ้อมผ่านสถานีสำเร็จ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#4A7C59]"
                  required
                />
              </div>

              {/* Multi-Photo Upload Section (Up to 6 images) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>รูปภาพโมเมนต์บรรยากาศ ({uploadedPostImages.length}/6 รูป):</span>
                  <span className="text-[10px] text-[#4A7C59] font-semibold">อัปโหลดได้สูงสุด 6 รูป</span>
                </div>

                {/* Uploaded Thumbnails Grid */}
                {uploadedPostImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedPostImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group"
                      >
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                          title="ลบรูปนี้"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Picker Trigger (if < 6 photos) */}
                {uploadedPostImages.length < 6 && (
                  <label className="p-3 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-[#4A7C59] transition-colors text-center cursor-pointer flex flex-col items-center justify-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#4A7C59] shadow-2xs border border-slate-200">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        คลิกเพื่อเพิ่มรูปภาพ (เลือกได้หลายรูป)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        รองรับ JPG, PNG, WEBP (เหลือที่ว่างอีก {6 - uploadedPostImages.length} รูป)
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-[#4A7C59] hover:bg-[#3B6347] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  โพสต์โมเมนต์เลย
                </button>
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
          <div className="w-8 h-8 border-3 border-[#4A7C59] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MomentsContent />
    </Suspense>
  );
}
