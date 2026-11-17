'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share, SquarePlus } from 'lucide-react';
import { dialogButton, useDialogBehavior } from '@/components/auth/DialogShell';
import { PhraseText } from '@/components/auth/PhraseText';
import { installWay, isIos, isPhone, promptInstall, type InstallWay } from '@/lib/appClient';
import { clearPendingInstall, INSTALL_OFFER_EVENT, isOfferQuiet, markOfferShown, pendingInstallMoment, type InstallMoment } from '@/lib/installOffer';

/** What each moment promises. Only notices the site really sends (chat, ตี้ changes, a seat, friend plans). */
const COPY: Record<InstallMoment, { title: string; reason: string }> = {
  signup: { title: 'เพิ่ม Chillwaa ไว้ที่หน้าจอโฮม', reason: 'เปิดได้ในแตะเดียวเหมือนแอป และรู้ทันทีเมื่อเพื่อนชวนหรือทักมา' },
  join: { title: 'ได้ที่แล้ว! เพิ่ม Chillwaa ไว้ที่หน้าจอโฮม', reason: 'ถ้าคนจัดเปลี่ยนเวลาหรือทักในแชต จะเด้งบอกทันที ไม่พลาดนัด' },
  invite: { title: 'ไปกัน! เพิ่ม Chillwaa ไว้ที่หน้าจอโฮม', reason: 'เพื่อนทักในแชตหรือนัดวันเมื่อไหร่ จะเด้งบอกทันที' },
};

const FIRST_WAIT_MS = 1200;
const CHECK_EVERY_MS = 600;
const GIVE_UP_MS = 3 * 60_000;

/** Another dialog (the ticket, a sign-up step) goes first; the sheet waits until it is closed */
const otherDialogOpen = () => Boolean(document.querySelector('[data-dialog-shell]:not([data-install-sheet])'));

function externalLineHref(): string | null {
  if (!/\bLine\//i.test(navigator.userAgent)) return null;
  const url = new URL(window.location.href);
  url.searchParams.set('openExternalBrowser', '1');
  return url.toString();
}

/**
 * The install suggestion (lib/installOffer.ts says when). Mounted once in AppSetup; it shows only on a phone that can
 * still add the site to its home screen, after any other dialog, at most once every 14 days.
 */
export function InstallSheet() {
  const [shown, setShown] = useState<{ moment: InstallMoment; way: Exclude<InstallWay, null>; lineHref: string | null } | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let startedAt = 0;

    const tryShow = () => {
      const moment = pendingInstallMoment();
      if (!moment) return;
      const way = installWay();
      if (!way || !isPhone() || isOfferQuiet()) return clearPendingInstall();
      if (otherDialogOpen()) {
        if (Date.now() - startedAt < GIVE_UP_MS) timer = window.setTimeout(tryShow, CHECK_EVERY_MS);
        return;
      }
      clearPendingInstall();
      markOfferShown();
      setShown({ moment, way, lineHref: externalLineHref() });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      startedAt = Date.now();
      timer = window.setTimeout(tryShow, FIRST_WAIT_MS);
    };

    // A wish left by the page before (sign-up ends with a page change), and any wish made on this page
    schedule();
    window.addEventListener(INSTALL_OFFER_EVENT, schedule);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(INSTALL_OFFER_EVENT, schedule);
    };
  }, []);

  if (!shown || typeof document === 'undefined') return null;
  return createPortal(<SheetPanel {...shown} onClose={() => setShown(null)} />, document.body);
}

function SheetPanel({ moment, way, lineHref, onClose }: { moment: InstallMoment; way: Exclude<InstallWay, null>; lineHref: string | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(panelRef, onClose, { focusField: false });
  const copy = COPY[moment];
  const browser = isIos() ? 'Safari' : 'Chrome';

  const install = async () => {
    await promptInstall().catch(() => undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100002] flex items-end sm:items-center justify-center bg-black/40 sm:p-6" onClick={onClose}>
      <div
        ref={panelRef}
        data-dialog-shell
        data-install-sheet
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-sheet-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full sm:max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[28px] border border-slate-200 shadow-2xl px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-8 max-h-[92vh] overflow-y-auto focus:outline-hidden"
      >
        <span className="sm:hidden mx-auto mb-4 block w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small local icon, already the right size */}
          <img src="/icons/icon-192.png" alt="" width={56} height={56} className="shrink-0 w-14 h-14 rounded-2xl shadow-sm border border-slate-100" />
          <div className="min-w-0">
            <h2 id="install-sheet-title" className="text-lg font-bold text-slate-900 leading-snug">
              <PhraseText text={copy.title} />
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600 leading-relaxed">
              <PhraseText text={copy.reason} />
            </p>
          </div>
        </div>

        {way === 'ios' && (
          <ol className="mt-5 space-y-3 text-sm font-medium text-slate-700">
            <Step n={1}>
              กดปุ่มแชร์ <Share className="inline w-4 h-4 align-text-bottom text-[#2563EB]" aria-label="รูปปุ่มแชร์" /> ของ {browser}
            </Step>
            <Step n={2}>
              เลือก “เพิ่มไปยังหน้าจอโฮม” <SquarePlus className="inline w-4 h-4 align-text-bottom" aria-hidden="true" />
            </Step>
            <Step n={3}>เปิด Chillwaa จากไอคอนใหม่ แล้วเข้าสู่ระบบอีกครั้ง</Step>
          </ol>
        )}
        {way === 'in-app' && <p className="mt-5 text-sm font-medium text-slate-700">เปิดหน้านี้ใน {browser} ก่อนนะ ถึงจะเพิ่มไว้ที่หน้าจอโฮมได้</p>}
        {way === 'menu' && <p className="mt-5 text-sm font-medium text-slate-700">กดเมนูของเบราว์เซอร์ แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอหลัก”</p>}

        <div className="mt-6 flex flex-col gap-2">
          {way === 'prompt' && (
            <button type="button" onClick={() => void install()} className={dialogButton.primary}>
              เพิ่มลงหน้าจอโฮม
            </button>
          )}
          {way === 'in-app' && lineHref && (
            <a href={lineHref} className={dialogButton.primary}>
              เปิดใน {browser}
            </a>
          )}
          {/* One button when there is nothing to tap here (the steps happen in the browser) */}
          {way === 'prompt' || (way === 'in-app' && lineHref) ? (
            <button type="button" onClick={onClose} className={dialogButton.quiet}>
              ไว้ทีหลัง
            </button>
          ) : (
            <button type="button" onClick={onClose} className={dialogButton.primary}>
              เข้าใจแล้ว
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold flex items-center justify-center" aria-hidden="true">{n}</span>
      <span>{children}</span>
    </li>
  );
}
