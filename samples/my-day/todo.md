# My Day — Build Plan / TODO

Planning tracker for building out the **My Day** SharePoint Copilot App sample.
Mapped to the commitments in [README.md](./README.md) and the current code baseline.

> Status legend: ▢ not started · 🔶 in progress · ✅ done

> **Progress (latest):** Phases 1–6 are complete and building cleanly (`heft test --production` ✓).
> The **inline** and **full-screen** experiences ship against a curated, Graph-shaped mock; the
> inline meetings/tasks drill-downs now **reuse the full-screen `AgendaTimeline` / `TasksPanel`**
> controls (news stays a separate inline listing). Greeting uses the **real signed-in user** (name +
> `userphoto.aspx`) with time-of-day/weekday variants, and a dynamic day-summary line.
> **Settings are session-persisted** (`sessionStorage`) and actually shape the dashboard — the
> temperature unit updates the weather card live, and the **visible-panels** set drives a dynamic,
> re-flowing layout. The headline **"Plan my day"** briefing opens with the user's name + time of
> day and **streams in** its deterministic recommendations behind a shimmer. Views animate in with a
> **staggered entrance** (reduced-motion safe). The mock tells **one connected story** (shipping the
> My Day Copilot App) with consistent M365 demo personas. The sample is **fully offline** — faces
> **and** news thumbnails are bundled base64 (no external image references). Visual finish: condition/
> time-aware weather glyph, large-display scaling, positive empty states, and a dark-mode contrast
> audit. Docs: README rewritten with a **60-second demo script**, `assets/sample.json` authored, and
> the built **`.sppkg` committed** as a ready-to-deploy demo package.
>
> **Remaining:** real screenshots/GIF + README author/version date + remove `README-myday.md`
> (Docs & cleanup); the **deferred** live data / WorkIQ / PnPjs integration; and the intentionally
> **deferred** tool-input rework + "open full dashboard" conversation starter (next phase).

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

- ✅ `mockData/meetings.ts` → `export const mockEvents: GraphEvent[]` → Graph **`event`** (`/me/events`, `/me/calendarView`):
  - `id`, `subject`, `start: { dateTime, timeZone }`, `end: { dateTime, timeZone }`
  - `location: { displayName }`, `isOnlineMeeting`, `onlineMeeting: { joinUrl }`, `onlineMeetingProvider`
  - `organizer: { emailAddress: { name, address } }`, `attendees: [{ emailAddress, status, type }]`
  - `importance` (`low`|`normal`|`high`), `showAs`, `isAllDay`, `webLink` (Outlook deep link)
- ✅ `mockData/tasks.ts` → `export const mockTasks: GraphTodoTask[]` → Graph **`todoTask`** (`/me/todo/lists/{id}/tasks`):
  - `id`, `title`, `status` (`notStarted`|`inProgress`|`completed`|…)
  - `importance` (`low`|`normal`|`high`), `dueDateTime: { dateTime, timeZone }`, `completedDateTime`, `categories`
- ✅ `mockData/news.ts` → `export const mockNews: GraphSitePage[]` → Graph **`sitePage`** (`/sites/{id}/pages/microsoft.graph.sitePage`, SharePoint news):
  - `id`, `title`, `name`, `webUrl`, `description`, `thumbnailWebUrl`, `bannerImageWebUrl`
  - `createdDateTime`, `lastModifiedDateTime`, `promotionKind` (`newsPost`)
  - category derived from a custom column / managed property (not a standard `sitePage` field — note in mapper)
- ✅ `mockData/mail.ts` → `export const mockMail: GraphMessage[]` → Graph **`message`** (`/me/messages`, used by full-screen "Important mail"):
  - `id`, `subject`, `bodyPreview`, `from: { emailAddress: { name, address } }`
  - `receivedDateTime`, `isRead`, `importance` (`low`|`normal`|`high`), `hasAttachments`
  - `flag: { flagStatus }`, `webLink` (Outlook deep link)
  - ✅ **Sender face photos** for the Important mail avatars: add a `senderPhoto` companion per item referencing a **bundled local face image** (CSP-safe, no external fetch). In live Graph this comes from `/users/{id}/photo/$value` (not a `message` field) — note in mapper. Provide a graceful **initials fallback** (Fluent `Avatar`) when absent
  - ✅ Bundle the face images under `assets/` (`assets/faces/*.jpeg`) and **embed them as base64 data URIs** (`mockData/faces.ts`) so webpack bundles them into the component JS — fully self-contained, no external fetch, no static-asset copy
