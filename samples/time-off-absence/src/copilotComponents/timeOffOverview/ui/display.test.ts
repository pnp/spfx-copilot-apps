import { shouldShowExpand, isFullscreen } from './display';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

describe('shouldShowExpand', () => {
  it('shows Expand in the inline default', () => {
    expect(shouldShowExpand('inline')).toBe(true);
  });

  it('hides Expand once the host reports fullscreen', () => {
    expect(shouldShowExpand('fullscreen')).toBe(false);
  });

  it('shows Expand when the host has not advertised a display mode', () => {
    expect(shouldShowExpand(undefined)).toBe(true);
  });

  it('only the explicit fullscreen value hides the button', () => {
    // Defensive against a future/unknown mode: anything that is not the literal
    // 'fullscreen' keeps the in-tree Expand affordance visible.
    expect(
      shouldShowExpand('sidebar' as unknown as SPCopilotDisplayMode)
    ).toBe(true);
  });
});

describe('isFullscreen', () => {
  it('is true only when the host reports fullscreen', () => {
    expect(isFullscreen('fullscreen')).toBe(true);
  });

  it('is false in the inline default', () => {
    expect(isFullscreen('inline')).toBe(false);
  });

  it('is false when no display mode is advertised', () => {
    expect(isFullscreen(undefined)).toBe(false);
  });

  it('treats an unknown mode as not fullscreen', () => {
    expect(
      isFullscreen('sidebar' as unknown as SPCopilotDisplayMode)
    ).toBe(false);
  });
});
