"""
SFX Decision Engine — maps ContentTag → SFX WAV file + timing parameters.

Design principles:
- Each SFX type maps to a folder in assets/sfx/
- metadata.json describes every file (intensity, mood, duration)
- The engine picks the best matching file based on sfx_intensity slider
- Placeholder files can be replaced by real SFX at any time without code changes
"""

import os
import json
import uuid
import random
from pathlib import Path
from typing import List, Optional, Dict, Any

from models.schemas import AnalyzedSegment, SFXEvent, ContentTag, AnalyzeSettings

# Root path to the assets directory (two levels up from services/)
_ASSETS_ROOT = Path(__file__).parent.parent.parent / "assets" / "sfx"
_META_PATH = _ASSETS_ROOT / "metadata.json"

# ---------------------------------------------------------------------------
# Tag → SFX type mapping
# ---------------------------------------------------------------------------
TAG_TO_SFX: Dict[ContentTag, Dict[str, Any]] = {
    ContentTag.REVEAL: {
        "sfx_type": "impact",
        "label": "IMPACT",
        "base_volume": 0.75,
        "offset_sec": 0.0,          # play at exact segment start
        "emoji": "🔊",
    },
    ContentTag.HOOK: {
        "sfx_type": "riser",
        "label": "RISER",
        "base_volume": 0.55,
        "offset_sec": -2.5,         # riser starts 2.5s before the line
        "emoji": "🎵",
    },
    ContentTag.CLIMAX: {
        "sfx_type": "boom",
        "label": "BOOM",
        "base_volume": 0.85,
        "offset_sec": 0.0,
        "emoji": "💥",
    },
    ContentTag.GLITCH: {
        "sfx_type": "glitch",
        "label": "GLITCH",
        "base_volume": 0.65,
        "offset_sec": 0.0,
        "emoji": "⚡",
    },
    ContentTag.CONTRAST: {
        "sfx_type": "whoosh",
        "label": "WHOOSH",
        "base_volume": 0.45,
        "offset_sec": 0.0,
        "emoji": "💨",
    },
    ContentTag.STAGE_TRANSITION: {
        "sfx_type": "transition",
        "label": "TRANSITION",
        "base_volume": 0.50,
        "offset_sec": -0.5,
        "emoji": "⚡",
    },
    ContentTag.QUESTION: {
        "sfx_type": "riser",
        "label": "RISER",
        "base_volume": 0.40,
        "offset_sec": -1.5,
        "emoji": "🎵",
    },
    ContentTag.ENDING: {
        "sfx_type": "impact",
        "label": "SOFT IMPACT",
        "base_volume": 0.45,
        "offset_sec": 0.0,
        "emoji": "🔊",
    },
    ContentTag.DROP: {
        "sfx_type": "silence",
        "label": "DROP",
        "base_volume": 0.30,
        "offset_sec": 0.0,
        "emoji": "🔇",
    },
}


def _load_metadata() -> List[Dict[str, Any]]:
    """Load SFX metadata catalog. Returns empty list if not yet generated."""
    if not _META_PATH.exists():
        return []
    with open(_META_PATH, "r") as f:
        return json.load(f)


def _pick_sfx_file(sfx_type: str, intensity: float, metadata: List[Dict]) -> Optional[str]:
    """
    Pick the best SFX file for the given type and target intensity.
    Prefers files whose intensity is closest to the target.
    Falls back to any file of the right type.
    """
    candidates = [m for m in metadata if m.get("type") == sfx_type]
    if not candidates:
        # Try filesystem scan as fallback
        folder = _ASSETS_ROOT / sfx_type
        if folder.exists():
            files = list(folder.glob("*.wav")) + list(folder.glob("*.mp3"))
            return str(files[0]) if files else None
        return None

    # Sort by intensity proximity
    candidates.sort(key=lambda m: abs(m.get("intensity", 0.5) - intensity))
    chosen = candidates[0]
    path = _ASSETS_ROOT / sfx_type / chosen["filename"]
    return str(path) if path.exists() else None


def build_sfx_timeline(
    segments: List[AnalyzedSegment],
    settings: AnalyzeSettings,
    video_duration: float,
) -> List[SFXEvent]:
    """
    Convert analyzed segments into a list of SFXEvent objects.

    Rules:
    - Only one SFX within any 3-second window (de-duplicate nearby hits)
    - Volume scales with sfx_intensity slider
    - Timestamps clamped to [0, video_duration]
    """
    if not settings.sfx_enabled:
        return []

    metadata = _load_metadata()
    events: List[SFXEvent] = []
    last_sfx_time: float = -999.0
    MIN_GAP = 3.0  # minimum seconds between SFX events

    for seg in segments:
        if seg.tag == ContentTag.NONE:
            continue

        sfx_cfg = TAG_TO_SFX.get(seg.tag)
        if not sfx_cfg:
            continue

        # Compute timestamp
        ts = seg.start_sec + sfx_cfg["offset_sec"]
        ts = max(0.0, min(ts, video_duration - 0.5))

        # De-duplicate: skip if too close to previous event
        if ts - last_sfx_time < MIN_GAP:
            continue

        sfx_type = sfx_cfg["sfx_type"]
        sfx_path = _pick_sfx_file(sfx_type, settings.sfx_intensity, metadata)
        if not sfx_path:
            print(f"[sfx_engine] No file found for type '{sfx_type}', skipping.")
            continue

        # Scale volume: base_volume * sfx_intensity (clamped)
        volume = min(1.0, sfx_cfg["base_volume"] * (0.5 + settings.sfx_intensity))

        events.append(
            SFXEvent(
                id=str(uuid.uuid4()),
                timestamp=round(ts, 3),
                tag=seg.tag,
                sfx_type=sfx_type,
                sfx_path=sfx_path,
                volume=round(volume, 3),
                label=sfx_cfg["label"],
                text_snippet=seg.text[:80],
            )
        )
        last_sfx_time = ts

    # Sort chronologically
    events.sort(key=lambda e: e.timestamp)
    return events
