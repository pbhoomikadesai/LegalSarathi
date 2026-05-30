import os
from app.core.config import settings

class FastTranslator:
    def __init__(self):
        from deep_translator import GoogleTranslator
        self.GoogleTranslator = GoogleTranslator
        
    def translate(self, text: str, source_lang: str, target_lang: str = "en") -> str:
        if source_lang.lower() == target_lang.lower():
            return text
        try:
            return self.GoogleTranslator(source=source_lang.lower(), target=target_lang.lower()).translate(text)
        except Exception as e:
            print(f"FastTranslator Error: {e}")
            return text

class LocalTranslator:
    def __init__(self):
        # Lazy load heavy dependencies
        try:
            import ctranslate2
            import transformers
            from IndicTransToolkit import IndicProcessor
            
            # TODO: Specify exact paths or huggingface repo for IndicTrans2 int8 model
            model_name = "data/models/indictrans2-200m-int8"
            self.processor = IndicProcessor(inference=True)
            self.tokenizer = transformers.AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            
            # Fallback to standard transformers since ctranslate2 doesn't support IndicTransConfig natively
            import torch
            from transformers import AutoModelForSeq2SeqLM
            
            print("Loading IndicTrans2 Model (Transformers) into memory...")
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                model_name, 
                trust_remote_code=True,
                torch_dtype=torch.float32,
                low_cpu_mem_usage=True
            )
            # Use torch.set_num_threads to limit CPU cores
            torch.set_num_threads(2)
        except ImportError as e:
            print(f"LocalTranslator Init Error: {e}")
            self.model = None

    def translate(self, text: str, source_lang: str, target_lang: str = "en") -> str:
        if source_lang.lower() == target_lang.lower() or not self.model:
            return text
        if target_lang.lower() != "en":
            print("Warning: LocalTranslator only supports indic-to-en right now. Falling back to original text.")
            return text
        try:
            import torch
            # IndicTransToolkit preprocessing
            sentences = [text]
            # Map standard ISO to IndicTrans2 format
            src_mapped = "hin_Deva" if source_lang.lower() == "hi" else source_lang
            tgt_mapped = "eng_Latn"
            
            batch = self.processor.preprocess_batch(sentences, src_lang=src_mapped, tgt_lang=tgt_mapped)
            source = self.tokenizer(batch, return_tensors="pt")
            
            # Transformers generation
            with torch.no_grad():
                outputs = self.model.generate(
                    **source,
                    max_new_tokens=256,
                    num_beams=1,
                    use_cache=False,
                )
            
            target_sentences = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
            return self.processor.postprocess_batch(target_sentences, lang=tgt_mapped)[0]
        except Exception as e:
            print(f"LocalTranslator Error: {e}")
            return text

class TranslatorService:
    def __init__(self):
        self.backend_type = os.getenv("TRANSLATION_BACKEND", "fast").lower()
        if self.backend_type == "local":
            self.backend = LocalTranslator()
        else:
            self.backend = FastTranslator()

    async def translate_to_english(self, text: str, source_lang: str) -> str:
        # Wrapper to keep async signature for orchestrator compatibility
        return self.backend.translate(text, source_lang, "en")
        
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        return self.backend.translate(text, source_lang, target_lang)
