"""
Music Engine — selects background music based on dominant content mood.

Reads assets/music/metadata.json and picks the best matching track.
Falls back to the first available track if mood doesn't match.
"""

import json
import random
from pathlib import Path
from typing import List, Dict, Any, Optional

from models.schemas import AnalyzedSegment, MusicConfig, ContentTag, AnalyzeSettings

_PROJECT_ROOT = Path(__file__).parent.parent.parent
_MUSIC_ROOT = _PROJECT_ROOT / "assets" / "music"
_META_PATH = _MUSIC_ROOT / "metadata.json"

# ---------------------------------------------------------------------------
# Tag → mood mapping
# ---------------------------------------------------------------------------
TAG_MOOD: Dict[ContentTag, str] = {
    ContentTag.GLITCH: "mysterious",
    ContentTag.REVEAL: "dark_documentary",
    ContentTag.HOOK: "dark_documentary",
    ContentTag.CLIMAX: "dark_documentary",
    ContentTag.STAGE_TRANSITION: "dark_documentary",
    ContentTag.QUESTION: "mysterious",
    ContentTag.CONTRAST: "dark_documentary",
    ContentTag.ENDING: "dark_documentary",
    ContentTag.DROP: "mysterious",
    ContentTag.NONE: "dark_documentary",
}


def _load_metadata() -> List[Dict[str, Any]]:
    if not _META_PATH.exists():
        return []
    try:
        with open(_META_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _dominant_mood(segments: List[AnalyzedSegment]) -> str:
    """Vote on the most common mood based on segment tags."""
    mood_votes: Dict[str, int] = {}
    for seg in segments:
        mood = TAG_MOOD.get(seg.tag, "dark_documentary")
        mood_votes[mood] = mood_votes.get(mood, 0) + 1
    if not mood_votes:
        return "dark_documentary"
    return max(mood_votes, key=lambda k: mood_votes[k])


def select_music(
    segments: List[AnalyzedSegment],
    settings: AnalyzeSettings,
) -> Optional[MusicConfig]:
    """Select a background music track and compute playback volume."""
    if not settings.music_enabled:
        return None

    mood = _dominant_mood(segments)
    metadata = _load_metadata()

    # Filter by mood or folder
    candidates = [
        m for m in metadata
        if m.get("mood") == mood or mood in m.get("moods", []) or m.get("folder") == mood
    ]

    # Fallback: any track
    if not candidates:
        candidates = metadata

    if candidates:
        random.shuffle(candidates)
        for cand in candidates:
            folder = cand.get("folder", "")
            filename = cand.get("filename", "")
            track_path = _MUSIC_ROOT / folder / filename
            if track_path.is_file():
                # Store relative to project root
                rel_path = f"assets/music/{folder}/{filename}"
                volume = round(0.08 + float(settings.music_intensity) * 0.12, 3)
                return MusicConfig(
                    track_path=rel_path,
                    volume=volume,
                    mood=mood,
                )

    # Absolute fallback: scan filesystem directly
    for folder in _MUSIC_ROOT.iterdir():
        if folder.is_dir():
            files = list(folder.glob("*.wav")) + list(folder.glob("*.mp3"))
            if files:
                rel_path = f"assets/music/{folder.name}/{files[0].name}"
                volume = round(0.08 + float(settings.music_intensity) * 0.12, 3)
                return MusicConfig(
                    track_path=rel_path,
                    volume=volume,
                    mood=folder.name,
                )

    return None
