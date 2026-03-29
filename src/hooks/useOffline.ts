import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}

export function useLocalPersistence(key: string) {
  const save = useCallback((data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('[Persistence] Save failed:', e);
    }
  }, [key]);

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [key]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { save, load, clear };
}

/** Check if PWA is installed */
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    setIsPWA(mql.matches || (navigator as any).standalone === true);
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isPWA;
}
