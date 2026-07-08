/**
 * Offline mock implementation of {@link IExecDashboardDataService}.
 *
 * Generates a fully shaped dashboard payload from local data with a small
 * simulated latency so the loading spinner is visible. No network is used.
 */
import type { IDashboardData } from '../models/dashboard';
import type { IDashboardFilters } from '../mockData/salesData';
import { buildMockDashboardData } from '../mockData/salesData';
import type { IExecDashboardDataService } from './IExecDashboardDataService';

/** Simulated latency (ms) so the loading state is demonstrable. */
const SIMULATED_LATENCY_MS: number = 600;

export class MockExecDashboardDataService implements IExecDashboardDataService {
  public getDashboardData(now: Date, filters: IDashboardFilters): Promise<IDashboardData> {
    return new Promise<IDashboardData>((resolve) => {
      setTimeout(() => resolve(buildMockDashboardData(now, filters)), SIMULATED_LATENCY_MS);
    });
  }
}
