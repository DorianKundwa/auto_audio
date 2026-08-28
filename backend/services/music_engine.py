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

_MUSIC_ROOT = Path(__file__).parent.parent.parent / "assets" / "music"
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
    with open(_META_PATH, "r") as f:
        return json.load(f)


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

    # Filter by mood
    candidates = [m for m in metadata if mood in m.get("moods", [])]

    # Fallback: any track
    if not candidates:
        candidates = metadata

    # Fallback: scan filesystem
    if not candidates:
        for folder in _MUSIC_ROOT.iterdir():
            if folder.is_dir():
                files = list(folder.glob("*.wav")) + list(folder.glob("*.mp3"))
                if files:
                    return MusicConfig(
                        track_path=str(files[0]),
                        volume=round(0.08 + settings.music_intensity * 0.12, 3),
                        mood=folder.name,
                    )
        return None

    track_meta = random.choice(candidates)
    track_path = _MUSIC_ROOT / track_meta.get("folder", "") / track_meta["filename"]

    if not track_path.exists():
        return None

    # Volume: 8%–20% under the voice, scaled by music_intensity slider
    volume = round(0.08 + settings.music_intensity * 0.12, 3)

    return MusicConfig(
        track_path=str(track_path),
        volume=volume,
        mood=mood,
    )
