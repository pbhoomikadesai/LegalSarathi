"""
Legal Corpus Ingestion → Neon PostgreSQL (pgvector)
Run once: python backend/scripts/ingest_corpus.py
Creates table legal_chunks, enables pgvector, embeds 35+ BNS/BNSS/IPC sections.
"""

import os, sys, json, time, re, pickle
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(dotenv_path=str(Path(__file__).parent.parent.parent / ".env"))

CORPUS_DIR = Path(__file__).parent.parent / "data" / "corpus"
INDEX_DIR  = Path(__file__).parent.parent / "data" / "faiss_index"
CORPUS_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)

EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
NEON_URL = os.getenv("NEON_DATABASE_URL", "")

# ── Legal Corpus ─────────────────────────────────────────────────────────────
SECTIONS = {
    "BNSS_35":   ("BNSS 2023 §35 - Arrest without warrant",
        "Any police officer may without an order from a Magistrate and without a warrant arrest any person who has been concerned in any cognizable offence, or against whom a reasonable complaint has been made, or credible information has been received, or a reasonable suspicion exists of his having been so concerned."),
    "BNSS_47":   ("BNSS 2023 §47 - Search of place entered by person sought to be arrested",
        "If any police officer having authority to arrest has reason to believe that the person to be arrested has entered into or is within any place, any person residing in or being in charge of such place shall on demand allow him free ingress thereto and afford all reasonable facilities for a search therein."),
    "BNSS_50":   ("BNSS 2023 §50 - Person arrested to be informed of grounds",
        "Every police officer or other person arresting any person without a warrant shall forthwith communicate to him the full particulars of the offence for which he is arrested or other grounds for such arrest."),
    "BNSS_51":   ("BNSS 2023 §51 - Detention limit 24 hours",
        "No police officer shall detain in custody a person arrested without warrant for a longer period than under all circumstances is reasonable, and such period shall not in the absence of a special Magistrate order exceed twenty-four hours exclusive of journey time from place of arrest to Magistrate court."),
    "BNSS_76":   ("BNSS 2023 §76 - Arrested person before Magistrate",
        "A police officer making an arrest without warrant shall without unnecessary delay take or send the person arrested before a Magistrate having jurisdiction in the case or before the officer in charge of a police station."),
    "BNSS_173":  ("BNSS 2023 §173 - Police report to Magistrate",
        "Every investigation under this Chapter shall be completed without unnecessary delay. The officer in charge of the police station shall forthwith transmit to the nearest Judicial Magistrate a copy of the diary entries relating to the case when investigation cannot be completed within 24 hours."),
    "BNSS_482":  ("BNSS 2023 §482 - Anticipatory bail",
        "When any person has reason to believe that he may be arrested on accusation of having committed a non-bailable offence he may apply to the High Court or the Court of Session for a direction that in the event of such arrest he shall be released on bail."),
    "BNSS_479":  ("BNSS 2023 §479 - Default bail (right to bail on delayed chargesheet)",
        "If investigation is not completed and chargesheet not filed within 60 days (Magistrate triable) or 90 days (Sessions triable) the accused is entitled to bail if he is prepared to furnish bail and this right shall not be affected by any subsequent filing of chargesheet."),
    "BNS_73":    ("BNS 2023 §73 - Arrest how made",
        "In making an arrest the police officer shall actually touch or confine the body of the person to be arrested unless there be a submission to custody by word or action. If such person forcibly resists the endeavour to arrest him or attempts to evade the arrest such police officer may use all means necessary to effect the arrest."),
    "BNS_143":   ("BNS 2023 §143 - Trafficking of persons",
        "Whoever for the purpose of exploitation recruits transports harbours transfers or receives a person by using threats force coercion abduction fraud deception or abuse of power shall be punished with rigorous imprisonment for not less than 7 years which may extend to 10 years and fine. For trafficking of a child minimum sentence is 10 years."),
    "CONST_22":  ("Constitution Article 22 - Protection against arbitrary arrest",
        "No person who is arrested shall be detained in custody without being informed as soon as may be of the grounds of such arrest nor shall he be denied the right to consult and be defended by a legal practitioner of his choice. Every person arrested and detained shall be produced before the nearest magistrate within 24 hours excluding journey time. No such person shall be detained beyond said period without authority of a magistrate."),
    "CONST_21":  ("Constitution Article 21 - Right to life and personal liberty",
        "No person shall be deprived of his life or personal liberty except according to procedure established by law. This includes right to live with dignity, right to education, right to health, right to livelihood, right against solitary confinement, right against handcuffing."),
    "IPC_339":   ("IPC §339 - Wrongful restraint",
        "Whoever voluntarily obstructs any person so as to prevent that person from proceeding in any direction in which that person has a right to proceed is said wrongfully to restrain that person."),
    "IPC_340":   ("IPC §340 - Wrongful confinement",
        "Whoever wrongfully restrains any person in such a manner as to prevent that person from proceeding beyond certain circumscribing limits is said wrongfully to confine that person."),
    "IPC_342":   ("IPC §342 - Punishment for wrongful confinement",
        "Whoever wrongfully confines any person shall be punished with imprisonment of either description for a term which may extend to one year or with fine which may extend to one thousand rupees or with both."),
    "IPC_376":   ("IPC §376 - Punishment for rape",
        "Whoever commits rape shall be punished with rigorous imprisonment for a term not less than ten years but which may extend to imprisonment for life and shall also be liable to fine. When committed by police officer public servant or person in position of trust minimum sentence is 10 years."),
    "IPC_498A":  ("IPC §498A - Cruelty by husband or relatives",
        "Whoever being the husband or the relative of the husband of a woman subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine. Cruelty means wilful conduct likely to drive the woman to commit suicide or cause grave injury or danger to life limb or health or harassment to coerce her or her relatives to meet unlawful demands for property."),
    "IPC_420":   ("IPC §420 - Cheating",
        "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person or to make alter or destroy a valuable security shall be punished with imprisonment of either description for a term which may extend to seven years and shall also be liable to fine."),
    "IPC_186":   ("IPC §186 - Obstructing public servant",
        "Whoever voluntarily obstructs any public servant in the discharge of his public functions shall be punished with imprisonment of either description for a term which may extend to three months or with fine which may extend to five hundred rupees or with both."),
    "SC_ST_ACT": ("SC/ST Prevention of Atrocities Act 1989",
        "Protects members of Scheduled Castes and Scheduled Tribes from atrocities including humiliation assault wrongful occupation of land and forcing to drink obnoxious substance. Offences are non-bailable and non-compoundable. Trial by Special Court. Victims are entitled to relief and rehabilitation. Complaints to SP or DSP level officer. NALSA provides free legal aid to SC/ST victims."),
    "DV_ACT":    ("Protection of Women from Domestic Violence Act 2005",
        "Protects women from physical sexual verbal emotional and economic abuse by husband or live-in partner. Woman can obtain protection order residence order monetary relief and custody order from Magistrate. Protection Officer available in each district. File complaint at nearest police station or directly to Magistrate. Women helpline 1091. NCW helpline 7827170170."),
    "POCSO":     ("POCSO Act 2012 - Protection of Children from Sexual Offences",
        "Protects children under 18 from sexual abuse and exploitation. All sexual offences against children are cognizable and non-bailable. Mandatory reporting: any person with knowledge of sexual abuse must report to police or SJPU. Child Helpline 1098. Special courts handle POCSO cases. Identity of child victim is protected."),
    "DOWRY":     ("Dowry Prohibition Act 1961",
        "Giving or taking dowry is prohibited. Punishment imprisonment not less than 5 years and fine not less than Rs 15000 or the value of dowry whichever is more. FIR can be filed under IPC Section 498A for cruelty related to dowry. Women can approach NALSA women helpline 181 or NCW."),
    "CONSUMER":  ("Consumer Protection Act 2019",
        "Consumers have rights to safety information choice redress and consumer education. File complaint at District Consumer Dispute Redressal Commission for claims up to Rs 1 crore. No court fee for claims up to Rs 5 lakh. Consumer helpline 1800-11-4000. Online complaint at consumerhelpline.gov.in. Time limit 2 years from date of cause of action."),
    "LABOUR_MW": ("Minimum Wages Act 1948",
        "Every employer shall pay to every employee wages at not less than the minimum rate of wages fixed by the appropriate Government. Employer who pays less than minimum wages is liable for imprisonment up to 6 months or fine up to Rs 500 or both. Workers can file complaint with labour inspector."),
    "LABOUR_PE": ("Payment of Wages Act 1936",
        "All wages shall be paid in current coin or currency notes or by cheque or by crediting in bank account. Wages must be paid before the 7th day after the last day of the wage period for establishments with less than 1000 workers. Worker can file complaint with Authority under the Act if wages are unpaid."),
    "LAND_ACQ":  ("Land Acquisition Act 2013 - Fair Compensation",
        "No land can be acquired without Social Impact Assessment adequate notice and fair compensation. Compensation must be 2x market value for urban land and 2-4x for rural. Solatium of 100 percent of compensation is mandatory. Rehabilitation and resettlement is mandatory. Affected person can challenge before Land Acquisition Collector or High Court."),
    "RTI":       ("Right to Information Act 2005",
        "Every citizen has the right to access information from public authorities. File RTI online at rtionline.gov.in. Response must come within 30 days. First appeal can be filed with the same department. Second appeal to Central or State Information Commission. RTI fee is Rs 10 for central government. No fee for BPL applicants."),
    "NALSA":     ("NALSA - National Legal Services Authority - Free Legal Aid",
        "Every citizen is entitled to free legal aid under Article 39A of the Constitution. NALSA provides free legal services to persons belonging to SC/ST victims of trafficking women and children persons with disabilities industrial workmen persons in custody and persons whose annual income is below Rs 1 lakh. Contact NALSA helpline 15100 toll-free. Legal Aid available at every District Legal Services Authority DLSA."),
    "FIR":       ("FIR - First Information Report Registration",
        "Police must register FIR for cognizable offences without any conditions. Zero FIR can be filed at any police station regardless of jurisdiction. If police refuse to register FIR complaint can be made to Superintendent of Police or directly to Magistrate under Section 173 BNSS. Refusal to register FIR is a punishable offence. Copy of FIR must be given to complainant free of charge."),
    "BAIL":      ("Bail Provisions under BNSS 2023",
        "Bail is a right for bailable offences. For non-bailable offences court has discretion. Anticipatory bail Section 482 BNSS can be sought before arrest. Bail application can be filed before Magistrate Sessions Court or High Court. Default bail Section 479 BNSS: if chargesheet not filed within 60 days for magistrate triable or 90 days for sessions triable accused is entitled to bail."),
    "LEGAL_AID": ("Free Legal Aid - Article 39A Constitution",
        "Article 39A mandates free legal aid to economically and socially disadvantaged citizens. Every accused who cannot afford a lawyer is entitled to a free government lawyer at all courts. Apply through DLSA District Legal Services Authority or SLSA State Legal Services Authority. NALSA Toll-free 15100."),
    "HUMAN_TRF": ("Human Trafficking - IPC §370 / BNS §143",
        "Whoever for the purpose of exploitation recruits transports harbours transfers or receives a person by using threats force coercion abduction fraud or deception shall be punished with rigorous imprisonment not less than 7 years up to 10 years and fine. For child trafficking minimum sentence is 10 years. Victims entitled to compensation and rehabilitation under ITPA."),
}


