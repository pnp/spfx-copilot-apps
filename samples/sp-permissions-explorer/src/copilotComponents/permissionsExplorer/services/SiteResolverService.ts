import { IResolvedSite } from '../models/IResolvedSite';
import { IExplorerServiceContext } from './IExplorerServiceContext';
import { SharePointRestService } from './SharePointRestService';
import { HttpError } from '../utils/retryPolicy';

interface ISpWebRaw {
  Title: string;
  ServerRelativeUrl: string;
}

interface ISearchCell { Key?: string; Value?: string; }
interface ISearchRow { Cells?: ISearchCell[]; }
interface ISearchTable { Rows?: ISearchRow[]; }
interface ISearchRelevantResults { Table?: ISearchTable; }
interface ISearchPrimaryResult { RelevantResults?: ISearchRelevantResults; }
interface ISearchResponse { PrimaryQueryResult?: ISearchPrimaryResult; }

const HTTP_URL_REGEX = /^https?:\/\//i;

/**
 * Resolves site inputs (an explicit URL or a search query) into a list of
 * candidate SharePoint sites. Uses the SharePoint Search REST API for
 * tenant-wide site discovery when a URL is not provided.
 */
export class SiteResolverService {
  private readonly sp: SharePointRestService;
  private readonly ctx: IExplorerServiceContext;

  public constructor(ctx: IExplorerServiceContext, sp: SharePointRestService) {
    this.ctx = ctx;
    this.sp = sp;
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

    return this.searchViaSharePoint(query);
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

  private async searchViaSharePoint(query: string): Promise<IResolvedSite[]> {
    const sanitized = query.replace(/'/g, "''").replace(/"/g, '');
    const kql = `${sanitized}* contentclass:STS_Site`;
    const params = [
      `querytext='${encodeURIComponent(kql)}'`,
      `selectproperties='${encodeURIComponent('Title,SPWebUrl,SiteId')}'`,
      'rowlimit=25',
      'trimduplicates=true',
      `clienttype='${encodeURIComponent('ContentSearchRegular')}'`
    ].join('&');
    const url = this.sp.ensureAbsolute(this.ctx.currentWebUrl, `/_api/search/query?${params}`);

    try {
      const response = await this.sp.getJson<ISearchResponse>(url);
      const rows = response?.PrimaryQueryResult?.RelevantResults?.Table?.Rows ?? [];
      const mapped: IResolvedSite[] = [];
      for (const row of rows) {
        const cells = row.Cells ?? [];
        const map: { [key: string]: string } = {};
        for (const cell of cells) {
          if (cell.Key !== undefined && cell.Value !== undefined) {
            map[cell.Key] = cell.Value;
          }
        }
        const webUrl = map.SPWebUrl ?? '';
        if (webUrl.length === 0) {
          continue;
        }
        const lower = webUrl.toLowerCase();
        if (lower.indexOf('-my.sharepoint.com') >= 0 || lower.indexOf('/personal/') >= 0) {
          continue;
        }
        const title = map.Title ?? '';
        const siteId = map.SiteId ?? '';
        mapped.push({
          id: siteId.length > 0 ? siteId : undefined,
          title: title.length > 0 ? title : webUrl,
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
