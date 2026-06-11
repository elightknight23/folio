from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File, HTTPException
from dependencies import get_current_user_id
from services import storage, pdf_parser, session_manager, rag_pipeline
from config import MAX_PDFS, MAX_PDF_SIZE_BYTES

router = APIRouter()

_SIZE_LIMIT_MB = MAX_PDF_SIZE_BYTES // (1024 * 1024)


@router.post("/upload")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Check Content-Length before reading to avoid OOM on massive files
    if file.size is not None and file.size > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {_SIZE_LIMIT_MB}MB limit.")

    pdf_bytes = await file.read()

    # Final guard for clients that omit Content-Length
    if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {_SIZE_LIMIT_MB}MB limit.")

    existing = session_manager.get_sessions_for_user(user_id)
    if len(existing) >= MAX_PDFS:
        raise HTTPException(status_code=403, detail=f"You've reached the {MAX_PDFS} PDF limit.")

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

    background_tasks.add_task(rag_pipeline.process_pdf_for_rag, session["id"], pdf_bytes)

    return {
        "status": "processing",
        "session_id": session["id"],
        "filename": file.filename,
        "page_count": len(pages),
    }
