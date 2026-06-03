from fastapi import APIRouter, UploadFile, File, HTTPException
from services import storage, pdf_parser

router = APIRouter()


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()

    storage.upload_pdf(file.filename, pdf_bytes)
    pages = pdf_parser.extract_text(pdf_bytes)

    return {"status": "ok", "filename": file.filename, "page_count": len(pages)}
