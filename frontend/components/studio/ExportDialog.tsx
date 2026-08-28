"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportStage } from "@/hooks/useProjectExport";
import {
  Film,
  Sparkles,
  Music,
  Layers,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ExportDialogProps {
  isOpen: boolean;
  stage: ExportStage;
  progress: number;
  error: string;
  downloadUrl: string | null;
  videoDuration: number;
  sfxCount: number;
  musicMood: string;
  onClose: () => void;
  onStartExport: () => void;
}

const STAGES = [
  { key: "preparing", label: "Preparing media & subtitle stream" },
  { key: "mixing", label: "Mixing multi-track audio buses" },
  { key: "applying_sfx", label: "Applying millisecond SFX delays" },
  { key: "rendering", label: "Rendering final video stream (FFmpeg)" },
  { key: "completed", label: "Sound design rendered successfully" },
];

function formatDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ExportDialog({
  isOpen,
  stage,
  progress,
  error,
  downloadUrl,
  videoDuration,
  sfxCount,
  musicMood,
  onClose,
  onStartExport,
}: ExportDialogProps) {
  const isBusy = stage !== "idle" && stage !== "completed" && stage !== "error";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Export Sound-Designed Video</span>
          </DialogTitle>
          <DialogDescription>
            Review project settings and render sample-accurate multi-track audio.
          </DialogDescription>
        </DialogHeader>

        {/* Project Summary Card */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-indigo-400" /> Video Resolution
              </span>
              <p className="font-bold text-white font-mono">1080p • Copy Stream</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-400" /> Total Duration
              </span>
              <p className="font-bold text-white font-mono">{formatDur(videoDuration)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Sound Design
              </span>
              <p className="font-bold text-white">{sfxCount} Sound Effects</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-emerald-400" /> Ambient Score
              </span>
              <p className="font-bold text-white uppercase">{musicMood || "None"}</p>
            </div>
          </div>
        </div>

        {/* Multi-Stage Visual Status */}
        {stage !== "idle" && (
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
              <span>
                {stage === "preparing" && "Preparing media assets..."}
                {stage === "mixing" && "Mixing multi-track audio..."}
                {stage === "applying_sfx" && "Applying audio filter graph..."}
                {stage === "rendering" && "Encoding final video with FFmpeg..."}
                {stage === "completed" && "Export completed!"}
                {stage === "error" && "Export failed"}
              </span>
              <span className="font-mono text-indigo-400">{progress}%</span>
            </div>

            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stage === "error"
                    ? "bg-red-500"
                    : stage === "completed"
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isBusy}
            className="text-xs"
          >
            Cancel
          </Button>

          {stage === "completed" && downloadUrl ? (
            <a
              href={downloadUrl}
              download={`auto_audio_final.mp4`}
              className="inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Download Video
            </a>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              onClick={onStartExport}
              disabled={isBusy}
              className="text-xs px-5 shadow-lg shadow-indigo-500/20"
            >
              {isBusy ? (
                <>
                  <span className="spinner mr-1.5" style={{ width: 14, height: 14 }} />
                  <span>Rendering ({progress}%)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" />
                  <span>Render & Export</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
