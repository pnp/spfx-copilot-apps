import type {
    ICopilotComponentHostContext,
    ISPCopilotBridge,
    SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';
import type { MSGraphClientV3 } from '@microsoft/sp-http';
import type { IApp } from '../models/IApp';
import type { AppsDirectoryService } from '../services/AppsDirectoryService';

export interface IAppsDirectoryStrings {
    ExpandButtonLabel: string;
    AppsDirectoryTitle: string;
    FavouritesLabel: string;
    CustomAppButtonLabel: string;
    CustomAppTitleLabel: string;
    CustomAppUrlLabel: string;
    CustomAppTitlePlaceholder: string;
    CustomAppUrlPlaceholder: string;
    AddButtonLabel: string;
    CancelButtonLabel: string;
    AddingLabel: string;
    DeleteConfirmLabel: string;
    SearchPlaceholder: string;
    YourToolsLabel: string;
}

export interface IAppsDirectoryProps {
    apps: IApp[];
    userDisplayName: string;
    category?: string;
    searchQuery?: string;
    showFavoritesOnly?: string;
    hostContext: ICopilotComponentHostContext;
    bridge: ISPCopilotBridge;
    onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
    targetDocument: Document | undefined;
    appsDirectoryService: AppsDirectoryService;
    graphClient?: MSGraphClientV3;
    strings: IAppsDirectoryStrings;
}
