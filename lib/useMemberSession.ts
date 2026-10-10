'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LoginMethod, OAuthProvider, PublicMember } from './members/types';

/**
 * Member session for the public site (replaces the localStorage login in lib/useAuth.ts).
 * The server decides who is signed in via an httpOnly cookie; this hook only reads and drives it.
 */
interface SessionState {
  isLoaded: boolean;
  member: PublicMember | null;
  /** Which login buttons work right now (social ones need provider credentials on the server) */
  providers: Record<LoginMethod, boolean>;
}

const EMPTY_PROVIDERS: Record<LoginMethod, boolean> = { email: true, google: false, facebook: false, apple: false };

async function postJson(url: string, body: unknown, method = 'POST') {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'ทำรายการไม่สำเร็จ');
  return json;
}

export function useMemberSession() {
  const [state, setState] = useState<SessionState>({ isLoaded: false, member: null, providers: EMPTY_PROVIDERS });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/member', { cache: 'no-store' });
      const json = await res.json();
      setState({ isLoaded: true, member: json.member ?? null, providers: json.providers ?? EMPTY_PROVIDERS });
    } catch {
      setState((current) => ({ ...current, isLoaded: true }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/member', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => { if (active) setState({ isLoaded: true, member: json.member ?? null, providers: json.providers ?? EMPTY_PROVIDERS }); })
      .catch(() => { if (active) setState((current) => ({ ...current, isLoaded: true })); });
    return () => { active = false; };
  }, []);

  return {
    ...state,
    isLoggedIn: Boolean(state.member),
    refresh,
    /** Throws Error(message in Thai) on failure */
    register: async (input: { displayName: string; email: string; password: string; consent: boolean }) => {
      const json = await postJson('/api/auth/member/register', input);
      setState((current) => ({ ...current, member: json.member }));
      return json.member as PublicMember;
    },
    login: async (email: string, password: string) => {
      const json = await postJson('/api/auth/member/login', { email, password });
      setState((current) => ({ ...current, member: json.member }));
      return json.member as PublicMember;
    },
    logout: async () => {
      await fetch('/api/auth/member', { method: 'DELETE' });
      setState((current) => ({ ...current, member: null }));
    },
    /** Full-page redirect to the provider; comes back to `returnTo` with ?auth=success or ?auth_error=... */
    loginWith: (provider: OAuthProvider, returnTo: string = window.location.pathname + window.location.search) => {
      window.location.href = `/api/auth/member/oauth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
    },
    updateProfile: async (changes: { displayName?: string; avatarUrl?: string }) => {
      const json = await postJson('/api/auth/member/profile', changes, 'PATCH');
      setState((current) => ({ ...current, member: json.member }));
      return json.member as PublicMember;
    },
    changePassword: (currentPassword: string, newPassword: string) => postJson('/api/auth/member/password', { currentPassword, newPassword }),
    deleteAccount: async () => {
      await postJson('/api/auth/member/account', { confirm: 'DELETE' }, 'DELETE');
      setState((current) => ({ ...current, member: null }));
    },
  };
}
