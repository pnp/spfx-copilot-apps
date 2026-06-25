# My Day — Build Plan / TODO

Planning tracker for building out the **My Day** SharePoint Copilot App sample.
Mapped to the commitments in [README.md](./README.md) and the current code baseline.

> Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

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

- [ ] `mockData/meetings.ts` → `export const mockEvents: GraphEvent[]` → Graph **`event`** (`/me/events`, `/me/calendarView`):
  - `id`, `subject`, `start: { dateTime, timeZone }`, `end: { dateTime, timeZone }`
  - `location: { displayName }`, `isOnlineMeeting`, `onlineMeeting: { joinUrl }`, `onlineMeetingProvider`
  - `organizer: { emailAddress: { name, address } }`, `attendees: [{ emailAddress, status, type }]`
  - `importance` (`low`|`normal`|`high`), `showAs`, `isAllDay`, `webLink` (Outlook deep link)
- [ ] `mockData/tasks.ts` → `export const mockTasks: GraphTodoTask[]` → Graph **`todoTask`** (`/me/todo/lists/{id}/tasks`):
  - `id`, `title`, `status` (`notStarted`|`inProgress`|`completed`|…)
  - `importance` (`low`|`normal`|`high`), `dueDateTime: { dateTime, timeZone }`, `completedDateTime`, `categories`
- [ ] `mockData/news.ts` → `export const mockNews: GraphSitePage[]` → Graph **`sitePage`** (`/sites/{id}/pages/microsoft.graph.sitePage`, SharePoint news):
  - `id`, `title`, `name`, `webUrl`, `description`, `thumbnailWebUrl`, `bannerImageWebUrl`
  - `createdDateTime`, `lastModifiedDateTime`, `promotionKind` (`newsPost`)
  - category derived from a custom column / managed property (not a standard `sitePage` field — note in mapper)
- [ ] `mockData/mail.ts` → `export const mockMail: GraphMessage[]` → Graph **`message`** (`/me/messages`, used by full-screen "Important mail"):
  - `id`, `subject`, `bodyPreview`, `from: { emailAddress: { name, address } }`
  - `receivedDateTime`, `isRead`, `importance` (`low`|`normal`|`high`), `hasAttachments`
  - `flag: { flagStatus }`, `webLink` (Outlook deep link)
- [ ] `mockData/user.ts` → `export const mockUser: GraphUser` → Graph **`user`** (`/me`): `id`, `displayName`, `givenName`, `mail`, `userPrincipalName` (+ photo from `/me/photo/$value`)
- [ ] `mockData/index.ts` — barrel re-exporting all mock arrays for a single import

### View models (lean projections the components use)

- [ ] `IMyDayData`: `{ user, meetings: IMeeting[], tasks: ITask[], news: INewsItem[], mail: IMailItem[] }` (quickActions, weather → full-screen phase)
- [ ] `IMeeting`: `{ id, subject, start, end, location?, isOnline, joinUrl?, importance, webLink? }`
- [ ] `ITask`: `{ id, title, due, importance: 'low'|'normal'|'high', completed, webLink? }`
- [ ] `INewsItem`: `{ id, title, category, publishedAt, imageUrl?, webUrl? }`
- [ ] `IMailItem`: `{ id, subject, preview, from, fromEmail?, receivedAt, isRead, importance: 'low'|'normal'|'high', hasAttachments, flagged, webLink? }`
- [ ] Mapper `graph → view model` (e.g. flatten `start.dateTime`, `status === 'completed' → completed`, `from.emailAddress.name → from`, pick `thumbnailWebUrl → imageUrl`) — reused later by `GraphMyDayDataService`

### Dynamic date/time resolution (always live, future-biased)

> The demo must feel current **whenever** it is opened — no stale/past dates. Times are resolved
> **at render against the user's local clock**, so the data shifts with the time of day and stays in
> the future where it should be.

- [ ] Author mock entities with **relative offsets from `now`** (not hardcoded absolute dates), e.g. a companion field per item: meetings `startOffsetMin`/`durationMin`, tasks `dueOffsetMin`, news `publishedOffsetMin`, mail `receivedOffsetMin`
- [ ] `resolveMockData(now = new Date())` computes Graph-shaped absolute `dateTime` values (`now + offset`) so the raw objects still match the Graph shape after resolution
- [ ] **Future-biased** schedule: meetings ahead of now (e.g. +12m, +45m, +2h, +4h, tomorrow +1d); tasks due today-later / +1d / +2d; news & mail in the **recent past** (−10m … −1d) so "1h ago" reads naturally
- [ ] **Time-of-day aware**: filter/sort so the "next" meeting is the first one still in the future; past meetings drop out as the day progresses (greeting morning/afternoon/evening already follows the clock)
- [ ] Resolve **on every render / data load** (pass `now` in) so re-opening later in the day refreshes relative times ("in 18 min", "in 2h") and the next-up item
- [ ] Keep timezone handling consistent (resolve to local; emit `dateTime` + `timeZone` like Graph)

