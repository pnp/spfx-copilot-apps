// Unit tests for the pure off-work calendar model. Deterministic: a fixed
// "today" of 2026-03-15 and hand-built requests, so month windows and off-day
// math are fully predictable with no reliance on the real clock.

import type { ITimeOffRequest } from '../data/types';
import {
  collectOffDates,
  buildCalendar,
  ICalendarDay
} from '../logic/offWorkCalendar';

const TODAY = '2026-03-15';

function req(partial: Partial<ITimeOffRequest>): ITimeOffRequest {
  return {
    id: partial.id ?? 'r1',
    leaveType: partial.leaveType ?? 'vacation',
    startDate: partial.startDate ?? '2026-03-10',
    endDate: partial.endDate ?? '2026-03-12',
    workingDays: partial.workingDays ?? 3,
    status: partial.status ?? 'approved',
    note: partial.note,
    submittedOn: partial.submittedOn ?? '2026-03-01',
    approverName: partial.approverName
  };
}

function flatten(
  weeks: ReadonlyArray<ReadonlyArray<ICalendarDay | undefined>>
): ICalendarDay[] {
  const out: ICalendarDay[] = [];
  weeks.forEach((w) =>
    w.forEach((c) => {
      if (c) {
        out.push(c);
      }
    })
  );
  return out;
}

describe('collectOffDates', () => {
  it('expands an approved inclusive range into every date (approved status)', () => {
    const off = collectOffDates([req({ startDate: '2026-03-10', endDate: '2026-03-12' })]);
    expect(Array.from(off.keys()).sort()).toEqual([
      '2026-03-10',
      '2026-03-11',
      '2026-03-12'
    ]);
    expect(off.get('2026-03-11')).toBe('approved');
  });

  it('includes pending requests tagged as pending', () => {
    const off = collectOffDates([
      req({ id: 'p', status: 'pending', startDate: '2026-03-10', endDate: '2026-03-12' })
    ]);
    expect(Array.from(off.keys()).sort()).toEqual([
      '2026-03-10',
      '2026-03-11',
      '2026-03-12'
    ]);
    expect(off.get('2026-03-11')).toBe('pending');
  });

  it('ignores declined and cancelled requests', () => {
    const off = collectOffDates([
      req({ id: 'd', status: 'declined', startDate: '2026-03-20', endDate: '2026-03-21' }),
      req({ id: 'c', status: 'cancelled', startDate: '2026-03-25', endDate: '2026-03-26' })
    ]);
    expect(off.size).toBe(0);
  });

  it('lets approved win over an overlapping pending range', () => {
    const off = collectOffDates([
      req({ id: 'p', status: 'pending', startDate: '2026-03-10', endDate: '2026-03-14' }),
      req({ id: 'a', status: 'approved', startDate: '2026-03-12', endDate: '2026-03-16' })
    ]);
    // Pending-only edges stay pending; the overlap and approved-only edges win green.
    expect(off.get('2026-03-10')).toBe('pending');
    expect(off.get('2026-03-11')).toBe('pending');
    expect(off.get('2026-03-12')).toBe('approved');
    expect(off.get('2026-03-14')).toBe('approved');
    expect(off.get('2026-03-16')).toBe('approved');
  });

  it('lets approved win regardless of request order', () => {
    const off = collectOffDates([
      req({ id: 'a', status: 'approved', startDate: '2026-03-12', endDate: '2026-03-16' }),
      req({ id: 'p', status: 'pending', startDate: '2026-03-10', endDate: '2026-03-14' })
    ]);
    expect(off.get('2026-03-12')).toBe('approved');
    expect(off.get('2026-03-13')).toBe('approved');
  });

  it('skips inverted ranges (end before start)', () => {
    const off = collectOffDates([req({ startDate: '2026-03-12', endDate: '2026-03-10' })]);
    expect(off.size).toBe(0);
  });

  it('skips malformed dates', () => {
    const off = collectOffDates([req({ startDate: 'not-a-date', endDate: '' })]);
    expect(off.size).toBe(0);
  });

  it('spans across a month boundary', () => {
    const off = collectOffDates([req({ startDate: '2026-03-30', endDate: '2026-04-02' })]);
    expect(Array.from(off.keys()).sort()).toEqual([
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-04-02'
    ]);
  });
});

describe('buildCalendar', () => {
  it('renders the current month plus two forward months', () => {
    const months = buildCalendar([req({})], TODAY);
    expect(months.map((m) => m.label)).toEqual([
      'March 2026',
      'April 2026',
      'May 2026'
    ]);
  });

  it('marks the approved days off in March', () => {
    const months = buildCalendar([req({ startDate: '2026-03-10', endDate: '2026-03-12' })], TODAY);
    const march = months.find((m) => m.month === 3);
    expect(march).toBeDefined();
    const offDays = flatten(march!.weeks)
      .filter((c) => c.isOff)
      .map((c) => c.day)
      .sort((a, b) => a - b);
    expect(offDays).toEqual([10, 11, 12]);
  });

  it('marks pending days separately from approved days', () => {
    const months = buildCalendar(
      [
        req({ id: 'a', status: 'approved', startDate: '2026-03-10', endDate: '2026-03-12' }),
        req({ id: 'p', status: 'pending', startDate: '2026-03-18', endDate: '2026-03-19' })
      ],
      TODAY
    );
    const march = months.find((m) => m.month === 3)!;
    const cells = flatten(march.weeks);
    const offDays = cells
      .filter((c) => c.isOff)
      .map((c) => c.day)
      .sort((a, b) => a - b);
    const pendingDays = cells
      .filter((c) => c.isPending)
      .map((c) => c.day)
      .sort((a, b) => a - b);
    expect(offDays).toEqual([10, 11, 12]);
    expect(pendingDays).toEqual([18, 19]);
    // A day is never both at once.
    expect(cells.some((c) => c.isOff && c.isPending)).toBe(false);
  });

  it('flags today', () => {
    const months = buildCalendar([req({})], TODAY);
    const march = months.find((m) => m.month === 3)!;
    const todays = flatten(march.weeks).filter((c) => c.isToday);
    expect(todays).toHaveLength(1);
    expect(todays[0].day).toBe(15);
  });

  it('produces full 7-column weeks', () => {
    const months = buildCalendar([req({})], TODAY);
    months.forEach((m) =>
      m.weeks.forEach((w) => expect(w).toHaveLength(7))
    );
  });

  it('still shows the forward window when there are no requests', () => {
    const months = buildCalendar([], TODAY);
    expect(months.map((m) => m.label)).toEqual([
      'March 2026',
      'April 2026',
      'May 2026'
    ]);
    months.forEach((m) =>
      flatten(m.weeks).forEach((c) => {
        expect(c.isOff).toBe(false);
        expect(c.isPending).toBe(false);
      })
    );
  });

  it('extends the window backward to cover past approved leave', () => {
    const months = buildCalendar(
      [req({ startDate: '2026-01-05', endDate: '2026-01-07' })],
      TODAY
    );
    // January (past leave) through May (today + 2).
    expect(months.map((m) => m.label)).toEqual([
      'January 2026',
      'February 2026',
      'March 2026',
      'April 2026',
      'May 2026'
    ]);
    const jan = months.find((m) => m.month === 1)!;
    const offDays = flatten(jan.weeks)
      .filter((c) => c.isOff)
      .map((c) => c.day)
      .sort((a, b) => a - b);
    expect(offDays).toEqual([5, 6, 7]);
  });
});
