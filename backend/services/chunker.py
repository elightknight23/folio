MAX_CHUNK_CHARS = 2000  # ~500 tokens


def _split_by_sentences(text: str, page_number: int, base_index: int) -> list[dict]:
    """Fallback: split an oversized paragraph by sentence boundaries."""
    chunks = []
    current = ""
    for sentence in text.split(". "):
        sentence = sentence.strip()
        if not sentence:
            continue
        candidate = (current + ". " + sentence).strip() if current else sentence
        if len(candidate) > MAX_CHUNK_CHARS and current:
            chunks.append({"page_number": page_number, "chunk_index": base_index + len(chunks), "text": current.strip()})
            current = sentence
        else:
            current = candidate
    if current.strip():
        chunks.append({"page_number": page_number, "chunk_index": base_index + len(chunks), "text": current.strip()})
    return chunks


def chunk_pages(pages: list[dict]) -> list[dict]:
    """
    Input:  [{page_number: int, text: str}]
    Output: [{page_number: int, chunk_index: int, text: str}]

    Splits each page by paragraph boundaries (\\n\\n).
    Any paragraph exceeding MAX_CHUNK_CHARS is recursively split by sentence boundary.
    chunk_index is global across the entire document.
    """
    all_chunks = []

    for page in pages:
        page_number = page["page_number"]
        raw_text = page["text"].strip()
        if not raw_text:
            continue

        paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]

        for paragraph in paragraphs:
            base_index = len(all_chunks)
            if len(paragraph) > MAX_CHUNK_CHARS:
                sub_chunks = _split_by_sentences(paragraph, page_number, base_index)
                all_chunks.extend(sub_chunks)
            else:
                all_chunks.append({
                    "page_number": page_number,
                    "chunk_index": base_index,
                    "text": paragraph,
                })

    return all_chunks
