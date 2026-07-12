import type {
  ICopilotComponentHostContext,
  ISPCopilotBridge,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';
import type { ApprovalStatusFilter, IPendingApproval } from '../core/ApprovalService';

export interface IMyApprovalsStrings {
  ExpandButtonLabel: string;
  CollapseButtonLabel: string;
  OpenSiteButtonLabel: string;
  FollowUpButtonLabel: string;
  ResizeButtonLabel: string;
  CompactButtonLabel: string;
  SiteBadgePrefix: string;
  ThemeBadgePrefix: string;
  ModeBadgePrefix: string;
  GreetingPrefix: string;
  UnknownTheme: string;
  DefaultDisplayMode: string;
  FollowUpMessage: string;
  PendingApprovalsSectionTitle: string;
  NoPendingApprovalsMessage: string;
  ApproveButtonLabel: string;
  RejectButtonLabel: string;
  ReassignButtonLabel: string;
  ReassignDialogTitle: string;
  ReassignNotSupportedMessage: string;
  CloseButtonLabel: string;
  OwnerLabel: string;
  RequestedByLabel: string;
  CreatedLabel: string;
  ApprovalTypeLabel: string;
  ApproveErrorMessage: string;
  RejectErrorMessage: string;
  StatusFilterLabel: string;
  StatusFilterAllOption: string;
  StatusFilterPendingOption: string;
  StatusFilterCompletedOption: string;
  StatusFilterCanceledOption: string;
  StatusFilterCreatedOption: string;
  ApprovalsSectionTitle: string;
  NoApprovalsMessage: string;
  StatusPendingLabel: string;
  StatusCompletedLabel: string;
  StatusCanceledLabel: string;
  StatusCreatedLabel: string;
  ContactRequesterButtonLabel: string;
  ContactRequesterDialogTitle: string;
  ContactRequesterSubjectLabel: string;
  ContactRequesterMessageLabel: string;
  ContactRequesterDefaultSubject: string;
  SendButtonLabel: string;
  CancelButtonLabel: string;
  ContactRequesterErrorMessage: string;
}

export interface IMyApprovalsProps {
  /** The message passed as a tool argument from the Copilot host. */
  message: string;
  /** User display name fetched from Microsoft Graph /me. */
  userDisplayName: string;
  /** Signed-in user's profile photo as a data URL, fetched from Microsoft Graph /me/photos. */
  userPhotoDataUrl?: string;
  /** Site title fetched from SharePoint REST /_api/web. */
  siteTitle: string;
  /** Absolute URL of the current SharePoint site. */
  siteUrl: string;
  /** Approvals currently loaded for `statusFilter`, fetched via ApprovalService. */
  pendingApprovals: IPendingApproval[];
  /** Submits an "Approve" response for the given approval item. */
  onApprove: (approval: IPendingApproval) => Promise<void>;
  /** Submits a "Reject" response for the given approval item. */
  onReject: (approval: IPendingApproval) => Promise<void>;
  /** Sends an email to the approval's requester via Microsoft Graph (/me/sendMail). */
  onContactRequester: (approval: IPendingApproval, subject: string, body: string) => Promise<void>;
  /** Currently active status filter ("" = all). Always "pending" in inline mode. */
  statusFilter: ApprovalStatusFilter;
  /** True while a Graph fetch for approvals is in flight. */
  isLoadingApprovals: boolean;
  /** Requests a reload of approvals for a new status (fullscreen filter control). */
  onStatusFilterChange: (status: ApprovalStatusFilter) => void;
  /** Host context (theme, display mode) from the Copilot host. */
  hostContext: ICopilotComponentHostContext;
  /** Bridge to communicate with the Copilot host (public API surface). */
  bridge: ISPCopilotBridge;
  /** Request the host to change display mode (e.g. 'fullscreen'). */
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  /** Request the host to resize the component iframe. */
  onRequestSizeChange: (width: number, height: number) => Promise<void>;
  /**
   * Document the FluentProvider should inject its theme styles into. Pass
   * `domElement.ownerDocument` so Griffel writes CSS into the correct iframe
   * document rather than the top-level page.
   */
  targetDocument: Document | undefined;
  /** Localized strings for UI labels. */
  strings: IMyApprovalsStrings;
}
