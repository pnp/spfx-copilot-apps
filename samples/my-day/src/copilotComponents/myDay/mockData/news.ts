import type { IMockNewsSeed } from '../models/seeds';
import { people } from './people';

/**
 * Mock SharePoint news shaped like Microsoft Graph `sitePage` (news posts), with
 * relative `publishedOffsetMin` offsets resolved against `now`. Authors are the
 * standard Microsoft 365 demo personas (see `people.ts`) and carry an embedded
 * face photo for the byline. Thumbnails use the deterministic picsum.photos
 * placeholder service; the UI degrades to a gradient placeholder if an image
 * fails to load.
 */
export const mockNews: IMockNewsSeed[] = [
  {
    id: 'news-0',
    title: 'SharePoint Copilot Apps — early access now available',
    name: 'spfx-copilot-apps-early-access.aspx',
    webUrl: 'https://contoso.sharepoint.com/sites/intranet/SitePages/spfx-copilot-apps-early-access.aspx',
    description:
      'Build rich, interactive experiences that run directly inside Microsoft 365 Copilot using the SharePoint Framework.',
    thumbnailWebUrl: 'https://picsum.photos/seed/spfx-copilot/640/360',
    bannerImageWebUrl: 'https://picsum.photos/seed/spfx-copilot/1280/480',
    publishedOffsetMin: -60,
    promotionKind: 'newsPost',
    category: 'Company News',
    author: { displayName: people.megan.displayName, email: people.megan.email, photoUrl: people.megan.photoUrl }
  },
  {
    id: 'news-1',
    title: 'FY26 benefits enrollment opens Monday',
    name: 'fy26-benefits-enrollment.aspx',
    webUrl: 'https://contoso.sharepoint.com/sites/intranet/SitePages/fy26-benefits-enrollment.aspx',
    description: 'Review your options and complete enrollment before the window closes at month end.',
    thumbnailWebUrl: 'https://picsum.photos/seed/benefits/640/360',
    bannerImageWebUrl: 'https://picsum.photos/seed/benefits/1280/480',
    publishedOffsetMin: -180,
    promotionKind: 'newsPost',
    category: 'HR News',
    author: { displayName: people.patti.displayName, email: people.patti.email, photoUrl: people.patti.photoUrl }
  },
  {
    id: 'news-2',
    title: 'Office reopening: updated hybrid schedule',
    name: 'office-hybrid-schedule.aspx',
    webUrl: 'https://contoso.sharepoint.com/sites/intranet/SitePages/office-hybrid-schedule.aspx',
    description: 'Three anchor days a week starting next month, with new bookable collaboration zones.',
    thumbnailWebUrl: 'https://picsum.photos/seed/office/640/360',
    bannerImageWebUrl: 'https://picsum.photos/seed/office/1280/480',
    publishedOffsetMin: -300,
    promotionKind: 'newsPost',
    category: 'Facilities',
    author: { displayName: people.nestor.displayName, email: people.nestor.email, photoUrl: people.nestor.photoUrl }
  },
  {
    id: 'news-3',
    title: 'Engineering all-hands recap',
    name: 'engineering-all-hands-recap.aspx',
    webUrl: 'https://contoso.sharepoint.com/sites/intranet/SitePages/engineering-all-hands-recap.aspx',
    description: 'Highlights from the quarterly all-hands, including the platform reliability roadmap.',
    thumbnailWebUrl: 'https://picsum.photos/seed/engineering/640/360',
    bannerImageWebUrl: 'https://picsum.photos/seed/engineering/1280/480',
    publishedOffsetMin: -1440,
    promotionKind: 'newsPost',
    category: 'Engineering',
    author: { displayName: people.lee.displayName, email: people.lee.email, photoUrl: people.lee.photoUrl }
  },
  {
    id: 'news-4',
    title: 'New Contoso partnership announced',
    name: 'contoso-partnership.aspx',
    webUrl: 'https://contoso.sharepoint.com/sites/intranet/SitePages/contoso-partnership.aspx',
    description: 'A strategic partnership to accelerate AI-powered productivity for enterprise customers.',
    thumbnailWebUrl: 'https://picsum.photos/seed/partnership/640/360',
    bannerImageWebUrl: 'https://picsum.photos/seed/partnership/1280/480',
    publishedOffsetMin: -2880,
    promotionKind: 'newsPost',
    category: 'Company News',
    author: { displayName: people.isaiah.displayName, email: people.isaiah.email, photoUrl: people.isaiah.photoUrl }
  }
];
