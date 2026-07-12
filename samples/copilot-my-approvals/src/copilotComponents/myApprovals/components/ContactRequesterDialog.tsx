import * as React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input,
  Textarea,
  Body1,
  Spinner,
  makeStyles,
  tokens
} from '@fluentui/react-components';

import type { IMyApprovalsStrings } from './IMyApprovalsProps';

export interface IContactRequesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalDisplayName: string;
  requesterName: string;
  onSend: (subject: string, body: string) => Promise<void>;
  strings: IMyApprovalsStrings;
}

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1
  }
});

/**
 * Compose-and-send dialog for emailing an approval's requester, via
 * Microsoft Graph `/me/sendMail` (wired up by the caller's `onSend`).
 */
export default function ContactRequesterDialog(props: IContactRequesterDialogProps): React.ReactElement {
  const { open, onOpenChange, approvalDisplayName, requesterName, onSend, strings } = props;
  const styles = useStyles();

  const [subject, setSubject] = React.useState<string>('');
  const [body, setBody] = React.useState<string>('');
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

  // Reset the form each time the dialog is (re)opened, possibly for a
  // different approval.
  React.useEffect(() => {
    if (open) {
      setSubject(strings.ContactRequesterDefaultSubject.replace('{0}', approvalDisplayName));
      setBody('');
      setErrorMessage(undefined);
    }
  }, [open, approvalDisplayName, strings]);

  const handleSend = React.useCallback(async (): Promise<void> => {
    setErrorMessage(undefined);
    setIsSending(true);
    try {
      await onSend(subject, body);
      onOpenChange(false);
    } catch {
      setErrorMessage(strings.ContactRequesterErrorMessage);
    } finally {
      setIsSending(false);
    }
  }, [onSend, subject, body, onOpenChange, strings]);

  return (
    <Dialog open={open} onOpenChange={(_event, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{strings.ContactRequesterDialogTitle.replace('{0}', requesterName)}</DialogTitle>
          <DialogContent className={styles.content}>
            <Field label={strings.ContactRequesterSubjectLabel}>
              <Input
                value={subject}
                onChange={(_event, data) => setSubject(data.value)}
                disabled={isSending}
              />
            </Field>
            <Field label={strings.ContactRequesterMessageLabel}>
              <Textarea
                value={body}
                onChange={(_event, data) => setBody(data.value)}
                disabled={isSending}
                rows={5}
              />
            </Field>
            {errorMessage && <Body1 className={styles.errorText}>{errorMessage}</Body1>}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={isSending}>
              {strings.CancelButtonLabel}
            </Button>
            <Button
              appearance="primary"
              onClick={handleSend}
              disabled={isSending || subject.trim().length === 0}
            >
              {isSending ? <Spinner size="tiny" /> : strings.SendButtonLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
