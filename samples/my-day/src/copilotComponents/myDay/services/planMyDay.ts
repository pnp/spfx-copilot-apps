import type { IFocusItem, IFocusPlan } from '../models/focusPlan';
import type { IMyDayData } from '../models/myDay';
import { formatTimeRange, formatTimeUntil } from '../utils/datetime';
import { getGreeting, type TimeOfDay } from '../utils/greeting';

const joinWithAnd = (parts: string[]): string => {
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
};

/** Natural-language phrase for the current part of the day. */
const timeOfDayPhrase = (timeOfDay: TimeOfDay): string => {
  switch (timeOfDay) {
    case 'morning':
      return 'this morning';
    case 'afternoon':
      return 'this afternoon';
    case 'evening':
      return 'this evening';
    default:
      return 'today';
  }
};

const buildHeadline = (
  firstName: string,
  now: Date,
  meetingCount: number,
  highTaskCount: number,
  importantMailCount: number,
  items: IFocusItem[]
): string => {
  const greeting = getGreeting(now);
  const name = firstName || 'there';
  const lead = `${greeting.text}, ${name}.`;

  if (items.length === 0) {
    return `${lead} You're in good shape — nothing urgent right now. Enjoy the focus time.`;
  }

  const parts: string[] = [];
  if (meetingCount > 0) {
    parts.push(`${meetingCount} meeting${meetingCount === 1 ? '' : 's'}`);
  }
  if (highTaskCount > 0) {
    parts.push(`${highTaskCount} high-priority task${highTaskCount === 1 ? '' : 's'}`);
  }
  if (importantMailCount > 0) {
    parts.push(`${importantMailCount} important message${importantMailCount === 1 ? '' : 's'}`);
  }

  const when = timeOfDayPhrase(greeting.timeOfDay);
  const summary =
    parts.length > 0
      ? `You have ${joinWithAnd(parts)} ${when}.`
      : `Here's where to focus ${when}.`;

  const first = items[0].title.replace(/^Prepare for /, '').replace(/"/g, '');
  return `${lead} ${summary} Start with ${first}.`;
};

/**
 * Deterministic, mock "Plan my day" recommendation engine.
 *
 * Ranks the day's signals (imminent meetings, high-importance tasks due today,
 * important unread mail, and available focus time) into a short prioritized
 * briefing. **No AI / WorkIQ API is called** — the plan is derived entirely from
 * the live-resolved mock data and `now`, so it shifts with the time of day. The
 * future live integration would return the same {@link IFocusPlan} shape, so the
 * panel UI is unchanged.
 */
export const planMyDay = (data: IMyDayData, now: Date): IFocusPlan => {
  const items: IFocusItem[] = [];

  const isSameDay = (d: Date): boolean =>
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const upcomingMeetings = data.meetings
    .filter((m) => m.end.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const openTasks = data.tasks.filter((t) => !t.completed);
  const highTasks = openTasks
    .filter((t) => t.importance === 'high')
    .sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity));
  const tasksDueToday = openTasks.filter((t) => t.due && isSameDay(t.due));

  const importantMail = data.mail.filter(
    (m) => !m.isRead && (m.importance === 'high' || m.flagged)
  );

  // 1) The next meeting — prep / join.
  const nextMeeting = upcomingMeetings[0];
  if (nextMeeting) {
    items.push({
      id: `focus-meeting-${nextMeeting.id}`,
      title: `Prepare for "${nextMeeting.subject}"`,
      reason: `Starts ${formatTimeUntil(nextMeeting.start, now)}${
        nextMeeting.isOnline ? ' · online' : nextMeeting.location ? ` · ${nextMeeting.location}` : ''
      }`,
      suggestedTime: formatTimeRange(nextMeeting.start, nextMeeting.end),
      source: 'meeting',
      importance: nextMeeting.importance
    });
  }

  // 2) High-importance tasks (up to two).
  highTasks.slice(0, 2).forEach((t) => {
    items.push({
      id: `focus-task-${t.id}`,
      title: t.title,
      reason: t.due ? `High priority · due ${formatTimeUntil(t.due, now)}` : 'High priority',
      source: 'task',
      importance: 'high'
    });
  });

  // 3) Most pressing important / flagged unread mail.
  const topMail = importantMail[0];
  if (topMail) {
    items.push({
      id: `focus-mail-${topMail.id}`,
      title: `Reply to ${topMail.from}`,
      reason: `${topMail.flagged ? 'Flagged' : 'Important'} · "${topMail.subject}"`,
      source: 'mail',
      importance: topMail.importance
    });
  }

  // 4) Protect focus time if the schedule allows it.
  if (upcomingMeetings.length <= 3 && openTasks.length > 0) {
    items.push({
      id: 'focus-deep-work',
      title: 'Protect focus time',
      reason: `Block ~45 min for ${tasksDueToday.length || openTasks.length} task${
        (tasksDueToday.length || openTasks.length) === 1 ? '' : 's'
      } before the day fills up`,
      source: 'focus',
      importance: 'normal'
    });
  }

  const top = items.slice(0, 5);

  const headline = buildHeadline(
    data.user.firstName,
    now,
    upcomingMeetings.length,
    highTasks.length,
    importantMail.length,
    top
  );

  return { headline, items: top };
};
