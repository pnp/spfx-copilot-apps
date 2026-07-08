// Live SharePoint implementation of ITimeOffDataService.
//
// THE SHOWCASE: this service runs *inside* the Copilot component and talks to
// SharePoint directly with the signed-in user's delegated identity — no MCP
// server, no middle tier. The component fetches and writes the user's own
// time-off data client-side via SPHttpClient. That client-side, authenticated
// API access is exactly what the generic MCP App spec cannot do.
//
// Design constraints honoured here:
//  * The ITimeOffDataService contract stays fully SYNCHRONOUS, so swapping the
//    in-memory service for this one needs ZERO UI changes. Reads are served
//    from a cache that `load()` populates once, up front.
//  * `load()` is async and called from the component's onInit BEFORE the first
//    render, so there is no empty flash.
//  * Writes are OPTIMISTIC: the cache is updated and returned synchronously
//    (matching the in-memory contract), then the REST call is fired in the
//    background and reconciled.
//  * RESILIENT: if the lists are missing / unreachable (e.g. local Workbench)
//    or the user simply has no rows, the service self-heals by seeding the same
//    demo data the in-memory service uses, so the component always renders.
//
// To stay trivially unit-testable, this file depends on a NARROW HTTP port
// (ITimeOffHttpClient) rather than @microsoft/sp-http directly. The real
// SPHttpClient is adapted to that port in createTimeOffDataService.ts.

import { InMemoryTimeOffDataService } from './InMemoryTimeOffDataService';
import { reconcileBalances } from '../logic/reconcileBalances';
import type { ITimeOffDataService } from './ITimeOffDataService';
import type {
  ICompanyHoliday,
  IEmployeeProfile,
  ILeaveBalance,
  INewTimeOffRequestInput,
  ITimeOffRequest,
  LeaveType,
  RequestStatus
} from './types';

/** Minimal response shape the service needs (a subset of SPHttpClientResponse). */
export interface ITimeOffHttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<{ value?: unknown[]; [key: string]: unknown }>;
}

/**
 * Narrow HTTP port the service talks to. The real SPHttpClient is adapted to
 * this in the factory; tests inject a trivial fake. `headers` are plain string
 * maps so neither the service nor its tests import any SPFx http types.
 */
export interface ITimeOffHttpClient {
  get(url: string, headers: { [name: string]: string }): Promise<ITimeOffHttpResponse>;
  post(
    url: string,
    headers: { [name: string]: string },
    body: string
  ): Promise<ITimeOffHttpResponse>;
}

/** The signed-in user's line manager, resolved from Microsoft Graph. */
export interface ITimeOffManager {
  displayName?: string;
  /** The manager's mail, or userPrincipalName when mail is absent. */
  email?: string;
}

/**
 * Narrow Microsoft Graph port: resolves the signed-in user's line manager
 * (GET /me/manager). The real MSGraphClientV3 is adapted to this in the factory
 * — another delegated, client-side call under the user's own identity — while
 * tests inject a fake. Implementations MUST NEVER throw: they return undefined
 * when the user has no manager (Graph 404) or Graph is unavailable / not consented.
 */
export interface ITimeOffManagerLookup {
  getMyManager(): Promise<ITimeOffManager | undefined>;
}

export interface ISharePointTimeOffOptions {
  http: ITimeOffHttpClient;
  webAbsoluteUrl: string;
  currentUser: { displayName?: string; email?: string; loginName?: string };
  /**
   * Optional Graph lookup for the submitter's line manager. When supplied and a
   * manager is found, new requests are routed to that manager for approval; when
   * omitted (or no manager exists) the submitter is recorded as their own
   * approver, which keeps single-user demo tenants working.
   */
  managerLookup?: ITimeOffManagerLookup;
}

const LIST_REQUESTS = 'TimeOffRequests';
const LIST_BALANCES = 'LeaveBalances';
const LIST_HOLIDAYS = 'CompanyHolidays';