- ✅ `mockData/user.ts` → `export const mockUser: GraphUser` → Graph **`user`** (`/me`): `id`, `displayName`, `givenName`, `mail`, `userPrincipalName` (+ photo from `/me/photo/$value`)
- ✅ `mockData/index.ts` — barrel re-exporting all mock arrays for a single import

### View models (lean projections the components use)

- ✅ `IMyDayData`: `{ user, meetings: IMeeting[], tasks: ITask[], news: INewsItem[], mail: IMailItem[], weather?, quickActions? }` (weather + quickActions added in the full-screen phase)
- ✅ `IMeeting`: `{ id, subject, start, end, location?, isOnline, joinUrl?, importance, webLink? }`
- ✅ `ITask`: `{ id, title, due, importance: 'low'|'normal'|'high', completed, webLink? }`
- ✅ `INewsItem`: `{ id, title, category, publishedAt, summary?, imageUrl?, webUrl?, author? }` (author = name + optional face photo, for the byline)
- ✅ `IMailItem`: `{ id, subject, preview, from, fromEmail?, receivedAt, isRead, importance: 'low'|'normal'|'high', hasAttachments, flagged, webLink? }` (+ optional `senderPhotoUrl?` for the Important mail face avatar)
- ✅ Mapper `graph → view model` (e.g. flatten `start.dateTime`, `status === 'completed' → completed`, `from.emailAddress.name → from`, pick `thumbnailWebUrl → imageUrl`) — reused later by `GraphMyDayDataService`

### Dynamic date/time resolution (always live, future-biased)

> The demo must feel current **whenever** it is opened — no stale/past dates. Times are resolved
> **at render against the user's local clock**, so the data shifts with the time of day and stays in
> the future where it should be.

- ✅ Author mock entities with **relative offsets from `now`** (not hardcoded absolute dates), e.g. a companion field per item: meetings `startOffsetMin`/`durationMin`, tasks `dueOffsetMin`, news `publishedOffsetMin`, mail `receivedOffsetMin`
- ✅ `resolveMockData(now = new Date())` computes Graph-shaped absolute `dateTime` values (`now + offset`) so the raw objects still match the Graph shape after resolution
- ✅ **Future-biased** schedule: meetings ahead of now (e.g. +12m, +45m, +2h, +4h, tomorrow +1d); tasks due today-later / +1d / +2d; news & mail in the **recent past** (−10m … −1d) so "1h ago" reads naturally
- ✅ **Time-of-day aware**: filter/sort so the "next" meeting is the first one still in the future; past meetings drop out as the day progresses (greeting morning/afternoon/evening already follows the clock)
- ✅ Resolve **on every render / data load** (pass `now` in) so re-opening later in the day refreshes relative times ("in 18 min", "in 2h") and the next-up item
- ✅ Keep timezone handling consistent (resolve to local; emit `dateTime` + `timeZone` like Graph)

### Data & wiring

- ✅ Author imaginary mock data (≥5 meetings, several tasks incl. high importance + due today, ≥4 news items, ≥4 mail items incl. unread/important)
- ✅ Internally consistent entries (online meeting ⇒ `joinUrl` + Teams provider; in-person ⇒ room `displayName`)
- ✅ `MockMyDayDataService` imports the `mockData` arrays, calls `resolveMockData(now)`, runs the mapper, and returns a single `IMyDayData` the components consume as props

## Phase 2 — Inline experience (React component structure)

> **Fluid, responsive width** — the component renders inside the Copilot host **iframe**, so the
> layout must fill `100%` of the available width and adapt to the host container; never hardcode a
> fixed pixel width. Treat ~320px as the *narrow* end of a responsive range, not a fixed size.
> Vertical stack of summary cards with a two-level navigator:
> `view: 'summary' | 'meetings' | 'tasks' | 'news'` (local UI navigation state via `useState`).
> Built with **Fluent UI v9**. Rows in drill-downs are designed to deep-link to Outlook/intranet
> (`webLink`/`webUrl`) but are **no-op in the mock**.

### Setup

- ✅ Install Fluent UI v9 (`@fluentui/react-components`, `@fluentui/react-icons`) — React 17 compatible

### Responsive layout (iframe-aware)

