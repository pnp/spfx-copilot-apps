# Agentic Creation Rules - SharePoint Copilot Apps scenario samples

> **Purpose.** This file is the **authoritative playbook** for building the next batch of
> "wow" scenario samples for **SharePoint Copilot Apps** with the same architecture, quality,
> and behavior proven by the **My Day** sample. It is written for a **coding agent**: rules are
> imperative and testable. Follow them to (1) generate a phased `todo.md` from a provided UX
> design, then (2) implement the sample against that `todo.md`.
>
> **Prime directive:** every sample must be a **self-contained, offline, mock-data showcase** that
> deploys from a committed `.sppkg` in minutes, looks premium, and is structured so the mock can
> later be swapped for **live Microsoft Graph / SharePoint** data with no UI changes.

---

## 0. Operating model & how to use this file

### 0.1 The proven model - human scaffolds, agent implements

The starting point is **created by the user, not the agent**. This keeps naming, component count, and
intent under human control and grounded in real input. Do **not** scaffold the project or invent the
solution name/structure from the agent side.

**Human (before agentic coding starts):**

1. **Scaffold the SPFx structure with the Yeoman generator** - run the SPFx generator to create the
   solution and **one or more Copilot Components**. The user decides **how many** Copilot Components the
   solution has and **their names** (each is a tool the declarative agent can call). Example:

   ```bash
   npm install -g yo @microsoft/generator-sharepoint
   yo @microsoft/sharepoint      # choose "Copilot Component"; repeat / re-run to add more components
   npm install                    # if scaffolded with --skip-install
   ```

2. **Add the UX design(s)** to the repo (mockups/wireframes under `assets/`, e.g. `assets/*.png`) and
   **write the README objectives** - the summary, the experiences (how many inline / full-screen), the
   signature feature, and the data story. This README-as-brief is the **input** the agent builds from.
3. **Make these rules available to the agent** - reference `agentic-creation-rules.md` one of these ways
   so the agent actually follows it:
   - as a **skill** the agent can load (e.g. a `SKILL.md` that points at / embeds these rules), or
   - as an **agent configuration file** (e.g. `AGENTS.md` / `.github/copilot-instructions.md` / a custom
     `*.agent.md`) that includes or links this file, or
   - **referenced directly in the prompt** ("follow `agentic-creation-rules.md`") when kicking off work.

   Keep a copy of this file in the new sample's root so it travels with the solution.
4. **Ask the agent to "do the initial configuration"** - the trigger for the agent to add the baseline
   React + Fluent packages (§0.2). The human does **not** install these by hand.

**Agent (this file):**

1. **On the human's "initial configuration" request, install the baseline packages** (§0.2) that enable
   the React + Fluent UX on the scaffolded solution, then confirm the solution still builds
   (`heft test --clean`). Do this **before** Phase 1.
2. **Read the README objectives + the UX design.** Identify how many **inline** and **full-screen**
   experiences are needed. A solution MAY contain **multiple inline and/or multiple full-screen
   experiences** (multiple Copilot Components / tools) - mirror what the user scaffolded.
3. **Generate `todo.md` first** (see §2) from the README + UX. This becomes the user's primary task
   tracker - they review and steer from it. Do **not** start coding until the phased `todo.md` exists.
4. **Implement phase by phase** (see §3), updating `todo.md` as you go (§2.3).
5. **Never deviate** from the Golden Rules (§1) without explicit user approval; never re-scaffold or
   rename the user's components.

### 0.2 Baseline npm installs - **agent-run** on the "initial configuration" request

The generator scaffolds the Copilot Component with `@microsoft/sp-copilot-component`, `zod`, and
`zod-to-json-schema`. When the human asks the agent to do the initial configuration, the **agent adds**
the baseline packages that enable the **React 17 + Fluent UI v9** UX (pin to React 17 - do **not** take
React 18), then verifies the build:

```bash
# React 17 runtime + types (UX rendering)
npm install react@17.0.1 react-dom@17.0.1 --save
npm install @types/react@17.0.45 @types/react-dom@17.0.17 --save-dev

# Fluent UI v9 (components + icons) - the required UI stack (G4)
npm install @fluentui/react-components@9.54.0 @fluentui/react-icons@2.0.270 --save
```

Add **only when a scenario needs them** (not baseline):

```bash
# PnP React controls - deep imports only; use when they add value (§16)
npm install @pnp/spfx-controls-react --save --save-exact

# PnPjs v4 - only in the live-data (deferred) phase (§16)
npm install @pnp/sp @pnp/graph @pnp/logging --save
```

