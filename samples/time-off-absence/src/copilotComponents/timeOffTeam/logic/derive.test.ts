// Unit tests for the team derivation logic (pure, deterministic).

import {
  deriveAbsences,
  derivePending,
  isManagerOf,
  shouldShowApprovals,
  deriveMembersFromRows,
  deriveTeamCalendar,
  orderTeamMembers
} from './derive';
import type { ITeamRow, ITeamMember } from '../data/types';

function row(partial: Partial<ITeamRow> & Pick<ITeamRow, 'requestId'>): ITeamRow {
  return {
    spItemId: 0,
    employeeName: 'Someone',
    employeeEmail: 'someone@contoso.com',
    approverEmail: 'manager@contoso.com',
    leaveType: 'vacation',
    startDate: '2025-01-01',
    endDate: '2025-01-02',
    workingDays: 2,
    status: 'approved',
    submittedOn: '2024-12-01',
    ...partial
  };
}

const TODAY = '2025-06-15';

describe('deriveAbsences (who is out)', () => {
  it('keeps only approved leave that has not finished yet', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'A', status: 'approved', startDate: '2025-06-20', endDate: '2025-06-24' }),
      row({ requestId: 'B', status: 'approved', startDate: '2025-06-10', endDate: '2025-06-12' }), // past
      row({ requestId: 'C', status: 'pending', startDate: '2025-06-20', endDate: '2025-06-21' }), // not approved
      row({ requestId: 'D', status: 'approved', startDate: '2025-06-14', endDate: '2025-06-16' }) // straddles today
    ];
    const out = deriveAbsences(rows, TODAY);
    expect(out.map((a) => a.requestId)).toEqual(['D', 'A']);
  });

  it('sorts by start date ascending', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'late', startDate: '2025-07-01', endDate: '2025-07-02' }),
      row({ requestId: 'soon', startDate: '2025-06-16', endDate: '2025-06-17' })
    ];
    expect(deriveAbsences(rows, TODAY).map((a) => a.requestId)).toEqual(['soon', 'late']);
  });

  it('projects only the public absence fields', () => {
    const out = deriveAbsences([row({ requestId: 'X', startDate: '2025-06-20', endDate: '2025-06-22', employeeName: 'Diego' })], TODAY);
    expect(out[0]).toEqual({
      requestId: 'X',
      employeeName: 'Diego',
      leaveType: 'vacation',
      startDate: '2025-06-20',
      endDate: '2025-06-22',
      workingDays: 2
    });
  });
});

describe('derivePending (approvals inbox)', () => {
  it('keeps only pending rows where I am the approver (case-insensitive)', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'mine', status: 'pending', approverEmail: 'Manager@Contoso.com', submittedOn: '2025-06-01' }),
      row({ requestId: 'other', status: 'pending', approverEmail: 'someoneelse@contoso.com', submittedOn: '2025-06-02' }),
      row({ requestId: 'approved', status: 'approved', approverEmail: 'manager@contoso.com', submittedOn: '2025-06-03' })
    ];
    const out = derivePending(rows, 'manager@contoso.com');
    expect(out.map((p) => p.requestId)).toEqual(['mine']);
  });

  it('includes unrouted pending requests (no approver) but not ones routed to someone else', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'mine', status: 'pending', approverEmail: 'manager@contoso.com', submittedOn: '2025-06-01' }),
      row({ requestId: 'unrouted', status: 'pending', approverEmail: '', submittedOn: '2025-06-02' }),
      row({ requestId: 'other', status: 'pending', approverEmail: 'someoneelse@contoso.com', submittedOn: '2025-06-03' })
    ];
    const out = derivePending(rows, 'manager@contoso.com');
    expect(out.map((p) => p.requestId)).toEqual(['mine', 'unrouted']);
  });

  it('shows a self-submitted request where the submitter is their own approver', () => {
    const rows: ITeamRow[] = [
      row({
        requestId: 'self',
        status: 'pending',
        employeeEmail: 'manager@contoso.com',
        approverEmail: 'manager@contoso.com'
      })
    ];
    expect(derivePending(rows, 'manager@contoso.com').map((p) => p.requestId)).toEqual(['self']);
  });

  it('sorts oldest submission first', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'newer', status: 'pending', submittedOn: '2025-06-10' }),
      row({ requestId: 'older', status: 'pending', submittedOn: '2025-06-01' })
    ];
    expect(derivePending(rows, 'manager@contoso.com').map((p) => p.requestId)).toEqual(['older', 'newer']);
  });

  it('carries the note through only when present', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'withNote', status: 'pending', note: 'Conference' }),
      row({ requestId: 'noNote', status: 'pending' })
    ];
    const out = derivePending(rows, 'manager@contoso.com');
    const withNote = out.filter((p) => p.requestId === 'withNote')[0];
    const noNote = out.filter((p) => p.requestId === 'noNote')[0];
    expect(withNote.note).toBe('Conference');
    expect('note' in noNote).toBe(false);
  });
});

