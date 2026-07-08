// Shared, delegated client-side Microsoft Graph call — the headline capability
// of SPFx Copilot Components over generic MCP apps. Queries the signed-in user's
// /me/calendarView across a requested leave range and maps blocking meetings to
// conflict rows, using the user's own identity straight from the browser.
//
// Both component classes use this single helper:
//   * the Request component (B) checks conflicts as the user picks dates;
//   * the Overview component (A) hands the same checker to the embedded request
//     form so the inline "Request time off" path keeps the identical live-
//     calendar showcase.
// Centralizing it keeps the one Graph call DRY across the two entry points.
//
// Never throws to the caller: on any failure (Workbench, Calendars.Read not yet
// consented, or offline) it returns deterministic sample data tagged
// source:'sample' so the conflict UX always demonstrates and stays honest about
// where the data came from.

import type { CopilotComponentContext } from '@microsoft/sp-copilot-component';

import {
  mapEventsToConflicts,
  sampleConflicts,
  type IGraphCalendarEvent,
  type IConflictCheckResult
} from './conflicts';

export async function loadCalendarConflicts(
  context: CopilotComponentContext,
  startIso: string,
  endIso: string
): Promise<IConflictCheckResult> {
  try {
    const client = await context.msGraphClientFactory.getClient('3');
    // calendarView needs a datetime window; widen the date-only inputs to the
    // full days and ask for UTC so the returned start/end are unambiguous.
    const startDateTime = `${startIso}T00:00:00`;
    const endDateTime = `${endIso}T23:59:59`;
    const response = await client
      .api('/me/calendarView')
      .header('Prefer', 'outlook.timezone="UTC"')
      .query({ startDateTime, endDateTime })
      .select('subject,start,end,showAs,isAllDay')
      .orderby('start/dateTime')
      .top(50)
      .get();

    const events: IGraphCalendarEvent[] =
      (response && (response.value as IGraphCalendarEvent[])) || [];
    return {
      source: 'graph',
      conflicts: mapEventsToConflicts(events)
    };
  } catch {
    // Workbench, missing Calendars.Read consent, or offline. Fall back so the
    // conflict UX always demonstrates, and be honest about the source.
    return {
      source: 'sample',
      conflicts: sampleConflicts(startIso, endIso),
      message:
        'Showing sample calendar data \u2014 connect your Microsoft 365 ' +
        'calendar (Calendars.Read) to check live conflicts.'
    };
  }
}
