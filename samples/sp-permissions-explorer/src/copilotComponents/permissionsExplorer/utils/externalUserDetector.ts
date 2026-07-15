/**
 * Detects whether a principal appears to be an external / guest user based on its
 * SharePoint login name or email address. Case-insensitive.
 */
export function isExternalUser(loginName?: string, email?: string): boolean {
  const login = (loginName ?? '').toLowerCase();
  const mail = (email ?? '').toLowerCase();
  if (login.length === 0 && mail.length === 0) {
    return false;
  }
  if (login.indexOf('#ext#') >= 0 || mail.indexOf('#ext#') >= 0) {
    return true;
  }
  if (login.indexOf('urn:spo:guest') === 0) {
    return true;
  }
  if (login.indexOf('urn:spo:anon') >= 0) {
    return true;
  }
  return false;
}
