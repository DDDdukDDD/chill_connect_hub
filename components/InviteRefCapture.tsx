'use client';

import { useEffect } from 'react';

/**
 * Keeps the code of a friend's invite link (?ref=CODE on any page) for 30 days, so sign-up later (email or social
 * login) links the new account to that friend (lib/social/friends.ts attachInviter). Renders nothing.
 */
export function InviteRefCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase();
    if (!code || !/^[A-Z0-9]{4,12}$/.test(code)) return;
    document.cookie = `cch_ref=${code}; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax`;
  }, []);
  return null;
}
