import * as React from 'react';

import { Checkbox, makeStyles, mergeClasses, tokens, Text } from '@fluentui/react-components';
import { CheckmarkCircle20Regular } from '@fluentui/react-icons';

import type { ITask } from '../../models/myDay';
import { formatTimeUntil } from '../../utils/datetime';
import DashboardCard from './DashboardCard';

const RING_SIZE = 56;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

const useStyles = makeStyles({
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '8px'
  },
  ring: {
    flexShrink: 0,
    position: 'relative',
    width: `${RING_SIZE}px`,
    height: `${RING_SIZE}px`
  },
  ringSvg: {
    transform: 'rotate(-90deg)'
  },
  ringTrack: {
    fill: 'none',
    stroke: tokens.colorNeutralStroke2,
    strokeWidth: RING_STROKE
  },
  ringValue: {
    fill: 'none',
    stroke: tokens.colorBrandStroke1,
    strokeWidth: RING_STROKE,
    strokeLinecap: 'round',
    transitionProperty: 'stroke-dashoffset',
    transitionDuration: tokens.durationNormal
  },
  ringLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200
  },
  summaryText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  summaryCount: {
    fontWeight: tokens.fontWeightSemibold
  },
  summarySub: {
    color: tokens.colorNeutralForeground3
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    width: '100%'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    minWidth: 0,
    padding: '6px 8px',
    borderRadius: tokens.borderRadiusMedium,
    boxSizing: 'border-box',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  title: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: tokens.colorNeutralForeground3
  },
  due: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap'
  },
  high: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap'
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    padding: '8px 0'
  }
});

export interface ITasksPanelProps {
  tasks: ITask[];
  now: Date;
}

/** Tasks card with a live completion ring and tickable checklist (local state). */
const TasksPanel: React.FunctionComponent<ITasksPanelProps> = ({ tasks, now }) => {
  const styles = useStyles();

  const [completedIds, setCompletedIds] = React.useState<ReadonlySet<string>>(
    () => new Set(tasks.filter((t) => t.completed).map((t) => t.id))
  );

  const toggle = (id: string): void => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => completedIds.has(t.id)).length;
  const dueToday = tasks.filter((t) => !completedIds.has(t.id) && t.due).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const dashOffset = RING_CIRC * (1 - pct / 100);

  return (
    <DashboardCard
      title="Tasks"
      icon={<CheckmarkCircle20Regular />}
      action={{ label: 'View all tasks' }}
    >
      <div className={styles.summary}>
        <div className={styles.ring}>
          <svg className={styles.ringSvg} width={RING_SIZE} height={RING_SIZE}>
            <circle className={styles.ringTrack} cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} />
            <circle
              className={styles.ringValue}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              strokeDasharray={RING_CIRC}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className={styles.ringLabel}>{pct}%</span>
        </div>
        <div className={styles.summaryText}>
          <Text className={styles.summaryCount}>
            {completed} of {total} done
          </Text>
          <Text size={200} className={styles.summarySub}>
            {dueToday} due today
          </Text>
        </div>
      </div>

      {total === 0 ? (
        <Text className={styles.empty}>You&apos;re all caught up.</Text>
      ) : (
        <div className={styles.list}>
          {tasks.map((t) => {
            const done = completedIds.has(t.id);
            return (
              <div key={t.id} className={styles.row}>
                <Checkbox
                  checked={done}
                  onChange={() => toggle(t.id)}
                  aria-label={t.title}
                />
                <Text className={mergeClasses(styles.title, done && styles.titleDone)}>
                  {t.title}
                </Text>
                {!done && t.importance === 'high' && (
                  <Text size={200} className={styles.high}>
                    High
                  </Text>
                )}
                {!done && t.due && (
                  <Text size={200} className={styles.due}>
                    {formatTimeUntil(t.due, now)}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};

export default TasksPanel;
