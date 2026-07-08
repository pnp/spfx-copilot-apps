import { mapEventsToConflicts, sampleConflicts } from './conflicts';
import type { IGraphCalendarEvent } from './conflicts';

describe('mapEventsToConflicts', () => {
  it('keeps blocking events (busy/oof) and drops free ones', () => {
    const events: IGraphCalendarEvent[] = [
      {
        subject: 'Busy mtg',
        showAs: 'busy',
        start: { dateTime: '2026-03-05T10:00:00' },
        end: { dateTime: '2026-03-05T11:00:00' }
      },
      {
        subject: 'Free block',
        showAs: 'free',
        start: { dateTime: '2026-03-05T12:00:00' },
        end: { dateTime: '2026-03-05T13:00:00' }
      },
      {
        subject: 'OOO',
        showAs: 'oof',
        isAllDay: true,
        start: { dateTime: '2026-03-06T00:00:00' },
        end: { dateTime: '2026-03-07T00:00:00' }
      }
    ];
    const result = mapEventsToConflicts(events);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.subject)).toEqual(['Busy mtg', 'OOO']);
  });

  it('defaults a missing showAs to busy and a missing subject', () => {
    const result = mapEventsToConflicts([
      { start: { dateTime: 'x' }, end: { dateTime: 'y' } }
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('(no subject)');
    expect(result[0].showAs).toBe('busy');
  });
});

describe('sampleConflicts', () => {
  it('returns one busy item on the start day', () => {
    const s = sampleConflicts('2026-03-05', '2026-03-06');
    expect(s).toHaveLength(1);
    expect(s[0].startDateTime).toContain('2026-03-05');
    expect(s[0].showAs).toBe('busy');
  });

  it('returns empty for an invalid range', () => {
    expect(sampleConflicts('2026-03-06', '2026-03-05')).toHaveLength(0);
  });
});
