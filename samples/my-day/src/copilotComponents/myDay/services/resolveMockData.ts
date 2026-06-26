import type { IGraphDateTimeTimeZone, IGraphEvent, IGraphMessage, IGraphSitePage, IGraphTodoTask } from '../models/graph';
import type { IMockEventSeed, IMockMailSeed, IMockNewsSeed, IMockTaskSeed } from '../models/seeds';

/** Format a Date as an ISO-like local date-time string (no trailing Z). */
const toGraphDateTime = (date: Date, timeZone: string = 'UTC'): IGraphDateTimeTimeZone => ({
  dateTime: date.toISOString(),
  timeZone
});

const addMinutes = (base: Date, minutes: number): Date => new Date(base.getTime() + minutes * 60_000);

/**
 * Resolve mock seeds into fully Graph-shaped objects with absolute `dateTime`
 * values computed from `now`. Keeps the demo live and future-biased regardless
 * of when it is opened. The resulting objects match the real Graph payloads, so
 * the same mapper is reused by the future `GraphMyDayDataService`.
 */
export const resolveEvents = (seeds: IMockEventSeed[], now: Date): IGraphEvent[] =>
  seeds.map((s) => {
    const start = addMinutes(now, s.startOffsetMin);
    const end = addMinutes(start, s.durationMin);
    return {
      id: s.id,
      subject: s.subject,
      start: toGraphDateTime(start),
      end: toGraphDateTime(end),
      location: s.location,
      isOnlineMeeting: s.isOnlineMeeting,
      onlineMeeting: s.onlineMeeting,
      onlineMeetingProvider: s.onlineMeetingProvider,
      organizer: s.organizer,
      attendees: s.attendees,
      importance: s.importance,
      showAs: s.showAs,
      isAllDay: s.isAllDay,
      webLink: s.webLink
    };
  });

export const resolveTasks = (seeds: IMockTaskSeed[], now: Date): IGraphTodoTask[] =>
  seeds.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    importance: s.importance,
    dueDateTime: s.dueOffsetMin === undefined ? undefined : toGraphDateTime(addMinutes(now, s.dueOffsetMin)),
    completedDateTime:
      s.completedOffsetMin === undefined ? undefined : toGraphDateTime(addMinutes(now, s.completedOffsetMin)),
    categories: s.categories,
    webLink: s.webLink
  }));

export const resolveNews = (seeds: IMockNewsSeed[], now: Date): IGraphSitePage[] =>
  seeds.map((s) => {
    const published = addMinutes(now, s.publishedOffsetMin);
    return {
      id: s.id,
      title: s.title,
      name: s.name,
      webUrl: s.webUrl,
      description: s.description,
      thumbnailWebUrl: s.thumbnailWebUrl,
      bannerImageWebUrl: s.bannerImageWebUrl,
      createdDateTime: published.toISOString(),
      lastModifiedDateTime: published.toISOString(),
      promotionKind: s.promotionKind,
      category: s.category,
      author: s.author
    };
  });

export const resolveMail = (seeds: IMockMailSeed[], now: Date): IGraphMessage[] =>
  seeds.map((s) => ({
    id: s.id,
    subject: s.subject,
    bodyPreview: s.bodyPreview,
    from: s.from,
    receivedDateTime: addMinutes(now, s.receivedOffsetMin).toISOString(),
    isRead: s.isRead,
    importance: s.importance,
    hasAttachments: s.hasAttachments,
    flag: s.flag,
    webLink: s.webLink,
    senderPhotoUrl: s.senderPhotoUrl
  }));
