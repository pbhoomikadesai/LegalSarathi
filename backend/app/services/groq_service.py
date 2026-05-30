import groq
import json
import re
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

import httpx

class GroqService:
    def __init__(self):
        # Fast+high-RPD model for simple extraction tasks
        self.fast_model = "llama-3.1-8b-instant"
        # Best reasoning + multilingual for full legal synthesis
        self.synthesis_model = "llama-3.3-70b-versatile"

        import os
        proxy_vars = {k: v for k, v in os.environ.items() if "proxy" in k.lower()}
        print(f"[GroqService] Proxy environment variables: {proxy_vars}")

        api_key = settings.GROQ_API_KEY
        if not api_key:
            print("[GroqService] Warning: GROQ_API_KEY is not configured!")
            self.client = None
            return

        # Define different HTTP configurations to try
        configs = [
            {
                "name": "Method 1: Proxy-aware (Default)",
                "client": lambda: groq.Groq(api_key=api_key)
            },
            {
                "name": "Method 2: Proxy-aware with verify=False (Bypass TLS inspection issues)",
                "client": lambda: groq.Groq(api_key=api_key, http_client=httpx.Client(verify=False))
            },
            {
                "name": "Method 3: Direct connection (Bypass proxy)",
                "client": lambda: groq.Groq(api_key=api_key, http_client=httpx.Client(trust_env=False))
            },
            {
                "name": "Method 4: Direct connection with verify=False (Bypass proxy & TLS validation)",
                "client": lambda: groq.Groq(api_key=api_key, http_client=httpx.Client(trust_env=False, verify=False))
            }
        ]

        self.client = None
        for config in configs:
            print(f"[GroqService] Testing connection using {config['name']}...")
            try:
                test_client = config["client"]()
                # Run a very minimal 1-token query to verify connectivity
                test_client.chat.completions.create(
                    model=self.fast_model,
                    messages=[{"role": "user", "content": "ping"}],
                    max_tokens=1
                )
                print(f"[GroqService] Success! Connection established using {config['name']}")
                self.client = test_client
                break
            except Exception as e:
                import traceback
                print(f"[GroqService] {config['name']} failed.")
                traceback.print_exc()
                err_msg = str(e).lower()
                is_auth_error = "auth" in err_msg or "unauthorized" in err_msg or "api key" in err_msg or "401" in err_msg
                if is_auth_error:
                    print("[GroqService] Authentication failure detected (likely invalid API key). Continuing with default client.")
                    self.client = config["client"]()
                    break

        if not self.client:
            print("[GroqService] WARNING: All connection strategies failed! Defaulting to Method 1 to avoid crash.")
            self.client = configs[0]["client"]()

    def _create_completion(self, model: str, messages: list, temperature: float = 0.3, max_tokens: int = 2000, response_format: dict = None):
        """Helper to create chat completions with automatic fallback for rate limits or server errors."""
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            kwargs["response_format"] = response_format
        try:
            return self.client.chat.completions.create(**kwargs)
        except Exception as e:
            is_rate_limit = "429" in str(e) or "rate_limit" in str(e).lower() or "rate limit" in str(e).lower()
            if is_rate_limit:
                fallback_model = "llama-3.1-8b-instant" if model != "llama-3.1-8b-instant" else "llama3-8b-8192"
                print(f"[GroqService] Rate limit (429) hit for {model}. Falling back to {fallback_model}...")
                kwargs["model"] = fallback_model
                try:
                    return self.client.chat.completions.create(**kwargs)
                except Exception as e2:
                    print(f"[GroqService] Fallback to {fallback_model} also failed: {e2}")
                    raise e
            else:
                # Try fallback for other server issues as well
                fallback_model = "llama-3.1-8b-instant" if model != "llama-3.1-8b-instant" else "llama3-8b-8192"
                print(f"[GroqService] API Error with {model}: {e}. Trying fallback model {fallback_model}...")
                kwargs["model"] = fallback_model
                try:
                    return self.client.chat.completions.create(**kwargs)
                except Exception:
                    raise e

    def repair_json_string(self, json_str: str) -> str:
        """Helper to fix common JSON formatting errors such as unescaped inner quotes, trailing commas, and truncated structures."""
        # 1. Clean leading/trailing spaces
        json_str = json_str.strip()
        
        # 2. Check if the JSON is truncated (doesn't end with } or ])
        if not json_str.endswith('}') and not json_str.endswith(']'):
            in_string = False
            escaped = False
            braces_stack = []
            
            repaired_chars = []
            for char in json_str:
                repaired_chars.append(char)
                if char == '\\' and not escaped:
                    escaped = True
                    continue
                
                if char == '"' and not escaped:
                    in_string = not in_string
                
                if not in_string:
                    if char == '{':
                        braces_stack.append('}')
                    elif char == '[':
                        braces_stack.append(']')
                    elif char == '}':
                        if braces_stack and braces_stack[-1] == '}':
                            braces_stack.pop()
                    elif char == ']':
                        if braces_stack and braces_stack[-1] == ']':
                            braces_stack.pop()
                            
                escaped = False
                
            repaired_str = "".join(repaired_chars)
            if in_string:
                repaired_str += '"'
            while braces_stack:
                closing = braces_stack.pop()
                repaired_str += closing
                
            json_str = repaired_str

        # Remove trailing commas before closing braces/brackets
        json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
        
        lines = json_str.splitlines()
        repaired_lines = []
        
        field_pattern = re.compile(r'^(\s*"[a-zA-Z0-9_]+")\s*:\s*"(.*)"\s*(,?)\s*$')
        
        for line in lines:
            m = field_pattern.match(line)
            if m:
                key_part = m.group(1)
                val_part = m.group(2)
                comma_part = m.group(3)
                # Escape double quotes that are not already escaped
                escaped_val = re.sub(r'(?<!\\)"', r'\"', val_part)
                repaired_lines.append(f'{key_part}: "{escaped_val}"{comma_part}')
                continue
                
            if ":" not in line and (line.strip().startswith('"') or line.strip().startswith('["') or line.strip().endswith('"]') or line.strip().endswith('"') or line.strip().endswith('",')):
                stripped = line.strip()
                indent = line[:len(line) - len(line.lstrip())]
                
                start_bracket = ""
                end_bracket = ""
                content = stripped
                
                if content.startswith('['):
                    start_bracket = "["
                    content = content[1:].lstrip()
                if content.endswith(']'):
                    end_bracket = "]"
                    content = content[:-1].rstrip()
                elif content.endswith('],'):
                    end_bracket = "],"
                    content = content[:-2].rstrip()
                    
                has_comma = False
                if content.endswith(','):
                    has_comma = True
                    content = content[:-1].rstrip()
                    
                if content.startswith('"') and content.endswith('"'):
                    inner_text = content[1:-1]
                    escaped_inner = re.sub(r'(?<!\\)"', r'\"', inner_text)
                    comma_str = "," if has_comma else ""
                    repaired_lines.append(f'{indent}{start_bracket}"{escaped_inner}"{end_bracket}{comma_str}')
                    continue

            repaired_lines.append(line)
            
        return "\n".join(repaired_lines)

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
            completion = self._create_completion(
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
        Synthesizes in English to optimize token budget and ensure solid reasoning,
        then dynamically translates all text fields to the target_lang in the backend.
        """
        # Normalize target language code (e.g., 'hi-IN' -> 'hi')
        target_lang = target_lang.split("-")[0].split("_")[0].lower() if target_lang else "hi"

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

        # Force English synthesis for token efficiency, rate-limit safety, and high-fidelity output.
        system_prompt = f"""You are "Legal Sarathi", a friendly legal buddy helping ordinary Indian citizens understand their rights.
You speak like a trusted friend, not a lawyer. You are warm, clear, and empowering.

TASK: Analyze the user's situation and respond ENTIRELY in English.

LEGAL GROUNDING (priority order — use 1 first, then 2, etc.):
1. RETRIEVED STATUTES (most authoritative):{rag_block}
2. GGUF SPECIALIST:{specialist_block}{doc_block}
3. Web context: {web_ctx_short}

CRITICAL CITATION RULE: When citing a retrieved statute, write its exact [section_ref] ID (e.g. [BNSS_50], [CONST_22], [IPC_498A]). This enables source verification. Never cite section numbers you have not seen in the retrieved statutes above.

RESPOND WITH VALID JSON ONLY. No markdown, no explanation outside JSON:
{{
  "situation_summary": "2 sentences: what happened, in simple English",
  "severity_level": "one of: INFO | CAUTION | DANGER",
  "rights": ["right 1 citing BNS/BNSS section in English", "right 2 in English", "right 3 in English"],
  "action_steps": ["step 1 with specific helpline in English", "step 2 in English", "step 3 in English"],
  "do_not_do": ["critical thing to NOT do in English", "another thing to avoid"],
  "evidence_required": ["doc/item to collect right now in English", "another item"],
  "jurisdiction_note": "1 sentence: state vs central law note in English if relevant, else empty string",
  "awareness": "1 empowering paragraph in English about this law most people don't know",
  "buddy_text": "Warm 4-5 sentence response in English: situation + key right (cite BNS/BNSS section) + main step + encouragement. This will be spoken aloud.",
  "help_channels": [
    {{"name": "NALSA", "phone": "15100", "url": "https://nalsa.gov.in", "label_in_lang": "National Legal Services"}}
  ]
}}

RULES:
- ALL text values MUST be in English
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

            completion = self._create_completion(
                model=self.synthesis_model,
                messages=messages,
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            content = completion.choices[0].message.content.strip()
            # Extract JSON block between first { and last }
            first_brace = content.find("{")
            last_brace = content.rfind("}")
            if first_brace != -1 and last_brace != -1:
                content = content[first_brace:last_brace + 1]
            
            try:
                result = json.loads(content)
            except json.JSONDecodeError as jde:
                print(f"Groq JSON parse error: {jde}. Attempting repair...")
                try:
                    repaired_content = self.repair_json_string(content)
                    result = json.loads(repaired_content)
                    print("JSON repaired and parsed successfully.")
                except Exception as repair_err:
                    print(f"JSON repair failed: {repair_err}")
                    raise jde

            # ── Post-synthesis language guarantee ─────────────────────────────
            # If target is not English and deep_translator is available,
            # translate key text fields and custom helpline labels to the target_lang.
            if target_lang not in ("en", "en-IN") and _DEEP_TRANSLATOR_OK:
                result = self._ensure_target_lang(result, target_lang, force=True)

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

    def _ensure_target_lang(self, data: dict, target_lang: str, force: bool = False) -> dict:
        """
        Ensure all user-facing text fields in the dictionary are in the target language.
        If force=True, bypass language detection and force re-translation.
        """
        buddy = data.get("buddy_text", "")
        
        if not force:
            # Explicit language detection
            try:
                from langdetect import detect
                detected = detect(buddy)
                if detected != "en":
                    try:
                        print(f"[Lang fix] buddy_text detected as '{detected}' (not en), skip re-translate")
                    except Exception:
                        pass
                    return data
            except Exception as e:
                try:
                    print(f"[Lang fix] langdetect failed: {e}")
                except Exception:
                    pass

            # Fallback to character set ratio if langdetect fails or says 'en'
            non_ascii = sum(1 for c in buddy if ord(c) > 127)
            ratio = non_ascii / max(len(buddy), 1)
            if ratio > 0.40:
                try:
                    print(f"[Lang fix] buddy_text looks native ({ratio:.0%} non-ASCII), skip re-translate")
                except Exception:
                    pass
                return data

        try:
            print(f"[Lang fix] Translating fields to '{target_lang}' (force={force})")
        except Exception:
            pass
            
        str_fields = ["situation_summary", "jurisdiction_note", "awareness", "buddy_text"]
        list_fields = ["rights", "action_steps", "do_not_do", "evidence_required"]
        
        for f in str_fields:
            if data.get(f):
                data[f] = self._translate_field(data[f], target_lang)
        for f in list_fields:
            if data.get(f):
                data[f] = self._translate_list(data[f], target_lang)
                
        # Also translate help_channels label_in_lang
        channels = data.get("help_channels", [])
        if channels:
            for ch in channels:
                if isinstance(ch, dict) and "label_in_lang" in ch:
                    ch["label_in_lang"] = self._translate_field(ch["label_in_lang"], target_lang)
                    
        return data

    def _fallback_response(self, lang: str) -> dict:
        # Normalize language code (e.g., 'hi-IN' -> 'hi')
        lang = lang.split("-")[0].split("_")[0].lower() if lang else "hi"

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
        base_resp = fallbacks.get(lang)
        if base_resp:
            return base_resp
        
        # Dynamically translate English fallback to target lang
        en_resp = fallbacks["en"]
        if not _DEEP_TRANSLATOR_OK:
            return en_resp
        
        try:
            import copy
            res = copy.deepcopy(en_resp)
            res = self._ensure_target_lang(res, lang, force=True)
            return res
        except Exception as e:
            print(f"[Fallback Translate] Failed to translate fallback response: {e}")
            return en_resp

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
        # Normalize target language code (e.g., 'hi-IN' -> 'hi')
        target_lang = target_lang.split("-")[0].split("_")[0].lower() if target_lang else "en"

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
            completion = self._create_completion(
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

