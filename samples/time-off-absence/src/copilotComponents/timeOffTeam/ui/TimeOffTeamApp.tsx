// React tree for the Time-Off Team Copilot Component (Component C).
//
// Mirrors the overview/request pattern: the component class owns the host bridge
// and the team data service; this tree is purely props-driven. The shell
// (RendererProvider + FluentProvider + inline theme vars) is replicated VERBATIM
// from TimeOffApp / TimeOffRequestApp so Fluent v9 styling resolves inside the
// sandboxed Copilot iframe.
//
// Two views, both driven by ITimeOffTeamDataService:
//   * "Who's out" — approved upcoming absences across the whole team (READ
//     showcase: the service read EVERYONE's rows client-side).
//   * "Pending approvals" — shown only when the signed-in user approves someone.
//     Each Approve / Decline calls the service, which flips the cache and fires a
//     background MERGE PATCH against SharePoint (the WRITE showcase). Approving an
//     upcoming request makes that person appear under "Who's out" on re-render.
//
// Approve/Decline feedback is kept in local useState; the class re-renders via
// ReactDOM.render (not remount) so this local state survives the data-service
// notification, exactly like the Cancel-confirm state in the overview list.

import * as React from 'react';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  FluentProvider,
  RendererProvider,
  createDOMRenderer,
  makeStyles,
  tokens,
  Title3,
  Body1,
  Caption1,
  Subtitle2,
  Text,
  Avatar,
  Badge,
  Button,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  type BadgeProps
} from '@fluentui/react-components';
import { FullScreenMaximizeRegular, ArrowClockwiseRegular, CalendarAddRegular } from '@fluentui/react-icons';

import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import type { ITimeOffTeamDataService } from '../data/ITimeOffTeamDataService';
import type { ITeamAbsence, IPendingApproval } from '../data/types';
import type { LeaveType } from '../../timeOffOverview/data/types';
import type { ITimeOffDataService } from '../../timeOffOverview/data/ITimeOffDataService';
import type { IConflictCheckResult } from '../../timeOffRequest/logic/conflicts';
import { resolveTheme } from '../../timeOffOverview/ui/theme';
import { themeToCssVars } from '../../timeOffOverview/ui/themeVars';
import { formatDateRange, formatDate, daysLabel } from '../../timeOffOverview/ui/format';
import { shouldShowExpand, isFullscreen } from '../../timeOffOverview/ui/display';
import { TimeOffRequestForm } from '../../timeOffRequest/ui/TimeOffRequestForm';
import { shouldShowApprovals } from '../logic/derive';
import { TeamAbsenceCalendar } from './TeamAbsenceCalendar';

const useStyles = makeStyles({
  root: {
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0
  },
  primaryAction: {
    marginRight: tokens.spacingHorizontalXS
  },
  subtle: {
    color: tokens.colorNeutralForeground3
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  rowMain: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minWidth: 0
  },
  rowText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  rowName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  rowMeta: {
    color: tokens.colorNeutralForeground3
  },
  rowSide: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  footnote: {
    color: tokens.colorNeutralForeground3
  }
});

