import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface GuestContextValue {
  count: number;
  limit: number;
  remaining: number;
  /** Returns false if the action was blocked (limit reached, login prompt shown) */
  tryConsume: () => boolean;
  showUpgrade: boolean;
  openUpgrade: () => void;
  closeUpgrade: () => void;
  showLoginPrompt: boolean;
  openLoginPrompt: () => void;
  closeLoginPrompt: () => void;
  resetGuest: () => void;
}

const KEY_COUNT = "guestUsageCount";
const LIMIT = 5;

const safeGet = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* no-op */
  }
};

const GuestContext = createContext<GuestContextValue | undefined>(undefined);

export const GuestProvider = ({ children }: { children: ReactNode }) => {
  const { isPremium, isAuthenticated, isGuest: isGuestUser } = useAuth();
  const [count, setCount] = useState<number>(() => {
    const raw = safeGet(KEY_COUNT);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? Math.min(LIMIT, Math.max(0, n)) : 0;
  });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Only explicit guest users (loginAsGuest) are limited; authenticated and premium are unlimited.
  const isUnlimited = isPremium || isAuthenticated;
  const isGuest = isGuestUser && !isPremium;

  useEffect(() => {
    safeSet(KEY_COUNT, String(count));
  }, [count]);

  const tryConsume = useCallback((): boolean => {
    // Limit removed for developer
    return true;
  }, []);

  const openUpgrade = useCallback(() => setShowUpgrade(true), []);
  const closeUpgrade = useCallback(() => setShowUpgrade(false), []);
  const openLoginPrompt = useCallback(() => setShowLoginPrompt(true), []);
  const closeLoginPrompt = useCallback(() => setShowLoginPrompt(false), []);
  const resetGuest = useCallback(() => {
    setCount(0);
    safeSet(KEY_COUNT, "0");
  }, []);

  const value = useMemo<GuestContextValue>(
    () => ({
      count: isGuest ? count : 0,
      limit: LIMIT,
      remaining: isGuest ? Math.max(0, LIMIT - count) : LIMIT,
      tryConsume,
      showUpgrade,
      openUpgrade,
      closeUpgrade,
      showLoginPrompt,
      openLoginPrompt,
      closeLoginPrompt,
      resetGuest,
    }),
    [count, isGuest, tryConsume, showUpgrade, openUpgrade, closeUpgrade, showLoginPrompt, openLoginPrompt, closeLoginPrompt, resetGuest]
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
};

export const useGuest = () => {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
};
