/**
 * Dooze API adapter — fetches real metrics from the Dooze API backend.
 *
 * Transforms the API's flat metric format (current_value / previous_value / sparkline)
 * into the dashboard's richer format (lastPeriod / periodToDate / rollingPeriod / SparklineData).
 */

import { MetricsAdapter } from "./types";
import {
  DashboardData,
  TimeHorizon,
  Metric,
  MetricCategory,
  SparklineData,
  ValueFormat,
} from "../types";

// ---------- API response types ----------

interface APIMetricPoint {
  value: number;
  label: string;
}

interface APIMetricData {
  name: string;
  current_value: number;
  previous_value: number;
  change_percent: number | null;
  sparkline: APIMetricPoint[];
  unit: string;
  is_hero: boolean;
  description: string | null;
}

interface APIMetricCategory {
  name: string;
  metrics: APIMetricData[];
}

interface APIDashboardData {
  categories: APIMetricCategory[];
  time_horizon: string;
  generated_at: string;
  data_through: string;
}

interface APIAppUsageEntry {
  app_name: string;
  bundle_id: string | null;
  domain: string | null;
  total_duration_ms: number;
  session_count: number;
  unique_users: number;
}

interface APIAppUsageResponse {
  apps: APIAppUsageEntry[];
  period_start: string;
  period_end: string;
}

// ---------- Helpers ----------

function unitToFormat(unit: string): ValueFormat {
  switch (unit) {
    case "$":
      return "currency";
    case "%":
      return "percent";
    case "ms":
      return "milliseconds";
    case "s":
      return "milliseconds";
    default:
      return "number";
  }
}

function transformSparkline(
  points: APIMetricPoint[],
  previousValue: number,
  currentValue: number
): SparklineData {
  if (!points.length) {
    return { data: [], min: 0, max: 0 };
  }

  const ratio = previousValue && currentValue ? previousValue / currentValue : 0.9;

  const data = points.map((p) => ({
    date: p.label,
    value: p.value,
    comparison: Math.round(p.value * ratio * 100) / 100,
  }));

  const allValues = [...data.map((d) => d.value), ...data.map((d) => d.comparison)];
  return { data, min: Math.min(...allValues), max: Math.max(...allValues) };
}

// ---------- Category mapping (10 product-oriented categories) ----------

interface MetricDef {
  id: string;
  apiName: string;
  displayName: string;
}

interface CategoryDef {
  id: string;
  name: string;
  heroMetricId: string;
  metrics: (MetricDef | { parent: MetricDef; children: MetricDef[] })[];
}

