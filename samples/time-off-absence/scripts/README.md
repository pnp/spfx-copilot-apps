# Time-Off provisioning scripts

PnP PowerShell automation that creates the SharePoint lists backing the Time-Off Copilot
component once the in-memory data service is swapped for the live SharePoint service (milestone M4).

## Prerequisites

1. **PnP.PowerShell**

   ```powershell
   Install-Module PnP.PowerShell -Scope CurrentUser
   ```

2. **An Entra (Azure AD) app for interactive login.** PnP.PowerShell 2.2+ no longer ships a
   default app, so you must register one once and pass its client id with `-ClientId`:

   ```powershell
   Register-PnPEntraIDAppForInteractiveLogin `
       -ApplicationName "PnP Rocks" `
       -Tenant contoso.onmicrosoft.com
   ```

   Copy the `AzureAppId / ClientId` it prints. (Older PnP.PowerShell builds with a built-in
   app can omit `-ClientId`.)

3. Permission to create lists on the target site (site owner / admin).

## Provision-TimeOffLists.ps1

Idempotent. Safe to re-run — existing lists, columns and seed items are detected and skipped.

### Create the empty lists and columns

```powershell
.\Provision-TimeOffLists.ps1 `
    -SiteUrl  https://contoso.sharepoint.com/sites/hr `
    -ClientId 00000000-0000-0000-0000-000000000000
```

### Create the lists and fill them with the demo data set

```powershell
.\Provision-TimeOffLists.ps1 `
    -SiteUrl       https://contoso.sharepoint.com/sites/hr `
    -ClientId      00000000-0000-0000-0000-000000000000 `
    -SeedSampleData `
    -EmployeeUpn   megan@contoso.com `
    -ApproverUpn   adele@contoso.com
```

### Recreate from scratch (destroys existing data)

```powershell
.\Provision-TimeOffLists.ps1 -SiteUrl <url> -ClientId <id> -Force -SeedSampleData
```

### Add team data for the team / approvals view (Component C)

