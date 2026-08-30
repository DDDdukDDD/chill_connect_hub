import { useState, useEffect, useSyncExternalStore } from 'react';

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
  badgeLabel: 'สมาชิก',
  isVerified: false,
};

let globalIsLoggedIn = false;
let globalUserProfile: UserProfile = DEFAULT_PROFILE;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return globalIsLoggedIn;
}

function getServerSnapshot() {
  return false;
}

export function useAuth() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(globalUserProfile);
  const isLoggedIn = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isLoggedIn') === 'true';
      if (saved !== globalIsLoggedIn) {
        globalIsLoggedIn = saved;
      }
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
      setUserProfile(globalUserProfile);
      listeners.forEach((l) => l());
      setIsAuthReady(true);
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
    const updated = {
      ...globalUserProfile,
      role,
      badgeLabel: roleBadges[role] || 'สมาชิก',
      isVerified: role !== 'member',
    };
    globalUserProfile = updated;
    setUserProfile(updated);
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
  };
}

