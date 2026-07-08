/**
 * Formatting helpers for currency and percentages used across the dashboard.
 */

/** Format an absolute number as compact currency, e.g. 4200000 -> "$4.2M". */
export function formatCurrencyM(value: number): string {
  const millions: number = value / 1_000_000;
  if (Math.abs(millions) >= 1) {
    return `$${millions.toFixed(1)}M`;
  }
  const thousands: number = value / 1_000;
  return `$${thousands.toFixed(0)}K`;
}

/** Format a fraction (0..1) as a percentage, e.g. 0.326 -> "32.6%". */
export function formatPercent(fraction: number, decimals: number = 1): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

/** Format a whole number with thousands separators, e.g. 128 -> "128". */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}
