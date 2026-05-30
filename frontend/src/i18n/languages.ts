export type LangCode =
  | "kn" | "hi" | "en" | "mr"
  | "te" | "ta" | "bn" | "gu" | "ml" | "pa";

export interface LanguageMeta {
  code: LangCode;
  short: string;   // 2-letter code shown in pill
  native: string;  // native script name only
  locale: string;  // BCP47 for Intl
}

// All 10 languages supported by the backend (STT + TTS + OCR)
export const LANGUAGES: LanguageMeta[] = [
  { code: "hi", short: "HI", native: "हिंदी",       locale: "hi-IN"  },
  { code: "en", short: "EN", native: "English",      locale: "en-IN"  },
  { code: "kn", short: "KN", native: "ಕನ್ನಡ",        locale: "kn-IN"  },
  { code: "ta", short: "TA", native: "தமிழ்",        locale: "ta-IN"  },
  { code: "te", short: "TE", native: "తెలుగు",       locale: "te-IN"  },
  { code: "mr", short: "MR", native: "मराठी",        locale: "mr-IN"  },
  { code: "bn", short: "BN", native: "বাংলা",        locale: "bn-IN"  },
  { code: "gu", short: "GU", native: "ગુજરાતી",      locale: "gu-IN"  },
  { code: "ml", short: "ML", native: "മലയാളം",       locale: "ml-IN"  },
  { code: "pa", short: "PA", native: "ਪੰਜਾਬੀ",       locale: "pa-IN"  },
];

export const getLanguage = (code: LangCode): LanguageMeta =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
