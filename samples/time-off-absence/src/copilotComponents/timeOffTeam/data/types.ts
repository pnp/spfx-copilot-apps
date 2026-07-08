// Data shapes for the Time-Off TEAM component (Component C).
//
// The overview/request components are scoped to the signed-in user ("my" time
// off). The team component is different: it reads OTHER people's requests to
// answer "who's out" and, for a manager, surfaces an approvals inbox. So it
// needs an employee identity on every row — something the per-user shapes in
// timeOffOverview/data/types.ts deliberately omit.
//
// LeaveType and RequestStatus are reused from the overview types so the Choice
// <-> code mapping stays identical across all three components.

import type { LeaveType, RequestStatus } from '../../timeOffOverview/data/types';

/**
 * Internal, fully-detailed team request row. Both the in-memory and SharePoint
 * team services hold a list of these and derive the public views from it, so a
 * manager Approve/Decline (which flips `status`) re-derives both "who's out"
 * and the approvals inbox from one source of truth.
 */
export interface ITeamRow {
  /** Stable reference id (the TimeOffRequests Title, e.g. "REQ-2001"). */
  requestId: string;
  /** SharePoint list item id, used to target the MERGE on approve/decline. 0 in demo data. */
  spItemId: number;
  employeeName: string;
  employeeEmail: string;
  /** Email of the designated approver; the inbox shows rows where this is the signed-in user. */
  approverEmail: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: RequestStatus;
  submittedOn: string;
  note?: string;
}

/** A teammate currently or soon to be on approved leave ("who's out"). */
export interface ITeamAbsence {
  requestId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  /**
   * Microsoft 365 profile photo as a data URL. A presentation enrichment the
   * live SharePoint data service stamps on (delegated, client-side Graph); the
   * pure derivation never sets it. Undefined falls back to the avatar initials.
   */
  photoUrl?: string;
}

/** A pending request awaiting the signed-in manager's decision. */
export interface IPendingApproval {
  requestId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  submittedOn: string;
  note?: string;
  /** Profile photo data URL (see ITeamAbsence.photoUrl). Falls back to initials. */
  photoUrl?: string;
}

/**
 * How a team member relates to the signed-in user. Used by the fullscreen team
 * absence calendar to order and (optionally) annotate rows. Resolved from
 * Microsoft Graph (manager / peers / direct reports) with a demo-roster fallback
 * when the directory lookup is unavailable or not consented.
 */
export type TeamMemberRelationship = 'self' | 'manager' | 'peer' | 'report';

/** One person shown as a row in the team absence calendar. */
export interface ITeamMember {
  /** Lower-cased-comparable email; the join key against ITeamRow.employeeEmail. */
  email: string;
  displayName: string;
  jobTitle?: string;
  relationship: TeamMemberRelationship;
  /**
   * Microsoft Graph object id. Graph-only carrier used by the data adapter to
   * fetch the profile photo; the pure derivation logic ignores it. Absent for
   * demo-roster members (derived from request rows, no directory identity).
   */
  userId?: string;
  /**
   * Ready-to-render profile-photo data URL fetched from Microsoft Graph under
   * the signed-in user's delegated identity. When set, the calendar Avatar shows
   * the photo; when undefined it falls back to the member's initials.
   */
  photoUrl?: string;
}

/**
 * One absence bar on the team calendar — an approved or pending request placed
 * on a member's row. Cancelled/declined rows are excluded by the derivation, so
 * the calendar only ever shows "booked" (green) or "awaiting decision" (yellow)
 * spans, matching the overview off-work calendar's semantics.
 */
export interface ITeamCalendarBar {
  requestId: string;
  leaveType: LeaveType;
  status: 'approved' | 'pending';
  startDate: string;
  endDate: string;
  workingDays: number;
}

/** A member together with their absence bars, ready for the calendar grid. */
export interface ITeamCalendarRow {
  member: ITeamMember;
  bars: ITeamCalendarBar[];
}
