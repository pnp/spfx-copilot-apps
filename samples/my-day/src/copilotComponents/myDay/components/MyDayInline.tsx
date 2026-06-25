import * as React from 'react';

import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';

/**
 * Props for the {@link MyDayInline} view rendered when the host display mode is
 * `'inline'`.
 */
export interface IMyDayInlineProps extends IMyDayCopilotComponentProperties {
  /** Color theme advertised by the Copilot host. */
  theme?: SPCopilotTheme;
  /** Requests the host to switch the component into fullscreen. */
  onRequestFullscreen?: () => void;
}

/**
 * Inline display-mode view.
 */
const MyDayInline: React.FunctionComponent<IMyDayInlineProps> = () => {
  return <div data-display-mode="inline">inline mode experience</div>;
};

export default MyDayInline;
