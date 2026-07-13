/**
 * Minimal shape of a Microsoft Graph `user` resource, limited to the fields
 * this component requests via `$select`. Avoids taking a dependency on
 * `@microsoft/microsoft-graph-types` for a handful of fields.
 */
export interface IGraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
  department?: string;
  userType?: string;
  accountEnabled?: boolean;
}
