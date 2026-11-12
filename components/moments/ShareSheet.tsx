'use client';

import React from 'react';
import { Link2, Loader2, MessageCircle, Share2 } from 'lucide-react';
import { InviteIcon } from '@/components/icons/InviteIcon';
import { DialogShell } from '@/components/auth/DialogShell';
import type { InviteTarget } from '@/components/invites/InviteSheet';
import { APPS_INVITE_HINT, appsInviteCopied, useAppsInvite } from '@/components/invites/useAppsInvite';

/**
 * What the share button opens (owner 2026-11-10), like IG's send sheet: invite friends to go together first (the
 * reason Chillwaa exists), then "ส่งทาง LINE" for friends who may not be here yet, then the link through the phone's
 * share sheet. The 9:16 Story card was dropped (owner 2026-11-11): this sheet is for inviting, not showing off.
 */
export function ShareSheet({ canInvite, invite, onInvite, onNeedLogin, onLine, onLink, onMessage, onClose }: {
  canInvite: boolean;
  /**
   * A visitor tapped ชวนไป: the sheet still says ชวนไป and offers inviting, which asks them to sign up first (a plan and
   * its chat need an account), next to the plain link they can share right away (owner 2026-11-12)
   */
  onNeedLogin?: () => void;
  /** What "ชวนผ่านแอปอื่น" invites to; without it (or for a guest) the row shares the plain link */
  invite?: { target: InviteTarget; place: string };
  onInvite: () => void;
  onLine?: () => void;
  onLink: () => void;
  onMessage: (message: string) => void;
  onClose: () => void;
}) {
  const row = 'w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-slate-50 text-left cursor-pointer';
  const pick = (action: () => void) => () => {
    onClose();
    action();
  };
  return (
    <DialogShell onClose={onClose} title={canInvite || onNeedLogin ? 'ชวนไป' : 'แชร์โมเมนต์'} size="sm" focusField={false}>
      <ul className="-mx-2 -mt-1">
        {!canInvite && onNeedLogin && (
          <li>
            <button type="button" onClick={pick(onNeedLogin)} className={row}>
              <span className="w-11 h-11 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0" aria-hidden="true">
                <InviteIcon className="h-4 w-[37px] shrink-0" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">ชวนเพื่อนไปด้วยกัน</span>
                <span className="block text-xs font-medium text-slate-500">สมัครแป๊บเดียว แล้วนัดวันกับเพื่อนในแชตกลุ่ม</span>
              </span>
            </button>
          </li>
        )}
        {canInvite && (
          <li>
            <button type="button" onClick={pick(onInvite)} className={row}>
              <span className="w-11 h-11 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0" aria-hidden="true">
                <InviteIcon className="h-4 w-[37px] shrink-0" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">ชวนเพื่อนไปด้วยกัน</span>
                <span className="block text-xs font-medium text-slate-500">เลือกเพื่อนที่อยู่ใน Chillwaa</span>
              </span>
            </button>
          </li>
        )}
        {canInvite && onLine && (
          <li>
            <button type="button" onClick={pick(onLine)} className={row}>
              <span className="w-11 h-11 rounded-full bg-[#06C755] text-white flex items-center justify-center shrink-0" aria-hidden="true">
                <MessageCircle className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">ชวนทาง LINE</span>
                <span className="block text-xs font-medium text-slate-500">ส่งให้เพื่อนในแชต LINE</span>
              </span>
            </button>
          </li>
        )}
        {canInvite && invite ? (
          <AppsRow invite={invite} row={row} onMessage={onMessage} onClose={onClose} />
        ) : (
        <li>
          <button type="button" onClick={pick(onLink)} className={row}>
            <span className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0" aria-hidden="true">
              <Link2 className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">แชร์ลิงก์</span>
              <span className="block text-xs font-medium text-slate-500">ส่งทาง LINE แชต หรือแอปอื่น</span>
            </span>
          </button>
        </li>
        )}
      </ul>
    </DialogShell>
  );
}

/** The same invitation as LINE, through the phone's share sheet (components/invites/useAppsInvite.ts) */
function AppsRow({ invite, row, onMessage, onClose }: { invite: { target: InviteTarget; place: string }; row: string; onMessage: (message: string) => void; onClose: () => void }) {
  const apps = useAppsInvite(
    invite.target,
    invite.place,
    (how) => {
      onClose();
      if (how === 'copied') onMessage(appsInviteCopied);
    },
    onMessage
  );
  return (
    <li>
      <button type="button" onClick={() => void apps.go()} disabled={apps.busy} className={row}>
        <span className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0" aria-hidden="true">
          {apps.busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900">{apps.isReady ? 'คำชวนพร้อมแล้ว แตะอีกครั้งเพื่อส่ง' : 'ชวนผ่านแอปอื่น'}</span>
          <span className="block text-xs font-medium text-slate-500">{APPS_INVITE_HINT}</span>
        </span>
      </button>
    </li>
  );
}
