import type { IMockMailSeed } from '../models/seeds';
import { people } from './people';

/**
 * Mock messages shaped like Microsoft Graph `message`, with relative
 * `receivedOffsetMin` offsets resolved against `now`. Includes unread, important
 * and flagged items for the full-screen "Important mail" card. Senders are the
 * standard Microsoft 365 demo personas (see `people.ts`) and carry an embedded
 * face photo (`senderPhotoUrl`) for the mail avatars.
 */
export const mockMail: IMockMailSeed[] = [
  {
    id: 'mail-0',
    subject: 'Re: My Day demo script',
    bodyPreview: 'Looks great — I added a couple of notes to the inline section before the keynote run-through.',
    from: { emailAddress: { name: people.megan.displayName, address: people.megan.email } },
    senderPhotoUrl: people.megan.photoUrl,
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
    from: { emailAddress: { name: people.diego.displayName, address: people.diego.email } },
    senderPhotoUrl: people.diego.photoUrl,
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
    from: { emailAddress: { name: people.patti.displayName, address: people.patti.email } },
    senderPhotoUrl: people.patti.photoUrl,
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
    from: { emailAddress: { name: people.joni.displayName, address: people.joni.email } },
    senderPhotoUrl: people.joni.photoUrl,
    receivedOffsetMin: -120,
    isRead: true,
    importance: 'normal',
    hasAttachments: false,
    flag: { flagStatus: 'notFlagged' },
    webLink: 'https://outlook.office365.com/mail/inbox/id/mail-3'
  },
  {
    id: 'mail-4',
    subject: 'Quarterly report — review requested',
    bodyPreview: 'I left a few comments on the draft. Could you take a pass before our afternoon sync?',
    from: { emailAddress: { name: people.miriam.displayName, address: people.miriam.email } },
    senderPhotoUrl: people.miriam.photoUrl,
    receivedOffsetMin: -300,
    isRead: true,
    importance: 'normal',
    hasAttachments: false,
    flag: { flagStatus: 'notFlagged' },
    webLink: 'https://outlook.office365.com/mail/inbox/id/mail-4'
  }
];
