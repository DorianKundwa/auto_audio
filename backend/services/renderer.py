"""
FFmpeg Renderer — assembles the final video with background music and SFX.

Filter graph strategy:
  [0:a]  original video audio (or generated silence if video has no audio)
  [1:a]  background music (repeated sequentially until video ends and trimmed at video_duration)
  [2:a]  SFX event 0 (delayed to timestamp)
  [3:a]  SFX event 1 ...
  ...
  → amix all together → output .mp4 trimmed by -shortest

Video stream is copied (no re-encode) for speed.
Audio is encoded as AAC 192k.
"""

import os
import math
import shutil
import subprocess
import asyncio
from pathlib import Path
from typing import List, Optional

from models.schemas import SFXEvent, MusicConfig

PROJECT_ROOT = Path(__file__).parent.parent.parent


def _resolve_file(file_path: Optional[str]) -> Optional[Path]:
    """Resolve file path against PROJECT_ROOT and verify it exists as a file."""
    if not file_path or not str(file_path).strip():
        return None
    raw_str = str(file_path).strip().replace("\\", "/")
    p = Path(raw_str)
    if not p.is_absolute():
        p = (PROJECT_ROOT / p).resolve()
    if p.is_file():
        return p
    # Fallback to checking relative to PROJECT_ROOT / assets
    alt = (PROJECT_ROOT / "assets" / raw_str).resolve()
    if alt.is_file():
        return alt
    return None


def _has_audio_stream(video_path: str) -> bool:
    """Check if the source video contains an audio stream."""
    try:
        res = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "a",
                "-show_entries",
                "stream=codec_type",
                "-of",
                "csv=p=0",
                video_path,
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return "audio" in res.stdout.lower()
    except Exception:
        return True


def _get_file_duration(file_path: Path) -> float:
    """Get audio/video duration in seconds."""
    try:
        res = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(file_path),
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return float(res.stdout.strip())
    except Exception:
        return 30.0


def _get_sample_rate(file_path: Path) -> int:
    """Detect the audio sample rate of a file via ffprobe."""
    try:
        res = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-select_streams", "a:0",
                "-show_entries", "stream=sample_rate",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(file_path),
            ],
            capture_output=True, text=True, timeout=10,
        )
        rate = int(res.stdout.strip())
        return rate if rate > 0 else 44100
    except Exception:
        return 44100


async def render_video(
    job_id: str,
    video_path: str,
    sfx_events: List[SFXEvent],
    music_config: Optional[MusicConfig],
    music_enabled: bool,
    sfx_enabled: bool,
    output_dir: str,
    video_duration: Optional[float] = None,
) -> str:
    """
    Build FFmpeg command and run it asynchronously.
    Returns the path to the rendered output file.
    """
    output_path = str(Path(output_dir) / f"{job_id}_output.mp4")

    # Resolve video duration once here; avoids a redundant ffprobe inside _build_command
    if video_duration is None or video_duration <= 0:
        video_duration = _get_file_duration(Path(video_path))

    cmd = _build_command(
        video_path=video_path,
        output_path=output_path,
        sfx_events=sfx_events if sfx_enabled else [],
        music_config=music_config if music_enabled else None,
        video_duration=video_duration,
    )

    print(f"[renderer] Running FFmpeg:\n  {' '.join(cmd)}")

    def _run_ffmpeg():
        return subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

    loop = asyncio.get_event_loop()
    res = await loop.run_in_executor(None, _run_ffmpeg)

    if res.returncode != 0:
        err = res.stderr.decode(errors="replace")
        raise RuntimeError(f"FFmpeg failed (code {res.returncode}):\n{err}")

    return output_path


