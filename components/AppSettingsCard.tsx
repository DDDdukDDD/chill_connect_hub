'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Share } from 'lucide-react';
import { dialogButton } from '@/components/auth/DialogShell';
import { canPromptInstall, isInAppBrowser, isIos, isPhone, isStandalone, onInstallPromptChange, promptInstall, readPushStatus, turnPushOff, turnPushOn, type PushStatus } from '@/lib/appClient';

type InstallWay = 'prompt' | 'ios' | 'in-app' | 'menu' | null;

function installWay(): InstallWay {
  if (isStandalone()) return null;
  if (isInAppBrowser()) return 'in-app';
  if (isIos()) return 'ios';
  if (canPromptInstall()) return 'prompt';
  return isPhone() ? 'menu' : null;
}

/** ตั้งค่าบัญชี: install Chillwaa on this phone and turn its notifications on or off. Shows only what this device can do. */
export function AppSettingsCard() {
  const [way, setWay] = useState<InstallWay>(null);
  const [push, setPush] = useState<PushStatus | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const read = () => setWay(installWay());
    Promise.resolve().then(() => active && read());
    readPushStatus().then((status) => active && setPush(status), () => active && setPush('unsupported'));
    const stop = onInstallPromptChange(read);
    return () => {
      active = false;
      stop();
    };
  }, []);

  const togglePush = async () => {
    setIsBusy(true);
    setFailed(false);
    try {
      if (push === 'on') {
        await turnPushOff();
        setPush('off');
      } else {
        setPush(await turnPushOn());
      }
    } catch {
      setFailed(true);
    } finally {
      setIsBusy(false);
    }
  };

  const hasPush = push === 'on' || push === 'off' || push === 'denied';
  const isVisible = Boolean(way || hasPush);

  // The bell links here (/profile/settings#app), and this card appears a moment after the page's own scroll to the hash
  useEffect(() => {
    if (isVisible && window.location.hash === '#app') cardRef.current?.scrollIntoView({ block: 'start' });
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <section id="app" ref={cardRef} className="scroll-mt-24">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">แอปและการแจ้งเตือน</h2>

      {way === 'prompt' && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-600">ติดตั้ง Chillwaa ไว้ในเครื่อง เปิดจากไอคอนได้เลยเหมือนแอป</p>
          <button type="button" onClick={() => void promptInstall()} className={`mt-3 ${dialogButton.primary}`}>ติดตั้งแอป</button>
        </div>
      )}
      {way === 'ios' && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-600">ติดตั้ง Chillwaa ไว้บน iPhone ง่ายๆ 3 ขั้นตอน</p>
          <ol className="mt-3 space-y-2 text-sm font-medium text-slate-700 list-decimal pl-5">
            <li>
              กดปุ่มแชร์ <Share className="inline w-4 h-4 align-text-bottom" aria-label="รูปปุ่มแชร์" /> ของ Safari
            </li>
            <li>เลือก “เพิ่มไปยังหน้าจอโฮม”</li>
            <li>เปิด Chillwaa จากไอคอนใหม่ แล้วเข้าสู่ระบบอีกครั้ง</li>
          </ol>
        </div>
      )}
      {way === 'in-app' && <p className="mt-4 text-sm font-medium text-slate-600">เปิดหน้านี้ใน {isIos() ? 'Safari' : 'Chrome'} ก่อนนะ ถึงจะติดตั้ง Chillwaa ไว้ในเครื่องได้</p>}
      {way === 'menu' && <p className="mt-4 text-sm font-medium text-slate-600">ติดตั้ง Chillwaa ได้จากเมนูของเบราว์เซอร์ เลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอหลัก”</p>}

      {push === 'needs-install' && way && <p className="mt-3 text-xs text-slate-500">ติดตั้งแล้ว กลับมาเปิดการแจ้งเตือนที่หน้านี้ได้เลย</p>}

      {(push === 'on' || push === 'off') && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p id="push-label" className="text-sm font-semibold text-slate-900">แจ้งเตือนบนเครื่องนี้</p>
            <p className="mt-0.5 text-xs text-slate-500">รู้ทันทีเมื่อมีคนเข้าตี้ ตอบคำถาม หรือคอมเมนต์โมเมนต์ของคุณ</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={push === 'on'}
            aria-labelledby="push-label"
            disabled={isBusy}
            onClick={() => void togglePush()}
            className={`relative shrink-0 w-11 h-7 rounded-full transition-colors cursor-pointer disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${push === 'on' ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform ${push === 'on' ? 'translate-x-4' : ''}`}>
              {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" aria-hidden="true" />}
            </span>
          </button>
        </div>
      )}
      {push === 'denied' && <p className="mt-4 text-sm font-medium text-slate-600">เครื่องนี้ปิดการแจ้งเตือนของ Chillwaa ไว้ เปิดได้ที่การตั้งค่าของมือถือหรือเบราว์เซอร์</p>}
      {failed && <p role="alert" className="mt-2 text-xs font-bold text-rose-600">ตั้งค่าการแจ้งเตือนไม่สำเร็จ ลองอีกครั้งนะ</p>}
    </section>
  );
}
