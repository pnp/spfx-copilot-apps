# My Day — Build Plan / TODO

Planning tracker for building out the **My Day** SharePoint Copilot App sample.
Mapped to the commitments in [README.md](./README.md) and the current code baseline.

> Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

> **Progress (latest):** Phase 1 mock-data layer, the **inline experience**, and the
> **full-screen experience (Phase 3)** are implemented and building cleanly
> (`heft test --production` ✓). Inline ships a time-aware greeting (with the **real
> signed-in user** name + profile photo via `userphoto.aspx`), three navigable summary
> tiles, and meetings / tasks / news drill-downs with a consistent hover-lift treatment
> and Fluent UI v9 theming driven by the host theme. Full-screen ships a responsive
> dashboard (hero + live date + weather, agenda timeline, tasks completion ring,
> important mail with sender **face avatars**, news wall, quick actions), a showcase
> **Settings** drawer, and the headline **"Plan my day"** focus assistant (deterministic
> mock engine + simulated thinking + read-only briefing). Persona **face photos** are
> embedded as base64 data URIs (CSP-safe, bundled into the `.sppkg`). Remaining: inline
> container-width breakpoints + a light/dark contrast pass, and the deferred API integration.

## Approach & sequencing

**UX first, with mocked data.** We build the full inline and full-screen
experiences against a static mock data structure before wiring up any dynamic
or API-backed data. All Microsoft Graph / SharePoint / PnPjs work is **deferred**
until the UX is in place.

Order of work:

1. **Phase 1 — Mock data structure** (lightweight; details TBD soon)
2. **Phase 2 — Inline experience** React component structure (driven by the UX design)
3. **Phase 3 — Full-screen experience** React component structure
4. **Phase 4 — Shared UI building blocks & theming** (extracted as the views grow)
5. **Deferred — Dynamic data / API integration** (PnPjs, Graph, tool schema, provisioning)

---

## Phase 1 — Mock data structure

> Static, typed mock both views render from — no API calls. Imaginary data, demo-friendly.
> **Mock data mirrors the Microsoft Graph response shapes** so the future `GraphMyDayDataService`
> is a drop-in swap (same fields/nesting, no reshaping). A thin mapper projects the Graph-shaped
> raw data into the lean view models the components consume.
>
> **Packaging:** ship the mock as **bundled TypeScript modules** under the component
> (`src/copilotComponents/myDay/mockData/`) that export **typed `const` arrays** and are
> **`import`ed directly** by the mock provider. Webpack bundles them into the component JS, so
> they resolve at runtime with **no fetch and no static-asset copy** — the easiest path for the
> demo. (`.json` imported as modules also works via `resolveJsonModule`, but `.ts` arrays give
> inline typing against the Graph shapes.)

### Graph-aligned raw mock (one bundled TS module per source, shaped like the Graph response)

- [x] `mockData/meetings.ts` → `export const mockEvents: GraphEvent[]` → Graph **`event`** (`/me/events`, `/me/calendarView`):
  - `id`, `subject`, `start: { dateTime, timeZone }`, `end: { dateTime, timeZone }`
  - `location: { displayName }`, `isOnlineMeeting`, `onlineMeeting: { joinUrl }`, `onlineMeetingProvider`
  - `organizer: { emailAddress: { name, address } }`, `attendees: [{ emailAddress, status, type }]`
  - `importance` (`low`|`normal`|`high`), `showAs`, `isAllDay`, `webLink` (Outlook deep link)
- [x] `mockData/tasks.ts` → `export const mockTasks: GraphTodoTask[]` → Graph **`todoTask`** (`/me/todo/lists/{id}/tasks`):
  - `id`, `title`, `status` (`notStarted`|`inProgress`|`completed`|…)
  - `importance` (`low`|`normal`|`high`), `dueDateTime: { dateTime, timeZone }`, `completedDateTime`, `categories`
- [x] `mockData/news.ts` → `export const mockNews: GraphSitePage[]` → Graph **`sitePage`** (`/sites/{id}/pages/microsoft.graph.sitePage`, SharePoint news):
  - `id`, `title`, `name`, `webUrl`, `description`, `thumbnailWebUrl`, `bannerImageWebUrl`
  - `createdDateTime`, `lastModifiedDateTime`, `promotionKind` (`newsPost`)
  - category derived from a custom column / managed property (not a standard `sitePage` field — note in mapper)