> Keep versions aligned across samples for consistency (React 17.0.1, Fluent `@fluentui/react-components`
> 9.x, `@fluentui/react-icons` 2.x). Confirm the exact `@microsoft/sp-copilot-component` /
> `@microsoft/spfx-*` dev-preview versions from what the generator produced for the target SPFx build.

---

## 1. Golden rules (non-negotiable)

- **G1 - Copilot Component, not a web part.** No `BaseClientSideWebPart`, **no property pane**, no
  `getPropertyPaneConfiguration`, no `.module.scss` theme tokens, no `@pnp/spfx-property-controls`.
- **G2 - Heft, not Gulp.** Configs extend the rig. Never add `gulpfile.js`.
- **G3 - React 17 only.** Functional components. `import * as React from 'react'`. Classic JSX
  (`jsx: "react"`). Use `ReactDOM.render` / `ReactDOM.unmountComponentAtNode`. **No** `createRoot`,
  no concurrent APIs, no React 18+ features.
- **G4 - Fluent UI v9 always** (`@fluentui/react-components`, `@fluentui/react-icons`). **Tokens only**
  - never hard-code colors. Style with `makeStyles`. (See §8, §17 for Griffel/lint gotchas.)
- **G5 - Mock data first, Graph-shaped.** All data flows through an `I<Name>DataService` interface with
  a **Mock implementation** shipped. Mock objects mirror **Microsoft Graph** response shapes so a live
  service is a drop-in (§9).
- **G6 - Fully offline.** **No external references at runtime** - bundle all imagery as base64 (§10).
  All deep-links/actions are **no-op** until a live phase.
- **G7 - Derive UI from props.** Read host state (`theme`, `displayMode`, dimensions) from
  `hostContext`; **never mirror host state in component state**. `render()` is idempotent.
- **G8 - Ship a committed `.sppkg`.** For mock-data samples, commit the built package so anyone can
  deploy without building (§17.4).
- **G9 - Accessibility & reduced-motion are requirements, not extras** (§14, §15).
- **G10 - Keep `todo.md` current** with the ▢ / 🔶 / ✅ legend (§2).
- **G11 - The human scaffolds; the agent implements.** The SPFx solution, the **number/names of Copilot
  Components**, the UX designs, and the README objectives are provided by the user; the **agent** adds
  the baseline React + Fluent packages on the human's "initial configuration" request (§0.1–§0.2).
  Never scaffold, rename, or restructure the user's components; build **from** their brief.

---

## 2. Step 1 - Generate `todo.md` (the tracking mechanism)

### 2.1 What `todo.md` is

The **single source of truth** for the build, mapped to the README commitments. The user evaluates
scope and progress from it. Generate it **before** coding, from the provided UX design.

### 2.2 Required structure

- **Title + intro** linking to `README.md`.
- **Status legend (exact):** `> Status legend: ▢ not started · 🔶 in progress · ✅ done`
- **Progress (latest)** blockquote - a living 1-paragraph summary; keep it updated.
- **Approach & sequencing** - the phase order (§3).
- **One `## Phase N` section per phase**, each broken into `###` subsections with checkbox items
  using **`- ▢` / `- 🔶` / `- ✅`** (never GitHub `- [ ]` / `- [x]`).
- **Deferred - Dynamic data / API integration** section (live Graph/PnPjs/tool schema/provisioning).
- **Docs & cleanup** section.
- **Reusable playbook** pointer back to this rules file.
- **Open decisions** list.

### 2.3 Maintenance rules

- Mark items **✅ immediately** when done; set **🔶** when in progress (max sense per subsection).
- When a decision changes an earlier item, **strike-through and annotate** rather than deleting
  history (e.g. `~~inert~~ **now live (Phase 5)**`).
- Keep the **Progress (latest)** blockquote accurate; refresh it at the end of each phase.
- Do **not** create separate markdown status/among files - track in `todo.md`.

---

## 3. Phasing (the proven process)

Build **UX-first against mock data**; defer all API work. Reproduce these phases (rename/scope to the
scenario; some are optional):

0. **Phase 0 - Scaffold & brief (human, pre-agent).** User scaffolds the SPFx solution + Copilot
   Component(s) with the Yeoman generator, adds the UX design(s) under `assets/`, and writes the
   **README objectives**, then asks the agent to do the initial configuration. The **agent** adds the
   **baseline npm installs** (§0.2) and confirms the build before Phase 1.
