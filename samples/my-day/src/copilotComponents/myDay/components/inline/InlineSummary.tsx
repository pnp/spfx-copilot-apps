import * as React from 'react';

import { makeStyles, tokens, Text } from '@fluentui/react-components';
import {
  CalendarLtr20Filled,
  CheckmarkCircle20Filled,
  News20Filled
} from '@fluentui/react-icons';

import type { IMyDayData } from '../../models/myDay';
import { formatTimeRange, formatTimeUntil } from '../../utils/datetime';
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
  }
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
      <GreetingCard user={data.user} now={now} onRequestFullscreen={onRequestFullscreen} />
      <Text size={300} className={styles.intro}>
        Here’s your personalized summary for today.
      </Text>

      <div className={styles.tiles}>
        <SummaryTile
          icon={<CalendarLtr20Filled />}
          accent="meeting"
          title="Next meeting"
          primary={meetingPrimary}
          secondary={meetingSecondary}
          onClick={() => onNavigate('meetings')}
        />
        <SummaryTile
          icon={<CheckmarkCircle20Filled />}
          accent="tasks"
          title="Tasks"
          primary={tasksPrimary}
          secondary={tasksSecondary}
          onClick={() => onNavigate('tasks')}
        />
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
  );
};

export default InlineSummary;
