export type PrincipalType =
  | 'User'
  | 'SharePointGroup'
  | 'Microsoft365Group'
  | 'SecurityGroup'
  | 'ExternalUser'
  | 'Unknown';

export type PermissionSource =
  | 'Direct'
  | 'SharePointGroup'
  | 'Microsoft365Group'
  | 'Unknown';

export interface IPermissionEntry {
  id: string;
  principalId?: number;      // SharePoint principal Id (for group expansion)
  displayName: string;
  loginName?: string;
  email?: string;
  principalType: PrincipalType;
  permissionLevels: string[];
  source: PermissionSource;
  isExternal?: boolean;
  isGroupExpandable?: boolean;
  groupMembers?: IPermissionEntry[];
  memberCount?: number;      // number of members in a SharePoint group; undefined when unknown (e.g. enumeration denied)
  membersRestricted?: boolean; // true when the current user cannot enumerate the group's members (403/401)
}
