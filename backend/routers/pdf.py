from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File, HTTPException
from dependencies import get_current_user_id
from services import storage, pdf_parser, session_manager, rag_pipeline

router = APIRouter()


@router.post("/upload")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()

    try:
        storage_path = storage.upload_pdf(user_id, file.filename, pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {e}")

    try:
        pages = pdf_parser.extract_text(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parser error: {e}")

    try:
        session = session_manager.create_session(
            user_id=user_id,
            filename=file.filename,
            storage_path=storage_path,
            page_count=len(pages),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session error: {e}")

    # Kick off embedding pipeline in the background — does not block the response
    background_tasks.add_task(rag_pipeline.process_pdf_for_rag, session["id"], pdf_bytes)

    return {
        "status": "processing",
        "session_id": session["id"],
        "filename": file.filename,
        "page_count": len(pages),
    }
