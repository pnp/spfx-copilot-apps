# Copilot Instructions

## Project Overview

SharePoint Framework (SPFx) **1.24 dev preview Copilot Component** built with TypeScript ~5.8 and the **Heft** build system (not Gulp). This is **not a classic web part** — it is a `CopilotComponent` surfaced in the Microsoft 365 Copilot UX through the new **SharePoint Copilot Apps** model. The component is exposed to Copilot as one or more **tools** that a **declarative agent** can call, and it renders its own UI inside the Copilot host (inline or fullscreen).

Key packages:

- `@microsoft/sp-copilot-component` — provides `BaseCopilotComponent`, the host context, and display-mode APIs.
- `zod` + `zod-to-json-schema` — define and emit the JSON schema for tool properties.

The UX is built with **React** + **Fluent UI** rendered into the component's DOM element, with **PnPjs v4** for data access and **@pnp/spfx-controls-react** for reusable UI. These are the chosen stack for this solution (being added as the UX is built out) — install them as needed rather than assuming they are already present.

This is **still not a web part**: there is **no property pane**. Do not assume web part patterns (`BaseClientSideWebPart`, `getPropertyPaneConfiguration`, `onThemeChanged`, `.module.scss` theme tokens) or `@pnp/spfx-property-controls` (property-pane fields have no place in a Copilot Component). Tool inputs are defined with Zod (see below), not a property pane.

## Build & Development Commands

```bash
# Install (first time or after dependency changes)
npm install

# Local development server (https://localhost:4321)
heft start --clean

# Production build + test + package (npm run build)
heft test --clean --production && heft package-solution --production

# Clean build artifacts
heft clean
```

Tests run as part of `heft test` (Jest). Lint via the flat ESLint config. Node.js >=22.14.0, <23.0.0 is required.

## Architecture

### Build System — Heft + Rig

Uses `@rushstack/heft` with `@microsoft/spfx-web-build-rig` and `@microsoft/spfx-heft-plugins` instead of Gulp. Tool configs (TypeScript, Sass, etc.) extend from the rig via `config/rig.json`, and `tsconfig.json` extends from the rig. Do not add `gulpfile.js` or gulp-based build steps. Copilot agent packaging is handled by the `copilotAgentPlugin` Heft plugin driven by `config/copilot-agent.json`.

### Copilot Component Structure

Each component lives under `src/copilotComponents/<componentName>/`:

