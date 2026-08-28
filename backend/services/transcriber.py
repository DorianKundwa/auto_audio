"""
Transcription service — uses faster-whisper to auto-transcribe video audio
when no SRT file is provided by the user.
"""

from typing import List
from models.schemas import SRTSegment


def transcribe(video_path: str, language: str = "en") -> List[SRTSegment]:
    """
    Transcribe the audio of a video file using faster-whisper.
    Returns a list of SRTSegment objects (same format as the SRT parser).

    Args:
        video_path: Path to the video or audio file.
        language:   ISO language code, default "en".
    """
    from faster_whisper import WhisperModel

    # Use a small model so it runs fast on CPU; swap for "medium" / "large-v3"
    # for higher accuracy when a GPU is available.
    model = WhisperModel("small", device="cpu", compute_type="int8")

    segments_iter, _info = model.transcribe(
        video_path,
        language=language,
        beam_size=5,
        word_timestamps=False,
    )

    result: List[SRTSegment] = []
    for i, seg in enumerate(segments_iter, start=1):
        result.append(
            SRTSegment(
                id=i,
                start_sec=round(seg.start, 3),
                end_sec=round(seg.end, 3),
                text=seg.text.strip(),
            )
        )

    return result
