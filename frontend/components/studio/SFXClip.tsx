"use client";

import React, { useRef } from "react";
import { SFXEvent } from "@/hooks/useTimeline";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Trash2, GripHorizontal } from "lucide-react";

interface SFXClipProps {
  event: SFXEvent;
  videoDuration: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, clientX: number, containerWidth: number) => void;
}

const SFX_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  impact: { border: "#ef4444", bg: "rgba(239, 68, 68, 0.18)", text: "#f87171" },
  boom: { border: "#f97316", bg: "rgba(249, 115, 22, 0.18)", text: "#fb923c" },
  riser: { border: "#8b5cf6", bg: "rgba(139, 92, 246, 0.18)", text: "#a78bfa" },
  glitch: { border: "#06b6d4", bg: "rgba(6, 182, 212, 0.18)", text: "#22d3ee" },
  whoosh: { border: "#10b981", bg: "rgba(16, 185, 129, 0.18)", text: "#34d399" },
  transition: { border: "#6366f1", bg: "rgba(99, 102, 241, 0.18)", text: "#818cf8" },
  heartbeat: { border: "#f43f5e", bg: "rgba(244, 63, 94, 0.18)", text: "#fb7185" },
  click: { border: "#eab308", bg: "rgba(234, 179, 8, 0.18)", text: "#facc15" },
  upbeat: { border: "#a855f7", bg: "rgba(168, 85, 247, 0.18)", text: "#c084fc" },
  silence: { border: "#64748b", bg: "rgba(100, 116, 139, 0.25)", text: "#94a3b8" },
  drop: { border: "#64748b", bg: "rgba(100, 116, 139, 0.25)", text: "#94a3b8" },
};

function formatSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function SFXClip({
  event,
  videoDuration,
  isSelected,
  onSelect,
  onDelete,
  onDragStart,
}: SFXClipProps) {
  const clipRef = useRef<HTMLDivElement | null>(null);

  const colors = SFX_COLORS[event.sfx_type] || {
    border: "#6366f1",
    bg: "rgba(99, 102, 241, 0.18)",
    text: "#818cf8",
  };

  const leftPercent = (event.timestamp / Math.max(1, videoDuration)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(event.id);

    const container = clipRef.current?.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      onDragStart(event.id, e.clientX, rect.width);
    }
  };

  return (
    <div
      ref={clipRef}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event.id);
      }}
      className={`absolute top-1.5 bottom-1.5 rounded-lg px-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing select-none transition-all duration-150 group z-20 ${
        isSelected
          ? "ring-2 ring-white shadow-xl scale-[1.02] z-30 brightness-110"
          : "hover:brightness-110 shadow-md"
      }`}
      style={{
        left: `${leftPercent}%`,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        transform: "translateX(0%)",
        minWidth: 110,
        maxWidth: 240,
      }}
      title={`${event.label} at ${formatSec(event.timestamp)} (Drag to move)`}
    >
      <GripHorizontal className="w-3 h-3 opacity-40 group-hover:opacity-100 flex-shrink-0" />

      {/* Mini Waveform Visualizer */}
      <WaveformVisualizer
        seed={event.sfx_path || event.id}
        bars={12}
        height={16}
        barWidth={2}
        gap={1.5}
        color={colors.border}
        className="opacity-75 flex-shrink-0"
      />

      <div className="flex-1 min-w-0 overflow-hidden">
        <p
          className="text-[11px] font-bold tracking-tight text-[#E0E0E0] truncate leading-tight"
          style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}
        >
          {event.label}
        </p>
        <span
          className="text-[9px] font-mono opacity-80 block leading-none truncate"
          style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}
        >
          {formatSec(event.timestamp)} • {Math.round(event.volume * 100)}%
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(event.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/30 text-red-400 hover:text-red-300 transition-opacity"
        title="Delete Sound Effect"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
