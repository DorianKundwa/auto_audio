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

interface TimelineResult {
  job_id: string;
  video_duration: number;
  sfx_events: SFXEvent[];
  music_config: MusicConfig;
  analyzed_segments: {
    id: number;
    start_sec: number;
    end_sec: number;
    text: string;
    tag: string;
    confidence: number;
  }[];
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
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

const SFX_CHIP_CLASSES: Record<string, string> = {
  impact: "sfx-chip impact",
  boom: "sfx-chip boom",
  riser: "sfx-chip riser",
  glitch: "sfx-chip glitch",
  whoosh: "sfx-chip whoosh",
  transition: "sfx-chip transition",
  heartbeat: "sfx-chip heartbeat",
  click: "sfx-chip click",
  upbeat: "sfx-chip upbeat",
  silence: "sfx-chip silence",
  drop: "sfx-chip drop",
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

const MOOD_DESCRIPTIONS: Record<string, string> = {
  dark_documentary: "Dark Documentary — cinematic tension & drone pads",
  mysterious: "Mysterious — unsettling atmospheric beds",
  upbeat: "Upbeat — positive, energetic & light",
};

// Convert absolute local path to web static URL
function toWebAssetUrl(localPath: string): string {
  if (!localPath) return "";
  const normalized = localPath.replace(/\\/g, "/");
  const idx = normalized.indexOf("assets/");
  if (idx !== -1) {
    return apiUrl("/" + normalized.slice(idx));
  }
  return apiUrl(localPath);
}

// ── SFX Row Component ─────────────────────────────────────────────────────────
function SFXRow({
  event,
  index,
  isActive,
  isPlaying,
  onPlayPreview,
  onDelete,
  onVolumeChange,
  onSeek,
}: {
  event: SFXEvent;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlayPreview: (path: string) => void;
  onDelete: (id: string) => void;
  onVolumeChange: (id: string, v: number) => void;
  onSeek: (timestamp: number) => void;
}) {
  const chipClass = SFX_CHIP_CLASSES[event.sfx_type] ?? "sfx-chip";
  const icon = SFX_ICONS[event.sfx_type] ?? "🔊";

  return (
    <div
      id={`sfx-row-${event.id}`}
      className={`timeline-row group ${isActive ? "active" : ""}`}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      {/* Timestamp button (click to seek) */}
      <button
        type="button"
        onClick={() => onSeek(event.timestamp)}
        className="ts flex-shrink-0 hover:text-indigo-300 transition-colors cursor-pointer text-left"
        title="Click to seek video"
      >
        {formatTs(event.timestamp)}
      </button>

      {/* Audio Play Preview */}
      <button
        type="button"
        onClick={() => onPlayPreview(event.sfx_path)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 transition-all ${
          isPlaying
            ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105"
            : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
        }`}
        title={isPlaying ? "Pause Preview" : "Play SFX Preview"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      {/* SFX type chip */}
      <span className={chipClass}>
        {icon} {event.label}
      </span>

      {/* Text snippet */}
      <span className="flex-1 text-sm text-slate-300 truncate min-w-0 font-medium">
        &quot;{event.text_snippet}&quot;
      </span>

      {/* Volume micro-slider */}
      <div className="flex items-center gap-2 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-slate-500 font-mono">VOL</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(event.volume * 100)}
          onChange={(e) => onVolumeChange(event.id, parseInt(e.target.value) / 100)}
          className="slider"
          style={{ width: 72, "--pct": `${Math.round(event.volume * 100)}%` } as React.CSSProperties}
        />
        <span className="text-[10px] text-indigo-300 font-mono w-7 text-right">
          {Math.round(event.volume * 100)}%
        </span>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(event.id)}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-40 group-hover:opacity-100"
        title="Remove this SFX"
      >
        ✕
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const router = useRouter();
  const routeParams = useParams();
  const jobId = typeof routeParams?.jobId === "string" ? routeParams.jobId : "";

  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [events, setEvents] = useState<SFXEvent[]>([]);
  const [musicConfig, setMusicConfig] = useState<MusicConfig | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [error, setError] = useState("");

  // Audio Preview Player
  const [playingPath, setPlayingPath] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  // Video reference
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Add SFX Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [library, setLibrary] = useState<SFXLibraryItem[]>([]);
  const [newSfxType, setNewSfxType] = useState("impact");
  const [newTimestamp, setNewTimestamp] = useState("2.5");
  const [newVolume, setNewVolume] = useState(0.65);

  // Load timeline from API
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
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [jobId]);

  // Load SFX library catalog for modal
  useEffect(() => {
    fetch(apiUrl("/api/library/sfx"))
      .then((r) => r.ok && r.json())
      .then((data) => data && setLibrary(data))
      .catch(() => {});
  }, []);

  const handleDelete = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleVolumeChange = useCallback((id: string, vol: number) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, volume: vol } : e))
    );
  }, []);

  // Handle Playback Preview for SFX
  const handlePlayPreview = useCallback((path: string) => {
    const webUrl = toWebAssetUrl(path);
    if (!webUrl) return;

    if (playingPath === path) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingPath(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(webUrl);
    audioRef.current = audio;
    setPlayingPath(path);

    audio.onended = () => {
      setPlayingPath(null);
      audioRef.current = null;
    };
    audio.play().catch(() => setPlayingPath(null));
  }, [playingPath]);

  // Handle Background Music Preview
  const handleToggleMusicPreview = useCallback(() => {
    if (!musicConfig?.track_path) return;
    const webUrl = toWebAssetUrl(musicConfig.track_path);
    if (!webUrl) return;

    if (musicPlaying) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      setMusicPlaying(false);
    } else {
      const audio = new Audio(webUrl);
      audio.volume = Math.min(1.0, musicConfig.volume * 2.5);
      audio.loop = true;
      musicAudioRef.current = audio;
      audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    }
  }, [musicConfig, musicPlaying]);

  // Handle Video Timeline Seek
  const handleSeek = (timestamp: number, eventId?: string) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play().catch(() => {});
    }
    setCurrentTime(timestamp);
    if (eventId) {
      setActiveEventId(eventId);
      const el = document.getElementById(`sfx-row-${eventId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  // Add Manual SFX to Timeline
  const handleAddSFX = () => {
    const ts = parseFloat(newTimestamp) || 0;
    const matches = library.filter((item) => item.type === newSfxType);
    const item = matches.length > 0 ? matches[0] : null;

    const newEvent: SFXEvent = {
      id: "manual-" + Math.random().toString(36).substr(2, 9),
      timestamp: Math.max(0, Math.min(ts, dur)),
      tag: newSfxType.toUpperCase(),
      sfx_type: newSfxType,
      sfx_path: item ? `assets/sfx/${item.folder}/${item.filename}` : "",
      volume: newVolume,
      label: newSfxType.toUpperCase(),
      text_snippet: "Custom Placed SFX",
    };

    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.timestamp - b.timestamp));
    setShowAddModal(false);
  };

  // Export video via FFmpeg
  async function handleExport() {
    setExporting(true);
    setExportProgress(10);
    setError("");

    try {
      const progressInterval = setInterval(() => {
        setExportProgress((p) => Math.min(p + 6, 88));
      }, 1000);

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

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auto_audio_${jobId.slice(0, 8)}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      setExportDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p className="text-slate-400 text-sm font-medium">Analyzing script & scoring sound design…</p>
      </div>
    );
  }

  if (error && !timeline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-4xl">⚠️</div>
        <p className="text-red-400 text-sm font-semibold">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm"
        >
          Start over
        </button>
      </div>
    );
  }

  const dur = timeline?.video_duration ?? 60.0;
  const tagCounts: Record<string, number> = {};
  for (const e of events) {
    tagCounts[e.sfx_type] = (tagCounts[e.sfx_type] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-xl bg-[rgba(8,9,15,0.7)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 font-medium"
          >
            ← New Project
          </button>
          <div className="h-4 w-px bg-white/10" />
          <span
            className="font-bold text-lg tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Auto<span className="text-indigo-400">Audio</span>
          </span>
          <span className="text-xs text-slate-500 font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
            {jobId.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Music / SFX toggles */}
          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                className="custom-check"
                checked={musicEnabled}
                onChange={(e) => setMusicEnabled(e.target.checked)}
              />
              Music
            </label>
            <div className="h-3 w-px bg-white/10" />
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                className="custom-check"
                checked={sfxEnabled}
                onChange={(e) => setSfxEnabled(e.target.checked)}
              />
              SFX
            </label>
          </div>

          <button
            id="export-btn"
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {exporting ? (
              <>
                <span className="spinner" />
                <span>Rendering…</span>
              </>
            ) : exportDone ? (
              "✓ Export Downloaded"
            ) : (
              "Export Video →"
            )}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
        {/* ── Export progress ── */}
        {exporting && (
          <div className="glass rounded-2xl p-5 space-y-3 border-indigo-500/30">
            <div className="flex justify-between text-sm">
              <span className="text-slate-200 font-semibold flex items-center gap-2">
                <span className="spinner" /> Rendering multi-track audio with FFmpeg…
              </span>
              <span className="text-indigo-400 font-mono font-bold">{exportProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${exportProgress}%` }} />
            </div>
            <p className="text-xs text-slate-500">
              Mixing {events.length} dynamic SFX events and background score with sample-accurate delay.
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
            <span>⚠️</span> <span>{error}</span>
          </div>
        )}

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Duration", value: formatTs(dur) },
            { label: "SFX Events Placed", value: String(events.length) },
            {
              label: "Background Track",
              value: musicConfig ? MOOD_DESCRIPTIONS[musicConfig.mood]?.split(" — ")[0] ?? musicConfig.mood : "None",
            },
            {
              label: "Music Volume",
              value: musicConfig ? `${Math.round(musicConfig.volume * 100)}%` : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-xl p-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
                {label}
              </p>
              <p className="text-base font-bold text-slate-100 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Interactive Visual Timeline Scrubber ── */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>🎚️</span> Visual Timeline Track
            </span>
            <span className="text-xs font-mono text-indigo-300">
              Current: {formatTs(currentTime)} / {formatTs(dur)}
            </span>
          </div>

          <div
            className="timeline-scrubber"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              handleSeek(ratio * dur);
            }}
          >
            {/* Progress fill */}
            <div
              className="timeline-scrubber-progress"
              style={{ width: `${(currentTime / Math.max(1, dur)) * 100}%` }}
            />

            {/* Event marker pins */}
            {events.map((e) => {
              const pct = (e.timestamp / Math.max(1, dur)) * 100;
              const color = SFX_COLORS[e.sfx_type] || "#6366f1";
              return (
                <div
                  key={e.id}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleSeek(e.timestamp, e.id);
                  }}
                  className="timeline-marker-pin"
                  style={{
                    left: `${pct}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                  title={`${e.label} at ${formatTs(e.timestamp)} - "${e.text_snippet}"`}
                />
              );
            })}
          </div>

          {/* SFX Category chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {Object.entries(tagCounts).map(([type, count]) => (
              <span key={type} className={SFX_CHIP_CLASSES[type] ?? "sfx-chip"}>
                {SFX_ICONS[type]} {type.toUpperCase()} × {count}
              </span>
            ))}
          </div>
        </div>

        {/* ── Background Music Config Card ── */}
        {musicConfig && musicEnabled && (
          <div className="glass rounded-2xl p-5 border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-transparent">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3 flex items-center gap-2">
              <span>🎵</span> Ambient Score Track
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleToggleMusicPreview}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all ${
                  musicPlaying
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30 scale-105"
                    : "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                }`}
                title={musicPlaying ? "Pause music preview" : "Play music preview"}
              >
                {musicPlaying ? "⏸" : "▶"}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100">
                  {MOOD_DESCRIPTIONS[musicConfig.mood] ?? musicConfig.mood}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                  {musicConfig.track_path.split(/[\\/]/).slice(-1)[0]}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">VOL</span>
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
                  className="slider"
                  style={{
                    width: 100,
                    "--pct": `${Math.round((musicConfig.volume / 0.3) * 100)}%`,
                  } as React.CSSProperties}
                />
                <span className="text-xs font-mono text-violet-300 w-10 text-right font-bold">
                  {Math.round(musicConfig.volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Timeline Header & Actions ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2
              className="text-xl font-black tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Sound Design Timeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click timestamps to seek, preview audio hits, or fine-tune volumes
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-secondary px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
          >
            <span>➕</span> Add Sound Effect
          </button>
        </div>

        {/* ── SFX Event List ── */}
        {events.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-500">
            <div className="text-4xl mb-3">🔇</div>
            <p className="text-sm font-medium">No SFX events found. Try adding a sound effect manually!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map((event, i) => (
              <SFXRow
                key={event.id}
                event={event}
                index={i}
                isActive={activeEventId === event.id}
                isPlaying={playingPath === event.sfx_path}
                onPlayPreview={handlePlayPreview}
                onDelete={handleDelete}
                onVolumeChange={handleVolumeChange}
                onSeek={(ts) => handleSeek(ts, event.id)}
              />
            ))}
          </div>
        )}

        {/* ── Analyzed Subtitle Segments Table (Collapsible) ── */}
        <details className="group glass rounded-2xl p-4">
          <summary className="cursor-pointer text-xs uppercase font-bold tracking-widest text-slate-400 hover:text-slate-200 transition-colors select-none flex items-center gap-2">
            <span className="inline-block transition-transform group-open:rotate-90">▶</span>
            AI Script Tag Classification ({timeline?.analyzed_segments.length ?? 0} subtitle segments)
          </summary>
          <div className="mt-4 space-y-1.5 max-h-72 overflow-y-auto pr-2">
            {timeline?.analyzed_segments
              .filter((s) => s.tag !== "NONE")
              .map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-xs"
                >
                  <span className="ts">{formatTs(seg.start_sec)}</span>
                  <span className={`sfx-chip ${seg.tag.toLowerCase()}`} style={{ fontSize: 10 }}>
                    {seg.tag}
                  </span>
                  <span className="text-slate-300 truncate flex-1 font-medium">{seg.text}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Math.round(seg.confidence * 100)}% conf
                  </span>
                </div>
              ))}
          </div>
        </details>
      </div>

      {/* ── Add Custom SFX Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass glass-glow rounded-2xl max-w-md w-full p-6 space-y-5 bg-[#0d0f1a] border-indigo-500/30">
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-bold text-slate-100"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                ➕ Add Sound Effect
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Sound Effect Category
                </label>
                <select
                  value={newSfxType}
                  onChange={(e) => setNewSfxType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="impact">🔊 Impact (Hits & Crashes)</option>
                  <option value="boom">💥 Boom (Subsonic & Bass Drops)</option>
                  <option value="riser">🎵 Riser (Tension & Sweeps)</option>
                  <option value="glitch">⚡ Glitch (Digital & Tech)</option>
                  <option value="whoosh">💨 Whoosh (Swipes & Air)</option>
                  <option value="transition">⚡ Transition (Scene Cuts)</option>
                  <option value="heartbeat">💓 Heartbeat (Pulses & Clocks)</option>
                  <option value="click">🖱️ Click (Foley & UI)</option>
                  <option value="upbeat">✨ Upbeat (Reward Chimes)</option>
                  <option value="silence">🔇 Drop / Silence</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Timestamp (seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={dur}
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Volume
                  </label>
                  <span className="text-xs font-mono text-indigo-300 font-bold">
                    {Math.round(newVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(newVolume * 100)}
                  onChange={(e) => setNewVolume(parseInt(e.target.value) / 100)}
                  className="slider w-full"
                  style={{ "--pct": `${Math.round(newVolume * 100)}%` } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary px-4 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSFX}
                className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
              >
                Add to Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
