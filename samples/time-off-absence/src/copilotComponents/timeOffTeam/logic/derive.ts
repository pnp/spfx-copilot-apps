// Pure derivation logic for the team component — no SPFx, no React, no I/O.
//
// Both the in-memory and SharePoint team services keep a single list of
// ITeamRow and project the two public views (who's out, approvals inbox) from
// it via these helpers. Keeping the logic here means it is unit-tested once and
// behaves identically across data sources — and a manager Approve/Decline that
// flips a row's `status` instantly re-derives BOTH views (e.g. an approved
// request whose dates are upcoming pops into "who's out").

import type {
  ITeamRow,
  ITeamAbsence,
  IPendingApproval,
  ITeamMember,
  ITeamCalendarBar,
  ITeamCalendarRow,
  TeamMemberRelationship
} from '../data/types';

/** Case-insensitive email compare (SharePoint stores mixed case). */
function sameEmail(a: string, b: string): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/**
 * A request that has no designated approver yet ("unrouted"). The SharePoint
 * Approver person field is empty, so it maps to an empty approverEmail. Such a
 * request still needs a decision, so the team/admin view treats it as the
 * responsibility of whoever opens the approvals inbox — nothing falls through
 * the cracks. This is also why a self-submitted request (submitter == approver)
 * is never hidden: the generic rule handles it, with no special-casing.
 */
function isUnrouted(r: ITeamRow): boolean {
  return !r.approverEmail;
}

/**
 * "Who's out": approved leave that has not finished yet (endDate >= today),
 * earliest start first. Includes everyone on the team (the signed-in user too —
 * a manager seeing their own booked leave alongside the team is expected).
 */
export function deriveAbsences(
  rows: readonly ITeamRow[],
  todayIso: string
): ITeamAbsence[] {
  return rows
    .filter((r) => r.status === 'approved' && r.endDate >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((r) => ({
      requestId: r.requestId,
      employeeName: r.employeeName,
      leaveType: r.leaveType,
      startDate: r.startDate,
      endDate: r.endDate,
      workingDays: r.workingDays
    }));
}

/**
 * The manager's approvals inbox: pending requests the signed-in user needs to
 * act on — those for which they are the designated approver PLUS any that have
 * no approver assigned yet (unrouted). Every pending request must get a
 * decision, so a request submitted without an approver (or where the submitter
 * is their own approver) still surfaces here rather than silently disappearing.
 * Oldest submission first (act on the longest-waiting request first).
 */
export function derivePending(
  rows: readonly ITeamRow[],
  meEmail: string
): IPendingApproval[] {
  return rows
    .filter(
      (r) =>
        r.status === 'pending' &&
        (sameEmail(r.approverEmail, meEmail) || isUnrouted(r))
    )
    .sort((a, b) => {
      const bySubmitted = a.submittedOn.localeCompare(b.submittedOn);
      return bySubmitted !== 0 ? bySubmitted : a.startDate.localeCompare(b.startDate);
    })
    .map((r) => {
      const approval: IPendingApproval = {
        requestId: r.requestId,
        employeeName: r.employeeName,
        leaveType: r.leaveType,
        startDate: r.startDate,
        endDate: r.endDate,
        workingDays: r.workingDays,
        submittedOn: r.submittedOn
      };
      if (r.note) {
        approval.note = r.note;
      }
      return approval;
    });
}

/**
 * Whether the signed-in user should see the approvals inbox at all. True when
 * they are the approver on at least one request, OR when there is at least one
 * unrouted pending request awaiting a decision (which falls to whoever opens
 * the team/admin view). A pure employee with everything already routed to
 * someone else still sees nothing.
 */
export function isManagerOf(rows: readonly ITeamRow[], meEmail: string): boolean {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (sameEmail(r.approverEmail, meEmail)) {
      return true;
    }
    if (r.status === 'pending' && isUnrouted(r)) {
      return true;
    }
  }
  return false;
}

/**
 * Whether to render the manager's approvals inbox, given the optional view focus
 * the tool was invoked with. A manager with requests waiting must NEVER have them
 * hidden: even when the user narrowed the view to "who's out" — e.g. a "who's out
 * this week?" prompt the orchestrator mapped to view='whosOut' — a non-empty inbox
 * stays visible so a waiting request never falls through the cracks. The 'whosOut'
 * focus is honored (inbox suppressed) only when there is genuinely nothing to
 * approve. A non-manager never sees the inbox.
 */
