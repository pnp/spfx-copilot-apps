import { IExplorerServiceContext } from './IExplorerServiceContext';
import { HttpError, withRetry } from '../utils/retryPolicy';

interface IGraphErrorShape {
  statusCode?: number;
  code?: string;
  message?: string;
  headers?: { [key: string]: string };
}

/**
 * Thin wrapper around MSGraphClientV3 that centralizes retry and error
 * normalization. Consumers pass a Graph API path (e.g. '/sites') and optional
 * query string parameters.
 */
export class GraphClientService {
  private readonly ctx: IExplorerServiceContext;

  public constructor(ctx: IExplorerServiceContext) {
    this.ctx = ctx;
  }

  /**
   * Performs a GET request against Microsoft Graph, applying retries on 429
   * responses. Errors are converted to HttpError when a numeric status is
   * available from the underlying Graph SDK error.
   */
  public async get<T>(apiPath: string, query?: Record<string, string>): Promise<T> {
    return withRetry<T>(async () => {
      try {
        const client = await this.ctx.getGraphClient();
        let request = client.api(apiPath);
        if (query !== undefined) {
          for (const key of Object.keys(query)) {
            request = request.query({ [key]: query[key] });
          }
        }
        const result = await request.get();
        return result as T;
      } catch (err: unknown) {
        throw this.normalizeError(err);
      }
    });
  }

  private normalizeError(err: unknown): HttpError | Error {
    if (err instanceof HttpError) {
      return err;
    }
    const shape = err as IGraphErrorShape;
    const status = typeof shape?.statusCode === 'number' ? shape.statusCode : undefined;
    const message = shape?.message ?? 'Microsoft Graph request failed';
    if (typeof status === 'number') {
      const retryAfter = shape.headers?.['retry-after'] ?? shape.headers?.['Retry-After'];
      const retryAfterMs = retryAfter !== undefined ? this.parseRetryAfter(retryAfter) : undefined;
      return new HttpError(message, status, retryAfterMs);
    }
    return err instanceof Error ? err : new Error(message);
  }

  private parseRetryAfter(headerValue: string): number | undefined {
    const asNumber = Number(headerValue);
    if (!isNaN(asNumber) && asNumber >= 0) {
      return asNumber * 1000;
    }
    const asDate = Date.parse(headerValue);
    if (!isNaN(asDate)) {
      const diff = asDate - Date.now();
      return diff > 0 ? diff : undefined;
    }
    return undefined;
  }
}