Seeds, **per teammate**, one approved upcoming absence (shows under *Who's out*) and one
pending request whose approver is the signed-in user (shows in the manager *approvals inbox*).
Works on its own against an already-provisioned site, or combined with `-SeedSampleData`:

```powershell
.\Provision-TimeOffLists.ps1 `
    -SiteUrl          https://contoso.sharepoint.com/sites/hr `
    -ClientId         00000000-0000-0000-0000-000000000000 `
    -TeamMemberUpns   alex@contoso.com,jordan@contoso.com,taylor@contoso.com
```

Run this signed in as the **manager** who should see the pending requests — that account becomes
the `Approver` on the seeded pending rows (override with `-ApproverUpn`). Team rows are keyed on
deterministic `REQ-3xxx` ids, so re-running is safe.

> **Seeded vs. live approver.** `-ApproverUpn` only sets the `Approver` on these **seeded** rows.
> A request created **live** through the components resolves its approver client-side from Microsoft
> Graph (`/me/manager`), and falls back to self-approval when the user has no manager — so a
> single-user demo tenant still works end to end without any manager configured in Entra ID.

### Publish the lists-site tenant property (`-SetTenantProperty`)

Lets the **deployed** components find the lists site at runtime — **without rebuilding or
redeploying** the package. It writes a SharePoint tenant property named `TimeOffSite` (an
app-catalog storage entity) that the components read on every load and use **instead of** the
compiled-in `TIME_OFF_LISTS_SITE_PATH` default whenever it is present and non-empty.

```powershell
.\Provision-TimeOffLists.ps1 `
    -SiteUrl  https://contoso.sharepoint.com/sites/hr `
    -ClientId 00000000-0000-0000-0000-000000000000 `
    -SetTenantProperty
```

By default the property is set to the **server-relative path** of `-SiteUrl` (`/sites/hr`);
override with `-TenantPropertyValue` (a path or a full URL). It is stored at **tenant** scope, so
the connecting account must own the **tenant app catalog** (or be a SharePoint / Global admin). If
it lacks those rights the property set is **skipped with a warning** and list provisioning still
succeeds — set it later with `Set-PnPStorageEntity -Key TimeOffSite -Value /sites/hr`.

> **One-time prerequisite — allow the property-bag write.** A tenant storage entity is written to
> the **App Catalog site's property bag**, and SharePoint now blocks property-bag updates when
> custom script is denied (the default). Without this a `Set-PnPStorageEntity` / `-SetTenantProperty`
> run fails with `Access is denied. (… E_ACCESSDENIED)`. A SharePoint admin must first enable **one**
> of the following (only needed once per tenant):
>
> ```powershell
> # Option A — tenant-wide (preferred): allow property-bag updates even where custom script is denied
> Connect-SPOService -Url https://contoso-admin.sharepoint.com
> Set-SPOTenant -AllowWebPropertyBagUpdateWhenDenyAddAndCustomizePagesIsEnabled:$true
> ```
>
> ```powershell
> # Option B — scope it to just the App Catalog site: re-enable custom script there
> Set-PnPSite -Identity https://contoso.sharepoint.com/sites/appcatalog -NoScriptSite:$false
> ```
>
> You must also be a **Site Collection Administrator of the App Catalog** site (tenant/global admin
> alone is not enough); add yourself with `Set-SPOUser -Site <appCatalogUrl> -LoginName you@contoso.com
> -IsSiteCollectionAdmin $true`. Changes can take a short while to propagate.

### Parameters

| Parameter          | Required | Default              | Description |
|--------------------|----------|----------------------|-------------|
| `-SiteUrl`         | yes      | —                    | Absolute URL of the site to provision into. |
| `-ClientId`        | no\*     | —                    | Entra app (client) id for interactive login. Required by PnP.PowerShell 2.2+. |
| `-Region`          | no       | `United States`      | Value of the `Region` choice on `CompanyHolidays` and the seeded holidays. |
| `-SeedSampleData`  | no       | off                  | Also create demo balances, requests and holidays. |
| `-EmployeeUpn`     | no       | signed-in user       | Employee the seeded balances/requests belong to (with `-SeedSampleData`). |
| `-ApproverUpn`     | no       | `-EmployeeUpn`       | Approver recorded on already-approved seeded requests and on seeded team pending rows. |
| `-TeamMemberUpns`  | no       | (none)               | Teammates to seed team/approvals data for (Component C). Implies seeding even without `-SeedSampleData`. Unresolvable UPNs are skipped with a warning. |
| `-SetTenantProperty` | no     | off                  | Publish the `TimeOffSite` tenant property so deployed components target this site at runtime (no rebuild). Needs tenant-app-catalog ownership / admin; skipped with a warning otherwise. |
| `-TenantPropertyValue` | no   | path of `-SiteUrl`   | Explicit value for `TimeOffSite` (server-relative path or full URL). Only used with `-SetTenantProperty`. |
| `-Force`           | no       | off                  | Drop and recreate the lists if they already exist. |

\* Practically required on current PnP.PowerShell releases.

## Lists & columns

The column **internal names** below are the contract the live `SharePointTimeOffDataService`
(M4) must use in its REST `$select` / write payloads. Do not change them without updating the service.

### TimeOffRequests

| Internal name | SharePoint type            | Notes |
|---------------|----------------------------|-------|
| `Title`       | Single line (display "Request") | Required. Holds the `REQ-####` reference. |
| `Employee`    | Person (people only)       | Required. |
| `LeaveType`   | Choice                     | Required. `Vacation \| Sick \| Personal`, default `Vacation`. |
| `StartDate`   | Date (DateOnly)            | Required. |
| `EndDate`     | Date (DateOnly)            | Required. |
| `WorkingDays` | Number (0 dec, min 0)      | Required. |
| `Status`      | Choice                     | Required. `Pending \| Approved \| Declined \| Cancelled`, default `Pending`. |
| `Note`        | Multiple lines (plain, 4)  | Optional. |
| `Approver`    | Person (people only)       | Optional. |
| `SubmittedOn` | Date (DateOnly)            | Optional. |

### LeaveBalances

| Internal name  | SharePoint type        | Notes |
|----------------|------------------------|-------|
| `Title`        | Single line (display "Key") | **Not required** — balances are keyed on Employee + LeaveType + Year. |
| `Employee`     | Person (people only)   | Required. |
| `LeaveType`    | Choice                 | Required. `Vacation \| Sick \| Personal`. |
| `EntitledDays` | Number (0 dec, min 0)  | Required. The policy allotment. |
| `Year`         | Number (0 dec)         | Required. |

> **`UsedDays` / `PendingDays` are intentionally not stored.** The overview component derives used and pending days on the fly from `TimeOffRequests` (approved working days → used, pending working days → pending), so `EntitledDays` is the only balance figure kept in the list. This keeps the balance tiles accurate even when a request is added or approved without a stored counter being updated.

### CompanyHolidays

| Internal name | SharePoint type            | Notes |
|---------------|----------------------------|-------|
| `Title`       | Single line (display "Holiday") | Required. Holiday name. |
| `HolidayDate` | Date (DateOnly)            | Required. **See deviation note.** |
| `Region`      | Choice                     | Required. Single value = `-Region`. |

## Notes for the M4 live data service

- **Choice value mapping** — the service stores/reads SharePoint-friendly display text but the
  TypeScript enums are lowercase, so map both ways:
  - `LeaveType`: `Vacation \| Sick \| Personal` ↔ `'vacation' \| 'sick' \| 'personal'`
  - `Status`: `Pending \| Approved \| Declined \| Cancelled` ↔ `'pending' \| 'approved' \| 'declined' \| 'cancelled'`
- **`HolidayDate` deviation** — the spec calls this column "Date", but the literal internal name
  `Date` is ambiguous/reserved-ish in SharePoint, so the script provisions **`HolidayDate`**.
  The M4 service must `$select=HolidayDate` (not `Date`).
- **`Title` is repurposed per list** (display names "Request" / "Key" / "Holiday") but the internal
  name stays `Title` everywhere, so `$select=Title` keeps working.