- `<Name>CopilotComponent.ts` — Entry point extending `BaseCopilotComponent<TProperties>`. Implements `render()`, which mounts the React tree into `this.context.domElement`. Read host state (theme, display mode, dimensions) from `this.hostContext`; the base class re-renders automatically when host context changes. Unmount React in `onTeardown`.
- `<Name>CopilotComponent.manifest.json` — Component manifest. Declares `componentType: "CopilotComponent"`, `copilotType: "Ux"`, `capabilities.availableDisplayModes`, and the `tools` array (each tool has a `name`, localized `description`, and a `propertiesSchema` pointing at the compiled properties module).
- `<Name>CopilotComponentProperties.ts` — Defines the tool input schema with **Zod** and exports the JSON schema via `zod-to-json-schema` as the default export. Also exports the inferred TypeScript type (`I<Name>CopilotComponentProperties`) used by the component. The manifest references the compiled `lib/.../<Name>CopilotComponentProperties.js` default export.
- `components/` — React views (`.tsx`). A single root component (e.g. `<Name>App`) is the render entry point; it selects a **display-mode-specific view** and never holds mirrored host state (see [Rendering with React](#rendering-with-react)).


Properties pattern:

```typescript
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  message: z.string().describe('A message to display.')
});

export type IMyDayCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
```

Use `.describe()` on every Zod field — those descriptions become part of the schema Copilot uses to decide how to populate tool inputs.

### Display Modes

The Copilot host owns layout. Read `this.hostContext.displayMode` (`'inline'` | `'fullscreen'`) on every render; never mirror it into local state. Transitions are asymmetric:

- **Inline → fullscreen:** call `await this.requestDisplayModeAsync('fullscreen')` (the only value the method accepts).
- **Fullscreen → inline:** host-only; the user collapses via the host affordance and your component learns via `onHostContextChanged`.
- Never request a mode not listed in `this.hostContext.availableDisplayModes`.

See [displayMode.md](../displayMode.md) for the full developer guide and worked example.

### Rendering with React

UX is built with **React 17** (functional components) — pinned to React 17 to align with the SPFx 1.24 dev preview. Do not use React 18+ APIs (`createRoot`, concurrent features); use `ReactDOM.render` / `ReactDOM.unmountComponentAtNode`. The rig's `tsconfig` uses the classic JSX transform (`jsx: "react"`), so import React as `import * as React from 'react'`.

Render the React tree into the host-provided DOM element from `render()`, and pass host state (theme, display mode) down as props rather than reading it from inside components:

```typescript
protected render(): void {
  if (!this.context?.domElement) return;

  ReactDOM.render(
    React.createElement(MyDayApp, {
      message: this.properties.message,
      theme: this.hostContext.theme,
      displayMode: this.hostContext.displayMode,
      availableDisplayModes: this.hostContext.availableDisplayModes,
      onRequestFullscreen: this._handleRequestFullscreen
    }),
    this.context.domElement
  );
}
```

- Treat `render()` as idempotent — the base class re-renders on every host-context change, so derive UI from `this.hostContext` + `this.properties`, never from local mirrored state.
- Pass `requestDisplayModeAsync` results and host context down through props; do not optimistically mutate UI state on a fullscreen request.

**Split inline vs. fullscreen views.** The root component (`MyDayApp`) is a thin selector that switches on `displayMode` and renders a dedicated view per mode — keep the two experiences in separate components rather than branching with conditionals inside one view:

- `components/<Name>App.tsx` — root selector; chooses the view from `displayMode` (defaults to the inline view for any non-fullscreen value).
- `components/<Name>Inline.tsx` — the `'inline'` display-mode view. Receives `onRequestFullscreen` to trigger expansion.
- `components/<Name>Fullscreen.tsx` — the `'fullscreen'` display-mode view (no expand affordance; the host owns collapse).

```tsx
const MyDayApp: React.FunctionComponent<IMyDayAppProps> = (props) => {
  const { message, theme, displayMode, onRequestFullscreen } = props;

  if (displayMode === 'fullscreen') {
    return <MyDayFullscreen message={message} theme={theme} />;
  }

  return <MyDayInline message={message} theme={theme} onRequestFullscreen={onRequestFullscreen} />;
};
```

See [displayMode.md](../displayMode.md) for the full developer guide and worked example.


### Copilot Agent & Manifest Files (`copilot/`)

These declare how the component is published as a Microsoft 365 declarative agent:

- `manifest.json` — Teams/M365 app manifest (`manifestVersion` 1.24). Links the declarative agent via `copilotAgents.declarativeAgents`.
- `declarativeAgent.json` — Declarative agent definition: name, description, `instructions` (loaded from `instruction.txt` via `$[file(...)]`), `conversation_starters`, and `actions` (referencing `ai-plugin.json`).
- `ai-plugin.json` — API plugin / action manifest (`namespace`, `name_for_human`, `description_for_model`, etc.).
- `instruction.txt` — System instructions defining the agent persona/behavior.

### Configuration Files (`config/`)

- `copilot-agent.json` — Maps each declarative agent to its component IDs (the GUID from the component manifest). Update the `components` array when adding components to an agent.
- `package-solution.json` — Solution packaging, feature definitions, and `.sppkg` output path.
- `config.json` — Bundle entry points (e.g., `my-day-copilot-component`) and localized resource mappings.
- `serve.json` — Dev server port (4321) and initial workbench page.
- `rig.json`, `sass.json`, `typescript.json` — Extend from the rig package. `typescript.json` also lists `staticAssetsToCopy` for static assets and `loc/*.js`.

## SharePoint & Graph Data Access — PnPjs v4

Use **PnPjs v4** (`@pnp/sp`, `@pnp/graph`, `@pnp/logging`) for all SharePoint Online and Microsoft Graph operations. Do not use raw REST calls or the legacy `@microsoft/sp-http` client when PnPjs covers the scenario.

```bash
npm install @pnp/sp @pnp/logging --save
# Add @pnp/graph only if Microsoft Graph access is needed
npm install @pnp/graph --save
```

Initialize a singleton `SPFI` from the **Copilot component's context** (not a `WebPartContext`) in a shared helper, and reuse it everywhere:

```typescript
import { spfi, SPFI, SPFx } from "@pnp/sp";
import { LogLevel, PnPLogging } from "@pnp/logging";

let _sp: SPFI | undefined;

export const getSP = (context?: unknown): SPFI => {
  if (!_sp && context) {
    _sp = spfi().using(SPFx(context as never)).using(PnPLogging(LogLevel.Warning));
  }
  return _sp!;
};
```

Initialize once from the component (e.g., in `onInit`/first `render()` with `getSP(this.context)`), then call `getSP()` (no args) from any component or service. Confirm the exact context shape the `SPFx` behavior expects against `@microsoft/sp-copilot-component`, since this differs from the classic web part context.

### Key Rules

- **Selective imports** — Import only the sub-modules you need (e.g., `import "@pnp/sp/webs"`, `import "@pnp/sp/lists"`, `import "@pnp/sp/items"`) for tree-shaking.
- **No duplicate initialization** — Always use the singleton above; do not call `spfi().using(SPFx(...))` in multiple places.
- **Use `select()`** — Always specify the fields you need (e.g., `.items.select("Id", "Title")()`) rather than fetching all columns.

## UI Controls — PnP React Controls

Prefer **@pnp/spfx-controls-react** for in-component UI over building custom equivalents. These controls are accessible, SPFx-aware, and integrate with Fluent UI theming. If a matching control is not available, use other suitable controls; suggest and confirm where needed.

> Do **not** use `@pnp/spfx-property-controls` — those are property-pane fields, and a Copilot Component has no property pane.

```bash
npm install @pnp/spfx-controls-react --save --save-exact
```

Import each control from its specific path (deep imports only, for tree-shaking):

```typescript
import { ListView } from "@pnp/spfx-controls-react/lib/ListView";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Placeholder } from "@pnp/spfx-controls-react/lib/Placeholder";
```

Common controls: `ListView`, `PeoplePicker`, `TaxonomyPicker`, `ListPicker`, `FilePicker`, `Placeholder`, `Pagination`, `ChartControl`. Check the [controls catalog](https://pnp.github.io/sp-dev-fx-controls-react/) before building custom UI for common SharePoint patterns.

### Key Rules

- **Deep imports only** — Always import from the specific control path (e.g., `@pnp/spfx-controls-react/lib/ListView`), never the package root.
- **Pass `context`** — Many controls need an SPFx context. Pass the Copilot component's context down through props.
- **Check the catalog first** — Before implementing a custom picker, list view, or file browser, see if a PnP control already exists.

## Conventions

- **React + Fluent UI for UX** — Build UX with **React 17** functional components (no React 18 APIs). Render the React tree into `this.context.domElement` (see [Rendering with React](#rendering-with-react)). Split the inline and fullscreen experiences into separate views selected by a thin root component; derive UI from `this.hostContext` + `this.properties` and do not mirror host state locally.
- **Tool property schemas via Zod** — Define inputs in `<Name>CopilotComponentProperties.ts` using Zod with descriptive `.describe()` text; emit JSON schema through `zod-to-json-schema`. Keep the inferred type as the component's properties type. (Tool inputs replace the web part property pane.)
- **IDs are wired across files** — A component's manifest GUID appears in `config/copilot-agent.json`; bundle entries live in `config/config.json`. Keep these in sync when adding or renaming components and tools.
- **Localization** — User-facing strings (tool descriptions, agent text) belong in their respective manifests / `loc/` resources, not hardcoded inline where a localized field exists.
- **Static assets** — Copied via `staticAssetsToCopy` in `config/typescript.json`.
- **ESLint** — Flat config (`eslint.config.js`) using `@microsoft/eslint-config-spfx`.
- **Node version** — Requires Node.js >=22.14.0, <23.0.0.

## Adding New Components

Prefer the SPFx Yeoman generator (run from the solution root) so manifests, `config/config.json` bundle entries, and agent wiring are created correctly rather than hand-authoring files. After generating a Copilot component, register its component GUID in the appropriate agent's `components` array in `config/copilot-agent.json`. Run `npm install` if the generator was run with `--skip-install`.
