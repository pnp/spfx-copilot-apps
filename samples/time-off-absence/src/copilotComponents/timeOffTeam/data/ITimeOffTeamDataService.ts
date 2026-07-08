// Synchronous contract for the Time-Off TEAM component (Component C).
//
// Deliberately mirrors the shape of ITimeOffDataService: all reads are
// synchronous (served from a cache that the SharePoint implementation fills once
// via an async load() before the first render), and writes are fire-and-forget
// from the UI's perspective. That keeps the React tree identical whether it is
// driven by live SharePoint data or the in-memory demo service.

import type { ITeamAbsence, IPendingApproval, ITeamCalendarRow } from './types';

export interface ITimeOffTeamDataService {
  /** Display name of the signed-in user (the manager), for the header. */
  getManagerName(): string;

  /**
   * Whether the signed-in user approves anyone — i.e. the approvals inbox
   * should be shown. "Who's out" renders for everyone regardless.
   */
  isManager(): boolean;

  /** Teammates currently or soon on approved leave, earliest first. */
  getTeamAbsences(): readonly ITeamAbsence[];

  /** Pending requests awaiting the signed-in manager's decision, oldest first. */
  getPendingApprovals(): readonly IPendingApproval[];

  /**
   * The team roster (the signed-in user's peers + manager, plus their direct
   * reports if they are a manager) each with their approved/pending absence
   * bars, for the fullscreen team absence calendar. Members come from Microsoft
   * Graph (delegated, client-side) and self-heal to a roster derived from the
   * request rows when the directory lookup is unavailable or not consented.
   */
  getTeamCalendar(): readonly ITeamCalendarRow[];

  /**
   * Approve a pending request. Optimistic: the cache flips to 'approved' and
   * listeners fire synchronously; the live service then PATCHes SharePoint in
   * the background. No-op if the id is unknown or not pending.
   */
  approveRequest(requestId: string): void;

  /** Decline a pending request (optimistic, same mechanics as approveRequest). */
  declineRequest(requestId: string): void;

  /**
   * Re-pull the data from the backing store and notify listeners. The live
   * service re-fetches SharePoint; the in-memory demo service simply re-emits
   * its current state. Never throws.
   */
  refresh(): void;

  /** True when serving local demo data (no live lists) — lets the UI be honest. */
  readonly usingFallback: boolean;

  /** Subscribe to data changes; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}
