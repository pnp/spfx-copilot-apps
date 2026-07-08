// In-memory team data service — drives the Workbench demo and acts as the
// graceful fallback when the SharePoint lists are missing/unreadable.
//
// Seeds a believable team using classic Microsoft 365 demo-tenant personas, with
// today-relative dates so "who's out this week" always has something to show.
// Writes are local-only (no REST); approving a pending upcoming request flips it
// to 'approved', which makes it surface under "who's out" on the next render.

import type { ITimeOffTeamDataService } from './ITimeOffTeamDataService';
import type { ITeamRow, ITeamAbsence, IPendingApproval, ITeamCalendarRow } from './types';
import {
  deriveAbsences,
  derivePending,
  isManagerOf,
  deriveMembersFromRows,
  deriveTeamCalendar
} from '../logic/derive';

/** Optional identity so the SharePoint fallback can stamp the real signed-in manager. */
export interface IInMemoryTeamOptions {
  managerName?: string;
  managerEmail?: string;
}

const DEFAULT_MANAGER_NAME = 'Megan Bowen';
const DEFAULT_MANAGER_EMAIL = 'megan@contoso.com';

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function offset(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return iso(d);
}

/**
 * Build the demo team roster for a given manager. Exported so the SharePoint
 * team service can seed the SAME data when it falls back, keeping one source of
 * truth for the demo. Dates are today-relative so the views are never stale.
 */
export function seedTeamRows(managerEmail: string): ITeamRow[] {
  const mgr = managerEmail;
  return [
    // --- Who's out: approved, upcoming or in-progress ---
    {
      requestId: 'REQ-2001',
      spItemId: 0,
      employeeName: 'Isaiah Langer',
      employeeEmail: 'isaiah@contoso.com',
      approverEmail: mgr,
      leaveType: 'sick',
      startDate: offset(0),
      endDate: offset(1),
      workingDays: 2,
      status: 'approved',
      submittedOn: offset(-2)
    },
    {
      requestId: 'REQ-2002',
      spItemId: 0,
      employeeName: 'Diego Siciliani',
      employeeEmail: 'diego@contoso.com',
      approverEmail: mgr,
      leaveType: 'vacation',
      startDate: offset(3),
      endDate: offset(7),
      workingDays: 5,
      status: 'approved',
      submittedOn: offset(-10)
    },
    {
      requestId: 'REQ-2003',
      spItemId: 0,
      employeeName: 'Pradeep Gupta',
      employeeEmail: 'pradeep@contoso.com',
      approverEmail: mgr,
      leaveType: 'personal',
      startDate: offset(10),
      endDate: offset(10),
      workingDays: 1,
      status: 'approved',
      submittedOn: offset(-6)
    },
    {
      requestId: 'REQ-2004',
      spItemId: 0,
      employeeName: 'Lidia Holloway',
      employeeEmail: 'lidia@contoso.com',
      approverEmail: mgr,
      leaveType: 'vacation',
      startDate: offset(20),
      endDate: offset(24),
      workingDays: 5,
      status: 'approved',
      submittedOn: offset(-4)
    },
    // --- Pending approvals: awaiting the signed-in manager ---
    {
      requestId: 'REQ-2010',
      spItemId: 0,
      employeeName: 'Lynne Robbins',
      employeeEmail: 'lynne@contoso.com',
      approverEmail: mgr,
      leaveType: 'vacation',
      startDate: offset(14),
      endDate: offset(18),
      workingDays: 5,
      status: 'pending',
      submittedOn: offset(-2),
      note: 'Family holiday'
    },
    {
      requestId: 'REQ-2011',
      spItemId: 0,
      employeeName: 'Henrietta Mueller',
      employeeEmail: 'henrietta@contoso.com',
      approverEmail: mgr,
      leaveType: 'sick',
      startDate: offset(2),
      endDate: offset(2),
      workingDays: 1,
      status: 'pending',
      submittedOn: offset(-1)
    },
    {
      requestId: 'REQ-2012',
      spItemId: 0,
      employeeName: 'Diego Siciliani',
      employeeEmail: 'diego@contoso.com',
      approverEmail: mgr,
      leaveType: 'personal',
      startDate: offset(30),
      endDate: offset(31),
      workingDays: 2,
      status: 'pending',
      submittedOn: offset(-3),
      note: 'Moving house'
    }
  ];
}

export class InMemoryTimeOffTeamDataService implements ITimeOffTeamDataService {
  private _rows: ITeamRow[];
  private readonly _managerName: string;
  private readonly _managerEmail: string;
  private readonly _listeners: Array<() => void> = [];

  public readonly usingFallback: boolean = true;

  public constructor(options?: IInMemoryTeamOptions) {
    this._managerName = (options && options.managerName) || DEFAULT_MANAGER_NAME;
    this._managerEmail = (options && options.managerEmail) || DEFAULT_MANAGER_EMAIL;
    this._rows = seedTeamRows(this._managerEmail);
  }

  public getManagerName(): string {
    return this._managerName;
  }

  public isManager(): boolean {
    return isManagerOf(this._rows, this._managerEmail);
  }

  public getTeamAbsences(): readonly ITeamAbsence[] {
    return deriveAbsences(this._rows, offset(0));
  }

  public getPendingApprovals(): readonly IPendingApproval[] {
    return derivePending(this._rows, this._managerEmail);
  }

  public getTeamCalendar(): readonly ITeamCalendarRow[] {
    // The signed-in manager is 'self'; every seed persona routes their approval
    // to the manager, so they read as direct reports — exactly the "manager sees
    // their reports" roster the fullscreen calendar wants in demo mode.
    const members = deriveMembersFromRows(this._rows, this._managerEmail, this._managerName);
    return deriveTeamCalendar(members, this._rows);
  }

  public approveRequest(requestId: string): void {
    this._setStatus(requestId, 'approved');
  }

  public declineRequest(requestId: string): void {
    this._setStatus(requestId, 'declined');
  }

  public subscribe(listener: () => void): () => void {
    this._listeners.push(listener);
    return () => {
      const i = this._listeners.indexOf(listener);
      if (i >= 0) {
        this._listeners.splice(i, 1);
      }
    };
  }

  public refresh(): void {
    // No backing store to re-pull; just re-emit current demo state.
    this._notify();
  }

  private _setStatus(requestId: string, status: 'approved' | 'declined'): void {
    let changed = false;
    this._rows = this._rows.map((r) => {
      if (r.requestId === requestId && r.status === 'pending') {
        changed = true;
        return { ...r, status };
      }
      return r;
    });
    if (changed) {
      this._notify();
    }
  }

  private _notify(): void {
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i]();
    }
  }
}
