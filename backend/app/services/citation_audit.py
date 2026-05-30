"""
Citation Audit Service
Verifies that the section references cited in Groq's answer
actually exist in the retrieved RAG chunks (not hallucinated).

Method: "Source-Verified Prompting" (council recommendation)
- Groq prompt includes chunk IDs
- Groq cites them as [section_ref]
- We verify each cited ID was in the retrieved set
- Output: citation_score (0.0-1.0), verified[], unverified[]
"""

import re
from typing import List, Dict, Tuple


class CitationAuditService:

    # Pattern matches: [BNS_73], [BNSS_50], [IPC_420], [CONST_22], etc.
    CITATION_PATTERN = re.compile(r'\[([A-Z_]+\d+[A-Za-z_]*)\]')

    # Also match inline patterns like "Section 73 BNS", "BNS 2023 Section 73"
    INLINE_PATTERN = re.compile(
        r'(?:BNS|BNSS|IPC|CrPC|Section|Sec\.?|Article)\s*(\d+[A-Z]?)',
        re.IGNORECASE
    )

    def audit(
        self,
        answer_text: str,
        retrieved_chunks: List[Dict],
    ) -> Dict:
        """
        Audit the LLM answer against retrieved chunks.
        Returns:
            citation_score: float 0.0-1.0
            verified:  list of chunk IDs that were cited AND retrieved
            unverified: list of IDs cited but NOT in retrieved set
            uncited_available: retrieved chunks that were NOT cited (missed)
            badge: display string for UI
        """
        retrieved_ids = {c["section_ref"] for c in retrieved_chunks if c.get("section_ref")}
        retrieved_titles = {c.get("title", "").lower() for c in retrieved_chunks}

        # Extract chunk-ID style citations [BNS_73]
        cited_ids = set(self.CITATION_PATTERN.findall(answer_text))

        # Also extract inline section numbers and try to match to retrieved IDs
        inline_nums = self.INLINE_PATTERN.findall(answer_text)
        for num in inline_nums:
            # Try to match to a retrieved chunk by section number
            for rid in retrieved_ids:
                if num in rid:
                    cited_ids.add(rid)

        verified   = [cid for cid in cited_ids if cid in retrieved_ids]
        unverified = [cid for cid in cited_ids if cid not in retrieved_ids]
        uncited    = [rid for rid in retrieved_ids if rid not in cited_ids]

        total_cited = len(cited_ids)
        if total_cited == 0:
            # No citations at all — check if any retrieved content appears in answer
            grounded_count = sum(
                1 for c in retrieved_chunks
                if any(word in answer_text for word in c.get("text", c.get("content", "")).split()[:5])
            )
            citation_score = min(0.5, grounded_count / max(len(retrieved_chunks), 1))
            badge = "⚠️ No explicit citations"
        else:
            citation_score = len(verified) / total_cited
            if citation_score >= 0.8:
                badge = f"✅ Verified ({len(verified)}/{total_cited} sources)"
            elif citation_score >= 0.5:
                badge = f"⚠️ Partially verified ({len(verified)}/{total_cited} sources)"
            else:
                badge = f"❌ Unverified ({len(unverified)} ungrounded claims)"

        return {
            "citation_score": round(citation_score, 2),
            "verified": verified,
            "unverified": unverified,
            "uncited_available": uncited,
            "badge": badge,
            "total_retrieved": len(retrieved_chunks),
        }

    def inject_chunk_ids_into_prompt(self, base_prompt: str, chunks: List[Dict]) -> str:
        """
        Appends citation instruction to Groq prompt.
        Tells Groq to use [section_ref] format when citing chunks.
        """
        if not chunks:
            return base_prompt
        
        ids = [c.get("section_ref", "UNKNOWN") for c in chunks]
        instruction = (
            f"\n\nCITATION RULE: When citing a retrieved statute, use the exact ID in square brackets: "
            f"{', '.join('[' + i + ']' for i in ids[:5])}. "
            f"Only cite from the RETRIEVED LEGAL STATUTES above. Do not invent section numbers."
        )
        return base_prompt + instruction
