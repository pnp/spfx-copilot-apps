import { IResolvedSite } from '../models/IResolvedSite';
import { IExplorerServiceContext } from './IExplorerServiceContext';
import { SharePointRestService } from './SharePointRestService';
import { GraphClientService } from './GraphClientService';
import { HttpError } from '../utils/retryPolicy';

interface ISpWebRaw {
  Title: string;
  ServerRelativeUrl: string;
}

interface IGraphSiteRaw {
  id?: string;
  displayName?: string;
  name?: string;
  webUrl?: string;
}

interface IGraphSitesResponse {
  value: IGraphSiteRaw[];
}

const HTTP_URL_REGEX = /^https?:\/\//i;

/**
 * Resolves site inputs (an explicit URL or a search query) into a list of
 * candidate SharePoint sites. Uses Microsoft Graph site search when a URL is
 * not provided.
 */
export class SiteResolverService {
  private readonly sp: SharePointRestService;
  private readonly graph: GraphClientService;
  private readonly ctx: IExplorerServiceContext;

  public constructor(ctx: IExplorerServiceContext, sp: SharePointRestService, graph: GraphClientService) {
    this.ctx = ctx;
    this.sp = sp;
    this.graph = graph;
  }

  /**
   * Resolves the input into 0..n IResolvedSite entries. Only throws for
   * unexpected transport / access errors — a "not found" resolves to [].
   */
  public async resolveSites(input: { siteQuery: string; siteUrl?: string }): Promise<IResolvedSite[]> {
    const explicitUrl = this.pickExplicitUrl(input);
    if (explicitUrl !== undefined) {
      const site = await this.tryLoadSiteByUrl(explicitUrl);
      if (site !== undefined) {
        return [site];
      }
      // Fall through to search when the direct load fails softly.
    }

    const query = (input.siteQuery ?? '').trim();
    if (query.length === 0) {
      return [];
    }

    return this.searchViaGraph(query);
  }

  private pickExplicitUrl(input: { siteQuery: string; siteUrl?: string }): string | undefined {
    if (input.siteUrl !== undefined && HTTP_URL_REGEX.test(input.siteUrl)) {
      return input.siteUrl;
    }
    if (input.siteQuery !== undefined && HTTP_URL_REGEX.test(input.siteQuery)) {
      return input.siteQuery;
    }
    return undefined;
  }

  private async tryLoadSiteByUrl(siteUrl: string): Promise<IResolvedSite | undefined> {
    const trimmed = siteUrl.replace(/\/+$/, '');
    const url = `${trimmed}/_api/web?$select=Title,ServerRelativeUrl`;
    try {
      const web = await this.sp.getJson<ISpWebRaw>(url);
      return {
        title: web.Title,
        webUrl: trimmed,
        serverRelativeUrl: web.ServerRelativeUrl
      };
    } catch (err: unknown) {
      // Soft-fail so the caller can fall back to search.
      const status = (err as { status?: number }).status;
      if (typeof status === 'number' && status !== 404 && status !== 403 && status !== 401) {
        // Unexpected transport error — surface it.
        throw err;
      }
      return undefined;
    }
  }

  private async searchViaGraph(query: string): Promise<IResolvedSite[]> {
    try {
      const response = await this.graph.get<IGraphSitesResponse>('/sites', { search: query });
      const value = Array.isArray(response?.value) ? response.value : [];
      const mapped: IResolvedSite[] = [];
      for (const raw of value) {
        const webUrl = raw.webUrl ?? '';
        if (webUrl.length === 0) {
          continue;
        }
        const lower = webUrl.toLowerCase();
        if (lower.indexOf('-my.sharepoint.com') >= 0 || lower.indexOf('/personal/') >= 0) {
          continue;
        }
        mapped.push({
          id: raw.id,
          title: raw.displayName ?? raw.name ?? webUrl,
          webUrl
        });
      }
      return mapped;
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 404) {
        return [];
      }
      throw err;
    }
  }
}
