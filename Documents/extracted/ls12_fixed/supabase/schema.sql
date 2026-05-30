-- ============================================================
-- LegalSarathi — Supabase Schema
-- Run this ENTIRE script in the Supabase SQL Editor once.
-- ============================================================

-- ── 1. Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
    id                 uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    phone              text        UNIQUE NOT NULL,
    name               text,
    state              text,
    preferred_language text        DEFAULT 'hi',
    interests          text[]      DEFAULT '{}',
    is_premium         boolean     DEFAULT false,
    created_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    title             text        NOT NULL,
    language          text        DEFAULT 'hi',
    is_pinned         boolean     DEFAULT false,
    pinned_at         timestamptz,
    pinned_session_id uuid        REFERENCES chat_sessions ON DELETE SET NULL,
    summary           text        DEFAULT NULL,        -- compressed memory of older turns
    message_count     integer     DEFAULT 0,           -- tracks when to trigger summarizer
    created_at        timestamptz DEFAULT now(),
    expires_at        timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     uuid        REFERENCES chat_sessions ON DELETE CASCADE NOT NULL,
    user_id        uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    role           text        CHECK (role IN ('user','ai')) NOT NULL,
    content        text        NOT NULL,
    legal_keys     text[]      DEFAULT '{}',
    severity_level text,
    rights         jsonb       DEFAULT '[]',
    action_steps   jsonb       DEFAULT '[]',
    citation_badge text,
    summarized     boolean     DEFAULT false,           -- true once absorbed into session summary
    created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    doc_type            text        NOT NULL,         -- UPLOADED | RTI | FIR | BAIL | NOTICE
    title               text        NOT NULL,
    extracted_text      text,
    pdf_url             text,
    storage_path        text,
    language            text        DEFAULT 'hi',
    doc_chat_session_id uuid        REFERENCES chat_sessions ON DELETE SET NULL,
    created_at          timestamptz DEFAULT now(),
    expires_at          timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS doc_chat_messages (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id     uuid        REFERENCES documents ON DELETE CASCADE NOT NULL,
    user_id    uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    role       text        CHECK (role IN ('user','ai')) NOT NULL,
    content    text        NOT NULL,
    mode       text,                                  -- summary|qa|clause_extract|translate|draft_reply
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_events (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    event_type text        NOT NULL,                  -- query|doc_generated|voice_used|ocr_used|doc_chat
    metadata   jsonb       DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- ── Document Memory (OCR / PDF uploads) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_documents (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    session_id   uuid        REFERENCES chat_sessions ON DELETE SET NULL,
    filename     text        NOT NULL,
    raw_text     text,                                 -- first 50K chars of extracted text
    created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id       uuid        REFERENCES user_documents ON DELETE CASCADE NOT NULL,
    user_id      uuid        REFERENCES profiles ON DELETE CASCADE NOT NULL,
    chunk_index  integer     NOT NULL,
    content      text        NOT NULL,
    embedding    vector(384),                          -- must match EMBEDDING_MODEL dim
    created_at   timestamptz DEFAULT now()
);

-- ── 2. Auto-create profile on signup (trigger) ────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.phone, NEW.email, '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile"       ON profiles          FOR ALL USING (auth.uid() = id);
CREATE POLICY "Own sessions"      ON chat_sessions     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own messages"      ON chat_messages     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own documents"     ON documents         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own doc chats"     ON doc_chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own events"        ON user_events       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own user_docs"     ON user_documents    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own doc_chunks"    ON document_chunks   FOR ALL USING (auth.uid() = user_id);

-- ── 4. pg_cron — 11-day data purge (runs at 2AM daily) ───────────────────────
-- NOTE: Enable the pg_cron extension first via Supabase Dashboard → Extensions

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SELECT cron.schedule('purge-expired-data', '0 2 * * *', $$
--     DELETE FROM doc_chat_messages
--         WHERE doc_id IN (SELECT id FROM documents WHERE expires_at < now());
--     DELETE FROM documents WHERE expires_at < now();
--     DELETE FROM chat_messages
--         WHERE session_id IN (SELECT id FROM chat_sessions WHERE expires_at < now());
--     UPDATE chat_sessions
--         SET is_pinned = false, pinned_at = NULL
--         WHERE is_pinned = true AND expires_at < now();
--     DELETE FROM chat_sessions WHERE expires_at < now();
-- $$);

-- ── 5. Storage bucket for legal-documents ────────────────────────────────────
-- Create this manually in Supabase Dashboard → Storage → New Bucket
-- Name: legal-documents | Public: OFF (use signed URLs)

-- ── 6. Performance Indexes ────────────────────────────────────────────────────
-- Optimizes paginated queries for chat history feature.
-- Run these ONCE after the main schema is applied.

-- Sessions: fast user timeline (newest first)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_time
    ON chat_sessions (user_id, created_at DESC);

-- Sessions: pinned sessions always float to top
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_pinned
    ON chat_sessions (user_id, is_pinned DESC, created_at DESC);

-- Sessions: filter out expired sessions efficiently
CREATE INDEX IF NOT EXISTS idx_chat_sessions_expires
    ON chat_sessions (expires_at);

-- Messages: chronological fetch within a session
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time
    ON chat_messages (session_id, created_at ASC);

-- Messages: user-scoped for search and security checks
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_time
    ON chat_messages (user_id, created_at DESC);

-- Messages: full-text search support (GIN index on content)
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_fts
    ON chat_messages USING gin(to_tsvector('english', content));

-- Messages: fast lookup of unsummarized messages per session
CREATE INDEX IF NOT EXISTS idx_chat_messages_unsummarized
    ON chat_messages (session_id, summarized, created_at ASC);

-- Document chunks: vector similarity search (ivfflat, 50 lists suitable for <500K rows)
-- NOTE: Requires pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- Document chunks: user-scoped retrieval
CREATE INDEX IF NOT EXISTS idx_doc_chunks_user
    ON document_chunks (user_id);

-- Document chunks: doc-scoped retrieval
CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc
    ON document_chunks (doc_id, chunk_index ASC);

