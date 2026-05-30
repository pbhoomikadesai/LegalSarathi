"""
DocumentMemoryService — stores and retrieves user-uploaded document chunks.

Flow:
  ingest(file_bytes, filename, user_id, session_id)
    → extract text (delegates to OCRService)
    → chunk into 400-word windows
    → embed each chunk (reuses RAGService._model)
    → upsert into user_documents + document_chunks (Supabase)

  retrieve(query, user_id, session_id=None, top_k=5)
    → embed query
    → cosine search in document_chunks via Supabase REST (no pgvector needed locally)
    → return formatted context string for prompt injection

Why use Supabase REST instead of local pgvector?
  The pgvector connection is already saturated by the main RAG pipeline. For
  document chunks (smaller corpus, same DB), a REST fallback with Python-side
  cosine ranking is fast enough for <10K chunks per user and avoids a second
  persistent DB connection.
"""
from __future__ import annotations

import os
import uuid
from typing import List, Optional

import numpy as np

from app.services.supabase_service import get_supabase_admin

# Chunk parameters
CHUNK_SIZE    = 400   # words per chunk
CHUNK_OVERLAP = 50    # word overlap between consecutive chunks
MAX_RAW_CHARS = 50_000  # cap raw_text storage

# How many chunks to return for context injection
DEFAULT_TOP_K = 5


