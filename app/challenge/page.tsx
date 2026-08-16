'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { MOCK_CHALLENGES, ChallengeQuest } from '@/data/mockData';
import {
  Award,
  Coffee,
  Footprints,
  Users,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Trophy,
  Target,
  Zap,
  Sprout,
  ShieldCheck,
  KeyRound,
  LogIn
} from 'lucide-react';

interface RecommendedChallenge {
  id: string;
  title: string;
  category: 'move' | 'heal' | 'chill' | 'learn';
  iconName: string;
  targetGoal: string;
  badgeLabel: string;
  rewardPoints: number;
  participantsCount: number;
}

const RECOMMENDED_CHALLENGES: RecommendedChallenge[] = [
  {
    id: 'rec-1',
    title: 'HYROX 10K Running Prep',
    category: 'move',
    iconName: 'Flame',
    targetGoal: 'วิ่งสะสมระยะทางครบ 10 กม. ใน 14 วัน',
    badgeLabel: 'HYROX Runner',
    rewardPoints: 250,
    participantsCount: 142,
  },
  {
    id: 'rec-2',
    title: 'Morning Yoga 7 Days Challenge',
    category: 'heal',
    iconName: 'Sparkles',
    targetGoal: 'เล่นโยคะยามเช้าต่อเนื่อง 7 วัน',
    badgeLabel: 'Yoga Spirit',
    rewardPoints: 180,
    participantsCount: 89,
  },
  {
    id: 'rec-3',
    title: 'Board Game Master 3 Matches',
    category: 'chill',
    iconName: 'Target',
    targetGoal: 'เข้าร่วมเล่นบอร์ดเกมครบ 3 ครั้ง',
    badgeLabel: 'Board Game Club',
    rewardPoints: 150,
    participantsCount: 64,
  },
  {
    id: 'rec-4',
    title: 'Handmade Craft & Pottery Creator',
    category: 'learn',
    iconName: 'Zap',
    targetGoal: 'สร้างสรรค์งานคราฟต์ด้วยมือ 2 ชิ้น',
    badgeLabel: 'Craft Master',
    rewardPoints: 200,
    participantsCount: 45,
  },
];

