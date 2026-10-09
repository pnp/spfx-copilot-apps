# Personal Links - Experience Design and Delivery Plan

This plan is the implementation authority for the Personal Links showcase described in
[README.md](./README.md). It adapts [agentic-creation-rules-golden.md](./agentic-creation-rules-golden.md)
to a deliberately small technical showcase: one shared personal-links experience, presented consistently
as a SharePoint web part, a Copilot inline/full-screen component, and a SharePoint full-page app. A Teams
personal app is a separate, manually packaged companion deliverable and is not enabled in the primary
solution by default.

No feature implementation starts until the Phase 0 approval item is checked.

## Status legend

- `[ ]` Open
- `[x]` Completed and validated
- **IN PROGRESS** means the only active slice
- **BLOCKED** names an external prerequisite

## Progress (latest)

> **IN PROGRESS - final tenant and publication evidence.** The shared Compact/Full React application, generated
> SharePoint/full-page web part, Copilot adapter, versioned App Folder service, Fluent editor/icon picker,
> Zava-inspired branding, package permission, agent metadata, README, gallery metadata, tests, and
> deployable package are implemented. Permission/setup failures are actionable, and the web part has a
> non-persistent seeded demo mode. The latest production gate passed 11 tests with zero lint warnings.
> The final package uses one shared JavaScript bundle, contains one current Copilot agent ZIP and zero
> Teams web-part ZIPs, and the version 1.0.0.3 SPPKG is 158,579 bytes with SHA-256
> `4776FDA62E733AC21A11C43949A90BA1DCA07B020587DEDFD23FF2928F38B833`. The separately packaged
> 15,840-byte Teams personal app has SHA-256
> `A3FE833AC5B7AF7DCC19DFF603A1A00A67A0C22F7B97186CB5D07C6A6FEDC292`. The solution remains blocked
> only on Copilot/Teams tenant validation, accessibility/theme/zoom checks, and optional host-specific
> publication evidence beyond the three checked-in core screenshots.

## Product objective

Demonstrate that a single, attractive Fluent UI experience can follow a user across Microsoft 365 hosts
while retaining the same personal data:

1. Open a compact launcher in Copilot inline mode or on a SharePoint page.
2. Launch frequently used personal links immediately.
3. Add a link from the compact `+` action without leaving the current host.
4. Expand into a full management experience to view, create, edit, delete, and reorder links.
5. See the same changes in Copilot, SharePoint, and the SharePoint full-page app because every surface
   uses the same file in the user's OneDrive App Folder.
6. Preserve the same shared React experience for a later Teams personal app, while packaging its Teams
   manifest and icons separately from the Copilot agent output.

The showcase optimizes for clarity, reuse, and visible cross-host persistence. It does not add folders,
sharing, analytics, tags, import/export, link previews, background synchronization, or AI-generated data.

## Approved-rule exceptions proposed for this sample

The golden playbook assumes an offline Copilot-only sample. This brief intentionally changes two rules:

- **G1 exception - web part required.** A generated SPFx web part is part of the product requirement so
  the shared experience can run on SharePoint pages and on a SharePoint full-page app page. It will
  remain a thin host adapter; the React experiences and data service will not be copied. Teams support
  is a later companion-packaging phase and is not enabled by default.
- **G5/G6 exception - live data is the signature feature.** The first implementation uses Microsoft
  Graph rather than mock data because centralized App Folder persistence is the technical point of the
  sample. Tests will use a fake implementation of the same storage interface and will not require live
  Graph.
- All other applicable rules remain in force, especially React 18 root lifecycle, Fluent UI v9,
  owner-document Griffel styling, accessibility, host-authoritative Copilot display mode, supported
  Yeoman scaffolding, explicit errors, and validation before packaging.

## Experience catalog and immutable identities

| Surface | SPFx identity | Default experience | Expanded experience |
| --- | --- | --- | --- |
| Copilot | Existing `PersonalLinksCopilotComponent` / `PersonalLinksTool` | Compact | Host `fullscreen` mode renders Full |
| SharePoint page | New generated `PersonalLinksWebPart` | Compact | Web part property can select Full |
| SharePoint full-page app | Same `PersonalLinksWebPart` | Full in `Auto` mode | Full |
| Teams personal app | Same deployed `PersonalLinksWebPart` through handcrafted manifest | Full | Full |

