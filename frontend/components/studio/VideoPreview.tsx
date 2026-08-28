"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FastForward,
  Rewind,
  Sparkles,
  Layers,
  Music,
  Clock,
} from "lucide-react";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  src: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  sfxCount: number;
  activeMood: string;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkip: (delta: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleFullscreen: () => void;
}

function formatTimecode(sec: number): string {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function VideoPreview({
  videoRef,
  containerRef,
  src,
  currentTime,
  duration,
  isPlaying,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  sfxCount,
  activeMood,
  onTimeUpdate,
  onLoadedMetadata,
  onTogglePlay,
  onSeek,
  onSkip,
  onSetVolume,
  onToggleMute,
  onSetPlaybackRate,
  onToggleFullscreen,
}: VideoPreviewProps) {
  const rates = [0.5, 1, 1.25, 1.5, 2];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        className="flex flex-col rounded-xl bg-[#2D2D30] border border-[#3E3E42] shadow-xl overflow-hidden select-none"
      >
        {/* ── Top Canvas Header HUD ── */}
        <div className="h-9 px-3.5 bg-[#252528] border-b border-[#3E3E42] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold px-2 py-0.5"
            >
              <Sparkles className="w-3 h-3 mr-1 text-indigo-400" /> AI PREVIEW
            </Badge>

            <span className="text-[11px] font-mono text-[#CCCCCC]">
              {sfxCount} SFX Events
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#CCCCCC] font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? "bg-red-500 animate-ping" : "bg-[#858585]"
              }`}
            />
            <span>{formatTimecode(currentTime)}</span>
            <span className="text-[#858585]">/</span>
            <span className="text-[#858585]">{formatTimecode(duration)}</span>
          </div>
        </div>

        {/* ── 16:9 Video Canvas ── */}
        <div className="relative aspect-video w-full bg-[#18181B] flex items-center justify-center">
          <video
            ref={videoRef}
            src={src}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onClick={onTogglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Center Play Button Overlay when paused */}
          {!isPlaying && (
            <button
              onClick={onTogglePlay}
              aria-label="Play video"
              className="absolute inset-0 m-auto w-14 h-14 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center backdrop-blur-md shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all cursor-pointer z-10"
            >
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </button>
          )}
        </div>

        {/* ── Dedicated Anchored Bottom Control Bar (Below Video Canvas) ── */}
        <div className="p-3 bg-[#252528] border-t border-[#3E3E42] flex flex-col gap-2">
          {/* Progress Scrubber */}
          <div className="px-1">
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              max={100}
              step={0.1}
              onValueChange={(val) => onSeek((val[0] / 100) * duration)}
              className="h-1.5 cursor-pointer"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-[#CCCCCC]">
            {/* Left Playback Buttons */}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isPlaying ? "secondary" : "default"}
                    size="icon"
                    onClick={onTogglePlay}
                    className="h-8 w-8 text-white rounded-lg shadow-sm"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Space (Play/Pause)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSkip(-5)}
                    className="h-8 w-8 text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                  >
                    <Rewind className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Shift + ← (-5s)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSkip(5)}
                    className="h-8 w-8 text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Shift + → (+5s)</TooltipContent>
              </Tooltip>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleMute}
                  className="h-8 w-8 text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <div className="w-20 hidden sm:block">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(val) => onSetVolume(val[0] / 100)}
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Right Speed & Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Playback Rate Selector */}
              <div className="flex items-center bg-[#1E1E1E] border border-[#3E3E42] rounded-lg p-0.5">
                {rates.map((r) => (
                  <button
                    key={r}
                    onClick={() => onSetPlaybackRate(r)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      playbackRate === r
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-[#858585] hover:text-[#CCCCCC]"
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFullscreen}
                    className="h-8 w-8 text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