const CATEGORY_DEFS: CategoryDef[] = [
  {
    id: "growth",
    name: "GROWTH",
    heroMetricId: "signups",
    metrics: [
      { id: "downloads", apiName: "Downloads", displayName: "Downloads" },
      { id: "installs", apiName: "Installs", displayName: "Installs" },
      { id: "signups", apiName: "Sign Ups", displayName: "Sign Ups" },
      { id: "activations", apiName: "Activations", displayName: "Activations" },
      { id: "upgrades", apiName: "Upgrades", displayName: "Upgrades" },
      { id: "onboarding-completions", apiName: "Onboarding Completions", displayName: "Onboarding Completions" },
      { id: "icon-active-users", apiName: "Icon Active Users", displayName: "Icon Active Users" },
      { id: "extension-active-users", apiName: "Extension Active Users", displayName: "Extension Active Users" },
    ],
  },
  {
    id: "engagement",
    name: "ENGAGEMENT",
    heroMetricId: "panel-open-users",
    metrics: [
      { id: "engagement-signups", apiName: "Sign Ups", displayName: "Sign Ups" },
      { id: "panel-open-users", apiName: "Panel Open Users", displayName: "Panel Open Users" },
      { id: "dau", apiName: "DAU", displayName: "Daily Active Users" },
      { id: "wau", apiName: "WAU", displayName: "Weekly Active Users" },
      { id: "mau", apiName: "MAU", displayName: "Monthly Active Users" },
      { id: "avg-panel-time", apiName: "Avg Panel Time per User", displayName: "Avg Panel Time per User" },
    ],
  },
  {
    id: "interactions",
    name: "INTERACTIONS",
    heroMetricId: "total-queries",
    metrics: [
      {
        parent: { id: "total-queries", apiName: "Total Queries", displayName: "Total Queries" },
        children: [
          { id: "voice-transcription", apiName: "Voice Transcription Queries", displayName: "Voice Transcription" },
          { id: "voice-to-dooze", apiName: "Voice to Dooze Queries", displayName: "Voice to Dooze" },
          { id: "ask-ai", apiName: "Ask AI", displayName: "Ask AI" },
          { id: "polish", apiName: "Polish", displayName: "Polish" },
          { id: "summarize", apiName: "Summarize", displayName: "Summarize" },
        ],
      },
      { id: "avg-queries-panel-user", apiName: "Avg Queries per Panel User", displayName: "Avg Queries per Panel User" },
      { id: "avg-queries-repeat-user", apiName: "Avg Queries per Repeat User", displayName: "Avg Queries per Repeat User" },
    ],
  },
  {
    id: "activation-retention",
    name: "ACTIVATION & RETENTION",
    heroMetricId: "pct-activated-24h",
    metrics: [
      { id: "median-ttfa", apiName: "Median Time to First Action", displayName: "Median Time to First Action" },
      { id: "pct-activated-24h", apiName: "% Activated (24h)", displayName: "% Activated (24h)" },
      { id: "d1-retention", apiName: "D1 Retention", displayName: "D1 Retention" },
      { id: "d7-retention", apiName: "D7 Retention", displayName: "D7 Retention" },
    ],
  },
  {
    id: "signals",
    name: "SIGNALS",
    heroMetricId: "negative-signals",
    metrics: [
      { id: "negative-signals", apiName: "Negative Signals", displayName: "Negative Signals" },
      { id: "positive-signals", apiName: "Positive Signals", displayName: "Positive Signals" },
      { id: "snooze-count", apiName: "Snooze Count", displayName: "Snooze Count" },
    ],
  },
  {
    id: "performance",
    name: "PERFORMANCE",
    heroMetricId: "error-rate",
    metrics: [
      { id: "avg-latency", apiName: "Avg Client Latency", displayName: "Avg Client Latency" },
      { id: "p90-latency", apiName: "P90 Client Latency", displayName: "P90 Client Latency" },
      { id: "p99-latency", apiName: "P99 Client Latency", displayName: "P99 Client Latency" },
      { id: "error-rate", apiName: "Error Rate", displayName: "Error Rate" },
      { id: "failed-calls", apiName: "Failed Calls", displayName: "Failed Calls" },
      { id: "total-calls", apiName: "Total Calls", displayName: "Total Calls" },
      { id: "ask-ai-error-rate", apiName: "Ask AI Error Rate", displayName: "Ask AI Error Rate" },
      { id: "polish-error-rate", apiName: "Polish Error Rate", displayName: "Polish Error Rate" },
      { id: "summarize-error-rate", apiName: "Summarize Error Rate", displayName: "Summarize Error Rate" },
      { id: "ask-ai-failed", apiName: "Ask AI Failed", displayName: "Ask AI Failed" },
      { id: "polish-failed", apiName: "Polish Failed", displayName: "Polish Failed" },
      { id: "summarize-failed", apiName: "Summarize Failed", displayName: "Summarize Failed" },
    ],
  },
  {
    id: "revenue",
    name: "REVENUE",
    heroMetricId: "mrr",
    metrics: [
      { id: "mrr", apiName: "MRR", displayName: "MRR" },
      { id: "active-subscriptions", apiName: "Active Subscriptions", displayName: "Active Subscriptions" },
      { id: "cancellations", apiName: "Cancellations", displayName: "Cancellations" },
      { id: "payment-failures", apiName: "Payment Failures", displayName: "Payment Failures" },
    ],
  },
  {
    id: "spend",
    name: "SPEND",
    heroMetricId: "api-spend",
    metrics: [
      { id: "api-spend", apiName: "API Spend", displayName: "API Spend" },
      { id: "cost-per-user", apiName: "Cost per User", displayName: "Cost per User" },
    ],
  },
  {
    id: "users",
    name: "USERS",
    heroMetricId: "starter-users",
    metrics: [
      { id: "starter-users", apiName: "Starter Users", displayName: "Starter Users" },
      { id: "lite-users", apiName: "Lite Users", displayName: "Lite Users" },
      { id: "heavy-users", apiName: "Heavy Users", displayName: "Heavy Users" },
    ],
  },
  {
    id: "billing-health",
    name: "BILLING HEALTH",
    heroMetricId: "stripe-lag",
    metrics: [
      { id: "stripe-lag", apiName: "Stripe Webhook Lag", displayName: "Stripe Webhook Lag" },
    ],
  },
];

// ---------- Adapter ----------

export class DoozeAdapter implements MetricsAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  async getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData> {
    const apiHorizon = timeHorizon === "hour" ? "day" : timeHorizon;
    const period = { day: "1d", week: "7d", month: "30d" }[apiHorizon] ?? "7d";
    const days = { day: 1, week: 7, month: 30 }[apiHorizon] ?? 7;

    const [dashboardRes, appUsageRes] = await Promise.all([
      this.fetchJSON<APIDashboardData>(`/analytics/metrics?period=${period}`),
      this.fetchJSON<APIAppUsageResponse>(`/analytics/app-usage?days=${days}`),
    ]);

