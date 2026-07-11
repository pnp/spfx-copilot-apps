import { PrincipalType } from '../models/IPermissionEntry';
import { isExternalUser } from './externalUserDetector';

// SharePoint PrincipalType flags (bitmask)
const SP_FLAG_USER = 1;
const SP_FLAG_SECURITY_GROUP = 4;
const SP_FLAG_SHAREPOINT_GROUP = 8;

/**
 * Best-effort detection of a Microsoft 365 (unified) group based on the
 * SharePoint claim login name shape.
 */
function isM365GroupClaim(loginName: string): boolean {
  const lower = loginName.toLowerCase();
  if (lower.indexOf('federateddirectoryclaimprovider') >= 0) {
    return true;
  }
  // Tenant-scoped M365 group claim often ends with '_o' after a guid, e.g.
  // c:0o.c|federateddirectoryclaimprovider|<guid>_o
  if (/[0-9a-f-]{36}_o$/i.test(lower)) {
    return true;
  }
  return false;
}

/**
 * Maps a SharePoint PrincipalType bitmask (and optional login name) to a
 * normalized PrincipalType used by the explorer UI. Defensive: unknown / zero
 * flags return 'Unknown'.
 */
export function mapSpPrincipalType(spPrincipalType: number, loginName?: string): PrincipalType {
  const login = loginName ?? '';

  if (isExternalUser(login)) {
    return 'ExternalUser';
  }

  const flags = typeof spPrincipalType === 'number' ? spPrincipalType : 0;

  if ((flags & SP_FLAG_SHAREPOINT_GROUP) === SP_FLAG_SHAREPOINT_GROUP) {
    return 'SharePointGroup';
  }

  if (login.length > 0 && isM365GroupClaim(login)) {
    return 'Microsoft365Group';
  }

  if ((flags & SP_FLAG_SECURITY_GROUP) === SP_FLAG_SECURITY_GROUP) {
    return 'SecurityGroup';
  }

  if ((flags & SP_FLAG_USER) === SP_FLAG_USER) {
    return 'User';
  }

  return 'Unknown';
}
