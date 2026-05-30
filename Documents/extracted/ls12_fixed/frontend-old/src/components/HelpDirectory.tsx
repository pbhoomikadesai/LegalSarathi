'use client';
import { HELP_CONTACTS } from '@/lib/helpContacts';
import { LangCode } from '@/context/LangContext';
import { t } from '@/lib/i18n';

export function HelpDirectory({ lang }: { lang: LangCode }) {
  return (
    <div style={{
      background: '#1F2937', borderRadius: '20px', padding: '20px',
      marginTop: '20px'
    }}>
      <div style={{
        color: '#F9FAFB', fontWeight: 700, fontSize: '14px',
        marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em'
      }}>
        🆘 {t(lang, 'emergencyContacts')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
        {HELP_CONTACTS.map((c, i) => (
          <a
            key={i}
            href={c.phone ? `tel:${c.phone}` : c.url}
            target={c.phone ? undefined : '_blank'}
            rel="noopener noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', gap: '2px',
              padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
              background: c.category === 'emergency' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)',
              border: c.category === 'emergency' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
              transition: 'background 0.2s',
            }}
          >
            <span style={{ fontSize: '18px' }}>{c.icon}</span>
            <span style={{ color: '#F9FAFB', fontWeight: 700, fontSize: '12px' }}>{c.name}</span>
            {c.phone && (
              <span style={{ color: '#FCA5A5', fontSize: '13px', fontWeight: 800 }}>{c.phone}</span>
            )}
            <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{c.desc}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
