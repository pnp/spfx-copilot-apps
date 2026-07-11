export type PermissionFilter =
  | 'all'
  | 'users'
  | 'groups'
  | 'externalUsers'
  | 'fullControl'
  | 'edit'
  | 'read'
  | 'directOnly'
  | 'inheritedOnly';

export type ExplorerMode = 'summary' | 'details' | 'userLookup';

export interface IPermissionsToolInput {
  siteQuery: string;
  siteUrl?: string;
  filter?: PermissionFilter;
  principalQuery?: string;
  includeGroups?: boolean;
  includeExternalUsers?: boolean;
  includeInheritedPermissions?: boolean;
  mode?: ExplorerMode;
}
