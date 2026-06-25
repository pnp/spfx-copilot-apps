# Copilot Instructions

## Project Overview

SharePoint Framework (SPFx) 1.23.0 web part built with React 17, TypeScript ~5.8, and Fluent UI React v8. Uses the **Heft** build system (not Gulp). The web part runs in SharePoint, Microsoft Teams (personal app and tab), and SharePoint full page.

## Build & Development Commands

```bash
# Install (first time or after dependency changes)
npm install

# Local development server (https://localhost:4321)
heft start --clean

# Production build + test + package
heft test --clean --production && heft package-solution --production

# Clean build artifacts
heft clean

# Lint
npx eslint src/
```

There is no separate test runner command — tests run as part of `heft test`. The test framework is Jest (via `@types/heft-jest`).

## Architecture

### Build System — Heft + Rig

This project uses `@rushstack/heft` with `@microsoft/spfx-web-build-rig` instead of Gulp. All tool configurations (TypeScript, Sass, etc.) extend from the rig package via `config/rig.json`. The `tsconfig.json` also extends from the rig. Do not add `gulpfile.js` or gulp-based build steps.

### Web Part Structure

Each web part lives under `src/webparts/<webPartName>/` with this layout:

- `<Name>WebPart.ts` — SPFx entry point extending `BaseClientSideWebPart`. Handles lifecycle, property pane config, theming, and renders the root React component via `React.createElement` + `ReactDom.render`.
- `<Name>WebPart.manifest.json` — Declares component ID, supported hosts, and preconfigured property pane entries.
- `components/` — React components (class-based, extending `React.Component`).
- `components/<Name>.module.scss` — CSS Modules scoped to each component. Supports SPFx theme tokens (e.g., `"[theme:bodyText, default: #323130]"`) and CSS custom properties.
- `loc/` — Localization strings. `en-us.js` uses AMD `define()` syntax. `mystrings.d.ts` provides TypeScript typings. Import via `import * as strings from '<WebPartName>WebPartStrings'`.

### Configuration Files

- `config/package-solution.json` — Solution packaging, feature definitions, and `.sppkg` output path.
- `config/config.json` — Bundle entry points and localized resource mappings.
- `config/serve.json` — Dev server port (4321) and initial page URL.
- `config/sass.json` / `config/typescript.json` — Extend from the rig package.

## SharePoint Operations — PnPjs

Use **PnPjs v4** (`@pnp/sp`, `@pnp/graph`, `@pnp/logging`) for all SharePoint Online and Microsoft Graph operations. Do not use raw REST calls or the legacy `@microsoft/sp-http` client when PnPjs covers the scenario.

### Installation

```bash
npm install @pnp/sp @pnp/logging --save
# Add @pnp/graph only if Microsoft Graph access is needed
npm install @pnp/graph --save
```

### Initialization Pattern

Create a shared `pnpjsConfig.ts` in the web part folder with a singleton `SPFI` instance:

```typescript
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFI, SPFx } from "@pnp/sp";
import { LogLevel, PnPLogging } from "@pnp/logging";

let _sp: SPFI | null = null;

export const getSP = (context?: WebPartContext): SPFI => {
  if (_sp === null && context != null) {
    _sp = spfi().using(SPFx(context)).using(PnPLogging(LogLevel.Warning));
  }
  return _sp!;
};
```

Initialize once in the web part's `onInit`:

```typescript
import { getSP } from './pnpjsConfig';

protected async onInit(): Promise<void> {
  await super.onInit();
  getSP(this.context);
}
```

Then call `getSP()` (no args) from any component or service to get the configured instance.

### Key Rules

- **Selective imports** — Import only the sub-modules you need (e.g., `import "@pnp/sp/webs"`, `import "@pnp/sp/lists"`, `import "@pnp/sp/items"`) to keep bundle size small via tree-shaking.
- **No duplicate initialization** — Always use the singleton pattern above. Do not call `spfi().using(SPFx(...))` in multiple places.
- **Use `select()`** — Always specify the fields you need (e.g., `.items.select("Id", "Title")()`) rather than fetching all columns.

