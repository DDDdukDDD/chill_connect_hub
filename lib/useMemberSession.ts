'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { HostApplication, LoginMethod, MemberPreferences, MemberProfile, OAuthProvider, PublicMember } from './members/types';

/**
 * Member session for the public site. The server decides who is signed in via an httpOnly cookie;
 * this module keeps one shared copy of that answer for every component on the page (lib/useAuth.ts
 * reads the same store), and drives login, sign-up and logout.
 */
interface SessionState {
  isLoaded: boolean;
  member: PublicMember | null;
  /** Which login buttons work right now (social ones need provider credentials on the server) */
  providers: Record<LoginMethod, boolean>;
}

const EMPTY_PROVIDERS: Record<LoginMethod, boolean> = { email: true, google: false, facebook: false, apple: false };
const INITIAL: SessionState = { isLoaded: false, member: null, providers: EMPTY_PROVIDERS };

let state: SessionState = INITIAL;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(next: Partial<SessionState>) {
  state = { ...state, ...next };
  // Legacy pages still read this flag directly; keep it in step with the real session
  try {
    if (state.isLoaded) localStorage.setItem('isLoggedIn', state.member ? 'true' : 'false');
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Re-reads the session from the server (deduplicated while a request is in flight) */
export function refreshMemberSession(): Promise<void> {
  if (!inflight) {
    inflight = fetch('/api/auth/member', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setState({ isLoaded: true, member: json.member ?? null, providers: json.providers ?? EMPTY_PROVIDERS }))
      .catch(() => setState({ isLoaded: true }))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

async function postJson(url: string, body: unknown, method = 'POST') {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'ทำรายการไม่สำเร็จ');
  return json;
}

export const memberActions = {
  /** Throws Error(message in Thai) on failure */
  register: async (input: { displayName: string; email: string; password: string; consent: boolean; ageConfirmed: boolean }) => {
    const json = await postJson('/api/auth/member/register', input);
    setState({ isLoaded: true, member: json.member });
    // In development (no mailer) the server returns the verification link instead of emailing it
    try {
      if (json.verification?.devVerifyUrl) sessionStorage.setItem('cch_dev_verify_url', json.verification.devVerifyUrl);
    } catch {
      /* storage unavailable */
    }
    return json.member as PublicMember;
  },
  login: async (email: string, password: string) => {
    const json = await postJson('/api/auth/member/login', { email, password });
    setState({ isLoaded: true, member: json.member });
    return json.member as PublicMember;
  },
  logout: async () => {
    await fetch('/api/auth/member', { method: 'DELETE' }).catch(() => undefined);
    setState({ member: null });
  },
  /** Full-page redirect to the provider; comes back to `returnTo` (new members via /onboarding) */
  /** Pass `consented: true` only when the member ticked the age and terms boxes on the sign-up screen */
  loginWith: (provider: OAuthProvider, returnTo: string = window.location.pathname + window.location.search, consented = false) => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- API route that redirects off-site
    window.location.href = `/api/auth/member/oauth/${provider}?returnTo=${encodeURIComponent(returnTo)}${consented ? '&consent=1' : ''}`;
  },
  /** Emails a reset link; resolves with devResetUrl when the server has no mailer (development) */
  requestPasswordReset: async (email: string) => {
    const json = await postJson('/api/auth/member/password-reset', { email });
    return { minutes: json.minutes as number, devResetUrl: json.devResetUrl as string | undefined };
  },
  confirmPasswordReset: async (token: string, password: string) => {
    const json = await postJson('/api/auth/member/password-reset/confirm', { token, password });
    setState({ isLoaded: true, member: json.member });
    return json.member as PublicMember;
  },
  /** Saves onboarding answers to the account; ids not in master data are dropped by the server */
  savePreferences: async (preferences: Omit<MemberPreferences, 'updatedAt'>) => {
    const json = await postJson('/api/auth/member/preferences', preferences, 'PUT');
    setState({ member: json.member });
    return json.preferences as MemberPreferences;
  },
  /** Records that the member accepted the community pledge */
  acceptPledge: async () => {
    const json = await postJson('/api/auth/member/pledge', { accept: true });
    setState({ member: json.member });
    return json.member as PublicMember;
  },
  /** Sends the "confirm your email" link again; resolves with devVerifyUrl when the server has no mailer */
  sendEmailVerification: async () => {
    const json = await postJson('/api/auth/member/verify-email', {});
    return { sent: Boolean(json.sent), alreadyVerified: Boolean(json.alreadyVerified), devVerifyUrl: json.devVerifyUrl as string | undefined };
  },
  confirmEmailVerification: async (token: string) => {
    const json = await postJson('/api/auth/member/verify-email/confirm', { token });
    if (state.member && state.member.id === json.member.id) setState({ member: json.member });
    return json.member as PublicMember;
  },
  submitHostApplication: async (input: { kind: HostApplication['kind']; about: string; link?: string }) => {
    const json = await postJson('/api/auth/member/host-application', input);
    setState({ member: json.member });
    return json.application as HostApplication;
  },
  /** Name, photo and the optional "about me" details, with the list of fields to hide */
  saveProfile: async (changes: { displayName?: string; avatarUrl?: string } & Partial<MemberProfile>) => {
    const json = await postJson('/api/auth/member/profile', changes, 'PATCH');
    setState({ member: json.member });
    return json.details as MemberProfile;
  },
  updateProfile: async (changes: { displayName?: string; avatarUrl?: string }) => {
    const json = await postJson('/api/auth/member/profile', changes, 'PATCH');
    setState({ member: json.member });
    return json.member as PublicMember;
  },
  changePassword: (currentPassword: string, newPassword: string) => postJson('/api/auth/member/password', { currentPassword, newPassword }),
  deleteAccount: async () => {
    await postJson('/api/auth/member/account', { confirm: 'DELETE' }, 'DELETE');
    setState({ member: null });
  },
};

export function useMemberSession() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => INITIAL);

  useEffect(() => {
    if (!state.isLoaded) void refreshMemberSession();
  }, []);

  return {
    ...snapshot,
    isLoggedIn: Boolean(snapshot.member),
    refresh: refreshMemberSession,
    ...memberActions,
  };
}
