"""
Auto Audio — FastAPI backend entry point.

Endpoints:
  POST /api/upload          → upload video + SRT
  POST /api/analyze/{id}    → analyze and return SFX timeline
  GET  /api/analyze/{id}    → retrieve stored timeline
  POST /api/export/{id}     → render and download final video
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")

from routers import upload, analyze, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure runtime directories exist
    for d in ["uploads", "outputs"]:
        Path(__file__).parent.parent.joinpath(d).mkdir(exist_ok=True)
    yield


app = FastAPI(
    title="Auto Audio API",
    version="1.0.0",
    description="AI-powered video sound design: SFX + music selection + FFmpeg export",
    lifespan=lifespan,
)

# ---- CORS ----------------------------------------------------------------
# Allow the Next.js dev server (port 3000) and any localhost origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Routers -------------------------------------------------------------
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analyze.router, prefix="/api", tags=["Analyze"])
app.include_router(export.router, prefix="/api", tags=["Export"])


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
