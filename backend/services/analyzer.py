"""
AI Analyzer — two-phase content classification.

Phase 1: Fast regex/keyword rules (covers ~70% of cases instantly).
Phase 2: Gemini API for semantically ambiguous segments.

Tags: HOOK | REVEAL | CONTRAST | STAGE_TRANSITION | QUESTION |
      CLIMAX | ENDING | GLITCH | DROP | NONE
"""

import os
import re
import json
import asyncio
from typing import List, Tuple, Optional, Dict

from models.schemas import SRTSegment, AnalyzedSegment, ContentTag, AnalyzeSettings

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
    ],
    ContentTag.HOOK: [
        r"\bwhat\s+if\s+(i\s+told\s+you|you\s+knew)\b",
        r"\byou\s+won'?t\s+believe\b",
        r"\bmost\s+people\s+don'?t\s+know\b",
        r"\bthe\s+hidden\b",
        r"\bno\s+one\s+talks\s+about\b",
        r"\bthe\s+secret\s+(behind|of|to)\b",
        r"\bthis\s+will\s+change\b",
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
async def _classify_with_gemini(
    segments: List[SRTSegment],
) -> Dict[int, Tuple[ContentTag, float]]:
    """Send untagged segments to Gemini for semantic classification."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {}

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        all_tags = [t.value for t in ContentTag]
        seg_lines = "\n".join(f'{s.id}: "{s.text}"' for s in segments)

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

        # Run synchronous genai call in thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, lambda: model.generate_content(prompt)
        )

        raw_text = response.text.strip()
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

    except Exception as exc:
        print(f"[analyzer] Gemini classification error: {exc}")
        return {}


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def analyze_segments(
    segments: List[SRTSegment],
    settings: AnalyzeSettings,
) -> List[AnalyzedSegment]:
    """
    Analyze all SRT segments and return tagged AnalyzedSegment list.
    Phase 1: regex rules  →  Phase 2: Gemini for remaining NONE segments.
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
