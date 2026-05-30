import os
import httpx
from app.core.config import settings

class SpecialistService:
    def __init__(self):
        # The URL where the legal-llama-1b.gguf Docker container is hosted.
        # e.g., RunPod Endpoint or Hugging Face Space URL
        self.api_url = os.environ.get("GGUF_API_URL", "http://localhost:8001/v1/completions")
        print(f"[GGUF] Service initialized pointing to {self.api_url}")

    async def generate_guidance(self, query: str, keys: list, web_context: str = "") -> str:
        """
        Extract BNS/BNSS sections by calling the external GGUF Cloud API.
        This offloads local CPU and makes the request asynchronous.
        """
        keys_str = ", ".join(keys) if keys else "warrantless arrest"

        prompt = (
            f"Indian Legal Analysis - BNS 2023 / BNSS 2023 / IPC / CrPC / Constitution\n"
            f"Query: {query}\n"
            f"Legal concepts: {keys_str}\n\n"
            f"Applicable Indian Law Sections:\n"
            f"SECTIONS:"
        )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    json={
                        "prompt": prompt,
                        "max_tokens": 350,
                        "stop": ["\n\n\n", "Query:", "---", "==="],
                        "temperature": 0.1,
                        "repeat_penalty": 1.1
                    },
                    timeout=10.0  # Failsafe timeout
                )
                
                if response.status_code != 200:
                    print(f"[GGUF API] Error {response.status_code}: {response.text}")
                    return ""

                data = response.json()
                raw = data["choices"][0]["text"].strip()
                
            text = "SECTIONS:" + raw if raw else ""
            print(f"[GGUF API] Output ({len(text)} chars): {repr(text[:200])}")

            # Reject if loops prompt or cites non-Indian law
            bad_patterns = ["Florida", "California", "U.S.C.", "Federal Rule",
                            "निम्नलिखित प्रदान करें", "section numbers अनिवार्य"]
            if any(p in text for p in bad_patterns):
                return ""

            import re
            if not re.search(r'\d+', text):
                return ""

            return text if len(text) > 15 else ""
        except Exception as e:
            print(f"[GGUF API] Connection Error: {e}")
            return ""
