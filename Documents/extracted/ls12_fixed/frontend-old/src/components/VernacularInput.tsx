'use client';
import React, { useState, useRef, useEffect } from 'react';

interface VernacularInputProps {
  onSubmit: (text: string) => void;
  onAudioResponse?: (audioUrl: string, transcription: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'processing';

export function VernacularInput({ onSubmit, onAudioResponse }: VernacularInputProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState('');
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const waveAnimRef = useRef<NodeJS.Timeout | null>(null);

  // Animate waveform bars while recording
  useEffect(() => {
    if (recordingState === 'recording') {
      waveAnimRef.current = setInterval(() => {
        setWaveHeights(Array(20).fill(0).map(() => Math.random() * 36 + 4));
      }, 100);
    } else {
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
      setWaveHeights(Array(20).fill(4));
    }
    return () => { if (waveAnimRef.current) clearInterval(waveAnimRef.current); };
  }, [recordingState]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) { onSubmit(text); setText(''); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleRecordingStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingState('recording');
    } catch {
      alert('Microphone access denied. Please allow mic permission.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecordingState('processing');
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('lang', 'hi');

    try {
      const res = await fetch('http://localhost:8000/api/voice-query', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Voice query failed');
      }

      const transcriptionHeader = res.headers.get('X-Transcription') || '';
      setTranscription(transcriptionHeader);

      const audioBlob2 = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob2);

      // Auto-play response
      const audio = new Audio(audioUrl);
      audio.play();

      onAudioResponse?.(audioUrl, transcriptionHeader);
    } catch (err) {
      alert(`Voice error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRecordingState('idle');
    }
  };

  return (
    <div className="p-6 border border-gray-200 rounded-2xl shadow-sm bg-white">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${mode === 'text' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setMode('text')}
        >
          ✏️ Text
        </button>
        <button
          type="button"
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${mode === 'voice' ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setMode('voice')}
        >
          🎙️ Voice
        </button>
      </div>

      {mode === 'text' ? (
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
            placeholder="अपनी स्थिति बताएं... (Describe your situation)"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition-all"
          >
            Ask
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Waveform / idle state */}
          <div className="flex items-end gap-1 h-12 w-full max-w-xs mx-auto">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-100 ${recordingState === 'recording' ? 'bg-orange-500' : 'bg-gray-300'}`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          {/* State label */}
          <p className="text-sm text-gray-500 font-medium">
            {recordingState === 'idle' && 'Press mic to start recording'}
            {recordingState === 'recording' && <span className="text-orange-600 animate-pulse">🔴 Recording... tap to stop</span>}
            {recordingState === 'processing' && <span className="text-blue-600 animate-pulse">⚙️ Processing voice...</span>}
          </p>

          {/* Mic button */}
          <button
            type="button"
            disabled={recordingState === 'processing'}
            onClick={recordingState === 'recording' ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all
              ${recordingState === 'recording' ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-orange-500 hover:bg-orange-600'}
              ${recordingState === 'processing' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {recordingState === 'recording' ? '⏹' : '🎙️'}
          </button>

          {/* Transcription preview */}
          {transcription && (
            <div className="mt-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 w-full">
              <span className="font-semibold text-gray-400 text-xs uppercase tracking-wide">Heard: </span>
              {transcription}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
