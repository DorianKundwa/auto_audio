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
      <div className="w-[440px] max-w-[92vw] h-full bg-[#1E1E1E] border-l border-[#3E3E42] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#3E3E42] flex items-center justify-between bg-[#252528]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Sound Design Library
              </h3>
              <p className="text-[10px] text-[#858585] font-mono">
                {library.length} studio audio assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#858585] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 space-y-3 border-b border-[#3E3E42] bg-[#252528]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#858585] pointer-events-none" />
            <Input
              placeholder="Search audio effects (e.g. cinematic, boom, snap)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs bg-[#1E1E1E] border-[#3E3E42] text-[#CCCCCC]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  category === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-[#1E1E1E] text-[#858585] hover:text-[#CCCCCC] hover:bg-[#38383C]"
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

            return (
              <div
                key={idx}
                className="p-3 rounded-lg border border-[#3E3E42] bg-[#2D2D30] hover:bg-[#38383C] transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onPlayPreview(path)}
                    className={`h-8 w-8 rounded-lg flex-shrink-0 transition-colors ${
                      isPreviewing
                        ? "bg-indigo-600 text-white"
                        : "bg-[#1E1E1E] text-indigo-300 hover:text-white hover:bg-indigo-600"
                    }`}
                  >
                    {isPreviewing ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-semibold text-[#E0E0E0] truncate group-hover:text-white">
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-[9px] font-mono uppercase px-1.5 py-0">
                        {item.type}
                      </Badge>
                      <span className="text-[9px] font-mono text-[#858585]">
                        {item.duration}s
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInsertSound(item)}
                  className="h-7 px-2.5 text-[10px] font-bold bg-[#1E1E1E] border-[#3E3E42] hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-[#CCCCCC] transition-all flex-shrink-0"
                >
                  <Plus className="w-3 h-3 mr-1" /> Insert
                </Button>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer Info */}
        <div className="p-3 border-t border-[#3E3E42] bg-[#252528] flex items-center justify-between text-[11px] font-mono text-[#858585]">
          <span>Target playhead: {currentTime.toFixed(2)}s</span>
          <span className="text-indigo-400 font-bold">{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}
