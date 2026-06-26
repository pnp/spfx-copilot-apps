import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';

import MyDayApp from './components/MyDayApp';
import type { IMyDayCopilotComponentProperties } from './MyDayCopilotComponentProperties';
import { resolveCurrentUser } from './services/CurrentUserService';

export default class MyDayCopilotComponent extends BaseCopilotComponent<IMyDayCopilotComponentProperties> {
  protected render(): void {
    const element: React.ReactElement = React.createElement(MyDayApp, {
      message: this.properties.message,
      currentUser: resolveCurrentUser(this.context),
      theme: this.hostContext.theme,
      displayMode: this.hostContext.displayMode,
      availableDisplayModes: this.hostContext.availableDisplayModes,
      onRequestFullscreen: this._handleRequestFullscreen
    });

    ReactDOM.render(element, this.context.domElement);

  }

  protected onTeardown(reason: string | undefined): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.context.domElement);
    return super.onTeardown(reason);
  }

  private _handleRequestFullscreen = (): void => {
    this.requestDisplayModeAsync('fullscreen').catch(() => {
      /* Host rejected or is unavailable; host context stays unchanged. */
    });
  };
}