def build_chunks():
    chunks = []
    chunk_size = 250
    chunk_overlap = 50

    for sec_id, (title, text) in SECTIONS.items():
        parent_content = f"{title}\n{text}"
        
        # Simple character-based text splitter for child nodes
        if len(text) <= chunk_size:
            chunks.append({
                "id": sec_id + "_0",
                "title": title,
                "text": text,
                "parent_content": parent_content,
                "act": sec_id.split("_")[0],
                "section_ref": sec_id,
            })
        else:
            start = 0
            idx = 0
            while start < len(text):
                end = start + chunk_size
                child_text = text[start:end]
                # Try to break at nearest sentence or space if possible
                if end < len(text):
                    last_space = child_text.rfind(" ")
                    if last_space > chunk_size // 2:
                        child_text = child_text[:last_space]
                        end = start + last_space
                
                chunks.append({
                    "id": f"{sec_id}_{idx}",
                    "title": title,
                    "text": child_text.strip(),
                    "parent_content": parent_content,
                    "act": sec_id.split("_")[0],
                    "section_ref": sec_id,
                })
                idx += 1
                start = end - chunk_overlap
                if start >= len(text) - chunk_overlap:
                    break

    return chunks


def embed_chunks(chunks):
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(EMBEDDING_MODEL)
    texts = [f"{c['title']}\n{c['text']}" for c in chunks]
    print(f"[EMBED] Encoding {len(texts)} chunks with {EMBEDDING_MODEL}...")
    t = time.time()
    embs = model.encode(texts, show_progress_bar=True, batch_size=8)
    print(f"[EMBED] Done {time.time()-t:.1f}s | shape={embs.shape}")
    return embs


