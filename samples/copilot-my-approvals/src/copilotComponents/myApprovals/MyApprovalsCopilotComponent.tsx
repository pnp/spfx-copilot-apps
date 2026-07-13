import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { ICopilotComponentHostContext, SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';
import type { MSGraphClientV3 } from '@microsoft/sp-http';
import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';

import MyApprovals from './components/MyApprovals';
import type { IMyApprovalsProps } from './components/IMyApprovalsProps';
import type { IMyApprovalsCopilotComponentProperties } from './MyApprovalsCopilotComponentProperties';
import { ApprovalService, getPhotoDataUrl, type ApprovalStatusFilter, type IPendingApproval } from './core/ApprovalService';

import * as strings from 'MyApprovalsCopilotComponentStrings';

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
  private _userDisplayName: string = '';
  private _userPhotoDataUrl: string | undefined;
  private _siteTitle: string = '';
  private _siteUrl: string = '';
  private _pendingApprovals: IPendingApproval[] = [];
  private _statusFilter: ApprovalStatusFilter = 'pending';
  private _isLoadingApprovals: boolean = false;
  private _loadRequestId: number = 0;

  protected async onInit(): Promise<void> {
    this._siteUrl = this.context.pageContext.web.absoluteUrl;

    // Fetch user info from Microsoft Graph (brokered SSO — no token code needed).
    // Wrapped in try/catch so the component still renders in the workbench where
    // real services may not be available.
    try {
      const graphClient: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
      const me: { displayName?: string } = await graphClient.api('/me').select('displayName').get();
      this._userDisplayName = me.displayName || 'User';
      this._userPhotoDataUrl = await getPhotoDataUrl(graphClient, '/me/photos/64x64/$value');
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

    await this._loadApprovals('pending');
  }

  // Loads the current user's approvals (including group-assigned ones) for
  // the given status from Microsoft Graph via the brokered SSO client.
  // Renders immediately to show a loading state, then again once the fetch
  // settles. `_loadRequestId` discards the result of a superseded call if a
  // newer status/reload was requested before this one finished.
  private async _loadApprovals(status: ApprovalStatusFilter): Promise<void> {
    const requestId = ++this._loadRequestId;
    this._statusFilter = status;
    this._isLoadingApprovals = true;
    this.render();

    let approvals: IPendingApproval[];
    try {
      const approvalService = new ApprovalService(this.context.msGraphClientFactory);
      approvals = await approvalService.getMyApprovalsByStatus(status, true);
    } catch {
      approvals = [];
    }

    if (requestId !== this._loadRequestId) {
      return;
    }
    this._pendingApprovals = approvals;
    this._isLoadingApprovals = false;
    this.render();
  }

  // The Copilot host resets the component back to inline after a fullscreen
  // session; inline must always show pending approvals regardless of
  // whatever status filter was last selected in fullscreen.
  protected onHostContextChanged(diff: Partial<ICopilotComponentHostContext>): void {
    if (diff.displayMode === 'inline' && this._statusFilter !== 'pending') {
      void this._loadApprovals('pending');
    }
  }

  // Submits an Approve/Reject response for an approval item, then removes it
  // from the local list optimistically — the Graph endpoint returns 202
  // Accepted, so re-fetching immediately could still show it as pending.
  private async _respondToApproval(
    approval: IPendingApproval,
    response: 'Approve' | 'Reject'
  ): Promise<void> {
    const approvalService = new ApprovalService(this.context.msGraphClientFactory);
    await approvalService.respondToApproval(approval.id, response);

    this._pendingApprovals = this._pendingApprovals.filter(item => item.id !== approval.id);
    this.render();
  }

  // Sends an email to an approval's requester from the signed-in user's own
  // mailbox via Microsoft Graph. Does not mutate `_pendingApprovals` or
  // re-render — the dialog that triggered this owns its own busy/error/close
  // state via the resolved/rejected promise.
  private async _contactRequester(
    approval: IPendingApproval,
    subject: string,
    body: string
  ): Promise<void> {
    const mail = approval.ownerUser?.mail ?? approval.ownerUser?.userPrincipalName;
    if (!mail) {
      throw new Error('No email address available for this requester.');
    }

    const approvalService = new ApprovalService(this.context.msGraphClientFactory);
    await approvalService.sendMailToRequester(mail, subject, body);
  }

  protected render(): void {
    const props: IMyApprovalsProps = {
      message: this.properties.message,
      userDisplayName: this._userDisplayName,
      userPhotoDataUrl: this._userPhotoDataUrl,
      siteTitle: this._siteTitle,
      siteUrl: this._siteUrl,
      pendingApprovals: this._pendingApprovals,
      onApprove: (approval: IPendingApproval) => this._respondToApproval(approval, 'Approve'),
      onReject: (approval: IPendingApproval) => this._respondToApproval(approval, 'Reject'),
      onContactRequester: (approval: IPendingApproval, subject: string, body: string) =>
        this._contactRequester(approval, subject, body),
      statusFilter: this._statusFilter,
      isLoadingApprovals: this._isLoadingApprovals,
      onStatusFilterChange: (status: ApprovalStatusFilter) => { void this._loadApprovals(status); },
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

    ReactDOM.render(React.createElement(MyApprovals, props), this.context.domElement);
  }

  protected async onTeardown(): Promise<void> {
    ReactDOM.unmountComponentAtNode(this.context.domElement);
  }
}
