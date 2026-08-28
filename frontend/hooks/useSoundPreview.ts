"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { apiUrl } from "@/app/lib/api";

function toWebAssetUrl(localPath: string): string {
  if (!localPath) return "";
  const normalized = localPath.replace(/\\/g, "/");
  const idx = normalized.indexOf("assets/");
  if (idx !== -1) {
    return apiUrl("/" + normalized.slice(idx));
  }
  return apiUrl(localPath);
}

export function useSoundPreview() {
  const [playingPath, setPlayingPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop & cleanup audio
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingPath(null);
    setIsPlaying(false);
  }, []);

  // Toggle or play preview
  const togglePreview = useCallback((path: string) => {
    const url = toWebAssetUrl(path);
    if (!url) return;

    // If already playing this path, stop
    if (audioRef.current && playingPath === path && !audioRef.current.paused) {
      stopPreview();
      return;
    }

    // Stop any existing playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingPath(path);
      setIsPlaying(true);

      audio.onended = () => {
        setPlayingPath(null);
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingPath(null);
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.play().catch(() => {
        setPlayingPath(null);
        setIsPlaying(false);
        audioRef.current = null;
      });
    } catch {
      setPlayingPath(null);
      setIsPlaying(false);
    }
  }, [playingPath, stopPreview]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return {
    playingPath,
    isPlaying,
    togglePreview,
    stopPreview,
  };
}
