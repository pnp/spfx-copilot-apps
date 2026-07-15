import { IResolvedSite } from '../models/IResolvedSite';
import { IPermissionEntry } from '../models/IPermissionEntry';
import { IPermissionsSummary } from '../models/IPermissionsSummary';
import { IPermissionsToolInput } from '../models/IPermissionsToolInput';
import { IManageCapability, IRoleDefinitionInfo, IWriteActionResult } from '../models/IWriteAction';

import { IExplorerServiceContext } from './IExplorerServiceContext';
import { SharePointRestService } from './SharePointRestService';
import { SiteResolverService } from './SiteResolverService';
import { PermissionsService } from './PermissionsService';
import { PrincipalResolverService } from './PrincipalResolverService';
import { PermissionWriteService } from './PermissionWriteService';

/**
 * Public facade consumed by the UI. Keeps a single seam so the frontend agent
 * does not depend on the internal service layout.
 */
export interface IPermissionsExplorerService {
  resolveSites(input: IPermissionsToolInput): Promise<IResolvedSite[]>;
  getSummary(site: IResolvedSite): Promise<IPermissionsSummary>;
  getPermissions(site: IResolvedSite): Promise<IPermissionEntry[]>;
  expandGroup(site: IResolvedSite, principalId: number): Promise<IPermissionEntry[]>;
  matchesPrincipal(entry: IPermissionEntry, query: string): boolean;
  getCapabilities(site: IResolvedSite): Promise<IManageCapability>;
  getRoleDefinitions(site: IResolvedSite): Promise<IRoleDefinitionInfo[]>;
  grantAccess(site: IResolvedSite, loginName: string, roleName: string): Promise<IWriteActionResult>;
  removeAccess(site: IResolvedSite, entry: IPermissionEntry): Promise<IWriteActionResult>;
  changePermissionLevel(site: IResolvedSite, entry: IPermissionEntry, fromRoleName: string, toRoleName: string): Promise<IWriteActionResult>;
  addUserToGroup(site: IResolvedSite, groupPrincipalId: number, loginName: string): Promise<IWriteActionResult>;
  removeUserFromGroup(site: IResolvedSite, groupPrincipalId: number, userPrincipalId: number): Promise<IWriteActionResult>;
}

/**
 * Default implementation of IPermissionsExplorerService. Wires the sub-services
 * together and caches the last permissions result per webUrl in-memory so a
 * subsequent getSummary() call does not re-issue the network request.
 * The cache is process-local and is never persisted to storage.
 */
export class PermissionsExplorerService implements IPermissionsExplorerService {
  private readonly siteResolver: SiteResolverService;
  private readonly permissions: PermissionsService;
  private readonly principals: PrincipalResolverService;
  private readonly writes: PermissionWriteService;
  private readonly entriesCache: Map<string, IPermissionEntry[]>;

  public constructor(ctx: IExplorerServiceContext) {
    const sp = new SharePointRestService(ctx);
    this.siteResolver = new SiteResolverService(ctx, sp);
    this.permissions = new PermissionsService(sp);
    this.principals = new PrincipalResolverService();
    this.writes = new PermissionWriteService(sp);
    this.entriesCache = new Map<string, IPermissionEntry[]>();
  }

  /**
   * Resolves the incoming tool input into candidate sites.
   */
  public async resolveSites(input: IPermissionsToolInput): Promise<IResolvedSite[]> {
    return this.siteResolver.resolveSites({ siteQuery: input.siteQuery, siteUrl: input.siteUrl });
  }

  /**
   * Returns a summary of the permissions for the resolved site. Reuses cached
   * entries when present.
   */
  public async getSummary(site: IResolvedSite): Promise<IPermissionsSummary> {
    const cached = this.entriesCache.get(this.cacheKey(site));
    return this.permissions.getSummary(site, cached);
  }

  /**
   * Loads and caches the permission entries for the resolved site.
   */
  public async getPermissions(site: IResolvedSite): Promise<IPermissionEntry[]> {
    const entries = await this.permissions.getPermissions(site);
    this.entriesCache.set(this.cacheKey(site), entries);
    return entries;
  }

  /**
   * Expands a SharePoint group and returns its member users.
   */
  public async expandGroup(site: IResolvedSite, principalId: number): Promise<IPermissionEntry[]> {
    return this.permissions.expandGroup(site, principalId);
  }

  /**
   * Case-insensitive match of an entry against a user-supplied query.
   */
  public matchesPrincipal(entry: IPermissionEntry, query: string): boolean {
    return this.principals.matches(entry, query);
  }

  public async getCapabilities(site: IResolvedSite): Promise<IManageCapability> {
    return this.writes.getCapabilities(site);
  }

  public async getRoleDefinitions(site: IResolvedSite): Promise<IRoleDefinitionInfo[]> {
    return this.writes.getRoleDefinitions(site);
  }

  public async grantAccess(site: IResolvedSite, loginName: string, roleName: string): Promise<IWriteActionResult> {
    const result = await this.writes.grantAccess(site, loginName, roleName);
    this.invalidate(site, result);
    return result;
  }

  public async removeAccess(site: IResolvedSite, entry: IPermissionEntry): Promise<IWriteActionResult> {
    const result = await this.writes.removeAccess(site, entry);
    this.invalidate(site, result);
    return result;
  }

  public async changePermissionLevel(site: IResolvedSite, entry: IPermissionEntry, fromRoleName: string, toRoleName: string): Promise<IWriteActionResult> {
    const result = await this.writes.changePermissionLevel(site, entry, fromRoleName, toRoleName);
    this.invalidate(site, result);
    return result;
  }

  public async addUserToGroup(site: IResolvedSite, groupPrincipalId: number, loginName: string): Promise<IWriteActionResult> {
    const result = await this.writes.addUserToGroup(site, groupPrincipalId, loginName);
    this.invalidate(site, result);
    return result;
  }

  public async removeUserFromGroup(site: IResolvedSite, groupPrincipalId: number, userPrincipalId: number): Promise<IWriteActionResult> {
    const result = await this.writes.removeUserFromGroup(site, groupPrincipalId, userPrincipalId);
    this.invalidate(site, result);
    return result;
  }

  private invalidate(site: IResolvedSite, result: IWriteActionResult): void {
    if (result.status === 'success') {
      this.entriesCache.delete(this.cacheKey(site));
    }
  }

  private cacheKey(site: IResolvedSite): string {
    return (site.webUrl ?? '').toLowerCase().replace(/\/+$/, '');
  }
}
