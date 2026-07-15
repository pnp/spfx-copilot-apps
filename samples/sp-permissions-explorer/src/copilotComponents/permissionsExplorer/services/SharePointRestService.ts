import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';
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

  /**
   * Issues a POST request against an absolute SharePoint REST URL. Used for
   * write operations whose parameters are encoded in the URL (no response body
   * is required). Throws HttpError on non-2xx responses. The SPFx SPHttpClient
   * automatically attaches the request digest.
   */
  public async post(absoluteUrl: string, body?: unknown): Promise<void> {
    await withRetry<void>(async () => {
      const options: ISPHttpClientOptions = {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': ''
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
      };
      const response: SPHttpClientResponse = await this.ctx.spHttpClient.post(
        absoluteUrl,
        SPHttpClient.configurations.v1,
        options
      );
      if (!response.ok) {
        const retryAfterMs = this.parseRetryAfter(response.headers.get('Retry-After'));
        throw new HttpError(
          `SharePoint REST write failed with status ${response.status}`,
          response.status,
          retryAfterMs
        );
      }
    });
  }

  /**
   * Issues a POST request and returns the parsed JSON body typed as T. Throws
   * HttpError on non-2xx responses.
   */
  public async postJson<T>(absoluteUrl: string, body?: unknown): Promise<T> {
    return withRetry<T>(async () => {
      const options: ISPHttpClientOptions = {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': ''
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
      };
      const response: SPHttpClientResponse = await this.ctx.spHttpClient.post(
        absoluteUrl,
        SPHttpClient.configurations.v1,
        options
      );
      if (!response.ok) {
        const retryAfterMs = this.parseRetryAfter(response.headers.get('Retry-After'));
        throw new HttpError(
          `SharePoint REST write failed with status ${response.status}`,
          response.status,
          retryAfterMs
        );
      }
      return (await response.json()) as T;
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
