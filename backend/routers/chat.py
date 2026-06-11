import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dependencies import get_current_user_id
from services import session_manager, rag_pipeline

router = APIRouter(prefix="/chat")


class ChatRequest(BaseModel):
    message: str
    current_page: int


def _sse_stream(session_id: str, message: str, current_page: int):
    try:
        for token in rag_pipeline.generate_chat_response(session_id, message, current_page):
            yield f"data: {json.dumps(token)}\n\n"
    except Exception as e:
        print(f"[chat] Unhandled stream error: {e}")
        yield f"data: {json.dumps({'__error__': 'Something went wrong. Please try again.'})}\n\n"
    finally:
        yield "data: [DONE]\n\n"


@router.post("/{session_id}")
def chat(
    session_id: str,
    body: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    session = session_manager.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    return StreamingResponse(
        _sse_stream(session_id, body.message, body.current_page),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
