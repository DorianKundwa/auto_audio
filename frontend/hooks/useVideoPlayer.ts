"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useVideoPlayer(videoDuration: number = 60) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(videoDuration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync duration if prop changes
  useEffect(() => {
    if (videoDuration > 0) {
      setDuration(videoDuration);
    }
  }, [videoDuration]);

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const seek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(duration || 60, time));
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  }, [duration]);

  const skip = useCallback((deltaSec: number) => {
    seek(currentTime + deltaSec);
  }, [currentTime, seek]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
      setIsMuted(clamped === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const target = containerRef.current || videoRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      target.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return {
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
  };
}