Primary web part `supportedHosts`:

- `SharePointWebPart`
- `SharePointFullPage`

`TeamsPersonalApp` is deliberately absent from the primary manifest so SPFx does not place an automatic
Teams web-part ZIP beside the Copilot agent package. The handcrafted package under
`teams-app/personalLinks/` follows the `samples/zava-one-hub/teams/` model and routes directly to the
deployed component. The generated Copilot agent ZIP and manually created Teams personal-app ZIP remain
distinct artifacts with separate upload paths.

The web part has one small setting: `experienceMode: "auto" | "compact" | "full"`.

- `auto` is the default.
- On a normal SharePoint page, `auto` resolves to Compact.
- In the SharePoint full-page host, `auto` resolves to Full.
- Authors can explicitly choose Compact or Full on SharePoint pages.

There is only one prompt-routed Copilot intent. Personal link creation and editing are interactions inside
that intent, not separate tools.

### Copilot routing boundary

- **Use when** the user wants to view or manage their saved personal links.
- **Do not use when** the user asks to search organizational bookmarks, SharePoint navigation, browser
  favorites, or links owned by another user.
- Suggested prompt: `Show my personal links.`
- Inline result: compact personal link launcher.
- Full-screen destination: full personal link manager preserving the current selection or draft when safe.

## Shared React experience design

### Experience A - Compact launcher

Purpose: fast viewing and launching, with lightweight creation.

Composition:

- A concise header with `Personal links`, a small link count, and an icon-only `+` button labeled
  `Add personal link`.
- A responsive list/grid of the first 6 links, ordered by the user's saved order.
- Each item uses the saved Fluent icon as the dominant visual, followed by title and a quiet hostname.
- Selecting a link opens its validated URL through the host adapter. Copilot uses
  `copilotBridge.openLinkAsync`; the web part uses a safe browser open callback.
- Overflow is represented by a truthful `View all` action with the remaining count.
- Copilot also exposes the standard top-right `View in full screen` action when full-screen mode is
  available.
- The `+` action opens a compact Fluent Dialog/Drawer containing the same reusable link editor used by
  the full experience. Save returns to the list and places the new item visibly.
- Empty state: a polished icon-led invitation with `Save your first link` and one primary Add action.
- Loading uses Fluent Skeleton rows. Errors use an inline MessageBar with Retry; the UI never presents an
  empty list as if loading succeeded.

Compact mode does not expose inline editing controls on every row. This keeps viewing and launching as
the dominant action and prevents a management toolbar from overwhelming Copilot inline mode.

### Experience B - Full personal link manager

Purpose: attractive link viewing plus persistent, obvious management.

Desktop/keynote composition:

- A Zava One-inspired product bar anchors the top of the experience, followed by a restrained Fluent
  hero with title, explanatory text, total link count, and `Add link`.
- Main content is a two-column layout:
  - the larger left region shows all links in a responsive icon-forward grid/list;
  - the right inspector keeps `Create a link` visible when nothing is selected and changes to
    `Edit link` when a link is selected.
- Link tiles show the selected Fluent icon, title, hostname, optional description, and a clear launch
  affordance. Hover and keyboard focus reveal Edit and Delete without making them the visual default.
- A compact command row provides search and `Reorder` mode. Search changes the visible records; reorder
  changes persisted order. No decorative filters are included.
- Reorder mode uses accessible Move up/Move down controls as the baseline. Drag and drop is deferred
  unless it can preserve equivalent keyboard behavior without adding complexity.
- Delete requires a confirmation dialog naming the link.
- The editor remains visible throughout management on wide screens so new creation is always one action
  away, as required by the brief.

Narrow composition:

- The grid becomes one column.
- The persistent inspector becomes an Add/Edit Drawer so link viewing retains the available width.
- The primary Add action remains visible near the heading.
- No horizontal scrolling is allowed at approximately 320 px width or 200% zoom.

### Link editor and icon picker

