// Unit tests for the live SharePoint TEAM data service.
//
// Like the overview service tests, these inject a trivial fake for the narrow
// ITimeOffHttpClient port — no @microsoft/sp-http, no network. We verify:
//  * the team query reads EVERYONE's rows (no Employee/EMail filter) and expands
//    the Employee + Approver people fields
//  * choice/date/person mapping into ITeamRow and the derived who's-out /
//    approvals views
//  * isManager() is true when the signed-in user approves anyone
//  * optimistic approve/decline flip the cache synchronously, notify, and fire
//    the correct background MERGE ({ Status: 'Approved' | 'Declined' })
//  * empty live data and HTTP failures self-heal to demo data (never throws) and
//    keep writes purely local

import { SharePointTimeOffTeamDataService } from './SharePointTimeOffTeamDataService';
import type {
  ITimeOffHttpClient,
  ITimeOffHttpResponse
} from '../../timeOffOverview/data/SharePointTimeOffDataService';

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

function flush(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

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

  public currentUser: unknown = { Id: 7, Email: 'me@contoso.com', Title: 'Demo Manager' };
  public requests: unknown[] = [];

  public throwOnGet: boolean = false;

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
    if (url.indexOf("getByTitle('TimeOffRequests')") >= 0) {
      return Promise.resolve(jsonResponse({ value: this.requests }));
    }
    return Promise.resolve(jsonResponse({ value: [] }));
  }

  public post(
    url: string,
    headers: { [name: string]: string },
    body: string
  ): Promise<ITimeOffHttpResponse> {
    this.postCalls.push({ url: url, headers: headers, body: body });
    return Promise.resolve(jsonResponse({}));
  }
}

function makeService(http: FakeHttp): SharePointTimeOffTeamDataService {
  return new SharePointTimeOffTeamDataService({
    http: http,
    webAbsoluteUrl: 'https://contoso.sharepoint.com/sites/hr/',
    currentUser: {
      displayName: 'Demo Manager',
      email: 'me@contoso.com',
      loginName: 'i:0#.f|membership|me@contoso.com'
    }
  });
}

/** A live team with one upcoming approved absence and two pending requests (one
 *  for me, one for another approver) plus a past approved row. */
function seedRequests(http: FakeHttp): void {
  http.requests = [
    {
      Id: 11,
      Title: 'REQ-3001',
      LeaveType: 'Vacation',
      StartDate: offsetIso(3),
      EndDate: offsetIso(5),
      WorkingDays: 3,
      Status: 'Approved',
      SubmittedOn: offsetIso(-10),
      Employee: { Title: 'Diego Siciliani', EMail: 'diego@contoso.com' },
      Approver: { Title: 'Demo Manager', EMail: 'me@contoso.com' }
    },
    {
      Id: 12,
      Title: 'REQ-3002',
      LeaveType: 'Sick',
      StartDate: offsetIso(2),
      EndDate: offsetIso(2),
      WorkingDays: 1,
      Status: 'Pending',
      SubmittedOn: offsetIso(-1),
      Note: 'Flu',
      Employee: { Title: 'Lynne Robbins', EMail: 'lynne@contoso.com' },
      Approver: { Title: 'Demo Manager', EMail: 'me@contoso.com' }
    },
    {
      Id: 13,
      Title: 'REQ-3003',
      LeaveType: 'Personal',
      StartDate: offsetIso(4),
      EndDate: offsetIso(4),
      WorkingDays: 1,
      Status: 'Pending',
      SubmittedOn: offsetIso(-1),
      Employee: { Title: 'Someone Else', EMail: 'else@contoso.com' },
      Approver: { Title: 'Another Boss', EMail: 'other@contoso.com' }
    },
    {
      Id: 14,
      Title: 'REQ-3004',
      LeaveType: 'Vacation',
      StartDate: offsetIso(-5),
      EndDate: offsetIso(-2),
      WorkingDays: 4,
      Status: 'Approved',
      SubmittedOn: offsetIso(-20),
      Employee: { Title: 'Past Person', EMail: 'past@contoso.com' },
      Approver: { Title: 'Demo Manager', EMail: 'me@contoso.com' }
    }
  ];
}

describe('SharePointTimeOffTeamDataService.load', () => {
  it('reads everyone (no me-filter) and expands the people fields', async () => {
    const http = new FakeHttp();
    seedRequests(http);
    const svc = makeService(http);
    await svc.load();

    const listGet = http.getCalls.filter(
      (c) => c.url.indexOf("getByTitle('TimeOffRequests')") >= 0
    )[0];
    expect(listGet).toBeDefined();
    expect(listGet.url.indexOf('$expand=Employee,Approver')).toBeGreaterThan(-1);
    // The team view must NOT scope to the signed-in user.
    expect(listGet.url.indexOf('$filter')).toBe(-1);
    expect(listGet.url.indexOf('Employee/EMail eq')).toBe(-1);
  });

  it('maps rows and derives who-is-out and the approvals inbox', async () => {
    const http = new FakeHttp();
    seedRequests(http);
    const svc = makeService(http);
    await svc.load();

    expect(svc.usingFallback).toBe(false);
    expect(svc.getManagerName()).toBe('Demo Manager');
    expect(svc.isManager()).toBe(true);

    // Who's out: only the upcoming approved row (past one excluded).
    const absences = svc.getTeamAbsences();
    expect(absences.map((a) => a.requestId)).toEqual(['REQ-3001']);
    expect(absences[0].employeeName).toBe('Diego Siciliani');

    // Inbox: only the pending row where I am the approver.
    const pending = svc.getPendingApprovals();
    expect(pending.map((p) => p.requestId)).toEqual(['REQ-3002']);
    expect(pending[0].employeeName).toBe('Lynne Robbins');
    expect(pending[0].note).toBe('Flu');
  });

  it('self-heals to demo data when the team has no rows', async () => {
    const http = new FakeHttp();
    http.requests = [];
    const svc = makeService(http);
    await svc.load();

    expect(svc.usingFallback).toBe(true);
    expect(svc.getTeamAbsences().length).toBeGreaterThan(0);
    // Demo roster is stamped with the signed-in user as approver, so the inbox
    // is populated for them.
    expect(svc.getPendingApprovals().length).toBeGreaterThan(0);
  });

  it('self-heals to demo data on HTTP failure (never throws)', async () => {
    const http = new FakeHttp();
    http.throwOnGet = true;
    const svc = makeService(http);
    await svc.load();

    expect(svc.usingFallback).toBe(true);
    expect(svc.getTeamAbsences().length).toBeGreaterThan(0);
  });
});

