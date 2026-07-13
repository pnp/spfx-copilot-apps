import * as React from 'react';
import {
  Body1,
  Body1Strong,
  Caption1,
  Badge,
  Button,
  Card,
  Tooltip,
  Spinner,
  Avatar,
  Link,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  CheckmarkCircleRegular,
  DismissCircleRegular,
  PersonArrowRightRegular,
  CalendarRegular,
  PersonRegular,
  PeopleRegular,
  MailRegular
} from '@fluentui/react-icons';

import type { IMyApprovalsStrings } from './IMyApprovalsProps';
import type { ApprovalStatus, IApprovalIdentity, IPendingApproval } from '../core/ApprovalService';
import ReassignDialog from './ReassignDialog';
import ContactRequesterDialog from './ContactRequesterDialog';

type BadgeColor = 'warning' | 'success' | 'danger' | 'informative';

function statusBadgeColor(state: ApprovalStatus): BadgeColor {
  switch (state) {
    case 'completed':
      return 'success';
    case 'canceled':
      return 'danger';
    case 'created':
      return 'informative';
    case 'pending':
    default:
      return 'warning';
  }
}

function statusLabel(state: ApprovalStatus, strings: IMyApprovalsStrings): string {
  switch (state) {
    case 'completed':
      return strings.StatusCompletedLabel;
    case 'canceled':
      return strings.StatusCanceledLabel;
    case 'created':
      return strings.StatusCreatedLabel;
    case 'pending':
    default:
      return strings.StatusPendingLabel;
  }
}

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

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'default',
    transitionProperty: 'transform, box-shadow, background-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  rowInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  rowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3
  },
  rowActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0
  },
  alternate: {
    backgroundColor: tokens.colorNeutralBackground2
  },
  card: {
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow16
    }
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingHorizontalM
  },
  detailIdentity: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    minWidth: 0
  },
  detailIdentityText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  detailHeaderActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: tokens.spacingVerticalS,
    flexShrink: 0
  },
  detailBadges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  requesterInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.spacingVerticalXXS
  },
  requesterCaption: {
    color: tokens.colorNeutralForeground3
  },
  detailActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1
  }
});

function getIdentityDisplayName(identity: IApprovalIdentity | undefined): string | undefined {
  return identity?.user?.displayName || identity?.group?.displayName;
}

function formatDateTime(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toLocaleString();
}

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g;
const URL_TEST_PATTERN = /^https?:\/\//;

/**
 * Renders free text with any http(s) URLs turned into clickable Links,
 * routed through onOpenLink (the Copilot host bridge) instead of native
 * navigation, since this renders inside a sandboxed Copilot iframe.
 */
function renderTextWithLinks(text: string, onOpenLink: (url: string) => void): React.ReactNode {
  return text.split(URL_SPLIT_PATTERN).map((part, index) =>
    URL_TEST_PATTERN.test(part) ? (
      <Link
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          event.preventDefault();
          onOpenLink(part);
        }}
      >
        {part}
      </Link>
    ) : (
      part
    )
  );
}

/**
 * Renders a single pending approval, either as a compact row (inline
 * display mode) or a detailed card (fullscreen display mode), with
 * Approve/Reject/Re-assign actions.
 */
