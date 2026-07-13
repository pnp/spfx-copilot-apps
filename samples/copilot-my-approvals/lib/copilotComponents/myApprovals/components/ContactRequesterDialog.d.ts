import * as React from 'react';
import type { IMyApprovalsStrings } from './IMyApprovalsProps';
export interface IContactRequesterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    approvalDisplayName: string;
    requesterName: string;
    onSend: (subject: string, body: string) => Promise<void>;
    strings: IMyApprovalsStrings;
}
/**
 * Compose-and-send dialog for emailing an approval's requester, via
 * Microsoft Graph `/me/sendMail` (wired up by the caller's `onSend`).
 */
export default function ContactRequesterDialog(props: IContactRequesterDialogProps): React.ReactElement;
//# sourceMappingURL=ContactRequesterDialog.d.ts.map