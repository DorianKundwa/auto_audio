"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  Mic,
  Sliders,
  Volume2,
  HardDrive,
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
  { key: "preparing", label: "Preparing media & audio streams" },
  { key: "mixing", label: "Mixing multi-track audio buses" },
  { key: "applying_sfx", label: "Applying sample-accurate SFX delays" },
  { key: "rendering", label: "Rendering final video stream (FFmpeg)" },
  { key: "completed", label: "Sound design exported successfully" },
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

  // Audio Mixdown stem volumes & ducking states
  const [dialogueVol, setDialogueVol] = useState(85);
  const [musicVol, setMusicVol] = useState(60);
  const [sfxVol, setSfxVol] = useState(75);
  const [masterVol, setMasterVol] = useState(90);

  const [dialogueDuck, setDialogueDuck] = useState(false);
  const [musicDuck, setMusicDuck] = useState(true);
  const [sfxDuck, setSfxDuck] = useState(false);

  // Render settings
  const [resolution, setResolution] = useState<"1080p" | "4K">("1080p");
  const [codec, setCodec] = useState<"h264" | "prores">("h264");
  const [audioFormat, setAudioFormat] = useState("Lossless (24-bit WAV / AAC 192k)");

  const estSizeMB = Math.round(
    ((resolution === "4K" ? 22 : 8) * (videoDuration || 60)) / 8
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && onClose()}>
      <DialogContent className="max-w-3xl bg-surface-container border-outline-variant/20 text-on-surface shadow-2xl p-6 select-none">
        <DialogHeader className="border-b border-outline-variant/15 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="font-geist text-base font-bold text-white">
                  Audio Mixdown & Video Export
                </DialogTitle>
                <DialogDescription className="font-caption text-xs text-on-surface-variant">
                  Configure multi-track bus levels, ducking, and render settings.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="default" className="text-[10px] font-mono bg-surface-container-high text-primary border-primary/20">
              48kHz / 24-bit Bus
            </Badge>
          </div>
        </DialogHeader>

        {/* Main 2-Column Mixdown & Render Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left 7 Columns: Audio Mixdown Stems */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/10">
              <h3 className="font-geist text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" /> Multi-Track Stem Mixdown
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant">
                3 Active Tracks
              </span>
            </div>

            {/* Track 1: Dialogue */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-tertiary" />
                  <span className="font-bold text-on-surface">Dialogue.wav</span>
                </div>
                <span className="font-mono text-tertiary font-bold text-xs">{dialogueVol}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[dialogueVol]}
                  max={100}
                  step={1}
                  onValueChange={(v) => setDialogueVol(v[0])}
                  className="flex-1 h-1.5"
                />
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant cursor-pointer">
                  <span>DUCK</span>
                  <Switch checked={dialogueDuck} onCheckedChange={setDialogueDuck} className="scale-75" />
                </label>
              </div>
            </div>

            {/* Track 2: Music Bed */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-secondary" />
                  <span className="font-bold text-on-surface">Ambient_Score.wav</span>
                </div>
                <span className="font-mono text-secondary font-bold text-xs">{musicVol}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[musicVol]}
                  max={100}
                  step={1}
                  onValueChange={(v) => setMusicVol(v[0])}
                  className="flex-1 h-1.5"
                />
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant cursor-pointer">
                  <span>DUCK</span>
                  <Switch checked={musicDuck} onCheckedChange={setMusicDuck} className="scale-75" />
                </label>
              </div>
            </div>

            {/* Track 3: Sound FX Bus */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-bold text-on-surface">SFX_Layer ({sfxCount} clips)</span>
                </div>
                <span className="font-mono text-primary font-bold text-xs">{sfxVol}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[sfxVol]}
                  max={100}
                  step={1}
                  onValueChange={(v) => setSfxVol(v[0])}
                  className="flex-1 h-1.5"
                />
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant cursor-pointer">
                  <span>DUCK</span>
                  <Switch checked={sfxDuck} onCheckedChange={setSfxDuck} className="scale-75" />
                </label>
              </div>
            </div>

            {/* Master Volume Bar */}
            <div className="pt-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">
                Master Gain
              </span>
              <Slider
                value={[masterVol]}
                max={100}
                step={1}
                onValueChange={(v) => setMasterVol(v[0])}
                className="flex-1 h-1.5"
              />
              <span className="font-mono text-xs text-white font-bold">{masterVol}%</span>
            </div>
          </div>

          {/* Right 5 Columns: Render Settings & Action */}
          <div className="md:col-span-5 bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="font-geist text-xs font-bold text-on-surface uppercase tracking-wider">
                Render Target
              </h3>

              {/* Resolution Selector */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase">
                  Resolution
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResolution("1080p")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      resolution === "1080p"
                        ? "bg-primary-container text-on-primary-container shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:text-white"
                    }`}
                  >
                    1080p HD
                  </button>
                  <button
                    onClick={() => setResolution("4K")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      resolution === "4K"
                        ? "bg-primary-container text-on-primary-container shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:text-white"
                    }`}
                  >
                    4K UHD
                  </button>
                </div>
              </div>

              {/* Codec Selector */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase">
                  Format / Codec
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCodec("h264")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      codec === "h264"
                        ? "bg-primary-container text-on-primary-container shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:text-white"
                    }`}
                  >
                    H.264 (MP4)
                  </button>
                  <button
                    onClick={() => setCodec("prores")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      codec === "prores"
                        ? "bg-primary-container text-on-primary-container shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:text-white"
                    }`}
                  >
                    ProRes 422
                  </button>
                </div>
              </div>

              {/* Estimated File Size Badge */}
              <div className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-primary" /> Est. File Size:
                </span>
                <span className="text-primary font-bold">{estSizeMB} MB</span>
              </div>
            </div>

            {/* Export Progress & Actions */}
            <div className="space-y-3 pt-2">
              {stage !== "idle" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-primary flex items-center gap-1.5 font-bold">
                      {stage === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-tertiary" />
                      ) : (
                        <Sparkles className="w-4 h-4 animate-spin text-primary" />
                      )}
                      <span>
                        {STAGES.find((s) => s.key === stage)?.label || "Rendering audio..."}
                      </span>
                    </span>
                    <span className="font-bold text-primary">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-container via-primary to-secondary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2 rounded-lg bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
              )}

              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  download="auto_audio_sound_design.mp4"
                  className="w-full h-10 rounded-xl bg-tertiary hover:bg-tertiary/90 text-on-tertiary font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-tertiary/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Sound-Designed Video
                </a>
              ) : (
                <Button
                  variant="gradient"
                  size="default"
                  onClick={onStartExport}
                  disabled={isBusy}
                  className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-on-primary shadow-lg shadow-primary/20 cursor-pointer"
                >
                  {isBusy ? (
                    <>
                      <span className="spinner mr-2" style={{ width: 14, height: 14 }} />
                      <span>Rendering Stems ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1.5" />
                      <span>Start High-Definition Export</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
