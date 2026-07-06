// Live SharePoint implementation of ITimeOffTeamDataService (Component C).
//
// THE WRITE SHOWCASE: this service runs *inside* the Copilot component and, with
// the signed-in manager's delegated identity, reads the WHOLE team's time-off
// requests and PATCHes a teammate's request Status on Approve/Decline — all
// client-side via SPHttpClient, no MCP server, no middle tier. That authenticated
// client-side write is exactly what the generic MCP App spec cannot do.
//
// Mirrors SharePointTimeOffDataService's design point-for-point:
//  * Synchronous read contract served from a cache that async load() fills once.
//  * Optimistic writes: cache flips + listeners notified synchronously, MERGE is
//    fired in the background and only logged on failure.
//  * Resilient: missing/unreadable lists or an empty team self-heal to the same
//    in-memory demo roster, stamped with the signed-in user as the manager.
//
// It reuses the narrow HTTP port (ITimeOffHttpClient) exported by the overview
// service so it stays trivially unit-testable; the real SPHttpClient is adapted
// to that port in createTimeOffTeamDataService.ts.

import type {
  ITimeOffHttpClient
} from '../../timeOffOverview/data/SharePointTimeOffDataService';
import type { LeaveType, RequestStatus } from '../../timeOffOverview/data/types';
import type { ITimeOffTeamDataService } from './ITimeOffTeamDataService';
import type {
  ITeamRow,
  ITeamAbsence,
  IPendingApproval,
  ITeamMember,
  ITeamCalendarRow
} from './types';
import { seedTeamRows } from './InMemoryTimeOffTeamDataService';
import {
  deriveAbsences,
  derivePending,
  isManagerOf,
  deriveMembersFromRows,
  deriveTeamCalendar
} from '../logic/derive';

/**
 * Narrow port for resolving the signed-in user's team from a directory (Microsoft
 * Graph). Kept SPFx-free so the service stays unit-testable; the real
 * MSGraphClientV3 adapter lives in createTimeOffTeamDataService.ts. Implementations
 * MUST NOT throw — a failure or unconsented permission resolves to undefined, and
 * the service self-heals to a roster derived from the request rows.
 */
export interface ITeamDirectoryLookup {
  /** The user's peers + manager (+ direct reports if they manage), or undefined. */
  getTeam(): Promise<ITeamMember[] | undefined>;
  /**
   * OPTIONAL: resolve Microsoft 365 profile photos (data URLs) by user email/UPN
   * for the "who's out" list and approvals inbox, whose people are anyone with a
   * request rather than just the calendar roster. Keyed lower-cased; missing
   * people are simply absent from the map (the Avatar shows initials). Best-effort
   * — implementations MUST NOT throw (return {} on failure).
   */
  getPhotos?(emails: readonly string[]): Promise<{ [emailLower: string]: string }>;
}

export interface ISharePointTeamOptions {
  http: ITimeOffHttpClient;
  webAbsoluteUrl: string;
  currentUser: { displayName?: string; email?: string; loginName?: string };
  directoryLookup?: ITeamDirectoryLookup;
}

const LIST_REQUESTS = 'TimeOffRequests';

// SharePoint Choice text -> code (only the directions this service needs).
const LEAVE_FROM_SP: { [text: string]: LeaveType } = {
  Vacation: 'vacation',
  Sick: 'sick',
  Personal: 'personal'
};
const STATUS_FROM_SP: { [text: string]: RequestStatus } = {
  Pending: 'pending',
  Approved: 'approved',
  Declined: 'declined',
  Cancelled: 'cancelled'
};
const STATUS_TO_SP: { [code: string]: string } = {
  approved: 'Approved',
  declined: 'Declined'
};

const NO_METADATA = 'application/json;odata=nometadata';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

/** Normalise a SharePoint date to yyyy-mm-dd via local calendar components
 *  (see the overview service for the timezone rationale). */
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

