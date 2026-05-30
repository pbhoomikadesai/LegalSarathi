export type LangCode = "kn" | "hi" | "en" | "mr" | "tu" | "kk" | "te" | "ta";

export interface LanguageMeta {
  code: LangCode;
  short: string; // 2-letter code shown in pill
  native: string; // native script name only
  locale: string; // BCP47 for Intl
}

// Order is fixed per spec
export const LANGUAGES: LanguageMeta[] = [
  { code: "kn", short: "KN", native: "ಕನ್ನಡ", locale: "kn-IN" },
  { code: "hi", short: "HI", native: "हिंदी", locale: "hi-IN" },
  { code: "en", short: "EN", native: "English", locale: "en-IN" },
  { code: "mr", short: "MR", native: "मराठी", locale: "mr-IN" },
  { code: "tu", short: "TU", native: "ತುಳು", locale: "kn-IN" },
  { code: "kk", short: "KK", native: "कोंकणी", locale: "kok-IN" },
  { code: "te", short: "TE", native: "తెలుగు", locale: "te-IN" },
  { code: "ta", short: "TA", native: "தமிழ்", locale: "ta-IN" },
];

export const getLanguage = (code: LangCode): LanguageMeta =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[2];
