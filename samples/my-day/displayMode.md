# `displayMode` — developer guide for SPFx Copilot Components

> Status: experimental — based on the in-development SPFx Copilot Component model. APIs may change.
>
> Reference source: [`BaseCopilotComponent.ts` on `main`](https://onedrive.visualstudio.com/ODSP-Web/_git/odsp-web?path=/sp-client/spfx-core/sp-copilot-component/src/BaseCopilotComponent.ts&version=GBmain&_a=contents)
>
> Worked example: [`HelloWorld` sample](./HelloWorld) in this folder.

## TL;DR

- `this.hostContext.displayMode` tells you the current container layout the Copilot host has chosen (typically `'inline'` or `'fullscreen'`).
- To go **inline → fullscreen**: call `this.requestDisplayModeAsync('fullscreen')`. That is the only direction supported.
- To go **fullscreen → inline**: you don't. The host owns collapsing. The user clicks the host's own collapse affordance, and your component finds out via `onHostContextChanged`.
- Never request a mode the host hasn't advertised in `this.hostContext.availableDisplayModes`.
- Don't try to mirror `displayMode` into local state. Read it straight from `this.hostContext` on every render — the base class keeps it fresh.

## 1. What is `displayMode`?

`displayMode` is a field on the **host context** — the static-ish snapshot of environment information the Copilot host delivers to your component at initialization and then keeps up to date through change notifications.

```ts
this.hostContext: ICopilotComponentHostContext = {
  theme,                  // 'light' | 'dark'
  displayMode,            // e.g. 'inline' | 'fullscreen' (currently those two)
  availableDisplayModes,  // string[] — what the host is willing to switch to
  containerDimensions,    // { width?, height?, maxWidth?, maxHeight? }
  platform,               // 'web' | 'desktop' | 'mobile'
  deviceCapabilities      // { touch?, hover? }
};
```

It mirrors a subset of the MCP Apps [`McpUiHostContext`](https://apps.extensions.modelcontextprotocol.io/api/interfaces/spec.types.McpUiHostContext.html) shape.

### How a `displayMode` change reaches your component

```
┌──────────────┐                                                ┌──────────────────────┐
│ Copilot host │ ──ui/notifications/host-context-changed──▶    │     SPFx loader      │
└──────────────┘     { displayMode: 'fullscreen' }              └──────────┬───────────┘
                                                                           │
                                                                           ▼
                                  BaseCopilotComponent._internalNotifyHostContextChanged(diff)
                                                                           │
                                          shallow-merges diff into this.hostContext
                                                                           │
                                                            calls onHostContextChanged(diff)   ← optional override
                                                                           │
                                                                  calls render()
```

Two things to take from that flow:

1. **The base class re-renders automatically** when the host context changes. You don't need to override `onHostContextChanged` just to react to mode flips.
2. **`onHostContextChanged` runs *before* the re-render**, so it's the right place to do any imperative pre-render work (cancelling timers, recalculating computed fields, etc.) — not for triggering `render()` yourself.

## 2. The asymmetry — read this before designing UI

`BaseCopilotComponent.requestDisplayModeAsync` is typed:

```ts
protected async requestDisplayModeAsync(
  mode: 'fullscreen'
): Promise<ISPRequestDisplayModeResult>;
```

The signature literally only accepts `'fullscreen'`. From the JSDoc:

> Only `'fullscreen'` is accepted; M365 Copilot does not honor other modes as request targets. Most display-mode transitions are host-initiated (user clicks the host's expand affordance) and arrive via `onHostContextChanged` — use this method only when the component itself needs to trigger fullscreen (e.g. a video player on play).

What this means in practice:

| You want to…                              | Who does it                                | How                                                                |
| ----------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| Expand from inline to fullscreen          | Component (or user via host UI)            | `await this.requestDisplayModeAsync('fullscreen')`                 |
| Collapse from fullscreen back to inline   | **Host only** — user clicks host affordance | You do nothing. `onHostContextChanged` fires when it happens.      |
| Detect any mode change                    | The framework                              | Re-renders automatically; read `this.hostContext.displayMode`.     |

If you try to call `this.requestDisplayModeAsync('inline')`, TypeScript will reject it at compile time. There is intentionally no escape hatch — collapsing belongs to the host.

When your component is in fullscreen, the right UX is to **make the limitation visible** rather than show a dead button. The HelloWorld sample renders a small disabled pill *"Fullscreen · use host control to collapse"* in that state.

## 3. How to add an Expand button

The pattern has three parts: a class-side handler, the React tree, and a small piece of defensive rendering logic.

### 3a. Class-side: the handler

```ts
// HelloWorldCopilotComponent.tsx (excerpt)
private _handleRequestFullscreen = async (): Promise<void> => {
  await this.requestDisplayModeAsync('fullscreen');
};
```

That's it. **Do not optimistically mutate any local state** here. The host may honor or deny the request. Either way, the next `onHostContextChanged` notification will arrive with the real `displayMode`, the base class will re-render, and your React tree will see the truth via props.

If you care about denial — e.g. for telemetry or to show a toast — inspect the resolved `ISPRequestDisplayModeResult`:

```ts
const result = await this.requestDisplayModeAsync('fullscreen');
// result tells you the mode that actually took effect.
```

Wire the handler down into your render tree alongside the other host-context fields you care about:

```tsx
protected render(): void {
  if (!this.context?.domElement) return;

  ReactDOM.render(
    <HelloWorldApp
      message={this.properties.message}
      theme={this.hostContext.theme === 'dark' ? 'dark' : 'light'}
      displayMode={this.hostContext.displayMode}
      availableDisplayModes={this.hostContext.availableDisplayModes}
      onRequestFullscreen={this._handleRequestFullscreen}
    />,
    this.context.domElement
  );
}
```

### 3b. React side: the conditional control

The button should appear whenever you might offer expansion, but it should reflect whether the host will actually accept the request:

- **Already in fullscreen**: replace the button with a disabled indicator so the user can see the state and how to get out (collapsing belongs to the host).
- **Host hasn't advertised `'fullscreen'` in `availableDisplayModes`**: keep the button visible but **disabled**, with a tooltip explaining why. Don't fire the request.
- **Otherwise**: enabled button.

```tsx
// HelloWorldApp.tsx (excerpt)
interface IDisplayModeControlProps {
  displayMode: 'inline' | 'fullscreen' | string | undefined;
  availableDisplayModes: ReadonlyArray<string> | undefined;
  onRequestFullscreen: () => void;
}

function DisplayModeControl(props: IDisplayModeControlProps): React.ReactElement {
  if (props.displayMode === 'fullscreen') {
    return (
      <span title="Use the Copilot host's collapse control to return to inline.">
        Fullscreen · use host control to collapse
      </span>
    );
  }

  const hostSupportsFullscreen =
    !!props.availableDisplayModes &&
    props.availableDisplayModes.indexOf('fullscreen') !== -1;

  return (
    <button
      type="button"
      onClick={props.onRequestFullscreen}
      disabled={!hostSupportsFullscreen}
      title={
        hostSupportsFullscreen
          ? 'Switch to fullscreen.'
          : "The host hasn't advertised 'fullscreen' as available."
      }
    >
      ⛶ Expand
    </button>
  );
}
```

Place this control wherever your top-bar lives. The HelloWorld sample uses a simple flex header so it always sits in the top-right:

```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
  <div>{/* title, theme/mode indicator, … */}</div>
  <DisplayModeControl {...props} />
</div>
```

A flex header is generally preferable to `position: absolute` for a top-right control — it doesn't fight with text wrapping, theme padding, or future toolbar items.

### 3c. The three rules

1. **Read mode from `this.hostContext`**, not from cached local state. The base class keeps it current.
2. **Do not optimistically mutate** anything after calling `requestDisplayModeAsync`. Let the host's next notification drive the next render.
3. **Respect `availableDisplayModes`.** It is the host's contract about what transitions are valid right now. Either hide the trigger, or — recommended — show it disabled with a tooltip so the limitation stays discoverable.

## 4. What happens after `requestDisplayModeAsync('fullscreen')`?

Three possible flows:

| Flow              | What you see                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Host honors       | `ISPRequestDisplayModeResult` resolves with the new mode → `onHostContextChanged({ displayMode: 'fullscreen' })` → re-render. |
| Host denies       | `ISPRequestDisplayModeResult` resolves carrying the *unchanged* current mode. No `onHostContextChanged` fires.            |
| Host later collapses (user-driven) | `onHostContextChanged({ displayMode: 'inline' })` → re-render. Your button reappears.                       |

You only ever drive the *request*. You never own the resulting state — that's the host's job, communicated back through `hostContext` and the notification channel.

## 5. References

- [`BaseCopilotComponent.ts` on `main`](https://onedrive.visualstudio.com/ODSP-Web/_git/odsp-web?path=/sp-client/spfx-core/sp-copilot-component/src/BaseCopilotComponent.ts&version=GBmain&_a=contents) — the source of truth for the API contract, including the `requestDisplayModeAsync` signature and JSDoc.
- [`sp-copilot-component` package on `main`](https://onedrive.visualstudio.com/ODSP-Web/_git/odsp-web?path=%2Fsp-client%2Fspfx-core%2Fsp-copilot-component&version=GBmain&_a=contents) — the full package, including `SPCopilotBridge.ts` for the underlying transport.
- [MCP Apps spec — `McpUiHostContext`](https://apps.extensions.modelcontextprotocol.io/api/interfaces/spec.types.McpUiHostContext.html) — the upstream shape that `ICopilotComponentHostContext` mirrors.
- [HelloWorld sample](./HelloWorld) in this folder — a complete worked example: top-right Expand button, fullscreen pill, theme-aware palette, click counter to demonstrate `render()`-driven state changes.
