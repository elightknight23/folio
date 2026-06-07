import time
from google import genai
from config import GEMINI_API_KEY

_client = genai.Client(api_key=GEMINI_API_KEY, http_options={"api_version": "v1"})
_MODEL = "gemini-embedding-001"
_BATCH_SIZE = 20   # Gemini free tier: stay well under rate limits
_BATCH_DELAY = 1.0  # seconds between batches


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Input:  list of text strings
    Output: list of 768-dimensional float arrays (one per input text)

    Sends texts in batches to avoid rate limit errors.
    """
    all_embeddings = []

    for i in range(0, len(texts), _BATCH_SIZE):
        batch = texts[i: i + _BATCH_SIZE]
        response = _client.models.embed_content(
            model=_MODEL,
            contents=batch,
            config={"output_dimensionality": 768},
        )
        all_embeddings.extend([e.values for e in response.embeddings])

        # Pause between batches to respect free-tier rate limits
        if i + _BATCH_SIZE < len(texts):
            time.sleep(_BATCH_DELAY)

    return all_embeddings
