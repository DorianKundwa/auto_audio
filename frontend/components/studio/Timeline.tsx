"use client";

import React, { useRef, useEffect } from "react";
import { SFXEvent, AnalyzedSegment } from "@/hooks/useTimeline";
import { MusicConfig } from "@/hooks/useProjectExport";
import { TimelineRuler } from "./TimelineRuler";
import { SFXClip } from "./SFXClip";
import { NarrationClip } from "./NarrationClip";
import { MusicTrack } from "./MusicTrack";
import { Mic, Sparkles, Music, Volume2, VolumeX, Eye } from "lucide-react";

interface TimelineProps {
  events: SFXEvent[];
  analyzedSegments: AnalyzedSegment[];
  musicConfig: MusicConfig | null;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  videoDuration: number;
  currentTime: number;
  zoom: number;
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onSeek: (time: number) => void;
  onDragStart: (id: string, clientX: number, containerWidth: number) => void;
  onDragMove: (clientX: number) => void;
  onDragEnd: () => void;
}

export function Timeline({
  events,
  analyzedSegments,
  musicConfig,
  musicEnabled,
  sfxEnabled,
  videoDuration,
  currentTime,
  zoom,
  selectedEventId,
  onSelectEvent,
  onDeleteEvent,
  onSeek,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TimelineProps) {
  const lanesRef = useRef<HTMLDivElement | null>(null);

  // Global mousemove/mouseup listener for smooth drag-and-drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      onDragMove(e.clientX);
    };

    const handleMouseUp = () => {
      onDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onDragMove, onDragEnd]);

  const playheadPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="flex rounded-2xl bg-[#090b14] border border-white/[0.08] overflow-hidden shadow-2xl select-none">
      {/* ── Fixed Track Headers Column (Left 140px) ── */}
      <div className="w-36 min-w-[144px] bg-[#0c0e1a] border-r border-white/[0.08] flex flex-col z-20 flex-shrink-0">
        {/* Top Ruler Placeholder Header */}
        <div className="h-7 border-b border-white/[0.08] px-3 flex items-center text-[10px] font-mono uppercase font-bold text-slate-500 bg-[#090b14]">
          Tracks
        </div>

        {/* Track 1 Header: Narration */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-white/[0.05] bg-[#0c0e1a]">
          <div>
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-violet-400" /> Speech
            </span>
            <span className="text-[9px] font-mono text-slate-500 block leading-tight">
              {analyzedSegments.length} captions
            </span>
          </div>
        </div>

        {/* Track 2 Header: Sound FX */}
        <div className="h-16 px-3 flex items-center justify-between border-b border-white/[0.05] bg-[#0c0e1a]">
          <div>
            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Sound FX
            </span>
            <span className="text-[9px] font-mono text-slate-500 block leading-tight">
              {events.length} clips
            </span>
          </div>
        </div>

        {/* Track 3 Header: Ambient Score */}
        <div className="h-14 px-3 flex items-center justify-between bg-[#0c0e1a]">
          <div>
            <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-violet-400" /> Music Bed
            </span>
            <span className="text-[9px] font-mono text-slate-500 block leading-tight">
              {musicConfig ? musicConfig.mood : "None"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Horizontally Scrollable Timeline Lanes Area (Right) ── */}
      <div className="flex-1 overflow-x-auto relative">
        <div
          ref={lanesRef}
          style={{ width: `${Math.max(100, zoom * 100)}%`, minWidth: "100%" }}
          className="relative"
        >
          {/* Top Time Ruler */}
          <TimelineRuler
            duration={videoDuration}
            currentTime={currentTime}
            zoom={zoom}
            onSeek={onSeek}
          />

          {/* Continuous Vertical Playhead Line Across All Tracks */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] pointer-events-none z-30 transition-transform duration-75"
            style={{ left: `${playheadPercent}%` }}
          />

          {/* Track 1 Lane: Narration Subtitle Blocks */}
          <div
            className="h-14 relative border-b border-white/[0.05] bg-[#080912] cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const seekTime = ((e.clientX - rect.left) / rect.width) * videoDuration;
              onSeek(seekTime);
            }}
          >
            {analyzedSegments.map((seg) => (
              <NarrationClip
                key={seg.id}
                segment={seg}
                videoDuration={videoDuration}
                currentTime={currentTime}
                onSeek={onSeek}
              />
            ))}
          </div>

          {/* Track 2 Lane: SFX Event Clips */}
          <div
            className="h-16 relative border-b border-white/[0.05] bg-[#0a0c16] cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const seekTime = ((e.clientX - rect.left) / rect.width) * videoDuration;
              onSeek(seekTime);
            }}
          >
            {sfxEnabled &&
              events.map((ev) => (
                <SFXClip
                  key={ev.id}
                  event={ev}
                  videoDuration={videoDuration}
                  isSelected={selectedEventId === ev.id}
                  onSelect={onSelectEvent}
                  onDelete={onDeleteEvent}
                  onDragStart={onDragStart}
                />
              ))}
          </div>

          {/* Track 3 Lane: Looping Ambient Music Bed */}
          <div
            className="h-14 relative bg-[#080912] cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const seekTime = ((e.clientX - rect.left) / rect.width) * videoDuration;
              onSeek(seekTime);
            }}
          >
            <MusicTrack
              musicConfig={musicConfig}
              musicEnabled={musicEnabled}
              videoDuration={videoDuration}
              currentTime={currentTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
