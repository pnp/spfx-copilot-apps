// Pure, framework-agnostic calendar model for the Time-Off Overview fullscreen
// view. It turns the requests into a map of "off work" dates (approved vs
// pending) and lays those out as a sequence of month grids whose cells are plain
// day numbers, so the UI can render several months at once and paint approved
// days green and pending days yellow.
//
// No React / Fluent / SPFx imports on purpose: every bit of date math lives here
// and is unit-tested in isolation (see offWorkCalendar.test.ts). The UI component
// (OffWorkCalendar.tsx) is a thin renderer over the ICalendarMonth[] this emits.

import type { ITimeOffRequest } from '../data/types';

// Which kind of request a calendar day falls inside. Approved outranks pending so
// a confirmed day off is never downgraded to the pending tint on overlap.
export type OffStatus = 'approved' | 'pending';

export interface ICalendarDay {
  iso: string; // yyyy-mm-dd
  day: number; // 1-31
  isOff: boolean; // falls inside an approved request's inclusive range (green)
  isPending: boolean; // falls inside a pending request's inclusive range (yellow)
  isToday: boolean;
}

export interface ICalendarMonth {
  year: number;
  month: number; // 1-12
  label: string; // e.g. "March 2026"
  // Monday-first weeks. Each row is exactly 7 entries; undefined entries are the
  // leading/trailing blanks that pad the first and last weeks.
  weeks: ReadonlyArray<ReadonlyArray<ICalendarDay | undefined>>;
}

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

// Safety cap: a malformed (or absurdly long) request range can never spin the
// day-expansion loop forever.
const MAX_RANGE_DAYS = 366;
// Hard bound on how many month cards we ever produce, regardless of how far apart
// the approved requests sit.
const MAX_MONTHS = 18;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function isoOf(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// Parse yyyy-mm-dd into numeric parts. Returns undefined for anything that is not
// a well-formed ISO date so callers skip it rather than crash.
function parseIso(
  iso: string
): { y: number; m: number; d: number } | undefined {
  if (!iso) {
    return undefined;
  }
  const parts = iso.split('-');
  if (parts.length < 3) {
    return undefined;
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return undefined;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return undefined;
  }
  return { y, m, d };
}

function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

// Expand every APPROVED and PENDING request's inclusive [startDate, endDate] range
// into a map of ISO date -> status. Approved days are painted green ("off work")
// and pending days yellow, matching the colors of the approved / pending status
// badges. Approved always wins over pending where ranges overlap, so a confirmed
// day off is never downgraded to the pending tint.
export function collectOffDates(
  requests: readonly ITimeOffRequest[]
): Map<string, OffStatus> {
  const off = new Map<string, OffStatus>();
  for (const req of requests) {
    if (req.status !== 'approved' && req.status !== 'pending') {
      continue;
    }
    const start = parseIso(req.startDate);
    const end = parseIso(req.endDate);
    if (!start || !end) {
      continue;
    }
    const cursor = new Date(start.y, start.m - 1, start.d);
    const last = new Date(end.y, end.m - 1, end.d).getTime();
    if (cursor.getTime() > last) {
      continue;
    }
    let guard = 0;
    while (cursor.getTime() <= last && guard < MAX_RANGE_DAYS) {
      const iso = isoOf(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        cursor.getDate()
      );
      if (req.status === 'approved' || !off.has(iso)) {
        off.set(iso, req.status);
      }
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }
  }
  return off;
}

// Decide the inclusive run of months to render: every month touched by an off
// date, always anchored so it covers the current month plus the next two (so a
// fresh demo whose leave is all in the past still shows upcoming empty months).
// Bounded to MAX_MONTHS.
function monthSpan(
  offDates: Map<string, OffStatus>,
  todayIso: string
): Array<{ year: number; month: number }> {
  const indices: number[] = [];
  const today = parseIso(todayIso);
  if (today) {
    indices.push(monthIndex(today.y, today.m));
  }
  offDates.forEach((_status, iso) => {
    const p = parseIso(iso);
    if (p) {
      indices.push(monthIndex(p.y, p.m));
    }
  });
  if (indices.length === 0) {
    return [];
  }
  const min = Math.min(...indices);
  let max = Math.max(...indices);
  if (today) {
    // Guarantee a small forward window around "now" even when all leave is past.
    const t = monthIndex(today.y, today.m);
    if (t + 2 > max) {
      max = t + 2;
    }
  }
  if (max - min + 1 > MAX_MONTHS) {
    max = min + MAX_MONTHS - 1;
  }
  const result: Array<{ year: number; month: number }> = [];
  for (let idx = min; idx <= max; idx++) {
    result.push({ year: Math.floor(idx / 12), month: (idx % 12) + 1 });
  }
  return result;
}

function buildMonth(
  year: number,
  month: number,
  offDates: Map<string, OffStatus>,
  todayIso: string
): ICalendarMonth {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun..6=Sat
  const leading = (firstDow + 6) % 7; // shift so Monday is column 0
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: Array<ICalendarDay | undefined> = [];
  for (let i = 0; i < leading; i++) {
    cells.push(undefined);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoOf(year, month, day);
    const status = offDates.get(iso);
    cells.push({
      iso,
      day,
      isOff: status === 'approved',
      isPending: status === 'pending',
      isToday: iso === todayIso
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push(undefined);
  }

  const weeks: Array<Array<ICalendarDay | undefined>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    year,
    month,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    weeks
  };
}

// Top-level entry point: requests + "today" -> month grids ready to render. The
// off-date map (approved + pending) is computed once and shared across every month.
export function buildCalendar(
  requests: readonly ITimeOffRequest[],
  todayIso: string
): ICalendarMonth[] {
  const offDates = collectOffDates(requests);
  return monthSpan(offDates, todayIso).map((m) =>
    buildMonth(m.year, m.month, offDates, todayIso)
  );
}
