"""
AI Analyzer — two-phase content classification.

Phase 1: Fast regex/keyword rules (covers ~70% of cases instantly).
Phase 2: Gemini API for semantically ambiguous segments (batched).

Tags: HOOK | REVEAL | CONTRAST | STAGE_TRANSITION | QUESTION |
      CLIMAX | ENDING | GLITCH | DROP | NONE
"""

import os
import re
import json
import asyncio
from typing import List, Tuple, Optional, Dict

from models.schemas import SRTSegment, AnalyzedSegment, ContentTag, AnalyzeSettings, AIStyleProfile


# ---------------------------------------------------------------------------
# AI Autonomous Style Decision Engine (Script & Subtitle Analysis)
# ---------------------------------------------------------------------------
async def decide_script_style(segments: List[SRTSegment]) -> AIStyleProfile:
    """
    Autonomously decide sound design style, mood, intensities, and acoustic palette
    based on the narrative and dramatic cues in the subtitle script.
    """
    if not segments:
        return _default_style_profile("General Narration", "Default ambient tone")

    # Try Gemini AI first if configured
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            profile = await _decide_style_with_gemini(segments, api_key)
            if profile:
                print(f"[analyzer] AI Style Decided: {profile.style_name} (Mood: {profile.mood})")
                return profile
        except Exception as exc:
            print(f"[analyzer] Gemini style decision fallback due to: {exc}")

    # Fallback to rich semantic heuristic analysis
    return _heuristic_script_style(segments)


def _default_style_profile(theme: str = "", reason: str = "") -> AIStyleProfile:
    return AIStyleProfile(
        style_name="Cinematic Narrative",
        mood="Engaging & Balanced",
        genre="dark_documentary",
        music_intensity=0.70,
        sfx_intensity=0.65,
        silence_drops=True,
        pacing="moderate",
        narrative_theme=theme or "General Narration",
        acoustic_palette=["impacts", "risers", "whooshes", "transitions"],
        reasoning=reason or "AI evaluated script pacing and selected a balanced cinematic sound design architecture.",
    )


