'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Heart, ArrowRight, Camera } from 'lucide-react';
import { MOCK_POSTS, CommunityPost } from '@/data/mockData';

interface StoryBarProps {
  onSelectEventId?: (eventId: string) => void;
}

export const StoryBar: React.FC<StoryBarProps> = ({ onSelectEventId }) => {
  const router = useRouter();
  const [selectedStory, setSelectedStory] = useState<CommunityPost | null>(null);

  return (
    <div className="w-full bg-[#FAF7F2] py-2 border-b border-[#E8E2D8]">
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1E293B]">
            <Camera className="w-4 h-4 text-[#F26430]" />
            <span>โมเมนต์บรรยากาศสดจากเพื่อนๆ</span>
            <span className="text-[10px] font-semibold text-[#4A7C59] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#4A7C59]/20">
              Live Stories
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium hidden sm:inline">
            คลิกวงกลมเพื่อดูภาพบรรยากาศจริง
          </span>
        </div>

        {/* Stories Horizontal Scroll List */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
          {MOCK_POSTS.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedStory(post)}
              className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
            >
              {/* Glowing Story Avatar Ring */}
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-[#F26430] to-[#4A7C59] group-hover:scale-105 transition-transform shadow-xs">
                <div className="bg-white p-0.5 rounded-full">
                  <img
                    src={post.userAvatar}
                    alt={post.userName}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                  />
                </div>
                {/* Event category indicator badge */}
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-white rounded-full p-0.5 shadow-xs border border-[#E8E2D8]">
                  📸
                </span>
              </div>

              {/* User Short Label */}
              <span className="text-[11px] font-bold text-[#1E293B] max-w-[64px] truncate text-center group-hover:text-[#F26430] transition-colors">
                {post.userName.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* Story Fullscreen Viewer Popup Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col text-white max-h-[85vh] animate-scale-up">
            
            {/* Story Top Progress Bar */}
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
              <div className="h-1 bg-white/80 rounded-full flex-1 animate-pulse" />
            </div>

            {/* Story Header */}
            <div className="absolute top-6 left-3 right-3 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={selectedStory.userAvatar}
                  alt={selectedStory.userName}
                  className="w-8 h-8 rounded-full border border-white"
                />
                <div>
                  <p className="text-xs font-bold leading-tight">{selectedStory.userName}</p>
                  <p className="text-[10px] text-slate-300">{selectedStory.timeAgo}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStory(null)}
                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story Image */}
            <div className="relative w-full h-[360px] bg-slate-950">
              <img
                src={selectedStory.images[0]}
                alt={selectedStory.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Story Caption & Action Footer */}
            <div className="p-4 bg-slate-900 space-y-3">
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                &ldquo;{selectedStory.caption}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  📍 {selectedStory.eventTitle}
                </span>

                <button
                  onClick={() => {
                    const evId = selectedStory.eventId;
                    setSelectedStory(null);
                    if (evId) {
                      router.push(`/events/${encodeURIComponent(evId)}`);
                    }
                  }}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span>อยากไปงานนี้ด้วย</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
