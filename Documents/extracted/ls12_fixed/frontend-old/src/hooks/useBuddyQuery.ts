import { useState } from 'react';

const BASE = 'http://localhost:8000';

export interface BuddyResponse {
  query: string;
  lang: string;
  legal_keys: string[];
  rag_chunks_used?: string[];
  citation_score?: number;
  citation_badge?: string;
  situation_summary: string;
  severity_level: 'INFO' | 'CAUTION' | 'DANGER';
  rights: string[];
  action_steps: string[];
  do_not_do: string[];
  evidence_required: string[];
  jurisdiction_note: string;
  awareness: string;
  buddy_text: string;
  help_channels: { name: string; phone?: string | null; url: string; label_in_lang?: string }[];
  source_urls: string[];
  latency: { translation: number; parallel: number; gguf: number; synthesis: number; total: number };
}

export function useBuddyQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<BuddyResponse | null>(null);

  const ask = async (text: string, lang: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, language: lang }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Request failed');
      }
      const data: BuddyResponse = await res.json();
      setResponse(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const askVoice = async (audioBlob: Blob, lang: string): Promise<{ audioUrl: string; transcription: string; result: BuddyResponse | null }> => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('lang', lang);
      const res = await fetch(`${BASE}/api/voice-query`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Voice query failed');
      }
      const transcription = res.headers.get('X-Transcription') || '';
      const resultHeader = res.headers.get('X-Query-Result') || '{}';
      let result: BuddyResponse | null = null;
      try { result = JSON.parse(resultHeader); } catch { /* ignore */ }
      if (result) setResponse(result);
      const blob = await res.blob();
      return { audioUrl: URL.createObjectURL(blob), transcription, result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice error';
      setError(msg);
      return { audioUrl: '', transcription: '', result: null };
    } finally {
      setLoading(false);
    }
  };

  const getTTS = async (text: string, lang: string): Promise<string> => {
    const res = await fetch(`${BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) return '';
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  const downloadDraftPdf = async (query: string, docType: string, lang: string) => {
    try {
      const res = await fetch(`${BASE}/api/generate-draft-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, doc_type: docType, lang }),
      });
      if (!res.ok) throw new Error('Failed to generate draft');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docType.toLowerCase()}_draft.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Error generating document draft.');
    }
  };

  return { ask, askVoice, getTTS, downloadDraftPdf, loading, error, response, setResponse };
}
