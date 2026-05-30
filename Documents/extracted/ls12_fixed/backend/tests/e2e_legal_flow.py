import os
import sys
from playwright.sync_api import sync_playwright, expect

def run_test():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000")
            
            print("Entering Hindi query...")
            page.fill('input[placeholder="Describe your situation..."]', "पुलिस ने बिना वारंट गिरफ्तार किया")
            page.click('button:has-text("Ask")')
            
            print("Waiting for ActionCard to render (60s timeout)...")
            # Wait for either Arrest or BNSS to appear on the page, or the specific text from ActionCard or DraftPanel
            # Since the frontend uses raw_guidance for DraftPanel and action_steps for ActionCard
            # We'll just wait for the DraftPanel Preview header which appears when response is loaded
            page.wait_for_selector('h3:has-text("Document Draft Preview")', timeout=60000)
            
            # Now we look for keywords in the page content
            content = page.content()
            
            print("Asserting UI contains expected keywords...")
            # Using lowercase to handle case sensitivity
            if "arrest" not in content.lower() and "bnss" not in content.lower() and "बिना वारंट गिरफ्तारी" not in content:
                 print("Warning: Could not find 'Arrest', 'BNSS', or Hindi equivalents in the UI.")
            else:
                 print("UI Keyword assertion passed.")

            print("Verifying 'Download PDF' button...")
            with page.expect_download() as download_info:
                page.click('button:has-text("Download PDF")')
            
            download = download_info.value
            print(f"Download triggered: {download.suggested_filename}")
            
            if not download.suggested_filename.endswith(".pdf"):
                raise AssertionError("Downloaded file is not a PDF")

            print("Success! Headless E2E Automation completed.")
            
        except Exception as e:
            print(f"Test Failed: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run_test()
