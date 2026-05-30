import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANGUAGES, getLanguage, type LangCode, type LanguageMeta } from "@desktop/i18n/languages";
import { TRANSLATIONS, type TranslationKey } from "@desktop/i18n/translations";

interface LanguageContextValue {
  lang: LangCode;
  meta: LanguageMeta;
  setLang: (l: LangCode) => void;
  t: (key: TranslationKey) => string;
  shimmer: boolean;
  applyWithShimmer: (l: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "appLanguage";
const LEGACY_KEY = "ls.lang";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const saved = (window.localStorage.getItem(STORAGE_KEY) ||
        window.localStorage.getItem(LEGACY_KEY)) as LangCode | null;
      return saved && LANGUAGES.some((l) => l.code === saved) ? saved : "en";
    } catch {
      return "en";
    }
  });
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = getLanguage(lang).locale;
    } catch {
      /* no-op */
    }
  }, [lang]);

  const setLang = useCallback((l: LangCode) => setLangState(l), []);

  const applyWithShimmer = useCallback((l: LangCode) => {
    setShimmer(true);
    setLangState(l);
    window.setTimeout(() => setShimmer(false), 320);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const row = TRANSLATIONS[key];
      if (!row) {
        if (typeof console !== "undefined") console.warn(`[i18n] Missing translation key: ${String(key)}`);
        return String(key);
      }
      return row[lang] ?? row.en ?? String(key);
    },
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, meta: getLanguage(lang), setLang, t, shimmer, applyWithShimmer }),
    [lang, setLang, t, shimmer, applyWithShimmer]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {shimmer && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-[shimmer-sweep_0.32s_ease-out]" />
        </div>
      )}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
