// Unit tests for the live SharePoint data service.
//
// The service depends only on the narrow ITimeOffHttpClient port, so these
// tests inject a trivial fake — no @microsoft/sp-http, no network. We verify:
//  * SharePoint choice/date/person mapping into the typed cache
//  * the signed-in user's email filter is present on the list queries
//  * the upcoming/recent derivation matches the in-memory contract
//  * empty live data and HTTP failures self-heal to demo data (never throws)
//  * optimistic createRequest / cancelRequest update the cache synchronously
//    and fire the correct background REST (POST add, MERGE status)

import {
  SharePointTimeOffDataService,
  type ITimeOffHttpClient,
  type ITimeOffHttpResponse,
  type ITimeOffManager,
  type ITimeOffManagerLookup
} from './SharePointTimeOffDataService';

interface IRecordedCall {
  url: string;
  headers: { [name: string]: string };
  body?: string;
}

function jsonResponse(
  payload: unknown,
  ok: boolean = true,
  status: number = 200
): ITimeOffHttpResponse {
  return {
    ok: ok,
    status: status,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json: () => Promise.resolve(payload as any)
  };
}

// Flush pending microtasks + a macrotask so background REST (fired from the
// optimistic write path) has run before we assert on it.
function flush(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

// Build an ISO yyyy-mm-dd offset from today by whole days. Used to keep the
// upcoming/recent assertions clear of the today boundary regardless of the
// runner timezone.
function offsetIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return (
    d.getFullYear() +
    '-' +
    (m < 10 ? '0' + m : '' + m) +
    '-' +
    (day < 10 ? '0' + day : '' + day)
  );
}

class FakeHttp implements ITimeOffHttpClient {
  public getCalls: IRecordedCall[] = [];
  public postCalls: IRecordedCall[] = [];

  public currentUser: unknown = { Id: 7, Email: 'me@contoso.com', Title: 'Demo User' };
  public balances: unknown[] = [];
  public requests: unknown[] = [];
  public holidays: unknown[] = [];

  public throwOnGet: boolean = false;

  // ensureuser POST behaviour for manager-routing tests. By default ensureuser
  // is not exercised (no managerLookup is injected), so these are inert.
  public ensureUserId: number = 0;
  public ensureUserOk: boolean = true;

  public get(
    url: string,
    headers: { [name: string]: string }
  ): Promise<ITimeOffHttpResponse> {
    this.getCalls.push({ url: url, headers: headers });
    if (this.throwOnGet) {
      return Promise.reject(new Error('network down'));
    }
    if (url.indexOf('currentuser') >= 0) {
      return Promise.resolve(jsonResponse(this.currentUser));
    }
    if (url.indexOf("getByTitle('LeaveBalances')") >= 0) {
      return Promise.resolve(jsonResponse({ value: this.balances }));
    }
    if (url.indexOf("getByTitle('TimeOffRequests')") >= 0) {
      return Promise.resolve(jsonResponse({ value: this.requests }));
    }
    if (url.indexOf("getByTitle('CompanyHolidays')") >= 0) {
      return Promise.resolve(jsonResponse({ value: this.holidays }));
    }
    return Promise.resolve(jsonResponse({ value: [] }));
  }

  public post(
    url: string,
    headers: { [name: string]: string },
    body: string
  ): Promise<ITimeOffHttpResponse> {
    this.postCalls.push({ url: url, headers: headers, body: body });
    if (/\/ensureuser$/.test(url)) {
      if (!this.ensureUserOk) {
        return Promise.resolve(jsonResponse({}, false, 500));
      }
      return Promise.resolve(jsonResponse({ Id: this.ensureUserId }));
    }
    return Promise.resolve(jsonResponse({ Id: 999 }));
  }
}

// Build a manager-lookup port that resolves to a fixed manager (or undefined).
function fakeManager(mgr: ITimeOffManager | undefined): ITimeOffManagerLookup {
  return { getMyManager: () => Promise.resolve(mgr) };
}

