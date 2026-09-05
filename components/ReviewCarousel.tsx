'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, ChevronRight, ChevronLeft, MessageSquareQuote } from 'lucide-react';

interface ReviewItem {
  id: string;
  userName: string;
  userAvatar: string;
  eventTag: string;
  quote: string;
  rating: number;
  timeAgo: string;
}

const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: 'review-1',
    userName: 'น้องโบว์ (Bow_Introvert)',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    eventTag: '🎲 นัดเล่นบอร์ดเกม & กาแฟชิลล์',
    quote: 'ไปคนเดียวครั้งแรกแอบตื่นเต้น แต่โฮสต์ต้อนรับเป็นกันเองมาก ชวนคุยไม่เกร็งเลย สนุกสุดๆ!',
    rating: 5,
    timeAgo: 'เมื่อเสาร์ที่แล้ว',
  },
  {
    id: 'review-2',
    userName: 'คุณเพชร (Petch_Runner)',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    eventTag: '🏃 วิ่งซิตี้รัน สวนลุมพินี',
    quote: 'ได้เพื่อนใหม่กลุ่มคนทำงานวัยเดียวกัน คุยถูกคอมาก วิ่งเสร็จไปกินโจ๊กต่อ บรรยากาศอบอุ่น!',
    rating: 5,
    timeAgo: 'เมื่อ 3 วันก่อน',
  },
  {
    id: 'review-3',
    userName: 'คุณแพรว (Praew_Craft)',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    eventTag: '🎨 เวิร์กช็อปเซรามิกทำมือ',
    quote: 'บรรยากาศฮีลใจมาก ได้ปลดปล่อยความเครียดจากงาน แถมได้แก้วกาแฟทำมือกลับบ้านด้วย!',
    rating: 5,
    timeAgo: 'เมื่ออาทิตย์ก่อน',
  },
  {
    id: 'review-4',
    userName: 'คุณมาร์ค (Mark_Developer)',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    eventTag: '💻 ทริปทำงานคาเฟ่ อโศก',
    quote: 'เปลี่ยนบรรยากาศทำงานคนเดียว มานั่งทำงานคู่เพื่อนใหม่ ไอเดียแลกเปลี่ยนกันแล่นมาก!',
    rating: 5,
    timeAgo: 'เมื่อวานนี้',
  },
  {
    id: 'review-5',
    userName: 'คุณจอย (Joy_ZenLife)',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    eventTag: '🧘 Sound Bath & บำบัดจิตใจ',
    quote: 'เสียง Tibetan Bowls คือที่สุด หลับสบายคลายความล้าสะสมจากงานประจำไปหมดเลย แนะนำมากๆ',
    rating: 5,
    timeAgo: 'เมื่อ 2 วันก่อน',
  },
  {
    id: 'review-6',
    userName: 'พี่ต้น (Ton_CoffeeLover)',
    userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    eventTag: '☕ Cupping กาแฟ Specialty อารีย์',
    quote: 'ได้ความรู้เรื่องเมล็ดกาแฟเยอะมาก และได้เพื่อนสาย Drip คุยกันยาวเลย ประทับใจ!',
    rating: 5,
    timeAgo: 'เมื่อ 4 วันก่อน',
  },
  {
    id: 'review-7',
    userName: 'น้องมิน (Min_Badminton)',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    eventTag: '🏸 ก๊วนแบดมินตันกระชับมิตร',
    quote: 'ไม่มีทีมไปเล่นคนเดียวสบายใจมาก จัดก๊วนแบ่งระดับมือเท่าเทียม เล่นสนุกเหงื่อท่วมเลย!',
    rating: 5,
    timeAgo: 'เมื่อ 5 วันก่อน',
  },
  {
    id: 'review-8',
    userName: 'คุณกอล์ฟ (Golf_Photographer)',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    eventTag: '📸 Photo Walk เดินถ่ายรูปเจริญกรุง',
    quote: 'เปิดมุมมองเมืองใหม่ๆ ได้รูปสวยเพียบ โฮสต์พาไปจุด Hidden Gem ที่ไม่เคยรู้มาก่อน!',
    rating: 5,
    timeAgo: 'เมื่อเสาร์ที่แล้ว',
  },
];

export const ReviewCarousel: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If close to the end, smoothly roll back to beginning
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
        }
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="my-8 sm:my-10 space-y-4 relative group">
      
      {/* Header Strip (Calm Forest Green Theme matching CommunityChallengeBar - Borderless Minimal) */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2E583C] to-[#4A7C59] flex items-center justify-center text-white shadow-2xs shrink-0">
            <MessageSquareQuote className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#1E293B] tracking-tight truncate flex items-center gap-1.5">
              <span>เสียงตอบรับจากเพื่อนๆ ที่ไปร่วมงานมาแล้ว</span>
              <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-md hidden sm:inline-block">
                Reviews
              </span>
            </h2>
            <p className="text-xs text-[#64748B] font-medium hidden sm:block">
              ความรู้สึกจริงจากชาว Chill & Connect Hub ที่ลองออกไปเปิดประสบการณ์ยามว่าง
            </p>
          </div>
        </div>

        {/* Right Action Link */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/moments"
            className="bg-[#1E293B] hover:bg-[#4A7C59] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <span>ดูรูปบรรยากาศทั้งหมด 📸</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Carousel Container with Floating Center Left/Right Buttons */}
      <div className="relative">
        
        {/* Floating Left Button (Desktop only: hidden lg:flex) */}
        <button
          onClick={handlePrev}
          className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md hover:shadow-lg items-center justify-center transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
          aria-label="เลื่อนซ้าย"
          title="เลื่อนซ้าย"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>

        {/* Floating Right Button (Desktop only: hidden lg:flex) */}
        <button
          onClick={handleNext}
          className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 shadow-md hover:shadow-lg items-center justify-center transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
          aria-label="เลื่อนขวา"
          title="เลื่อนขวา"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        {/* Auto-Sliding Review Cards Row (Smooth Continuous Loop) */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-auto no-scrollbar py-2 pb-5 px-1 scroll-smooth"
        >
          {MOCK_REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="w-[300px] sm:w-[330px] md:w-[350px] bg-slate-50/70 hover:bg-white p-4.5 rounded-2xl border border-slate-200/80 hover:border-[#4A7C59]/40 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 shrink-0 group/rev cursor-grab active:cursor-grabbing"
            >
              {/* Top Quote Bubble Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-extrabold text-[#4A7C59] bg-[#EBF3ED] px-2.5 py-0.5 rounded-md border border-[#4A7C59]/15 truncate max-w-[210px]">
                    {rev.eventTag}
                  </span>
                  <div className="flex items-center text-amber-400 gap-0.5 shrink-0">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[#334155] font-medium leading-relaxed italic line-clamp-3">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              {/* Reviewer User Info with Tiny Verified Checkmark Badge */}
              <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={rev.userAvatar}
                    alt={rev.userName}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-[#1E293B] truncate leading-tight group-hover/rev:text-[#4A7C59] transition-colors">
                        {rev.userName}
                      </p>
                      <span title="Verified Attendee">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{rev.timeAgo}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