describe('isManagerOf', () => {
  it('is true when the user approves anyone', () => {
    const rows: ITeamRow[] = [row({ requestId: 'A', approverEmail: 'manager@contoso.com' })];
    expect(isManagerOf(rows, 'MANAGER@contoso.com')).toBe(true);
  });

  it('is false when the user approves no one', () => {
    const rows: ITeamRow[] = [row({ requestId: 'A', approverEmail: 'someoneelse@contoso.com' })];
    expect(isManagerOf(rows, 'manager@contoso.com')).toBe(false);
  });

  it('is true when there is an unrouted pending request awaiting a decision', () => {
    const rows: ITeamRow[] = [row({ requestId: 'A', status: 'pending', approverEmail: '' })];
    expect(isManagerOf(rows, 'manager@contoso.com')).toBe(true);
  });

  it('is false when an unrouted request is not pending', () => {
    const rows: ITeamRow[] = [row({ requestId: 'A', status: 'approved', approverEmail: '' })];
    expect(isManagerOf(rows, 'manager@contoso.com')).toBe(false);
  });

  it('is false for an empty team', () => {
    expect(isManagerOf([], 'manager@contoso.com')).toBe(false);
  });
});

describe('shouldShowApprovals (view-gate)', () => {
  it('hides the inbox for a non-manager regardless of view or pending count', () => {
    expect(shouldShowApprovals(undefined, false, 3)).toBe(false);
    expect(shouldShowApprovals('approvals', false, 3)).toBe(false);
    expect(shouldShowApprovals('whosOut', false, 0)).toBe(false);
  });

  it('shows the inbox for a manager when no view is specified', () => {
    expect(shouldShowApprovals(undefined, true, 0)).toBe(true);
    expect(shouldShowApprovals(undefined, true, 2)).toBe(true);
  });

  it('shows the inbox for a manager who explicitly asked for approvals', () => {
    expect(shouldShowApprovals('approvals', true, 0)).toBe(true);
    expect(shouldShowApprovals('approvals', true, 2)).toBe(true);
  });

  it('keeps a manager\u2019s waiting requests visible even when the view is narrowed to who\u2019s out', () => {
    // The core fix: a "who's out" focus must not hide a non-empty approvals inbox.
    expect(shouldShowApprovals('whosOut', true, 1)).toBe(true);
  });

  it('honors the who\u2019s-out focus only when the inbox is empty', () => {
    expect(shouldShowApprovals('whosOut', true, 0)).toBe(false);
  });
});

describe('deriveMembersFromRows (demo/fallback roster)', () => {
  const ME = 'manager@contoso.com';

  it('always includes the signed-in user as self, even with no rows', () => {
    const members = deriveMembersFromRows([], ME, 'Megan Bowen');
    expect(members).toEqual([{ email: ME, displayName: 'Megan Bowen', relationship: 'self' }]);
  });

  it('classifies people I approve as reports and everyone else as peers', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'A', employeeEmail: 'diego@contoso.com', employeeName: 'Diego', approverEmail: ME }),
      row({ requestId: 'B', employeeEmail: 'lidia@contoso.com', employeeName: 'Lidia', approverEmail: 'someoneelse@contoso.com' })
    ];
    const members = deriveMembersFromRows(rows, ME, 'Megan Bowen');
    const diego = members.filter((m) => m.email === 'diego@contoso.com')[0];
    const lidia = members.filter((m) => m.email === 'lidia@contoso.com')[0];
    expect(diego.relationship).toBe('report');
    expect(lidia.relationship).toBe('peer');
  });

  it('dedupes a person across rows and promotes peer -> report when I approve any row', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'A', employeeEmail: 'diego@contoso.com', employeeName: 'Diego', approverEmail: 'other@contoso.com' }),
      row({ requestId: 'B', employeeEmail: 'Diego@Contoso.com', employeeName: 'Diego', approverEmail: ME })
    ];
    const members = deriveMembersFromRows(rows, ME, 'Megan Bowen');
    const diego = members.filter((m) => m.email.toLowerCase() === 'diego@contoso.com');
    expect(diego.length).toBe(1);
    expect(diego[0].relationship).toBe('report');
  });

  it('never duplicates the signed-in user when they also appear on a row', () => {
    const rows: ITeamRow[] = [row({ requestId: 'A', employeeEmail: 'Manager@Contoso.com', employeeName: 'Megan' })];
    const members = deriveMembersFromRows(rows, ME, 'Megan Bowen');
    expect(members.filter((m) => m.relationship === 'self').length).toBe(1);
    expect(members.length).toBe(1);
  });
});

