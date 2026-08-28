"use client";

import React, { useState } from "react";
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
  const [showControls, setShowControls] = useState(false);

  const rates = [0.5, 1, 1.25, 1.5, 2];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl flex items-center justify-center group select-none"
      >
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onClick={onTogglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Center Large Play Icon (Visible when paused) */}
        {!isPlaying && (
          <button
            onClick={onTogglePlay}
            aria-label="Play video"
            className="absolute inset-0 m-auto w-16 h-16 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center backdrop-blur-md shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-all cursor-pointer z-10"
          >
            <Play className="w-7 h-7 fill-white ml-0.5" />
          </button>
        )}

        {/* Top HUD Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="bg-black/75 backdrop-blur-md border border-white/10 text-indigo-300 font-mono text-[10px] font-bold px-2.5 py-1 gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>AI SOUND DESIGN</span>
            </Badge>

            <Badge
              variant="secondary"
              className="bg-black/75 backdrop-blur-md border border-white/10 text-slate-300 text-[10px] font-mono font-medium px-2 py-1 shadow-lg"
            >
              <Layers className="w-3 h-3 mr-1 text-slate-400" /> {sfxCount} SFX
            </Badge>

            {activeMood && (
              <Badge
                variant="violet"
                className="hidden sm:inline-flex bg-black/75 backdrop-blur-md border border-violet-500/20 text-violet-300 text-[10px] font-mono px-2 py-1 shadow-lg"
              >
                <Music className="w-3 h-3 mr-1 text-violet-400" /> {activeMood.toUpperCase()}
              </Badge>
            )}
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 font-mono text-[11px] text-slate-200 font-bold flex items-center gap-1.5 shadow-lg">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? "bg-red-500 animate-ping" : "bg-slate-500"
              }`}
            />
            <span>{formatTimecode(currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTimecode(duration)}</span>
          </div>
        </div>

        {/* Bottom Hover Control Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 p-3 pt-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-200 z-20 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Progress Slider */}
          <div className="mb-2.5 px-1">
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              max={100}
              step={0.1}
              onValueChange={(val) => onSeek((val[0] / 100) * duration)}
              className="h-2 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-slate-200">
            {/* Left Playback Buttons */}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onTogglePlay}
                    className="h-8 w-8 text-white hover:bg-white/15"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Space</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSkip(-5)}
                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10"
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
                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10"
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
                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <div className="w-16 hidden sm:block">
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
              <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                {rates.map((r) => (
                  <button
                    key={r}
                    onClick={() => onSetPlaybackRate(r)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      playbackRate === r
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
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
                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10"
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
