import {
  normalizePersonalLinksDocument,
  type IPersonalLink
} from '../models/personalLinks';
import { MemoryPersonalLinksService } from './MemoryPersonalLinksService';

describe('MemoryPersonalLinksService', () => {
  it('starts with useful demo links and keeps changes in memory', async () => {
    const service = new MemoryPersonalLinksService();
    const initial = await service.load();
    const added: IPersonalLink = {
      id: 'demo-added',
      title: 'Added during demo',
      url: 'https://contoso.com/',
      iconKey: 'link',
      order: initial.document.links.length,
      createdAt: '2026-10-08T02:00:00.000Z',
      updatedAt: '2026-10-08T02:00:00.000Z'
    };

    expect(initial.document.links.length).toBeGreaterThanOrEqual(6);

    await service.save(normalizePersonalLinksDocument(
      [...initial.document.links, added],
      new Date('2026-10-08T02:00:00.000Z')
    ));
    const updated = await service.load();

    expect(updated.document.links.some(link => link.id === added.id)).toBe(true);
  });

  it('does not share demo edits with a new service instance', async () => {
    const first = new MemoryPersonalLinksService();
    const second = new MemoryPersonalLinksService();
    const initial = await first.load();

    await first.save(normalizePersonalLinksDocument(
      initial.document.links.slice(1),
      new Date('2026-10-08T02:00:00.000Z')
    ));

    expect((await first.load()).document.links).toHaveLength(initial.document.links.length - 1);
    expect((await second.load()).document.links).toHaveLength(initial.document.links.length);
  });
});
