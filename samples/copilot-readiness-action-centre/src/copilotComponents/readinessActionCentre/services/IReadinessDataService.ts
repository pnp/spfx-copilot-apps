import { DashboardData, RemediationDraft, Resource } from '../models/readiness';

/**
 * Swappable data contract (agentic-creation-rules §9 / §16).
 * Mock and SharePoint implementations return the same view models.
 */
export interface IReadinessDataService {
  load(assessmentId?: number): Promise<DashboardData>;
  createActions(draft: RemediationDraft, resources: Resource[]): Promise<number>;
}
