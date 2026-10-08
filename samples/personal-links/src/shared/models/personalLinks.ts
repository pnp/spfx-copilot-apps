export const PERSONAL_LINKS_SCHEMA_VERSION = 1;

export const personalLinkIconKeys = [
  'link',
  'globe',
  'mail',
  'calendar',
  'document',
  'folder',
  'people',
  'tasks',
  'news',
  'learning',
  'video',
  'cloud',
  'code',
  'bookmark',
  'home',
  'star'
] as const;

export type PersonalLinkIconKey = typeof personalLinkIconKeys[number];
export type PersonalLinksExperienceMode = 'compact' | 'full';
export type PersonalLinksStorageStatus =
  | 'loading'
  | 'ready'
  | 'saving'
  | 'stale'
  | 'permission'
  | 'conflict'
  | 'error';

export interface IPersonalLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  iconKey: PersonalLinkIconKey;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPersonalLinksDocument {
  schemaVersion: 1;
  links: IPersonalLink[];
  updatedAt: string;
}

export interface IPersonalLinksSnapshot {
  document: IPersonalLinksDocument;
  eTag?: string;
  appFolderWebUrl?: string;
}

export interface IPersonalLinkDraft {
  title: string;
  url: string;
  description: string;
  iconKey: PersonalLinkIconKey;
}

export interface IPersonalLinkDraftErrors {
  title?: string;
  url?: string;
  description?: string;
}

export const emptyPersonalLinkDraft = (): IPersonalLinkDraft => ({
  title: '',
  url: '',
  description: '',
  iconKey: 'link'
});

export const createEmptyPersonalLinksDocument = (): IPersonalLinksDocument => ({
  schemaVersion: PERSONAL_LINKS_SCHEMA_VERSION,
  links: [],
  updatedAt: new Date(0).toISOString()
});

export function isPersonalLinkIconKey(value: unknown): value is PersonalLinkIconKey {
  return typeof value === 'string' && personalLinkIconKeys.some(key => key === value);
}

export function validatePersonalLinkDraft(draft: IPersonalLinkDraft): IPersonalLinkDraftErrors {
  const errors: IPersonalLinkDraftErrors = {};
  const title = draft.title.trim();
  const description = draft.description.trim();

  if (!title) {
    errors.title = 'Enter a title.';
  } else if (title.length > 80) {
    errors.title = 'Use 80 characters or fewer.';
  }

  try {
    const parsedUrl = new URL(draft.url.trim());
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      errors.url = 'Use an HTTP or HTTPS address.';
    }
  } catch {
    errors.url = 'Enter a complete web address, such as https://contoso.com.';
  }

  if (description.length > 160) {
    errors.description = 'Use 160 characters or fewer.';
  }

  return errors;
}

function readRequiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`The personal links file contains an invalid ${key} value.`);
  }
  return value;
}

function parseLink(value: unknown, index: number): IPersonalLink {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The personal links file contains an invalid link.');
  }

  const record = value as Record<string, unknown>;
  const iconKey = isPersonalLinkIconKey(record.iconKey) ? record.iconKey : 'link';
  const order = typeof record.order === 'number' && Number.isFinite(record.order)
    ? record.order
    : index;
  const url = readRequiredString(record, 'url');
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('The personal links file contains an unsupported URL.');
  }

  return {
    id: readRequiredString(record, 'id'),
    title: readRequiredString(record, 'title').slice(0, 80),
    url,
    description: typeof record.description === 'string'
      ? record.description.slice(0, 160)
      : undefined,
    iconKey,
    order,
    createdAt: readRequiredString(record, 'createdAt'),
    updatedAt: readRequiredString(record, 'updatedAt')
  };
}

export function parsePersonalLinksDocument(value: unknown): IPersonalLinksDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The personal links file does not contain a valid document.');
  }

  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== PERSONAL_LINKS_SCHEMA_VERSION) {
    throw new Error('This personal links file was created by an unsupported version.');
  }
  if (!Array.isArray(record.links)) {
    throw new Error('The personal links file does not contain a links collection.');
  }

  const links = record.links
    .map(parseLink)
    .sort((left, right) => left.order - right.order)
    .map((link, order) => ({ ...link, order }));

  return {
    schemaVersion: PERSONAL_LINKS_SCHEMA_VERSION,
    links,
    updatedAt: readRequiredString(record, 'updatedAt')
  };
}

export function normalizePersonalLinksDocument(
  links: readonly IPersonalLink[],
  now: Date = new Date()
): IPersonalLinksDocument {
  return {
    schemaVersion: PERSONAL_LINKS_SCHEMA_VERSION,
    links: links.map((link, order) => ({ ...link, order })),
    updatedAt: now.toISOString()
  };
}
