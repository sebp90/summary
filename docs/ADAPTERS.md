# Data Adapters

This document explains how to connect your own data source to the dashboard.

## Overview

The dashboard uses an adapter pattern to fetch data. This allows you to swap out the data source without changing the UI components.

## Adapter Interface

All adapters implement this interface:

```typescript
interface MetricsAdapter {
  getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData>;
}
```

Where `TimeHorizon` is one of: `"hour" | "day" | "week" | "month"`

## Creating an Adapter

### Step 1: Create the adapter file

Create a new file in `lib/adapters/`:

```typescript
// lib/adapters/my-company.ts
import { MetricsAdapter } from "./types";
import { DashboardData, TimeHorizon } from "../types";

export class MyCompanyAdapter implements MetricsAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData> {
    const response = await fetch(
      `https://api.mycompany.com/metrics?horizon=${timeHorizon}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformData(data, timeHorizon);
  }

  private transformData(apiData: ApiResponse, timeHorizon: TimeHorizon): DashboardData {
    // Transform your API response to match DashboardData
    return {
      categories: this.buildCategories(apiData),
      filters: {
        timeHorizon,
        product: "my-product",
        region: "global",
      },
    };
  }

  private buildCategories(data: ApiResponse): MetricCategory[] {
    // Map your data to categories
    return [
      {
        id: "growth",
        name: "GROWTH",
        heroMetricId: "users",
        metrics: [
          // ... your metrics
        ],
      },
    ];
  }
}
```

### Step 2: Export the adapter

```typescript
// lib/adapters/my-company.ts
export const myCompanyAdapter = new MyCompanyAdapter(
  process.env.NEXT_PUBLIC_MY_API_KEY || ""
);
```

### Step 3: Use in DashboardShell

```typescript
// components/dashboard/DashboardShell.tsx
import { myCompanyAdapter } from "@/lib/adapters/my-company";

// In the useEffect:
const result = await myCompanyAdapter.getMetrics(timeHorizon);
```

## Data Structure

### DashboardData

```typescript
interface DashboardData {
  categories: MetricCategory[];
  filters: {
    timeHorizon: TimeHorizon;
    product: string;
    region: string;
  };
}
```

### MetricCategory

```typescript
interface MetricCategory {
  id: string;           // Unique ID (e.g., "growth")
  name: string;         // Display name (e.g., "GROWTH")
  heroMetricId: string; // Which metric to show when collapsed
  metrics: Metric[];    // All metrics in this category
}
```

### Metric

```typescript
interface Metric {
  id: string;
  name: string;
  parentLabel?: string;          // Shows above name for children
  level: "parent" | "child";
  isExpandable: boolean;
  lastPeriod: MetricValue;
  periodToDate: MetricValue;
  sparkline: SparklineData;
  rollingPeriod: MetricValue;
  children?: Metric[];
}
```

### MetricValue

```typescript
interface MetricValue {
  value: number;           // Current value
  previousValue: number;   // Previous period (for delta calculation)
  format: ValueFormat;     // "number" | "percent" | "currency" | "milliseconds"
}
```

### SparklineData

```typescript
interface SparklineData {
  data: Array<{
    date: string;      // ISO date string
    value: number;     // Current period value
    comparison: number; // Previous period value (for comparison line)
  }>;
  min: number;  // Y-axis minimum
  max: number;  // Y-axis maximum
}
```

## Example: PostgreSQL Adapter

```typescript
import { Pool } from "pg";
import { MetricsAdapter } from "./types";
import { DashboardData, TimeHorizon } from "../types";

export class PostgresAdapter implements MetricsAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData> {
    const interval = this.getInterval(timeHorizon);

    const result = await this.pool.query(`
      SELECT
        metric_name,
        SUM(value) as value,
        LAG(SUM(value)) OVER (ORDER BY period) as previous_value
      FROM metrics
      WHERE period >= NOW() - $1
      GROUP BY metric_name, period
    `, [interval]);

    return this.transformRows(result.rows, timeHorizon);
  }

  private getInterval(horizon: TimeHorizon): string {
    const intervals = {
      hour: "1 hour",
      day: "1 day",
      week: "7 days",
      month: "28 days",
    };
    return intervals[horizon];
  }
}
```

## Example: Stripe + Posthog Adapter

Combine multiple data sources:

```typescript
export class CompositeAdapter implements MetricsAdapter {
  private stripe: Stripe;
  private posthog: PostHog;

  async getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData> {
    const [revenueData, analyticsData] = await Promise.all([
      this.fetchStripeRevenue(timeHorizon),
      this.fetchPosthogEvents(timeHorizon),
    ]);

    return {
      categories: [
        this.buildRevenueCategory(revenueData),
        this.buildEngagementCategory(analyticsData),
      ],
      filters: { timeHorizon, product: "my-product", region: "global" },
    };
  }
}
```

## Environment Variables

Store API keys in `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_MY_API_KEY=your-api-key
DATABASE_URL=postgres://...
STRIPE_SECRET_KEY=sk_...
```

Access in adapters:

```typescript
const apiKey = process.env.NEXT_PUBLIC_MY_API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

Note: Only `NEXT_PUBLIC_*` variables are available in client-side code.
