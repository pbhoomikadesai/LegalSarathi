import time
import asyncio
import hashlib
import json
import re
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from app.services.groq_service import GroqService
from app.services.specialist_service import SpecialistService
from app.services.translator import TranslatorService
from app.services.search_service import SearchService
from app.services.rag_service import RAGService
from app.services.citation_audit import CitationAuditService
from app.services.reranker_service import RerankerService

# Single-thread executor for GGUF (llama_cpp not thread-safe)
_GGUF_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="gguf")

HELP_CHANNELS_BASE = [
    {"name": "NALSA",               "phone": "15100",        "url": "https://nalsa.gov.in"},
    {"name": "RTI Portal",          "phone": None,           "url": "https://rtionline.gov.in"},
    {"name": "Women Helpline",      "phone": "1091",         "url": "https://wcd.nic.in"},
    {"name": "Supreme Court Aid",   "phone": None,           "url": "https://sci.gov.in"},
    {"name": "Consumer Forum",      "phone": "1800-11-4000", "url": "https://consumerhelpline.gov.in"},
    {"name": "Police",              "phone": "100",          "url": "https://digitalpolice.gov.in"},
]

# ── In-memory LRU cache (no Redis needed) ────────────────────────────────────
_CACHE_MAX = 100       # max entries
_CACHE_TTL = 3600      # seconds (1 hour)
_cache: OrderedDict = OrderedDict()       # { key: (timestamp, result_dict) }


def _cache_key(text: str, lang: str) -> str:
    return hashlib.sha256(f"{text.strip().lower()}::{lang}".encode()).hexdigest()[:16]


def _cache_get(key: str):
    entry = _cache.get(key)
    if entry is None:
        return None
    ts, val = entry
    if time.time() - ts > _CACHE_TTL:
        _cache.pop(key, None)
        return None
    # Move to end (LRU)
    _cache.move_to_end(key)
    return val


def _cache_set(key: str, value: dict):
    if key in _cache:
        _cache.move_to_end(key)
    _cache[key] = (time.time(), value)
    # Evict oldest if over limit
    while len(_cache) > _CACHE_MAX:
        _cache.popitem(last=False)