// SharePoint Choice text <-> code enums (translated both ways).
const LEAVE_FROM_SP: { [text: string]: LeaveType } = {
  Vacation: 'vacation',
  Sick: 'sick',
  Personal: 'personal'
};
const LEAVE_TO_SP: { [code: string]: string } = {
  vacation: 'Vacation',
  sick: 'Sick',
  personal: 'Personal'
};
const STATUS_FROM_SP: { [text: string]: RequestStatus } = {
  Pending: 'pending',
  Approved: 'approved',
  Declined: 'declined',
  Cancelled: 'cancelled'
};
const STATUS_TO_SP: { [code: string]: string } = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  cancelled: 'Cancelled'
};

const NO_METADATA = 'application/json;odata=nometadata';

/** ISO yyyy-mm-dd for "today" (UTC) — matches the in-memory service exactly so
 * the derived upcoming/recent split is identical across data sources. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

/**
 * Normalise a SharePoint date value to yyyy-mm-dd using LOCAL calendar
 * components. SharePoint date-only fields round-trip through the web's regional
 * timezone, so a value stored "2025-06-14" can come back as
 * "2025-06-13T23:00:00Z" for a UTC+1 viewer. A naive substring would be
 * off-by-one; reading the local Y/M/D restores the intended calendar day when
 * the viewing browser shares the storage timezone (the common single-org case).
 */
function toDateOnly(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    return '';
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return value.slice(0, 10);
  }
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function leaveLabel(leaveType: LeaveType): string {
  return leaveType.charAt(0).toUpperCase() + leaveType.slice(1);
}

interface ISpPersonField {
  EMail?: string;
  Title?: string;
}

export class SharePointTimeOffDataService implements ITimeOffDataService {
  private readonly _http: ITimeOffHttpClient;
  private readonly _web: string;
  private readonly _currentUser: {
    displayName?: string;
    email?: string;
    loginName?: string;
  };

  private _profile: IEmployeeProfile;
  private _balances: ILeaveBalance[] = [];
  private _requests: ITimeOffRequest[] = [];
  private _holidays: ICompanyHoliday[] = [];
  private _region: string = '';

  // Identity of the signed-in user, resolved from _api/web/currentuser.
  private _meId: number = 0;
  private _meEmail: string = '';

  // The submitter's line manager, resolved client-side via Microsoft Graph
  // (/me/manager) during load(). Empty / 0 when the user has no manager or Graph
  // is unavailable, in which case the submitter approves their own request.
  private readonly _managerLookup?: ITimeOffManagerLookup;
  private _managerName: string = '';
  private _managerEmail: string = '';
  private _managerSiteUserId: number = 0;

  // Maps our request id (the Title, e.g. "REQ-1002") to its SharePoint list
  // item Id, so cancel can target the right item with a MERGE.
  private readonly _spItemIds: { [requestId: string]: number } = {};

  // When the live lists are unreachable / empty we serve the same seed data the
  // in-memory service uses and keep all writes purely local (no REST).
  private _usingFallback: boolean = false;

  private readonly _listeners: Array<() => void> = [];

  public constructor(options: ISharePointTimeOffOptions) {
    this._http = options.http;
    this._web = options.webAbsoluteUrl.replace(/\/+$/, '');
    this._currentUser = options.currentUser || {};
    this._managerLookup = options.managerLookup;
    this._meEmail = this._currentUser.email || '';
    this._profile = {
      displayName: this._currentUser.displayName || 'You',
      managerName: '',
      region: ''
    };
  }

