"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  FolderPlus,
  Download,
  Sparkles,
  Volume2,
  Activity,
  Layers,
  Check,
} from "lucide-react";

interface StudioHeaderProps {
  jobId: string;
  sfxCount: number;
  segmentsCount: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  isPlaying?: boolean;
  onToggleMusic: (val: boolean) => void;
  onToggleSFX: (val: boolean) => void;
  onOpenLibrary: () => void;
  onOpenShortcuts?: () => void;
  onOpenExport: () => void;
  isExporting?: boolean;
}

export function StudioHeader({
  jobId,
  sfxCount,
  segmentsCount,
  musicEnabled,
  sfxEnabled,
  isPlaying = false,
  onToggleMusic,
  onToggleSFX,
  onOpenLibrary,
  onOpenShortcuts,
  onOpenExport,
  isExporting = false,
}: StudioHeaderProps) {
  const router = useRouter();

  // Simulated live Master Stereo VU Levels
  const [meterL, setMeterL] = useState(12);
  const [meterR, setMeterR] = useState(14);

  useEffect(() => {
    if (!isPlaying) {
      setMeterL(4);
      setMeterR(4);
      return;
    }

    const interval = setInterval(() => {
      setMeterL(Math.floor(Math.random() * 55) + 35);
      setMeterR(Math.floor(Math.random() * 55) + 38);
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <header className="h-13 px-5 flex items-center justify-between border-b border-[#3E3E42] bg-[#252528] sticky top-0 z-40 select-none">
      {/* Left: Navigation & Branding */}
      <div className="flex items-center gap-3.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="h-8 px-2.5 text-xs text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> New Project
        </Button>

        <div className="h-4 w-px bg-[#3E3E42]" />

        <div className="flex items-center gap-2">
          <span
            className="font-bold text-sm tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Auto<span className="text-indigo-400">Audio</span>
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] font-mono px-2 py-0.5 uppercase bg-[#1E1E1E] border-[#3E3E42] text-[#CCCCCC]"
          >
            {jobId.slice(0, 8)}
          </Badge>
        </div>

        {/* AI Stats Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {segmentsCount} cues analyzed • {sfxCount} SFX placed • Master 48kHz
          </span>
        </div>
      </div>

      {/* Center: Master Stereo VU Meter */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#1E1E1E] border border-[#3E3E42]">
        <span className="text-[9px] font-mono text-[#858585] font-bold">MASTER</span>
        <div className="flex flex-col gap-1 w-24">
          {/* Channel L */}
          <div className="h-1.5 w-full bg-[#2D2D30] rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 ${
                meterL > 80 ? "bg-red-500" : meterL > 65 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${meterL}%` }}
            />
          </div>
          {/* Channel R */}
          <div className="h-1.5 w-full bg-[#2D2D30] rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 ${
                meterR > 80 ? "bg-red-500" : meterR > 65 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${meterR}%` }}
            />
          </div>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 font-bold">
          {isPlaying ? "-6 dB" : "-inf"}
        </span>
      </div>

      {/* Right: Studio Controls & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Track Mute Toggles */}
        <div className="flex items-center gap-3 bg-[#1E1E1E] px-3 py-1 rounded-lg border border-[#3E3E42] text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-[#CCCCCC] hover:text-white select-none">
            <Switch
              checked={musicEnabled}
              onCheckedChange={onToggleMusic}
            />
            <span className="font-medium text-[11px]">Music</span>
          </label>
          <div className="h-3.5 w-px bg-[#3E3E42]" />
          <label className="flex items-center gap-2 cursor-pointer text-[#CCCCCC] hover:text-white select-none">
            <Switch
              checked={sfxEnabled}
              onCheckedChange={onToggleSFX}
            />
            <span className="font-medium text-[11px]">SFX ({sfxCount})</span>
          </label>
        </div>

        {/* Shortcuts Button */}
        {onOpenShortcuts && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenShortcuts}
            className="h-8 px-2 text-xs text-[#858585] hover:text-[#CCCCCC] hover:bg-white/[0.06]"
            title="Keyboard Shortcuts (?)"
          >
            ⌨ <span className="hidden sm:inline ml-1 font-mono text-[10px]">[?]</span>
          </Button>
        )}

        {/* Sound Library Drawer Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLibrary}
          className="h-8 text-xs font-semibold bg-[#2D2D30] border-[#3E3E42] text-[#CCCCCC] hover:text-white hover:bg-[#38383C] transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Sound Library
        </Button>

        {/* Export Button */}
        <Button
          variant="gradient"
          size="sm"
          onClick={onOpenExport}
          disabled={isExporting}
          className="h-8 text-xs font-semibold px-4 shadow-md bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Export Video</span>
        </Button>
      </div>
    </header>
  );
}
