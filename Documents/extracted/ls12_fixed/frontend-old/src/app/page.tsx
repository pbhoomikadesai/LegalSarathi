'use client';
import { useState, useRef } from 'react';
import { useLang } from '@/context/LangContext';
import { t } from '@/lib/i18n';
import { useBuddyQuery } from '@/hooks/useBuddyQuery';
import { LangSelector } from '@/components/LangSelector';
import { BuddyInput } from '@/components/BuddyInput';
import { BuddyCard } from '@/components/BuddyCard';
import { HelpDirectory } from '@/components/HelpDirectory';

export default function Home() {
  const { lang } = useLang();
  const { ask, askVoice, getTTS, downloadDraftPdf, loading, error, response } = useBuddyQuery();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrFileName, setOcrFileName] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrExpanded, setOcrExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async (text: string) => {
    setAudioUrl(undefined);
    const result = await ask(text, lang);
    if (result?.buddy_text) {
      const url = await getTTS(result.buddy_text, lang);
      setAudioUrl(url);
    }
  };

  const handleVoiceResult = async (blob: Blob) => {
    setAudioUrl(undefined);
    const { audioUrl: url } = await askVoice(blob, lang);
    if (url) setAudioUrl(url);
  };

  const handleDownloadPdf = async (docType: string) => {
    if (!response) return;
    await downloadDraftPdf(response.query, docType, lang);
  };

  const handleRequestTTS = async () => {
    if (!response?.buddy_text) return;
    const url = await getTTS(response.buddy_text, lang);
    setAudioUrl(url);
  };

  const handleReset = () => {
    setAudioUrl(undefined);
    setOcrText(null);
    setOcrFileName('');
    window.location.reload();
  };

  const handleOcrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrFileName(file.name);
    setOcrLoading(true);
    setOcrText(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('lang', lang);
      const res = await fetch('http://localhost:8000/api/ocr-extract', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('OCR failed');
      const data = await res.json();
      setOcrText(data.extracted_text);
      setOcrExpanded(true);
    } catch {
      setOcrText('OCR failed — try a clearer image.');
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOcrSubmit = async () => {
    if (!ocrText || !ocrFileName) return;
    setAudioUrl(undefined);

    const analysisPrompt = `Please summarize the following legal document using simple words. Explain any complex legal terminologies clearly. Provide the summary and important keys as bullet points in the target language.\n\nDocument Contents:\n${ocrText}`;

    const result = await ask(analysisPrompt, lang);
    if (result?.buddy_text) {
      const url = await getTTS(result.buddy_text, lang);
      setAudioUrl(url);
    }
  };

  return (
    <>
      {/* Bounce animation for loading dots */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F3F4F6; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FFF7F0 0%, #FFFBF8 50%, #F8F9FF 100%)',
      }}>
        {/* ── HEADER ── */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #F3F4F6',
          padding: '0 20px',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.01em' }}>
                  ⚖️ {t(lang, 'appName')}
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
                  {t(lang, 'tagline')}
                </p>
              </div>
              {response && (
                <button
                  onClick={handleReset}
                  style={{
                    padding: '6px 14px', borderRadius: '999px',
                    border: '1px solid #E5E7EB', background: '#F9FAFB',
                    color: '#374151', fontWeight: 600, fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  + {t(lang, 'newQuery')}
                </button>
              )}
            </div>
            {/* Language selector */}
            <LangSelector />
          </div>
        </header>

        {/* ── MAIN ── */}
        <main style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px 120px' }}>

          {/* Greeting — shown only before first response */}
          {!response && !loading && (
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '24px',
              marginBottom: '20px', border: '1px solid #E5E7EB',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🤝</div>
              <p style={{
                margin: 0, fontSize: '17px', lineHeight: '1.7', color: '#374151',
                fontWeight: 500
              }}>
                {t(lang, 'greeting')}
              </p>
            </div>
          )}

          {/* Input box */}
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '20px',
            marginBottom: '20px', border: '1px solid #E5E7EB',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🎙 {t(lang, 'typeOrSpeak')}
            </div>
            <BuddyInput
              lang={lang}
              onTextSubmit={handleTextSubmit}
              onVoiceResult={handleVoiceResult}
              loading={loading}
            />

            {/* ── OCR Upload Row ── */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="ocr-file-input"
                  accept="image/*,.pdf"
                  onChange={handleOcrFileSelect}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="ocr-file-input"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px',
                    border: '1.5px dashed #D1D5DB', background: '#F9FAFB',
                    color: '#6B7280', fontWeight: 600, fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  {ocrLoading ? '⏳ Reading...' : '📷 Upload Image / PDF'}
                </label>

                {ocrText && !loading && (
                  <button
                    id="ocr-submit-btn"
                    onClick={handleOcrSubmit}
                    style={{
                      padding: '8px 16px', borderRadius: '10px',
                      border: 'none', background: '#F97316',
                      color: '#fff', fontWeight: 700, fontSize: '13px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    ⚖️ Analyse Document
                  </button>
                )}

                {ocrFileName && (
                  <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                    📄 {ocrFileName}
                  </span>
                )}
              </div>

              {/* OCR extracted text preview */}
              {ocrText && (
                <div style={{
                  marginTop: '12px', borderRadius: '10px',
                  border: '1px solid #E5E7EB', overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setOcrExpanded(!ocrExpanded)}
                    style={{
                      width: '100%', padding: '10px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#F0FDF4', border: 'none',
                      color: '#166534', fontWeight: 700, fontSize: '13px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <span>✅ Extracted from document</span>
                    <span>{ocrExpanded ? '▲' : '▼'}</span>
                  </button>
                  {ocrExpanded && (
                    <div style={{
                      padding: '12px 14px', background: '#F9FAFB',
                      fontSize: '13px', color: '#374151', lineHeight: '1.6',
                      maxHeight: '150px', overflowY: 'auto',
                      whiteSpace: 'pre-wrap', fontFamily: 'monospace',
                    }}>
                      {ocrText.slice(0, 600)}{ocrText.length > 600 ? '…' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '12px', color: '#DC2626', fontSize: '14px', fontWeight: 500,
              marginBottom: '20px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Buddy Response Card */}
          {response && (
            <div style={{ marginBottom: '20px' }}>
              <BuddyCard
                response={response}
                lang={lang}
                audioUrl={audioUrl}
                onRequestTTS={handleRequestTTS}
                onDownloadPdf={handleDownloadPdf}
              />
            </div>
          )}

          {/* Help Directory — always visible */}
          <HelpDirectory lang={lang} />
        </main>
      </div>
    </>
  );
}
