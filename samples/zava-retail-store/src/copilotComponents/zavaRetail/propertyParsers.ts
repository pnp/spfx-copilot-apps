import type { ZavaTheme } from './ZavaRetailTypes';

/**
 * Parsers that convert the string-encoded component properties back into the concrete
 * types the application works with. All authored properties are exposed as strings, so
 * booleans and enums are normalized here defensively (trimmed, case-insensitive) and
 * fall back to sensible defaults when the value is missing or unrecognized.
 */

/** Parse a string such as "true"/"false" into a boolean. */
export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  return fallback;
}

/** Parse a string such as "light"/"dark" into a ZavaTheme, defaulting to "light". */
export function parseTheme(value: string | undefined): ZavaTheme {
  return value?.trim().toLowerCase() === 'dark' ? 'dark' : 'light';
}

/** Normalize an optional string property, returning undefined when blank. */
export function parseOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
