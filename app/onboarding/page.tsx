'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Users,
  Compass,
  Heart,
  Building2,
  Palette,
  Briefcase,
  Trophy,
  CheckCircle2,
  Activity,
  Award,
  ShieldCheck,
  Lock,
} from 'lucide-react';

// Step 1 Options: Goals & Roles (Member vs Host/Venue)
const GOAL_OPTIONS = [
  // Group 1: Member / Participant
  {
    id: 'find_friends',
    role: 'member',
    group: '👥 สำหรับสมาชิก & ผู้เข้าร่วม',
    icon: Users,
    title: 'หาเพื่อนใหม่คอเดียวกัน',
    desc: 'นัดกินกาแฟ เล่นบอร์ดเกม แฮงเอาต์กับเพื่อนไลฟ์สไตล์ตรงกัน',
  },
  {
    id: 'sports_party',
    role: 'member',
    group: '👥 สำหรับสมาชิก & ผู้เข้าร่วม',
    icon: Activity,
    title: 'หาตี้ออกกำลังกาย / กีฬา',
    desc: 'ชวนกันวิ่งรอบสวน ปั่นจักรยาน ตีแบด มีเพื่อนกระตุ้นไม่เหงา',
  },
  {
    id: 'healing_weekend',
    role: 'member',
    group: '👥 สำหรับสมาชิก & ผู้เข้าร่วม',
    icon: Heart,
    title: 'หาที่พักผ่อนฮีลใจวันหยุด',
    desc: 'นิทรรศการศิลปะ, Sound bath, คาเฟ่ธรรมชาติ เติมพลังบวก',
  },
  {
    id: 'explore_events',
    role: 'member',
    group: '👥 สำหรับสมาชิก & ผู้เข้าร่วม',
    icon: Compass,
    title: 'ตามหาอีเวนต์ & งานแฟร์ใหญ่',
    desc: 'มหกรรมหนังสือ งานกาแฟ งานคราฟต์ คอนเสิร์ตใหญ่ไม่ตกเทรนด์',
  },

  // Group 2: Host / Venue / Organizer
  {
    id: 'community_host',
    role: 'host',
    group: '🌟 สำหรับโฮสต์ & ผู้ประกอบการจัดงาน',
    icon: Sparkles,
    title: 'ฉันเป็นโฮสต์ / อยากเปิดตี้กิจกรรม',
    desc: 'เปิดตี้บอร์ดเกม นำทีมวิ่ง นัดดริปกาแฟ จัดมีทติ้งกลุ่มย่อย',
  },
  {
    id: 'venue_space',
    role: 'venue',
    group: '🌟 สำหรับโฮสต์ & ผู้ประกอบการจัดงาน',
    icon: Building2,
    title: 'สถานที่ / คาเฟ่ / แกลเลอรี',
    desc: 'มีพื้นที่หน้าร้าน อยากดึงกลุ่มคนรุ่นใหม่เข้ามาทำกิจกรรมร่วมกัน',
  },
  {
    id: 'workshop_creator',
    role: 'host',
    group: '🌟 สำหรับโฮสต์ & ผู้ประกอบการจัดงาน',
    icon: Palette,
    title: 'ผู้จัดเวิร์กช็อป & สตูดิโอศิลปะ',
    desc: 'คลาสศิลปะ งานฝีมือ ปั้นเซรามิก สัมมนาสร้างสรรค์',
  },
  {
    id: 'event_organizer',
    role: 'organizer',
    group: '🌟 สำหรับโฮสต์ & ผู้ประกอบการจัดงาน',
    icon: Briefcase,
    title: 'ผู้จัดงานอีเวนต์ & แบรนด์พาร์ตเนอร์',
    desc: 'โปรโมตงานแฟร์ งานวิ่ง นิทรรศการ และเชื่อมต่อผู้สนับสนุน',
  },
];

