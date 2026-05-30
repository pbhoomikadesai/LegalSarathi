"""
RAG Service — Neon pgvector (primary) + local FAISS (fallback) + BM25 (sparse)
Hybrid search: Dense + BM25 merged with Reciprocal Rank Fusion (RRF).
Loads embedding model once at startup.
retrieve_hybrid() → top-10 merged candidates for CrossEncoder re-ranking.
"""

import os, pickle, time
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from dotenv import load_dotenv

# Try three candidate paths in order, fall back to CWD
_p1 = Path(__file__).resolve().parents[3] / ".env"
_p2 = Path(__file__).resolve().parents[2] / ".env"
_p3 = Path.cwd() / ".env"

if _p1.exists():
    load_dotenv(dotenv_path=str(_p1))
elif _p2.exists():
    load_dotenv(dotenv_path=str(_p2))
elif _p3.exists():
    load_dotenv(dotenv_path=str(_p3))
else:
    load_dotenv()

# Try both path resolutions (run from backend/ or root)
_base = Path(__file__).resolve().parents[1]
INDEX_DIR = _base / "data" / "faiss_index"

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"  # 117MB, CPU-fast
)
NEON_URL = os.getenv("NEON_DATABASE_URL", "")
TOP_K = 5
RRF_K = 60   # RRF constant (standard value)


