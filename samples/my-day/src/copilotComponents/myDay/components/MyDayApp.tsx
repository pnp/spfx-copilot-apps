import * as React from 'react';

import type { SPCopilotDisplayMode, SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';
import type { IUser } from '../models/myDay';
import MyDayFullscreen from './MyDayFullscreen';
import MyDayInline from './MyDayInline';
import MyDayThemeProvider from './MyDayThemeProvider';

/**
 * Props for the {@link MyDayApp} root React component.
 *
 * Tool inputs supplied by Copilot ({@link IMyDayCopilotComponentProperties}) are
 * spread in directly, while host state (theme, display mode) and host-driven
 * actions are passed alongside them. The component derives all of its UI from
 * these props — it never mirrors host state internally.
 */
export interface IMyDayAppProps extends IMyDayCopilotComponentProperties {
  /** Signed-in user resolved from the SPFx page context. */
  currentUser?: IUser;
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
  const { message, currentUser, theme, displayMode, onRequestFullscreen } = props;

  const view =
    displayMode === 'fullscreen' ? (
      <MyDayFullscreen message={message} currentUser={currentUser} theme={theme} />
    ) : (
      <MyDayInline
        message={message}
        currentUser={currentUser}
        theme={theme}
        onRequestFullscreen={onRequestFullscreen}
      />
    );

  return <MyDayThemeProvider theme={theme}>{view}</MyDayThemeProvider>;
};

export default MyDayApp;
