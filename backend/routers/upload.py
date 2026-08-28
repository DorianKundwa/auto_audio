"""
Upload router — POST /api/upload
Accepts video + optional SRT file, saves to uploads/{job_id}/, returns job_id.
"""

import os
import uuid
import shutil
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from models.schemas import UploadResponse

router = APIRouter()

UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
ALLOWED_VIDEO = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
ALLOWED_SRT = {".srt", ".vtt"}
MAX_VIDEO_MB = 2048  # 2 GB
MAX_SRT_MB = 10


def _check_extension(filename: str, allowed: set) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(
            400, f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed)}"
        )
    return ext


@router.post("/upload", response_model=UploadResponse)
async def upload_files(
    video: UploadFile = File(...),
    srt: UploadFile = File(None),
):
    """Accept a video + optional SRT, store under a unique job_id."""
    _check_extension(video.filename, ALLOWED_VIDEO)

    job_id = str(uuid.uuid4())
    job_dir = UPLOADS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # Save video
    video_ext = Path(video.filename).suffix.lower()
    video_filename = f"video{video_ext}"
    video_path = job_dir / video_filename
    async with aiofiles.open(video_path, "wb") as f:
        while chunk := await video.read(1024 * 1024):  # 1 MB chunks
            await f.write(chunk)

    # Save SRT (optional)
    srt_filename: str | None = None
    if srt and srt.filename:
        _check_extension(srt.filename, ALLOWED_SRT)
        srt_filename = "subtitle.srt"
        srt_path = job_dir / srt_filename
        async with aiofiles.open(srt_path, "wb") as f:
            content = await srt.read()
            await f.write(content)

    return UploadResponse(
        job_id=job_id,
        video_filename=video_filename,
        srt_filename=srt_filename,
        has_srt=srt_filename is not None,
    )
