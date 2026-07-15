import { DashboardData } from '../models/readiness';

/** Offline demo dashboard — Contoso narrative around Copilot readiness. */
export const mockDashboard: DashboardData = {
  assessment: {
    id: 1,
    title: 'Microsoft 365 Copilot Readiness Assessment',
    tenantName: 'Contoso',
    assessmentDate: new Date().toISOString(),
    overallScore: 42,
    status: 'Active'
  },
  findings: [
    {
      id: 101,
      title: 'Broad SharePoint permissions',
      category: 'SharePoint Oversharing',
      severity: 'Critical',
      description: 'Content is available through broad organisational permissions.',
      recommendation: 'Review broad principals and remove access that is not required.',
      affectedCount: 27,
      riskScore: 96,
      status: 'Open',
      evidence: 'Everyone and Everyone except external users principals were detected.'
    },
    {
      id: 102,
      title: 'Sensitive content without labels',
      category: 'Information Protection',
      severity: 'Critical',
      description: 'Potentially sensitive content is not protected by sensitivity labels.',
      recommendation: 'Validate classification and apply an appropriate label and DLP control.',
      affectedCount: 18,
      riskScore: 91,
      status: 'Open',
      evidence: 'Sensitive information types were detected in unlabeled libraries.'
    },
    {
      id: 103,
      title: 'Sites without accountable owners',
      category: 'Site Governance',
      severity: 'High',
      description: 'Sites do not have a confirmed active business owner.',
      recommendation: 'Assign two accountable owners and establish an ownership review.',
      affectedCount: 43,
      riskScore: 78,
      status: 'In Progress',
      evidence: 'Owner fields are empty, disabled, or have not been reviewed within 12 months.'
    },
    {
      id: 104,
      title: 'Poor search grounding',
      category: 'Search Readiness',
      severity: 'Medium',
      description: 'Key business content has weak metadata and inconsistent naming.',
      recommendation: 'Improve information architecture, metadata and content quality.',
      affectedCount: 12,
      riskScore: 57,
      status: 'Open',
      evidence: 'Low metadata coverage and duplicate document names were detected.'
    }
  ],
  resources: [
    {
      id: 1001,
      findingId: 101,
      title: 'Finance',
      siteUrl: 'https://contoso.sharepoint.com/sites/Finance',
      siteOwner: 'alex@contoso.com',
      resourceType: 'Site',
      exposureType: 'Everyone except external users',
      itemCount: 3452
    },
    {
      id: 1002,
      findingId: 101,
      title: 'Executive',
      siteUrl: 'https://contoso.sharepoint.com/sites/Executive',
      siteOwner: 'sam@contoso.com',
      resourceType: 'Site',
      exposureType: 'Everyone',
      itemCount: 921
    },
    {
      id: 1003,
      findingId: 101,
      title: 'Projects',
      siteUrl: 'https://contoso.sharepoint.com/sites/Projects',
      siteOwner: 'jordan@contoso.com',
      resourceType: 'Site',
      exposureType: 'Large security group',
      itemCount: 5170
    },
    {
      id: 1004,
      findingId: 102,
      title: 'People and Culture',
      siteUrl: 'https://contoso.sharepoint.com/sites/People',
      siteOwner: 'taylor@contoso.com',
      resourceType: 'Site',
      exposureType: 'Unlabelled sensitive content',
      itemCount: 384
    },
    {
      id: 1005,
      findingId: 103,
      title: 'Legacy Operations',
      siteUrl: 'https://contoso.sharepoint.com/sites/LegacyOps',
      siteOwner: '',
      resourceType: 'Site',
      exposureType: 'No active owner',
      itemCount: 8421
    }
  ],
  openActions: 9,
  completedActions: 14
};
