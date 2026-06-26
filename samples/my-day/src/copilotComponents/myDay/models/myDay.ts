/**
 * Lean view models the React components consume. These are produced by mapping
 * the Graph-shaped raw data (see `models/graph.ts`) and are intentionally flat
 * and UI-friendly.
 */

export type Importance = 'low' | 'normal' | 'high';

export interface IUser {
  id: string;
  displayName: string;
  firstName: string;
  photoUrl?: string;
}

export interface IMeeting {
  id: string;
  subject: string;
  /** Resolved absolute start time. */
  start: Date;
  /** Resolved absolute end time. */
  end: Date;
  location?: string;
  isOnline: boolean;
  joinUrl?: string;
  importance: Importance;
  webLink?: string;
}

export interface ITask {
  id: string;
  title: string;
  /** Resolved absolute due time, when present. */
  due?: Date;
  importance: Importance;
  completed: boolean;
  webLink?: string;
}

export interface INewsItem {
  id: string;
  title: string;
  category: string;
  /** Resolved absolute published time. */
  publishedAt: Date;
  summary?: string;
  imageUrl?: string;
  webUrl?: string;
  /** Post author (name + optional face photo) for the news byline. */
  author?: { displayName: string; photoUrl?: string };
}

export interface IMailItem {
  id: string;
  subject: string;
  preview: string;
  from: string;
  fromEmail?: string;
  /** Resolved absolute received time. */
  receivedAt: Date;
  isRead: boolean;
  importance: Importance;
  hasAttachments: boolean;
  flagged: boolean;
  webLink?: string;
  /** Sender face photo (base64 data URI in the mock) for the mail avatar. */
  senderPhotoUrl?: string;
}

/** Aggregate consumed by the My Day views. */
export interface IMyDayData {
  user: IUser;
  meetings: IMeeting[];
  tasks: ITask[];
  news: INewsItem[];
  mail: IMailItem[];
  weather?: IWeather;
  quickActions?: IQuickAction[];
}

/** Current-conditions weather shown in the full-screen hero (mock only). */
export interface IWeather {
  temperatureC: number;
  temperatureF: number;
  condition: string;
  location: string;
  airQualityIndex: number;
  airQualityLabel: string;
}

/** A quick-action tile in the full-screen view (mock / no-op). */
export interface IQuickAction {
  id: string;
  title: string;
  description: string;
  /** Icon key the UI maps to a Fluent icon. */
  icon: 'room' | 'note' | 'timeoff';
}
