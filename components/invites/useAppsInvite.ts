'use client';

import { useState } from 'react';
import { inviteWords, sendInvites, type InviteTarget } from './InviteSheet';

/**
 * "ชวนผ่านแอปอื่น" (owner 2026-11-11): the same invitation as LINE (words + short /i/<code> link, so the friend's
 * "ไปกัน" joins the plan), handed to the phone's share sheet, which lists Facebook, IG, TikTok and the rest. Without one
 * (most computers) the words are copied. A phone that refuses the share because the link took a moment to make (iPhone)
 * keeps the invitation ready, and the next tap shares it at once.
 */
type Ready = { text: string; url: string };
export type AppsInviteDone = 'shared' | 'copied';

async function shareNow(ready: Ready): Promise<AppsInviteDone | 'cancelled' | 'blocked' | 'failed'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: ready.text, url: ready.url });
      return 'shared';
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === 'AbortError') return 'cancelled';
      if (name === 'NotAllowedError') return 'blocked';
    }
  }
  try {
    await navigator.clipboard.writeText(`${ready.text}\n${ready.url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function useAppsInvite(target: InviteTarget, place: string, onDone: (how: AppsInviteDone) => void, onError: (message: string) => void) {
  const [ready, setReady] = useState<Ready | null>(null);
  const [busy, setBusy] = useState(false);

  const settle = (status: Awaited<ReturnType<typeof shareNow>>, invite: Ready) => {
    if (status === 'blocked') return setReady(invite);
    setReady(null);
    if (status === 'shared' || status === 'copied') onDone(status);
    else if (status === 'failed') onError('แชร์ไม่สำเร็จ ลองอีกครั้งนะ');
  };

  const go = async () => {
    if (busy) return;
    if (ready) return settle(await shareNow(ready), ready);
    setBusy(true);
    const result = await sendInvites(target);
    setBusy(false);
    if (!result.ok || !result.link) return onError(result.message || 'ทำลิงก์ชวนไม่สำเร็จ ลองอีกครั้งนะ');
    const invite = { text: inviteWords(place, target.type === 'community'), url: `${window.location.origin}${result.link}` };
    settle(await shareNow(invite), invite);
  };

  return { go, busy, isReady: Boolean(ready) };
}

export const APPS_INVITE_HINT = 'Facebook, IG, TikTok หรือแอปไหนก็ได้';
export const appsInviteCopied = 'คัดลอกคำชวนแล้ว วางในแชตไหนก็ได้';
