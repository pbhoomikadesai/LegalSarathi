import sys
import os
import io
import wave
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image, ImageDraw, ImageFont
from app.services.ocr_service import OCRService
from app.services.voice_service import VoiceService
from app.services.pdf_service import PDFService
from app.services.document_generation_service import DocumentGenerationService
from app.services.rag_service import RAGService
from app.services.document_memory_service import DocumentMemoryService

async def test_ocr_service():
    print("\n=== Testing OCR Service ===")
    ocr = OCRService()
    
    # 1. Create a dummy test image using PIL
    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    # Using default font
    d.text((10, 40), "Legal Sarathi Test OCR Content", fill=(0, 0, 0))
    
    img_bytes_io = io.BytesIO()
    img.save(img_bytes_io, format='PNG')
    img_bytes = img_bytes_io.getvalue()
    
    print("Running OCR on test image...")
    text = ocr.extract(img_bytes, "test.png", "en")
    print(f"Extracted Text: {repr(text)}")
    
    # The OCR subprocess might fail if PaddleOCR dependencies aren't fully configured,
    # but the service should execute cleanly or report the error via the standard pipeline.
    print("OCR Service check completed.")

async def test_voice_service():
    print("\n=== Testing Voice Service ===")
    voice = VoiceService()
    
    # 1. Test TTS (synthesize)
    print("Synthesizing Hindi speech using edge-tts...")
    test_text = "नमस्ते, लीगल सारथी में आपका स्वागत है। मैं आपकी सहायता कैसे कर सकता हूँ?"
    mp3_path = await voice.synthesize(test_text, lang="hi")
    print(f"Saved audio path: {mp3_path}")
    if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 0:
        print("[SUCCESS] TTS generated file successfully.")
        os.unlink(mp3_path)
    else:
        print("[FAIL] TTS failed to generate non-empty file.")
        
    # 2. Test STT (transcribe via Groq Whisper API)
    print("Creating a 1-second silent WAV file to verify Groq Whisper API...")
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        wav.writeframes(b'\x00' * 32000)
    wav_bytes = wav_buffer.getvalue()
    
    print("Transcribing WAV audio bytes via Whisper...")
    transcription = voice.transcribe(wav_bytes, lang="hi")
    print(f"Whisper Transcription Output: {repr(transcription)}")
    print("Voice Service check completed.")

async def test_pdf_service():
    print("\n=== Testing PDF Service ===")
    pdf_text = (
        "Under BNSS Section 35, the police can make an arrest without a warrant under certain conditions.\n"
        "1. Real threat or cognizable offense.\n"
        "2. Suspicious activity.\n"
        "References: [BNSS_35]"
    )
    print("Generating draft PDF...")
    pdf_buffer = await PDFService.generate_draft(pdf_text, "Bail / Arrest under BNSS Section 35")
    pdf_bytes = pdf_buffer.getvalue()
    print(f"PDF bytes generated: {len(pdf_bytes)} bytes")
    if len(pdf_bytes) > 0:
        print("[SUCCESS] PDF Service generated draft successfully.")
    else:
        print("[FAIL] PDF Service generated an empty file.")

async def test_doc_generation_service():
    print("\n=== Testing Document Generation (Templates) Service ===")
    doc_gen = DocumentGenerationService()
    
    # Get available templates
    avail = doc_gen.get_available_templates()
    print(f"Available templates: {list(avail.keys())}")
    
    # Render a test template
    if "rti_application" in avail:
        print("Rendering rti_application (english.jinja2)...")
        test_data = {
            "applicant_name": "John Doe",
            "applicant_address": "123 Main St, New Delhi",
            "applicant_phone": "9876543210",
            "applicant_email": "john.doe@example.com",
            "public_authority": "Ministry of Law and Justice",
            "information_sought": "Please provide the budget allocation details for Legal Aid Services for the year 2025-2026.",
            "preferred_mode": "Email",
            "date_of_application": "29-05-2026"
        }
        html_content = doc_gen.render_document("rti_application", "english", test_data)
        print("[SUCCESS] Successfully rendered rti_application template.")
        print(f"HTML Preview (first 150 chars): {html_content[:150]}...")
    else:
        print("[FAIL] rti_application template not found.")

async def test_rag_service():
    print("\n=== Testing RAG Service ===")
    rag = RAGService()
    if not rag.is_ready:
        print("[FAIL] RAG Service index is not ready.")
        return
        
    print("Running query retrieval on local FAISS index...")
    query = "arrest without warrant"
    merged, elapsed = rag.retrieve_hybrid(query, top_k=5)
    print(f"Hybrid retrieval finished in {elapsed:.4f}s. Found {len(merged)} results.")
    
    for i, res in enumerate(merged):
        print(f"[{i+1}] Act: {res.get('act')} | Ref: {res.get('section_ref')} | Title: {res.get('title')}")
        print(f"    Excerpt: {res.get('text')[:120]}...")
        
    formatted = rag.format_for_prompt(merged)
    print("RAG Prompt format check completed.")

async def main():
    print("=== STARTING LEGAL SARATHI INTEGRATION TESTS ===")
    await test_ocr_service()
    await test_voice_service()
    await test_pdf_service()
    await test_doc_generation_service()
    await test_rag_service()
    print("\n=== ALL SYSTEM TESTS COMPLETED ===")

if __name__ == "__main__":
    asyncio.run(main())
