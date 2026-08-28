"use client";

import React, { useRef, useEffect } from "react";
import { SFXEvent, AnalyzedSegment } from "@/hooks/useTimeline";
import { MusicConfig } from "@/hooks/useProjectExport";
import { TimelineRuler } from "./TimelineRuler";
import { SFXClip } from "./SFXClip";
import { NarrationClip } from "./NarrationClip";
import { MusicTrack } from "./MusicTrack";
import { Mic, Sparkles, Music } from "lucide-react";

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
    <div className="flex rounded-xl bg-[#1E1E1E] border border-[#3E3E42] overflow-hidden shadow-2xl select-none">
      {/* ── Fixed Track Headers Column (Sticky Left 144px) ── */}
      <div className="w-36 min-w-[144px] bg-[#252528] border-r border-[#3E3E42] flex flex-col z-25 sticky left-0 flex-shrink-0">
        {/* Top Ruler Header Placeholder */}
        <div className="h-7 border-b border-[#3E3E42] px-3 flex items-center text-[10px] font-mono uppercase font-bold text-[#858585] bg-[#202023]">
          Tracks
        </div>

        {/* Track 1 Header: Speech */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-[#3E3E42] bg-[#252528]">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#CCCCCC] flex items-center gap-1.5 truncate">
              <Mic className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Speech
            </span>
            <span className="text-[9px] font-mono text-[#858585] block truncate leading-tight">
              {analyzedSegments.length} cues
            </span>
          </div>
        </div>

        {/* Track 2 Header: Sound FX */}
        <div className="h-16 px-3 flex items-center justify-between border-b border-[#3E3E42] bg-[#252528]">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" /> Sound FX
            </span>
            <span className="text-[9px] font-mono text-[#858585] block truncate leading-tight">
              {events.length} clips
            </span>
          </div>
        </div>

        {/* Track 3 Header: Ambient Score */}
        <div className="h-14 px-3 flex items-center justify-between bg-[#252528]">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 truncate">
              <Music className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Music Bed
            </span>
            <span className="text-[9px] font-mono text-[#858585] block truncate leading-tight">
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
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none z-30 transition-transform duration-75"
            style={{ left: `${playheadPercent}%` }}
          />

          {/* Track 1 Lane: Speech Subtitle Blocks (Muted Teal Background) */}
          <div
            className="h-14 relative border-b border-[#3E3E42] bg-[#1e262b] cursor-pointer"
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

          {/* Track 2 Lane: SFX Clips (Muted Indigo Background) */}
          <div
            className="h-16 relative border-b border-[#3E3E42] bg-[#262230] cursor-pointer"
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

          {/* Track 3 Lane: Looping Ambient Music Bed (Muted Orange Background) */}
          <div
            className="h-14 relative bg-[#2b251e] cursor-pointer"
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
