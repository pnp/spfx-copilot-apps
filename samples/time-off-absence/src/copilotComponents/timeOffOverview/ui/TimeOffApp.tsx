// React tree for the Time-Off Overview Copilot Component.
//
// Mirrors the EmployeeOnboarding pattern: the component class owns the host
// bridge and the data service; this tree is purely props-driven. All data comes
// through ITimeOffDataService — mutators (Cancel) call into the service, the
// service fires its subscribers, the component class re-renders, and this tree
// picks up fresh snapshots on the next pass.
//
// This is the first Fluent v9 component in the repo: the whole tree is wrapped
// in a FluentProvider themed from the live host theme signal, so it re-themes
// automatically when the user flips Copilot between light and dark.

import * as React from 'react';
import {
  FluentProvider,
  RendererProvider,
  createDOMRenderer,
  makeStyles,
  tokens,
  Title3,
  Body1,
  Caption1,
  Button,
  Divider
} from '@fluentui/react-components';
import { FullScreenMaximizeRegular, CalendarAddRegular, ArrowClockwiseRegular } from '@fluentui/react-icons';

import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import type { ITimeOffDataService } from '../data/ITimeOffDataService';
import type { LeaveType } from '../data/types';
import { resolveTheme } from './theme';
import { themeToCssVars } from './themeVars';
import { profileSubtitle } from './format';
import { shouldShowExpand, isFullscreen } from './display';
import { BalanceTiles } from './BalanceTiles';
import { RequestsList } from './RequestsList';
import { OffWorkCalendar } from './OffWorkCalendar';
import { TimeOffRequestForm } from '../../timeOffRequest/ui/TimeOffRequestForm';
import type { IConflictCheckResult } from '../../timeOffRequest/logic/conflicts';

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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0
  },
  primaryAction: {
    marginRight: tokens.spacingHorizontalXS
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  subtle: {
    color: tokens.colorNeutralForeground3
  },
  // Fullscreen-only body: lists shrink to 1/3 on the left, the multi-month
  // off-work calendar fills the remaining 2/3 on the right. Inline mode never
  // mounts this wrapper.
  splitBody: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXL
  },
  listColumn: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '33.333%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  calendarColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0
  }
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ITimeOffAppProps {
  dataService: ITimeOffDataService;
  hostContext: ICopilotComponentHostContext;
  onRequestFullscreen: () => void;
  // Delegated, client-side Microsoft Graph conflict check owned by the component
  // class. Handed straight to the embedded request form so the inline "Request
  // time off" path reuses the same live-calendar showcase as Component B. Never
  // rejects: it falls back to sample data and tags the source.
  checkConflicts: (
    startIso: string,
    endIso: string
  ) => Promise<IConflictCheckResult>;
  // Seed from the invoking tool: when the user asked about a specific leave
  // type, highlight that balance tile. Re-applied whenever propertiesVersion
  // bumps (host re-invoked the tool while the tree was still mounted).
  initialHighlight?: LeaveType;
  propertiesVersion?: number;
  // The document the component is actually mounted in (domElement.ownerDocument).
  // In the SPFx Copilot host this is an iframe document, not the top window.
  // Both the Griffel renderer and FluentProvider must target it so the injected
  // <style> tags land in the same document as the component's DOM.
  targetDocument?: Document;
}

// Outer shell: wires up the Griffel renderer and the Fluent theme provider, both
// bound to the component's OWN document (the iframe doc in the Copilot host).
// The styled body lives in TimeOffContent on purpose — useStyles() must execute
// UNDER the RendererProvider to resolve the document-scoped renderer, so the
// shell itself stays style-free.
//
// Theme tokens are delivered TWICE on purpose: FluentProvider still injects them
// the normal way (for hosts where that works and for components that read theme
// from context), AND we hand the same tokens to TimeOffContent as inline CSS
// custom properties so they resolve even when the host blocks Fluent's injected
// <style> (see themeToCssVars in ./themeVars).
export function TimeOffApp(props: ITimeOffAppProps): React.ReactElement {
  const { hostContext, targetDocument } = props;
  const theme = React.useMemo(
    () => resolveTheme(hostContext.theme),
    [hostContext.theme]
  );
  const renderer = React.useMemo(
    () => createDOMRenderer(targetDocument),
    [targetDocument]
  );
  const themeVars = React.useMemo(() => themeToCssVars(theme), [theme]);

  return (
    <RendererProvider renderer={renderer} targetDocument={targetDocument}>
      <FluentProvider theme={theme} targetDocument={targetDocument}>
        <TimeOffContent {...props} themeVars={themeVars} />
      </FluentProvider>
    </RendererProvider>
  );
}

interface ITimeOffContentProps extends ITimeOffAppProps {
  // Theme tokens as inline CSS custom properties, applied on the content root so
  // every descendant's var(--token) resolves regardless of the host's behaviour.
  themeVars: React.CSSProperties;
}

function TimeOffContent(props: ITimeOffContentProps): React.ReactElement {
  const {
    dataService,
    hostContext,
    onRequestFullscreen,
    checkConflicts,
    initialHighlight,
    themeVars
  } = props;
  const styles = useStyles();

  // When true, the overview body is swapped out for the embedded request form.
  // This is a single-root full swap (not an overlay) so the form is the sole
  // styled subtree under FluentProvider and inherits themeVars cleanly — the
  // same constraint that keeps Fluent v9 styling resolving in the Copilot
  // iframe. The three components stay separate for Copilot tool routing; this is
  // purely an in-component shortcut. Local state survives data-service
  // re-renders because the class reconciles via ReactDOM.render (no remount).
  const [showRequest, setShowRequest] = React.useState<boolean>(false);

  const profile = dataService.getProfile();

  if (showRequest) {
    return (
      <TimeOffRequestForm
        dataService={dataService}
        hostContext={hostContext}
        checkConflicts={checkConflicts}
        onBack={() => setShowRequest(false)}
        themeVars={themeVars}
      />
    );
  }

  const balances = dataService.getBalances();
  const upcoming = dataService.getUpcomingRequests();
  const recent = dataService.getRecentRequests();
  const today = todayIso();
  const fullscreen = isFullscreen(hostContext.displayMode);

  const handleCancel = (id: string): void => {
    dataService.cancelRequest(id);
  };

  // The two history lists render identically in both layouts; build them once and
  // place them either stacked (inline) or in the left 1/3 column (fullscreen).
  const lists = (
    <>
      <RequestsList
        title="Upcoming"
        requests={upcoming}
        todayIso={today}
        emptyText="No upcoming time off booked."
        onCancel={handleCancel}
      />

      <RequestsList
        title="Recent history"
        requests={recent}
        todayIso={today}
        emptyText="No recent time off."
        onCancel={handleCancel}
      />
    </>
  );

  return (
    <div className={styles.root} style={themeVars}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <Title3>My time off</Title3>
          <Body1>{profile.displayName}</Body1>
          {profileSubtitle(profile) ? (
            <Caption1 className={styles.subtle}>
              {profileSubtitle(profile)}
            </Caption1>
          ) : null}
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

      <BalanceTiles balances={balances} highlight={initialHighlight} />

      <Divider />

      {fullscreen ? (
        <div className={styles.splitBody}>
          <div className={styles.listColumn}>{lists}</div>
          <div className={styles.calendarColumn}>
            <OffWorkCalendar
              requests={dataService.getRequests()}
              todayIso={today}
            />
          </div>
        </div>
      ) : (
        lists
      )}
    </div>
  );
}
