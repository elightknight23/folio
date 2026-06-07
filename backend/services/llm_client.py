from typing import Generator
from google import genai
from groq import Groq
from config import GEMINI_API_KEY, GROQ_API_KEY

_gemini = genai.Client(api_key=GEMINI_API_KEY)
_groq = Groq(api_key=GROQ_API_KEY)

_GEMINI_MODEL = "gemini-2.0-flash"
_GROQ_MODEL = "llama-3.3-70b-versatile"


def stream_response(system_prompt: str, user_message: str) -> Generator[str, None, None]:
    """Try Gemini first. On 429 rate limit, fall back to Groq."""
    try:
        yield from _stream_gemini(system_prompt, user_message)
    except Exception as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            print(f"[llm_client] Gemini quota hit, falling back to Groq")
            yield from _stream_groq(system_prompt, user_message)
        else:
            print(f"[llm_client] Gemini ERROR: {e}")
            yield f"\n\n[Error generating response: {e}]"


def _stream_gemini(system_prompt: str, user_message: str) -> Generator[str, None, None]:
    response = _gemini.models.generate_content_stream(
        model=_GEMINI_MODEL,
        contents=[{"role": "user", "parts": [{"text": user_message}]}],
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
