from typing import Generator
from google import genai
from google.genai import types
from groq import Groq
from config import GEMINI_API_KEY, GROQ_API_KEY

_gemini = genai.Client(api_key=GEMINI_API_KEY)
_groq = Groq(api_key=GROQ_API_KEY)

_GEMINI_MODEL = "gemini-2.0-flash-lite"
_GROQ_MODEL = "llama-3.3-70b-versatile"


def stream_response(system_prompt: str, user_message: str) -> Generator[str, None, None]:
    try:
        yield from _stream_gemini(system_prompt, user_message)
    except Exception as e:
        error_str = str(e)
        print(f"[llm_client] ERROR type={type(e).__name__} | {error_str[:300]}")
        is_quota = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
        if is_quota:
            print("[llm_client] Gemini quota hit, falling back to Groq")
            yield from _stream_groq(system_prompt, user_message)
        else:
            raise


def _stream_gemini(system_prompt: str, user_message: str) -> Generator[str, None, None]:
    combined_text = f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nUSER MESSAGE:\n{user_message}"
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=combined_text)],
        )
    ]
    response = _gemini.models.generate_content_stream(
        model=_GEMINI_MODEL,
        contents=contents,
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