class RAGService:
    def __init__(self):
        self._model = None
        self._faiss_index = None
        self._chunks_meta: List[Dict] = []
        self._bm25 = None          # BM25 index (built from chunks_meta)
        self._use_neon = False
        self._ready = False
        self._load()

    def _load(self):
        # ── Embedding model ──────────────────────────────────────────────────
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(EMBEDDING_MODEL)
            print(f"[RAG] Embedding model loaded: {EMBEDDING_MODEL}")
        except Exception as e:
            print(f"[RAG] Model load failed: {e}")
            return

        # ── FAISS fallback ───────────────────────────────────────────────────
        fp = INDEX_DIR / "legal_index.faiss"
        mp = INDEX_DIR / "chunks_meta.pkl"
        if fp.exists() and mp.exists():
            try:
                import faiss
                self._faiss_index = faiss.read_index(str(fp))
                with open(mp, "rb") as f:
                    self._chunks_meta = pickle.load(f)
                self._ready = True
                print(f"[RAG] FAISS loaded: {self._faiss_index.ntotal} vectors")
                self._build_bm25()
            except Exception as e:
                print(f"[RAG] FAISS load error: {e}")
        else:
            print(f"[RAG] No FAISS index at {fp} -- run ingest_corpus.py")

        # ── Neon pgvector (preferred) ────────────────────────────────────────
        if NEON_URL:
            try:
                import psycopg2
                from pgvector.psycopg2 import register_vector
                conn = psycopg2.connect(NEON_URL)
                register_vector(conn)
                conn.close()
                self._use_neon = True
                self._ready = True
                print("[RAG] Neon pgvector connected OK")
                # Load chunks_meta for BM25 if not loaded from FAISS
                if not self._chunks_meta:
                    self._load_chunks_from_neon()
                    self._build_bm25()
            except Exception as e:
                print(f"[RAG] Neon connection failed: {e} -- using FAISS")

    def _load_chunks_from_neon(self):
        """Load all chunk texts from Neon to build BM25 index."""
        try:
            import psycopg2
            from pgvector.psycopg2 import register_vector
            conn = psycopg2.connect(NEON_URL)
            register_vector(conn)
            cur = conn.cursor()
            cur.execute("SELECT id, section_ref, title, content, parent_content, act FROM legal_chunks LIMIT 5000;")
            rows = cur.fetchall()
            cur.close()
            conn.close()
            self._chunks_meta = [
                {"id": r[0], "section_ref": r[1], "title": r[2],
                 "text": r[3], "parent_content": r[4], "act": r[5]}
                for r in rows
            ]
            print(f"[RAG] Loaded {len(self._chunks_meta)} chunks from Neon for BM25")
        except Exception as e:
            print(f"[RAG] Could not load chunks from Neon for BM25: {e}")

    def _build_bm25(self):
        """Build BM25 index over chunk texts."""
        if not self._chunks_meta:
            return
        try:
            from rank_bm25 import BM25Okapi
            corpus = [
                c.get("text", "").lower().split()
                for c in self._chunks_meta
            ]
            self._bm25 = BM25Okapi(corpus)
            print(f"[RAG] BM25 index built: {len(corpus)} documents")
        except ImportError:
            print("[RAG] rank-bm25 not installed. BM25 disabled. Run: pip install rank-bm25")
        except Exception as e:
            print(f"[RAG] BM25 build error: {e}")

    # ── Public API ────────────────────────────────────────────────────────────

    def retrieve(self, query: str, top_k: int = TOP_K) -> Tuple[List[Dict], float]:
        """Dense-only retrieval (legacy compatibility)."""
        if not self._ready or not self._model:
            return [], 0.0

        t = time.time()
        q_emb = self._model.encode([query], show_progress_bar=False)
        q_emb = np.array(q_emb, dtype="float32")

        results = []
        if self._use_neon:
            results = self._query_neon(q_emb[0], top_k)
        if not results and self._faiss_index is not None:
            results = self._query_faiss(q_emb, top_k)

        elapsed = time.time() - t
        print(f"[RAG] Dense: {len(results)} chunks in {elapsed:.3f}s")
        return results, elapsed

    def retrieve_hybrid(self, query: str, top_k: int = 10) -> Tuple[List[Dict], float]:
        """
        Hybrid retrieval: Dense + BM25 merged via RRF.
        Returns up to top_k candidates for CrossEncoder re-ranking.
        Falls back to dense-only if BM25 not available.
        """
        if not self._ready or not self._model:
            return [], 0.0

        t = time.time()

        # ── Dense retrieval ──────────────────────────────────────────────────
        q_emb = self._model.encode([query], show_progress_bar=False)
        q_emb = np.array(q_emb, dtype="float32")
        
        dense_results = []
        if self._use_neon:
            dense_results = self._query_neon(q_emb[0], top_k)
        if not dense_results and self._faiss_index is not None:
            dense_results = self._query_faiss(q_emb, top_k)

        # ── BM25 sparse retrieval ────────────────────────────────────────────
        bm25_results = self._query_bm25(query, top_k) if self._bm25 else []

        # ── RRF merge ────────────────────────────────────────────────────────
        if bm25_results:
            merged = self._rrf_merge(dense_results, bm25_results, top_k)
        else:
            merged = dense_results[:top_k]

        elapsed = time.time() - t
        print(
            f"[RAG] Hybrid: dense={len(dense_results)} bm25={len(bm25_results)} "
            f"-> merged={len(merged)} in {elapsed:.3f}s"
        )
        return merged, elapsed

    # ── Internal retrievers ───────────────────────────────────────────────────

    def _query_neon(self, emb: np.ndarray, top_k: int) -> List[Dict]:
        try:
            import psycopg2
            from pgvector.psycopg2 import register_vector
            conn = psycopg2.connect(NEON_URL)
            register_vector(conn)
            cur = conn.cursor()
            cur.execute("""
                SELECT id, section_ref, title, content, parent_content, act,
                       1 - (embedding <=> %s::vector) AS score
                FROM legal_chunks
                ORDER BY embedding <=> %s::vector
                LIMIT %s;
            """, (emb.tolist(), emb.tolist(), top_k))
            rows = cur.fetchall()
            cur.close()
            conn.close()

            seen_sections = set()
            results = []
            for r in rows:
                if r[1] not in seen_sections:
                    seen_sections.add(r[1])
                    results.append({
                        "id": r[0], "section_ref": r[1], "title": r[2],
                        "text": r[3], "parent_content": r[4], "act": r[5], "score": float(r[6])
                    })
            return results
        except Exception as e:
            print(f"[RAG] Neon query error: {e}")
            return []

    def _query_faiss(self, q_emb: np.ndarray, top_k: int) -> List[Dict]:
        import faiss
        faiss.normalize_L2(q_emb)
        scores, idxs = self._faiss_index.search(q_emb, top_k)
        return [
            {**self._chunks_meta[i], "score": float(s),
             "parent_content": self._chunks_meta[i].get("parent_content", self._chunks_meta[i].get("text", self._chunks_meta[i].get("content", "")))}
            for s, i in zip(scores[0], idxs[0]) if i != -1
        ]

    def _query_bm25(self, query: str, top_k: int) -> List[Dict]:
        """Sparse BM25 retrieval over chunks_meta corpus."""
        try:
            tokenized_query = query.lower().split()
            scores = self._bm25.get_scores(tokenized_query)
            # Get top_k indices by score
            top_indices = np.argsort(scores)[::-1][:top_k]
            results = []
            seen = set()
            for idx in top_indices:
                chunk = self._chunks_meta[idx]
                ref = chunk.get("section_ref", str(idx))
                if ref not in seen and scores[idx] > 0:
                    seen.add(ref)
                    results.append({
                        **chunk,
                        "score": float(scores[idx]),
                        "parent_content": chunk.get("parent_content", chunk.get("text", ""))
                    })
            return results
        except Exception as e:
            print(f"[RAG] BM25 query error: {e}")
            return []

    def _rrf_merge(
        self,
        dense: List[Dict],
        sparse: List[Dict],
        top_k: int,
    ) -> List[Dict]:
        """
        Reciprocal Rank Fusion.
        score(d) = 1/(RRF_K + rank_dense) + 1/(RRF_K + rank_sparse)
        """
        scores: Dict[str, float] = {}
        chunk_map: Dict[str, Dict] = {}

        for rank, chunk in enumerate(dense):
            ref = chunk.get("section_ref", str(rank))
            scores[ref] = scores.get(ref, 0.0) + 1.0 / (RRF_K + rank + 1)
            chunk_map[ref] = chunk

        for rank, chunk in enumerate(sparse):
            ref = chunk.get("section_ref", str(rank))
            scores[ref] = scores.get(ref, 0.0) + 1.0 / (RRF_K + rank + 1)
            if ref not in chunk_map:
                chunk_map[ref] = chunk

        ranked_refs = sorted(scores.keys(), key=lambda r: scores[r], reverse=True)
        merged = []
        for ref in ranked_refs[:top_k]:
            c = chunk_map[ref]
            c["rrf_score"] = scores[ref]
            merged.append(c)
        return merged

    def format_for_prompt(self, chunks: List[Dict]) -> str:
        if not chunks:
            return ""
        lines = ["RETRIEVED LEGAL STATUTES (cite by [section_ref] in your answer):"]
        for c in chunks:
            lines.append(f"\n[{c['section_ref']}]")
            lines.append(c.get("parent_content", c.get("text", c.get("content", ""))))
        return "\n".join(lines)

    @property
    def is_ready(self) -> bool:
        return self._ready
