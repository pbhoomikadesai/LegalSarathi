'use client';
import { LANGS } from '@/lib/i18n';
import { useLang, LangCode } from '@/context/LangContext';

export function LangSelector() {
  const { lang, setLang } = useLang();

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code as LangCode)}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            border: lang === l.code ? '2px solid #E8540A' : '2px solid #e5e7eb',
            background: lang === l.code ? '#E8540A' : '#fff',
            color: lang === l.code ? '#fff' : '#374151',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {l.nativeName}
        </button>
      ))}
    </div>
  );
}
