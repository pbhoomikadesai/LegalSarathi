import os
# Unset Hugging Face internal proxies that block external API requests (like Groq)
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    LOCAL_MODEL_PATH: str = os.getenv("LOCAL_MODEL_PATH", "backend/data/models/legal-llama-1b.gguf")
    
settings = Settings()
if not settings.GROQ_API_KEY:
    import logging
    logging.warning("GROQ_API_KEY is empty! GroqService will fail on instantiation or queries.")
