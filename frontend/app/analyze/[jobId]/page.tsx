"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  silence: "🔇",
  drop: "🔇",
};

const MOOD_DESCRIPTIONS: Record<string, string> = {
  dark_documentary: "Dark documentary — cinematic tension",
  mysterious: "Mysterious — unsettling and atmospheric",
  upbeat: "Upbeat — energetic and forward-moving",
};

// ── SFX Row ───────────────────────────────────────────────────────────────────
function SFXRow({
  event,
  index,
  onDelete,
  onVolumeChange,
}: {
  event: SFXEvent;
  index: number;
  onDelete: (id: string) => void;
  onVolumeChange: (id: string, v: number) => void;
}) {
  const chipClass = SFX_CHIP_CLASSES[event.sfx_type] ?? "sfx-chip";
  const icon = SFX_ICONS[event.sfx_type] ?? "🔊";

  return (
    <div
      className="timeline-row group"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Timestamp */}
      <span className="ts flex-shrink-0">{formatTs(event.timestamp)}</span>

      {/* SFX type chip */}
      <span className={chipClass}>
        {icon} {event.label}
      </span>

      {/* Text snippet */}
      <span className="flex-1 text-sm text-slate-400 truncate min-w-0">
        &quot;{event.text_snippet}&quot;
      </span>

      {/* Volume micro-slider */}
      <div className="hidden group-hover:flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-slate-600 font-mono">VOL</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(event.volume * 100)}
          onChange={(e) => onVolumeChange(event.id, parseInt(e.target.value) / 100)}
          className="slider"
          style={{ width: 72, "--pct": `${Math.round(event.volume * 100)}%` } as React.CSSProperties}
        />
        <span className="text-[10px] text-indigo-300 font-mono w-8">
          {Math.round(event.volume * 100)}%
        </span>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(event.id)}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
        title="Remove this SFX"
      >
        ×
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyzePage({
  params,
}: {
  params: { jobId: string };
}) {
  const router = useRouter();
  const { jobId } = params;

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

  // Load timeline from API
  useEffect(() => {
    fetch(`/api/analyze/${jobId}`)
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

  const handleDelete = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleVolumeChange = useCallback((id: string, vol: number) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, volume: vol } : e))
    );
  }, []);

  async function handleExport() {
    setExporting(true);
    setExportProgress(10);
    setError("");

    try {
      // Simulate progress while rendering
      const progressInterval = setInterval(() => {
        setExportProgress((p) => Math.min(p + 5, 88));
      }, 1200);

      const res = await fetch(`/api/export/${jobId}`, {
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

      // Trigger download
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

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p className="text-slate-400 text-sm">Loading timeline…</p>
      </div>
    );
  }

  if (error && !timeline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-4xl">⚠️</div>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm"
        >
          Start over
        </button>
      </div>
    );
  }

  const dur = timeline?.video_duration ?? 0;
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
            className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-1.5"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-white/10" />
          <span
            className="font-bold text-lg tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Auto<span className="text-indigo-400">Audio</span>
          </span>
          <span className="text-xs text-slate-600 font-mono">{jobId.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Music / SFX toggles */}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400 hover:text-white transition-colors">
            <input
              type="checkbox"
              className="custom-check"
              checked={musicEnabled}
              onChange={(e) => setMusicEnabled(e.target.checked)}
            />
            Music
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400 hover:text-white transition-colors">
            <input
              type="checkbox"
              className="custom-check"
              checked={sfxEnabled}
              onChange={(e) => setSfxEnabled(e.target.checked)}
            />
            SFX
          </label>

          <button
            id="export-btn"
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
          >
            {exporting ? (
              <>
                <span className="spinner" />
                Rendering…
              </>
            ) : exportDone ? (
              "✓ Downloaded"
            ) : (
              "Export Video →"
            )}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
        {/* ── Export progress ── */}
        {exporting && (
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 font-semibold">Rendering video with FFmpeg…</span>
              <span className="text-indigo-300 font-mono">{exportProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${exportProgress}%` }} />
            </div>
            <p className="text-xs text-slate-600">
              Mixing {events.length} SFX events + background music into your video
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Duration", value: formatTs(dur) },
            { label: "SFX Events", value: String(events.length) },
            {
              label: "Music",
              value: musicConfig
                ? MOOD_DESCRIPTIONS[musicConfig.mood]?.split(" — ")[0] ?? musicConfig.mood
                : "None",
            },
            {
              label: "Music Vol",
              value: musicConfig ? `${Math.round(musicConfig.volume * 100)}%` : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                {label}
              </p>
              <p className="text-sm font-bold text-slate-200 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* ── SFX type summary ── */}
        {Object.keys(tagCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(tagCounts).map(([type, count]) => (
              <span
                key={type}
                className={SFX_CHIP_CLASSES[type] ?? "sfx-chip"}
              >
                {SFX_ICONS[type]} {type.toUpperCase()} × {count}
              </span>
            ))}
          </div>
        )}

        {/* ── Timeline ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              SFX Timeline
            </h2>
            <p className="text-xs text-slate-600">
              Hover a row to adjust volume or delete
            </p>
          </div>

          {events.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-600">
              <div className="text-4xl mb-3">🔇</div>
              <p className="text-sm">No SFX events — try lowering the intensity threshold or enabling more detectors.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event, i) => (
                <SFXRow
                  key={event.id}
                  event={event}
                  index={i}
                  onDelete={handleDelete}
                  onVolumeChange={handleVolumeChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Music config ── */}
        {musicConfig && musicEnabled && (
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Background Music
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl flex-shrink-0">
                🎵
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">
                  {MOOD_DESCRIPTIONS[musicConfig.mood] ?? musicConfig.mood}
                </p>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {musicConfig.track_path.split(/[\\/]/).slice(-2).join("/")}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-slate-600 font-mono">VOL</span>
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
                <span className="text-xs font-mono text-violet-300 w-10 text-right">
                  {Math.round(musicConfig.volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Analyzed segments table (collapsible) ── */}
        <details className="group">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors select-none flex items-center gap-2">
            <span className="inline-block transition-transform group-open:rotate-90">▶</span>
            AI Tag Analysis ({timeline?.analyzed_segments.length ?? 0} segments)
          </summary>
          <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
            {timeline?.analyzed_segments
              .filter((s) => s.tag !== "NONE")
              .map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors"
                >
                  <span className="ts">{formatTs(seg.start_sec)}</span>
                  <span
                    className={`sfx-chip ${seg.tag.toLowerCase()}`}
                    style={{ fontSize: 10 }}
                  >
                    {seg.tag}
                  </span>
                  <span className="text-xs text-slate-500 truncate flex-1">{seg.text}</span>
                  <span className="text-[10px] text-slate-700 font-mono">
                    {Math.round(seg.confidence * 100)}%
                  </span>
                </div>
              ))}
          </div>
        </details>
      </div>
    </main>
  );
}
