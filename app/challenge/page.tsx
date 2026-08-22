'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChallengeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/myhub');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-center p-4">
      <div className="space-y-2">
        <div className="w-8 h-8 border-3 border-[#4A7C59] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">กำลังนำคุณไปยังมายฮับส่วนตัว (/myhub)...</p>
      </div>
    </div>
  );
}
