import type { MSGraphClientV3 } from '@microsoft/sp-http';

import {
  createEmptyPersonalLinksDocument,
  parsePersonalLinksDocument,
  type IPersonalLinksDocument,
  type IPersonalLinksSnapshot
} from '../models/personalLinks';
import {
  type IPersonalLinksService,
  PersonalLinksServiceError,
  type PersonalLinksServiceErrorCode
} from './IPersonalLinksService';

const APP_ROOT_PATH = '/me/drive/special/approot';
const FILE_ITEM_PATH = `${APP_ROOT_PATH}:/personal-links-v1.json`;
const FILE_CONTENT_PATH = `${FILE_ITEM_PATH}:/content`;

interface IGraphErrorLike {
  statusCode?: number;
  code?: string;
  message?: string;
}

interface IDriveItemMetadata {
  eTag?: string;
  webUrl?: string;
}

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const candidate = error as IGraphErrorLike;
  return typeof candidate.statusCode === 'number' ? candidate.statusCode : undefined;
}

function mapGraphError(error: unknown, fallbackMessage: string): PersonalLinksServiceError {
  const statusCode = getStatusCode(error);
  let code: PersonalLinksServiceErrorCode = 'unknown';
  let message = fallbackMessage;

  if (statusCode === 401 || statusCode === 403) {
    code = 'permission';
    message = 'Personal Links needs permission to use its folder in your OneDrive.';
  } else if (statusCode === 412) {
    code = 'conflict';
    message = 'Your links changed in another window. Reload the latest links before saving again.';
  } else if (statusCode === 429 || (statusCode !== undefined && statusCode >= 500)) {
    code = 'unavailable';
    message = 'OneDrive is temporarily unavailable. Your current view may be out of date.';
  }

  return new PersonalLinksServiceError(code, message, statusCode);
}

export class GraphPersonalLinksService implements IPersonalLinksService {
  private appFolderWebUrl: string | undefined;

  public constructor(private readonly graphClient: MSGraphClientV3) {}

  public async load(signal?: AbortSignal): Promise<IPersonalLinksSnapshot> {
    if (signal?.aborted) {
      throw new DOMException('The request was cancelled.', 'AbortError');
    }

    this.appFolderWebUrl = undefined;
    try {
      const appRoot = await this.graphClient
        .api(APP_ROOT_PATH)
        .select('id,webUrl')
        .get() as IDriveItemMetadata;
      this.appFolderWebUrl = appRoot.webUrl;
    } catch (error: unknown) {
      if (getStatusCode(error) === 404) {
        throw new PersonalLinksServiceError(
          'unavailable',
          'OneDrive is not provisioned for this account. Open OneDrive once or ask your administrator to provision it.',
          404
        );
      }
      throw mapGraphError(error, 'Personal Links could not connect to your OneDrive App Folder.');
    }

    try {
      const metadata = await this.graphClient
        .api(FILE_ITEM_PATH)
        .select('id,eTag')
        .get() as IDriveItemMetadata;
      const raw: unknown = await this.graphClient.api(FILE_CONTENT_PATH).get();
      const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        document: parsePersonalLinksDocument(value),
        eTag: metadata.eTag,
        appFolderWebUrl: this.appFolderWebUrl
      };
    } catch (error: unknown) {
      if (getStatusCode(error) === 404) {
        return {
          document: createEmptyPersonalLinksDocument(),
          appFolderWebUrl: this.appFolderWebUrl
        };
      }
      if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('personal links file'))) {
        throw new PersonalLinksServiceError(
          'invalid-data',
          'The Personal Links file in OneDrive is invalid and was not changed.'
        );
      }
      throw mapGraphError(error, 'Personal Links could not load your links from OneDrive.');
    }
  }

  public async save(
    document: IPersonalLinksDocument,
    expectedETag?: string,
    signal?: AbortSignal
  ): Promise<IPersonalLinksSnapshot> {
    if (signal?.aborted) {
      throw new DOMException('The request was cancelled.', 'AbortError');
    }

    try {
      let request = this.graphClient
        .api(FILE_CONTENT_PATH)
        .header('Content-Type', 'application/json');
      if (expectedETag) {
        request = request.header('If-Match', expectedETag);
      }
      const metadata = await request.put(JSON.stringify(document)) as IDriveItemMetadata;
      return {
        document,
        eTag: metadata.eTag,
        appFolderWebUrl: this.appFolderWebUrl
      };
    } catch (error: unknown) {
      throw mapGraphError(error, 'Personal Links could not save your changes to OneDrive.');
    }
  }
}
