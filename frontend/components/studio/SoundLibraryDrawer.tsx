"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WaveformVisualizer } from "./WaveformVisualizer";
import {
  FolderPlus,
  Search,
  Play,
  Pause,
  Plus,
  X,
  Sparkles,
  Layers,
  Filter,
  Music,
} from "lucide-react";

export interface SFXLibraryItem {
  filename: string;
  folder: string;
  type: string;
  intensity: number;
  duration: number;
  mood: string[];
}

interface SoundLibraryDrawerProps {
  isOpen: boolean;
  library: SFXLibraryItem[];
  currentTime: number;
  previewPlayingPath: string | null;
  initialCategory?: string;
  onClose: () => void;
  onPlayPreview: (path: string) => void;
  onInsertSound: (item: SFXLibraryItem) => void;
}

const CATEGORIES = [
  "all",
  "impact",
  "boom",
  "riser",
  "glitch",
  "whoosh",
  "transition",
  "heartbeat",
  "click",
  "upbeat",
];

export function SoundLibraryDrawer({
  isOpen,
  library,
  currentTime,
  previewPlayingPath,
  initialCategory = "all",
  onClose,
  onPlayPreview,
  onInsertSound,
}: SoundLibraryDrawerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);

  if (!isOpen) return null;

  const filtered = library.filter((item) => {
    const matchesCat = category === "all" || item.type === category;
    const matchesSearch =
      !search ||
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[440px] max-w-[92vw] h-full bg-surface/95 backdrop-blur-xl border-l border-outline-variant/15 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-geist text-sm font-bold text-white">
                Sound Design Library
              </h3>
              <p className="text-[10px] text-on-surface-variant font-mono">
                {library.length} studio audio assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Pills Controls */}
        <div className="p-4 space-y-3 border-b border-outline-variant/10 bg-surface-container-low">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-on-surface-variant pointer-events-none" />
            <input
              placeholder="Search FX, Foley, Stems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-sans text-xs py-2 pl-9 pr-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 transition-shadow border border-outline-variant/10"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[10px] px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  category === cat
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map((item, idx) => {
            const path = `assets/sfx/${item.folder}/${item.filename}`;
            const isPreviewing = previewPlayingPath === path;
            const intensityDots = Math.round(item.intensity * 5);

            return (
              <div
                key={idx}
                className="p-3 rounded-xl border border-outline-variant/10 bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onPlayPreview(path)}
                    className={`h-8 w-8 rounded-full flex-shrink-0 transition-all ${
                      isPreviewing
                        ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                        : "bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary"
                    }`}
                  >
                    {isPreviewing ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-[8px] font-mono uppercase px-1.5 py-0 bg-primary-container/20 text-primary">
                        {item.type}
                      </Badge>
                      <span className="text-[9px] font-mono text-on-surface-variant">
                        {item.duration}s
                      </span>
                      <span className="text-[9px] font-mono text-secondary font-bold">
                        {"●".repeat(intensityDots)}{"○".repeat(5 - intensityDots)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <WaveformVisualizer
                    seed={item.filename}
                    bars={12}
                    height={14}
                    barWidth={1.5}
                    gap={1}
                    color="#c0c1ff"
                    className="opacity-40 hidden sm:block"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onInsertSound(item)}
                    className="h-7 px-2.5 text-[10px] font-bold bg-surface-container-lowest border-outline-variant/20 hover:bg-primary hover:text-on-primary hover:border-primary text-on-surface transition-all flex-shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Insert
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer Info */}
        <div className="p-3 border-t border-outline-variant/10 bg-surface-container-low flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
          <span>Target playhead: {currentTime.toFixed(2)}s</span>
          <span className="text-primary font-bold">{filtered.length} assets available</span>
        </div>
      </div>
    </div>
  );
}
