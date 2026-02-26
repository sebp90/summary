# Founder Dashboard

Enterprise-grade metrics dashboard inspired by Uber's internal Summary dashboard. Built with Next.js, Tailwind CSS, shadcn/ui, and Recharts.

## Features

- **Data-dense layout**: See all your metrics at a glance
- **Hierarchical categories**: Expandable sections with hero metrics when collapsed
- **Expandable metrics**: Drill down into sub-metrics
- **Sparklines**: Mini trend charts with min/max bounds
- **Comparison lines**: Always-visible previous period overlay
- **Delta badges**: PCT or ABS mode for all deltas
- **Time horizon toggle**: Hour/Day/Week/Month views
- **Responsive column headers**: Dynamically update based on time selection
- **Tabular numbers**: Perfect column alignment throughout

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yourusername/founder-dashboard.git
cd founder-dashboard

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Configuration

### Adding Your Own Metrics

1. Create an adapter in `lib/adapters/`:

```typescript
// lib/adapters/my-api.ts
import { MetricsAdapter } from "./types";
import { DashboardData, TimeHorizon } from "../types";

export class MyAPIAdapter implements MetricsAdapter {
  async getMetrics(timeHorizon: TimeHorizon): Promise<DashboardData> {
    const response = await fetch(`/api/metrics?horizon=${timeHorizon}`);
    const data = await response.json();
    return transformToMetrics(data);
  }
}
```

2. Use your adapter in `components/dashboard/DashboardShell.tsx`:

```typescript
import { myAdapter } from "@/lib/adapters/my-api";

// Replace mockAdapter with your adapter
const result = await myAdapter.getMetrics(timeHorizon);
```

### Defining Metrics

Each metric follows this structure:

```typescript
interface Metric {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  parentLabel?: string;          // Shows above name for child metrics
  level: "parent" | "child";     // Hierarchy level
  isExpandable: boolean;         // Has children?
  lastPeriod: MetricValue;       // Last complete period
  periodToDate: MetricValue;     // Current period so far
  sparkline: SparklineData;      // Trend data
  rollingPeriod: MetricValue;    // Rolling window
  children?: Metric[];           // Sub-metrics
}
```

See `lib/adapters/mock.ts` for a complete example with 8 metric categories.

## Project Structure

```
founder-dashboard/
├── app/
│   ├── layout.tsx              # Root layout with fonts
│   ├── page.tsx                # Dashboard page
│   └── globals.css             # Tailwind + custom styles
├── components/
│   ├── dashboard/
│   │   ├── DashboardShell.tsx  # Main container
│   │   ├── GlobalFilters.tsx   # Top filter bar
│   │   ├── MetricsTable.tsx    # Metrics container
│   │   ├── MetricCategory.tsx  # Expandable section
│   │   ├── MetricRow.tsx       # Single metric row
│   │   ├── Sparkline.tsx       # Mini line chart
│   │   ├── DeltaBadge.tsx      # +5.2% badge
│   │   └── ValueCell.tsx       # Formatted number
│   └── ui/                     # shadcn primitives
├── lib/
│   ├── format.ts               # Number formatting
│   ├── types.ts                # TypeScript interfaces
│   ├── utils.ts                # cn() helper
│   └── adapters/
│       ├── types.ts            # Adapter interface
│       ├── mock.ts             # Mock data
│       └── example.ts          # Example adapter
└── docs/
    ├── CUSTOMIZATION.md        # How to customize
    └── ADAPTERS.md             # How to connect data
```

## Design System

### Typography
- **Headers**: JetBrains Mono (monospace)
- **Body**: IBM Plex Sans (sans-serif)
- **Numbers**: Tabular figures for perfect alignment

### Colors
```css
--teal-primary: #0D9488      /* Primary data line */
--teal-light: #14B8A6        /* Hover states */
--positive: #16A34A          /* Green for positive deltas */
--negative: #DC2626          /* Red for negative deltas */
--text-primary: #171717      /* Main text */
--text-secondary: #737373    /* Secondary labels */
--text-muted: #A3A3A3        /* Tertiary text */
--border: #E5E5E5            /* Row separators */
--background: #FAFAFA        /* Page background */
--card: #FFFFFF              /* Content areas */
--comparison: #9CA3AF        /* Dashed comparison line */
```

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts
- [Radix UI](https://radix-ui.com/) - Primitives
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## License

MIT - feel free to use this for your own projects.