1. **Phase 1 - Mock data structure.** Graph-shaped mock modules + view models + mapper + relative-time
   resolution + `MockDataService`. (§9)
2. **Phase 2 - Inline experience.** React components for each inline view; responsive; theming. (§6–§8)
3. **Phase 3 - Full-screen experience.** Dashboard shell + hero + panels + the **signature hero
   feature**. (§6, §11)
4. **Phase 4 - Shared UI building blocks & theming.** Extract/reuse controls across views; confirm
   theming. Inline drill-downs SHOULD reuse full-screen controls where sensible.
5. **Phase 5 - Configuration impact (optional but high-value).** Session-persisted settings that
   actually reshape the UX. (§12)
6. **Phase 6 - Showcase polish.** Motion/first impression; make the hero feature the "wow" moment;
   narrative coherence of the mock; visual finish; demo enablement (60-second script); demo
   reliability. (§11–§15)
7. **Deferred - Dynamic data / API integration.** `I<Name>DataService` live impl (PnPjs v4 / Graph),
   real signature-feature backend, tool-input rework, provisioning. (§16)
8. **Docs & cleanup.** README from PnP template, `assets/sample.json`, real screenshots, commit
   `.sppkg`. (§18)

**Definition of done per phase:** `heft test --clean` passes with **zero lint warnings/errors**, and
the relevant `todo.md` items are ✅.

---

## 4. Architecture & entry points

Each Copilot Component lives under `src/copilotComponents/<name>/`:

- `` `<Name>CopilotComponent.ts` `` - extends `BaseCopilotComponent<TProperties>`. `render()` mounts the
  React tree into `this.context.domElement`; `onTeardown` unmounts. Pass host state + resolved user
  down as props:

  ```ts
  protected render(): void {
    const element = React.createElement(<Name>App, {
      /* tool inputs */ ...this.properties,
      currentUser: resolveCurrentUser(this.context),
      theme: this.hostContext.theme,
      displayMode: this.hostContext.displayMode,
      availableDisplayModes: this.hostContext.availableDisplayModes,
      onRequestFullscreen: this._handleRequestFullscreen
    });
    ReactDOM.render(element, this.context.domElement);
  }
  protected onTeardown(reason?: string): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.context.domElement);
    return super.onTeardown(reason);
  }
  ```

- `` `<Name>CopilotComponent.manifest.json` `` - `componentType: "CopilotComponent"`, `copilotType: "Ux"`,
  `capabilities.availableDisplayModes`, and the `tools` array (name, localized description,
  `propertiesSchema` → compiled properties module).
- `` `<Name>CopilotComponentProperties.ts` `` - Zod schema with `.describe()` on **every** field; export
  the inferred type and `export default zodToJsonSchema(schema)`.
- `components/` - React views (§6).

**Multiple experiences:** for multiple inline/full-screen experiences, create **multiple components**
(each its own tool + manifest GUID) and/or multiple view components behind one root selector. Register
each component GUID in `config/copilot-agent.json` and bundle entries in `config/config.json`.

---

## 5. Tool input schema (Zod)

```ts
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
const schema = z.object({ message: z.string().describe('...') });
export type I<Name>Props = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
```

- Every field MUST have `.describe()` - the text drives how Copilot populates the tool.
- Keep a minimal placeholder input if the scenario has no real input yet; rework in a live phase.

---

## 6. Component & view structure

- **Root selector** (`<Name>App.tsx`) - thin; picks the view from `displayMode`
  (`'fullscreen'` → full-screen view; anything else → inline). Wraps children in the theme provider.
- **Per-mode views** - separate components per experience: `<Name>Inline.tsx`, `<Name>Fullscreen.tsx`
  (and more if the scenario has multiple). Never branch inline vs. full-screen with conditionals inside
  one view.
- **Building blocks** - `components/inline/`, `components/fullscreen/`. **Reuse** full-screen controls in
  inline drill-downs where it makes sense (My Day reuses `AgendaTimeline` + `TasksPanel` in inline;
  keeps a separate inline list only where the compact UX differs).
