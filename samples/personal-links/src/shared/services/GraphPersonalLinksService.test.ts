import type { MSGraphClientV3 } from '@microsoft/sp-http';

import {
  PERSONAL_LINKS_SCHEMA_VERSION,
  createEmptyPersonalLinksDocument
} from '../models/personalLinks';
import { GraphPersonalLinksService } from './GraphPersonalLinksService';
import { PersonalLinksServiceError } from './IPersonalLinksService';

interface IFakeRequest {
  select: (value: string) => IFakeRequest;
  header: (name: string, value: string) => IFakeRequest;
  get: () => Promise<unknown>;
  put: (body: string) => Promise<unknown>;
}

interface IFakeGraphOptions {
  missing?: boolean;
  appRootMissing?: boolean;
  permissionDenied?: boolean;
  conflict?: boolean;
}

function graphError(statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(`Graph returned ${statusCode}.`), { statusCode });
}

function createFakeGraph(options: IFakeGraphOptions = {}): {
  client: MSGraphClientV3;
  headers: Record<string, string>;
  putBodies: string[];
} {
  const headers: Record<string, string> = {};
  const putBodies: string[] = [];

  const api = (path: string): IFakeRequest => {
    const request: IFakeRequest = {
      select: () => request,
      header: (name: string, value: string) => {
        headers[name] = value;
        return request;
      },
      get: async (): Promise<unknown> => {
        if (path === '/me/drive/special/approot') {
          if (options.permissionDenied) {
            throw graphError(403);
          }
          if (options.appRootMissing) {
            throw graphError(404);
          }
          return {
            id: 'approot',
            webUrl: 'https://contoso-my.sharepoint.com/personal/user/Documents/Apps/Personal%20Links'
          };
        }
        if (path.endsWith('personal-links-v1.json') && options.missing) {
          throw graphError(404);
        }
        if (path.endsWith('personal-links-v1.json')) {
          return { eTag: '"etag-1"' };
        }
        return {
          schemaVersion: PERSONAL_LINKS_SCHEMA_VERSION,
          links: [],
          updatedAt: '2026-10-08T01:00:00.000Z'
        };
      },
      put: async (body: string): Promise<unknown> => {
        putBodies.push(body);
        if (options.conflict) {
          throw graphError(412);
        }
        return { eTag: '"etag-2"' };
      }
    };
    return request;
  };

  return {
    client: { api } as unknown as MSGraphClientV3,
    headers,
    putBodies
  };
}

describe('GraphPersonalLinksService', () => {
  it('returns an empty document when the App Folder file does not exist', async () => {
    const fake = createFakeGraph({ missing: true });
    const snapshot = await new GraphPersonalLinksService(fake.client).load();

    expect(snapshot.document).toEqual(createEmptyPersonalLinksDocument());
    expect(snapshot.eTag).toBeUndefined();
    expect(snapshot.appFolderWebUrl).toBe(
      'https://contoso-my.sharepoint.com/personal/user/Documents/Apps/Personal%20Links'
    );
  });

  it('explains when OneDrive is not provisioned', async () => {
    const fake = createFakeGraph({ appRootMissing: true });

    await expect(new GraphPersonalLinksService(fake.client).load())
      .rejects.toMatchObject<Partial<PersonalLinksServiceError>>({
        code: 'unavailable',
        statusCode: 404
      });
  });

  it('maps missing Graph consent to a permission action', async () => {
    const fake = createFakeGraph({ permissionDenied: true });

    await expect(new GraphPersonalLinksService(fake.client).load())
      .rejects.toMatchObject<Partial<PersonalLinksServiceError>>({
        code: 'permission',
        statusCode: 403,
        message: expect.stringMatching(/permission/i)
      });
  });

  it('writes JSON with the current eTag', async () => {
    const fake = createFakeGraph();
    const document = {
      ...createEmptyPersonalLinksDocument(),
      updatedAt: '2026-10-08T01:00:00.000Z'
    };
    const snapshot = await new GraphPersonalLinksService(fake.client).save(document, '"etag-1"');

    expect(fake.headers['If-Match']).toBe('"etag-1"');
    expect(JSON.parse(fake.putBodies[0])).toEqual(document);
    expect(snapshot.eTag).toBe('"etag-2"');
  });

  it('maps a stale eTag to an explicit conflict', async () => {
    const fake = createFakeGraph({ conflict: true });
    const service = new GraphPersonalLinksService(fake.client);

    await expect(service.save(createEmptyPersonalLinksDocument(), '"stale"'))
      .rejects.toMatchObject<Partial<PersonalLinksServiceError>>({
        code: 'conflict',
        statusCode: 412
      });
  });
});
