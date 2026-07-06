// Working-day calculator for the Time-Off Request component.
//
// Pure: no React / Fluent / SPFx imports, so it stays trivially unit-testable
// and can be reused by the live data service later. Counts business days
// inclusive of both ends, excluding weekends and the supplied company holidays.

import type { ICompanyHoliday } from '../../timeOffOverview/data/types';

// Parse an ISO yyyy-mm-dd as a LOCAL date (avoids the UTC midnight shift that
// `new Date('2026-03-05')` would introduce).
function parseLocal(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d);
}

// Reformat a local Date back to ISO yyyy-mm-dd so it matches holiday keys.
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Inclusive count of working days between two ISO dates, excluding weekends and
 * the supplied company holidays. Returns 0 for missing input or an invalid
 * range (end before start).
 */
export function workingDaysBetween(
  startIso: string,
  endIso: string,
  holidays: ReadonlyArray<ICompanyHoliday> = []
): number {
  if (!startIso || !endIso) {
    return 0;
  }

  const start = parseLocal(startIso);
  const end = parseLocal(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }
  if (end < start) {
    return 0;
  }

  const holidayDates = new Set(holidays.map((h) => h.date));
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  let count = 0;
  for (let i = 0; i <= totalDays; i += 1) {
    const cursor = new Date(start);
    cursor.setDate(start.getDate() + i);
    if (!isWeekend(cursor) && !holidayDates.has(toIso(cursor))) {
      count += 1;
    }
  }
  return count;
}
