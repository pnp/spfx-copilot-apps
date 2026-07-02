import * as React from 'react';

import { makeStyles, mergeClasses, tokens, Text } from '@fluentui/react-components';
import {
  CalendarLtr20Filled,
  CheckmarkCircle20Filled,
  News20Filled
} from '@fluentui/react-icons';

import type { IMyDayData } from '../../models/myDay';
import { buildDaySummary } from '../../utils/daySummary';
import { formatTimeRange, formatTimeUntil } from '../../utils/datetime';
import { fadeInUp } from '../../utils/motion';
import GreetingCard from './GreetingCard';
import SummaryTile from './SummaryTile';
import type { InlineView } from './views';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0
  },
  intro: {
    color: tokens.colorNeutralForeground2
  },
  tiles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
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
  delay4: { animationDelay: '280ms' }
});

export interface IInlineSummaryProps {
  data: IMyDayData;
  now: Date;
  onNavigate: (view: InlineView) => void;
  onRequestFullscreen?: () => void;
}

/** Inline landing view: greeting plus three navigable summary tiles. */
const InlineSummary: React.FunctionComponent<IInlineSummaryProps> = (props) => {
  const styles = useStyles();
  const { data, now, onNavigate, onRequestFullscreen } = props;

  const nextMeeting = data.meetings.filter((m) => m.end.getTime() > now.getTime())[0];
  const openTasks = data.tasks.filter((t) => !t.completed);
  const nextTask = openTasks
    .filter((t) => t.due)
    .sort((a, b) => (a.due as Date).getTime() - (b.due as Date).getTime())[0];
  const topNews = data.news[0];

  const meetingPrimary = nextMeeting ? nextMeeting.subject : 'No more meetings today';
  const meetingSecondary = nextMeeting
    ? `${formatTimeRange(nextMeeting.start, nextMeeting.end)} · ${formatTimeUntil(nextMeeting.start, now)}`
    : 'Enjoy the focus time';

  const tasksPrimary =
    openTasks.length === 0
      ? 'All caught up'
      : `${openTasks.length} task${openTasks.length === 1 ? '' : 's'} to do`;
  const tasksSecondary = nextTask ? `Next: ${nextTask.title}` : 'Nothing due today';

  return (
    <div className={styles.root}>
      <div className={mergeClasses(styles.enter, styles.delay0)}>
        <GreetingCard user={data.user} now={now} onRequestFullscreen={onRequestFullscreen} />
      </div>
      <Text size={300} className={mergeClasses(styles.intro, styles.enter, styles.delay1)}>
        {buildDaySummary(data, now)}
      </Text>

      <div className={styles.tiles}>
        <div className={mergeClasses(styles.enter, styles.delay2)}>
          <SummaryTile
            icon={<CalendarLtr20Filled />}
            accent="meeting"
            title="Next meeting"
            primary={meetingPrimary}
            secondary={meetingSecondary}
            onClick={() => onNavigate('meetings')}
          />
        </div>
        <div className={mergeClasses(styles.enter, styles.delay3)}>
          <SummaryTile
            icon={<CheckmarkCircle20Filled />}
            accent="tasks"
            title="Tasks"
            primary={tasksPrimary}
            secondary={tasksSecondary}
            onClick={() => onNavigate('tasks')}
          />
        </div>
        <div className={mergeClasses(styles.enter, styles.delay4)}>
          <SummaryTile
            icon={<News20Filled />}
            accent="news"
            title="Latest news"
            primary={topNews ? topNews.title : 'No news today'}
            secondary={topNews ? topNews.category : undefined}
            onClick={() => onNavigate('news')}
          />
        </div>
      </div>
    </div>
  );
};

export default InlineSummary;
