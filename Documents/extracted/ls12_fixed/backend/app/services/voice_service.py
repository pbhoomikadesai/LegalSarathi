"""
Voice Service — Groq Whisper STT + edge-tts (Microsoft Neural)

STT: Groq Whisper API (whisper-large-v3-turbo)
TTS: edge-tts — Microsoft Edge Neural voices
  - Free, no API key, async streaming
  - Natural prosody (not robotic)
  - Supports 13 Indian languages via Neural voices
"""

import io
import asyncio
import tempfile
import edge_tts
import groq as groq_sdk
from app.core.config import settings

# Map of 2-letter lang codes to ISO-639-1 for Whisper language hint
LANG_TO_WHISPER = {
    "hi": "hi", "ta": "ta", "te": "te", "mr": "mr",
    "bn": "bn", "en": "en", "gu": "gu", "kn": "kn",
    "ml": "ml", "pa": "pa",
}

# Microsoft Neural voices per language — chosen for naturalness
# Full list: https://learn.microsoft.com/azure/ai-services/speech-service/language-support
EDGE_TTS_VOICES = {
    "hi": "hi-IN-SwaraNeural",      # Hindi — natural female
    "ta": "ta-IN-PallaviNeural",    # Tamil — female
    "te": "te-IN-ShrutiNeural",     # Telugu — female
    "mr": "mr-IN-AarohiNeural",     # Marathi — female
    "bn": "bn-IN-TanishaaNeural",   # Bengali — female
    "en": "en-IN-NeerjaNeural",     # English (Indian accent)
    "gu": "gu-IN-DhwaniNeural",     # Gujarati — female
    "kn": "kn-IN-SapnaNeural",      # Kannada — female
    "ml": "ml-IN-SobhanaNeural",    # Malayalam — female
    "pa": "pa-IN-OjaswineNeural",   # Punjabi — female
}

# Domain-specific legal vocabulary prompt per language
LEGAL_PROMPTS = {
    "en": (
        "This is an Indian legal query. Common terms: FIR, IPC, BNSS, BNS, Section, "
        "Article, Bail, Warrant, Arrest, High Court, Supreme Court, RTI, NALSA, "
        "Advocate, Magistrate, Summons, Chargesheet, Cognizable, Non-cognizable."
    ),
    "hi": (
        "यह एक भारतीय कानूनी प्रश्न है। सामान्य शब्द: FIR, धारा, जमानत, वारंट, गिरफ्तारी, "
        "उच्च न्यायालय, सर्वोच्च न्यायालय, RTI, वकील, मजिस्ट्रेट, चालान, संज्ञेय।"
    ),
    "ta": (
        "இது ஒரு இந்திய சட்ட கேள்வி. பொதுவான சொற்கள்: FIR, பிரிவு, ஜாமீன், வாரண்ட், "
        "கைது, உயர் நீதிமன்றம், RTI, வழக்கறிஞர்."
    ),
    "te": (
        "ఇది ఒక భారతీయ న్యాయ ప్రశ్న. సాధారణ పదాలు: FIR, సెక్షన్, బెయిల్, వారెంట్, "
        "అరెస్టు, హైకోర్టు, RTI, న్యాయవాది."
    ),
    "kn": (
        "ಇದು ಒಂದು ಭಾರತೀಯ ಕಾನೂನು ಪ್ರಶ್ನೆ. ಸಾಮಾನ್ಯ ಪದಗಳು: FIR, ಸೆಕ್ಷನ್, ಜಾಮೀನು, "
        "ವಾರೆಂಟ್, ಬಂಧನ, ಹೈಕೋರ್ಟ್, RTI, ವಕೀಲ."
    ),
    "mr": (
        "हा एक भारतीय कायदेशीर प्रश्न आहे. सामान्य शब्द: FIR, कलम, जामीन, वॉरंट, "
        "अटक, उच्च न्यायालय, RTI, वकील."
    ),
}


class VoiceService:
    def __init__(self):
        self._groq = groq_sdk.Groq(api_key=settings.GROQ_API_KEY)

    def transcribe(self, audio_bytes: bytes, lang: str = "hi") -> str:
        """STT: audio bytes (WebM/Opus/OGG/WAV) → text via Groq Whisper."""
        lang_code = lang.split("-")[0].lower()
        whisper_lang = LANG_TO_WHISPER.get(lang_code, "hi")
        initial_prompt = LEGAL_PROMPTS.get(lang_code, LEGAL_PROMPTS["en"])
        audio_file = ("audio.webm", io.BytesIO(audio_bytes), "audio/webm")
        try:
            response = self._groq.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=audio_file,
                language=whisper_lang,
                prompt=initial_prompt,
                temperature=0.0,
                response_format="verbose_json",
            )
            text = (response.text or "").strip()
            detected = getattr(response, "language", whisper_lang)
            print(f"[STT] Whisper transcribed ({lang_code}, detected={detected}): '{text[:120]}'")
            return text
        except Exception as e:
            print(f"[STT] Groq Whisper error: {e}")
            return ""

    async def synthesize(self, text: str, lang: str = "hi") -> str:
        """TTS: text → mp3 path via edge-tts (Microsoft Neural voices)."""
        lang_code = lang.split("-")[0].lower()
        voice = EDGE_TTS_VOICES.get(lang_code, "hi-IN-SwaraNeural")

        tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False, prefix="sarathi_tts_")
        tmp.close()

        communicate = edge_tts.Communicate(text=text, voice=voice, rate="+5%", pitch="+0Hz")
        await communicate.save(tmp.name)

        print(f"[TTS] edge-tts voice={voice}, chars={len(text)}, saved={tmp.name}")
        return tmp.name
