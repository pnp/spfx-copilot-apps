import { mockEvents, mockMail, mockNews, mockTasks, mockUser } from '../mockData';
import type { IMyDayData } from '../models/myDay';
import type { IMyDayDataService } from './IMyDayDataService';
import { mapMail, mapMeeting, mapNews, mapTask, mapUser } from './mappers';
import { resolveEvents, resolveMail, resolveNews, resolveTasks } from './resolveMockData';

/**
 * Mock implementation of {@link IMyDayDataService}. Imports the bundled mock
 * data, resolves relative time offsets against `now`, then maps the Graph-shaped
 * objects to view models — so the demo is always live and future-biased.
 */
export class MockMyDayDataService implements IMyDayDataService {
  public getMyDay(now: Date = new Date()): IMyDayData {
    const meetings = resolveEvents(mockEvents, now)
      .map(mapMeeting)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const tasks = resolveTasks(mockTasks, now).map(mapTask);

    const news = resolveNews(mockNews, now)
      .map(mapNews)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    const mail = resolveMail(mockMail, now)
      .map(mapMail)
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

    return {
      user: mapUser(mockUser),
      meetings,
      tasks,
      news,
      mail
    };
  }
}
