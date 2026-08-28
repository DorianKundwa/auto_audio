"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Play, Zap, Volume2, Maximize, RotateCcw } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "Playback & Transport",
    items: [
      { key: "Space", desc: "Play / Pause playback" },
      { key: "← / →", desc: "Step 1 second backward / forward" },
      { key: "Shift + ← / →", desc: "Jump 5 seconds backward / forward" },
      { key: "0", desc: "Return to beginning (00:00.00)" },
    ],
  },
  {
    category: "Timeline & Editing",
    items: [
      { key: "L", desc: "Open Sound FX Library Drawer" },
      { key: "Delete / Backspace", desc: "Delete selected sound effect" },
      { key: "Ctrl + D / Cmd + D", desc: "Duplicate selected sound effect" },
      { key: "Drag Clip", desc: "Reposition sound effect along timeline" },
    ],
  },
  {
    category: "View & Studio",
    items: [
      { key: "F", desc: "Toggle Video Fullscreen" },
      { key: "M", desc: "Toggle Master Audio Mute" },
      { key: "?", desc: "Open this Keyboard Shortcuts cheat sheet" },
    ],
  },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#252528] border-[#3E3E42] text-[#CCCCCC] shadow-2xl p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <span>Studio Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#858585]">
            Master these keyboard shortcuts to accelerate your sound design workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {SHORTCUTS.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                {group.category}
              </span>
              <div className="space-y-1.5">
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#1E1E1E] border border-[#3E3E42] text-xs"
                  >
                    <span className="text-[#CCCCCC]">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#2D2D30] border border-[#3E3E42] font-mono text-[10px] font-bold text-white shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-[#3E3E42] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
