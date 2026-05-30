-- ============================================================
-- LegalSarathi — Schema Migration v2
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor
-- (safe to run multiple times — all statements are idempotent)
-- ============================================================

-- Requires pgvector extension for document_chunks.embedding
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. Alter existing tables ──────────────────────────────────────────────────

-- Add compressed memory column to chat_sessions
ALTER TABLE chat_sessions
    ADD COLUMN IF NOT EXISTS summary       text    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0;

-- Add summarization tracking to chat_messages
ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS summarized boolean DEFAULT false;

-- ── 2. New tables ─────────────────────────────────────────────────────────────

-- User-uploaded document metadata
CREATE TABLE IF NOT EXISTS user_documents (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    session_id   uuid        REFERENCES chat_sessions ON DELETE SET NULL,
    filename     text        NOT NULL,
    raw_text     text,
    created_at   timestamptz DEFAULT now()
);

-- Document chunks (chunked + embedded text for RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id       uuid        REFERENCES user_documents ON DELETE CASCADE NOT NULL,
    user_id      uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    chunk_index  integer     NOT NULL,
    content      text        NOT NULL,
    embedding    vector(384),
    created_at   timestamptz DEFAULT now()
);

-- ── 3. Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE user_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to avoid duplicates
DROP POLICY IF EXISTS "Own user_docs"  ON user_documents;
DROP POLICY IF EXISTS "Own doc_chunks" ON document_chunks;

CREATE POLICY "Own user_docs"  ON user_documents  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own doc_chunks" ON document_chunks FOR ALL USING (auth.uid() = user_id);

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

-- Fast lookup of unsummarized messages per session
CREATE INDEX IF NOT EXISTS idx_chat_messages_unsummarized
    ON chat_messages (session_id, summarized, created_at ASC);

-- Vector similarity search on document chunks
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- User-scoped retrieval
CREATE INDEX IF NOT EXISTS idx_doc_chunks_user
    ON document_chunks (user_id);

-- Doc-scoped chunk retrieval
CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc
    ON document_chunks (doc_id, chunk_index ASC);
