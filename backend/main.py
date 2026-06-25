from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import pdf, sessions, chat

app = FastAPI(title="Folio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://folio.vercel.app","https://folio-pearl-eight.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf.router)
app.include_router(sessions.router)
app.include_router(chat.router)
