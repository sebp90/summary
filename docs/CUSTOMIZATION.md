# Customization Guide

This guide explains how to customize the dashboard for your own use.

## Changing the Title

In `app/page.tsx`:

```typescript
export default function Home() {
  return <DashboardShell title="Your Company" />;
}
```

## Adding Product/Region Filters

The dropdowns currently show single options. To add more:

### 1. Update GlobalFilters

```typescript
// components/dashboard/GlobalFilters.tsx

// Add more products
<SelectContent>
  <SelectItem value="product-a">Product A</SelectItem>
  <SelectItem value="product-b">Product B</SelectItem>
  <SelectItem value="all">All Products</SelectItem>
</SelectContent>

// Add more regions
<SelectContent>
  <SelectItem value="global">Global</SelectItem>
  <SelectItem value="us">United States</SelectItem>
  <SelectItem value="eu">Europe</SelectItem>
  <SelectItem value="apac">Asia Pacific</SelectItem>
</SelectContent>
```

### 2. Update Your Adapter

Pass the filters to your data fetching:

```typescript
async getMetrics(
  timeHorizon: TimeHorizon,
  product: string,
  region: string
): Promise<DashboardData> {
  const response = await fetch(
    `/api/metrics?horizon=${timeHorizon}&product=${product}&region=${region}`
  );
  // ...
}
```

## Customizing Colors

Edit `app/globals.css`:

```css
:root {
  /* Primary - your brand color */
  --teal-primary: #6366F1;      /* Indigo */
  --teal-light: #818CF8;

  /* Or a warm palette */
  --teal-primary: #EA580C;      /* Orange */
  --teal-light: #F97316;
}
```

## Adding/Removing Metric Categories

Define your categories in your adapter or create a config file:

```typescript
// lib/config.ts
export const metricCategories = [
  { id: "sales", name: "SALES", heroMetricId: "total-revenue" },
  { id: "marketing", name: "MARKETING", heroMetricId: "leads" },
  { id: "support", name: "SUPPORT", heroMetricId: "tickets" },
];
```

## Inverting Delta Colors

Some metrics are "good" when they decrease (errors, churn, latency). The dashboard handles this via `INVERTED_METRICS`:

```typescript
// components/dashboard/MetricCategory.tsx

const INVERTED_METRICS = new Set([
  "error-rate",
  "latency-p50",
  "latency-p95",
  "latency-p99",
  "churn-rate",
  "daily-spend",    // Add your own
  "cost-per-user",
]);
```

## Custom Number Formatting

Edit `lib/format.ts`:

```typescript
// Add your own format
export function formatBytes(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " GB";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + " MB";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + " KB";
  return n + " B";
}

// Use in formatValue()
export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "bytes":
      return formatBytes(value);
    // ...
  }
}
```

## Adding Authentication

Wrap the dashboard with your auth provider:

```typescript
// app/layout.tsx
import { AuthProvider } from "@/lib/auth";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// app/page.tsx
import { useAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) redirect("/login");

  return <DashboardShell title="Dashboard" />;
}
```

## Changing Time Horizons

Add or modify time options in:

```typescript
// lib/types.ts
export type TimeHorizon = "hour" | "day" | "week" | "month" | "quarter" | "year";

export const TIME_HORIZON_HEADERS: Record<TimeHorizon, ColumnHeaders> = {
  // ... existing
  quarter: {
    lastPeriod: "Last Quarter",
    periodToDate: "QTD",
    rollingPeriod: "Last 90 Days",
  },
  year: {
    lastPeriod: "Last Year",
    periodToDate: "YTD",
    rollingPeriod: "Last 365 Days",
  },
};
```

Then update `GlobalFilters.tsx` to include the new options.

## Changing Fonts

Edit `app/layout.tsx`:

```typescript
import { Inter, Fira_Code } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});
```

And update `app/globals.css`:

```css
@theme inline {
  --font-sans: var(--font-inter);
  --font-mono: var(--font-fira-code);
}
```

## Adding a Date Picker

For more granular date selection, add a date picker:

```bash
npm install date-fns @radix-ui/react-popover
```

Then create a DatePicker component and add it to GlobalFilters.

## Responsive Design

The dashboard uses a grid layout. For mobile, you might want to:

```typescript
// components/dashboard/MetricRow.tsx

// Change grid to stack on mobile
<div className={cn(
  "grid gap-4 items-center py-2.5 px-4",
  // Desktop: full grid
  "md:grid-cols-[minmax(200px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,1fr)_minmax(120px,1fr)]",
  // Mobile: stack vertically
  "grid-cols-1"
)}>
```

## Dark Mode

Add dark mode support:

```css
/* app/globals.css */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0A0A0A;
    --card: #171717;
    --border: #262626;
    --text-primary: #FAFAFA;
    --text-secondary: #A3A3A3;
    --text-muted: #737373;
  }
}
```

Or use a toggle with class-based dark mode.
