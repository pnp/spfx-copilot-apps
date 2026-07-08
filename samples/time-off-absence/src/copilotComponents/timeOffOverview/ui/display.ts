// Tiny presentation predicate shared by all three Time-Off Copilot Components.
//
// Each component renders its own in-tree "Expand" button to ASK the host to go
// fullscreen. Once the host has put the component INTO fullscreen it provides
// its own affordance to collapse back to inline, so the in-tree Expand button is
// redundant (and confusing) there. Hide it whenever we are already fullscreen;
// keep it for the inline default and when the host has not advertised a mode yet.

import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

export function shouldShowExpand(displayMode?: SPCopilotDisplayMode): boolean {
  return displayMode !== 'fullscreen';
}

// True once the host has actually put the component into fullscreen. The Overview
// uses this to switch its body from the inline stacked lists to the two-column
// (lists + off-work calendar) layout. Only the explicit 'fullscreen' literal
// counts, so an unknown/future mode falls back to the inline layout.
export function isFullscreen(displayMode?: SPCopilotDisplayMode): boolean {
  return displayMode === 'fullscreen';
}
