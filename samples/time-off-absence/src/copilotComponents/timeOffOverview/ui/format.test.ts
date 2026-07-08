import { toIsoDate, formatDate, formatDateRange } from './format';

describe('toIsoDate', () => {
  it('passes through a well-formed ISO date', () => {
    expect(toIsoDate('2026-06-23')).toBe('2026-06-23');
  });

  it('zero-pads single-digit ISO month/day', () => {
    expect(toIsoDate('2026-6-3')).toBe('2026-06-03');
  });

  it('drops a trailing time component', () => {
    expect(toIsoDate('2026-06-23T10:00:00Z')).toBe('2026-06-23');
  });

  it('parses US mm/dd/yyyy', () => {
    expect(toIsoDate('06/23/2026')).toBe('2026-06-23');
  });

  it('parses unambiguous EU dd/mm/yyyy', () => {
    expect(toIsoDate('25/06/2026')).toBe('2026-06-25');
  });

  it('expands a 2-digit year', () => {
    expect(toIsoDate('06/23/26')).toBe('2026-06-23');
  });

  it('defaults the ambiguous slash case to month-first', () => {
    expect(toIsoDate('06/07/2026')).toBe('2026-06-07');
  });

  it('returns empty string for an impossible calendar date', () => {
    expect(toIsoDate('2026-02-30')).toBe('');
    expect(toIsoDate('13/13/2026')).toBe('');
  });

  it('returns empty string for junk or missing input', () => {
    expect(toIsoDate('not a date')).toBe('');
    expect(toIsoDate('')).toBe('');
    expect(toIsoDate(undefined)).toBe('');
  });
});

describe('formatDate (defensive)', () => {
  it('formats a valid ISO date', () => {
    // Locale-independent: assert the year is present and that it did not throw.
    expect(formatDate('2026-06-23')).toMatch(/2026/);
  });

  it('returns the raw value instead of throwing on a bad date', () => {
    expect(() => formatDate('06/23/2026')).not.toThrow();
    expect(formatDate('06/23/2026')).toBe('06/23/2026');
  });
});

describe('formatDateRange (defensive)', () => {
  it('never throws on an off-contract range (the reported crash)', () => {
    expect(() => formatDateRange('06/23/2026', '06/25/2026')).not.toThrow();
  });

  it('echoes raw bounds when both are unparseable', () => {
    expect(formatDateRange('a', 'b')).toBe('a \u2013 b');
  });

  it('formats a valid single day', () => {
    expect(formatDateRange('2026-06-23', '2026-06-23')).toMatch(/2026/);
  });

  it('formats a valid multi-day range with an en-dash', () => {
    const out = formatDateRange('2026-06-23', '2026-06-25');
    expect(out).toMatch(/2026/);
    expect(out).toContain('\u2013');
  });
});
