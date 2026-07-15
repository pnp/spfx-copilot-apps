export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Assessment {
  id: number;
  title: string;
  tenantName: string;
  assessmentDate: string;
  overallScore: number;
  status: string;
}

export interface Finding {
  id: number;
  title: string;
  category: string;
  severity: Severity;
  description: string;
  recommendation: string;
  affectedCount: number;
  riskScore: number;
  status: string;
  evidence: string;
}

export interface Resource {
  id: number;
  findingId: number;
  title: string;
  siteUrl: string;
  siteOwner: string;
  resourceType: string;
  exposureType: string;
  itemCount: number;
}

export interface RemediationDraft {
  findingId: number;
  resourceIds: number[];
  assignedToEmail: string;
  dueDate: string;
  recommendedAction: string;
}

export interface DashboardData {
  assessment: Assessment;
  findings: Finding[];
  resources: Resource[];
  openActions: number;
  completedActions: number;
}

export interface ICurrentUser {
  displayName: string;
  email: string;
  photoUrl?: string;
}