- ✅ Root container fills `width: 100%` of the host iframe; no fixed pixel width
- ✅ Fluid cards/tiles (`box-sizing: border-box`, `min-width: 0`, flexible text wrapping/truncation)
- ▢ Responsive breakpoints driven by container width (CSS container queries or `hostContext.containerDimensions`), not the viewport
- ▢ Verify layout from ~320px up to wide inline widths (no overflow, no clipped chevrons/badges)

### Shared helpers

- ✅ `useGreeting()` — time bucket (morning/afternoon/evening/night) → label + icon, client-side clock
- ✅ `formatRelativeTime()` — "in 18 min", "1h ago"

### Reusable building blocks (`components/inline/`)

- ✅ `SummaryTile` — icon + title + primary/secondary text + chevron + `onClick`
- ✅ `InlineDetailHeader` — back arrow + title for drill-downs

### Root summary (`InlineSummary`)

- ✅ Intro line ("Here's your personalized summary for today.")
- ✅ `GreetingCard` — time-aware greeting + first name + matching icon (sun/moon)
- ✅ Next-meeting `SummaryTile` — subject, time range, "in X min", location/Teams
- ✅ Tasks-due `SummaryTile` — count + high-importance count
- ✅ Top-news `SummaryTile` — latest headline, category + relative time

### Drill-down views

- ✅ `MeetingsList` — next 5 meetings, back to summary, rows no-op _(later replaced by the shared `AgendaTimeline` — Phase 4)_
- ✅ `TasksList` — today's incomplete tasks with importance `Badge`, back to summary _(later replaced by the shared `TasksPanel` — Phase 4)_
- ✅ `NewsList` — latest news with thumbnails (`Image`), back to summary

### Wiring

- ✅ `MyDayInline` owns `view` state and routes summary ↔ drill-downs
- ✅ Keep existing `onRequestFullscreen` expand affordance

### Theming (host-driven dark/light)

- ✅ Detect the Copilot host theme from `hostContext.theme` (`'light'` | `'dark'`) — passed down as a prop, never read inside components
- ✅ Wrap the inline tree in `FluentProvider` with `webDarkTheme` for `'dark'`, `webLightTheme` otherwise (default to light when `theme` is undefined)
- ✅ Use Fluent v9 theme tokens (no hardcoded colors) so icons, cards, badges and text adapt automatically
- ✅ Re-render on host theme change (base class already re-renders on `onHostContextChanged`) — derive the provider theme from the prop on every render
- ✅ Verify both modes have sufficient contrast (greeting icon, priority badges, news thumbnails) — covered by the Phase 6 dark-mode contrast audit

## Phase 3 — Full-screen experience (React component structure)

> Build out `MyDayFullscreen.tsx` from the concept mockup (design input),
> consuming the **same mock data** as the inline view. A full-width, responsive dashboard
> with a headline **"Plan my day"** focus assistant. Theming inherits from the shared
> `MyDayThemeProvider` (host light/dark) — no second `FluentProvider`. Reuse the
> established card pattern (rounded corners, `shadow2` resting / `shadow8` hover) for
> visual consistency with inline. All deep-links / actions are **no-op in the mock**.

### Layout shell & responsive grid

- ✅ `MyDayFullscreen` root: full-width, scrollable column filling the host iframe (no fixed pixel width); comfortable max content width with gutters
- ✅ Responsive dashboard grid (CSS grid): **Agenda** | **Tasks + Important mail** | **News + Quick actions**
- ✅ Collapse gracefully as width shrinks (3-col → 2-col → single column), driven by container width (CSS media/container queries)
- ✅ `components/fullscreen/` folder for the new building blocks

### Hero / greeting row

- ✅ Large profile avatar — **real current user** via `resolveCurrentUser` (passed through props) — beside a time-aware greeting ("Good morning, Vesa! 👋") reusing `getGreeting`
- ✅ Full date line ("Wednesday, June 25, 2026") — **resolved dynamically from the live `now`** (`formatFullDate` via `toLocaleDateString` with weekday + long month, user locale); never hardcoded, always the current day
- ✅ Weather card (right): temperature, condition, location, AQI — **mock only** (see mock-data additions below)
- ✅ **Settings gear** aligned on the right of the hero row — opens the settings panel (see below)

### Settings panel (showcase only — storytelling)

