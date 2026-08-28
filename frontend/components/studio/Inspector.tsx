"use client";

import React, { useRef, useEffect } from "react";
import { SFXEvent, AnalyzedSegment } from "@/hooks/useTimeline";
import { MusicConfig } from "@/hooks/useProjectExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Music,
  FileText,
  Play,
  Pause,
  Trash2,
  Copy,
  FolderOpen,
  Volume2,
  Clock,
  Layers,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface InspectorProps {
  selectedEvent: SFXEvent | undefined;
  musicConfig: MusicConfig | null;
  analyzedSegments: AnalyzedSegment[];
  currentTime: number;
  videoDuration: number;
  previewPlayingPath: string | null;
  onUpdateEvent: (id: string, updates: Partial<SFXEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onDuplicateEvent: (id: string) => void;
  onPlayAudioPreview: (path: string) => void;
  onOpenLibraryForReplace: (category: string) => void;
  onUpdateMusicConfig: (updates: Partial<MusicConfig>) => void;
  onSeek: (time: number) => void;
}

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
  dark_documentary: "Cinematic tension with heavy low-frequency drone beds",
  mysterious: "Ethereal atmospheric pads with subtle clockwork tension",
  upbeat: "High-energy motivating pulses with modern rhythmic synth beds",
};

export function Inspector({
  selectedEvent,
  musicConfig,
  analyzedSegments,
  currentTime,
  videoDuration,
  previewPlayingPath,
  onUpdateEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onPlayAudioPreview,
  onOpenLibraryForReplace,
  onUpdateMusicConfig,
  onSeek,
}: InspectorProps) {
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active speech segment during playback
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentTime]);

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <Tabs defaultValue="sfx" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-3 mb-3 bg-white/[0.03] border border-white/[0.08]">
          <TabsTrigger value="sfx" className="text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> SFX Clip
          </TabsTrigger>
          <TabsTrigger value="music" className="text-xs font-semibold">
            <Music className="w-3.5 h-3.5 mr-1.5 text-violet-400" /> Music Bed
          </TabsTrigger>
          <TabsTrigger value="script" className="text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Script Tags
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Selected SFX Inspector ── */}
        <TabsContent value="sfx" className="flex-1 overflow-y-auto m-0 pr-1 space-y-3">
          {selectedEvent ? (
            <Card className="p-4 space-y-4 border-indigo-500/25 bg-gradient-to-b from-indigo-950/20 to-transparent">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">
                    {SFX_ICONS[selectedEvent.sfx_type] || "🔊"}
                  </span>
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <span>{selectedEvent.label}</span>
                      <Badge variant="default" className="text-[10px] font-mono">
                        {selectedEvent.sfx_type.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] mt-0.5">
                      {selectedEvent.sfx_path.split(/[\\/]/).pop()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onPlayAudioPreview(selectedEvent.sfx_path)}
                    className="h-8 px-2.5 text-xs text-indigo-300"
                    title="Preview Sound"
                  >
                    {previewPlayingPath === selectedEvent.sfx_path ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicateEvent(selectedEvent.id)}
                    className="h-8 px-2 text-xs text-slate-300 hover:text-white"
                    title="Duplicate SFX"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteEvent(selectedEvent.id)}
                    className="h-8 px-2 text-xs"
                    title="Delete SFX"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Timestamp & Direct Editing */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Timestamp Placement
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">
                    {selectedEvent.timestamp.toFixed(2)}s
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max={videoDuration}
                  value={selectedEvent.timestamp}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      onUpdateEvent(selectedEvent.id, {
                        timestamp: Math.max(0, Math.min(videoDuration, val)),
                      });
                    }
                  }}
                  className="h-8 text-xs font-mono bg-black/40"
                />
              </div>

              {/* Volume Gain Fader */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Gain / Output Level
                  </span>
                  <Badge variant="default" className="font-mono text-[10px]">
                    {Math.round(selectedEvent.volume * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[selectedEvent.volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val) =>
                    onUpdateEvent(selectedEvent.id, { volume: val[0] / 100 })
                  }
                />
              </div>

              {/* AI Context Card */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Context Reason
                  </span>
                  <Badge variant="violet" className="text-[9px] font-mono">
                    94% Confidence
                  </Badge>
                </div>
                <p className="text-slate-300 italic text-[11px] leading-relaxed">
                  &quot;{selectedEvent.text_snippet}&quot;
                </p>
              </div>

              {/* Replace Sound Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenLibraryForReplace(selectedEvent.sfx_type)}
                className="w-full text-xs font-semibold gap-1.5 border-white/10 hover:border-indigo-500/40"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> Replace with Sound from Library
              </Button>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500 border-dashed border-white/10">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">
                Click any sound effect on the timeline below to inspect and edit volume
              </p>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Music Bed Inspector ── */}
        <TabsContent value="music" className="flex-1 overflow-y-auto m-0 pr-1 space-y-3">
          {musicConfig ? (
            <Card className="p-4 space-y-4 border-violet-500/25 bg-gradient-to-b from-violet-950/20 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-violet-200">
                      {musicConfig.mood.toUpperCase()}
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] mt-0.5">
                      {musicConfig.track_path.split(/[\\/]/).pop()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onPlayAudioPreview(musicConfig.track_path)}
                  className="h-8 px-2.5 text-xs text-violet-300"
                >
                  {previewPlayingPath === musicConfig.track_path ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </Button>
              </div>

              {/* Description */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Acoustic Bed Characteristics
                </span>
                <p className="text-[11px] leading-relaxed">
                  {MOOD_DESCRIPTIONS[musicConfig.mood] || "Atmospheric cinematic drone score"}
                </p>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Bed Volume Presence</span>
                  <Badge variant="violet" className="font-mono text-[10px]">
                    {Math.round(musicConfig.volume * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[(musicConfig.volume / 0.3) * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val) =>
                    onUpdateMusicConfig({ volume: (val[0] / 100) * 0.3 })
                  }
                />
              </div>

              {/* Mood Selector Switch */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Select Score Style
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {["dark_documentary", "mysterious", "upbeat"].map((m) => (
                    <button
                      key={m}
                      onClick={() => onUpdateMusicConfig({ mood: m })}
                      className={`p-2 rounded-xl text-left border text-[11px] font-bold transition-all cursor-pointer ${
                        musicConfig.mood === m
                          ? "bg-violet-600/20 border-violet-500 text-violet-200 ring-1 ring-violet-500"
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {m === "dark_documentary"
                        ? "Dark Doc"
                        : m === "mysterious"
                        ? "Mystery"
                        : "Upbeat"}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500 border-dashed border-white/10">
              <p className="text-xs">No background music score selected</p>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 3: Script Narration Tags ── */}
        <TabsContent value="script" className="flex-1 overflow-y-auto m-0 pr-1 space-y-2 max-h-[360px]">
          {analyzedSegments.map((seg) => {
            const isPlayingThis =
              currentTime >= seg.start_sec && currentTime <= seg.end_sec;

            return (
              <div
                key={seg.id}
                ref={isPlayingThis ? activeSegmentRef : null}
                onClick={() => onSeek(seg.start_sec)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                  isPlayingThis
                    ? "bg-violet-600/20 border-violet-500/60 shadow-lg shadow-violet-500/10 text-white"
                    : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-slate-300"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {seg.start_sec.toFixed(2)}s
                    </span>
                    <Badge
                      variant={isPlayingThis ? "violet" : "default"}
                      className="text-[9px] font-mono uppercase px-1.5 py-0"
                    >
                      {seg.tag}
                    </Badge>
                  </div>
                  <p className="truncate font-medium text-slate-100 text-[11px]">
                    &quot;{seg.text}&quot;
                  </p>
                </div>

                <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                  {Math.round((seg.confidence || 0.9) * 100)}%
                </span>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
