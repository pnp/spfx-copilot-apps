import * as React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Body1
} from '@fluentui/react-components';

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
export default function ReassignDialog(props: IReassignDialogProps): React.ReactElement {
  const { open, onOpenChange, approvalDisplayName, strings } = props;

  return (
    <Dialog open={open} onOpenChange={(_event, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{strings.ReassignDialogTitle}</DialogTitle>
          <DialogContent>
            <Body1>
              {strings.ReassignNotSupportedMessage.replace('{0}', approvalDisplayName)}
            </Body1>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={() => onOpenChange(false)}>
              {strings.CloseButtonLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
