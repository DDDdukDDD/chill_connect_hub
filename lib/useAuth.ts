import { useSyncExternalStore } from 'react';
import { memberActions, refreshMemberSession, useMemberSession } from './useMemberSession';
import { nameInitial } from './displayName';
import type { PublicMember } from './members/types';

/**
 * Page-level auth state. Who is signed in comes from the server session (lib/useMemberSession.ts);
 * this hook keeps the shape the pages already use.
 *
 * `role` is still a client-side preview switch (Navbar / CreateEventModal demo). It never grants
 * access: admin access is decided by the server (/api/auth/admin).
 */
export type UserRole = 'member' | 'host' | 'organizer' | 'venue_owner' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  badgeLabel?: string;
  bio?: string;
  isVerified?: boolean;
  email?: string;
}

const ROLE_BADGES: Record<UserRole, string> = {
  member: 'สมาชิกทั่วไป',
  host: 'Verified Host',
  organizer: 'Official Organizer',
  venue_owner: 'Verified Space Owner',
  admin: 'Super Admin',
};

const AVATAR_COLORS = ['#4A7C59', '#2563EB', '#D04A1B', '#7C3AED', '#0F766E', '#B45309'];

/** Initial-letter avatar for members without a photo (no third-party avatar service) */
export function initialsAvatar(name: string, seed = name): string {
  const letter = nameInitial(name).replace(/[<>&"']/g, '?');
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${color}"/><text x="32" y="42" font-family="sans-serif" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const GUEST_NAME = 'ผู้เยี่ยมชม';

function toProfile(member: PublicMember | null, role: UserRole): UserProfile {
  const name = member?.displayName ?? GUEST_NAME;
  return {
    id: member?.id ?? 'guest',
    name,
    avatar: member?.avatarUrl || initialsAvatar(name, member?.id ?? 'guest'),
    role,
    badgeLabel: ROLE_BADGES[role],
    isVerified: role !== 'member',
    email: member?.email,
  };
}

// Preview role (local only)
let previewRole: UserRole | null = null;
const roleListeners = new Set<() => void>();
function readRole(): UserRole {
  if (previewRole) return previewRole;
  try {
    const saved = localStorage.getItem('user_role') as UserRole | null;
    previewRole = saved && saved in ROLE_BADGES ? saved : 'member';
  } catch {
    previewRole = 'member';
  }
  return previewRole;
}
function subscribeRole(listener: () => void) {
  roleListeners.add(listener);
  return () => {
    roleListeners.delete(listener);
  };
}

let cachedProfile: { member: PublicMember | null; role: UserRole; profile: UserProfile } | null = null;
function profileFor(member: PublicMember | null, role: UserRole): UserProfile {
  if (!cachedProfile || cachedProfile.member !== member || cachedProfile.role !== role) {
    cachedProfile = { member, role, profile: toProfile(member, role) };
  }
  return cachedProfile.profile;
}

export function useAuth() {
  const session = useMemberSession();
  const role = useSyncExternalStore(subscribeRole, readRole, () => 'member' as UserRole);
  const userProfile = profileFor(session.member, role);

  /** Pages call this after AuthModal succeeds (true) or to log out (false) */
  const handleSetIsLoggedIn = (status: boolean) => {
    void (status ? refreshMemberSession() : memberActions.logout());
  };

  const handleSetRole = (next: UserRole) => {
    previewRole = next;
    try {
      localStorage.setItem('user_role', next);
    } catch {
      /* storage unavailable */
    }
    roleListeners.forEach((listener) => listener());
  };

  const isAdmin = role === 'admin';
  return {
    isLoggedIn: session.isLoggedIn,
    isAuthReady: session.isLoaded,
    userProfile,
    member: session.member,
    handleSetIsLoggedIn,
    handleSetRole,
    isAdmin,
    isHost: role === 'host' || isAdmin,
    isOrganizer: role === 'organizer' || isAdmin,
    isVenueOwner: role === 'venue_owner' || isAdmin,
    isMember: role === 'member',
  };
}
