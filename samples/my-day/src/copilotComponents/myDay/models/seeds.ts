/**
 * Mock "seed" shapes — identical to the Graph types but with the absolute
 * date/time fields replaced by **relative offsets (in minutes) from `now`**.
 *
 * `resolveMockData(seeds, now)` turns these into fully Graph-shaped objects with
 * absolute `dateTime` values at render time, so the demo is always live and
 * future-biased regardless of when it is opened.
 */

import type {
  IGraphAttendee,
  IGraphLocation,
  IGraphMessage,
  IGraphOnlineMeetingInfo,
  IGraphPerson,
  IGraphRecipient,
  IGraphSitePage,
  IGraphTodoTask,
  IGraphUser,
  GraphImportance,
  GraphTaskStatus
} from './graph';

export interface IMockEventSeed {
  id: string;
  subject: string;
  /** Minutes from `now` until the meeting starts (negative = already started/past). */
  startOffsetMin: number;
  /** Meeting length in minutes. */
  durationMin: number;
  location?: IGraphLocation;
  isOnlineMeeting: boolean;
  onlineMeeting?: IGraphOnlineMeetingInfo;
  onlineMeetingProvider?: 'teamsForBusiness' | 'skypeForBusiness' | 'unknown';
  organizer?: IGraphRecipient;
  attendees?: IGraphAttendee[];
  importance: GraphImportance;
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  isAllDay?: boolean;
  webLink?: string;
}

export interface IMockTaskSeed {
  id: string;
  title: string;
  status: GraphTaskStatus;
  importance: GraphImportance;
  /** Minutes from `now` until the task is due (undefined = no due date). */
  dueOffsetMin?: number;
  /** Minutes from `now` when the task was completed (only for completed tasks). */
  completedOffsetMin?: number;
  categories?: string[];
  webLink?: string;
}

export interface IMockNewsSeed {
  id: string;
  title: string;
  name: string;
  webUrl: string;
  description?: string;
  thumbnailWebUrl?: string;
  bannerImageWebUrl?: string;
  /** Minutes from `now` the post was published (negative = in the past). */
  publishedOffsetMin: number;
  promotionKind?: 'newsPost' | 'page' | 'template';
  category?: string;
  author?: IGraphPerson;
}

export interface IMockMailSeed {
  id: string;
  subject: string;
  bodyPreview: string;
  from: IGraphRecipient;
  /** Minutes from `now` the mail was received (negative = in the past). */
  receivedOffsetMin: number;
  isRead: boolean;
  importance: GraphImportance;
  hasAttachments: boolean;
  flag?: { flagStatus: 'notFlagged' | 'flagged' | 'complete' };
  webLink?: string;
  senderPhotoUrl?: string;
}

export type IMockUserSeed = IGraphUser;

/** Convenience aliases for the resolved Graph collections. */
export type ResolvedEvent = import('./graph').IGraphEvent;
export type ResolvedTask = IGraphTodoTask;
export type ResolvedNews = IGraphSitePage;
export type ResolvedMail = IGraphMessage;
