from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from dependencies import get_current_user_id
from services import session_manager, storage

router = APIRouter(prefix="/sessions")


class SessionUpdate(BaseModel):
    notes: Optional[str] = None


@router.get("")
def list_sessions(user_id: str = Depends(get_current_user_id)):
    return session_manager.get_sessions_for_user(user_id)


@router.get("/{session_id}")
def get_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    session = session_manager.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    signed_url = storage.get_signed_url(session["storage_path"])
    return {**session, "signed_url": signed_url}


@router.patch("/{session_id}")
def patch_session(
    session_id: str,
    body: SessionUpdate,
    user_id: str = Depends(get_current_user_id),
):
    session = session_manager.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session_manager.update_session(session_id, body.model_dump(exclude_none=True))


@router.delete("/{session_id}")
def delete_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    session = session_manager.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    storage.delete_pdf(session["storage_path"])
    session_manager.delete_session(session_id)
    return {"status": "deleted"}