function makeService(
  http: FakeHttp,
  managerLookup?: ITimeOffManagerLookup
): SharePointTimeOffDataService {
  return new SharePointTimeOffDataService({
    http: http,
    webAbsoluteUrl: 'https://contoso.sharepoint.com/sites/hr/',
    currentUser: {
      displayName: 'Demo User',
      email: 'me@contoso.com',
      loginName: 'i:0#.f|membership|me@contoso.com'
    },
    managerLookup: managerLookup
  });
}

describe('SharePointTimeOffDataService.load', () => {
  it('maps SharePoint choices, dates, person and region into the cache', async () => {
    const http = new FakeHttp();
    http.balances = [
      {
        LeaveType: 'Vacation',
        EntitledDays: 25,
        Year: 2026
      }
    ];
    http.requests = [
      {
        Id: 42,
        Title: 'REQ-1002',
        LeaveType: 'Vacation',
        StartDate: offsetIso(10),
        EndDate: offsetIso(14),
        WorkingDays: 4,
        Status: 'Approved',
        Note: 'Trip',
        SubmittedOn: offsetIso(-2),
        Approver: { Title: 'Manager Mary' }
      }
    ];
    http.holidays = [
      { Title: 'Bank Holiday', HolidayDate: '2026-05-01T00:00:00Z', Region: 'Benelux' }
    ];

    const svc = makeService(http);
    await svc.load();

    expect(svc.usingFallback).toBe(false);

    const balances = svc.getBalances();
    expect(balances).toHaveLength(1);
    expect(balances[0].leaveType).toBe('vacation');
    expect(balances[0].label).toBe('Vacation');
    expect(balances[0].entitledDays).toBe(25);

    const requests = svc.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].id).toBe('REQ-1002');
    expect(requests[0].leaveType).toBe('vacation');
    expect(requests[0].status).toBe('approved');
    expect(requests[0].approverName).toBe('Manager Mary');
    expect(requests[0].note).toBe('Trip');
    expect(requests[0].startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(svc.getHolidays()).toHaveLength(1);
    expect(svc.getProfile().displayName).toBe('Demo User');
    expect(svc.getProfile().region).toBe('Benelux');
    expect(svc.getProfile().managerName).toBe('');
  });

  it('derives usedDays/pendingDays from the request list', async () => {
    const http = new FakeHttp();
    // The list stores only the entitlement; used/pending are not columns...
    http.balances = [
      { LeaveType: 'Vacation', EntitledDays: 25, Year: 2026 }
    ];
    // ...they are derived from the requests: 5 approved + (1 + 3) pending = 4 pending.
    http.requests = [
      {
        Id: 1,
        Title: 'REQ-A',
        LeaveType: 'Vacation',
        StartDate: offsetIso(40),
        EndDate: offsetIso(44),
        WorkingDays: 5,
        Status: 'Approved'
      },
      {
        Id: 2,
        Title: 'REQ-B',
        LeaveType: 'Vacation',
        StartDate: offsetIso(5),
        EndDate: offsetIso(5),
        WorkingDays: 1,
        Status: 'Pending'
      },
      {
        Id: 3,
        Title: 'REQ-C',
        LeaveType: 'Vacation',
        StartDate: offsetIso(30),
        EndDate: offsetIso(32),
        WorkingDays: 3,
        Status: 'Pending'
      }
    ];

    const svc = makeService(http);
    await svc.load();

    const vac = svc.getBalances().filter((b) => b.leaveType === 'vacation')[0];
    expect(vac.entitledDays).toBe(25); // entitlement comes from the stored row
    expect(vac.usedDays).toBe(5); // derived: sum of approved workingDays
    expect(vac.pendingDays).toBe(4); // derived: 1 + 3 pending workingDays
  });

  it('filters the list queries by the signed-in user email', async () => {
    const http = new FakeHttp();
    http.balances = [
      { LeaveType: 'Sick', EntitledDays: 10 }
    ];
    const svc = makeService(http);
    await svc.load();

    const requestCall = http.getCalls.filter(
      (c) => c.url.indexOf("getByTitle('TimeOffRequests')") >= 0
    )[0];
    expect(requestCall).toBeDefined();
    expect(requestCall.url).toContain("Employee/EMail eq 'me@contoso.com'");
    expect(requestCall.url).toContain('$expand=Approver,Employee');
  });

  it('drops rows with unknown leaveType or status', async () => {
    const http = new FakeHttp();
    http.balances = [
      { LeaveType: 'Bonus', EntitledDays: 5 },
      { LeaveType: 'Sick', EntitledDays: 10 }
    ];
    http.requests = [
      {
        Id: 1,
        Title: 'REQ-X',
        LeaveType: 'Vacation',
        StartDate: offsetIso(5),
        EndDate: offsetIso(6),
        WorkingDays: 2,
        Status: 'Archived'
      }
    ];
    const svc = makeService(http);
    await svc.load();

    expect(svc.getBalances()).toHaveLength(1);
    expect(svc.getBalances()[0].leaveType).toBe('sick');
    expect(svc.getRequests()).toHaveLength(0);
  });

  it('derives upcoming (asc) and recent (desc, excludes upcoming)', async () => {
    const http = new FakeHttp();
    http.balances = [
      { LeaveType: 'Vacation', EntitledDays: 25 }
    ];
    http.requests = [
      {
        Id: 1,
        Title: 'UP-LATE',
        LeaveType: 'Vacation',
        StartDate: offsetIso(40),
        EndDate: offsetIso(44),
        WorkingDays: 4,
        Status: 'Approved'
      },
      {
        Id: 2,
        Title: 'UP-SOON',
        LeaveType: 'Vacation',
        StartDate: offsetIso(10),
        EndDate: offsetIso(12),
        WorkingDays: 2,
        Status: 'Pending'
      },
      {
        Id: 3,
        Title: 'PAST-1',
        LeaveType: 'Vacation',
        StartDate: offsetIso(-30),
        EndDate: offsetIso(-28),
        WorkingDays: 2,
        Status: 'Approved'
      },
      {
        Id: 4,
        Title: 'PAST-2',
        LeaveType: 'Vacation',
        StartDate: offsetIso(-10),
        EndDate: offsetIso(-8),
        WorkingDays: 2,
        Status: 'Approved'
      }
    ];
    const svc = makeService(http);
    await svc.load();

    expect(svc.getUpcomingRequests().map((r) => r.id)).toEqual([
      'UP-SOON',
      'UP-LATE'
    ]);
    // Recent = everything not upcoming, newest first.
    expect(svc.getRecentRequests().map((r) => r.id)).toEqual(['PAST-2', 'PAST-1']);
  });

  it('seeds demo data when the user has no live rows', async () => {
    const http = new FakeHttp(); // balances + requests empty
    const svc = makeService(http);
    await svc.load();

    expect(svc.usingFallback).toBe(true);
    expect(svc.getBalances().length).toBeGreaterThan(0);
    expect(svc.getRequests().length).toBeGreaterThan(0);
    expect(svc.getProfile().managerName).not.toBe('');
  });

  it('never throws and seeds demo data on HTTP failure', async () => {
    const http = new FakeHttp();
    http.throwOnGet = true;
    const svc = makeService(http);

    await expect(svc.load()).resolves.toBeUndefined();
    expect(svc.usingFallback).toBe(true);
    expect(svc.getBalances().length).toBeGreaterThan(0);
  });
});

