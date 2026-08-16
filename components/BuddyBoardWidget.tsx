'use client';

import React, { useState } from 'react';
import { Users, Plus, MessageCircle, Sparkles, MapPin, Calendar, Clock, CheckCircle2, Heart, Send } from 'lucide-react';

export interface BuddyPost {
  id: string;
  userName: string;
  userAvatar: string;
  userBadge: string;
  title: string;
  targetEventOrPlace: string;
  date: string;
  time: string;
  neededPeople: number;
  joinedPeople: number;
  tag: string;
  vibeTag: string; // e.g. "🤍 Introvert Friendly", "☕ สายชิลจิบกาแฟ", "🚆 ติด BTS"
}

const INITIAL_BUDDY_POSTS: BuddyPost[] = [
  {
    id: 'b-1',
    userName: 'คุณส้ม (Som_Chill)',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    userBadge: '🏆 Member Explorer',
    title: 'หาเพื่อนเดินงานหนังสือสิริกิติ์ โซนนิยาย & แวะจิบกาแฟก่อนเข้างาน ☕📚',
    targetEventOrPlace: 'ศูนย์ฯ สิริกิติ์ (QSNCC)',
    date: 'เสาร์นี้ 30 มี.ค.',
    time: '13:00 น.',
    neededPeople: 3,
    joinedPeople: 2,
    tag: '#งานหนังสือสิริกิติ์',
    vibeTag: '☕ สายชิลจิบกาแฟ',
  },
  {
    id: 'b-2',
    userName: 'คุณเอก (Eak_Zen)',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    userBadge: '⭐ Active Community Member',
    title: 'หาเพื่อนไปกินหมูกระทะดาดฟ้าอารีย์ รับลมเย็นยามเย็น 🥩🔥',
    targetEventOrPlace: 'ดาดฟ้าอารีย์, พญาไท',
    date: 'อาทิตย์นี้ 31 มี.ค.',
    time: '17:30 น.',
    neededPeople: 4,
    joinedPeople: 3,
    tag: '#หมูกระทะอารีย์',
    vibeTag: '🚆 ติด BTS อารีย์',
  },
  {
    id: 'b-3',
    userName: 'คุณมิ้นต์ (Mint_Runner)',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    userBadge: '🏃 Marathoner',
    title: 'หาเพื่อนวิ่ง City Run สวนเบญจกิตติ 5K วิ่งความเร็วชิลๆ Pacing 7.0 🏃‍♀️',
    targetEventOrPlace: 'สวนเบญจกิตติ, คลองเตย',
    date: 'เสาร์นี้ 30 มี.ค.',
    time: '06:30 น.',
    neededPeople: 5,
    joinedPeople: 4,
    tag: '#CityRun',
    vibeTag: '🔰 มือใหม่วิ่งได้',
  },
];

