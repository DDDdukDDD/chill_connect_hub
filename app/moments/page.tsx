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
  Bookmark,
} from 'lucide-react';
import { MomentsStoriesRail } from '@/components/MomentsStoriesRail';

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
  const [doubleTapPostId, setDoubleTapPostId] = useState<string | null>(null);
  const [postCheers, setPostCheers] = useState<Record<string, string[]>>({});

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

  // Quick Positive Cheer Reaction
  const handleQuickCheer = (postId: string, reaction: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อร่วมส่งพลังบวกให้เพื่อนๆ');
      setIsRequireMembershipOpen(true);
      return;
    }

    setPostCheers((prev) => {
      const existing = prev[postId] || [];
      return {
        ...prev,
        [postId]: [...existing, reaction],
      };
    });

    showToast(`ส่งความรู้สึก "${reaction}" เรียบร้อยแล้ว ✨`);
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
        
        {/* Header Bar with Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>หน้าแรก</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">โมเมนต์ & บรรยากาศจริงจากชุมชน (Community Stories)</span>
        </div>

        {/* 1. Moments Signature Hero Banner (Full-Width Editorial Header) */}
        <section className="relative rounded-2xl bg-white p-4 sm:p-5 shadow-2xs border border-slate-200/80 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
            {/* Left (7-cols): Headline, Description & Actions */}
            <div className="lg:col-span-7 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/80 uppercase tracking-wider">
                    COMMUNITY STORIES • REAL MOMENTS
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  โมเมนต์ & บรรยากาศจริงจากชุมชน
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal max-w-xl">
                  ภาพถ่ายจริงและบรรยากาศจากพิกัดเที่ยว กิจกรรมคอมมูนิตี้ งานมหกรรม และภารกิจชาเลนจ์ทั่วประเทศ
                </p>
              </div>

              {/* Community Stats (Clean & Informative) */}
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5 font-medium flex-wrap">
                <span className="font-bold text-slate-800">{posts.length} โมเมนต์ที่แบ่งปัน</span>
                <span>•</span>
                <span>42+ พิกัดเช็คอินทั่วไทย</span>
                <span>•</span>
                <span>ภาพถ่ายจริงจากผู้ร่วมทริป</span>
              </div>
            </div>

            {/* Right (5-cols): Single Beautiful Snapshot Photo */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 h-[150px] sm:h-[175px] group">
              <img
                src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=85"
                alt="Community Lifestyle Moment"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-[0.97]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                <span className="text-[11px] font-bold text-white/95 flex items-center gap-1.5 [text-shadow:_0_1px_4px_rgba(0,0,0,0.8)]">
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>Snapshot of the Week</span>
                </span>
                <span className="text-[10px] text-white/80 font-medium [text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]">
                  สวนเบญจกิติ, กรุงเทพฯ
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 1.5 Moments Stories & Highlights Rail (Instagram-Style Stories & Pulse) */}
        <MomentsStoriesRail
          onAddStory={() => {
            if (!isLoggedIn) {
              setMembershipActionTitle('เพื่อแชร์สตอรี่โมเมนต์ของคุณ');
              setIsRequireMembershipOpen(true);
            } else {
              setIsCreateModalOpen(true);
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
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
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

                          {/* Sub-text: Destination Tag Link (Interactive POI Pill) */}
                          {targetTitle && (
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
                                <span className="text-[10px] text-slate-400 group-hover/poi:text-slate-600">
                                  ดูข้อมูล ↗
                                </span>
                              </button>
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

                      {/* Positive Cheer / Quick Emoji Reactions Bar */}
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          ส่งกำลังใจ:
                        </span>
                        {[
                          { emoji: '❤️', text: 'สวยมาก' },
                          { emoji: '✨', text: 'ชิลล์สุดๆ' },
                          { emoji: '☕', text: 'น่าไปตาม' },
                          { emoji: '🙌', text: 'ปังมาก' },
                          { emoji: '🔥', text: 'อยากไปจอย' },
                        ].map((rx) => (
                          <button
                            key={rx.text}
                            type="button"
                            onClick={() => handleQuickCheer(post.id, `${rx.emoji} ${rx.text}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
                          >
                            <span>{rx.emoji}</span>
                            <span>{rx.text}</span>
                          </button>
                        ))}
                      </div>

                      {/* Display Any Added Positive Cheers */}
                      {postCheers[post.id] && postCheers[post.id].length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {postCheers[post.id].map((cheer, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 animate-fade-in shadow-2xs"
                            >
                              {cheer}
                            </span>
                          ))}
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
                      setIsCreateModalOpen(true);
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
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/80 group flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-700 transition-colors w-4">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate transition-colors">
                        {spot.title}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 group-hover:bg-slate-200/80 px-2 py-0.5 rounded-full shrink-0 transition-colors">
                      {spot.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Safe Space Note */}
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>พื้นที่ปลอดภัย & ความเป็นส่วนตัว</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                ทุกโมเมนต์เน้นส่งต่อพลังบวกและบันทึกความสุข ระบบไม่เปิดเผยพิกัดที่อยู่ส่วนตัว เพื่อความปลอดภัยสูงสุดของสมาชิกทุกคน
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

            {/* Creator Persona Bar (Facebook & Threads Composer Style) */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="User avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  คุณส้ม (Som_Chill)
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>โพสต์สาธารณะ • ชุมชนชาวฮับ 77 จังหวัด</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 sm:space-y-5">
              {/* Pillar Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>เลือกหมวดหมู่ที่ต้องการแชร์:</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {createTargetType === 'spot'
                      ? 'พิกัดเที่ยว & จุดฮีลใจ'
                      : createTargetType === 'community'
                      ? 'กิจกรรมคอมมูนิตี้'
                      : createTargetType === 'fair'
                      ? 'งานมหกรรม & เอ็กซ์โป'
                      : 'ภารกิจชาเลนจ์'}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                  {[
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
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

              {/* Dynamic Target Dropdown with MapPin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  {createTargetType === 'spot'
                    ? 'เลือกสถานที่ / พิกัดที่ไปมา:'
                    : createTargetType === 'challenge'
                    ? 'เลือกภารกิจชาเลนจ์ที่ทำสำเร็จ:'
                    : createTargetType === 'fair'
                    ? 'เลือกงานมหกรรม / เอ็กซ์โป:'
                    : 'เลือกกิจกรรมคอมมูนิตี้:'}
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={createTargetId}
                    onChange={(e) => setCreateTargetId(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all cursor-pointer truncate"
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
              </div>

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

                {/* Quick Vibe Chips to append to caption */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    แท็กอารมณ์:
                  </span>
                  {[
                    '☕ กาแฟดริปดีมาก',
                    '🌿 ธรรมชาติฮีลใจ',
                    '📸 มุมถ่ายรูปปัง',
                    '🏃 สดชื่นได้เหงื่อ',
                    '✨ บรรยากาศสงบ',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setCaptionInput((prev) => (prev ? `${prev} ${tag}` : tag))
                      }
                      className="text-[10.5px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 transition-colors cursor-pointer active:scale-95"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Photo Upload Section (Up to 6 images) */}
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>รูปภาพโมเมนต์บรรยากาศ ({uploadedPostImages.length}/6 รูป)</span>
                  </div>
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
                    ? '💡 ใส่รูปภาพอย่างน้อย 1 รูป เพื่อให้เพื่อนๆ เห็นบรรยากาศ'
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
