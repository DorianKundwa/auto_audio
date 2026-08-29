"""
Export router — POST /api/export/{job_id}
Renders the final video and streams it back as a file download.
"""

from pathlib import Path

from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse

from models.schemas import ExportRequest
from services.renderer import render_video
from routers.analyze import get_timeline

router = APIRouter()

UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
OUTPUTS_DIR = Path(__file__).parent.parent.parent / "outputs"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/export/{job_id}")
async def export_video(
    job_id: str,
    body: ExportRequest = Body(...),
):
    """
    Render the final video with the user-reviewed SFX timeline.
    Streams the MP4 back as a file download.
    """
    # Find video path
    job_dir = UPLOADS_DIR / job_id
    if not job_dir.exists():
        raise HTTPException(404, f"Job '{job_id}' not found.")

    video_files = list(job_dir.glob("video.*"))
    if not video_files:
        raise HTTPException(404, "Video file missing.")
    video_path = str(video_files[0])

    # Use music_config from the request body (user may have tweaked it)
    # Fall back to the stored timeline music config
    music_config = body.music_config
    if music_config is None:
        stored = get_timeline(job_id)
        if stored:
            music_config = stored.music_config

    # Resolve video duration from stored timeline (avoids redundant ffprobe)
    stored = get_timeline(job_id)
    stored_duration = stored.video_duration if stored else None

    output_path = await render_video(
        job_id=job_id,
        video_path=video_path,
        sfx_events=body.sfx_events,
        music_config=music_config,
        music_enabled=body.music_enabled,
        sfx_enabled=body.sfx_enabled,
        output_dir=str(OUTPUTS_DIR),
        video_duration=stored_duration,
    )

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=f"auto_audio_{job_id[:8]}.mp4",
    )
