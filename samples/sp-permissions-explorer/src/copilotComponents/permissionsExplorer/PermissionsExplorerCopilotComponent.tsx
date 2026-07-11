import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import PermissionsExplorer from './components/PermissionsExplorer';
import type { IPermissionsExplorerProps } from './components/IPermissionsExplorerProps';
import type { IPermissionsToolInput } from './models/IPermissionsToolInput';
import { PermissionsExplorerService } from './services/PermissionsExplorerService';
import type { IPermissionsExplorerService } from './services/PermissionsExplorerService';
import type { IExplorerServiceContext } from './services/IExplorerServiceContext';
import type { IPermissionsExplorerCopilotComponentProperties } from './PermissionsExplorerCopilotComponentProperties';

/**
 * SPFx Copilot Component that renders a read-only SharePoint Access Review.
 *
 * Data access is performed through a service facade (`IPermissionsExplorerService`)
 * that internally leverages the SPFx runtime's Pairwise Broker for SSO — the UI
 * never handles tokens directly. Microsoft Graph and SharePoint REST calls are
 * confined to the service layer.
 */
export default class PermissionsExplorerCopilotComponent extends BaseCopilotComponent<IPermissionsExplorerCopilotComponentProperties> {
  private _service: IPermissionsExplorerService | undefined;

  private getService(): IPermissionsExplorerService {
    if (!this._service) {
      const ctx: IExplorerServiceContext = {
        spHttpClient: this.context.spHttpClient,
        currentWebUrl: this.context.pageContext.web.absoluteUrl,
        getGraphClient: () => this.context.msGraphClientFactory.getClient('3')
      };
      this._service = new PermissionsExplorerService(ctx);
    }
    return this._service;
  }

  protected render(): void {
    const toolInput: IPermissionsToolInput = {
      siteQuery: this.properties.siteQuery ?? '',
      siteUrl: this.properties.siteUrl,
      filter: this.properties.filter,
      principalQuery: this.properties.principalQuery,
      includeGroups: this.properties.includeGroups,
      includeExternalUsers: this.properties.includeExternalUsers,
      includeInheritedPermissions: this.properties.includeInheritedPermissions,
      mode: this.properties.mode
    };

    const props: IPermissionsExplorerProps = {
      toolInput,
      service: this.getService(),
      currentWebUrl: this.context.pageContext.web.absoluteUrl,
      hostContext: this.hostContext,
      bridge: this.context.copilotBridge,
      onRequestDisplayMode: async (mode: SPCopilotDisplayMode): Promise<void> => {
        await this.requestDisplayModeAsync(mode);
      },
      onRequestSizeChange: async (width: number, height: number): Promise<void> => {
        await this.requestSizeChangeAsync(width, height);
      },
      targetDocument: this.context.domElement.ownerDocument
    };

    ReactDOM.render(React.createElement(PermissionsExplorer, props), this.context.domElement);
  }

  protected async onTeardown(): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.context.domElement);
  }
}
