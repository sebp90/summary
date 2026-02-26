"use client";

import { cn } from "@/lib/utils";
import { DeltaMode, MetricValue } from "@/lib/types";
import { formatValue } from "@/lib/format";
import { DeltaBadge } from "./DeltaBadge";

interface ValueCellProps {
  metricValue: MetricValue;
  deltaMode: DeltaMode;
  className?: string;
  invertColors?: boolean;
}

export function ValueCell({
  metricValue,
  deltaMode,
  className,
  invertColors = false,
}: ValueCellProps) {
  const { value, previousValue, format } = metricValue;
  const formattedValue = formatValue(value, format);

  return (
    <div className={cn("flex items-baseline justify-end gap-2", className)}>
      <span className="font-mono text-sm font-medium tabular-nums text-[var(--text-primary)]">
        {formattedValue}
      </span>
      <DeltaBadge
        value={value}
        previousValue={previousValue}
        format={format}
        deltaMode={deltaMode}
        invertColors={invertColors}
      />
    </div>
  );
}
