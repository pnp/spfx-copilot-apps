import type { IMockTaskSeed } from '../models/seeds';

/**
 * Mock To Do tasks shaped like Microsoft Graph `todoTask`, with relative
 * `dueOffsetMin` offsets resolved against `now` at render time. Includes several
 * high-importance items due today plus one completed task.
 */
export const mockTasks: IMockTaskSeed[] = [
  {
    id: 'task-0',
    title: 'Review PR #482 — inline view',
    status: 'notStarted',
    importance: 'high',
    dueOffsetMin: 60,
    categories: ['Engineering'],
    webLink: 'https://to-do.office.com/tasks/id/task-0/details'
  },
  {
    id: 'task-1',
    title: 'Finish Q3 roadmap deck',
    status: 'inProgress',
    importance: 'high',
    dueOffsetMin: 180,
    categories: ['Planning'],
    webLink: 'https://to-do.office.com/tasks/id/task-1/details'
  },
  {
    id: 'task-2',
    title: 'Reply to Contoso RFP',
    status: 'notStarted',
    importance: 'normal',
    dueOffsetMin: 300,
    categories: ['Sales'],
    webLink: 'https://to-do.office.com/tasks/id/task-2/details'
  },
  {
    id: 'task-3',
    title: 'Submit timesheet',
    status: 'notStarted',
    importance: 'normal',
    dueOffsetMin: 1440,
    webLink: 'https://to-do.office.com/tasks/id/task-3/details'
  },
  {
    id: 'task-4',
    title: 'Book travel for team offsite',
    status: 'notStarted',
    importance: 'low',
    dueOffsetMin: 2880,
    webLink: 'https://to-do.office.com/tasks/id/task-4/details'
  },
  {
    id: 'task-5',
    title: 'Update OKRs',
    status: 'completed',
    importance: 'normal',
    dueOffsetMin: -120,
    completedOffsetMin: -90,
    webLink: 'https://to-do.office.com/tasks/id/task-5/details'
  }
];
