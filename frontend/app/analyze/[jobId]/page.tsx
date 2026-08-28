"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiUrl } from "@/app/lib/api";

// Hooks
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useTimeline, SFXEvent, AnalyzedSegment } from "@/hooks/useTimeline";
import { useSoundPreview } from "@/hooks/useSoundPreview";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProjectExport, MusicConfig } from "@/hooks/useProjectExport";

// Studio Components
import { StudioHeader } from "@/components/studio/StudioHeader";
import { VideoPreview } from "@/components/studio/VideoPreview";
import { TransportControls } from "@/components/studio/TransportControls";
import { Timeline } from "@/components/studio/Timeline";
import { Inspector } from "@/components/studio/Inspector";
import { SoundLibraryDrawer, SFXLibraryItem } from "@/components/studio/SoundLibraryDrawer";
import { ExportDialog } from "@/components/studio/ExportDialog";
import { ToastContainer, ToastItem } from "@/components/studio/Toast";

interface TimelineResult {
  job_id: string;
  video_duration: number;
  sfx_events: SFXEvent[];
  music_config: MusicConfig;
  analyzed_segments: AnalyzedSegment[];
}

export default function StudioPage() {
  const router = useRouter();
  const routeParams = useParams();
  const jobId = typeof routeParams?.jobId === "string" ? routeParams.jobId : "";

  // Data states
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [musicConfig, setMusicConfig] = useState<MusicConfig | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [library, setLibrary] = useState<SFXLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Drawers
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryCategory, setLibraryCategory] = useState("all");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hook 1: Video Player
  const {
    videoRef,
    containerRef,
    currentTime,
    duration,
    isPlaying,
    volume,
    isMuted,
    playbackRate,
    isFullscreen,
    handleTimeUpdate,
    handleLoadedMetadata,
    play,
    pause,
    togglePlay,
    seek,
    skip,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
  } = useVideoPlayer(timeline?.video_duration || 60);

  // Hook 2: Timeline Engine
  const {
    events,
    selectedEventId,
    zoom,
    snapEnabled,
    setSelectedEventId,
    setZoom,
    setSnapEnabled,
    setTimelineEvents,
    updateEvent,
    deleteEvent,
    addEvent,
    duplicateEvent,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  } = useTimeline(
    timeline?.sfx_events || [],
    duration,
    timeline?.analyzed_segments || []
  );

  // Hook 3: Sound Preview Singleton
  const {
    playingPath: previewPlayingPath,
    togglePreview: playAudioPreview,
    stopPreview,
  } = useSoundPreview();

  // Hook 4: Export Engine
  const {
    stage: exportStage,
    progress: exportProgress,
    error: exportError,
    downloadUrl,
    startExport,
    resetExport,
  } = useProjectExport(jobId);

  // Load project timeline
  useEffect(() => {
    if (!jobId) return;
    fetch(apiUrl(`/api/analyze/${jobId}`))
      .then((r) => {
        if (!r.ok) throw new Error("Timeline analysis not found");
        return r.json();
      })
      .then((data: TimelineResult) => {
        setTimeline(data);
        setTimelineEvents(data.sfx_events);
        setMusicConfig(data.music_config);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [jobId, setTimelineEvents]);

  // Load sound library
  useEffect(() => {
    fetch(apiUrl("/api/library/sfx"))
      .then((r) => r.ok && r.json())
      .then((data) => data && setLibrary(data))
      .catch(() => {});
  }, []);

  // Hook 5: Keyboard Shortcuts
  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onSeekBackward: (d) => skip(-d),
    onSeekForward: (d) => skip(d),
    onToggleLibrary: () => setIsLibraryOpen((o) => !o),
    onDeleteSelected: () => {
      if (selectedEventId) {
        deleteEvent(selectedEventId);
        showToast("Sound effect deleted", "info");
      }
    },
    onDuplicateSelected: () => {
      if (selectedEventId) {
        duplicateEvent(selectedEventId);
        showToast("Sound effect duplicated", "success");
      }
    },
  });

  // Sound Library Insert Handler
  const handleInsertSound = (item: SFXLibraryItem) => {
    const path = `assets/sfx/${item.folder}/${item.filename}`;
    const newEvent: SFXEvent = {
      id: "sfx-" + Math.random().toString(36).substr(2, 9),
      timestamp: parseFloat(currentTime.toFixed(2)),
      tag: item.type.toUpperCase(),
      sfx_type: item.type,
      sfx_path: path,
      volume: 0.65,
      label: item.type.toUpperCase(),
      text_snippet: `Custom placement: ${item.filename.slice(0, 24)}`,
    };

    addEvent(newEvent);
    playAudioPreview(path);
    showToast(`Added ${item.type.toUpperCase()} at ${currentTime.toFixed(2)}s`);
  };

  const handleOpenLibraryForReplace = (cat: string) => {
    setLibraryCategory(cat);
    setIsLibraryOpen(true);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#08090f] text-slate-400">
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p className="text-sm font-medium">Opening Audio Studio Workspace...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#08090f] text-slate-100 select-none">
      {/* ── Studio Top Toolbar ── */}
      <StudioHeader
        jobId={jobId}
        sfxCount={events.length}
        segmentsCount={timeline?.analyzed_segments.length || 0}
        musicEnabled={musicEnabled}
        sfxEnabled={sfxEnabled}
        onToggleMusic={setMusicEnabled}
        onToggleSFX={setSfxEnabled}
        onOpenLibrary={() => {
          setLibraryCategory("all");
          setIsLibraryOpen(true);
        }}
        onOpenExport={() => setIsExportDialogOpen(true)}
        isExporting={exportStage !== "idle" && exportStage !== "completed" && exportStage !== "error"}
      />

      {/* ── Studio Center Work Area: Video Preview + Inspector ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left 7 Columns: Video Player */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <VideoPreview
            videoRef={videoRef}
            containerRef={containerRef}
            src={apiUrl(`/uploads/${jobId}/video.mp4`)}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            volume={volume}
            isMuted={isMuted}
            playbackRate={playbackRate}
            isFullscreen={isFullscreen}
            sfxCount={events.length}
            activeMood={musicConfig?.mood || ""}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onTogglePlay={togglePlay}
            onSeek={seek}
            onSkip={skip}
            onSetVolume={setVolume}
            onToggleMute={toggleMute}
            onSetPlaybackRate={setPlaybackRate}
            onToggleFullscreen={toggleFullscreen}
          />
        </div>

        {/* Right 5 Columns: Inspector Panel */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden max-h-[500px]">
          <Inspector
            selectedEvent={selectedEvent}
            musicConfig={musicConfig}
            analyzedSegments={timeline?.analyzed_segments || []}
            currentTime={currentTime}
            videoDuration={duration}
            previewPlayingPath={previewPlayingPath}
            onUpdateEvent={updateEvent}
            onDeleteEvent={(id) => {
              deleteEvent(id);
              showToast("Sound effect deleted", "info");
            }}
            onDuplicateEvent={(id) => {
              duplicateEvent(id);
              showToast("Sound effect duplicated", "success");
            }}
            onPlayAudioPreview={playAudioPreview}
            onOpenLibraryForReplace={handleOpenLibraryForReplace}
            onUpdateMusicConfig={(updates) =>
              setMusicConfig((m) => (m ? { ...m, ...updates } : m))
            }
            onSeek={seek}
          />
        </div>
      </div>

      {/* ── Transport Controls Bar ── */}
      <div className="px-6 pb-2">
        <TransportControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          zoom={zoom}
          snapEnabled={snapEnabled}
          onTogglePlay={togglePlay}
          onResetTime={() => seek(0)}
          onSetZoom={setZoom}
          onToggleSnap={() => setSnapEnabled((s) => !s)}
        />
      </div>

      {/* ── Bottom DAW Multi-Track Timeline ── */}
      <div className="px-6 pb-6">
        <Timeline
          events={events}
          analyzedSegments={timeline?.analyzed_segments || []}
          musicConfig={musicConfig}
          musicEnabled={musicEnabled}
          sfxEnabled={sfxEnabled}
          videoDuration={duration}
          currentTime={currentTime}
          zoom={zoom}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          onDeleteEvent={(id) => {
            deleteEvent(id);
            showToast("Sound effect deleted", "info");
          }}
          onSeek={seek}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* ── Slide-Out Sound Library Drawer ── */}
      <SoundLibraryDrawer
        isOpen={isLibraryOpen}
        library={library}
        currentTime={currentTime}
        previewPlayingPath={previewPlayingPath}
        initialCategory={libraryCategory}
        onClose={() => setIsLibraryOpen(false)}
        onPlayPreview={playAudioPreview}
        onInsertSound={handleInsertSound}
      />

      {/* ── Export Video Dialog Modal ── */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        stage={exportStage}
        progress={exportProgress}
        error={exportError}
        downloadUrl={downloadUrl}
        videoDuration={duration}
        sfxCount={events.length}
        musicMood={musicConfig?.mood || ""}
        onClose={() => {
          setIsExportDialogOpen(false);
          resetExport();
        }}
        onStartExport={() =>
          startExport(events, musicConfig, musicEnabled, sfxEnabled)
        }
      />

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
