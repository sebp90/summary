import { MetricsAdapter } from "./types";
import {
  DashboardData,
  TimeHorizon,
  Metric,
  MetricCategory,
  SparklineData,
  ValueFormat,
} from "../types";

// Helper to generate sparkline data based on time horizon
function generateSparklineData(
  baseValue: number,
  timeHorizon: TimeHorizon,
  variance: number = 0.15
): SparklineData {
  const data = [];
  let currentValue = baseValue * (1 - variance * 0.5);
  let comparisonValue = currentValue * 0.9;

  const now = new Date();

  // Determine number of points and interval based on time horizon
  let points: number;
  let getDate: (i: number) => Date;
  let getComparisonDate: (i: number) => Date;

  switch (timeHorizon) {
    case "hour":
    case "day":
      // Hourly granularity over 7 days = 168 points
      points = 7 * 24;
      getDate = (i: number) => {
        const date = new Date(now);
        date.setHours(date.getHours() - (points - 1 - i));
        return date;
      };
      // Comparison = same hour previous week
      getComparisonDate = (i: number) => {
        const date = new Date(now);
        date.setHours(date.getHours() - (points - 1 - i) - 7 * 24);
        return date;
      };
      break;

    case "week":
      // Weekly granularity over 7 weeks = 7 points
      points = 7;
      getDate = (i: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (points - 1 - i) * 7);
        return date;
      };
      // Comparison = previous 7 weeks
      getComparisonDate = (i: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (points - 1 - i) * 7 - 7 * 7);
        return date;
      };
      break;

    case "month":
      // Monthly granularity over 7 months = 7 points
      points = 7;
      getDate = (i: number) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (points - 1 - i));
        return date;
      };
      // Comparison = same month previous year
      getComparisonDate = (i: number) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (points - 1 - i) - 12);
        return date;
      };
      break;

    default:
      points = 7;
      getDate = (i: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (points - 1 - i));
        return date;
      };
      getComparisonDate = (i: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (points - 1 - i) - 7);
        return date;
      };
  }

  // Generate data points
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.4) * variance * baseValue;
    currentValue = Math.max(0, currentValue + change);

    // Comparison value with some variance from current
    const compChange = (Math.random() - 0.5) * variance * baseValue * 0.5;
    comparisonValue = currentValue * (0.85 + Math.random() * 0.15) + compChange;

    const date = getDate(i);

    data.push({
      date: date.toISOString(),
      value: Math.round(currentValue * 100) / 100,
      comparison: Math.round(comparisonValue * 100) / 100,
    });
  }

  const allValues = [...data.map((d) => d.value), ...data.map((d) => d.comparison)];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  return { data, min, max };
}

// Helper to create a metric
function createMetric(
  id: string,
  name: string,
  baseValue: number,
  timeHorizon: TimeHorizon,
  format: ValueFormat = "number",
  options: Partial<{
    parentLabel: string;
    level: "parent" | "child";
    isExpandable: boolean;
    children: Metric[];
    growthRate: number;
  }> = {}
): Metric {
  const level = options.level ?? "parent";
  const growthRate = options.growthRate ?? 0.08;
  const previousValue = baseValue / (1 + growthRate);

  return {
    id,
    name,
    parentLabel: options.parentLabel,
    level,
    isExpandable: options.isExpandable ?? false,
    lastPeriod: {
      value: baseValue,
      previousValue,
      format,
    },
    periodToDate: {
      value: baseValue * 0.4,
      previousValue: previousValue * 0.38,
      format,
    },
    sparkline: generateSparklineData(baseValue, timeHorizon),
    rollingPeriod: {
      value: baseValue * 0.98,
      previousValue: previousValue * 0.95,
      format,
    },
    children: options.children?.map(child => ({
      ...child,
      sparkline: generateSparklineData(child.lastPeriod.value, timeHorizon),
    })),
  };
}