- [x] `mockData/mail.ts` → `export const mockMail: GraphMessage[]` → Graph **`message`** (`/me/messages`, used by full-screen "Important mail"):
  - `id`, `subject`, `bodyPreview`, `from: { emailAddress: { name, address } }`
  - `receivedDateTime`, `isRead`, `importance` (`low`|`normal`|`high`), `hasAttachments`
  - `flag: { flagStatus }`, `webLink` (Outlook deep link)
  - [x] **Sender face photos** for the Important mail avatars: add a `senderPhoto` companion per item referencing a **bundled local face image** (CSP-safe, no external fetch). In live Graph this comes from `/users/{id}/photo/$value` (not a `message` field) — note in mapper. Provide a graceful **initials fallback** (Fluent `Avatar`) when absent
  - [x] Bundle the face images under `assets/` (`assets/faces/*.jpeg`) and **embed them as base64 data URIs** (`mockData/faces.ts`) so webpack bundles them into the component JS — fully self-contained, no external fetch, no static-asset copy
- [x] `mockData/user.ts` → `export const mockUser: GraphUser` → Graph **`user`** (`/me`): `id`, `displayName`, `givenName`, `mail`, `userPrincipalName` (+ photo from `/me/photo/$value`)
- [x] `mockData/index.ts` — barrel re-exporting all mock arrays for a single import

### View models (lean projections the components use)

- [x] `IMyDayData`: `{ user, meetings: IMeeting[], tasks: ITask[], news: INewsItem[], mail: IMailItem[], weather?, quickActions? }` (weather + quickActions added in the full-screen phase)
- [x] `IMeeting`: `{ id, subject, start, end, location?, isOnline, joinUrl?, importance, webLink? }`
- [x] `ITask`: `{ id, title, due, importance: 'low'|'normal'|'high', completed, webLink? }`
- [x] `INewsItem`: `{ id, title, category, publishedAt, summary?, imageUrl?, webUrl?, author? }` (author = name + optional face photo, for the byline)
- [x] `IMailItem`: `{ id, subject, preview, from, fromEmail?, receivedAt, isRead, importance: 'low'|'normal'|'high', hasAttachments, flagged, webLink? }` (+ optional `senderPhotoUrl?` for the Important mail face avatar)
- [x] Mapper `graph → view model` (e.g. flatten `start.dateTime`, `status === 'completed' → completed`, `from.emailAddress.name → from`, pick `thumbnailWebUrl → imageUrl`) — reused later by `GraphMyDayDataService`

### Dynamic date/time resolution (always live, future-biased)

> The demo must feel current **whenever** it is opened — no stale/past dates. Times are resolved
> **at render against the user's local clock**, so the data shifts with the time of day and stays in
> the future where it should be.

- [x] Author mock entities with **relative offsets from `now`** (not hardcoded absolute dates), e.g. a companion field per item: meetings `startOffsetMin`/`durationMin`, tasks `dueOffsetMin`, news `publishedOffsetMin`, mail `receivedOffsetMin`
- [x] `resolveMockData(now = new Date())` computes Graph-shaped absolute `dateTime` values (`now + offset`) so the raw objects still match the Graph shape after resolution
- [x] **Future-biased** schedule: meetings ahead of now (e.g. +12m, +45m, +2h, +4h, tomorrow +1d); tasks due today-later / +1d / +2d; news & mail in the **recent past** (−10m … −1d) so "1h ago" reads naturally
- [x] **Time-of-day aware**: filter/sort so the "next" meeting is the first one still in the future; past meetings drop out as the day progresses (greeting morning/afternoon/evening already follows the clock)
- [x] Resolve **on every render / data load** (pass `now` in) so re-opening later in the day refreshes relative times ("in 18 min", "in 2h") and the next-up item
- [x] Keep timezone handling consistent (resolve to local; emit `dateTime` + `timeZone` like Graph)

### Data & wiring

- [x] Author imaginary mock data (≥5 meetings, several tasks incl. high importance + due today, ≥4 news items, ≥4 mail items incl. unread/important)
- [x] Internally consistent entries (online meeting ⇒ `joinUrl` + Teams provider; in-person ⇒ room `displayName`)
- [x] `MockMyDayDataService` imports the `mockData` arrays, calls `resolveMockData(now)`, runs the mapper, and returns a single `IMyDayData` the components consume as props

## Phase 2 — Inline experience (React component structure)

