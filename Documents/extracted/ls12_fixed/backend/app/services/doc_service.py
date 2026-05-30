"""
Document Generation Service
Uses Groq LLM to fill markdown templates for legal documents based on the user's situation.
"""

from app.services.groq_service import GroqService

class DocService:
    def __init__(self):
        self.groq_service = GroqService()

    async def generate_document(self, query: str, doc_type: str, lang: str = "en") -> str:
        """
        Generates a document of `doc_type` (e.g. 'RTI', 'FIR', 'BAIL')
        based on the user's situation `query`.
        """
        templates = {
            "RTI": "A formal Right to Information (RTI) application addressed to the Public Information Officer (PIO) asking specific questions about the following situation: {query}. Keep it professional, include placeholders like [Your Name], [PIO Department], etc.",
            "FIR": "A formal First Information Report (FIR) complaint draft addressed to the Station House Officer (SHO) of the local police station detailing this incident: {query}. Include placeholders like [Your Name], [Date], [Location]. Cite relevant BNS 2023 sections if possible.",
            "BAIL": "A formal Bail Application draft to be filed before the Magistrate court for this situation: {query}. Include standard bail conditions and placeholders like [Name of Accused], [FIR Number], etc."
        }

        prompt_intent = templates.get(doc_type.upper(), templates["RTI"])
        
        system_prompt = f"""You are an expert Indian Legal Draftsman.
Generate a well-formatted legal document draft.
Language: {lang}
Task: {prompt_intent}
Use simple but formal language. Only output the plain text document, no conversational text, no markdown symbols (like #, **, *). Use standard spacing and line breaks."""

        try:
            completion = self.groq_service.client.chat.completions.create(
                model=self.groq_service.synthesis_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Situation: {query}"}
                ],
                temperature=0.2,
                max_tokens=1500,
            )
            return completion.choices[0].message.content or ""
        except Exception as e:
            print(f"[DOC] Generation error: {e}")
            return f"Error generating document: {e}"
