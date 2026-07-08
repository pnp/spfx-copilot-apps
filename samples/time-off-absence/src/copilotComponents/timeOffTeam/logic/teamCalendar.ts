// Pure month-grid + lane-packing builder for the fullscreen team absence
// calendar (Component C). Given the per-member absence rows from
// deriveTeamCalendar(), this projects them onto a single visible month as a
// Gantt-style grid: member rows down the side, day columns across the top, and
// colored bars spanning each absence. Overlapping bars on one member are packed
// onto separate lanes so nothing visually collides.
//
// Everything here is pure and deterministic (no Date.now, no DOM) so it is
// fully unit-testable; the React layer in ui/TeamAbsenceCalendar.tsx only maps
// the returned positions onto a CSS grid.

import type { ITeamCalendarRow, ITeamCalendarBar, ITeamMember } from '../data/types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

/** One day column in the visible month. */
export interface ICalendarDay {
  /** YYYY-MM-DD for this day. */
  iso: string;
  /** Day of month, 1-based. */
  day: number;
  /** 0 = Sunday … 6 = Saturday (UTC, timezone-safe). */
  weekday: number;
  isWeekend: boolean;
  isToday: boolean;
}

/** An absence bar placed onto the visible month grid for one member. */
export interface IPositionedBar {
  bar: ITeamCalendarBar;
  /** 1-based first day column the bar occupies within the visible month. */
  startCol: number;
  /** 1-based last day column the bar occupies within the visible month (inclusive). */
  endCol: number;
  /** True when the absence actually begins before the first of the month. */
  clippedStart: boolean;
  /** True when the absence actually ends after the last of the month. */
  clippedEnd: boolean;
}

/** A member row with its bars distributed across non-overlapping lanes. */
export interface ICalendarMemberRow {
  member: ITeamMember;
  /** lanes[laneIndex] = the bars sharing that lane, left-to-right. */
  lanes: IPositionedBar[][];
  /** Number of lanes (>= 1, so every member keeps a visible row). */
  laneCount: number;
}

/** The fully-positioned view for one month, ready to render on a CSS grid. */
export interface ITeamCalendarView {
  year: number;
  /** 0-based month (0 = January). */
  month: number;
  /** e.g. "March 2026". */
  monthLabel: string;
  /** Number of day columns (28–31). */
  daysInMonth: number;
  days: ICalendarDay[];
  rows: ICalendarMemberRow[];
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** ISO 'YYYY-MM-DD' -> whole-day ordinal (UTC), for timezone-safe arithmetic. */
function isoToOrdinal(iso: string): number {
  const parts = iso.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * Greedy interval partitioning: place each bar (already sorted by startCol) onto
 * the first lane whose previous bar ends before this one starts; otherwise open
 * a new lane. Produces the minimum number of non-overlapping lanes.
 */
function packLanes(bars: IPositionedBar[]): IPositionedBar[][] {
  const lanes: IPositionedBar[][] = [];
  const sorted = bars
    .slice()
    .sort((a, b) => (a.startCol !== b.startCol ? a.startCol - b.startCol : a.endCol - b.endCol));

  for (const bar of sorted) {
    let placed = false;
    for (const lane of lanes) {
      const last = lane[lane.length - 1];
      if (last.endCol < bar.startCol) {
        lane.push(bar);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([bar]);
    }
  }
  return lanes;
}

/**
 * Build the positioned calendar view for a single month.
 *
 * @param calRows  per-member absence rows (from deriveTeamCalendar)
 * @param year     full year, e.g. 2026
 * @param month    0-based month (0 = January)
 * @param todayIso YYYY-MM-DD marking "today" (caller supplies, keeps this pure)
 */
export function buildTeamCalendarView(
  calRows: readonly ITeamCalendarRow[],
  year: number,
  month: number,
  todayIso: string
): ITeamCalendarView {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthStartOrdinal = isoToOrdinal(`${year}-${pad2(month + 1)}-01`);
  const monthEndOrdinal = monthStartOrdinal + daysInMonth - 1;

  const days: ICalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    const weekday = new Date(Date.UTC(year, month, d)).getUTCDay();
    days.push({
      iso,
      day: d,
      weekday,
      isWeekend: weekday === 0 || weekday === 6,
      isToday: iso === todayIso
    });
  }

  const rows: ICalendarMemberRow[] = calRows.map((calRow) => {
    const positioned: IPositionedBar[] = [];
    for (const bar of calRow.bars) {
      const barStart = isoToOrdinal(bar.startDate);
      const barEnd = isoToOrdinal(bar.endDate);
      // Skip absences that don't intersect the visible month at all.
      if (barEnd < monthStartOrdinal || barStart > monthEndOrdinal) {
        continue;
      }
      const clampedStart = Math.max(barStart, monthStartOrdinal);
      const clampedEnd = Math.min(barEnd, monthEndOrdinal);
      positioned.push({
        bar,
        startCol: clampedStart - monthStartOrdinal + 1,
        endCol: clampedEnd - monthStartOrdinal + 1,
        clippedStart: barStart < monthStartOrdinal,
        clippedEnd: barEnd > monthEndOrdinal
      });
    }
    const lanes = packLanes(positioned);
    return {
      member: calRow.member,
      lanes,
      laneCount: Math.max(1, lanes.length)
    };
  });

  return {
    year,
    month,
    monthLabel: `${MONTH_NAMES[month]} ${year}`,
    daysInMonth,
    days,
    rows
  };
}

/** Step the (year, month) pair by ±1 month, rolling the year over. Pure. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}