- **Drill-down navigation** - inline owns local `view` state via `useState`; provide a back affordance
  (a shared `InlineDetailHeader` with an optional title so reused cards don't double their title).

---

## 7. Display-mode mechanism (inline ↔ full-screen)

- Read `hostContext.displayMode` on every render. **Never** mirror it in state.
- **Inline → full-screen:** `await this.requestDisplayModeAsync('fullscreen')` (only value accepted).
  Surface an expand affordance in the inline hero.
- **Full-screen → inline:** host-only; you learn via `onHostContextChanged` re-render.
- Never request a mode not in `hostContext.availableDisplayModes`.
- Pass `onRequestFullscreen` down through props; do not optimistically mutate UI on request.

---

## 8. Theming (Fluent v9)

- **Single provider.** A `<Name>ThemeProvider` wraps the tree once; derive the Fluent theme from the
  `theme` prop (`'dark'` → `webDarkTheme`, else `webLightTheme`; default light when undefined).
- **Iframe style-insertion workaround + flicker-free theme flips.** Remount the `FluentProvider`
  **exactly once** after the first commit via a `key` that changes 0→1 in a `useEffect([])`. Keep the
  key **stable thereafter**, so a mid-demo theme flip only swaps tokens (no remount, no flicker,
  in-flight state preserved):

  ```tsx
  const [gen, setGen] = React.useState(0);
  React.useEffect(() => setGen(1), []);
  const theme = props.theme === 'dark' ? webDarkTheme : webLightTheme;
  return <FluentProvider key={gen} theme={theme} className={styles.provider}>{children}</FluentProvider>;
  ```

- **Tokens only.** No hex/rgb for text. On brand surfaces use `colorNeutralForegroundOnBrand`.

---

## 9. Data (Graph-shaped mock → view models)

### 9.1 Modules & shapes

- `mockData/*.ts` - one **typed `const` array per source**, shaped like the Graph response
  (`event`, `todoTask`, `message`, `sitePage`, `user`, …). Bundled TS imported directly - **no fetch,
  no static-asset copy**. Add a `mockData/index.ts` barrel.
- `models/graph.ts` - the Graph-shaped raw types. `models/seeds.ts` - seed types with **relative
  offsets** (see 9.3). `models/<name>.ts` - lean **view models** the components consume.
- `services/mappers.ts` - pure `graph → view model` projection (flatten `start.dateTime`,
  `status === 'completed' → completed`, `from.emailAddress.name → from`, `thumbnailWebUrl → imageUrl`,
  …). **Reused later** by the live service.
- `services/I<Name>DataService.ts` + `Mock<Name>DataService.ts` - the interface + mock impl that
  imports the mock arrays, calls `resolveMockData(now)`, runs the mapper, returns a single view-model
  aggregate.

### 9.2 Personas & the real signed-in user

- Use the **standard Microsoft 365 demo personas** (Megan Bowen, Diego Siciliani, Lee Gu, …) for all
  senders/authors/organizers - consistent Contoso names/emails via a shared `mockData/people.ts`.
- Resolve the **real signed-in user** synchronously from the page context (name + photo via
  `userphoto.aspx` - no Graph call, no loading state); prefer it over the mock user, keep mock as
  fallback. See `services/CurrentUserService.ts`.

### 9.3 Time resolution - always "today", forward-biased

- Author entities with **relative offsets from `now`** (e.g. `startOffsetMin`, `dueOffsetMin`,
  `receivedOffsetMin`), never absolute dates.
- `services/resolveMockData(now = new Date())` computes Graph-shaped absolute `dateTime` values so the
  raw objects still match the Graph shape post-resolution.
- Bias: meetings ahead of now; some past to prove "next" filtering; mail/news in the recent past so
  "1h ago" reads naturally. **Resolve on every render** (`now` memoized per mount).
- **Never** hard-code a clock time in copy (e.g. "before the 2:30 sync") - it drifts.

### 9.4 Narrative coherence (storytelling)

- Curate meetings + tasks + mail + news into **one connected story** so any AI/summary feature reads as
  insightful, not random (My Day themes the day around shipping the app: design-review meeting ↔
  related task ↔ flagged mail ↔ news post).

---

## 10. Imagery & offline (zero external references)

- **Bundle all imagery as base64 data URIs.** No `picsum.photos`, no CDN, no `userphoto` at runtime for
  mock personas.
- **Faces:** put source `assets/faces/*.jpeg` and generate `mockData/faces.ts` (base64 map). Provide a
  Fluent `Avatar` **initials fallback**.
- **Thumbnails / photos:** download **royalty-free** images **once at authoring time** (e.g. Lorem
  Picsum / Unsplash license), embed as base64 into a generated `mockData/<x>Images.ts`, and reference by
  key. Provide a **gradient/icon fallback** on image error. Keep keys valid identifiers (dot-notation
  lint).
- Document the source/license in the generated file header. Accept the bundle-size cost (~a few hundred
  KB) as the price of a demo-proof, offline sample.

---

## 11. Signature "hero" feature (the wow moment)

- Every sample SHOULD have **one signature feature** generated **deterministically from the mock**
  (My Day: `planMyDay(data, now): IFocusPlan`). No real AI/API in the mock phase.
- **Sell the AI feel:** brief "thinking" state → **staged/streamed reveal** (mount items one-by-one,
  each animating in) → **personalized headline** (real user name + time of day) → tasteful **shimmer**
  accent while generating. Read-only (no chat). Include a disclaimer line.
- **Reduced-motion:** detect `matchMedia('(prefers-reduced-motion: reduce)')` and reveal everything at
  once, no streaming/animation.
- The live version later replaces only the generator, returning the **same view-model shape** so the UI
  is unchanged.

---

## 12. Configuration impact - session-persisted settings (optional)

- A settings drawer whose values persist to **`sessionStorage`** (intentionally session-scoped for the
  demo; call out "stored in this session only, not saved permanently").
- Provide a `utils/settings.ts` with a typed settings interface, `load`/`save` (guarded for sandboxed
  hosts), and a `use<Name>Settings()` hook that reads once and writes on change.
- Make settings **actually reshape the UX**: e.g. a live unit toggle updates a card immediately; a
  **visible-panels** set drives a **dynamic, re-flowing layout** (drop empty columns; keep at least one
  panel visible).

---

## 13. Motion & first impression

- Shared `utils/motion.ts` exporting keyframe objects (`fadeIn`, `fadeInUp`).
- **Staggered entrance** for cards/panels and smooth view transitions. Because inline `style` is
  **forbidden by lint**, implement stagger with **static delay classes** in `makeStyles`
  (`delay0..delayN`) + `mergeClasses`, not inline `animationDelay`.
- **Every animation** MUST include a `@media (prefers-reduced-motion: reduce)` guard that disables it.

---

## 14. Layout & responsiveness

- **Fluid width:** root fills `100%` of the host iframe; `boxSizing: 'border-box'`, `minWidth: 0`; no
  fixed pixel width. Treat ~320px as the narrow end.
- **Full-screen grid:** `gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'` so it re-flows to
  the number of visible columns **and** the width (3→2→1) without fixed breakpoints.
- **Large / projector displays:** step the content `maxWidth` up via `@media (min-width: …)` (e.g.
  1280 → 1440 → 1680px) so big screens use the canvas.
- Reuse a consistent **card pattern** (rounded corners, `shadow2` resting / `shadow8` hover).

---

## 15. Accessibility & visual finish

- **Dark-mode contrast:** token-based throughout; no hard-coded text colors; audit badges, rings,
  banners, and any brand surfaces.
- **Real links:** external links use `target="_blank"` **and** `rel="noopener noreferrer"`.
- **Empty / light-day states** must be positive and intentional ("You're all caught up on important
  mail.", "No meetings today - enjoy the open calendar.").
- **Iconography:** make it meaningful (e.g. weather glyph reflects condition + day/night).
- Provide `aria-label`s on icon-only controls; decorative visuals use `aria-hidden`.

---

## 16. Live integration (deferred phase) & libraries

- **PnP React controls** (`@pnp/spfx-controls-react`) - use when they add value; **deep imports only**
  (`.../lib/ListView`). Pass the component context down. Do **not** use `@pnp/spfx-property-controls`.
- **PnPjs v4** (`@pnp/sp`, `@pnp/graph`) for live data. Singleton `getSP`/`getGraph` initialized **once**
  from the Copilot component context; **selective imports**; always `.select(...)`.
- Keep the mapper and view models unchanged when swapping Mock → live service via a `useMock` flag /
  service factory.

---

## 17. Build, lint & packaging

### 17.1 Commands

- Dev: `heft start --clean` (`https://localhost:4321`).
- Validate: `heft test --clean` (build + lint + jest).
- Release: `heft test --clean --production && heft package-solution --production`.
- Node.js **>=22.14.0 <23.0.0**.

### 17.2 Lint / Griffel gotchas (learned - avoid these)

- **No inline `style={{…}}`** (rule forbids CSS inline styles) → use `makeStyles` classes; for dynamic
  values like stagger delay, use discrete static classes.
- **No `background` shorthand** in `makeStyles` (Griffel) → use `backgroundImage` (+ `backgroundColor`).
- **Dot-notation** preferred → object keys used with dot access must be valid identifiers (avoid
  hyphenated keys you then index with `['…']`).
- Animations use `animationName` with **inline keyframe objects**; reference shared keyframes from
  `utils/motion.ts`.

### 17.3 Quality gate

- A phase is not done until `heft test --clean` is **green with zero warnings**.

### 17.4 Ship the package

- Commit the built **`sharepoint/solution/<name>.sppkg`**. Un-ignore **only** the package in
  `.gitignore` (re-include the folder, ignore its contents, un-ignore the `.sppkg`); keep `debug/` and
  other build junk ignored. Repackage after substantive changes.

---

## 18. Docs & sample gallery

- **README** from the PnP sample template: Summary, Screenshots, Applies to, Prerequisites, **Minimal
  Path to Awesome** (with a "ready-made package" callout linking the `.sppkg`), **60-second demo
  script**, Features, Data source, Solution structure, References, author + version history.
  Use plain hyphens `-` in prose (avoid em dashes). One screenshot per row (no crowded tables).
- **`assets/sample.json`** (PnP gallery schema): unique `name`, `source: "pnp"`, title, short/long
  descriptions, `products`, `metadata` (`SAMPLE-TYPE`, `CLIENT-SIDE-DEV: React`, `SPFX-VERSION`),
  `thumbnails` (reference **only assets that exist**), `authors`, `references`. Keep thumbnails in sync
  with the real files in `assets/`.
- Do **not** author skill/agent-definition files per sample - this rules file is the shared reference.

---

## 19. Solution structure (mirror this)

```text
samples/<name>/
  README.md
  todo.md                         # phased tracker (▢/🔶/✅)
  agentic-creation-rules.md       # (this file - shared reference)
  assets/                         # sample.json, screenshots, faces/, source images
  config/                         # Heft/SPFx + copilot-agent.json, config.json, package-solution.json
  copilot/                        # manifest.json, declarativeAgent.json, ai-plugin.json, instruction.txt
  sharepoint/solution/<name>.sppkg  # committed, ready-to-deploy
  src/copilotComponents/<name>/
    <Name>CopilotComponent.ts / .manifest.json / <Name>CopilotComponentProperties.ts
    components/
      <Name>App.tsx               # root selector
      <Name>ThemeProvider.tsx     # single FluentProvider (stable-key)
      <Name>Inline.tsx / <Name>Fullscreen.tsx (+ more per scenario)
      inline/  fullscreen/        # building blocks
    models/    (graph.ts, <name>.ts, seeds.ts, <feature>.ts)
    services/  (I<Name>DataService.ts, Mock…, mappers.ts, resolveMockData.ts, CurrentUserService.ts, <feature>.ts)
    mockData/  (…sources.ts, people.ts, faces.ts, <x>Images.ts, index.ts)
    utils/     (datetime.ts, greeting.ts, motion.ts, settings.ts, …)
```

---

## 20. Cross-sample consistency checklist (apply to every sample)

- [ ] User-scaffolded via the Yeoman generator; component count/names set by the user; **agent-installed** baseline packages (React 17 + Fluent v9) on the "initial configuration" request.
- [ ] Copilot Component (no web part / no property pane); Heft; React 17; Fluent v9.
- [ ] Root selector + separate inline/full-screen views; `requestDisplayModeAsync` for expand.
- [ ] Single stable-key theme provider; tokens only; no `background` shorthand; no inline styles.
- [ ] `I<Name>DataService` + Mock impl; Graph-shaped mock; mapper; relative-time resolution.
- [ ] Standard M365 demo personas; real signed-in user via page context; one connected story.
- [ ] All imagery bundled base64; no external runtime references; graceful fallbacks.
- [ ] One deterministic **signature** feature with streamed reveal + personalized headline (reduced-motion safe).
- [ ] Optional session-persisted settings that reshape the UX; visibility-driven re-flow layout.
- [ ] Staggered entrance + reduced-motion guards; large-display scaling; positive empty states.
- [ ] `heft test --clean` green (zero warnings); committed `.sppkg`.
- [ ] README (PnP template + 60-second demo script) + `assets/sample.json` synced to real assets.
- [ ] `todo.md` generated first and kept current with the ▢/🔶/✅ legend.
