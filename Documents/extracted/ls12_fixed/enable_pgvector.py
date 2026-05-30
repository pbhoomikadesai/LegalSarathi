import psycopg2, os, sys
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=str(Path(__file__).parent / ".env"))
url = os.getenv("NEON_DATABASE_URL", "")

conn = psycopg2.connect(url)
cur = conn.cursor()

# Enable pgvector
cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
conn.commit()

cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
row = cur.fetchone()
print("pgvector enabled:", row)

cur.close()
conn.close()
print("Done")
