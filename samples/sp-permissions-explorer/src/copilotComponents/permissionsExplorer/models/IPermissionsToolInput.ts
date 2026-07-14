import type { PermissionOperation } from './IWriteAction';

export type PermissionFilter =
  | 'all'
  | 'users'
  | 'groups'
  | 'externalUsers'
  | 'fullControl'
  | 'edit'
  | 'read'
  | 'directOnly';

export type ExplorerMode = 'summary' | 'details' | 'userLookup';

export interface IPermissionsToolInput {
  siteQuery: string;
  siteUrl?: string;
  filter?: PermissionFilter;
  principalQuery?: string;
  includeGroups?: boolean;
  includeExternalUsers?: boolean;
  mode?: ExplorerMode;
  operation?: PermissionOperation;
  sourcePermissionLevel?: string;
  targetPermissionLevel?: string;
  targetGroupQuery?: string;
  requireConfirmation?: boolean;
}