describe('SharePointTimeOffTeamDataService approve/decline', () => {
  it('approve flips the cache synchronously, notifies, and fires a MERGE Approved', async () => {
    const http = new FakeHttp();
    seedRequests(http);
    const svc = makeService(http);
    await svc.load();

    let notified = 0;
    svc.subscribe(() => {
      notified++;
    });

    svc.approveRequest('REQ-3002');

    // Synchronous: left the inbox, and (being upcoming) joined who's out.
    expect(svc.getPendingApprovals().map((p) => p.requestId)).toEqual([]);
    expect(svc.getTeamAbsences().map((a) => a.requestId)).toEqual(['REQ-3002', 'REQ-3001']);
    expect(notified).toBe(1);

    await flush();
    const merge = http.postCalls.filter((c) => c.url.indexOf('items(12)') >= 0)[0];
    expect(merge).toBeDefined();
    expect(merge.headers['X-HTTP-Method']).toBe('MERGE');
    expect(merge.headers['IF-MATCH']).toBe('*');
    expect(JSON.parse(merge.body || '{}').Status).toBe('Approved');
  });

  it('decline flips the cache and fires a MERGE Declined', async () => {
    const http = new FakeHttp();
    seedRequests(http);
    const svc = makeService(http);
    await svc.load();

    svc.declineRequest('REQ-3002');

    expect(svc.getPendingApprovals().map((p) => p.requestId)).toEqual([]);
    // Declined never shows under who's out.
    expect(svc.getTeamAbsences().map((a) => a.requestId)).toEqual(['REQ-3001']);

    await flush();
    const merge = http.postCalls.filter((c) => c.url.indexOf('items(12)') >= 0)[0];
    expect(merge).toBeDefined();
    expect(JSON.parse(merge.body || '{}').Status).toBe('Declined');
  });

  it('ignores unknown or non-pending ids and fires no REST', async () => {
    const http = new FakeHttp();
    seedRequests(http);
    const svc = makeService(http);
    await svc.load();

    svc.approveRequest('REQ-3001'); // already approved
    svc.approveRequest('does-not-exist');

    await flush();
    expect(http.postCalls.length).toBe(0);
  });

  it('keeps writes local while using fallback demo data', async () => {
    const http = new FakeHttp();
    http.requests = [];
    const svc = makeService(http);
    await svc.load();

    const firstPending = svc.getPendingApprovals()[0];
    expect(firstPending).toBeDefined();
    svc.approveRequest(firstPending.requestId);

    await flush();
    expect(http.postCalls.length).toBe(0);
    expect(svc.getPendingApprovals().map((p) => p.requestId)).not.toContain(
      firstPending.requestId
    );
  });
});

describe('SharePointTimeOffTeamDataService refresh', () => {
  it('re-pulls the team from the server and notifies subscribers', async () => {
    const http = new FakeHttp();
    seedRequests(http);
    const svc = makeService(http);
    await svc.load();

    const getsAfterLoad = http.getCalls.length;
    let notified = 0;
    svc.subscribe(() => {
      notified++;
    });

    // A new pending request routed to me lands on the server after the first load.
    http.requests = [
      ...(http.requests as unknown[]),
      {
        Id: 99,
        Title: 'REQ-3099',
        LeaveType: 'Vacation',
        StartDate: offsetIso(7),
        EndDate: offsetIso(8),
        WorkingDays: 2,
        Status: 'Pending',
        SubmittedOn: offsetIso(0),
        Employee: { Title: 'New Joiner', EMail: 'new@contoso.com' },
        Approver: { Title: 'Demo Manager', EMail: 'me@contoso.com' }
      }
    ];

    svc.refresh();
    await flush();

    // A fresh round-trip happened and the new row surfaced in my inbox.
    expect(http.getCalls.length).toBeGreaterThan(getsAfterLoad);
    expect(notified).toBeGreaterThan(0);
    expect(svc.getPendingApprovals().map((p) => p.requestId)).toContain('REQ-3099');
  });

  it('auto-reloads from the server after a successful approve write', async () => {
    const http = new FakeHttp();
    seedRequests(http);
    const svc = makeService(http);
    await svc.load();

    const listGetsBefore = http.getCalls.filter(
      (c) => c.url.indexOf("getByTitle('TimeOffRequests')") >= 0
    ).length;

    svc.approveRequest('REQ-3002');
    await flush();

    // The MERGE fired against the approved row...
    expect(http.postCalls.some((c) => c.url.indexOf('items(12)') >= 0)).toBe(true);
    // ...and the write success triggered a fresh list GET to reconcile the cache.
    const listGetsAfter = http.getCalls.filter(
      (c) => c.url.indexOf("getByTitle('TimeOffRequests')") >= 0
    ).length;
    expect(listGetsAfter).toBeGreaterThan(listGetsBefore);
  });
});
