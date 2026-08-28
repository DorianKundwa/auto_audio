"use client";

import React, { useRef } from "react";
import { Clock } from "lucide-react";

interface TimelineRulerProps {
  duration: number;
  currentTime: number;
  zoom: number;
  onSeek: (time: number) => void;
}

function formatRulerTs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  if (m === 0 && s < 10) {
    return `${s}.${String(cs).padStart(2, "0")}s`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimelineRuler({
  duration,
  currentTime,
  zoom,
  onSeek,
}: TimelineRulerProps) {
  const rulerRef = useRef<HTMLDivElement | null>(null);

  // Compute number of major tick marks
  const tickInterval = zoom >= 2 ? 2.5 : zoom >= 1 ? 5 : 10;
  const numTicks = Math.max(1, Math.ceil(duration / tickInterval));
  const ticks = Array.from({ length: numTicks + 1 }, (_, i) => i * tickInterval).filter(
    (t) => t <= duration
  );

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = (clickX / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, seekTime)));
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={rulerRef}
      onClick={handleRulerClick}
      className="relative h-7 bg-[#0b0d18] border-b border-white/[0.08] cursor-pointer select-none overflow-hidden"
    >
      {/* Precision Playhead Needle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none z-30 transition-transform duration-75"
        style={{ left: `${playheadPercent}%` }}
      >
        <div className="absolute -top-0 -left-[5px] w-0 h-0 border-x-[5px] border-x-transparent border-t-[8px] border-t-red-500" />
      </div>

      {/* Dynamic Tick Marks */}
      {ticks.map((t) => {
        const left = (t / Math.max(1, duration)) * 100;
        return (
          <div
            key={t}
            className="absolute top-0 bottom-0 pointer-events-none flex flex-col justify-between"
            style={{ left: `${left}%` }}
          >
            <span className="text-[9px] font-mono text-slate-500 font-bold -translate-x-1/2 pt-0.5">
              {formatRulerTs(t)}
            </span>
            <div className="w-px h-2 bg-white/20 -translate-x-1/2" />
          </div>
        );
      })}
    </div>
  );
}