> Right-side slide-in panel opened from the hero **gear**, showcasing the kind of
> configuration a user could adjust for the full-screen mode. **Purely illustrative for the
> demo** — the controls render and are interactive but **do not actually change anything**
> (no persistence, no effect on the dashboard). Important for the storytelling.

- ✅ `SettingsPanel` — same slide-in right-side drawer pattern as the Plan my day panel (reuse the shared `RightPanel` drawer shell); header ("Settings" + gear) + dismiss affordance
- ✅ Mutually exclusive with the Plan my day panel (only one right-side panel open at a time)
- ✅ **Weather units** — °F / °C toggle (switch) — ~~inert~~ **now live & session-persisted (Phase 5)**
- ✅ **Visible panels** — checkbox list to show/hide each primary panel (Agenda, Tasks, Important mail, News, Quick actions, **Plan my day**) — ~~inert~~ **now live & session-persisted; drives the layout (Phase 5)**
- ✅ **Weather location** — simple **City** and **Country** text inputs — ~~inert~~ **now session-persisted (Phase 5)**
- ✅ Add a subtle "settings are not saved in this demo" note so the inert behavior is clear — ~~inert note~~ **updated to call out session-only storage (Phase 5)**

### Agenda timeline (left column)

- ✅ `AgendaTimeline` — vertical time-rail with time labels and meeting entries (subject + location / Teams)
- ✅ Highlight the current / next meeting with a `Join` affordance (no-op)
- ✅ "View calendar" link + current/next badges
- ✅ Reuse the Phase 1 `IMeeting` view models (live-resolved `now`)

### Tasks card (middle column, top)

- ✅ `TasksPanel` — completion **ring** ("60% completed") + "N due today / M total"
- ✅ Checklist rows: checkbox, title, importance label; completed rows struck through (tickable, local state)
- ✅ "View all tasks" link

### Important mail card (middle column, bottom)

- ✅ `ImportantMail` — sender **face avatar** (bundled base64 photo, initials fallback), name, subject, preview, relative time
- ✅ Unread indicator dot; "Open Outlook" (no-op)
- ✅ Consume the Phase 1 `IMailItem` view models

### News wall (right column, top)

- ✅ `NewsWall` — 2×2 image-card grid (thumbnail, title, source + relative time, author byline) with graceful image fallback (reuse the inline `NewsThumb` fallback)
- ✅ "View all" link

### Quick actions (right column, bottom)

- ✅ `QuickActions` — tile row (Book room, New note, Time off): icon + title + description; **mock / no-op**

### Footer

- ✅ Static footer: "AI-generated content may be incorrect" + "Powered by Microsoft Graph" + "Give feedback"

### "Plan my day" — focus assistant (headline Phase 3 feature)

> Full-width banner at the bottom of the dashboard with a **"Plan my day"** button.
> Conceptually this triggers a **WorkIQ AI** call to decide what the user should focus on.
> Clicking it opens a **right-side panel** over the full-screen view with a beautifully
> formatted **prioritized focus summary** — **no chat**, just a read-only briefing.
> **In the sample the recommendations are generated deterministically from the mock data**
> (relevant + dynamic, shifting with the time of day) — **no real AI / WorkIQ API is called.**

- ✅ `PlanYourDayBanner` — full-width gradient marker: sparkle icon, "Start your day smart" headline, a **dynamic** one-liner derived from the data ("You have 4 meetings and 2 high-priority tasks ahead."), right-aligned `Plan my day` button
- ✅ Local UI state on `MyDayFullscreen`: `openPanel` + a brief **simulated "thinking"** state on click (spinner) before the summary renders — sells the AI feel without an API
- ✅ `PlanMyDayPanel` — slide-in right-side panel (Fluent drawer/overlay style): header ("Plan my day" + sparkle), dismiss affordance, scrollable body; the dashboard yields the remaining width while the panel is open
  - reuse the **shared right-side drawer shell** (`RightPanel`) also used by the settings panel (one open at a time)
- ✅ **Recommendation engine (mock, deterministic)** — `planMyDay(data, now): IFocusPlan` pure function:
  - rank the day's signals: high-importance tasks due today, the next/imminent meeting, unread important mail, available focus-time blocks
  - emit a **prioritized list** (3–5 items), each with: title, why-it-matters one-liner, suggested time/slot, source chip (Meeting / Task / Mail / Focus), importance accent
  - emit a one-paragraph **headline summary**
  - fully derived from the live-resolved mock (reuses `now`) so it stays current
