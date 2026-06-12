import time
from google import genai
from google.genai import errors as genai_errors
from config import GEMINI_API_KEY

_client = genai.Client(api_key=GEMINI_API_KEY, http_options={"api_version": "v1"})
_MODEL = "gemini-embedding-001"

# Gemini free tier: 30k embedding tokens/min. Chunks are ≤ ~500 tokens, so a
# batch of 10 is ~5k tokens. Pacing batches 10s apart keeps us under the limit.
_BATCH_SIZE = 10
_BATCH_DELAY = 10.0  # seconds between batches

# If we still hit a 429 (burst limit), back off and retry instead of crashing
# the ingestion pipeline.
_MAX_RETRIES = 5
_BACKOFF_SCHEDULE = [15, 30, 60, 60, 60]  # seconds


def _is_rate_limit(e: Exception) -> bool:
    return isinstance(e, genai_errors.APIError) and e.code == 429


def _embed_batch(batch: list[str]) -> list[list[float]]:
    """Embed one batch, retrying with backoff on rate-limit errors."""
    for attempt in range(_MAX_RETRIES + 1):
        try:
            response = _client.models.embed_content(
                model=_MODEL,
                contents=batch,
                config={"output_dimensionality": 768},
            )
            return [e.values for e in response.embeddings]
        except Exception as e:
            if not _is_rate_limit(e) or attempt == _MAX_RETRIES:
                raise
            delay = _BACKOFF_SCHEDULE[attempt]
            print(f"[embedder] 429 rate limit — retrying in {delay}s (attempt {attempt + 1}/{_MAX_RETRIES})")
            time.sleep(delay)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Input:  list of text strings
    Output: list of 768-dimensional float arrays (one per input text)

    Sends texts in paced batches and retries rate-limit errors so large
    documents never fail ingestion on a 429 burst.
    """
    all_embeddings = []

    for i in range(0, len(texts), _BATCH_SIZE):
        batch = texts[i: i + _BATCH_SIZE]
        all_embeddings.extend(_embed_batch(batch))

        # Pause between batches to stay under the free-tier tokens/min limit
        if i + _BATCH_SIZE < len(texts):
            time.sleep(_BATCH_DELAY)

    return all_embeddings
