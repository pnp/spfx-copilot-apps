/**
 * Minimal SPBasePermissions bit-check helper. SharePoint returns effective
 * permissions as a { High, Low } pair; permission "kinds" are 1-based bit
 * indexes across the 64-bit mask (Low = bits 1-32, High = bits 33-64).
 */
export interface IBasePermissions {
  High: number;
  Low: number;
}

// PermissionKind.ManagePermissions is kind 26 (1-based) => Low bit index 25.
const MANAGE_PERMISSIONS_KIND = 26;

/**
 * Returns true when the effective permissions include the given permission
 * kind (1-based SharePoint PermissionKind value).
 */
export function hasPermission(perms: IBasePermissions, kind: number): boolean {
  const bit = kind - 1;
  if (bit >= 0 && bit < 32) {
    return (perms.Low & (1 << bit)) !== 0;
  }
  if (bit >= 32 && bit < 64) {
    return (perms.High & (1 << (bit - 32))) !== 0;
  }
  return false;
}

/** Returns true when the current user can manage permissions on the object. */
export function canManagePermissions(perms: IBasePermissions): boolean {
  return hasPermission(perms, MANAGE_PERMISSIONS_KIND);
}
