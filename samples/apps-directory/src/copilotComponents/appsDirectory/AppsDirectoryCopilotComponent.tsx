import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { MSGraphClientV3 } from '@microsoft/sp-http';

import AppsDirectory from './components/AppsDirectory';
import type { IAppsDirectoryProps } from './components/IAppsDirectoryProps';
import type { IAppsDirectoryCopilotComponentProperties } from './AppsDirectoryCopilotComponentProperties';
import { AppsDirectoryService } from './services/AppsDirectoryService';
import { getMockApps } from './data/mockApps';

import * as strings from 'AppsDirectoryCopilotComponentStrings';

export default class AppsDirectoryCopilotComponent extends BaseCopilotComponent<IAppsDirectoryCopilotComponentProperties> {
    private _userDisplayName: string = '';
    private _graphClient: MSGraphClientV3 | undefined;
    private _service: AppsDirectoryService = new AppsDirectoryService();

    protected async onInit(): Promise<void> {
        try {
            const graphClient: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
            this._graphClient = graphClient;
            const me: { displayName?: string } = await graphClient.api('/me').select('displayName').get();
            this._userDisplayName = me.displayName || 'User';
        } catch {
            this._userDisplayName = this.context.pageContext.user?.displayName || 'User';
        }
    }

    protected render(): void {
        const props: IAppsDirectoryProps = {
            apps: getMockApps(),
            userDisplayName: this._userDisplayName,
            category: this.properties.category,
            searchQuery: this.properties.searchQuery,
            showFavoritesOnly: this.properties.showFavoritesOnly,
            hostContext: this.hostContext,
            bridge: this.context.copilotBridge,
            onRequestDisplayMode: async (mode) => {
                await this.requestDisplayModeAsync(mode);
            },
            targetDocument: this.context.domElement.ownerDocument,
            appsDirectoryService: this._service,
            graphClient: this._graphClient,
            strings,
        };

        ReactDOM.render(React.createElement(AppsDirectory, props), this.context.domElement);
    }

    protected async onTeardown(): Promise<void> {
        ReactDOM.unmountComponentAtNode(this.context.domElement);
    }
}

