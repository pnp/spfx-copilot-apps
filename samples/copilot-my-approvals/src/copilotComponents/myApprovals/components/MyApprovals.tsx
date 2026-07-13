import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  webDarkTheme,
  Title1,
  Title2,
  Body1,
  Badge,
  Button,
  Card,
  CardHeader,
  Avatar,
  Dropdown,
  Option,
  type OptionOnSelectData,
  List,
  ListItem,
  Spinner,
  Skeleton,
  SkeletonItem,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  ArrowExpand24Regular,
  ArrowMinimize24Regular,
  Open24Regular,
  Chat24Regular,
  ResizeLarge24Regular
} from '@fluentui/react-icons';
import { createCopilotTextContent } from '@microsoft/sp-copilot-component';

import type { ApprovalStatusFilter } from '../core/ApprovalService';
import type { IMyApprovalsProps, IMyApprovalsStrings } from './IMyApprovalsProps';
import ApprovalListItem from './ApprovalListItem';

function statusFilterLabel(status: ApprovalStatusFilter, strings: IMyApprovalsStrings): string {
  switch (status) {
    case 'pending':
      return strings.StatusFilterPendingOption;
    case 'completed':
      return strings.StatusFilterCompletedOption;
    case 'canceled':
      return strings.StatusFilterCanceledOption;
    case 'created':
      return strings.StatusFilterCreatedOption;
    case '':
    default:
      return strings.StatusFilterAllOption;
  }
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  headerCard: {
    boxShadow: tokens.shadow4,
    borderRadius: tokens.borderRadiusXLarge
  },
  headerMessage: {
    color: tokens.colorNeutralForeground3
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  approvalsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  approvalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  skeletonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS
  },
  skeletonText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    flexGrow: 1
  },
  emptyState: {
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalM
  }
});

const EXPANDED_WIDTH: number = 600;
const EXPANDED_HEIGHT: number = 400;
const COMPACT_WIDTH: number = 400;
const COMPACT_HEIGHT: number = 250;

/**
 * Main React UI for the Copilot Component starter template.
 *
 * Demonstrates:
 * - **Theming** — wraps content in `<FluentProvider>` with a theme derived
 *   from the host's `hostContext.theme` (`'light' | 'dark'`).
 * - **Host context** — surfaces the current display mode, theme, and
 *   available display modes as live badges.
 * - **Bridge actions** — four buttons that exercise different bridge methods
 *   to show how a component communicates with the Copilot host.
 */
