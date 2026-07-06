<#
.SYNOPSIS
    Provisions the SharePoint lists that back the Time-Off Copilot component.

.DESCRIPTION
    Creates (idempotently) the three lists the Time-Off solution reads/writes once the
    in-memory data service is swapped for the live SharePoint service:

        - TimeOffRequests  : one item per leave request
        - LeaveBalances    : entitled / used / pending days per employee, leave type and year
        - CompanyHolidays  : non-working company holidays used by the working-day calculator

    The column set mirrors copilotComponents/timeOffOverview/data/types.ts so the live
    SharePoint service can be a drop-in replacement for InMemoryTimeOffDataService.

    The script is safe to re-run: existing lists, fields and (optionally) seed items are
    detected and skipped. Use -Force to drop and recreate the lists from scratch.

    Choice value mapping (SharePoint <-> code):
        LeaveType : Vacation|Sick|Personal  <->  'vacation'|'sick'|'personal' (lower-cased in the service)
        Status    : Pending|Approved|Declined|Cancelled <-> 'pending'|'approved'|'declined'|'cancelled'

.PARAMETER SiteUrl
    Absolute URL of the SharePoint site (web) to provision into.

.PARAMETER ClientId
    Entra (Azure AD) application (client) id used for interactive login. Required by
    PnP.PowerShell 2.2+, which no longer ships a default multi-tenant app. Register one
    once with:  Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP Rocks" -Tenant contoso.onmicrosoft.com
    Omit only if you run an older PnP.PowerShell that still has a built-in app.

.PARAMETER Region
    Default value for the CompanyHolidays 'Region' choice column and the seeded holidays.
    Defaults to 'United States' (matches the in-memory seed).

.PARAMETER SeedSampleData
    Also creates demo content (leave balances, a handful of requests and the company
    holidays) so the live component shows realistic data immediately after the swap.

.PARAMETER EmployeeUpn
    UPN/email of the employee the seeded balances and requests belong to. Only used with
    -SeedSampleData. Defaults to the signed-in account.

.PARAMETER ApproverUpn
    UPN/email recorded as the approver on seeded, already-approved requests. Only used with
    -SeedSampleData. Defaults to -EmployeeUpn when omitted.