describe('orderTeamMembers', () => {
  it('orders manager, self, peers, then reports - each group alphabetical', () => {
    const members: ITeamMember[] = [
      { email: 'r2@x.com', displayName: 'Zane', relationship: 'report' },
      { email: 'p2@x.com', displayName: 'Bob', relationship: 'peer' },
      { email: 'me@x.com', displayName: 'Me', relationship: 'self' },
      { email: 'p1@x.com', displayName: 'Ann', relationship: 'peer' },
      { email: 'mgr@x.com', displayName: 'Boss', relationship: 'manager' },
      { email: 'r1@x.com', displayName: 'Amy', relationship: 'report' }
    ];
    expect(orderTeamMembers(members).map((m) => m.displayName)).toEqual([
      'Boss',
      'Me',
      'Ann',
      'Bob',
      'Amy',
      'Zane'
    ]);
  });

  it('does not mutate the input array', () => {
    const members: ITeamMember[] = [
      { email: 'a@x.com', displayName: 'A', relationship: 'report' },
      { email: 'b@x.com', displayName: 'B', relationship: 'self' }
    ];
    const copy = members.slice();
    orderTeamMembers(members);
    expect(members).toEqual(copy);
  });
});

describe('deriveTeamCalendar', () => {
  const MGR: ITeamMember = { email: 'mgr@contoso.com', displayName: 'Boss', relationship: 'manager' };
  const ME: ITeamMember = { email: 'me@contoso.com', displayName: 'Me', relationship: 'self' };

  it('keeps only approved and pending rows for each member, earliest first', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'p', employeeEmail: 'me@contoso.com', status: 'pending', startDate: '2025-03-10', endDate: '2025-03-11' }),
      row({ requestId: 'a', employeeEmail: 'me@contoso.com', status: 'approved', startDate: '2025-03-01', endDate: '2025-03-02' }),
      row({ requestId: 'd', employeeEmail: 'me@contoso.com', status: 'declined', startDate: '2025-03-20', endDate: '2025-03-21' }),
      row({ requestId: 'c', employeeEmail: 'me@contoso.com', status: 'cancelled', startDate: '2025-03-25', endDate: '2025-03-26' })
    ];
    const out = deriveTeamCalendar([ME], rows);
    expect(out.length).toBe(1);
    expect(out[0].bars.map((b) => b.requestId)).toEqual(['a', 'p']);
    expect(out[0].bars.map((b) => b.status)).toEqual(['approved', 'pending']);
  });

  it('matches employees case-insensitively and returns a row even with no absences', () => {
    const rows: ITeamRow[] = [
      row({ requestId: 'a', employeeEmail: 'ME@Contoso.com', status: 'approved', startDate: '2025-03-01', endDate: '2025-03-02' })
    ];
    const out = deriveTeamCalendar([MGR, ME], rows);
    // Manager has no rows -> empty bars; ordered manager first.
    expect(out.map((r) => r.member.displayName)).toEqual(['Boss', 'Me']);
    expect(out[0].bars).toEqual([]);
    expect(out[1].bars.length).toBe(1);
  });

  it('orders members via orderTeamMembers regardless of input order', () => {
    const out = deriveTeamCalendar([ME, MGR], []);
    expect(out.map((r) => r.member.relationship)).toEqual(['manager', 'self']);
  });
});

