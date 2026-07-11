import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';
import type { MSGraphClientV3 } from '@microsoft/sp-http';
import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';

import PermissionsExplorer from './components/PermissionsExplorer';
import type { IPermissionsExplorerProps } from './components/IPermissionsExplorerProps';
import type { IPermissionsExplorerCopilotComponentProperties } from './PermissionsExplorerCopilotComponentProperties';

import * as strings from 'PermissionsExplorerCopilotComponentStrings';

/**
 * SPFx Copilot Component that renders a React-based UI demonstrating the
 * platform's headline capabilities:
 *
 * - **Brokered SSO data calls** — Microsoft Graph (`/me`) and SharePoint REST
 *   (`/_api/web`) with zero token code. The SPFx runtime's Pairwise Broker
 *   automatically provisions tokens for `SPHttpClient` and `MSGraphClientV3`.
 *
 * - **Host context & theming** — reads `hostContext.theme` and
 *   `hostContext.displayMode` to adapt to the Copilot host environment.
 *
 * - **Bridge actions** — demonstrates `requestDisplayModeAsync`,
 *   `openLinkAsync`, `sendFollowUpMessageAsync`, and `requestSizeChangeAsync`.
 *
 * Lifecycle:
 *  1. `onInit()` — fetches user and site data (runs once before first render).
 *  2. `render()` — mounts the React tree into `this.context.domElement`.
 *     Re-invoked by the framework on host-context changes.
 *  3. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
export default class PermissionsExplorerCopilotComponent extends BaseCopilotComponent<IPermissionsExplorerCopilotComponentProperties> {
  private _userDisplayName: string = '';
  private _siteTitle: string = '';
  private _siteUrl: string = '';

  protected async onInit(): Promise<void> {
    this._siteUrl = this.context.pageContext.web.absoluteUrl;

    // Fetch user info from Microsoft Graph (brokered SSO — no token code needed).
    // Wrapped in try/catch so the component still renders in the workbench where
    // real services may not be available.
    try {
      const graphClient: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
      const me: { displayName?: string } = await graphClient.api('/me').select('displayName').get();
      this._userDisplayName = me.displayName || 'User';
    } catch {
      this._userDisplayName = this.context.pageContext.user?.displayName || 'User';
    }

    // Fetch site info from SharePoint REST API (brokered SSO).
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

  protected render(): void {
    const props: IPermissionsExplorerProps = {
      message: this.properties.message,
      userDisplayName: this._userDisplayName,
      siteTitle: this._siteTitle,
      siteUrl: this._siteUrl,
      hostContext: this.hostContext,
      bridge: this.context.copilotBridge,
      onRequestDisplayMode: async (mode: SPCopilotDisplayMode) => {
        await this.requestDisplayModeAsync(mode);
      },
      onRequestSizeChange: async (width: number, height: number) => {
        await this.requestSizeChangeAsync(width, height);
      },
      targetDocument: this.context.domElement.ownerDocument,
      strings
    };

    ReactDOM.render(React.createElement(PermissionsExplorer, props), this.context.domElement);
  }

  protected async onTeardown(): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.context.domElement);
  }
}
