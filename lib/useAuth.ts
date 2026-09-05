import { useEffect, useSyncExternalStore } from 'react';

export type UserRole = 'member' | 'host' | 'organizer' | 'venue_owner' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  badgeLabel?: string;
  bio?: string;
  isVerified?: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'user-me',
  name: 'นภัสสร รักษ์ธรรมชาติ',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  role: 'member',
  badgeLabel: 'สมาชิกทั่วไป',
  isVerified: false,
};

let globalIsLoggedIn = false;
let globalUserProfile: UserProfile = DEFAULT_PROFILE;
let isInitialized = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLoggedInSnapshot() {
  return globalIsLoggedIn;
}

function getProfileSnapshot() {
  return globalUserProfile;
}

function getServerLoggedInSnapshot() {
  return false;
}

function getServerProfileSnapshot() {
  return DEFAULT_PROFILE;
}

function getAuthReadySnapshot() {
  return isInitialized;
}

function getServerAuthReadySnapshot() {
  return false;
}

function initFromStorage() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;
  const savedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  globalIsLoggedIn = savedLoggedIn;

  const savedRole = (localStorage.getItem('user_role') as UserRole) || 'member';
  const savedProfile = localStorage.getItem('user_profile');
  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);
      globalUserProfile = { ...DEFAULT_PROFILE, ...parsed, role: savedRole };
    } catch {
      globalUserProfile = { ...DEFAULT_PROFILE, role: savedRole };
    }
  } else {
    globalUserProfile = { ...DEFAULT_PROFILE, role: savedRole };
  }
}

export function useAuth() {
  const isAuthReady = useSyncExternalStore(subscribe, getAuthReadySnapshot, getServerAuthReadySnapshot);
  const isLoggedIn = useSyncExternalStore(subscribe, getLoggedInSnapshot, getServerLoggedInSnapshot);
  const userProfile = useSyncExternalStore(subscribe, getProfileSnapshot, getServerProfileSnapshot);

  useEffect(() => {
    if (!isInitialized) {
      initFromStorage();
      listeners.forEach((l) => l());
    }
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    globalIsLoggedIn = status;
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
    listeners.forEach((l) => l());
  };

  const handleSetRole = (role: UserRole) => {
    const roleBadges: Record<UserRole, string> = {
      member: 'สมาชิกทั่วไป',
      host: 'Verified Host',
      organizer: 'Official Organizer',
      venue_owner: 'Verified Space Owner',
      admin: 'Super Admin',
    };
    const updated: UserProfile = {
      ...globalUserProfile,
      role,
      badgeLabel: roleBadges[role] || 'สมาชิกทั่วไป',
      isVerified: role !== 'member',
    };
    globalUserProfile = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_profile', JSON.stringify(updated));
    }
    listeners.forEach((l) => l());
  };

  const isAdmin = userProfile.role === 'admin';
  const isHost = userProfile.role === 'host' || isAdmin;
  const isOrganizer = userProfile.role === 'organizer' || isAdmin;
  const isVenueOwner = userProfile.role === 'venue_owner' || isAdmin;
  const isMember = userProfile.role === 'member';

  return {
    isLoggedIn,
    isAuthReady,
    userProfile,
    handleSetIsLoggedIn,
    handleSetRole,
    isAdmin,
    isHost,
    isOrganizer,
    isVenueOwner,
    isMember,
  };
}


