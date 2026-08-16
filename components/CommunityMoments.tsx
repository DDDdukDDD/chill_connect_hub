'use client';

import React, { useState } from 'react';
import { MOCK_POSTS, CommunityPost, PostComment, EventItem } from '@/data/mockData';
import { Heart, MessageCircle, Share2, Sparkles, PlusCircle, X, Image as ImageIcon, Send, MapPin, Tag, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CommunityMomentsProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  showToast: (msg: string) => void;
}

export const CommunityMoments: React.FC<CommunityMomentsProps> = ({
  events,
  onSelectEvent,
  showToast,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New Post Form State
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '7');
  const [captionInput, setCaptionInput] = useState<string>('');

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

    const matchedEvent = events.find((ev) => ev.id === selectedEventId) || events[0];

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

  return (
    <section className="space-y-6 pt-4 pb-8">
      
      {/* Section Header with Create Post CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
            <span>📸 โมเมนต์จากเพื่อนๆ (Community Moments)</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
            แชร์ภาพบรรยากาศ ความสนุก และรีวิวหลังจบกิจกรรมยามว่าง
          </p>
        </div>

        {/* Create Post Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#4A7C59] hover:bg-[#3B6347] text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#4A7C59]/20 flex items-center gap-2 active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>แชร์โมเมนต์ของคุณ</span>
        </button>
      </div>

      {/* Social Moments Feed Grid (Instagram Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const matchedEvent = events.find((ev) => ev.id === post.eventId);

          return (
            <div
              key={post.id}
              className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Post Header: User Avatar & Badge */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#EBF3ED] border-2 border-[#4A7C59] overflow-hidden shrink-0">
                    <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-[#1E293B] truncate flex items-center gap-1">
                      <span>{post.userName}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                    </h4>
                    <p className="text-[11px] text-[#F26430] font-semibold tracking-wide">
                      {post.userBadge}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-[#94A3B8] font-medium shrink-0">
                  {post.timeAgo}
                </span>
              </div>

              {/* Post Image Banner */}
              <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                <img
                  src={post.images[0]}
                  alt="Moment photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                {/* Event Tag Pill (Clickable -> Opens Event Detail) */}
                <button
                  onClick={() => matchedEvent && onSelectEvent(matchedEvent)}
                  className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#1E293B] shadow-md flex items-center gap-1.5 hover:bg-[#F26430] hover:text-white transition-all cursor-pointer"
                  title="คลิกเพื่อดูรายละเอียดกิจกรรมนี้"
                >
                  <Tag className="w-3 h-3 text-[#F26430] group-hover:text-white" />
                  <span className="truncate max-w-[200px]">{post.eventTitle}</span>
                </button>
              </div>

              {/* Post Actions (Like, Comment, Share) */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                
                <div className="space-y-2">
                  {/* Action Icons Bar */}
                  <div className="flex items-center justify-between text-xs text-[#64748B] pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      {/* Like Button */}
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className="flex items-center gap-1.5 font-bold hover:text-[#F26430] transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform active:scale-125 ${
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
                        className="flex items-center gap-1.5 font-semibold hover:text-[#4A7C59] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.commentsCount} คอมเมนต์</span>
                      </button>
                    </div>

                    <button
                      onClick={() => showToast('คัดลอกลิงก์โมเมนต์แล้ว!')}
                      className="p-1 text-[#94A3B8] hover:text-[#1E293B] transition-colors"
                      title="แชร์โมเมนต์"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Caption Text */}
                  <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                    {post.caption}
                  </p>

                  {/* Location Info */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                    <MapPin className="w-3 h-3 text-[#F26430] shrink-0" />
                    <span className="truncate">{post.location}</span>
                  </div>
                </div>

                {/* Interactive Comments Container */}
                {activeCommentPostId === post.id && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
                    
                    {/* Existing Comments List */}
                    {post.comments.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-0.5">
                            <div className="flex items-center justify-between font-bold text-[#1E293B]">
                              <span>{comment.userName}</span>
                              <span className="text-[10px] text-[#94A3B8] font-normal">{comment.timeAgo}</span>
                            </div>
                            <p className="text-[#475569]">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#94A3B8] text-center italic py-1">
                        ยังไม่มีความคิดเห็น เป็นคนแรกที่คอมเมนต์สิ!
                      </p>
                    )}

                    {/* Add Comment Input Bar */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCommentInput}
                        onChange={(e) => setNewCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="เขียนความคิดเห็น..."
                        className="flex-1 bg-slate-100 text-xs text-[#1E293B] px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="bg-[#4A7C59] text-white p-2 rounded-full hover:bg-[#3B6347] transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Create Moment Modal Popup */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-scale-up border border-[#E8E2D8]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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

            {/* Form Fields */}
            <form onSubmit={handleCreatePost} className="space-y-4">
              
              {/* Select Activity Tag */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B]">
                  เลือกกิจกรรมที่พึ่งไปร่วมงานมา:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption Text Area */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B]">
                  ความรู้สึก / บรรยากาศสนุกๆ:
                </label>
                <textarea
                  rows={3}
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="เช่น ไปร่วมงานแล้วประทับใจอะไร เพื่อนๆ น่ารักมากแค่ไหน..."
                  className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl p-3 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                  required
                />
              </div>

              {/* Image Preview Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-[#C5DCCB] text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4A7C59]">
                  <ImageIcon className="w-4 h-4" />
                  <span>ภาพถ่ายบรรยากาศจะถูกแนบอัตโนมัติ</span>
                </div>
                <p className="text-[10px] text-[#94A3B8]">
                  (ระบบจำลองเลือกรูปถ่ายคุณภาพสูงจากกิจกรรม {events.find(ev => ev.id === selectedEventId)?.title})
                </p>
              </div>

              {/* Modal Buttons */}
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

    </section>
  );
};