  /** True when the service fell back to local demo data (no live lists). */
  public get usingFallback(): boolean {
    return this._usingFallback;
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current user's identity and all three lists into the cache. Never
   * throws: on any failure, or when the user has no provisioned data, it seeds
   * the in-memory demo data so the component always renders. Notifies listeners
   * when done so the component re-renders with live data.
   */
  public async load(): Promise<void> {
    try {
      await this._loadCurrentUser();

      const results = await Promise.all([
        this._fetchBalances(),
        this._fetchRequests(),
        this._fetchHolidays()
      ]);
      const balances = results[0];
      const requests = results[1];
      const holidays = results[2];

      if (balances.length === 0 && requests.length === 0) {
        // The signed-in user has no rows (e.g. demo seeded as a different user).
        // Seed the demo data so the component is never blank.
        this._seedFromFallback();
      } else {
        this._balances = balances;
        this._requests = requests;
        this._holidays = holidays;
        // Resolve the line manager (Graph + ensureuser) now, so it is ready
        // before the first createRequest and the header can show it. Live path
        // only — demo/fallback never writes to SharePoint.
        await this._loadManager();
        this._profile = {
          displayName: this._currentUser.displayName || this._meEmail || 'You',
          managerName: this._managerName,
          region: this._region
        };
        this._usingFallback = false;
      }
    } catch (err) {
      // Lists missing, no permission, or running in local Workbench.
      this._logWarn('load failed, using demo data', err);
      this._seedFromFallback();
    } finally {
      this._notify();
    }
  }

  /**
   * Re-pull live data from SharePoint/Graph and notify listeners. Used by the
   * header Refresh button and after a successful background write, so derived
   * values (balances, pending days) reflect the persisted truth. Synchronous and
   * fire-and-forget to match the optimistic write methods — load() never throws,
   * so failures only surface as a warning.
   */
  public refresh(): void {
    this.load().then(
      undefined,
      (err) => this._logWarn('refresh failed', err)
    );
  }

  private async _loadCurrentUser(): Promise<void> {
    const url = this._web + "/_api/web/currentuser?$select=Id,Email,Title,LoginName";
    const res = await this._http.get(url, { Accept: NO_METADATA });
    if (!res.ok) {
      throw new Error('currentuser -> ' + res.status);
    }
    const json = (await res.json()) as {
      Id?: number;
      Email?: string;
      Title?: string;
    };
    this._meId = typeof json.Id === 'number' ? json.Id : 0;
    // Prefer the canonical email SharePoint stores for the person filter.
    this._meEmail = json.Email || this._meEmail;
    if (json.Title && !this._currentUser.displayName) {
      this._currentUser.displayName = json.Title;
    }
  }

  private _meFilter(): string {
    // Person-field filter by the signed-in user's email.
    return "$filter=Employee/EMail eq '" + this._meEmail.replace(/'/g, "''") + "'";
  }

  /**
   * Resolve the signed-in user's line manager via Microsoft Graph and turn the
   * manager into a SharePoint site-user Id so new requests can be routed to them
   * for approval. Best-effort and non-fatal: any failure leaves the manager
   * unset and the submitter approves their own request (demo fallback). This
   * runs only on the live path, so demo/empty mode performs no Graph calls.
   */
  private async _loadManager(): Promise<void> {
    if (!this._managerLookup) {
      return;
    }
    let manager: ITimeOffManager | undefined;
    try {
      manager = await this._managerLookup.getMyManager();
    } catch (err) {
      // Should not happen (the port never throws) but stay defensive.
      this._logWarn('manager lookup failed, using self-approval', err);
      return;
    }
    if (!manager) {
      return; // No manager assigned — submitter approves their own request.
    }
    this._managerName = manager.displayName || '';
    this._managerEmail = manager.email || '';
    if (!this._managerEmail) {
      return;
    }
    try {
      // Convert the Graph manager into a SharePoint site user. Person fields are
      // written by Id, so the email/UPN must be resolved through ensureuser.
      this._managerSiteUserId = await this._ensureUserId(this._managerEmail);
    } catch (err) {
      // The manager exists but could not be provisioned as a site user. Keep the
      // resolved name for the header but route the approval to the submitter so
      // the request still lands.
      this._logWarn('ensureuser(manager) failed, using self-approval', err);
      this._managerSiteUserId = 0;
    }
  }

  /**
   * Ensure a login name / email is present as a site user and return its Id.
   * Mirrors the POST conventions used by _postRequest.
   */
  private async _ensureUserId(loginName: string): Promise<number> {
    const url = this._web + '/_api/web/ensureuser';
    const res = await this._http.post(
      url,
      {
        Accept: NO_METADATA,
        'Content-Type': NO_METADATA,
        'odata-version': ''
      },
      JSON.stringify({ logonName: loginName })
    );
    if (!res.ok) {
      throw new Error('ensureuser -> ' + res.status);
    }
    const json = (await res.json()) as { Id?: number };
    return typeof json.Id === 'number' ? json.Id : 0;
  }

  private async _getItems(url: string): Promise<unknown[]> {
    const res = await this._http.get(url, { Accept: NO_METADATA });
    if (!res.ok) {
      throw new Error('GET ' + url + ' -> ' + res.status);
    }
    const json = await res.json();
    return (json.value as unknown[]) || [];
  }

  private async _fetchBalances(): Promise<ILeaveBalance[]> {
    if (!this._meEmail) {
      return [];
    }
    const url =
      this._web +
      "/_api/web/lists/getByTitle('" +
      LIST_BALANCES +
      "')/items?" +
      "$select=LeaveType,EntitledDays,Year,Employee/EMail" +
      "&$expand=Employee&" +
      this._meFilter() +
      '&$top=50';

    const rows = await this._getItems(url);
    const out: ILeaveBalance[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as {
        LeaveType?: string;
        EntitledDays?: number;
      };
      const leaveType = LEAVE_FROM_SP[row.LeaveType || ''];
      if (!leaveType) {
        continue;
      }
      out.push({
        leaveType: leaveType,
        label: leaveLabel(leaveType),
        entitledDays: Number(row.EntitledDays) || 0,
        // usedDays / pendingDays are derived from the request list by
        // reconcileBalances (see getBalances) — they are not stored columns.
        usedDays: 0,
        pendingDays: 0
      });
    }
    return out;
  }

  private async _fetchRequests(): Promise<ITimeOffRequest[]> {
    if (!this._meEmail) {
      return [];
    }
    const url =
      this._web +
      "/_api/web/lists/getByTitle('" +
      LIST_REQUESTS +
      "')/items?" +
      "$select=Id,Title,LeaveType,StartDate,EndDate,WorkingDays,Status,Note,SubmittedOn,Approver/Title,Employee/EMail" +
      "&$expand=Approver,Employee&" +
      this._meFilter() +
      '&$top=200';

    const rows = await this._getItems(url);
    const out: ITimeOffRequest[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as {
        Id?: number;
        Title?: string;
        LeaveType?: string;
        StartDate?: string;
        EndDate?: string;
        WorkingDays?: number;
        Status?: string;
        Note?: string;
        SubmittedOn?: string;
        Approver?: ISpPersonField;
      };
      const leaveType = LEAVE_FROM_SP[row.LeaveType || ''];
      const status = STATUS_FROM_SP[row.Status || ''];
      if (!leaveType || !status) {
        continue;
      }
      const id = row.Title || 'REQ-' + row.Id;
      const request: ITimeOffRequest = {
        id: id,
        leaveType: leaveType,
        startDate: toDateOnly(row.StartDate),
        endDate: toDateOnly(row.EndDate),
        workingDays: Number(row.WorkingDays) || 0,
        status: status,
        submittedOn: toDateOnly(row.SubmittedOn)
      };
      if (row.Note) {
        request.note = row.Note;
      }
      if (row.Approver && row.Approver.Title) {
        request.approverName = row.Approver.Title;
      }
      out.push(request);

      if (typeof row.Id === 'number') {
        this._spItemIds[id] = row.Id;
      }
    }
    return out;
  }

  private async _fetchHolidays(): Promise<ICompanyHoliday[]> {
    const url =
      this._web +
      "/_api/web/lists/getByTitle('" +
      LIST_HOLIDAYS +
      "')/items?$select=Title,HolidayDate,Region&$orderby=HolidayDate asc&$top=200";

    const rows = await this._getItems(url);
    const out: ICompanyHoliday[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as { Title?: string; HolidayDate?: string; Region?: string };
      const date = toDateOnly(row.HolidayDate);
      if (!date) {
        continue;
      }
      out.push({ date: date, name: row.Title || '' });
      if (!this._region && row.Region) {
        this._region = row.Region;
      }
    }
    return out;
  }

  private _seedFromFallback(): void {
    const fb = new InMemoryTimeOffDataService();
    const p = fb.getProfile();
    this._profile = { displayName: p.displayName, managerName: p.managerName, region: p.region };
    this._balances = fb.getBalances().map((b) => ({
      leaveType: b.leaveType,
      label: b.label,
      entitledDays: b.entitledDays,
      usedDays: b.usedDays,
      pendingDays: b.pendingDays
    }));
    this._requests = fb.getRequests().map((r) => {
      const copy: ITimeOffRequest = {
        id: r.id,
        leaveType: r.leaveType,
        startDate: r.startDate,
        endDate: r.endDate,
        workingDays: r.workingDays,
        status: r.status,
        submittedOn: r.submittedOn
      };
      if (r.note) {
        copy.note = r.note;
      }
      if (r.approverName) {
        copy.approverName = r.approverName;
      }
      return copy;
    });
    this._holidays = fb.getHolidays().map((h) => ({ date: h.date, name: h.name }));
    this._usingFallback = true;
  }

  // ---------------------------------------------------------------------------
  // Synchronous reads (served from cache) — identical contract to in-memory.
  // ---------------------------------------------------------------------------

  public getProfile(): IEmployeeProfile {
    return this._profile;
  }

  public getBalances(): readonly ILeaveBalance[] {
    // Derive used/pending from the request list so the tiles always reflect
    // reality, even if a stored LeaveBalances row has drifted. Only entitledDays
    // (and the label) come from the stored entitlement.
    return reconcileBalances(this._balances, this._requests);
  }

  public getRequests(): readonly ITimeOffRequest[] {
    return this._requests;
  }

  public getUpcomingRequests(): readonly ITimeOffRequest[] {
    const today = todayIso();
    return this._requests
      .filter(
        (r) => r.endDate >= today && (r.status === 'approved' || r.status === 'pending')
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  public getRecentRequests(limit: number = 5): readonly ITimeOffRequest[] {
    const upcoming = new Set(this.getUpcomingRequests().map((r) => r.id));
    return this._requests
      .filter((r) => !upcoming.has(r.id))
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .slice(0, limit);
  }

  public getHolidays(): readonly ICompanyHoliday[] {
    return this._holidays;
  }

  // ---------------------------------------------------------------------------
  // Optimistic writes — update the cache synchronously, push to SharePoint in
  // the background. Same synchronous signatures the UI already consumes.
  // ---------------------------------------------------------------------------

  public createRequest(input: INewTimeOffRequestInput): ITimeOffRequest {
    const request: ITimeOffRequest = {
      id: 'REQ-' + (1100 + this._requests.length),
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      workingDays: input.workingDays,
      status: 'pending',
      submittedOn: todayIso()
    };
    if (input.note) {
      request.note = input.note;
    }

    // The new request is pushed into the list; getBalances() derives pending
    // days from the list, so there is no stored counter to mutate here.
    this._requests = [request, ...this._requests];
    this._notify();

    if (!this._usingFallback) {
      this._postRequest(request).then(
        () => this.refresh(),
        (err) => this._logWarn('createRequest POST failed', err)
      );
    }

    return request;
  }

  public cancelRequest(id: string): void {
    const req = this._requests.filter((r) => r.id === id)[0];
    if (!req) {
      return;
    }
    const today = todayIso();
    const cancellable =
      req.status === 'pending' || (req.status === 'approved' && req.startDate > today);
    if (!cancellable) {
      return;
    }
    // Flip the request to cancelled; getBalances() derives used/pending from the
    // list, so flipping the status here is enough — no stored counter to adjust.
    this._requests = this._requests.map((r) =>
      r.id === id ? this._withStatus(r, 'cancelled') : r
    );

    this._notify();

    if (!this._usingFallback) {
      const itemId = this._spItemIds[id];
      if (itemId) {
        this._patchStatus(itemId, 'Cancelled').then(
          () => this.refresh(),
          (err) => this._logWarn('cancelRequest MERGE failed', err)
        );
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this._listeners.push(listener);
    return () => {
      const idx = this._listeners.indexOf(listener);
      if (idx >= 0) {
        this._listeners.splice(idx, 1);
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Background REST
  // ---------------------------------------------------------------------------

  private async _postRequest(request: ITimeOffRequest): Promise<void> {
    const url =
      this._web + "/_api/web/lists/getByTitle('" + LIST_REQUESTS + "')/items";
    const body: { [key: string]: unknown } = {
      Title: request.id,
      LeaveType: LEAVE_TO_SP[request.leaveType],
      StartDate: request.startDate,
      EndDate: request.endDate,
      WorkingDays: request.workingDays,
      Status: STATUS_TO_SP[request.status],
      SubmittedOn: request.submittedOn
    };
    if (this._meId) {
      // Person fields are written by the user's site-user Id, not the email.
      body.EmployeeId = this._meId;
      // Route the request to the submitter's line manager for approval. The
      // manager was resolved in load() via a client-side Microsoft Graph
      // /me/manager call, then ensureuser(managerEmail) -> site-user Id. When
      // the user has no manager (or Graph/ensureuser was unavailable) we fall
      // back to the submitter as their own approver, which keeps single-user
      // demo tenants working and still routes the request into the team
      // approvals inbox (Component C) so none fall through the cracks.
      body.ApproverId = this._managerSiteUserId || this._meId;
    }
    if (request.note) {
      body.Note = request.note;
    }

    const res = await this._http.post(
      url,
      {
        Accept: NO_METADATA,
        'Content-Type': NO_METADATA,
        'odata-version': ''
      },
      JSON.stringify(body)
    );
    if (!res.ok) {
      throw new Error('POST request -> ' + res.status);
    }
    const created = (await res.json()) as { Id?: number };
    if (typeof created.Id === 'number') {
      this._spItemIds[request.id] = created.Id;
    }
  }

  private async _patchStatus(itemId: number, spStatus: string): Promise<void> {
    const url =
      this._web +
      "/_api/web/lists/getByTitle('" +
      LIST_REQUESTS +
      "')/items(" +
      itemId +
      ')';
    const res = await this._http.post(
      url,
      {
        Accept: NO_METADATA,
        'Content-Type': NO_METADATA,
        'odata-version': '',
        'IF-MATCH': '*',
        'X-HTTP-Method': 'MERGE'
      },
      JSON.stringify({ Status: spStatus })
    );
    if (!res.ok) {
      throw new Error('MERGE status -> ' + res.status);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private _withStatus(r: ITimeOffRequest, status: RequestStatus): ITimeOffRequest {
    const copy: ITimeOffRequest = {
      id: r.id,
      leaveType: r.leaveType,
      startDate: r.startDate,
      endDate: r.endDate,
      workingDays: r.workingDays,
      status: status,
      submittedOn: r.submittedOn
    };
    if (r.note) {
      copy.note = r.note;
    }
    if (r.approverName) {
      copy.approverName = r.approverName;
    }
    return copy;
  }

  private _notify(): void {
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i]();
    }
  }

  private _logWarn(message: string, err: unknown): void {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Time-Off] ' + message, err);
    }
  }
}
