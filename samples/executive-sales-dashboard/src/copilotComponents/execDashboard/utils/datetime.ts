/**
 * Date / time helpers that keep the dashboard anchored to the render time.
 *
 * All period labels, "data as of" dates and trend axis labels are derived from
 * `now` so the sample always reads as current — never a stale, hard-coded quarter.
 */

const MONTHS_SHORT: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/** Zero-based calendar quarter (0..3) for a given date. */
export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3);
}

/** Resolved information about the calendar quarter that contains `now`. */
export interface IQuarterInfo {
  /** One-based quarter number (1..4). */
  quarterNumber: number;
  /** Four-digit year. */
  year: number;
  /** Zero-based month index of the first month in the quarter. */
  startMonth: number;
  /** Short month labels for the three months of the quarter, e.g. ['Apr','May','Jun']. */
  monthLabels: string[];
  /** Period label, e.g. "Q2 2026 (Apr-Jun)". */
  periodLabel: string;
}

/** Resolve the quarter that contains `now` into display-ready pieces. */
export function resolveQuarter(now: Date): IQuarterInfo {
  const quarter: number = getQuarter(now);
  const startMonth: number = quarter * 3;
  const monthLabels: string[] = [
    MONTHS_SHORT[startMonth],
    MONTHS_SHORT[startMonth + 1],
    MONTHS_SHORT[startMonth + 2]
  ];

  return {
    quarterNumber: quarter + 1,
    year: now.getFullYear(),
    startMonth,
    monthLabels,
    periodLabel: `Q${quarter + 1} ${now.getFullYear()} (${monthLabels[0]}-${monthLabels[2]})`
  };
}

/** Format a date as "Jun 24, 2026" for the "data as of" caption. */
export function formatDataAsOf(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Progress (0..1) through the current quarter at `now`. Used to bias the mock
 * trend so the "actual" line only extends up to today.
 */
export function quarterProgress(now: Date): number {
  const quarter: number = getQuarter(now);
  const start: Date = new Date(now.getFullYear(), quarter * 3, 1);
  const end: Date = new Date(now.getFullYear(), quarter * 3 + 3, 1);
  const span: number = end.getTime() - start.getTime();
  const elapsed: number = now.getTime() - start.getTime();
  return Math.min(1, Math.max(0.15, elapsed / span));
}
