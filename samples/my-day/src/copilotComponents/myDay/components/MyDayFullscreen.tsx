import * as React from 'react';

import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';

/**
 * Props for the {@link MyDayFullscreen} view rendered when the host display mode
 * is `'fullscreen'`.
 */
export interface IMyDayFullscreenProps extends IMyDayCopilotComponentProperties {
  /** Color theme advertised by the Copilot host. */
  theme?: SPCopilotTheme;
}

/**
 * Fullscreen display-mode view.
 */
const MyDayFullscreen: React.FunctionComponent<IMyDayFullscreenProps> = () => {
  return <div data-display-mode="fullscreen">fullscreen mode experience</div>;
};

export default MyDayFullscreen;
