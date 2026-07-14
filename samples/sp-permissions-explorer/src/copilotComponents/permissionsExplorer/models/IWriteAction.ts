import type { IPermissionEntry } from './IPermissionEntry';

export type PermissionOperation =
  | 'review'
  | 'grantAccess'
  | 'removeAccess'
  | 'changePermissionLevel'
  | 'addToSharePointGroup'
  | 'removeFromSharePointGroup';

export interface IRoleDefinitionInfo {
  id: number;
  name: string;
  hidden?: boolean;
}

export interface IManageCapability {
  /** True when the current user can manage site permissions. */
  canManagePermissions: boolean;
  /** False when capability could not be determined (treat as read-only). */
  determined: boolean;
}

export type WriteActionStatus = 'success' | 'accessDenied' | 'error';

export interface IWriteActionResult {
  status: WriteActionStatus;
  message: string;
}

/** Describes a pending, not-yet-confirmed write action captured by the UI. */
export interface IPendingWriteAction {
  operation: PermissionOperation;
  /** Target principal or SharePoint group entry for the action. */
  entry?: IPermissionEntry;
  /** Group member entry (used by removeFromSharePointGroup). */
  member?: IPermissionEntry;
  /** Login name / email / UPN for grantAccess and addToSharePointGroup. */
  loginName?: string;
  /** Current permission level name (changePermissionLevel). */
  fromRoleName?: string;
  /** Target permission level name (grantAccess / changePermissionLevel). */
  toRoleName?: string;
}
