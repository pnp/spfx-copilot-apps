import { IResolvedSite } from '../models/IResolvedSite';
import { IPermissionEntry } from '../models/IPermissionEntry';
import { IPermissionsSummary } from '../models/IPermissionsSummary';
import { IPermissionsToolInput } from '../models/IPermissionsToolInput';

import { IExplorerServiceContext } from './IExplorerServiceContext';
import { SharePointRestService } from './SharePointRestService';
import { GraphClientService } from './GraphClientService';
import { SiteResolverService } from './SiteResolverService';
import { PermissionsService } from './PermissionsService';
import { PrincipalResolverService } from './PrincipalResolverService';

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
  private readonly entriesCache: Map<string, IPermissionEntry[]>;

  public constructor(ctx: IExplorerServiceContext) {
    const sp = new SharePointRestService(ctx);
    const graph = new GraphClientService(ctx);
    this.siteResolver = new SiteResolverService(ctx, sp, graph);
    this.permissions = new PermissionsService(sp);
    this.principals = new PrincipalResolverService();
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

  private cacheKey(site: IResolvedSite): string {
    return (site.webUrl ?? '').toLowerCase().replace(/\/+$/, '');
  }
}
