import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface UserProfile {
  name: string;
  email?: string;
  state: string;
  interests: string[];
}

type Theme = "light" | "dark";

interface AuthContextValue {
  isAuthenticated: boolean;
  phone: string | null;
  login: (phone: string) => void;
  logout: () => void;

  // Guest mode (separate from authenticated)
  isGuest: boolean;
  guestName: string | null;
  loginAsGuest: (name: string) => void;

  hasOnboarded: boolean;
  setOnboarded: (v: boolean) => void;
  hasChosenLanguage: boolean;
  setChosenLanguage: (v: boolean) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;

  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const KEY_AUTH = "isAuthenticated";
const KEY_PHONE = "ls.phone";
const KEY_ONBOARDED = "ls.onboarded";
const KEY_LANG_CHOSEN = "ls.langChosen";
const KEY_ONBOARDING_COMPLETE = "onboardingComplete";
const KEY_PROFILE = "ls.profile";
const KEY_PREMIUM = "isPremium";
const KEY_GUEST = "guestMode";
const KEY_GUEST_NAME = "guestName";
const KEY_THEME = "theme";

const safeGet = (k: string): string | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(k);
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
const safeRemove = (k: string) => {
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* no-op */
  }
};

const DEFAULT_PROFILE: UserProfile = { name: "Priya", email: "", state: "", interests: [] };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => safeGet(KEY_AUTH) === "true");
  const [phone, setPhone] = useState<string | null>(() => safeGet(KEY_PHONE));
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => safeGet(KEY_ONBOARDED) === "true");
  const [hasChosenLanguage, setHasChosenLanguage] = useState<boolean>(() => safeGet(KEY_LANG_CHOSEN) === "true");
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(() => safeGet(KEY_ONBOARDING_COMPLETE) === "true");
  const [isPremium, setIsPremiumState] = useState<boolean>(() => safeGet(KEY_PREMIUM) === "true");
  const [isGuest, setIsGuest] = useState<boolean>(() => safeGet(KEY_GUEST) === "true");
  const [guestName, setGuestName] = useState<string | null>(() => safeGet(KEY_GUEST_NAME));
  const [theme, setThemeState] = useState<Theme>(() => (safeGet(KEY_THEME) === "dark" ? "dark" : "light"));
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const raw = safeGet(KEY_PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Apply theme on root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    safeSet(KEY_THEME, theme);
  }, [theme]);

  const login = useCallback((p: string) => {
    safeSet(KEY_AUTH, "true");
    safeSet(KEY_PHONE, p);
    safeRemove(KEY_GUEST);
    safeRemove(KEY_GUEST_NAME);
    setIsGuest(false);
    setGuestName(null);
    setPhone(p);
    setIsAuthenticated(true);
  }, []);

  const loginAsGuest = useCallback((name: string) => {
    const n = name.trim();
    safeSet(KEY_GUEST, "true");
    safeSet(KEY_GUEST_NAME, n);
    setGuestName(n);
    setIsGuest(true);
    // guests are NOT authenticated
  }, []);

  const logout = useCallback(() => {
    safeRemove(KEY_AUTH);
    safeRemove(KEY_PHONE);
    safeRemove(KEY_GUEST);
    safeRemove(KEY_GUEST_NAME);
    safeRemove(KEY_PREMIUM);
    safeRemove(KEY_ONBOARDING_COMPLETE);
    safeRemove(KEY_PROFILE);
    setPhone(null);
    setIsAuthenticated(false);
    setIsGuest(false);
    setGuestName(null);
    setIsPremiumState(false);
    setOnboardingCompleteState(false);
    setProfileState(DEFAULT_PROFILE);
  }, []);

  const setOnboarded = useCallback((v: boolean) => {
    safeSet(KEY_ONBOARDED, v ? "true" : "false");
    setHasOnboarded(v);
  }, []);

  const setChosenLanguage = useCallback((v: boolean) => {
    safeSet(KEY_LANG_CHOSEN, v ? "true" : "false");
    setHasChosenLanguage(v);
  }, []);

  const setOnboardingComplete = useCallback((v: boolean) => {
    safeSet(KEY_ONBOARDING_COMPLETE, v ? "true" : "false");
    setOnboardingCompleteState(v);
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    try {
      safeSet(KEY_PROFILE, JSON.stringify(p));
    } catch {
      /* no-op */
    }
    setProfileState(p);
  }, []);

  const setIsPremium = useCallback((v: boolean) => {
    safeSet(KEY_PREMIUM, v ? "true" : "false");
    setIsPremiumState(v);
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_AUTH) setIsAuthenticated(e.newValue === "true");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      phone,
      login,
      logout,
      isGuest,
      guestName,
      loginAsGuest,
      hasOnboarded,
      setOnboarded,
      hasChosenLanguage,
      setChosenLanguage,
      onboardingComplete,
      setOnboardingComplete,
      profile,
      setProfile,
      isPremium,
      setIsPremium,
      theme,
      setTheme,
      toggleTheme,
    }),
    [
      isAuthenticated, phone, login, logout, isGuest, guestName, loginAsGuest,
      hasOnboarded, setOnboarded, hasChosenLanguage, setChosenLanguage,
      onboardingComplete, setOnboardingComplete, profile, setProfile,
      isPremium, setIsPremium, theme, setTheme, toggleTheme,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
