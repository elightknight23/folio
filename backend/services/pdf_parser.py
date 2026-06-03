import fitz


def extract_text(pdf_bytes: bytes) -> list[dict]:
    """
    Takes raw PDF bytes, returns [{page_number: int, text: str}] for every page.
    Pages with no extractable text are included with an empty string.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for i in range(doc.page_count):
        text = doc[i].get_text().strip()
        pages.append({"page_number": i + 1, "text": text})
    doc.close()
    return pages
