import {
  normalizePersonalLinksDocument,
  type IPersonalLink,
  type IPersonalLinksDocument,
  type IPersonalLinksSnapshot
} from '../models/personalLinks';
import type { IPersonalLinksService } from './IPersonalLinksService';

const demoLinks: readonly IPersonalLink[] = [
  {
    id: 'demo-microsoft-365',
    title: 'Microsoft 365',
    url: 'https://www.microsoft365.com/',
    description: 'Open Microsoft 365 apps and recent work.',
    iconKey: 'home',
    order: 0,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z'
  },
  {
    id: 'demo-outlook',
    title: 'Outlook',
    url: 'https://outlook.office.com/',
    description: 'Mail and calendar.',
    iconKey: 'mail',
    order: 1,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z'
  },
  {
    id: 'demo-sharepoint',
    title: 'SharePoint start',
    url: 'https://www.microsoft365.com/launch/sharepoint',
    description: 'Find sites, news, and shared content.',
    iconKey: 'globe',
    order: 2,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z'
  },
  {
    id: 'demo-onedrive',
    title: 'OneDrive',
    url: 'https://www.microsoft365.com/launch/onedrive',
    description: 'Open personal files and shared documents.',
    iconKey: 'cloud',
    order: 3,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z'
  },
  {
    id: 'demo-planner',
    title: 'Planner',
    url: 'https://planner.cloud.microsoft/',
    description: 'Review plans and assigned tasks.',
    iconKey: 'tasks',
    order: 4,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z'
  },
  {
    id: 'demo-learn',
    title: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/',
    description: 'Documentation, training, and code samples.',
    iconKey: 'learning',
    order: 5,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z'
  }
];

export class MemoryPersonalLinksService implements IPersonalLinksService {
  private document: IPersonalLinksDocument = normalizePersonalLinksDocument(
    demoLinks,
    new Date('2026-10-08T00:00:00.000Z')
  );
  private version: number = 1;

  public async load(signal?: AbortSignal): Promise<IPersonalLinksSnapshot> {
    if (signal?.aborted) {
      throw new DOMException('The request was cancelled.', 'AbortError');
    }
    return {
      document: this.cloneDocument(),
      eTag: `"demo-${this.version}"`
    };
  }

  public async save(
    document: IPersonalLinksDocument,
    _expectedETag?: string,
    signal?: AbortSignal
  ): Promise<IPersonalLinksSnapshot> {
    if (signal?.aborted) {
      throw new DOMException('The request was cancelled.', 'AbortError');
    }
    this.version += 1;
    this.document = {
      ...document,
      links: document.links.map(link => ({ ...link }))
    };
    return {
      document: this.cloneDocument(),
      eTag: `"demo-${this.version}"`
    };
  }

  private cloneDocument(): IPersonalLinksDocument {
    return {
      ...this.document,
      links: this.document.links.map(link => ({ ...link }))
    };
  }
}