async def _decide_style_with_gemini(
    segments: List[SRTSegment],
    api_key: str,
) -> Optional[AIStyleProfile]:
    """Call Gemini REST API to holistically analyze the full script narrative and return an AIStyleProfile."""
    model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    full_script = "\n".join(f"[{s.start_sec:.1f}s - {s.end_sec:.1f}s]: {s.text}" for s in segments[:60])
    
    prompt = f"""You are a master Hollywood sound designer and music director.
Analyze this video narration script and autonomously design the complete sound design aesthetic, mood, music genre, dynamic intensities, and acoustic palette.

Script content:
{full_script}

Available sound library genres for music: "dark_documentary", "mysterious", "upbeat", "action".
Available SFX categories: "impacts", "booms", "risers", "glitches", "whooshes", "transitions", "heartbeats", "clicks".

Respond ONLY with a valid JSON object matching this schema:
{{
  "style_name": "<Short punchy style name, e.g. 'Dark Mystery & Glitch', 'High-Stakes Investigative Action', 'Tech Breakthrough', 'Atmospheric Documentary'>",
  "mood": "<1-3 words mood, e.g. 'Tense & Unsettling', 'Urgent & Dramatic', 'Inspiring & Modern', 'Eerie & Mysterious'>",
  "genre": "<one of: 'dark_documentary', 'mysterious', 'upbeat', 'action'>",
  "music_intensity": <float between 0.25 and 0.95 reflecting music volume and presence>,
  "sfx_intensity": <float between 0.25 and 0.95 reflecting sound effect frequency and punch>,
  "silence_drops": <boolean, true if dramatic pauses/silence drops fit the reveals and climax>,
  "pacing": "<one of: 'slow', 'moderate', 'fast', 'frenetic'>",
  "narrative_theme": "<1 sentence summarizing the script subject/theme>",
  "acoustic_palette": [<array of 3-5 SFX categories from the available list that best fit this script>],
  "reasoning": "<1-2 sentences explaining why this style, mood, and intensities were chosen based on the narration cues>"
}}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    import urllib.request

    def _call():
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))

    loop = asyncio.get_running_loop()
    data = await loop.run_in_executor(None, _call)
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not json_match:
        return None

    parsed = json.loads(json_match.group())
    genre = parsed.get("genre", "dark_documentary")
    if genre not in ["dark_documentary", "mysterious", "upbeat", "action"]:
        genre = "dark_documentary"

    return AIStyleProfile(
        style_name=str(parsed.get("style_name", "AI Dynamic Soundscape")),
        mood=str(parsed.get("mood", "Tense & Atmospheric")),
        genre=genre,
        music_intensity=max(0.2, min(0.95, float(parsed.get("music_intensity", 0.70)))),
        sfx_intensity=max(0.2, min(0.95, float(parsed.get("sfx_intensity", 0.65)))),
        silence_drops=bool(parsed.get("silence_drops", True)),
        pacing=str(parsed.get("pacing", "moderate")),
        narrative_theme=str(parsed.get("narrative_theme", "")),
        acoustic_palette=list(parsed.get("acoustic_palette", ["impacts", "risers", "glitches", "whooshes"])),
        reasoning=str(parsed.get("reasoning", "AI analyzed narration cues to synthesize custom sound design.")),
    )


def _heuristic_script_style(segments: List[SRTSegment]) -> AIStyleProfile:
    """Multi-dimensional heuristic analyzer for offline or fallback style determination."""
    full_text = " ".join(s.text for s in segments).lower()
    total_words = len(re.findall(r"\w+", full_text))
    total_duration = max(1.0, segments[-1].end_sec - segments[0].start_sec) if segments else 60.0
    words_per_sec = total_words / total_duration

    # Category keyword scores
    scores = {
        "mystery_glitch": 0.0,
        "action_high_stakes": 0.0,
        "dark_investigative": 0.0,
        "tech_viral": 0.0,
        "subtle_ambient": 0.0,
    }

    # Mystery / Glitch / Sci-Fi
    mystery_kw = [
        "simulation", "mandela effect", "matrix", "glitch", "parallel", "dimension",
        "time travel", "anomaly", "quantum", "strange", "paradox", "memory", "dream",
        "hallucination", "unconscious", "puzzle", "wonder", "hidden", "alien", "portal"
    ]
    for kw in mystery_kw:
        if kw in full_text:
            scores["mystery_glitch"] += 2.5

    # Action / High Stakes / Combat
    action_kw = [
        "attack", "battle", "war", "fight", "siege", "soldier", "army", "danger",
        "speed", "explosive", "weapon", "kill", "destroy", "power", "clash", "strike",
        "emergency", "urgent", "chase", "threat", "storm", "blast", "survive"
    ]
    for kw in action_kw:
        if kw in full_text:
            scores["action_high_stakes"] += 2.2

    # Dark Documentary / Investigation
    dark_kw = [
        "fortress", "castle", "history", "medieval", "king", "sultan", "secret",
        "empire", "court", "guard", "shadow", "stone", "ruin", "ancient", "investigation",
        "truth", "evidence", "conspiracy", "unsettling", "doctrine", "murder", "crime", "confession"
    ]
    for kw in dark_kw:
        if kw in full_text:
            scores["dark_investigative"] += 2.0

    # Tech / Viral / Success
    tech_kw = [
        "money", "growth", "business", "technology", "future", "system", "code", "ai",
        "millions", "views", "viral", "success", "profit", "win", "achieve", "algorithm",
        "scale", "innovate", "launch"
    ]
    for kw in tech_kw:
        if kw in full_text:
            scores["tech_viral"] += 2.0

    # Check punctuation intensity
    exclamations = full_text.count("!")
    questions = full_text.count("?")
    scores["action_high_stakes"] += min(3.0, exclamations * 0.8)
    scores["mystery_glitch"] += min(3.0, questions * 0.6)

    # Determine winning category
    top_cat = max(scores, key=lambda k: scores[k])
    top_score = scores[top_cat]

    if top_score < 2.0:
        # Balanced narrative default
        if words_per_sec > 2.8:
            top_cat = "tech_viral"
        else:
            top_cat = "dark_investigative"

    if top_cat == "mystery_glitch":
        return AIStyleProfile(
            style_name="Dark Mystery & Glitch",
            mood="Eerie & Mind-Bending",
            genre="mysterious",
            music_intensity=0.74,
            sfx_intensity=0.70,
            silence_drops=True,
            pacing="moderate",
            narrative_theme="Anomalies, simulation glitches & reality questions",
            acoustic_palette=["glitches", "risers", "impacts", "whooshes"],
            reasoning="AI identified surreal anomaly keywords and reality-shifting cues, configuring atmospheric suspense drones, digital glitches, and dramatic tension risers.",
        )
    elif top_cat == "action_high_stakes":
        return AIStyleProfile(
            style_name="High-Stakes Cinematic Action",
            mood="Urgent & High-Energy",
            genre="action",
            music_intensity=0.88,
            sfx_intensity=0.82,
            silence_drops=True,
            pacing="fast" if words_per_sec > 2.5 else "moderate",
            narrative_theme="Conflict, high stakes & explosive tension",
            acoustic_palette=["booms", "impacts", "risers", "transitions"],
            reasoning="AI detected intense conflict cues and dramatic momentum, scoring heavy cinematic impacts, driving rhythm beds, and punchy transitions.",
        )
    elif top_cat == "tech_viral":
        return AIStyleProfile(
            style_name="Tech & Viral Dynamic",
            mood="Punchy & Engaging",
            genre="upbeat",
            music_intensity=0.72,
            sfx_intensity=0.68,
            silence_drops=False,
            pacing="fast",
            narrative_theme="Fast-paced technology, growth & modern pacing",
            acoustic_palette=["whooshes", "clicks", "transitions", "risers"],
            reasoning="AI identified fast speech velocity and modern tech cues, configuring crisp whooshes, reward chimes, and energetic narrative pacing.",
        )
    else:  # dark_investigative
        return AIStyleProfile(
            style_name="Investigative Dark Documentary",
            mood="Suspenseful & Gripping",
            genre="dark_documentary",
            music_intensity=0.68,
            sfx_intensity=0.60,
            silence_drops=True,
            pacing="moderate",
            narrative_theme="Historical narrative, investigation & revelation",
            acoustic_palette=["impacts", "transitions", "risers", "heartbeats"],
            reasoning="AI detected investigative narrative cues and plot revelations, deploying deep atmospheric beds, subtle tension swells, and heavy revelation impacts.",
        )

# ---------------------------------------------------------------------------
# Rules — ordered by specificity (most important first)
# ---------------------------------------------------------------------------
RULES: Dict[ContentTag, List[str]] = {
    ContentTag.GLITCH: [
        r"\bmandela\s+effect\b",
        r"\bsimulation\b",
        r"\bglitch\b",
        r"\bmatrix\b",
        r"\bparallel\s+(universe|world|reality)\b",
        r"\btime\s+(travel|loop)\b",
        r"\bdeja\s+vu\b",
    ],
    ContentTag.REVEAL: [
        r"\bnever\s+(happened|existed|was\s+real|occurred)\b",
        r"\bit\s+was\s+(all|never|always)\b",
        r"\bwas\s+actually\b",
        r"\bthe\s+truth\s+is\b",
        r"\bwas\s+a\s+lie\b",
        r"\bdidn'?t\s+(exist|happen|occur)\b",
        r"\bwas\s+never\b",
        r"\bnot\s+remotely\s+(true|real|accurate)\b",
        r"\bimpossible\b",
        r"\bthey\s+lied\b",
        r"\bthe\s+real\s+story\b",
        r"\brevealed?\b.*\btruth\b",
        r"\bunsettling\b",
    ],
    ContentTag.HOOK: [
        r"\bwhat\s+if\s+(i\s+told\s+you|you\s+knew)\b",
        r"\byou\s+won'?t\s+believe\b",
        r"\bmost\s+people\s+don'?t\s+know\b",
        r"\bthe\s+hidden\b",
        r"\bno\s+one\s+talks\s+about\b",
        r"\bthe\s+secret\s+(behind|of|to)\b",
        r"\bthis\s+will\s+change\b",
        r"\bthe\s+strangest\s+part\b",
    ],
    ContentTag.CLIMAX: [
        r"\bfinally\b",
        r"\bthe\s+moment\b",
        r"\beverything\s+changed\b",
        r"\bbreaking\s+point\b",
        r"\bultimately\b",
        r"\bthe\s+(real\s+)?answer\b",
        r"\bthat'?s\s+when\b",
        r"\bthe\s+turning\s+point\b",
    ],
    ContentTag.STAGE_TRANSITION: [
        r"\bstage\s+\d+\b",
        r"\bpart\s+\d+\b",
        r"\bchapter\s+\d+\b",
        r"\bstep\s+\d+\b",
        r"\bmeanwhile\b",
        r"\byears?\s+later\b",
        r"\bdecades?\s+later\b",
        r"\bback\s+in\b.*\d{4}\b",
        r"\bin\s+\d{4}\b",
    ],
    ContentTag.QUESTION: [
        r"\bthe\s+real\s+question\b",
        r"\bwhy\s+(did|would|do|does)\b",
        r"\bhow\s+(could|did|do|does)\b",
        r"\bwhat\s+(really|actually)\b",
        r"\bwho\s+(was|is|really|actually)\b",
        r"\bask\s+yourself\b",
    ],
    ContentTag.CONTRAST: [
        r"^\s*but\b",
        r"^\s*however\b",
        r"^\s*yet\b",
        r"^\s*instead\b",
        r"\bin\s+reality\b",
        r"\bcontrary\s+to\b",
        r"\bthe\s+opposite\b",
        r"\bon\s+the\s+other\s+hand\b",
    ],
    ContentTag.ENDING: [
        r"\bthe\s+end\b",
        r"\bin\s+conclusion\b",
        r"\bto\s+summarize\b",
        r"\bwhich\s+is\s+why\b",
        r"\bthat'?s\s+why\b",
        r"\bremember\b.{0,40}\btoday\b",
        r"\bso\s+next\s+time\b",
        r"\btake\s+away\b",
        r"\bin\s+the\s+end\b",
    ],
    ContentTag.DROP: [
        r"\bnot\s+remotely\b",
        r"\bnothing\s+happened\b",
        r"\bsilence\b",
        r"\bno\s+one\s+came\b",
        r"\bnothing\b.{0,20}\bmatters?\b",
    ],
}


def _apply_rules(text: str) -> Optional[ContentTag]:
    """Return the first matching tag for text, or None."""
    text_lower = text.lower()
    for tag, patterns in RULES.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return tag
    return None


# ---------------------------------------------------------------------------
# Gemini batch classification
# ---------------------------------------------------------------------------
async def _classify_chunk(
    chunk: List[SRTSegment],
    api_key: str,
    model_name: str,
) -> Dict[int, Tuple[ContentTag, float]]:
    all_tags = [t.value for t in ContentTag]
    seg_lines = "\n".join(f'{s.id}: "{s.text}"' for s in chunk)

    prompt = f"""You are a video script sound-design analyst.
