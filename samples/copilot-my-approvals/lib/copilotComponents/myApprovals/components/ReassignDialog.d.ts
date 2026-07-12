import * as React from 'react';
import type { IMyApprovalsStrings } from './IMyApprovalsProps';
export interface IReassignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    approvalDisplayName: string;
    strings: IMyApprovalsStrings;
}
/**
 * There is no documented Microsoft Graph endpoint to trigger a reassignment
 * of an approval item — `approvalItemRequest.isReassigned`/`reassignedFrom`
 * are read-only status fields, not an action. This dialog surfaces that
 * limitation instead of presenting a picker with no backing action.
 */
export default function ReassignDialog(props: IReassignDialogProps): React.ReactElement;
//# sourceMappingURL=ReassignDialog.d.ts.map