"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onTogglePlay: () => void;
  onSeekBackward: (delta: number) => void;
  onSeekForward: (delta: number) => void;
  onToggleLibrary: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected?: () => void;
  onToggleShortcuts?: () => void;
  onToggleMute?: () => void;
  onToggleFullscreen?: () => void;
  onResetTime?: () => void;
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onSeekBackward,
  onSeekForward,
  onToggleLibrary,
  onDeleteSelected,
  onDuplicateSelected,
  onToggleShortcuts,
  onToggleMute,
  onToggleFullscreen,
  onResetTime,
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
      } else if (e.code === "KeyD" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onDuplicateSelected?.();
      } else if (e.key === "?" || (e.code === "Slash" && e.shiftKey)) {
        e.preventDefault();
        onToggleShortcuts?.();
      } else if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onToggleMute?.();
      } else if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onToggleFullscreen?.();
      } else if (e.code === "Digit0") {
        e.preventDefault();
        onResetTime?.();
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
    onToggleShortcuts,
    onToggleMute,
    onToggleFullscreen,
    onResetTime,
  ]);
}
