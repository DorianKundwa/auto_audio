"use client";

import React from "react";
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
  Music,
  Check,
} from "lucide-react";

interface StudioHeaderProps {
  jobId: string;
  sfxCount: number;
  segmentsCount: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  onToggleMusic: (val: boolean) => void;
  onToggleSFX: (val: boolean) => void;
  onOpenLibrary: () => void;
  onOpenExport: () => void;
  isExporting?: boolean;
}

export function StudioHeader({
  jobId,
  sfxCount,
  segmentsCount,
  musicEnabled,
  sfxEnabled,
  onToggleMusic,
  onToggleSFX,
  onOpenLibrary,
  onOpenExport,
  isExporting = false,
}: StudioHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-white/[0.08] bg-[#090b14]/90 backdrop-blur-xl sticky top-0 z-40">
      {/* Left: Navigation & Branding */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="h-8 px-2.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> New Project
        </Button>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2.5">
          <span
            className="font-bold text-sm tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Auto<span className="text-indigo-400">Audio</span>
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] font-mono px-2 py-0.5 uppercase bg-white/5 border-white/10"
          >
            {jobId.slice(0, 8)}
          </Badge>
        </div>

        {/* AI Stats Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {segmentsCount} beats analyzed • {sfxCount} SFX placed • Score synced
          </span>
        </div>
      </div>

      {/* Right: Studio Controls & Actions */}
      <div className="flex items-center gap-3">
        {/* Track Mute Toggles */}
        <div className="flex items-center gap-4 bg-white/[0.04] px-3 py-1 rounded-xl border border-white/[0.08] text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
            <Switch
              checked={musicEnabled}
              onCheckedChange={onToggleMusic}
            />
            <span className="font-medium text-[11px]">Music</span>
          </label>
          <div className="h-3.5 w-px bg-white/10" />
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
            <Switch
              checked={sfxEnabled}
              onCheckedChange={onToggleSFX}
            />
            <span className="font-medium text-[11px]">SFX ({sfxCount})</span>
          </label>
        </div>

        {/* Sound Library Drawer Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLibrary}
          className="h-8 text-xs font-semibold"
        >
          <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Sound Library
        </Button>

        {/* Export Button */}
        <Button
          variant="gradient"
          size="sm"
          onClick={onOpenExport}
          disabled={isExporting}
          className="h-8 text-xs font-semibold px-4 shadow-lg shadow-indigo-500/20"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Export Video</span>
        </Button>
      </div>
    </header>
  );
}