describe('SharePointTimeOffDataService writes', () => {
  async function loadedService(): Promise<{
    svc: SharePointTimeOffDataService;
    http: FakeHttp;
  }> {
    const http = new FakeHttp();
    http.balances = [
      { LeaveType: 'Sick', EntitledDays: 10 },
      { LeaveType: 'Vacation', EntitledDays: 25 }
    ];
    http.requests = [
      {
        Id: 42,
        Title: 'REQ-1002',
        LeaveType: 'Vacation',
        StartDate: offsetIso(20),
        EndDate: offsetIso(24),
        WorkingDays: 4,
        Status: 'Pending'
      }
    ];
    const svc = makeService(http);
    await svc.load();
    return { svc: svc, http: http };
  }

  it('createRequest updates the cache synchronously and POSTs the new item', async () => {
    const ctx = await loadedService();
    const before = ctx.svc.getRequests().length;

    const created = ctx.svc.createRequest({
      leaveType: 'sick',
      startDate: offsetIso(30),
      endDate: offsetIso(31),
      workingDays: 2,
      note: 'Dentist'
    });

    expect(created.status).toBe('pending');
    expect(created.id).toMatch(/^REQ-/);
    expect(ctx.svc.getRequests().length).toBe(before + 1);
    // Pending days are derived from the new request, not a stored counter.
    const sick = ctx.svc.getBalances().filter((b) => b.leaveType === 'sick')[0];
    expect(sick.pendingDays).toBe(2);

    await flush();

    const addCall = ctx.http.postCalls.filter(
      (c) => /getByTitle\('TimeOffRequests'\)\/items$/.test(c.url)
    )[0];
    expect(addCall).toBeDefined();
    const body = JSON.parse(addCall.body || '{}');
    expect(body.Title).toBe(created.id);
    expect(body.LeaveType).toBe('Sick');
    expect(body.Status).toBe('Pending');
    expect(body.EmployeeId).toBe(7);
    // Submitter is recorded as the approver so the request is routed into the
    // team approvals inbox (self-service approval in this sample).
    expect(body.ApproverId).toBe(7);
    expect(body.Note).toBe('Dentist');
  });

  it('cancelRequest flips the cache and MERGEs the status to Cancelled', async () => {
    const ctx = await loadedService();

    ctx.svc.cancelRequest('REQ-1002');

    const req = ctx.svc.getRequests().filter((r) => r.id === 'REQ-1002')[0];
    expect(req.status).toBe('cancelled');

    await flush();

    const mergeCall = ctx.http.postCalls.filter(
      (c) => c.url.indexOf('/items(42)') >= 0
    )[0];
    expect(mergeCall).toBeDefined();
    expect(mergeCall.headers['X-HTTP-Method']).toBe('MERGE');
    expect(mergeCall.headers['IF-MATCH']).toBe('*');
    expect(JSON.parse(mergeCall.body || '{}').Status).toBe('Cancelled');
  });

  it('notifies subscribers on load and on writes', async () => {
    const ctx = await loadedService();
    let count = 0;
    const unsub = ctx.svc.subscribe(() => {
      count += 1;
    });

    ctx.svc.createRequest({
      leaveType: 'vacation',
      startDate: offsetIso(50),
      endDate: offsetIso(51),
      workingDays: 2
    });
    expect(count).toBe(1);

    ctx.svc.cancelRequest('REQ-1002');
    expect(count).toBe(2);

    unsub();
    ctx.svc.cancelRequest('REQ-1002'); // already cancelled -> no notify
    expect(count).toBe(2);
  });
});

