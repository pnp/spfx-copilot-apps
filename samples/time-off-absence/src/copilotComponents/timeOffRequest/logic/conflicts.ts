// Calendar-conflict mapping for the Time-Off Request component.
//
// The component class makes the live, delegated Microsoft Graph call
// (/me/calendarView) — the headline capability of SPFx Copilot Components — and
// hands the raw payload to `mapEventsToConflicts` here. Keeping the mapping pure
// (no Graph client) makes it unit-testable and keeps the class thin.

// Minimal shape of a Microsoft Graph calendar event. Hand-rolled instead of
// taking a dependency on @microsoft/microsoft-graph-types for a few fields.
export interface IGraphCalendarEvent {
  subject?: string;
  isAllDay?: boolean;
  // 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown'
  showAs?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
}

// A calendar item that overlaps the requested leave range.
export interface ICalendarConflict {
  subject: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  showAs: string;
}

// Where the conflict list came from. Surfaced in the UI so the demo is honest
// about whether the live calendar was actually reached.
export type ConflictSource = 'graph' | 'sample' | 'none';

export interface IConflictCheckResult {
  source: ConflictSource;
  conflicts: ICalendarConflict[];
  // Populated when the live Graph call failed and we fell back to sample data.
  message?: string;
}

// Only these free/busy states genuinely block a day off. 'free' events (e.g.
// informational holds) are ignored.
const BLOCKING_SHOW_AS = new Set(['busy', 'oof', 'tentative', 'workingelsewhere']);

/**
 * Map a raw Graph /me/calendarView payload to the conflict rows the UI shows.
 * Pure and defensive: tolerates partially-populated events.
 */
export function mapEventsToConflicts(
  events: ReadonlyArray<IGraphCalendarEvent>
): ICalendarConflict[] {
  const conflicts: ICalendarConflict[] = [];
  for (const ev of events) {
    const showAs = (ev.showAs || 'busy').toLowerCase();
    if (!BLOCKING_SHOW_AS.has(showAs)) {
      continue;
    }
    conflicts.push({
      subject: ev.subject || '(no subject)',
      startDateTime: (ev.start && ev.start.dateTime) || '',
      endDateTime: (ev.end && ev.end.dateTime) || '',
      isAllDay: Boolean(ev.isAllDay),
      showAs
    });
  }
  return conflicts;
}

/**
 * Deterministic sample conflicts used when the live Graph call can't run
 * (SharePoint Workbench, or Calendars.Read not yet admin-approved). Places one
 * busy meeting on the first selected day so the conflict UX still demonstrates.
 */
export function sampleConflicts(
  startIso: string,
  endIso: string
): ICalendarConflict[] {
  if (!startIso || !endIso || endIso < startIso) {
    return [];
  }
  return [
    {
      subject: 'Sprint planning',
      startDateTime: `${startIso}T10:00:00`,
      endDateTime: `${startIso}T11:00:00`,
      isAllDay: false,
      showAs: 'busy'
    }
  ];
}
