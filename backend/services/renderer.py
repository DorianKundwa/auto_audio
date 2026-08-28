"""
FFmpeg Renderer — assembles the final video with background music and SFX.

Filter graph strategy:
  [0:a]  original video audio (full volume)
  [1:a]  background music (looped, low volume)
  [2:a]  SFX event 0 (delayed to timestamp)
  [3:a]  SFX event 1 ...
  ...
  → amix all together → output .mp4

Video stream is copied (no re-encode) for speed.
Audio is encoded as AAC 192k.
"""

import os
import shutil
import subprocess
import asyncio
from pathlib import Path
from typing import List, Optional

from models.schemas import SFXEvent, MusicConfig


async def render_video(
    job_id: str,
    video_path: str,
    sfx_events: List[SFXEvent],
    music_config: Optional[MusicConfig],
    music_enabled: bool,
    sfx_enabled: bool,
    output_dir: str,
) -> str:
    """
    Build FFmpeg command and run it asynchronously.
    Returns the path to the rendered output file.
    """
    output_path = str(Path(output_dir) / f"{job_id}_output.mp4")

    cmd = _build_command(
        video_path=video_path,
        output_path=output_path,
        sfx_events=sfx_events if sfx_enabled else [],
        music_config=music_config if music_enabled else None,
    )

    print(f"[renderer] Running FFmpeg:\n  {' '.join(cmd)}")

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        err = stderr.decode(errors="replace")
        raise RuntimeError(f"FFmpeg failed (code {proc.returncode}):\n{err}")

    return output_path


def _build_command(
    video_path: str,
    output_path: str,
    sfx_events: List[SFXEvent],
    music_config: Optional[MusicConfig],
) -> List[str]:
    """
    Construct the FFmpeg command with a dynamic filter_complex graph.
    """
    # ---- Inputs -------------------------------------------------------
    inputs: List[str] = ["-i", video_path]
    input_idx = 1  # 0 = video

    music_input_idx: Optional[int] = None
    if music_config and Path(music_config.track_path).exists():
        inputs += ["-i", music_config.track_path]
        music_input_idx = input_idx
        input_idx += 1

    sfx_input_indices: List[int] = []
    valid_events: List[SFXEvent] = []
    for event in sfx_events:
        if Path(event.sfx_path).exists():
            inputs += ["-i", event.sfx_path]
            sfx_input_indices.append(input_idx)
            valid_events.append(event)
            input_idx += 1
        else:
            print(f"[renderer] SFX file missing, skipping: {event.sfx_path}")

    # ---- Filter complex -----------------------------------------------
    filter_parts: List[str] = []
    mix_labels: List[str] = ["[0:a]"]  # original audio

    if music_input_idx is not None:
        vol = music_config.volume
        # Loop music up to 3 hours (will be trimmed by -t)
        filter_parts.append(
            f"[{music_input_idx}:a]volume={vol},"
            f"aloop=loop=200:size=44100000[music_loop]"
        )
        mix_labels.append("[music_loop]")

    for i, (idx, event) in enumerate(zip(sfx_input_indices, valid_events)):
        delay_ms = int(event.timestamp * 1000)
        label = f"[sfx{i}]"
        filter_parts.append(
            f"[{idx}:a]volume={event.volume},"
            f"adelay={delay_ms}|{delay_ms}{label}"
        )
        mix_labels.append(label)

    n_inputs = len(mix_labels)
    if n_inputs == 1:
        # No additions — just copy audio
        filter_complex = "[0:a]acopy[out]"
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
        "-movflags", "+faststart",
        output_path,
    ]

    return cmd