export default function ChallengePage() {
  const [activeNavTab, setActiveNavTab] = useState('challenge');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Default false for guest protection demo
  const [myChallenges, setMyChallenges] = useState<ChallengeQuest[]>(MOCK_CHALLENGES);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'move' | 'heal' | 'chill' | 'learn'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-[#F26430]" />;
      case 'Footprints':
        return <Footprints className="w-5 h-5 text-emerald-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-amber-300" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-emerald-300" />;
      case 'Target':
        return <Target className="w-5 h-5 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-[#F26430]" />;
      default:
        return <Award className="w-5 h-5 text-[#F26430]" />;
    }
  };

  const handleJoinRecommended = (recItem: RecommendedChallenge) => {
    if (!isLoggedIn) {
      showToast('🔒 กรุณาเข้าสู่ระบบก่อนเข้าร่วมชาเลนจ์');
      return;
    }
    const newQuest: ChallengeQuest = {
      id: `joined-${Date.now()}`,
      title: recItem.title,
      iconName: recItem.iconName,
      progressPercent: 10,
      current: '1',
      total: recItem.targetGoal.match(/\d+/)?.[0] || '5',
      badgeLabel: recItem.badgeLabel,
      completedCountInfo: `ทำสำเร็จแล้ว 1/${recItem.targetGoal.match(/\d+/)?.[0] || '5'}`,
    };

    setMyChallenges([newQuest, ...myChallenges]);
    showToast(`เข้าร่วมชาเลนจ์ "${recItem.title}" เรียบร้อยแล้ว! 🎯`);
  };

  const filteredRecommended = selectedCategory === 'all'
    ? RECOMMENDED_CHALLENGES
    : RECOMMENDED_CHALLENGES.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans selection:bg-[#F26430] selection:text-white">
      
      {/* Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={(status) => {
          setIsLoggedIn(status);
          showToast(status ? 'เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับสู่ระบบชาเลนจ์ 🏆' : 'ออกจากระบบแล้ว');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Dedicated Hero Header Banner */}
        <section className="bg-[#1E293B] text-white py-10 sm:py-14 relative overflow-hidden border-b border-slate-700/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/80 px-3.5 py-1 rounded-full border border-amber-500/30">
                <Trophy className="w-3.5 h-3.5" />
                <span>Gamification & Rewards Hub</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                ชาเลนจ์ & สะสม Badges 🏆
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                ร่วมทำภารกิจยามว่าง เพิ่มความสนุกในการทำกิจกรรม พร้อมรับตราเกียรติยศและสิทธิประโยชน์พิเศษ
              </p>
            </div>

            {/* User Stats Card */}
            {isLoggedIn ? (
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 shrink-0 space-y-2 text-center md:text-right">
                <p className="text-xs text-slate-400">ตราเกียรติยศที่คุณสะสมแล้ว</p>
                <div className="flex items-center justify-center md:justify-end gap-2 text-amber-300 font-bold text-lg">
                  <Award className="w-6 h-6 text-amber-400" />
                  <span>4 Badges (Level 3 Explorer)</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsLoggedIn(true)}
                className="bg-[#F26430] hover:bg-[#D95322] text-white px-6 py-3 rounded-full font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบเพื่อสะสมแต้ม</span>
              </button>
            )}
          </div>
        </section>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          
          {/* REQUIRE LOGIN GUARD FOR CHALLENGE DATA */}
          {!isLoggedIn ? (
            /* Locked Guest Screen */
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#E8E2D8] text-center max-w-3xl mx-auto space-y-6 my-6">
              <div className="w-20 h-20 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                <Lock className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[#F26430] uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  Members Only Access
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                  🔒 หน้านี้สำหรับสมาชิกเท่านั้น!
                </h2>
                <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto leading-relaxed">
                  กรุณาเข้าสู่ระบบเพื่อเริ่มทำภารกิจชาเลนจ์ยามว่าง สะสมเลเวล Badges เกียรติยศ และติดตามสถิติส่วนบุคคลของคุณ
                </p>
              </div>

              {/* Benefits Preview List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2 pb-2">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">🏆</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">สะสม Badges</h4>
                  <p className="text-[11px] text-[#64748B]">ปลดล็อกตราเกียรติยศมากกว่า 12 รูปแบบ</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">⚡</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">ติดตามความคืบหน้า</h4>
                  <p className="text-[11px] text-[#64748B]">บันทึกสถิติการวิ่ง โยคะ และกิจกรรม</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2DCD2] space-y-1">
                  <div className="text-xl">🎁</div>
                  <h4 className="font-bold text-xs text-[#1E293B]">รับส่วนลดพิเศษ</h4>
                  <p className="text-[11px] text-[#64748B]">ใช้คะแนนสะสมแลกตั๋วเวิร์กช็อป</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-[#F26430]/30 inline-flex items-center gap-2 active:scale-95"
                >
                  <KeyRound className="w-5 h-5" />
                  <span>เข้าสู่ระบบเพื่อเริ่มเล่นชาเลนจ์ ➔</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged-In User Challenge Content */
            <>
              {/* SECTION 1: 🔥 ชาเลนจ์ที่คุณกำลังเข้าร่วม */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
                    <Zap className="w-6 h-6 text-[#F26430]" />
                    <span>ชาเลนจ์ที่คุณกำลังเข้าร่วม ({myChallenges.length} รายการ)</span>
                  </h2>
                  <span className="text-xs text-[#64748B] font-semibold">อัปเดตอัตโนมัติ</span>
                </div>

                <div className="space-y-4">
                  {myChallenges.map((quest, idx) => (
                    <div
                      key={quest.id}
                      className="bg-white rounded-2xl p-5 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-[280px]">
                        <span className="text-base font-bold text-[#94A3B8] w-5 text-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="w-11 h-11 bg-[#FAF7F2] border border-[#E2DCD2] rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                          {getIcon(quest.iconName)}
                        </div>

                        <div>
                          <h4 className="font-bold text-base text-[#1E293B]">
                            {quest.title}
                          </h4>
                          <span className="text-xs text-[#F26430] font-semibold">
                            🏅 {quest.badgeLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 max-w-md w-full space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
                          <span>ความคืบหน้า</span>
                          <span>{quest.progressPercent}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                          <div
                            className="h-full bg-gradient-to-r from-[#4A7C59] to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${quest.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{quest.completedCountInfo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 2: 🎯 ชาเลนจ์แนะนำตามหมวดหมู่ที่คุณสนใจ */}
              <section className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
                      <Target className="w-6 h-6 text-[#4A7C59]" />
                      <span>ชาเลนจ์แนะนำตามหมวดหมู่ที่คุณสนใจ</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
                      เลือกเข้าร่วมภารกิจใหม่ๆ เพื่อรับแต้มรางวัลและ Badges เกียรติยศ
                    </p>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'all', label: '✨ ทั้งหมด' },
                      { id: 'move', label: '🏃 สายออกกำลัง' },
                      { id: 'heal', label: '🌱 สายฮีลใจ' },
                      { id: 'chill', label: '☕ สายชิลล์' },
                      { id: 'learn', label: '🎨 สายคราฟต์' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
                          selectedCategory === cat.id
                            ? 'bg-[#4A7C59] text-white border-[#4A7C59]'
                            : 'bg-white text-[#475569] border-[#E2DCD2] hover:border-[#4A7C59]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredRecommended.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-[#FAF7F2] border border-[#E2DCD2] rounded-2xl flex items-center justify-center shadow-xs">
                            {getIcon(rec.iconName)}
                          </div>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            +{rec.rewardPoints} Points
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-base text-[#1E293B] leading-snug">
                            {rec.title}
                          </h4>
                          <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                            {rec.targetGoal}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#64748B] font-medium">
                          <span>รางวัล: 🏅 {rec.badgeLabel}</span>
                          <span>{rec.participantsCount} คนทำอยู่</span>
                        </div>

                        <button
                          onClick={() => handleJoinRecommended(rec)}
                          className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-2.5 rounded-full font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>เข้าร่วมชาเลนจ์นี้</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3: 🏆 ตู้สะสม Badges & เกียรติยศ */}
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>คลัง Badges ที่คุณปลดล็อกแล้ว</span>
                  </h3>
                  <span className="text-xs text-[#4A7C59] font-bold">4 / 12 Badges</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { title: 'HYROX Warrior', desc: 'ผ่านกิจกรรม Hyrox 4 สถานี', icon: '🔥', unlocked: true },
                    { title: 'Cafe Explorer', desc: 'เช็กอินคาเฟ่ครบ 5 แห่ง', icon: '☕', unlocked: true },
                    { title: 'Active Walker', desc: 'เดินครบ 30 วัน', icon: '👟', unlocked: true },
                    { title: 'Digital Detox', desc: 'พักหน้าจอครบ 3 ชม.', icon: '🧘', unlocked: true },
                  ].map((badge, idx) => (
                    <div key={idx} className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E2DCD2] text-center space-y-1.5">
                      <div className="text-3xl">{badge.icon}</div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1E293B]">{badge.title}</h4>
                      <p className="text-[10px] text-[#64748B]">{badge.desc}</p>
                      <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Unlocked
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-12 mb-16 sm:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1E293B]">
          <Sprout className="w-5 h-5 text-[#4A7C59]" />
          <span>Chill & Connect Hub</span>
        </div>
        <p>© 2026 Chill & Connect Hub - ฮีลใจ & เชื่อมต่อ ฮับ. All rights reserved.</p>
      </footer>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={0}
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
