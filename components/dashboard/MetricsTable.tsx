"use client";

import { DashboardData, DeltaMode, TIME_HORIZON_HEADERS, getDateRanges, getChartDates } from "@/lib/types";
import { MetricCategory } from "./MetricCategory";

interface MetricsTableProps {
  data: DashboardData;
  deltaMode: DeltaMode;
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  expandedMetrics: Set<string>;
  onToggleMetric: (metricId: string) => void;
}

export function MetricsTable({
  data,
  deltaMode,
  expandedCategories,
  onToggleCategory,
  expandedMetrics,
  onToggleMetric,
}: MetricsTableProps) {
  const headers = TIME_HORIZON_HEADERS[data.filters.timeHorizon];
  const dateRanges = getDateRanges(data.filters.timeHorizon);
  const chartDates = getChartDates(data.filters.timeHorizon);

  return (
    <div className="flex flex-col">
      {/* Sticky Column Headers */}
      <div className="sticky top-14 z-[5] grid grid-cols-[minmax(180px,1fr)_140px_140px_minmax(420px,2fr)_140px] gap-6 items-end py-3 px-4 bg-[var(--background)] border-b border-[var(--border)]">
        {/* Empty cell for category/metric name column */}
        <div />

        {/* Last Period - right aligned */}
        <div className="flex flex-col items-end text-right">
          <span className="text-[11px] font-medium text-[var(--text-primary)]">
            {headers.lastPeriod}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {dateRanges.lastPeriod}
          </span>
        </div>

        {/* Period to Date - right aligned */}
        <div className="flex flex-col items-end text-right">
          <span className="text-[11px] font-medium text-[var(--text-primary)]">
            {headers.periodToDate}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {dateRanges.periodToDate}
          </span>
        </div>

        {/* Trend column - legend above, then dates */}
        <div className="flex flex-col gap-1">
          {/* Legend row - Previous first, then Current */}
          <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full border border-[var(--comparison)] bg-transparent" />
              <span className="text-[10px] text-[var(--text-muted)]">Previous</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal-primary)]" />
              <span className="text-[10px] text-[var(--text-muted)]">Current</span>
            </div>
          </div>
          {/* Dates row */}
          <div className="flex items-center">
            {/* Spacer for Y-axis area */}
            <div className="w-12 shrink-0" />
            {/* Chart dates */}
            <div className="flex justify-between flex-1 px-1">
              {chartDates.map((date, index) => (
                <span
                  key={index}
                  className="text-[10px] text-[var(--text-muted)] font-mono tabular-nums"
                >
                  {date}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rolling Period - right aligned */}
        <div className="flex flex-col items-end text-right">
          <span className="text-[11px] font-medium text-[var(--text-primary)]">
            {headers.rollingPeriod}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {dateRanges.rollingPeriod}
          </span>
        </div>
      </div>

      {/* Categories */}
      {data.categories.map((category) => (
        <MetricCategory
          key={category.id}
          category={category}
          deltaMode={deltaMode}
          headers={headers}
          timeHorizon={data.filters.timeHorizon}
          isExpanded={expandedCategories.has(category.id)}
          onToggle={() => onToggleCategory(category.id)}
          expandedMetrics={expandedMetrics}
          onToggleMetric={onToggleMetric}
        />
      ))}
    </div>
  );
}