export const BuddyBoardWidget: React.FC = () => {
  const [buddyPosts, setBuddyPosts] = useState<BuddyPost[]>(INITIAL_BUDDY_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [titleInput, setTitleInput] = useState('');
  const [placeInput, setPlaceInput] = useState('');
  const [dateInput, setDateInput] = useState('เสาร์นี้');
  const [timeInput, setTimeInput] = useState('14:00 น.');
  const [neededCount, setNeededCount] = useState(2);
  const [vibeSelect, setVibeSelect] = useState('🤍 Introvert Friendly');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateBuddyPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !placeInput.trim()) return;

    const newPost: BuddyPost = {
      id: `b-${Date.now()}`,
      userName: 'คุณส้ม (Som_Chill)',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      userBadge: '🏆 Active Member',
      title: titleInput.trim(),
      targetEventOrPlace: placeInput.trim(),
      date: dateInput,
      time: timeInput,
      neededPeople: Number(neededCount),
      joinedPeople: 1,
      tag: '#ชวนเที่ยวชิลๆ',
      vibeTag: vibeSelect,
    };

    setBuddyPosts([newPost, ...buddyPosts]);
    setTitleInput('');
    setPlaceInput('');
    setIsModalOpen(false);
    showToast('ประกาศหาเพื่อนเที่ยวเรียบร้อยแล้ว! 🎉');
  };

  const handleJoinBuddy = (postId: string) => {
    setBuddyPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && post.joinedPeople < post.neededPeople) {
          showToast('ส่งคำขอร่วมทริปแล้ว! รอยืนยันทางข้อความ 💬');
          return { ...post, joinedPeople: post.joinedPeople + 1 };
        }
        return post;
      })
    );
  };

  return (
    <section className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/80 my-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-3 py-0.5 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Buddy Board</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>🤝 กระดานเพื่อนชวนเที่ยว & หาคู่เดินงาน</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
            อยากไปเดินงานหนังสือ ช็อปปิ้ง กินหมูกระทะ หรือจิบกาแฟ? โพสต์หาเพื่อนไปด้วยกันได้เลย!
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-3 rounded-full font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ ตั้งโพสต์ชวนเพื่อนเที่ยว</span>
        </button>
      </div>

      {/* Buddy Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {buddyPosts.map((post) => {
          const isFull = post.joinedPeople >= post.neededPeople;

          return (
            <div
              key={post.id}
              className="bg-slate-800/90 hover:bg-slate-800 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 transition-all duration-300 flex flex-col justify-between space-y-4 group hover:border-[#F26430]/50"
            >
              <div className="space-y-3">
                {/* User Info Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      className="w-8 h-8 rounded-full object-cover border border-amber-400/80"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-100">{post.userName}</p>
                      <p className="text-[10px] text-amber-300">{post.userBadge}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-slate-900 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {post.vibeTag}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                  {post.title}
                </h4>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#F26430] shrink-0" />
                    <span className="truncate">{post.targetEventOrPlace}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#4A7C59]" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {post.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Action */}
              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-300">
                  <span>ตอบรับแล้ว {post.joinedPeople}/{post.neededPeople} คน</span>
                </div>

                <button
                  onClick={() => handleJoinBuddy(post.id)}
                  disabled={isFull}
                  className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1 ${
                    isFull
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-[#4A7C59] hover:bg-[#3B6347] text-white shadow-sm active:scale-95'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>{isFull ? 'ครบจำนวนแล้ว' : '+ ไปด้วยคน'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating New Buddy Post */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-[#1E293B]">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#E8E2D8] relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
                <span>🤝 โพสต์ชวนเพื่อนไปเที่ยว / เดินงาน</span>
              </h3>
              <p className="text-xs text-slate-500">
                ตั้งโพสต์ชวนเพื่อนในฮับไปเดินงานสิริกิติ์, กินหมูกระทะ, หรือจิบกาแฟยามว่าง
              </p>
            </div>

            <form onSubmit={handleCreateBuddyPost} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">หัวข้อโพสต์ชวนเที่ยว *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หาเพื่อนเดินงานหนังสือสิริกิติ์วันเสาร์นี้ ☕"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#4A7C59]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">สถานที่ / งานอีเวนต์ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ศูนย์ฯ สิริกิติ์, BITEC บางนา, ดาดฟ้าอารีย์"
                  value={placeInput}
                  onChange={(e) => setPlaceInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#4A7C59]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">วันที่นัดหมาย</label>
                  <select
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#4A7C59]"
                  >
                    <option value="เสาร์นี้">เสาร์นี้</option>
                    <option value="อาทิตย์นี้">อาทิตย์นี้</option>
                    <option value="สัปดาห์หน้า">สัปดาห์หน้า</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เวลานัดหมาย</label>
                  <input
                    type="text"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#4A7C59]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">จำนวนคนที่เปิดรับ (คน)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={neededCount}
                    onChange={(e) => setNeededCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#4A7C59]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">สไตล์การเข้าร่วม (Vibe Tag)</label>
                  <select
                    value={vibeSelect}
                    onChange={(e) => setVibeSelect(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#4A7C59]"
                  >
                    <option value="🤍 Introvert Friendly">🤍 Introvert Friendly</option>
                    <option value="☕ สายชิลจิบกาแฟ">☕ สายชิลจิบกาแฟ</option>
                    <option value="🚆 ติด BTS/MRT">🚆 ติด BTS/MRT</option>
                    <option value="🔰 มือใหม่ร่วมได้">🔰 มือใหม่ร่วมได้</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-2 rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  ส่งโพสต์ชวนเพื่อน 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </section>
  );
};
