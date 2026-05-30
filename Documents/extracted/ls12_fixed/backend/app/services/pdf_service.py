import io
import datetime
import random
import re

BASE_DIR = None  # retained for import compatibility


class PDFService:
    @staticmethod
    async def generate_draft(guidance_text: str, query: str = "") -> io.BytesIO:
        """
        Generates a formatted PDF using fpdf2 (pure Python, zero browser dependency).
        Replaces the previous Playwright implementation which required headless Chromium.
        """
        try:
            from fpdf import FPDF
        except ImportError:
            raise RuntimeError(
                "fpdf2 is not installed. Run: pip install fpdf2"
            )

        paragraphs = [p.strip() for p in guidance_text.split("\n") if p.strip()]

        doc_type = "LEGAL GUIDANCE"
        if "FIR" in query.upper():
            doc_type = "FIR DRAFT"
        elif "RTI" in query.upper():
            doc_type = "RTI APPLICATION"
        elif "BAIL" in query.upper():
            doc_type = "BAIL APPLICATION"

        title = query[:60] + ("..." if len(query) > 60 else "") if query else doc_type

        citations = []
        for p in paragraphs:
            if "§" in p or "Section" in p or "Act" in p:
                parts = re.findall(r"\[(.*?)\]", p)
                citations.extend(parts)
        citations = list(set(citations))[:5]

        ref_id = str(random.randint(1000, 9999))
        generated_date = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=25)
        pdf.add_page()

        # Header band
        pdf.set_fill_color(30, 58, 138)
        pdf.rect(0, 0, 210, 28, "F")
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_y(6)
        pdf.cell(0, 8, "LegalSarathi", ln=True, align="C")
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(0, 6, "Apna Kanoon, Apni Bhasha", ln=True, align="C")

        pdf.set_text_color(30, 30, 30)
        pdf.set_y(34)

        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 8, doc_type, ln=True, align="L")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 5, f"Ref: LS-{ref_id}  |  Generated: {generated_date}", ln=True)
        pdf.ln(3)

        pdf.set_draw_color(200, 200, 200)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(4)

        if query:
            pdf.set_text_color(30, 30, 30)
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 5, "Subject:", ln=True)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 5, title)
            pdf.ln(3)

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(40, 40, 40)
        for para in paragraphs:
            safe = para.encode("latin-1", errors="replace").decode("latin-1")
            pdf.multi_cell(0, 6, safe)
            pdf.ln(2)

        if citations:
            pdf.ln(4)
            pdf.set_draw_color(200, 200, 200)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(80, 80, 80)
            pdf.cell(0, 5, "Legal References:", ln=True)
            pdf.set_font("Helvetica", "", 8)
            for c in citations:
                safe_c = c.encode("latin-1", errors="replace").decode("latin-1")
                pdf.cell(0, 4, f"  \u2022 {safe_c}", ln=True)

        pdf.set_y(-18)
        pdf.set_font("Helvetica", "I", 7)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(
            0, 5,
            "This document is for informational purposes only and does not constitute legal advice. "
            "Consult a qualified lawyer for legal matters.",
            ln=True, align="C",
        )

        buffer = io.BytesIO()
        buffer.write(pdf.output())
        buffer.seek(0)
        return buffer
