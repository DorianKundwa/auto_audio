"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Play,
  Pause,
  RotateCcw,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
} from "lucide-react";

interface TransportControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoom: number;
  snapEnabled: boolean;
  onTogglePlay: () => void;
  onResetTime: () => void;
  onSetZoom: (z: number) => void;
  onToggleSnap: () => void;
}

function formatDigits(sec: number): string {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function TransportControls({
  isPlaying,
  currentTime,
  duration,
  zoom,
  snapEnabled,
  onTogglePlay,
  onResetTime,
  onSetZoom,
  onToggleSnap,
}: TransportControlsProps) {
  const zoomLevels = [0.75, 1, 1.5, 2, 3];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0b0e18] border border-white/[0.08] shadow-inner select-none">
        {/* Left: Master Transport Buttons */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPlaying ? "default" : "secondary"}
                size="sm"
                onClick={onTogglePlay}
                className="h-8 px-3 text-xs font-bold gap-1.5 shadow-md"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Play</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Space</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onResetTime}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to 00:00.00</TooltipContent>
          </Tooltip>

          {/* Large Digital Timecode */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 border border-white/5 font-mono text-xs font-bold text-slate-200">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span className="text-indigo-300">{formatDigits(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatDigits(duration)}</span>
          </div>
        </div>

        {/* Center: Snapping Control */}
        <div className="flex items-center gap-2">
          <Button
            variant={snapEnabled ? "secondary" : "ghost"}
            size="sm"
            onClick={onToggleSnap}
            className={`h-7 px-2.5 text-[11px] font-semibold transition-all ${
              snapEnabled
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Magnet className="w-3 h-3 mr-1.5" />
            <span>Snap to Narration</span>
          </Button>
        </div>

        {/* Right: Zoom Multiplier Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Zoom</span>
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/5">
            {zoomLevels.map((z) => (
              <button
                key={z}
                onClick={() => onSetZoom(z)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  zoom === z
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
