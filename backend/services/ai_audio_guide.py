"""
AI Sound Design Knowledge Base & Scoring Rules Engine
=====================================================
Provides structured catalog access and prompt-ready knowledge
for AI language models (Gemini) and automated sound design pipelines.
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional

ROOT_DIR = Path(__file__).parent.parent.parent
SFX_CATALOG_PATH = ROOT_DIR / "assets" / "sfx" / "metadata.json"
MUSIC_CATALOG_PATH = ROOT_DIR / "assets" / "music" / "metadata.json"


def get_sfx_catalog() -> List[Dict[str, Any]]:
    """Return all 103 enriched SFX entries with semantic annotations."""
    if SFX_CATALOG_PATH.exists():
        with open(SFX_CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def get_music_catalog() -> List[Dict[str, Any]]:
    """Return all 30 enriched Music tracks with mood annotations."""
    if MUSIC_CATALOG_PATH.exists():
        with open(MUSIC_CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def get_sfx_categories_summary() -> Dict[str, Dict[str, Any]]:
    """Return high-level summary of all SFX functional categories for AI prompting."""
    catalog = get_sfx_catalog()
    summary: Dict[str, Dict[str, Any]] = {}
    for item in catalog:
        f = item.get("folder", "impacts")
        if f not in summary:
            summary[f] = {
                "folder": f,
                "type": item.get("type", f),
                "dramatic_function": item.get("dramatic_function", ""),
                "acoustic_profile": item.get("acoustic_profile", ""),
                "frequency_range": item.get("frequency_range", ""),
                "suggested_volume_range": item.get("suggested_volume_range", [0.5, 0.8]),
                "recommended_triggers": item.get("recommended_triggers", []),
                "track_count": 0,
            }
        summary[f]["track_count"] += 1
    return summary


def get_gemini_sound_design_system_prompt() -> str:
    """
    Generate an AI system prompt describing the available audio library
    and scoring rules for automated classification.
    """
    categories = get_sfx_categories_summary()
    lines = [
        "You are an expert Hollywood and YouTube sound designer.",
        "Your task is to analyze video narration scripts and map dramatic beats to our calibrated sound library.",
        "\nAVAILABLE SOUND EFFECT CATEGORIES:",
    ]

    for cat_name, cat_data in categories.items():
        triggers = ", ".join(f'"{t}"' for t in cat_data["recommended_triggers"][:4])
        lines.append(
            f"- {cat_name.upper()} ({cat_data['type']}): {cat_data['dramatic_function']}. "
            f"Triggers: [{triggers}]. Volume: {int(cat_data['suggested_volume_range'][0]*100)}%-{int(cat_data['suggested_volume_range'][1]*100)}%."
        )

    lines.append("\nSCORING PRINCIPLES:")
    lines.append("1. Punctuate hooks with RISERS to build anticipation.")
    lines.append("2. Mark big reveals, plot twists, and key thesis moments with IMPACTS or BOOMS.")
    lines.append("3. Use GLITCHES exclusively for simulation/tech/meta themes.")
    lines.append("4. Use WHOOSHES for perspective changes, fast movement, or scene pivots.")
    lines.append("5. Never place multiple heavy impacts closer than 2.0 seconds apart.")

    return "\n".join(lines)
