import * as React from 'react';

import type { SPCopilotDisplayMode, SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';
import MyDayFullscreen from './MyDayFullscreen';
import MyDayInline from './MyDayInline';

/**
 * Props for the {@link MyDayApp} root React component.
 *
 * Tool inputs supplied by Copilot ({@link IMyDayCopilotComponentProperties}) are
 * spread in directly, while host state (theme, display mode) and host-driven
 * actions are passed alongside them. The component derives all of its UI from
 * these props — it never mirrors host state internally.
 */
export interface IMyDayAppProps extends IMyDayCopilotComponentProperties {
  /** Color theme advertised by the Copilot host. */
  theme?: SPCopilotTheme;
  /** Container display mode advertised by the Copilot host. */
  displayMode?: SPCopilotDisplayMode;
  /** Display modes the host supports. */
  availableDisplayModes?: SPCopilotDisplayMode[];
  /** Requests the host to switch the component into fullscreen. */
  onRequestFullscreen?: () => void;
}

/**
 * Baseline root component rendered into the Copilot host DOM element.
 *
 * Selects the display-mode-specific view ({@link MyDayInline} or
 * {@link MyDayFullscreen}) from the host-advertised display mode.
 */
const MyDayApp: React.FunctionComponent<IMyDayAppProps> = (props) => {
  const { message, theme, displayMode, onRequestFullscreen } = props;

  if (displayMode === 'fullscreen') {
    return <MyDayFullscreen message={message} theme={theme} />;
  }

  return <MyDayInline message={message} theme={theme} onRequestFullscreen={onRequestFullscreen} />;
};

export default MyDayApp;
