"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiUrl } from "../../lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Search,
  Download,
  Film,
  Music,
  Mic,
  Sparkles,
  Sliders,
  RotateCcw,
  FastForward,
  Rewind,
  X,
  Check,
  FolderPlus,
  Clock,
  Layers,
  ArrowLeft,
} from "lucide-react";

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

const MOOD_TITLES: Record<string, string> = {
  dark_documentary: "Dark Documentary",
  mysterious: "Mysterious Atmosphere",
  upbeat: "Upbeat Energetic",
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

export default function StudioPage() {
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
  const [zoom, setZoom] = useState(1);

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

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load timeline
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

  // Video time update
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Keyboard Shortcuts
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
    showToast(`Added ${item.type.toUpperCase()} at ${formatTs(currentTime)}`);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedEventId === id) setSelectedEventId(null);
    showToast("Sound effect removed");
  };

  const handleVolumeChange = (id: string, vol: number) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, volume: vol } : e))
    );
  };

  async function handleExport() {
    setExporting(true);
    setExportProgress(15);
    setError("");

    try {
      const progressInterval = setInterval(() => {
        setExportProgress((p) => Math.min(p + 8, 92));
      }, 700);

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
      showToast("🎉 Video rendered and downloaded successfully!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      showToast("❌ Export failed");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#08090f]">
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p className="text-slate-400 text-sm font-medium">Opening Audio Studio Workspace...</p>
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
      {/* ── Studio Header ── */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#090b14]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-xs text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> New Project
          </Button>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className="font-bold text-base tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Auto<span className="text-indigo-400">Audio</span>
            </span>
            <Badge variant="default" className="text-[10px] font-mono px-2 py-0.5 uppercase">
              {jobId.slice(0, 8)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Track Mutes */}
          <div className="flex items-center gap-4 bg-white/[0.04] px-3.5 py-1.5 rounded-xl border border-white/8 text-xs">
            <div className="flex items-center gap-2">
              <Switch
                checked={musicEnabled}
                onCheckedChange={setMusicEnabled}
              />
              <span className="text-slate-300 font-medium">Music</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Switch
                checked={sfxEnabled}
                onCheckedChange={setSfxEnabled}
              />
              <span className="text-slate-300 font-medium">SFX ({events.length})</span>
            </div>
          </div>

          {/* Sound Library Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDrawer(true)}
            className="text-xs"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Sound Library
          </Button>

          {/* Export Action */}
          <Button
            variant="gradient"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="text-xs px-5 shadow-lg shadow-indigo-500/20"
          >
            {exporting ? (
              <>
                <span className="spinner mr-1.5" style={{ width: 14, height: 14 }} />
                <span>Exporting ({exportProgress}%)</span>
              </>
            ) : exportDone ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Re-download Video
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export Video
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── Studio Split View (Video Player + Tabbed Inspector) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left: Video Player (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center group">
            <video
              ref={videoRef}
              src={apiUrl(`/uploads/${jobId}/video.mp4`)}
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-2xl flex items-center justify-center backdrop-blur-md shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-all cursor-pointer"
              >
                <Play className="w-7 h-7 fill-white ml-0.5" />
              </button>
            )}

            {/* Timecode HUD */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 font-mono text-xs text-indigo-300 font-bold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-ping" : "bg-slate-500"}`} />
              {formatTs(currentTime)} / {formatTs(dur)}
            </div>
          </div>

          {/* Quick Playback Bar */}
          <div className="flex items-center justify-between p-2 px-4 rounded-xl bg-white/[0.03] border border-white/8">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => seekTo(Math.max(0, currentTime - 5))}
                className="h-8 px-2.5 text-xs text-slate-400 hover:text-white"
              >
                <Rewind className="w-3.5 h-3.5 mr-1" /> -5s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePlay}
                className="h-8 w-8 p-0 rounded-lg"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => seekTo(Math.min(dur, currentTime + 5))}
                className="h-8 px-2.5 text-xs text-slate-400 hover:text-white"
              >
                +5s <FastForward className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <span className="text-xs font-mono text-slate-400">
              {events.length} SFX Events • {musicConfig ? MOOD_TITLES[musicConfig.mood] ?? musicConfig.mood : "No Music"}
            </span>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Zoom</span>
              {[1, 1.5, 2].map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                    zoom === z
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tabbed Inspector (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden">
          <Tabs defaultValue="inspector" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 mb-3">
              <TabsTrigger value="inspector">Inspector</TabsTrigger>
              <TabsTrigger value="music">Music Bed</TabsTrigger>
              <TabsTrigger value="script">Script Tags</TabsTrigger>
            </TabsList>

            {/* Tab 1: Inspector */}
            <TabsContent value="inspector" className="flex-1 overflow-y-auto space-y-4 m-0">
              {selectedEvent ? (
                <Card className="p-5 space-y-4 border-indigo-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{SFX_ICONS[selectedEvent.sfx_type] ?? "🔊"}</div>
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span>{selectedEvent.label}</span>
                          <Badge variant="default" className="text-[10px] font-mono">
                            {formatTs(selectedEvent.timestamp)}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="truncate max-w-[200px] mt-0.5">
                          {selectedEvent.sfx_path.split(/[\\/]/).pop()}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => playAudioPreview(selectedEvent.sfx_path)}
                        className="h-8 px-2.5 text-xs"
                      >
                        {previewAudioPath === selectedEvent.sfx_path ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        className="h-8 px-2.5 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtitle context quote */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 italic">
                    &quot;{selectedEvent.text_snippet}&quot;
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 font-semibold">Volume Gain</span>
                      <span className="text-indigo-300 font-bold">{Math.round(selectedEvent.volume * 100)}%</span>
                    </div>
                    <Slider
                      value={[selectedEvent.volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={(val) => handleVolumeChange(selectedEvent.id, val[0] / 100)}
                    />
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center text-slate-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Click any sound clip on the timeline below to inspect and edit volume</p>
                </Card>
              )}
            </TabsContent>

            {/* Tab 2: Music Bed */}
            <TabsContent value="music" className="flex-1 overflow-y-auto space-y-4 m-0">
              {musicConfig ? (
                <Card className="p-5 space-y-4 border-violet-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm text-violet-200">
                          {MOOD_TITLES[musicConfig.mood] ?? musicConfig.mood}
                        </CardTitle>
                        <CardDescription className="truncate max-w-[200px] mt-0.5">
                          {musicConfig.track_path.split(/[\\/]/).pop()}
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => playAudioPreview(musicConfig.track_path)}
                      className="h-8 px-2.5 text-xs text-violet-300"
                    >
                      {previewAudioPath === musicConfig.track_path ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 font-semibold">Bed Volume</span>
                      <span className="text-violet-300 font-bold">{Math.round(musicConfig.volume * 100)}%</span>
                    </div>
                    <Slider
                      value={[(musicConfig.volume / 0.3) * 100]}
                      max={100}
                      step={1}
                      onValueChange={(val) =>
                        setMusicConfig((m) =>
                          m ? { ...m, volume: (val[0] / 100) * 0.3 } : m
                        )
                      }
                    />
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center text-slate-500">
                  <p className="text-xs">No background music score selected</p>
                </Card>
              )}
            </TabsContent>

            {/* Tab 3: AI Script Tags */}
            <TabsContent value="script" className="flex-1 overflow-y-auto space-y-2 m-0 max-h-[300px] pr-1">
              {timeline?.analyzed_segments.map((seg) => (
                <div
                  key={seg.id}
                  onClick={() => seekTo(seg.start_sec)}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all flex items-center justify-between gap-3 cursor-pointer text-xs"
                >
                  <span className="font-mono text-slate-400">{formatTs(seg.start_sec)}</span>
                  <span className="text-slate-200 truncate flex-1 font-medium">{seg.text}</span>
                  <Badge variant="default" className="text-[10px] uppercase">
                    {seg.tag}
                  </Badge>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Bottom DAW Studio Multi-Track Viewport ── */}
      <div className="px-6 pb-6">
        <div className="daw-viewport">
          {/* Time Ruler */}
          <div
            className="daw-ruler flex items-center cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left - 140;
              const width = rect.width - 140;
              if (width > 0 && clickX >= 0) {
                seekTo((clickX / width) * dur);
              }
            }}
          >
            <div className="w-[140px] min-w-[140px] px-3 text-[10px] font-mono text-slate-400 uppercase font-bold border-r border-white/8 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" /> Timeline DAW
            </div>
            <div className="flex-1 relative h-full">
              {/* Playhead Needle */}
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

          {/* Track 1: Subtitles / Speech */}
          <div className="daw-track-row">
            <div className="daw-track-header">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Mic className="w-3 h-3 text-violet-400" /> Narration
              </span>
              <span className="text-[9px] text-slate-500">
                {timeline?.analyzed_segments.length ?? 0} segments
              </span>
            </div>
            <div
              className="daw-track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo(((e.clientX - rect.left) / rect.width) * dur);
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
                    className="absolute top-1.5 bottom-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2 flex items-center text-[10px] text-slate-300 truncate cursor-pointer transition-colors"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`"${seg.text}" (${formatTs(seg.start_sec)})`}
                  >
                    <span className="truncate">{seg.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Sound Effects */}
          <div className="daw-track-row" style={{ minHeight: 64 }}>
            <div className="daw-track-header">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Sound FX
              </span>
              <span className="text-[9px] text-slate-500">{events.length} clips</span>
            </div>
            <div
              className="daw-track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo(((e.clientX - rect.left) / rect.width) * dur);
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

          {/* Track 3: Ambient Bed */}
          <div className="daw-track-row">
            <div className="daw-track-header">
              <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                <Music className="w-3 h-3 text-violet-400" /> Ambient Score
              </span>
              <span className="text-[9px] text-slate-500">
                {musicConfig ? musicConfig.mood : "Disabled"}
              </span>
            </div>
            <div
              className="daw-track-lane"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekTo(((e.clientX - rect.left) / rect.width) * dur);
              }}
            >
              {musicConfig && musicEnabled && (
                <div className="absolute inset-y-1.5 inset-x-0 rounded bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-violet-500/20 border border-violet-500/30 flex items-center px-4 justify-between">
                  <span className="text-[10px] text-violet-300 font-mono">
                    {musicConfig.track_path.split(/[\\/]/).pop()}
                  </span>
                  <span className="text-[9px] font-mono text-violet-400">
                    Continuous Bed
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
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f1220]">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Sound Library Catalog</h3>
                  <p className="text-[10px] text-slate-400">103 studio sounds ready to drop</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 border-b border-white/5 bg-[#090b14]">
              <Input
                placeholder="Search sound effects..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="text-xs h-9"
              />

              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {["all", "impact", "boom", "riser", "glitch", "whoosh", "transition", "heartbeat", "click", "upbeat"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDrawerCategory(cat)}
                    className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      drawerCategory === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredLibrary.map((item, idx) => (
                <div key={idx} className="sound-card">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => playAudioPreview(`assets/sfx/${item.folder}/${item.filename}`)}
                      className="w-7 h-7 rounded-lg bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white flex items-center justify-center text-xs flex-shrink-0 transition-colors"
                    >
                      {previewAudioPath === `assets/sfx/${item.folder}/${item.filename}` ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
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

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => insertSoundEffect(item)}
                    className="h-7 px-2.5 text-[10px] font-bold"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Insert
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      {toastMessage && (
        <div className="toast-banner">
          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