describe('SharePointTimeOffDataService refresh', () => {
  async function loadedService(): Promise<{
    svc: SharePointTimeOffDataService;
    http: FakeHttp;
  }> {
    const http = new FakeHttp();
    http.balances = [
      { LeaveType: 'Vacation', EntitledDays: 25 }
    ];
    http.requests = [
      {
        Id: 42,
        Title: 'REQ-1002',
        LeaveType: 'Vacation',
        StartDate: offsetIso(20),
        EndDate: offsetIso(24),
        WorkingDays: 4,
        Status: 'Pending'
      }
    ];
    const svc = makeService(http);
    await svc.load();
    return { svc: svc, http: http };
  }

  it('re-pulls live data from the server and notifies subscribers', async () => {
    const ctx = await loadedService();
    const getsAfterLoad = ctx.http.getCalls.length;
    let notified = 0;
    ctx.svc.subscribe(() => {
      notified++;
    });

    // A new request appears on the server after the initial load.
    ctx.http.requests = [
      ...(ctx.http.requests as unknown[]),
      {
        Id: 77,
        Title: 'REQ-1077',
        LeaveType: 'Vacation',
        StartDate: offsetIso(40),
        EndDate: offsetIso(41),
        WorkingDays: 2,
        Status: 'Pending'
      }
    ];

    ctx.svc.refresh();
    await flush();

    expect(ctx.http.getCalls.length).toBeGreaterThan(getsAfterLoad);
    expect(notified).toBeGreaterThan(0);
    expect(ctx.svc.getRequests().map((r) => r.id)).toContain('REQ-1077');
  });

  it('auto-reloads from the server after a successful cancel write', async () => {
    const ctx = await loadedService();
    const listGetsBefore = ctx.http.getCalls.filter(
      (c) => c.url.indexOf("getByTitle('TimeOffRequests')") >= 0
    ).length;

    ctx.svc.cancelRequest('REQ-1002');
    await flush();

    // The MERGE fired against the cancelled row...
    expect(
      ctx.http.postCalls.some((c) => c.url.indexOf('/items(42)') >= 0)
    ).toBe(true);
    // ...and the write success triggered a fresh list GET to reconcile the cache.
    const listGetsAfter = ctx.http.getCalls.filter(
      (c) => c.url.indexOf("getByTitle('TimeOffRequests')") >= 0
    ).length;
    expect(listGetsAfter).toBeGreaterThan(listGetsBefore);
  });
});