class Orchestrator:
    def __init__(self):
        self.groq_service    = GroqService()
        self.translator      = TranslatorService()
        self.search_service  = SearchService()
        self.citation_audit  = CitationAuditService()
        self.reranker        = RerankerService()

        try:
            self.specialist_service = SpecialistService()
        except Exception as e:
            print(f"[GGUF API] Offline: {e}")
            self.specialist_service = None

        # RAG loads at startup — non-fatal if index not built yet
        self.rag_service = RAGService()
        if not self.rag_service.is_ready:
            print("[RAG] Not ready — run ingest_corpus.py to build index")

    async def process_query(self, text: str, lang: str = "hi", pinned_history: list = None, conversation_history: list = None, doc_context: str = "", session_summary: str = ""):
        if not text or not text.strip():
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="Query cannot be empty.")

        # ── Pinned History Context Injection ──────────────────────────────────
        prefix_context = []
        if pinned_history:
            # We prepend a summary of the pinned session to the query
            # to give the model immediate context without bloating prompt
            pinned_summary = "\n".join([f"{m['role']}: {m['content'][:200]}" for m in pinned_history[-5:]])
            prefix_context.append(f"CONTEXT FROM PINNED SESSION:\n{pinned_summary}")

        if session_summary:
            prefix_context.append(f"EARLIER IN THIS SESSION:\n{session_summary}")
        
        if prefix_context:
            text = "\n\n".join(prefix_context) + f"\n\nUSER CURRENT QUERY: {text}"


        # ── LRU Cache check (skip for multi-turn — context-dependent) ─────────
        cache_key = _cache_key(text, lang)
        if not conversation_history:
            cached = _cache_get(cache_key)
            if cached is not None:
                print(f"[CACHE HIT] key={cache_key}")
                return cached
        else:
            print(f"[CACHE SKIP] conversation_history present ({len(conversation_history)} turns)")

        start_total = time.time()

        # ── 1. Translate to English ──────────────────────────────────────────
        t0 = time.time()
        english_text = await self.translator.translate_to_english(text, lang)
        t_translate = time.time() - t0
        print(f"[LATENCY] Translation: {t_translate:.3f}s")

        # ── 2. Parallel: Groq key extraction + Web search + Hybrid RAG ───────
        t0 = time.time()
        seed_keywords = [w for w in english_text.split() if len(w) > 3][:5]

        parallel_tasks = [
            self.groq_service.extract_legal_keys(english_text),
            asyncio.to_thread(self.search_service.search_legal_context, seed_keywords),
        ]
        if self.rag_service.is_ready:
            parallel_tasks.append(
                asyncio.to_thread(self.rag_service.retrieve_hybrid, english_text)
            )

        if self.specialist_service:
            parallel_tasks.append(
                self.specialist_service.generate_guidance(english_text, seed_keywords)
            )

        results = await asyncio.gather(*parallel_tasks)
        legal_keys = results[0]
        web_context, source_urls = results[1]

        _result_idx = 2
        
        if self.rag_service.is_ready:
            rag_chunks_raw, t_rag = results[_result_idx]
            _result_idx += 1
        else:
            rag_chunks_raw, t_rag = [], 0.0

        if self.specialist_service:
            gguf_result = results[_result_idx]
            _result_idx += 1
        else:
            gguf_result = ""

        # Fallback web search if seed returned nothing
        if (not web_context.strip() or web_context == "No legal context found.") and legal_keys:
            web_context, source_urls = await asyncio.to_thread(
                self.search_service.search_legal_context, legal_keys
            )

        t_parallel = time.time() - t0
        print(f"[LATENCY] Parallel (keys+search+hybrid RAG): {t_parallel:.3f}s | Candidates: {len(rag_chunks_raw)}")

        # ── 3. CrossEncoder Re-Ranking ────────────────────────────────────────
        t0 = time.time()
        if rag_chunks_raw:
            rag_chunks = self.reranker.rerank(english_text, rag_chunks_raw, top_k=5)
        else:
            rag_chunks = rag_chunks_raw
        t_rerank = time.time() - t0
        print(f"[LATENCY] Re-ranking: {t_rerank:.3f}s | Final chunks: {len(rag_chunks)}")

        # ── 4. Format RAG for Groq ────────────────────────────────────────────
        rag_context = self.rag_service.format_for_prompt(rag_chunks) if rag_chunks else ""
        print(f"[RAG] Top sections: {[c.get('section_ref', 'UNKNOWN') for c in rag_chunks[:3]]}")
        print(f"[GGUF API] Result chars: {len(gguf_result)}")

        # ── 5. Groq synthesis ─────────────────────────────────────────────────
        t0 = time.time()
        buddy_data = await self.groq_service.synthesize_buddy_response(
            english_text=english_text,
            legal_keys=legal_keys,
            web_context=web_context,
            target_lang=lang,
            specialist_opinion=gguf_result,
            rag_context=rag_context,
            conversation_history=conversation_history or [],
            doc_context=doc_context,
        )
        t_synthesis = time.time() - t0
        print(f"[LATENCY] Groq Synthesis: {t_synthesis:.3f}s")

        # ── 6. Citation Audit ─────────────────────────────────────────────────
        full_answer_text = " ".join([
            buddy_data.get("situation_summary", ""),
            " ".join(buddy_data.get("rights", [])),
            " ".join(buddy_data.get("action_steps", [])),
            buddy_data.get("awareness", ""),
        ])
        citation_result = self.citation_audit.audit(full_answer_text, rag_chunks)
        print(f"[CITATION] Score={citation_result['citation_score']} | {citation_result['badge'].encode('ascii','ignore').decode()}")

        groq_channels  = buddy_data.get("help_channels", [])
        existing_names = {c["name"] for c in groq_channels}
        for ch in HELP_CHANNELS_BASE:
            if ch["name"] not in existing_names:
                groq_channels.append(ch)
        buddy_data["help_channels"] = groq_channels[:6]
        buddy_data["source_urls"]   = source_urls

        total_time = time.time() - start_total
        print(f"[LATENCY] Total: {total_time:.3f}s")

        query_in_target_lang = text
        if lang not in ("en", "en-IN"):
            try:
                query_in_target_lang = await self.translator.translate(text, source_lang="auto", target_lang=lang)
            except Exception as e:
                print(f"[TRANSLATE ERROR] query target lang failed: {e}")

        result = {
            "query":            text,
            "query_in_target_lang": query_in_target_lang,
            "lang":             lang,
            "legal_keys":       legal_keys,
            "gguf_raw":         gguf_result[:800] if gguf_result else "",
            "rag_chunks_used":  [c.get("section_ref", "UNKNOWN") for c in rag_chunks],
            "citation_score":   citation_result["citation_score"],
            "citation_badge":   citation_result["badge"],
            "situation_summary": buddy_data.get("situation_summary", ""),
            "severity_level":   buddy_data.get("severity_level", "INFO"),
            "rights":           buddy_data.get("rights", []),
            "action_steps":     buddy_data.get("action_steps", []),
            "do_not_do":        buddy_data.get("do_not_do", []),
            "evidence_required": buddy_data.get("evidence_required", []),
            "jurisdiction_note": buddy_data.get("jurisdiction_note", ""),
            "awareness":        buddy_data.get("awareness", ""),
            "buddy_text":       buddy_data.get("buddy_text", ""),
            "help_channels":    buddy_data.get("help_channels", []),
            "source_urls":      buddy_data.get("source_urls", []),
            "latency": {
                "translation": round(t_translate, 2),
                "parallel":    round(t_parallel, 2),
                "rerank":      round(t_rerank, 2),
                "synthesis":   round(t_synthesis, 2),
                "total":       round(total_time, 2),
            },
        }

        # Store in LRU cache (only for single-turn queries)
        if not conversation_history:
            _cache_set(cache_key, result)
        return result

    # ── Document Chat ─────────────────────────────────────────────────────────

    async def process_doc_chat(
        self,
        doc_text: str,
        message: str,
        mode: str,
        history: list,
        lang: str,
    ) -> dict:
        """
        Document-specific chat — bypasses RAG entirely.
        The extracted document text IS the retrieval context.
        """
        # 1. Translate user message to English for Groq
        try:
            english_message = await self.translator.translate_to_english(message, lang)
        except Exception:
            english_message = message  # fallback: send as-is

        # 2. Trim doc text to 4000 chars (fits comfortably in Groq context)
        doc_context = doc_text[:4000]

        # 3. Build conversation history string
        history_str = ""
        for msg in history[-6:]:
            label = "User" if msg.get("role") == "user" else "Assistant"
            history_str += f"{label}: {msg.get('content', '')[:300]}\n"

        # 4. Call Groq with mode-specific prompt
        response = await self.groq_service.doc_chat_response(
            doc_context=doc_context,
            message=english_message,
            mode=mode,
            history=history_str,
            target_lang=lang,
        )

        return {
            "mode": mode,
            "response": response,
            "doc_chars_used": len(doc_context),
        }

