from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
BUCKET = "pdfs"


def upload_pdf(user_id: str, filename: str, pdf_bytes: bytes) -> str:
    path = f"{user_id}/{filename}"
    _client.storage.from_(BUCKET).upload(
        path=path,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )
    return path


def get_signed_url(storage_path: str) -> str:
    res = _client.storage.from_(BUCKET).create_signed_url(storage_path, 3600)
    return res["signedURL"]


def delete_pdf(storage_path: str) -> None:
    _client.storage.from_(BUCKET).remove([storage_path])
