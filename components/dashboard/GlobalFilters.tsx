"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TimeHorizon, DeltaMode } from "@/lib/types";

interface GlobalFiltersProps {
  timeHorizon: TimeHorizon;
  onTimeHorizonChange: (value: TimeHorizon) => void;
  deltaMode: DeltaMode;
  onDeltaModeChange: (value: DeltaMode) => void;
  product: string;
  onProductChange: (value: string) => void;
  region: string;
  onRegionChange: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  title?: string;
}

export function GlobalFilters({
  timeHorizon,
  onTimeHorizonChange,
  deltaMode,
  onDeltaModeChange,
  product,
  onProductChange,
  region,
  onRegionChange,
  onExpandAll,
  onCollapseAll,
  title = "Dashboard",
}: GlobalFiltersProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-6">
      {/* Left: Title + Expand/Collapse */}
      <div className="flex items-center gap-6">
        <h1 className="font-serif text-lg font-medium italic text-[var(--text-primary)]">
          {title}
        </h1>
        <div className="flex items-center gap-1 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Expand All
          </Button>
          <span className="text-[var(--text-muted)]">|</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Right: Filters */}
      <div className="flex items-center gap-3">
        {/* Product Select */}
        <Select value={product} onValueChange={onProductChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dooze">dooze</SelectItem>
          </SelectContent>
        </Select>

        {/* Region Select */}
        <Select value={region} onValueChange={onRegionChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Global</SelectItem>
          </SelectContent>
        </Select>

        {/* Delta Mode Toggle */}
        <ToggleGroup
          type="single"
          value={deltaMode}
          onValueChange={(value) => value && onDeltaModeChange(value as DeltaMode)}
        >
          <ToggleGroupItem value="pct">PCT</ToggleGroupItem>
          <ToggleGroupItem value="abs">ABS</ToggleGroupItem>
        </ToggleGroup>

        {/* Time Horizon Toggle */}
        <ToggleGroup
          type="single"
          value={timeHorizon}
          onValueChange={(value) => value && onTimeHorizonChange(value as TimeHorizon)}
        >
          <ToggleGroupItem value="hour">HOUR</ToggleGroupItem>
          <ToggleGroupItem value="day">DAY</ToggleGroupItem>
          <ToggleGroupItem value="week">WEEK</ToggleGroupItem>
          <ToggleGroupItem value="month">MONTH</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </header>
  );
}
