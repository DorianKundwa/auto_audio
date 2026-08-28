"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "./lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Film,
  FileText,
  Sparkles,
  Sliders,
  Music,
  Zap,
  Mic,
  CheckCircle2,
  X,
  Volume2,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";

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

const PRESETS = [
  {
    id: "action",
    name: "Action & Hype",
    icon: "💥",
    desc: "Heavy booms, cinematic impacts & intense risers",
    settings: { music_intensity: 0.85, sfx_intensity: 0.8, silence_drops: true, hook_detection: true, reveal_detection: true, stage_detection: true },
  },
  {
    id: "mystery",
    name: "Dark Mystery",
    icon: "🕵️",
    desc: "Subtle drones, digital glitches & dramatic pauses",
    settings: { music_intensity: 0.65, sfx_intensity: 0.5, silence_drops: true, hook_detection: true, reveal_detection: true, stage_detection: true },
  },
  {
    id: "viral",
    name: "Viral / TikTok",
    icon: "⚡",
    desc: "Fast whooshes, punchy transitions & reward chimes",
    settings: { music_intensity: 0.7, sfx_intensity: 0.7, silence_drops: false, hook_detection: true, reveal_detection: true, stage_detection: true },
  },
  {
    id: "subtle",
    name: "Subtle Ambient",
    icon: "🧘",
    desc: "Low background score & soft organic sound effects",
    settings: { music_intensity: 0.35, sfx_intensity: 0.3, silence_drops: false, hook_detection: false, reveal_detection: true, stage_detection: false },
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function UploadPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [autoTranscribe, setAutoTranscribe] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("action");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const [videoDrag, setVideoDrag] = useState(false);
  const [srtDrag, setSrtDrag] = useState(false);

  // Engine health check
  useEffect(() => {
    const checkHealth = () => {
      fetch(apiUrl("/api/health"))
        .then((r) => r.ok && r.json())
        .then((d) => setBackendOk(!!d?.status))
        .catch(() => setBackendOk(false));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateSetting = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setActivePreset("custom");
    setSettings((s) => ({ ...s, [k]: v }));
  };

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    const p = PRESETS.find((x) => x.id === presetId);
    if (p) {
      setSettings((s) => ({ ...s, ...p.settings }));
    }
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
      const form = new FormData();
      form.append("video", videoFile);
      if (srtFile) form.append("srt", srtFile);

      const uploadRes = await fetch(apiUrl("/api/upload"), { method: "POST", body: form });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail ?? "Upload failed");
      }
      const { job_id } = await uploadRes.json();
      setProgress(50);

      setStatus("analyzing");
      const analyzeRes = await fetch(apiUrl(`/api/analyze/${job_id}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error(err.detail ?? "Analysis failed");
      }
      setProgress(100);

      router.push(`/analyze/${job_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
      setProgress(0);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#08090f] text-slate-100">
      {/* ── Top Header ── */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-[#090b14]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0d0f1a] rounded-[11px] flex items-center justify-center text-sm font-bold text-indigo-400">
              ⚡
            </div>
          </div>
          <div>
            <span
              className="font-bold text-lg tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Auto<span className="text-indigo-400">Audio</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block -mt-1">
              AI Sound Design Studio
            </span>
          </div>
        </div>

        {/* Engine status indicator */}
        <Badge
          variant={backendOk ? "success" : backendOk === false ? "destructive" : "secondary"}
          className="gap-2 px-3 py-1 text-xs"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendOk ? "bg-emerald-400 animate-pulse" : backendOk === false ? "bg-red-400" : "bg-slate-500"
            }`}
          />
          <span>{backendOk ? "Engine Online" : backendOk === false ? "Engine Offline" : "Connecting..."}</span>
        </Badge>
      </header>

      {/* ── Hero Section ── */}
      <section className="px-6 pt-12 pb-8 text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="default" className="gap-1.5 px-3 py-1 font-medium shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Sound Scoring
        </Badge>
        <h1
          className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Drop your video.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            AI scores the sound automatically.
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Upload your video and script. The engine identifies hooks, reveals, and dramatic turns to place precision sound effects and ambient music in seconds.
        </p>
      </section>

      {/* ── Preset Tabs ── */}
      <section className="max-w-5xl mx-auto w-full px-6 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sound Design Style Profile
          </span>
          <span className="text-xs text-slate-500">Select a preset to auto-tune parameters</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRESETS.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                    : "bg-white/[0.03] border-white/8 hover:bg-white/[0.06] hover:border-white/15"
                }`}
              >
                <div className="text-2xl mb-1.5">{p.icon}</div>
                <p className="text-sm font-bold text-slate-100">{p.name}</p>
                <p className="text-xs text-slate-400 mt-1 leading-snug">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Main Workspace Cards (2-Column Grid) ── */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 pb-16 grid md:grid-cols-2 gap-6">
        {/* Left Column: Media & Narration Card */}
        <Card className="flex flex-col justify-between p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span>Media & Narration</span>
                </CardTitle>
                <CardDescription>Upload your video and subtitle narration</CardDescription>
              </div>

              {!srtFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSampleScript}
                  className="text-xs text-indigo-300 hover:text-white"
                >
                  <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" /> Load Demo Script
                </Button>
              )}
            </div>

            {/* Video Dropzone */}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])}
            />

            <div
              onClick={() => !videoFile && videoInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setVideoDrag(true); }}
              onDragLeave={() => setVideoDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setVideoDrag(false);
                if (e.dataTransfer.files[0]) setVideoFile(e.dataTransfer.files[0]);
              }}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-4 ${
                videoDrag
                  ? "border-indigo-500 bg-indigo-500/10"
                  : videoFile
                  ? "border-indigo-500/40 bg-indigo-500/5"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
                <Film className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                {videoFile ? (
                  <div>
                    <p className="text-sm font-semibold text-white truncate">{videoFile.name}</p>
                    <p className="text-xs text-indigo-300 font-mono mt-0.5">{formatBytes(videoFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Drop your video file here</p>
                    <p className="text-xs text-slate-500 mt-0.5">MP4, MOV, MKV, AVI (up to 2GB)</p>
                  </div>
                )}
              </div>
              {videoFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                  className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* SRT Dropzone or Whisper */}
            {!autoTranscribe ? (
              <>
                <input
                  ref={srtInputRef}
                  type="file"
                  accept=".srt,.vtt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setSrtFile(e.target.files[0])}
                />
                <div
                  onClick={() => !srtFile && srtInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setSrtDrag(true); }}
                  onDragLeave={() => setSrtDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setSrtDrag(false);
                    if (e.dataTransfer.files[0]) setSrtFile(e.dataTransfer.files[0]);
                  }}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-4 ${
                    srtDrag
                      ? "border-indigo-500 bg-indigo-500/10"
                      : srtFile
                      ? "border-indigo-500/40 bg-indigo-500/5"
                      : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {srtFile ? (
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{srtFile.name}</p>
                        <p className="text-xs text-violet-300 font-mono mt-0.5">{formatBytes(srtFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Drop your subtitle file (.srt / .vtt)</p>
                        <p className="text-xs text-slate-500 mt-0.5">Captions for AI script analysis</p>
                      </div>
                    )}
                  </div>
                  {srtFile && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSrtFile(null); }}
                      className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300 flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">Local Whisper Speech-to-Text</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Speech will be automatically transcribed on-device</p>
                </div>
              </div>
            )}

            {/* Auto Transcribe Toggle */}
            <div className="flex items-center justify-between px-1 pt-1">
              <label htmlFor="whisper-toggle" className="text-xs text-slate-300 cursor-pointer flex items-center gap-2">
                <span>Auto-transcribe speech with faster-whisper</span>
              </label>
              <Switch
                id="whisper-toggle"
                checked={autoTranscribe}
                onCheckedChange={setAutoTranscribe}
              />
            </div>
          </div>
        </Card>

        {/* Right Column: Audio Design Settings Card */}
        <Card className="flex flex-col justify-between p-6 space-y-6">
          <div className="space-y-5">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Audio Scoring Engines</span>
              </CardTitle>
              <CardDescription>Fine-tune detection triggers and gain levels</CardDescription>
            </div>

            {/* Feature Switches */}
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { key: "music_enabled", label: "Background Music", icon: "🎵" },
                { key: "sfx_enabled", label: "Sound Effects", icon: "💥" },
                { key: "silence_drops", label: "Silence Drops", icon: "🔇" },
                { key: "hook_detection", label: "Hook Risers", icon: "⚡" },
                { key: "reveal_detection", label: "Reveal Hits", icon: "🔊" },
                { key: "stage_detection", label: "Scene Swipes", icon: "💨" },
              ].map(({ key, label, icon }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>{icon}</span> {label}
                  </span>
                  <Switch
                    checked={settings[key as keyof Settings] as boolean}
                    onCheckedChange={(checked) => updateSetting(key as keyof Settings, checked)}
                  />
                </div>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Music Volume Presence</span>
                  <Badge variant="violet" className="font-mono text-[11px]">
                    {Math.round(settings.music_intensity * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.music_intensity * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val) => updateSetting("music_intensity", val[0] / 100)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">SFX Dynamic Power</span>
                  <Badge variant="default" className="font-mono text-[11px]">
                    {Math.round(settings.sfx_intensity * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.sfx_intensity * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val) => updateSetting("sfx_intensity", val[0] / 100)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Full-Width Action Button & Progress */}
        <div className="md:col-span-2 space-y-4 pt-2">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Progress bar */}
          {(status === "uploading" || status === "analyzing") && (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>{status === "uploading" ? "Uploading video and script..." : "Scoring sound design with AI..."}</span>
                <span className="font-mono text-indigo-400">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            variant="gradient"
            size="lg"
            onClick={handleAnalyze}
            disabled={!canAnalyze || status === "uploading" || status === "analyzing"}
            className="w-full h-14 text-base font-bold shadow-xl shadow-indigo-500/20 cursor-pointer"
          >
            {status === "uploading" || status === "analyzing" ? (
              <>
                <span className="spinner mr-2" style={{ width: 18, height: 18 }} />
                <span>{status === "uploading" ? "Uploading Media..." : "Building Sound Design Timeline..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-1" />
                <span>Analyze & Score Sound Design</span>
              </>
            )}
          </Button>

          {!canAnalyze && (
            <p className="text-center text-xs text-slate-500">
              {!videoFile ? "Drop a video file to begin" : "Add a subtitle file (.srt) or enable auto-transcribe"}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