- ✅ `IFocusPlan` view model + render it as a **beautiful summary** (numbered cards, accent rails, source icons) — read-only, no chat input
- ✅ Empty / light-day state ("You're in good shape — nothing urgent right now.")
- ✅ Disclaimer line in the panel (mirrors the real experience)

### Mock-data additions for full-screen

- ✅ `mockData/weather.ts` → static `weather` (temp, condition, location, AQI) + `IWeather` view model — **mock only**
- ✅ `mockData/quickActions.ts` → static quick-action tiles + `IQuickAction` view model — **mock only**
- ✅ Extend `IMyDayData` with optional `weather?` and `quickActions?`; `MockMyDayDataService` populates them

### Wiring & theming

- ✅ Extend `IMyDayFullscreenProps` (like inline) with `currentUser` + `theme`; `MyDayApp` routes `displayMode === 'fullscreen'` → `MyDayFullscreen` and passes `currentUser`
- ✅ Inherit theming from `MyDayThemeProvider` (no second `FluentProvider`)
- ✅ Verify light / dark contrast across the dashboard, banner, and plan panel — covered by the Phase 6 dark-mode contrast audit

## Phase 4 — Shared UI building blocks & theming

- ✅ Reusable building blocks shared by both views where sensible — the full-screen `AgendaTimeline` and `TasksPanel` now back the inline meetings/tasks drill-downs (news kept as a separate inline listing; weather/quick-actions remain full-screen only)
- ✅ UI stack decided: **Fluent UI v9** (`@fluentui/react-components` + `@fluentui/react-icons`); `@pnp/spfx-controls-react` not needed for this scenario
- ✅ Pass `hostContext.theme` (`light`/`dark`) through props into both views
- ✅ Apply theme to shared components (single `MyDayThemeProvider` / `FluentProvider`; Fluent v9 tokens throughout)

### Shared agenda & tasks controls (inline reuses the full-screen UX)

- ✅ Inline **meetings** drill-down now renders the full-screen `AgendaTimeline` control (single design/source of truth)
- ✅ Inline **tasks** drill-down now renders the full-screen `TasksPanel` control (completion ring + checklist)
- ✅ Deleted the old inline-only `MeetingsList` and `TasksList` components
- ✅ `InlineDetailHeader` title made optional so the reused card's own title isn't duplicated (back affordance only)
- ✅ **News kept separate**: inline retains its own `NewsList` listing (not the full-screen `NewsWall`)

## Phase 5 — Session-persisted settings demo & UX polish

> Show how full-screen settings can **impact the dashboard** by persisting them to the
> **browser session** (`sessionStorage`) — **intentionally** session-scoped for the demo
> (remembered for the current session, forgotten when it ends; no server-side storage).
> Plus a round of accessibility / UX fixes on the full-screen view.

### Session-backed settings store

- ✅ `utils/settings.ts` — `IMyDaySettings` (`useFahrenheit`, `city`, `country`, `visiblePanels`) + `DEFAULT_SETTINGS`
- ✅ `loadSettings` / `saveSettings` over `sessionStorage` (guarded for sandboxed/embedded hosts)
- ✅ `useMyDaySettings()` hook — initializes from the session and writes every change back
- ✅ `MyDayFullscreen` reads settings from the hook and shares them across the view

### Settings panel — now live (supersedes the earlier inert controls)

- ✅ `SettingsPanel` is **controlled** by the session settings via `settings` + `onChange` props
- ✅ **Temperature unit** toggle now persists to the session and applies live to the weather card
- ✅ **City / Country** inputs persist to the session
- ✅ City and Country stacked on separate rows (no horizontal scrollbar in the panel)
- ✅ Footnote reworded to call out **session-only** storage ("not saved permanently")

### Dynamic, visibility-driven dashboard layout

- ✅ `visiblePanels` added to `IMyDaySettings` (session-persisted; defaults to all panels shown)
- ✅ **Visible panels** checkboxes now write the visible set to the session settings
- ✅ `MyDayFullscreen` renders each panel conditionally from `settings.visiblePanels` (Agenda / Tasks / Mail / News / Quick actions / Plan my day)
- ✅ Grid switched to `repeat(auto-fit, minmax(320px, 1fr))` — re-flows to the number of visible columns **and** the available width (3 → 2 → 1) without fixed breakpoints
- ✅ Empty columns are dropped so remaining panels expand to fill the space
- ✅ Guard: at least one panel must stay visible (last checkbox is disabled) so the dashboard is never empty
- ✅ Settings changes update the dashboard live within the session

