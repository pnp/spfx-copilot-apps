import type { ITimeOffDataService } from './ITimeOffDataService';
import { reconcileBalances } from '../logic/reconcileBalances';
import type {
  ICompanyHoliday,
  IEmployeeProfile,
  ILeaveBalance,
  INewTimeOffRequestInput,
  ITimeOffRequest
} from './types';

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Deterministic in-memory implementation used for the demo and as the contract
 * reference for the live SharePoint/Graph service. Dates are generated relative
 * to "today" so the sample always shows a realistic mix of past and upcoming
 * leave regardless of when it runs.
 *
 * Seed reconciles: remaining = entitled - used - pending. used/pending are
 * DERIVED from the request list (via reconcileBalances), so the stored
 * usedDays/pendingDays below are only a starting point and can never drift from
 * the requests they summarise.
 *   Vacation 25 / used 8 / pending 3  -> 14 remaining
 *   Sick     10 / used 2 / pending 0  ->  8 remaining
 *   Personal  5 / used 1 / pending 0  ->  4 remaining
 */
export class InMemoryTimeOffDataService implements ITimeOffDataService {
  private readonly _profile: IEmployeeProfile;
  private readonly _balances: ILeaveBalance[];
  private _requests: ITimeOffRequest[];
  private readonly _holidays: ICompanyHoliday[];
  private readonly _listeners: Set<() => void> = new Set();

  constructor() {
    const today = new Date();
    const t = (n: number): string => iso(addDays(today, n));

    this._profile = {
      displayName: 'Megan Bowen',
      managerName: 'Adele Vance',
      region: 'United States'
    };

    this._balances = [
      {
        leaveType: 'vacation',
        label: 'Vacation',
        entitledDays: 25,
        usedDays: 8,
        pendingDays: 3
      },
      {
        leaveType: 'sick',
        label: 'Sick',
        entitledDays: 10,
        usedDays: 2,
        pendingDays: 0
      },
      {
        leaveType: 'personal',
        label: 'Personal',
        entitledDays: 5,
        usedDays: 1,
        pendingDays: 0
      }
    ];

    this._requests = [
      // Approved, upcoming (5 working days) -> contributes to vacation "used".
      {
        id: 'REQ-1001',
        leaveType: 'vacation',
        startDate: t(14),
        endDate: t(18),
        workingDays: 5,
        status: 'approved',
        note: 'Family trip',
        submittedOn: t(-20),
        approverName: 'Adele Vance'
      },
      // Pending, upcoming (3 working days) -> the vacation "pending" 3.
      {
        id: 'REQ-1002',
        leaveType: 'vacation',
        startDate: t(30),
        endDate: t(32),
        workingDays: 3,
        status: 'pending',
        note: 'Long weekend',
        submittedOn: t(-2)
      },
      // Approved, past (3 working days) -> rest of vacation "used" (5 + 3 = 8).
      {
        id: 'REQ-0990',
        leaveType: 'vacation',
        startDate: t(-32),
        endDate: t(-30),
        workingDays: 3,
        status: 'approved',
        note: 'City break',
        submittedOn: t(-50),
        approverName: 'Adele Vance'
      },
      // Approved, past (2 working days) -> sick "used" 2.
      {
        id: 'REQ-0985',
        leaveType: 'sick',
        startDate: t(-20),
        endDate: t(-19),
        workingDays: 2,
        status: 'approved',
        note: 'Flu',
        submittedOn: t(-21),
        approverName: 'Adele Vance'
      },
      // Approved, past (1 working day) -> personal "used" 1.
      {
        id: 'REQ-0970',
        leaveType: 'personal',
        startDate: t(-45),
        endDate: t(-45),
        workingDays: 1,
        status: 'approved',
        note: 'Appointment',
        submittedOn: t(-48),
        approverName: 'Adele Vance'
      },
      // Declined, past (does not affect balances).
      {
        id: 'REQ-0965',
        leaveType: 'personal',
        startDate: t(-10),
        endDate: t(-10),
        workingDays: 1,
        status: 'declined',
        note: 'Coverage gap on team',
        submittedOn: t(-14),
        approverName: 'Adele Vance'
      },
      // Cancelled, past (does not affect balances).
      {
        id: 'REQ-0940',
        leaveType: 'vacation',
        startDate: t(-60),
        endDate: t(-58),
        workingDays: 3,
        status: 'cancelled',
        note: 'Plans changed',
        submittedOn: t(-75)
      }
    ];

    // Fixed-date US company holidays for the current and next year. The
    // working-day calculator excludes these so booked leave never counts a day
    // the office is closed. (Fixed-date only to keep the seed deterministic and
    // free of weekday math.)
    const year = today.getFullYear();
    const fixedHolidays: ReadonlyArray<{ md: string; name: string }> = [
      { md: '01-01', name: "New Year's Day" },
      { md: '07-04', name: 'Independence Day' },
      { md: '11-11', name: 'Veterans Day' },
      { md: '12-25', name: 'Christmas Day' }
    ];
    this._holidays = [];
    for (const y of [year, year + 1]) {
      for (const h of fixedHolidays) {
        this._holidays.push({ date: `${y}-${h.md}`, name: h.name });
      }
    }
  }

  public getProfile(): IEmployeeProfile {
    return this._profile;
  }

  public getBalances(): readonly ILeaveBalance[] {
    // Derive used/pending from the request list so the tiles can never drift
    // from the requests they summarise. Only entitledDays/label are stored.
    return reconcileBalances(this._balances, this._requests);
  }

  public getRequests(): readonly ITimeOffRequest[] {
    return this._requests;
  }

  public getUpcomingRequests(): readonly ITimeOffRequest[] {
    const today = iso(new Date());
    return this._requests
      .filter(
        (r) =>
          r.endDate >= today &&
          (r.status === 'approved' || r.status === 'pending')
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

  public createRequest(input: INewTimeOffRequestInput): ITimeOffRequest {
    const request: ITimeOffRequest = {
      id: `REQ-${1100 + this._requests.length}`,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      workingDays: input.workingDays,
      status: 'pending',
      submittedOn: iso(new Date()),
      ...(input.note ? { note: input.note } : {})
    };

    // Pushing the new request into the list is enough — getBalances() derives
    // the pending days from it, so there is no stored counter to reserve here.
    this._requests = [request, ...this._requests];

    this._notify();
    return request;
  }

  public cancelRequest(id: string): void {
    const req = this._requests.find((r) => r.id === id);
    if (!req) {
      return;
    }
    const today = iso(new Date());
    const cancellable =
      req.status === 'pending' ||
      (req.status === 'approved' && req.startDate > today);
    if (!cancellable) {
      return;
    }

    // Flipping the request to cancelled is enough — getBalances() derives
    // used/pending from the list, so there is no stored counter to return.
    this._requests = this._requests.map((r) =>
      r.id === id ? { ...r, status: 'cancelled' as const } : r
    );

    this._notify();
  }

  public subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  public refresh(): void {
    // No backing store to re-pull; just re-emit current demo state.
    this._notify();
  }

  private _notify(): void {
    this._listeners.forEach((l) => l());
  }
}
