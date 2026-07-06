// Data shapes for the Time-Off Copilot Component.
//
// Framework-agnostic: no React, no SPFx, no Fluent imports. The same shapes back
// both the in-memory demo service and (later) the live SharePoint/Graph service,
// so the UI never changes when the data source is swapped.

export type LeaveType = 'vacation' | 'sick' | 'personal';

export type RequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export interface ILeaveBalance {
  leaveType: LeaveType;
  label: string;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  // remaining = entitledDays - usedDays - pendingDays (computed in the UI).
}

export interface ITimeOffRequest {
  id: string;
  leaveType: LeaveType;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd (inclusive)
  workingDays: number;
  status: RequestStatus;
  note?: string;
  submittedOn: string; // ISO yyyy-mm-dd
  approverName?: string;
}

export interface IEmployeeProfile {
  displayName: string;
  managerName: string;
  region: string;
}

// A non-working company holiday. Used by the working-day calculator so booked
// leave never counts a day the office is closed.
export interface ICompanyHoliday {
  date: string; // ISO yyyy-mm-dd
  name: string;
}

// Input the request component hands to the data service on submit. The service
// assigns the id, status ('pending') and submittedOn, so they are omitted here.
export interface INewTimeOffRequestInput {
  leaveType: LeaveType;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd (inclusive)
  workingDays: number;
  note?: string;
}
