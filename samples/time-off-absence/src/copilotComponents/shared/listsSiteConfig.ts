// Server-relative path of the SharePoint site that hosts the Time-Off lists
// (TimeOffRequests, LeaveBalances, CompanyHolidays), e.g. '/sites/spfx'.
//
// The HOST is NOT hardcoded: it is taken automatically from the SPFx page context
// at runtime (the origin of context.pageContext.web.absoluteUrl). Only the site
// path below is fixed, so the components follow whichever tenant they run in and
// just need the right site path.
//
// WHY A FIXED SITE PATH IS NEEDED
// The components fetch their data with delegated, client-side SharePoint REST
// calls. On a SharePoint page the "current web" already IS the site that holds the
// lists. But these are Copilot Components: inside Microsoft 365 Copilot / BizChat
// there is no current SharePoint page, and the host resolves the current web to
// the tenant ROOT site. REST calls against the root web 404 (the lists live on a
// specific site, not the root), so every component silently falls back to demo
// data. Pinning the site path — while taking the host from context — fixes this.
//
// DEPLOYERS: this constant is the COMPILED-IN DEFAULT. You normally don't need to
// touch it — an admin can override the site path per-tenant at RUNTIME (no
// rebuild, no redeploy) by setting a SharePoint tenant property named
// 'TimeOffSite' (see TIME_OFF_SITE_TENANT_PROPERTY / resolveListsSitePath below
// and Provision-TimeOffLists.ps1 -SetTenantProperty). Change this constant only to
// move the build-time default: set it to the server-relative path of the site you
// ran Provision-TimeOffLists.ps1 against (the path part of its -SiteUrl). Leave it
// empty ('') to keep the legacy behavior of using whatever web the component is
// hosted in — only correct when the component runs on a page on the lists' own
// site.
export const TIME_OFF_LISTS_SITE_PATH = '/sites/spfx';

// Name of the SharePoint tenant property (an app-catalog storage entity) that,
// when present and non-empty, overrides TIME_OFF_LISTS_SITE_PATH at runtime. It is
// read with a delegated, client-side REST call —
//   GET {web}/_api/web/GetStorageEntity('TimeOffSite')
// — which resolves from ANY site in the tenant (including the tenant root the
// Copilot host hands us), and written with Set-PnPStorageEntity. This lets admins
// repoint the components at a different lists site without rebuilding the package.
export const TIME_OFF_SITE_TENANT_PROPERTY = 'TimeOffSite';

/**
 * Resolve the web URL the data services should target for SharePoint REST.
 *
 * Combines the HOST (origin) taken from the ambient web URL with the configured
 * site path, e.g. ambient `https://contoso.sharepoint.com` (the tenant root the
 * Copilot host hands us) + `/sites/spfx` => `https://contoso.sharepoint.com/sites/spfx`.
 * Any site segment already present in the ambient URL is ignored — the host is the
 * only part taken from context. Falls back to the raw ambient web URL when no site
 * path is configured, or when the ambient URL has no parseable origin. Trailing
 * slashes don't matter — the data services normalize them.
 *
 * @param ambientWebUrl the host's current web (pageContext.web.absoluteUrl)
 * @param listsSitePath the configured site path; defaults to
 *                      TIME_OFF_LISTS_SITE_PATH. May be a server-relative path
 *                      ('/sites/spfx') or a full absolute URL — a full URL (e.g.
 *                      from the TimeOffSite tenant property) is used verbatim.
 */
export function resolveListsWebUrl(
  ambientWebUrl: string,
  listsSitePath: string = TIME_OFF_LISTS_SITE_PATH
): string {
  const ambient = (ambientWebUrl || '').trim();
  const path = (listsSitePath || '').trim();

  // No site path configured -> legacy ambient-web behavior.
  if (path.length === 0) {
    return ambient;
  }

  // The override may itself be a full absolute URL (e.g. an admin set the
  // TimeOffSite tenant property to 'https://contoso.sharepoint.com/sites/spfx').
  // In that case it already carries its own host — use it verbatim.
  if (/^https?:\/\//i.test(path)) {
    return path.replace(/\/+$/, '');
  }

  // Take only the origin (scheme + host[:port]) from the ambient web URL.
  const originMatch = /^(https?:\/\/[^/]+)/i.exec(ambient);
  if (!originMatch) {
    return ambient;
  }
  const origin = originMatch[1];

  const normalizedPath = path.charAt(0) === '/' ? path : `/${path}`;
  return origin + normalizedPath;
}

/**
 * Minimal HTTP GET port for reading the tenant property. Structurally matches the
 * data services' ITimeOffHttpClient (and the SPHttp adapter the factories build
 * around it), so the very same `http` object can be passed in — without shared/
 * taking a dependency on a feature folder's types.
 */
export interface IStorageEntityResponse {
  ok: boolean;
  status: number;
  json(): Promise<Record<string, unknown>>;
}
export interface IStorageEntityHttpClient {
  get(
    url: string,
    headers: { [name: string]: string }
  ): Promise<IStorageEntityResponse>;
}

/**
 * Resolve the lists SITE PATH, honoring a per-tenant runtime override.
 *
 * Reads the 'TimeOffSite' tenant property (app-catalog storage entity) with a
 * delegated, client-side REST call against the ambient web:
 *   GET {ambientWeb}/_api/web/GetStorageEntity('TimeOffSite')
 * GetStorageEntity resolves from ANY site in the tenant — including the tenant
 * root the Copilot host hands us — so this works inside Copilot/BizChat. When the
 * property exists and its Value is a non-empty string, that value is returned;
 * otherwise the compiled-in fallback (TIME_OFF_LISTS_SITE_PATH) is used.
 *
 * This NEVER throws and NEVER blocks rendering: every failure mode (empty ambient
 * URL, non-2xx response, missing/empty/non-string Value, network or parse error)
 * quietly yields the fallback path. The returned value may be a server-relative
 * path ('/sites/spfx') or a full absolute URL — resolveListsWebUrl accepts both.
 *
 * @param http          GET port (the factory's SPHttp adapter is assignable)
 * @param ambientWebUrl the host's current web (pageContext.web.absoluteUrl)
 * @param fallbackPath  used when the tenant property is absent/empty/unreadable;
 *                      defaults to TIME_OFF_LISTS_SITE_PATH
 */
export async function resolveListsSitePath(
  http: IStorageEntityHttpClient,
  ambientWebUrl: string,
  fallbackPath: string = TIME_OFF_LISTS_SITE_PATH
): Promise<string> {
  const ambient = (ambientWebUrl || '').trim().replace(/\/+$/, '');
  if (ambient.length === 0) {
    return fallbackPath;
  }

  try {
    const url =
      ambient +
      "/_api/web/GetStorageEntity('" +
      TIME_OFF_SITE_TENANT_PROPERTY +
      "')";
    const response = await http.get(url, {
      Accept: 'application/json;odata=nometadata'
    });
    if (!response || !response.ok) {
      return fallbackPath;
    }
    const body = await response.json();
    const raw = body ? body.Value : undefined;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
  } catch {
    // Swallow — the override is best-effort; fall back to the default path.
  }

  return fallbackPath;
}
