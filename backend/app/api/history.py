"""
History API Router — REST endpoints for chat session and message management.
All routes require a valid Supabase JWT (get_current_user dependency).

Prefix: /api/history
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional

from app.middleware.auth import get_current_user
from app.services.chat_history_service import ChatHistoryService

router = APIRouter(prefix="/api/history", tags=["history"])

# Singleton service instance (lightweight — no ML models)
_svc = ChatHistoryService()


# ── Pydantic models ───────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    title: str = Field(default="New Chat", max_length=120)
    language: str = Field(default="hi", max_length=10)

class RenameSessionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)

class PinSessionRequest(BaseModel):
    pin: bool

class SaveTurnRequest(BaseModel):
    """Save a complete user+AI exchange in one call."""
    session_id: str
    user_text: str
    ai_response: dict  # Full orchestrator result dict

class SaveMessageRequest(BaseModel):
    """Save a single message (user OR ai)."""
    session_id: str
    role: str   # 'user' | 'ai'
    content: str
    legal_keys: list = []
    severity_level: Optional[str] = None
    rights: list = []
    action_steps: list = []
    citation_badge: Optional[str] = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)


# ── Session endpoints ─────────────────────────────────────────────────────────

@router.post("/sessions", summary="Create a new chat session")
async def create_session(
    req: CreateSessionRequest,
    user: dict = Depends(get_current_user),
):
    """
    Create a new chat session for the authenticated user.
    Returns the new session object including its `id`.
    """
    try:
        session = _svc.create_session(
            user_id=user["user_id"],
            title=req.title,
            language=req.language,
        )
        return {"session": session}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", summary="List all sessions for the current user")
async def list_sessions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    user: dict = Depends(get_current_user),
):
    """
    Return paginated chat sessions (newest first, pinned always first).

    Example response:
    ```json
    {
      "sessions": [
        {"id": "...", "title": "Police arrest rights", "language": "hi",
         "is_pinned": false, "created_at": "2026-05-04T10:00:00Z", ...}
      ],
      "page": 1,
      "page_size": 20
    }
    ```
    """
    try:
        return _svc.list_sessions(
            user_id=user["user_id"],
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/sessions/{session_id}/rename", summary="Rename a chat session")
async def rename_session(
    session_id: str,
    req: RenameSessionRequest,
    user: dict = Depends(get_current_user),
):
    """Rename a specific chat session. Only the owner can rename it."""
    try:
        return {"session": _svc.rename_session(user["user_id"], session_id, req.title)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/sessions/{session_id}/pin", summary="Pin or unpin a session")
async def pin_session(
    session_id: str,
    req: PinSessionRequest,
    user: dict = Depends(get_current_user),
):
    """Toggle pin state of a session."""
    try:
        return {"session": _svc.toggle_pin(user["user_id"], session_id, req.pin)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}", summary="Delete a chat session")
async def delete_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Permanently delete a session and all its messages (CASCADE).
    Returns 204 on success.
    """
    try:
        deleted = _svc.delete_session(user["user_id"], session_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"deleted": True, "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Message endpoints ─────────────────────────────────────────────────────────

@router.get(
    "/sessions/{session_id}/messages",
    summary="Get messages in a session (paginated)",
)
async def get_messages(
    session_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
    before_id: Optional[str] = Query(default=None, description="Cursor: fetch messages older than this message ID"),
    user: dict = Depends(get_current_user),
):
    """
    Retrieve messages for a specific session.
    Supports offset pagination (`page`) and cursor pagination (`before_id`).

    Example response:
    ```json
    {
      "messages": [
        {"id": "...", "role": "user", "content": "My landlord is threatening me",
         "created_at": "2026-05-04T10:00:00Z"},
        {"id": "...", "role": "ai", "content": "...", "severity_level": "DANGER", ...}
      ],
      "session_id": "...",
      "page": 1,
      "page_size": 30
    }
    ```
    """
    try:
        return _svc.get_messages(
            user_id=user["user_id"],
            session_id=session_id,
            page=page,
            page_size=page_size,
            before_id=before_id,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/turn", summary="Persist a full user+AI turn")
async def save_turn(
    req: SaveTurnRequest,
    user: dict = Depends(get_current_user),
):
    """
    Save a complete conversation turn (user message + AI response) atomically.
    This is the primary write endpoint — called from the frontend after each exchange.

    Example request:
    ```json
    {
      "session_id": "uuid...",
      "user_text": "My landlord is threatening me",
      "ai_response": {
        "buddy_text": "...",
        "severity_level": "DANGER",
        "rights": [...],
        "action_steps": [...],
        "citation_badge": "📚",
        "legal_keys": ["Tenant Rights", "BNSS_50"]
      }
    }
    ```
    """
    try:
        user_msg, ai_msg = _svc.save_turn(
            user_id=user["user_id"],
            session_id=req.session_id,
            user_text=req.user_text,
            ai_response=req.ai_response,
        )
        return {"user_message": user_msg, "ai_message": ai_msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages", summary="Persist a single message")
async def save_message(
    req: SaveMessageRequest,
    user: dict = Depends(get_current_user),
):
    """Save one message (user or ai) to a session."""
    try:
        msg = _svc.save_message(
            user_id=user["user_id"],
            session_id=req.session_id,
            role=req.role,
            content=req.content,
            legal_keys=req.legal_keys,
            severity_level=req.severity_level,
            rights=req.rights,
            action_steps=req.action_steps,
            citation_badge=req.citation_badge,
        )
        return {"message": msg}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Search endpoint ───────────────────────────────────────────────────────────

@router.get("/search", summary="Search messages by text")
async def search_messages(
    q: str = Query(..., min_length=1, max_length=200, description="Search term"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    user: dict = Depends(get_current_user),
):
    """
    Search all of the user's messages by content (case-insensitive).

    Example: GET /api/history/search?q=landlord

    Response:
    ```json
    {
      "results": [
        {"id": "...", "session_id": "...", "role": "user",
         "content": "My landlord is threatening me", "created_at": "..."}
      ],
      "query": "landlord",
      "page": 1,
      "page_size": 20
    }
    ```
    """
    try:
        return _svc.search_messages(
            user_id=user["user_id"],
            query=q,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
