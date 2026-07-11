# GitHub Copilot Instructions — SharePoint Permissions Explorer Copilot App

## Project overview

Build a **SharePoint Copilot App** named **SharePoint Permissions Explorer**.

The app is an SPFx Copilot Component surfaced in the Microsoft 365 Copilot canvas. It helps users answer questions such as:

> Who has access to the EIB Architecture site?

The app must use the site name, site URL, or user intent extracted from the Copilot prompt to query an existing SharePoint site and display its permissions in an interactive UI.

This solution must **not** introduce a custom backend, SharePoint list, Dataverse table, Azure Function, Azure SQL database, or custom API. The app must use existing Microsoft 365 services only, primarily:

- Microsoft Graph
- SharePoint REST API
- Current user context and delegated permissions

## Primary scenario

### User prompt examples

The app should support prompts such as:

- `Who has access to the EIB Architecture site?`
- `Show me permissions for the EIB Architecture site.`
- `Who has Full Control on the EIB Architecture site?`
- `Show external users on the EIB Architecture site.`
- `Show SharePoint groups with access to the EIB Architecture site.`
- `Show only members with Edit permissions.`
- `Does Nicolas Lazzerini have access to the EIB Architecture site?`
- `Show inherited permissions for this site.`
- `Show unique permissions for this site.`

### Expected behavior

When the user asks a permission-related question, the Copilot App should:

1. Extract the target site from the prompt.
2. Resolve the SharePoint site by name or URL.
3. Retrieve permissions for that specific site only.
4. Display results in an interactive UI.
5. Allow the user to filter, search, expand groups, and inspect permission details.
6. Never show permissions from unrelated sites.
7. Respect the current user's permissions and Microsoft 365 security boundaries.

## Architecture principles

Follow these principles strictly:

- Use SPFx 1.24 preview Copilot App patterns.
- Build the UI as a Copilot Component, not as a classic web part.
- Do not create a property pane.
- Do not use `BaseClientSideWebPart`.
- Use TypeScript and React.
- Use Fluent UI for the user interface.
- Use PnPjs where it simplifies SharePoint REST calls.
- Use Microsoft Graph only where Graph provides a reliable endpoint for the required data.
- Use SharePoint REST for detailed SharePoint role assignments and group expansion where Graph does not expose enough detail.
- Keep the implementation tenant-hosted with no custom hosting layer.
- Do not persist permission data outside the current session.
- Do not cache sensitive permission data in local storage.
- Do not write permission data to SharePoint lists or files.

## Functional scope

### In scope

Implement the following features:

1. **Site resolution**
   - Accept a site title, partial site title, or absolute site URL.
   - Resolve the site to a canonical site URL and site identifier.
   - If multiple matching sites are found, display a site picker before querying permissions.

2. **Permissions summary**
   - Display a summary panel with:
     - Site title
     - Site URL
     - Number of direct users
     - Number of SharePoint groups
     - Number of Microsoft 365 groups, if detectable
     - Number of external users, if detectable
     - Whether the site appears to inherit permissions

3. **Permissions grid**
   - Display permissions in a table or grouped list.
   - Include at least:
     - Principal display name
     - Principal type: User, SharePoint Group, Microsoft 365 Group, Security Group, External User, Unknown
     - Permission level names
     - Source: Direct, SharePoint Group, M365 Group, Inherited, Unknown
     - Login name or user principal name when available

4. **Interactive filtering**
   - Provide filters for:
     - Principal type
     - Permission level
     - External users only
     - Direct permissions only
     - Groups only
     - Users only
   - Provide a free-text search box.

5. **Group expansion**
   - Allow the user to expand SharePoint groups to see their members.
   - Load group members on demand.
   - Show a loading state while expanding groups.
   - Handle access denied or unsupported expansion gracefully.

6. **User lookup**
   - If a prompt asks whether a specific person has access, resolve the person and highlight matching entries.
   - Search across direct permissions and expanded groups when available.
   - Clearly distinguish between confirmed access and access that cannot be confirmed because a group cannot be expanded.

7. **Safety and confirmation for write actions**
   - For the first version, implement read-only mode by default.
   - If future write actions are implemented, such as removing access or granting access, require explicit UI confirmation before executing the action.
   - Never perform permission changes directly from natural language without a confirmation step.

### Out of scope for first version

Do not implement these in the first version:

- Permission changes
- Grant access
- Remove access
- Sharing links audit
- Sensitivity label management
- SharePoint Advanced Management features
- Full tenant-wide access reviews
- Custom backend APIs
- Dataverse storage
- SharePoint list storage
- Scheduled scans
- Long-running background processing

## Copilot tool design

Define Copilot tool inputs explicitly. The tool must accept structured parameters inferred from the user's prompt.

Recommended input schema:

```ts
export interface IPermissionsExplorerProps {
  siteQuery: string;
  siteUrl?: string;
  filter?: PermissionFilter;
  principalQuery?: string;
  includeGroups?: boolean;
  includeExternalUsers?: boolean;
  includeInheritedPermissions?: boolean;
  mode?: 'summary' | 'details' | 'userLookup';
}

export type PermissionFilter =
  | 'all'
  | 'users'
  | 'groups'
  | 'externalUsers'
  | 'fullControl'
  | 'edit'
  | 'read'
  | 'directOnly'
  | 'inheritedOnly';
```

