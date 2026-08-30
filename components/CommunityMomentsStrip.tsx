'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Heart, MessageCircle, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { MOCK_POSTS } from '@/data/mockData';

export const CommunityMomentsStrip: React.FC = () => {
  // Take top 5 authentic posts with high-quality imagery
  const displayPosts = MOCK_POSTS.slice(0, 5);

  return (
    <section className="my-10 sm:my-14 space-y-4">
      
      {/* Header Banner: Clean, Warm & Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-r from-orange-50/60 via-amber-50/20 to-transparent p-3.5 sm:p-4 rounded-2xl border border-orange-200/60 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-orange-500/15 text-[#F26430] flex items-center justify-center text-xs font-black shrink-0 border border-orange-500/25">
              📸
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>โมเมนต์ & บรรยากาศจริงจากชุมชน</span>
              <span className="text-[10px] font-black text-[#F26430] bg-orange-100/70 px-2 py-0.5 rounded-full border border-orange-200/80">
                Community Stories
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium pl-8">
            ภาพถ่ายความประทับใจ บรรยากาศคาเฟ่ และมิตรภาพใหม่ๆ ที่เกิดขึ้นจริงจากผู้ร่วมทริป
          </p>
        </div>

        {/* Action Button: Jump to /moments */}
        <Link
          href="/moments"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F26430] text-slate-800 hover:text-white border border-slate-200 hover:border-[#F26430] rounded-xl text-xs font-extrabold shadow-2xs hover:shadow-md transition-all duration-200 group/btn shrink-0 cursor-pointer self-end sm:self-auto"
        >
          <span>ดูโมเมนต์ทั้งหมด ({MOCK_POSTS.length}+ เรื่องราว)</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 5-Column Responsive Cards Grid / Scrollable on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {displayPosts.map((post) => (
          <Link
            key={post.id}
            href="/moments"
            className="group/card relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-[#F26430]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Top Image Banner */}
            <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
              <img
                src={post.images[0] || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'}
                alt={post.caption}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />
              
              {/* Location Floating Pill */}
              {post.location && (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md truncate max-w-full">
                    <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                    <span className="truncate">{post.location}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
              
              {/* Caption */}
              <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed group-hover/card:text-[#F26430] transition-colors">
                {post.caption}
              </p>

              {/* Author & Likes */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 min-w-0">
                  <img
                    src={post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={post.userName}
                    className="w-4 h-4 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <span className="truncate text-slate-700 font-medium text-[10.5px]">
                    {post.userName.split(' ')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-rose-500 font-bold text-[10.5px] shrink-0">
                  <Heart className="w-3 h-3 fill-rose-500" />
                  <span>{post.likesCount}</span>
                </div>
              </div>

            </div>

          </Link>
        ))}
      </div>

    </section>
  );
};
