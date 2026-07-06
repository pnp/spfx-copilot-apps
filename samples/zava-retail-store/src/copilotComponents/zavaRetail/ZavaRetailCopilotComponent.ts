import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';

import type { IZavaRetailCopilotComponentProperties } from './ZavaRetailCopilotComponentProperties';
import { parseBoolean, parseOptionalString, parseTargetStore, parseTheme } from './propertyParsers';
import ZavaRetailApp from './ZavaRetailApp';

export default class ZavaRetailCopilotComponent extends BaseCopilotComponent<IZavaRetailCopilotComponentProperties> {
  protected render(): void {
    const element: React.ReactElement = React.createElement(ZavaRetailApp, {
      context: this.context,
      message: this.properties.message,
      displayMode: String(this.hostContext.displayMode),
      initialUseMock: parseBoolean(this.properties.useMock, true),
      initialDataServiceUrl: parseOptionalString(this.properties.dataServiceUrl),
      initialTargetStore: parseTargetStore(this.properties.targetStore),
      theme: parseTheme(this.hostContext.theme),
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
      /* Host rejected or is unavailable; host context remains unchanged. */
    });
  };
}
