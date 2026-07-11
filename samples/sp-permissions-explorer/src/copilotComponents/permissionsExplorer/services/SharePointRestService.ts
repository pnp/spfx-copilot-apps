import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IExplorerServiceContext } from './IExplorerServiceContext';
import { HttpError, withRetry } from '../utils/retryPolicy';

/**
 * Low-level typed wrapper around SPHttpClient GET requests, with automatic
 * exponential-backoff retry on 429/503 responses. Payloads are never logged.
 */
export class SharePointRestService {
  private readonly ctx: IExplorerServiceContext;

  public constructor(ctx: IExplorerServiceContext) {
    this.ctx = ctx;
  }

  /**
   * Joins an absolute web URL with an /_api/... path. Trailing slash on the
   * web URL is trimmed and the api path is appended as-is.
   */
  public ensureAbsolute(webUrl: string, apiPath: string): string {
    const trimmed = (webUrl ?? '').replace(/\/+$/, '');
    const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    return `${trimmed}${path}`;
  }

  /**
   * Issues a GET request against an absolute SharePoint REST URL and returns
   * the parsed JSON body typed as T. Throws HttpError on non-2xx responses.
   */
  public async getJson<T>(absoluteUrl: string): Promise<T> {
    return withRetry<T>(async () => {
      const response: SPHttpClientResponse = await this.ctx.spHttpClient.get(
        absoluteUrl,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata'
          }
        }
      );

      if (!response.ok) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterMs = this.parseRetryAfter(retryAfterHeader);
        throw new HttpError(
          `SharePoint REST request failed with status ${response.status}`,
          response.status,
          retryAfterMs
        );
      }

      const body = (await response.json()) as T;
      return body;
    });
  }

  private parseRetryAfter(headerValue: string | null): number | undefined {
    if (headerValue === null || headerValue.length === 0) {
      return undefined;
    }
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
