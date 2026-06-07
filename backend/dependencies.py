from fastapi import Header, HTTPException
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_current_user_id(authorization: str = Header(...)) -> str:
    token = authorization.removeprefix("Bearer ").strip()
    res = _client.auth.get_user(token)
    if not res.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return str(res.user.id)
