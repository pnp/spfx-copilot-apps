import type {
  IGraphEvent,
  IGraphMessage,
  IGraphSitePage,
  IGraphTodoTask,
  IGraphUser
} from '../models/graph';
import type { IMailItem, IMeeting, INewsItem, ITask, IUser } from '../models/myDay';

/**
 * Maps Graph-shaped objects to the lean view models the React components
 * consume. This is shared by the mock provider and the future
 * `GraphMyDayDataService`, so live and mock data go through identical shaping.
 */

export const mapUser = (u: IGraphUser): IUser => ({
  id: u.id,
  displayName: u.displayName,
  firstName: u.givenName || u.displayName.split(' ')[0],
  photoUrl: u.photoUrl
});

export const mapMeeting = (e: IGraphEvent): IMeeting => ({
  id: e.id,
  subject: e.subject,
  start: new Date(e.start.dateTime),
  end: new Date(e.end.dateTime),
  location: e.location?.displayName,
  isOnline: e.isOnlineMeeting,
  joinUrl: e.onlineMeeting?.joinUrl,
  importance: e.importance,
  webLink: e.webLink
});

export const mapTask = (t: IGraphTodoTask): ITask => ({
  id: t.id,
  title: t.title,
  due: t.dueDateTime ? new Date(t.dueDateTime.dateTime) : undefined,
  importance: t.importance,
  completed: t.status === 'completed',
  webLink: t.webLink
});

export const mapNews = (p: IGraphSitePage): INewsItem => ({
  id: p.id,
  title: p.title,
  category: p.category || 'News',
  publishedAt: new Date(p.createdDateTime),
  summary: p.description,
  imageUrl: p.thumbnailWebUrl,
  webUrl: p.webUrl,
  author: p.author
    ? { displayName: p.author.displayName, photoUrl: p.author.photoUrl }
    : undefined
});

export const mapMail = (m: IGraphMessage): IMailItem => ({
  id: m.id,
  subject: m.subject,
  preview: m.bodyPreview,
  from: m.from.emailAddress.name,
  fromEmail: m.from.emailAddress.address,
  receivedAt: new Date(m.receivedDateTime),
  isRead: m.isRead,
  importance: m.importance,
  hasAttachments: m.hasAttachments,
  flagged: m.flag?.flagStatus === 'flagged',
  webLink: m.webLink,
  senderPhotoUrl: m.senderPhotoUrl
});
