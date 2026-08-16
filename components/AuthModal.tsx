'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, LogOut, CheckCircle2, ShieldCheck, Mail, Lock, User, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userName: string) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = name.trim() || email.split('@')[0] || 'คุณสมาชิก';
    onLoginSuccess(displayName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header with Brand & Close */}
        <div className="relative p-6 bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chill & Connect Community</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">
              {tab === 'login' ? '🔑 เข้าสู่ระบบสมาชิก' : '✨ สมัครสมาชิกใหม่'}
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              ฮับกิจกรรมยามว่าง เติมพลังใจ และเจอเพื่อนไลฟ์สไตล์เดียวกัน
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-white/10 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-white text-[#1E293B] shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'signup'
                  ? 'bg-[#F26430] text-white shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สมัครสมาชิกใหม่</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
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
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
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
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
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
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
              />
            </div>
          </div>

          {/* Quick Demo Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onLoginSuccess('คุณส้ม (Member)');
                onClose();
              }}
              className="w-full bg-[#EBF3ED] hover:bg-[#D9EADB] text-[#4A7C59] py-2 rounded-xl text-xs font-bold transition-all border border-[#C5DCCB] flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#4A7C59]" />
              <span>⚡ เข้าสู่ระบบแบบทดสอบ Demo (คุณส้ม)</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-3 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{tab === 'login' ? 'เข้าสู่ระบบ' : 'ยืนยันสมัครสมาชิก'}</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center font-medium">
            การเข้าใช้งานถือว่ายอมรับ ข้อตกลง และ นโยบายความเป็นส่วนตัว ของฮับ
          </p>

        </form>

      </div>
    </div>
  );
};

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E8E2D8] shadow-2xl p-6 space-y-5 animate-scale-up text-center">
        
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <LogOut className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-extrabold text-lg text-[#1E293B]">
            ยืนยันการออกจากระบบ?
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ Chill & Connect Hub? คุณสามารถกลับมาเข้าสู่ระบบได้ตลอดเวลา
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onConfirmLogout();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm active:scale-95"
          >
            ออกจากระบบ
          </button>
        </div>

      </div>
    </div>
  );
};