export default function MyApprovals(props: IMyApprovalsProps): React.ReactElement {
  const {
    message, userDisplayName, userPhotoDataUrl, siteTitle, siteUrl, hostContext,
    bridge, onRequestDisplayMode, onRequestSizeChange, strings,
    pendingApprovals, onApprove, onReject, onContactRequester,
    statusFilter, isLoadingApprovals, onStatusFilterChange
  } = props;
  const styles = useStyles();

  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  const theme = hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;

  // Request the Copilot host to switch this component to fullscreen mode.
  const handleExpand = React.useCallback(async (): Promise<void> => {
    await onRequestDisplayMode('fullscreen');
  }, [onRequestDisplayMode]);

  // Ask the host to return this component to inline mode.
  const handleCollapse = React.useCallback(async (): Promise<void> => {
    await onRequestDisplayMode('inline');
  }, [onRequestDisplayMode]);

  // Ask the host to open the site URL in the user's browser.
  const handleOpenLink = React.useCallback(async (): Promise<void> => {
    await bridge.openLinkAsync(siteUrl);
  }, [bridge, siteUrl]);

  // Send a follow-up message into the Copilot conversation on behalf of the user.
  // This triggers Copilot to respond, demonstrating how a component can drive the chat.
  const handleFollowUp = React.useCallback(async (): Promise<void> => {
    await bridge.sendFollowUpMessageAsync([
      createCopilotTextContent(strings.FollowUpMessage.replace('{0}', siteTitle))
    ]);
  }, [bridge, siteTitle, strings]);

  // Toggle between compact and expanded sizes by requesting a resize from the host.
  const handleResize = React.useCallback(async (): Promise<void> => {
    if (isExpanded) {
      await onRequestSizeChange(COMPACT_WIDTH, COMPACT_HEIGHT);
    } else {
      await onRequestSizeChange(EXPANDED_WIDTH, EXPANDED_HEIGHT);
    }
    setIsExpanded(!isExpanded);
  }, [onRequestSizeChange, isExpanded]);

  const isFullscreen = hostContext.displayMode === 'fullscreen';

  // Inline must always show pending approvals only, even if `pendingApprovals`
  // still holds a stale non-pending fullscreen result during the brief window
  // before a forced reset-to-pending reload resolves.
  const itemsToRender = isFullscreen
    ? pendingApprovals
    : pendingApprovals.filter(approval => approval.state === 'pending');

  return (
    <IdPrefixProvider value="copilot-component-">
      <FluentProvider theme={theme} targetDocument={props.targetDocument} style={{ minHeight: '100%' }}>
        <div className={styles.root}>
          <Card className={styles.headerCard} appearance="filled-alternative" size="large">
            <CardHeader
              image={
                <Avatar
                  name={userDisplayName}
                  image={userPhotoDataUrl ? { src: userPhotoDataUrl } : undefined}
                  size={48}
                />
              }
              header={<Title1>{strings.GreetingPrefix} {userDisplayName}!</Title1>}
              description={<Body1 className={styles.headerMessage}>{message}</Body1>}
              action={
                isFullscreen ? (
                  <Button appearance="primary" size="small" icon={<ArrowMinimize24Regular />} onClick={handleCollapse}>
                    {strings.CollapseButtonLabel}
                  </Button>
                ) : (
                  <Button appearance="primary" size="small" icon={<ArrowExpand24Regular />} onClick={handleExpand}>
                    {strings.ExpandButtonLabel}
                  </Button>
                )
              }
            />
          </Card>

          <div className={styles.actions}>
            <Button appearance="secondary" icon={<Open24Regular />} onClick={handleOpenLink}>
              {strings.OpenSiteButtonLabel}
            </Button>
            <Button appearance="secondary" icon={<Chat24Regular />} onClick={handleFollowUp}>
              {strings.FollowUpButtonLabel}
            </Button>
            <Button appearance="secondary" icon={<ResizeLarge24Regular />} onClick={handleResize}>
              {isExpanded ? strings.CompactButtonLabel : strings.ResizeButtonLabel}
            </Button>
          </div>

          <div className={styles.approvalsSection}>
            <Title2>{isFullscreen ? strings.ApprovalsSectionTitle : strings.PendingApprovalsSectionTitle}</Title2>

            {isFullscreen && (
              <div className={styles.filterRow}>
                <Dropdown
                  aria-label={strings.StatusFilterLabel}
                  value={statusFilterLabel(statusFilter, strings)}
                  selectedOptions={[statusFilter]}
                  disabled={isLoadingApprovals}
                  onOptionSelect={(_event, data: OptionOnSelectData) => {
                    onStatusFilterChange((data.optionValue ?? '') as ApprovalStatusFilter);
                  }}
                >
                  <Option value="">{strings.StatusFilterAllOption}</Option>
                  <Option value="pending">{strings.StatusFilterPendingOption}</Option>
                  <Option value="completed">{strings.StatusFilterCompletedOption}</Option>
                  <Option value="canceled">{strings.StatusFilterCanceledOption}</Option>
                  <Option value="created">{strings.StatusFilterCreatedOption}</Option>
                </Dropdown>
                {isLoadingApprovals && <Spinner size="tiny" />}
              </div>
            )}

            {isLoadingApprovals ? (
              <Skeleton className={styles.approvalsList} aria-label={strings.PendingApprovalsSectionTitle}>
                {[0, 1, 2].map(index => (
                  <div key={index} className={styles.skeletonRow}>
                    <SkeletonItem shape="circle" size={40} />
                    <div className={styles.skeletonText}>
                      <SkeletonItem size={16} />
                      <SkeletonItem size={12} />
                    </div>
                  </div>
                ))}
              </Skeleton>
            ) : itemsToRender.length === 0 ? (
              <Body1 className={styles.emptyState}>
                {isFullscreen ? strings.NoApprovalsMessage : strings.NoPendingApprovalsMessage}
              </Body1>
            ) : (
              <List className={styles.approvalsList}>
                {itemsToRender.map((approval, index) => (
                  <ListItem key={approval.id}>
                    <ApprovalListItem
                      approval={approval}
                      variant={isFullscreen ? 'detailed' : 'compact'}
                      onApprove={onApprove}
                      onReject={onReject}
                      onContactRequester={onContactRequester}
                      onOpenLink={(url) => { void bridge.openLinkAsync(url); }}
                      isAlternate={index % 2 === 1}
                      strings={strings}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </div>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  );
}