export function shouldShowApprovals(
  view: 'whosOut' | 'approvals' | undefined,
  isManager: boolean,
  pendingCount: number
): boolean {
  if (!isManager) {
    return false;
  }
  if (view === 'whosOut') {
    return pendingCount > 0;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Team absence calendar (fullscreen) derivation
// -----------------------------------------------------------------------------

const RELATIONSHIP_ORDER: { [k in TeamMemberRelationship]: number } = {
  manager: 0,
  self: 1,
  peer: 2,
  report: 3
};

/**
 * Stable display order for the team calendar rows: manager first, then the
 * signed-in user, then peers, then direct reports — each group alphabetical by
 * name. Pure and deterministic so the calendar rows never jump around between
 * renders. Returns a new array.
 */
export function orderTeamMembers(
  members: readonly ITeamMember[]
): ITeamMember[] {
  return members.slice().sort((a, b) => {
    const byRel = RELATIONSHIP_ORDER[a.relationship] - RELATIONSHIP_ORDER[b.relationship];
    if (byRel !== 0) {
      return byRel;
    }
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Demo/fallback roster derived purely from the request rows when the Microsoft
 * Graph directory lookup is unavailable or not consented (no User.Read.All).
 * The signed-in user is 'self'; everyone else is a direct report when the
 * signed-in user is their approver on at least one row (the seed data routes all
 * requests to the manager, so the roster reads as "my reports"), otherwise a
 * peer. The viewer is always included even with no rows of their own.
 */
export function deriveMembersFromRows(
  rows: readonly ITeamRow[],
  meEmail: string,
  meName: string
): ITeamMember[] {
  const byEmail = new Map<string, ITeamMember>();

  const meKey = (meEmail || '').toLowerCase();
  if (meKey) {
    byEmail.set(meKey, {
      email: meEmail,
      displayName: meName || meEmail,
      relationship: 'self'
    });
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const key = (r.employeeEmail || '').toLowerCase();
    if (!key || key === meKey) {
      continue;
    }
    const existing = byEmail.get(key);
    const isMyReport = sameEmail(r.approverEmail, meEmail);
    if (!existing) {
      byEmail.set(key, {
        email: r.employeeEmail,
        displayName: r.employeeName || r.employeeEmail,
        relationship: isMyReport ? 'report' : 'peer'
      });
    } else if (isMyReport && existing.relationship === 'peer') {
      // Promote to report if any row routes their approval to me.
      existing.relationship = 'report';
    }
  }

  return orderTeamMembers(Array.from(byEmail.values()));
}

/**
 * Project the per-member absence bars for the team calendar: for each member,
 * the approved or pending rows whose employee matches (case-insensitive email),
 * earliest first. Cancelled/declined rows are dropped so the calendar only shows
 * booked (approved) and awaiting-decision (pending) spans — the same green/yellow
 * semantics as the overview off-work calendar. Members are returned in
 * orderTeamMembers order; a member with no absences yields an empty `bars` row
 * (they still appear, so the team reads as a full roster).
 */
export function deriveTeamCalendar(
  members: readonly ITeamMember[],
  rows: readonly ITeamRow[]
): ITeamCalendarRow[] {
  const ordered = orderTeamMembers(members);
  return ordered.map((member) => {
    const bars: ITeamCalendarBar[] = rows
      .filter(
        (r) =>
          sameEmail(r.employeeEmail, member.email) &&
          (r.status === 'approved' || r.status === 'pending')
      )
      .sort((a, b) => {
        const byStart = a.startDate.localeCompare(b.startDate);
        return byStart !== 0 ? byStart : a.endDate.localeCompare(b.endDate);
      })
      .map((r) => ({
        requestId: r.requestId,
        leaveType: r.leaveType,
        status: r.status as 'approved' | 'pending',
        startDate: r.startDate,
        endDate: r.endDate,
        workingDays: r.workingDays
      }));
    return { member, bars };
  });
}
