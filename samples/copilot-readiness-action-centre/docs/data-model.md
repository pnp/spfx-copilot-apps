# Data model

## Copilot Readiness Assessments
Title, TenantName, AssessmentDate, OverallScore, AssessmentStatus

## Copilot Readiness Findings
Title, AssessmentId, Category, Severity, Description, Recommendation, AffectedCount, RiskScore, FindingStatus, Evidence

## Copilot Readiness Resources
Title, FindingId, SiteUrl, SiteOwnerEmail, ResourceType, ExposureType, ItemCount

## Copilot Remediation Actions
Title, FindingId, AffectedResourceId, AssignedToEmail, DueDate, ActionStatus, RecommendedAction, SiteUrl, ResolutionNotes, CompletedDate
