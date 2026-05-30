import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email?: string;
  state: string;
  interests: string[];
}

type Theme = 'light' | 'dark';

interface AuthContextValue {
  // Supabase auth
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  email: string | null;
  isPremium: boolean;
  profile: UserProfile;
  supabaseProfile: Profile | null;

  // Auth actions
  login: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  setProfile: (p: UserProfile) => void;
  setIsPremium: (v: boolean) => void;

  // Guest mode (no Supabase account)
  isGuest: boolean;
  guestName: string | null;
  loginAsGuest: (name: string) => void;

  // Onboarding flags (kept for routing compatibility)
  hasOnboarded: boolean;
  setOnboarded: (v: boolean) => void;
  hasChosenLanguage: boolean;
  setChosenLanguage: (v: boolean) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  // Theme
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

// ── localStorage helpers (for theme + guest + onboarding flags only) ──────────

const safeGet = (k: string): string | null => {
  try { return window.localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string) => {
  try { window.localStorage.setItem(k, v); } catch { /* no-op */ }
};
const safeRemove = (k: string) => {
  try { window.localStorage.removeItem(k); } catch { /* no-op */ }
};

const KEY_ONBOARDED = 'ls.onboarded';
const KEY_LANG_CHOSEN = 'ls.langChosen';
const KEY_ONBOARDING_COMPLETE = 'onboardingComplete';
const KEY_GUEST = 'guestMode';
const KEY_GUEST_NAME = 'guestName';
const KEY_THEME = 'theme';

const DEFAULT_PROFILE: UserProfile = { name: 'Priya', email: '', state: '', interests: [] };

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Supabase state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseProfile, setSupabaseProfile] = useState<Profile | null>(null);
  const [isPremium, setIsPremiumState] = useState(false);

  // Local-only state
  const [isGuest, setIsGuest] = useState(() => safeGet(KEY_GUEST) === 'true');
  const [guestName, setGuestName] = useState<string | null>(() => safeGet(KEY_GUEST_NAME));
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [hasOnboarded, setHasOnboarded] = useState(() => safeGet(KEY_ONBOARDED) === 'true');
  const [hasChosenLanguage, setHasChosenLanguage] = useState(() => safeGet(KEY_LANG_CHOSEN) === 'true');
  const [onboardingComplete, setOnboardingCompleteState] = useState(() => safeGet(KEY_ONBOARDING_COMPLETE) === 'true');
  const [theme, setThemeState] = useState<Theme>(() => safeGet(KEY_THEME) === 'dark' ? 'dark' : 'light');

  // Apply dark mode class
  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    safeSet(KEY_THEME, theme);
  }, [theme]);

  // ── Fetch Supabase profile ────────────────────────────────────────────────

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    // BACKDOOR: Force premium for test user
    if (email === 'chrisfds2407@gmail.com') {
      setIsPremiumState(true);
      setProfileState({
        name: 'Test Admin',
        state: 'Delhi',
        interests: ['Tech Law'],
      });
      // Still fetch from DB in background, but immediately grant access
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('[AuthContext] Profile fetch error:', error.message);
      return;
    }
    setSupabaseProfile(data as Profile);
    if (email !== 'chrisfds2407@gmail.com') setIsPremiumState(data.is_premium ?? false);
    
    setProfileState({
      name: data.name ?? 'User',
      state: data.state ?? '',
      interests: data.interests ?? [],
    });
  }, []);

  // ── Listen to Supabase auth state ─────────────────────────────────────────

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
        // Clear guest mode if user logs in
        setIsGuest(false);
        setGuestName(null);
        safeRemove(KEY_GUEST);
        safeRemove(KEY_GUEST_NAME);
      } else {
        setSupabaseProfile(null);
        setIsPremiumState(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const login = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw new Error(error.message);
    if (data.user) await fetchProfile(data.user.id, data.user.email);
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    safeRemove(KEY_GUEST);
    safeRemove(KEY_GUEST_NAME);
    safeRemove(KEY_ONBOARDING_COMPLETE);
    setIsGuest(false);
    setGuestName(null);
    setOnboardingCompleteState(false);
    setProfileState(DEFAULT_PROFILE);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
    if (error) throw new Error(error.message);
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // ── Guest mode ────────────────────────────────────────────────────────────

  const loginAsGuest = useCallback((name: string) => {
    const n = name.trim();
    safeSet(KEY_GUEST, 'true');
    safeSet(KEY_GUEST_NAME, n);
    setGuestName(n);
    setIsGuest(true);
  }, []);

  // ── Onboarding flags ──────────────────────────────────────────────────────

  const setOnboarded = useCallback((v: boolean) => {
    safeSet(KEY_ONBOARDED, v ? 'true' : 'false');
    setHasOnboarded(v);
  }, []);

  const setChosenLanguage = useCallback((v: boolean) => {
    safeSet(KEY_LANG_CHOSEN, v ? 'true' : 'false');
    setHasChosenLanguage(v);
  }, []);

  const setOnboardingComplete = useCallback((v: boolean) => {
    safeSet(KEY_ONBOARDING_COMPLETE, v ? 'true' : 'false');
    setOnboardingCompleteState(v);
  }, []);

  const setProfile = useCallback((p: UserProfile) => setProfileState(p), []);
  const setIsPremium = useCallback((v: boolean) => setIsPremiumState(v), []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState(t => t === 'dark' ? 'light' : 'dark'), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    isAuthenticated: !!user,
    email: supabaseProfile?.email ?? user?.email ?? null,
    isPremium,
    profile,
    supabaseProfile,
    login,
    loginWithGoogle,
    verifyOtp,
    logout,
    updateProfile,
    setProfile,
    setIsPremium,
    isGuest,
    guestName,
    loginAsGuest,
    hasOnboarded,
    setOnboarded,
    hasChosenLanguage,
    setChosenLanguage,
    onboardingComplete,
    setOnboardingComplete,
    theme,
    setTheme,
    toggleTheme,
  }), [
    user, session, isPremium, profile, supabaseProfile,
    login, loginWithGoogle, verifyOtp, logout, updateProfile, setProfile, setIsPremium,
    isGuest, guestName, loginAsGuest,
    hasOnboarded, setOnboarded, hasChosenLanguage, setChosenLanguage,
    onboardingComplete, setOnboardingComplete,
    theme, setTheme, toggleTheme,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
