/**
 * Example adapter showing how to connect your own data source.
 * Copy this file and modify it to fetch data from your API.
 */

import { MetricsAdapter } from "./types";
import { DashboardData, TimeHorizon, Metric, MetricCategory, SparklineData, ValueFormat } from "../types";

/**
 * Example: Fetch from your REST API
 */
export class ExampleAPIAdapter implements MetricsAdapter {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData> {
    const response = await fetch(`${this.baseUrl}/api/metrics?horizon=${timeHorizon}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    // Transform your API response to match DashboardData interface
    const apiData = await response.json();

    return this.transformToMetrics(apiData, timeHorizon);
  }

  private transformToMetrics(apiData: unknown, timeHorizon: TimeHorizon): DashboardData {
    // Transform your API response structure to match the expected format
    // This is just an example - modify based on your actual API response

    const categories: MetricCategory[] = [
      {
        id: "example",
        name: "EXAMPLE CATEGORY",
        heroMetricId: "example-metric",
        metrics: [
          // Your metrics here
        ],
      },
    ];

    return {
      categories,
      filters: {
        timeHorizon,
        product: "your-product",
        region: "global",
      },
    };
  }
}

/**
 * Helper to create a metric object
 */
export function createMetricHelper(
  id: string,
  name: string,
  value: number,
  previousValue: number,
  format: ValueFormat = "number",
  sparklineData: { data: Array<{ date: string; value: number; comparison: number }>; min: number; max: number }
): Metric {
  return {
    id,
    name,
    level: "parent",
    isExpandable: false,
    lastPeriod: { value, previousValue, format },
    periodToDate: { value: value * 0.4, previousValue: previousValue * 0.4, format },
    sparkline: sparklineData,
    rollingPeriod: { value: value * 0.95, previousValue: previousValue * 0.95, format },
  };
}
