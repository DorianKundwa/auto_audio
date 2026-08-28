#!/usr/bin/env python3
"""
integrate_real_assets.py
========================
Scans real asset folders and maps every audio file to the correct SFX type
and music mood based on filename keywords and heuristics.

Then:
  1. Copies categorized files into assets/sfx/{folder}/ and assets/music/{mood}/
  2. Rebuilds assets/sfx/metadata.json and assets/music/metadata.json with full metadata

Run from project root:
    python backend/integrate_real_assets.py
"""

import os
import re
import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional, List, Dict, Any

ROOT = Path(__file__).parent.parent
SFX_SRC = ROOT / "assets" / "SFX Sound Effects"
MUSIC_SRC = ROOT / "assets" / "music_"
SFX_DST_ROOT = ROOT / "assets" / "sfx"
MUS_DST_ROOT = ROOT / "assets" / "music"

# ---------------------------------------------------------------------------
# SFX Folder Mapping
# ---------------------------------------------------------------------------
SFX_FOLDER_MAP = {
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

# ---------------------------------------------------------------------------
# SFX Classification Rules (priority order: first match wins)
# ---------------------------------------------------------------------------
SFX_MAP = [
    # --- booms (deep low-end impacts, bass drops, subsonics) ---
    ("01 boom", "boom"),
    ("02 deep", "boom"),
    ("03 grand hit", "boom"),
    ("04 grand hit", "boom"),
    ("big cinematic", "boom"),
    ("space impact", "boom"),
    ("universe boom", "boom"),
    ("11 universe", "boom"),
    ("12 universe", "boom"),
    ("01 evolve_brassy swell", "boom"),
    ("02 evolve_brassy drop", "boom"),
    ("03 evolve_boom", "boom"),
    ("04 evolve_boom", "boom"),
    ("05 evolve_boom", "boom"),
    ("06 evolve_boom", "boom"),
    ("bass drop", "boom"),
    ("subsonic", "boom"),
    ("boom sound", "boom"),
    ("boom-geomorphism", "boom"),
    ("boom", "boom"),

    # --- impacts (sharp hits, punches, body impacts, glass shatters) ---
    ("cinematic impact", "impact"),
    ("earth impact", "impact"),
    ("heavy object hit", "impact"),
    ("metal slam", "impact"),
    ("incoming crash", "impact"),
    ("struck down", "impact"),
    ("09 struck", "impact"),
    ("05 impact", "impact"),
    ("glass shatter", "impact"),
    ("cinematic glass", "impact"),
    ("wine glass shatter", "impact"),
    ("bone breaking", "impact"),
    ("punch", "impact"),
    ("hit 1", "impact"),
    ("splat", "impact"),
    ("metal-hit", "impact"),
    ("minecraft hurt", "impact"),
    ("racks", "impact"),
    ("impact", "impact"),

    # --- risers (tension builds, ascending sweeps, suction) ---
    ("riser", "riser"),
    ("build-up", "riser"),
    ("ascending sound", "riser"),
    ("sudden suspense", "riser"),
    ("evolve_riser", "riser"),
    ("es_riser suction", "riser"),
    ("upset pulses", "riser"),
    ("woosh-building", "riser"),
    ("dsgnrise", "riser"),
    ("dsgneerie", "riser"),
    ("dsgnethr", "riser"),
    ("dsgndron", "riser"),

    # --- glitches (digital UI, tech errors, dial-up, data) ---
    ("glitch", "glitch"),
    ("dial-up", "glitch"),
    ("01 processing", "glitch"),
    ("04 erased", "glitch"),
    ("05 reboot", "glitch"),
    ("06 portal", "glitch"),
    ("07 line break", "glitch"),
    ("08 rewinding", "glitch"),
    ("09 data", "glitch"),
    ("10 access denied", "glitch"),
    ("11 access granted", "glitch"),
    ("12 intermod", "glitch"),
    ("13 restart", "glitch"),
    ("14 disc", "glitch"),
    ("16 network", "glitch"),
    ("17 disconnected", "glitch"),
    ("18 termainal", "glitch"),
    ("terminal", "glitch"),
    ("19 download", "glitch"),
    ("sci fi ui", "glitch"),
    ("scifi", "glitch"),
    ("sci fi", "glitch"),
    ("hacking", "glitch"),
    ("digital count", "glitch"),
    ("display digits", "glitch"),
    ("windows xp error", "glitch"),
    ("censor beep", "glitch"),
    ("censorship", "glitch"),
    ("electricity", "glitch"),
    ("static power", "glitch"),
    ("discord_leave", "glitch"),
    ("wrong answer", "glitch"),
    ("tech button", "glitch"),
    ("robt", "glitch"),

    # --- transitions (swipes, scene cuts, flashbacks, rewinds) ---
    ("camera shot flash", "transition"),
    ("camera shutter", "transition"),
    ("camera-shutter", "transition"),
    ("shutter click", "transition"),
    ("projector", "transition"),
    ("fast forward", "transition"),
    ("tape rewind", "transition"),
    ("flashback", "transition"),
    ("29 swing", "transition"),
    ("short transition", "transition"),
    ("lens flare trans", "transition"),
    ("in-and-out-zoom", "transition"),
    ("warping-slide", "transition"),
    ("cutscene", "transition"),
    ("magspel", "transition"),
    ("magshim", "transition"),

    # --- whooshes (air swooshes, staff swings, wind swipes) ---
    ("clean-fast-swoosh", "whoosh"),
    ("es_jump swish", "whoosh"),
    ("fast whoosh", "whoosh"),
    ("long whoosh", "whoosh"),
    ("short whoosh", "whoosh"),
    ("rake swing", "whoosh"),
    ("swinging-staff", "whoosh"),
    ("whoosh fire", "whoosh"),
    ("rm whoosh", "whoosh"),
    ("arrow-whoosh", "whoosh"),
    ("arrow sounds", "whoosh"),
    ("swoosh", "whoosh"),
    ("swish", "whoosh"),
    ("swipes", "whoosh"),
    ("whoosh", "whoosh"),
    ("woosh", "whoosh"),
    ("folymisc", "whoosh"),

    # --- heartbeats & tension pulses ---
    ("01 beating", "heartbeat"),
    ("clock tick", "heartbeat"),
    ("clock-tick", "heartbeat"),
    ("heartbeat", "heartbeat"),

    # --- drops / silence ---
    ("10 dark drop", "silence"),
    ("drop disto", "silence"),

    # --- clicks & foley (UI interactions, typing, paper) ---
    ("mouse click", "click"),
    ("mouse-click", "click"),
    ("click", "click"),
    ("keyboard", "click"),
    ("typewriter", "click"),
    ("paper", "click"),
    ("pencil", "click"),
    ("writing", "click"),
    ("pop 1", "click"),
    ("pop 9", "click"),
    ("pop bubble", "click"),
    ("pop sound", "click"),
    ("pop up", "click"),
    ("pop.mp3", "click"),
    ("bloop", "click"),
    ("suction pop", "click"),
    ("game menu", "click"),
    ("animal crossing menu", "click"),

    # --- upbeat / rewards / accents ---
    ("cash register", "upbeat"),
    ("cash ting", "upbeat"),
    ("cash-register", "upbeat"),
    ("mario coin", "upbeat"),
    ("apple notification", "upbeat"),
    ("new idea notification", "upbeat"),
    ("notification", "upbeat"),
    ("applause", "upbeat"),
    ("good-idea", "upbeat"),
    ("quick-win", "upbeat"),
    ("ding", "upbeat"),
    ("correct sfx", "upbeat"),
    ("party horn", "upbeat"),
    ("kids yeyy", "upbeat"),
    ("boxing bell", "upbeat"),
    ("message sound", "upbeat"),
    ("iphone receive", "upbeat"),
    ("iphone send", "upbeat"),
    ("discord_join", "upbeat"),
    ("mixkit-21", "upbeat"),
]

# ---------------------------------------------------------------------------
# Music Mood Mapping
# ---------------------------------------------------------------------------
MUSIC_MAP = [
    # Dark documentary — cinematic, dramatic, tension, ambient pads
    ("podcast background", "dark_documentary"),
    ("mixkit-driving", "dark_documentary"),
    ("mixkit-eyes", "dark_documentary"),
    ("mixkit-purple", "dark_documentary"),
    ("mixkit-trap", "dark_documentary"),
    ("mixkit-we-own", "dark_documentary"),
    ("mixkit-zay", "dark_documentary"),
    ("cinematic sounds", "dark_documentary"),
    ("spooky wind", "dark_documentary"),
    ("dsgn", "dark_documentary"),
    ("eerie", "dark_documentary"),
    ("ghost", "dark_documentary"),
    ("ambforst", "dark_documentary"),
    ("ambmisc", "dark_documentary"),
    ("ambpubl", "dark_documentary"),
    ("ambrest", "dark_documentary"),
    ("ambrlgn", "dark_documentary"),
    ("ambrurl", "dark_documentary"),
    ("ambsea", "dark_documentary"),
    ("ambsprt", "dark_documentary"),
    ("ambswmp", "dark_documentary"),
    ("ambundr", "dark_documentary"),
    ("amburbn", "dark_documentary"),
    ("rainvege", "dark_documentary"),
    ("watrfall", "dark_documentary"),
    ("watrflow", "dark_documentary"),
    ("winddsgn", "dark_documentary"),
    ("windgust", "dark_documentary"),
    ("crwdbatl", "dark_documentary"),

    # Mysterious — otherworldly, creatures, magical, eerie
    ("creadino", "mysterious"),
    ("creaethr", "mysterious"),
    ("creatur", "mysterious"),
    ("anmlwild", "mysterious"),
    ("anmlcat", "mysterious"),
    ("birdfowl", "mysterious"),
    ("boatmech", "mysterious"),
    ("chemacid", "mysterious"),
    ("belllrg", "mysterious"),
    ("mag", "mysterious"),
    ("expl", "mysterious"),
    ("geofuma", "mysterious"),
    ("rock crsh", "mysterious"),
    ("mixkit-space", "mysterious"),

    # Upbeat — energetic, positive
    ("applause", "upbeat"),
    ("notification", "upbeat"),
    ("cash", "upbeat"),
    ("good-idea", "upbeat"),
    ("quick-win", "upbeat"),
]


def get_duration(path: str) -> float:
    """Get audio duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            capture_output=True,
            text=True,
            timeout=10,
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


def sanitize_filename(name: str) -> str:
    """Create a safe filesystem stem."""
    stem = Path(name).stem
    stem = re.sub(r'[\\/*?:"<>|]', "", stem)
    stem = re.sub(r"\s+", "_", stem).strip("_")
    return stem[:50]


def main():
    print("\n=== Auto Audio: Comprehensive Real Asset Integration ===\n")

    audio_extensions = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"}

    sfx_catalog: List[Dict[str, Any]] = []
    music_catalog: List[Dict[str, Any]] = []

    # -----------------------------------------------------------------------
    # 1. Scan and Integrate SFX
    # -----------------------------------------------------------------------
    print(f"Scanning SFX source: {SFX_SRC}")
    sfx_by_type: Dict[str, List[Path]] = {}

    all_sfx_sources = list(SFX_SRC.rglob("*")) if SFX_SRC.exists() else []
    if MUSIC_SRC.exists():
        # Also check music_ folder for SFX elements (creatures, foley, etc.)
        all_sfx_sources += list(MUSIC_SRC.rglob("*"))

    for f in sorted(all_sfx_sources):
        if f.is_file() and f.suffix.lower() in audio_extensions:
            # Skip massive files (> 45 MB) for SFX
            if f.stat().st_size > 45 * 1024 * 1024:
                continue
            sfx_type = classify_sfx(f.name)
            if sfx_type:
                sfx_by_type.setdefault(sfx_type, []).append(f)

    print("\nSFX Categories Classified:")
    for st, files in sorted(sfx_by_type.items()):
        print(f"  {st:12}: {len(files)} files matched")

    # Copy files into assets/sfx/{folder_name}/
    for sfx_type, files in sfx_by_type.items():
        folder_name = SFX_FOLDER_MAP.get(sfx_type, sfx_type + "s")
        dst_dir = SFX_DST_ROOT / folder_name
        dst_dir.mkdir(parents=True, exist_ok=True)

        # Pick top 12 unique, high-quality audio files per type
        chosen_files = files[:12]

        for i, src in enumerate(chosen_files, 1):
            ext = src.suffix.lower()
            safe_name = sanitize_filename(src.name)
            dst_name = f"{sfx_type}_{i:02d}_{safe_name}{ext}"
            dst = dst_dir / dst_name

            if not dst.exists():
                try:
                    shutil.copy2(src, dst)
                    print(f"  [SFX] {folder_name:12} <- {src.name[:45]}")
                except Exception as e:
                    print(f"  [SFX error] {e}")
                    continue

            dur = get_duration(str(dst))
            if dur <= 0.0:
                continue

            intensity = round(min(1.0, 0.45 + (i * 0.05)), 2)
            sfx_catalog.append({
                "filename": dst_name,
                "folder": folder_name,
                "type": sfx_type,
                "intensity": intensity,
                "duration": dur,
                "mood": ["real"],
                "placeholder": False,
                "source": src.name[:80],
            })

    # -----------------------------------------------------------------------
    # 2. Scan and Integrate Background Music / Ambiences
    # -----------------------------------------------------------------------
    print(f"\nScanning Music source: {MUSIC_SRC}")
    music_by_mood: Dict[str, List[Path]] = {}

    all_music_sources = []
    if MUSIC_SRC.exists():
        all_music_sources += list(MUSIC_SRC.rglob("*"))
    if SFX_SRC.exists():
        all_music_sources += list(SFX_SRC.rglob("*"))

    for f in sorted(all_music_sources):
        if f.is_file() and f.suffix.lower() in audio_extensions:
            # Skip files larger than 45 MB to stay well under GitHub limits
            if f.stat().st_size > 45 * 1024 * 1024:
                continue
            mood = classify_music(f.name)
            if mood:
                music_by_mood.setdefault(mood, []).append(f)

    print("\nMusic Moods Classified:")
    for mood, files in sorted(music_by_mood.items()):
        print(f"  {mood:20}: {len(files)} files matched")

    for mood, files in music_by_mood.items():
        dst_dir = MUS_DST_ROOT / mood
        dst_dir.mkdir(parents=True, exist_ok=True)

        chosen_files = files[:10]

        for i, src in enumerate(chosen_files, 1):
            ext = src.suffix.lower()
            safe_name = sanitize_filename(src.name)
            dst_name = f"{mood}_{i:02d}_{safe_name}{ext}"
            dst = dst_dir / dst_name

            if not dst.exists():
                try:
                    shutil.copy2(src, dst)
                    print(f"  [MUS] {mood:20} <- {src.name[:40]}")
                except Exception as e:
                    print(f"  [MUS error] {e}")
                    continue

            dur = get_duration(str(dst))
            if dur <= 0.0:
                continue

            music_catalog.append({
                "filename": dst_name,
                "folder": mood,
                "moods": [mood],
                "duration": dur,
                "placeholder": False,
                "source": src.name[:80],
            })

    # -----------------------------------------------------------------------
    # 3. Merge with Existing Synthetic Placeholders for Uncovered Types
    # -----------------------------------------------------------------------
    existing_sfx = []
    sfx_meta_path = SFX_DST_ROOT / "metadata.json"
    if sfx_meta_path.exists():
        try:
            with open(sfx_meta_path, "r", encoding="utf-8") as f:
                existing_sfx = json.load(f)
        except Exception:
            existing_sfx = []

    real_types = {e["type"] for e in sfx_catalog}
    kept_placeholders_sfx = [
        e for e in existing_sfx
        if e.get("placeholder") and e.get("type") not in real_types
    ]
    final_sfx = sfx_catalog + kept_placeholders_sfx

    existing_music = []
    mus_meta_path = MUS_DST_ROOT / "metadata.json"
    if mus_meta_path.exists():
        try:
            with open(mus_meta_path, "r", encoding="utf-8") as f:
                existing_music = json.load(f)
        except Exception:
            existing_music = []

    real_moods = {e["folder"] for e in music_catalog}
    kept_placeholders_music = [
        e for e in existing_music
        if e.get("placeholder") and e.get("folder") not in real_moods
    ]
    final_music = music_catalog + kept_placeholders_music

    # -----------------------------------------------------------------------
    # 4. Write Catalog Files
    # -----------------------------------------------------------------------
    with open(sfx_meta_path, "w", encoding="utf-8") as f:
        json.dump(final_sfx, f, indent=2)
    print(f"\n[OK] SFX metadata -> {sfx_meta_path.relative_to(ROOT)} ({len(final_sfx)} entries)")

    with open(mus_meta_path, "w", encoding="utf-8") as f:
        json.dump(final_music, f, indent=2)
    print(f"[OK] Music metadata -> {mus_meta_path.relative_to(ROOT)} ({len(final_music)} entries)")

    print("\n=== Integration Summary ===")
    print(f"  SFX types in library : {sorted(set(e['type'] for e in final_sfx))}")
    print(f"  Music moods in library: {sorted(set(e['folder'] for e in final_music))}")
    print(f"  Total SFX entries     : {len(final_sfx)}")
    print(f"  Total Music entries   : {len(final_music)}")
    print("\nDone! Assets integrated successfully.\n")


if __name__ == "__main__":
    main()