### Weather card reflects the setting

- ✅ `WeatherCard` / `FullscreenHero` take a `useFahrenheit` prop
- ✅ Weather card shows the selected unit as the **primary** temperature (other unit secondary)
- ✅ Toggling °C / °F in settings updates the hero weather instantly and survives reloads within the session

### Full-screen accessibility / UX fixes

- ✅ Quick actions tiles — explicit foreground token so labels stay readable (white) in **dark mode**
- ✅ Footer "Give feedback" is a real link to `https://aka.ms/spfx/issues` (opens in a new tab, `rel="noopener noreferrer"`)

---

## Phase 6 — Showcase polish (candidate optimizations, to evaluate)

> Final-polish review before this ships as the flagship Copilot Apps public-preview sample.
> Goal is a **"wow" showcase story**, not technical teaching (other samples cover the how-to),
> so weight these toward first impression, narrative coherence and demo reliability. These are
> **suggestions to pick from** — not yet committed.

### First impression & motion (highest wow-per-effort)

- ✅ Subtle **staggered entrance** for inline card and full-screen panels (fade/slide-in), so the dashboard feels "alive" as it renders
- ✅ Smooth **inline → full-screen** transition polish (each view/panel animates in on mount; inline drill-downs fade on view change) — no hard swap
- ✅ Respect `prefers-reduced-motion` for all new animation (accessibility + projector safety)
- ✅ Personalize the greeting further (real name + photo already used) — weekday/weekend, Monday/Friday and late-night / early-morning sub-line variants so any demo time looks intentional

### "Plan my day" — make it the hero moment

- ✅ Upgrade the "thinking" state to a **staged/streamed reveal** of recommendations (brief think → items stream in one by one; sells the AI feel without a real call)
- ✅ Reference the **real signed-in user's name** and time of day in the briefing headline (e.g. "Good morning, Vesa. You have … this morning. Start with …")
- ✅ Add a tasteful **gradient shimmer** accent at the top of the panel while generating (reduced-motion safe)

### Narrative coherence of the mock data (curate a tight story)

- ✅ Curate meetings + tasks + mail + news so they **tell one connected story** — themed around shipping the **My Day Copilot App**: the "Design Review — My Day Copilot App" meeting ties to the `Review PR #482 — inline view` and `Polish the My Day demo script` tasks, Megan's flagged "Re: My Day demo script" mail, tomorrow's "Keynote Run-through" meeting, and the "SharePoint Copilot Apps — early access" news post; so Plan my day reads as insightful, not random
- ✅ Verify the day always looks **forward-biased and "today"** — all times are relative offsets; removed the one hard-coded clock reference ("2:30 sync" → "afternoon sync") so nothing can drift out of sync
- ✅ Ensure **all imagery is bundled/offline** — faces already embedded base64; **news thumbnails now bundled** as base64 data URIs (`newsImages.ts`, real royalty-free Lorem Picsum photos, ~205 KB) so there are **no external image references at runtime** and a live demo can never show a broken thumbnail
- ✅ Keep names/companies consistently **Contoso** and realistic — meetings now use the standard M365 demo personas (`people.ts`) instead of one-off names (Aria Patel, Scrum Bot, Lena Hoffmann, …); mail/news already did

### Visual finish & consistency

- ✅ Match the **weather glyph/condition** to time of day — `WeatherCard` now picks a condition- and day/night-aware icon (sunny / moon / partly-cloudy day+night / cloudy / rain / snow) with a warm/cool accent instead of one static icon
- ✅ Audit **dark-mode contrast** — confirmed every panel/badge/ring/banner/Plan-my-day card is Fluent v9 **token-based** (no hard-coded text colors; brand surfaces use `colorNeutralForegroundOnBrand`); tightened the `GreetingCard` gradient to `backgroundImage` so theme switches can't reset the background color
- ✅ Confirm **empty / light-day states** look intentional and positive — reworded agenda / important-mail / news empty copy to encouraging lines ("enjoy the open calendar", "you're all caught up on important mail", …)
- ✅ Scale gracefully on **large / projector displays** — the full-screen content max-width now steps up (1280 → 1440 → 1680px) at ≥1728px and ≥2160px so big screens use the canvas instead of wide empty margins

