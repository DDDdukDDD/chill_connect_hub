import { useState, useEffect, useSyncExternalStore } from 'react';

let globalIsLoggedIn = false;
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
  const isLoggedIn = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const saved = localStorage.getItem('isLoggedIn') === 'true';
    if (saved !== globalIsLoggedIn) {
      globalIsLoggedIn = saved;
      listeners.forEach((l) => l());
    }
    setIsAuthReady(true);
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    globalIsLoggedIn = status;
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
    listeners.forEach((l) => l());
  };

  return { isLoggedIn, isAuthReady, handleSetIsLoggedIn };
}