> **Fluid, responsive width** — the component renders inside the Copilot host **iframe**, so the
> layout must fill `100%` of the available width and adapt to the host container; never hardcode a
> fixed pixel width. Treat ~320px as the *narrow* end of a responsive range, not a fixed size.
> Vertical stack of summary cards with a two-level navigator:
> `view: 'summary' | 'meetings' | 'tasks' | 'news'` (local UI navigation state via `useState`).
> Built with **Fluent UI v9**. Rows in drill-downs are designed to deep-link to Outlook/intranet
> (`webLink`/`webUrl`) but are **no-op in the mock**.

### Setup

- [x] Install Fluent UI v9 (`@fluentui/react-components`, `@fluentui/react-icons`) — React 17 compatible

### Responsive layout (iframe-aware)

- [x] Root container fills `width: 100%` of the host iframe; no fixed pixel width
- [x] Fluid cards/tiles (`box-sizing: border-box`, `min-width: 0`, flexible text wrapping/truncation)
- [ ] Responsive breakpoints driven by container width (CSS container queries or `hostContext.containerDimensions`), not the viewport
- [ ] Verify layout from ~320px up to wide inline widths (no overflow, no clipped chevrons/badges)

### Shared helpers

- [x] `useGreeting()` — time bucket (morning/afternoon/evening/night) → label + icon, client-side clock
- [x] `formatRelativeTime()` — "in 18 min", "1h ago"

### Reusable building blocks (`components/inline/`)

- [x] `SummaryTile` — icon + title + primary/secondary text + chevron + `onClick`
- [x] `InlineDetailHeader` — back arrow + title for drill-downs

### Root summary (`InlineSummary`)

- [x] Intro line ("Here's your personalized summary for today.")
- [x] `GreetingCard` — time-aware greeting + first name + matching icon (sun/moon)
- [x] Next-meeting `SummaryTile` — subject, time range, "in X min", location/Teams
- [x] Tasks-due `SummaryTile` — count + high-importance count
- [x] Top-news `SummaryTile` — latest headline, category + relative time

### Drill-down views

- [x] `MeetingsList` — next 5 meetings, back to summary, rows no-op
- [x] `TasksList` — today's incomplete tasks with importance `Badge`, back to summary
- [x] `NewsList` — latest news with thumbnails (`Image`), back to summary

### Wiring

- [x] `MyDayInline` owns `view` state and routes summary ↔ drill-downs
- [x] Keep existing `onRequestFullscreen` expand affordance

### Theming (host-driven dark/light)

- [x] Detect the Copilot host theme from `hostContext.theme` (`'light'` | `'dark'`) — passed down as a prop, never read inside components
- [x] Wrap the inline tree in `FluentProvider` with `webDarkTheme` for `'dark'`, `webLightTheme` otherwise (default to light when `theme` is undefined)
- [x] Use Fluent v9 theme tokens (no hardcoded colors) so icons, cards, badges and text adapt automatically
- [x] Re-render on host theme change (base class already re-renders on `onHostContextChanged`) — derive the provider theme from the prop on every render
- [ ] Verify both modes have sufficient contrast (greeting icon, priority badges, news thumbnails)

## Phase 3 — Full-screen experience (React component structure)

> Build out `MyDayFullscreen.tsx` from the concept mockup (`assets/concept-mockup.png`),
> consuming the **same mock data** as the inline view. A full-width, responsive dashboard
> with a headline **"Plan my day"** focus assistant. Theming inherits from the shared
> `MyDayThemeProvider` (host light/dark) — no second `FluentProvider`. Reuse the
> established card pattern (rounded corners, `shadow2` resting / `shadow8` hover) for
> visual consistency with inline. All deep-links / actions are **no-op in the mock**.

### Layout shell & responsive grid

- [x] `MyDayFullscreen` root: full-width, scrollable column filling the host iframe (no fixed pixel width); comfortable max content width with gutters
- [x] Responsive dashboard grid (CSS grid): **Agenda** | **Tasks + Important mail** | **News + Quick actions**
- [x] Collapse gracefully as width shrinks (3-col → 2-col → single column), driven by container width (CSS media/container queries)
- [x] `components/fullscreen/` folder for the new building blocks

### Hero / greeting row