### Tool input coherence (sample credibility) — deferred to a future version

> **Intentionally skipped for now.** The placeholder `message` property stays as-is; tool inputs
> will be reworked in a future version around real user intent (different properties), so we are not
> touching the schema in this pass.

- ▢ Replace the placeholder `message` Zod property with a **meaningful, described input** (e.g. optional `focus` / `section` deep-link hint) or remove it — it is currently threaded through but unused
- ▢ Make sure the manifest tool description sells the experience (drives when Copilot invokes it)

### Demo enablement (README + agent)

- ✅ Add a short **"60-second demo script"** to the README (invoke → personal hook → expand → Plan my day → settings re-flow → dark mode)
- ▢ Add a conversation starter that lands **directly in the full dashboard** ("Open my full dashboard") — deferred to the next phase (revisit with the conversation-starter story)
- ✅ Screenshots + demo placeholders wired into the one-per-row README layout and `sample.json` thumbnails (real captures tracked separately under Docs & cleanup)

### Demo reliability

- ✅ Graceful behavior when the host **theme flips mid-demo** — `MyDayThemeProvider` derives the Fluent theme purely from the `theme` prop and keeps a **stable key** after startup, so a theme change only swaps Fluent tokens (no remount, no flicker); task toggles, the Plan-my-day stream and open panels are preserved
- ✅ Component **tears down cleanly** and re-renders without stale state — `onTeardown` unmounts React; the only timers (Plan-my-day thinking/stream) are cleared in their effect cleanup and there are no event listeners; the base class re-renders the same tree on host-context changes (reconciled, state preserved), while a fresh invocation re-initializes state (settings persist in session by design)
- ✅ First-render performance sanity-checked — render path is **synchronous** (no network, no heavy compute; data resolved from the in-bundle mock, user from page context); production bundle is ~759 KB as a single asset, of which ~400 KB is the **intentionally bundled base64 imagery** (faces + news) for offline reliability

---

## Deferred — Dynamic data / API integration

> Picked up only after the UX is complete against mock data.

### Tool input schema (Copilot Component conventions)

- ▢ Revisit `MyDayCopilotComponentProperties.ts` — replace placeholder `message` with real tool inputs (e.g. `useMock`, optional focus/section hint) using Zod `.describe()`

### Swappable data service (README: "Data source")

- ▢ `IMyDayDataService` interface — one contract, two implementations (returns the **view models** from Phase 1)
- ▢ `MockMyDayDataService` — serves the Phase 1 Graph-shaped mock through the same mapper
- ▢ `GraphMyDayDataService` — PnPjs v4, reusing the Phase 1 `graph → view model` mapper:
  - calendar → `/me/events` or `/me/calendarView` (Graph `event`)
  - tasks → `/me/todo/lists/{id}/tasks` (Graph `todoTask`); README also notes `/me/planner/tasks` — reconcile source
  - news → `/sites/{id}/pages/microsoft.graph.sitePage` (SharePoint news posts)
  - mail → `/me/messages` (Graph `message`, e.g. `$filter=importance eq 'high'` / unread)
  - user → `/me` + `/me/photo/$value`
- ▢ Service factory — selects mock vs. live from a `useMock` flag

### "Plan my day" — live WorkIQ integration (replaces the mock recommendation engine)

- ▢ Replace `planMyDay(data, now)` mock with a real **WorkIQ** call that returns the prioritized focus plan (same `IFocusPlan` shape, so the panel UI is unchanged)
- ▢ Confirm the WorkIQ endpoint / auth path available from the Copilot component context; map its response to `IFocusPlan`
- ▢ Keep the simulated "thinking" state as the real loading state; preserve the disclaimer line

### PnPjs initialization

- ▢ Add singleton `getSP` / `getGraph` helper initialized from the Copilot component context
- ▢ Confirm the `SPFx` behavior accepts the Copilot component context shape
- ▢ Wire init in the component before first render

### Data loading & state

- ▢ Decide where data is fetched (component `onInit` vs. React hook) and how it flows as props (no mirrored host state)

### Sample data + provisioning

- ▢ Materialize `sampledata/` JSON (from the Phase 1 mock)
- ▢ Optional PnP provisioning template for the `News` list

---

## Docs & cleanup

