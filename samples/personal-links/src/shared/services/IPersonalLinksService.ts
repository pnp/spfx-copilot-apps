import type { IPersonalLinksDocument, IPersonalLinksSnapshot } from '../models/personalLinks';

export type PersonalLinksServiceErrorCode =
  | 'permission'
  | 'conflict'
  | 'unavailable'
  | 'invalid-data'
  | 'unknown';

export class PersonalLinksServiceError extends Error {
  public constructor(
    public readonly code: PersonalLinksServiceErrorCode,
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'PersonalLinksServiceError';
  }
}

export interface IPersonalLinksService {
  load(signal?: AbortSignal): Promise<IPersonalLinksSnapshot>;
  save(
    document: IPersonalLinksDocument,
    expectedETag?: string,
    signal?: AbortSignal
  ): Promise<IPersonalLinksSnapshot>;
}
