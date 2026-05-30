"""
OCR Service — PaddleOCR via subprocess isolation

Runs OCR in a separate subprocess using the legalsarathi2 venv Python.
This bypasses:
  1. The DLL lock from the running server's PaddleX 3.x instance
  2. The PaddleX 3.x / PIR executor oneDNN crash
  3. The venv permission issue (subprocess uses same Python binary)

The subprocess uses a minimal PaddleOCR 2.x worker script.
"""

import io
import os
import sys
import json
import base64
import subprocess
import tempfile

# Path to the Python executable in the correct venv
# (the one that has paddle 2.6.2 + paddleocr 2.8.1 installed)
_VENV_PYTHON = r"c:\Users\chris\OneDrive\Desktop\rohit\legalsarathi2\backend\venv\Scripts\python.exe"
_VENV_SITE = r"c:\Users\chris\OneDrive\Desktop\rohit\legalsarathi2\backend\venv\Lib\site-packages"

# Map application language codes → PaddleOCR 2.x language strings
LANG_TO_PADDLEOCR = {
    "hi": "hi", "ta": "ta", "te": "te", "kn": "kn",
    "ml": "ml", "mr": "mr", "bn": "bn", "gu": "gu",
    "pa": "pa", "ur": "ur", "or": "en",
    "en": "en",
}

# The worker script that runs inside the subprocess (uses PaddleOCR 2.x API)
_WORKER_SCRIPT = r"""
import sys
import json
import base64
import os

venv_site = sys.argv[1]
if venv_site not in sys.path:
    sys.path.insert(0, venv_site)

lang = sys.argv[2]
img_path = sys.argv[3]

import numpy as np
from PIL import Image

img = Image.open(img_path).convert("RGB")
img_np = np.array(img)[:, :, ::-1]  # RGB to BGR

try:
    from paddleocr import PaddleOCR
    ocr = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
    results = ocr.ocr(img_np, cls=True)
    page = results[0] if results and isinstance(results[0], list) else (results or [])
    lines = []
    for line in (page or []):
        if not line:
            continue
        try:
            text = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
            if text and str(text).strip():
                lines.append(str(text).strip())
        except (IndexError, TypeError):
            continue
    print(json.dumps({"text": "\n".join(lines), "error": None}))
except Exception as e:
    print(json.dumps({"text": "", "error": str(e)}))
"""


def _pdf_to_images(pdf_bytes: bytes, dpi: int = 200):
    """Convert PDF pages to PIL Images."""
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        images = []
        mat = fitz.Matrix(dpi / 72.0, dpi / 72.0)
        for page in doc:
            pix = page.get_pixmap(matrix=mat)
            from PIL import Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            images.append(img)
        doc.close()
        return images
    except ImportError:
        from pdf2image import convert_from_bytes
        return convert_from_bytes(pdf_bytes, dpi=dpi)


def _ocr_image_bytes(img_bytes: bytes, lang: str) -> str:
    """Run PaddleOCR in a subprocess on raw image bytes. Returns extracted text."""
    paddle_lang = LANG_TO_PADDLEOCR.get(lang, "en")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Write the image to a temp file
        img_path = os.path.join(tmpdir, "img.png")
        with open(img_path, "wb") as f:
            f.write(img_bytes)

        # Write the worker script to a temp file
        script_path = os.path.join(tmpdir, "worker.py")
        with open(script_path, "w") as f:
            f.write(_WORKER_SCRIPT)

        try:
            result = subprocess.run(
                [_VENV_PYTHON, script_path, _VENV_SITE, paddle_lang, img_path],
                capture_output=True,
                text=True,
                timeout=120,
            )
            # Find the JSON output line (skip any Paddle log lines)
            for line in result.stdout.strip().splitlines():
                line = line.strip()
                if line.startswith("{"):
                    data = json.loads(line)
                    if data.get("error"):
                        print(f"[OCR-WORKER] Error: {data['error']}")
                    return data.get("text", "")
            if result.returncode != 0:
                print(f"[OCR-WORKER] stderr: {result.stderr[-500:]}")
            return ""
        except subprocess.TimeoutExpired:
            print("[OCR-WORKER] Timeout after 120s")
            return ""
        except Exception as e:
            print(f"[OCR-WORKER] Failed to run: {e}")
            return ""


class OCRService:
    def extract_text(self, image_bytes: bytes, lang: str = "en") -> str:
        """OCR image bytes → clean text."""
        text = _ocr_image_bytes(image_bytes, lang)
        print(f"[OCR] Extracted {len(text)} chars from image (lang={lang})")
        return text

    def extract_from_pdf(self, pdf_bytes: bytes, lang: str = "en") -> str:
        """OCR a PDF: render each page, OCR via subprocess, join results."""
        try:
            import io as _io
            images = _pdf_to_images(pdf_bytes)
            all_text = []

            for i, img in enumerate(images):
                buf = _io.BytesIO()
                img.save(buf, format="PNG")
                img_bytes = buf.getvalue()

                page_text = _ocr_image_bytes(img_bytes, lang)
                if page_text:
                    all_text.append(f"[Page {i + 1}]\n{page_text}")
                print(f"[OCR] Page {i + 1}: {len(page_text)} chars")

            return "\n\n".join(all_text)
        except Exception as e:
            print(f"[OCR] extract_from_pdf error: {e}")
            return ""

    def extract(self, file_bytes: bytes, filename: str, lang: str = "en") -> str:
        """Auto-detect file type and route to the correct extractor."""
        ext = os.path.splitext(filename.lower())[1] if filename else ""
        if ext == ".pdf":
            return self.extract_from_pdf(file_bytes, lang)
        return self.extract_text(file_bytes, lang)
