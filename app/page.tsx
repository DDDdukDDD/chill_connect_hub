'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { MoodFilterChips, SUB_CATEGORIES_MAP } from '@/components/MoodFilterChips';
import { EventGrid } from '@/components/EventGrid';
import { EventDetailModal } from '@/components/EventDetailModal';
import { MOCK_EVENTS, MOCK_POSTS, EventItem } from '@/data/mockData';
import { Heart, Sprout, Flame, Sparkles, CheckCircle2, Lock, ArrowRight, ArrowDown, ArrowUpDown, RefreshCw, Trophy, Zap, Award } from 'lucide-react';

export default function Home() {
  const [activeNavTab, setActiveNavTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState<'heal' | 'move' | 'chill' | 'learn' | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [catalogFilterTab, setCatalogFilterTab] = useState<'all' | 'trending' | 'new'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [favorites, setFavorites] = useState<string[]>(['1', '7']);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleJoinSuccess = (eventId: string) => {
    setEventsList((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? { ...item, participantsCount: Math.min(item.participantsCount + 1, item.maxParticipants) }
          : item
      )
    );
    showToast('ยินดีด้วย! คุณลงทะเบียนเข้าร่วมกิจกรรมเรียบร้อย 🎉');
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 6);
      setIsLoadingMore(false);
    }, 400);
  };

  // Filtered and Sorted Events (Level 1 Category + Level 2 Sub-category + Catalog Sub-Tab + Search)
  const filteredEvents = useMemo(() => {
    let result = eventsList.filter((event) => {
      // 1. Level 1 Mood Category filter
      const matchesCategory = selectedCategory ? event.category === selectedCategory : true;

      // 2. Level 2 Sub-category filter
      let matchesSubCategory = true;
      if (selectedCategory && selectedSubCategory) {
        const subList = SUB_CATEGORIES_MAP[selectedCategory];
        const matchedSubItem = subList.find((s) => s.id === selectedSubCategory);
        if (matchedSubItem && matchedSubItem.tagQuery) {
          const q = matchedSubItem.tagQuery.toLowerCase();
          matchesSubCategory =
            event.tag.toLowerCase().includes(q) ||
            event.title.toLowerCase().includes(q) ||
            event.description.toLowerCase().includes(q);
        }
      }

      // 3. Catalog Sub-Tab filter (All | Trending | New)
      let matchesCatalogTab = true;
      if (catalogFilterTab === 'trending') {
        matchesCatalogTab = !!event.isTrending;
      } else if (catalogFilterTab === 'new') {
        matchesCatalogTab = !!event.isNew;
      }

      // 4. Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.tag.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q);

      return matchesCategory && matchesSubCategory && matchesCatalogTab && matchesSearch;
    });

    // Sort result
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      result.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    }

    return result;
  }, [eventsList, selectedCategory, selectedSubCategory, catalogFilterTab, searchQuery, sortBy]);

  // Paginated Sliced Events
  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  // Schema.org Event ItemList for Google SEO & Google AI/Gemini Overviews
  const eventListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: eventsList.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.title,
        description: event.description,
        location: {
          "@type": "Place",
          name: event.location,
          address: event.location,
        },
        image: event.image,
        organizer: {
          "@type": "Organization",
          name: event.hostName,
        },
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventListSchema) }}
      />
      
      {/* 1. Header / Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={(status) => {
          setIsLoggedIn(status);
          showToast(status ? 'เข้าสู่ระบบสำเร็จ (Member View)' : 'ออกจากระบบแล้ว (Guest View)');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* 2. Hero Section */}
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <div id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 py-2 md:py-3">
          
          {/* 3. 2-Level Mood-Based & Sub-category Dynamic Filter Chips */}
          <MoodFilterChips
            selectedCategory={selectedCategory}
            setSelectedCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedSubCategory(null);
              setVisibleCount(6);
            }}
            selectedSubCategory={selectedSubCategory}
            setSelectedSubCategory={(subCat) => {
              setSelectedSubCategory(subCat);
              setVisibleCount(6);
            }}
          />

          {/* Sub-Header Bar: Tab Controls (ทั้งหมด | 🔥 ยอดฮิต | 🆕 มาใหม่), Sorting & Counter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
            
            {/* Catalog Filter Tabs */}
            <div className="flex items-center gap-2 bg-[#EBE5DB]/70 p-1.5 rounded-full w-fit">
              {[
                { id: 'all', label: '✨ กิจกรรมทั้งหมด' },
                { id: 'trending', label: '🔥 ยอดฮิต' },
                { id: 'new', label: '🆕 มาใหม่' },
              ].map((tab) => {
                const isActive = catalogFilterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCatalogFilterTab(tab.id as 'all' | 'trending' | 'new');
                      setVisibleCount(6);
                    }}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-white text-[#1E293B] shadow-sm scale-105'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Sorting Dropdown & Favorites Counter */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-xs sm:text-sm">
              
              {/* Smart Sorting Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8E2D8] px-3 py-1.5 rounded-full shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span className="text-[#64748B] font-medium hidden sm:inline">จัดเรียง:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
                  className="bg-transparent font-bold text-[#1E293B] focus:outline-none cursor-pointer"
                >
                  <option value="newest">🆕 ล่าสุด (Newest)</option>
                  <option value="popular">🔥 ความนิยม (Popular)</option>
                </select>
              </div>

              {/* Favorites Counter Shortcut */}
              {favorites.length > 0 && (
                <button
                  onClick={() => {
                    showToast(`คุณมีกิจกรรมโปรด ${favorites.length} รายการ`);
                  }}
                  className="font-semibold text-[#F26430] hover:underline flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#E8E2D8] shadow-xs shrink-0"
                >
                  <Heart className="w-3.5 h-3.5 fill-[#F26430]" />
                  <span>รายการโปรด ({favorites.length})</span>
                </button>
              )}
            </div>

          </div>

          {/* 4. Event Grid Catalog (Sliced Array for Performance & Scalability) */}
          <EventGrid
            events={displayedEvents}
            onSelectEvent={(event) => setSelectedEvent(event)}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />

          {/* 5. Scalable Load More Pagination Control */}
          {filteredEvents.length > visibleCount && (
            <div className="pt-6 pb-2 text-center space-y-3">
              
              {/* Progress bar indicator */}
              <div className="max-w-xs mx-auto space-y-1">
                <div className="text-xs text-[#64748B] font-medium">
                  แสดงแล้ว <span className="font-bold text-[#1E293B]">{displayedEvents.length}</span> จาก <span className="font-bold text-[#1E293B]">{filteredEvents.length}</span> กิจกรรม
                </div>
                <div className="w-full h-1.5 bg-[#E8E2D8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A7C59] rounded-full transition-all duration-300"
                    style={{ width: `${(displayedEvents.length / filteredEvents.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Load More Button */}
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="bg-white hover:bg-[#EBF3ED] text-[#4A7C59] border-2 border-[#4A7C59] px-8 py-3 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#4A7C59]" />
                    <span>กำลังโหลดกิจกรรม...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    <span>ดู กิจกรรมเพิ่มเติม (+6)</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* 6. Social Community Moments Teaser Section (Cross-linking to /moments) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm my-10 space-y-6">
            
            {/* Teaser Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#1E293B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#F26430]" />
                  <span>โมเมนต์ภาพความสนุกจากเพื่อนๆ</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
                  แอบดูภาพบรรยากาศหลังจบกิจกรรมจากชาว Chill & Connect Hub
                </p>
              </div>

              <Link
                href="/moments"
                className="bg-[#4A7C59] hover:bg-[#3B6347] text-[#FAF7F2] px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 shrink-0 active:scale-95"
              >
                <span>ดูโมเมนต์โซเชียลทั้งหมด 📸</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Teaser Cards Grid (3 Recent Posts) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MOCK_POSTS.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  <img src={post.images[0]} alt="Moment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 space-y-1 text-white">
                    <div className="flex items-center gap-2">
                      <img src={post.userAvatar} alt="" className="w-6 h-6 rounded-full border border-white" />
                      <span className="text-xs font-bold truncate">{post.userName}</span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-1 font-medium">{post.caption}</p>
                  </div>
                </div>
              ))}
            </div>

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

      {/* Event Detail Popup Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? favorites.includes(selectedEvent.id) : false}
        onToggleFavorite={toggleFavorite}
        onJoinSuccess={handleJoinSuccess}
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