def _build_command(
    video_path: str,
    output_path: str,
    sfx_events: List[SFXEvent],
    music_config: Optional[MusicConfig],
    video_duration: float = 0.0,
) -> List[str]:
    """
    Construct the FFmpeg command with a dynamic filter_complex graph.
    Music is added back-to-back across the timeline until the video ends, then trimmed.
    """
    video_dur = video_duration if video_duration > 0 else _get_file_duration(Path(video_path))

    # ---- Inputs -------------------------------------------------------
    inputs: List[str] = ["-i", str(Path(video_path).resolve())]
    input_idx = 1  # 0 = video

    music_input_idx: Optional[int] = None
    music_track_dur: float = 30.0

    if music_config and music_config.track_path:
        resolved_music = _resolve_file(music_config.track_path)
        if resolved_music:
            inputs += ["-i", str(resolved_music)]
            music_input_idx = input_idx
            input_idx += 1
            music_track_dur = music_config.track_duration or _get_file_duration(resolved_music)
        else:
            print(f"[renderer] Music track missing, skipping: {music_config.track_path}")

    sfx_input_indices: List[int] = []
    valid_events: List[SFXEvent] = []
    for event in sfx_events:
        resolved_sfx = _resolve_file(event.sfx_path)
        if resolved_sfx:
            inputs += ["-i", str(resolved_sfx)]
            sfx_input_indices.append(input_idx)
            valid_events.append(event)
            input_idx += 1
        else:
            print(f"[renderer] SFX file missing, skipping: {event.sfx_path}")

    # ---- Filter complex -----------------------------------------------
    has_video_audio = _has_audio_stream(video_path)
    filter_parts: List[str] = []
    mix_labels: List[str] = []

    if has_video_audio:
        mix_labels.append("[0:a]")
    else:
        # Generate silence if video has no native audio
        filter_parts.append("anullsrc=channel_layout=stereo:sample_rate=44100[silent_base]")
        mix_labels.append("[silent_base]")

    if music_input_idx is not None and music_config:
        vol = max(0.01, min(1.0, float(music_config.volume)))
        # Detect real sample rate so aloop size is frame-accurate
        resolved_music_path = _resolve_file(music_config.track_path)
        music_sr = _get_sample_rate(resolved_music_path) if resolved_music_path else 44100
        repeats = max(1, math.ceil(video_dur / max(0.1, music_track_dur)) + 1)
        samples = int(music_track_dur * music_sr)
        filter_parts.append(
            f"[{music_input_idx}:a]volume={vol},"
            f"aloop=loop={repeats}:size={samples},"
            f"atrim=0:{video_dur},"
            f"asetpts=PTS-STARTPTS[music_track]"
        )
        mix_labels.append("[music_track]")

    for i, (idx, event) in enumerate(zip(sfx_input_indices, valid_events)):
        delay_ms = max(0, int(event.timestamp * 1000))
        vol = max(0.01, min(2.0, float(event.volume)))
        label = f"[sfx{i}]"

        # Build filter chain for this SFX input
        sfx_filters = [f"[{idx}:a]volume={vol}"]
        if event.duration and event.duration > 0:
            # Trim the SFX to its allowed window so it never bleeds into the next event
            sfx_filters.append(f"atrim=0:{round(event.duration, 3)}")
            sfx_filters.append("asetpts=PTS-STARTPTS")
        sfx_filters.append(f"adelay={delay_ms}|{delay_ms}")

        filter_parts.append(",".join(sfx_filters) + label)
        mix_labels.append(label)

    n_inputs = len(mix_labels)
    if n_inputs == 1 and has_video_audio:
        filter_complex = "[0:a]acopy[out]"
    elif n_inputs == 1 and not has_video_audio:
        filter_complex = "anullsrc=channel_layout=stereo:sample_rate=44100[out]"
    else:
        mix_inputs = "".join(mix_labels)
        filter_parts.append(
            f"{mix_inputs}amix=inputs={n_inputs}:normalize=0:dropout_transition=0[out]"
        )
        filter_complex = "; ".join(filter_parts)

    # ---- Full command --------------------------------------------------
    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "0:v",
        "-map", "[out]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(Path(output_path).resolve()),
    ]

    return cmd
