import groq
import json
from app.core.config import settings
try:
    from deep_translator import GoogleTranslator as _GT
    _DEEP_TRANSLATOR_OK = True
except Exception:
    _DEEP_TRANSLATOR_OK = False

# Language names for prompting Groq to respond in target lang
LANG_NAMES = {
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "bn": "Bengali",
    "en": "English",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
    "or": "Odia",
    "as": "Assamese",
    "tu": "Tulu",
    "kk": "Konkani",
}

class GroqService:
    def __init__(self):
        self.client = groq.Groq(api_key=settings.GROQ_API_KEY)
        # Fast+high-RPD model for simple extraction tasks
        self.fast_model = "llama-3.1-8b-instant"
        # Best reasoning + multilingual for full legal synthesis
        self.synthesis_model = "llama-3.3-70b-versatile"

    async def extract_legal_keys(self, text: str) -> list:
        system_prompt = """
You are a Legal Concept Extractor for Indian Law (BNS/BNSS). 
Your task is to identify ONLY the most critical legal keys for a given situation.

STRICT RULES:
1. OUTPUT LIMIT: Extract a maximum of 5 keys.
2. NO EXHAUSTIVE LISTS: Do not list every possible section number.
3. FORMAT: Output ONLY a comma-separated list. No preamble, no explanation.
4. PRIORITIZATION: Prioritize broad legal concepts (e.g., "Warrantless Arrest") over specific section numbers unless the section is 100% certain.
5. NO HALLUCINATION: If the situation is vague, provide fewer than 5 keys.

Example:
Input: "Neighbor arrested for petty theft without warrant."
Output: Warrantless Arrest, BNS Section 303, Right to be informed, Petty Theft, BNSS Section 35
"""
        try:
            completion = self.client.chat.completions.create(
                model=self.fast_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.1,
            )
            content = completion.choices[0].message.content
            keys = content.strip().split(",")
            return [k.strip() for k in keys if len(k) < 50][:7]
        except Exception as e:
            print(f"Groq Error: {e}")
            return []

    async def synthesize_buddy_response(
        self,
        english_text: str,
        legal_keys: list,
        web_context: str,
        target_lang: str = "hi",
        specialist_opinion: str = "",
        rag_context: str = "",
        conversation_history: list = [],
        doc_context: str = "",
    ) -> dict:
        """
        Core buddy synthesis. Returns structured JSON with situation summary,
        rights, action steps, awareness, and a full buddy_text for TTS.
        ALL text fields are in target_lang.
        """
        lang_name = LANG_NAMES.get(target_lang, "Hindi")
        keys_str = ", ".join(legal_keys) if legal_keys else "general legal situation"
        web_ctx_short = web_context[:600] if web_context else "No additional context."
        
        # Build grounding blocks — RAG chunks are highest authority
        rag_block = ""
        if rag_context and rag_context.strip():
            rag_block = f"\n\n{rag_context[:1200]}"  # statute chunks with [section_ref] IDs

        specialist_block = ""
        if specialist_opinion and "unavailable" not in specialist_opinion.lower() and len(specialist_opinion) > 30:
            specialist_block = f"\n\nGGUF SPECIALIST (BNS/BNSS trained):\n{specialist_opinion[:600]}"

        doc_block = ""
        if doc_context and doc_context.strip():
            doc_block = f"\n\nUSER'S UPLOADED DOCUMENTS:\n{doc_context[:1000]}"

        system_prompt = f"""You are "Legal Sarathi", a friendly legal buddy helping ordinary Indian citizens understand their rights.
You speak like a trusted friend, not a lawyer. You are warm, clear, and empowering.

TASK: Analyze the user's situation and respond ENTIRELY in {lang_name}.

LEGAL GROUNDING (priority order — use 1 first, then 2, etc.):
1. RETRIEVED STATUTES (most authoritative):{rag_block}
2. GGUF SPECIALIST:{specialist_block}{doc_block}
3. Web context: {web_ctx_short}

CRITICAL CITATION RULE: When citing a retrieved statute, write its exact [section_ref] ID (e.g. [BNSS_50], [CONST_22], [IPC_498A]). This enables source verification. Never cite section numbers you have not seen in the retrieved statutes above.

RESPOND WITH VALID JSON ONLY. No markdown, no explanation outside JSON:
{{
  "situation_summary": "2 sentences: what happened, in simple {lang_name}",
  "severity_level": "one of: INFO | CAUTION | DANGER",
  "rights": ["right 1 citing BNS/BNSS section in {lang_name}", "right 2 in {lang_name}", "right 3 in {lang_name}"],
  "action_steps": ["step 1 with specific helpline in {lang_name}", "step 2 in {lang_name}", "step 3 in {lang_name}"],
  "do_not_do": ["critical thing to NOT do in {lang_name}", "another thing to avoid"],
  "evidence_required": ["doc/item to collect right now in {lang_name}", "another item"],
  "jurisdiction_note": "1 sentence: state vs central law note in {lang_name} if relevant, else empty string",
  "awareness": "1 empowering paragraph in {lang_name} about this law most people don't know",
  "buddy_text": "Warm 4-5 sentence response in {lang_name}: situation + key right (cite BNS/BNSS section) + main step + encouragement. This will be spoken aloud.",
  "help_channels": [
    {{"name": "NALSA", "phone": "15100", "url": "https://nalsa.gov.in", "label_in_lang": "राष्ट्रीय विधिक सेवाएं"}}
  ]
}}

RULES:
- ALL text values MUST be in {lang_name}
- severity_level: DANGER if arrest/violence/immediate rights violation, CAUTION if dispute/non-payment, INFO if general query
- buddy_text must sound like a real friend talking, not a government notice
- cite actual BNS/BNSS sections from specialist analysis in rights[]
- action_steps must name specific helplines (NALSA 15100, Women 1091, Police 100)
- do_not_do must have 2-3 concrete negative constraints (e.g., don't sign blank papers)
- evidence_required must list physical docs to gather immediately"""

        try:
            # Build multi-turn messages: system + prior conversation + current query
            messages = [{"role": "system", "content": system_prompt}]
            for turn in conversation_history[-6:]:  # last 6 turns max
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ("user", "assistant") and content:
                    # Truncate long prior turns to keep context window manageable
                    messages.append({"role": role, "content": content[:400]})
            messages.append({"role": "user", "content": f"Situation: {english_text}"})

            completion = self.client.chat.completions.create(
                model=self.synthesis_model,
                messages=messages,
                temperature=0.3,
                max_tokens=2000,
            )
            content = completion.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content)

            # ── Post-synthesis language guarantee ─────────────────────────────
            # If target is not English and deep_translator is available,
            # re-translate key text fields that might have drifted to English.
            if target_lang not in ("en", "en-IN") and _DEEP_TRANSLATOR_OK:
                result = self._ensure_target_lang(result, target_lang)

            return result
        except json.JSONDecodeError as e:
            print(f"Groq JSON parse error: {e}")
            return self._fallback_response(target_lang)
        except Exception as e:
            print(f"Groq Buddy Synthesis Error: {e}")
            return self._fallback_response(target_lang)

    # ── Language guarantee helper ─────────────────────────────────────────────
    # Maps 2-letter codes to deep_translator / Google Translate language codes
    _LANG_MAP = {
        "hi": "hi", "ta": "ta", "te": "te", "mr": "mr",
        "bn": "bn", "gu": "gu", "kn": "kn", "ml": "ml",
        "pa": "pa", "ur": "ur", "or": "or", "as": "as",
        "tu": "kn", "kk": "mr",
    }

    def _translate_field(self, text: str, target_lang: str) -> str:
        """Translate a single string to target_lang via deep_translator."""
        if not text or not isinstance(text, str):
            return text
        tgt = self._LANG_MAP.get(target_lang, "hi")
        try:
            return _GT(source="auto", target=tgt).translate(text)
        except Exception as e:
            print(f"[Lang fix] deep_translator error: {e}")
            return text

    def _translate_list(self, items: list, target_lang: str) -> list:
        return [self._translate_field(i, target_lang) for i in items]

    def _ensure_target_lang(self, data: dict, target_lang: str) -> dict:
        """
        Heuristic: if buddy_text is mostly ASCII (likely English),
        re-translate all text fields to target_lang.
        """
        buddy = data.get("buddy_text", "")
        
        # Explicit language detection
        try:
            from langdetect import detect
            detected = detect(buddy)
            # If explicit detection says it's not English, assume it followed instructions.
            # (Note: langdetect codes might not exactly match target_lang, so we just ensure it's not 'en')
            if detected != "en":
                print(f"[Lang fix] buddy_text detected as '{detected}' (not en), skip re-translate")
                return data
        except Exception as e:
            print(f"[Lang fix] langdetect failed: {e}")

        # Fallback to character set ratio if langdetect fails or says 'en'
        # Count non-ASCII chars — Indic scripts are all non-ASCII
        non_ascii = sum(1 for c in buddy if ord(c) > 127)
        ratio = non_ascii / max(len(buddy), 1)
        if ratio > 0.40:
            # Already in Indic script — looks correct
            print(f"[Lang fix] buddy_text looks native ({ratio:.0%} non-ASCII), skip re-translate")
            return data

        print(f"[Lang fix] buddy_text is {ratio:.0%} non-ASCII → re-translating to '{target_lang}'")
        str_fields = ["situation_summary", "jurisdiction_note", "awareness", "buddy_text"]
        list_fields = ["rights", "action_steps", "do_not_do", "evidence_required"]
        for f in str_fields:
            if data.get(f):
                data[f] = self._translate_field(data[f], target_lang)
        for f in list_fields:
            if data.get(f):
                data[f] = self._translate_list(data[f], target_lang)
        return data

    def _fallback_response(self, lang: str) -> dict:
        fallbacks = {
            "hi": {
                "situation_summary": "आपकी स्थिति की जानकारी मिली।",
                "rights": ["आपको कानूनी सहायता का अधिकार है", "आप निःशुल्क वकील मांग सकते हैं", "आपको सूचित किए जाने का अधिकार है"],
                "action_steps": ["NALSA हेल्पलाइन 15100 पर कॉल करें", "स्थानीय जिला विधिक सेवा प्राधिकरण से संपर्क करें", "परिवार को सूचित करें"],
                "awareness": "भारत में हर नागरिक को निःशुल्क कानूनी सहायता का अधिकार है।",
                "buddy_text": "घबराइए नहीं। आपके पास कानूनी अधिकार हैं। NALSA की हेल्पलाइन 15100 पर अभी कॉल करें।",
                "help_channels": [{"name": "NALSA", "phone": "15100", "url": "https://nalsa.gov.in", "label_in_lang": "राष्ट्रीय कानूनी सेवाएं"}]
            },
            "en": {
                "situation_summary": "Your situation has been noted.",
                "rights": ["You have the right to free legal aid", "You can demand a lawyer", "You have the right to be informed"],
                "action_steps": ["Call NALSA helpline 15100", "Contact your District Legal Services Authority", "Inform your family"],
                "awareness": "Every Indian citizen has the right to free legal aid under the Legal Services Authorities Act.",
                "buddy_text": "Don't worry. You have legal rights. Call NALSA at 15100 right now for free help.",
                "help_channels": [{"name": "NALSA", "phone": "15100", "url": "https://nalsa.gov.in", "label_in_lang": "National Legal Services"}]
            }
        }
        return fallbacks.get(lang, fallbacks["en"])

    # ── Document Chat ─────────────────────────────────────────────────────────

    # Mode-specific instructions for document chat
    _DOC_MODE_PROMPTS = {
        "summary":        "Provide a structured summary: document type, parties involved, key dates, obligations, and the user's rights.",
        "qa":             "Answer the user's question using ONLY the provided document text. If the answer is not found in the document, explicitly say so.",
        "clause_extract": "List all clauses that affect the user's rights or obligations. Be specific and quote the exact clause text.",
        "translate":      "Translate the full document content preserving legal meaning. Do not add commentary.",
        "draft_reply":    "Draft a formal legal reply based on the document content and the user's described intent.",
    }

    async def doc_chat_response(
        self,
        doc_context: str,
        message: str,
        mode: str,
        history: str,
        target_lang: str,
    ) -> str:
        """
        Generate a document-specific AI response.
        Bypasses RAG — the extracted document text is the sole context.
        """
        lang_name = LANG_NAMES.get(target_lang, "English")
        mode_instruction = self._DOC_MODE_PROMPTS.get(mode, self._DOC_MODE_PROMPTS["qa"])

        system_prompt = f"""You are a legal document assistant for Indian law. You have been given a document.

Task: {mode_instruction}

RULES:
- Base your response ONLY on the provided document
- Respond in {lang_name}
- Be precise and helpful to a layperson
- If translating: translate only, do not add commentary
- If the document is unclear or irrelevant to the question, say so honestly"""

        user_content = (
            f"DOCUMENT:\n{doc_context}\n\n"
            f"CONVERSATION HISTORY:\n{history}\n\n"
            f"USER: {message}"
        )

        try:
            completion = self.client.chat.completions.create(
                model=self.synthesis_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_content},
                ],
                temperature=0.2,
                max_tokens=1500,
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"[GroqService] doc_chat_response error: {e}")
            return f"I was unable to process the document at this time. Please try again. (Error: {e})"

