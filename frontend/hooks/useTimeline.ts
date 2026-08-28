"use client";

import { useState, useCallback, useRef } from "react";

export interface SFXEvent {
  id: string;
  timestamp: number;
  tag: string;
  sfx_type: string;
  sfx_path: string;
  volume: number;
  label: string;
  text_snippet: string;
}

export interface AnalyzedSegment {
  id: number;
  start_sec: number;
  end_sec: number;
  text: string;
  tag: string;
  confidence: number;
}

export function useTimeline(
  initialEvents: SFXEvent[],
  videoDuration: number,
  narrationSegments: AnalyzedSegment[] = []
) {
  const [events, setEvents] = useState<SFXEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents.length > 0 ? initialEvents[0].id : null
  );
  const [zoom, setZoom] = useState<number>(1);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);

  // Dragging state ref to prevent stale closures
  const draggingRef = useRef<{
    clipId: string;
    startX: number;
    initialTimestamp: number;
    timelineWidth: number;
  } | null>(null);

  // Sync initial events
  const setTimelineEvents = useCallback((evs: SFXEvent[]) => {
    setEvents(evs);
    if (evs.length > 0 && !selectedEventId) {
      setSelectedEventId(evs[0].id);
    }
  }, [selectedEventId]);

  // Update single event
  const updateEvent = useCallback((id: string, updates: Partial<SFXEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  // Delete event
  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const remaining = prev.filter((e) => e.id !== id);
      if (selectedEventId === id) {
        setSelectedEventId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  }, [selectedEventId]);

  // Add event
  const addEvent = useCallback((newEvent: SFXEvent) => {
    setEvents((prev) => {
      const updated = [...prev, newEvent].sort((a, b) => a.timestamp - b.timestamp);
      return updated;
    });
    setSelectedEventId(newEvent.id);
  }, []);

  // Duplicate event (+1.0s or closest space)
  const duplicateEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const target = prev.find((e) => e.id === id);
      if (!target) return prev;

      const newTimestamp = Math.min(
        videoDuration,
        parseFloat((target.timestamp + 1.0).toFixed(2))
      );

      const duplicated: SFXEvent = {
        ...target,
        id: "sfx-" + Math.random().toString(36).substr(2, 9),
        timestamp: newTimestamp,
      };

      const next = [...prev, duplicated].sort((a, b) => a.timestamp - b.timestamp);
      setSelectedEventId(duplicated.id);
      return next;
    });
  }, [videoDuration]);

  // Calculate snap target
  const findSnapTarget = useCallback(
    (rawTime: number, snapThresholdSec: number = 0.3): number => {
      if (!snapEnabled || narrationSegments.length === 0) return rawTime;

      let closest = rawTime;
      let minDiff = snapThresholdSec;

      for (const seg of narrationSegments) {
        const diffStart = Math.abs(seg.start_sec - rawTime);
        if (diffStart < minDiff) {
          minDiff = diffStart;
          closest = seg.start_sec;
        }
        const diffEnd = Math.abs(seg.end_sec - rawTime);
        if (diffEnd < minDiff) {
          minDiff = diffEnd;
          closest = seg.end_sec;
        }
      }
      return closest;
    },
    [snapEnabled, narrationSegments]
  );

  // Drag start
  const handleDragStart = useCallback(
    (clipId: string, clientX: number, timelineWidth: number) => {
      const ev = events.find((e) => e.id === clipId);
      if (!ev || timelineWidth <= 0) return;

      setSelectedEventId(clipId);
      draggingRef.current = {
        clipId,
        startX: clientX,
        initialTimestamp: ev.timestamp,
        timelineWidth,
      };
    },
    [events]
  );

  // Drag move
  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!draggingRef.current) return;
      const { clipId, startX, initialTimestamp, timelineWidth } = draggingRef.current;

      const deltaX = clientX - startX;
      const deltaSec = (deltaX / timelineWidth) * videoDuration;
      let rawTime = initialTimestamp + deltaSec;

      // Apply boundary guard [0, videoDuration]
      rawTime = Math.max(0, Math.min(videoDuration, rawTime));

      // Apply snapping if active
      const finalTime = parseFloat(findSnapTarget(rawTime).toFixed(2));

      updateEvent(clipId, { timestamp: finalTime });
    },
    [videoDuration, findSnapTarget, updateEvent]
  );

  // Drag end
  const handleDragEnd = useCallback(() => {
    draggingRef.current = null;
    // Re-sort events by timestamp after drag
    setEvents((prev) => [...prev].sort((a, b) => a.timestamp - b.timestamp));
  }, []);

  return {
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
  };
}
