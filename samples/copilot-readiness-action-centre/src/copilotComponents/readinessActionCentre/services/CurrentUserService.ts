import type { CopilotComponentContext } from '@microsoft/sp-copilot-component';
import { ICurrentUser } from '../models/readiness';

/**
 * Resolve the signed-in user from page context (no Graph call).
 * Photo via userphoto.aspx; name/email from pageContext.user.
 */
export function resolveCurrentUser(context: CopilotComponentContext): ICurrentUser {
  const user = context.pageContext?.user;
  const webAbsoluteUrl = context.pageContext?.web?.absoluteUrl || '';
  const loginName = user?.loginName || user?.email || '';
  const displayName = user?.displayName || 'there';
  const email = user?.email || '';

  let photoUrl: string | undefined;
  if (webAbsoluteUrl && loginName) {
    const account = encodeURIComponent(loginName);
    photoUrl = `${webAbsoluteUrl}/_layouts/15/userphoto.aspx?size=S&accountname=${account}`;
  }

  return { displayName, email, photoUrl };
}
