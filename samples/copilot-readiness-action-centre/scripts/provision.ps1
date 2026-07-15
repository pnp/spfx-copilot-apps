param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [switch]$SkipSampleData
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw 'Install PnP.PowerShell first: Install-Module PnP.PowerShell -Scope CurrentUser'
}

function Ensure-List {
    param(
        [string]$Title
    )

    if (-not (Get-PnPList -Identity $Title -ErrorAction SilentlyContinue)) {
        Write-Host "Creating list: $Title" -ForegroundColor Cyan

        New-PnPList `
            -Title $Title `
            -Template GenericList `
            -OnQuickLaunch | Out-Null
    }
}

function Ensure-Field {
    param(
        [string]$List,
        [string]$Name,
        [string]$Type,
        [string]$Display = $Name
    )

    if (-not (Get-PnPField -List $List -Identity $Name -ErrorAction SilentlyContinue)) {
        Write-Host "Creating field: $List -> $Name" -ForegroundColor DarkCyan

        Add-PnPField `
            -List $List `
            -InternalName $Name `
            -DisplayName $Display `
            -Type $Type `
            -AddToDefaultView | Out-Null
    }
}

function Set-ChoiceField {
    param(
        [string]$List,
        [string]$Field,
        [string[]]$Choices
    )

    Write-Host "Configuring choices: $List -> $Field" -ForegroundColor DarkGray

    Set-PnPField `
        -List $List `
        -Identity $Field `
        -Values @{
            Choices = $Choices
        }
}

$A = 'Copilot Readiness Assessments'
$F = 'Copilot Readiness Findings'
$R = 'Copilot Readiness Resources'
$X = 'Copilot Remediation Actions'

@(
    $A
    $F
    $R
    $X
) | ForEach-Object {
    Ensure-List $_
}


#
# ASSESSMENTS
#

Ensure-Field $A 'TenantName' 'Text'
Ensure-Field $A 'AssessmentDate' 'DateTime'
Ensure-Field $A 'OverallScore' 'Number'
Ensure-Field $A 'AssessmentStatus' 'Choice'

Set-ChoiceField `
    -List $A `
    -Field 'AssessmentStatus' `
    -Choices @(
        'Draft'
        'Active'
        'Complete'
        'Archived'
    )


#
# FINDINGS
#

Ensure-Field $F 'AssessmentId' 'Number'
Ensure-Field $F 'Category' 'Text'
Ensure-Field $F 'Severity' 'Choice'

Set-ChoiceField `
    -List $F `
    -Field 'Severity' `
    -Choices @(
        'Critical'
        'High'
        'Medium'
        'Low'
    )

Ensure-Field $F 'Description' 'Note'
Ensure-Field $F 'Recommendation' 'Note'
Ensure-Field $F 'AffectedCount' 'Number'
Ensure-Field $F 'RiskScore' 'Number'
Ensure-Field $F 'FindingStatus' 'Choice'

Set-ChoiceField `
    -List $F `
    -Field 'FindingStatus' `
    -Choices @(
        'Open'
        'In Progress'
        'Accepted Risk'
        'Resolved'
    )

Ensure-Field $F 'Evidence' 'Note'


#
# RESOURCES
#

Ensure-Field $R 'FindingId' 'Number'
Ensure-Field $R 'SiteUrl' 'URL'
Ensure-Field $R 'SiteOwnerEmail' 'Text'
Ensure-Field $R 'ResourceType' 'Text'
Ensure-Field $R 'ExposureType' 'Text'
Ensure-Field $R 'ItemCount' 'Number'


#
# REMEDIATION ACTIONS
#

Ensure-Field $X 'FindingId' 'Number'
Ensure-Field $X 'AffectedResourceId' 'Number'
Ensure-Field $X 'AssignedToEmail' 'Text'
Ensure-Field $X 'DueDate' 'DateTime'
Ensure-Field $X 'ActionStatus' 'Choice'

Set-ChoiceField `
    -List $X `
    -Field 'ActionStatus' `
    -Choices @(
        'Not Started'
        'In Progress'
        'Blocked'
        'Completed'
        'Cancelled'
    )

Ensure-Field $X 'RecommendedAction' 'Note'
Ensure-Field $X 'SiteUrl' 'URL'
Ensure-Field $X 'ResolutionNotes' 'Note'
Ensure-Field $X 'CompletedDate' 'DateTime'


#
# SAMPLE DATA
#

if (
    -not $SkipSampleData -and
    (Get-PnPListItem -List $A -PageSize 1).Count -eq 0
) {

    Write-Host 'Creating sample assessment...' -ForegroundColor Yellow

    $Assessment = Add-PnPListItem `
        -List $A `
        -Values @{
            Title            = 'Microsoft 365 Copilot Readiness Assessment'
            TenantName       = 'Archon Gnosis'
            AssessmentDate   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            OverallScore     = 42
            AssessmentStatus = 'Active'
        }


    $Findings = @(

        @{
            Title          = 'Broad SharePoint permissions'
            Category       = 'SharePoint Oversharing'
            Severity       = 'Critical'
            Description    = 'Content is available through broad organisational permissions.'
            Recommendation = 'Review broad principals and remove access that is not required.'
            AffectedCount  = 27
            RiskScore      = 96
            FindingStatus  = 'Open'
            Evidence       = 'Everyone and Everyone except external users principals were detected.'
        }

        @{
            Title          = 'Sensitive content without labels'
            Category       = 'Information Protection'
            Severity       = 'Critical'
            Description    = 'Potentially sensitive content is not protected by sensitivity labels.'
            Recommendation = 'Validate classification and apply an appropriate label and DLP control.'
            AffectedCount  = 18
            RiskScore      = 91
            FindingStatus  = 'Open'
            Evidence       = 'Sensitive information types were detected in unlabeled libraries.'
        }

        @{
            Title          = 'Sites without accountable owners'
            Category       = 'Site Governance'
            Severity       = 'High'
            Description    = 'Sites do not have a confirmed active business owner.'
            Recommendation = 'Assign two accountable owners and establish an ownership review.'
            AffectedCount  = 43
            RiskScore      = 78
            FindingStatus  = 'In Progress'
            Evidence       = 'Owner fields are empty, disabled, or have not been reviewed within 12 months.'
        }
    )


    $CreatedFindings = @()

    foreach ($Finding in $Findings) {

        $Finding['AssessmentId'] = $Assessment.Id

        $CreatedFinding = Add-PnPListItem `
            -List $F `
            -Values $Finding

        $CreatedFindings += $CreatedFinding
    }


    $Resources = @(

        @{
            Title          = 'Finance'
            FindingId      = $CreatedFindings[0].Id
            SiteUrl        = 'https://archongnosis.sharepoint.com/sites/Finance'
            SiteOwnerEmail = 'daniel@archongnosis.com.au'
            ResourceType   = 'Site'
            ExposureType   = 'Everyone except external users'
            ItemCount      = 3452
        }

        @{
            Title          = 'Executive'
            FindingId      = $CreatedFindings[0].Id
            SiteUrl        = 'https://archongnosis.sharepoint.com/sites/Executive'
            SiteOwnerEmail = 'daniel@archongnosis.com.au'
            ResourceType   = 'Site'
            ExposureType   = 'Everyone'
            ItemCount      = 921
        }

        @{
            Title          = 'People and Culture'
            FindingId      = $CreatedFindings[1].Id
            SiteUrl        = 'https://archongnosis.sharepoint.com/sites/People'
            SiteOwnerEmail = 'daniel@archongnosis.com.au'
            ResourceType   = 'Site'
            ExposureType   = 'Unlabelled sensitive content'
            ItemCount      = 384
        }

        @{
            Title          = 'Legacy Operations'
            FindingId      = $CreatedFindings[2].Id
            SiteUrl        = 'https://archongnosis.sharepoint.com/sites/LegacyOps'
            SiteOwnerEmail = ''
            ResourceType   = 'Site'
            ExposureType   = 'No active owner'
            ItemCount      = 8421
        }
    )


    foreach ($Resource in $Resources) {

        Add-PnPListItem `
            -List $R `
            -Values $Resource | Out-Null
    }

    Write-Host 'Sample data created.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Provisioning complete.' -ForegroundColor Green