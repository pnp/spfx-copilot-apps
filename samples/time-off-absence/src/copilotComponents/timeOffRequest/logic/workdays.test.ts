import { workingDaysBetween } from './workdays';
import type { ICompanyHoliday } from '../../timeOffOverview/data/types';

describe('workingDaysBetween', () => {
  it('counts a single weekday as 1', () => {
    // 2026-03-05 is a Thursday.
    expect(workingDaysBetween('2026-03-05', '2026-03-05')).toBe(1);
  });

  it('returns 0 for a single weekend day', () => {
    // 2026-03-07 is a Saturday.
    expect(workingDaysBetween('2026-03-07', '2026-03-07')).toBe(0);
  });

  it('excludes weekends across a full Mon-Sun week (= 5)', () => {
    // 2026-03-02 Mon .. 2026-03-08 Sun.
    expect(workingDaysBetween('2026-03-02', '2026-03-08')).toBe(5);
  });

  it('excludes company holidays inside the range', () => {
    const holidays: ICompanyHoliday[] = [
      { date: '2026-03-04', name: 'Demo holiday' } // Wednesday
    ];
    // Mon-Fri = 5 working days, minus the Wed holiday = 4.
    expect(workingDaysBetween('2026-03-02', '2026-03-06', holidays)).toBe(4);
  });

  it('returns 0 when end is before start', () => {
    expect(workingDaysBetween('2026-03-06', '2026-03-02')).toBe(0);
  });

  it('returns 0 for empty input', () => {
    expect(workingDaysBetween('', '')).toBe(0);
  });
});
