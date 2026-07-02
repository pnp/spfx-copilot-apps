import type { IMyDayData } from '../models/myDay';

/**
 * Builds a short, personalized day-summary sentence for the inline greeting —
 * the same data-driven tone as the "Plan my day" briefing, condensed to a
 * single sub-line. Derived entirely from the live-resolved data and `now`.
 */
export const buildDaySummary = (data: IMyDayData, now: Date): string => {
  const meetingsAhead = data.meetings.filter((m) => m.end.getTime() > now.getTime()).length;
  const openTasks = data.tasks.filter((t) => !t.completed);
  const highTasks = openTasks.filter((t) => t.importance === 'high').length;

  const parts: string[] = [];
  if (meetingsAhead > 0) {
    parts.push(`${meetingsAhead} meeting${meetingsAhead === 1 ? '' : 's'}`);
  }
  if (highTasks > 0) {
    parts.push(`${highTasks} high-priority task${highTasks === 1 ? '' : 's'}`);
  } else if (openTasks.length > 0) {
    parts.push(`${openTasks.length} task${openTasks.length === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) {
    return 'You’re all caught up — enjoy the focus time.';
  }

  return `You have ${parts.join(' and ')} ahead.`;
};
