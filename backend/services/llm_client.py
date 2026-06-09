import base64
from typing import Generator, Optional
from google import genai
from google.genai import types
from groq import Groq
from config import GEMINI_API_KEY, GROQ_API_KEY

_gemini = genai.Client(api_key=GEMINI_API_KEY)
_groq = Groq(api_key=GROQ_API_KEY)

_GEMINI_MODEL = "gemini-2.0-flash"
_GROQ_MODEL = "llama-3.3-70b-versatile"


class QuotaExceededError(Exception):
    """Raised when the Gemini free-tier quota is exhausted and no fallback is available."""
    pass


def stream_response(system_prompt: str, user_message: str, image_data: Optional[str] = None) -> Generator[str, None, None]:
    try:
        yield from _stream_gemini(system_prompt, user_message, image_data)
    except Exception as e:
        is_quota = "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)
        if is_quota and image_data is None:
            print("[llm_client] Gemini quota hit, falling back to Groq")
            yield from _stream_groq(system_prompt, user_message)
        elif is_quota and image_data is not None:
            # Groq has no vision support — raise so the router can signal a clean error
            raise QuotaExceededError("AI free tier limit reached. Please wait 60 seconds and try again.")
        else:
            if image_data:
                print(f"[llm_client] Gemini vision ERROR: {e}")
            else:
                print(f"[llm_client] Gemini ERROR: {e}")
            raise


def _stream_gemini(system_prompt: str, user_message: str, image_data: Optional[str] = None) -> Generator[str, None, None]:
    if image_data:
        raw = image_data.split(",", 1)[1] if "," in image_data else image_data
        image_bytes = base64.b64decode(raw)
        parts = [
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text=user_message),
        ]
        contents = [types.Content(role="user", parts=parts)]
    else:
        contents = [{"role": "user", "parts": [{"text": user_message}]}]

    response = _gemini.models.generate_content_stream(
        model=_GEMINI_MODEL,
        contents=contents,
        config={"system_instruction": system_prompt},
    )
    for chunk in response:
        if chunk.text:
            yield chunk.text


def _stream_groq(system_prompt: str, user_message: str) -> Generator[str, None, None]:
    stream = _groq.chat.completions.create(
        model=_GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        stream=True,
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token
