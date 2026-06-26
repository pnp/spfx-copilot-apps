/** Lightweight relative-time formatting for the My Day views. */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Format a future time relative to `now`, e.g. "in 18 min", "in 2 h", "now".
 * Falls back to "started" for times already in the past.
 */
export const formatTimeUntil = (target: Date, now: Date = new Date()): string => {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return 'started';
  }
  if (diff < MINUTE) {
    return 'now';
  }
  if (diff < HOUR) {
    return `in ${Math.round(diff / MINUTE)} min`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    const mins = Math.round((diff % HOUR) / MINUTE);
    return mins > 0 ? `in ${hours} h ${mins} min` : `in ${hours} h`;
  }
  const days = Math.round(diff / DAY);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
};

/**
 * Format a past time relative to `now`, e.g. "just now", "12 min ago", "1 h ago",
 * "2 days ago".
 */
export const formatTimeAgo = (target: Date, now: Date = new Date()): string => {
  const diff = now.getTime() - target.getTime();
  if (diff < MINUTE) {
    return 'just now';
  }
  if (diff < HOUR) {
    return `${Math.round(diff / MINUTE)} min ago`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)} h ago`;
  }
  const days = Math.round(diff / DAY);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};

/** Format a clock time range, e.g. "10:00 – 10:30". */
export const formatTimeRange = (start: Date, end: Date): string => {
  const fmt = (d: Date): string =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(start)} – ${fmt(end)}`;
};

/** Format a single clock time, e.g. "10:00". */
export const formatTime = (date: Date): string =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

/** Format a full, human date line, e.g. "Wednesday, June 25, 2026" (user locale). */
export const formatFullDate = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
