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
        "You are Folio, a friendly AI study assistant helping a student understand their PDF.\n"
        "RULES:\n"
        "- Format every response using Markdown: use **bold**, bullet lists, and ## headers where they help.\n"
        "- Default to concise, plain-language answers — avoid academic jargon unless the user asks for it.\n"
        "- If the user asks you to simplify, expand, rephrase, or give examples, do it immediately.\n"
        "- Whenever you reference a specific page from the context, you MUST format it as a markdown link "
        "using this exact syntax: [Page X](#page-X) (e.g., [Page 42](#page-42)). Never write a bare page number.\n"
        "- If the answer is not in the provided context, say so briefly and offer to help with what you do know.\n\n"
        f"CURRENT PAGE ({current_page}) TEXT:\n{local_context}\n\n"
        f"RELEVANT CONTEXT FROM ELSEWHERE IN THE DOCUMENT:\n{global_context}"
    )

    yield from llm_client.stream_response(system_prompt, user_message)
