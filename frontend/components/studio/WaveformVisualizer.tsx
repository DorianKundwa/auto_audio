"use client";

import React, { useMemo } from "react";

interface WaveformVisualizerProps {
  seed: string;
  bars?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
  activeColor?: string;
  progress?: number; // 0 to 1
  className?: string;
}

// Simple deterministic hash to generate stable pseudo-random floats [0.15, 1.0]
function getDeterministicBarHeights(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const heights: number[] = [];
  let prev = 0.5;

  for (let i = 0; i < count; i++) {
    // Linear congruential generator step
    hash = (hash * 9301 + 49297) % 233280;
    const rand = hash / 233280;

    // Create realistic natural audio peaks (correlated with neighboring bars)
    const val = Math.max(0.18, Math.min(1.0, prev * 0.4 + rand * 0.6));
    heights.push(val);
    prev = val;
  }

  return heights;
}

export function WaveformVisualizer({
  seed,
  bars = 28,
  height = 24,
  barWidth = 2,
  gap = 2,
  color = "rgba(255, 255, 255, 0.2)",
  activeColor = "rgba(99, 102, 241, 0.85)",
  progress = 0,
  className = "",
}: WaveformVisualizerProps) {
  const barHeights = useMemo(
    () => getDeterministicBarHeights(seed || "default", bars),
    [seed, bars]
  );

  const totalWidth = bars * barWidth + (bars - 1) * gap;

  return (
    <div
      className={`flex items-center select-none pointer-events-none ${className}`}
      style={{ height, width: totalWidth }}
    >
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {barHeights.map((h, idx) => {
          const barHeight = Math.max(3, h * height);
          const x = idx * (barWidth + gap);
          const y = (height - barHeight) / 2;
          const isActive = progress > 0 && idx / bars <= progress;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill={isActive ? activeColor : color}
              className="transition-colors duration-150"
            />
          );
        })}
      </svg>
    </div>
  );
}
