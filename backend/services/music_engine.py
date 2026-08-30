"""
Music Engine — AI-powered background music recommendation & sequential timeline placement.

Features:
- AI Semantic Analysis of script to recommend the ideal soundtrack & mood
- Sequential end-to-end timeline placement: music is re-added repeatedly until the video ends
- Final clip is trimmed cleanly at the exact end of the video
- Full metadata matching against emotional tone, genre, and acoustic profile
"""

import os
import re
import json
import random
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from models.schemas import AnalyzedSegment, MusicConfig, MusicClip, ContentTag, AnalyzeSettings, AIStyleProfile

_PROJECT_ROOT = Path(__file__).parent.parent.parent
_MUSIC_ROOT = _PROJECT_ROOT / "assets" / "music"
_META_PATH = _MUSIC_ROOT / "metadata.json"

# ---------------------------------------------------------------------------
# Semantic Genre & Mood Keywords
# ---------------------------------------------------------------------------
MOOD_KEYWORDS: Dict[str, List[str]] = {
    "dark_documentary": [
        "fortress", "mountain", "climb", "siege", "castle", "history", "medieval",
        "soldier", "army", "king", "sultan", "assassin", "kill", "death", "secret",
        "empire", "court", "guard", "shadow", "stone", "ruin", "ancient", "mystery",
        "investigation", "truth", "evidence", "conspiracy", "unsettling", "doctrine"
    ],
    "mysterious": [
        "simulation", "mandela effect", "matrix", "glitch", "universe", "parallel",
        "dimension", "anomaly", "strange", "paradox", "memory", "dream", "sleep",
        "drugged", "hallucination", "unconscious", "puzzle", "wonder", "hidden"
    ],
    "upbeat": [
        "success", "money", "millions", "growth", "build", "profit", "win", "achieve",
        "technology", "future", "viral", "hype", "fast", "speed", "energy", "power"
    ],
}


