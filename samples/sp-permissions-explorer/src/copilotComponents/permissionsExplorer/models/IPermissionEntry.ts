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
  | 'Inherited'
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
}
