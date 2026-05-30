'use client';
import React, { useState, useRef, useEffect } from 'react';
import { LangCode } from '@/context/LangContext';
import { t } from '@/lib/i18n';

interface BuddyInputProps {
  lang: LangCode;
  onTextSubmit: (text: string) => void;
  onVoiceResult: (audioBlob: Blob) => void;
  loading: boolean;
}

type RecState = 'idle' | 'recording' | 'processing';

export function BuddyInput({ lang, onTextSubmit, onVoiceResult, loading }: BuddyInputProps) {
  const [text, setText] = useState('');
  const [recState, setRecState] = useState<RecState>('idle');
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(18).fill(4));
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const waveRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (recState === 'recording') {
      waveRef.current = setInterval(() => {
        setWaveHeights(Array(18).fill(0).map(() => Math.random() * 32 + 4));
      }, 80);
    } else {
      if (waveRef.current) clearInterval(waveRef.current);
      setWaveHeights(Array(18).fill(4));
    }
    return () => { if (waveRef.current) clearInterval(waveRef.current); };
  }, [recState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !loading) { onTextSubmit(text.trim()); setText(''); }
  };

  const startRecording = async () => {
    try {
      // Request mono 16kHz — Whisper's optimal input format
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,        // mono
          sampleRate: 16000,      // 16kHz — Whisper native
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Cross-browser MIME type fallback: Chrome=webm, Firefox=ogg, Safari=mp4
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? '';

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000,  // 128kbps — clear speech quality
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        setRecState('processing');
        onVoiceResult(blob);
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecState('recording');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Microphone error: ${msg}`);
    }
  };


  const stopRecording = () => { mediaRef.current?.stop(); };

  const isActive = recState === 'recording';

  return (
    <div>
      {/* Waveform / status bar — only shown during voice interaction */}
      {recState !== 'idle' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '12px', padding: '10px 16px',
          background: isActive ? '#FFF0E8' : '#F3F4F6',
          borderRadius: '12px', border: isActive ? '1px solid #FDBA74' : '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '36px' }}>
            {waveHeights.map((h, i) => (
              <div key={i} style={{
                width: '3px', height: `${h}px`,
                background: isActive ? '#E8540A' : '#9CA3AF',
                borderRadius: '3px', transition: 'height 0.08s ease'
              }} />
            ))}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: isActive ? '#E8540A' : '#6B7280' }}>
            {recState === 'recording' ? t(lang, 'listening') : t(lang, 'processing')}
          </span>
        </div>
      )}

      {loading && recState === 'idle' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
          padding: '10px 16px', background: '#FFF0E8', borderRadius: '12px', border: '1px solid #FDBA74'
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#E8540A', opacity: 0.8,
              animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`
            }} />
          ))}
          <span style={{ color: '#E8540A', fontWeight: 600, fontSize: '14px' }}>{t(lang, 'processing')}</span>
        </div>
      )}

      {/* Main input row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        {/* Mic button */}
        <button
          type="button"
          disabled={loading || recState === 'processing'}
          onClick={isActive ? stopRecording : startRecording}
          style={{
            width: '52px', height: '52px', borderRadius: '50%', border: 'none',
            background: isActive ? '#EF4444' : '#E8540A',
            color: '#fff', fontSize: '22px', cursor: 'pointer',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isActive ? '0 0 0 6px rgba(239,68,68,0.25)' : '0 4px 12px rgba(232,84,10,0.3)',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s',
            opacity: (loading && !isActive) ? 0.5 : 1
          }}
          title={t(lang, 'micLabel')}
        >
          {isActive ? '⏹' : '🎙️'}
        </button>

        {/* Text area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } }}
            placeholder={t(lang, 'inputPlaceholder')}
            disabled={loading || isActive}
            rows={2}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '14px',
              border: '2px solid #E5E7EB', fontSize: '16px', fontFamily: 'inherit',
              resize: 'none', lineHeight: '1.5', background: '#fff',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#E8540A'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!text.trim() || loading || isActive}
          style={{
            height: '52px', padding: '0 22px', borderRadius: '14px', border: 'none',
            background: '#1F2937', color: '#fff', fontWeight: 700, fontSize: '15px',
            cursor: (!text.trim() || loading) ? 'not-allowed' : 'pointer',
            opacity: (!text.trim() || loading) ? 0.4 : 1, fontFamily: 'inherit',
            flexShrink: 0, transition: 'all 0.2s',
          }}
        >
          {t(lang, 'askLabel')}
        </button>
      </form>
    </div>
  );
}
