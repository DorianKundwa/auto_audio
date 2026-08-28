"use client";

import React from "react";
import { AnalyzedSegment } from "@/hooks/useTimeline";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface NarrationClipProps {
  segment: AnalyzedSegment;
  videoDuration: number;
  currentTime: number;
  onSeek: (timestamp: number) => void;
}

export function NarrationClip({
  segment,
  videoDuration,
  currentTime,
  onSeek,
}: NarrationClipProps) {
  const leftPercent = (segment.start_sec / Math.max(1, videoDuration)) * 100;
  const widthPercent = Math.max(
    1.5,
    ((segment.end_sec - segment.start_sec) / Math.max(1, videoDuration)) * 100
  );

  const isActive =
    currentTime >= segment.start_sec && currentTime <= segment.end_sec;

  // Calculate local progress through speech segment (0 to 1)
  const segmentDuration = Math.max(0.1, segment.end_sec - segment.start_sec);
  const segmentProgress = isActive
    ? Math.max(0, Math.min(1, (currentTime - segment.start_sec) / segmentDuration))
    : currentTime > segment.end_sec
    ? 1
    : 0;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSeek(segment.start_sec);
      }}
      className={`absolute top-1.5 bottom-1.5 rounded-lg px-2 flex items-center gap-2 cursor-pointer select-none transition-all duration-150 overflow-hidden ${
        isActive
          ? "bg-violet-600/30 border-2 border-violet-400 shadow-lg shadow-violet-500/20 z-20"
          : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/10"
      }`}
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        minWidth: 48,
      }}
      title={`"${segment.text}" (${segment.start_sec.toFixed(2)}s - ${segment.end_sec.toFixed(2)}s)`}
    >
      <WaveformVisualizer
        seed={segment.text}
        bars={Math.max(8, Math.min(32, Math.floor(widthPercent * 2.5)))}
        height={18}
        barWidth={2}
        gap={1.5}
        color={isActive ? "rgba(167, 139, 250, 0.4)" : "rgba(255, 255, 255, 0.15)"}
        activeColor="#c4b5fd"
        progress={segmentProgress}
        className="flex-shrink-0"
      />

      <span
        className="text-[10px] font-medium text-[#CCCCCC] truncate leading-tight flex-1 min-w-0"
        style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}
      >
        {segment.text}
      </span>
    </div>
  );
}