- [x] Large profile avatar — **real current user** via `resolveCurrentUser` (passed through props) — beside a time-aware greeting ("Good morning, Vesa! 👋") reusing `getGreeting`
- [x] Full date line ("Wednesday, June 25, 2026") — **resolved dynamically from the live `now`** (`formatFullDate` via `toLocaleDateString` with weekday + long month, user locale); never hardcoded, always the current day
- [x] Weather card (right): temperature, condition, location, AQI — **mock only** (see mock-data additions below)
- [x] **Settings gear** aligned on the right of the hero row — opens the settings panel (see below)

### Settings panel (showcase only — storytelling)

> Right-side slide-in panel opened from the hero **gear**, showcasing the kind of
> configuration a user could adjust for the full-screen mode. **Purely illustrative for the
> demo** — the controls render and are interactive but **do not actually change anything**
> (no persistence, no effect on the dashboard). Important for the storytelling.

- [x] `SettingsPanel` — same slide-in right-side drawer pattern as the Plan my day panel (reuse the shared `RightPanel` drawer shell); header ("Settings" + gear) + dismiss affordance
- [x] Mutually exclusive with the Plan my day panel (only one right-side panel open at a time)
- [x] **Weather units** — °F / °C toggle (switch) — inert
- [x] **Visible panels** — checkbox list to show/hide each primary panel (Agenda, Tasks, Important mail, News, Quick actions, **Plan my day**) — inert
- [x] **Weather location** — simple **City** and **Country** text inputs — inert
- [x] Add a subtle "settings are not saved in this demo" note so the inert behavior is clear

### Agenda timeline (left column)

- [x] `AgendaTimeline` — vertical time-rail with time labels and meeting entries (subject + location / Teams)
- [x] Highlight the current / next meeting with a `Join` affordance (no-op)
- [x] "View calendar" link + current/next badges
- [x] Reuse the Phase 1 `IMeeting` view models (live-resolved `now`)

### Tasks card (middle column, top)

- [x] `TasksPanel` — completion **ring** ("60% completed") + "N due today / M total"
- [x] Checklist rows: checkbox, title, importance label; completed rows struck through (tickable, local state)
- [x] "View all tasks" link

### Important mail card (middle column, bottom)

- [x] `ImportantMail` — sender **face avatar** (bundled base64 photo, initials fallback), name, subject, preview, relative time
- [x] Unread indicator dot; "Open Outlook" (no-op)
- [x] Consume the Phase 1 `IMailItem` view models

### News wall (right column, top)

- [x] `NewsWall` — 2×2 image-card grid (thumbnail, title, source + relative time, author byline) with graceful image fallback (reuse the inline `NewsThumb` fallback)
- [x] "View all" link

### Quick actions (right column, bottom)

- [x] `QuickActions` — tile row (Book room, New note, Time off): icon + title + description; **mock / no-op**

### Footer

- [x] Static footer: "AI-generated content may be incorrect" + "Powered by Microsoft Graph" + "Give feedback"

### "Plan my day" — focus assistant (headline Phase 3 feature)

> Full-width banner at the bottom of the dashboard with a **"Plan my day"** button.
> Conceptually this triggers a **WorkIQ AI** call to decide what the user should focus on.
> Clicking it opens a **right-side panel** over the full-screen view with a beautifully
> formatted **prioritized focus summary** — **no chat**, just a read-only briefing.
> **In the sample the recommendations are generated deterministically from the mock data**
> (relevant + dynamic, shifting with the time of day) — **no real AI / WorkIQ API is called.**

- [x] `PlanYourDayBanner` — full-width gradient marker: sparkle icon, "Start your day smart" headline, a **dynamic** one-liner derived from the data ("You have 4 meetings and 2 high-priority tasks ahead."), right-aligned `Plan my day` button
- [x] Local UI state on `MyDayFullscreen`: `openPanel` + a brief **simulated "thinking"** state on click (spinner) before the summary renders — sells the AI feel without an API
- [x] `PlanMyDayPanel` — slide-in right-side panel (Fluent drawer/overlay style): header ("Plan my day" + sparkle), dismiss affordance, scrollable body; the dashboard yields the remaining width while the panel is open
  - reuse the **shared right-side drawer shell** (`RightPanel`) also used by the settings panel (one open at a time)
- [x] **Recommendation engine (mock, deterministic)** — `planMyDay(data, now): IFocusPlan` pure function:
  - rank the day's signals: high-importance tasks due today, the next/imminent meeting, unread important mail, available focus-time blocks
  - emit a **prioritized list** (3–5 items), each with: title, why-it-matters one-liner, suggested time/slot, source chip (Meeting / Task / Mail / Focus), importance accent
  - emit a one-paragraph **headline summary**
  - fully derived from the live-resolved mock (reuses `now`) so it stays current
