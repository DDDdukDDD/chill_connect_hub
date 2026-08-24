'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Mail, Lock, User, ShieldCheck, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleLogin = (displayName: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', displayName);
    router.push('/myhub');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || email.split('@')[0] || 'คุณสมาชิก';
    handleLogin(finalName);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 font-sans flex flex-col justify-between selection:bg-[#F26430] selection:text-white">
      
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4A7C59] to-emerald-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
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
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-center animate-fade-in">
        
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-xl overflow-hidden">
          
          {/* Header Card */}
          <div className="p-6 bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bangkok Community Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {tab === 'login' ? '🔑 เข้าสู่ระบบสมาชิก' : '✨ สมัครสมาชิกใหม่'}
            </h1>
            <p className="text-xs text-slate-300">
              ฮับกิจกรรมยามว่าง เติมพลังใจ และเจอเพื่อนไลฟ์สไตล์เดียวกัน
            </p>

            {/* Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-white/10 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'login' ? 'bg-white text-[#1E293B] shadow-md font-extrabold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'signup' ? 'bg-[#F26430] text-white shadow-md font-extrabold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>สมัครสมาชิก</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            
            {tab === 'signup' && (
              <Link
                href="/onboarding"
                className="w-full bg-gradient-to-r from-[#4A7C59] via-emerald-600 to-teal-600 hover:from-[#3B6347] hover:to-emerald-700 text-white p-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-between gap-2 active:scale-98 transition-all group"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="block leading-tight">สร้างโปรไฟล์เต็มรูปแบบ (5 ขั้นตอน) ✨</span>
                    <span className="text-[10px] text-emerald-100 font-normal">เลือกความสนใจ & Vibe เพื่อรับอีเวนต์แนะนำ</span>
                  </div>
                </div>
                <span className="text-xs bg-white text-emerald-800 px-2.5 py-1 rounded-xl font-extrabold group-hover:translate-x-0.5 transition-transform shrink-0">
                  เริ่มเลย ➔
                </span>
              </Link>
            )}

            {/* Social Logins */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleLogin('คุณส้ม (Google)')}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border border-slate-300 shadow-2xs flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{tab === 'login' ? 'เข้าสู่ระบบด้วย Google' : 'สมัครสมาชิกด้วย Google (Gmail)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('คุณส้ม (Apple ID)')}
                className="w-full bg-black hover:bg-slate-900 text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.43-6.22-9.59-11.05-20.2-14.49-31.84-3.44-11.64-5.16-22.39-5.16-32.25 0-14.16 3.69-25.79 11.08-34.89 7.39-9.1 16.59-13.78 27.59-14.05 4.9 0 10.3 1.25 16.2 3.75 5.9 2.5 9.78 3.86 11.64 4.07 1.86-.21 5.86-1.63 12-4.26 6.14-2.63 11.53-3.79 16.19-3.48 11.24.78 20.35 5.25 27.32 13.41-9.8 5.88-14.61 14.28-14.43 25.19.18 8.82 3.52 16.16 10.01 22.02 6.49 5.86 14.16 9.17 23.01 9.94-2.18 6.64-4.8 13.06-7.86 19.26zM119.22 33.64c0-6.93 2.56-13.53 7.69-19.81 5.13-6.28 11.45-10.29 18.96-12.03.43 1.95.65 3.86.65 5.73 0 7.04-2.71 13.73-8.13 20.08-5.42 6.35-11.95 10.19-19.59 11.52-.43-1.84-.65-3.67-.65-5.49z"/>
                </svg>
                <span>{tab === 'login' ? 'เข้าสู่ระบบด้วย Apple' : 'สมัครสมาชิกด้วย Apple ID'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogin('คุณส้ม (Facebook)')}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{tab === 'login' ? 'เข้าสู่ระบบด้วย Facebook' : 'สมัครสมาชิกด้วย Facebook'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                หรือใช้อีเมลของคุณ
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1E293B]">
                    ชื่อที่ใช้แสดง (Display Name):
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น คุณส้ม (Som_Chill)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-hidden focus:border-[#4A7C59]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#1E293B]">
                  อีเมล (Email):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-hidden focus:border-[#4A7C59]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#1E293B]">
                  รหัสผ่าน (Password):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-hidden focus:border-[#4A7C59]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{tab === 'login' ? 'เข้าสู่ระบบด้วยอีเมล' : 'ยืนยันสมัครสมาชิกด้วยอีเมล'}</span>
              </button>
            </form>

            {/* Quick Demo Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleLogin('คุณส้ม (Member)')}
                className="w-full bg-[#EBF3ED] hover:bg-[#D9EADB] text-[#4A7C59] py-2 rounded-xl text-xs font-bold transition-all border border-[#C5DCCB] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#4A7C59]" />
                <span>⚡ เข้าสู่ระบบแบบทดสอบ Demo (คุณส้ม)</span>
              </button>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 text-center font-medium leading-relaxed">
              การเข้าใช้งานถือว่ายอมรับ ข้อตกลง และ นโยบายความเป็นส่วนตัว ของ Chill & Connect
            </p>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-[#E8E2D8] bg-white/50">
        Chill & Connect Hub © 2026 • Bangkok Social & Community Platform
      </footer>

    </div>
  );
}
