import { DashboardData, TimeHorizon } from "../types";

/**
 * Interface for metrics data adapters.
 * Implement this interface to connect your own data source.
 */
export interface MetricsAdapter {
  /**
   * Fetch dashboard metrics for a given time horizon.
   * @param timeHorizon - The time period to fetch metrics for
   * @returns Promise resolving to dashboard data
   */
  getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData>;
}