- [x] `IFocusPlan` view model + render it as a **beautiful summary** (numbered cards, accent rails, source icons) — read-only, no chat input
- [x] Empty / light-day state ("You're in good shape — nothing urgent right now.")
- [x] Disclaimer line in the panel (mirrors the real experience)

### Mock-data additions for full-screen

- [x] `mockData/weather.ts` → static `weather` (temp, condition, location, AQI) + `IWeather` view model — **mock only**
- [x] `mockData/quickActions.ts` → static quick-action tiles + `IQuickAction` view model — **mock only**
- [x] Extend `IMyDayData` with optional `weather?` and `quickActions?`; `MockMyDayDataService` populates them

### Wiring & theming

- [x] Extend `IMyDayFullscreenProps` (like inline) with `currentUser` + `theme`; `MyDayApp` routes `displayMode === 'fullscreen'` → `MyDayFullscreen` and passes `currentUser`
- [x] Inherit theming from `MyDayThemeProvider` (no second `FluentProvider`)
- [ ] Verify light / dark contrast across the dashboard, banner, and plan panel

## Phase 4 — Shared UI building blocks & theming

- [ ] Reusable cards, agenda timeline, tasks ring, news wall, quick-action tiles (shared by both views)
- [ ] Decide UI stack: Fluent UI + `@pnp/spfx-controls-react` where applicable
- [ ] Pass `hostContext.theme` (`light`/`dark`) through props into both views
- [ ] Apply theme to shared components

---

## Deferred — Dynamic data / API integration

> Picked up only after the UX is complete against mock data.

### Tool input schema (Copilot Component conventions)

- [ ] Revisit `MyDayCopilotComponentProperties.ts` — replace placeholder `message` with real tool inputs (e.g. `useMock`, optional focus/section hint) using Zod `.describe()`

### Swappable data service (README: "Data source")

- [ ] `IMyDayDataService` interface — one contract, two implementations (returns the **view models** from Phase 1)
- [ ] `MockMyDayDataService` — serves the Phase 1 Graph-shaped mock through the same mapper
- [ ] `GraphMyDayDataService` — PnPjs v4, reusing the Phase 1 `graph → view model` mapper:
  - calendar → `/me/events` or `/me/calendarView` (Graph `event`)
  - tasks → `/me/todo/lists/{id}/tasks` (Graph `todoTask`); README also notes `/me/planner/tasks` — reconcile source
  - news → `/sites/{id}/pages/microsoft.graph.sitePage` (SharePoint news posts)
  - mail → `/me/messages` (Graph `message`, e.g. `$filter=importance eq 'high'` / unread)
  - user → `/me` + `/me/photo/$value`
- [ ] Service factory — selects mock vs. live from a `useMock` flag

### "Plan my day" — live WorkIQ integration (replaces the mock recommendation engine)

- [ ] Replace `planMyDay(data, now)` mock with a real **WorkIQ** call that returns the prioritized focus plan (same `IFocusPlan` shape, so the panel UI is unchanged)
- [ ] Confirm the WorkIQ endpoint / auth path available from the Copilot component context; map its response to `IFocusPlan`
- [ ] Keep the simulated "thinking" state as the real loading state; preserve the disclaimer line

### PnPjs initialization

- [ ] Add singleton `getSP` / `getGraph` helper initialized from the Copilot component context
- [ ] Confirm the `SPFx` behavior accepts the Copilot component context shape
- [ ] Wire init in the component before first render

### Data loading & state

- [ ] Decide where data is fetched (component `onInit` vs. React hook) and how it flows as props (no mirrored host state)

### Sample data + provisioning

- [ ] Materialize `sampledata/` JSON (from the Phase 1 mock)
- [ ] Optional PnP provisioning template for the `News` list

---

## Docs & cleanup

- [ ] Replace placeholder captures in `assets/` with real inline/full-screen screenshots + demo GIF
- [ ] Fill in README author + version-history date
- [ ] Remove the now-redundant `README-myday.md`

---

## Open decisions

1. ~~**Fluent UI version**~~ → **Decided: Fluent UI v9** (`@fluentui/react-components`, React 17 compatible)
2. **`useMock` location** — Zod tool property vs. build constant? (deferred phase)
3. **Data fetch location** — component `onInit` vs. a React hook inside `MyDayApp`? (deferred phase)