// Step 3: Bangkok Zones (Balanced 6 Zones)
const BANGKOK_ZONES = [
  { id: 'siam_silom', label: '🏙️ สยาม - สามย่าน - สีลม' },
  { id: 'ari_chatuchak', label: '☕ อารีย์ - พญาไท - จตุจักร' },
  { id: 'sukhumvit_ekkamai', label: '🌳 สุขุมวิท - เอกมัย - เบญจกิติ' },
  { id: 'thonburi_riverside', label: '🌉 ฝั่งธนฯ - เจริญกรุง - แม่น้ำ' },
  { id: 'bangna_bitec', label: '🛍️ บางนา - ศรีนครินทร์ (BITEC)' },
  { id: 'north_impact', label: '🏟️ รังสิต - แจ้งวัฒนะ (IMPACT)' },
];

// Step 4: Visual Interests (12 Balanced Lifestyle Items)
const INTEREST_OPTIONS = [
  { id: 'coffee', label: 'Specialty Coffee & Drip', icon: '☕' },
  { id: 'boardgames', label: 'บอร์ดเกม & การ์ดเกม', icon: '🎲' },
  { id: 'running', label: 'City Run & จ็อกกิ้งสวน', icon: '🏃' },
  { id: 'art_pottery', label: 'เวิร์กช็อป & เซรามิก', icon: '🎨' },
  { id: 'yoga_soundbath', label: 'โยคะ & Sound Bath', icon: '🧘' },
  { id: 'bookclub', label: 'บุ๊กคลับ & แลกเปลี่ยนมุมมอง', icon: '📚' },
  { id: 'foodie', label: 'Cafe Hopping & ของอร่อย', icon: '🍜' },
  { id: 'photo', label: 'Street Photo & ถ่ายฟิล์ม', icon: '📸' },
  { id: 'popculture', label: 'Pop Culture & อนิเมะ', icon: '🎮' },
  { id: 'exhibitions', label: 'นิทรรศการ & แกลเลอรี', icon: '🏛️' },
  { id: 'indie_music', label: 'คอนเสิร์ตอินดี้ & ดนตรีสด', icon: '🎵' },
  { id: 'badminton', label: 'แบดมินตัน & กีฬากลุ่ม', icon: '🏸' },
];

