"""
Auto Audio — FastAPI backend entry point.

Endpoints:
  POST /api/upload          → upload video + SRT
  POST /api/analyze/{id}    → analyze and return SFX timeline
  GET  /api/analyze/{id}    → retrieve stored timeline
  POST /api/export/{id}     → render and download final video
"""

import os
import sys
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).parent))

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
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Routers -------------------------------------------------------------
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analyze.router, prefix="/api", tags=["Analyze"])
app.include_router(export.router, prefix="/api", tags=["Export"])

# ---- Static Media Files (for browser preview) ----------------------------
ROOT_DIR = Path(__file__).parent.parent
assets_path = ROOT_DIR / "assets"
uploads_path = ROOT_DIR / "uploads"
frontend_path = ROOT_DIR / "frontend"

if assets_path.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
if uploads_path.exists():
    app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.get("/api/library/sfx")
async def get_sfx_library():
    """Return available SFX catalog for manual placement and preview."""
    meta_path = ROOT_DIR / "assets" / "sfx" / "metadata.json"
    if meta_path.exists():
        import json
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


@app.get("/api/library/music")
async def get_music_library():
    """Return available music tracks catalog."""
    meta_path = ROOT_DIR / "assets" / "music" / "metadata.json"
    if meta_path.exists():
        import json
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


# ---- Mount HTML/JS Frontend ----------------------------------------------
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
