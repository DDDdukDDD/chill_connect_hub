'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Heart,
  Camera,
  Sparkles,
  Share2,
  ArrowRight,
} from 'lucide-react';

export interface StorySlide {
  image: string;
  caption: string;
  time: string;
  locationName: string;
}

export interface MomentStoryItem {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  coverImage: string;
  ringGradient: string;
  badge?: string;
  slides: StorySlide[];
}

export const CURATED_MOMENT_STORIES: MomentStoryItem[] = [
  {
    id: 'story-trending',
    title: 'ฮิตวันนี้',
    author: 'บาส (Bas Running)',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    ringGradient: 'from-[#F26430] via-rose-500 to-purple-600',
    badge: 'Trending',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=85',
        caption: 'วิ่งเช้าสวนเบญจกิติ อากาศ 23 องศา สดชื่นมากเพื่อนๆ ร่วมตี้ 10 คน!',
        time: '2 ชม. ที่แล้ว',
        locationName: 'สวนเบญจกิติ, กรุงเทพฯ',
      },
      {
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=85',
        caption: 'จิบกาแฟดริปสโลว์บาร์ยามเช้าหลังวิ่งจบ เติมพลังก่อนเริ่มงานวันจันทร์ ☕',
        time: '1 ชม. ที่แล้ว',
        locationName: 'Slow Bar Cafe คลองเตย',
      },
    ],
  },
  {
    id: 'story-slowbar',
    title: 'Slow Bar',
    author: 'แจน (Jan Specialty)',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    ringGradient: 'from-amber-400 via-orange-500 to-amber-600',
    badge: 'Specialty',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85',
        caption: 'Specialty Drip Session ย่านอารีย์ แลกเปลี่ยนเมล็ด Ethiopia & Mae Jan Tai หอมฟุ้งมาก',
        time: '3 ชม. ที่แล้ว',
        locationName: 'Ari Coffee Space, อารีย์',
      },
      {
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85',
        caption: 'ดริปเย็นสูตรพิเศษ ดื่มง่าย รสสัมผัสเปรี้ยวสดชื่นเหมือนพีช 🍑',
        time: '2 ชม. ที่แล้ว',
        locationName: 'Ari Coffee Space, อารีย์',
      },
    ],
  },
  {
    id: 'story-art',
    title: 'Art & Expo',
    author: 'พลอย (Ploy Curator)',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1508997449629-303059a039c0?auto=format&fit=crop&w=600&q=80',
    ringGradient: 'from-blue-500 via-indigo-500 to-purple-600',
    badge: 'Gallery',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1508997449629-303059a039c0?auto=format&fit=crop&w=1000&q=85',
        caption: 'ชมนิทรรศการศิลปะร่วมสมัยและงานคราฟต์ที่ BACC วันนี้คนเยอะแต่บรรยากาศชิลล์มาก',
        time: '4 ชม. ที่แล้ว',
        locationName: 'หอศิลปวัฒนธรรมแห่งกรุงเทพฯ (BACC)',
      },
      {
        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=85',
        caption: 'เวิร์กช็อปปั้นแก้วเซรามิกแฮนด์เมด ได้แก้วใบแรกกลับบ้านแล้ว!',
        time: '3 ชม. ที่แล้ว',
        locationName: 'Clay Studio, เอกมัย',
      },
    ],
  },
  {
    id: 'story-nature',
    title: 'จุดฮีลใจ',
    author: 'วิน (Win Trekker)',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    ringGradient: 'from-emerald-500 via-teal-500 to-green-600',
    badge: 'Nature',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=85',
        caption: 'ทะเลหมอกยามเช้าที่ภูชี้ฟ้า เชียงราย อากาศหนาวจับใจ ธรรมชาติบำบัดของจริง 🏔️',
        time: '5 ชม. ที่แล้ว',
        locationName: 'จุดชมวิวภูชี้ฟ้า, เชียงราย',
      },
      {
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=85',
        caption: 'ทิวเขาเขียวขจีสลับซับซ้อน สูดโอโซนบริสุทธิ์เต็มปอด',
        time: '4 ชม. ที่แล้ว',
        locationName: 'ดอยผาตั้ง, เชียงราย',
      },
    ],
  },
  {
    id: 'story-climbing',
    title: 'ปีนผา Bouldering',
    author: 'กล้า (Kla Active)',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
    ringGradient: 'from-violet-500 via-purple-500 to-pink-500',
    badge: 'Fitness',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1000&q=85',
        caption: 'ตี้ปีนผาจำลอง Bouldering ย่านสุขุมวิท วันนี้ลองเส้นทาง V3 สำเร็จแล้ว ขอบคุณเพื่อนๆ ที่ช่วยชี้ไลน์!',
        time: '6 ชม. ที่แล้ว',
        locationName: 'Climbing Gym สุขุมวิท 49',
      },
    ],
  },
  {
    id: 'story-boardgame',
    title: 'ตี้บอร์ดเกม',
    author: 'มิ้นต์ (Mint Boardgame)',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    coverImage: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
    ringGradient: 'from-amber-500 via-rose-500 to-indigo-600',
    badge: 'Meetup',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1000&q=85',
        caption: 'Catan คืนวันศุกร์ เทรดแกะแลกไม้กันดุเดือดมาก หัวเราะจนเจ็บคอ 🎲',
        time: '8 ชม. ที่แล้ว',
        locationName: 'Board Game Cafe สามย่านมิตรทาวน์',
      },
    ],
  },
];

