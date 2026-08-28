"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "./lib/api";
import { useSoundPreview } from "@/hooks/useSoundPreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { WaveformVisualizer } from "@/components/studio/WaveformVisualizer";
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
  Check,
  Layers,
  Flame,
  Search,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  Cpu,
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

interface Preset {
  id: string;
  name: string;
  badge: string;
  desc: string;
  musicBar: string;
  sfxBar: string;
  previewSfx: string;
  settings: Partial<Settings>;
}

const PRESETS: Preset[] = [
  {
    id: "action",
    name: "Action & Hype",
    badge: "Cinematic High-Energy",
    desc: "Heavy booms, cinematic impacts & intense tension risers",
    musicBar: "████████░░ 85%",
    sfxBar: "█████████░ 80%",
    previewSfx: "assets/sfx/impacts/05 Impact.wav",
    settings: {
      music_intensity: 0.85,
      sfx_intensity: 0.8,
      silence_drops: true,
      hook_detection: true,
      reveal_detection: true,
      stage_detection: true,
    },
  },
  {
    id: "mystery",
    name: "Dark Mystery",
    badge: "Documentary Tension",
    desc: "Subtle atmospheric drones, digital glitches & dramatic silences",
    musicBar: "██████░░░░ 65%",
    sfxBar: "█████░░░░░ 50%",
    previewSfx: "assets/sfx/glitches/04 Erased Data.wav",
    settings: {
      music_intensity: 0.65,
      sfx_intensity: 0.5,
      silence_drops: true,
      hook_detection: true,
      reveal_detection: true,
      stage_detection: true,
    },
  },
  {
    id: "viral",
    name: "Viral",
    badge: "Fast & Dynamic",
    desc: "Fast whooshes, punchy transitions & reward chimes",
    musicBar: "███████░░░ 70%",
    sfxBar: "███████░░░ 70%",
    previewSfx: "assets/sfx/whooshes/06 Portal Hop.wav",
    settings: {
      music_intensity: 0.7,
      sfx_intensity: 0.7,
      silence_drops: false,
      hook_detection: true,
      reveal_detection: true,
      stage_detection: true,
    },
  },
  {
    id: "subtle",
    name: "Subtle Ambient",
    badge: "Organic & Minimal",
    desc: "Low background score & soft organic sound effects",
    musicBar: "████░░░░░░ 35%",
    sfxBar: "███░░░░░░░ 30%",
    previewSfx: "assets/sfx/transitions/07 Line Break.wav",
    settings: {
      music_intensity: 0.35,
      sfx_intensity: 0.3,
      silence_drops: false,
      hook_detection: false,
      reveal_detection: true,
      stage_detection: false,
    },
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
  const { togglePreview } = useSoundPreview();

  // Media files & input mode
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoRes, setVideoRes] = useState<string | null>(null);

  const [scriptMode, setScriptMode] = useState<"upload" | "transcribe">("upload");
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [captionCount, setCaptionCount] = useState<number | null>(null);

  // Settings & Presets
  const [activePreset, setActivePreset] = useState<string>("action");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // State & Progress
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [generatingDemo, setGeneratingDemo] = useState(false);

  // Drag states
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

  // Inspect video metadata once selected
  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    const videoElem = document.createElement("video");
    videoElem.preload = "metadata";
    videoElem.src = URL.createObjectURL(file);
    videoElem.onloadedmetadata = () => {
      URL.revokeObjectURL(videoElem.src);
      setVideoDuration(videoElem.duration);
      if (videoElem.videoWidth && videoElem.videoHeight) {
        setVideoRes(`${videoElem.videoWidth}x${videoElem.videoHeight}`);
      }
    };
  };

  // Inspect SRT file once selected
  const handleSrtSelect = (file: File) => {
    setSrtFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      const matches = text.match(/\d+\r?\n\d\d:\d\d/g);
      setCaptionCount(matches ? matches.length : 12);
    };
    reader.readAsText(file);
  };

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    const p = PRESETS.find((x) => x.id === presetId);
    if (p) {
      setSettings((s) => ({ ...s, ...p.settings }));
      if (p.previewSfx) {
        togglePreview(p.previewSfx);
      }
    }
  };

  const canAnalyze = !!videoFile && (scriptMode === "transcribe" || !!srtFile);

  // Sample script loader
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
    handleSrtSelect(file);
    setScriptMode("upload");
  };

  // Quick 1-Click Demo Launcher
  const handleQuickDemoLaunch = () => {
    setGeneratingDemo(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      let frame = 0;
      const renderInterval = setInterval(() => {
        frame++;
        ctx.fillStyle = "#18181B";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        const pulse = Math.sin(frame * 0.15) * 25;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 70 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
        ctx.fill();
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AutoAudio Studio Interactive Demo", canvas.width / 2, canvas.height / 2 - 120);
        ctx.font = "18px monospace";
        ctx.fillStyle = "#818cf8";
        ctx.fillText(`Frame ${frame} • AI Sound Design Test Sequence`, canvas.width / 2, canvas.height / 2 + 130);
      }, 1000 / 30);

      recorder.start();
      setTimeout(() => {
        clearInterval(renderInterval);
        recorder.stop();
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/mp4" });
          const demoVideo = new File([blob], "interactive_demo_narration.mp4", { type: "video/mp4" });
          handleVideoSelect(demoVideo);
          loadSampleScript();
          setGeneratingDemo(false);
        };
      }, 2500);
    } catch (e) {
      setGeneratingDemo(false);
      loadSampleScript();
    }
  };

  async function handleAnalyze() {
    if (!videoFile) return;
    setError("");
    setStatus("uploading");
    setProgress(15);

    try {
      const form = new FormData();
      form.append("video", videoFile);
      if (scriptMode === "upload" && srtFile) {
        form.append("srt", srtFile);
      }

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
    <main className="min-h-screen flex flex-col bg-[#1E1E1E] text-[#CCCCCC] select-none">
      {/* ── Studio Top Bar ── */}
      <header className="h-13 px-8 flex items-center justify-between border-b border-[#3E3E42] bg-[#252528] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-[#1E1E1E] rounded-[11px] flex items-center justify-center text-xs font-bold text-indigo-400">
              ⚡
            </div>
          </div>
          <div>
            <span
              className="font-bold text-base tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Auto<span className="text-indigo-400">Audio</span>
            </span>
            <span className="text-[10px] text-[#858585] font-semibold tracking-wider uppercase block -mt-1">
              Creative Studio Workstation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Demo Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickDemoLaunch}
            disabled={generatingDemo || !!videoFile}
            className="h-8 text-xs font-semibold bg-[#1E1E1E] border-[#3E3E42] text-indigo-300 hover:text-white hover:border-indigo-500/50 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400" />
            <span>{generatingDemo ? "Generating Demo..." : "⚡ Quick Demo (1-Click)"}</span>
          </Button>

          <Badge
            variant={backendOk ? "success" : backendOk === false ? "destructive" : "secondary"}
            className="gap-2 px-3 py-1 text-xs bg-[#1E1E1E] border-[#3E3E42]"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOk ? "bg-emerald-400 animate-pulse" : backendOk === false ? "bg-red-400" : "bg-slate-500"
              }`}
            />
            <span>{backendOk ? "AI Engine Online" : backendOk === false ? "Engine Offline" : "Connecting..."}</span>
          </Badge>
        </div>
      </header>

      {/* ── Modern Hero Section with Ambient Waveform Aura ── */}
      <section className="relative px-6 pt-10 pb-6 text-center max-w-4xl mx-auto space-y-4 overflow-hidden">
        {/* Subtle Background Glow Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-3">
          <Badge
            variant="default"
            className="gap-1.5 px-3 py-0.5 font-medium shadow-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Professional Creative Audio Workstation
          </Badge>
          <h1
            className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Give your video a soundtrack.
          </h1>
          <p className="text-[#CCCCCC] text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            AutoAudio analyzes your narration and automatically places music, impacts, risers, transitions and atmosphere exactly where they belong.
          </p>

          {/* Seeded Hero Audio Spectrum */}
          <div className="pt-2 flex justify-center opacity-70">
            <WaveformVisualizer seed="studio_hero_banner" bars={56} height={24} barWidth={2} gap={2} color="#6366f1" />
          </div>
        </div>
      </section>

      {/* ── Central Upload Workspace ── */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 pb-12 space-y-6">
        {/* Row 1: Media Input Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Video Input */}
          <Card className="p-5 flex flex-col justify-between space-y-4 bg-[#2D2D30] border-[#3E3E42]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span>1. Video Source</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono bg-[#1E1E1E] border-[#3E3E42]">
                  MP4, MOV, MKV, WEBM (UP TO 2GB)
                </Badge>
              </div>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])}
              />

              <div
                onClick={() => !videoFile && videoInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setVideoDrag(true); }}
                onDragLeave={() => setVideoDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setVideoDrag(false);
                  if (e.dataTransfer.files[0]) handleVideoSelect(e.dataTransfer.files[0]);
                }}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[180px] ${
                  videoDrag
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                    : videoFile
                    ? "border-indigo-500/40 bg-indigo-500/5 shadow-inner"
                    : "border-[#3E3E42] hover:border-indigo-500/40 bg-[#252528]"
                }`}
              >
                {videoFile ? (
                  <div className="w-full flex items-center justify-between gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
                      <Film className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-white truncate">{videoFile.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" className="text-[9px] font-mono">
                          {formatBytes(videoFile.size)}
                        </Badge>
                        {videoRes && (
                          <Badge variant="secondary" className="text-[9px] font-mono bg-[#1E1E1E]">
                            {videoRes}
                          </Badge>
                        )}
                        {videoDuration && (
                          <Badge variant="secondary" className="text-[9px] font-mono bg-[#1E1E1E]">
                            {videoDuration.toFixed(1)}s
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoFile(null);
                        setVideoDuration(null);
                        setVideoRes(null);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-white/10 text-[#858585] hover:text-red-400 flex items-center justify-center transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Film className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Drop your video here</p>
                      <p className="text-xs text-[#858585] mt-0.5">or click to browse files</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Card 2: Script Input with 2 Segmented Options */}
          <Card className="p-5 flex flex-col justify-between space-y-4 bg-[#2D2D30] border-[#3E3E42]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span>2. Narration Script</span>
                </CardTitle>

                {/* Sample script button */}
                {scriptMode === "upload" && !srtFile && (
                  <button
                    type="button"
                    onClick={loadSampleScript}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-400" /> Load Demo Script
                  </button>
                )}
              </div>

              {/* Segmented Mode Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#1E1E1E] border border-[#3E3E42]">
                <button
                  type="button"
                  onClick={() => setScriptMode("upload")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scriptMode === "upload"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-[#858585] hover:text-[#CCCCCC]"
                  }`}
                >
                  Upload Script (.srt / .vtt)
                </button>
                <button
                  type="button"
                  onClick={() => setScriptMode("transcribe")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scriptMode === "transcribe"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-[#858585] hover:text-[#CCCCCC]"
                  }`}
                >
                  Auto Transcribe (Whisper)
                </button>
              </div>

              {/* Option 1: SRT Upload */}
              {scriptMode === "upload" ? (
                <>
                  <input
                    ref={srtInputRef}
                    type="file"
                    accept=".srt,.vtt"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleSrtSelect(e.target.files[0])}
                  />

                  <div
                    onClick={() => !srtFile && srtInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setSrtDrag(true); }}
                    onDragLeave={() => setSrtDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setSrtDrag(false);
                      if (e.dataTransfer.files[0]) handleSrtSelect(e.dataTransfer.files[0]);
                    }}
                    className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[180px] ${
                      srtDrag
                        ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20"
                        : srtFile
                        ? "border-violet-500/40 bg-violet-500/5 shadow-inner"
                        : "border-[#3E3E42] hover:border-violet-500/40 bg-[#252528]"
                    }`}
                  >
                    {srtFile ? (
                      <div className="w-full flex items-center justify-between gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-bold text-white truncate">{srtFile.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="violet" className="text-[9px] font-mono">
                              {formatBytes(srtFile.size)}
                            </Badge>
                            {captionCount && (
                              <Badge variant="success" className="text-[9px] font-mono">
                                {captionCount} Captions Ready
                              </Badge>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSrtFile(null);
                            setCaptionCount(null);
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-white/10 text-[#858585] hover:text-red-400 flex items-center justify-center transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Drop your subtitle file (.srt / .vtt)</p>
                          <p className="text-xs text-[#858585] mt-0.5">Captions for AI narrative structure analysis</p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Option 2: Faster-Whisper Auto Transcription */
                <div className="p-6 rounded-2xl bg-[#252528] border border-violet-500/30 flex flex-col justify-center gap-3 min-h-[180px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300">
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          On-Device Faster-Whisper
                        </p>
                        <p className="text-[10px] text-[#858585] font-mono">
                          model: medium/large-v3 • 100% privacy guaranteed
                        </p>
                      </div>
                    </div>
                    <Badge variant="violet" className="text-[10px] font-mono">
                      AUTO STT
                    </Badge>
                  </div>

                  <p className="text-xs text-[#CCCCCC] leading-relaxed">
                    AutoAudio will extract the audio channel from your video and automatically generate timestamps and text transcriptions locally.
                  </p>

                  <div className="pt-1 flex items-center justify-center opacity-60">
                    <WaveformVisualizer seed="whisper_active" bars={48} height={20} color="#a78bfa" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Row 2: Sound Design Style Profiles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#858585]">
              3. Sound Design Style Profiles
            </span>
            <span className="text-xs text-[#858585]">Click any profile to audition sample tone</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer select-none space-y-2 ${
                    isSelected
                      ? "bg-indigo-600/15 border-indigo-500/70 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500"
                      : "bg-[#2D2D30] border-[#3E3E42] hover:bg-[#38383C] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>

                  <p className="text-[11px] text-[#CCCCCC] leading-snug">{p.desc}</p>

                  <div className="pt-1 space-y-1 font-mono text-[10px] text-[#858585]">
                    <div className="flex justify-between">
                      <span className="text-[#858585]">Music</span>
                      <span className="text-violet-300 font-bold">{p.musicBar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#858585]">SFX</span>
                      <span className="text-indigo-300 font-bold">{p.sfxBar}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Action Button & AI Progress Indicator */}
        <div className="space-y-4 pt-2">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {(status === "uploading" || status === "analyzing") && (
            <div className="p-5 rounded-2xl bg-[#2D2D30] border border-[#3E3E42] space-y-3 shadow-xl">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>
                    {status === "uploading"
                      ? "Uploading media & streaming to audio engine..."
                      : "AI analyzing narrative beats & placing sound design..."}
                  </span>
                </span>
                <span className="font-mono text-indigo-400">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#1E1E1E] overflow-hidden">
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
            className="w-full h-14 text-base font-bold shadow-2xl shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-all"
          >
            {status === "uploading" || status === "analyzing" ? (
              <>
                <span className="spinner mr-2" style={{ width: 18, height: 18 }} />
                <span>Building Sound Design Timeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-1.5" />
                <span>Generate Sound Design</span>
              </>
            )}
          </Button>

          {!canAnalyze && (
            <p className="text-center text-xs text-[#858585]">
              {!videoFile
                ? "Drop a video file or click 'Quick Demo' above to begin"
                : "Add a subtitle file (.srt) or select Auto Transcribe"}
            </p>
          )}
        </div>

        {/* Row 4: Modern Studio Feature Highlights Grid */}
        <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-[#3E3E42]">
          <div className="p-4 rounded-xl bg-[#252528] border border-[#3E3E42] space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <Cpu className="w-4 h-4" />
              <span>Neural Beat & Hook Engine</span>
            </div>
            <p className="text-[11px] text-[#858585] leading-relaxed">
              Detects narrative turns, reveals, and emotional climaxes with millisecond precision.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#252528] border border-[#3E3E42] space-y-1.5">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>Frame-Accurate DAW Editing</span>
            </div>
            <p className="text-[11px] text-[#858585] leading-relaxed">
              Full multi-track timeline with dynamic zoom, snapping, gain envelopes, and sound library replacement.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#252528] border border-[#3E3E42] space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Studio Quality Audio</span>
            </div>
            <p className="text-[11px] text-[#858585] leading-relaxed">
              Lossless 48kHz / 24-bit audio mixing with loudness ducking and automatic silence drops.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
