"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
interface Settings {
  music_enabled: boolean;
  sfx_enabled: boolean;
  silence_drops: boolean;
  stage_detection: boolean;
  reveal_detection: boolean;
  hook_detection: boolean;
  music_intensity: number;
  sfx_intensity: number;
}

const DEFAULT_SETTINGS: Settings = {
  music_enabled: true,
  sfx_enabled: true,
  silence_drops: true,
  stage_detection: true,
  reveal_detection: true,
  hook_detection: true,
  music_intensity: 0.7,
  sfx_intensity: 0.55,
};

interface Preset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  settings: Partial<Settings>;
}

const PRESETS: Preset[] = [
  {
    id: "action",
    name: "Action & Hype",
    emoji: "💥",
    description: "Heavy booms, cinematic impacts & intense risers",
    settings: {
      music_intensity: 0.85,
      sfx_intensity: 0.8,
      reveal_detection: true,
      hook_detection: true,
      stage_detection: true,
      silence_drops: true,
    },
  },
  {
    id: "mystery",
    name: "Dark Mystery",
    emoji: "🕵️",
    description: "Subtle drones, digital glitches & dramatic silences",
    settings: {
      music_intensity: 0.65,
      sfx_intensity: 0.5,
      reveal_detection: true,
      hook_detection: true,
      stage_detection: true,
      silence_drops: true,
    },
  },
  {
    id: "viral",
    name: "Viral / TikTok",
    emoji: "⚡",
    description: "Fast whooshes, punchy transitions & reward chimes",
    settings: {
      music_intensity: 0.7,
      sfx_intensity: 0.7,
      reveal_detection: true,
      hook_detection: true,
      stage_detection: true,
      silence_drops: false,
    },
  },
  {
    id: "subtle",
    name: "Subtle / Ambient",
    emoji: "🧘",
    description: "Low background pads & soft organic sound effects",
    settings: {
      music_intensity: 0.35,
      sfx_intensity: 0.3,
      reveal_detection: true,
      hook_detection: false,
      stage_detection: false,
      silence_drops: false,
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FileZone({
  id,
  label,
  accept,
  file,
  onFile,
  onRemove,
  icon,
  hint,
}: {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
  onRemove: () => void;
  icon: React.ReactNode;
  hint: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div
      id={id}
      className={`drop-zone glass rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] transition-all relative ${
        dragging ? "active" : ""
      } ${file ? "border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {file ? (
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl flex-shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate max-w-[220px]">
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-indigo-400">
                  {formatBytes(file.size)}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Remove file"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div className={`text-4xl transition-transform ${dragging ? "scale-125" : ""}`}>
            {icon}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">{label}</p>
            <p className="text-xs text-slate-500 mt-1">{hint}</p>
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer group select-none py-1"
    >
      <input
        id={id}
        type="checkbox"
        className="custom-check"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}

function IntensitySlider({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = `${Math.round(value * 100)}%`;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
        <span className="text-xs font-mono text-indigo-300 font-bold px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25">
          {pct}
        </span>
      </div>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="slider w-full"
          style={{ "--pct": pct } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [autoTranscribe, setAutoTranscribe] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>("action");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  // Check backend health on mount and every 10s
  useEffect(() => {
    const checkHealth = () => {
      fetch("/api/health")
        .then((r) => r.ok && r.json())
        .then((d) => setBackendOk(!!d?.status))
        .catch(() => setBackendOk(false));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateSetting = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setActivePreset(null);
    setSettings((s) => ({ ...s, [k]: v }));
  };

  const applyPreset = (p: Preset) => {
    setActivePreset(p.id);
    setSettings((s) => ({ ...s, ...p.settings }));
  };

  const canAnalyze = !!videoFile && (!!srtFile || autoTranscribe);

  // Load sample demo script
  const loadSampleScript = () => {
    const sampleSRT = `1
00:00:01,000 --> 00:00:04,500
What if I told you that everything you remember was a simulation?

2
00:00:05,000 --> 00:00:08,200
In reality, the Mandela Effect was never supposed to happen.

3
00:00:09,000 --> 00:00:12,800
Stage 2: Years later, the entire timeline began to glitch.

4
00:00:13,500 --> 00:00:16,800
Finally, that's when everything changed forever.

5
00:00:17,500 --> 00:00:20,000
And in the end... that is why the real story remains hidden.
`;
    const srtBlob = new Blob([sampleSRT], { type: "text/plain" });
    const file = new File([srtBlob], "demo_narration.srt", { type: "text/plain" });
    setSrtFile(file);
  };

  async function handleAnalyze() {
    if (!videoFile) return;
    setError("");
    setStatus("uploading");
    setProgress(15);

    try {
      // 1. Upload
      const form = new FormData();
      form.append("video", videoFile);
      if (srtFile) form.append("srt", srtFile);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail ?? "Upload failed");
      }
      const { job_id } = await uploadRes.json();
      setProgress(50);

      // 2. Analyze
      setStatus("analyzing");
      const analyzeRes = await fetch(`/api/analyze/${job_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error(err.detail ?? "Analysis failed");
      }
      setProgress(100);

      // Navigate to timeline review
      router.push(`/analyze/${job_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
      setProgress(0);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-xl bg-[rgba(8,9,15,0.7)] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0d0f1a] rounded-[10px] flex items-center justify-center text-base">
              🎬
            </div>
          </div>
          <div>
            <span
              className="font-bold text-lg tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Auto<span className="text-indigo-400">Audio</span>
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block -mt-1 font-semibold">
              AI Sound Studio
            </span>
          </div>
        </div>

        {/* Backend status pill */}
        <div
          className={`flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border transition-all ${
            backendOk === null
              ? "text-slate-500 border-white/10 bg-white/5"
              : backendOk
              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-sm shadow-emerald-500/20"
              : "text-red-400 border-red-500/30 bg-red-500/10 shadow-sm shadow-red-500/20"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendOk === null
                ? "bg-slate-600"
                : backendOk
                ? "bg-emerald-400 animate-pulse"
                : "bg-red-400"
            }`}
          />
          <span className="font-semibold">
            {backendOk === null ? "Connecting…" : backendOk ? "Engine Online" : "Engine Offline"}
          </span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 pt-12 pb-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 mb-4 shadow-sm">
          <span>✨</span> Intelligent Multi-Track Sound Design
        </div>
        <h1
          className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Drop your video.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AI scores the sound in seconds.
          </span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          The engine reads your script, detects every hook, reveal, and climax, then places precision sound effects and ambient music automatically.
        </p>
      </section>

      {/* ── Sound Design Presets ── */}
      <section className="max-w-5xl mx-auto w-full px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Choose a Sound Profile
          </p>
          <span className="text-[11px] text-slate-500">Click to instantly configure style</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`preset-card ${activePreset === p.id ? "selected" : ""}`}
            >
              <div className="text-2xl mb-1">{p.emoji}</div>
              <p className="text-sm font-bold text-slate-100">{p.name}</p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Main grid ── */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 pb-16 grid md:grid-cols-2 gap-6">
        {/* ── Left: Upload ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              1. Media & Narration
            </h2>
            {!srtFile && (
              <button
                type="button"
                onClick={loadSampleScript}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"
              >
                <span>⚡</span> Load Demo Script
              </button>
            )}
          </div>

          <FileZone
            id="video-drop"
            label="Drop your video here"
            accept="video/*"
            file={videoFile}
            onFile={setVideoFile}
            onRemove={() => setVideoFile(null)}
            icon="🎬"
            hint="MP4, MOV, MKV, AVI, WEBM"
          />

          {!autoTranscribe ? (
            <FileZone
              id="srt-drop"
              label="Drop your subtitle file (.srt / .vtt)"
              accept=".srt,.vtt"
              file={srtFile}
              onFile={setSrtFile}
              onRemove={() => setSrtFile(null)}
              icon="📄"
              hint="Subtitle script for precise AI tagging"
            />
          ) : (
            <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-violet-500/30 bg-violet-500/5">
              <div className="w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl text-violet-300 flex-shrink-0">
                🎙️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">Local Whisper Transcription</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audio will be automatically transcribed on-device (no SRT needed)
                </p>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer group select-none px-1">
            <input
              id="auto-transcribe"
              type="checkbox"
              className="custom-check"
              checked={autoTranscribe}
              onChange={(e) => setAutoTranscribe(e.target.checked)}
            />
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
              Auto-transcribe speech with faster-whisper
            </span>
          </label>
        </div>

        {/* ── Right: Control Panel ── */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            2. Sound Design Settings
          </h2>

          <div className="glass glass-glow rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Detection Modules
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ["music_enabled", "Background Music"],
                  ["sfx_enabled", "Sound Effects (SFX)"],
                  ["silence_drops", "Silence / Drops"],
                  ["stage_detection", "Scene Transitions"],
                  ["reveal_detection", "Reveal Impacts"],
                  ["hook_detection", "Hook Risers"],
                ] as [keyof Settings, string][]
              ).map(([key, label]) => (
                <Toggle
                  key={key}
                  id={key}
                  label={label}
                  value={settings[key] as boolean}
                  onChange={(v) => updateSetting(key, v)}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Intensity Controls
            </p>
            <IntensitySlider
              id="music_intensity"
              label="Music Volume & Presence"
              value={settings.music_intensity}
              onChange={(v) => updateSetting("music_intensity", v)}
            />
            <IntensitySlider
              id="sfx_intensity"
              label="SFX Dynamic Power"
              value={settings.sfx_intensity}
              onChange={(v) => updateSetting("sfx_intensity", v)}
            />
          </div>
        </div>

        {/* ── Full-width bottom: Analyze button + progress ── */}
        <div className="md:col-span-2 space-y-4 pt-2">
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-300 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Progress */}
          {(status === "uploading" || status === "analyzing") && (
            <div className="glass rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>{status === "uploading" ? "Uploading video & script…" : "AI Script Analysis in progress…"}</span>
                <span className="font-mono text-indigo-400">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={!canAnalyze || status === "uploading" || status === "analyzing"}
            className="btn-primary w-full rounded-2xl py-4 text-base flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/25 animate-pulse-glow"
          >
            {status === "uploading" || status === "analyzing" ? (
              <>
                <span className="spinner" />
                <span>{status === "uploading" ? "Uploading Media…" : "Generating Sound Design…"}</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Analyze & Build Sound Design</span>
              </>
            )}
          </button>

          {!canAnalyze && (
            <p className="text-center text-xs text-slate-500">
              {!videoFile
                ? "Drop a video file to begin"
                : "Add a subtitle file (.srt) or enable auto-transcribe"}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
