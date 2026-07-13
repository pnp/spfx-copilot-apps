import { MSGraphClientV3, MSGraphClientFactory } from "@microsoft/sp-http";
export type ApprovalStatus = "pending" | "completed" | "canceled" | "created";
export type ApprovalStatusFilter = "" | ApprovalStatus;
export interface IApprovalIdentity {
    user?: {
        id?: string;
        displayName?: string;
    };
    group?: {
        id?: string;
        displayName?: string;
    };
}
export interface IApprovalRequest {
    id?: string;
    createdDateTime?: string;
    approver?: IApprovalIdentity;
    isReassigned?: boolean;
    reassignedFrom?: IApprovalIdentity;
}
export interface IPendingApproval {
    id: string;
    displayName: string;
    description?: string;
    state: ApprovalStatus;
    approvalType?: string;
    createdDateTime?: string;
    completedDateTime?: string;
    owner?: IApprovalIdentity;
    approvers?: IApprovalIdentity[];
    responsePrompts?: string[];
    ownerUser?: IGraphUser;
    /**
     * Active request records matching the current user
     * directly or through a group.
     */
    currentUserRequests: IApprovalRequest[];
}
interface IGraphUser {
    id: string;
    displayName?: string;
    userPrincipalName?: string;
    mail?: string;
    photoDataUrl?: string;
}
/**
 * Reads a small profile photo from Graph as a self-contained data URL.
 * Resolves to undefined (never throws) if the user has no photo, the app
 * lacks permission to read it, or any other Graph error occurs.
 *
 * @param photoPath e.g. "/me/photos/64x64/$value" or "/users/{id}/photos/64x64/$value"
 */
export declare function getPhotoDataUrl(graphClient: MSGraphClientV3, photoPath: string): Promise<string | undefined>;
/**
 * Service for reading Microsoft 365 approval items from an SPFx solution.
 */
export declare class ApprovalService {
    private readonly graphClientFactory;
    constructor(graphClientFactory: MSGraphClientFactory);
    /**
     * Gets every pending approval currently assigned to the signed-in user.
     *
     * @param includeGroupAssignments
     * When true, approvals assigned to a group containing the current user
     * are also returned. This can require an additional Graph permission.
     */
    getMyApprovalsByStatus(status: ApprovalStatusFilter, includeGroupAssignments?: boolean): Promise<IPendingApproval[]>;
    /**
     * Submits the signed-in user's response to a pending approval item.
     *
     * There is no documented Graph endpoint to trigger a reassignment —
     * `approvalItemRequest.isReassigned`/`reassignedFrom` are read-only status
     * fields, not an action — so this only covers Approve/Reject.
     */
    respondToApproval(approvalItemId: string, response: "Approve" | "Reject", comments?: string): Promise<void>;
    /**
     * Sends an email from the signed-in user's own mailbox (via `/me/sendMail`)
     * to the given address — used to let an approver contact an approval's
     * requester.
     */
    sendMailToRequester(toAddress: string, subject: string, body: string): Promise<void>;
    private getCurrentUser;
    private getApprovalRequests;
    private resolveApprovalRequester;
    private getUserPhotoDataUrl;
    /**
     * Returns the IDs of groups to which the signed-in user belongs,
     * including nested memberships.
     */
    private getCurrentUserGroupIds;
    private isAssignedToCurrentUser;
    /**
     * Reads all Graph pages by following @odata.nextLink.
     */
    private getAllPages;
    /**
     * Graph SDK accepts a relative Graph path. nextLink is usually absolute.
     */
    private normalizeGraphUrl;
}
export {};
//# sourceMappingURL=ApprovalService.d.ts.map