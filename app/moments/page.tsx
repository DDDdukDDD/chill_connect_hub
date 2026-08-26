'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventDetailModal } from '@/components/EventDetailModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { MOCK_EVENTS, MOCK_POSTS, EventItem, CommunityPost, PostComment } from '@/data/mockData';
import {
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  PlusCircle,
  X,
  Image as ImageIcon,
  Send,
  MapPin,
  Tag,
  ShieldCheck,
  Flame,
  Award,
  Users,
  ArrowUpRight,
  Sprout,
  CheckCircle2,
  Trophy,
  Globe,
  UserCheck,
} from 'lucide-react';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';

export default function MomentsPage() {
  const [activeNavTab, setActiveNavTab] = useState('moments');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อแชร์เรื่องราวและภาพโมเมนต์');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isLoggedIn');
      if (saved === 'true') {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }

      // Check query param for personal moments tab
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'mine') {
        setActiveTabFilter('mine');
      }
    }
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    setIsLoggedIn(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
  };
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'popular' | 'mine'>('all');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState<boolean>(false);
  const [uploadedPostImage, setUploadedPostImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['1', '7']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // New Post Form State
  const [selectedEventId, setSelectedEventId] = useState<string>(MOCK_EVENTS[0]?.id || '7');
  const [captionInput, setCaptionInput] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
            setVisibleCount((prev) => Math.min(prev + 5, posts.length));
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [visibleCount, posts.length, isLoadingMore]);

  const handleLoadMorePosts = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5);
      setIsLoadingMore(false);
    }, 350);
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

  const handleToggleLike = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อส่งหัวใจและกดถูกใจโพสต์');
      setIsRequireMembershipOpen(true);
      return;
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          const newLikesCount = newIsLiked ? post.likesCount + 1 : post.likesCount - 1;
          if (newIsLiked) showToast('ส่งหัวใจเรียบร้อย! ❤️');
          return { ...post, isLiked: newIsLiked, likesCount: newLikesCount };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อร่วมพูดคุยและแสดงความคิดเห็น');
      setIsRequireMembershipOpen(true);
      return;
    }
    if (!newCommentInput.trim()) return;

    const newCommentObj: PostComment = {
      id: `c-${Date.now()}`,
      userName: 'คุณส้ม (Som_Chill)',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      text: newCommentInput.trim(),
      timeAgo: 'เมื่อสักครู่นี้',
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, newCommentObj],
          };
        }
        return post;
      })
    );

    setNewCommentInput('');
    showToast('เพิ่มความคิดเห็นแล้ว 💬');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captionInput.trim()) return;

    const matchedEvent = MOCK_EVENTS.find((ev) => ev.id === selectedEventId) || MOCK_EVENTS[0];

    const createdPost: CommunityPost = {
      id: `post-${Date.now()}`,
      userName: 'คุณส้ม (Som_Chill)',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      userBadge: '🏆 Member Explorer',
      eventId: matchedEvent.id,
      eventTitle: matchedEvent.title,
      category: matchedEvent.category,
      images: [uploadedPostImage || matchedEvent.image],
      caption: captionInput.trim(),
      location: matchedEvent.location,
      likesCount: 1,
      commentsCount: 0,
      timeAgo: 'เมื่อสักครู่นี้',
      isLiked: true,
      comments: [],
    };

    setPosts([createdPost, ...posts]);
    setCaptionInput('');
    setUploadedPostImage(null);
    setIsCreateModalOpen(false);
    showToast('แชร์โมเมนต์กิจกรรมของคุณสำเร็จแล้ว! 🎉');
  };

  // Filter posts by simple tabs
  const filteredPosts = useMemo(() => {
    if (activeTabFilter === 'popular') {
      return [...posts].sort((a, b) => b.likesCount - a.likesCount);
    }
    if (activeTabFilter === 'mine') {
      return posts.filter((post) => post.userName.includes('คุณส้ม'));
    }
    return posts;
  }, [posts, activeTabFilter]);

  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  // Schema.org Structured Data for AI Engines & Community Social Feed
  const momentsSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: 'โมเมนต์โซเชียล & รีวิวกิจกรรมจริงจากสมาชิก Chill & Connect Hub',
      description: 'ภาพบรรยากาศจริง มิตรภาพ และความประทับใจจากการเข้าร่วมกิจกรรมยามว่าง',
      author: {
        '@type': 'Organization',
        name: 'Chill & Connect Community',
      },
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* Schema.org Structured Data for AI Engine Parsing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(momentsSchema) }}
      />

      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            setIsAuthModalOpen(true);
            showToast('🔒 กรุณาเข้าสู่ระบบก่อนเปิดตี้หรือสร้างกิจกรรมใหม่');
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Main Social Facebook-Style Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8-cols): Main Social Feed Stream */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Facebook-style Top Simple Tab Filter Chips & Create Bar */}
            <div className="bg-white rounded-3xl p-4 border border-[#E8E2D8] shadow-sm space-y-3">
              
              {/* Quick Post Prompt Bar */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="User avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#4A7C59]"
                />
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      setMembershipActionTitle('เพื่อโพสต์แชร์ภาพและแบ่งปันโมเมนต์');
                      setIsRequireMembershipOpen(true);
                    } else {
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-500 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full text-left transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>คุณส้ม วันนี้ไปร่วมกิจกรรมฮีลใจไหนมาบ้าง? แชร์เลย...</span>
                  <ImageIcon className="w-4 h-4 text-[#4A7C59]" />
                </button>
              </div>

              {/* Simple Facebook Tabs: ทั้งหมด | ยอดฮิต | โมเมนต์ของฉัน */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { id: 'all', label: '🌐 ฟีดทั้งหมด' },
                  { id: 'popular', label: '🔥 ยอดนิยม' },
                  { id: 'mine', label: '👤 โมเมนต์ของฉัน' },
                ].map((tab) => {
                  const isActive = activeTabFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabFilter(tab.id as any)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 border ${
                        isActive
                          ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs scale-102'
                          : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Feed Post List */}
            <div className="space-y-6">
              {displayedPosts.map((post) => {
                const matchedEvent = MOCK_EVENTS.find((ev) => ev.id === post.eventId);

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Post User Header */}
                    <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-[#EBF3ED] border-2 border-[#4A7C59] overflow-hidden shrink-0 shadow-sm">
                          <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-[#1E293B] truncate flex items-center gap-1.5">
                            <span>{post.userName}</span>
                            <ShieldCheck className="w-4 h-4 text-[#4A7C59] shrink-0" />
                          </h3>
                          <p className="text-xs text-[#F26430] font-bold tracking-wide">
                            {post.userBadge}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-[#94A3B8] font-medium shrink-0">
                        {post.timeAgo}
                      </span>
                    </div>

                    {/* Post Photo Banner - Adjusted Aspect Ratio & Height for Better Viewing */}
                    <div className="relative aspect-[16/9] max-h-[380px] w-full bg-slate-100 overflow-hidden group">
                      <img
                        src={post.images[0]}
                        alt="Moment photo"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

                      {/* Clickable Event Tag Link Pill */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => matchedEvent && setSelectedEvent(matchedEvent)}
                          className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1E293B] shadow-md flex items-center gap-1.5 hover:bg-[#F26430] hover:text-white transition-all group/btn"
                          title="คลิกดูรายละเอียดกิจกรรมนี้"
                        >
                          <Tag className="w-3.5 h-3.5 text-[#F26430] group-hover/btn:text-white" />
                          <span className="truncate max-w-[220px] sm:max-w-md">{post.eventTitle}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                        </button>
                      </div>
                    </div>

                    {/* Post Actions & Caption Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      
                      {/* Action Bar */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-6">
                          {/* Like Button */}
                          <button
                            onClick={() => handleToggleLike(post.id)}
                            className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#1E293B] hover:text-[#F26430] transition-colors"
                          >
                            <Heart
                              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-125 ${
                                post.isLiked ? 'fill-[#F26430] text-[#F26430]' : 'text-[#64748B]'
                              }`}
                            />
                            <span>{post.likesCount} ถูกใจ</span>
                          </button>

                          {/* Comment Toggle Button */}
                          <button
                            onClick={() =>
                              setActiveCommentPostId(
                                activeCommentPostId === post.id ? null : post.id
                              )
                            }
                            className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-[#475569] hover:text-[#4A7C59] transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#64748B]" />
                            <span>{post.commentsCount} คอมเมนต์</span>
                          </button>
                        </div>

                        <button
                          onClick={() => showToast('คัดลอกลิงก์โมเมนต์แล้ว!')}
                          className="p-1.5 text-[#94A3B8] hover:text-[#1E293B] transition-colors rounded-full hover:bg-slate-100"
                          title="แชร์โมเมนต์"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Caption Text */}
                      <p className="text-xs sm:text-sm text-[#334155] leading-relaxed font-medium">
                        {post.caption}
                      </p>

                      {/* Location & Event Conversion CTA (จุดที่ 2) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                          <span>{post.location}</span>
                        </div>

                        <button
                          onClick={() => {
                            const matched = MOCK_EVENTS.find((ev) => ev.id === post.eventId) || MOCK_EVENTS[0];
                            setSelectedEvent(matched);
                          }}
                          className="bg-[#EBF3ED] hover:bg-[#4A7C59] text-[#4A7C59] hover:text-white border border-[#4A7C59]/30 px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Tag className="w-3 h-3 text-[#4A7C59] group-hover:text-white" />
                          <span>📌 อยากไปบ้าง / ดูงานนี้ ➔</span>
                        </button>
                      </div>

                      {/* Interactive Comments Drawer */}
                      {activeCommentPostId === post.id && (
                        <div className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
                          
                          {/* Existing Comments */}
                          {post.comments.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="bg-slate-50 p-2.5 rounded-2xl text-xs space-y-0.5">
                                  <div className="flex items-center justify-between font-bold text-[#1E293B]">
                                    <span>{comment.userName}</span>
                                    <span className="text-[10px] text-[#94A3B8] font-normal">{comment.timeAgo}</span>
                                  </div>
                                  <p className="text-[#475569]">{comment.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#94A3B8] text-center italic py-1">
                              ยังไม่มีความคิดเห็น เป็นคนแรกที่คอมเมนต์สิ!
                            </p>
                          )}

                          {/* Add Comment Bar */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={newCommentInput}
                              onChange={(e) => setNewCommentInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              placeholder="เขียนความคิดเห็น..."
                              className="flex-1 bg-slate-100 text-xs sm:text-sm text-[#1E293B] px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="bg-[#4A7C59] text-white p-2 rounded-full hover:bg-[#3B6347] transition-colors shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>

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
                <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md border border-[#E8E2D8] px-5 py-2.5 rounded-full shadow-sm text-xs text-[#4A7C59] font-bold">
                  <div className="w-4 h-4 border-2 border-[#4A7C59] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>กำลังโหลดโมเมนต์อัตโนมัติ... ({displayedPosts.length}/{filteredPosts.length})</span>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 rounded-3xl p-6 text-center border border-[#E8E2D8] space-y-2 my-6 animate-fade-in">
                <span className="text-2xl">🎉</span>
                <h4 className="font-bold text-sm text-[#1E293B]">คุณได้อ่านโมเมนต์ล่าสุดครบทั้ง {filteredPosts.length} รายการแล้ว!</h4>
                <p className="text-xs text-[#64748B]">ไปร่วมกิจกรรมยามว่างแล้วมาแบ่งปันเรื่องราวของคุณได้นะ</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 bg-[#F26430] text-white px-5 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-[#D95322] transition-colors active:scale-95"
                >
                  + สร้างโพสต์ใหม่ของคุณ
                </button>
              </div>
            )}
          </div>

          {/* Right Column (4-cols): Scrollable Sticky Right Sidebar */}
          <aside className="lg:col-span-4 space-y-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pb-6 shrink-0">
            
            {/* Widget 1: Create Moment CTA */}
            <div className="bg-gradient-to-br from-[#4A7C59] to-[#3B6347] rounded-3xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="font-extrabold text-base">แชร์ภาพความสนุกกิจกรรม!</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                ร่วมแบ่งปันรอยยิ้ม ความทรงจำ และรีวิวหลังจบกิจกรรมเพื่อรับแต้มชาเลนจ์สะสมเข็มอัปเลเวล
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-white text-[#4A7C59] hover:bg-emerald-50 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>สร้างโพสต์โมเมนต์ +</span>
              </button>
            </div>

            {/* Widget 2: ชาเลนจ์ของคุณ (แสดงเมื่อ login และมีชาเลนจ์เท่านั้น) */}
            {isLoggedIn && (
              <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>ชาเลนจ์ของคุณ</span>
                  </h3>
                  <span className="text-[11px] font-bold text-[#F26430] bg-orange-50 px-2 py-0.5 rounded-full">
                    Level 2 🌿
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>เข้าร่วมกิจกรรมยามว่างครบ 3 งาน</span>
                    <span className="font-bold text-[#4A7C59]">2/3</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4A7C59] rounded-full w-[66%]" />
                  </div>
                </div>
              </div>
            )}

            {/* Widget 3: Active Members Community */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4A7C59]" />
                <span>สมาชิกสายฮีลใจยอดนิยม</span>
              </h3>

              <div className="space-y-2.5">
                {[
                  { name: 'คุณส้ม (Som_Chill)', badge: '🏆 HYROX Finisher', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
                  { name: 'คุณเอก (Eak_Zen)', badge: '🧘 Sound Bath Master', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
                  { name: 'คุณเบส (Best_Gamer)', badge: '🎲 Dice Master', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80' },
                ].map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p className="text-xs font-bold text-[#1E293B]">{user.name}</p>
                        <p className="text-[10px] text-[#F26430] font-semibold">{user.badge}</p>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-[#4A7C59] hover:underline">
                      ติดตาม
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 4: Trending Hashtags */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F26430]" />
                <span>แฮชแท็กโมเมนต์ยอดฮิต</span>
              </h3>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  { tag: '#HyroxBootcamp', count: '48' },
                  { tag: '#SoundBath', count: '32' },
                  { tag: '#BoardGameNight', count: '29' },
                  { tag: '#CityRunMorning', count: '64' },
                ].map((item) => (
                  <span
                    key={item.tag}
                    className="bg-[#FAF7F2] border border-[#E8E2D8] px-2.5 py-1 rounded-full text-xs font-semibold text-[#1E293B] flex items-center gap-1 hover:border-[#F26430] hover:text-[#F26430] transition-colors cursor-pointer"
                  >
                    <span>{item.tag}</span>
                    <span className="text-[10px] text-[#94A3B8]">({item.count})</span>
                  </span>
                ))}
              </div>
            </div>

          </aside>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-12 mb-16 md:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ</p>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Mobile Floating Nav Bar */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={favorites.length}
      />

      {/* Event Detail Modal when clicking event tag pill */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? favorites.includes(selectedEvent.id) : false}
        onToggleFavorite={toggleFavorite}
        onJoinSuccess={() => showToast('เข้าร่วมกิจกรรมสำเร็จ!')}
      />

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-scale-up border border-[#E8E2D8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-[#1E293B] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F26430]" />
                <span>แชร์โมเมนต์กิจกรรมของคุณ</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#64748B] hover:text-[#1E293B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B]">
                  เลือกกิจกรรมที่พึ่งไปร่วมงานมา:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                >
                  {MOCK_EVENTS.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B]">
                  ความรู้สึก / บรรยากาศสนุกๆ:
                </label>
                <textarea
                  rows={3}
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="เช่น ไปร่วมงานแล้วประทับใจอะไร..."
                  className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl p-3 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                  required
                />
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-[#1E293B] flex items-center justify-between">
                  <span>🖼️ อัปโหลดภาพบรรยากาศ:</span>
                  <span className="text-[10px] text-[#4A7C59] font-semibold">อัปโหลดจากเครื่อง</span>
                </label>

                <div className="p-3 rounded-2xl bg-[#FAF7F2] border-2 border-dashed border-[#C5DCCB] hover:border-[#4A7C59] transition-colors text-center relative">
                  {uploadedPostImage ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-sm group">
                      <img src={uploadedPostImage} alt="Uploaded moment" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setUploadedPostImage(null)}
                          className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                        >
                          🗑️ เปลี่ยนรูปภาพ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-2 space-y-1">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#4A7C59] shadow-2xs border border-[#E8E2D8]">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1E293B]">📁 คลิกเพื่ออัปโหลดรูปภาพบรรยากาศจากเครื่อง</p>
                        <p className="text-[10px] text-[#64748B]">รองรับไฟล์ภาพ JPG, PNG, WEBP (พรีวิวทันที)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setUploadedPostImage(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#64748B] hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md shadow-[#F26430]/25 active:scale-95"
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
