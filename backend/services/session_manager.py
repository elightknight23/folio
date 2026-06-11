from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
TABLE = "sessions"


def create_session(user_id: str, filename: str, storage_path: str, page_count: int) -> dict:
    res = _client.table(TABLE).insert({
        "user_id": user_id,
        "filename": filename,
        "storage_path": storage_path,
        "page_count": page_count,
    }).execute()
    return res.data[0]


def get_sessions_for_user(user_id: str) -> list[dict]:
    res = _client.table(TABLE).select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data


def get_session_by_id(session_id: str) -> dict | None:
    res = _client.table(TABLE).select("*").eq("id", session_id).single().execute()
    return res.data


def update_session(session_id: str, data: dict) -> dict:
    res = _client.table(TABLE).update(data).eq("id", session_id).execute()
    return res.data[0]


def delete_session(session_id: str) -> None:
    _client.table(TABLE).delete().eq("id", session_id).execute()
