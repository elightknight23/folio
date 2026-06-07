from typing import Generator
from services import pdf_parser, chunker, embedder, vector_store, llm_client


def process_pdf_for_rag(session_id: str, pdf_bytes: bytes) -> None:
    """
    Orchestrates the full RAG ingestion pipeline for a newly uploaded PDF.

    Flow: pdf_parser → chunker → embedder → vector_store

    Runs in a FastAPI BackgroundTask — must not raise unhandled exceptions
    that would crash the worker. Errors are logged but not re-raised.
    """
    try:
        pages = pdf_parser.extract_text(pdf_bytes)
        chunks = chunker.chunk_pages(pages)

        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        embeddings = embedder.embed_texts(texts)
        vector_store.store_chunks(session_id, chunks, embeddings)

    except Exception as e:
        # Background task — log the error so it appears in uvicorn output
        print(f"[rag_pipeline] ERROR for session {session_id}: {e}")


def generate_chat_response(session_id: str, user_message: str, current_page: int) -> Generator[str, None, None]:
    query_embedding = embedder.embed_texts([user_message])[0]
    similar_chunks = vector_store.search_similar_chunks(session_id, query_embedding)
    page_text = vector_store.get_page_text(session_id, current_page)

    local_context = page_text or "(no text extracted for this page)"

    global_context_parts = [
        f"[Page {c['page_number']}]: {c['text_content']}"
        for c in similar_chunks
    ]
    global_context = "\n\n".join(global_context_parts) or "(no relevant chunks found)"

    system_prompt = (
        f"You are Folio, an AI study assistant helping a student understand their PDF.\n\n"
        f"CURRENT PAGE ({current_page}):\n{local_context}\n\n"
        f"RELEVANT CONTEXT FROM THE DOCUMENT:\n{global_context}\n\n"
        f"Answer using the context above. Be concise and educational. "
        f"If the answer isn't in the provided context, say so clearly."
    )

    yield from llm_client.stream_response(system_prompt, user_message)
