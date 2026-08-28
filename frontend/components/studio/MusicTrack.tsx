"use client";

import React from "react";
import { MusicConfig } from "@/hooks/useProjectExport";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Music, RefreshCw } from "lucide-react";

interface MusicTrackProps {
  musicConfig: MusicConfig | null;
  musicEnabled: boolean;
  videoDuration: number;
  currentTime: number;
}

export function MusicTrack({
  musicConfig,
  musicEnabled,
  videoDuration,
  currentTime,
}: MusicTrackProps) {
  if (!musicConfig || !musicEnabled) {
    return (
      <div className="absolute inset-y-1.5 inset-x-0 rounded-lg bg-white/[0.01] border border-dashed border-white/5 flex items-center justify-center text-[10px] text-slate-600 font-mono">
        Music score muted or disabled
      </div>
    );
  }

  const trackName = musicConfig.track_path.split(/[\\/]/).pop() || "ambient_score.wav";
  const progress = videoDuration > 0 ? currentTime / videoDuration : 0;

  return (
    <div className="absolute inset-y-1.5 inset-x-0 rounded-lg bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-violet-600/15 border border-violet-500/25 flex items-center px-4 justify-between overflow-hidden shadow-inner">
      <div className="flex items-center gap-2.5 z-10">
        <div className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-violet-300">
          <Music className="w-3 h-3" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-violet-200 block truncate max-w-[240px]">
            {musicConfig.mood.toUpperCase()} • {trackName}
          </span>
          <span className="text-[9px] font-mono text-violet-400">
            Looping continuous score • Vol {Math.round(musicConfig.volume * 100)}%
          </span>
        </div>
      </div>

      {/* Ambient Looping Waveform Preview */}
      <div className="flex items-center gap-1 opacity-40">
        <WaveformVisualizer
          seed={trackName}
          bars={64}
          height={20}
          barWidth={2}
          gap={2}
          color="rgba(167, 139, 250, 0.3)"
          activeColor="#a78bfa"
          progress={progress}
        />
      </div>
    </div>
  );
}
