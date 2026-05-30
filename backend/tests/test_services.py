import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.rag_service import RAGService
from app.services.reranker_service import RerankerService
from app.services.citation_audit import CitationAuditService
from app.agents.orchestrator import Orchestrator

# ── 1. RAGService.retrieve_hybrid() tests ────────────────────────────────────

def test_rag_service_retrieve_hybrid_mocked():
    rag = RAGService()
    # Mock index state to be ready
    rag._ready = True
    rag._model = MagicMock()
    
    # Mock encoding return
    rag._model.encode.return_value = [[0.1] * 384]
    
    # Mock chunks metadata
    rag._chunks_meta = [
        {"id": "BNS_73_0", "section_ref": "BNS_73", "title": "BNS §73", "text": "Arrest how made", "parent_content": "BNS §73 Arrest how made", "act": "BNS"},
        {"id": "BNSS_35_0", "section_ref": "BNSS_35", "title": "BNSS §35", "text": "Arrest without warrant", "parent_content": "BNSS §35 Arrest without warrant", "act": "BNSS"},
    ]
    
    # Mock dense retrieval query returns
    rag._query_faiss = MagicMock(return_value=[
        {"id": "BNS_73_0", "section_ref": "BNS_73", "title": "BNS §73", "text": "Arrest how made", "parent_content": "BNS §73 Arrest how made", "act": "BNS", "score": 0.9},
        {"id": "BNSS_35_0", "section_ref": "BNSS_35", "title": "BNSS §35", "text": "Arrest without warrant", "parent_content": "BNSS §35 Arrest without warrant", "act": "BNSS", "score": 0.8},
    ])
    
    # Mock BM25 index and query returns
    rag._bm25 = MagicMock()
    rag._query_bm25 = MagicMock(return_value=[
        {"id": "BNSS_35_0", "section_ref": "BNSS_35", "title": "BNSS §35", "text": "Arrest without warrant", "parent_content": "BNSS §35 Arrest without warrant", "act": "BNSS", "score": 12.5},
    ])
    
    merged, elapsed = rag.retrieve_hybrid("arrest", top_k=2)
    
    assert isinstance(merged, list)
    assert len(merged) > 0
    assert elapsed >= 0.0
    for chunk in merged:
        assert "section_ref" in chunk
        assert "text" in chunk
        assert "score" in chunk or "rrf_score" in chunk

# ── 2. RerankerService.rerank() tests ────────────────────────────────────────

def test_reranker_service_sorting():
    reranker = RerankerService()
    
    # Create simple dummy chunks
    chunks = [
        {"section_ref": "BNSS_35", "text": "Arrest without warrant description"},
        {"section_ref": "BNS_73", "text": "Arrest how made description"},
    ]
    
    # Patch the _get_model call to return a mock encoder
    mock_model = MagicMock()
    # Predict returns scores for each pair
    mock_model.predict.return_value = [0.12, 0.85]
    
    with patch("app.services.reranker_service._get_model", return_value=mock_model):
        reranked = reranker.rerank("arrest", chunks, top_k=2)
        
        assert len(reranked) == 2
        # Highest score should be first
        assert reranked[0]["section_ref"] == "BNS_73"
        assert reranked[1]["section_ref"] == "BNSS_35"
        assert reranked[0]["rerank_score"] == 0.85
        assert reranked[1]["rerank_score"] == 0.12

# ── 3. CitationAuditService.audit() tests ───────────────────────────────────

def test_citation_audit_score_range():
    auditor = CitationAuditService()
    retrieved = [
        {"section_ref": "BNS_73", "title": "Arrest how made"},
        {"section_ref": "BNSS_50", "title": "Grounds of arrest"},
    ]
    
    # Test case where citations match exactly
    answer = "Under [BNS_73] you have rights. Also under [BNSS_50] you must be told why."
    res = auditor.audit(answer, retrieved)
    
    assert 0.0 <= res["citation_score"] <= 1.0
    assert res["citation_score"] == 1.0
    assert "BNS_73" in res["verified"]
    assert "BNSS_50" in res["verified"]
    assert len(res["unverified"]) == 0

def test_citation_audit_verified_vs_unverified():
    auditor = CitationAuditService()
    retrieved = [
        {"section_ref": "BNS_73", "title": "Arrest how made"},
    ]
    
    # Test citation BNS_99 is not in retrieved set
    answer = "The arrest is defined in [BNS_73], but punishment is [BNS_99]."
    res = auditor.audit(answer, retrieved)
    
    assert res["citation_score"] == 0.5
    assert "BNS_73" in res["verified"]
    assert "BNS_99" in res["unverified"]

# ── 4. Orchestrator.process_query() tests ────────────────────────────────────

@pytest.mark.asyncio
async def test_orchestrator_process_query():
    orc = Orchestrator()
    
    # Mock Translator
    orc.translator.translate_to_english = AsyncMock(return_value="Arrest rights for neighbor")
    orc.translator.translate = AsyncMock(return_value="पड़ोसी की गिरफ्तारी के अधिकार")
    
    # Mock Search Service
    orc.search_service.search_legal_context = MagicMock(return_value=("Web search result", ["http://test.com"]))
    
    # Mock RAG Service
    orc.rag_service._ready = True
    mock_chunks = [
        {"id": "BNSS_35_0", "section_ref": "BNSS_35", "title": "Arrest", "text": "Arrest rules", "parent_content": "Arrest rules", "score": 0.9}
    ]
    orc.rag_service.retrieve_hybrid = MagicMock(return_value=(mock_chunks, 0.05))
    
    # Mock Reranker
    orc.reranker.rerank = MagicMock(return_value=mock_chunks)
    
    # Mock Groq Service
    orc.groq_service.extract_legal_keys = AsyncMock(return_value=["Arrest", "BNSS Section 35"])
    
    buddy_mock_response = {
        "situation_summary": "Summary of neighbors arrest",
        "severity_level": "CAUTION",
        "rights": ["Right to know reasons"],
        "action_steps": ["Call NALSA helpline 15100"],
        "do_not_do": ["Don't sign blank papers"],
        "evidence_required": ["Arrest memo copy"],
        "jurisdiction_note": "Central BNS applies",
        "awareness": "Legal awareness note",
        "buddy_text": "Buddy text explanation",
        "help_channels": [{"name": "NALSA", "phone": "15100", "url": "https://nalsa.gov.in", "label_in_lang": "NALSA"}]
    }
    orc.groq_service.synthesize_buddy_response = AsyncMock(return_value=buddy_mock_response)
    
    # Mock Specialist
    orc.specialist_service = None
    
    # Call the process_query
    res = await orc.process_query("neighbor arrested without warrant", lang="hi")
    
    # Assertions
    assert isinstance(res, dict)
    required_keys = [
        "situation_summary", "rights", "action_steps", "do_not_do",
        "evidence_required", "citation_score", "citation_badge", "latency"
    ]
    for key in required_keys:
        assert key in res
        
    assert res["situation_summary"] == "Summary of neighbors arrest"
    assert res["rights"] == ["Right to know reasons"]
    assert res["action_steps"] == ["Call NALSA helpline 15100"]
    assert res["citation_score"] == 0.0  # Since rights had no citation bracket
    assert "latency" in res
    assert "translation" in res["latency"]
    assert "parallel" in res["latency"]
    assert "rerank" in res["latency"]
    assert "synthesis" in res["latency"]
    assert "total" in res["latency"]
