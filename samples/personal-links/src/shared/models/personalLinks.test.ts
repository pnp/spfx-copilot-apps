import {
  normalizePersonalLinksDocument,
  parsePersonalLinksDocument,
  validatePersonalLinkDraft,
  type IPersonalLink
} from './personalLinks';

const link: IPersonalLink = {
  id: 'link-1',
  title: 'Microsoft 365',
  url: 'https://www.microsoft365.com/',
  description: 'Start page',
  iconKey: 'home',
  order: 4,
  createdAt: '2026-10-08T00:00:00.000Z',
  updatedAt: '2026-10-08T00:00:00.000Z'
};

describe('personal links model', () => {
  it('accepts HTTP and HTTPS drafts and rejects unsafe protocols', () => {
    expect(validatePersonalLinkDraft({
      title: 'Contoso',
      url: 'https://contoso.com',
      description: '',
      iconKey: 'link'
    })).toEqual({});

    expect(validatePersonalLinkDraft({
      title: 'Local',
      url: 'http://localhost:4321',
      description: '',
      iconKey: 'code'
    })).toEqual({});

    expect(validatePersonalLinkDraft({
      title: 'Unsafe',
      url: 'ftp://contoso.com/file',
      description: '',
      iconKey: 'link'
    }).url).toMatch(/HTTP or HTTPS/);
  });

  it('normalizes contiguous order and a deterministic timestamp', () => {
    const document = normalizePersonalLinksDocument(
      [{ ...link }, { ...link, id: 'link-2', order: 12 }],
      new Date('2026-10-08T01:00:00.000Z')
    );

    expect(document.links.map(item => item.order)).toEqual([0, 1]);
    expect(document.updatedAt).toBe('2026-10-08T01:00:00.000Z');
  });

  it('parses, sorts, and normalizes a version 1 document', () => {
    const document = parsePersonalLinksDocument({
      schemaVersion: 1,
      links: [
        { ...link, id: 'second', order: 8 },
        { ...link, id: 'first', order: 2 }
      ],
      updatedAt: '2026-10-08T01:00:00.000Z'
    });

    expect(document.links.map(item => item.id)).toEqual(['first', 'second']);
    expect(document.links.map(item => item.order)).toEqual([0, 1]);
  });

  it('refuses unsupported versions and invalid URLs', () => {
    expect(() => parsePersonalLinksDocument({
      schemaVersion: 2,
      links: [],
      updatedAt: '2026-10-08T01:00:00.000Z'
    })).toThrow(/unsupported version/);

    expect(() => parsePersonalLinksDocument({
      schemaVersion: 1,
      links: [{ ...link, url: 'file:///c:/secret.txt' }],
      updatedAt: '2026-10-08T01:00:00.000Z'
    })).toThrow(/unsupported URL/);
  });
});
