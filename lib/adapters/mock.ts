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
  const points = 7;
  const data = [];
  let currentValue = baseValue * (1 - variance * 0.5);
  let comparisonValue = currentValue * 0.9;

  const now = new Date();

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.4) * variance * baseValue;
    currentValue = Math.max(0, currentValue + change);
    comparisonValue = currentValue * (0.85 + Math.random() * 0.1);

    let dateLabel: string;

    switch (timeHorizon) {
      case "hour":
        // Last 7 hours, each point = 1 hour
        const hourDate = new Date(now);
        hourDate.setHours(hourDate.getHours() - (points - 1 - i));
        dateLabel = hourDate.toISOString();
        break;

      case "day":
        // Last 7 days, each point = 1 day
        const dayDate = new Date(now);
        dayDate.setDate(dayDate.getDate() - (points - 1 - i));
        dateLabel = dayDate.toISOString().split("T")[0];
        break;

      case "week":
        // Last 7 weeks, each point = 1 week
        const weekDate = new Date(now);
        weekDate.setDate(weekDate.getDate() - (points - 1 - i) * 7);
        dateLabel = weekDate.toISOString().split("T")[0];
        break;

      case "month":
        // Last 7 months, each point = 1 month
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - (points - 1 - i));
        dateLabel = monthDate.toISOString().split("T")[0];
        break;

      default:
        const defaultDate = new Date(now);
        defaultDate.setDate(defaultDate.getDate() - (points - 1 - i));
        dateLabel = defaultDate.toISOString().split("T")[0];
    }

    data.push({
      date: dateLabel,
      value: Math.round(currentValue * 100) / 100,
      comparison: Math.round(comparisonValue * 100) / 100,
    });
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values, ...data.map((d) => d.comparison));
  const max = Math.max(...values, ...data.map((d) => d.comparison));

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
