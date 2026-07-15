import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import {
  DashboardData,
  Finding,
  RemediationDraft,
  Resource
} from '../models/readiness';
import { IReadinessDataService } from './IReadinessDataService';

const LISTS = {
  assessments: 'Copilot Readiness Assessments',
  findings: 'Copilot Readiness Findings',
  resources: 'Copilot Readiness Resources',
  actions: 'Copilot Remediation Actions'
} as const;

interface SpListResponse<T> {
  value: T[];
}

interface SpAssessmentItem {
  Id: number;
  Title: string;
  TenantName?: string;
  AssessmentDate: string;
  OverallScore?: number;
  AssessmentStatus?: string;
}

interface SpFindingItem {
  Id: number;
  Title: string;
  Category: string;
  Severity: Finding['severity'];
  Description?: string;
  Recommendation?: string;
  AffectedCount?: number;
  RiskScore?: number;
  FindingStatus?: string;
  Evidence?: string;
}

interface SpResourceItem {
  Id: number;
  FindingId: number;
  Title: string;
  SiteUrl?: { Url?: string } | string;
  SiteOwnerEmail?: string;
  ResourceType?: string;
  ExposureType?: string;
  ItemCount?: number;
}

interface SpActionItem {
  Id: number;
  ActionStatus?: string;
}

export class SharePointReadinessDataService implements IReadinessDataService {
  public constructor(
    private readonly client: SPHttpClient,
    private readonly siteUrl: string
  ) {}

  private async getJson<T>(path: string): Promise<T> {
    const response: SPHttpClientResponse = await this.client.get(
      `${this.siteUrl}/_api/web${path}`,
      SPHttpClient.configurations.v1,
      { headers: { Accept: 'application/json;odata=nometadata' } }
    );
    if (!response.ok) {
      throw new Error(`${response.status} ${await response.text()}`);
    }
    return (await response.json()) as T;
  }

  private async postJson(path: string, body: Record<string, unknown>): Promise<void> {
    const response: SPHttpClientResponse = await this.client.post(
      `${this.siteUrl}/_api/web${path}`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata'
        },
        body: JSON.stringify(body)
      }
    );
    if (!response.ok) {
      throw new Error(`${response.status} ${await response.text()}`);
    }
  }

  public async load(assessmentId?: number): Promise<DashboardData> {
    const aFilter = assessmentId ? `&$filter=Id eq ${assessmentId}` : '';
    const assessments = await this.getJson<SpListResponse<SpAssessmentItem>>(
      `/lists/getbytitle('${LISTS.assessments}')/items?$select=Id,Title,TenantName,AssessmentDate,OverallScore,AssessmentStatus&$orderby=AssessmentDate desc&$top=1${aFilter}`
    );
    if (!assessments.value?.length) {
      throw new Error(
        'No readiness assessment was found. Run scripts/provision.ps1 to create lists and sample data.'
      );
    }

    const raw = assessments.value[0];
    const assessment = {
      id: raw.Id,
      title: raw.Title,
      tenantName: raw.TenantName || '',
      assessmentDate: raw.AssessmentDate,
      overallScore: raw.OverallScore || 0,
      status: raw.AssessmentStatus || 'Active'
    };

    const findingsResponse = await this.getJson<SpListResponse<SpFindingItem>>(
      `/lists/getbytitle('${LISTS.findings}')/items?$select=Id,Title,Category,Severity,Description,Recommendation,AffectedCount,RiskScore,FindingStatus,Evidence&$filter=AssessmentId eq ${assessment.id}&$orderby=RiskScore desc`
    );
    const findings: Finding[] = findingsResponse.value.map((x) => ({
      id: x.Id,
      title: x.Title,
      category: x.Category,
      severity: x.Severity,
      description: x.Description || '',
      recommendation: x.Recommendation || '',
      affectedCount: x.AffectedCount || 0,
      riskScore: x.RiskScore || 0,
      status: x.FindingStatus || 'Open',
      evidence: x.Evidence || ''
    }));

    const findingIds = new Set(findings.map((f) => f.id));
    let resources: Resource[] = [];
    if (findingIds.size) {
      const resourcesResponse = await this.getJson<SpListResponse<SpResourceItem>>(
        `/lists/getbytitle('${LISTS.resources}')/items?$select=Id,Title,FindingId,SiteUrl,SiteOwnerEmail,ResourceType,ExposureType,ItemCount&$top=5000`
      );
      resources = resourcesResponse.value
        .filter((x) => findingIds.has(x.FindingId))
        .map((x) => ({
          id: x.Id,
          findingId: x.FindingId,
          title: x.Title,
          siteUrl:
            typeof x.SiteUrl === 'object' && x.SiteUrl
              ? x.SiteUrl.Url || ''
              : (x.SiteUrl as string) || '',
          siteOwner: x.SiteOwnerEmail || '',
          resourceType: x.ResourceType || 'Site',
          exposureType: x.ExposureType || '',
          itemCount: x.ItemCount || 0
        }));
    }

    const actions = await this.getJson<SpListResponse<SpActionItem>>(
      `/lists/getbytitle('${LISTS.actions}')/items?$select=Id,ActionStatus&$top=5000`
    );

    return {
      assessment,
      findings,
      resources,
      openActions: actions.value.filter((x) => x.ActionStatus !== 'Completed').length,
      completedActions: actions.value.filter((x) => x.ActionStatus === 'Completed').length
    };
  }

  public async createActions(draft: RemediationDraft, resources: Resource[]): Promise<number> {
    let count = 0;
    for (const id of draft.resourceIds) {
      const resource = resources.find((r) => r.id === id);
      if (!resource) {
        continue;
      }
      await this.postJson(`/lists/getbytitle('${LISTS.actions}')/items`, {
        Title: `Remediate ${resource.title}`,
        FindingId: draft.findingId,
        AffectedResourceId: resource.id,
        AssignedToEmail: draft.assignedToEmail,
        DueDate: draft.dueDate,
        ActionStatus: 'Not Started',
        RecommendedAction: draft.recommendedAction,
        SiteUrl: resource.siteUrl
      });
      count++;
    }
    return count;
  }
}
