'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { useAuth } from '@/lib/useAuth';

const PLACES_TO_GO = [
  { href: '/community', label: 'มีตอัป' },
  { href: '/fairs', label: 'งานแฟร์' },
  { href: '/spots', label: 'ที่เที่ยว' },
  { href: '/challenges', label: 'ชาเลนจ์' },
];

/** The page behind every 404: a link that no longer leads anywhere, with ways back in. */
export function NotFoundScreen() {
  const [activeTab, setActiveTab] = useState('');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
      <Navbar
        showMenuOnMobile
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
      />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">ไม่เจอหน้านี้แล้ว</h1>
        <p className="text-sm text-slate-600">กิจกรรมหรือที่นี้อาจจบไปแล้ว ถูกยกเลิก หรือลิงก์พิมพ์ผิดนิดหน่อย ลองดูอย่างอื่นที่เพื่อนๆ กำลังไปกันได้เลย</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {PLACES_TO_GO.map((place) => (
            <Link
              key={place.href}
              href={place.href}
              className="inline-flex items-center min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
            >
              {place.label}
            </Link>
          ))}
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-11 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer"
        >
          กลับหน้าแรก
        </Link>
      </main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={() => handleSetIsLoggedIn(true)} />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
        }}
      />
    </div>
  );
}
