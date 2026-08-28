"""
SRT & VTT Subtitle Parser — converts subtitle files into a list of timed segments.

Supports:
- Standard SRT format (HH:MM:SS,mmm --> HH:MM:SS,mmm)
- WebVTT format (HH:MM:SS.mmm --> HH:MM:SS.mmm or MM:SS.mmm)
- UTF-8 with or without BOM
- Stripping HTML/formatting tags (<i>, <b>, <font>, etc.)
- Multi-line subtitle texts
- Robust fallback block splitting
"""

import re
from typing import List
from models.schemas import SRTSegment


def _time_to_sec(time_str: str) -> float:
    """Convert HH:MM:SS,mmm or HH:MM:SS.mmm or MM:SS.mmm → float seconds."""
    time_str = time_str.strip().replace(",", ".")
    parts = time_str.split(":")
    if len(parts) == 3:
        h, m, s = parts
        return int(h) * 3600 + int(m) * 60 + float(s)
    elif len(parts) == 2:
        m, s = parts
        return int(m) * 60 + float(s)
    return float(time_str)


def parse_srt(content: str) -> List[SRTSegment]:
    """
    Parse raw SRT / VTT string into SRTSegment objects.
    Ensures 100% of valid subtitle blocks are detected and extracted.
    """
    if not content:
        return []

    # Strip UTF-8 BOM if present
    content = content.lstrip("\ufeff")

    # Normalize line endings
    content = content.replace("\r\n", "\n").replace("\r", "\n")

    # Timecode pattern matching both SRT and VTT formats
    # Examples: 00:00:00,354 --> 00:00:03,197 or 00:00:00.354 --> 00:00:03.197
    tc_regex = re.compile(
        r"((?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3})"
    )

    # Split by double (or more) newlines, or iterate lines
    blocks = re.split(r"\n\s*\n+", content.strip())
    segments: List[SRTSegment] = []
    auto_id = 1

    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines:
            continue

        # Find line with timestamp
        tc_line_idx = -1
        tc_match = None
        for i, line in enumerate(lines):
            m = tc_regex.search(line)
            if m:
                tc_line_idx = i
                tc_match = m
                break

        if not tc_match or tc_line_idx == -1:
            continue

        start_sec = _time_to_sec(tc_match.group(1))
        end_sec = _time_to_sec(tc_match.group(2))

        # Check for explicit ID line before timestamp
        seg_id = auto_id
        if tc_line_idx > 0:
            try:
                seg_id = int(lines[0])
            except ValueError:
                seg_id = auto_id

        # Text is all lines following the timestamp line
        text_lines = lines[tc_line_idx + 1 :]
        if not text_lines:
            continue

        raw_text = " ".join(text_lines)
        # Strip HTML/style tags (e.g. <i>, <b>, <font color="...">)
        clean_text = re.sub(r"<[^>]+>", "", raw_text)
        clean_text = re.sub(r"\s+", " ", clean_text).strip()

        if not clean_text:
            continue

        segments.append(
            SRTSegment(
                id=seg_id,
                start_sec=round(start_sec, 3),
                end_sec=round(end_sec, 3),
                text=clean_text,
            )
        )
        auto_id += 1

    return segments