### Data & wiring

- [ ] Author imaginary mock data (≥5 meetings, several tasks incl. high importance + due today, ≥4 news items, ≥4 mail items incl. unread/important)
- [ ] Internally consistent entries (online meeting ⇒ `joinUrl` + Teams provider; in-person ⇒ room `displayName`)
- [ ] `MockMyDayDataService` imports the `mockData` arrays, calls `resolveMockData(now)`, runs the mapper, and returns a single `IMyDayData` the components consume as props

## Phase 2 — Inline experience (React component structure)

> **Fluid, responsive width** — the component renders inside the Copilot host **iframe**, so the
> layout must fill `100%` of the available width and adapt to the host container; never hardcode a
> fixed pixel width. Treat ~320px as the *narrow* end of a responsive range, not a fixed size.
> Vertical stack of summary cards with a two-level navigator:
> `view: 'summary' | 'meetings' | 'tasks' | 'news'` (local UI navigation state via `useState`).
> Built with **Fluent UI v9**. Rows in drill-downs are designed to deep-link to Outlook/intranet
> (`webLink`/`webUrl`) but are **no-op in the mock**.

### Setup

- [ ] Install Fluent UI v9 (`@fluentui/react-components`, `@fluentui/react-icons`) — React 17 compatible

### Responsive layout (iframe-aware)

- [ ] Root container fills `width: 100%` of the host iframe; no fixed pixel width
- [ ] Fluid cards/tiles (`box-sizing: border-box`, `min-width: 0`, flexible text wrapping/truncation)
- [ ] Responsive breakpoints driven by container width (CSS container queries or `hostContext.containerDimensions`), not the viewport
- [ ] Verify layout from ~320px up to wide inline widths (no overflow, no clipped chevrons/badges)

### Shared helpers

- [ ] `useGreeting()` — time bucket (morning/afternoon/evening/night) → label + icon, client-side clock
- [ ] `formatRelativeTime()` — "in 18 min", "1h ago"

### Reusable building blocks (`components/inline/`)

- [ ] `SummaryTile` — icon + title + primary/secondary text + chevron + `onClick`
- [ ] `InlineDetailHeader` — back arrow + title for drill-downs

### Root summary (`InlineSummary`)

- [ ] Intro line ("Here's your personalized summary for today.")
- [ ] `GreetingCard` — time-aware greeting + first name + matching icon (sun/moon)
- [ ] Next-meeting `SummaryTile` — subject, time range, "in X min", location/Teams
- [ ] Tasks-due `SummaryTile` — count + high-importance count
- [ ] Top-news `SummaryTile` — latest headline, category + relative time

### Drill-down views

- [ ] `MeetingsList` — next 5 meetings, back to summary, rows no-op
- [ ] `TasksList` — today's incomplete tasks with importance `Badge`, back to summary
- [ ] `NewsList` — latest news with thumbnails (`Image`), back to summary

### Wiring

- [ ] `MyDayInline` owns `view` state and routes summary ↔ drill-downs
- [ ] Keep existing `onRequestFullscreen` expand affordance

### Theming (host-driven dark/light)

- [ ] Detect the Copilot host theme from `hostContext.theme` (`'light'` | `'dark'`) — passed down as a prop, never read inside components
- [ ] Wrap the inline tree in `FluentProvider` with `webDarkTheme` for `'dark'`, `webLightTheme` otherwise (default to light when `theme` is undefined)
- [ ] Use Fluent v9 theme tokens (no hardcoded colors) so icons, cards, badges and text adapt automatically
- [ ] Re-render on host theme change (base class already re-renders on `onHostContextChanged`) — derive the provider theme from the prop on every render
- [ ] Verify both modes have sufficient contrast (greeting icon, priority badges, news thumbnails)

## Phase 3 — Full-screen experience (React component structure)

> Build out `MyDayFullscreen.tsx` from the UX design, consuming the mock data. Add todos here as the design is detailed.

- [ ] Responsive card grid layout
- [ ] Agenda timeline
- [ ] Tasks (checklist + completion ring)
- [ ] News wall (image cards)
- [ ] Important mail
- [ ] Quick-actions row

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
