import * as React from 'react';
import type { IMyApprovalsStrings } from './IMyApprovalsProps';
import type { IPendingApproval } from '../core/ApprovalService';
export interface IApprovalListItemProps {
    approval: IPendingApproval;
    variant: 'compact' | 'detailed';
    onApprove: (approval: IPendingApproval) => Promise<void>;
    onReject: (approval: IPendingApproval) => Promise<void>;
    onContactRequester: (approval: IPendingApproval, subject: string, body: string) => Promise<void>;
    onOpenLink: (url: string) => void;
    isAlternate?: boolean;
    strings: IMyApprovalsStrings;
}
/**
 * Renders a single pending approval, either as a compact row (inline
 * display mode) or a detailed card (fullscreen display mode), with
 * Approve/Reject/Re-assign actions.
 */
export default function ApprovalListItem(props: IApprovalListItemProps): React.ReactElement;
//# sourceMappingURL=ApprovalListItem.d.ts.map