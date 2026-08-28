"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "./lib/api";
import { useSoundPreview } from "@/hooks/useSoundPreview";
import { SidebarNav } from "@/components/studio/SidebarNav";
import { SemanticAnalysisView } from "@/components/studio/SemanticAnalysisView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WaveformVisualizer } from "@/components/studio/WaveformVisualizer";
import {
  Film,
  FileText,
  Sparkles,
  Zap,
  Mic,
  X,
  Volume2,
  AlertCircle,
  Play,
  RotateCcw,
  Check,
  Layers,
  Search,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  Cpu,
  Upload,
  Link,
  ChevronRight,
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
  idx: string;
  name: string;
  desc: string;
  previewSfx: string;
  bgGradient: string;
  settings: Partial<Settings>;
}

const PRESETS: Preset[] = [
  {
    id: "action",
    idx: "01",
    name: "Action & Hype",
    desc: "Heavy booms, cinematic impacts & intense tension risers.",
    previewSfx: "assets/sfx/impacts/impact_01.wav",
    bgGradient: "from-primary/30 via-surface-container to-surface-container",
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
    idx: "02",
    name: "Dark Mystery",
    desc: "Atmospheric beds, subtle foley & digital glitches.",
    previewSfx: "assets/sfx/glitches/glitch_01.wav",
    bgGradient: "from-secondary/30 via-surface-container to-surface-container",
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
    idx: "03",
    name: "Viral Social",
    desc: "Fast swooshes, punchy transitions & reward chimes.",
    previewSfx: "assets/sfx/whooshes/whoosh_01.wav",
    bgGradient: "from-tertiary/25 via-surface-container to-surface-container",
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
    idx: "04",
    name: "Subtle Ambient",
    desc: "Low background score & organic sound effects.",
    previewSfx: "assets/sfx/transitions/transition_01.wav",
    bgGradient: "from-primary-container/25 via-surface-container to-surface-container",
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
        ctx.fillStyle = "#131314";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(192, 193, 255, 0.15)";
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
        ctx.fillStyle = "rgba(192, 193, 255, 0.25)";
        ctx.fill();
        ctx.strokeStyle = "#c0c1ff";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 32px Geist, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AutoAudio Studio Interactive Demo", canvas.width / 2, canvas.height / 2 - 120);
        ctx.font = "18px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#c0c1ff";
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
      }, 2000);
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
    <div className="min-h-screen bg-background font-sans text-on-surface select-none">
      {/* ── Fixed Left Sidebar Navigation ── */}
      <SidebarNav activeTab="studio" />

      {/* ── Main Work Area (with 80px left offset) ── */}
      <div className="pl-20 flex flex-col min-h-screen">
        {/* ── Studio Top Header ── */}
        <header className="fixed top-0 left-20 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl z-40 flex items-center px-8 border-b border-outline-variant/10">
          <div className="flex-1 flex items-center gap-3">
            <span className="font-mono text-xs text-on-surface-variant uppercase">
              Obsidian Sonic Lab v2.0
            </span>
          </div>

          <div className="flex-1 text-center">
            <h1 className="font-geist text-base font-bold text-primary">
              AutoAudio — AI Sound Design Studio
            </h1>
          </div>

          <div className="flex-1 flex justify-end items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickDemoLaunch}
              disabled={generatingDemo || !!videoFile}
              className="h-8 text-xs font-semibold bg-surface-container text-primary border-primary/30 hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400" />
              <span>{generatingDemo ? "Preparing Demo..." : "⚡ Quick Demo (1-Click)"}</span>
            </Button>

            <Badge
              variant={backendOk ? "success" : backendOk === false ? "destructive" : "secondary"}
              className="gap-2 px-3 py-1 text-xs bg-surface-container-high border-outline-variant/20"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOk ? "bg-tertiary animate-pulse" : backendOk === false ? "bg-error" : "bg-outline"
                }`}
              />
              <span>{backendOk ? "AI Online" : backendOk === false ? "Offline" : "Connecting..."}</span>
            </Badge>
          </div>
        </header>

        {/* ── Main Content Area ── */}
        <main className="relative pt-20 pb-12 px-8 max-w-[1240px] mx-auto w-full flex-1 flex flex-col justify-center">
          {/* Active Semantic Analysis Screen (Design 0 / 5) */}
          {status === "uploading" || status === "analyzing" ? (
            <SemanticAnalysisView
              filename={videoFile?.name || "video.mp4"}
              progress={progress}
              onAbort={() => {
                setStatus("idle");
                setProgress(0);
              }}
            />
          ) : (
            /* New AI Session Landing View (Design 1) */
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Section Header */}
              <div className="space-y-1 text-left">
                <h2 className="font-geist text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                  New AI Session
                </h2>
                <p className="text-on-surface-variant text-sm md:text-base">
                  Drop your video and let neural audio models construct a synchronized soundscape.
                </p>
              </div>

              {/* Glowing Interactive Dropzone */}
              <div className="grid md:grid-cols-12 gap-6">
                {/* Left 7 Columns: Video Input */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                      <Film className="w-4 h-4" /> 1. Video Source
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      MP4, MOV, MKV, WEBM (UP TO 2GB)
                    </span>
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
                    className={`relative group cursor-pointer w-full min-h-[220px] rounded-2xl bg-surface-container-low/60 backdrop-blur-md flex flex-col items-center justify-center p-8 transition-all duration-300 overflow-hidden border-2 border-dashed ${
                      videoDrag
                        ? "border-primary bg-primary/10 shadow-2xl shadow-primary/20"
                        : videoFile
                        ? "border-primary/40 bg-surface-container"
                        : "border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container/80"
                    }`}
                  >
                    {videoFile ? (
                      <div className="w-full flex items-center justify-between gap-4 z-10">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                          <Film className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-bold text-white truncate">{videoFile.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default" className="text-[9px] font-mono bg-primary-container/20 text-primary">
                              {formatBytes(videoFile.size)}
                            </Badge>
                            {videoRes && (
                              <Badge variant="secondary" className="text-[9px] font-mono bg-surface-container-high">
                                {videoRes}
                              </Badge>
                            )}
                            {videoDuration && (
                              <Badge variant="secondary" className="text-[9px] font-mono bg-surface-container-high">
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
                          className="w-8 h-8 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-container-high shadow-md mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-geist text-base font-bold text-on-surface mb-1">
                          Drag & Drop Media Video
                        </h3>
                        <p className="text-xs text-on-surface-variant mb-4">
                          Drop file here or click to browse
                        </p>
                        <button className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary font-mono text-xs px-5 py-2 rounded-full transition-colors duration-200 font-bold">
                          BROWSE FILES
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Right 5 Columns: Script & Transcription Mode */}
                <div className="md:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-secondary flex items-center gap-2 uppercase tracking-wider">
                      <FileText className="w-4 h-4" /> 2. Narration Script
                    </span>
                    {scriptMode === "upload" && !srtFile && (
                      <button
                        onClick={loadSampleScript}
                        className="font-mono text-[10px] text-secondary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-amber-400" /> Demo Script
                      </button>
                    )}
                  </div>

                  {/* Mode Switcher */}
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
                    <button
                      onClick={() => setScriptMode("upload")}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        scriptMode === "upload"
                          ? "bg-primary-container text-on-primary-container shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Upload (.srt / .vtt)
                    </button>
                    <button
                      onClick={() => setScriptMode("transcribe")}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        scriptMode === "transcribe"
                          ? "bg-secondary-container text-on-secondary-container shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Auto Transcribe
                    </button>
                  </div>

                  {/* Dropzone for Subtitles */}
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
                        className={`w-full min-h-[160px] rounded-2xl bg-surface-container-low/60 border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
                          srtDrag
                            ? "border-secondary bg-secondary/10"
                            : srtFile
                            ? "border-secondary/40 bg-surface-container"
                            : "border-outline-variant/30 hover:border-secondary/50 hover:bg-surface-container/80"
                        }`}
                      >
                        {srtFile ? (
                          <div className="w-full flex items-center justify-between gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-xs font-bold text-white truncate">{srtFile.name}</p>
                              <span className="font-mono text-[10px] text-tertiary font-bold">
                                {captionCount || 12} Captions Ready
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSrtFile(null);
                                setCaptionCount(null);
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-error flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <FileText className="w-8 h-8 text-secondary mb-2 opacity-80" />
                            <p className="text-xs font-bold text-on-surface">Drop Subtitle File (.srt / .vtt)</p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">Captions for AI narrative structure</p>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-5 rounded-2xl bg-surface-container-low border border-secondary/20 flex flex-col justify-center gap-2 min-h-[160px]">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-secondary" />
                        <span className="text-xs font-bold text-white">On-Device Faster-Whisper</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Extracts audio and generates high-accuracy word timestamps automatically on your machine.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Style Presets Grid (Design 1) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-geist text-sm font-bold text-on-surface uppercase tracking-wider">
                      Style Presets
                    </h3>
                    <p className="text-xs text-on-surface-variant">Choose an AI scoring template to start.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PRESETS.map((p) => {
                    const isSelected = activePreset === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePresetSelect(p.id)}
                        className={`group relative rounded-2xl overflow-hidden bg-surface-container cursor-pointer p-4 transition-all duration-300 flex flex-col justify-between min-h-[130px] border ${
                          isSelected
                            ? "border-primary bg-gradient-to-br from-primary/20 via-surface-container to-surface-container shadow-lg shadow-primary/10 ring-1 ring-primary"
                            : "border-outline-variant/20 hover:border-outline-variant/50 hover:-translate-y-1"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-secondary font-bold tracking-widest">
                            {p.idx}
                          </span>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>

                        <div>
                          <h4 className="font-geist text-sm font-bold text-on-surface mb-0.5">{p.name}</h4>
                          <p className="font-caption text-[11px] text-on-surface-variant leading-snug line-clamp-2">
                            {p.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 space-y-3">
                {error && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-on-primary shadow-xl shadow-primary/20 cursor-pointer transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span>Generate Sound Design Timeline</span>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
