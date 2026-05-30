/**
 * useChatHistory — React hook for managing persistent chat sessions.
 *
 * Responsibilities:
 * - Create a new session at the start of each conversation
 * - List past sessions for the sidebar
 * - Delete / rename / pin sessions
 * - Auto-save each turn after the AI responds
 *
 * All requests include the Supabase session token from localStorage.
 * If no token is present (guest), all calls silently no-op.
 */
import { useState, useCallback, useEffect } from "react";

interface ChatSession {
  id: string;
  title: string;
  language: string;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  expires_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "ai";
  content: string;
  severity_level?: string;
  rights?: string[];
  action_steps?: string[];
  citation_badge?: string;
  legal_keys?: string[];
  created_at: string;
}

const API_BASE = "/api/history";

// Pull the Supabase access token from localStorage (set by AuthContext)
function getToken(): string | null {
  try {
    // Supabase stores the session under sb-<projectRef>-auth-token
    const raw = Object.keys(localStorage).find((k) =>
      k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!raw) return null;
    const parsed = JSON.parse(localStorage.getItem(raw) || "{}");
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}

async function apiCall<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  const token = getToken();
  if (!token) return null; // guest — no-op

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    console.warn(`[ChatHistory] ${options.method ?? "GET"} ${path} → ${res.status}`);
    return null;
  }
  return res.json();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load sessions on mount (if logged in)
  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const data = await apiCall<{ sessions: ChatSession[] }>("/sessions");
    if (data) setSessions(data.sessions);
    setLoading(false);
  }, []);

  /**
   * Call this at the beginning of each new conversation.
   * Returns the session ID to attach to subsequent /api/query calls.
   */
  const createSession = useCallback(
    async (language = "hi"): Promise<string | null> => {
      const data = await apiCall<{ session: ChatSession }>("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: "New Chat", language }),
      });
      if (!data) return null;
      setSessions((prev) => [data.session, ...prev]);
      setActiveSessionId(data.session.id);
      return data.session.id;
    },
    []
  );

  /**
   * Auto-save a full turn. Called after the AI responds.
   * `aiResponse` is the raw JSON from /api/query.
   */
  const saveTurn = useCallback(
    async (sessionId: string, userText: string, aiResponse: Record<string, unknown>) => {
      if (!sessionId) return;
      await apiCall("/messages/turn", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          user_text: userText,
          ai_response: aiResponse,
        }),
      });
    },
    []
  );

  /**
   * Load messages for a specific session (for restoring a past conversation).
   */
  const loadMessages = useCallback(
    async (sessionId: string, page = 1): Promise<ChatMessage[]> => {
      const data = await apiCall<{ messages: ChatMessage[] }>(
        `/sessions/${sessionId}/messages?page=${page}&page_size=50`
      );
      return data?.messages ?? [];
    },
    []
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      const data = await apiCall<{ session: ChatSession }>(
        `/sessions/${sessionId}/rename`,
        { method: "PATCH", body: JSON.stringify({ title }) }
      );
      if (data) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? data.session : s))
        );
      }
    },
    []
  );

  const togglePin = useCallback(async (sessionId: string, pin: boolean) => {
    const data = await apiCall<{ session: ChatSession }>(
      `/sessions/${sessionId}/pin`,
      { method: "PATCH", body: JSON.stringify({ pin }) }
    );
    if (data) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? data.session : s))
      );
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await apiCall(`/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(null);
    },
    [activeSessionId]
  );

  const searchMessages = useCallback(
    async (query: string): Promise<ChatMessage[]> => {
      const data = await apiCall<{ results: ChatMessage[] }>(
        `/search?q=${encodeURIComponent(query)}`
      );
      return data?.results ?? [];
    },
    []
  );

  return {
    sessions,
    activeSessionId,
    loading,
    setActiveSessionId,
    createSession,
    saveTurn,
    loadMessages,
    loadSessions,
    renameSession,
    togglePin,
    deleteSession,
    searchMessages,
  };
}
