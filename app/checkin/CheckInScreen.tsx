'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/useAuth';

type Result = { state: 'working' } | { state: 'signin' } | { state: 'done'; name: string } | { state: 'failed'; message: string };

/**
 * Opened by scanning the QR on a member's ticket. Only the member who created the event can check someone in;
 * the server decides from the session, so the link is useless to anyone else.
 */
export function CheckInScreen({ eventId, code }: { eventId: string; code: string }) {
  const { isLoggedIn, isAuthReady } = useAuth();
  const [result, setResult] = useState<Result>({ state: 'working' });

  useEffect(() => {
    if (!isAuthReady) return;
    if (!eventId || code.length !== 6) return setResult({ state: 'failed', message: 'ลิงก์เช็กอินไม่ครบ ลองสแกน QR บนบัตรอีกครั้ง' });
    if (!isLoggedIn) return setResult({ state: 'signin' });
    let active = true;
    fetch(`/api/events/${encodeURIComponent(eventId)}/participants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_in', code }) })
      .then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => null) }))
      .then(({ ok, json }) => {
        if (!active) return;
        setResult(ok && json?.success ? { state: 'done', name: json.participant.userName } : { state: 'failed', message: json?.message || 'เช็กอินไม่สำเร็จ ลองอีกครั้งนะ' });
      })
      .catch(() => active && setResult({ state: 'failed', message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' }));
    return () => {
      active = false;
    };
  }, [isAuthReady, isLoggedIn, eventId, code]);

  const returnTo = encodeURIComponent(`/checkin?event=${eventId}&code=${code}`);
  const button = 'inline-flex items-center justify-center px-6 py-3 rounded-full text-sm sm:text-base font-extrabold whitespace-nowrap';

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-slate-900 font-sans flex flex-col">
      <Navbar activeTab="myhub" setActiveTab={() => undefined} isLoggedIn={isLoggedIn} isAuthReady={isAuthReady} onOpenLogin={() => undefined} onOpenLogout={() => undefined} />
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-10 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center">
          {result.state === 'working' && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-slate-400 animate-spin" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-extrabold">กำลังเช็กอิน…</h1>
            </>
          )}
          {result.state === 'done' && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" aria-hidden="true" />
              <h1 className="mt-4 text-xl sm:text-2xl font-extrabold">เช็กอินแล้ว</h1>
              <p className="mt-2 text-base font-semibold text-slate-700">{result.name}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">สแกนบัตรใบถัดไปได้เลย</p>
              <Link href="/myhub" className={`${button} mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700`}>ดูรายชื่อในมายฮับ</Link>
            </>
          )}
          {result.state === 'signin' && (
            <>
              <AlertCircle className="w-10 h-10 mx-auto text-slate-400" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-extrabold">เข้าสู่ระบบก่อน</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">เฉพาะคนจัดกิจกรรมเท่านั้นที่เช็กอินผู้เข้าร่วมได้ เข้าสู่ระบบด้วยบัญชีที่ใช้จัดกิจกรรมนี้</p>
              <Link href={`/login?returnTo=${returnTo}`} className={`${button} mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white`}>เข้าสู่ระบบ</Link>
            </>
          )}
          {result.state === 'failed' && (
            <>
              <AlertCircle className="w-10 h-10 mx-auto text-rose-600" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-extrabold">เช็กอินไม่ได้</h1>
              <p role="alert" className="mt-2 text-sm font-semibold text-slate-700">{result.message}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">QR นี้ใช้สำหรับคนจัดสแกนที่จุดนัดพบ ถ้าคุณเป็นผู้เข้าร่วม ให้เปิดบัตรของคุณให้คนจัดสแกน</p>
              <Link href="/myhub" className={`${button} mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700`}>ไปที่มายฮับ</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