    return this.transform(dashboardRes, appUsageRes, timeHorizon);
  }

  private async fetchJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { "X-Admin-Key": this.apiKey },
    });
    if (!res.ok) {
      throw new Error(`Dooze API ${path}: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  private transform(
    api: APIDashboardData,
    appUsage: APIAppUsageResponse,
    timeHorizon: TimeHorizon
  ): DashboardData {
    // Build lookup from API metric name → data
    const lookup = new Map<string, APIMetricData>();
    for (const cat of api.categories) {
      for (const m of cat.metrics) {
        lookup.set(m.name, m);
      }
    }

    const categories: MetricCategory[] = [];

    for (const catDef of CATEGORY_DEFS) {
      const metrics: Metric[] = [];

      for (const mDef of catDef.metrics) {
        if ("children" in mDef) {
          // Expandable parent with children
          const childMetrics: Metric[] = [];

          // For INTERACTIONS, the parent "Total Queries" comes from the API directly
          const parentApiMetric = lookup.get(mDef.parent.apiName);

          for (const childDef of mDef.children) {
            const apiMetric = lookup.get(childDef.apiName);
            if (!apiMetric) continue;
            childMetrics.push(
              this.toMetric(childDef.id, childDef.displayName, apiMetric, {
                level: "child",
                parentLabel: mDef.parent.displayName,
              })
            );
          }

          // Use API-provided parent if available, otherwise synthesize from children
          const parentApi: APIMetricData = parentApiMetric ?? {
            name: mDef.parent.displayName,
            current_value: childMetrics.reduce((sum, c) => sum + c.lastPeriod.value, 0),
            previous_value: childMetrics.reduce((sum, c) => sum + c.lastPeriod.previousValue, 0),
            change_percent: null,
            sparkline: [],
            unit: "",
            is_hero: true,
            description: null,
          };

          metrics.push(
            this.toMetric(mDef.parent.id, mDef.parent.displayName, parentApi, {
              isExpandable: true,
              children: childMetrics,
            })
          );
        } else {
          const apiMetric = lookup.get(mDef.apiName);
          if (!apiMetric) continue;
          metrics.push(this.toMetric(mDef.id, mDef.displayName, apiMetric));
        }
      }

      if (metrics.length) {
        categories.push({
          id: catDef.id,
          name: catDef.name,
          heroMetricId: catDef.heroMetricId,
          metrics,
        });
      }
    }

    // APP USAGE category from app-usage endpoint
    if (appUsage.apps.length) {
      const appMetrics: Metric[] = appUsage.apps.map((app) => ({
        id: `app-${app.bundle_id ?? app.app_name}`,
        name: app.app_name,
        level: "parent" as const,
        isExpandable: false,
        lastPeriod: {
          value: Math.round(app.total_duration_ms / 60000),
          previousValue: 0,
          format: "number" as ValueFormat,
        },
        periodToDate: {
          value: app.session_count,
          previousValue: 0,
          format: "number" as ValueFormat,
        },
        sparkline: { data: [], min: 0, max: 0 },
        rollingPeriod: {
          value: app.unique_users,
          previousValue: 0,
          format: "number" as ValueFormat,
        },
      }));

      categories.push({
        id: "app-usage",
        name: "APP USAGE",
        heroMetricId: appMetrics[0]?.id ?? "app-unknown",
        metrics: appMetrics,
      });
    }

    return {
      categories,
      filters: { timeHorizon, product: "dooze", region: "global" },
    };
  }

  private toMetric(
    id: string,
    displayName: string,
    api: APIMetricData,
    options: Partial<{
      level: "parent" | "child";
      parentLabel: string;
      isExpandable: boolean;
      children: Metric[];
    }> = {}
  ): Metric {
    const format = unitToFormat(api.unit);
    const value = api.unit === "s" ? api.current_value * 1000 : api.current_value;
    const previousValue = api.unit === "s" ? api.previous_value * 1000 : api.previous_value;
    const sparkline = transformSparkline(api.sparkline, previousValue, value);

    return {
      id,
      name: displayName,
      parentLabel: options.parentLabel,
      level: options.level ?? "parent",
      isExpandable: options.isExpandable ?? false,
      lastPeriod: { value, previousValue, format },
      periodToDate: { value, previousValue, format },
      sparkline,
      rollingPeriod: { value, previousValue, format },
      children: options.children,
    };
  }
}

// ---------- Singleton ----------

const apiUrl = process.env.NEXT_PUBLIC_DOOZE_API_URL ?? "";
const apiKey = process.env.NEXT_PUBLIC_DOOZE_API_KEY ?? "";

export const doozeAdapter = new DoozeAdapter(apiUrl, apiKey);
