"""
SummarizationService — background memory compression for long chat sessions.

Every time a session accumulates SUMMARIZE_EVERY unsummarized messages, this
service:
  1. Fetches the oldest SUMMARIZE_EVERY unsummarized messages.
  2. Sends them to Groq for condensation.
  3. Merges the new summary into chat_sessions.summary.
  4. Marks the messages as summarized=True.

This is called as a fire-and-forget asyncio task from main.py *after* the
AI response has already been returned to the user — never on the critical path.

Token budget reference (1 side of conversation ≈ 100 words ≈ 133 tokens):
  20 unsummarized turns ≈ 2,700 tokens in → ~200 tokens summary out.
"""
from __future__ import annotations

import asyncio
import os
from typing import Optional

from app.services.supabase_service import get_supabase_admin

# Summarize once this many unsummarized messages have accumulated per session.
SUMMARIZE_EVERY = 20

# Groq model for summarisation — use the fastest/cheapest option.
_SUMMARY_MODEL = "llama3-8b-8192"


class SummarizationService:
    """Manages session memory compression via LLM summarization."""

    # ── Public API ────────────────────────────────────────────────────────────

    def maybe_summarize(self, session_id: str, language: str = "hi") -> None:
        """
        Synchronous entry point. Checks the unsummarized message count
        and schedules an async summarization task if threshold is reached.
        Safe to call after every save_turn — it's a no-op unless needed.
        """
        try:
            sb = get_supabase_admin()
            # Count unsummarized messages for this session
            result = (
                sb.table("chat_messages")
                .select("id", count="exact")
                .eq("session_id", session_id)
                .eq("summarized", False)
                .execute()
            )
            count = result.count or 0
            if count >= SUMMARIZE_EVERY:
                print(f"[SUMMARY] Session {session_id[:8]}… has {count} unsummarized msgs → scheduling")
                asyncio.create_task(self._run(session_id, language))
        except RuntimeError:
            # No running event loop (e.g. test environment) — run sync
            try:
                asyncio.get_event_loop().run_until_complete(self._run(session_id, language))
            except Exception as e:
                print(f"[SUMMARY] Fallback run failed: {e}")
        except Exception as e:
            print(f"[SUMMARY] maybe_summarize check failed (non-fatal): {e}")

    # ── Internal logic ────────────────────────────────────────────────────────

    async def _run(self, session_id: str, language: str) -> None:
        """Fetch, summarize, merge, mark. All errors are non-fatal."""
        try:
            sb = get_supabase_admin()

            # 1. Fetch oldest unsummarized messages
            msgs_result = (
                sb.table("chat_messages")
                .select("id, role, content")
                .eq("session_id", session_id)
                .eq("summarized", False)
                .order("created_at", desc=False)
                .limit(SUMMARIZE_EVERY)
                .execute()
            )
            msgs = msgs_result.data or []
            if not msgs:
                return

            # 2. Build raw transcript block
            lines = [f"{m['role'].upper()}: {m['content']}" for m in msgs]
            raw = "\n".join(lines)

            # 3. Fetch existing summary (may be None)
            sess_result = (
                sb.table("chat_sessions")
                .select("summary")
                .eq("id", session_id)
                .single()
                .execute()
            )
            existing_summary: str = (sess_result.data or {}).get("summary") or ""

            # 4. Summarize via Groq
            new_summary = await self._summarize(raw, language)
            if not new_summary:
                print(f"[SUMMARY] LLM returned empty summary — skipping merge")
                return

            # 5. Merge with existing summary
            if existing_summary:
                merged = f"{existing_summary}\n\n[Continued]: {new_summary}"
            else:
                merged = new_summary

            # 6. Persist merged summary
            sb.table("chat_sessions").update({"summary": merged}).eq("id", session_id).execute()

            # 7. Mark messages as summarized
            ids = [m["id"] for m in msgs]
            sb.table("chat_messages").update({"summarized": True}).in_("id", ids).execute()

            print(f"[SUMMARY] ✓ Summarized {len(msgs)} msgs for session {session_id[:8]}…")

        except Exception as e:
            # Never propagate — this runs after the user already got their response.
            print(f"[SUMMARY] Background summarization failed (non-fatal): {e}")

    async def _summarize(self, transcript: str, language: str) -> Optional[str]:
        """Call Groq to compress the transcript into a concise memory block."""
        try:
            from groq import AsyncGroq  # type: ignore
            client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))

            lang_instruction = (
                "Respond in Hindi." if language in ("hi", "hindi")
                else f"Respond in the same language as the conversation ({language})."
            )

            prompt = (
                "You are a memory compression assistant for a legal aid chatbot.\n"
                "Summarize the following conversation history into a concise paragraph (max 120 words).\n"
                "Preserve: key facts about the user's legal situation, rights mentioned, actions advised, "
                "any documents referenced, and the user's emotional context if relevant.\n"
                "Do NOT include pleasantries or filler. Be factual and dense.\n"
                f"{lang_instruction}\n\n"
                "--- Conversation ---\n"
                f"{transcript[:6000]}\n"   # cap at ~6K chars to stay within context
                "--- End ---\n\n"
                "Summary:"
            )

            chat = await client.chat.completions.create(
                model=_SUMMARY_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3,
            )
            return (chat.choices[0].message.content or "").strip()

        except Exception as e:
            print(f"[SUMMARY] Groq summarization call failed: {e}")
            return None

    # ── Context injection helper ──────────────────────────────────────────────

    @staticmethod
    def get_summary(session_id: str) -> str:
        """
        Retrieve the current compressed summary for a session.
        Returns empty string if none exists.
        Called during prompt assembly in main.py.
        """
        try:
            sb = get_supabase_admin()
            result = (
                sb.table("chat_sessions")
                .select("summary")
                .eq("id", session_id)
                .single()
                .execute()
            )
            return (result.data or {}).get("summary") or ""
        except Exception as e:
            print(f"[SUMMARY] get_summary failed (non-fatal): {e}")
            return ""