interface MomentsStoriesRailProps {
  onAddStory: () => void;
  isLoggedIn: boolean;
  onOpenTargetLocation?: (locationName: string) => void;
}

export const MomentsStoriesRail: React.FC<MomentsStoriesRailProps> = ({
  onAddStory,
  isLoggedIn,
  onOpenTargetLocation,
}) => {
  const [activeStory, setActiveStory] = useState<MomentStoryItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [cheeredStories, setCheeredStories] = useState<string[]>([]);
  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance story timer (5 seconds per slide)
  useEffect(() => {
    if (!activeStory || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => {
        if (prev < activeStory.slides.length - 1) {
          return prev + 1;
        } else {
          // Finished this story, find next story if available
          const currentIndex = CURATED_MOMENT_STORIES.findIndex((s) => s.id === activeStory.id);
          if (currentIndex !== -1 && currentIndex < CURATED_MOMENT_STORIES.length - 1) {
            const nextStory = CURATED_MOMENT_STORIES[currentIndex + 1];
            setActiveStory(nextStory);
            setViewedStoryIds((v) => Array.from(new Set([...v, nextStory.id])));
            return 0;
          } else {
            setActiveStory(null);
            return 0;
          }
        }
      });
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeStory, isPaused]);

  // Keyboard navigation for Story Viewer
  useEffect(() => {
    if (!activeStory) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveStory(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      } else if (e.key === ' ') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStory]);

  const handleOpenStory = (story: MomentStoryItem) => {
    setActiveStory(story);
    setCurrentSlideIndex(0);
    setViewedStoryIds((prev) => Array.from(new Set([...prev, story.id])));
  };

  const handlePrevSlide = () => {
    if (!activeStory) return;
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    } else {
      // Go to previous story
      const currentIndex = CURATED_MOMENT_STORIES.findIndex((s) => s.id === activeStory.id);
      if (currentIndex > 0) {
        const prevStory = CURATED_MOMENT_STORIES[currentIndex - 1];
        setActiveStory(prevStory);
        setCurrentSlideIndex(prevStory.slides.length - 1);
      }
    }
  };

  const handleNextSlide = () => {
    if (!activeStory) return;
    if (currentSlideIndex < activeStory.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      // Go to next story
      const currentIndex = CURATED_MOMENT_STORIES.findIndex((s) => s.id === activeStory.id);
      if (currentIndex !== -1 && currentIndex < CURATED_MOMENT_STORIES.length - 1) {
        const nextStory = CURATED_MOMENT_STORIES[currentIndex + 1];
        setActiveStory(nextStory);
        setCurrentSlideIndex(0);
        setViewedStoryIds((v) => Array.from(new Set([...v, nextStory.id])));
      } else {
        setActiveStory(null);
      }
    }
  };

  const handleCheerCurrentStory = () => {
    if (!activeStory) return;
    setCheeredStories((prev) =>
      prev.includes(activeStory.id) ? prev.filter((id) => id !== activeStory.id) : [...prev, activeStory.id]
    );
  };

  const handleShareCurrentStory = async () => {
    if (!activeStory) return;
    const currentSlide = activeStory.slides[currentSlideIndex];
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/moments?location=${encodeURIComponent(
        currentSlide.locationName || activeStory.title
      )}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${activeStory.title} บน Chill & Connect Hub`,
            text: currentSlide.caption,
            url: shareUrl,
          });
          return;
        } catch {
          // User aborted share
        }
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
      }
    }
  };

  return (
    <>
      {/* Stories Rail Container */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-0.5 select-none">
          {/* User's "Add Story" Button */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" onClick={onAddStory}>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] border-2 border-dashed border-slate-300 group-hover:border-slate-800 transition-colors flex items-center justify-center bg-slate-50">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                {isLoggedIn ? (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="My Avatar"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs border-2 border-white group-hover:scale-110 transition-transform">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-700 max-w-[68px] truncate text-center group-hover:text-slate-900">
              แชร์สตอรี่
            </span>
          </div>

          <div className="w-[1px] h-12 bg-slate-200 shrink-0 mx-0.5" />

          {/* Curated Highlights Stories Circles */}
          {CURATED_MOMENT_STORIES.map((story) => {
            const isViewed = viewedStoryIds.includes(story.id);

            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleOpenStory(story)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group focus:outline-hidden"
              >
                {/* Glowing Gradient Ring Container */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] transition-all duration-300 group-hover:scale-105 ${
                    isViewed
                      ? 'bg-slate-300'
                      : `bg-gradient-to-tr ${story.ringGradient} shadow-xs group-hover:shadow-md`
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden p-[2px] bg-white">
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Story Title Label */}
                <span className="text-[11px] font-bold text-slate-800 max-w-[72px] truncate text-center group-hover:text-blue-600 transition-colors">
                  {story.title}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Full-Screen Instagram-Style Story Viewer Modal */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in"
          onClick={() => setActiveStory(null)}
        >
          {/* Story Card Viewport (Phone Proportions max-w-[420px]) */}
          <div
            className="relative w-full max-w-[400px] h-[92vh] max-h-[780px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Background Image of Current Slide */}
            <img
              src={activeStory.slides[currentSlideIndex].image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark Gradients for Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none" />

            {/* Top Bar: Progress Bars + Author Info + Close */}
            <div className="relative z-20 p-3 sm:p-4 space-y-3">
              {/* Progress Bars Row */}
              <div className="flex items-center gap-1.5 w-full">
                {activeStory.slides.map((_, sIdx) => {
                  const isDone = sIdx < currentSlideIndex;
                  const isCurrent = sIdx === currentSlideIndex;

                  return (
                    <div key={sIdx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isDone
                            ? 'w-full bg-white'
                            : isCurrent
                            ? isPaused
                              ? 'w-1/2 bg-white'
                              : 'w-full bg-white transition-[width] duration-[5000ms] ease-linear'
                            : 'w-0 bg-white'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Author Info & Actions */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={activeStory.authorAvatar}
                    alt={activeStory.author}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/80 shrink-0 shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate flex items-center gap-1.5">
                      <span>{activeStory.author}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                        {activeStory.badge || 'Hub'}
                      </span>
                    </p>
                    <p className="text-[10px] text-white/70 truncate">
                      {activeStory.slides[currentSlideIndex].time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveStory(null)}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="ปิด (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Tap Navigators (Left 35% for Prev, Right 65% for Next) */}
            <div className="absolute inset-y-16 inset-x-0 flex z-10">
              <div
                className="w-[35%] h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevSlide();
                }}
                title="รูปก่อนหน้า"
              />
              <div
                className="w-[65%] h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextSlide();
                }}
                title="รูปถัดไป"
              />
            </div>

            {/* Bottom Caption & Interactive Cheer Bar */}
            <div className="relative z-20 p-4 space-y-3">
              {/* Clickable Location Tag */}
              {activeStory.slides[currentSlideIndex].locationName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenTargetLocation) {
                      onOpenTargetLocation(activeStory.slides[currentSlideIndex].locationName);
                      setActiveStory(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-white hover:text-slate-900 backdrop-blur-md text-white text-[11px] font-bold border border-white/25 shadow-md transition-all cursor-pointer group/loc active:scale-95"
                  title="คลิกเพื่อดูกิจกรรมและพิกัดนี้"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400 group-hover/loc:text-[#F26430] shrink-0 transition-colors" />
                  <span className="truncate max-w-[200px] sm:max-w-[260px]">
                    {activeStory.slides[currentSlideIndex].locationName}
                  </span>
                  <ArrowRight className="w-3 h-3 text-white/70 group-hover/loc:text-slate-900 group-hover/loc:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}

              {/* Caption Text */}
              <p className="text-white text-xs sm:text-sm font-medium leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-3">
                {activeStory.slides[currentSlideIndex].caption}
              </p>

              {/* Action Cheer & Share Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-white/15">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCheerCurrentStory}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cheeredStories.includes(activeStory.id)
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                        : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        cheeredStories.includes(activeStory.id) ? 'fill-white' : 'text-white'
                      }`}
                    />
                    <span>{cheeredStories.includes(activeStory.id) ? 'ส่งใจแล้ว ❤️' : 'ส่งหัวใจ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareCurrentStory}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                    title="แชร์สตอรี่นี้"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                    <span>แชร์</span>
                  </button>
                </div>

                <span className="text-[11px] text-white/60 font-medium">
                  {currentSlideIndex + 1} / {activeStory.slides.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
