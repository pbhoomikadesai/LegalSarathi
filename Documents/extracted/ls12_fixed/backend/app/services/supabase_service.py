"""
Supabase helper for backend (admin operations).
Uses the service-role key for server-side inserts/updates (bypasses RLS where needed).
"""
import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase_admin() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
            )
        _client = create_client(url, key)
    return _client
