/**
 * Chooses the data service implementation from the effective settings.
 *
 * Keeping the mock/real decision behind a single factory means the UI only ever
 * asks for "the data service" — switching `useMock` (from properties or the
 * settings panel) is the only thing that changes.
 */
import type { IExecDashboardDataService } from './IExecDashboardDataService';
import { MockExecDashboardDataService } from './MockExecDashboardDataService';
import { RealExecDashboardDataService } from './RealExecDashboardDataService';

/** Minimal shape needed to pick a data service. */
export interface IDataServiceConfig {
  useMock: boolean;
  dataServiceUrl: string;
}

export function createDataService(config: IDataServiceConfig): IExecDashboardDataService {
  if (config.useMock || !config.dataServiceUrl) {
    return new MockExecDashboardDataService();
  }
  return new RealExecDashboardDataService(config.dataServiceUrl);
}
