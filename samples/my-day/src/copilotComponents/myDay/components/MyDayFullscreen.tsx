import * as React from 'react';

import { makeStyles, mergeClasses, tokens, Text } from '@fluentui/react-components';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';
import type { IUser } from '../models/myDay';
import { MockMyDayDataService } from '../services/MockMyDayDataService';
import { fadeInUp } from '../utils/motion';
import { useMyDaySettings, type PanelId } from '../utils/settings';
import AgendaTimeline from './fullscreen/AgendaTimeline';
import FullscreenHero from './fullscreen/FullscreenHero';
import ImportantMail from './fullscreen/ImportantMail';
import NewsWall from './fullscreen/NewsWall';
import PlanMyDayPanel from './fullscreen/PlanMyDayPanel';
import PlanYourDayBanner from './fullscreen/PlanYourDayBanner';
import QuickActionsPanel from './fullscreen/QuickActionsPanel';
import SettingsPanel from './fullscreen/SettingsPanel';
import TasksPanel from './fullscreen/TasksPanel';

/**
 * Props for the {@link MyDayFullscreen} view rendered when the host display mode
 * is `'fullscreen'`.
 */
export interface IMyDayFullscreenProps extends IMyDayCopilotComponentProperties {
  /** Signed-in user resolved from the SPFx page context. */
  currentUser?: IUser;
  /** Color theme advertised by the Copilot host. */
  theme?: SPCopilotTheme;
}

type OpenPanel = 'none' | 'plan' | 'settings';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    width: '100%',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilyBase,
    backgroundColor: tokens.colorNeutralBackground2
  },
  main: {
    flexGrow: 1,
    minWidth: 0,
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    boxSizing: 'border-box',
    padding: '24px',
    // Use more of the canvas on large / projector displays instead of leaving
    // wide empty margins pinned at 1280px.
    '@media (min-width: 1728px)': {
      maxWidth: '1440px'
    },
    '@media (min-width: 2160px)': {
      maxWidth: '1680px'
    }
  },
  grid: {
    display: 'grid',
    // Auto-fit tracks so the dashboard re-flows to the number of visible
    // columns and to the available width (3 → 2 → 1) without fixed breakpoints.
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    alignItems: 'start',
    width: '100%'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0
  },
  enter: {
    animationName: fadeInUp,
    animationDuration: tokens.durationSlow,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
      animationDuration: '1ms',
      animationDelay: '0ms'
    }
  },
  delay0: { animationDelay: '0ms' },
  delay1: { animationDelay: '70ms' },
  delay2: { animationDelay: '140ms' },
  delay3: { animationDelay: '210ms' },
  delay4: { animationDelay: '280ms' },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    paddingTop: '4px',
    color: tokens.colorNeutralForeground3,
    textAlign: 'center'
  },
  footerDot: {
    color: tokens.colorNeutralForeground4
  },
  footerLink: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: 0,
    color: tokens.colorBrandForegroundLink,
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    textDecorationLine: 'none',
    ':hover': {
      textDecorationLine: 'underline'
    }
  }
});

/** Single shared mock data service instance for the fullscreen view. */
const dataService = new MockMyDayDataService();

/**
 * Fullscreen display-mode view: a responsive dashboard with the time-aware hero,
 * a "Plan my day" briefing, and the agenda / tasks / mail / news / quick-action
 * panels. Owns the right-drawer state (Plan my day and Settings are mutually
 * exclusive). Theme is inherited from the surrounding provider.
 */
const MyDayFullscreen: React.FunctionComponent<IMyDayFullscreenProps> = (props) => {
  const styles = useStyles();
  const { currentUser } = props;

  const [openPanel, setOpenPanel] = React.useState<OpenPanel>('none');
  const [settings, updateSettings] = useMyDaySettings();

  // Resolve the mock data once per mount against the current clock so relative
  // times stay live and future-biased.
  const now = React.useMemo(() => new Date(), []);
  const data = React.useMemo(() => {
    const myDay = dataService.getMyDay(now);
    return currentUser ? { ...myDay, user: currentUser } : myDay;
  }, [now, currentUser]);

  const isPanelVisible = (id: PanelId): boolean =>
    settings.visiblePanels.indexOf(id) !== -1;

  // Static per-position delay classes for the staggered entrance (avoids inline
  // styles); indexed by the block's position in the cascade.
  const delayClasses = [styles.delay0, styles.delay1, styles.delay2, styles.delay3, styles.delay4];
  const enterAt = (index: number): string =>
    mergeClasses(styles.enter, delayClasses[Math.min(index, delayClasses.length - 1)]);

  // Group the visible panels into their columns and drop empty columns so the
  // auto-fit grid re-flows to the number of visible columns.
  const columns: React.ReactNode[] = [];

  if (isPanelVisible('agenda')) {
    columns.push(
      <div key="agenda" className={mergeClasses(styles.column, enterAt(2 + columns.length))}>
        <AgendaTimeline meetings={data.meetings} now={now} />
      </div>
    );
  }

  const middleColumn: React.ReactNode[] = [];
  if (isPanelVisible('tasks')) {
    middleColumn.push(<TasksPanel key="tasks" tasks={data.tasks} now={now} />);
  }
  if (isPanelVisible('mail')) {
    middleColumn.push(<ImportantMail key="mail" mail={data.mail} now={now} />);
  }
  if (middleColumn.length > 0) {
    columns.push(
      <div key="middle" className={mergeClasses(styles.column, enterAt(2 + columns.length))}>
        {middleColumn}
      </div>
    );
  }

  const rightColumn: React.ReactNode[] = [];
  if (isPanelVisible('news')) {
    rightColumn.push(<NewsWall key="news" news={data.news} now={now} />);
  }
  if (isPanelVisible('quickActions') && data.quickActions && data.quickActions.length > 0) {
    rightColumn.push(<QuickActionsPanel key="quickActions" actions={data.quickActions} />);
  }
  if (rightColumn.length > 0) {
    columns.push(
      <div key="right" className={mergeClasses(styles.column, enterAt(2 + columns.length))}>
        {rightColumn}
      </div>
    );
  }

  return (
    <div className={styles.root} data-display-mode="fullscreen">
      <div className={styles.main}>
        <div className={styles.content}>
          <div className={enterAt(0)}>
            <FullscreenHero
              user={data.user}
              weather={data.weather}
              now={now}
              useFahrenheit={settings.useFahrenheit}
              onOpenSettings={() => setOpenPanel('settings')}
            />
          </div>

          {isPanelVisible('planMyDay') && (
            <div className={enterAt(1)}>
              <PlanYourDayBanner data={data} now={now} onPlan={() => setOpenPanel('plan')} />
            </div>
          )}

          {columns.length > 0 && <div className={styles.grid}>{columns}</div>}

          <div className={styles.footer}>
            <Text size={200}>AI-generated data for the scenario demo</Text>
            <span className={styles.footerDot}>·</span>
            <Text size={200}>Data structures aligned with Microsoft Graph</Text>
            <span className={styles.footerDot}>·</span>
            <a
              className={styles.footerLink}
              href="https://aka.ms/spfx/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Give feedback
            </a>
          </div>
        </div>
      </div>

      {openPanel === 'plan' && (
        <PlanMyDayPanel data={data} now={now} onDismiss={() => setOpenPanel('none')} />
      )}
      {openPanel === 'settings' && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onDismiss={() => setOpenPanel('none')}
        />
      )}
    </div>
  );
};

export default MyDayFullscreen;
