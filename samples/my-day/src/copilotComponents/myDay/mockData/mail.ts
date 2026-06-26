import type { IMockMailSeed } from '../models/seeds';

/**
 * Mock messages shaped like Microsoft Graph `message`, with relative
 * `receivedOffsetMin` offsets resolved against `now`. Includes unread, important
 * and flagged items for the full-screen "Important mail" card.
 */
export const mockMail: IMockMailSeed[] = [
  {
    id: 'mail-0',
    subject: 'Re: My Day demo script',
    bodyPreview: 'Looks great — I added a couple of notes to the inline section before the keynote run-through.',
    from: { emailAddress: { name: 'Aria Patel', address: 'aria.patel@contoso.com' } },
    receivedOffsetMin: -10,
    isRead: false,
    importance: 'high',
    hasAttachments: true,
    flag: { flagStatus: 'flagged' },
    webLink: 'https://outlook.office365.com/mail/inbox/id/mail-0'
  },
  {
    id: 'mail-1',
    subject: 'Q3 budget approval needed',
    bodyPreview: 'Can you approve the updated figures today? Finance needs sign-off before the close.',
    from: { emailAddress: { name: 'Diego Martins', address: 'diego.martins@contoso.com' } },
    receivedOffsetMin: -45,
    isRead: false,
    importance: 'high',
    hasAttachments: false,
    flag: { flagStatus: 'flagged' },
    webLink: 'https://outlook.office365.com/mail/inbox/id/mail-1'
  },
  {
    id: 'mail-2',
    subject: 'RFP response received',
    bodyPreview: 'Thank you for your submission. Our procurement team will review and follow up shortly.',
    from: { emailAddress: { name: 'Contoso Procurement', address: 'procurement@contoso.com' } },
    receivedOffsetMin: -200,
    isRead: false,
    importance: 'normal',
    hasAttachments: true,
    flag: { flagStatus: 'notFlagged' },
    webLink: 'https://outlook.office365.com/mail/inbox/id/mail-2'
  },
  {
    id: 'mail-3',
    subject: 'Lunch tomorrow?',
    bodyPreview: "There's a new place near the office — want to try it before the 1:1?",
    from: { emailAddress: { name: 'Lena Hoffmann', address: 'lena.hoffmann@contoso.com' } },
    receivedOffsetMin: -120,
    isRead: true,
    importance: 'normal',
    hasAttachments: false,
    flag: { flagStatus: 'notFlagged' },
    webLink: 'https://outlook.office365.com/mail/inbox/id/mail-3'
  },
  {
    id: 'mail-4',
    subject: '[my-day] PR review requested',
    bodyPreview: 'Aria Patel requested your review on pull request #482: Inline experience.',
    from: { emailAddress: { name: 'GitHub', address: 'notifications@github.com' } },
    receivedOffsetMin: -300,
    isRead: true,
    importance: 'normal',
    hasAttachments: false,
    flag: { flagStatus: 'notFlagged' },
    webLink: 'https://outlook.office365.com/mail/inbox/id/mail-4'
  }
];
