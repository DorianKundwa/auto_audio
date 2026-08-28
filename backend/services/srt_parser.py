"""
SRT file parser — converts .srt text into a list of timed segments.
Handles standard SRT format with HTML tag stripping.
"""

import re
from typing import List
from models.schemas import SRTSegment


def _time_to_sec(time_str: str) -> float:
    """Convert HH:MM:SS,mmm → float seconds."""
    h, m, rest = time_str.strip().split(":")
    s, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def parse_srt(content: str) -> List[SRTSegment]:
    """
    Parse raw SRT string into SRTSegment objects.
    Strips HTML/style tags from subtitle text.
    """
    blocks = re.split(r"\n{2,}", content.strip())
    segments: List[SRTSegment] = []

    for block in blocks:
        lines = [l for l in block.strip().split("\n") if l.strip()]
        if len(lines) < 3:
            continue

        # Index line
        try:
            idx = int(lines[0].strip())
        except ValueError:
            continue

        # Timecode line
        tc_pattern = (
            r"(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})"
        )
        tc_match = re.match(tc_pattern, lines[1].strip())
        if not tc_match:
            continue

        start_sec = _time_to_sec(tc_match.group(1))
        end_sec = _time_to_sec(tc_match.group(2))

        # Text (may span multiple lines)
        raw_text = " ".join(lines[2:])
        # Strip HTML tags (e.g. <i>, <b>, <font color="...">)
        text = re.sub(r"<[^>]+>", "", raw_text).strip()

        if not text:
            continue

        segments.append(
            SRTSegment(id=idx, start_sec=start_sec, end_sec=end_sec, text=text)
        )

    return segments
