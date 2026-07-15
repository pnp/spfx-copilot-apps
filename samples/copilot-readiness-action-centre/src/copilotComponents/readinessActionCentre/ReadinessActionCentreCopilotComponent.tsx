import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import ReadinessApp from './components/ReadinessApp';
import type { IReadinessActionCentreProperties } from './ReadinessActionCentreCopilotComponentProperties';
import { resolveCurrentUser } from './services/CurrentUserService';

/**
 * Thin SPFx entry point (agentic-creation-rules §4).
 * Host state is passed as props; React owns the tree; unmount on teardown.
 */
export default class ReadinessActionCentreCopilotComponent extends BaseCopilotComponent<IReadinessActionCentreProperties> {
  protected render(): void {
    const element: React.ReactElement = React.createElement(ReadinessApp, {
      ...this.properties,
      currentUser: resolveCurrentUser(this.context),
      theme: this.hostContext.theme,
      displayMode: this.hostContext.displayMode,
      availableDisplayModes: this.hostContext.availableDisplayModes,
      siteFallbackUrl: this.context.pageContext.web.absoluteUrl,
      spHttpClient: this.context.spHttpClient,
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
      /* Host rejected or unavailable; host context stays unchanged. */
    });
  };
}
