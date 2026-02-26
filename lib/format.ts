import { ValueFormat, DeltaMode } from "./types";

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "milliseconds":
      return formatMilliseconds(value);
    case "number":
    default:
      return formatNumber(value);
  }
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(2) + "M";
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toFixed(2) + "K";
  }
  if (Number.isInteger(n)) {
    return n.toString();
  }
  return n.toFixed(2);
}

export function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return "$" + (n / 1_000_000).toFixed(2) + "M";
  }
  if (Math.abs(n) >= 1_000) {
    return "$" + (n / 1_000).toFixed(2) + "K";
  }
  return "$" + n.toFixed(2);
}

export function formatPercent(n: number): string {
  return n.toFixed(1) + "%";
}

export function formatMilliseconds(n: number): string {
  if (n >= 1000) {
    return (n / 1000).toFixed(2) + "s";
  }
  return n.toFixed(0) + "ms";
}

export function calculateDelta(
  value: number,
  previousValue: number,
  mode: DeltaMode
): number {
  if (mode === "abs") {
    return value - previousValue;
  }
  // PCT mode
  if (previousValue === 0) {
    return value > 0 ? 100 : value < 0 ? -100 : 0;
  }
  return ((value - previousValue) / Math.abs(previousValue)) * 100;
}

export function formatDelta(
  delta: number,
  mode: DeltaMode,
  format: ValueFormat
): string {
  const sign = delta >= 0 ? "+" : "";

  if (mode === "abs") {
    // For absolute mode, format based on the value format
    switch (format) {
      case "currency":
        return sign + formatCurrency(delta);
      case "percent":
        return sign + formatPercent(delta);
      case "milliseconds":
        return sign + formatMilliseconds(delta);
      default:
        return sign + formatNumber(delta);
    }
  }

  // PCT mode - always show as percentage
  return sign + delta.toFixed(1) + "%";
}