Fields:

1. **Title** - required, trimmed, maximum 80 characters.
2. **URL** - required absolute `https://` or `http://` URL; invalid or unsupported protocols are rejected
   before Review/Save.
3. **Description** - optional, maximum 160 characters.
4. **Icon** - required stable icon key selected from a curated Fluent icon catalog.

The icon picker is a searchable grid of approximately 24-32 meaningful icons such as Link, Globe, Mail,
Calendar, Document, Folder, People, Tasks, News, Learning, Video, Cloud, Code, and Bookmark. It shows a
live selected state, tooltip/name, keyboard navigation, and an accessible text label. We store a stable
application key such as `calendar`, not a React component name or SVG.

Creation/editing stages stay intentionally short:

- Draft with visible validation.
- Save.
- Local success feedback and updated list.

A separate review/receipt workflow would add ceremony without improving this small settings scenario.
Conflicting writes are the exception: the user sees that the file changed elsewhere and can reload before
trying again.

## Visual-quality contract

This sample should look like a polished Microsoft 365 utility, not a generic dashboard:

- Fluent UI v9 components, icons, themes, spacing, typography, elevation, and semantic tokens only.
- Adopt the actual top-bar and branding mechanics from `samples/zava-one-hub`, adapted to Personal Links:
  dark navy product bar, segmented blue/green/magenta/coral accent rule, compact light brand mark,
  semibold product name, and a right-aligned status/user region.
- Encode the approved Zava palette once in a shared Personal Links brand-theme module and consume it
  through custom theme tokens/CSS variables. Do not scatter brand hex values through components.
- One subtle brand-tinted hero in Full mode; Compact mode remains light and content-first while retaining
  the thin segmented accent rule and compact brand identity.
- Icon-forward link tiles are the signature visual. Icons carry category recognition but never replace
  the visible title.
- Restrained 4-8 px radii and elevation; no nested card stacks, KPI grids, decorative charts, people
  imagery, or unrelated AI styling.
- Repeated rows/tiles have designed alignment, hover, selected, focus, and keyboard states.
- Light, dark, forced-color, reduced-motion, narrow, standard, desktop, keynote, and 200% zoom states.
- Motion is limited to short panel/list transitions and is disabled for reduced motion.
- Full mode grows into useful columns on large canvases; it is not an inline-width card centered on a
  full page.

The representative quality gate is one Compact and one Full state populated with the same 6-8 realistic
links. Both must pass pixel review before CRUD details are scaled out.

### Named visual reference - Zava One Hub

The owning source and publication screenshot have been inspected:

- `samples/zava-one-hub/src/shared/components/ZavaOneExperiences.tsx`
- `samples/zava-one-hub/assets/screenshot-company-workspace.png`
- `samples/zava-one-hub/teams/README.md`

Patterns to reuse:

- A 5 px segmented accent rule with the Zava blue, green, magenta, and coral rhythm.
- A dark navy full-width product bar with high-contrast on-brand foreground.
- A 36 px light brand tile, medium product typography, balanced horizontal padding, and restrained
  height so branding frames rather than dominates the workspace.
- Left-aligned brand identity and right-aligned live status plus signed-in user identity.
- A thin accent strip on compact/focused cards to connect inline and full experiences.
- Header omission when Teams already supplies equivalent app/user chrome.

Personal Links adaptations:

- Replace the `Z` mark with a Fluent Link/Chain mark in the same light tile treatment.
- Replace `Zava One` with `Personal Links`.
- Replace the fictional `Demo data` badge with a truthful OneDrive state: `Saved to OneDrive`,
  `Saving`, `Offline`, `Needs permission`, or `Conflict`. Status text and icon are semantic; color is
  never the only indicator.
- Use the actual signed-in user's display name/avatar fallback rather than Zava personas.
- Do not copy Zava workspace tabs, Company/Personal information architecture, dense dashboard columns,
  demo badge, or domain imagery. Personal Links remains a focused link utility.
- In Compact mode, use only the accent strip, small brand mark/name, Add, and full-screen action; do not
  spend inline height on the complete navy product bar.