Expected mapping examples:

| User prompt | Expected tool parameters |
|---|---|
| `Who has access to the EIB Architecture site?` | `{ siteQuery: 'EIB Architecture', mode: 'details', filter: 'all' }` |
| `Show external users on the EIB Architecture site.` | `{ siteQuery: 'EIB Architecture', filter: 'externalUsers', includeExternalUsers: true }` |
| `Who has Full Control on the EIB Architecture site?` | `{ siteQuery: 'EIB Architecture', filter: 'fullControl' }` |
| `Does Nicolas Lazzerini have access to the EIB Architecture site?` | `{ siteQuery: 'EIB Architecture', principalQuery: 'Nicolas Lazzerini', mode: 'userLookup', includeGroups: true }` |

## Data access design

Create a dedicated service layer. Do not call Graph or SharePoint REST directly from React components.

Use these services:

```text
src/services/SiteResolverService.ts
src/services/PermissionsService.ts
src/services/PrincipalResolverService.ts
src/services/GraphClientService.ts
src/services/SharePointRestService.ts
```

### SiteResolverService

Responsibilities:

- Resolve a site by URL when a full URL is provided.
- Resolve a site by title or partial title when a name is provided.
- Return a normalized site object.
- Handle zero, one, or many matches.

Suggested model:

```ts
export interface IResolvedSite {
  id?: string;
  title: string;
  webUrl: string;
  serverRelativeUrl?: string;
}
```

### PermissionsService

Responsibilities:

- Retrieve site role assignments.
- Retrieve principals attached to role assignments.
- Retrieve role definitions / permission level names.
- Detect whether permissions are inherited where possible.
- Expand SharePoint groups on demand.
- Normalize raw API responses into UI-friendly models.

Suggested model:

```ts
export interface IPermissionEntry {
  id: string;
  principalId?: number;
  displayName: string;
  loginName?: string;
  email?: string;
  principalType: PrincipalType;
  permissionLevels: string[];
  source: PermissionSource;
  isExternal?: boolean;
  isGroupExpandable?: boolean;
  groupMembers?: IPermissionEntry[];
}

export type PrincipalType =
  | 'User'
  | 'SharePointGroup'
  | 'Microsoft365Group'
  | 'SecurityGroup'
  | 'ExternalUser'
  | 'Unknown';

export type PermissionSource =
  | 'Direct'
  | 'SharePointGroup'
  | 'Microsoft365Group'
  | 'Inherited'
  | 'Unknown';
```

### PrincipalResolverService

Responsibilities:

- Resolve a person or group mentioned in the prompt.
- Normalize comparison between display names, UPNs, emails, and login names.
- Support highlighting matching principals in the UI.

## API guidance

Use a hybrid approach:

### Microsoft Graph

Use Microsoft Graph for:

- Site discovery when appropriate.
- User and group profile enrichment.
- Resolving Microsoft 365 users and groups.

### SharePoint REST

Use SharePoint REST for SharePoint-specific permission details, especially:

- Site role assignments.
- Role definitions / permission level names.
- SharePoint group membership.
- Principal details where SharePoint-specific metadata is required.

Expected SharePoint REST patterns may include endpoints conceptually similar to:

```text
/_api/web/roleassignments?$expand=Member,RoleDefinitionBindings
/_api/web/sitegroups/getbyid(<groupId>)/users
/_api/web/hasuniqueroleassignments
```

Before implementing each endpoint, verify the exact REST URL, required headers, and returned shape against the current SharePoint REST documentation or existing project conventions.

## UI requirements

Build a clean, demo-ready UI suitable for the Copilot canvas.

### Layout

Use the following UI structure:

1. Header
   - App title: `SharePoint Access Review`
   - Subtitle: resolved site title and URL
   - Status badge: `Read-only review`

2. Summary cards
   - Total principals
   - Users
   - Groups
   - External users
   - Permission inheritance state

3. Filter bar
   - Search box
   - Principal type filter
   - Permission level filter
   - External users toggle
   - Direct permissions toggle

4. Permissions table
   - Principal
   - Type
   - Permission levels
   - Source
   - Actions

5. Details panel
   - Opens when the user selects a row.
   - Shows raw principal details, permission source, and group membership status.

### Interactions

Implement these interactions:

- Filter permissions without reloading data.
- Search by name, email, UPN, or permission level.
- Expand SharePoint groups on demand.
- Collapse expanded groups.
- Highlight a person when `principalQuery` is provided.
- Refresh permissions for the selected site.
- Copy a compact access summary to clipboard.

### Accessibility

Follow accessibility best practices:

- Use semantic HTML where possible.
- Ensure all interactive elements are keyboard accessible.
- Provide aria labels for icon-only buttons.
- Ensure sufficient color contrast.
- Do not rely on color alone to communicate permission severity.
- Use loading indicators with accessible labels.

## Error handling

Handle these cases gracefully:

