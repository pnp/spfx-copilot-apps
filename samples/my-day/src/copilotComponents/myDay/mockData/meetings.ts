import type { IMockEventSeed } from '../models/seeds';
import { people } from './people';

/**
 * Mock calendar events shaped like Microsoft Graph `event`, with relative
 * `startOffsetMin` offsets resolved against `now` at render time. One event is
 * in the past to demonstrate "next meeting" filtering.
 *
 * Organizers are the standard Microsoft 365 demo personas (see `people.ts`), and
 * the day is themed around **shipping the "My Day" Copilot App** — the agenda,
 * tasks, mail and news deliberately reference the same storyline so "Plan my day"
 * reads as insightful rather than random.
 */
export const mockEvents: IMockEventSeed[] = [
  {
    id: 'evt-0',
    subject: 'Team Sync',
    startOffsetMin: -45,
    durationMin: 30,
    isOnlineMeeting: true,
    onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-team-sync' },
    onlineMeetingProvider: 'teamsForBusiness',
    location: { displayName: 'Microsoft Teams Meeting' },
    organizer: { emailAddress: { name: people.johanna.displayName, address: people.johanna.email } },
    importance: 'normal',
    showAs: 'busy',
    webLink: 'https://outlook.office365.com/calendar/item/evt-0'
  },
  {
    id: 'evt-1',
    subject: 'Daily Standup',
    startOffsetMin: 12,
    durationMin: 15,
    isOnlineMeeting: true,
    onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-standup' },
    onlineMeetingProvider: 'teamsForBusiness',
    location: { displayName: 'Microsoft Teams Meeting' },
    organizer: { emailAddress: { name: people.lee.displayName, address: people.lee.email } },
    importance: 'normal',
    showAs: 'busy',
    webLink: 'https://outlook.office365.com/calendar/item/evt-1'
  },
  {
    id: 'evt-2',
    subject: 'Design Review — My Day Copilot App',
    startOffsetMin: 45,
    durationMin: 60,
    isOnlineMeeting: true,
    onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-design-review' },
    onlineMeetingProvider: 'teamsForBusiness',
    location: { displayName: 'Microsoft Teams Meeting' },
    organizer: { emailAddress: { name: people.megan.displayName, address: people.megan.email } },
    importance: 'high',
    showAs: 'busy',
    webLink: 'https://outlook.office365.com/calendar/item/evt-2'
  },
  {
    id: 'evt-3',
    subject: '1:1 with Diego',
    startOffsetMin: 150,
    durationMin: 30,
    isOnlineMeeting: false,
    location: { displayName: 'Conference Room 3B' },
    organizer: { emailAddress: { name: people.diego.displayName, address: people.diego.email } },
    importance: 'normal',
    showAs: 'busy',
    webLink: 'https://outlook.office365.com/calendar/item/evt-3'
  },
  {
    id: 'evt-4',
    subject: 'Sprint Planning',
    startOffsetMin: 240,
    durationMin: 60,
    isOnlineMeeting: true,
    onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-sprint-planning' },
    onlineMeetingProvider: 'teamsForBusiness',
    location: { displayName: 'Microsoft Teams Meeting' },
    organizer: { emailAddress: { name: people.johanna.displayName, address: people.johanna.email } },
    importance: 'normal',
    showAs: 'busy',
    webLink: 'https://outlook.office365.com/calendar/item/evt-4'
  },
  {
    id: 'evt-5',
    subject: 'Keynote Run-through — My Day Copilot App',
    startOffsetMin: 1440,
    durationMin: 45,
    isOnlineMeeting: true,
    onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-keynote-runthrough' },
    onlineMeetingProvider: 'teamsForBusiness',
    location: { displayName: 'Microsoft Teams Meeting' },
    organizer: { emailAddress: { name: people.megan.displayName, address: people.megan.email } },
    importance: 'high',
    showAs: 'busy',
    webLink: 'https://outlook.office365.com/calendar/item/evt-5'
  }
];
