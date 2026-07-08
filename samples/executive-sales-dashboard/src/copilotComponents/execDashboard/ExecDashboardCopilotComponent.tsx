import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';

import ExecDashboard from './components/ExecDashboard';
import type { IExecDashboardProps } from './components/IExecDashboardProps';
import type { IExecDashboardCopilotComponentProperties } from './ExecDashboardCopilotComponentProperties';
import type { ICurrentUser } from './models/dashboard';
import { getGraphCurrentUser, getMockCurrentUser } from './services/CurrentUserService';

import * as strings from 'ExecDashboardCopilotComponentStrings';

/**
 * SPFx Copilot Component that renders the Executive Sales & Revenue Dashboard.
 *
 * The component is a thin host adapter: it resolves the site context, provides
 * a current-user resolver (mock persona vs Microsoft Graph `/me`) and passes
 * the host state, bridge and configuration down to the React tree. All data
 * loading, the inline/full-screen switch, theming and the settings panel live
 * in the React layer (`ExecDashboard`).
 *
 * Lifecycle:
 *  1. `onInit()` — resolves the site title/URL (runs once before first render).
 *  2. `render()` — mounts the React tree into `this.context.domElement`.
 *  3. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class ExecDashboardCopilotComponent extends BaseCopilotComponent<IExecDashboardCopilotComponentProperties> {
  private _siteTitle: string = '';
  private _siteUrl: string = '';

  protected async onInit(): Promise<void> {
    this._siteUrl = this.context.pageContext.web.absoluteUrl;

    // Fetch site info from SharePoint REST API (brokered SSO). Wrapped in
    // try/catch so the component still renders in the workbench.
    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        `${this._siteUrl}/_api/web?$select=Title`,
        SPHttpClient.configurations.v1
      );
      const webInfo: { Title?: string } = await response.json();
      this._siteTitle = webInfo.Title || 'SharePoint Site';
    } catch {
      this._siteTitle = 'SharePoint Site';
    }
  }

  /**
   * Resolve the current user for the effective `useMock` flag. Mock returns a
   * demo persona; live reads the signed-in user from Microsoft Graph. Kept here
   * so Graph access stays in the SPFx layer, out of the React tree.
   */
  private _resolveCurrentUser = async (useMock: boolean): Promise<ICurrentUser> => {
    if (useMock) {
      return getMockCurrentUser();
    }
    const fallback: string = this.context.pageContext.user?.displayName ?? 'User';
    return getGraphCurrentUser(this.context.msGraphClientFactory, fallback);
  };

  /** Ask the host to switch to full-screen via the public component API. */
  private _requestFullscreen = async (): Promise<void> => {
    await this.requestDisplayModeAsync('fullscreen');
  };

  protected render(): void {
    const props: IExecDashboardProps = {
      message: this.properties.message,
      siteTitle: this._siteTitle,
      siteUrl: this._siteUrl,
      useMock: (this.properties.useMock ?? 'true').toLowerCase() !== 'false',
      dataServiceUrl: this.properties.dataServiceUrl ?? '',
      hostContext: this.hostContext,
      bridge: this.context.copilotBridge,
      targetDocument: this.context.domElement.ownerDocument,
      strings,
      resolveCurrentUser: this._resolveCurrentUser,
      onRequestFullscreen: this._requestFullscreen
    };

    ReactDOM.render(React.createElement(ExecDashboard, props), this.context.domElement);
  }

  protected async onTeardown(): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.context.domElement);
  }
}
