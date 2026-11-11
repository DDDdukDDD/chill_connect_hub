'use client';

import React from 'react';
import { Link2, MessageCircle, Send } from 'lucide-react';
import { DialogShell } from '@/components/auth/DialogShell';

/**
 * What the share button opens (owner 2026-11-10), like IG's send sheet: invite friends to go together first (the
 * reason Chillwaa exists), then "ส่งทาง LINE" for friends who may not be here yet, then the link through the phone's
 * share sheet. The 9:16 Story card was dropped (owner 2026-11-11): this sheet is for inviting, not showing off.
 */
export function ShareSheet({ canInvite, onInvite, onLine, onLink, onClose }: { canInvite: boolean; onInvite: () => void; onLine?: () => void; onLink: () => void; onClose: () => void }) {
  const row = 'w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-slate-50 text-left cursor-pointer';
  const pick = (action: () => void) => () => {
    onClose();
    action();
  };
  return (
    <DialogShell onClose={onClose} title="แชร์โมเมนต์" size="sm" focusField={false}>
      <ul className="-mx-2 -mt-1">
        {canInvite && (
          <li>
            <button type="button" onClick={pick(onInvite)} className={row}>
              <span className="w-11 h-11 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0" aria-hidden="true">
                <Send className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">ชวนเพื่อนไปด้วยกัน</span>
                <span className="block text-xs font-medium text-slate-500">ส่งให้เพื่อนที่ติดตามกัน ถามว่าไปกันไหม</span>
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
                <span className="block text-sm font-bold text-slate-900">ชวนไปกันทาง LINE</span>
                <span className="block text-xs font-medium text-slate-500">เพื่อนยังไม่มีบัญชีก็ได้ กดไปกันแล้วเกิดแผนกับคุณเลย</span>
              </span>
            </button>
          </li>
        )}
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
      </ul>
    </DialogShell>
  );
}
