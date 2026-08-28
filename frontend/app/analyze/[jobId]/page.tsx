"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiUrl } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SFXEvent {
  id: string;
  timestamp: number;
  tag: string;
  sfx_type: string;
  sfx_path: string;
  volume: number;
  label: string;
  text_snippet: string;
}

interface MusicConfig {
  track_path: string;
  volume: number;
  mood: string;
}

interface AnalyzedSegment {
  id: number;
  start_sec: number;
  end_sec: number;
  text: string;
  tag: string;
  confidence: number;
}

interface TimelineResult {
  job_id: string;
  video_duration: number;
  sfx_events: SFXEvent[];
  music_config: MusicConfig;
  analyzed_segments: AnalyzedSegment[];
}

interface SFXLibraryItem {
  filename: string;
  folder: string;
  type: string;
  intensity: number;
  duration: number;
  mood: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTs(sec: number): string {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

const SFX_COLORS: Record<string, string> = {
  impact: "#ef4444",
  boom: "#f97316",
  riser: "#8b5cf6",
  glitch: "#06b6d4",
  whoosh: "#10b981",
  transition: "#6366f1",
  heartbeat: "#f43f5e",
  click: "#eab308",
  upbeat: "#a855f7",
  silence: "#64748b",
  drop: "#64748b",
};

const SFX_ICONS: Record<string, string> = {
  impact: "🔊",
  boom: "💥",
  riser: "🎵",
  glitch: "⚡",
  whoosh: "💨",
  transition: "⚡",
  heartbeat: "💓",
  click: "🖱️",
  upbeat: "✨",
  silence: "🔇",
  drop: "🔇",
};

const MOOD_DESCRIPTIONS: Record<string, string> = {
  dark_documentary: "Dark Documentary — tension & heavy drones",
  mysterious: "Mysterious — atmospheric & intriguing pads",
  upbeat: "Upbeat — high-energy & motivating rhythms",
};

function toWebAssetUrl(localPath: string): string {
  if (!localPath) return "";
  const normalized = localPath.replace(/\\/g, "/");
  const idx = normalized.indexOf("assets/");
  if (idx !== -1) {
    return apiUrl("/" + normalized.slice(idx));
  }
  return apiUrl(localPath);
}

// ── Main Studio Page ──────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const router = useRouter();
  const routeParams = useParams();
  const jobId = typeof routeParams?.jobId === "string" ? routeParams.jobId : "";

  // Data states
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [events, setEvents] = useState<SFXEvent[]>([]);
  const [musicConfig, setMusicConfig] = useState<MusicConfig | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [library, setLibrary] = useState<SFXLibraryItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Playback & Timing
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1); // 1x to 4x