.PARAMETER TeamMemberUpns
    One or more UPNs/emails of teammates to seed "team" data for, so Component C
    (the team / approvals view) has content. For each teammate the script adds an approved
    upcoming absence (surfaces under "Who's out") and a pending request whose Approver is the
    signed-in user / -ApproverUpn (surfaces in that manager's approvals inbox). Unresolvable
    UPNs are skipped with a warning. Idempotent: rows are keyed on a deterministic Request id,
    so re-running does not create duplicates. Can be combined with -SeedSampleData or used on
    its own against an already-provisioned site.

.PARAMETER SetTenantProperty
    Also set the 'TimeOffSite' SharePoint tenant property so the deployed Copilot
    components pick up this site at runtime — no rebuild/redeploy needed. The value
    written is the server-relative path of -SiteUrl (e.g. '/sites/spfx') unless you
    override it with -TenantPropertyValue. Stored as a tenant-scoped storage entity
    in the tenant app catalog (Set-PnPStorageEntity), so the connecting account must
    be an owner of the tenant app catalog (or a SharePoint / Global admin). If it
    lacks those rights the property set is skipped with a warning — list
    provisioning still succeeds.

.PARAMETER TenantPropertyValue
    Explicit value for the 'TimeOffSite' tenant property. Only used with
    -SetTenantProperty. Accepts a server-relative path ('/sites/spfx') or a full
    site URL ('https://contoso.sharepoint.com/sites/spfx'); the components handle
    both. Defaults to the server-relative path derived from -SiteUrl.

.PARAMETER Force
    Drop the three lists if they already exist and recreate them. Destroys any existing data.

.EXAMPLE
    .\Provision-TimeOffLists.ps1 -SiteUrl https://contoso.sharepoint.com/sites/hr -ClientId <id> -SeedSampleData -EmployeeUpn megan@contoso.com -ApproverUpn adele@contoso.com

    Creates the lists and fills them with the demo data set used by the sample.

.EXAMPLE
    .\Provision-TimeOffLists.ps1 -SiteUrl https://contoso.sharepoint.com/sites/hr -ClientId <id> -TeamMemberUpns alex@contoso.com,jordan@contoso.com

    Adds team data (an approved absence + a pending request per teammate) on top of an
    already-provisioned site, with the signed-in user as the approver — lights up the
    "Who's out" list and the manager approvals inbox of the team component.

.EXAMPLE
    .\Provision-TimeOffLists.ps1 -SiteUrl https://contoso.sharepoint.com/sites/hr -ClientId 00000000-0000-0000-0000-000000000000

    Creates the empty lists and columns.

.EXAMPLE
    .\Provision-TimeOffLists.ps1 -SiteUrl https://contoso.sharepoint.com/sites/hr -ClientId 00000000-0000-0000-0000-000000000000 -SetTenantProperty

    Creates the lists and sets the 'TimeOffSite' tenant property to '/sites/hr', so
    the deployed components target this site tenant-wide without a rebuild. Requires
    ownership of the tenant app catalog (or SharePoint / Global admin) for the
    property set; if missing it is skipped with a warning.

.NOTES
    Author  : Bert Jansen
    License : Apache-2.0
    Requires: PnP.PowerShell (Install-Module PnP.PowerShell -Scope CurrentUser)
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$SiteUrl,

    [Parameter(Mandatory = $false)]
    [string]$ClientId,

    [Parameter(Mandatory = $false)]
    [string]$Region = 'United States',

    [Parameter(Mandatory = $false)]
    [switch]$SeedSampleData,

    [Parameter(Mandatory = $false)]
    [string]$EmployeeUpn,

    [Parameter(Mandatory = $false)]
    [string]$ApproverUpn,

    [Parameter(Mandatory = $false)]
    [string[]]$TeamMemberUpns = @(),

    [Parameter(Mandatory = $false)]
    [switch]$SetTenantProperty,

    [Parameter(Mandatory = $false)]
    [string]$TenantPropertyValue,

    [Parameter(Mandatory = $false)]
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
$script:ListRequests = 'TimeOffRequests'
$script:ListBalances = 'LeaveBalances'
$script:ListHolidays = 'CompanyHolidays'

# Tenant property (app-catalog storage entity) that lets deployed components
# resolve the lists site at runtime. Mirrors TIME_OFF_SITE_TENANT_PROPERTY in
# src/copilotComponents/shared/listsSiteConfig.ts.
$script:TenantPropertyKey = 'TimeOffSite'

$script:LeaveTypeChoices = @('Vacation', 'Sick', 'Personal')
$script:StatusChoices = @('Pending', 'Approved', 'Declined', 'Cancelled')

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Write-Step {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host "    $Message" -ForegroundColor DarkGray
}

function Initialize-PnPModule {
    if (-not (Get-Module -ListAvailable -Name 'PnP.PowerShell')) {
        throw "PnP.PowerShell is not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser"
    }
    Import-Module PnP.PowerShell -ErrorAction Stop
}

function Connect-Site {
    param([string]$Url, [string]$AppId)

    Write-Step "Connecting to $Url"
    $connectArgs = @{ Url = $Url; Interactive = $true }
    if (-not [string]::IsNullOrWhiteSpace($AppId)) {
        $connectArgs['ClientId'] = $AppId
    }
    Connect-PnPOnline @connectArgs
    Write-Info "Connected."
}

function New-ListIfMissing {
    param([string]$Title, [switch]$RecreateIfExists)

    $existing = Get-PnPList -Identity $Title -ErrorAction SilentlyContinue
    if ($existing) {
        if ($RecreateIfExists) {
            if ($PSCmdlet.ShouldProcess($Title, 'Remove existing list')) {
                Write-Info "Removing existing '$Title' (-Force)."
                Remove-PnPList -Identity $Title -Force
                $existing = $null
            }
        }
        else {
            Write-Info "List '$Title' already exists - reusing."
            return Get-PnPList -Identity $Title
        }
    }

    if (-not $existing) {
        if ($PSCmdlet.ShouldProcess($Title, 'Create list')) {
            Write-Info "Creating list '$Title'."
            New-PnPList -Title $Title -Template GenericList -OnQuickLaunch | Out-Null
        }
    }
    return Get-PnPList -Identity $Title -ErrorAction SilentlyContinue
}

function Add-FieldIfMissing {
    <#
        Adds a field from XML only when an internal name is not yet present on the list.
        Keeps the script idempotent and gives precise control over format/decimals/choices.
    #>
    param(
        [string]$ListTitle,
        [string]$InternalName,
        [string]$FieldXml
    )

    $field = Get-PnPField -List $ListTitle -Identity $InternalName -ErrorAction SilentlyContinue
    if ($field) {
        Write-Info "  - field '$InternalName' exists - skipped."
        return
    }
    if ($PSCmdlet.ShouldProcess("$ListTitle/$InternalName", 'Add field')) {
        Add-PnPFieldFromXml -List $ListTitle -FieldXml $FieldXml -ErrorAction Stop | Out-Null
        Write-Info "  - field '$InternalName' created."
    }
}

function Set-TitleColumn {
    <# Renames the default Title column and optionally makes it non-required. #>
    param([string]$ListTitle, [string]$DisplayName, [bool]$Required)

    Set-PnPField -List $ListTitle -Identity 'Title' -Values @{ Title = $DisplayName; Required = $Required } -ErrorAction Stop | Out-Null
    Write-Info "  - Title column set to '$DisplayName' (required=$Required)."
}

# Field XML builders -------------------------------------------------------
function Get-ChoiceFieldXml {
    param([string]$Name, [string[]]$Choices, [string]$Default, [bool]$Required = $false)
    $choiceXml = ($Choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ''
    $req = if ($Required) { 'TRUE' } else { 'FALSE' }
    $def = if ($Default) { "<Default>$Default</Default>" } else { '' }
    return "<Field Type='Choice' DisplayName='$Name' Name='$Name' Format='Dropdown' Required='$req'><CHOICES>$choiceXml</CHOICES>$def</Field>"
}

function Get-DateOnlyFieldXml {
    param([string]$Name, [bool]$Required = $false)
    $req = if ($Required) { 'TRUE' } else { 'FALSE' }
    return "<Field Type='DateTime' DisplayName='$Name' Name='$Name' Format='DateOnly' Required='$req' />"
}

function Get-NumberFieldXml {
    param([string]$Name, [int]$Decimals = 0, [bool]$Required = $false, [string]$Min)
    $req = if ($Required) { 'TRUE' } else { 'FALSE' }
    $minAttr = if ($PSBoundParameters.ContainsKey('Min')) { " Min='$Min'" } else { '' }
    return "<Field Type='Number' DisplayName='$Name' Name='$Name' Decimals='$Decimals' Required='$req'$minAttr />"
}

function Get-NoteFieldXml {
    param([string]$Name, [int]$NumLines = 4)
    return "<Field Type='Note' DisplayName='$Name' Name='$Name' NumLines='$NumLines' RichText='FALSE' AppendOnly='FALSE' />"
}

function Get-PersonFieldXml {
    param([string]$Name, [bool]$Required = $false)
    $req = if ($Required) { 'TRUE' } else { 'FALSE' }
    return "<Field Type='User' DisplayName='$Name' Name='$Name' UserSelectionMode='PeopleOnly' List='UserInfo' Required='$req' />"
}

# ---------------------------------------------------------------------------
# Provisioning
# ---------------------------------------------------------------------------
function Set-TimeOffRequestsList {
    Write-Step "Provisioning list '$script:ListRequests'"
    New-ListIfMissing -Title $script:ListRequests -RecreateIfExists:$Force | Out-Null
    Set-TitleColumn -ListTitle $script:ListRequests -DisplayName 'Request' -Required $true

    Add-FieldIfMissing $script:ListRequests 'Employee'    (Get-PersonFieldXml   -Name 'Employee'    -Required $true)
    Add-FieldIfMissing $script:ListRequests 'LeaveType'   (Get-ChoiceFieldXml   -Name 'LeaveType'   -Choices $script:LeaveTypeChoices -Default 'Vacation' -Required $true)
    Add-FieldIfMissing $script:ListRequests 'StartDate'   (Get-DateOnlyFieldXml -Name 'StartDate'   -Required $true)
    Add-FieldIfMissing $script:ListRequests 'EndDate'     (Get-DateOnlyFieldXml -Name 'EndDate'     -Required $true)
    Add-FieldIfMissing $script:ListRequests 'WorkingDays' (Get-NumberFieldXml   -Name 'WorkingDays' -Decimals 0 -Min '0' -Required $true)
    Add-FieldIfMissing $script:ListRequests 'Status'      (Get-ChoiceFieldXml   -Name 'Status'      -Choices $script:StatusChoices -Default 'Pending' -Required $true)
    Add-FieldIfMissing $script:ListRequests 'Note'        (Get-NoteFieldXml     -Name 'Note')
    Add-FieldIfMissing $script:ListRequests 'Approver'    (Get-PersonFieldXml   -Name 'Approver')
    Add-FieldIfMissing $script:ListRequests 'SubmittedOn' (Get-DateOnlyFieldXml -Name 'SubmittedOn')

    $view = Get-PnPView -List $script:ListRequests -ErrorAction SilentlyContinue | Where-Object { $_.DefaultView } | Select-Object -First 1
    if ($view) {
        Set-PnPView -List $script:ListRequests -Identity $view.Title -Fields @(
            'Title', 'Employee', 'LeaveType', 'StartDate', 'EndDate', 'WorkingDays', 'Status', 'Approver', 'SubmittedOn'
        ) -ErrorAction SilentlyContinue | Out-Null
    }
}

function Set-LeaveBalancesList {
    Write-Step "Provisioning list '$script:ListBalances'"
    New-ListIfMissing -Title $script:ListBalances -RecreateIfExists:$Force | Out-Null
    # Title is unused by the service (balances are keyed on Employee + LeaveType + Year).
    Set-TitleColumn -ListTitle $script:ListBalances -DisplayName 'Key' -Required $false

    Add-FieldIfMissing $script:ListBalances 'Employee'     (Get-PersonFieldXml -Name 'Employee'     -Required $true)
    Add-FieldIfMissing $script:ListBalances 'LeaveType'    (Get-ChoiceFieldXml -Name 'LeaveType'    -Choices $script:LeaveTypeChoices -Default 'Vacation' -Required $true)
    Add-FieldIfMissing $script:ListBalances 'EntitledDays' (Get-NumberFieldXml -Name 'EntitledDays' -Decimals 0 -Min '0' -Required $true)
    Add-FieldIfMissing $script:ListBalances 'Year'         (Get-NumberFieldXml -Name 'Year'         -Decimals 0 -Required $true)

    $view = Get-PnPView -List $script:ListBalances -ErrorAction SilentlyContinue | Where-Object { $_.DefaultView } | Select-Object -First 1
    if ($view) {
        Set-PnPView -List $script:ListBalances -Identity $view.Title -Fields @(
            'Employee', 'LeaveType', 'EntitledDays', 'Year'
        ) -ErrorAction SilentlyContinue | Out-Null
    }
}

function Set-CompanyHolidaysList {
    Write-Step "Provisioning list '$script:ListHolidays'"
    New-ListIfMissing -Title $script:ListHolidays -RecreateIfExists:$Force | Out-Null
    Set-TitleColumn -ListTitle $script:ListHolidays -DisplayName 'Holiday' -Required $true

    Add-FieldIfMissing $script:ListHolidays 'HolidayDate' (Get-DateOnlyFieldXml -Name 'HolidayDate' -Required $true)
    Add-FieldIfMissing $script:ListHolidays 'Region'      (Get-ChoiceFieldXml   -Name 'Region'      -Choices @($Region) -Default $Region -Required $true)

    $view = Get-PnPView -List $script:ListHolidays -ErrorAction SilentlyContinue | Where-Object { $_.DefaultView } | Select-Object -First 1
    if ($view) {
        Set-PnPView -List $script:ListHolidays -Identity $view.Title -Fields @('Title', 'HolidayDate', 'Region') -ErrorAction SilentlyContinue | Out-Null
    }
}

# ---------------------------------------------------------------------------
# Sample data (mirrors InMemoryTimeOffDataService so the live demo has content)
# ---------------------------------------------------------------------------
function Resolve-SeedEmployee {
    if (-not [string]::IsNullOrWhiteSpace($EmployeeUpn)) {
        return $EmployeeUpn
    }
    $web = Get-PnPWeb
    Get-PnPProperty -ClientObject $web -Property CurrentUser | Out-Null
    $email = $web.CurrentUser.Email
    if ([string]::IsNullOrWhiteSpace($email)) {
        $email = $web.CurrentUser.UserPrincipalName
    }
    return $email
}

function Test-ListEmpty {
    param([string]$ListTitle)
    $items = Get-PnPListItem -List $ListTitle -PageSize 1 -Fields 'ID' -ErrorAction SilentlyContinue
    return (-not $items -or $items.Count -eq 0)
}

function Add-HolidaySeed {
    if (-not (Test-ListEmpty -ListTitle $script:ListHolidays)) {
        Write-Info "Holidays already present - skipping seed."
        return
    }
    $year = (Get-Date).Year
    $fixed = @(
        @{ Md = '01-01'; Name = "New Year's Day" },
        @{ Md = '07-04'; Name = 'Independence Day' },
        @{ Md = '11-11'; Name = 'Veterans Day' },
        @{ Md = '12-25'; Name = 'Christmas Day' }
    )
    foreach ($y in @($year, $year + 1)) {
        foreach ($h in $fixed) {
            Add-PnPListItem -List $script:ListHolidays -Values @{
                Title       = $h.Name
                HolidayDate = "$y-$($h.Md)"
                Region      = $Region
            } | Out-Null
        }
    }
    Write-Info "Seeded $(($fixed.Count) * 2) company holidays for $year and $($year + 1)."
}

function Add-BalanceSeed {
    param([string]$Employee)
    if (-not (Test-ListEmpty -ListTitle $script:ListBalances)) {
        Write-Info "Balances already present - skipping seed."
        return
    }
    $year = (Get-Date).Year
    $rows = @(
        @{ LeaveType = 'Vacation'; EntitledDays = 25 },
        @{ LeaveType = 'Sick';     EntitledDays = 10 },
        @{ LeaveType = 'Personal'; EntitledDays = 5 }
    )
    foreach ($r in $rows) {
        Add-PnPListItem -List $script:ListBalances -Values @{
            Title        = "$Employee - $($r.LeaveType) $year"
            Employee     = $Employee
            LeaveType    = $r.LeaveType
            EntitledDays = $r.EntitledDays
            Year         = $year
        } | Out-Null
    }
    Write-Info "Seeded $($rows.Count) leave balances for $Employee."
}

function Add-RequestSeed {
    param([string]$Employee, [string]$Approver)
    if (-not (Test-ListEmpty -ListTitle $script:ListRequests)) {
        Write-Info "Requests already present - skipping seed."
        return
    }
    $today = (Get-Date).Date
    function Get-SeedDate { param([int]$n) ($today.AddDays($n)).ToString('yyyy-MM-dd') }

    # Mirrors the in-memory seed: balances reconcile (vacation used 5+3=8, pending 3; sick 2; personal 1).
    $requests = @(
        @{ Title = 'REQ-1001'; LeaveType = 'Vacation'; Start = (Get-SeedDate 14);  End = (Get-SeedDate 18);  Wd = 5; Status = 'Approved'; Note = 'Family trip';  Sub = (Get-SeedDate -20); WithApprover = $true },
        @{ Title = 'REQ-1002'; LeaveType = 'Vacation'; Start = (Get-SeedDate 30);  End = (Get-SeedDate 32);  Wd = 3; Status = 'Pending';  Note = 'Long weekend'; Sub = (Get-SeedDate -2);  WithApprover = $true },
        @{ Title = 'REQ-0990'; LeaveType = 'Vacation'; Start = (Get-SeedDate -32); End = (Get-SeedDate -30); Wd = 3; Status = 'Approved'; Note = 'City break';   Sub = (Get-SeedDate -50); WithApprover = $true },
        @{ Title = 'REQ-0985'; LeaveType = 'Sick';     Start = (Get-SeedDate -20); End = (Get-SeedDate -19); Wd = 2; Status = 'Approved'; Note = 'Flu';         Sub = (Get-SeedDate -21); WithApprover = $true },
        @{ Title = 'REQ-0970'; LeaveType = 'Personal'; Start = (Get-SeedDate -45); End = (Get-SeedDate -45); Wd = 1; Status = 'Approved'; Note = 'Appointment'; Sub = (Get-SeedDate -48); WithApprover = $true }
    )

    foreach ($r in $requests) {
        $values = @{
            Title       = $r.Title
            Employee    = $Employee
            LeaveType   = $r.LeaveType
            StartDate   = $r.Start
            EndDate     = $r.End
            WorkingDays = $r.Wd
            Status      = $r.Status
            Note        = $r.Note
            SubmittedOn = $r.Sub
        }
        if ($r.WithApprover -and -not [string]::IsNullOrWhiteSpace($Approver)) {
            $values['Approver'] = $Approver
        }
        Add-PnPListItem -List $script:ListRequests -Values $values | Out-Null
    }
    Write-Info "Seeded $($requests.Count) time-off requests for $Employee."
}

function Add-ItemIfMissingByTitle {
    param(
        [string]$ListTitle,
        [string]$Title,
        [hashtable]$Values
    )
    $caml = "<View><Query><Where><Eq><FieldRef Name='Title'/><Value Type='Text'>$Title</Value></Eq></Where></Query><RowLimit>1</RowLimit></View>"
    $existing = Get-PnPListItem -List $ListTitle -Query $caml -ErrorAction SilentlyContinue
    if ($existing -and $existing.Count -gt 0) {
        Write-Info "  - '$Title' already present - skipped."
        return
    }
    Add-PnPListItem -List $ListTitle -Values $Values | Out-Null
    Write-Info "  - '$Title' created."
}

function Add-TeamSeed {
    param([string]$Manager)
    if ($TeamMemberUpns.Count -eq 0) {
        return
    }
    Write-Info "Seeding team data for $($TeamMemberUpns.Count) teammate(s); approver/manager: $Manager"
    $today = (Get-Date).Date
    function Get-SeedDate { param([int]$n) ($today.AddDays($n)).ToString('yyyy-MM-dd') }

    # Per teammate: one approved upcoming absence (surfaces under "Who's out") and one pending
    # request whose Approver is the signed-in manager (surfaces in the approvals inbox). Rows are
    # keyed on deterministic REQ-3xxx ids so re-running the script does not create duplicates.
    $i = 0
    foreach ($member in $TeamMemberUpns) {
        if ([string]::IsNullOrWhiteSpace($member)) { continue }
        $i++
        $idx = '{0:D2}' -f $i
        $approvedId = "REQ-3${idx}1"
        $pendingId = "REQ-3${idx}2"
        try {
            Add-ItemIfMissingByTitle -ListTitle $script:ListRequests -Title $approvedId -Values @{
                Title       = $approvedId
                Employee    = $member
                LeaveType   = 'Vacation'
                StartDate   = (Get-SeedDate (4 + $i))
                EndDate     = (Get-SeedDate (6 + $i))
                WorkingDays = 3
                Status      = 'Approved'
                Note        = 'Approved team vacation'
                Approver    = $Manager
                SubmittedOn = (Get-SeedDate -10)
            }
            Add-ItemIfMissingByTitle -ListTitle $script:ListRequests -Title $pendingId -Values @{
                Title       = $pendingId
                Employee    = $member
                LeaveType   = 'Personal'
                StartDate   = (Get-SeedDate (10 + $i))
                EndDate     = (Get-SeedDate (10 + $i))
                WorkingDays = 1
                Status      = 'Pending'
                Note        = 'Awaiting manager approval'
                Approver    = $Manager
                SubmittedOn = (Get-SeedDate -1)
            }
            Write-Info "Teammate '$member' seeded ($approvedId approved, $pendingId pending)."
        }
        catch {
            Write-Warning "Could not seed teammate '$member': $($_.Exception.Message). Skipping."
        }
    }
}

function Invoke-Seed {
    Write-Step 'Seeding sample data'
    $employee = Resolve-SeedEmployee
    if ([string]::IsNullOrWhiteSpace($employee)) {
        if ($SeedSampleData) {
            Write-Warning "Could not resolve an employee UPN. Pass -EmployeeUpn to seed people-keyed data. Seeding holidays only."
            Add-HolidaySeed
        }
        if ($TeamMemberUpns.Count -gt 0) {
            Write-Warning "Could not resolve the signed-in user as approver. Pass -EmployeeUpn or -ApproverUpn to seed team approvals. Skipping team seed."
        }
        return
    }
    $approver = if (-not [string]::IsNullOrWhiteSpace($ApproverUpn)) { $ApproverUpn } else { $employee }
    Write-Info "Employee: $employee   Approver: $approver"

    if ($SeedSampleData) {
        Add-HolidaySeed
        Add-BalanceSeed -Employee $employee
        Add-RequestSeed -Employee $employee -Approver $approver
    }
    if ($TeamMemberUpns.Count -gt 0) {
        Add-TeamSeed -Manager $approver
    }
}

function Set-TimeOffTenantProperty {
    # Publishes the 'TimeOffSite' tenant property so deployed components resolve this
    # site at runtime (no rebuild). Stored in the tenant app catalog via the default
    # Tenant scope of Set-PnPStorageEntity, so the connecting account must own the
    # tenant app catalog (or be a SharePoint / Global admin). Best-effort: failures
    # warn but never abort provisioning.
    if (-not [string]::IsNullOrWhiteSpace($TenantPropertyValue)) {
        $value = $TenantPropertyValue.Trim()
    }
    else {
        $value = ([System.Uri]$SiteUrl).AbsolutePath.TrimEnd('/')
    }

    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Warning "Could not derive a value for the '$script:TenantPropertyKey' tenant property from -SiteUrl (root site?). Pass -TenantPropertyValue '/sites/yoursite'. Skipping."
        return
    }

    Write-Step "Setting tenant property '$script:TenantPropertyKey' = '$value'"
    try {
        Set-PnPStorageEntity -Key $script:TenantPropertyKey -Value $value `
            -Description 'Server-relative path (or full URL) of the site hosting the Time-Off Copilot component lists.' `
            -Comment 'Set by Provision-TimeOffLists.ps1' | Out-Null

        $check = Get-PnPStorageEntity -Key $script:TenantPropertyKey -ErrorAction SilentlyContinue
        if ($null -ne $check) {
            Write-Info "Tenant property published. Read-back Value: '$($check.Value)'."
        }
        else {
            Write-Info "Tenant property published."
        }
    }
    catch {
        Write-Warning "Could not set the '$script:TenantPropertyKey' tenant property: $($_.Exception.Message)"
        Write-Warning "Setting a tenant property needs ownership of the TENANT APP CATALOG (or a SharePoint / Global admin). List provisioning still succeeded. Set it manually with: Set-PnPStorageEntity -Key '$script:TenantPropertyKey' -Value '$value'"

        if ($_.Exception.Message -match 'denied|E_ACCESSDENIED|0x80070005') {
            Write-Warning "Access denied usually means the App Catalog blocks property-bag writes because custom script is denied (the default). A SharePoint admin must enable ONE of these once per tenant, then re-run with -SetTenantProperty:"
            Write-Warning "  A) Connect-SPOService -Url https://<tenant>-admin.sharepoint.com ; Set-SPOTenant -AllowWebPropertyBagUpdateWhenDenyAddAndCustomizePagesIsEnabled:`$true"
            Write-Warning "  B) Set-PnPSite -Identity <appCatalogUrl> -NoScriptSite:`$false"
            Write-Warning "Also confirm you are a Site Collection Administrator of the App Catalog (Get-PnPTenantAppCatalogUrl). See scripts/README.md for details."
        }
    }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
try {
    Initialize-PnPModule
    Connect-Site -Url $SiteUrl -AppId $ClientId

    Set-TimeOffRequestsList
    Set-LeaveBalancesList
    Set-CompanyHolidaysList

    if ($SeedSampleData -or $TeamMemberUpns.Count -gt 0) {
        Invoke-Seed
    }

    if ($SetTenantProperty) {
        Set-TimeOffTenantProperty
    }

    Write-Step 'Done'
    Write-Host "Provisioned: $script:ListRequests, $script:ListBalances, $script:ListHolidays on $SiteUrl" -ForegroundColor Green
    if (-not $SeedSampleData -and $TeamMemberUpns.Count -eq 0) {
        Write-Info "Re-run with -SeedSampleData to add the demo content, or -TeamMemberUpns <upns> to add team data."
    }
    if (-not $SetTenantProperty) {
        Write-Info "Tip: add -SetTenantProperty to publish the '$script:TenantPropertyKey' tenant property so deployed components target this site without a rebuild."
    }
}
finally {
    if (Get-PnPConnection -ErrorAction SilentlyContinue) {
        Disconnect-PnPOnline -ErrorAction SilentlyContinue
    }
}
