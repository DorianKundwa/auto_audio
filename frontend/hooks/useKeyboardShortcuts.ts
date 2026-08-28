"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onTogglePlay: () => void;
  onSeekBackward: (delta: number) => void;
  onSeekForward: (delta: number) => void;
  onToggleLibrary: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected?: () => void;
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onSeekBackward,
  onSeekForward,
  onToggleLibrary,
  onDeleteSelected,
  onDuplicateSelected,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input, textarea or contenteditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        onSeekBackward(e.shiftKey ? 5 : 1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        onSeekForward(e.shiftKey ? 5 : 1);
      } else if (e.code === "KeyL") {
        e.preventDefault();
        onToggleLibrary();
      } else if (e.code === "Delete" || e.code === "Backspace") {
        e.preventDefault();
        onDeleteSelected();
      } else if (e.code === "KeyS" && (e.ctrlKey || e.metaKey)) {
        // Prevent default save
        e.preventDefault();
        onDuplicateSelected?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onTogglePlay,
    onSeekBackward,
    onSeekForward,
    onToggleLibrary,
    onDeleteSelected,
    onDuplicateSelected,
  ]);
}
