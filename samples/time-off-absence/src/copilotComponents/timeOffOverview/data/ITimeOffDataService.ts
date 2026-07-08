import type {
  ICompanyHoliday,
  IEmployeeProfile,
  ILeaveBalance,
  INewTimeOffRequestInput,
  ITimeOffRequest
} from './types';

export interface ITimeOffDataService {
  getProfile(): IEmployeeProfile;
  getBalances(): readonly ILeaveBalance[];
  getRequests(): readonly ITimeOffRequest[];
  getUpcomingRequests(): readonly ITimeOffRequest[];
  getRecentRequests(limit?: number): readonly ITimeOffRequest[];
  getHolidays(): readonly ICompanyHoliday[];
  createRequest(input: INewTimeOffRequestInput): ITimeOffRequest;
  cancelRequest(id: string): void;
  /**
   * Re-pull the data from the backing store and notify listeners. The live
   * service re-fetches SharePoint/Graph; the in-memory demo service simply
   * re-emits its current state. Never throws.
   */
  refresh(): void;
  subscribe(listener: () => void): () => void;
}
