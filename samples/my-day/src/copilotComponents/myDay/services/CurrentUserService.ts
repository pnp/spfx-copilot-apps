import type { IUser } from '../models/myDay';

/** Profile photo sizes exposed by the SharePoint `userphoto.aspx` endpoint. */
export type UserPhotoSize = 'S' | 'M' | 'L';

/**
 * Minimal slice of the SPFx page context this service reads. Declared
 * structurally (rather than importing the concrete `CopilotComponentContext`)
 * so the resolver stays trivially unit-testable with a plain object.
 */
export interface ICurrentUserContext {
  pageContext: {
    web: { absoluteUrl: string };
    user: { displayName: string; email: string; loginName: string };
  };
}

/**
 * Builds the SharePoint `userphoto.aspx` URL for an account. The endpoint
 * returns the user's cached profile photo, or a default silhouette placeholder
 * when they have none — so callers never need their own fallback image and no
 * network round-trip or Graph permission is required.
 */
export const buildUserPhotoUrl = (
  webAbsoluteUrl: string,
  accountName: string,
  size: UserPhotoSize = 'M'
): string | undefined => {
  if (!webAbsoluteUrl || !accountName) {
    return undefined;
  }

  const base = webAbsoluteUrl.replace(/\/$/, '');
  return `${base}/_layouts/15/userphoto.aspx?size=${size}&accountname=${encodeURIComponent(accountName)}`;
};

/**
 * Resolves the signed-in user synchronously from the SPFx page context.
 *
 * Name and email come straight from `pageContext.user` (populated before the
 * first render, so there is no loading state), and the photo URL is built from
 * the `userphoto.aspx` endpoint described in {@link buildUserPhotoUrl}.
 */
export const resolveCurrentUser = (
  context: ICurrentUserContext,
  photoSize: UserPhotoSize = 'M'
): IUser => {
  const { web, user } = context.pageContext;
  const displayName = user.displayName || user.loginName || 'You';
  const accountName = user.email || user.loginName;

  return {
    id: user.loginName || user.email || 'me',
    displayName,
    firstName: displayName.split(' ')[0] || displayName,
    photoUrl: buildUserPhotoUrl(web.absoluteUrl, accountName, photoSize)
  };
};
