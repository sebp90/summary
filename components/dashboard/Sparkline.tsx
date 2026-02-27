"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
} from "recharts";
import { SparklineData, ValueFormat, TimeHorizon } from "@/lib/types";
import { formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: SparklineData;
  format: ValueFormat;
  timeHorizon?: TimeHorizon;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    payload: {
      date: string;
      value: number;
      comparison: number;
    };
  }>;
  label?: string;
  format: ValueFormat;
}

// Custom tooltip component
function CustomTooltip({ active, payload, format }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const currentValue = payload.find((p) => p.dataKey === "value")?.value;
  const comparisonValue = payload.find((p) => p.dataKey === "comparison")?.value;

  // Get the date from the payload
  const dateStr = payload[0]?.payload?.date;

  // Format the date label - handles both ISO datetime and date-only strings
  const formatDateLabel = (dateStr: string) => {
    // Check if it's an ISO datetime string (contains 'T')
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${month}/${day} ${hour12}${ampm}`;
    }
    // Date-only string (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${month}/${day}`;
  };

  return (
    <div className="rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 shadow-sm">
      <div className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">
        {dateStr ? formatDateLabel(dateStr) : ""}
      </div>
      {/* Previous first */}
      {comparisonValue !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-1.5 w-1.5 rounded-full border border-[var(--comparison)] bg-transparent" />
          <span className="text-[var(--text-muted)] font-mono tabular-nums">
            {formatValue(comparisonValue, format)}
          </span>
        </div>
      )}
      {/* Current second */}
      {currentValue !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal-primary)]" />
          <span className="text-[var(--text-primary)] font-mono tabular-nums">
            {formatValue(currentValue, format)}
          </span>
        </div>
      )}
    </div>
  );
}

export function Sparkline({ data, format, timeHorizon = "week", className }: SparklineProps) {
  const { data: chartData, min, max } = data;

  // Show dots for day/week/month (few data points), hide for hour (many data points)
  const showDots = timeHorizon !== "hour";

  // Format min/max for display
  const formattedMin = formatValue(min, format);
  const formattedMax = formatValue(max, format);

  return (
    <div className={cn("flex items-center", className)}>
      {/* Y-axis labels */}
      <div className="flex h-10 w-12 shrink-0 flex-col justify-between text-right font-mono text-[9px] text-[var(--text-muted)] tabular-nums pr-2">
        <span>{formattedMax}</span>
        <span>{formattedMin}</span>
      </div>

      {/* Chart */}
      <div className="h-10 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[min, max]} hide />
            <Tooltip
              content={({ active, payload }) => (
                <CustomTooltip
                  active={active}
                  payload={payload as CustomTooltipProps["payload"]}
                  format={format}
                />
              )}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            {/* Comparison line (previous period) - always shown, dashed gray */}
            <Line
              type="monotone"
              dataKey="comparison"
              stroke="var(--comparison)"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
            {/* Current period line - teal, dots only for week/month */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--teal-primary)"
              strokeWidth={1.5}
              dot={showDots ? {
                r: 2.5,
                fill: "var(--teal-primary)",
                strokeWidth: 0,
              } : false}
              activeDot={{
                r: 3.5,
                fill: "var(--teal-primary)",
                strokeWidth: 2,
                stroke: "white",
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
