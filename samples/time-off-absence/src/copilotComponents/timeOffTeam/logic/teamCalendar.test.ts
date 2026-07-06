// Unit tests for the pure team-calendar view builder (month grid + lane packing).

import { buildTeamCalendarView, shiftMonth } from './teamCalendar';
import type { ITeamCalendarRow, ITeamMember, ITeamCalendarBar } from '../data/types';

const MEMBER: ITeamMember = { email: 'me@contoso.com', displayName: 'Me', relationship: 'self' };

function bar(partial: Partial<ITeamCalendarBar> & Pick<ITeamCalendarBar, 'requestId'>): ITeamCalendarBar {
  return {
    leaveType: 'vacation',
    status: 'approved',
    startDate: '2026-03-03',
    endDate: '2026-03-05',
    workingDays: 3,
    ...partial
  };
}

function calRow(bars: ITeamCalendarBar[], member: ITeamMember = MEMBER): ITeamCalendarRow {
  return { member, bars };
}

describe('buildTeamCalendarView', () => {
  it('produces one day column per calendar day with correct weekend/today flags', () => {
    const view = buildTeamCalendarView([], 2026, 2 /* March */, '2026-03-15');
    expect(view.daysInMonth).toBe(31);
    expect(view.days.length).toBe(31);
    expect(view.monthLabel).toBe('March 2026');
    // 2026-03-01 is a Sunday.
    expect(view.days[0]).toEqual({ iso: '2026-03-01', day: 1, weekday: 0, isWeekend: true, isToday: false });
    const today = view.days.filter((d) => d.iso === '2026-03-15')[0];
    expect(today.isToday).toBe(true);
    // 2026-03-14 is a Saturday.
    expect(view.days.filter((d) => d.iso === '2026-03-14')[0].isWeekend).toBe(true);
  });

  it('handles February in a leap year', () => {
    const view = buildTeamCalendarView([], 2028, 1 /* Feb */, '2028-01-01');
    expect(view.daysInMonth).toBe(29);
  });

  it('positions a bar onto the right 1-based day columns', () => {
    const view = buildTeamCalendarView(
      [calRow([bar({ requestId: 'A', startDate: '2026-03-03', endDate: '2026-03-05' })])],
      2026,
      2,
      '2026-03-15'
    );
    const positioned = view.rows[0].lanes[0][0];
    expect(positioned.startCol).toBe(3);
    expect(positioned.endCol).toBe(5);
    expect(positioned.clippedStart).toBe(false);
    expect(positioned.clippedEnd).toBe(false);
  });

  it('clips a bar that starts before and ends after the visible month', () => {
    const view = buildTeamCalendarView(
      [calRow([bar({ requestId: 'A', startDate: '2026-02-25', endDate: '2026-04-04' })])],
      2026,
      2,
      '2026-03-15'
    );
    const positioned = view.rows[0].lanes[0][0];
    expect(positioned.startCol).toBe(1);
    expect(positioned.endCol).toBe(31);
    expect(positioned.clippedStart).toBe(true);
    expect(positioned.clippedEnd).toBe(true);
  });

  it('drops bars that do not intersect the visible month', () => {
    const view = buildTeamCalendarView(
      [calRow([bar({ requestId: 'A', startDate: '2026-01-01', endDate: '2026-01-05' })])],
      2026,
      2,
      '2026-03-15'
    );
    expect(view.rows[0].lanes).toEqual([]);
    expect(view.rows[0].laneCount).toBe(1);
  });

  it('packs overlapping bars onto separate lanes but shares a lane when disjoint', () => {
    const view = buildTeamCalendarView(
      [
        calRow([
          bar({ requestId: 'A', startDate: '2026-03-02', endDate: '2026-03-06' }),
          bar({ requestId: 'B', startDate: '2026-03-04', endDate: '2026-03-08' }), // overlaps A -> lane 2
          bar({ requestId: 'C', startDate: '2026-03-10', endDate: '2026-03-12' }) // after A -> shares lane 1
        ])
      ],
      2026,
      2,
      '2026-03-15'
    );
    const lanes = view.rows[0].lanes;
    expect(lanes.length).toBe(2);
    expect(lanes[0].map((p) => p.bar.requestId)).toEqual(['A', 'C']);
    expect(lanes[1].map((p) => p.bar.requestId)).toEqual(['B']);
    expect(view.rows[0].laneCount).toBe(2);
  });

  it('keeps every member as a row, even with zero bars (laneCount >= 1)', () => {
    const empty: ITeamMember = { email: 'x@contoso.com', displayName: 'X', relationship: 'peer' };
    const view = buildTeamCalendarView([calRow([], empty)], 2026, 2, '2026-03-15');
    expect(view.rows.length).toBe(1);
    expect(view.rows[0].laneCount).toBe(1);
    expect(view.rows[0].lanes).toEqual([]);
  });
});

describe('shiftMonth', () => {
  it('steps forward within a year', () => {
    expect(shiftMonth(2026, 2, 1)).toEqual({ year: 2026, month: 3 });
  });

  it('rolls over the year boundary forward', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it('rolls over the year boundary backward', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });

  it('handles multi-month jumps', () => {
    expect(shiftMonth(2026, 2, -5)).toEqual({ year: 2025, month: 9 });
  });
});
