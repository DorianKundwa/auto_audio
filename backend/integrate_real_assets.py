#!/usr/bin/env python3
"""
integrate_real_assets.py
========================
Scans the two real asset folders and maps every file to the correct SFX type
and music mood based on filename keywords.

Then:
  1. Copies the best-matched files into assets/sfx/{type}/ and assets/music/{mood}/
  2. Rebuilds assets/sfx/metadata.json and assets/music/metadata.json

Run from project root:
    python backend/integrate_real_assets.py
"""

import os
import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional

ROOT         = Path(__file__).parent.parent
SFX_SRC      = ROOT / "assets" / "SFX Sound Effects"
MUSIC_SRC    = ROOT / "assets" / "music_" / "Articulated--Starter_Pack--Sounds"
SFX_DST_ROOT = ROOT / "assets" / "sfx"
MUS_DST_ROOT = ROOT / "assets" / "music"

# ---------------------------------------------------------------------------
# SFX mapping: keyword (lowercase, substring match) -> canonical sfx_type
# Priority order: first match wins.
# ---------------------------------------------------------------------------
SFX_MAP = [
    # --- impacts (heavy hits, booms, crashes) ---
    ("impact",          "impact"),
    ("01 boom",         "boom"),
    ("02 deep",         "boom"),
    ("03 grand hit",    "boom"),
    ("04 grand hit",    "boom"),
    ("big cinematic",   "boom"),
    ("space impact",    "boom"),
    ("heavy object hit","boom"),
    ("cinematic impact","boom"),
    ("universe boom",   "boom"),
    ("boom",            "boom"),
    ("11 universe",     "boom"),
    ("12 universe",     "boom"),
    ("01 evolve_brassy swell","boom"),
    ("02 evolve_brassy drop", "boom"),
    ("03 evolve_boom",  "boom"),
    ("04 evolve_boom",  "boom"),
    ("05 evolve_boom",  "boom"),
    ("06 evolve_boom",  "boom"),
    ("metal slam",      "impact"),
    ("incoming crash",  "impact"),
    ("punch",           "impact"),
    ("hit 1",           "impact"),
    ("bone breaking",   "impact"),
    ("subsonic",        "impact"),
    ("dark drop",       "impact"),
    ("drop disto",      "impact"),
    ("bass drop",       "impact"),
    ("struck down",     "impact"),
    ("09 struck",       "impact"),
    ("glass shatter",   "impact"),
    ("cinematic glass", "impact"),
    ("earth impact",    "impact"),   # from Articulated pack

    # --- risers (tension builders, swells, build-ups) ---
    ("riser",           "riser"),
    ("build",           "riser"),
    ("swell",           "riser"),
    ("ascend",          "riser"),
    ("rise",            "riser"),
    ("01 beating",      "riser"),
    ("sudden suspense", "riser"),
    ("dsgneerie",       "riser"),
    ("dsgnrise",        "riser"),
    ("dsgnethr",        "riser"),
    ("dsgndron",        "riser"),
    ("upset pulses",    "riser"),
    ("evolve_riser",    "riser"),

    # --- glitches (digital, sci-fi, error, glitch) ---
    ("glitch",          "glitch"),
    ("sci fi",          "glitch"),
    ("scifi",           "glitch"),
    ("hacking",         "glitch"),
    ("digital count",   "glitch"),
    ("terminal",        "glitch"),
    ("18 termainal",    "glitch"),
    ("02 dial-up",      "glitch"),
    ("01 processing",   "glitch"),
    ("04 erased",       "glitch"),
    ("05 reboot",       "glitch"),
    ("06 portal",       "glitch"),
    ("07 line break",   "glitch"),
    ("08 rewinding",    "glitch"),
    ("09 data",         "glitch"),
    ("10 access denied","glitch"),
    ("11 access granted","glitch"),
    ("12 intermod",     "glitch"),
    ("13 restart",      "glitch"),
    ("14 disc",         "glitch"),
    ("15 fast forward", "glitch"),
    ("16 network",      "glitch"),
    ("17 disconnected", "glitch"),
    ("19 download",     "glitch"),
    ("ui data",         "glitch"),
    ("electricity",     "glitch"),
    ("warping",         "glitch"),
    ("in and out zoom", "glitch"),
    ("robt",            "glitch"),  # Robot sounds from Articulated

    # --- whooshes (air, swoosh, swipe, transition whoosh) ---
    ("whoosh",          "whoosh"),
    ("swoosh",          "whoosh"),
    ("swish",           "whoosh"),
    ("swipe",           "whoosh"),
    ("whsh",            "whoosh"),   # Articulated prefix
    ("rm whoosh",       "whoosh"),
    ("es_jump swish",   "whoosh"),
    ("es_riser suction","whoosh"),
    ("rake swing",      "whoosh"),
    ("air whoosh",      "whoosh"),
    ("wind swoosh",     "whoosh"),
    ("cinematic wind",  "whoosh"),
    ("transition wind", "whoosh"),
    ("cinematic trans", "whoosh"),
    ("short transition","whoosh"),
    ("short whoosh",    "whoosh"),
    ("fast whoosh",     "whoosh"),
    ("long whoosh",     "whoosh"),
    ("lens flare trans","whoosh"),
    ("tape rewind",     "whoosh"),
    ("clean-fast-swoosh","whoosh"),
    ("swinging-staff",  "whoosh"),
    ("folymisc",        "whoosh"),   # Articulated foley whoosh branches

    # --- transitions (flashback, rewind, cinematic cut) ---
    ("flashback",       "transition"),
    ("fast forward sound","transition"),
    ("projector",       "transition"),
    ("10 evolve_riser", "transition"),
    ("29 swing",        "transition"),
    ("magspel",         "transition"),  # Articulated magic teleport

    # --- silence / drops ---
    ("10 dark drop",    "silence"),
    ("drop disto sub",  "silence"),

    # --- heartbeats / tension ---
    ("01 beating",      "heartbeat"),
    ("heartbeat",       "heartbeat"),
    ("clock tick",      "heartbeat"),
    ("clock ticking",   "heartbeat"),
]

