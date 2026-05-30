'use client';
import React, { createContext, useContext, useState } from 'react';

export type LangCode = 'hi' | 'ta' | 'te' | 'mr' | 'bn' | 'en' | 'kn';

interface LangContextType {
  lang: LangCode;
  setLang: (l: LangCode) => void;
}

const LangContext = createContext<LangContextType>({ lang: 'hi', setLang: () => { } });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>('hi');
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
