'use client';
import React, { useState, useEffect } from 'react';
import { LangCode } from '@/context/LangContext';
import { t } from '@/lib/i18n';
import { BuddyResponse } from '@/hooks/useBuddyQuery';

interface BuddyCardProps {
  response: BuddyResponse;
  lang: LangCode;
  audioUrl?: string;
  onRequestTTS: () => void;
  onDownloadPdf: (docType: string) => void;
}

const SEVERITY = {
  DANGER: { bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', label: '🔴 Urgent' },
  CAUTION: { bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', label: '🟡 Act Soon' },
  INFO:    { bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6', label: '🔵 Informational' },
};

export function BuddyCard({ response, lang, audioUrl, onRequestTTS, onDownloadPdf }: BuddyCardProps) {
  const [showMore, setShowMore] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const sev = SEVERITY[response.severity_level ?? 'INFO'];

  useEffect(() => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.onended = () => setPlaying(false);
      a.onerror  = () => setPlaying(false);
      setAudioEl(a);
      a.play().catch(() => {});
      setPlaying(true);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioEl) { onRequestTTS(); return; }
    if (playing) { audioEl.pause(); setPlaying(false); }
    else { audioEl.play(); setPlaying(true); }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: '20px',
      border: '1px solid #E5E7EB', overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    }}>
      {/* ── Audio + severity banner ── */}
      <div style={{
        background: `linear-gradient(135deg, #E8540A 0%, #FB923C 100%)`,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {/* Play button */}
        <button onClick={togglePlay} style={{
          width: '44px', height: '44px', borderRadius: '50%', border: 'none',
          background: playing ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
          color: '#fff', fontSize: '20px', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
          boxShadow: playing ? '0 0 0 6px rgba(255,255,255,0.15)' : 'none',
        }}>
          {playing ? '⏸' : '▶'}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
            {playing ? '🔊 बोल रहा है...' : t(lang, 'playAudio')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {response.legal_keys.slice(0, 3).join(' · ')}
          </div>
        </div>
        {/* Severity pill */}
        <div style={{
          background: sev.bg, border: `1px solid ${sev.border}`,
          borderRadius: '999px', padding: '4px 10px',
          fontSize: '11px', fontWeight: 700, color: '#374151',
          flexShrink: 0,
        }}>
          {sev.label}
        </div>
        {/* Latency */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '999px', padding: '3px 10px', color: '#fff', fontSize: '10px', flexShrink: 0 }}>
          {response.latency?.total ?? '?'}s
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Citation Badge */}
        {response.citation_badge && (
          <div style={{
            background: response.citation_score >= 0.8 ? '#ECFDF5' : (response.citation_score >= 0.5 ? '#FFFBEB' : '#FEF2F2'),
            border: `1px solid ${response.citation_score >= 0.8 ? '#A7F3D0' : (response.citation_score >= 0.5 ? '#FDE68A' : '#FECACA')}`,
            padding: '8px 12px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontWeight: 600, color: response.citation_score >= 0.8 ? '#065F46' : (response.citation_score >= 0.5 ? '#92400E' : '#991B1B'),
            alignSelf: 'flex-start'
          }}>
            {response.citation_badge}
          </div>
        )}

        {/* Situation */}
        <Section icon="📌" title={t(lang, 'yourSituation')} bg="#FFF7ED" border="#FED7AA">
          <p style={{ margin: 0, lineHeight: '1.75', fontSize: '15px', color: '#374151' }}>
            {response.situation_summary}
          </p>
          {response.jurisdiction_note && (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
              ⚖️ {response.jurisdiction_note}
            </p>
          )}
        </Section>

        {/* Rights — green */}
        <Section icon="✅" title={t(lang, 'yourRights')} bg="#F0FDF4" border="#BBF7D0">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {response.rights.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#15803D', lineHeight: '1.6' }}>
                <span style={{ flexShrink: 0, fontWeight: 800 }}>✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Action steps — blue, numbered */}
        <Section icon="🎯" title={t(lang, 'whatToDo')} bg="#EFF6FF" border="#BFDBFE">
          <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {response.action_steps.map((s, i) => (
              <li key={i} style={{ fontSize: '14px', color: '#1D4ED8', lineHeight: '1.6', fontWeight: 500 }}>
                {s}
              </li>
            ))}
          </ol>
        </Section>

        {/* Do NOT do — red warning */}
        {response.do_not_do?.length > 0 && (
          <Section icon="🚫" title="यह मत करो / Don't Do" bg="#FEF2F2" border="#FECACA">
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {response.do_not_do.map((d, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#DC2626', lineHeight: '1.6' }}>
                  <span style={{ flexShrink: 0 }}>✗</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Evidence required — amber */}
        {response.evidence_required?.length > 0 && (
          <Section icon="📋" title="अभी इकट्ठा करें / Collect Now" bg="#FFFBEB" border="#FDE68A">
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {response.evidence_required.map((e, i) => (
                <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: '#92400E' }}>
                  <span>📎</span><span>{e}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Awareness — purple */}
        {response.awareness && (
          <Section icon="💡" title={t(lang, 'goodToKnow')} bg="#FAF5FF" border="#DDD6FE">
            <p style={{ margin: 0, lineHeight: '1.75', fontSize: '14px', color: '#5B21B6' }}>
              {response.awareness}
            </p>
          </Section>
        )}

        {/* Help channels */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            📞 {t(lang, 'helpTitle')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {response.help_channels.slice(0, showMore ? undefined : 4).map((ch, i) => (
              <a key={i}
                href={ch.phone ? `tel:${ch.phone}` : ch.url}
                target={ch.phone ? undefined : '_blank'}
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', textDecoration: 'none',
                  background: ch.phone ? '#E8540A' : '#1F2937',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'opacity 0.2s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {ch.phone ? '📞' : '🔗'} {ch.name}
                {ch.phone && <span style={{ opacity: 0.8, fontSize: '12px' }}>({ch.phone})</span>}
              </a>
            ))}
          </div>
        </div>

        {/* Actions row */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
          <button onClick={() => setShowMore(!showMore)} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid #E5E7EB', background: '#F9FAFB',
            color: '#374151', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {showMore ? '▲ कम' : t(lang, 'learnMore')}
          </button>
          <button onClick={() => onDownloadPdf("RTI")} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid #1D4ED8', background: '#EFF6FF',
            color: '#1D4ED8', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            📄 RTI Draft
          </button>
          <button onClick={() => onDownloadPdf("FIR")} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid #B91C1C', background: '#FEF2F2',
            color: '#B91C1C', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            📄 FIR Draft
          </button>
        </div>

        {/* Sources — expanded */}
        {showMore && response.source_urls?.length > 0 && (
          <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>Sources</div>
            {response.source_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', fontSize: '12px', color: '#3B82F6', marginBottom: '4px', wordBreak: 'break-all' }}>
                {url}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, bg, border, children }: {
  icon: string; title: string; bg: string; border: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: '14px', padding: '14px 16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontWeight: 800, fontSize: '11px', color: '#374151',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
      }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
