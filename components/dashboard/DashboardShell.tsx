"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardData, TimeHorizon, DeltaMode } from "@/lib/types";
import { mockAdapter } from "@/lib/adapters/mock";
import { GlobalFilters } from "./GlobalFilters";
import { MetricsTable } from "./MetricsTable";

interface DashboardShellProps {
  title?: string;
}

export function DashboardShell({ title = "dooze" }: DashboardShellProps) {
  // Data state
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("week");
  const [deltaMode, setDeltaMode] = useState<DeltaMode>("pct");
  const [product, setProduct] = useState("dooze");
  const [region, setRegion] = useState("global");

  // Expansion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  // Fetch data on mount and when time horizon changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const result = await mockAdapter.getMetrics(timeHorizon);
        if (!cancelled) {
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [timeHorizon]);

  // Toggle handlers
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const toggleMetric = useCallback((metricId: string) => {
    setExpandedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!data) return;
    const allCategoryIds = new Set(data.categories.map((c) => c.id));
    const allExpandableMetricIds = new Set(
      data.categories.flatMap((c) =>
        c.metrics.filter((m) => m.isExpandable).map((m) => m.id)
      )
    );
    setExpandedCategories(allCategoryIds);
    setExpandedMetrics(allExpandableMetricIds);
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
    setExpandedMetrics(new Set());
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-sm text-[var(--text-muted)]">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <GlobalFilters
        title={title}
        timeHorizon={timeHorizon}
        onTimeHorizonChange={setTimeHorizon}
        deltaMode={deltaMode}
        onDeltaModeChange={setDeltaMode}
        product={product}
        onProductChange={setProduct}
        region={region}
        onRegionChange={setRegion}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
      {/* Main content area with side padding so background shows on borders */}
      <main className="mx-auto max-w-[1800px] px-6 py-4">
        <MetricsTable
          data={data}
          deltaMode={deltaMode}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          expandedMetrics={expandedMetrics}
          onToggleMetric={toggleMetric}
        />
      </main>
    </div>
  );
}
