export interface IPermissionsSummary {
  title: string;
  webUrl: string;
  totalPrincipals: number;
  userCount: number;
  groupCount: number;         // SharePoint groups
  m365GroupCount: number;
  externalUserCount: number;
  hasUniquePermissions: boolean | undefined; // undefined = could not determine
}