  // Audio Previews
  const [previewAudioPath, setPreviewAudioPath] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Export & UI States
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [error, setError] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerCategory, setDrawerCategory] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineViewportRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load timeline data
  useEffect(() => {
    if (!jobId) return;
    fetch(apiUrl(`/api/analyze/${jobId}`))
      .then((r) => {
        if (!r.ok) throw new Error("Timeline not found");
        return r.json();
      })
      .then((data: TimelineResult) => {
        setTimeline(data);
        setEvents([...data.sfx_events]);
        setMusicConfig(data.music_config);
        if (data.sfx_events.length > 0) {
          setSelectedEventId(data.sfx_events[0].id);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [jobId]);

  // Load SFX library catalog
  useEffect(() => {
    fetch(apiUrl("/api/library/sfx"))
      .then((r) => r.ok && r.json())
      .then((data) => data && setLibrary(data))
      .catch(() => {});
  }, []);

  const dur = timeline?.video_duration ?? 60.0;

  // Video time update handler
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Master Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Keyboard shortcuts (Space = Play/Pause, Arrows = Seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seekTo(Math.min(dur, currentTime + 1));
      } else if (e.code === "KeyL") {
        e.preventDefault();
        setShowDrawer((d) => !d);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, currentTime, dur]);

  // Seek video & playhead
  const seekTo = (timestamp: number, eventId?: string) => {
    const clamped = Math.max(0, Math.min(dur, timestamp));
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
    if (eventId) {
      setSelectedEventId(eventId);
    }
  };

  // Sound Effect Audio Preview
  const playAudioPreview = (path: string) => {
    const url = toWebAssetUrl(path);
    if (!url) return;

    if (previewAudioPath === path) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setPreviewAudioPath(null);
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    const audio = new Audio(url);
    audioPreviewRef.current = audio;
    setPreviewAudioPath(path);
    audio.onended = () => setPreviewAudioPath(null);
    audio.play().catch(() => setPreviewAudioPath(null));
  };

  // Insert Sound Effect from Drawer
  const insertSoundEffect = (item: SFXLibraryItem) => {
    const path = `assets/sfx/${item.folder}/${item.filename}`;
    const newEvent: SFXEvent = {
      id: "sfx-" + Math.random().toString(36).substr(2, 9),
      timestamp: parseFloat(currentTime.toFixed(2)),
      tag: item.type.toUpperCase(),
      sfx_type: item.type,
      sfx_path: path,
      volume: 0.65,
      label: item.type.toUpperCase(),
      text_snippet: `Custom: ${item.filename.slice(0, 24)}`,
    };

    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.timestamp - b.timestamp));
    setSelectedEventId(newEvent.id);
    playAudioPreview(path);
    showToast(`✨ Added "${item.type.toUpperCase()}" at ${formatTs(currentTime)}`);
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedEventId === id) setSelectedEventId(null);
    showToast("🗑️ Sound effect removed");
  };

  // Update volume
  const handleVolumeChange = (id: string, vol: number) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, volume: vol } : e))
    );
  };

  // Export video
  async function handleExport() {
    setExporting(true);
    setExportProgress(15);
    setError("");

    try {
      const progressInterval = setInterval(() => {
        setExportProgress((p) => Math.min(p + 8, 90));
      }, 800);

      const res = await fetch(apiUrl(`/api/export/${jobId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sfx_events: sfxEnabled ? events : [],
          music_config: musicEnabled ? musicConfig : null,
          music_enabled: musicEnabled,
          sfx_enabled: sfxEnabled,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Export failed" }));
        throw new Error(err.detail ?? "Export failed");
      }

      setExportProgress(100);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auto_audio_${jobId.slice(0, 8)}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      setExportDone(true);
      showToast("🎉 Video successfully rendered and downloaded!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      showToast("❌ Export failed");
    } finally {
      setExporting(false);
    }
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p className="text-slate-400 text-sm font-medium">Opening Auto Audio Studio workspace…</p>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const filteredLibrary = library.filter((item) => {
    const matchesCategory = drawerCategory === "all" || item.type === drawerCategory;
    const matchesSearch =
      !drawerSearch ||
      item.filename.toLowerCase().includes(drawerSearch.toLowerCase()) ||
      item.type.toLowerCase().includes(drawerSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen flex flex-col bg-[#08090f] text-slate-100 select-none">
      {/* ── Top Header ── */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-white/5 bg-[#0a0c16] sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            ← New Project
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-base tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Auto<span className="text-indigo-400">Audio</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              Studio Pro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Track Mute Toggles */}
          <div className="flex items-center gap-3 bg-white/5 px-3 py-1 rounded-xl border border-white/10 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                className="custom-check"
                checked={musicEnabled}
                onChange={(e) => setMusicEnabled(e.target.checked)}
              />
              Music ({musicEnabled ? "ON" : "OFF"})
            </label>
            <div className="h-3 w-px bg-white/10" />
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                className="custom-check"
                checked={sfxEnabled}
                onChange={(e) => setSfxEnabled(e.target.checked)}
              />
              SFX ({events.length})
            </label>
          </div>

          {/* Sound Library Drawer Toggle */}
          <button
            onClick={() => setShowDrawer(true)}
            className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
          >
            <span>📁</span> Sound Library (103)
          </button>

          {/* Export Button */}
          <button
            id="export-btn"
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {exporting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                <span>Exporting ({exportProgress}%)…</span>
              </>
            ) : exportDone ? (
              "✓ Re-download Video"
            ) : (
              "Render & Export ➔"
            )}
          </button>
        </div>
      </header>

      {/* ── Main Split View (Video Preview + Sound Inspector) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* ── Left Pane: Video Player Viewport (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl flex items-center justify-center group">
            <video
              ref={videoRef}
              src={apiUrl(`/uploads/${jobId}/video.mp4`)}
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Video overlay play button */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-2xl bg-indigo-600/90 text-white text-2xl flex items-center justify-center backdrop-blur-md shadow-2xl shadow-indigo-500/40 hover:scale-110 transition-transform"
              >
                ▶
              </button>
            )}

            {/* Timecode overlay HUD */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 font-mono text-xs text-indigo-300 font-bold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-ping" : "bg-slate-500"}`} />
              {formatTs(currentTime)} / {formatTs(dur)}
            </div>
          </div>

          {/* Quick Playback Bar */}
          <div className="glass rounded-xl px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => seekTo(Math.max(0, currentTime - 5))}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5"
                title="Rewind 5s"
              >
                ⏪ -5s
              </button>
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                onClick={() => seekTo(Math.min(dur, currentTime + 5))}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5"
                title="Forward 5s"
              >
                +5s ⏩
              </button>
            </div>

            <span className="text-xs font-mono text-slate-400">
              {events.length} Sound Effects • {musicConfig ? MOOD_DESCRIPTIONS[musicConfig.mood]?.split(" — ")[0] : "No Music"}
            </span>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Zoom</span>
              {[1, 1.5, 2].map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                    zoom === z ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Pane: Inspector & Sound Event Details (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-1">
          {/* Selected SFX Inspector Card */}
          {selectedEvent ? (
            <div className="glass glass-glow rounded-2xl p-5 border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{SFX_ICONS[selectedEvent.sfx_type] ?? "🔊"}</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{selectedEvent.label}</span>
                      <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        {formatTs(selectedEvent.timestamp)}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                      {selectedEvent.sfx_path.split(/[\\/]/).pop()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playAudioPreview(selectedEvent.sfx_path)}
                    className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 flex items-center justify-center text-xs"
                    title="Play Preview"
                  >
                    {previewAudioPath === selectedEvent.sfx_path ? "⏸" : "▶"}
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-xs"
                    title="Delete Event"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Subtitle Snippet */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 italic">
                &quot;{selectedEvent.text_snippet}&quot;
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">SFX Gain / Volume</span>
                  <span className="text-indigo-300 font-bold">
                    {Math.round(selectedEvent.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(selectedEvent.volume * 100)}
                  onChange={(e) => handleVolumeChange(selectedEvent.id, parseInt(e.target.value) / 100)}
                  className="slider"
                  style={{ "--pct": `${Math.round(selectedEvent.volume * 100)}%` } as React.CSSProperties}
                />
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center text-slate-500">
              <p className="text-xs">Select any sound clip on the timeline below to edit its properties</p>
            </div>
          )}

          {/* Background Music Card */}
          {musicConfig && (
            <div className="glass rounded-2xl p-4 border-violet-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎵</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {MOOD_DESCRIPTIONS[musicConfig.mood] ?? musicConfig.mood}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                      {musicConfig.track_path.split(/[\\/]/).pop()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => playAudioPreview(musicConfig.track_path)}
                  className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 flex items-center justify-center text-xs"
                >
                  {previewAudioPath === musicConfig.track_path ? "⏸" : "▶"}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-mono">MUSIC VOL</span>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={Math.round(musicConfig.volume * 100)}
                  onChange={(e) =>
                    setMusicConfig((m) =>
                      m ? { ...m, volume: parseInt(e.target.value) / 100 } : m
                    )
                  }
                  className="slider flex-1"
                  style={{ "--pct": `${Math.round((musicConfig.volume / 0.3) * 100)}%` } as React.CSSProperties}
                />
                <span className="text-xs font-mono text-violet-300 font-bold w-8 text-right">
                  {Math.round(musicConfig.volume * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom DAW Multi-Track Studio Timeline ── */}
      <div className="px-6 pb-6">
        <div className="daw-viewport" ref={timelineViewportRef}>
          {/* DAW Time Ruler */}
          <div
            className="daw-ruler flex items-center cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left - 140; // account for track header
              const width = (rect.width - 140);
              if (width > 0 && clickX >= 0) {
                seekTo((clickX / width) * dur);
              }
            }}
          >
            <div className="w-[140px] min-w-[140px] px-3 text-[10px] font-mono text-slate-500 uppercase font-bold border-r border-white/5">
              Timeline DAW
            </div>
            <div className="flex-1 relative h-full">
              {/* Playhead Needle Handle */}
              <div
                className="daw-playhead-line"
                style={{ left: `${(currentTime / Math.max(1, dur)) * 100}%` }}
              >
                <div className="daw-playhead-handle" />
              </div>

              {/* Time tick labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                <span
                  key={pct}
                  className="absolute top-1.5 text-[9px] font-mono text-slate-500 -translate-x-1/2"
                  style={{ left: `${pct * 100}%` }}
                >
                  {formatTs(pct * dur)}
                </span>
              ))}
            </div>
          </div>

          {/* Track 1: Subtitle / Speech Segments */}
          <div className="daw-track-row">
            <div className="daw-track-header">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <span>🎙️</span> Narration
              </span>
              <span className="text-[9px] text-slate-500">
                {timeline?.analyzed_segments.length ?? 0} segments
              </span>
            </div>
            <div
              className="daw-track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                seekTo((clickX / rect.width) * dur);
              }}
            >
              {timeline?.analyzed_segments.map((seg) => {
                const left = (seg.start_sec / Math.max(1, dur)) * 100;
                const width = Math.max(2, ((seg.end_sec - seg.start_sec) / Math.max(1, dur)) * 100);
                return (
                  <div
                    key={seg.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      seekTo(seg.start_sec);
                    }}
                    className="absolute top-1.5 bottom-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 px-2 flex items-center text-[10px] text-slate-300 truncate cursor-pointer transition-colors"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`"${seg.text}" (${formatTs(seg.start_sec)})`}
                  >
                    <span className="truncate">{seg.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Sound Effects (SFX) Track */}
          <div className="daw-track-row" style={{ minHeight: 64 }}>
            <div className="daw-track-header">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <span>⚡</span> Sound Effects
              </span>
              <span className="text-[9px] text-slate-500">{events.length} clips placed</span>
            </div>
            <div
              className="daw-track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                seekTo((clickX / rect.width) * dur);
              }}
            >
              {events.map((ev) => {
                const left = (ev.timestamp / Math.max(1, dur)) * 100;
                const color = SFX_COLORS[ev.sfx_type] || "#6366f1";
                const isSelected = selectedEventId === ev.id;

                return (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekTo(ev.timestamp, ev.id);
                    }}
                    className={`daw-clip ${isSelected ? "selected" : ""}`}
                    style={{
                      left: `${left}%`,
                      backgroundColor: `${color}33`,
                      border: `1px solid ${color}`,
                      color: color,
                    }}
                  >
                    <span>{SFX_ICONS[ev.sfx_type]}</span>
                    <span>{ev.label}</span>
                    <span className="text-[9px] opacity-75 font-mono">
                      {Math.round(ev.volume * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3: Ambient Music Bed */}
          <div className="daw-track-row">
            <div className="daw-track-header">
              <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                <span>🎵</span> Ambient Score
              </span>
              <span className="text-[9px] text-slate-500">
                {musicConfig ? musicConfig.mood : "Disabled"}
              </span>
            </div>
            <div
              className="daw-track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                seekTo((clickX / rect.width) * dur);
              }}
            >
              {musicConfig && musicEnabled && (
                <div
                  className="absolute inset-y-1.5 inset-x-0 rounded bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-violet-500/20 border border-violet-500/30 flex items-center px-4 justify-between"
                >
                  <span className="text-[10px] text-violet-300 font-mono">
                    {musicConfig.track_path.split(/[\\/]/).pop()}
                  </span>
                  <span className="text-[9px] font-mono text-violet-400">
                    Looping Continuous
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide-Out Sound Library Drawer ── */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="sound-drawer">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f1220]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Sound Library Catalog</h3>
                  <p className="text-[10px] text-slate-400">103 studio sounds ready to drop</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="p-4 space-y-3 border-b border-white/5 bg-[#090b14]">
              <input
                type="text"
                placeholder="Search sound effects..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {["all", "impact", "boom", "riser", "glitch", "whoosh", "transition", "heartbeat", "click", "upbeat"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDrawerCategory(cat)}
                    className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider transition-colors ${
                      drawerCategory === cat
                        ? "bg-indigo-500 text-white"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredLibrary.map((item, idx) => (
                <div key={idx} className="sound-card">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => playAudioPreview(`assets/sfx/${item.folder}/${item.filename}`)}
                      className="w-7 h-7 rounded-lg bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white flex items-center justify-center text-xs flex-shrink-0 transition-colors"
                    >
                      {previewAudioPath === `assets/sfx/${item.folder}/${item.filename}` ? "⏸" : "▶"}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                        {item.filename}
                      </p>
                      <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold">
                        {item.type} • {item.duration}s
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => insertSoundEffect(item)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-600 text-[10px] font-bold text-slate-200 hover:text-white transition-colors"
                  >
                    + Insert
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="toast-banner">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
