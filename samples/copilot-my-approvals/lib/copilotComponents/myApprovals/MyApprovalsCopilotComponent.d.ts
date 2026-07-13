import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';
import type { IMyApprovalsCopilotComponentProperties } from './MyApprovalsCopilotComponentProperties';
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
export default class MyApprovalsCopilotComponent extends BaseCopilotComponent<IMyApprovalsCopilotComponentProperties> {
    private _userDisplayName;
    private _userPhotoDataUrl;
    private _siteTitle;
    private _siteUrl;
    private _pendingApprovals;
    private _statusFilter;
    private _isLoadingApprovals;
    private _loadRequestId;
    protected onInit(): Promise<void>;
    private _loadApprovals;
    protected onHostContextChanged(diff: Partial<ICopilotComponentHostContext>): void;
    private _respondToApproval;
    private _contactRequester;
    protected render(): void;
    protected onTeardown(): Promise<void>;
}
//# sourceMappingURL=MyApprovalsCopilotComponent.d.ts.map