export default function OnboardingPage() {
  const router = useRouter();

  // Current Step: 0 to 5
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form State
  const [authMethod, setAuthMethod] = useState<'google' | 'apple' | 'facebook' | 'email'>('google');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['find_friends']);
  const [userRole, setUserRole] = useState<'member' | 'host' | 'venue' | 'organizer'>('member');
  
  // Step 2 Demographics
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [birthYear, setBirthYear] = useState('2000');
  const [gender, setGender] = useState<'male' | 'female' | 'lgbtq' | 'unspecified'>('unspecified');
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Step 3 Vibe & Zones
  const [energyLevel, setEnergyLevel] = useState<'introvert' | 'ambivert' | 'extrovert'>('ambivert');
  const [selectedZones, setSelectedZones] = useState<string[]>(['sukhumvit_ekkamai', 'ari_chatuchak']);

  // Step 4 Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['coffee', 'boardgames', 'exhibitions']);

  // Avatars
  const AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  ];

  // Auto detect user role when goal is toggled
  const handleGoalToggle = (goalId: string) => {
    let next: string[];
    if (selectedGoals.includes(goalId)) {
      if (selectedGoals.length === 1) return; // Keep at least one
      next = selectedGoals.filter((g) => g !== goalId);
    } else {
      next = [...selectedGoals, goalId];
    }
    setSelectedGoals(next);

    const hasHostGoal = next.some((g) => {
      const opt = GOAL_OPTIONS.find((o) => o.id === g);
      return opt && opt.role !== 'member';
    });

    if (hasHostGoal) {
      const hostOpt = GOAL_OPTIONS.find((o) => next.includes(o.id) && o.role !== 'member');
      if (hostOpt) setUserRole(hostOpt.role as any);
    } else {
      setUserRole('member');
    }
  };

  const handleInterestToggle = (id: string) => {
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length === 1) return;
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleZoneToggle = (id: string) => {
    if (selectedZones.includes(id)) {
      if (selectedZones.length === 1) return;
      setSelectedZones(selectedZones.filter((z) => z !== id));
    } else {
      setSelectedZones([...selectedZones, id]);
    }
  };

  // Complete Onboarding & Save Profile
  const handleCompleteOnboarding = () => {
    const finalName = displayName.trim() || (authMethod === 'google' ? 'คุณส้ม (Google)' : authMethod === 'apple' ? 'คุณส้ม (Apple ID)' : 'คุณสมาชิกใหม่');
    
    const profile = {
      name: finalName,
      email: email || `${finalName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      role: userRole,
      avatar: AVATARS[avatarIndex],
      birthYear,
      age: new Date().getFullYear() - parseInt(birthYear, 10),
      gender,
      energyLevel,
      zones: selectedZones,
      interests: selectedInterests,
      goals: selectedGoals,
      badges: userRole !== 'member' 
        ? ['🌟 Verified Community Host Starter', '🌱 First Step Connect']
        : ['🌱 First Step Connect'],
      connectPoints: 50,
      joinedDate: new Date().toISOString(),
    };

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', finalName);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userProfile', JSON.stringify(profile));

    router.push('/myhub?welcome=true');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col justify-between selection:bg-[#F26430] selection:text-white">
      
      {/* Top Header */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4A7C59] to-emerald-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-xs sm:text-sm text-[#1E293B] block leading-tight">
              Chill & Connect Hub
            </span>
            <span className="text-[10px] font-bold text-[#4A7C59]">Bangkok Lifestyle Community</span>
          </div>
        </Link>

        {/* Step Progress Indicators */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">ขั้นตอน</span>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === currentStep
                    ? 'w-6 sm:w-8 bg-[#F26430]'
                    : s < currentStep
                    ? 'w-2 sm:w-2.5 bg-[#4A7C59]'
                    : 'w-2 sm:w-2.5 bg-slate-200'
                }`}
              />
            ))}
            <span className="text-xs font-black text-slate-700 ml-1">{currentStep}/4</span>
          </div>
        )}

        <Link
          href="/"
          className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          ข้าม ✕
        </Link>
      </header>

      {/* Main Multi-Step Canvas */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-center">
        
        {/* Unified Card Container with Stable Minimum Height for Visual Consistency */}
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-xl p-5 sm:p-8 flex flex-col justify-between min-h-[580px] sm:min-h-[620px] transition-all">
          
          {/* ======================================================== */}
          {/* STEP 0: CHOOSE SIGN UP METHOD */}
          {/* ======================================================== */}
          {currentStep === 0 && (
            <div className="flex flex-col justify-between flex-1 space-y-6 text-center animate-fade-in">
              <div className="space-y-3 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4A7C59] to-emerald-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    ยินดีต้อนรับสู่ Chill & Connect Hub ✨
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                    สร้างโปรไฟล์ไลฟ์สไตล์ของคุณ ค้นหากิจกรรมฮีลใจ นัดตี้ทำกิจกรรม และเจอเพื่อนใหม่คอเดียวกันในกรุงเทพฯ
                  </p>
                </div>
              </div>

              {/* Social Signup Stack */}
              <div className="space-y-2.5 max-w-sm w-full mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('google');
                    setDisplayName('คุณส้ม (Google)');
                    setCurrentStep(1);
                  }}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all border border-slate-300 shadow-2xs flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>สมัครสมาชิกด้วย Google (Gmail)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('apple');
                    setDisplayName('คุณส้ม (Apple ID)');
                    setCurrentStep(1);
                  }}
                  className="w-full bg-black hover:bg-slate-900 text-white py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-2xs flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.43-6.22-9.59-11.05-20.2-14.49-31.84-3.44-11.64-5.16-22.39-5.16-32.25 0-14.16 3.69-25.79 11.08-34.89 7.39-9.1 16.59-13.78 27.59-14.05 4.9 0 10.3 1.25 16.2 3.75 5.9 2.5 9.78 3.86 11.64 4.07 1.86-.21 5.86-1.63 12-4.26 6.14-2.63 11.53-3.79 16.19-3.48 11.24.78 20.35 5.25 27.32 13.41-9.8 5.88-14.61 14.28-14.43 25.19.18 8.82 3.52 16.16 10.01 22.02 6.49 5.86 14.16 9.17 23.01 9.94-2.18 6.64-4.8 13.06-7.86 19.26zM119.22 33.64c0-6.93 2.56-13.53 7.69-19.81 5.13-6.28 11.45-10.29 18.96-12.03.43 1.95.65 3.86.65 5.73 0 7.04-2.71 13.73-8.13 20.08-5.42 6.35-11.95 10.19-19.59 11.52-.43-1.84-.65-3.67-.65-5.49z"/>
                  </svg>
                  <span>สมัครสมาชิกด้วย Apple ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('facebook');
                    setDisplayName('คุณส้ม (Facebook)');
                    setCurrentStep(1);
                  }}
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-2xs flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>สมัครสมาชิกด้วย Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    setCurrentStep(1);
                  }}
                  className="w-full bg-[#FAF7F2] hover:bg-slate-100 text-slate-700 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>ใช้อีเมลและรหัสผ่าน</span>
                </button>
              </div>

              {/* Trust & Safe Community Note */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe Community 100% • ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: WHAT BRINGS YOU HERE (GOALS & ROLES) */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="flex flex-col justify-between flex-1 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#F26430] uppercase tracking-wider">Step 1 of 4 • วัตถุประสงค์</span>
                  <span className="text-[11px] font-bold text-slate-400">เลือกได้มากกว่า 1 ข้อ</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  อะไรพาคุณมาที่ Chill & Connect Hub? 🎯
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  บอกเป้าหมายของคุณ เพื่อให้ระบบคัดสรรอีเวนต์และฟีเจอร์ที่ตรงใจที่สุด
                </p>
              </div>

              {/* Goals Cards (2 Balanced Sub-Grids) */}
              <div className="space-y-3.5 overflow-y-auto max-h-[380px] sm:max-h-none pr-1">
                {/* Members Section */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    👥 สำหรับสมาชิก & ผู้เข้าร่วมกิจกรรม
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GOAL_OPTIONS.filter((o) => o.role === 'member').map((opt) => {
                      const isSelected = selectedGoals.includes(opt.id);
                      const Icon = opt.icon;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleGoalToggle(opt.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                            isSelected
                              ? 'bg-emerald-50/50 border-[#4A7C59] ring-2 ring-[#4A7C59]/20 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-[#E8E2D8]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#4A7C59] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-xs text-slate-900 leading-tight truncate">{opt.title}</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{opt.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hosts & Venues Section */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>🌟 สำหรับโฮสต์ & ผู้ประกอบการจัดงาน</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GOAL_OPTIONS.filter((o) => o.role !== 'member').map((opt) => {
                      const isSelected = selectedGoals.includes(opt.id);
                      const Icon = opt.icon;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleGoalToggle(opt.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                            isSelected
                              ? 'bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-[#E8E2D8]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-xs text-slate-900 leading-tight truncate">{opt.title}</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{opt.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ถัดไป: ข้อมูลของคุณ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: LET'S GET TO KNOW YOU (DEMOGRAPHICS & PROFILE) */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="flex flex-col justify-between flex-1 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-[#F26430] uppercase tracking-wider">Step 2 of 4 • ข้อมูลส่วนตัว</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  มารู้จักกันหน่อยนะ ✨
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  ข้อมูลนี้ช่วยให้เพื่อนๆ ในคอมมูนิตี้จดจำคุณได้ และช่วยแนะนำกลุ่มที่เข้ากันได้ดี
                </p>
              </div>

              <div className="space-y-4">
                {/* Avatar Picker Row */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">เลือกรูปโปรไฟล์ของคุณ:</label>
                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarIndex(idx)}
                        className={`relative w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          avatarIndex === idx ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/30 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                        {avatarIndex === idx && (
                          <div className="absolute inset-0 bg-[#4A7C59]/40 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Name Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {userRole !== 'member' ? 'ชื่อที่ใช้แสดง / ชื่อเพจ / ชื่อสถานที่:' : 'ชื่อเล่นหรือชื่อที่ใช้แสดง (Display Name):'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={userRole !== 'member' ? 'เช่น Craft & Chill Studio หรือ Som Drip' : 'เช่น คุณส้ม (Som_Chill)'}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59]"
                    />
                  </div>
                </div>

                {/* Birth Year & Gender 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">ปีเกิด (ค.ศ. Birth Year):</label>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                    >
                      {Array.from({ length: 60 }, (_, i) => 2010 - i).map((y) => (
                        <option key={y} value={y}>
                          ค.ศ. {y} (อายุ ~{new Date().getFullYear() - y} ปี)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">เพศ (สำหรับกิจกรรมเฉพาะกลุ่ม):</label>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'female', label: '👩 หญิง' },
                        { id: 'male', label: '👨 ชาย' },
                        { id: 'lgbtq', label: '🏳️‍🌈 LGBTQ+' },
                        { id: 'unspecified', label: '✨ ไม่ระบุ' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGender(g.id as any)}
                          className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            gender === g.id
                              ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-2xs'
                              : 'bg-[#FAF7F2] text-slate-700 border-[#E8E2D8] hover:bg-slate-100'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ถัดไป: สไตล์ & โซนโปรด</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: VIBE & HANGOUT ZONES */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="flex flex-col justify-between flex-1 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-[#F26430] uppercase tracking-wider">Step 3 of 4 • สไตล์ & พิกัด</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  ระดับพลังงาน & โซนที่คุณสะดวก 📍
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  เพื่อให้ระบบคัดกรองกิจกรรมที่มี Vibe สบายใจและอยู่ในพิกัดที่คุณเดินทางสะดวก
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Energy Level (3 Equal Width Cards) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">ระดับพลังงานสังคม (Social Energy):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        id: 'introvert',
                        icon: '🌿',
                        title: 'Introvert / ชิลล์',
                        desc: 'ชอบกลุ่มเล็ก 4-6 คน คุยสบายๆ เงียบสงบ',
                      },
                      {
                        id: 'ambivert',
                        icon: '⚖️',
                        title: 'Ambivert / ยืดหยุ่น',
                        desc: 'แล้วแต่วัน กลุ่มเล็กก็ได้ งานใหญ่ก็สนุก',
                      },
                      {
                        id: 'extrovert',
                        icon: '🔥',
                        title: 'Extrovert / สายลุย',
                        desc: 'ชอบคนเยอะๆ มีพลังงานสูง คุยสนุกเฮฮา',
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setEnergyLevel(item.id as any)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                          energyLevel === item.id
                            ? 'bg-emerald-50/50 border-[#4A7C59] shadow-2xs ring-2 ring-[#4A7C59]/20'
                            : 'bg-white hover:bg-slate-50 border-[#E8E2D8]'
                        }`}
                      >
                        <div>
                          <span className="text-xl block mb-1">{item.icon}</span>
                          <h4 className="font-extrabold text-xs text-slate-900">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full border self-end mt-2 flex items-center justify-center ${
                          energyLevel === item.id ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-300'
                        }`}>
                          {energyLevel === item.id && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bangkok Zones (2-Column Grid) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    โซนที่คุณสะดวกไปบ่อยๆ (เลือกได้มากกว่า 1 ข้อ):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {BANGKOK_ZONES.map((zone) => {
                      const isSelected = selectedZones.includes(zone.id);
                      return (
                        <div
                          key={zone.id}
                          onClick={() => handleZoneToggle(zone.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                            isSelected
                              ? 'bg-emerald-50/80 border-[#4A7C59] text-emerald-950 font-bold shadow-2xs'
                              : 'bg-white border-[#E8E2D8] text-slate-700 font-medium hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs truncate">{zone.label}</span>
                          {isSelected ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="bg-[#F26430] hover:bg-[#D95322] text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ถัดไป: หมวดหมู่ความสนใจ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: PICK YOUR INTERESTS (BALANCED 12-GRID) */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="flex flex-col justify-between flex-1 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-[#F26430] uppercase tracking-wider">Step 4 of 4 • ความสนใจ</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  เลือกกิจกรรมที่คุณชอบ 🎨
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  เลือกอย่างน้อย 3 หมวดหมู่ เพื่อให้ AI คัดสรรกิจกรรมที่เข้ากับคุณที่สุด
                </p>
              </div>

              <div className="space-y-3">
                {/* 12 Visual Cards in 2/3-Column Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[340px] sm:max-h-none pr-1">
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleInterestToggle(item.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-emerald-50/70 border-[#4A7C59] ring-2 ring-[#4A7C59]/20 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border-[#E8E2D8]'
                        }`}
                      >
                        <span className="text-lg shrink-0">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold block truncate ${isSelected ? 'text-[#4A7C59]' : 'text-slate-800'}`}>
                            {item.label}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#4A7C59] stroke-[3] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>เลือกแล้ว {selectedInterests.length} หมวดหมู่ (AI จัดเตรียมฟีดแนะนำพร้อมแล้ว)</span>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>เสร็จสิ้น: รับเหรียญต้อนรับ!</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: WELCOME CARD & REWARD REVEAL */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="flex flex-col justify-between flex-1 space-y-4 text-center animate-scale-up">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>ยินดีต้อนรับสู่ครอบครัว Chill & Connect Hub 🎉</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  โปรไฟล์ของคุณพร้อมแล้ว! ✨
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  ระบบได้จัดเตรียมกิจกรรมที่ตรงกับไลฟ์สไตล์และพิกัดของคุณไว้เรียบร้อยแล้ว
                </p>
              </div>

              {/* 3D Glassmorphism Digital Member Passport */}
              <div className="max-w-sm w-full mx-auto bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white p-5 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden text-left space-y-3.5">
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#4A7C59]/30 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#F26430]/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">
                      C
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-300 tracking-wider">CHILL & CONNECT PASSPORT</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    userRole !== 'member'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {userRole !== 'member' ? '⭐ Host / Venue' : '🌱 Member'}
                  </span>
                </div>

                {/* User Row */}
                <div className="flex items-center gap-3 relative z-10 pt-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md shrink-0">
                    <img src={AVATARS[avatarIndex]} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white leading-tight truncate">
                      {displayName.trim() || 'คุณส้ม (Member)'}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>Vibe: {energyLevel === 'introvert' ? '🌿 Introvert ชิลล์' : energyLevel === 'extrovert' ? '🔥 Extrovert สายลุย' : '⚖️ Ambivert'}</span>
                    </p>
                  </div>
                </div>

                {/* Interests Pills */}
                <div className="relative z-10 pt-1 border-t border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ความสนใจที่คุณเลือก:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedInterests.slice(0, 4).map((i) => {
                      const opt = INTEREST_OPTIONS.find((o) => o.id === i);
                      return (
                        <span key={i} className="text-[10px] font-bold bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10">
                          {opt?.icon} {opt?.label.split('&')[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Reward Box */}
                <div className="relative z-10 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-300">
                        {userRole !== 'member' ? '🌟 Verified Host Starter' : '🌱 First Step Connect'}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-900/60 px-1.5 py-0.2 rounded-md">
                        +50 Points
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">เหรียญเกียรติยศก้าวแรกสู่คอมมูนิตี้</p>
                  </div>
                </div>
              </div>

              {/* Launch CTA Button */}
              <div className="pt-2 max-w-sm w-full mx-auto space-y-2">
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="w-full bg-gradient-to-r from-[#F26430] to-orange-500 hover:from-[#D95322] hover:to-orange-600 text-white py-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-[#F26430]/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{userRole !== 'member' ? '🚀 เข้าสู่แดชบอร์ด & สร้างกิจกรรมแรก' : '🚀 เริ่มออกสำรวจกิจกรรมสำหรับคุณ'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-400">
                  คุณสามารถแก้ไขข้อมูลโปรไฟล์และความสนใจได้ตลอดเวลาในหน้า MyHub
                </p>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-[11px] text-slate-400 border-t border-[#E8E2D8] bg-white/50">
        Chill & Connect Hub © 2026 • Bangkok Social & Community Platform
      </footer>

    </div>
  );
}
