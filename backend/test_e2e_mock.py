import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACT_DIR = r"C:\Users\chris\.gemini\antigravity\brain\1ef93c66-3d40-42c0-a992-ac8928a0a6b9"

async def run_mock_test():
    async with async_playwright() as p:
        # We use a standard chromium launch
        browser = await p.chromium.launch(headless=True)
        # Grant microphone permissions so UI doesn't block (even though we don't speak into it)
        context = await browser.new_context(permissions=['microphone'])
        page = await context.new_page()

        print("[TEST] Navigating to localhost:3000")
        await page.goto("http://localhost:3000/")
        await page.wait_for_timeout(2000)

        # 1. Languages Mock
        # print("[TEST] Testing Language Switch (Hindi)")
        # await page.locator("select").select_option("hi")
        # await page.wait_for_timeout(1000)
        # await page.screenshot(path=os.path.join(ARTIFACT_DIR, "mock_language_hindi.png"))
        
        # 2. PDF Upload Mock
        print("[TEST] Testing PDF Upload for Document Summarization")
        # Ensure we have a dummy PDF ready to upload
        dummy_pdf = "test_fir.pdf"
        if not os.path.exists(dummy_pdf):
            with open(dummy_pdf, "w") as f:
                f.write("This is a formal test document regarding an FIR for a traffic violation under Motor Vehicles Act.")
                
        # Playwright interacts with hidden file inputs using set_input_files
        await page.locator("#ocr-file-input").set_input_files(dummy_pdf)
        print("[TEST] Selected file, waiting for OCR extraction...")
        
        # Wait for the "Extracted from document" button to appear
        await page.wait_for_selector("text=Extracted from document", timeout=15000)
        
        # Click Analyse Document
        print("[TEST] OCR Extracted! Submitting for Legal Summarization...")
        await page.locator("#ocr-submit-btn").click()
        
        # Wait for the response card to load
        print("[TEST] Waiting for RAG/LLM backend processing...")
        await page.wait_for_selector("text=Extracted from document", state="hidden", timeout=90000)
        
        print("[TEST] Legal Summary received! Taking screenshot.")
        await page.wait_for_timeout(4000) # Give UI time to render fonts and audio to sync
        page_ss_path = os.path.join(ARTIFACT_DIR, "mock_pdf_summary.png")
        await page.locator("main").screenshot(path=page_ss_path)

        
        print(f"[TEST] Success! Screenshots saved to {ARTIFACT_DIR}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_mock_test())
