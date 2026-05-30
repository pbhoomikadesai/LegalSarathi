import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from "react";
import { useLocation } from "react-router-dom";
import { Mic, Paperclip, Send, X, Volume2, Square, Pause, Play, History } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGuest } from "@/contexts/GuestContext";
import { useSOS } from "@/contexts/SOSContext";
import { Button } from "@/components/common/Button";
import { useNavigate } from "react-router-dom";
import { CHAT_RESPONSES, matchTopic, type ChatTopic } from "@/data/chatResponses";
import { TRANSLATIONS, type TranslationKey } from "@/i18n/translations";
import type { LangCode } from "@/i18n/languages";
import { detectUrgency } from "@/lib/urgency";
import { cn } from "@/lib/utils";
import { useChatHistory } from "@/hooks/useChatHistory";
import { ChatHistoryPanel } from "@/components/chat/ChatHistoryPanel";

const detectIndicLanguage = (text: string, currentLang: string): LangCode => {
  if (!text) return currentLang as LangCode;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0C80 && code <= 0x0CFF) return "kn";
    if (code >= 0x0900 && code <= 0x097F) {
      return currentLang === "mr" ? "mr" : "hi";
    }
    if (code >= 0x0C00 && code <= 0x0C7F) return "te";
    if (code >= 0x0B80 && code <= 0x0BFF) return "ta";
    if (code >= 0x0980 && code <= 0x09FF) return "bn";
    if (code >= 0x0A80 && code <= 0x0AFF) return "gu";
    if (code >= 0x0D00 && code <= 0x0D7F) return "ml";
    if (code >= 0x0A00 && code <= 0x0A7F) return "pa";
  }
  return "en";
};

const getTranslationForMsg = (key: TranslationKey, m: Msg, currentLang: string): string => {
  let msgLang: LangCode;
  if (m.lang) {
    msgLang = m.lang as LangCode;
  } else {
    const contentToCheck = m.situationSummary || m.text || "";
    msgLang = detectIndicLanguage(contentToCheck, currentLang);
    m.lang = msgLang;
  }
  const row = TRANSLATIONS[key];
  if (!row) return String(key);
  return row[msgLang] ?? row.en ?? String(key);
};

interface Msg {
  id: string;
  role: "ai" | "user";
  text: string;
  originalUserText?: string;
  queryInTargetLang?: string;
  topic?: ChatTopic;
  lawChip?: string;
  followups?: string[];
  ocrExtractedText?: string;
  // Structured legal fields from API
  severityLevel?: "INFO" | "CAUTION" | "DANGER";
  rights?: string[];
  actionSteps?: string[];
  doNotDo?: string[];
  evidenceRequired?: string[];
  situationSummary?: string;
  jurisdictionNote?: string;
  awareness?: string;
  ragChunksUsed?: string[];
  citationBadge?: string;
  lang?: string;
}

