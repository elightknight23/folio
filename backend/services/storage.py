from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
BUCKET = "pdfs"


def upload_pdf(filename: str, pdf_bytes: bytes) -> str:
    """
    Uploads pdf_bytes to the 'pdfs' Supabase Storage bucket.
    Returns the storage path of the uploaded file.
    """
    path = filename
    _client.storage.from_(BUCKET).upload(
        path=path,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )
    return path