def save_faiss(chunks, embeddings):
    """Always save local FAISS as fallback."""
    import faiss
    emb_np = np.array(embeddings, dtype="float32")
    faiss.normalize_L2(emb_np)
    index = faiss.IndexFlatIP(emb_np.shape[1])
    index.add(emb_np)
    faiss.write_index(index, str(INDEX_DIR / "legal_index.faiss"))
    with open(INDEX_DIR / "chunks_meta.pkl", "wb") as f:
        pickle.dump(chunks, f)
    print(f"[FAISS] Saved {index.ntotal} vectors → {INDEX_DIR}/legal_index.faiss")


def push_neon(chunks, embeddings):
    """Push to Neon PostgreSQL pgvector."""
    if not NEON_URL:
        print("[NEON] NEON_DATABASE_URL not set — skip")
        return False
    try:
        import psycopg2
        from pgvector.psycopg2 import register_vector

        conn = psycopg2.connect(NEON_URL)
        register_vector(conn)
        cur = conn.cursor()

        # Setup: enable pgvector, create table
        dim = embeddings.shape[1]
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute("DROP TABLE IF EXISTS legal_chunks;")
        cur.execute(f"""
            CREATE TABLE legal_chunks (
                id             TEXT PRIMARY KEY,
                section_ref    TEXT NOT NULL,
                title          TEXT NOT NULL,
                content        TEXT NOT NULL,
                parent_content TEXT NOT NULL,
                act            TEXT,
                embedding      vector({dim})
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding ON legal_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);")
        conn.commit()
        print("[NEON] Table ready.")

        # Upsert all chunks
        for chunk, emb in zip(chunks, embeddings):
            cur.execute("""
                INSERT INTO legal_chunks (id, section_ref, title, content, parent_content, act, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE
                    SET title=EXCLUDED.title,
                        content=EXCLUDED.content,
                        parent_content=EXCLUDED.parent_content,
                        embedding=EXCLUDED.embedding;
            """, (chunk["id"], chunk["section_ref"], chunk["title"], chunk["text"], chunk["parent_content"], chunk["act"], emb.tolist()))

        conn.commit()
        cur.close()
        conn.close()
        print(f"[NEON] ✅ Upserted {len(chunks)} chunks to legal_chunks table")
        return True
    except Exception as e:
        print(f"[NEON] Error: {e}")
        return False


def main():
    print("=" * 60)
    print("LegalSarthi -- Corpus Ingestion -- Neon pgvector + FAISS")
    print("=" * 60)

    chunks = build_chunks()
    print(f"[CORPUS] {len(chunks)} sections")

    with open(CORPUS_DIR / "chunks.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    embeddings = embed_chunks(chunks)
    save_faiss(chunks, embeddings)

    ok = push_neon(chunks, embeddings)
    if ok:
        print("\n✅ Neon pgvector populated.")
    else:
        print("\n⚠️  Neon skipped — using local FAISS only.")

    print(f"Chunks: {len(chunks)} | Index: {INDEX_DIR}/legal_index.faiss")


if __name__ == "__main__":
    main()
