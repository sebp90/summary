"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricCategory as MetricCategoryType, DeltaMode, ColumnHeaders, TimeHorizon } from "@/lib/types";
import { MetricRow } from "./MetricRow";
import { ValueCell } from "./ValueCell";
import { Sparkline } from "./Sparkline";

interface MetricCategoryProps {
  category: MetricCategoryType;
  deltaMode: DeltaMode;
  headers: ColumnHeaders;
  timeHorizon: TimeHorizon;
  isExpanded: boolean;
  onToggle: () => void;
  expandedMetrics: Set<string>;
  onToggleMetric: (metricId: string) => void;
}

// Metrics where positive change is actually bad
const INVERTED_METRICS = new Set([
  "error-rate",
  "latency-p50",
  "latency-p95",
  "latency-p99",
  "churn-rate",
  "paid-to-free",
  "daily-spend",
  "monthly-spend",
  "spend-per-user",
]);

export function MetricCategory({
  category,
  deltaMode,
  headers,
  timeHorizon,
  isExpanded,
  onToggle,
  expandedMetrics,
  onToggleMetric,
}: MetricCategoryProps) {
  // Use the first metric as the preview when collapsed (will be first seen when expanded)
  const firstMetric = category.metrics[0];
  const shouldInvertFirst = firstMetric ? INVERTED_METRICS.has(firstMetric.id) : false;

  return (
    <div className="bg-white border-b border-[var(--border)]">
      {/* Category Header - shows first metric data when collapsed */}
      <div
        className="grid grid-cols-[minmax(180px,1fr)_140px_140px_minmax(420px,2fr)_140px] gap-6 items-center py-3 px-4 cursor-pointer transition-colors hover:bg-[var(--row-hover)]"
        onClick={onToggle}
      >
        {/* Category Name + First Metric Name (when collapsed) */}
        <div className="flex items-center gap-2">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-[var(--text-secondary)] transition-transform duration-150 shrink-0",
              isExpanded && "rotate-90"
            )}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold tracking-wide text-[var(--text-primary)]">
              {category.name}
            </span>
            {!isExpanded && firstMetric && (
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                {firstMetric.name}
              </span>
            )}
          </div>
        </div>

        {/* Show first metric values when collapsed */}
        {!isExpanded && firstMetric && (
          <>
            <ValueCell
              metricValue={firstMetric.lastPeriod}
              deltaMode={deltaMode}
              invertColors={shouldInvertFirst}
            />
            <ValueCell
              metricValue={firstMetric.periodToDate}
              deltaMode={deltaMode}
              invertColors={shouldInvertFirst}
            />
            <Sparkline
              data={firstMetric.sparkline}
              format={firstMetric.lastPeriod.format}
              timeHorizon={timeHorizon}
            />
            <ValueCell
              metricValue={firstMetric.rollingPeriod}
              deltaMode={deltaMode}
              invertColors={shouldInvertFirst}
            />
          </>
        )}

        {/* Empty cells when expanded (header is in MetricsTable) */}
        {isExpanded && (
          <>
            <div />
            <div />
            <div />
            <div />
          </>
        )}
      </div>

      {/* Metrics (when expanded) */}
      {isExpanded && (
        <div className="animate-expand">
          {category.metrics.map((metric, index) => {
            const shouldInvert = INVERTED_METRICS.has(metric.id);
            const isKeyMetric = index === 0; // First metric is the key metric
            return (
              <MetricRow
                key={metric.id}
                metric={metric}
                deltaMode={deltaMode}
                headers={headers}
                timeHorizon={timeHorizon}
                isExpanded={expandedMetrics.has(metric.id)}
                onToggle={() => onToggleMetric(metric.id)}
                invertColors={shouldInvert}
                isKeyMetric={isKeyMetric}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