Classify each numbered subtitle segment with exactly ONE tag from this list:

HOOK          - Attention-grabbing opener ("What if I told you", "Most people don't know")
REVEAL        - Major revelation or plot twist ("never happened", "the truth is", "was actually")
CONTRAST      - Turn/pivot ("but", "however", "in reality", "on the other hand")
STAGE_TRANSITION - Scene/phase/time change ("Stage 1", "Meanwhile", "Years later", "In 1943")
QUESTION      - Rhetorical or key question ("The real question is", "Why did", "How could")
CLIMAX        - Peak moment ("finally", "everything changed", "the turning point")
ENDING        - Conclusion ("that's why", "in conclusion", "to summarize")
GLITCH        - Weird/meta/sci-fi content ("Mandela Effect", "simulation", "glitch", "matrix")
DROP          - Dramatic deflation or pause ("nothing", "not at all", "no one came")
NONE          - Ordinary narration with no special dramatic function

Segments to classify:
{seg_lines}

Reply ONLY with a JSON object mapping segment ID (string) to tag (string).
Example: {{"1": "NONE", "2": "REVEAL", "3": "HOOK"}}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    import urllib.request

    def _call_gemini_rest():
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-goog-api-key": api_key,
            },
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))

    loop = asyncio.get_running_loop()
    last_exc: Exception = RuntimeError("no attempts made")
    for attempt in range(3):  # up to 3 attempts (original + 2 retries)
        try:
            data = await loop.run_in_executor(None, _call_gemini_rest)
            break
        except Exception as exc:
            last_exc = exc
            if attempt < 2:
                wait = 2 ** attempt  # 1s, 2s
                print(f"[analyzer] Gemini retry {attempt + 1}/2 after {wait}s ({exc})")
                await asyncio.sleep(wait)
    else:
        raise last_exc
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not json_match:
        return {}

    raw: Dict[str, str] = json.loads(json_match.group())
    result: Dict[int, Tuple[ContentTag, float]] = {}
    for k, v in raw.items():
        try:
            seg_id = int(k)
            if v in all_tags:
                result[seg_id] = (ContentTag(v), 0.82)
        except (ValueError, KeyError):
            pass
    return result


