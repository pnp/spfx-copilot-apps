import * as React from 'react';

import { Badge, makeStyles, shorthands, tokens, Text } from '@fluentui/react-components';
import { CircleRegular } from '@fluentui/react-icons';

import type { ITask } from '../../models/myDay';
import { formatTimeUntil } from '../../utils/datetime';
import InlineDetailHeader from './InlineDetailHeader';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '10px 12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'background-color, border-color, box-shadow',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow8
    }
  },
  check: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center'
  },
  body: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  title: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  due: {
    color: tokens.colorNeutralForeground3
  },
  empty: {
    padding: '16px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3
  }
});

const importanceColor = (importance: ITask['importance']): 'danger' | 'warning' | 'informative' => {
  if (importance === 'high') {
    return 'danger';
  }
  if (importance === 'normal') {
    return 'warning';
  }
  return 'informative';
};

export interface ITasksListProps {
  tasks: ITask[];
  now: Date;
  onBack: () => void;
}

/** Drill-down: open tasks ordered by importance then due date. */
const TasksList: React.FunctionComponent<ITasksListProps> = (props) => {
  const styles = useStyles();
  const { tasks, now, onBack } = props;

  const rank: Record<ITask['importance'], number> = { high: 0, normal: 1, low: 2 };
  const open = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (rank[a.importance] !== rank[b.importance]) {
        return rank[a.importance] - rank[b.importance];
      }
      const ad = a.due ? a.due.getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.due ? b.due.getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });

  return (
    <div className={styles.root}>
      <InlineDetailHeader title="Tasks" onBack={onBack} />
      {open.length === 0 ? (
        <Text className={styles.empty}>You’re all caught up. 🎉</Text>
      ) : (
        <div className={styles.list}>
          {open.map((t) => (
            <div key={t.id} className={styles.row}>
              <span className={styles.check}>
                <CircleRegular />
              </span>
              <div className={styles.body}>
                <Text size={300} className={styles.title}>
                  {t.title}
                </Text>
                <Text size={200} className={styles.due}>
                  {t.due ? `Due ${formatTimeUntil(t.due, now)}` : 'No due date'}
                </Text>
              </div>
              {t.importance !== 'low' && (
                <Badge appearance="tint" color={importanceColor(t.importance)} size="small">
                  {t.importance === 'high' ? 'High' : 'Normal'}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksList;
