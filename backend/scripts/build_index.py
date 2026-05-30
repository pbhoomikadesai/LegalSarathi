import os
import sys
import json
from pathlib import Path

# Add backend/ to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.ingest_corpus import embed_chunks, save_faiss, push_neon

CORPUS_DIR = Path(__file__).resolve().parents[1] / "data" / "corpus"
INDEX_DIR  = Path(__file__).resolve().parents[1] / "data" / "faiss_index"

def main():
    print("=" * 60)
    print("LegalSarthi -- Build Vector Index")
    print("=" * 60)
    
    chunks_file = CORPUS_DIR / "expanded_chunks.json"
    if not chunks_file.exists():
        print(f"[BUILD] ERROR: expanded_chunks.json not found at {chunks_file}.")
        print("Please run the corpus expansion script first: 'python backend/scripts/expand_corpus.py'")
        sys.exit(1)
        
    print(f"[BUILD] Reading chunks from {chunks_file}...")
    with open(chunks_file, "r", encoding="utf-8") as f:
        chunks = json.load(f)
        
    print(f"[BUILD] Loaded {len(chunks)} chunks.")
    
    # Generate embeddings and save
    embeddings = embed_chunks(chunks)
    save_faiss(chunks, embeddings)
    push_neon(chunks, embeddings)
    
    print(f"[BUILD] FAISS index built: {len(chunks)} vectors saved to backend/data/faiss_index/")
    print("=" * 60)

if __name__ == "__main__":
    main()
