/**
 * Microsoft Graph response shapes (subset) used by the mock data so the future
 * `GraphMyDayDataService` is a drop-in swap. Only the fields the sample consumes
 * are modeled; nesting matches the real Graph payloads.
 */

export type GraphImportance = 'low' | 'normal' | 'high';

export interface IGraphDateTimeTimeZone {
  dateTime: string; // ISO 8601 local date-time
  timeZone: string; // e.g. "UTC"
}

export interface IGraphEmailAddress {
  name: string;
  address: string;
}

export interface IGraphRecipient {
  emailAddress: IGraphEmailAddress;
}

export interface IGraphLocation {
  displayName: string;
}

export interface IGraphOnlineMeetingInfo {
  joinUrl: string;
}

export interface IGraphAttendee {
  emailAddress: IGraphEmailAddress;
  type: 'required' | 'optional' | 'resource';
  status: { response: string; time?: string };
}

/** Subset of Microsoft Graph `event` (`/me/events`, `/me/calendarView`). */
export interface IGraphEvent {
  id: string;
  subject: string;
  start: IGraphDateTimeTimeZone;
  end: IGraphDateTimeTimeZone;
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

export type GraphTaskStatus =
  | 'notStarted'
  | 'inProgress'
  | 'completed'
  | 'waitingOnOthers'
  | 'deferred';

/** Subset of Microsoft Graph `todoTask` (`/me/todo/lists/{id}/tasks`). */
export interface IGraphTodoTask {
  id: string;
  title: string;
  status: GraphTaskStatus;
  importance: GraphImportance;
  dueDateTime?: IGraphDateTimeTimeZone;
  completedDateTime?: IGraphDateTimeTimeZone;
  categories?: string[];
  webLink?: string;
}

/** Subset of Microsoft Graph `sitePage` (SharePoint news posts). */
export interface IGraphSitePage {
  id: string;
  title: string;
  name: string;
  webUrl: string;
  description?: string;
  thumbnailWebUrl?: string;
  bannerImageWebUrl?: string;
  createdDateTime: string;
  lastModifiedDateTime?: string;
  promotionKind?: 'newsPost' | 'page' | 'template';
  /**
   * Not a standard `sitePage` field — in a real tenant this comes from a custom
   * column / managed property. Included here so the mock can carry a category.
   */
  category?: string;
  /**
   * Not a standard `sitePage` field — in a real tenant the author would be
   * expanded from `createdBy` / a people field. Included here so the mock can
   * carry an author with a photo.
   */
  author?: IGraphPerson;
}

/** Subset of Microsoft Graph `message` (`/me/messages`). */
export interface IGraphMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  from: IGraphRecipient;
  receivedDateTime: string;
  isRead: boolean;
  importance: GraphImportance;
  hasAttachments: boolean;
  flag?: { flagStatus: 'notFlagged' | 'flagged' | 'complete' };
  webLink?: string;
  /**
   * Not a standard `message` field — in a real tenant the sender photo comes
   * from `/users/{id}/photo/$value`. Included here so the mock can carry a face
   * for the "Important mail" avatars.
   */
  senderPhotoUrl?: string;
}

/** Subset of Microsoft Graph `user` (`/me`). */
export interface IGraphUser {
  id: string;
  displayName: string;
  givenName: string;
  mail?: string;
  userPrincipalName?: string;
  photoUrl?: string;
}

/**
 * Lightweight person reference (display name + optional photo). Not a single
 * named Graph type — mirrors the shape returned when a people/`createdBy` field
 * is expanded with a resolved photo.
 */
export interface IGraphPerson {
  displayName: string;
  email?: string;
  photoUrl?: string;
}
