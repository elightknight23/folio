from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
TABLE = "document_chunks"


def store_chunks(session_id: str, chunks: list[dict], embeddings: list[list[float]]) -> None:
    """
    Inserts chunks and their embeddings into the document_chunks table.

    Each record: session_id, page_number, chunk_index, text, embedding.
    chunks and embeddings must be the same length and in the same order.
    """
    records = [
        {
            "session_id": session_id,
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
            "text_content": chunk["text"],
            "embedding": embedding,
        }
        for chunk, embedding in zip(chunks, embeddings)
    ]

    _client.table(TABLE).insert(records).execute()


def search_similar_chunks(session_id: str, query_embedding: list[float], limit: int = 5) -> list[dict]:
    res = _client.rpc("match_chunks", {
        "query_embedding": query_embedding,
        "match_session_id": session_id,
        "match_count": limit,
    }).execute()
    return res.data


def get_page_text(session_id: str, page_number: int) -> str:
    res = (
        _client.table(TABLE)
        .select("text_content, chunk_index")
        .eq("session_id", session_id)
        .eq("page_number", page_number)
        .order("chunk_index")
        .execute()
    )
    return "\n\n".join(r["text_content"] for r in res.data)