describe('SharePointTimeOffDataService manager-as-approver routing', () => {
  const vacationBalance = [
    { LeaveType: 'Vacation', EntitledDays: 25, Year: 2026 }
  ];

  it('routes the approver to the line manager resolved via Graph + ensureuser', async () => {
    const http = new FakeHttp();
    http.balances = vacationBalance;
    http.ensureUserId = 42;
    const svc = makeService(
      http,
      fakeManager({ displayName: 'Manager Mary', email: 'mary@contoso.com' })
    );
    await svc.load();

    // Live header now shows the real manager resolved from Graph.
    expect(svc.getProfile().managerName).toBe('Manager Mary');

    // ensureuser was called with the manager's email to resolve a site-user Id.
    const ensure = http.postCalls.filter((c) => /\/ensureuser$/.test(c.url))[0];
    expect(ensure).toBeDefined();
    expect(JSON.parse(ensure.body || '{}').logonName).toBe('mary@contoso.com');

    svc.createRequest({
      leaveType: 'vacation',
      startDate: offsetIso(30),
      endDate: offsetIso(31),
      workingDays: 2
    });
    await flush();

    const add = http.postCalls.filter(
      (c) => /getByTitle\('TimeOffRequests'\)\/items$/.test(c.url)
    )[0];
    const body = JSON.parse(add.body || '{}');
    expect(body.EmployeeId).toBe(7);
    // Routed to the manager (site-user Id 42), not the submitter.
    expect(body.ApproverId).toBe(42);
  });

  it('falls back to self-approval when the user has no manager', async () => {
    const http = new FakeHttp();
    http.balances = vacationBalance;
    const svc = makeService(http, fakeManager(undefined));
    await svc.load();

    expect(svc.getProfile().managerName).toBe('');
    // No manager -> no ensureuser round-trip.
    expect(
      http.postCalls.filter((c) => /\/ensureuser$/.test(c.url))
    ).toHaveLength(0);

    svc.createRequest({
      leaveType: 'vacation',
      startDate: offsetIso(30),
      endDate: offsetIso(31),
      workingDays: 2
    });
    await flush();

    const add = http.postCalls.filter(
      (c) => /getByTitle\('TimeOffRequests'\)\/items$/.test(c.url)
    )[0];
    // Submitter approves their own request (keeps single-user demos working).
    expect(JSON.parse(add.body || '{}').ApproverId).toBe(7);
  });

  it('shows the manager name but self-approves when ensureuser fails', async () => {
    const http = new FakeHttp();
    http.balances = vacationBalance;
    http.ensureUserOk = false; // manager resolves, but cannot be provisioned
    const svc = makeService(
      http,
      fakeManager({ displayName: 'Manager Mary', email: 'mary@contoso.com' })
    );
    await svc.load();

    // The user does have a manager, so the header still shows the name...
    expect(svc.getProfile().managerName).toBe('Manager Mary');

    svc.createRequest({
      leaveType: 'vacation',
      startDate: offsetIso(30),
      endDate: offsetIso(31),
      workingDays: 2
    });
    await flush();

    const add = http.postCalls.filter(
      (c) => /getByTitle\('TimeOffRequests'\)\/items$/.test(c.url)
    )[0];
    // ...but routing falls back to the submitter so the request still lands.
    expect(JSON.parse(add.body || '{}').ApproverId).toBe(7);
  });
});