class DocumentMemoryService:
    """Handles document ingestion + retrieval for per-user/session RAG memory."""

    def __init__(self, embed_model=None):
        """
        embed_model: a SentenceTransformer instance (shared from RAGService).
        If None, the service will lazy-load it on first use.
        """
        self._model = embed_model

    # ── Public API ─────────────────────────────────────────────────────────────

    def ingest(
        self,
        file_bytes: bytes,
        filename: str,
        user_id: str,
        session_id: Optional[str] = None,
        lang: str = "en",
    ) -> str:
        """
        Full ingestion pipeline. Returns the new document UUID.
        Raises on critical failure.
        """
        # 1. Extract text
        text = self._extract(file_bytes, filename, lang)
        if not text.strip():
            raise ValueError(f"No text could be extracted from '{filename}'")
        print(f"[DOCMEM] Extracted {len(text)} chars from '{filename}'")

        # 2. Chunk
        chunks = self._chunk(text)
        print(f"[DOCMEM] {len(chunks)} chunks created")

        # 3. Embed
        vectors = self._embed(chunks)

        # 4. Persist
        doc_id = self._persist(
            user_id=user_id,
            session_id=session_id,
            filename=filename,
            raw_text=text[:MAX_RAW_CHARS],
            chunks=chunks,
            vectors=vectors,
        )
        print(f"[DOCMEM] ✓ Ingested doc {doc_id} ({len(chunks)} chunks) for user {user_id[:8]}…")
        return doc_id

    def retrieve(
        self,
        query: str,
        user_id: str,
        session_id: Optional[str] = None,
        top_k: int = DEFAULT_TOP_K,
    ) -> str:
        """
        Returns a formatted context string ready to inject into the prompt.
        Empty string if no relevant chunks found.
        """
        chunks = self._search(query, user_id, session_id, top_k)
        if not chunks:
            return ""
        lines = []
        for c in chunks:
            src = c.get("filename", "uploaded document")
            lines.append(f"[From: {src}]\n{c['content']}")
        return "\n\n".join(lines)

    def list_documents(self, user_id: str, session_id: Optional[str] = None) -> List[dict]:
        """Return metadata for all documents belonging to user (optionally scoped to session)."""
        try:
            sb = get_supabase_admin()
            q = (
                sb.table("user_documents")
                .select("id, filename, session_id, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
            )
            if session_id:
                q = q.eq("session_id", session_id)
            return q.execute().data or []
        except Exception as e:
            print(f"[DOCMEM] list_documents failed: {e}")
            return []

    def delete_document(self, doc_id: str, user_id: str) -> bool:
        """Delete a document and all its chunks. Returns True on success."""
        try:
            sb = get_supabase_admin()
            result = (
                sb.table("user_documents")
                .delete()
                .eq("id", doc_id)
                .eq("user_id", user_id)   # ownership guard
                .execute()
            )
            return bool(result.data)
        except Exception as e:
            print(f"[DOCMEM] delete_document failed: {e}")
            return False

    # ── Internal ───────────────────────────────────────────────────────────────

    def _extract(self, file_bytes: bytes, filename: str, lang: str) -> str:
        """Delegate to OCRService (already instantiated in main.py)."""
        try:
            from app.services.ocr_service import OCRService
            svc = OCRService()
            return svc.extract(file_bytes, filename, lang)
        except Exception as e:
            print(f"[DOCMEM] OCR extraction failed: {e}")
            return ""

    def _chunk(self, text: str) -> List[str]:
        """Split text into overlapping word windows."""
        words = text.split()
        chunks = []
        step = CHUNK_SIZE - CHUNK_OVERLAP
        for start in range(0, len(words), step):
            chunk = " ".join(words[start : start + CHUNK_SIZE])
            if chunk.strip():
                chunks.append(chunk)
        return chunks

    def _embed(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of texts. Lazy-loads the model if not provided."""
        model = self._get_model()
        if model is None:
            # Fallback: zero vectors (retrieval disabled but ingestion still saves text)
            print("[DOCMEM] WARNING: No embed model available — chunks saved without embeddings")
            return [[0.0] * 384] * len(texts)
        vecs = model.encode(texts, batch_size=32, show_progress_bar=False)
        return vecs.tolist()

    def _get_model(self):
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(
                os.getenv(
                    "EMBEDDING_MODEL",
                    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
                )
            )
            return self._model
        except Exception as e:
            print(f"[DOCMEM] Model load failed: {e}")
            return None

    def _persist(
        self,
        user_id: str,
        session_id: Optional[str],
        filename: str,
        raw_text: str,
        chunks: List[str],
        vectors: List[List[float]],
    ) -> str:
        sb = get_supabase_admin()
        doc_id = str(uuid.uuid4())

        # Insert parent document row
        doc_data = {
            "id":        doc_id,
            "user_id":   user_id,
            "filename":  filename,
            "raw_text":  raw_text,
        }
        if session_id:
            doc_data["session_id"] = session_id

        sb.table("user_documents").insert(doc_data).execute()

        # Insert chunks in batches of 100
        batch_size = 100
        for batch_start in range(0, len(chunks), batch_size):
            batch_chunks = chunks[batch_start : batch_start + batch_size]
            batch_vecs   = vectors[batch_start : batch_start + batch_size]
            rows = [
                {
                    "doc_id":      doc_id,
                    "user_id":     user_id,
                    "chunk_index": batch_start + i,
                    "content":     chunk,
                    "embedding":   vec,
                }
                for i, (chunk, vec) in enumerate(zip(batch_chunks, batch_vecs))
            ]
            sb.table("document_chunks").insert(rows).execute()

        return doc_id

    def _search(
        self,
        query: str,
        user_id: str,
        session_id: Optional[str],
        top_k: int,
    ) -> List[dict]:
        """
        Retrieve top_k relevant chunks via Python-side cosine similarity.
        We fetch all chunks for this user (capped at 2000) and rank locally.
        This avoids needing pgvector RPC on the Supabase client side.
        For large corpora (>10K chunks), switch to a Supabase RPC function.
        """
        try:
            model = self._get_model()
            if model is None:
                return []

            sb = get_supabase_admin()

            # Fetch candidate chunks
            q = (
                sb.table("document_chunks")
                .select("id, doc_id, chunk_index, content, embedding, user_documents(filename)")
                .eq("user_id", user_id)
                .limit(2000)
            )
            if session_id:
                # Scope to chunks from documents linked to this session
                q = q.eq("user_documents.session_id", session_id)

            rows = q.execute().data or []
            if not rows:
                return []

            # Embed query
            q_vec = np.array(model.encode([query], show_progress_bar=False)[0])
            q_norm = np.linalg.norm(q_vec)
            if q_norm == 0:
                return []
            q_vec = q_vec / q_norm

            # Score each chunk
            scored = []
            for row in rows:
                emb = row.get("embedding")
                if not emb:
                    continue
                c_vec = np.array(emb, dtype=float)
                c_norm = np.linalg.norm(c_vec)
                if c_norm == 0:
                    continue
                score = float(np.dot(q_vec, c_vec / c_norm))
                doc_meta = row.get("user_documents") or {}
                scored.append({
                    "content":  row["content"],
                    "filename": doc_meta.get("filename", "document"),
                    "score":    score,
                })

            # Return top_k by score
            scored.sort(key=lambda x: x["score"], reverse=True)
            return scored[:top_k]

        except Exception as e:
            print(f"[DOCMEM] retrieve failed (non-fatal): {e}")
            return []
