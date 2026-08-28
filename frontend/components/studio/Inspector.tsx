"use client";

import React, { useRef, useEffect, useState } from "react";
import { SFXEvent, AnalyzedSegment } from "@/hooks/useTimeline";
import { MusicConfig } from "@/hooks/useProjectExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { WaveformVisualizer } from "./WaveformVisualizer";
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
  SlidersHorizontal,
  Compass,
  Activity,
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

const EQ_PRESETS = [
  { id: "flat", label: "Flat (Original)" },
  { id: "lowcut", label: "Low-Cut (80Hz)" },
  { id: "bassboost", label: "Bass Punch" },
  { id: "clarity", label: "Vocal Clarity" },
];

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

  // Local effect parameters (Pitch, Pan, EQ)
  const [pitch, setPitch] = useState(0); // -12 to +12
  const [pan, setPan] = useState(0); // -100 to +100
  const [activeEq, setActiveEq] = useState("flat");

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
    <div className="flex flex-col h-full rounded-xl bg-[#2D2D30] border border-[#3E3E42] shadow-xl overflow-hidden select-none p-3.5">
      <Tabs defaultValue="sfx" className="flex-1 flex flex-col overflow-hidden">
        {/* Top Tab Switcher */}
        <TabsList className="w-full grid grid-cols-3 mb-3 bg-[#1E1E1E] border border-[#3E3E42] p-0.5">
          <TabsTrigger value="sfx" className="text-xs font-semibold py-1">
            <Sparkles className="w-3 h-3 mr-1 text-indigo-400" /> SFX Clip
          </TabsTrigger>
          <TabsTrigger value="music" className="text-xs font-semibold py-1">
            <Music className="w-3 h-3 mr-1 text-violet-400" /> Music Bed
          </TabsTrigger>
          <TabsTrigger value="script" className="text-xs font-semibold py-1">
            <FileText className="w-3 h-3 mr-1 text-cyan-400" /> Script Tags
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Selected SFX Inspector ── */}
        <TabsContent value="sfx" className="flex-1 overflow-y-auto m-0 pr-1 space-y-2.5">
          {selectedEvent ? (
            <div className="space-y-2.5">
              {/* Header Row */}
              <div className="p-3 rounded-lg bg-[#252528] border border-[#3E3E42] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl">
                    {SFX_ICONS[selectedEvent.sfx_type] || "🔊"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">
                        {selectedEvent.label}
                      </span>
                      <Badge variant="default" className="text-[9px] font-mono px-1 py-0 uppercase">
                        {selectedEvent.sfx_type}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#858585] font-mono truncate max-w-[170px]">
                      {selectedEvent.sfx_path.split(/[\\/]/).pop()}
                    </p>
                  </div>
                </div>

                {/* Quick Action Icon Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onPlayAudioPreview(selectedEvent.sfx_path)}
                    className="h-7 w-7 text-indigo-300 bg-[#1E1E1E] hover:bg-white/[0.08]"
                    title="Preview Audio"
                  >
                    {previewPlayingPath === selectedEvent.sfx_path ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDuplicateEvent(selectedEvent.id)}
                    className="h-7 w-7 text-[#CCCCCC] hover:text-white hover:bg-white/[0.08]"
                    title="Duplicate Event"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteEvent(selectedEvent.id)}
                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Waveform Audition Strip */}
              <div className="p-2 rounded-lg bg-[#1E1E1E] border border-[#3E3E42] flex items-center justify-between">
                <WaveformVisualizer
                  seed={selectedEvent.sfx_path || selectedEvent.id}
                  bars={42}
                  height={18}
                  barWidth={2}
                  gap={1.5}
                  color="#6366f1"
                />
                <span className="text-[9px] font-mono text-[#858585]">
                  48kHz 24-bit
                </span>
              </div>

              {/* Compact Parameters Grid: Timestamp & Gain Fader */}
              <div className="grid grid-cols-2 gap-2">
                {/* Timestamp Placement Box */}
                <div className="p-2.5 rounded-lg bg-[#252528] border border-[#3E3E42] space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-[#858585]">
                    <span className="font-semibold uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" /> Position
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
                    className="h-7 text-xs font-mono bg-[#1E1E1E] border-[#3E3E42] text-[#CCCCCC] px-2"
                  />
                </div>

                {/* Gain Level Fader Box */}
                <div className="p-2.5 rounded-lg bg-[#252528] border border-[#3E3E42] space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-[#858585]">
                    <span className="font-semibold uppercase flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-indigo-400" /> Gain
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {Math.round(selectedEvent.volume * 100)}%
                    </span>
                  </div>
                  <div className="pt-1">
                    <Slider
                      value={[selectedEvent.volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={(val) =>
                        onUpdateEvent(selectedEvent.id, { volume: val[0] / 100 })
                      }
                      className="h-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Pitch & Stereo Pan Controls */}
              <div className="p-2.5 rounded-lg bg-[#252528] border border-[#3E3E42] space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#858585]">
                  <span className="font-semibold uppercase flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-violet-400" /> Pitch & Pan
                  </span>
                  <span className="font-mono text-[#CCCCCC]">
                    {pitch > 0 ? `+${pitch}` : pitch} st • {pan === 0 ? "C" : pan < 0 ? `L${Math.abs(pan)}%` : `R${pan}%`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#858585]">Pitch Tuning</span>
                    <Slider
                      value={[pitch]}
                      min={-12}
                      max={12}
                      step={1}
                      onValueChange={(v) => setPitch(v[0])}
                      className="h-1.5"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-[#858585]">Stereo Pan</span>
                    <Slider
                      value={[pan]}
                      min={-100}
                      max={100}
                      step={5}
                      onValueChange={(v) => setPan(v[0])}
                      className="h-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Compact AI Context Banner */}
              <div className="p-2.5 rounded-lg bg-[#252528] border border-indigo-500/20 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Narration Trigger
                  </span>
                  <span className="text-violet-300 font-mono font-bold">94% confidence</span>
                </div>
                <p className="text-[#CCCCCC] italic text-[11px] truncate leading-tight">
                  &quot;{selectedEvent.text_snippet}&quot;
                </p>
              </div>

              {/* Replace Sound Action */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenLibraryForReplace(selectedEvent.sfx_type)}
                className="w-full h-8 text-xs font-semibold gap-1.5 bg-[#252528] border-[#3E3E42] hover:border-indigo-500/40 hover:bg-[#38383C] text-[#CCCCCC] hover:text-white transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> Replace Sound from Library
              </Button>
            </div>
          ) : (
            <div className="p-8 text-center text-[#858585] rounded-lg border border-dashed border-[#3E3E42]">
              <Layers className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Click any sound clip on the timeline to inspect and edit</p>
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: Music Bed Inspector ── */}
        <TabsContent value="music" className="flex-1 overflow-y-auto m-0 pr-1 space-y-2.5">
          {musicConfig ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-[#252528] border border-[#3E3E42] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {musicConfig.mood.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#858585] font-mono block truncate">
                      {musicConfig.track_path.split(/[\\/]/).pop()}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => onPlayAudioPreview(musicConfig.track_path)}
                  className="h-8 w-8 text-violet-300 bg-[#1E1E1E]"
                >
                  {previewPlayingPath === musicConfig.track_path ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </Button>
              </div>

              {/* Compact Volume Fader */}
              <div className="p-3 rounded-lg bg-[#252528] border border-[#3E3E42] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#858585] font-medium">Bed Volume Presence</span>
                  <span className="font-mono text-violet-300 font-bold text-xs">
                    {Math.round(musicConfig.volume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[(musicConfig.volume / 0.3) * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val) =>
                    onUpdateMusicConfig({ volume: (val[0] / 100) * 0.3 })
                  }
                  className="h-1.5"
                />
              </div>

              {/* Mood Selectors */}
              <div className="p-3 rounded-lg bg-[#252528] border border-[#3E3E42] space-y-2">
                <span className="text-[10px] text-[#858585] font-bold uppercase tracking-wider block">
                  Ambient Score Style
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {["dark_documentary", "mysterious", "upbeat"].map((m) => (
                    <button
                      key={m}
                      onClick={() => onUpdateMusicConfig({ mood: m })}
                      className={`py-1.5 px-2 rounded-lg text-center border text-[11px] font-bold transition-all cursor-pointer ${
                        musicConfig.mood === m
                          ? "bg-violet-600/25 border-violet-500 text-violet-200"
                          : "bg-[#1E1E1E] border-[#3E3E42] text-[#858585] hover:text-[#CCCCCC]"
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
            </div>
          ) : (
            <div className="p-8 text-center text-[#858585] rounded-lg border border-dashed border-[#3E3E42]">
              <p className="text-xs">No background music score selected</p>
            </div>
          )}
        </TabsContent>

        {/* ── Tab 3: Script Narration Tags ── */}
        <TabsContent value="script" className="flex-1 overflow-y-auto m-0 pr-1 space-y-1.5 max-h-[300px]">
          {analyzedSegments.map((seg) => {
            const isPlayingThis =
              currentTime >= seg.start_sec && currentTime <= seg.end_sec;

            return (
              <div
                key={seg.id}
                ref={isPlayingThis ? activeSegmentRef : null}
                onClick={() => onSeek(seg.start_sec)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-xs ${
                  isPlayingThis
                    ? "bg-violet-600/20 border-violet-500/70 text-white"
                    : "bg-[#252528] hover:bg-[#38383C] border-[#3E3E42] text-[#CCCCCC]"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[#858585] font-bold">
                      {seg.start_sec.toFixed(2)}s
                    </span>
                    <Badge
                      variant={isPlayingThis ? "violet" : "default"}
                      className="text-[9px] font-mono uppercase px-1 py-0"
                    >
                      {seg.tag}
                    </Badge>
                  </div>
                  <p className="truncate font-medium text-[11px]">
                    &quot;{seg.text}&quot;
                  </p>
                </div>

                <span className="text-[10px] font-mono text-[#858585] flex-shrink-0">
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
