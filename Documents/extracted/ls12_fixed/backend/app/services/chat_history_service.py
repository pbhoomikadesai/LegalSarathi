"""
Chat History Service — Supabase-backed persistent storage for chat sessions and messages.

All write operations use the admin (service-role) client to bypass RLS.
The JWT middleware is responsible for ensuring user_id is correctly extracted
from the verified token, guaranteeing cross-user isolation at the API layer.

Tables used (already defined in supabase/schema.sql):
  - chat_sessions   : one row per conversation thread
  - chat_messages   : one row per message within a session
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.services.supabase_service import get_supabase_admin

# Free-tier sessions expire after 11 days (matches schema convention)
SESSION_TTL_DAYS = 11
# Maximum messages returned per page
DEFAULT_PAGE_SIZE = 30


class ChatHistoryService:
    """
    CRUD operations for chat_sessions and chat_messages.
    Every method accepts user_id (verified JWT sub) to scope all queries.
    """

    # ── Session operations ────────────────────────────────────────────────────

    def create_session(
        self,
        user_id: str,
        title: str = "New Chat",
        language: str = "hi",
    ) -> dict:
        """Create a new chat session. Returns the created session row."""
        sb = get_supabase_admin()
        expires_at = (
            datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
        ).isoformat()

        data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "language": language,
            "is_pinned": False,
            "expires_at": expires_at,
        }
        result = sb.table("chat_sessions").insert(data).execute()
        if not result.data:
            raise RuntimeError("Failed to create chat session")
        return result.data[0]

    def list_sessions(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """
        Return paginated list of sessions for a user, newest first.
        Pinned sessions always appear at the top.
        """
        sb = get_supabase_admin()
        offset = (page - 1) * page_size

        result = (
            sb.table("chat_sessions")
            .select("id, title, language, is_pinned, pinned_at, created_at, expires_at")
            .eq("user_id", user_id)
            .gte("expires_at", datetime.now(timezone.utc).isoformat())  # skip expired
            .order("is_pinned", desc=True)
            .order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        return {
            "sessions": result.data or [],
            "page": page,
            "page_size": page_size,
        }

    def rename_session(self, user_id: str, session_id: str, new_title: str) -> dict:
        """Rename a session title. Scoped to user_id for security."""
        sb = get_supabase_admin()
        result = (
            sb.table("chat_sessions")
            .update({"title": new_title})
            .eq("id", session_id)
            .eq("user_id", user_id)   # prevents renaming another user's session
            .execute()
        )
        if not result.data:
            raise ValueError("Session not found or access denied")
        return result.data[0]

    def toggle_pin(self, user_id: str, session_id: str, pin: bool) -> dict:
        """Pin or unpin a session."""
        sb = get_supabase_admin()
        update = {
            "is_pinned": pin,
            "pinned_at": datetime.now(timezone.utc).isoformat() if pin else None,
        }
        result = (
            sb.table("chat_sessions")
            .update(update)
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise ValueError("Session not found or access denied")
        return result.data[0]

    def delete_session(self, user_id: str, session_id: str) -> bool:
        """
        Delete a session and all its messages (CASCADE defined in schema).
        Returns True on success.
        """
        sb = get_supabase_admin()
        result = (
            sb.table("chat_sessions")
            .delete()
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(result.data)

    # ── Message operations ─────────────────────────────────────────────────────

    def get_messages(
        self,
        user_id: str,
        session_id: str,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
        before_id: Optional[str] = None,  # cursor-based for infinite scroll
    ) -> dict:
        """
        Fetch paginated messages for a session.
        If before_id is given, returns messages older than that message (cursor pagination).
        """
        sb = get_supabase_admin()

        # Verify session belongs to user first
        ownership = (
            sb.table("chat_sessions")
            .select("id")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not ownership.data:
            raise PermissionError("Session not found or access denied")

        query = (
            sb.table("chat_messages")
            .select(
                "id, session_id, user_id, role, content, "
                "legal_keys, severity_level, rights, action_steps, "
                "citation_badge, created_at"
            )
            .eq("session_id", session_id)
            .eq("user_id", user_id)
            .order("created_at", desc=False)  # chronological order
        )

        if before_id:
            # Cursor-based: get the timestamp of the cursor message first
            cursor_row = (
                sb.table("chat_messages")
                .select("created_at")
                .eq("id", before_id)
                .single()
                .execute()
            )
            if cursor_row.data:
                query = query.lt("created_at", cursor_row.data["created_at"])

        offset = (page - 1) * page_size
        result = query.range(offset, offset + page_size - 1).execute()

        return {
            "messages": result.data or [],
            "session_id": session_id,
            "page": page,
            "page_size": page_size,
        }

    def save_message(
        self,
        user_id: str,
        session_id: str,
        role: str,
        content: str,
        legal_keys: list = None,
        severity_level: str = None,
        rights: list = None,
        action_steps: list = None,
        citation_badge: str = None,
    ) -> dict:
        """
        Persist a single message to chat_messages.
        role must be 'user' or 'ai'.
        """
        if role not in ("user", "ai"):
            raise ValueError(f"Invalid role '{role}'. Must be 'user' or 'ai'.")

        sb = get_supabase_admin()
        data = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "legal_keys": legal_keys or [],
            "severity_level": severity_level,
            "rights": rights or [],
            "action_steps": action_steps or [],
            "citation_badge": citation_badge,
        }
        result = sb.table("chat_messages").insert(data).execute()
        if not result.data:
            raise RuntimeError("Failed to save message")
        return result.data[0]

    def save_turn(
        self,
        user_id: str,
        session_id: str,
        user_text: str,
        ai_response: dict,
    ) -> tuple[dict, dict]:
        """
        Convenience: save a user message + AI response in one call.
        ai_response is the full dict returned by the orchestrator.
        Returns (user_msg_row, ai_msg_row).
        """
        # Use buddy_text (spoken form) as primary content.
        # Fall back to situation_summary for structured responses,
        # or response for doc-chat responses.
        ai_content = (
            ai_response.get("buddy_text")
            or ai_response.get("situation_summary")
            or ai_response.get("response")  # doc-chat endpoint
            or ""
        )
        print(f"[HISTORY] save_turn session={session_id[:8]} user_len={len(user_text)} ai_len={len(ai_content)}")

        user_msg = self.save_message(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=user_text,
        )
        ai_msg = self.save_message(
            user_id=user_id,
            session_id=session_id,
            role="ai",
            content=ai_content,
            legal_keys=ai_response.get("legal_keys", []),
            severity_level=ai_response.get("severity_level"),
            rights=ai_response.get("rights", []),
            action_steps=ai_response.get("action_steps", []),
            citation_badge=ai_response.get("citation_badge"),
        )
        return user_msg, ai_msg

    def search_messages(
        self,
        user_id: str,
        query: str,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """
        Full-text search across all a user's messages.
        Uses Supabase's ilike (case-insensitive LIKE) for simplicity.
        """
        sb = get_supabase_admin()
        offset = (page - 1) * page_size
        result = (
            sb.table("chat_messages")
            .select("id, session_id, role, content, created_at")
            .eq("user_id", user_id)
            .ilike("content", f"%{query}%")
            .order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        return {
            "results": result.data or [],
            "query": query,
            "page": page,
            "page_size": page_size,
        }

    def update_session_title_from_first_message(
        self, user_id: str, session_id: str, first_message: str
    ) -> None:
        """Auto-title a session using the first 60 chars of the first user message."""
        title = first_message[:60].strip()
        if not title:
            return
        try:
            sb = get_supabase_admin()
            sb.table("chat_sessions").update({"title": title}).eq(
                "id", session_id
            ).eq("user_id", user_id).execute()
        except Exception as e:
            print(f"[ChatHistory] Failed to auto-title session: {e}")
