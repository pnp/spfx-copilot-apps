import { mockDashboard } from '../mockData';
import { DashboardData, RemediationDraft, Resource } from '../models/readiness';
import { IReadinessDataService } from './IReadinessDataService';

export class MockReadinessDataService implements IReadinessDataService {
  public async load(_assessmentId?: number): Promise<DashboardData> {
    // Clone so UI mutations never dirty the module singleton
    return JSON.parse(JSON.stringify(mockDashboard)) as DashboardData;
  }

  public async createActions(draft: RemediationDraft, resources: Resource[]): Promise<number> {
    const valid = draft.resourceIds.filter((id) => resources.some((r) => r.id === id));
    return valid.length;
  }
}