export class MockAdapter implements MetricsAdapter {
  async getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const categories: MetricCategory[] = [
      // 1. GROWTH
      {
        id: "growth",
        name: "GROWTH",
        heroMetricId: "signups",
        metrics: [
          createMetric("downloads", "DMG Downloads", 2340, timeHorizon, "number", {
            growthRate: 0.12,
          }),
          createMetric("installs", "Installs", 1850, timeHorizon, "number", {
            growthRate: 0.1,
          }),
          createMetric("signups", "Signups", 892, timeHorizon, "number", {
            growthRate: 0.15,
          }),
          createMetric("active-users", "Active Users", 4230, timeHorizon, "number", {
            isExpandable: true,
            growthRate: 0.09,
            children: [
              createMetric("active-free", "Free", 3450, timeHorizon, "number", {
                parentLabel: "Active Users",
                level: "child",
                growthRate: 0.07,
              }),
              createMetric("active-paid", "Paid", 780, timeHorizon, "number", {
                parentLabel: "Active Users",
                level: "child",
                growthRate: 0.18,
              }),
            ],
          }),
        ],
      },

      // 2. ENGAGEMENT
      {
        id: "engagement",
        name: "ENGAGEMENT",
        heroMetricId: "dau",
        metrics: [
          createMetric("dau", "Daily Active Users", 1240, timeHorizon, "number", {
            isExpandable: true,
            growthRate: 0.11,
            children: [
              createMetric("dau-free", "Free", 980, timeHorizon, "number", {
                parentLabel: "DAU",
                level: "child",
                growthRate: 0.08,
              }),
              createMetric("dau-paid", "Paid", 260, timeHorizon, "number", {
                parentLabel: "DAU",
                level: "child",
                growthRate: 0.22,
              }),
            ],
          }),
          createMetric("wau", "Weekly Active Users", 3420, timeHorizon, "number", {
            growthRate: 0.09,
          }),
          createMetric("mau", "Monthly Active Users", 4890, timeHorizon, "number", {
            growthRate: 0.08,
          }),
        ],
      },

      // 3. CONVERSION
      {
        id: "conversion",
        name: "CONVERSION",
        heroMetricId: "free-to-paid",
        metrics: [
          createMetric("download-to-install", "Download → Install", 79.1, timeHorizon, "percent", {
            growthRate: 0.02,
          }),
          createMetric("install-to-signup", "Install → Signup", 48.2, timeHorizon, "percent", {
            growthRate: 0.04,
          }),
          createMetric("signup-to-active", "Signup → Active", 62.4, timeHorizon, "percent", {
            growthRate: 0.03,
          }),
          createMetric("free-to-paid", "Free → Paid", 8.4, timeHorizon, "percent", {
            growthRate: 0.15,
          }),
        ],
      },

      // 4. CHURN
      {
        id: "churn",
        name: "CHURN",
        heroMetricId: "churn-rate",
        metrics: [
          createMetric("paid-to-free", "Paid → Free", 12, timeHorizon, "number", {
            growthRate: -0.08,
          }),
          createMetric("inactive-free", "Inactive Free (2+ weeks)", 342, timeHorizon, "number", {
            growthRate: -0.05,
          }),
          createMetric("churn-rate", "Churn Rate", 2.3, timeHorizon, "percent", {
            growthRate: -0.12,
          }),
        ],
      },

      // 5. USAGE
      {
        id: "usage",
        name: "USAGE",
        heroMetricId: "total-actions",
        metrics: [
          createMetric("total-actions", "Total Actions", 28450, timeHorizon, "number", {
            isExpandable: true,
            growthRate: 0.14,
            children: [
              createMetric("ask-ai", "Ask AI", 12340, timeHorizon, "number", {
                parentLabel: "Actions",
                level: "child",
                growthRate: 0.18,
              }),
              createMetric("summarize", "Summarize", 8920, timeHorizon, "number", {
                parentLabel: "Actions",
                level: "child",
                growthRate: 0.12,
              }),
              createMetric("polish", "Polish", 7190, timeHorizon, "number", {
                parentLabel: "Actions",
                level: "child",
                growthRate: 0.1,
              }),
            ],
          }),
          createMetric("actions-per-user", "Actions per User", 6.7, timeHorizon, "number", {
            growthRate: 0.05,
          }),
          createMetric("conversations", "Conversations Started", 4230, timeHorizon, "number", {
            growthRate: 0.11,
          }),
        ],
      },

      // 6. REVENUE
      {
        id: "revenue",
        name: "REVENUE",
        heroMetricId: "mrr",
        metrics: [
          createMetric("mrr", "MRR", 7820, timeHorizon, "currency", {
            growthRate: 0.12,
          }),
          createMetric("arr", "ARR", 93840, timeHorizon, "currency", {
            growthRate: 0.12,
          }),
          createMetric("revenue-by-tier", "Revenue by Tier", 7820, timeHorizon, "currency", {
            isExpandable: true,
            growthRate: 0.12,
            children: [
              createMetric("revenue-pro", "Pro", 4680, timeHorizon, "currency", {
                parentLabel: "Revenue",
                level: "child",
                growthRate: 0.1,
              }),
              createMetric("revenue-max", "Max", 3140, timeHorizon, "currency", {
                parentLabel: "Revenue",
                level: "child",
                growthRate: 0.16,
              }),
            ],
          }),
        ],
      },

      // 7. SPEND
      {
        id: "spend",
        name: "SPEND",
        heroMetricId: "gross-margin",
        metrics: [
          createMetric("daily-spend", "Daily API Spend", 42.5, timeHorizon, "currency", {
            growthRate: 0.08,
          }),
          createMetric("monthly-spend", "Monthly API Spend", 1275, timeHorizon, "currency", {
            growthRate: 0.08,
          }),
          createMetric("spend-per-user", "Spend per Active User", 0.34, timeHorizon, "currency", {
            growthRate: -0.03,
          }),
          createMetric("gross-margin", "Gross Margin", 72.4, timeHorizon, "percent", {
            growthRate: 0.02,
          }),
        ],
      },

      // 8. PERFORMANCE
      {
        id: "performance",
        name: "PERFORMANCE",
        heroMetricId: "error-rate",
        metrics: [
          createMetric("error-rate", "Error Rate", 0.8, timeHorizon, "percent", {
            growthRate: -0.15,
          }),
          createMetric("latency-p50", "Latency p50", 245, timeHorizon, "milliseconds", {
            growthRate: -0.05,
          }),
          createMetric("latency-p95", "Latency p95", 890, timeHorizon, "milliseconds", {
            growthRate: -0.04,
          }),
          createMetric("latency-p99", "Latency p99", 1450, timeHorizon, "milliseconds", {
            growthRate: -0.03,
          }),
        ],
      },
    ];

    return {
      categories,
      filters: {
        timeHorizon,
        product: "dooze",
        region: "global",
      },
    };
  }
}

export const mockAdapter = new MockAdapter();
