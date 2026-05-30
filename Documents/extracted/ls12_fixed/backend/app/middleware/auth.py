import os
import httpx
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

# Module-level JWKS cache: { kid: jwk_dict }
_jwks_cache: dict = {}


async def _fetch_jwks():
    """Fetch and cache all keys from the JWKS endpoint."""
    global _jwks_cache
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(JWKS_URL)
            resp.raise_for_status()
            data = resp.json()
            _jwks_cache = {k["kid"]: k for k in data.get("keys", [])}
            print(f"[AUTH] JWKS loaded: {list(_jwks_cache.keys())}")
    except Exception as e:
        print(f"[AUTH] JWKS fetch failed: {e}")


async def _get_jwk(kid: str):
    """Return the JWK for the given kid, refreshing once if missing."""
    if kid not in _jwks_cache:
        await _fetch_jwks()
    return _jwks_cache.get(kid)


async def get_current_user(request: Request) -> dict:
    """Require a valid Supabase JWT. Handles both HS256 and ES256."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization token")

    token = auth_header.split(" ", 1)[1]
    alg = "unknown"
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "unknown")
        kid = header.get("kid", "")

        if alg == "ES256":
            # Asymmetric — use the public JWK from the JWKS endpoint
            jwk = await _get_jwk(kid)
            if not jwk:
                raise JWTError(f"No JWK found for kid={kid}")
            payload = jwt.decode(
                token,
                jwk,                      # single JWK dict, not the whole JWKS
                algorithms=["ES256"],
                options={"verify_aud": False},
            )
        else:
            # Symmetric — use the secret from .env
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256", "HS384", "HS512"],
                options={"verify_aud": False},
            )

        user = {
            "user_id": payload.get("sub"),
            "phone":   payload.get("phone"),
            "role":    payload.get("role"),
        }
        return user

    except JWTError as e:
        print(f"[AUTH] Invalid token (alg={alg}): {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    except Exception as e:
        print(f"[AUTH] Unexpected auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_optional_user(request: Request) -> dict | None:
    """Same as get_current_user but returns None instead of raising 401."""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None
