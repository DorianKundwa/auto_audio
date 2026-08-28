"use client";

import { useState, useCallback, useRef } from "react";
import { apiUrl } from "@/app/lib/api";
import { SFXEvent } from "./useTimeline";

export interface MusicConfig {
  track_path: string;
  volume: number;
  mood: string;
}

export type ExportStage =
  | "idle"
  | "preparing"
  | "mixing"
  | "applying_sfx"
  | "rendering"
  | "completed"
  | "error";

export function useProjectExport(jobId: string) {
  const [stage, setStage] = useState<ExportStage>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string>("");
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startExport = useCallback(
    async (
      events: SFXEvent[],
      musicConfig: MusicConfig | null,
      musicEnabled: boolean,
      sfxEnabled: boolean
    ) => {
      if (!jobId) return;

      setStage("preparing");
      setProgress(10);
      setError("");
      setDownloadUrl(null);

      // Multi-stage visual progress updater
      let currentProg = 10;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      progressTimerRef.current = setInterval(() => {
        currentProg += Math.floor(Math.random() * 5) + 3;
        if (currentProg > 92) currentProg = 92;

        setProgress(currentProg);
        if (currentProg >= 25 && currentProg < 50) {
          setStage("mixing");
        } else if (currentProg >= 50 && currentProg < 75) {
          setStage("applying_sfx");
        } else if (currentProg >= 75) {
          setStage("rendering");
        }
      }, 600);

      try {
        const res = await fetch(apiUrl(`/api/export/${jobId}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sfx_events: sfxEnabled ? events : [],
            music_config: musicEnabled ? musicConfig : null,
            music_enabled: musicEnabled,
            sfx_enabled: sfxEnabled,
          }),
        });

        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: "Export failed" }));
          throw new Error(errData.detail || `Server returned HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const filename = `auto_audio_${jobId.slice(0, 8)}.mp4`;

        setDownloadUrl(url);
        setExportedFilename(filename);
        setProgress(100);
        setStage("completed");

        // Automatically trigger browser download
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err: unknown) {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        setStage("error");
        setProgress(0);
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [jobId]
  );

  const resetExport = useCallback(() => {
    setStage("idle");
    setProgress(0);
    setError("");
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  }, [downloadUrl]);

  return {
    stage,
    progress,
    error,
    downloadUrl,
    exportedFilename,
    startExport,
    resetExport,
  };
}