- ✅ Revise `README.md` to match the built solution (Summary, Features, experiences, data-source story, solution structure) + a 60-second demo script
- ✅ Author `assets/sample.json` for the sample gallery — author (Vesa Juvonen) filled in; thumbnails reconciled to the real assets (introduction, inline, full-screen, settings, dark)
- ✅ Real captures in `assets/` — `introduction.png`, `screenshot-inline.png`, `screenshot-fullscreen.png`, `screenshot-settings.png`, `screenshot-dark.png` (demo GIF dropped in favor of stills; README image links reconciled)
- ✅ Fill in README author + version-history date (Vesa Juvonen · 1.0 · 7.2.2026)
- ✅ Remove the now-redundant `README-myday.md` (not present — nothing to remove)
- ✅ Repackage the production `.sppkg` with all final changes and commit it as the ready-to-deploy demo package

### Reusable playbook for similar scenario samples (Copilot Apps go-live)

> This sample is the **reference template** for the next "wow" scenario samples. The full,
> agent-optimized rules live in **[agentic-creation-rules.md](./agentic-creation-rules.md)** — use it to
> generate the next sample's `todo.md` from a UX design and implement to the same quality bar. The list
> below is the quick recap (a recipe, not a task list). ✅ = this sample demonstrates it end-to-end.

**Scaffold & build**

- ✅ Scaffold a Copilot Component with the SPFx generator (Heft + rig, React 17, **no property pane**)
- ✅ Commit the built **`.sppkg`** for mock-data samples so anyone can deploy/demo without building — un-ignore just the package in `.gitignore` (keep build junk ignored)

**Architecture & rendering**

- ✅ Split **inline** vs. **full-screen** into separate views behind a thin root selector; expand via `requestDisplayModeAsync`
- ✅ Derive all UI from props (`hostContext` + tool inputs); never mirror host state locally
- ✅ Reuse the same building-block controls across views where it makes sense (here: `AgendaTimeline` / `TasksPanel`)

**Theming**

- ✅ Theme from `hostContext.theme` via a **single** `FluentProvider`; use Fluent v9 tokens (no hard-coded colors); prefer `backgroundImage` over the `background` shorthand
- ✅ Keep the provider key stable after startup so a mid-demo theme flip re-themes without a remount/flicker

**Data**

- ✅ Model data with **Graph-shaped mocks** behind an `I…DataService` interface (mock first, live Graph as a drop-in), with a thin `graph → view model` mapper
- ✅ Author entities with **relative time offsets** resolved against `now` so the demo is always "today" and forward-biased
- ✅ Curate the mock into **one connected story** with consistent M365 demo personas so any AI/summary feature reads as insightful

**Signature "hero" feature**

- ✅ Add a signature feature (here **Plan my day**) generated **deterministically** from the mock — no real API
- ✅ Sell the AI feel: brief "thinking" → **staged/streamed reveal**, personalized headline (real name + time of day), a tasteful shimmer

**Configuration impact (optional but high-value)**

- ✅ Demonstrate settings shaping the UX via **session-persisted** state (`sessionStorage`) — e.g. a live unit toggle and a **visibility-driven, re-flowing** layout; call out "session only, not saved"

**Motion & first impression**

- ✅ Subtle **staggered entrance** for cards/panels; smooth view transitions — all guarded by `prefers-reduced-motion`

**Offline reliability**

- ✅ Bundle **all imagery** as base64 (faces **and** thumbnails) so there are **no external references** at runtime — a live demo can never show a broken image
- ✅ Keep the render path synchronous (no network/heavy work on first render)

**Accessibility & finish**

- ✅ Dark-mode contrast audit; real links (`target="_blank"` + `rel="noopener noreferrer"`); readable foreground tokens; positive empty/light-day states; large/projector scaling

**Demo enablement & docs**

- ✅ Write the README from the PnP sample template; add a **"60-second demo script"** and screenshot placeholders early
- ✅ Author `assets/sample.json` (PnP gallery schema: descriptions, products, metadata, thumbnails, references)
- ✅ Keep a `todo.md` build log (phased, with a visual ▢/🔶/✅ legend) as the running reference point

---

## Open decisions

1. ~~**Fluent UI version**~~ → **Decided: Fluent UI v9** (`@fluentui/react-components`, React 17 compatible)
2. **`useMock` location** — Zod tool property vs. build constant? (deferred phase)
3. **Data fetch location** — component `onInit` vs. a React hook inside `MyDayApp`? (deferred phase)
