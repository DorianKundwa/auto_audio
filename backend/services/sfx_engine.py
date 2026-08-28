"""
SFX Decision Engine — intelligent context-aware acoustic mapping.

Features:
- Semantic keyword & trigger matching based on subtitle text
- Anti-repetition recency memory (avoids repeating the same sound within 45s)
- Proximity scoring based on user intensity settings
- Accesses all 103+ categorized SFX audio assets across all subfolders
"""

import os
import json
import uuid
import random
import re
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple

from models.schemas import AnalyzedSegment, SFXEvent, ContentTag, AnalyzeSettings

# Root path to the assets directory (two levels up from services/)
_PROJECT_ROOT = Path(__file__).parent.parent.parent
_ASSETS_ROOT = _PROJECT_ROOT / "assets" / "sfx"
_META_PATH = _ASSETS_ROOT / "metadata.json"

# ---------------------------------------------------------------------------
# Tag → SFX type mapping
# ---------------------------------------------------------------------------
TAG_TO_SFX: Dict[ContentTag, Dict[str, Any]] = {
    ContentTag.REVEAL: {
        "sfx_type": "impact",
        "label": "IMPACT",
        "base_volume": 0.75,
        "offset_sec": 0.0,
        "emoji": "🔊",
    },
    ContentTag.HOOK: {
        "sfx_type": "riser",
        "label": "RISER",
        "base_volume": 0.60,
        "offset_sec": -2.0,
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
        "base_volume": 0.50,
        "offset_sec": 0.0,
        "emoji": "💨",
    },
    ContentTag.STAGE_TRANSITION: {
        "sfx_type": "transition",
        "label": "TRANSITION",
        "base_volume": 0.55,
        "offset_sec": -0.4,
        "emoji": "⚡",
    },
    ContentTag.QUESTION: {
        "sfx_type": "riser",
        "label": "TENSION SWELL",
        "base_volume": 0.45,
        "offset_sec": -1.2,
        "emoji": "🎵",
    },
    ContentTag.ENDING: {
        "sfx_type": "impact",
        "label": "FINAL IMPACT",
        "base_volume": 0.50,
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


SFX_FOLDERS: Dict[str, str] = {
    "impact": "impacts",
    "boom": "booms",
    "riser": "risers",
    "glitch": "glitches",
    "whoosh": "whooshes",
    "transition": "transitions",
    "heartbeat": "heartbeats",
    "silence": "silence",
    "click": "clicks",
    "upbeat": "upbeat",
}


def _load_metadata() -> List[Dict[str, Any]]:
    """Load SFX metadata catalog."""
    if not _META_PATH.exists():
        return []
    try:
        with open(_META_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _calculate_semantic_score(text: str, candidate: Dict[str, Any]) -> float:
    """Score how well a sound effect matches keywords in the subtitle text."""
    if not text:
        return 0.0

    text_lower = text.lower()
    score = 0.0

    # 1. Recommended triggers
    for trig in candidate.get("recommended_triggers", []):
        if trig.lower() in text_lower:
            score += 3.0

    # 2. Tags
    for tag in candidate.get("tags", []):
        if len(tag) > 3 and tag.lower() in text_lower:
            score += 1.5

    # 3. Acoustic / dramatic profile words
    profile = (candidate.get("dramatic_function", "") + " " + candidate.get("acoustic_profile", "")).lower()
    for word in re.findall(r"\w{4,}", text_lower):
        if word in profile:
            score += 0.5

    return score


def _pick_intelligent_sfx(
    sfx_type: str,
    text_cue: str,
    target_intensity: float,
    current_ts: float,
    recent_usage: Dict[str, float],
    metadata: List[Dict[str, Any]],
) -> Optional[Tuple[str, str]]:
    """
    Intelligently select the best matching SFX file for the context:
    - Contextual keyword relevance (+score)
    - Target intensity proximity (+score)
    - Anti-repetition penalty (penalizes recently used files)
    - Novelty bonus for unused files
    Returns (relative_file_path, display_label).
    """
    default_folder = SFX_FOLDERS.get(sfx_type, sfx_type + "s" if not sfx_type.endswith("s") else sfx_type)
    candidates = [m for m in metadata if m.get("type") == sfx_type]

    # If no metadata matches, fallback to scanning files in folder
    if not candidates:
        for f_name in [default_folder, sfx_type]:
            folder = _ASSETS_ROOT / f_name
            if folder.is_dir():
                files = list(folder.glob("*.wav")) + list(folder.glob("*.mp3"))
                if files:
                    # Random choice from folder
                    chosen = random.choice(files)
                    return f"assets/sfx/{f_name}/{chosen.name}", sfx_type.upper()
        return None

    # Score each candidate
    scored_candidates = []
    for cand in candidates:
        folder_name = cand.get("folder", default_folder)
        filename = cand.get("filename", "")
        rel_path = f"assets/sfx/{folder_name}/{filename}"

        # Verify physical file existence
        if not (_ASSETS_ROOT / folder_name / filename).is_file():
            continue

        # 1. Semantic score
        sem_score = _calculate_semantic_score(text_cue, cand)

        # 2. Intensity proximity score (0.0 to 2.0)
        cand_intensity = cand.get("intensity", 0.5)
        int_diff = abs(cand_intensity - target_intensity)
        int_score = max(0.0, 2.0 - int_diff * 3.0)

        # 3. Anti-repetition recency penalty (within 45s)
        recency_penalty = 0.0
        if rel_path in recent_usage:
            time_since_used = current_ts - recent_usage[rel_path]
            if time_since_used < 45.0:
                recency_penalty = (45.0 - time_since_used) * 0.25
        else:
            # Novelty bonus for fresh unplayed sound
            sem_score += 0.8

        # 4. Small jitter to avoid deterministic locks between equally good sounds
        jitter = random.uniform(0.0, 0.4)

        total_score = sem_score * 2.0 + int_score * 1.2 - recency_penalty + jitter
        scored_candidates.append((total_score, rel_path, cand))

    if not scored_candidates:
        return None

    # Sort descending by score
    scored_candidates.sort(key=lambda x: x[0], reverse=True)

    # Pick top scored candidate
    best_score, best_path, best_meta = scored_candidates[0]

    # Create descriptive label
    display_label = best_meta.get("filename", sfx_type.upper())
    # Clean up filename for display label
    display_label = re.sub(r"^\w+_\d+_", "", display_label)
    display_label = re.sub(r"\.(wav|mp3)$", "", display_label)
    display_label = display_label.replace("_", " ")[:22].strip().upper()
    if not display_label:
        display_label = sfx_type.upper()

    return best_path, display_label


def build_sfx_timeline(
    segments: List[AnalyzedSegment],
    settings: AnalyzeSettings,
    video_duration: float,
) -> List[SFXEvent]:
    """
    Convert analyzed segments into a dynamic, non-repetitive list of SFXEvent objects.

    Rules:
    - Minimum 2.2s gap between SFX events
    - Intelligent contextual sound selection (no repeating same sounds)
    - Timestamps clamped to [0, video_duration]
    """
    if not settings.sfx_enabled:
        return []

    metadata = _load_metadata()
    events: List[SFXEvent] = []
    last_sfx_time: float = -999.0
    MIN_GAP = 2.2  # minimum seconds between SFX events

    # Recency memory: {path: last_placed_timestamp}
    recent_usage: Dict[str, float] = {}

    for seg in segments:
        if seg.tag == ContentTag.NONE:
            continue

        sfx_cfg = TAG_TO_SFX.get(seg.tag)
        if not sfx_cfg:
            continue

        # Compute timestamp
        ts = seg.start_sec + sfx_cfg["offset_sec"]
        ts = max(0.0, min(ts, max(0.0, video_duration - 0.5)))

        # De-duplicate: skip if too close to previous event
        if ts - last_sfx_time < MIN_GAP:
            continue

        sfx_type = sfx_cfg["sfx_type"]
        picked = _pick_intelligent_sfx(
            sfx_type=sfx_type,
            text_cue=seg.text,
            target_intensity=float(settings.sfx_intensity),
            current_ts=ts,
            recent_usage=recent_usage,
            metadata=metadata,
        )

        if not picked:
            print(f"[sfx_engine] No file found for type '{sfx_type}', skipping.")
            continue

        sfx_path, sfx_label = picked
        recent_usage[sfx_path] = ts

        # Scale volume: base_volume * sfx_intensity
        volume = min(1.0, sfx_cfg["base_volume"] * (0.5 + float(settings.sfx_intensity)))

        events.append(
            SFXEvent(
                id=str(uuid.uuid4()),
                timestamp=round(ts, 3),
                tag=seg.tag,
                sfx_type=sfx_type,
                sfx_path=sfx_path,
                volume=round(volume, 3),
                label=sfx_label,
                text_snippet=seg.text[:80],
            )
        )
        last_sfx_time = ts

    # Sort chronologically
    events.sort(key=lambda e: e.timestamp)
    return events