# ---------------------------------------------------------------------------
# Music mapping: keyword -> mood folder
# ---------------------------------------------------------------------------
MUSIC_MAP = [
    # Dark documentary — tense, cinematic, dramatic
    ("dsgn",            "dark_documentary"),
    ("dsgneerie",       "dark_documentary"),
    ("dsgnrise",        "dark_documentary"),
    ("dsgnethr",        "dark_documentary"),
    ("dsgndron",        "dark_documentary"),
    ("dsgndram",        "dark_documentary"),   # if exists
    ("dsgmbram",        "dark_documentary"),
    ("crwd",            "dark_documentary"),
    ("wind",            "dark_documentary"),
    ("spooky",          "dark_documentary"),
    ("eerie",           "dark_documentary"),
    ("ghost",           "dark_documentary"),
    ("ghosts",          "dark_documentary"),
    ("howl",            "dark_documentary"),
    ("polar wind",      "dark_documentary"),
    ("podcast background","dark_documentary"),
    ("mixkit-driving",  "dark_documentary"),
    ("mixkit-eyes",     "dark_documentary"),
    ("mixkit-purple",   "dark_documentary"),
    ("mixkit-trap",     "dark_documentary"),
    ("mixkit-we-own",   "dark_documentary"),
    ("mixkit-zay",      "dark_documentary"),
    ("sprtwntr",        "dark_documentary"),   # ice sounds -> moody
    ("watrf",           "dark_documentary"),   # water ambience

    # Mysterious — otherworldly, magical, sci-fi
    ("magic",           "mysterious"),
    ("magshim",         "mysterious"),
    ("magspel",         "mysterious"),
    ("mag ",            "mysterious"),
    ("expl",            "mysterious"),
    ("fire",            "mysterious"),
    ("creatur",         "mysterious"),
    ("crea",            "mysterious"),
    ("creat",           "mysterious"),
    ("creature",        "mysterious"),
    ("monster",         "mysterious"),
    ("robt",            "mysterious"),
    ("dino",            "mysterious"),
    ("musc",            "mysterious"),   # double bass
    ("geofuma",         "mysterious"),
    ("rock crsh",       "mysterious"),
    ("veget",           "mysterious"),
    ("mixkit-space",    "mysterious"),
    ("mixkit-electricity","mysterious"),

    # Upbeat — energetic, positive, notification
    ("good-idea",       "upbeat"),
    ("quick-win",       "upbeat"),
    ("ding",            "upbeat"),
    ("mario",           "upbeat"),
    ("cash register",   "upbeat"),
    ("applause",        "upbeat"),
    ("notification",    "upbeat"),
    ("party",           "upbeat"),
    ("mixkit-21",       "upbeat"),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_duration(path: str) -> float:
    """Get audio duration using ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, timeout=10
        )
        return round(float(result.stdout.strip()), 2)
    except Exception:
        return 0.0


def classify_sfx(name: str) -> Optional[str]:
    n = name.lower()
    for keyword, sfx_type in SFX_MAP:
        if keyword in n:
            return sfx_type
    return None


def classify_music(name: str) -> Optional[str]:
    n = name.lower()
    for keyword, mood in MUSIC_MAP:
        if keyword in n:
            return mood
    return None


def safe_stem(name: str) -> str:
    """Shorten long filename stems for readability."""
    stem = Path(name).stem[:60].strip()
    # Replace problematic chars
    for ch in r'\/:*?"<>|':
        stem = stem.replace(ch, "_")
    return stem


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("\n=== Auto Audio: Real Asset Integration ===\n")

    sfx_catalog = []
    music_catalog = []

    # --- Process SFX Sound Effects folder ---
    print(f"Scanning: {SFX_SRC}")
    sfx_by_type: dict = {}
    audio_extensions = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"}

    for f in sorted(SFX_SRC.rglob("*")):
        if f.suffix.lower() not in audio_extensions:
            continue
        sfx_type = classify_sfx(f.name)
        if sfx_type:
            sfx_by_type.setdefault(sfx_type, []).append(f)

    # Copy into assets/sfx/{type}/
    for sfx_type, files in sfx_by_type.items():
        # Map type -> correct folder name (matches what sfx_engine.py looks up)
        folder_map = {
            "impact":     "impacts",
            "boom":       "booms",
            "riser":      "risers",
            "glitch":     "glitches",
            "whoosh":     "whooshes",
            "heartbeat":  "heartbeats",
            "silence":    "silence",
            "transition": "transitions",
        }
        folder_name = folder_map.get(sfx_type, sfx_type + "s")
        dst_dir = SFX_DST_ROOT / folder_name
        dst_dir.mkdir(parents=True, exist_ok=True)

        # Sort by name; take up to 5 variants per type
        files = sorted(files, key=lambda f: f.name)[:5]

        for i, src in enumerate(files, 1):
            ext = src.suffix.lower()
            dst_name = f"{sfx_type}_{i:02d}_real{ext}"
            dst = dst_dir / dst_name

            if not dst.exists():
                shutil.copy2(src, dst)
                print(f"  [SFX] {sfx_type:12} <- {src.name[:55]}")
            else:
                print(f"  [SFX] skip (exists): {dst.name}")

            dur = get_duration(str(dst))
            sfx_catalog.append({
                "filename": dst_name,
                "type": sfx_type,
                "intensity": round(0.5 + i * 0.08, 2),
                "duration": dur,
                "mood": ["real"],
                "placeholder": False,
                "source": src.name[:80],
            })

    # --- Process Articulated music_ folder ---
    print(f"\nScanning: {MUSIC_SRC}")
    music_by_mood: dict = {}

    for f in sorted(MUSIC_SRC.rglob("*")):
        if f.suffix.lower() not in audio_extensions:
            continue
        mood = classify_music(f.name)
        if mood:
            music_by_mood.setdefault(mood, []).append(f)

    # Also scan root of music_ for mp3/wav files
    for f in sorted((ROOT / "assets" / "music_").glob("*")):
        if f.suffix.lower() not in audio_extensions:
            continue
        mood = classify_music(f.name)
        if mood:
            music_by_mood.setdefault(mood, []).append(f)

    # Also scan SFX folder for music-tagged files
    for f in sorted(SFX_SRC.rglob("*")):
        if f.suffix.lower() not in audio_extensions:
            continue
        mood = classify_music(f.name)
        if mood:
            music_by_mood.setdefault(mood, []).append(f)

    for mood, files in music_by_mood.items():
        dst_dir = MUS_DST_ROOT / mood
        dst_dir.mkdir(parents=True, exist_ok=True)

        files = sorted(files, key=lambda f: f.name)[:6]

        for i, src in enumerate(files, 1):
            ext = src.suffix.lower()
            dst_name = f"{mood}_{i:02d}_real{ext}"
            dst = dst_dir / dst_name

            if not dst.exists():
                shutil.copy2(src, dst)
                print(f"  [MUS] {mood:20} <- {src.name[:45]}")
            else:
                print(f"  [MUS] skip (exists): {dst.name}")

            dur = get_duration(str(dst))
            music_catalog.append({
                "filename": dst_name,
                "folder": mood,
                "moods": [mood],
                "duration": dur,
                "placeholder": False,
                "source": src.name[:80],
            })

    # --- Merge with existing placeholder entries ---
    existing_sfx = []
    sfx_meta_path = SFX_DST_ROOT / "metadata.json"
    if sfx_meta_path.exists():
        with open(sfx_meta_path) as f:
            existing_sfx = json.load(f)

    # Keep placeholders that don't have a real replacement for their type
    real_types = {e["type"] for e in sfx_catalog}
    kept_placeholders_sfx = [e for e in existing_sfx
                              if e.get("placeholder") and e["type"] not in real_types]
    final_sfx = sfx_catalog + kept_placeholders_sfx

    existing_music = []
    mus_meta_path = MUS_DST_ROOT / "metadata.json"
    if mus_meta_path.exists():
        with open(mus_meta_path) as f:
            existing_music = json.load(f)

    real_moods = {e["folder"] for e in music_catalog}
    kept_placeholders_music = [e for e in existing_music
                                if e.get("placeholder") and e["folder"] not in real_moods]
    final_music = music_catalog + kept_placeholders_music

    # Write catalogs
    with open(sfx_meta_path, "w") as f:
        json.dump(final_sfx, f, indent=2)
    print(f"\n[OK] SFX metadata -> {sfx_meta_path.relative_to(ROOT)} ({len(final_sfx)} entries)")

    with open(mus_meta_path, "w") as f:
        json.dump(final_music, f, indent=2)
    print(f"[OK] Music metadata -> {mus_meta_path.relative_to(ROOT)} ({len(final_music)} entries)")

    # Summary
    print("\n=== Integration Summary ===")
    print(f"  SFX types populated : {sorted(real_types)}")
    print(f"  Music moods populated: {sorted(real_moods)}")
    print(f"  Total SFX entries   : {len(final_sfx)}")
    print(f"  Total music entries : {len(final_music)}")
    print("\nDone! Restart the backend to pick up all changes.\n")


if __name__ == "__main__":
    main()