function leaveLabel(type: LeaveType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Today as an ISO date (yyyy-mm-dd), the seed the team calendar uses to mark the
// current day and pick its initial month. Mirrors the overview app's helper.
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function leaveBadgeColor(type: LeaveType): BadgeProps['color'] {
  switch (type) {
    case 'vacation':
      return 'brand';
    case 'sick':
      return 'danger';
    case 'personal':
    default:
      return 'informative';
  }
}

interface IFeedback {
  name: string;
  decision: 'approved' | 'declined';
}

export interface ITimeOffTeamAppProps {
  dataService: ITimeOffTeamDataService;
  // The signed-in user's PERSONAL data service, used only by the embedded
  // "Request time off" form. Writes the current user's own request; distinct
  // from `dataService`, which reads/patches the whole team.
  requestDataService: ITimeOffDataService;
  hostContext: ICopilotComponentHostContext;
  onRequestFullscreen: () => void;
  // Delegated, client-side Microsoft Graph conflict check for the embedded
  // request form — the same live-calendar lookup the standalone Request
  // component uses. Never throws; returns sample data on failure.
  checkConflicts: (startIso: string, endIso: string) => Promise<IConflictCheckResult>;
  // Seed from the invoking tool: focus a single section when the user asked for
  // one ("who's out" vs "pending approvals"). Derived from props each render, so
  // a fresh tool invocation re-applies automatically.
  initialView?: 'whosOut' | 'approvals';
  propertiesVersion?: number;
  // The document the component is actually mounted in (an iframe doc in the
  // Copilot host). Both the Griffel renderer and FluentProvider must target it.
  targetDocument?: Document;
}

// Outer shell — identical wiring to TimeOffApp / TimeOffRequestApp: Griffel
// renderer + Fluent theme provider, both bound to the component's own document,
// with theme tokens also handed down as inline CSS custom properties so they
// resolve even when the host blocks Fluent's injected <style> (themeToCssVars).
export function TimeOffTeamApp(
  props: ITimeOffTeamAppProps
): React.ReactElement {
  const { hostContext, targetDocument } = props;
  const theme = useMemo(
    () => resolveTheme(hostContext.theme),
    [hostContext.theme]
  );
  const renderer = useMemo(
    () => createDOMRenderer(targetDocument),
    [targetDocument]
  );
  const themeVars = useMemo(() => themeToCssVars(theme), [theme]);

  return (
    <RendererProvider renderer={renderer} targetDocument={targetDocument}>
      <FluentProvider theme={theme} targetDocument={targetDocument}>
        <TimeOffTeamContent {...props} themeVars={themeVars} />
      </FluentProvider>
    </RendererProvider>
  );
}

interface ITimeOffTeamContentProps extends ITimeOffTeamAppProps {
  themeVars: CSSProperties;
}

function TimeOffTeamContent(
  props: ITimeOffTeamContentProps
): React.ReactElement {
  const {
    dataService,
    requestDataService,
    hostContext,
    onRequestFullscreen,
    checkConflicts,
    initialView,
    themeVars
  } = props;
  const styles = useStyles();

  // When true, the team screen is replaced wholesale by the shared request form
  // (single styled root, mirroring the overview's embed swap). On the way back
  // we refresh the TEAM service: the form writes through the PERSONAL service,
  // so the new pending row only appears once the team service re-reads.
  const [showRequest, setShowRequest] = useState(false);

  const managerName = dataService.getManagerName();
  const isManager = dataService.isManager();
  const absences = dataService.getTeamAbsences();
  const pending = dataService.getPendingApprovals();

  // Last Approve/Decline outcome, shown as a success bar. Survives the
  // data-service-triggered re-render because the class re-renders in place.
  const [feedback, setFeedback] = useState<IFeedback | undefined>(undefined);

  const fullscreen = isFullscreen(hostContext.displayMode);
  const showWhosOut = initialView !== 'approvals';
  // The approvals inbox only makes sense for an approver. A manager with requests
  // waiting must NEVER have them hidden: even when the view is narrowed to
  // "who's out" (e.g. a "who's out this week?" prompt the orchestrator maps to
  // view='whosOut'), a non-empty inbox stays visible so nothing falls through the
  // cracks — shouldShowApprovals honors the 'whosOut' focus only when the inbox is
  // empty. If a non-manager explicitly asked for approvals we still say so (below)
  // rather than silently showing nothing.
  const showApprovals = shouldShowApprovals(initialView, isManager, pending.length);
  const askedApprovalsButNotManager = initialView === 'approvals' && !isManager;

  const handleApprove = (req: IPendingApproval): void => {
    dataService.approveRequest(req.requestId);
    setFeedback({ name: req.employeeName, decision: 'approved' });
  };

  const handleDecline = (req: IPendingApproval): void => {
    dataService.declineRequest(req.requestId);
    setFeedback({ name: req.employeeName, decision: 'declined' });
  };

  // Embedded "Request time off": render the shared form as the SOLE styled root
  // (it brings its own RendererProvider/FluentProvider), exactly like the
  // overview embed. onBack refreshes the TEAM service so a just-submitted
  // request shows up on the calendar / who's-out.
  if (showRequest) {
    return (
      <TimeOffRequestForm
        dataService={requestDataService}
        hostContext={hostContext}
        checkConflicts={checkConflicts}
        onBack={() => {
          setShowRequest(false);
          dataService.refresh();
        }}
        themeVars={themeVars}
      />
    );
  }

  const today = todayIso();

  return (
    <div className={styles.root} style={themeVars}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <Title3>Team time off</Title3>
          <Body1>{managerName}</Body1>
          <Caption1 className={styles.subtle}>
            {isManager
              ? "See who's out and act on requests waiting for you."
              : "See who's out across the team."}
          </Caption1>
        </div>
        <div className={styles.headerActions}>
          <Button
            appearance="primary"
            className={styles.primaryAction}
            icon={<CalendarAddRegular />}
            onClick={() => setShowRequest(true)}
          >
            Request time off
          </Button>
          <Button
            appearance="subtle"
            icon={<ArrowClockwiseRegular />}
            onClick={() => dataService.refresh()}
            aria-label="Refresh data"
          >
            Refresh
          </Button>
          {shouldShowExpand(hostContext.displayMode) && (
            <Button
              appearance="subtle"
              icon={<FullScreenMaximizeRegular />}
              onClick={onRequestFullscreen}
              aria-label="Open full screen"
            >
              Expand
            </Button>
          )}
        </div>
      </div>

      <Divider />

      {fullscreen ? (
        <TeamAbsenceCalendar
          rows={dataService.getTeamCalendar()}
          todayIso={today}
        />
      ) : (
        showWhosOut && <WhosOutList absences={absences} styles={styles} />
      )}

      {showApprovals && (fullscreen || showWhosOut) && <Divider />}

      {showApprovals && (
        <div className={styles.section}>
          <Subtitle2>Pending approvals</Subtitle2>
          {feedback && (
            <MessageBar intent="success">
              <MessageBarBody>
                <MessageBarTitle>
                  {feedback.decision === 'approved'
                    ? 'Request approved'
                    : 'Request declined'}
                </MessageBarTitle>
                {feedback.name}&apos;s request was {feedback.decision}.
              </MessageBarBody>
            </MessageBar>
          )}
          {pending.length === 0 ? (
            <Caption1 className={styles.empty}>
              No requests waiting for you.
            </Caption1>
          ) : (
            <div className={styles.list}>
              {pending.map((req) => (
                <div key={req.requestId} className={styles.row}>
                  <div className={styles.rowMain}>
                    <Avatar
                      name={req.employeeName}
                      image={req.photoUrl ? { src: req.photoUrl } : undefined}
                      color="colorful"
                    />
                    <div className={styles.rowText}>
                      <Text className={styles.rowName}>{req.employeeName}</Text>
                      <Caption1 className={styles.rowMeta}>
                        {`${leaveLabel(req.leaveType)} \u00b7 ${formatDateRange(
                          req.startDate,
                          req.endDate
                        )} \u00b7 ${daysLabel(req.workingDays)}`}
                      </Caption1>
                      <Caption1 className={styles.rowMeta}>
                        {`Submitted ${formatDate(req.submittedOn)}${
                          req.note ? ` \u00b7 ${req.note}` : ''
                        }`}
                      </Caption1>
                    </div>
                  </div>
                  <div className={styles.rowSide}>
                    <Button
                      size="small"
                      appearance="primary"
                      onClick={() => handleApprove(req)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      appearance="outline"
                      onClick={() => handleDecline(req)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {askedApprovalsButNotManager && (
        <Caption1 className={styles.empty}>
          You don&apos;t have any requests to approve.
        </Caption1>
      )}

      {dataService.usingFallback && (
        <Caption1 className={styles.footnote}>
          Showing sample team data {'\u2014'} live SharePoint data is not
          available here.
        </Caption1>
      )}
    </div>
  );
}

interface IWhosOutListProps {
  absences: readonly ITeamAbsence[];
  styles: Record<string, string>;
}

function WhosOutList(props: IWhosOutListProps): React.ReactElement {
  const { absences, styles } = props;
  return (
    <div className={styles.section}>
      <Subtitle2>Who&apos;s out</Subtitle2>
      {absences.length === 0 ? (
        <Caption1 className={styles.empty}>
          Nobody on the team is out right now.
        </Caption1>
      ) : (
        <div className={styles.list}>
          {absences.map((a) => (
            <div key={a.requestId} className={styles.row}>
              <div className={styles.rowMain}>
                <Avatar
                  name={a.employeeName}
                  image={a.photoUrl ? { src: a.photoUrl } : undefined}
                  color="colorful"
                />
                <div className={styles.rowText}>
                  <Text className={styles.rowName}>{a.employeeName}</Text>
                  <Caption1 className={styles.rowMeta}>
                    {`${formatDateRange(a.startDate, a.endDate)} \u00b7 ${daysLabel(
                      a.workingDays
                    )}`}
                  </Caption1>
                </div>
              </div>
              <div className={styles.rowSide}>
                <Badge appearance="filled" color={leaveBadgeColor(a.leaveType)}>
                  {leaveLabel(a.leaveType)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