def _load_metadata() -> List[Dict[str, Any]]:
    if not _META_PATH.exists():
        return []
    try:
        with open(_META_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _get_audio_duration(file_path: Path) -> float:
    """Read duration in seconds using ffprobe."""
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


def _score_music_candidates(
    full_script_text: str,
    dominant_tag_mood: str,
    metadata: List[Dict[str, Any]],
) -> List[Tuple[float, Dict[str, Any]]]:
    """Score all candidate tracks based on script semantic keywords and metadata."""
    script_lower = full_script_text.lower()
    scored = []

    for cand in metadata:
        folder = cand.get("folder", "")
        filename = cand.get("filename", "")
        track_path = _MUSIC_ROOT / folder / filename
        if not track_path.is_file():
            continue

        score = 0.0
        # Accept both 'mood' (string) and 'moods' (list) from metadata
        raw_mood = cand.get("mood") or (cand.get("moods") or [None])[0] or folder
        cand_mood = raw_mood if isinstance(raw_mood, str) else folder

        # 1. Base mood alignment
        if cand_mood == dominant_tag_mood:
            score += 4.0

        # 2. Genre / keyword matching from script
        keywords = MOOD_KEYWORDS.get(cand_mood, [])
        for kw in keywords:
            if kw in script_lower:
                score += 1.2

        # 3. Specific track description & emotional tone matching
        desc = (
            cand.get("description", "")
            + " "
            + cand.get("emotional_tone", "")
            + " "
            + " ".join(cand.get("tags", []))
        ).lower()

        for word in re.findall(r"\w{4,}", script_lower):
            if word in desc:
                score += 0.3

        # Add small variation jitter
        score += random.uniform(0.1, 0.5)
        scored.append((score, cand))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored


def select_music(
    segments: List[AnalyzedSegment],
    settings: AnalyzeSettings,
    video_duration: float = 60.0,
    ai_style: Optional[AIStyleProfile] = None,
) -> Optional[MusicConfig]:
    """
    Select recommended background music via AI script style analysis,
    and place sequential repeated clips along the timeline until video ends.
    """
    if not settings.music_enabled:
        return None

    metadata = _load_metadata()
    full_script = " ".join(s.text for s in segments)

    # Determine dominant mood from AI Style Profile or segment tags
    if ai_style and ai_style.genre:
        dominant_mood = ai_style.genre
    else:
        mood_votes: Dict[str, int] = {}
        for seg in segments:
            if seg.tag in [ContentTag.GLITCH, ContentTag.QUESTION, ContentTag.DROP]:
                m = "mysterious"
            else:
                m = "dark_documentary"
            mood_votes[m] = mood_votes.get(m, 0) + 1
        dominant_mood = max(mood_votes, key=lambda k: mood_votes[k]) if mood_votes else "dark_documentary"

    # Effective intensity from AI style profile if present
    effective_intensity = ai_style.music_intensity if ai_style else settings.music_intensity

    # AI / Keyword scoring of music catalog against script
    scored_candidates = _score_music_candidates(full_script, dominant_mood, metadata)

    chosen_meta = None
    if scored_candidates:
        chosen_meta = scored_candidates[0][1]
    elif metadata:
        chosen_meta = metadata[0]

    if not chosen_meta:
        # Direct folder scan fallback
        for folder in _MUSIC_ROOT.iterdir():
            if folder.is_dir():
                files = list(folder.glob("*.wav")) + list(folder.glob("*.mp3"))
                if files:
                    rel_path = f"assets/music/{folder.name}/{files[0].name}"
                    track_dur = _get_audio_duration(files[0])
                    volume = round(0.08 + float(effective_intensity) * 0.12, 3)
                    # Build clips
                    clips = _build_sequential_clips(rel_path, files[0].stem, track_dur, video_duration, volume)
                    return MusicConfig(
                        track_path=rel_path,
                        volume=volume,
                        mood=ai_style.mood if ai_style else folder.name,
                        track_duration=track_dur,
                        clips=clips,
                    )
        return None

    folder = chosen_meta.get("folder", "dark_documentary")
    filename = chosen_meta.get("filename", "")
    rel_path = f"assets/music/{folder}/{filename}"
    track_path = _MUSIC_ROOT / folder / filename

    track_dur = chosen_meta.get("duration")
    if not track_dur or track_dur <= 0:
        track_dur = _get_audio_duration(track_path)
    track_dur = round(float(track_dur), 2)

    volume = round(0.08 + float(effective_intensity) * 0.12, 3)
    track_title = chosen_meta.get("id", filename)
    track_title = re.sub(r"^\w+_\d+_", "", track_title)
    track_title = re.sub(r"\.(wav|mp3)$", "", track_title).replace("_", " ")[:24].strip()

    # Build sequential timeline clips end-to-end
    clips = _build_sequential_clips(rel_path, track_title, track_dur, video_duration, volume)

    return MusicConfig(
        track_path=rel_path,
        volume=volume,
        mood=ai_style.mood if ai_style else chosen_meta.get("mood", folder),
        track_duration=track_dur,
        clips=clips,
    )


def _build_sequential_clips(
    track_path: str,
    track_title: str,
    track_duration: float,
    video_duration: float,
    volume: float,
) -> List[MusicClip]:
    """Generate sequential music clips repeating along the timeline until video ends."""
    clips: List[MusicClip] = []
    if track_duration <= 0:
        track_duration = 30.0

    current_start = 0.0
    clip_idx = 1
    target_len = max(video_duration, 1.0)

    while current_start < target_len:
        current_end = min(round(current_start + track_duration, 2), round(target_len, 2))
        clip_dur = round(current_end - current_start, 2)
        if clip_dur <= 0.05:
            break

        is_final = current_end >= target_len
        title_suffix = f" (Part {clip_idx})" + (" [CUT]" if is_final else "")

        clips.append(
            MusicClip(
                id=f"music-clip-{clip_idx}",
                start_sec=round(current_start, 2),
                end_sec=current_end,
                duration=clip_dur,
                track_path=track_path,
                title=f"{track_title}{title_suffix}",
                volume=volume,
            )
        )
        current_start = round(current_start + track_duration, 2)
        clip_idx += 1

    return clips
