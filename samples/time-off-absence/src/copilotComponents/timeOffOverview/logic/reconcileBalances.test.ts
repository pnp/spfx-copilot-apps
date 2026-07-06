import { reconcileBalances } from './reconcileBalances';
import type {
  ILeaveBalance,
  ITimeOffRequest,
  LeaveType,
  RequestStatus
} from '../data/types';

function entitlement(
  leaveType: LeaveType,
  label: string,
  entitledDays: number,
  // Deliberately wrong stored counters to prove they are ignored.
  storedUsed: number = 99,
  storedPending: number = 99
): ILeaveBalance {
  return {
    leaveType: leaveType,
    label: label,
    entitledDays: entitledDays,
    usedDays: storedUsed,
    pendingDays: storedPending
  };
}

function req(
  leaveType: LeaveType,
  status: RequestStatus,
  workingDays: number,
  id: string
): ITimeOffRequest {
  return {
    id: id,
    leaveType: leaveType,
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    workingDays: workingDays,
    status: status,
    submittedOn: '2026-01-01'
  };
}

describe('reconcileBalances', () => {
  it('sums pending workingDays per leave type (the 4-pending bug)', () => {
    // Two pending vacation requests: 1 + 3 = 4 (stored field said 3).
    const out = reconcileBalances(
      [entitlement('vacation', 'Vacation', 25, 8, 3)],
      [
        req('vacation', 'pending', 1, 'REQ-A'),
        req('vacation', 'pending', 3, 'REQ-B')
      ]
    );
    expect(out[0].pendingDays).toBe(4);
  });

  it('sums approved workingDays into usedDays', () => {
    const out = reconcileBalances(
      [entitlement('vacation', 'Vacation', 25)],
      [
        req('vacation', 'approved', 5, 'REQ-A'),
        req('vacation', 'approved', 3, 'REQ-B')
      ]
    );
    expect(out[0].usedDays).toBe(8);
    expect(out[0].pendingDays).toBe(0);
  });

  it('ignores the stale stored usedDays/pendingDays on the entitlement', () => {
    // Entitlement carries bogus 99/99 counters; derived values must win.
    const out = reconcileBalances(
      [entitlement('vacation', 'Vacation', 25, 99, 99)],
      [req('vacation', 'approved', 2, 'REQ-A')]
    );
    expect(out[0].usedDays).toBe(2);
    expect(out[0].pendingDays).toBe(0);
  });

  it('excludes declined and cancelled requests', () => {
    const out = reconcileBalances(
      [entitlement('vacation', 'Vacation', 25)],
      [
        req('vacation', 'declined', 4, 'REQ-A'),
        req('vacation', 'cancelled', 2, 'REQ-B'),
        req('vacation', 'pending', 1, 'REQ-C')
      ]
    );
    expect(out[0].usedDays).toBe(0);
    expect(out[0].pendingDays).toBe(1);
  });

  it('keeps leave types isolated from one another', () => {
    const out = reconcileBalances(
      [
        entitlement('vacation', 'Vacation', 25),
        entitlement('sick', 'Sick', 10),
        entitlement('personal', 'Personal', 5)
      ],
      [
        req('vacation', 'approved', 8, 'REQ-A'),
        req('vacation', 'pending', 4, 'REQ-B'),
        req('sick', 'approved', 2, 'REQ-C'),
        req('personal', 'approved', 1, 'REQ-D')
      ]
    );
    const byType: { [k: string]: ILeaveBalance } = {};
    out.forEach((b) => (byType[b.leaveType] = b));
    expect(byType.vacation.usedDays).toBe(8);
    expect(byType.vacation.pendingDays).toBe(4);
    expect(byType.sick.usedDays).toBe(2);
    expect(byType.sick.pendingDays).toBe(0);
    expect(byType.personal.usedDays).toBe(1);
    expect(byType.personal.pendingDays).toBe(0);
  });

  it('returns zeroes for an entitlement with no requests', () => {
    const out = reconcileBalances(
      [entitlement('personal', 'Personal', 5, 7, 7)],
      []
    );
    expect(out[0].usedDays).toBe(0);
    expect(out[0].pendingDays).toBe(0);
  });

  it('preserves entitledDays, label and leaveType', () => {
    const out = reconcileBalances(
      [entitlement('vacation', 'Vacation', 25)],
      [req('vacation', 'pending', 3, 'REQ-A')]
    );
    expect(out[0].leaveType).toBe('vacation');
    expect(out[0].label).toBe('Vacation');
    expect(out[0].entitledDays).toBe(25);
  });

  it('drops requests whose leave type has no entitlement tile', () => {
    // A request for a type with no entitlement row produces no tile.
    const out = reconcileBalances(
      [entitlement('sick', 'Sick', 10)],
      [req('vacation', 'pending', 3, 'REQ-A')]
    );
    expect(out).toHaveLength(1);
    expect(out[0].leaveType).toBe('sick');
    expect(out[0].pendingDays).toBe(0);
  });
});
