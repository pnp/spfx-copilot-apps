// Pure formatting helpers for the Time-Off UI. No React / Fluent imports so the
// logic stays trivially testable and reusable by the live data service later.

import type {
  IEmployeeProfile,
  ILeaveBalance,
  RequestStatus
} from '../data/types';

// Parse an ISO yyyy-mm-dd as a LOCAL date (avoids the UTC midnight shift that
// `new Date('2026-03-05')` would introduce). Returns an Invalid Date for any
// value that isn't a well-formed ISO date, so callers can guard instead of
// throwing — Intl.format() throws RangeError on an invalid Date.
function parseLocal(isoDate: string): Date {
  if (!isoDate) {
    return new Date(NaN);
  }
  const parts = isoDate.split('-');
  if (parts.length < 3) {
    return new Date(NaN);
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return new Date(NaN);
  }
  return new Date(y, m - 1, d);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Build an ISO yyyy-mm-dd from numeric parts, validating by round-tripping
// through a real Date so impossible dates (2026-13-40, 2026-02-30) yield ''.
function isoFromParts(year: number, month: number, day: number): string {
  if (!year || !month || !day) {
    return '';
  }
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return '';
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// Best-effort normalize a date string to ISO yyyy-mm-dd (local). Accepts the
// documented ISO form (optionally with a trailing time component) plus the
// common slash formats people type when testing the component by hand
// (mm/dd/yyyy, dd/mm/yyyy and their 2-digit-year variants). Day vs month is
// disambiguated when one part is clearly out of range; the ambiguous case
// defaults to month-first to match the en-US examples in the tool schema.
// Returns '' when the value can't be parsed into a real calendar date, so
// callers treat it as "no date" rather than crash on a malformed seed.
export function toIsoDate(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const raw = `${value}`.trim();
  if (!raw) {
    return '';
  }

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw);
  if (isoMatch) {
    return isoFromParts(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10),
      parseInt(isoMatch[3], 10)
    );
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(raw);
  if (slashMatch) {
    const first = parseInt(slashMatch[1], 10);
    const second = parseInt(slashMatch[2], 10);
    const yearRaw = parseInt(slashMatch[3], 10);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    // first > 12 can only be the day (dd/mm); otherwise assume mm/dd.
    const dayFirst = first > 12 && second <= 12;
    const month = dayFirst ? second : first;
    const day = dayFirst ? first : second;
    return isoFromParts(year, month, day);
  }

  return '';
}

const dayMonth = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric'
});

const dayMonthYear = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

export function formatDate(isoDate: string): string {
  const date = parseLocal(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate || '';
  }
  return dayMonthYear.format(date);
}

/** "Mar 5, 2026" for a single day, "Mar 5 – Mar 9, 2026" for a range. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseLocal(startIso);
  const end = parseLocal(endIso);
  const startValid = !Number.isNaN(start.getTime());
  const endValid = !Number.isNaN(end.getTime());

  // Never throw inside render: Intl.format() throws RangeError on an invalid
  // Date, so degrade gracefully if either bound failed to parse.
  if (!startValid || !endValid) {
    if (startValid) {
      return dayMonthYear.format(start);
    }
    if (endValid) {
      return dayMonthYear.format(end);
    }
    if (startIso === endIso) {
      return startIso || '';
    }
    return `${startIso || ''} \u2013 ${endIso || ''}`;
  }

  if (startIso === endIso) {
    return dayMonthYear.format(start);
  }
  const startPart =
    start.getFullYear() === end.getFullYear()
      ? dayMonth.format(start)
      : dayMonthYear.format(start);
  return `${startPart} \u2013 ${dayMonthYear.format(end)}`;
}

export function remainingDays(balance: ILeaveBalance): number {
  return balance.entitledDays - balance.usedDays - balance.pendingDays;
}

export function statusLabel(status: RequestStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending approval';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function daysLabel(n: number): string {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

// Header subtitle line built from the profile. Region and manager are joined
// with a middot, but each is included only when present — so the live profile
// (which may have no manager and/or no region yet) never renders a dangling
// separator like " \u00b7 Manager: ". When both are populated (the demo data)
// the output is identical to the previous inline markup.
export function profileSubtitle(profile: IEmployeeProfile): string {
  const parts: string[] = [];
  if (profile.region) {
    parts.push(profile.region);
  }
  if (profile.managerName) {
    parts.push(`Manager: ${profile.managerName}`);
  }
  return parts.join(' \u00b7 ');
}