- In Full mode and SharePoint full-page mode, render the complete product bar. On an ordinary web-part
  canvas, render it only for the Full experience, not Compact.
- In the deferred Teams companion, hide the product bar when Teams supplies duplicate app/user chrome,
  matching the Zava `hideWorkspaceHeader` model.

## Data contract

### Canonical model

```ts
interface IPersonalLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  iconKey: PersonalLinkIconKey;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface IPersonalLinksDocument {
  schemaVersion: 1;
  links: IPersonalLink[];
  updatedAt: string;
}
```

- IDs are generated client-side and remain stable across hosts.
- `order` is normalized to contiguous values after create, delete, or reorder.
- ISO timestamps are metadata, not prominent UI.
- Unknown future fields are tolerated when reading; unsupported `schemaVersion` fails explicitly rather
  than overwriting data.
- The document is small and written atomically as one JSON payload.

### Service boundary

```ts
interface IPersonalLinksService {
  load(signal?: AbortSignal): Promise<IPersonalLinksSnapshot>;
  save(document: IPersonalLinksDocument, expectedETag?: string): Promise<IPersonalLinksSnapshot>;
}
```

- `GraphPersonalLinksService` is used by all production host adapters.
- `MemoryPersonalLinksService` is deterministic test infrastructure only.
- React consumes a shared controller/hook and never calls Microsoft Graph directly.
- Reads and writes expose `loading`, `saving`, `ready`, `empty`, `conflict`, and `error` states.
- Saves are serialized per mounted experience to avoid local double writes.

## OneDrive App Folder storage design

Microsoft Graph App Folder is the persistence boundary because it supplies a constant per-user location
and the least-privilege `Files.ReadWrite.AppFolder` scope.

Proposed delegated calls through `MSGraphClientV3`:

1. `GET /me/drive/special/approot` to create/resolve the signed-in user's App Folder.
2. `GET /me/drive/special/approot:/personal-links-v1.json` for item metadata and the current eTag.
3. `GET /me/drive/special/approot:/personal-links-v1.json:/content` to load the JSON document.
4. `PUT /me/drive/special/approot:/personal-links-v1.json:/content` to create or replace the document.

The distinct `personal-links-v1.json` name prevents collisions with unrelated SPFx solutions that may use
the same underlying Microsoft 365 application identity.

Write safety:

- Send `If-Match: <eTag>` when replacing an existing file.
- Treat HTTP 412 as a concurrency conflict, not a generic save failure.
- Keep the user's unsaved editor values in memory and offer `Reload latest`; do not silently overwrite a
  change made in another host.
- A missing file is a valid first-run empty state. Other 4xx/5xx responses are surfaced with correlation
  details suitable for troubleshooting, without exposing tokens or raw Graph payloads.
- Do not cache the document in localStorage. A short in-memory snapshot avoids redundant calls within one
  mounted host; manual Retry/Refresh always reads Graph.

The package permission to add during implementation is:

```json
"webApiPermissionRequests": [
  {
    "resource": "Microsoft Graph",
    "scope": "Files.ReadWrite.AppFolder"
  }
]
```

Tenant deployment documentation must state that an administrator approves this API request after the
`.sppkg` is deployed. The experience shows a clear permission error until approval exists.

