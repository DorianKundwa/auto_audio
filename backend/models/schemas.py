from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class ContentTag(str, Enum):
    HOOK = "HOOK"
    REVEAL = "REVEAL"
    CONTRAST = "CONTRAST"
    STAGE_TRANSITION = "STAGE_TRANSITION"
    QUESTION = "QUESTION"
    CLIMAX = "CLIMAX"
    ENDING = "ENDING"
    GLITCH = "GLITCH"
    DROP = "DROP"
    NONE = "NONE"


class SRTSegment(BaseModel):
    id: int
    start_sec: float
    end_sec: float
    text: str


class AnalyzedSegment(BaseModel):
    id: int
    start_sec: float
    end_sec: float
    text: str
    tag: ContentTag
    confidence: float


class SFXEvent(BaseModel):
    id: str
    timestamp: float          # seconds into video
    tag: ContentTag
    sfx_type: str             # e.g. "impact", "riser", "glitch"
    sfx_path: str             # absolute path to WAV file
    volume: float             # 0.0 – 1.0
    label: str                # display label, e.g. "IMPACT"
    text_snippet: str         # the narration line that triggered this
    duration: Optional[float] = None  # max seconds to play; None = play full file


class MusicClip(BaseModel):
    id: str
    start_sec: float
    end_sec: float
    duration: float
    track_path: str
    title: str
    volume: float


class MusicConfig(BaseModel):
    track_path: str
    volume: float             # 0.0 – 1.0 (e.g. 0.12)
    mood: str
    track_duration: float = 0.0
    clips: List[MusicClip] = []


class TimelineResult(BaseModel):
    job_id: str
    video_path: str
    video_duration: float
    sfx_events: List[SFXEvent]
    music_config: MusicConfig
    analyzed_segments: List[AnalyzedSegment]


class AnalyzeSettings(BaseModel):
    music_enabled: bool = True
    sfx_enabled: bool = True
    silence_drops: bool = True
    stage_detection: bool = True
    reveal_detection: bool = True
    hook_detection: bool = True
    music_intensity: float = 0.7    # 0.0 – 1.0 slider value
    sfx_intensity: float = 0.5      # 0.0 – 1.0 slider value


class ExportRequest(BaseModel):
    sfx_events: List[SFXEvent]
    music_config: Optional[MusicConfig] = None
    music_enabled: bool = True
    sfx_enabled: bool = True


class UploadResponse(BaseModel):
    job_id: str
    video_filename: str
    srt_filename: Optional[str] = None
    has_srt: bool


class JobStatus(BaseModel):
    job_id: str
    status: str               # "uploaded" | "analyzing" | "ready" | "exporting" | "done"
    timeline: Optional[TimelineResult] = None
