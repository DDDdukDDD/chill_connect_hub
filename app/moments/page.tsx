'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { EventDetailModal } from '@/components/EventDetailModal';
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
  TrendingUp,
  Users,
  Compass,
  ArrowUpRight,
  Sprout,
  CheckCircle2
} from 'lucide-react';

export default function MomentsPage() {
  const [activeNavTab, setActiveNavTab] = useState('moments');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'heal' | 'move' | 'chill' | 'learn'>('all');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['1', '7']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Post Form State
  const [selectedEventId, setSelectedEventId] = useState<string>(MOCK_EVENTS[0]?.id || '7');
  const [captionInput, setCaptionInput] = useState<string>('');

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

  const handleToggleLike = (postId: string) => {
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
      images: [matchedEvent.image],
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
    setIsCreateModalOpen(false);
    showToast('แชร์โมเมนต์กิจกรรมของคุณสำเร็จแล้ว! 🎉');
  };

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts;
    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />

      {/* Main Content */}
      <main className="flex-1">
        
        {/* Dedicated Social Hero Header Banner */}
        <section className="bg-gradient-to-b from-white to-[#FAF7F2] border-b border-[#E8E2D8] py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F26430] bg-[#FDF0EB] px-3.5 py-1 rounded-full border border-[#F26430]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#F26430]" />
                <span>Community Moments & Stories</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">
                โมเมนต์ความสุขจากเพื่อนๆ 📸
              </h1>
              <p className="text-sm sm:text-base text-[#475569] font-medium">
                พื้นที่แชร์ภาพบรรยากาศ ความทรงจำ และรีวิวหลังจบกิจกรรมยามว่างจากชาว Chill & Connect Hub
              </p>
            </div>

            {/* Create Post Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#F26430] hover:bg-[#D95322] text-white px-7 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#F26430]/25 flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span>แชร์โมเมนต์ของคุณ</span>
            </button>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Main Social Layout: 2 Columns (Main Feed + Sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 8-Cols: Social Feed Container */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  { id: 'all', label: '✨ ทั้งหมด', icon: '' },
                  { id: 'move', label: '🏃 สายออกกำลัง / HYROX', icon: '' },
                  { id: 'heal', label: '🌱 สายฮีลใจ / สมาธิ', icon: '' },
                  { id: 'chill', label: '☕ สายคาเฟ่ / บอร์ดเกม', icon: '' },
                  { id: 'learn', label: '🎨 สายงานคราฟต์ / เรียนรู้', icon: '' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 border shadow-xs ${
                      selectedCategory === cat.id
                        ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-[#4A7C59]/20'
                        : 'bg-white text-[#475569] border-[#E2DCD2] hover:border-[#4A7C59] hover:bg-[#EBF3ED]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Feed Post List */}
              <div className="space-y-6">
                {filteredPosts.map((post) => {
                  const matchedEvent = MOCK_EVENTS.find((ev) => ev.id === post.eventId);

                  return (
                    <article
                      key={post.id}
                      className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                    >
                      {/* Post User Header */}
                      <div className="p-5 flex items-center justify-between border-b border-slate-100">
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

                      {/* Post Photo Banner */}
                      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-100 overflow-hidden group">
                        <img
                          src={post.images[0]}
                          alt="Moment photo"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

                        {/* Clickable Event Badge Link (Linked directly to Event Detail Modal) */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                          <button
                            onClick={() => matchedEvent && setSelectedEvent(matchedEvent)}
                            className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-[#1E293B] shadow-lg flex items-center gap-2 hover:bg-[#F26430] hover:text-white transition-all group/btn"
                          >
                            <Tag className="w-3.5 h-3.5 text-[#F26430] group-hover/btn:text-white" />
                            <span className="truncate max-w-[240px] sm:max-w-md">{post.eventTitle}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                          </button>
                        </div>
                      </div>

                      {/* Post Actions & Caption Body */}
                      <div className="p-5 sm:p-6 space-y-4">
                        
                        {/* Action Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-6">
                            {/* Like Button */}
                            <button
                              onClick={() => handleToggleLike(post.id)}
                              className="flex items-center gap-2 font-bold text-sm text-[#1E293B] hover:text-[#F26430] transition-colors"
                            >
                              <Heart
                                className={`w-5 h-5 transition-transform active:scale-125 ${
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
                              className="flex items-center gap-2 font-semibold text-sm text-[#475569] hover:text-[#4A7C59] transition-colors"
                            >
                              <MessageCircle className="w-5 h-5 text-[#64748B]" />
                              <span>{post.commentsCount} คอมเมนต์</span>
                            </button>
                          </div>

                          <button
                            onClick={() => showToast('คัดลอกลิงก์โมเมนต์แล้ว!')}
                            className="p-2 text-[#94A3B8] hover:text-[#1E293B] transition-colors rounded-full hover:bg-slate-100"
                            title="แชร์โมเมนต์"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Caption Text */}
                        <p className="text-sm sm:text-base text-[#334155] leading-relaxed font-medium">
                          {post.caption}
                        </p>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                          <span>{post.location}</span>
                        </div>

                        {/* Interactive Comments Drawer */}
                        {activeCommentPostId === post.id && (
                          <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                            
                            {/* Existing Comments */}
                            {post.comments.length > 0 ? (
                              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {post.comments.map((comment) => (
                                  <div key={comment.id} className="bg-slate-50 p-3 rounded-2xl text-xs sm:text-sm space-y-1">
                                    <div className="flex items-center justify-between font-bold text-[#1E293B]">
                                      <span>{comment.userName}</span>
                                      <span className="text-[11px] text-[#94A3B8] font-normal">{comment.timeAgo}</span>
                                    </div>
                                    <p className="text-[#475569]">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#94A3B8] text-center italic py-2">
                                ยังไม่มีความคิดเห็น เป็นคนแรกที่คอมเมนต์สิ!
                              </p>
                            )}

                            {/* Add Comment Input Bar */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={newCommentInput}
                                onChange={(e) => setNewCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                placeholder="เขียนความคิดเห็น..."
                                className="flex-1 bg-slate-100 text-xs sm:text-sm text-[#1E293B] px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                className="bg-[#4A7C59] text-white p-2.5 rounded-full hover:bg-[#3B6347] transition-colors shadow-sm"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        )}

                      </div>
                    </article>
                  );
                })}
              </div>

            </div>

            {/* Right 4-Cols: Sidebar Widgets (Active Explorers & Trending Hashtags) */}
            <aside className="lg:col-span-4 space-y-6">
              
              {/* Active Explorers Widget */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
                <h3 className="font-bold text-base text-[#1E293B] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#4A7C59]" />
                  <span>เพื่อนๆ สายกิจกรรมยอดนิยม</span>
                </h3>

                <div className="space-y-3">
                  {[
                    { name: 'คุณส้ม (Som_Chill)', badge: '🏆 HYROX Finisher', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
                    { name: 'คุณเอก (Eak_Zen)', badge: '🧘 Sound Bath Master', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
                    { name: 'คุณเบส (Best_Gamer)', badge: '🎲 Dice Master', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80' },
                  ].map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">{user.name}</p>
                          <p className="text-[10px] text-[#F26430] font-semibold">{user.badge}</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-[#4A7C59] hover:underline">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Hashtags Widget */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-3">
                <h3 className="font-bold text-base text-[#1E293B] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#F26430]" />
                  <span>แฮชแท็กโมเมนต์ยอดฮิต</span>
                </h3>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { tag: '#HyroxBootcamp', count: '48 โพสต์' },
                    { tag: '#SoundBathMeditation', count: '32 โพสต์' },
                    { tag: '#BoardGameNightAsoke', count: '29 โพสต์' },
                    { tag: '#CityRunMorning', count: '64 โพสต์' },
                    { tag: '#PotteryWorkshop', count: '18 โพสต์' },
                  ].map((item) => (
                    <div
                      key={item.tag}
                      className="bg-[#FAF7F2] border border-[#E8E2D8] px-3 py-1.5 rounded-full text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 hover:border-[#F26430] hover:text-[#F26430] transition-colors cursor-pointer"
                    >
                      <span>{item.tag}</span>
                      <span className="text-[10px] text-[#94A3B8]">({item.count})</span>
                    </div>
                  ))}
                </div>
              </div>

            </aside>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-12">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p>© 2026 Chill & Connect Hub - ฮีลใจ & เชื่อมต่อ ฮับ. All rights reserved.</p>
      </footer>

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

              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-[#C5DCCB] text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4A7C59]">
                  <ImageIcon className="w-4 h-4" />
                  <span>ภาพถ่ายบรรยากาศแนบเรียบร้อย</span>
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
