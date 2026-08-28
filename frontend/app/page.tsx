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
  sfx_intensity: 0.5,
};

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
  icon,
  hint,
}: {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
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
      className={`drop-zone glass rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] transition-all ${
        dragging ? "active" : ""
      } ${file ? "border-indigo-500/40" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div className={`text-4xl transition-transform ${dragging ? "scale-125" : ""}`}>
        {icon}
      </div>
      {file ? (
        <div className="text-center">
          <p className="text-sm font-semibold text-indigo-300 truncate max-w-[180px]">
            {file.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-300">{label}</p>
          <p className="text-xs text-slate-600 mt-1">{hint}</p>
        </div>
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
      className="flex items-center gap-3 cursor-pointer group select-none"
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
        <label htmlFor={id} className="text-sm text-slate-400">
          {label}
        </label>
        <span className="text-xs font-mono text-indigo-300 font-bold">{pct}</span>
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
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  // Check backend health on mount
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.ok && r.json())
      .then((d) => setBackendOk(!!d?.status))
      .catch(() => setBackendOk(false));
  }, []);

  const updateSetting = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  const canAnalyze = !!videoFile && (!!srtFile || autoTranscribe);

  async function handleAnalyze() {
    if (!videoFile) return;
    setError("");
    setStatus("uploading");
    setProgress(10);

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
      setProgress(40);

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
      <header className="px-6 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm">
            🎬
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Auto<span className="text-indigo-400">Audio</span>
          </span>
        </div>

        {/* Backend status pill */}
        <div
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
            backendOk === null
              ? "text-slate-500 border-white/8"
              : backendOk
              ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
              : "text-red-400 border-red-500/25 bg-red-500/10"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendOk === null ? "bg-slate-600" : backendOk ? "bg-emerald-400" : "bg-red-400"
            }`}
          />
          {backendOk === null ? "Connecting…" : backendOk ? "API ready" : "API offline"}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 pt-14 pb-10 text-center">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 mb-5">
          AI-Powered Sound Design
        </div>
        <h1
          className="text-5xl md:text-6xl font-black tracking-tight mb-4 leading-none"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Drop your video.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AI does the rest.
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          The AI reads your script, finds every hook, reveal, and climax —
          then places the perfect SFX and music automatically.
        </p>
      </section>

      {/* ── Main grid ── */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 pb-16 grid md:grid-cols-2 gap-6">
        {/* ── Left: Upload ── */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Step 1 — Media
          </h2>

          <FileZone
            id="video-drop"
            label="Drop your video here"
            accept="video/*"
            file={videoFile}
            onFile={setVideoFile}
            icon="🎬"
            hint="MP4, MOV, MKV, AVI, WEBM"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/6" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--bg-primary)] px-3 text-xs text-slate-600 uppercase tracking-widest">
                Narration
              </span>
            </div>
          </div>

          {!autoTranscribe ? (
            <FileZone
              id="srt-drop"
              label="Drop your SRT file"
              accept=".srt,.vtt"
              file={srtFile}
              onFile={setSrtFile}
              icon="📄"
              hint=".srt or .vtt subtitle file"
            />
          ) : (
            <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-violet-500/25">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300 flex-shrink-0">
                🎙️
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Auto-transcribe</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Whisper will transcribe your video automatically
                </p>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              id="auto-transcribe"
              type="checkbox"
              className="custom-check"
              checked={autoTranscribe}
              onChange={(e) => setAutoTranscribe(e.target.checked)}
            />
            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
              Auto-transcribe with Whisper (no SRT needed)
            </span>
          </label>
        </div>

        {/* ── Right: Control Panel ── */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Step 2 — Sound Design
          </h2>

          <div className="glass glass-glow rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Features
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["music_enabled", "Background Music"],
                  ["sfx_enabled", "Important SFX"],
                  ["silence_drops", "Silence / Drops"],
                  ["stage_detection", "Stage Transitions"],
                  ["reveal_detection", "Reveal Detection"],
                  ["hook_detection", "Hook Detection"],
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

          <div className="glass rounded-2xl p-5 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Intensity
            </p>
            <IntensitySlider
              id="music_intensity"
              label="Music Intensity"
              value={settings.music_intensity}
              onChange={(v) => updateSetting("music_intensity", v)}
            />
            <IntensitySlider
              id="sfx_intensity"
              label="SFX Intensity"
              value={settings.sfx_intensity}
              onChange={(v) => updateSetting("sfx_intensity", v)}
            />
          </div>

          {/* How it works cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { emoji: "🧠", label: "Analyzes script" },
              { emoji: "🎵", label: "Selects music" },
              { emoji: "🔊", label: "Places SFX" },
            ].map(({ emoji, label }) => (
              <div key={label} className="glass rounded-xl p-3">
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Full-width bottom: Analyze button + progress ── */}
        <div className="md:col-span-2 space-y-4">
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          {/* Progress */}
          {(status === "uploading" || status === "analyzing") && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{status === "uploading" ? "Uploading…" : "Analyzing with AI…"}</span>
                <span>{progress}%</span>
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
            className="btn-primary w-full rounded-2xl py-4 text-sm flex items-center justify-center gap-3 animate-pulse-glow"
          >
            {status === "uploading" || status === "analyzing" ? (
              <>
                <span className="spinner" />
                {status === "uploading" ? "Uploading…" : "Analyzing…"}
              </>
            ) : (
              <>
                <span>✨</span>
                Analyze Video
              </>
            )}
          </button>

          {!canAnalyze && (
            <p className="text-center text-xs text-slate-600">
              {!videoFile
                ? "Drop a video to get started"
                : "Add an SRT file or enable auto-transcribe"}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
