'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import {
  MOCK_PROFILES,
  UserProfile,
  getConnectedUserIds,
  toggleUserConnect,
  findProfileByIdOrName,
} from '@/data/profilesData';
import { MOCK_EVENTS, EventItem } from '@/data/mockData';
import { EventDetailModal } from '@/components/EventDetailModal';
import {
  ShieldCheck,
  Award,
  Sparkles,
  Users,
  Calendar,
  Star,
  MapPin,
  MessageCircle,
  ChevronLeft,
  Heart,
  Clock,
  Compass,
  CheckCircle2,
  Edit3,
  Briefcase,
  GraduationCap,
  Building2,
  Home,
  Cake,
  HeartHandshake,
  User,
  Target,
  X,
  Save,
  Info,
} from 'lucide-react';

function ProfileContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id') || 'me';

  const [profile, setProfile] = useState<UserProfile>(() => findProfileByIdOrName(profileId));
  const [activeTab, setActiveTab] = useState<'hosted' | 'moments' | 'badges' | 'reviews'>('hosted');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectsCount, setConnectsCount] = useState<number>(profile.connectsCount);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };


  // Sync profile when query param changes or loaded from local storage
  useEffect(() => {
    let p = findProfileByIdOrName(profileId);
    if (typeof window !== 'undefined' && profileId === 'me') {
      try {
        const savedCustom = localStorage.getItem('userCustomProfile');
        if (savedCustom) {
          p = { ...p, ...JSON.parse(savedCustom) };
        }
      } catch (e) {
        console.error(e);
      }
    }
    setProfile(p);
    setConnectsCount(p.connectsCount);

    if (typeof window !== 'undefined') {
      const connectedIds = getConnectedUserIds();
      setIsConnected(connectedIds.includes(p.id));
    }
  }, [profileId]);

  const isOwnProfile = profile.id === 'me';

  // Toggle Connect Action
  const handleToggleConnect = () => {
    const res = toggleUserConnect(profile.id);
    setIsConnected(res.isConnected);
    setConnectsCount((prev) => prev + res.countDelta);
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    setEditForm({
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      hometown: profile.hometown || '',
      workplace: profile.workplace || '',
      occupation: profile.occupation || '',
      education: profile.education || '',
      gender: profile.gender || 'ชาย (Male)',
      birthday: profile.birthday || '14 กุมภาพันธ์ (28 ปี)',
      relationshipStatus: profile.relationshipStatus || 'โสด (Single)',
      connectGoal: profile.connectGoal || 'หาเพื่อนไปลองคาเฟ่, ตี้บอร์ดเกม & วิ่งสวนเบญจกิติ',
    });
    setIsEditModalOpen(true);
  };

  // Save Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...profile, ...editForm };
    setProfile(updated as UserProfile);
    if (typeof window !== 'undefined' && profile.id === 'me') {
      localStorage.setItem('userCustomProfile', JSON.stringify(editForm));
    }
    setIsEditModalOpen(false);
  };

  // Filter hosted events for this profile
  const hostedEvents = useMemo(() => {
    return MOCK_EVENTS.filter((ev) => {
      if (profile.id === 'host-mind') return ev.id === 'joined-community-2' || ev.hostName.includes('มายด์') || ev.title.includes('Coffee');
      if (profile.id === 'host-karn') return ev.id === 'joined-community-1' || ev.hostName.includes('กานต์') || ev.title.includes('Run');
      if (profile.id === 'host-nut') return ev.title.includes('Craft') || ev.location.includes('สยาม');
      if (profile.id === 'host-som') return ev.title.includes('หนังสือ') || ev.title.includes('Art');
      return ev.id === 'joined-community-1' || ev.id === 'live-agg-38';
    });
  }, [profile.id]);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
      <Navbar
        activeTab="profile"
        setActiveTab={() => {}}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
      />

      <main className="flex-1 pb-20">
        {/* Top Back Navigation Bar & Demo Switcher */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#4A7C59] bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:border-[#4A7C59]/40 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>กลับหน้าหลัก</span>
            </Link>

            {/* Quick Switch Profiles for Demonstration */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">ดูโปรไฟล์ตัวอย่าง:</span>
              <Link
                href="/profile?id=me"
                className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                  profile.id === 'me'
                    ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ฉัน (Me)
              </Link>
              <Link
                href="/profile?id=host-mind"
                className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                  profile.id === 'host-mind'
                    ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                คุณมายด์ ☕
              </Link>
              <Link
                href="/profile?id=host-karn"
                className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                  profile.id === 'host-karn'
                    ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                โค้ชกานต์ 🏃
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Card Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm overflow-hidden animate-fade-in">
            {/* 1. Cover Banner (Clean, Minimal, No Floating Share Button) */}
            <div className="relative h-52 sm:h-72 lg:h-80 w-full bg-slate-800 overflow-hidden">
              <img
                src={profile.coverImage}
                alt="Cover"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>

            {/* 2. Profile Header & Identity Info */}
            <div className="px-5 sm:px-8 lg:px-10 pb-6 pt-0 relative">
              {/* Row: Avatar on Left, Action Buttons on Right */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 lg:-mt-24">
                {/* Avatar with Verified Badge Ring */}
                <div className="relative inline-block self-start">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-3xl object-cover border-4 border-white shadow-xl bg-white shrink-0 ring-1 ring-black/5"
                  />
                  {profile.isVerified && (
                    <div
                      className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-xl shadow-md border-2 border-white flex items-center justify-center cursor-help group"
                      title="ยืนยันตัวตนผ่านเบอร์โทรและบัตรประชาชนแล้ว (KYC Verified 100%)"
                    >
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </div>

                {/* Primary Action Button (Connect or Edit) - Option A */}
                <div className="flex items-center gap-2 self-start sm:self-end pt-1 sm:pt-0">
                  {isOwnProfile ? (
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer active:scale-95 border border-slate-200/80"
                    >
                      <Edit3 className="w-4 h-4 text-[#4A7C59]" />
                      <span>แก้ไขโปรไฟล์</span>
                    </button>
                  ) : (
                    /* Single Minimal 🤝 Connect Button (Option A) */
                    <button
                      type="button"
                      onClick={handleToggleConnect}
                      className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-[#4A7C59] text-white hover:bg-[#3d6849] shadow-[#4A7C59]/25'
                      }`}
                    >
                      <span>{isConnected ? '✓ เป็นเพื่อนแล้ว (Connected)' : '🤝 Connect เชื่อมต่อ'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Name & Handle Block (Clean, No Duplicate Tags or Locations) */}
              <div className="mt-3.5 sm:mt-4 space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1E293B]">
                    {profile.name}
                  </h1>
                  
                  {/* Verified Badge with Sleek Hover Tooltip */}
                  {profile.isVerified && (
                    <div className="relative group inline-flex items-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs cursor-help">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ยืนยันตัวตนแล้ว</span>
                      </span>

                      {/* Hover Tooltip (KYC Verified 100%) */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none w-64">
                        <div className="bg-[#1E293B] text-white text-[11px] font-semibold py-2 px-3 rounded-xl shadow-xl border border-slate-700 text-center leading-relaxed">
                          <p className="font-extrabold text-emerald-400 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>KYC Verified 100%</span>
                          </p>
                          <p className="text-slate-300 text-[10px] mt-0.5">
                            ยืนยันเบอร์โทรศัพท์และบัตรประชาชนเรียบร้อยแล้ว ประวัติความปลอดภัยดีเยี่ยม
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-[#1E293B] rotate-45 -mt-1" />
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-500 font-semibold">{profile.username}</p>

                {/* Bio text */}
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-4xl pt-1">
                  {profile.bio}
                </p>

                {/* 3. Compact & Sleek Activity & Social Metrics Strip (Pure White Minimal) */}
                <div className="inline-flex items-center gap-3 sm:gap-6 flex-wrap py-2 px-3.5 sm:px-4 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-600 mt-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span className="font-black text-[#1E293B]">{connectsCount.toLocaleString()}</span>
                    <span className="text-slate-500 font-medium text-[11px]">Connects</span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#F26430]" />
                    <span className="font-black text-[#1E293B]">{profile.hostedCount}</span>
                    <span className="text-slate-500 font-medium text-[11px]">จัดกิจกรรม</span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-sky-600" />
                    <span className="font-black text-[#1E293B]">{profile.joinedCount}</span>
                    <span className="text-slate-500 font-medium text-[11px]">เข้าร่วม</span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-black text-[#1E293B]">{profile.rating}</span>
                    <span className="text-slate-400 font-normal text-[10.5px]">({profile.reviewsCount} รีวิว)</span>
                  </div>
                </div>
              </div>

              {/* 4. Single Unified "ข้อมูลส่วนตัวและประวัติ (About & Background)" Section (Pure White Clean Box) */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-sm text-[#1E293B] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#4A7C59]" />
                      <span>ข้อมูลส่วนตัวและประวัติ (About & Background)</span>
                    </h4>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="text-xs font-bold text-[#4A7C59] hover:underline flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไขข้อมูล</span>
                      </button>
                    )}
                  </div>

                  {/* 2-Column Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {/* Workplace / Company */}
                      <div className="flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">ที่ทำงาน / องค์กร</span>
                          <span className="font-bold text-[#1E293B]">{profile.workplace || 'ไม่ได้ระบุ'}</span>
                          {profile.occupation && (
                            <span className="text-slate-500 block text-[11px] mt-0.5">({profile.occupation})</span>
                          )}
                        </div>
                      </div>

                      {/* Current Location */}
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#F26430] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">ย่านอาศัยปัจจุบัน</span>
                          <span className="font-bold text-slate-800">{profile.location}</span>
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">เพศ</span>
                          <span className="font-bold text-slate-800">{profile.gender || 'ไม่ระบุ'}</span>
                        </div>
                      </div>

                      {/* Relationship Status */}
                      <div className="flex items-start gap-3">
                        <HeartHandshake className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">สถานะความสัมพันธ์</span>
                          <span className="font-bold text-[#1E293B]">{profile.relationshipStatus || 'ไม่ระบุ'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      {/* Education / University */}
                      <div className="flex items-start gap-3">
                        <GraduationCap className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">การศึกษา</span>
                          <span className="font-bold text-slate-800">{profile.education || 'ไม่ได้ระบุ'}</span>
                        </div>
                      </div>

                      {/* Hometown */}
                      <div className="flex items-start gap-3">
                        <Home className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">บ้านเกิด / จังหวัดเดิม</span>
                          <span className="font-bold text-slate-800">{profile.hometown || 'กรุงเทพมหานคร'}</span>
                        </div>
                      </div>

                      {/* Birthday / Age */}
                      <div className="flex items-start gap-3">
                        <Cake className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">วันเกิด / อายุ</span>
                          <span className="font-bold text-slate-800">{profile.birthday || 'ไม่ได้ระบุ'}</span>
                        </div>
                      </div>

                      {/* Connect Goal */}
                      <div className="flex items-start gap-3">
                        <Target className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold block">เป้าหมายการ Connect</span>
                          <span className="font-bold text-[#1E293B]">{profile.connectGoal || 'เปิดรับเพื่อนใหม่ทุกคน'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passions - Clean Activity Names (No Hashtags) */}
                  <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">สไตล์และกิจกรรมที่ชอบ:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {profile.passions.map((activity, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200/80 hover:bg-emerald-50/60 hover:text-[#4A7C59] hover:border-[#4A7C59]/30 transition-all shadow-2xs"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Profile Content Navigation Tabs (Pure White Seamless) */}
            <div className="border-t border-slate-100 bg-white px-4 sm:px-8 lg:px-10">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('hosted')}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'hosted'
                      ? 'bg-white text-[#1E293B] shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-[#F26430]" />
                  <span>กิจกรรมที่เปิดรับ ({hostedEvents.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('moments')}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'moments'
                      ? 'bg-white text-[#1E293B] shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>โมเมนต์ภาพ ({profile.moments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('badges')}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'badges'
                      ? 'bg-white text-[#1E293B] shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>เหรียญเกียรติยศ ({profile.badges.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'reviews'
                      ? 'bg-white text-[#1E293B] shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>รีวิวจากเพื่อน ({profile.reviews.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: Hosted Activities */}
          {activeTab === 'hosted' && (
            <div className="mt-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] flex items-center gap-2">
                  <span>🎯 กิจกรรมที่จัดหรือชวนเพื่อน</span>
                  <span className="text-xs font-semibold text-slate-500">({hostedEvents.length} รายการ)</span>
                </h3>
              </div>

              {hostedEvents.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-600">ยังไม่มีกิจกรรมที่เปิดรับในขณะนี้</p>
                  <p className="text-xs text-slate-400">กดติดตามเพื่อรับแจ้งเตือนเมื่อโฮสต์สร้างกิจกรรมใหม่</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hostedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="bg-white rounded-3xl border border-[#E8E2D8] hover:border-[#4A7C59]/50 shadow-2xs hover:shadow-md transition-all p-4 flex gap-3.5 cursor-pointer group"
                    >
                      <img
                        src={ev.image}
                        alt={ev.title}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 group-hover:scale-102 transition-transform"
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4A7C59] mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>{ev.date}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{ev.time}</span>
                          </div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#1E293B] line-clamp-2 group-hover:text-[#4A7C59] transition-colors">
                            {ev.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 text-[#F26430] shrink-0" />
                            <span>{ev.location}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            👥 {ev.participantsCount}/{ev.maxParticipants} คน
                          </span>
                          <span className="text-[11px] font-extrabold text-[#F26430] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            <span>ดูรายละเอียด</span>
                            <ChevronLeft className="w-3 h-3 rotate-180" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Moments */}
          {activeTab === 'moments' && (
            <div className="mt-6 space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B]">
                📸 โมเมนต์และความทรงจำ ({profile.moments.length})
              </h3>
              {profile.moments.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-600">ยังไม่มีการแชร์โมเมนต์</p>
                  <p className="text-xs text-slate-400">รูปภาพหลังกิจกรรมจะถูกรวบรวมไว้ที่นี่</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.moments.map((m) => (
                    <div key={m.id} className="bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-2xs">
                      <img src={m.image} alt={m.caption} className="w-full h-48 sm:h-56 object-cover" />
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span className="font-bold text-[#4A7C59]">{m.eventTitle}</span>
                          <span>{m.date}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#1E293B] font-medium leading-relaxed">
                          {m.caption}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold pt-1">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          <span>{m.likesCount} ถูกใจ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Badges */}
          {activeTab === 'badges' && (
            <div className="mt-6 space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B]">
                🏆 เหรียญเกียรติยศและภารกิจที่สำเร็จ ({profile.badges.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {profile.badges.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-3xl bg-white border border-[#E8E2D8] shadow-2xs flex items-start gap-3.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                      {b.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-[#1E293B]">
                          {b.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{b.earnedDate}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Community Reviews */}
          {activeTab === 'reviews' && (
            <div className="mt-6 space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B]">
                ⭐ รีวิวและความประทับใจจากเพื่อนร่วมกิจกรรม ({profile.reviews.length})
              </h3>
              {profile.reviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-600">ยังไม่มีรีวิว</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.reviews.map((r) => (
                    <div key={r.id} className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E2D8] shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={r.reviewerAvatar} alt={r.reviewerName} className="w-9 h-9 rounded-full object-cover border" />
                          <div>
                            <h5 className="font-bold text-xs sm:text-sm text-[#1E293B]">{r.reviewerName}</h5>
                            <span className="text-[10px] text-slate-400">{r.eventTitle} • {r.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-[#475569] leading-relaxed bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8]/80">
                        "{r.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal (สำหรับแก้ไขโปรไฟล์ตัวเอง) */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8E2D8] p-5 sm:p-6 text-left animate-scale-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#4A7C59] flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-[#1E293B]">แก้ไขข้อมูลโปรไฟล์</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อที่แสดง (Display Name)</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#4A7C59]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">คำแนะนำตัว (Bio)</label>
                <textarea
                  rows={2}
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#4A7C59]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ที่ทำงาน / บริษัท</label>
                  <input
                    type="text"
                    value={editForm.workplace || ''}
                    onChange={(e) => setEditForm({ ...editForm, workplace: e.target.value })}
                    placeholder="เช่น Agoda Thailand"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">อาชีพ / บทบาท</label>
                  <input
                    type="text"
                    value={editForm.occupation || ''}
                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                    placeholder="เช่น Software Engineer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">การศึกษา (มหาวิทยาลัย / คณะ)</label>
                <input
                  type="text"
                  value={editForm.education || ''}
                  onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                  placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ย่านอาศัยปัจจุบัน</label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="เช่น สุขุมวิท - อโศก, กรุงเทพฯ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">บ้านเกิด / จังหวัดเดิม</label>
                  <input
                    type="text"
                    value={editForm.hometown || ''}
                    onChange={(e) => setEditForm({ ...editForm, hometown: e.target.value })}
                    placeholder="เช่น เชียงใหม่"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={editForm.gender || 'ชาย (Male)'}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  >
                    <option value="ชาย (Male)">ชาย (Male)</option>
                    <option value="หญิง (Female)">หญิง (Female)</option>
                    <option value="LGBTQ+">LGBTQ+</option>
                    <option value="ไม่ระบุ">ไม่ระบุ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">วันเกิด / อายุ</label>
                  <input
                    type="text"
                    value={editForm.birthday || ''}
                    onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                    placeholder="เช่น 14 กุมภาพันธ์ (28 ปี)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะความสัมพันธ์</label>
                  <select
                    value={editForm.relationshipStatus || 'โสด (Single)'}
                    onChange={(e) => setEditForm({ ...editForm, relationshipStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  >
                    <option value="โสด (Single)">โสด (Single)</option>
                    <option value="มีแฟนแล้ว (In a relationship)">มีแฟนแล้ว (In a relationship)</option>
                    <option value="แต่งงานแล้ว (Married)">แต่งงานแล้ว (Married)</option>
                    <option value="ไม่ระบุ">ไม่ระบุ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เป้าหมายการ Connect</label>
                  <input
                    type="text"
                    value={editForm.connectGoal || ''}
                    onChange={(e) => setEditForm({ ...editForm, connectGoal: e.target.value })}
                    placeholder="เช่น หาเพื่อนลองคาเฟ่ & ตี้บอร์ดเกม"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#4A7C59] hover:bg-[#3d6849] text-white font-extrabold shadow-md shadow-[#4A7C59]/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal if user clicks on hosted event */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isFavorite={false}
          onToggleFavorite={() => {}}
          onJoinSuccess={() => {}}
          onLeaveSuccess={() => {}}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {
          handleSetIsLoggedIn(true);
          showToast('เข้าสู่ระบบสำเร็จ! 🎉');
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว (Guest View)');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs sm:text-sm font-bold flex items-center gap-2 animate-scale-up backdrop-blur-md">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2D8] py-8 text-center text-xs text-[#64748B] space-y-2 mt-auto">
        <p className="font-bold text-[#1E293B]">Chill & Connect Hub • คอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต</p>
        <p className="text-[11px] text-slate-500">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center font-bold text-slate-500">กำลังโหลดโปรไฟล์...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
