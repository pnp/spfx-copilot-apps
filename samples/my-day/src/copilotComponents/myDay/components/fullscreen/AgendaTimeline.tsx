import * as React from 'react';

import { Button, makeStyles, mergeClasses, tokens, Text } from '@fluentui/react-components';
import { CalendarLtr20Regular, VideoRegular } from '@fluentui/react-icons';

import type { IMeeting } from '../../models/myDay';
import { formatTime, formatTimeRange, formatTimeUntil } from '../../utils/datetime';
import DashboardCard from './DashboardCard';

type MeetingStatus = 'past' | 'current' | 'next' | 'upcoming';

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  row: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    minWidth: 0
  },
  time: {
    flexShrink: 0,
    width: '44px',
    paddingTop: '10px',
    textAlign: 'right',
    color: tokens.colorNeutralForeground3,
    fontVariantNumeric: 'tabular-nums'
  },
  rail: {
    flexShrink: 0,
    width: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  dot: {
    marginTop: '14px',
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
    boxSizing: 'border-box'
  },
  dotActive: {
    backgroundColor: tokens.colorBrandBackground,
    border: `2px solid ${tokens.colorBrandBackground}`
  },
  line: {
    flexGrow: 1,
    width: '2px',
    backgroundColor: tokens.colorNeutralStroke2
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    marginBottom: '10px',
    padding: '10px 12px',
    borderRadius: tokens.borderRadiusLarge,
    border: '1px solid transparent',
    boxSizing: 'border-box'
  },
  contentActive: {
    border: `1px solid ${tokens.colorBrandStroke2}`,
    backgroundColor: tokens.colorBrandBackground2
  },
  contentPast: {
    opacity: 0.6
  },
  subject: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '2px'
  },
  meta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: tokens.colorNeutralForeground3
  },
  badge: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  actions: {
    marginTop: '8px'
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    padding: '8px 0'
  }
});

export interface IAgendaTimelineProps {
  meetings: IMeeting[];
  now: Date;
}

/** Vertical agenda rail highlighting the current / next meeting. */
const AgendaTimeline: React.FunctionComponent<IAgendaTimelineProps> = ({ meetings, now }) => {
  const styles = useStyles();

  const sorted = React.useMemo(
    () => [...meetings].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [meetings]
  );

  const nextId = React.useMemo(
    () => sorted.find((m) => m.end.getTime() > now.getTime())?.id,
    [sorted, now]
  );

  const statusOf = (m: IMeeting): MeetingStatus => {
    if (m.end.getTime() <= now.getTime()) {
      return 'past';
    }
    if (m.start.getTime() <= now.getTime() && now.getTime() <= m.end.getTime()) {
      return 'current';
    }
    return m.id === nextId ? 'next' : 'upcoming';
  };

  return (
    <DashboardCard
      title="Agenda"
      icon={<CalendarLtr20Regular />}
      action={{ label: 'View calendar' }}
    >
      {sorted.length === 0 ? (
        <Text className={styles.empty}>No meetings today — enjoy the open calendar.</Text>
      ) : (
        <div className={styles.list}>
          {sorted.map((m, index) => {
            const status = statusOf(m);
            const active = status === 'current' || status === 'next';
            const isLast = index === sorted.length - 1;
            return (
              <div key={m.id} className={styles.row}>
                <Text size={200} className={styles.time}>
                  {formatTime(m.start)}
                </Text>
                <div className={styles.rail}>
                  <span className={mergeClasses(styles.dot, active && styles.dotActive)} />
                  {!isLast && <span className={styles.line} />}
                </div>
                <div
                  className={mergeClasses(
                    styles.content,
                    active && styles.contentActive,
                    status === 'past' && styles.contentPast
                  )}
                >
                  <Text className={styles.subject} block>
                    {m.subject}
                  </Text>
                  <div className={styles.metaRow}>
                    <Text size={200} className={styles.meta}>
                      {formatTimeRange(m.start, m.end)}
                    </Text>
                    {m.isOnline ? (
                      <Text size={200} className={styles.meta}>
                        <VideoRegular /> Online
                      </Text>
                    ) : (
                      m.location && (
                        <Text size={200} className={styles.meta}>
                          {m.location}
                        </Text>
                      )
                    )}
                    {status === 'current' && (
                      <Text size={200} className={styles.badge}>
                        Now
                      </Text>
                    )}
                    {status === 'next' && (
                      <Text size={200} className={styles.badge}>
                        Next · {formatTimeUntil(m.start, now)}
                      </Text>
                    )}
                  </div>
                  {active && m.isOnline && (
                    <div className={styles.actions}>
                      <Button appearance="primary" size="small" icon={<VideoRegular />}>
                        Join
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};

export default AgendaTimeline;