const Chat = () => {
  const { t, lang } = useLanguage();
  const { tryConsume } = useGuest();
  const { show: showSOS } = useSOS();
  const location = useLocation();
  const navigate = useNavigate();
  const initialState = location.state as { initialQuery?: string; startVoice?: boolean; sessionId?: string } | null;

  const [voice, setVoice] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chatHistory, setChatHistory] = useState<{role: string; content: string}[]>([]);
  const [typing, setTyping] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchResults, setSearchResults] = useState<{id: string; session_id: string; content: string; created_at: string}[]>([]);

  // Chat history persistence (silently no-ops for guests)
  const {
    sessions,
    activeSessionId,
    loading: historyLoading,
    setActiveSessionId,
    createSession,
    saveTurn,
    loadMessages,
    renameSession,
    togglePin,
    deleteSession,
    searchMessages,
  } = useChatHistory();

  // Tracks the OCR-extracted text of the currently active document.
  // When set, follow-up queries go to /api/doc-chat instead of /api/query.
  const [activeDocText, setActiveDocText] = useState<string | null>(null);
  const [activeDocName, setActiveDocName] = useState<string | null>(null);

  // Pending file: staged for send but not yet processed (ChatGPT-style attachment chip)
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Female voice picker
  const [femaleVoices, setFemaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicePrefs, setVoicePrefs] = useState<Record<string, number>>({});

  // BCP-47 locale map for Web Speech API
  const LANG_TO_BCP47: Record<string, string> = {
    hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN",
    bn: "bn-IN", en: "en-IN", gu: "gu-IN", kn: "kn-IN",
    ml: "ml-IN", pa: "pa-IN", ur: "ur-PK", or: "or-IN", as: "as-IN",
  };

  // Load female voices — async in Chrome, fires voiceschanged
  const loadFemaleVoices = () => {
    const MALE_BLACKLIST = [
      "male","man","guy","boy","hemant","kailash","madhur","ravi","prabhat","aditi-m",
      "ganesh","mohan","arjun","aditya","amit","david","mark","george","james",
      "richard","paul","reed","eric","andrew","christopher","daniel","tom","alex",
      "fred","bruce","ralph","vijay","rohit","suresh","ramesh","mahesh","rakesh",
      "ajay","sanjay","kiran-m","raj","hari",
    ];
    const FEMALE_KEYWORDS = [
      "female","woman","girl","aditi","priya","divya","heera","kalpana","sapna",
      "zira","neerja","swara","aarohi","pallavi","samantha","victoria","karen","moira",
    ];
    const bcp47 = LANG_TO_BCP47[lang.split("-")[0]] || "hi-IN";
    const langPrefix = bcp47.split("-")[0];

    const all = window.speechSynthesis?.getVoices() ?? [];
    const isFemale = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      if (MALE_BLACKLIST.some((k) => n.includes(k))) return false;
      if (FEMALE_KEYWORDS.some((k) => n.includes(k))) return true;
      return !/voice\s*\d/.test(n);
    };

    // Priority: exact locale first, then same lang prefix
    const exact = all.filter((v) => v.lang === bcp47 && isFemale(v));
    const prefix = all.filter((v) => v.lang !== bcp47 && v.lang.startsWith(langPrefix) && isFemale(v));
    const top3 = [...exact, ...prefix].slice(0, 3);
    if (top3.length > 0) {
      setFemaleVoices(top3);
    }
  };

  // Load voices on mount + when lang changes
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    loadFemaleVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadFemaleVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadFemaleVoices);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const sendVoiceTranscript = (text: string) => {
    stopRecognition();
    setVoice(false);
    setVoiceTranscript("");
    if (text.trim()) send(text.trim());
  };

  const startVoiceRecognition = () => {
    setVoiceTranscript("");
    startGroqFallback();
  };

  const startGroqFallback = async () => {
    // Groq Whisper fallback for Safari/Firefox
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });
      const mimeType =
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) =>
          MediaRecorder.isTypeSupported(t)
        ) || "";
      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const fd = new FormData();
        fd.append("audio", blob, "audio.webm");
        fd.append("lang", lang);
        setTyping(true);
        try {
          const res = await fetch("/api/voice-query", {
            method: "POST",
            body: fd,
          });
          if (!res.ok) throw new Error("Voice query failed");
          const transcription = res.headers.get("X-Transcription");
          let decodedTranscript = "";
          if (transcription) {
            decodedTranscript = decodeURIComponent(transcription);
            setInput(decodedTranscript);
            setVoiceTranscript(decodedTranscript);
          }
          const dataText = res.headers.get("X-Query-Result");
          if (dataText) {
            const data = JSON.parse(dataText);
            const userMsgId = crypto.randomUUID();
            const aiMsgId = crypto.randomUUID();
            setMsgs((m) => [
              ...m,
              ...(decodedTranscript
                ? [{ id: userMsgId, role: "user", text: decodedTranscript }]
                : []),
              {
                id: aiMsgId,
                role: "ai",
                text: data.buddy_text || data.translated || "Audio received.",
                originalUserText: data.query,
                queryInTargetLang: data.query_in_target_lang,
                topic: "legal",
                lawChip: data.legal_keys?.[0] || undefined,
                severityLevel: data.severity_level,
                situationSummary: data.situation_summary,
                rights: data.rights || [],
                actionSteps: data.action_steps || [],
                doNotDo: data.do_not_do || [],
                evidenceRequired: data.evidence_required || [],
                jurisdictionNote: data.jurisdiction_note,
                awareness: data.awareness,
                ragChunksUsed: data.rag_chunks_used || [],
                citationBadge: data.citation_badge,
                lang: data.lang || lang,
              },
            ]);
            if (decodedTranscript) {
              setChatHistory((h) => [
                ...h,
                { role: "user", content: decodedTranscript },
                { role: "assistant", content: data.buddy_text || data.translated || "Audio received." },
              ].slice(-12));
            }
          }
        } catch (e) {
          console.error("Groq fallback error", e);
        } finally {
          setTyping(false);
          setVoice(false);
        }
      };
      setIsRecording(true);
      recorder.start();
      (window as Window & { __legalsarthiRecorder?: { recorder: MediaRecorder; stream: MediaStream } }).__legalsarthiRecorder = { recorder, stream };
    } catch (err) {
      console.error(err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        alert("Microphone access is blocked for this site. Allow mic permission for localhost:8081 in your browser settings, then try again.");
      }
      setVoice(false);
    }
  };

  const stopGroqFallback = () => {
    const r = (window as Window & { __legalsarthiRecorder?: { recorder: MediaRecorder; stream: MediaStream } }).__legalsarthiRecorder;
    if (r) {
      r.recorder.stop();
      r.stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      delete (window as Window & { __legalsarthiRecorder?: { recorder: MediaRecorder; stream: MediaStream } }).__legalsarthiRecorder;
    }
    setIsRecording(false);
  };

  const [playbackState, setPlaybackState] = useState<{
    id: string;
    engine: "browser" | "backend";
    state: "playing" | "paused" | "loading";
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track the current utterance so we can cancel it precisely
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup on unmount — stop any in-flight audio
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // ─── shared helper: build + speak an utterance ─────────────────────────────
  const speakUtterance = (text: string, voice: SpeechSynthesisVoice, bcp47: string, msgId: string, onFallback: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    utterance.voice = voice;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // onstart is unreliable on some browsers — set "playing" optimistically at speak() time
    // and only update again in onstart if still relevant (avoids double-set flicker via a guard)
    let startFired = false;
    utterance.onstart = () => {
      if (startFired) return;
      startFired = true;
      setPlaybackState((prev) => (prev?.id === msgId && prev.state !== "playing" ? { id: msgId, engine: "browser", state: "playing" } : prev));
    };
    utterance.onend = () => {
      utteranceRef.current = null;
      setPlaybackState((prev) => (prev?.id === msgId ? null : prev));
    };
    utterance.onerror = (e) => {
      // "interrupted" fires on intentional cancel — don't fall back
      if (e.error === "interrupted") return;
      utteranceRef.current = null;
      setPlaybackState(null);
      onFallback();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    // Set playing immediately — onstart may lag or never fire on some browsers
    setPlaybackState({ id: msgId, engine: "browser", state: "playing" });
  };

  const getVoiceChoices = () => {
    const langCode = lang.split("-")[0].toLowerCase();
    if (langCode === "en") {
      return [
        { name: "Female Neural 1 (India)" },
        { name: "Male Neural (India)" },
        { name: "Female Neural 2 (US)" }
      ];
    }
    return [
      { name: "Female Neural" },
      { name: "Male Neural" }
    ];
  };

  const toggleAudio = (m: Msg) => {
    const isAndroidChrome = /Android/i.test(navigator.userAgent) && /Chrome/i.test(navigator.userAgent);

    // ── same message: toggle play/pause ──────────────────────────────────────
    if (playbackState?.id === m.id) {
      if (playbackState.state === "loading") return;

      if (playbackState.state === "paused") {
        // Resume
        if (playbackState.engine === "browser") {
          window.speechSynthesis?.resume();
        } else {
          audioRef.current?.play();
        }
        setPlaybackState({ ...playbackState, state: "playing" });
      } else {
        // Pause — Android Chrome doesn't support pause(), so cancel instead
        if (playbackState.engine === "browser") {
          if (isAndroidChrome) {
            window.speechSynthesis?.cancel();
            utteranceRef.current = null;
            setPlaybackState(null);
            return;
          }
          window.speechSynthesis?.pause();
        } else {
          audioRef.current?.pause();
        }
        setPlaybackState({ ...playbackState, state: "paused" });
      }
      return;
    }

    // ── different message: stop current, start new ────────────────────────────
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setPlaybackState(null);

    // Play from high-quality backend neural Edge-TTS directly
    playFromBackend(m);
  };

  const handleVoiceChange = (idx: number, m: Msg) => {
    // Persist the preference regardless of current playback state
    setVoicePrefs((prev) => ({ ...prev, [m.id]: idx }));

    // If this message is currently playing, stop it and play with new voice index
    if (playbackState?.id === m.id) {
      window.speechSynthesis?.cancel();
      utteranceRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setPlaybackState(null);

      // Play with new voice choice from backend
      setTimeout(() => {
        playFromBackend(m);
      }, 80);
    }
  };

  const playFromBackend = async (m: Msg) => {
    setPlaybackState({ id: m.id, engine: "backend", state: "loading" });
    try {
      const idx = voicePrefs[m.id] ?? 0;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: m.text, lang: lang, voice_index: idx }),
      });
      if (!res.ok) throw new Error("TTS failed");

      // Fetch the blob OUTSIDE the state updater — state updaters must be pure
      const blob = await res.blob();

      // Check we're still the active playback (user may have cancelled while loading)
      setPlaybackState((prev) => {
        if (prev?.id !== m.id || prev.state !== "loading") return prev;
        // Side-effect inside updater is unavoidable here to stay synchronised with state check;
        // we only do it once because of the guard above.
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          URL.revokeObjectURL(url);
          setPlaybackState((p) => (p?.id === m.id ? null : p));
        };
        audioRef.current.play()
          .then(() => setPlaybackState((p) => (p?.id === m.id ? { id: m.id, engine: "backend", state: "playing" } : p)))
          .catch(() => setPlaybackState((p) => (p?.id === m.id ? null : p)));
        return { id: m.id, engine: "backend", state: "loading" }; // audio.play() updates to "playing" async
      });
    } catch (e) {
      console.error("[TTS] Backend error:", e);
      const fallbackStarted = playWithBrowserVoice(m, false);
      if (!fallbackStarted) {
        setPlaybackState((prev) => (prev?.id === m.id ? null : prev));
      }
    }
  };

  const playWithBrowserVoice = (m: Msg, allowBackendFallback: boolean) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    const bcp47 = (LANG_TO_BCP47 as Record<string, string>)[lang.split("-")[0]] || "hi-IN";
    const allVoices = window.speechSynthesis?.getVoices() ?? [];
    const idx = voicePrefs[m.id] ?? 0;
    const preferredVoice = femaleVoices[idx] ?? femaleVoices[0];
    const voice =
      preferredVoice ||
      allVoices.find((candidate) => candidate.lang === bcp47) ||
      allVoices.find((candidate) => candidate.lang.startsWith(bcp47.split("-")[0])) ||
      allVoices[0];

    if (!voice) {
      return false;
    }

    speakUtterance(
      m.text,
      voice,
      bcp47,
      m.id,
      allowBackendFallback ? () => playFromBackend(m) : () => setPlaybackState(null)
    );
    return true;
  };

  const replyTo = async (userText: string, sessionId?: string) => {
    setTyping(true);
    try {
      // Get token for authentication
      const raw = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
      const token = raw ? JSON.parse(localStorage.getItem(raw) || "{}")?.access_token : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // If a document is loaded, use the doc-chat endpoint (document-aware AI)
      if (activeDocText) {
        const res = await fetch("/api/doc-chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            extracted_text: activeDocText,
            message: userText,
            user_text: userText,
            mode: "qa",
            history: msgs.filter(m => m.role !== "ai" || m.ocrExtractedText == null).slice(-6).map(m => ({ role: m.role, content: m.text })),
            language: lang,
            session_id: sessionId ?? activeSessionId ?? "",
          })
        });
        if (!res.ok) throw new Error("Doc-chat API failed");
        const data = await res.json();
        setMsgs((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "ai",
            text: data.response || "I couldn't process that.",
            topic: "legal",
          },
        ]);
        return;
      }

      // No document active — use standard RAG pipeline
      const res = await fetch("/api/query", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: userText,
          language: lang,
          session_id: sessionId ?? activeSessionId ?? "",
          conversation_history: chatHistory.slice(-6),
        })
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      const aiText = data.buddy_text || data.translated || "Sorry, I couldn't understand.";
      setMsgs((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: aiText,
          originalUserText: userText,
          queryInTargetLang: data.query_in_target_lang,
          topic: "legal",
          lawChip: data.legal_keys?.[0] || undefined,
          severityLevel: data.severity_level,
          situationSummary: data.situation_summary,
          rights: data.rights || [],
          actionSteps: data.action_steps || [],
          doNotDo: data.do_not_do || [],
          evidenceRequired: data.evidence_required || [],
          jurisdictionNote: data.jurisdiction_note,
          awareness: data.awareness,
          ragChunksUsed: data.rag_chunks_used || [],
          citationBadge: data.citation_badge,
          lang: data.lang || lang,
        },
      ]);
      // Keep a rolling window for multi-turn context
      setChatHistory((h) => [
        ...h,
        { role: "user", content: userText },
        { role: "assistant", content: aiText },
      ].slice(-12));
      // NOTE: persistence is handled server-side in main.py — no duplicate save needed here.
    } catch (err) {
      setMsgs((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "ai", text: "I'm having trouble connecting right now. Please try again later." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    // Allow send when there's a pending file even without typed text
    if (!text && !pendingFile) return;
    if (!tryConsume()) return;

    const userDisplayText = pendingFile
      ? text || `What does this document say?`
      : text;

    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "user", text: pendingFile ? `📎 ${pendingFile.name}${text ? ` — ${text}` : ""}` : userDisplayText }]);
    setInput("");

    if (detectUrgency(userDisplayText)) {
      setUrgent(true);
      window.setTimeout(() => showSOS(), 600);
    }

    let sid = activeSessionId;
    if (!sid) sid = await createSession(lang);

    // If a file is staged, OCR it first then answer with the user's question
    if (pendingFile) {
      const file = pendingFile;
      setPendingFile(null);
      setTyping(true);
      try {
        // Step 1: OCR
        const ocrFd = new FormData();
        ocrFd.append("image", file);
        ocrFd.append("lang", lang);
        const ocrRes = await fetch("/api/ocr-extract", { method: "POST", body: ocrFd });
        if (!ocrRes.ok) throw new Error("OCR failed");
        const ocrData = await ocrRes.json();
        const extractedText: string = ocrData.extracted_text || "";
        if (!extractedText) throw new Error("No text could be extracted.");

        // Step 2: Silent background ingest for future queries
        const rawKey = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
        const token = rawKey ? JSON.parse(localStorage.getItem(rawKey) || "{}")?.access_token : null;
        if (token) {
          const ingestFd = new FormData();
          ingestFd.append("file", file);
          ingestFd.append("session_id", sid ?? "");
          ingestFd.append("lang", lang);
          fetch("/api/documents/ingest", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: ingestFd,
          }).catch(() => {/* non-fatal */});
        }

        // Step 3: Store for follow-up queries
        setActiveDocText(extractedText);
        setActiveDocName(file.name);

        // Step 4: Answer the user's question using the doc
        const rawKey2 = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
        const token2 = rawKey2 ? JSON.parse(localStorage.getItem(rawKey2) || "{}")?.access_token : null;
        const hdrs: Record<string, string> = { "Content-Type": "application/json" };
        if (token2) hdrs["Authorization"] = `Bearer ${token2}`;

        const chatRes = await fetch("/api/doc-chat", {
          method: "POST",
          headers: hdrs,
          body: JSON.stringify({
            extracted_text: extractedText,
            message: userDisplayText,
            user_text: userDisplayText,
            mode: "qa",
            history: [],
            language: lang,
            session_id: sid ?? "",
          }),
        });
        const chatData = chatRes.ok ? await chatRes.json() : null;
        setMsgs((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "ai",
            text: chatData?.response || "Document processed. Ask me anything about it.",
            topic: "legal",
            ocrExtractedText: extractedText,
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "ai", text: `⚠️ Could not process document: ${msg}` }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    replyTo(userDisplayText, sid ?? undefined);
  };

  // Restore a past session into the current chat view
  const loadHistorySession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistory(false);
    setMsgs([]);
    setChatHistory([]);
    setActiveDocText(null);
    setActiveDocName(null);
    const messages = await loadMessages(sessionId);
    const restored: Msg[] = messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "ai",
      text: m.content,
      severityLevel: m.severity_level as "INFO" | "CAUTION" | "DANGER" | undefined,
      rights: m.rights ?? [],
      actionSteps: m.action_steps ?? [],
      citationBadge: m.citation_badge,
      lawChip: m.legal_keys?.[0],
    }));
    setMsgs(restored);
    // Rebuild rolling context from the last 6 turns
    const contextWindow = messages.slice(-12).map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));
    setChatHistory(contextWindow);

    // Restore document context if this was a doc-chat session
    try {
      const rawKey = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
      const token = rawKey ? JSON.parse(localStorage.getItem(rawKey) || "{}")?.access_token : null;
      if (token) {
        const docRes = await fetch(`/api/documents/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.raw_text) {
            setActiveDocText(docData.raw_text);
            setActiveDocName(docData.filename || "Uploaded Document");
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore document context", e);
    }
  }, [activeSessionId, loadMessages, setActiveSessionId]);

  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMsgs([]);
    setChatHistory([]);
    setActiveDocText(null);
    setActiveDocName(null);
    setShowHistory(false);
  }, [setActiveSessionId]);

  const handleHistorySearch = useCallback(async (q: string) => {
    const results = await searchMessages(q);
    setSearchResults(results);
  }, [searchMessages]);

  // Seed initial query / voice / past session from navigation state (run once)
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (initialState?.sessionId) {
      loadHistorySession(initialState.sessionId);
    } else if (initialState?.initialQuery) {
      send(initialState.initialQuery);
    } else if (initialState?.startVoice) {
      setVoice(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, typing]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send(input);
  };

  const suggestions = [
    { label: t("tenantRights"), q: t("tenantRightsQuery") },
    { label: t("fileRti"), q: t("fileRtiQuery") },
    { label: t("consumerComplaint"), q: t("consumerComplaintQuery") },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Just stage the file — do NOT process yet
    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <ScreenShell>
      {/* History sidebar drawer */}
      {showHistory && (
        <>
          <div
            className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-72 z-40 shadow-2xl">
            <ChatHistoryPanel
              sessions={sessions}
              activeSessionId={activeSessionId}
              loading={historyLoading}
              onSelect={loadHistorySession}
              onNew={startNewChat}
              onRename={renameSession}
              onPin={togglePin}
              onDelete={deleteSession}
              onSearch={handleHistorySearch}
              searchResults={searchResults}
              onClose={() => setShowHistory(false)}
            />
          </div>
        </>
      )}

      <StickyHeader
        title={t("chatTitle")}
        showBack
        showLanguagePill
        rightAction={
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Chat History"
            aria-label="Chat History"
          >
            <History size={18} />
          </button>
        }
      />
      <div className="px-6 py-2 text-xs text-muted-foreground">{t("chatSubtitle")}</div>

      {urgent && (
        <div className="mx-4 mb-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 flex items-center gap-3 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="flex-1 text-xs font-semibold text-destructive">{t("sosUrgentBanner")}</span>
          <button
            onClick={showSOS}
            className="px-3 h-8 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold tap"
          >
            {t("callNow")}
          </button>
        </div>
      )}

      {/* Active Document Context Banner */}
      {activeDocText && (
        <div className="mx-4 mb-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 flex items-center gap-2">
          <span className="text-xs">📄</span>
          <span className="flex-1 text-xs text-primary font-medium truncate">{activeDocName} — Document mode active</span>
          <button
            onClick={() => { setActiveDocText(null); setActiveDocName(null); }}
            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors ml-1 shrink-0"
            title="Clear document context"
          >
            ✕ Clear
          </button>
        </div>
      )}

      <div ref={scrollRef} className="px-4 pb-44 space-y-3 overflow-y-auto">
        {msgs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            {t("askQuestion")}
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] animate-scale-in", m.role === "user" ? "ml-auto" : "")}>
            {m.role === "ai" ? (
              <div className="ls-card border-l-4 border-l-primary p-4 text-sm space-y-3">
                {/* Query Transcript Chip */}
                {m.queryInTargetLang && m.originalUserText && m.queryInTargetLang.trim() !== m.originalUserText.trim() && (
                  <div className="flex items-start gap-2 pb-2 mb-2 border-b border-border">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide shrink-0 mt-0.5">
                      {t("queryTranscript")}
                    </span>
                    <span className="text-xs text-foreground/80 font-native leading-snug">
                      {m.queryInTargetLang}
                    </span>
                  </div>
                )}

                {/* Severity badge */}
                {m.severityLevel && (
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    m.severityLevel === "DANGER" && "bg-destructive/15 text-destructive",
                    m.severityLevel === "CAUTION" && "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
                    m.severityLevel === "INFO" && "bg-primary/10 text-primary",
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      m.severityLevel === "DANGER" && "bg-destructive animate-pulse",
                      m.severityLevel === "CAUTION" && "bg-yellow-500",
                      m.severityLevel === "INFO" && "bg-primary",
                    )} />
                    {m.severityLevel}
                  </div>
                )}

                {/* Plain text fallback — for doc-chat responses that have no structured fields */}
                {!m.situationSummary && m.text && (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{m.text}</p>
                )}

                {/* Situation summary — for RAG pipeline responses */}
                {m.situationSummary && (
                  <p className="text-sm font-medium text-foreground leading-relaxed">{m.situationSummary}</p>
                )}

                {/* Rights with citations */}
                {m.rights && m.rights.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">{getTranslationForMsg("knowYourRights", m, lang)}</p>
                    <ul className="space-y-1">
                      {m.rights.map((r, i) => (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className="text-primary font-bold mt-0.5 shrink-0">§</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action steps */}
                {m.actionSteps && m.actionSteps.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1.5">{getTranslationForMsg("chatStepsToTake", m, lang)}</p>
                    <ol className="space-y-1 list-none">
                      {m.actionSteps.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className="bg-green-600/15 text-green-700 dark:text-green-400 font-bold rounded px-1.5 py-0.5 shrink-0 text-[10px]">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Do not do */}
                {m.doNotDo && m.doNotDo.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-1.5">{getTranslationForMsg("chatDoNotDo", m, lang)}</p>
                    <ul className="space-y-1">
                      {m.doNotDo.map((d, i) => (
                        <li key={i} className="flex gap-2 text-xs text-destructive/80">
                          <span className="shrink-0 font-bold">×</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence required */}
                {m.evidenceRequired && m.evidenceRequired.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1.5">{getTranslationForMsg("chatCollectNow", m, lang)}</p>
                    <ul className="space-y-1">
                      {m.evidenceRequired.map((e, i) => (
                        <li key={i} className="flex gap-2 text-xs">
                          <span className="shrink-0">📌</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* OCR extracted text (collapsible) */}
                {m.ocrExtractedText && (
                  <details className="group">
                    <summary className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest cursor-pointer list-none flex items-center gap-1 hover:text-primary transition-colors">
                      <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
                      {getTranslationForMsg("chatExtractedText", m, lang)}
                    </summary>
                    <div className="mt-2 p-2 bg-muted/30 rounded-lg text-[11px] font-mono whitespace-pre-wrap border border-border/50 max-h-40 overflow-y-auto">
                      {m.ocrExtractedText}
                    </div>
                  </details>
                )}

                {/* Awareness paragraph (collapsible) */}
                {m.awareness && (
                  <details className="group">
                    <summary className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest cursor-pointer list-none flex items-center gap-1 hover:text-primary transition-colors">
                      <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
                      {getTranslationForMsg("chatKnowYourLaw", m, lang)}
                    </summary>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{m.awareness}</p>
                  </details>
                )}

                {/* Citation badge + RAG sources (collapsible) */}
                {m.ragChunksUsed && m.ragChunksUsed.length > 0 && (
                  <details className="group">
                    <summary className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest cursor-pointer list-none flex items-center gap-1 hover:text-primary transition-colors">
                      <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
                      {m.citationBadge || "📚"} {getTranslationForMsg("chatSources", m, lang)} ({m.ragChunksUsed.length})
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.ragChunksUsed.map((ref) => (
                        <span key={ref} className="ls-chip text-[10px] font-mono bg-primary/5 text-primary border-primary/20">{ref}</span>
                      ))}
                    </div>
                  </details>
                )}

                {/* Jurisdiction note */}
                {m.jurisdictionNote && (
                  <p className="text-[10px] italic text-muted-foreground border-t border-border pt-2">{m.jurisdictionNote}</p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                  <button
                    onClick={() => toggleAudio(m)}
                    className="w-9 h-9 flex items-center justify-center rounded-button border border-border text-foreground tap shrink-0"
                    title={playbackState?.id === m.id ? (playbackState.state === "paused" ? "Resume audio" : "Pause audio") : "Play audio"}
                    disabled={playbackState?.id === m.id && playbackState.state === "loading"}
                  >
                    {playbackState?.id === m.id && playbackState.state === "loading" ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    ) : playbackState?.id === m.id && playbackState.state === "playing" ? (
                      <Pause size={14} className="text-primary" />
                    ) : playbackState?.id === m.id && playbackState.state === "paused" ? (
                      <Play size={14} className="text-primary" />
                    ) : (
                      <Volume2 size={14} />
                    )}
                  </button>

                  {/* Inline Voice Picker — always visible when multiple voices exist */}
                  {getVoiceChoices().length > 1 && (
                    <div className="flex gap-1.5 ml-1">
                      {getVoiceChoices().map((v, i) => (
                        <button
                          key={i}
                          onClick={() => handleVoiceChange(i, m)}
                          title={v.name}
                          className={cn(
                            "px-2 py-1 rounded-full text-[9px] font-semibold border transition-all duration-150 tap",
                            (voicePrefs[m.id] ?? 0) === i
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                        >
                          V{i + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => navigate("/lawyers")}
                    className="ml-auto h-9 text-xs px-3 rounded-button border border-border text-foreground tap"
                  >
                    {getTranslationForMsg("chatConsultLawyer", m, lang)}
                  </button>
                </div>

                <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                  ⚠️ {getTranslationForMsg("aiDisclaimer", m, lang)}
                </p>
              </div>
            ) : (
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm whitespace-pre-line">{m.text}</div>
            )}
          </div>
        ))}
        {typing && (
          <div className="max-w-[85%]">
            <div className="ls-card border-l-4 border-l-primary p-3.5 text-sm inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-20">
        <div className="max-w-md mx-auto px-4 py-2">
          {/* Suggestion chips — hidden when a file is staged */}
          {!pendingFile && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
              {suggestions.map((s) => (
                <button key={s.label} onClick={() => send(s.q)} className="ls-chip whitespace-nowrap text-xs tap">
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Pending file chip — shown above input once a file is staged */}
          {pendingFile && (
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl px-3 py-1.5 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">📄</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{pendingFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pendingFile.type.includes("pdf") ? "PDF" : "Image"} · Ready</p>
                </div>
                <button
                  onClick={() => setPendingFile(null)}
                  className="ml-auto shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="flex items-center gap-2 ls-card h-12 px-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <button
              aria-label="Attach"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-9 h-9 flex items-center justify-center tap transition-colors",
                pendingFile ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Paperclip size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder={pendingFile ? "Ask anything about this document…" : t("askQuestion")}
              aria-label={t("askQuestion")}
            />
            <button aria-label="Voice" onClick={() => setVoice(true)} className="w-9 h-9 flex items-center justify-center text-primary tap">
              <Mic size={18} />
            </button>
            <button
              aria-label="Send"
              onClick={() => send(input)}
              disabled={!input.trim() && !pendingFile}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center tap disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {voice && (
        <div className="fixed inset-0 z-40 bg-foreground/80 backdrop-blur-sm flex flex-col items-center justify-center text-primary-foreground" role="dialog">
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                <span className="absolute inset-[-8px] rounded-full border-2 border-primary/40 animate-pulse" />
              </>
            )}
            <span className={cn(
              "absolute inset-0 rounded-full transition-colors",
              isRecording ? "bg-primary" : "bg-muted/40"
            )} />
            <Mic size={32} className="relative z-10" />
          </div>

          <p className="text-sm font-medium mb-1">
            {isRecording ? t("listening") : t("chatTapToSpeak")}
          </p>

          {/* Live transcript display */}
          {voiceTranscript && (
            <div className="mx-6 mt-3 mb-4 max-w-xs w-full bg-foreground/20 rounded-2xl px-4 py-3 text-sm text-center leading-snug">
              {voiceTranscript}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 mt-4">
            {!isRecording ? (
              <button
                onClick={startVoiceRecognition}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold tap shadow-lg"
              >
                <Mic size={16} className="inline mr-2" />{t("chatStartRecording")}
              </button>
            ) : (
              <button
                onClick={() => {
                  stopRecognition();
                  stopGroqFallback();
                }}
                className="px-6 py-2.5 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold tap shadow-lg"
              >
                <Square size={14} className="inline mr-2" />{t("chatStop")}
              </button>
            )}
            {voiceTranscript && !isRecording && (
              <button
                onClick={() => sendVoiceTranscript(voiceTranscript)}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold tap shadow-lg"
              >
                <Send size={14} className="inline mr-2" />{t("chatSend")}
              </button>
            )}
          </div>

          <button
            onClick={() => { stopRecognition(); stopGroqFallback(); setVoice(false); setVoiceTranscript(""); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 text-sm tap"
          >
            <X size={16} /> {t("cancel")}
          </button>
        </div>
      )}
    </ScreenShell>
  );
};

export default Chat;
