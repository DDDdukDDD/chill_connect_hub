'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Heart, ArrowRight, MapPin } from 'lucide-react';
import { MOCK_POSTS } from '@/data/mockData';

export const CommunityMomentsStrip: React.FC = () => {
  // Take top 5 authentic posts for a seamless single row (5 on lg, 4 on md, 3 on sm, 2 on mobile)
  const displayPosts = MOCK_POSTS.slice(0, 5);

  return (
    <section className="space-y-4">
      
      {/* Header Bar: Editorial Section 05 Banner (Warm Amber / Sunset Accent) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-transparent p-3.5 sm:p-4 rounded-2xl border border-amber-200/70 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-900 flex items-center justify-center text-xs font-black shrink-0 border border-amber-500/30">
              05
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>โมเมนต์ & บรรยากาศจริงจากชุมชน</span>
              <span className="text-[10px] font-black text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/80">
                Community Moments
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
            ภาพถ่ายความประทับใจ บรรยากาศคาเฟ่ และมิตรภาพใหม่ๆ ที่เกิดขึ้นจริงจากผู้ร่วมทริป
          </p>
        </div>

        {/* Action Link: Jump to /moments */}
        <Link
          href="/moments"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200/80 hover:border-slate-900 rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
        >
          <span>ดูโมเมนต์ทั้งหมด ({MOCK_POSTS.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Seamless Borderless Single-Row Photo Strip (5 on lg, 4 on md, 3 on sm, 2 on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {displayPosts.map((post, idx) => {
          // Dynamic responsive visibility to keep strictly 1 single complete row
          const responsiveVisibilityClass =
            idx === 4 ? 'hidden lg:block' : // 5th item visible only on desktop (lg: 5 cols)
            idx === 3 ? 'hidden md:block' : // 4th item visible on tablet+ (md: 4 cols)
            idx === 2 ? 'hidden sm:block' : // 3rd item visible on small tablet+ (sm: 3 cols)
            'block';                        // 1st & 2nd visible on mobile (2 cols)

          return (
            <div key={post.id} className={responsiveVisibilityClass}>
              <Link
                href="/moments"
                className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                {/* Full-bleed Photo */}
                <img
                  src={post.images[0] || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Subtle Top Shadow for Location Badge */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

                {/* Deep Bottom Shadow for Text & Info */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />

                {/* Top Location Badge */}
                {post.location && (
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/95 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 truncate max-w-full">
                      <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span className="truncate">{post.location}</span>
                    </span>
                  </div>
                )}

                {/* Bottom Overlaid Caption and Author Details (Borderless) */}
                <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end space-y-1.5 z-10">
                  <p className="text-white text-xs font-semibold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-amber-200 transition-colors">
                    {post.caption}
                  </p>

                  <div className="pt-1.5 flex items-center justify-between text-white/90 border-t border-white/15">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                        alt={post.userName}
                        className="w-4 h-4 rounded-full object-cover border border-white/40 shrink-0"
                      />
                      <span className="truncate text-[10.5px] font-medium text-white/90">
                        {post.userName.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-rose-300 font-bold text-[10.5px] shrink-0 ml-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      <span>{post.likesCount}</span>
                    </div>
                  </div>
                </div>

              </Link>
            </div>
          );
        })}
      </div>

    </section>
  );
};
