"use client";

import { cn } from "@/lib/utils";
import { DeltaMode, ValueFormat } from "@/lib/types";
import { calculateDelta, formatDelta } from "@/lib/format";

interface DeltaBadgeProps {
  value: number;
  previousValue: number;
  format: ValueFormat;
  deltaMode: DeltaMode;
  className?: string;
  /**
   * For metrics where positive change is bad (e.g., error rate, latency),
   * set this to true to invert the color logic
   */
  invertColors?: boolean;
}

export function DeltaBadge({
  value,
  previousValue,
  format,
  deltaMode,
  className,
  invertColors = false,
}: DeltaBadgeProps) {
  const delta = calculateDelta(value, previousValue, deltaMode);
  const formattedDelta = formatDelta(delta, deltaMode, format);
  const isPositive = delta >= 0;

  // Determine if this change is "good" (green) or "bad" (red)
  const isGood = invertColors ? !isPositive : isPositive;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs tabular-nums",
        isGood ? "text-[var(--positive)]" : "text-[var(--negative)]",
        className
      )}
    >
      <span>{formattedDelta}</span>
      <span className="text-[10px]">{isPositive ? "↑" : "↓"}</span>
    </span>
  );
}
