/**
 * Resolves the current user shown in the dashboard header.
 *
 * - When `useMock` is true, returns a standard Microsoft 365 demo persona
 *   (no network, initials avatar).
 * - When `useMock` is false, reads the signed-in user from Microsoft Graph
 *   (`/me`) via the brokered SSO `MSGraphClientV3`.
 *
 * The SPFx component layer owns the `MSGraphClientFactory` and passes it here,
 * keeping Graph access out of the React tree.
 */
import type { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';

import type { ICurrentUser } from '../models/dashboard';
import { initialsFromName, MOCK_CURRENT_USER } from '../mockData/people';

/** Return the mock persona. */
export function getMockCurrentUser(): ICurrentUser {
  return MOCK_CURRENT_USER;
}

/**
 * Resolve the signed-in user from Microsoft Graph. Falls back to a neutral
 * placeholder if the call fails (e.g. in the workbench).
 */
export async function getGraphCurrentUser(
  graphClientFactory: MSGraphClientFactory,
  fallbackDisplayName: string
): Promise<ICurrentUser> {
  try {
    const client: MSGraphClientV3 = await graphClientFactory.getClient('3');
    const me: { displayName?: string } = await client.api('/me').select('displayName').get();
    const displayName: string = me.displayName || fallbackDisplayName || 'User';
    // Photo retrieval via Graph is deferred; initials fallback is used for now.
    return { displayName, initials: initialsFromName(displayName) };
  } catch {
    const displayName: string = fallbackDisplayName || 'User';
    return { displayName, initials: initialsFromName(displayName) };
  }
}
