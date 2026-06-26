import * as React from 'react';

import { makeStyles, tokens, Text } from '@fluentui/react-components';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';
import type { IUser } from '../models/myDay';
import { MockMyDayDataService } from '../services/MockMyDayDataService';
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
    padding: '24px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '20px',
    alignItems: 'start',
    width: '100%',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
    },
    '@media (max-width: 720px)': {
      gridTemplateColumns: 'minmax(0, 1fr)'
    }
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0
  },
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

  // Resolve the mock data once per mount against the current clock so relative
  // times stay live and future-biased.
  const now = React.useMemo(() => new Date(), []);
  const data = React.useMemo(() => {
    const myDay = dataService.getMyDay(now);
    return currentUser ? { ...myDay, user: currentUser } : myDay;
  }, [now, currentUser]);

  return (
    <div className={styles.root} data-display-mode="fullscreen">
      <div className={styles.main}>
        <div className={styles.content}>
          <FullscreenHero
            user={data.user}
            weather={data.weather}
            now={now}
            onOpenSettings={() => setOpenPanel('settings')}
          />

          <PlanYourDayBanner data={data} now={now} onPlan={() => setOpenPanel('plan')} />

          <div className={styles.grid}>
            <div className={styles.column}>
              <AgendaTimeline meetings={data.meetings} now={now} />
            </div>
            <div className={styles.column}>
              <TasksPanel tasks={data.tasks} now={now} />
              <ImportantMail mail={data.mail} now={now} />
            </div>
            <div className={styles.column}>
              <NewsWall news={data.news} now={now} />
              {data.quickActions && data.quickActions.length > 0 && (
                <QuickActionsPanel actions={data.quickActions} />
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <Text size={200}>AI-generated content may be incorrect.</Text>
            <span className={styles.footerDot}>·</span>
            <Text size={200}>Powered by Microsoft Graph</Text>
            <span className={styles.footerDot}>·</span>
            <button type="button" className={styles.footerLink}>
              Give feedback
            </button>
          </div>
        </div>
      </div>

      {openPanel === 'plan' && (
        <PlanMyDayPanel data={data} now={now} onDismiss={() => setOpenPanel('none')} />
      )}
      {openPanel === 'settings' && <SettingsPanel onDismiss={() => setOpenPanel('none')} />}
    </div>
  );
};

export default MyDayFullscreen;