export default function ApprovalListItem(props: IApprovalListItemProps): React.ReactElement {
  const { approval, variant, onApprove, onReject, onContactRequester, onOpenLink, isAlternate, strings } = props;
  const styles = useStyles();

  const [busyAction, setBusyAction] = React.useState<'approve' | 'reject' | undefined>(undefined);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = React.useState<boolean>(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState<boolean>(false);

  const ownerName = getIdentityDisplayName(approval.owner);
  const createdDateTime = formatDateTime(approval.createdDateTime);
  const isPending = approval.state === 'pending';
  const requesterName = approval.ownerUser?.displayName ?? ownerName;
  const requesterMail = approval.ownerUser?.mail ?? approval.ownerUser?.userPrincipalName;

  const handleApprove = React.useCallback(async (): Promise<void> => {
    setErrorMessage(undefined);
    setBusyAction('approve');
    try {
      await onApprove(approval);
    } catch {
      setErrorMessage(strings.ApproveErrorMessage);
    } finally {
      setBusyAction(undefined);
    }
  }, [approval, onApprove, strings]);

  const handleReject = React.useCallback(async (): Promise<void> => {
    setErrorMessage(undefined);
    setBusyAction('reject');
    try {
      await onReject(approval);
    } catch {
      setErrorMessage(strings.RejectErrorMessage);
    } finally {
      setBusyAction(undefined);
    }
  }, [approval, onReject, strings]);

  const handleOpenLink = React.useCallback((url: string): void => {
    onOpenLink(url);
  }, [onOpenLink]);

  const isBusy = busyAction !== undefined;

  const approveIcon = busyAction === 'approve'
    ? <Spinner size="tiny" />
    : <CheckmarkCircleRegular />;
  const rejectIcon = busyAction === 'reject'
    ? <Spinner size="tiny" />
    : <DismissCircleRegular />;

  if (variant === 'compact') {
    return (
      <div className={mergeClasses(styles.row, isAlternate && styles.alternate)}>
        <div className={styles.rowInfo}>
          <Body1Strong>{approval.displayName}</Body1Strong>
          <div className={styles.rowMeta}>
            {ownerName && (
              <>
                <PersonRegular fontSize={16} />
                <Caption1>{ownerName}</Caption1>
              </>
            )}
            {createdDateTime && (
              <>
                <CalendarRegular fontSize={16} />
                <Caption1>{createdDateTime}</Caption1>
              </>
            )}
          </div>
          {errorMessage && <Caption1 className={styles.errorText}>{errorMessage}</Caption1>}
        </div>

        {isPending && (
          <div className={styles.rowActions}>
            <Tooltip content={strings.ApproveButtonLabel} relationship="label">
              <Button
                appearance="subtle"
                icon={approveIcon}
                disabled={isBusy}
                onClick={handleApprove}
                aria-label={strings.ApproveButtonLabel}
              />
            </Tooltip>
            <Tooltip content={strings.RejectButtonLabel} relationship="label">
              <Button
                appearance="subtle"
                icon={rejectIcon}
                disabled={isBusy}
                onClick={handleReject}
                aria-label={strings.RejectButtonLabel}
              />
            </Tooltip>
            <Tooltip content={strings.ReassignButtonLabel} relationship="label">
              <Button
                appearance="subtle"
                icon={<PersonArrowRightRegular />}
                disabled={isBusy}
                onClick={() => setIsReassignDialogOpen(true)}
                aria-label={strings.ReassignButtonLabel}
              />
            </Tooltip>
          </div>
        )}

        <ReassignDialog
          open={isReassignDialogOpen}
          onOpenChange={setIsReassignDialogOpen}
          approvalDisplayName={approval.displayName}
          strings={strings}
        />
      </div>
    );
  }

  const approverNames = (approval.approvers || [])
    .map(getIdentityDisplayName)
    .filter((name): name is string => Boolean(name));

  const reassignedRequest = approval.currentUserRequests.find(request => request.isReassigned);
  const reassignedFromName = getIdentityDisplayName(reassignedRequest?.reassignedFrom);

  return (
    <Card className={mergeClasses(styles.card, isAlternate && styles.alternate)}>
      <div className={styles.detailRow}>
        <div className={styles.detailIdentity}>
          {requesterName && (
            <Avatar
              name={requesterName}
              image={approval.ownerUser?.photoDataUrl ? { src: approval.ownerUser.photoDataUrl } : undefined}
              size={40}
            />
          )}
          <div className={styles.detailIdentityText}>
            <Body1Strong>{approval.displayName}</Body1Strong>
            {approval.description && (
              <Body1>{renderTextWithLinks(approval.description, handleOpenLink)}</Body1>
            )}
            {requesterName && (
              <div className={styles.requesterInfo}>
                <Caption1 className={styles.requesterCaption}>
                  {strings.RequestedByLabel} {requesterName}
                </Caption1>
                {requesterMail && (
                  <Button
                    appearance="transparent"
                    size="small"
                    icon={<MailRegular />}
                    onClick={() => setIsContactDialogOpen(true)}
                  >
                    {strings.ContactRequesterButtonLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailHeaderActions}>
          <div className={styles.detailBadges}>
            <Badge appearance="filled" color={statusBadgeColor(approval.state)}>
              {statusLabel(approval.state, strings)}
            </Badge>
            {approval.approvalType && (
              <Badge appearance="outline">
                {strings.ApprovalTypeLabel} {approval.approvalType}
              </Badge>
            )}
            {createdDateTime && (
              <Badge appearance="outline" icon={<CalendarRegular />}>
                {strings.CreatedLabel} {createdDateTime}
              </Badge>
            )}
            {approverNames.length > 0 && (
              <Badge appearance="outline" icon={<PeopleRegular />}>
                {approverNames.join(', ')}
              </Badge>
            )}
            {reassignedFromName && (
              <Badge appearance="outline" color="informative" icon={<PersonArrowRightRegular />}>
                {reassignedFromName}
              </Badge>
            )}
          </div>

          {isPending && (
            <div className={styles.detailActions}>
              <Button
                appearance="primary"
                icon={approveIcon}
                disabled={isBusy}
                onClick={handleApprove}
              >
                {strings.ApproveButtonLabel}
              </Button>
              <Button
                appearance="secondary"
                icon={rejectIcon}
                disabled={isBusy}
                onClick={handleReject}
              >
                {strings.RejectButtonLabel}
              </Button>
              <Button
                appearance="secondary"
                icon={<PersonArrowRightRegular />}
                disabled={isBusy}
                onClick={() => setIsReassignDialogOpen(true)}
              >
                {strings.ReassignButtonLabel}
              </Button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className={styles.cardBody}>
          <Body1 className={styles.errorText}>{errorMessage}</Body1>
        </div>
      )}

      <ReassignDialog
        open={isReassignDialogOpen}
        onOpenChange={setIsReassignDialogOpen}
        approvalDisplayName={approval.displayName}
        strings={strings}
      />

      <ContactRequesterDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        approvalDisplayName={approval.displayName}
        requesterName={requesterName ?? ''}
        onSend={(subject, body) => onContactRequester(approval, subject, body)}
        strings={strings}
      />
    </Card>
  );
}
