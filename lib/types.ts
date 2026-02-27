export type TimeHorizon = "hour" | "day" | "week" | "month";
export type ValueFormat = "number" | "percent" | "currency" | "milliseconds";
export type DeltaMode = "pct" | "abs";

export interface MetricValue {
  value: number;
  previousValue: number;
  format: ValueFormat;
}

export interface SparklineData {
  data: Array<{ date: string; value: number; comparison: number }>;
  min: number;
  max: number;
}

export interface Metric {
  id: string;
  name: string;
  parentLabel?: string;
  level: "parent" | "child";
  isExpandable: boolean;
  lastPeriod: MetricValue;
  periodToDate: MetricValue;
  sparkline: SparklineData;
  rollingPeriod: MetricValue;
  children?: Metric[];
}

export interface MetricCategory {
  id: string;
  name: string;
  heroMetricId: string;
  metrics: Metric[];
}

export interface DashboardData {
  categories: MetricCategory[];
  filters: {
    timeHorizon: TimeHorizon;
    product: string;
    region: string;
  };
}

export interface ColumnHeaders {
  lastPeriod: string;
  periodToDate: string;
  rollingPeriod: string;
}

export interface DateRanges {
  lastPeriod: string;
  periodToDate: string;
  rollingPeriod: string;
}

export const TIME_HORIZON_HEADERS: Record<TimeHorizon, ColumnHeaders> = {
  hour: {
    lastPeriod: "Last Hour",
    periodToDate: "Hour to Date",
    rollingPeriod: "Last 60 Min",
  },
  day: {
    lastPeriod: "Yesterday",
    periodToDate: "Today to Date",
    rollingPeriod: "Last 24 Hours",
  },
  week: {
    lastPeriod: "Last Completed Week",
    periodToDate: "Week to Date",
    rollingPeriod: "Last 7 Days",
  },
  month: {
    lastPeriod: "Last Month",
    periodToDate: "Month to Date",
    rollingPeriod: "Last 28 Days",
  },
};

/**
 * Get date range strings for column headers based on time horizon
 */
export function getDateRanges(timeHorizon: TimeHorizon): DateRanges {
  const now = new Date();

  const formatDate = (d: Date) => {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatDateTime = (d: Date) => {
    const hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${d.getMonth() + 1}/${d.getDate()} ${hour12}:00 ${ampm}`;
  };

  switch (timeHorizon) {
    case "hour": {
      const lastHourStart = new Date(now);
      lastHourStart.setHours(lastHourStart.getHours() - 1, 0, 0, 0);
      const thisHourStart = new Date(now);
      thisHourStart.setMinutes(0, 0, 0);
      const rolling60Start = new Date(now);
      rolling60Start.setMinutes(rolling60Start.getMinutes() - 60);

      return {
        lastPeriod: formatDateTime(lastHourStart),
        periodToDate: `${formatDateTime(thisHourStart)} to now`,
        rollingPeriod: `${formatDateTime(rolling60Start)} to now`,
      };
    }
    case "day": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const rolling24Start = new Date(now);
      rolling24Start.setDate(rolling24Start.getDate() - 1);

      return {
        lastPeriod: formatDate(yesterday),
        periodToDate: `${formatDateTime(todayStart)} to now`,
        rollingPeriod: `${formatDate(rolling24Start)} to now`,
      };
    }
    case "week": {
      // Get start of last completed week (Monday)
      const dayOfWeek = now.getDay();
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - daysSinceMonday);
      thisWeekStart.setHours(0, 0, 0, 0);

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const rolling7Start = new Date(now);
      rolling7Start.setDate(rolling7Start.getDate() - 7);

      return {
        lastPeriod: `Week of ${formatDate(lastWeekStart)}`,
        periodToDate: `${formatDate(thisWeekStart)} to now`,
        rollingPeriod: `${formatDate(rolling7Start)} to now`,
      };
    }
    case "month": {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const rolling28Start = new Date(now);
      rolling28Start.setDate(rolling28Start.getDate() - 28);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return {
        lastPeriod: monthNames[lastMonthStart.getMonth()],
        periodToDate: `${formatDate(thisMonthStart)} to now`,
        rollingPeriod: `${formatDate(rolling28Start)} to now`,
      };
    }
  }
}

/**
 * Get chart X-axis date labels (always 7 labels)
 * - HOUR: 7 days (hourly data points within)
 * - DAY: 7 days (hourly data points within)
 * - WEEK: 7 weeks
 * - MONTH: 7 months
 */
export function getChartDates(timeHorizon: TimeHorizon): string[] {
  const now = new Date();
  const dates: string[] = [];
  const points = 7;

  const formatDate = (d: Date) => {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);

    switch (timeHorizon) {
      case "hour":
      case "day":
        // Both show 7 days in header (but have hourly data points)
        date.setDate(date.getDate() - i);
        dates.push(formatDate(date));
        break;

      case "week":
        // Last 7 weeks
        date.setDate(date.getDate() - i * 7);
        dates.push(formatDate(date));
        break;

      case "month":
        // Last 7 months
        date.setMonth(date.getMonth() - i);
        dates.push(monthNames[date.getMonth()]);
        break;

      default:
        date.setDate(date.getDate() - i);
        dates.push(formatDate(date));
        break;
    }
  }

  return dates;
}
