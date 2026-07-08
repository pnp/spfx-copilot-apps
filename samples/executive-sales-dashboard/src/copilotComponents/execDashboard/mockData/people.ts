/**
 * Standard Microsoft 365 demo personas used for the mock current user.
 *
 * Faces are omitted to keep the sample lightweight; the UI falls back to
 * initials in a Fluent `Avatar`. When `useMock` is false the real signed-in
 * user is resolved from Microsoft Graph instead (see `CurrentUserService`).
 */
import type { ICurrentUser } from '../models/dashboard';

/** Derive two-letter initials from a display name. */
export function initialsFromName(name: string): string {
  const parts: string[] = name.trim().split(/\s+/);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** The default mock persona shown when `useMock` is true. */
export const MOCK_CURRENT_USER: ICurrentUser = {
  displayName: 'Megan Bowen',
  initials: initialsFromName('Megan Bowen')
};
