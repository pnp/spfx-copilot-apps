/**
 * HTTP error carrying the numeric status code and optional Retry-After hint.
 */
export class HttpError extends Error {
  public constructor(message: string, public status: number, public retryAfterMs?: number) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface IRetryOptions {
  retries?: number;
  baseDelayMs?: number;
  shouldRetry?: (status: number) => boolean;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;

function defaultShouldRetry(status: number): boolean {
  return status === 429 || status === 503;
}

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an async operation with exponential backoff retry on 429/503 responses.
 *
 * Only retries when the thrown error is an HttpError (or exposes a numeric `status`)
 * whose status matches the retry predicate. Retry-After hint (retryAfterMs) is
 * honored when present on the thrown error.
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: IRetryOptions): Promise<T> {
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const shouldRetry = options?.shouldRetry ?? defaultShouldRetry;

  let attempt = 0;
  // Loop: attempt 0..retries inclusive gives retries retries after the first try.
  // We'll perform up to (retries + 1) total attempts.
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const retryAfterMs = (err as { retryAfterMs?: number }).retryAfterMs;
      const canRetry = typeof status === 'number' && shouldRetry(status) && attempt < retries;
      if (!canRetry) {
        throw err;
      }
      const backoff = typeof retryAfterMs === 'number' && retryAfterMs > 0
        ? retryAfterMs
        : baseDelayMs * Math.pow(2, attempt);
      await delay(backoff);
      attempt += 1;
    }
  }
}