1. No site found
   - Show a clear message and suggest trying the full site URL.

2. Multiple sites found
   - Show a site picker and let the user select the intended site.

3. Access denied
   - Explain that the current user does not have permission to inspect permissions for this site.
   - Do not expose partial sensitive data if the API call fails with access denied.

4. API throttling
   - Display a non-blocking warning.
   - Use retry with exponential backoff in the service layer where appropriate.

5. Group cannot be expanded
   - Keep the group row visible.
   - Mark membership as `Not expandable with current permissions`.

6. Unsupported principal type
   - Show it as `Unknown` rather than failing the whole UI.

## Security requirements

The app must be security-conscious by design:

- Use delegated permissions only unless explicitly required otherwise.
- Do not request broad Graph scopes unless necessary.
- Do not use application permissions for the demo version.
- Do not store access review results persistently.
- Do not log emails, UPNs, login names, or permission payloads to console in production builds.
- Do not expose hidden permission data if the current user cannot retrieve it through SharePoint or Graph APIs.
- Display a clear read-only badge in the UI.
- For future write actions, require explicit confirmation and show the exact change before execution.

## Performance requirements

- Load site-level permissions first.
- Expand group membership only on demand.
- Avoid expanding all groups automatically on initial load.
- Batch or parallelize safe read operations where appropriate.
- Debounce client-side search input.
- Memoize filtered permission results in React.
- Avoid unnecessary re-rendering of large permission tables.

## Suggested folder structure

```text
src/
  copilotComponents/
    permissionsExplorer/
      PermissionsExplorerCopilotComponent.ts
      PermissionsExplorer.tsx
      components/
        AccessSummaryCards.tsx
        PermissionFilters.tsx
        PermissionsTable.tsx
        PrincipalDetailsPanel.tsx
        SitePicker.tsx
        EmptyState.tsx
        ErrorState.tsx
      hooks/
        usePermissionsExplorer.ts
        usePermissionFilters.ts
      models/
        IPermissionsExplorerProps.ts
        IResolvedSite.ts
        IPermissionEntry.ts
      services/
        SiteResolverService.ts
        PermissionsService.ts
        PrincipalResolverService.ts
        GraphClientService.ts
        SharePointRestService.ts
      utils/
        permissionFilters.ts
        principalTypeMapper.ts
        externalUserDetector.ts
        retryPolicy.ts
```

## Implementation sequence

Implement in this order:

1. Create the Copilot Component entry point.
2. Define the tool input schema.
3. Implement the site resolver.
4. Implement basic permission retrieval for one resolved site.
5. Normalize permission data into `IPermissionEntry`.
6. Build the read-only summary UI.
7. Build the permissions table.
8. Add filters and search.
9. Add on-demand SharePoint group expansion.
10. Add user lookup and highlighting.
11. Add error states.
12. Add accessibility improvements.
13. Add unit tests for services and filtering logic.
14. Add a demo script and sample prompts.

## Testing expectations

Create tests for:

- Site query parsing.
- Site resolution with zero, one, and multiple results.
- Permission payload normalization.
- Principal type mapping.
- External user detection.
- Permission level filtering.
- Search filtering.
- User lookup matching.
- Error handling for access denied.
- Group expansion failure.

Use mocked Graph and SharePoint REST responses. Do not require a live tenant for unit tests.

## Demo script

Use this demo flow:

1. Open Microsoft 365 Copilot.
2. Ask:

   ```text
   Who has access to the EIB Architecture site?
   ```

3. The app resolves the site and displays an access summary.
4. In the UI, filter by `External users`.
5. Ask:

   ```text
   Who has Full Control?
   ```

6. The app updates or re-renders with the Full Control filter.
7. Expand a SharePoint group.
8. Ask:

   ```text
   Does Nicolas Lazzerini have access?
   ```

9. The app highlights matching direct or group-based access.
10. Explain that no custom backend is used: the app talks directly to Microsoft Graph and SharePoint REST using current user context.

## Code quality rules

- Prefer explicit TypeScript types over `any`.
- Keep React components small and focused.
- Keep API calls in services.
- Keep mapping and filtering logic in pure utility functions.
- Use async/await consistently.
- Use cancellation or mounted-state protection for long-running UI calls.
- Never swallow errors silently.
- Avoid hardcoded tenant URLs.
- Avoid hardcoded site names except in sample prompts or tests.
- Do not include customer-specific confidential data in source code.

## Naming

Use these names unless there is a strong reason not to:

- Solution name: `sharepoint-permissions-explorer-copilot-app`
- Component name: `PermissionsExplorerCopilotComponent`
- React root component: `PermissionsExplorer`
- Display name: `SharePoint Access Review`
- Read-only mode label: `Read-only review`

## Non-goals

Do not turn this into:

- A tenant-wide governance product.
- A replacement for Microsoft Purview or SharePoint Advanced Management.
- A background access review engine.
- A custom permissions database.
- A generic SharePoint admin center clone.

The goal is a focused, high-impact demo of this concept:

> Natural language intent selects the site and filters; the Copilot App provides a rich, interactive permission review experience using existing Microsoft 365 APIs only.
