import {
  MSGraphClientV3,
  MSGraphClientFactory
} from "@microsoft/sp-http";

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

interface IGraphCollection<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

interface IGraphApprovalItem {
  id: string;
  displayName: string;
  description?: string;
  state: ApprovalStatus;
  approvalType?: string;
  createdDateTime?: string;
  completedDateTime?: string;
  owner?: IApprovalIdentity;
  ownerUser?: IGraphUser;
  approvers?: IApprovalIdentity[];
  responsePrompts?: string[];
}

interface IGraphUser {
  id: string;
  displayName?: string;
  userPrincipalName?: string;
  mail?: string;
  photoDataUrl?: string;
}

interface IGraphDirectoryObject {
  id: string;
  "@odata.type"?: string;
}

/**
 * Reads a small profile photo from Graph as a self-contained data URL.
 * Resolves to undefined (never throws) if the user has no photo, the app
 * lacks permission to read it, or any other Graph error occurs.
 *
 * @param photoPath e.g. "/me/photos/64x64/$value" or "/users/{id}/photos/64x64/$value"
 */
export async function getPhotoDataUrl(
  graphClient: MSGraphClientV3,
  photoPath: string
): Promise<string | undefined> {
  try {
    const photoBlob = await graphClient
      .api(photoPath)
      .version("v1.0")
      .get() as Blob;

    return await blobToDataUrl(photoBlob);
  } catch (error) {
    return undefined;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Service for reading Microsoft 365 approval items from an SPFx solution.
 */
export class ApprovalService {
  private readonly graphClientFactory: MSGraphClientFactory;

  public constructor(graphClientFactory: MSGraphClientFactory) {
    this.graphClientFactory = graphClientFactory;
  }

  /**
   * Gets every pending approval currently assigned to the signed-in user.
   *
   * @param includeGroupAssignments
   * When true, approvals assigned to a group containing the current user
   * are also returned. This can require an additional Graph permission.
   */
  public async getMyApprovalsByStatus(status: ApprovalStatusFilter, includeGroupAssignments: boolean = false): Promise<IPendingApproval[]> {
    const graphClient: MSGraphClientV3 =
      await this.graphClientFactory.getClient("3");

    const currentUser = await this.getCurrentUser(graphClient);

    const groupIds = includeGroupAssignments
      ? await this.getCurrentUserGroupIds(graphClient)
      : new Set<string>();

    /*
     * The list endpoint returns approval items visible to the signed-in
     * user. Filtering at Graph reduces the amount of data downloaded.
     *
     * $expand is not used because it is not documented as supported for
     * this endpoint. Requests are loaded separately.
     */
    let approvalItems = await this.getAllPages<IGraphApprovalItem>(
      graphClient,
      "/solutions/approval/approvalItems" +
        /*"?$filter=state%20eq%20'pending'" + NOT supported */
        "?$select=id,displayName,description,state,approvalType," +
        "createdDateTime,completedDateTime,owner,approvers,responsePrompts"
    );

    if (status.length>0)
      approvalItems = approvalItems.filter(approval =>approval.state?.toLowerCase() === status)

    
    /*
     * Process in controlled batches so a user with many approvals does
     * not cause an excessive burst of parallel Graph requests.
     */
    const result: IPendingApproval[] = [];
    const concurrency = 5;

    for (let offset = 0; offset < approvalItems.length; offset += concurrency) {
      const batch = approvalItems.slice(offset, offset + concurrency);

      const evaluated = await Promise.all(
        batch.map(async approval => {
          const requests = await this.getApprovalRequests(
            graphClient,
            approval.id
          );

          const currentUserRequests = requests.filter(request =>
            this.isAssignedToCurrentUser(
              request.approver,
              currentUser.id,
              groupIds
            )
          );

          const ownerUser = await this.resolveApprovalRequester(graphClient, approval);

          if (currentUserRequests.length === 0) {
            return undefined;
          }

          return {
            id: approval.id,
            displayName: approval.displayName,
            description: approval.description,
            state: approval.state,
            approvalType: approval.approvalType,
            createdDateTime: approval.createdDateTime,
            completedDateTime: approval.completedDateTime,
            owner: approval.owner,
            approvers: approval.approvers,
            responsePrompts: approval.responsePrompts,
            ownerUser,
            currentUserRequests
          };
        })
      );

      for (const approval of evaluated) {
        if (approval) {
          result.push(approval);
        }
      }
    }

    console.log(result);

    return result.sort((left, right) => {
      const leftDate = left.createdDateTime
        ? Date.parse(left.createdDateTime)
        : 0;

      const rightDate = right.createdDateTime
        ? Date.parse(right.createdDateTime)
        : 0;

      return rightDate - leftDate;
    });
  }

  /**
   * Submits the signed-in user's response to a pending approval item.
   *
   * There is no documented Graph endpoint to trigger a reassignment —
   * `approvalItemRequest.isReassigned`/`reassignedFrom` are read-only status
   * fields, not an action — so this only covers Approve/Reject.
   */
  public async respondToApproval(
    approvalItemId: string,
    response: "Approve" | "Reject",
    comments?: string
  ): Promise<void> {
    const graphClient: MSGraphClientV3 =
      await this.graphClientFactory.getClient("3");

    await graphClient
      .api(
        `/solutions/approval/approvalItems/${encodeURIComponent(
          approvalItemId)}/responses`
      )
      .version("beta")
      .post({ response, comments });
  }

  /**
   * Sends an email from the signed-in user's own mailbox (via `/me/sendMail`)
   * to the given address — used to let an approver contact an approval's
   * requester.
   */
  public async sendMailToRequester(
    toAddress: string,
    subject: string,
    body: string
  ): Promise<void> {
    const graphClient: MSGraphClientV3 =
      await this.graphClientFactory.getClient("3");

    await graphClient
      .api("/me/sendMail")
      .version("v1.0")
      .post({
        message: {
          subject,
          body: { contentType: "Text", content: body },
          toRecipients: [{ emailAddress: { address: toAddress } }]
        },
        saveToSentItems: true
      });
  }

  private async getCurrentUser(
    graphClient: MSGraphClientV3
  ): Promise<IGraphUser> {
    return graphClient
      .api("/me")
      .version("v1.0")
      .select("id,displayName,userPrincipalName")
      .get();
  }

  private async getApprovalRequests(
    graphClient: MSGraphClientV3,
    approvalItemId: string
  ): Promise<IApprovalRequest[]> {
    const encodedId = encodeURIComponent(approvalItemId);

    return this.getAllPages<IApprovalRequest>(
      graphClient,
      `/solutions/approval/approvalItems/${encodedId}/requests` +
        "?$select=id,createdDateTime,approver,isReassigned,reassignedFrom"
    );
  }

  private async resolveApprovalRequester(graphClient: MSGraphClientV3,approval: IGraphApprovalItem): Promise<IGraphUser | undefined> {
  const ownerUser = approval.owner?.user;

  if (!ownerUser?.id) {
    return undefined;
  }

  const photoPromise = this.getUserPhotoDataUrl(graphClient, ownerUser.id);

  try {
    const user = await graphClient
      .api(`/users/${encodeURIComponent(ownerUser.id)}`)
      .version("v1.0")
      .select("id,displayName,userPrincipalName,mail")
      .get() as {
        id: string;
        displayName?: string;
        userPrincipalName?: string;
        mail?: string;
      };

    return {
      id: user.id,
      displayName:
        user.displayName ??
        ownerUser.displayName ??
        user.userPrincipalName ??
        user.id,
      userPrincipalName: user.userPrincipalName,
      mail: user.mail,
      photoDataUrl: await photoPromise
    };
  } catch (error) {
    /*
     * The owner might have been deleted, might be external, or the
     * application might not have permission to read the user profile.
     * Fall back to the identity included in the approval item.
     */
    return {
      id: ownerUser.id,
      displayName:
        ownerUser.displayName ??
        ownerUser.id,
      photoDataUrl: await photoPromise
    };
  }
}

  private async getUserPhotoDataUrl(
    graphClient: MSGraphClientV3,
    userId: string
  ): Promise<string | undefined> {
    return getPhotoDataUrl(graphClient, `/users/${encodeURIComponent(userId)}/photos/64x64/$value`);
  }

  /**
   * Returns the IDs of groups to which the signed-in user belongs,
   * including nested memberships.
   */
  private async getCurrentUserGroupIds(
    graphClient: MSGraphClientV3
  ): Promise<Set<string>> {
    const objects = await this.getAllPages<IGraphDirectoryObject>(
      graphClient,
      "/me/transitiveMemberOf/microsoft.graph.group?$select=id"
    );

    return new Set(
      objects
        .map(item => item.id?.toLowerCase())
        .filter((id): id is string => Boolean(id))
    );
  }

  private isAssignedToCurrentUser(
    approver: IApprovalIdentity | undefined,
    currentUserId: string,
    currentUserGroupIds: Set<string>
  ): boolean {
    const normalizedUserId = currentUserId.toLowerCase();

    const assignedUserId = approver?.user?.id?.toLowerCase();

    if (assignedUserId === normalizedUserId) {
      return true;
    }

    const assignedGroupId = approver?.group?.id?.toLowerCase();

    return Boolean(
      assignedGroupId && currentUserGroupIds.has(assignedGroupId)
    );
  }

  /**
   * Reads all Graph pages by following @odata.nextLink.
   */
  private async getAllPages<T>(
    graphClient: MSGraphClientV3,
    initialUrl: string
  ): Promise<T[]> {
    const values: T[] = [];
    let nextUrl: string | undefined = initialUrl;

    while (nextUrl) {
      const response = await graphClient
        .api(this.normalizeGraphUrl(nextUrl))
        .version("beta")
        .get() as IGraphCollection<T>;

      if (Array.isArray(response.value)) {
        values.push(...response.value);
      }

      nextUrl = response["@odata.nextLink"];
    }

    return values;
  }

  /**
   * Graph SDK accepts a relative Graph path. nextLink is usually absolute.
   */
  private normalizeGraphUrl(url: string): string {
    const graphHost = "https://graph.microsoft.com";

    return url.startsWith(graphHost)
      ? url.substring(graphHost.length)
      : url;
  }
}