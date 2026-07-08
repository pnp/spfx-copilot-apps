// Pure balance reconciliation for the overview component — no SPFx, React, or I/O.
//
// `usedDays` and `pendingDays` are DERIVED from the request list rather than
// trusted from a stored field, so the balance tiles always reflect reality even
// when a stored LeaveBalances row has drifted (e.g. a request was submitted or
// approved without the stored counter being updated). Only `entitledDays` (the
// policy allotment) and the label come from the entitlement — those are config,
// not derivable from the requests.
//
//   usedDays    = sum of workingDays for APPROVED requests of that leave type
//   pendingDays = sum of workingDays for PENDING  requests of that leave type
//   declined / cancelled requests never affect the balance
//
// remaining (computed in the UI) = entitledDays - usedDays - pendingDays.
//
// Deriving here means BOTH the in-memory and SharePoint services share one tested
// definition, and an in-session submit/cancel that mutates the request list is
// reflected in the tiles immediately on the next read — no stored counter to keep
// in sync, nothing to drift.

import type { ILeaveBalance, ITimeOffRequest } from '../data/types';

export function reconcileBalances(
  entitlements: readonly ILeaveBalance[],
  requests: readonly ITimeOffRequest[]
): ILeaveBalance[] {
  const used: { [leaveType: string]: number } = {};
  const pending: { [leaveType: string]: number } = {};

  for (let i = 0; i < requests.length; i++) {
    const r = requests[i];
    if (r.status === 'approved') {
      used[r.leaveType] = (used[r.leaveType] || 0) + r.workingDays;
    } else if (r.status === 'pending') {
      pending[r.leaveType] = (pending[r.leaveType] || 0) + r.workingDays;
    }
  }

  return entitlements.map((b) => ({
    leaveType: b.leaveType,
    label: b.label,
    entitledDays: b.entitledDays,
    usedDays: used[b.leaveType] || 0,
    pendingDays: pending[b.leaveType] || 0
  }));
}
