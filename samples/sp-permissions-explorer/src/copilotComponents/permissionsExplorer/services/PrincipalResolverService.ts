import { IPermissionEntry } from '../models/IPermissionEntry';

/**
 * Lowercases a value and strips common SharePoint claim prefixes / suffixes so
 * a user-supplied query can be compared against a login name.
 */
export function normalizeForCompare(value?: string): string {
  if (value === undefined || value === null) {
    return '';
  }
  let v = value.toLowerCase().trim();
  // Strip common claim prefixes like: i:0#.f|membership|user@contoso.com
  // and c:0o.c|federateddirectoryclaimprovider|<guid>
  const pipeIdx = v.lastIndexOf('|');
  if (pipeIdx >= 0 && pipeIdx < v.length - 1) {
    v = v.substring(pipeIdx + 1);
  }
  // Strip #ext#... fragments (guest users)
  const extIdx = v.indexOf('#ext#');
  if (extIdx >= 0) {
    v = v.substring(0, extIdx);
  }
  return v;
}

/**
 * Matches permission entries (and their expanded group members) against a
 * user-supplied query string using case-insensitive comparison across
 * displayName, email and normalized loginName.
 */
export class PrincipalResolverService {
  /**
   * Returns true when the query matches this entry or any of its expanded group members.
   */
  public matches(entry: IPermissionEntry, query: string): boolean {
    const q = (query ?? '').trim().toLowerCase();
    if (q.length === 0) {
      return false;
    }
    if (this.matchesSingle(entry, q)) {
      return true;
    }
    const members = entry.groupMembers;
    if (Array.isArray(members)) {
      for (const m of members) {
        if (this.matchesSingle(m, q)) {
          return true;
        }
      }
    }
    return false;
  }

  private matchesSingle(entry: IPermissionEntry, lowerQuery: string): boolean {
    const display = (entry.displayName ?? '').toLowerCase();
    const email = (entry.email ?? '').toLowerCase();
    const login = normalizeForCompare(entry.loginName);
    if (display.length > 0 && display.indexOf(lowerQuery) >= 0) {
      return true;
    }
    if (email.length > 0 && email.indexOf(lowerQuery) >= 0) {
      return true;
    }
    if (login.length > 0 && login.indexOf(lowerQuery) >= 0) {
      return true;
    }
    return false;
  }
}