interface ISpPersonField {
  EMail?: string;
  Title?: string;
}

export class SharePointTimeOffTeamDataService implements ITimeOffTeamDataService {
  private readonly _http: ITimeOffHttpClient;
  private readonly _web: string;
  private readonly _currentUser: {
    displayName?: string;
    email?: string;
    loginName?: string;
  };
  private readonly _directoryLookup?: ITeamDirectoryLookup;

  private _rows: ITeamRow[] = [];
  private _members: ITeamMember[] = [];
  /** Lower-cased email -> profile-photo data URL, filled async by _resolvePhotos. */
  private _photoByEmail: Map<string, string> = new Map();
  private _meEmail: string = '';
  private _managerName: string = 'You';

  private _usingFallback: boolean = false;

  private readonly _listeners: Array<() => void> = [];

  public constructor(options: ISharePointTeamOptions) {
    this._http = options.http;
    this._web = options.webAbsoluteUrl.replace(/\/+$/, '');
    this._currentUser = options.currentUser || {};
    this._directoryLookup = options.directoryLookup;
    this._meEmail = this._currentUser.email || '';
    this._managerName = this._currentUser.displayName || this._meEmail || 'You';
  }

  public get usingFallback(): boolean {
    return this._usingFallback;
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  /**
   * Resolve the signed-in user and fetch the whole team's requests into the
   * cache. Never throws: any failure, or an empty team, self-heals to demo data
   * so the component always renders. Notifies listeners when done.
   */
  public async load(): Promise<void> {
    try {
      await this._loadCurrentUser();
      const rows = await this._fetchRows();
      if (rows.length === 0) {
        this._seedFromFallback();
      } else {
        this._rows = rows;
        this._usingFallback = false;
      }
    } catch (err) {
      this._logWarn('load failed, using demo data', err);
      this._seedFromFallback();
    } finally {
      await this._resolveMembers();
      await this._resolvePhotos();
      this._notify();
    }
  }

  /**
   * Resolve the calendar roster. Prefer the live directory (Graph: peers +
   * manager + reports) under the user's delegated identity; if it returns fewer
   * than two people (no manager/peers consented, e.g. missing User.Read.All) or
   * fails, self-heal to a roster derived from the loaded request rows so the
   * fullscreen team calendar always has a sensible set of rows in demo mode.
   */
  private async _resolveMembers(): Promise<void> {
    let live: ITeamMember[] | undefined;
    try {
      live = this._directoryLookup ? await this._directoryLookup.getTeam() : undefined;
    } catch {
      live = undefined;
    }
    if (live && live.length >= 2) {
      this._members = live;
    } else {
      this._members = deriveMembersFromRows(this._rows, this._meEmail, this._managerName);
    }
  }

  /**
   * Best-effort: populate _photoByEmail for everyone the team views show — the
   * fullscreen calendar roster AND the "who's out" list / approvals inbox (which
   * span anyone with a request, not just the roster). We seed from roster photos
   * already resolved by getTeam() (id-based), fetch only the still-missing people
   * by email via the directory lookup's optional getPhotos, then stamp the result
   * back onto _members so the calendar — which reads member.photoUrl — shows photos
   * even when the roster came from the demo-fallback path (no Graph ids/photos),
   * e.g. for a non-manager whose getTeam() found no peers/reports. Self-failing and
   * keyed lower-cased; misses leave the Avatar on its initials. Must run AFTER
   * _resolveMembers so the roster is settled and its photos can be reused.
   */
  private async _resolvePhotos(): Promise<void> {
    const map = new Map<string, string>();
    // 1) Reuse roster photos already resolved by getTeam() (avoids refetching).
    for (const m of this._members) {
      if (m.photoUrl && m.email) {
        map.set(m.email.toLowerCase(), m.photoUrl);
      }
    }
    // 2) Collect the emails every team view actually shows: the calendar roster
    //    plus the people behind the derived absences / pending rows (joined back
    //    to their source row by requestId).
    const wanted = new Set<string>();
    for (const m of this._members) {
      if (m.email) {
        wanted.add(m.email.toLowerCase());
      }
    }
    const emailByReq = this._emailByRequestId();
    const collect = (items: readonly { requestId: string }[]): void => {
      for (const it of items) {
        const email = (emailByReq.get(it.requestId) || '').toLowerCase();
        if (email) {
          wanted.add(email);
        }
      }
    };
    collect(deriveAbsences(this._rows, todayIso()));
    collect(derivePending(this._rows, this._meEmail));
    // 3) Fetch only what we don't already have, if the lookup can.
    const missing = Array.from(wanted).filter((e) => !map.has(e));
    const lookup = this._directoryLookup;
    if (lookup && lookup.getPhotos && missing.length > 0) {
      try {
        const fetched = await lookup.getPhotos(missing);
        for (const key of Object.keys(fetched)) {
          map.set(key.toLowerCase(), fetched[key]);
        }
      } catch {
        // ignore — keep whatever resolved already; initials fallback
      }
    }
    this._photoByEmail = map;
    // 4) Stamp roster members that still lack a photo, so the calendar (which reads
    //    member.photoUrl) benefits from the email-resolved photos too. Done after
    //    all awaits, synchronously, to avoid a read-modify-write across an await.
    for (const m of this._members) {
      if (!m.photoUrl && m.email) {
        const url = map.get(m.email.toLowerCase());
        if (url) {
          m.photoUrl = url;
        }
      }
    }
  }

  /** requestId -> source-row employee email, the join key for photo stamping. */
  private _emailByRequestId(): Map<string, string> {
    const byReq = new Map<string, string>();
    for (const r of this._rows) {
      byReq.set(r.requestId, r.employeeEmail);
    }
    return byReq;
  }

  /**
   * Stamp the resolved profile photo onto each derived item by joining its
   * requestId back to the source row's employee email. The pure derivations never
   * set photoUrl, so this is the single place presentation photos are attached.
   * Returns a copy; items without a photo are returned unchanged (initials shown).
   */
  private _withPhotos<T extends { requestId: string; photoUrl?: string }>(
    items: readonly T[]
  ): T[] {
    if (this._photoByEmail.size === 0) {
      return items.slice();
    }
    const emailByReq = this._emailByRequestId();
    return items.map((it) => {
      const email = (emailByReq.get(it.requestId) || '').toLowerCase();
      const url = email ? this._photoByEmail.get(email) : undefined;
      return url ? { ...it, photoUrl: url } : it;
    });
  }

  private async _loadCurrentUser(): Promise<void> {
    const url = this._web + "/_api/web/currentuser?$select=Id,Email,Title,LoginName";
    const res = await this._http.get(url, { Accept: NO_METADATA });
    if (!res.ok) {
      throw new Error('currentuser -> ' + res.status);
    }
    const json = (await res.json()) as { Email?: string; Title?: string };
    this._meEmail = json.Email || this._meEmail;
    if (json.Title) {
      this._managerName = json.Title;
    }
  }

  private async _fetchRows(): Promise<ITeamRow[]> {
    // NOTE: deliberately NO Employee/EMail filter — the team view reads everyone's
    // requests (the manager has read/edit on the list). $expand surfaces the
    // employee and approver people fields.
    const url =
      this._web +
      "/_api/web/lists/getByTitle('" +
      LIST_REQUESTS +
      "')/items?" +
      "$select=Id,Title,LeaveType,StartDate,EndDate,WorkingDays,Status,Note,SubmittedOn," +
      "Employee/Title,Employee/EMail,Approver/Title,Approver/EMail" +
      "&$expand=Employee,Approver&$top=500";

    const res = await this._http.get(url, { Accept: NO_METADATA });
    if (!res.ok) {
      throw new Error('GET requests -> ' + res.status);
    }
    const json = await res.json();
    const raw = (json.value as unknown[]) || [];

    const out: ITeamRow[] = [];
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i] as {
        Id?: number;
        Title?: string;
        LeaveType?: string;
        StartDate?: string;
        EndDate?: string;
        WorkingDays?: number;
        Status?: string;
        Note?: string;
        SubmittedOn?: string;
        Employee?: ISpPersonField;
        Approver?: ISpPersonField;
      };
      const leaveType = LEAVE_FROM_SP[row.LeaveType || ''];
      const status = STATUS_FROM_SP[row.Status || ''];
      if (!leaveType || !status) {
        continue;
      }
      const employee = row.Employee || {};
      const approver = row.Approver || {};
      const teamRow: ITeamRow = {
        requestId: row.Title || 'REQ-' + row.Id,
        spItemId: typeof row.Id === 'number' ? row.Id : 0,
        employeeName: employee.Title || employee.EMail || 'Unknown',
        employeeEmail: employee.EMail || '',
        approverEmail: approver.EMail || '',
        leaveType: leaveType,
        startDate: toDateOnly(row.StartDate),
        endDate: toDateOnly(row.EndDate),
        workingDays: Number(row.WorkingDays) || 0,
        status: status,
        submittedOn: toDateOnly(row.SubmittedOn)
      };
      if (row.Note) {
        teamRow.note = row.Note;
      }
      out.push(teamRow);
    }
    return out;
  }

  private _seedFromFallback(): void {
    this._rows = seedTeamRows(this._meEmail || 'you@contoso.com');
    this._usingFallback = true;
  }

  // ---------------------------------------------------------------------------
  // Synchronous reads (served from cache) — identical contract to in-memory.
  // ---------------------------------------------------------------------------

  public getManagerName(): string {
    return this._managerName;
  }

  public isManager(): boolean {
    return isManagerOf(this._rows, this._meEmail);
  }

  public getTeamAbsences(): readonly ITeamAbsence[] {
    return this._withPhotos(deriveAbsences(this._rows, todayIso()));
  }

  public getPendingApprovals(): readonly IPendingApproval[] {
    return this._withPhotos(derivePending(this._rows, this._meEmail));
  }

  public getTeamCalendar(): readonly ITeamCalendarRow[] {
    return deriveTeamCalendar(this._members, this._rows);
  }

  // ---------------------------------------------------------------------------
  // Optimistic writes — flip the cache synchronously, MERGE in the background.
  // ---------------------------------------------------------------------------

  public approveRequest(requestId: string): void {
    this._setStatus(requestId, 'approved');
  }

  public declineRequest(requestId: string): void {
    this._setStatus(requestId, 'declined');
  }

  /**
   * Re-pull live data from SharePoint and notify listeners. Used by the header
   * Refresh button and after a successful approve/decline write, so "who's out"
   * and the approvals inbox reflect the persisted truth. Synchronous and
   * fire-and-forget to match the optimistic write methods — load() never throws,
   * so failures only surface as a warning.
   */
  public refresh(): void {
    this.load().then(
      undefined,
      (err) => this._logWarn('refresh failed', err)
    );
  }

  private _setStatus(requestId: string, status: 'approved' | 'declined'): void {
    const target = this._rows.filter((r) => r.requestId === requestId)[0];
    if (!target || target.status !== 'pending') {
      return;
    }
    const itemId = target.spItemId;

    this._rows = this._rows.map((r) =>
      r.requestId === requestId ? { ...r, status: status as RequestStatus } : r
    );
    this._notify();

    if (!this._usingFallback && itemId) {
      this._patchStatus(itemId, STATUS_TO_SP[status]).then(
        () => this.refresh(),
        (err) => this._logWarn('approve/decline MERGE failed', err)
      );
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

  private _notify(): void {
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i]();
    }
  }

  private _logWarn(message: string, err: unknown): void {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Time-Off Team] ' + message, err);
    }
  }
}
