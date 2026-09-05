'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  MapPin,
  Check,
  Loader2,
  Info,
  AlertCircle,
} from 'lucide-react';
import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { BrandLogo } from '@/components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'terms' | 'privacy'>('terms');

  // Sign-Up Popup Modal States (When user clicks 'สมัครสมาชิกใหม่' on login page)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isEmailSignUpMode, setIsEmailSignUpMode] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLocation, setSignUpLocation] = useState('Bangkok, TH');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(true);
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [isVerifyingHuman, setIsVerifyingHuman] = useState(false);
  const [signUpError, setSignUpError] = useState('');

  const handleLogin = (displayName: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', displayName);
    router.push('/myhub');
  };

  const isFormValid = email.trim().length > 0 && email.includes('@') && password.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const finalName = email.split('@')[0] || 'คุณสมาชิก';
    handleLogin(finalName);
  };

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!signUpPassword) return 0;
    if (signUpPassword.length >= 10 && /[A-Z]/.test(signUpPassword) && /\d/.test(signUpPassword)) return 3;
    if (signUpPassword.length >= 8) return 2;
    return 1;
  }, [signUpPassword]);

  // Interactive Human Check Handler
  const handleToggleHumanCheck = () => {
    if (isHumanVerified) {
      setIsHumanVerified(false);
      return;
    }
    setIsVerifyingHuman(true);
    setTimeout(() => {
      setIsVerifyingHuman(false);
      setIsHumanVerified(true);
    }, 600);
  };

  // Social Sign Up from Modal
  const handleSocialSignUp = (method: 'google' | 'apple' | 'facebook') => {
    let name = 'คุณส้ม (Google)';
    if (method === 'apple') name = 'คุณส้ม (Apple ID)';
    if (method === 'facebook') name = 'คุณส้ม (Facebook)';
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', name);
    setIsSignUpModalOpen(false);
    router.push('/onboarding');
  };

  // Email Sign Up Form Submit from Modal
  const handleEmailSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setSignUpError('กรุณากรอกชื่อของคุณ');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setSignUpError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 8) {
      setSignUpError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (!isAgeConfirmed) {
      setSignUpError('กรุณายืนยันว่าคุณมีอายุ 18 ปีขึ้นไป');
      return;
    }
    if (!isHumanVerified) {
      setSignUpError('กรุณากดยืนยันว่าคุณเป็นมนุษย์ (Human Check)');
      return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', signUpName.trim());
    setIsSignUpModalOpen(false);
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col justify-between selection:bg-[#F26430] selection:text-white">
      
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <div>
            <span className="font-extrabold text-sm sm:text-base text-[#1E293B] block leading-tight">
              Chill & Connect Hub
            </span>
            <span className="text-[10px] font-bold text-[#4A7C59]">Bangkok Lifestyle Community</span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          กลับสู่หน้าแรก ✕
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[500px] w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center animate-fade-in">
        
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden p-7 sm:p-10 relative">
          
          {/* Header */}
          <div className="text-center pb-7">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              เข้าสู่ระบบ (Log in)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5">
              ยินดีต้อนรับกลับสู่คอมมูนิตี้ Chill & Connect Hub
            </p>
          </div>

          {/* Social Logins */}
          <div className="space-y-3.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleLogin('คุณส้ม (Google)')}
              className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย Google (Gmail)</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleLogin('คุณส้ม (Apple ID)')}
              className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
            >
              <svg className="w-5 h-5 fill-black shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.43-6.22-9.59-11.05-20.2-14.49-31.84-3.44-11.64-5.16-22.39-5.16-32.25 0-14.16 3.69-25.79 11.08-34.89 7.39-9.1 16.59-13.78 27.59-14.05 4.9 0 10.3 1.25 16.2 3.75 5.9 2.5 9.78 3.86 11.64 4.07 1.86-.21 5.86-1.63 12-4.26 6.14-2.63 11.53-3.79 16.19-3.48 11.24.78 20.35 5.25 27.32 13.41-9.8 5.88-14.61 14.28-14.43 25.19.18 8.82 3.52 16.16 10.01 22.02 6.49 5.86 14.16 9.17 23.01 9.94-2.18 6.64-4.8 13.06-7.86 19.26zM119.22 33.64c0-6.93 2.56-13.53 7.69-19.81 5.13-6.28 11.45-10.29 18.96-12.03.43 1.95.65 3.86.65 5.73 0 7.04-2.71 13.73-8.13 20.08-5.42 6.35-11.95 10.19-19.59 11.52-.43-1.84-.65-3.67-.65-5.49z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย Apple ID</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleLogin('คุณส้ม (Facebook)')}
              className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
            >
              <svg className="w-5 h-5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย Facebook</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6 sm:my-7">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-4 text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">
              หรือใช้อีเมลของคุณ
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                อีเมล (Email address)
              </label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4.5 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-3.5 sm:py-4 px-6 rounded-full font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                  isFormValid
                    ? 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-800 shadow-md active:scale-98 cursor-pointer'
                    : 'bg-white text-slate-300 border border-slate-200 cursor-not-allowed shadow-none'
                }`}
              >
                <span>เข้าสู่ระบบ (Log In)</span>
                <ArrowRight className={`w-5 h-5 ${isFormValid ? 'text-slate-900' : 'text-slate-300'}`} />
              </button>
            </div>
          </form>

          {/* Signup Link -> Opens Sign Up Modal right here */}
          <div className="pt-6 mt-4 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              ยังไม่มีบัญชีสมาชิก?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsEmailSignUpMode(false);
                  setIsSignUpModalOpen(true);
                  setSignUpError('');
                }}
                className="font-extrabold text-[#4A7C59] hover:text-[#3B6347] hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>สมัครสมาชิกใหม่ (Sign up)</span>
                <ArrowRight className="w-4 h-4 inline" />
              </button>
            </p>
          </div>

          {/* Legal PDPA Disclaimer */}
          <div className="pt-4 text-center">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              การเข้าใช้งานถือว่ายอมรับ{' '}
              <button
                type="button"
                onClick={() => { setTermsTab('terms'); setIsTermsOpen(true); }}
                className="font-bold text-[#4A7C59] hover:underline cursor-pointer"
              >
                ข้อตกลงการใช้งาน
              </button>{' '}
              และ{' '}
              <button
                type="button"
                onClick={() => { setTermsTab('privacy'); setIsTermsOpen(true); }}
                className="font-bold text-[#4A7C59] hover:underline cursor-pointer"
              >
                นโยบายความเป็นส่วนตัว (PDPA)
              </button>
            </p>
          </div>

        </div>

      </main>

      {/* ======================================================== */}
      {/* SIGN-UP CONNECT POPUP MODAL (ON TOP OF LOGIN PAGE) */}
      {/* ======================================================== */}
      {isSignUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs animate-fade-in">
          
          {!isEmailSignUpMode ? (
            /* VIEW 1: SIGN UP (MAIN SOCIAL VIEW) */
            <div className="bg-white rounded-[32px] max-w-[540px] w-full border border-slate-200 shadow-2xl overflow-hidden p-7 sm:p-10 animate-scale-up relative">
              {/* Close Button X -> Returns to Login page */}
              <button
                type="button"
                onClick={() => setIsSignUpModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="text-center pt-2 pb-7">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  สมัครสมาชิกใหม่ (Sign up)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
                  ร่วมเป็นส่วนหนึ่งของแพลตฟอร์มค้นพบไลฟ์สไตล์ สำหรับคนชอบออกไปใช้ชีวิต พร้อมรับ Welcome Bonus +50 XP
                </p>
              </div>

              {/* 3 Pill Social Buttons */}
              <div className="space-y-3.5">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('google')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>ดำเนินการต่อด้วย Google (Gmail)</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('apple')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 fill-black shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.43-6.22-9.59-11.05-20.2-14.49-31.84-3.44-11.64-5.16-22.39-5.16-32.25 0-14.16 3.69-25.79 11.08-34.89 7.39-9.1 16.59-13.78 27.59-14.05 4.9 0 10.3 1.25 16.2 3.75 5.9 2.5 9.78 3.86 11.64 4.07 1.86-.21 5.86-1.63 12-4.26 6.14-2.63 11.53-3.79 16.19-3.48 11.24.78 20.35 5.25 27.32 13.41-9.8 5.88-14.61 14.28-14.43 25.19.18 8.82 3.52 16.16 10.01 22.02 6.49 5.86 14.16 9.17 23.01 9.94-2.18 6.64-4.8 13.06-7.86 19.26zM119.22 33.64c0-6.93 2.56-13.53 7.69-19.81 5.13-6.28 11.45-10.29 18.96-12.03.43 1.95.65 3.86.65 5.73 0 7.04-2.71 13.73-8.13 20.08-5.42 6.35-11.95 10.19-19.59 11.52-.43-1.84-.65-3.67-.65-5.49z"/>
                  </svg>
                  <span>ดำเนินการต่อด้วย Apple ID</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('facebook')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>ดำเนินการต่อด้วย Facebook</span>
                </button>
              </div>

              {/* Divider 'or' */}
              <div className="relative flex items-center justify-center my-6 sm:my-7">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-4 text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">
                  หรือ
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Sign up with email text button */}
              <div className="text-center pb-6 sm:pb-7">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailSignUpMode(true);
                    setSignUpError('');
                  }}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-slate-900 hover:text-[#4A7C59] transition-colors cursor-pointer hover:underline"
                >
                  <Mail className="w-4 h-4 text-[#4A7C59]" />
                  <span>สมัครสมาชิกด้วยอีเมล (Sign up with email)</span>
                </button>
              </div>

              {/* Footer Login Link -> Closes modal and reveals Login Form */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  มีบัญชีสมาชิกอยู่แล้ว?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUpModalOpen(false)}
                    className="font-extrabold text-[#4A7C59] hover:text-[#3B6347] hover:underline transition-colors cursor-pointer"
                  >
                    เข้าสู่ระบบที่นี่ (Log In)
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* VIEW 2: FINISH SIGNING UP WITH EMAIL & HUMAN CHECK (SPACIOUS & BRANDED - HIDDEN SCROLLBAR) */
            <div className="bg-white rounded-[32px] max-w-[540px] w-full border border-slate-200 shadow-2xl overflow-hidden p-7 sm:p-10 animate-scale-up relative max-h-[88vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* Top Header with Back and Close */}
              <div className="flex items-center justify-between pb-3">
                <button
                  type="button"
                  onClick={() => setIsEmailSignUpMode(false)}
                  className="text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUpModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title */}
              <div className="text-center pb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  กรอกข้อมูลเพื่อสมัครสมาชิก
                </h2>
              </div>

              <form onSubmit={handleEmailSignUpSubmit} className="space-y-4">
                {/* Your name */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    ชื่อ-นามสกุล หรือชื่อเล่น (Your Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น น้องส้ม สายชิลล์ หรือ Som S."
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full px-4.5 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    ชื่อนี้จะแสดงบนโปรไฟล์ Chill & Connect ของคุณ เพื่อให้เพื่อนๆ ในมีตติ้งเรียกถูก
                  </p>
                </div>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    อีเมล (Email Address) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="som.chill@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full px-4.5 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    เราจะใช้อีเมลนี้เพื่อส่งบัตรกิจกรรม (Ticket) และการแจ้งเตือนจากระบบ
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                    </label>
                    <span title="รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" className="text-slate-400 hover:text-slate-600 cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full px-4.5 py-3 pr-11 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    ความยาวอย่างน้อย 8 ตัวอักษร เพื่อความปลอดภัยของบัญชีคุณ
                  </p>
                  {/* Password Strength Indicator Bars */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <div className={`h-1.5 rounded-full transition-all ${passwordStrength >= 1 ? (passwordStrength === 1 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${passwordStrength >= 2 ? (passwordStrength === 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>
                </div>

                {/* Age Checkbox */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">ยืนยันอายุ (Age Confirmation)</span>
                    <span title="ผู้ใช้งานต้องมีอายุ 18 ปีขึ้นไป" className="text-slate-400 hover:text-slate-600 cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <input
                      type="checkbox"
                      id="confirm-age-login-modal"
                      checked={isAgeConfirmed}
                      onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-[#4A7C59] focus:ring-[#4A7C59] cursor-pointer"
                    />
                    <label htmlFor="confirm-age-login-modal" className="text-xs sm:text-sm text-slate-700 font-semibold cursor-pointer">
                      ฉันมีอายุ 18 ปีขึ้นไป (I am 18 years of age or older)
                    </label>
                  </div>
                </div>

                {/* Human Check (hCaptcha Interactive Card) */}
                <div className="pt-2">
                  <div className="bg-[#FAFAFA] border border-slate-300 rounded-2xl p-3.5 max-w-[280px] flex items-center justify-between shadow-2xs">
                    <button
                      type="button"
                      onClick={handleToggleHumanCheck}
                      className="flex items-center gap-3 cursor-pointer group text-left"
                    >
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        isHumanVerified
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'border-slate-400 bg-white group-hover:border-slate-600'
                      }`}>
                        {isVerifyingHuman ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        ) : isHumanVerified ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : null}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 select-none">
                        ฉันเป็นมนุษย์ (I am human)
                      </span>
                    </button>

                    {/* hCaptcha Branding Icon & Text */}
                    <div className="flex flex-col items-center justify-center pl-2.5 border-l border-slate-200">
                      <svg className="w-6 h-6 text-[#00A88F]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
                      </svg>
                      <span className="text-[9px] font-bold text-slate-500 tracking-tighter">hCaptcha</span>
                    </div>
                  </div>
                </div>

                {signUpError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{signUpError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-4 px-6 rounded-full font-black text-sm sm:text-base transition-all shadow-lg shadow-emerald-900/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>ยืนยันการสมัครและเริ่มต้นเลือกสไตล์</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Legal & PDPA Modal */}
      <TermsPrivacyModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        initialTab={termsTab}
      />

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-[#E8E2D8] bg-white/50">
        Chill & Connect Hub © 2026 • Bangkok Social & Community Platform
      </footer>

    </div>
  );
}


