"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Metric, DeltaMode, ColumnHeaders } from "@/lib/types";
import { ValueCell } from "./ValueCell";
import { Sparkline } from "./Sparkline";

interface MetricRowProps {
  metric: Metric;
  deltaMode: DeltaMode;
  headers: ColumnHeaders;
  isExpanded?: boolean;
  onToggle?: () => void;
  invertColors?: boolean;
  isKeyMetric?: boolean;
}

export function MetricRow({
  metric,
  deltaMode,
  headers,
  isExpanded = false,
  onToggle,
  invertColors = false,
  isKeyMetric = false,
}: MetricRowProps) {
  const isChild = metric.level === "child";
  const isExpandable = metric.isExpandable && metric.children && metric.children.length > 0;

  return (
    <>
      {/* Main row */}
      <div
        className={cn(
          "relative grid grid-cols-[minmax(180px,1fr)_140px_140px_minmax(420px,2fr)_140px] gap-6 items-center py-2.5 px-4 border-b border-[var(--border)] transition-colors",
          "hover:bg-[var(--row-hover)]",
          isExpandable && "cursor-pointer",
          isChild && "pl-10"
        )}
        onClick={isExpandable ? onToggle : undefined}
      >
        {/* Key metric indicator bar */}
        {isKeyMetric && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--teal-primary)]" />
        )}

        {/* Metric Name */}
        <div className="flex items-center gap-2 min-w-0">
          {isExpandable && (
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform duration-150 shrink-0",
                isExpanded && "rotate-90"
              )}
            />
          )}
          {!isExpandable && !isChild && <div className="w-3.5 shrink-0" />}
          <div className="flex flex-col min-w-0">
            {metric.parentLabel && (
              <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">
                {metric.parentLabel}
              </span>
            )}
            <span
              className={cn(
                "text-sm truncate",
                isChild ? "text-[var(--text-secondary)]" : "font-medium text-[var(--text-primary)]"
              )}
            >
              {metric.name}
            </span>
          </div>
        </div>

        {/* Last Period */}
        <ValueCell
          metricValue={metric.lastPeriod}
          deltaMode={deltaMode}
          invertColors={invertColors}
        />

        {/* Period to Date */}
        <ValueCell
          metricValue={metric.periodToDate}
          deltaMode={deltaMode}
          invertColors={invertColors}
        />

        {/* Sparkline */}
        <Sparkline
          data={metric.sparkline}
          format={metric.lastPeriod.format}
        />

        {/* Rolling Period */}
        <ValueCell
          metricValue={metric.rollingPeriod}
          deltaMode={deltaMode}
          invertColors={invertColors}
        />
      </div>

      {/* Children (if expanded) */}
      {isExpanded && metric.children && (
        <div className="animate-expand">
          {metric.children.map((child) => (
            <MetricRow
              key={child.id}
              metric={child}
              deltaMode={deltaMode}
              headers={headers}
              invertColors={invertColors}
            />
          ))}
        </div>
      )}
    </>
  );
}