## UI Controls — PnP Reusable Controls

Prefer **@pnp/spfx-controls-react** for in-component UI and **@pnp/spfx-property-controls** for property pane fields over building custom equivalents. These libraries provide battle-tested, accessible, SPFx-aware controls that integrate with Fluent UI theming.

### Installation

```bash
npm install @pnp/spfx-controls-react --save --save-exact
npm install @pnp/spfx-property-controls --save --save-exact
```

### React Controls (`@pnp/spfx-controls-react`)

Use these inside component `render()` methods. Import each control from its specific path:

```typescript
import { ListView } from "@pnp/spfx-controls-react/lib/ListView";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Placeholder } from "@pnp/spfx-controls-react/lib/Placeholder";
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
```

Common controls: `ListView`, `PeoplePicker`, `TaxonomyPicker`, `ListPicker`, `FilePicker`, `Placeholder`, `WebPartTitle`, `Pagination`, `ChartControl`. Check the [controls catalog](https://pnp.github.io/sp-dev-fx-controls-react/) before building custom UI for common SharePoint patterns.

### Property Pane Controls (`@pnp/spfx-property-controls`)

Use these in the web part's `getPropertyPaneConfiguration()` method. Import from specific paths:

```typescript
import { PropertyFieldListPicker } from "@pnp/spfx-property-controls/lib/PropertyFieldListPicker";
import { PropertyFieldPeoplePicker } from "@pnp/spfx-property-controls/lib/PropertyFieldPeoplePicker";
import { PropertyFieldColorPicker } from "@pnp/spfx-property-controls/lib/PropertyFieldColorPicker";
```

Common controls: `PropertyFieldListPicker`, `PropertyFieldPeoplePicker`, `PropertyFieldColorPicker`, `PropertyFieldDateTimePicker`, `PropertyFieldNumber`, `PropertyFieldCollectionData`, `PropertyFieldSitePicker`. These replace boilerplate custom property pane fields.

### Key Rules

- **Deep imports only** — Always import from the specific control path (e.g., `@pnp/spfx-controls-react/lib/ListView`), never from the package root, to enable tree-shaking.
- **Pass `context`** — Many controls require the SPFx `WebPartContext`. Pass it down from the web part class through component props.
- **Check the catalog first** — Before implementing a custom picker, list view, or file browser, check if a PnP control already exists for that scenario.

## Adding New SPFx Components

**Never add new web parts, extensions, or other SPFx components to this solution by manually creating files.** Always use the SPFx Yeoman generator in command-based (non-interactive) mode from the solution root so that manifests, config entries, and bundle registrations are created correctly.

```bash
# Example: add a new web part
yo @microsoft/sharepoint --component-type webpart --component-name "MyNewWebPart" --framework react --skip-install
```

Run `npm install` after the generator completes if `--skip-install` was used. The generator updates `config/config.json`, creates the manifest, scaffolds the component folder, and registers localized resources — skipping it risks broken builds or missing registrations.

## Conventions

- **React class components** — This project uses `React.Component` class syntax, not functional components or hooks.
- **Props interfaces** — Defined in separate `I<Name>Props.ts` files prefixed with `I`.
- **Localization** — All user-facing strings go through the `loc/` system, not hardcoded. Add new strings to both `en-us.js` and `mystrings.d.ts`.
- **Theming** — Components receive theme via `onThemeChanged` in the web part class, which sets CSS custom properties on `this.domElement`. SCSS uses both SPFx theme token syntax and `var(--propertyName)` fallbacks.
- **Static assets** — Images (`.png`, `.jpg`, `.svg`, etc.) are copied via the `staticAssetsToCopy` config in `config/typescript.json`. Place assets under `src/webparts/<name>/assets/`.
- **ESLint** — Flat config (`eslint.config.js`) using `@microsoft/eslint-config-spfx` React profile.
- **Node version** — Requires Node.js >=22.14.0, <23.0.0.
