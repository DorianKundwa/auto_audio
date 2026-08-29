"""
Analyze router — POST /api/analyze/{job_id}
Reads uploaded files, runs the full AI pipeline, returns SFX timeline.
"""

import json
import subprocess
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import APIRouter, HTTPException, Body

from models.schemas import AnalyzeSettings, TimelineResult
from services.srt_parser import parse_srt
from services.transcriber import transcribe
from services.analyzer import analyze_segments
from services.sfx_engine import build_sfx_timeline
from services.music_engine import select_music

router = APIRouter()

UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"

# ── Job store: disk-backed (survives restarts / --reload) ─────────────────────
# Results are saved as uploads/{job_id}/timeline.json.
# A small LRU memory cache (last 20 jobs) avoids redundant disk reads.
_CACHE_MAX = 20
_mem_cache: dict = {}          # job_id -> TimelineResult
_cache_order: list = []        # insertion-ordered list of job_ids


def _cache_put(job_id: str, result: "TimelineResult") -> None:
    if job_id not in _mem_cache:
        _cache_order.append(job_id)
        if len(_cache_order) > _CACHE_MAX:
            evicted = _cache_order.pop(0)
            _mem_cache.pop(evicted, None)
    _mem_cache[job_id] = result


def _persist(job_id: str, result: "TimelineResult") -> None:
    """Write timeline to disk so it survives server restarts."""
    path = UPLOADS_DIR / job_id / "timeline.json"
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(result.model_dump_json())
    except Exception as exc:
        print(f"[analyze] Could not persist timeline for {job_id}: {exc}")


def get_timeline(job_id: str) -> "Optional[TimelineResult]":
    """Return the stored timeline — memory cache first, then disk fallback."""
    if job_id in _mem_cache:
        return _mem_cache[job_id]
    path = UPLOADS_DIR / job_id / "timeline.json"
    if path.exists():
        try:
            from models.schemas import TimelineResult as _TR
            result = _TR.model_validate_json(path.read_text(encoding="utf-8"))
            _cache_put(job_id, result)
            return result
        except Exception as exc:
            print(f"[analyze] Could not load timeline for {job_id}: {exc}")
    return None


def _get_video_duration(video_path: str) -> float:
    """Use ffprobe to get video duration in seconds."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video_path,
            ],
            capture_output=True, text=True, timeout=30,
        )
        return float(result.stdout.strip())
    except Exception:
        return 300.0  # fallback 5 min


@router.post("/analyze/{job_id}", response_model=TimelineResult)
async def analyze_video(
    job_id: str,
    settings: AnalyzeSettings = Body(default=AnalyzeSettings()),
):
    """Run the full analysis pipeline on an uploaded job."""
    job_dir = UPLOADS_DIR / job_id
    if not job_dir.exists():
        raise HTTPException(404, f"Job '{job_id}' not found. Upload a file first.")

    # Find video file
    video_files = list(job_dir.glob("video.*"))
    if not video_files:
        raise HTTPException(404, "Video file not found in job directory.")
    video_path = str(video_files[0])

    # Get duration
    video_duration = _get_video_duration(video_path)

    # --- Step 1: Get segments ---
    srt_path = job_dir / "subtitle.srt"
    if srt_path.exists():
        async with aiofiles.open(srt_path, "r", encoding="utf-8", errors="replace") as f:
            srt_content = await f.read()
        segments = parse_srt(srt_content)
    else:
        # Auto-transcribe with faster-whisper
        import asyncio
        segments = await asyncio.to_thread(transcribe, video_path)

    if not segments:
        raise HTTPException(422, "Could not extract any text segments from the video.")

    # Ensure video_duration spans all detected subtitle segments
    max_sub_time = max((s.end_sec for s in segments), default=0.0)
    if max_sub_time > video_duration:
        video_duration = max_sub_time + 1.5

    # --- Step 2: AI analysis ---
    analyzed = await analyze_segments(segments, settings)

    # --- Step 3: SFX timeline ---
    sfx_events = build_sfx_timeline(analyzed, settings, video_duration)

    # --- Step 4: Music selection ---
    music_config = select_music(analyzed, settings, video_duration)
    if music_config is None:
        # Provide a safe dummy config
        from models.schemas import MusicConfig
        music_config = MusicConfig(track_path="", volume=0.12, mood="dark_documentary")

    result = TimelineResult(
        job_id=job_id,
        video_path=video_path,
        video_duration=video_duration,
        sfx_events=sfx_events,
        music_config=music_config,
        analyzed_segments=analyzed,
    )

    _cache_put(job_id, result)
    _persist(job_id, result)
    return result


@router.get("/analyze/{job_id}", response_model=TimelineResult)
async def get_timeline_result(job_id: str):
    """Retrieve a previously computed timeline (memory or disk)."""
    result = get_timeline(job_id)
    if not result:
        raise HTTPException(404, f"No analysis found for job '{job_id}'.")
    return result
