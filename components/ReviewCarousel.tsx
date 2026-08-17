'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, ArrowRight } from 'lucide-react';

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
];

export const ReviewCarousel: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="bg-gradient-to-br from-amber-50/60 via-white to-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-amber-200/70 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/50 pb-4">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-300/60">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>Real User Reviews</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1E293B]">
            💬 เสียงตอบรับจากเพื่อนๆ ที่ไปร่วมงานมาแล้ว
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium">
            ความรู้สึกจริงจากชาว Chill & Connect Hub ที่ลองออกไปเปิดประสบการณ์ยามว่าง
          </p>
        </div>

        <Link
          href="/moments"
          className="text-xs font-bold text-[#F26430] hover:text-[#D95322] flex items-center gap-1 shrink-0 transition-colors bg-white px-4 py-2 rounded-full border border-orange-200 shadow-2xs hover:shadow-xs"
        >
          <span>ดูรูปบรรยากาศโซเชียลทั้งหมด 📸</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Auto-Sliding Review Cards Row */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
      >
        {MOCK_REVIEWS.map((rev) => (
          <div
            key={rev.id}
            className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 shrink-0"
          >
            {/* Top Quote Bubble Header */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#4A7C59] bg-[#EBF3ED] px-2.5 py-0.5 rounded-full border border-[#4A7C59]/20 truncate max-w-[200px]">
                  {rev.eventTag}
                </span>
                <div className="flex items-center text-amber-400 gap-0.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#334155] font-medium leading-relaxed italic">
                "{rev.quote}"
              </p>
            </div>

            {/* Reviewer User Info with Tiny Verified Checkmark Badge */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={rev.userAvatar}
                  alt={rev.userName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-[#1E293B] truncate leading-tight">{rev.userName}</p>
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
    </section>
  );
};