async def _classify_with_gemini(
    segments: List[SRTSegment],
) -> Dict[int, Tuple[ContentTag, float]]:
    """Send untagged segments in batches to Gemini REST API for classification."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {}

    model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    results: Dict[int, Tuple[ContentTag, float]] = {}

    # Batch in chunks of 40 to avoid token limits
    CHUNK_SIZE = 40
    for i in range(0, len(segments), CHUNK_SIZE):
        chunk = segments[i : i + CHUNK_SIZE]
        try:
            chunk_results = await _classify_chunk(chunk, api_key, model_name)
            results.update(chunk_results)
            print(
                f"[analyzer] Gemini classified segments "
                f"{chunk[0].id}–{chunk[-1].id} "
                f"({len(chunk_results)}/{len(chunk)} tagged)"
            )
        except Exception as exc:
            print(f"[analyzer] Gemini chunk {i}–{i+CHUNK_SIZE-1} failed after retries: {exc}")

    return results


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def analyze_segments(
    segments: List[SRTSegment],
    settings: AnalyzeSettings,
) -> List[AnalyzedSegment]:
    """
    Analyze all SRT segments and return tagged AnalyzedSegment list.
    Preserves 100% of input subtitle segments.
    """
    # Phase 1 — rules
    rule_results: Dict[int, Tuple[ContentTag, float]] = {}
    untagged_ids: List[int] = []

    for seg in segments:
        tag = _apply_rules(seg.text)
        if tag:
            rule_results[seg.id] = (tag, 0.92)
        else:
            untagged_ids.append(seg.id)

    # Phase 2 — Gemini for untagged
    ai_results: Dict[int, Tuple[ContentTag, float]] = {}
    if untagged_ids:
        untagged_segs = [s for s in segments if s.id in untagged_ids]
        ai_results = await _classify_with_gemini(untagged_segs)

    # Merge and apply settings filters
    _disabled: Dict[ContentTag, bool] = {
        ContentTag.HOOK: not settings.hook_detection,
        ContentTag.REVEAL: not settings.reveal_detection,
        ContentTag.STAGE_TRANSITION: not settings.stage_detection,
        ContentTag.DROP: not settings.silence_drops,
    }

    analyzed: List[AnalyzedSegment] = []
    for seg in segments:
        if seg.id in rule_results:
            tag, conf = rule_results[seg.id]
        elif seg.id in ai_results:
            tag, conf = ai_results[seg.id]
        else:
            tag, conf = ContentTag.NONE, 1.0

        # Respect feature toggles
        if _disabled.get(tag, False):
            tag, conf = ContentTag.NONE, 1.0

        analyzed.append(
            AnalyzedSegment(
                id=seg.id,
                start_sec=seg.start_sec,
                end_sec=seg.end_sec,
                text=seg.text,
                tag=tag,
                confidence=conf,
            )
        )

    return analyzed