Reference: [Using app folder in OneDrive and SharePoint](https://learn.microsoft.com/graph/onedrive-sharepoint-appfolder).

## Host adapters and shared boundaries

```text
Copilot adapter --------------------+
                                     +--> PersonalLinksApp
Web part adapter -------------------+      |- CompactExperience
                                            |- FullExperience
                                            |- LinkEditor
                                            |- IconPicker
                                            `- usePersonalLinks
                                                     |
                                                     v
                                          IPersonalLinksService
                                                     |
                                                     v
                                          Microsoft Graph App Folder
```

- Both adapters create `GraphPersonalLinksService` from their own SPFx context and pass only typed
  callbacks/state into React.
- Copilot adapter owns display-mode requests, model-context publishing, follow-up messaging if retained,
  and link opening through the bridge.
- Web part adapter owns host detection, `experienceMode`, property pane, SharePoint theme changes, and
  safe browser link opening.
- Shared React code owns all visible lists, tiles, editor state, validation, icon selection, CRUD
  commands, conflict UI, responsive behavior, and accessibility.
- A shared theme provider targets `context.domElement.ownerDocument` so Copilot iframe styles are emitted
  into the correct document.

## Copilot continuation and model context

- Inline Compact requests `fullscreen` only when the host advertises it.
- Display mode is always read from `hostContext`; React never pretends expansion succeeded.
- A pending create/edit draft remains component-instance transient state during passive host rerenders.
- Expanding while a link is selected focuses that link in Full mode. A fresh Copilot invocation resets
  transient selection/draft state but reloads persisted links.
- Publish a bounded model-context snapshot after load and after material selection/search/save/delete/
  reorder changes: intent, mode, visible link IDs/titles, result count, selected link ID/title, workflow
  state, and safe next actions.
- Never publish full URLs, descriptions, unconfirmed drafts, hidden links, Graph responses, or tokens to
  model context.
- No follow-up message is sent automatically.

## Error and edge-state contract

- **No OneDrive provisioned:** explain that OneDrive is required; do not replace persistence with a
  success-shaped local fallback.
- **Permission pending/denied:** explain the missing App Folder permission and provide Retry.
- **Missing file:** render the intentional first-run empty state.
- **Invalid/corrupt JSON:** do not overwrite it; show a recovery message and offer Retry. A future
  explicit reset/export recovery action is out of scope for the first slice.
- **Unsupported schema version:** stop writes and explain that the data was created by a newer version.
- **Network/read failure:** retain the last successfully loaded in-memory view, visibly mark it stale,
  disable mutations, and offer Retry.
- **Save failure:** keep the draft and previous persisted list; announce failure.
- **eTag conflict:** preserve the draft, show conflict status, and require reloading the latest file.
- **Invalid URL:** prevent save and place focus/announcement on the URL field.
- **Empty search result:** show a positive no-match state and Clear search.

## Approach and sequencing

The dependency order is:

1. Approve this scope, catalog, exceptions, UX, and storage contract.
2. Freeze generated identities and package metadata.
3. Configure least-privilege permission and build the typed storage boundary.
4. Establish the shared Fluent foundation and representative Compact/Full visuals.
5. Complete CRUD behavior once visual and data boundaries are proven.
6. Wire Copilot and generated web part adapters.
7. Validate locally, then validate authenticated tenant hosts.
8. Package and document the deployable Copilot/SharePoint showcase.
9. Treat Teams as a separately approved companion-package phase after the primary package is stable.

## Phase 0 - Scope, visual contract, and brief

### Discovery

- [x] Review the current Copilot scaffold and package configuration.
- [x] Review the golden creation rules and record necessary exceptions.
- [x] Verify Microsoft Graph App Folder's dedicated `Files.ReadWrite.AppFolder` permission and delegated
  per-user model.
- [x] Define the Compact and Full experience contracts.
- [x] Define the primary Copilot/SharePoint host mapping and shared architecture.
- [x] Record the separate manual Teams companion-package boundary from the Zava One Hub model.
- [x] User approved the plan and requested implementation.

### Identity freeze

- [x] Confirm the existing `PersonalLinksCopilotComponent` and `PersonalLinksTool` as final immutable
  Copilot identities.
- [x] Confirm `PersonalLinksWebPart` as the final generated web part identity.
- [x] Freeze the initial SharePoint-only web part supported hosts and `auto | compact | full` behavior.
- [x] Replace placeholder package, tool, agent, and localized descriptions with approved concise text.
- [x] Record all existing and newly generated GUID ownership; verify no identity is copied or renamed.

### Acceptance gate

- [x] Scope, golden-rule exceptions, visual contract, host matrix, data schema, and Graph permission are
  approved.
- [x] No unresolved naming or behavioral decision remains before scaffolding.

## Phase 1 - Permission and storage foundation

### Package permission

- [x] Add `Microsoft Graph / Files.ReadWrite.AppFolder` to `webApiPermissionRequests` in
  `config/package-solution.json`.
- [x] Validate package-solution schema and document tenant API permission approval.

### Models and service

- [x] Add canonical personal-link, document, snapshot, icon-key, and service-interface types.
- [x] Add deterministic normalization and validation for title, URL, description, icon, order, timestamps,
  and schema version.
- [x] Implement `GraphPersonalLinksService` with `MSGraphClientV3`, App Folder paths, abort handling, and
  explicit Graph error mapping.
- [x] Implement first-run missing-file behavior.
- [x] Implement atomic JSON save, eTag capture, `If-Match`, and HTTP 412 conflict mapping.
- [x] Add focused fakes at the Graph client boundary for tests.
- [x] Add tests for empty-file, valid/invalid schema, URL validation, normalization, eTag save, and
  conflict results.

### Acceptance gate

- [x] Focused storage tests pass: 9 model/Graph-service tests, plus 2 memory-service tests, in the latest
  11-test production gate.
- [x] A manual authenticated probe can create, reload, and update `personal-links-v1.json` without any
  broader file permission.
- [x] A stale eTag cannot overwrite a newer file; the focused Graph test verifies `If-Match` and maps
  HTTP 412 to an explicit conflict.

## Phase 2 - Shared Fluent foundation and representative visuals

### Baseline

- [x] Align the generated SPFx target profile with the golden React 18, Fluent UI v9, icons, and Griffel
  baseline; remove Fluent v8 only after confirming no imports remain.
- [x] Add one owner-document `RendererProvider`/`FluentProvider` boundary with light and dark themes.
- [x] Add a shared accessible error boundary with Retry and no raw error details.
- [x] Confirm one persistent React root per host adapter with deterministic unmount.

### Representative Compact experience

- [x] Build the Zava-inspired segmented accent strip and compact Personal Links brand identity without
  introducing the full navy bar into the inline-height budget.
- [x] Build the Compact header, link count, icon-forward list/grid, Add action, View all, loading, empty,
  stale, and error states.
- [x] Request a larger Copilot inline size before opening the Add/Edit dialog and restore the compact
  requested size when it closes.
- [x] Build one polished link tile with launch, selected, keyboard-focus, and hostname treatment.
- [ ] Validate the representative state at narrow/standard widths, light/dark themes, and 200% zoom.

### Representative Full experience

- [x] Build the full Personal Links product bar with shared brand palette, Link mark, product name,
  truthful OneDrive status, and signed-in user treatment.
- [x] Build the Full hero, all-links region, always-available responsive inspector, and command row.
- [x] Use component-width container queries so Full mode stacks correctly in narrower SharePoint
  canvases even when the browser viewport itself is wide.
- [ ] Prove useful expansion at desktop and keynote widths without duplicating the compact layout.
- [ ] Validate narrow/standard/desktop/keynote widths, light/dark themes, and 200% zoom.

### Acceptance gate

- [x] Save and inspect representative Compact and Full screenshots using the same seeded demonstration
  records, plus the Compact Add dialog and icon picker.
- [ ] Compare product-bar height, accent rhythm, brand alignment, status placement, and visual hierarchy
  side by side with the Zava One reference screenshot.
- [ ] Confirm the Full experience is visually useful on large canvases and the Compact experience remains
  focused on viewing.
- [ ] Confirm no generic KPI/dashboard composition, token violations, clipping, broken focus, or
  inaccessible icon-only actions.

## Phase 3 - Link management interactions

### Editor and icon picker

- [x] Implement one reusable controlled Link editor for Compact Dialog and Full inspector.
- [x] Implement visible field validation.
- [x] Implement the curated Fluent icon picker and stable key-to-icon registry.
- [x] Preserve draft values after validation or save failures.

### CRUD and ordering

- [x] Create links and place the saved result visibly.
- [x] Edit links using the same draft values shown and saved.
- [x] Delete links only after a named confirmation.
- [x] Search by title, hostname, and description with a truthful no-match state.
- [x] Implement accessible Move up/Move down ordering and persist normalized order.
- [x] Serialize saves, disable duplicate commands while pending, and announce results.
- [x] Handle eTag conflicts without discarding the current draft.

### Acceptance gate

- [ ] CRUD, search, validation, icon selection, ordering, failure, and conflict tests pass in both
  experience sizes.
- [ ] Every visible control has a tested effect.
- [ ] Keyboard-only and screen-reader labels cover all management actions.

## Phase 4 - Copilot component integration

### Host adapter

- [x] Replace starter demonstration data and actions with the shared Personal Links app.
- [x] Keep Compact for inline and Full for host-reported `fullscreen`.
- [x] Route link opening through `copilotBridge.openLinkAsync` with explicit rejection/error handling.
- [x] Request full screen only when advertised and never mirror display mode in state.
- [ ] Preserve supported transient selection/draft context during expansion and reset it on a fresh
  invocation signature.

### Copilot communication

- [x] Publish bounded, deduplicated model-context snapshots for initial load and material visible-state
  changes.
- [x] Ensure URLs, descriptions, hidden records, raw Graph data, and unconfirmed drafts are excluded.
- [x] Keep follow-up messages user-triggered only; remove starter-only bridge actions that do not serve
  the Personal Links experience.
- [x] Finalize tool schema and `Use when` / `Do not use` manifest description.

### Acceptance gate

- [ ] Inline load, Add, launch, View all, and full-screen continuation pass with a fake host adapter.
- [ ] Tenant Copilot host verifies App Folder access, link launch, model context, iframe styles, display
  mode, focus, and full-screen persistence.

## Phase 5 - SharePoint web part and full-page integration

### Supported scaffold

- [x] Generate `PersonalLinksWebPart` with the supported SharePoint Yeoman generator; do not hand-create,
  copy, or rename its scaffold.
- [x] Register only `SharePointWebPart` and `SharePointFullPage` supported hosts in the primary solution.
- [x] Verify the primary build does not generate or embed a Teams SPFx app package for the web part.
- [x] Add localized property pane choices for Auto, Compact, and Full.

### Host behavior

- [x] Implement deterministic `auto` host detection: SharePoint canvas -> Compact; SharePoint full page
  -> Full.
- [x] Allow explicit Compact or Full override on SharePoint pages.
- [x] Add a web-part-only demo mode backed by seeded in-memory data with no App Folder reads or writes.
- [x] Disclose demo mode persistently and reset its data when a new service instance is created.
- [x] Pass the same Graph service, theme boundary, and shared React app used by Copilot.
- [x] Respond to SharePoint theme changes without losing persisted edits.
- [x] Open validated links safely from the web part adapter.

### Acceptance gate

- [ ] Unit tests cover every host/mode combination and explicit override.
- [x] SharePoint workbench validates Compact, paging with seven persisted links, temporary demo mode,
  and author-selected Full. Full mode was also verified to stack without horizontal component overflow
  in a 732-pixel web-part canvas.
- [ ] SharePoint full-page app validates Full and useful wide-canvas composition.
- [ ] An edit from Copilot or either SharePoint presentation is visible after refresh in the other
  presentations for the same user.

## Phase 6 - Validation, accessibility, and resilience

### Automated validation

- [ ] Add focused model, normalization, Graph service, controller, CRUD, conflict, host-mode, React root,
  and model-context tests.
- [ ] Add a tenant-free visual harness for Compact/Full, all data states, host widths, and themes.
- [ ] Validate no runtime errors, horizontal overflow, broken icons, unlabeled controls, or unhandled
  promise rejections.
- [ ] Validate keyboard navigation, focus restoration, forced colors, reduced motion, and 200% zoom.
- [x] Run `heft test --clean` with zero warnings: 11 passed, 0 failed.

### Authenticated host validation

- [x] Approve `Files.ReadWrite.AppFolder` in the validation tenant; the authenticated SharePoint
  workbench loaded seven persisted App Folder links and exposed the Graph-resolved folder action.
- [ ] Verify OneDrive-not-provisioned, permission-pending, offline, stale eTag, and corrupted-file states.
- [x] Distinguish missing permission, unprovisioned OneDrive, and first-run missing-file errors in the
  service and provide exact tenant-admin approval guidance in the UX.
- [ ] Verify Copilot iframe styling/display mode/model context and SharePoint full-page theming.
- [ ] Verify App Folder persistence under the same signed-in user across Copilot, SharePoint web-part,
  and SharePoint full-page presentations.

### Acceptance gate

- [ ] Local evidence matrix is green and saved.
- [ ] Tenant-only checks are green or one precise external prerequisite remains documented.

## Phase 7 - Packaging and publication

### Package

- [x] Update package metadata, Copilot agent metadata, conversation starter, and generated manifests.
- [x] Validate component registrations, supported hosts, unique GUIDs, tool schema, and permission request.
- [x] Verify the primary package contains the expected Copilot agent output and no automatically generated
  Teams personal-app output for the web part.
- [x] Run the clean production build and package-solution command.
- [x] Audit the `.sppkg` for current hashed assets, generated agent/plugin metadata, bundle sizes, stale
  files, and duplicate assets.
- [x] Record the release baseline: one shared production application bundle (438,968 bytes raw), two
  JavaScript assets including localization (439,488 bytes raw total), one
  `ClientSideAssets/personal-links.zip`, zero `TeamsSPFxApp.zip` entries, and a version 1.0.0.3,
  158,579-byte SPPKG.
- [x] Commit the validated ready-to-deploy `.sppkg` according to repository policy.

### Documentation

- [x] Replace the scaffold README with finished PnP-style sample documentation.
- [x] Explain architecture, App Folder path, JSON schema, least-privilege permission, admin consent, and
  per-user behavior.
- [x] Document deployment/configuration for SharePoint, Copilot, and SharePoint full-page app.
- [x] Document that Teams requires a separately uploaded manual companion package and is not part of the
  default primary-solution output.
- [x] Add real Compact, Full, and editor screenshots from the authenticated SharePoint-hosted component
  and reference them from the README and sample gallery metadata.
- [ ] Add optional dark, narrow, and authenticated Copilot-host screenshots when those publication
  evidence gates are available.
- [x] Document test/build results, accessibility scope, tenant prerequisites, limitations, and recovery
  behavior.

### Acceptance gate

- [x] `npm run build`, package audit, and `git diff --check` pass.
- [x] Final package and documentation describe only validated behavior.
- [x] Temporary development/review servers are stopped.

## Deferred - intentionally out of scope

- Authenticated Teams validation of theming, sign-in, App Folder access, responsive behavior, and
  shared persistence remains a tenant gate. The isolated personal-app package, deterministic packaging
  check, Full-mode routing, and duplicate-header suppression are implemented.
- Link folders, tags, favorites, sharing, organizational links, and multi-user administration.
- Rich website previews, favicons fetched from external sites, and URL health/background checks.
- Drag-and-drop-only reordering.
- Import/export, browser bookmark synchronization, telemetry, and usage analytics.
- AI-generated link titles, descriptions, icons, or recommendations.
- Offline write queue or cross-device live push. Cross-host consistency is refresh/load based.
- SharePoint library App Folder storage or app-only background processing; this showcase is delegated
  per-user OneDrive storage.
- Schema migration UI beyond refusing unsupported future versions safely.

## Open decisions for review

1. Approve `PersonalLinksWebPart` as the generated web part name.
2. Approve `Auto` mode choosing Compact on normal SharePoint pages and Full in the SharePoint full-page
   host.
3. Approve one JSON file named `personal-links-v1.json` in the App Folder.
4. Approve HTTP and HTTPS links, with all other URL protocols rejected.
5. Approve accessible Move up/Move down ordering for the first version instead of drag and drop.
6. Approve the two documented golden-rule exceptions: generated web part and live Graph storage first.
7. Approved: Teams is a manually packaged companion under `teams-app/personalLinks/`, with no Teams
   web-part support or Teams ZIP emitted by the initial primary solution.
8. Approve the Zava One-inspired Personal Links branding: segmented accent strip, dark navy Full-mode
   product bar, Link mark, OneDrive status, and signed-in user identity.

## Reusable playbook

Implementation follows [agentic-creation-rules-golden.md](./agentic-creation-rules-golden.md) except for
the two explicit, product-driven exceptions recorded above. This `todo.md` controls product scope,
experience names, phase order, and acceptance gates for this sample.
