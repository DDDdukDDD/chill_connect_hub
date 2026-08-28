import { useState, useEffect } from 'react';

let globalIsLoggedIn = false;
let hasHydrated = false;

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(globalIsLoggedIn);
  const [isAuthReady, setIsAuthReady] = useState(hasHydrated);

  useEffect(() => {
    hasHydrated = true;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isLoggedIn');
      const loggedIn = saved === 'true';
      globalIsLoggedIn = loggedIn;
      setIsLoggedIn(loggedIn);
      setIsAuthReady(true);
    }
  }, []);

  const handleSetIsLoggedIn = (status: boolean) => {
    globalIsLoggedIn = status;
    setIsLoggedIn(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    }
  };

  return { isLoggedIn, isAuthReady, handleSetIsLoggedIn };
}
