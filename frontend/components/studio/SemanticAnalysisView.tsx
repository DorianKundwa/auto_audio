"use client";

import React, { useEffect, useState } from "react";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Layers,
  StopCircle,
  Volume2,
} from "lucide-react";

interface SemanticAnalysisViewProps {
  filename: string;
  progress: number;
  onAbort?: () => void;
}

const LIVE_SCRIPT_LINES = [
  { ts: "00:00:02", text: "What if I told you everything you remember was a simulation?", tag: "QUESTION" },
  { ts: "00:00:06", text: "In reality, the Mandela Effect was never supposed to happen.", tag: "HOOK" },
  { ts: "00:00:11", text: "Stage 2: Years later, the entire timeline began to glitch.", tag: "GLITCH" },
  { ts: "00:00:16", text: "Suddenly, all data records were wiped without warning.", tag: "REVEAL" },
  { ts: "00:00:21", text: "And that's when everything changed forever.", tag: "CLIMAX" },
];

const LIVE_PLACED_EVENTS = [
  { type: "RISER", label: "Tension Riser", ts: "00:00:03.50", conf: "96%" },
  { type: "IMPACT", label: "Sub Boom", ts: "00:00:06.00", conf: "98%" },
  { type: "GLITCH", label: "Digital Glitch 04", ts: "00:00:11.20", conf: "92%" },
  { type: "WHOOSH", label: "Fast Transition", ts: "00:00:16.10", conf: "95%" },
];

export function SemanticAnalysisView({
  filename,
  progress,
  onAbort,
}: SemanticAnalysisViewProps) {
  const [activeLineIdx, setActiveLineIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLineIdx((prev) => (prev + 1) % LIVE_SCRIPT_LINES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-108px)] bg-background text-on-surface select-none overflow-hidden rounded-2xl border border-outline-variant/15 shadow-2xl">
      {/* ── Top Action Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
          </div>
          <div>
            <h2 className="font-geist font-bold text-base text-on-surface leading-tight">
              Semantic Sound Analysis Active
            </h2>
            <p className="font-caption text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span>AI Audio Engine v4.2 • Processing</span>
              <span className="font-mono text-primary font-bold">{filename || "video.mp4"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
              Analysis Progress
            </span>
            <div className="flex items-center gap-3">
              <div className="w-40 h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-container via-primary to-secondary transition-all duration-300 relative"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-primary">{progress}%</span>
            </div>
          </div>

          {onAbort && (
            <button
              onClick={onAbort}
              className="px-4 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error font-bold text-xs flex items-center gap-1.5 transition-colors border border-error/20 cursor-pointer"
            >
              <StopCircle className="w-4 h-4" /> Abort
            </button>
          )}
        </div>
      </div>

      {/* ── Main 3-Column Analysis Grid ── */}
      <div className="flex-1 grid grid-cols-12 gap-[1px] bg-outline-variant/10 overflow-hidden">
        {/* Column 1: Transcription Stream */}
        <div className="col-span-4 bg-surface-dim flex flex-col h-full border-r border-outline-variant/10">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50 backdrop-blur-sm">
            <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" /> Narration Cue Stream
            </h3>
            <Badge variant="default" className="text-[9px] font-mono bg-primary/10 text-primary border-primary/20">
              LIVE
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 font-mono text-xs">
            {LIVE_SCRIPT_LINES.map((line, idx) => {
              const isActive = idx === activeLineIdx;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? "bg-surface-container border-primary shadow-md shadow-primary/10 text-on-surface"
                      : "bg-surface-container-low border-outline-variant/10 text-on-surface-variant opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-outline font-bold">[{line.ts}]</span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold border border-primary/30 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> {line.tag}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs leading-relaxed">&quot;{line.text}&quot;</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Video & Neural Waveform Scanner */}
        <div className="col-span-5 bg-surface flex flex-col h-full items-center justify-center p-6 relative">
          <div className="w-full aspect-video rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-2xl">
            {/* Animated Radar Pulse */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
              <div className="w-72 h-72 rounded-full border border-secondary/15 animate-ping" style={{ animationDuration: "4s" }} />
            </div>

            <Cpu className="w-12 h-12 text-primary mb-3 animate-pulse" />
            <h4 className="font-geist font-bold text-sm text-white mb-1">
              Synthesizing Multi-Stem Audio Layers
            </h4>
            <p className="font-caption text-xs text-on-surface-variant text-center max-w-xs">
              Matching narrative inflections with 48kHz acoustic textures and tension drops.
            </p>

            <div className="mt-6 w-full flex justify-center opacity-80">
              <WaveformVisualizer seed="neural_analysis_stream" bars={48} height={32} color="#c0c1ff" />
            </div>
          </div>
        </div>

        {/* Column 3: Real-Time Event Placement Queue */}
        <div className="col-span-3 bg-surface-dim flex flex-col h-full border-l border-outline-variant/10">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
            <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-secondary" /> Placed SFX Queue
            </h3>
            <span className="font-mono text-[10px] text-tertiary font-bold">48kHz</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {LIVE_PLACED_EVENTS.map((ev, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-surface-container border border-outline-variant/10 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-on-surface">{ev.label}</span>
                    <Badge variant="default" className="text-[8px] font-mono px-1 py-0 uppercase bg-primary-container/20 text-primary">
                      {ev.type}
                    </Badge>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant">{ev.ts}</span>
                </div>
                <span className="font-mono text-xs text-tertiary font-bold">{ev.conf}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
